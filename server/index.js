import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit'; // Rate limiting to protect API credits
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Startup Assertions ───────────────────────────────────────────────────────
// Fail fast: crash at boot rather than serving broken requests at runtime.
if (!process.env.GEMINI_API_KEY) {
    console.error('[FATAL] GEMINI_API_KEY is not set. Set it in your .env file or deployment secrets.');
    process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGIN) {
    console.warn('[WARN] ALLOWED_ORIGIN is not set in production. CORS will block all cross-origin requests.');
}

const app = express();
app.use(compression());

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// Protect your Gemini API credits from bot spam or accidental infinite loops.

// 1. General Limiter: Prevent basic DDoS/scraping on all endpoints.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,               // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in 15 minutes." }
});

// 2. Expensive Limiter: Higher friction for LLM generation (costs real money).
const expensiveLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5,                // Limit each IP to 5 script generations per 10 mins
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Generation limit reached. Script generation is expensive; please wait 10 minutes before creating more." }
});

// CORS must come before generalLimiter so OPTIONS preflight requests
// are not counted against the IP rate-limit quota.
// In production, ALLOWED_ORIGIN must be set; falls back to localhost:3000 in dev only.
const allowedOrigin = process.env.ALLOWED_ORIGIN ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined);
app.use(cors({ origin: allowedOrigin }));
app.use(generalLimiter);
app.use(express.json({ limit: '16kb' })); // Prevent oversized payloads

// Health check — used for uptime monitoring (no credentials required)
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Applied to expensive endpoints below
app.post('/api/generate', expensiveLimiter);
app.post('/api/improve', expensiveLimiter);
app.post('/api/critique', expensiveLimiter);    // Calls Gemini on every request
app.post('/api/analyze-url', expensiveLimiter); // Calls Gemini + YouTube transcript API

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── Safe Error Helper ─────────────────────────────────────────────────────────
// Prevents internal error details (stack traces, file paths) from leaking to
// the client on unhandled 500s. 4xx and rate-limit errors pass through as-is
// since they carry meaningful user-facing messages.
function safeError(error, fallback = "Internal server error. Please try again.") {
    const status = error?.status || 0;
    // Pass through client errors and known operational errors
    if (status >= 400 && status < 500) return error.message || fallback;
    if (status === 429) return error.message || "API overload. Please wait a moment.";
    // For true server errors, return a generic message (don't leak internals)
    return error.message?.startsWith('Validation failed') ? error.message : fallback;
}

// ─── Input Sanitization ────────────────────────────────────────────────────────
// Strips prompt injection attempts before injecting user content into prompts.
const MAX_INPUT_LENGTH = 500;
const MAX_SCRIPT_LENGTH = 10000; // Scripts are much longer than short user inputs

function sanitizeInput(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .slice(0, MAX_INPUT_LENGTH)               // Hard length cap
        .replace(/[<>]/g, '')                      // Strip HTML tags
        .replace(/```[\s\S]*?```/g, '')            // Remove code blocks
        .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // S3 FIX: Strip Unicode Bidi Controls
        .replace(/\bignore\b.{0,80}\bprevious\b/gi, '[FILTERED]')  // Prompt injection
        .replace(/\bsystem\s*prompt\b/gi, '[FILTERED]')
        .replace(/\bpretend\b.{0,60}\byou are\b/gi, '[FILTERED]')
        .replace(/\bforget\b.{0,60}\binstructions\b/gi, '[FILTERED]')
        .trim();
}

// For longer structured inputs like full scripts and critique text.
// Applies the same injection guards but with a higher character cap.
function sanitizeScriptInput(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .slice(0, MAX_SCRIPT_LENGTH)
        .replace(/[<>]/g, '')
        .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // S3 FIX: Strip Unicode Bidi Controls
        .replace(/\bignore\b.{0,80}\bprevious\b/gi, '[FILTERED]')
        .replace(/\bsystem\s*prompt\b/gi, '[FILTERED]')
        .replace(/\bpretend\b.{0,60}\byou are\b/gi, '[FILTERED]')
        .replace(/\bforget\b.{0,60}\binstructions\b/gi, '[FILTERED]')
        .trim();
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
// S4 FIX: Store cache in system temp directory instead of the app's working directory
const CACHE_FILE = path.join(os.tmpdir(), '.shortstrend_cache.json');

// ─── In-Memory Trend Cache ────────────────────────────────────────────────────
// Loaded from disk once at startup; written back asynchronously (fire-and-forget)
// so cache reads/writes never block the Node.js event loop.
let memoryCache = {};

(async () => {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = await fs.promises.readFile(CACHE_FILE, 'utf8');
            memoryCache = JSON.parse(data);
            console.log('[Cache] Trend cache loaded from disk.');
        }
    } catch (e) {
        console.error('[Cache] Failed to load trend cache from disk:', e.message);
        memoryCache = {};
    }
})();

async function saveDiskCacheAsync() {
    try {
        await fs.promises.writeFile(CACHE_FILE, JSON.stringify(memoryCache, null, 2));
    } catch (e) {
        console.error('[Cache] Failed to write trend cache to disk:', e.message);
    }
}

function getCachedAnalysis(key) {
    const entry = memoryCache[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        delete memoryCache[key];
        saveDiskCacheAsync(); // fire-and-forget
        return null;
    }
    return entry.data;
}

function setCachedAnalysis(key, data) {
    memoryCache[key] = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    saveDiskCacheAsync(); // fire-and-forget
}

// ─── Multi-Model Fallback Strategy ────────────────────────────────────────────
// If the primary model is rate-limited or unavailable, automatically fallback
// through the cascade until a model succeeds.
const MODEL_CASCADE = [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite', // Fallback: stable Gemini 2.5 Flash-Lite
];

// Retryable HTTP status codes
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

async function generateWithFallback(requestConfig) {
    let lastError = null;

    for (const model of MODEL_CASCADE) {
        try {
            console.log(`[Model] Trying ${model}...`);
            const response = await ai.models.generateContent({ ...requestConfig, model });
            console.log(`[Model] Success with ${model}`);
            return response;
        } catch (err) {
            const status = err?.status ?? err?.code ?? 0;
            if (RETRYABLE_CODES.has(status)) {
                console.warn(`[Model] ${model} failed (${status}). Trying next model...`);
                lastError = err;
                continue;
            }
            // Non-retryable error — propagate immediately
            throw err;
        }
    }

    // All models exhausted
    console.error('[Model] All models in cascade failed.');
    if (lastError && (lastError.status === 429 || lastError.code === 429)) {
        throw { status: 429, message: "API overload. Please wait a minute, the Google model is busy." };
    }
    throw lastError ?? new Error('All cascade models failed. Please try again shortly.');
}

// ─── Auto-Split Sync: Break Multi-Beat Segments ──────────────────────────────
// When the AI generates a segment like "The door opens, revealing a hallway, and
// something moves", this splits it into 3 sub-segments at punctuation boundaries.
// Each sub-segment gets a cutType tag for downstream editing tools.

const WORDS_PER_SECOND = 2.7;
// Hard cap on post-split segments to prevent runaway expansion from bloating responses.
const MAX_AUTO_SPLIT_SEGMENTS = 120;

function getCutType(fragment) {
    const trimmed = fragment.trim();
    const lastChar = trimmed.slice(-1);
    const cutTypes = {
        '.': 'hard_cut',
        '!': 'impact',
        '?': 'zoom_shift',
        ',': 'soft_transition',
        ';': 'soft_transition',
    };
    if (trimmed.endsWith('...') || trimmed.endsWith('…')) return 'hold_zoom';
    if (trimmed.endsWith('—') || trimmed.endsWith('–')) return 'smash_cut';
    return cutTypes[lastChar] || 'hard_cut';
}

function splitSegmentAtBeats(segment) {
    const script = (segment.script || '').trim();
    if (!script) return [segment];

    // Split at sentence-ending / clause-ending punctuation, keeping the punctuation
    const fragments = script
        .split(/(?<=[.!?…,;—–])\s+/)
        .filter(f => f.trim().length > 0);

    const segDuration = (segment.endTime || 0) - (segment.startTime || 0);
    const depth = segment._splitDepth || 0;

    // Aggressive Split: If a segment is >2.5s, force a split even if no punctuation.
    // If it has punctuation, use it. Otherwise, force a cut at the halfway mark.
    // Cap recursion depth to prevent infinite loops.
    if (fragments.length <= 1) {
        if (segDuration > 2.5 && depth < 3) {
            const midpoint = Math.floor(script.length / 2);
            const firstHalf = script.slice(0, midpoint);
            const secondHalf = script.slice(midpoint);
            // Re-run with artificial fragments
            return splitSegmentAtBeats({ 
                ...segment, 
                script: `${firstHalf}... ${secondHalf}`,
                _splitDepth: depth + 1
            });
        }
        return [{ ...segment, cutType: getCutType(script) }];
    }
    
    // Don't split if already atomic (handled above) or the segment is too short to be worth it
    if (segDuration < 1.2) {
        return [{ ...segment, cutType: getCutType(script) }];
    }

    // Calculate total word count for proportional timing
    const totalWords = fragments.reduce((sum, f) => sum + f.trim().split(/\s+/).length, 0);
    if (totalWords === 0) return [{ ...segment, cutType: getCutType(script) }];

    const subSegments = [];
    let currentTime = segment.startTime;

    for (let fi = 0; fi < fragments.length; fi++) {
        const frag = fragments[fi].trim();
        const wordCount = frag.split(/\s+/).length;
        // Proportional duration based on word count share of the segment
        const proportion = wordCount / totalWords;
        const duration = Math.max(1, Number((segDuration * proportion).toFixed(2)));
        const endTime = fi < fragments.length - 1
            ? Number((currentTime + duration).toFixed(2))
            : segment.endTime; // Last fragment absorbs any rounding remainder

        const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = Math.floor(secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        // Build visual prompt: for the first fragment, keep the original visual.
        // For subsequent fragments, append a camera instruction based on cutType.
        let visual = segment.visual || '';
        const cutType = getCutType(frag);
        if (fi > 0) {
            const angleHints = {
                'soft_transition': ', different camera angle, same scene',
                'hard_cut': ', new dramatic composition',
                'impact': ', extreme close-up, flash lighting',
                'zoom_shift': ', push-in perspective shift',
                'hold_zoom': ', slow zoom, lingering atmospheric shot',
                'smash_cut': ', abrupt contrasting angle'
            };
            visual = visual.replace(/\s*--ar 9:16\s*$/, '') + (angleHints[cutType] || '') + ' --ar 9:16';
        }

        subSegments.push({
            script: frag,
            visual,
            startTime: currentTime,
            endTime: endTime,
            timestamp: formatTime(currentTime),
            cutType,
            ...(segment.motion ? { motion: segment.motion } : {}),
            ...(segment.animation ? { animation: segment.animation } : {})
        });

        currentTime = endTime;
    }

    return subSegments;
}


app.post('/api/critique', async (req, res) => {
    try {
        const script = sanitizeScriptInput(req.body.script);
        const hook = sanitizeInput(req.body.hook);
        if (!script) return res.status(400).json({ error: 'Script is required.' });

        // Custom Character: sanitize and build optional roast-voice injection block
        let characterBlock = '';
        if (req.body.character && req.body.character.name) {
            const charName = sanitizeInput(req.body.character.name);
            const charDesc = sanitizeScriptInput(req.body.character.description || '');
            if (charName && charDesc) {
                characterBlock = `

ROAST VOICE REQUIREMENT (MANDATORY):
Deliver this ENTIRE critique as if you ARE the character "${charName}".
Character Personality/Tone: ${charDesc}
- Maintain this character's voice, energy, and personality throughout ALL feedback sections.
- The retention leaks, overall feedback, AND all 3 hook suggestions must be written entirely in ${charName}'s voice and phrasing style.
- The 3 hook suggestions must sound like something ${charName} would personally say — not generic advice.
- Be punchy, retention-focused, and entertaining — exactly as this character would be.`;
            }
        }

        const response = await generateWithFallback({
            contents: `Analyze this YouTube Shorts script and hook for virality.
      
      Hook: "${hook}"
      Script: "${script}"
${characterBlock}

      Provide a deep critique focusing on:
      1. Retention Leaks: Identify specific timestamps (0-60 seconds) where the audience might get bored or scroll away.
      2. Virality Score: Rate the potential virality from 0 to 100 based on current trends and psychology.
      3. Hook Suggestions: Suggest 3 specific, punchier alternatives to the current hook.
      4. Overall Feedback: General advice to improve the script's performance.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        retentionLeaks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.NUMBER, description: "Seconds into the video (0-60)" },
                                    issue: { type: Type.STRING, description: "Why the audience might leave at this point" }
                                },
                                required: ["timestamp", "issue"]
                            },
                            description: "Specific points in time that are boring or slow"
                        },
                        viralityScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
                        hookSuggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "3 punchier hook alternatives"
                        },
                        overallFeedback: { type: Type.STRING },
                    },
                    required: ["retentionLeaks", "viralityScore", "hookSuggestions", "overallFeedback"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        let critiqueData;
        try { critiqueData = JSON.parse(response.text); }
        catch { throw new Error("Gemini returned malformed JSON. Please try again."); }
        res.json(critiqueData);
    } catch (error) {
        console.error("Critique error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});


app.post('/api/analyze', async (req, res) => {
    try {
        const niche = sanitizeInput(req.body.niche);
        const bypassCache = req.body.bypassCache === true;
        const cacheKey = niche ? niche.toLowerCase() : '__general__';

        // Serve from cache if available and not explicitly bypassed
        if (!bypassCache) {
            const cached = getCachedAnalysis(cacheKey);
            if (cached) {
                console.log(`[Cache HIT] /api/analyze for: "${cacheKey}"`);
                return res.json({ ...cached, _cached: true });
            }
        }

        console.log(`[Cache MISS] /api/analyze for: "${cacheKey}" (bypassCache: ${bypassCache})`);
        const prompt = niche
            ? `Search for and analyze the current top YouTube Shorts trends specifically within the niche: "${niche}". Focus on trending topics, viral formats, hooks, structures, music, and hashtags relevant to this niche. For each topic, strictly define the competition level, precise target audience, and provide a single robust example video idea.`
            : "Search for and analyze the current top YouTube Shorts trends for this week. Focus on trending topics, viral formats, hooks, structures, music, and hashtags. For each topic, strictly define the competition level, precise target audience, and provide a single robust example video idea.";

        const response = await generateWithFallback({
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trendingTopics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    velocity: { type: Type.NUMBER, description: "Trend velocity score from 0 to 100" },
                                    growth: { type: Type.STRING, enum: ["exploding", "steady", "declining"] },
                                    competition: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "Current market saturation" },
                                    targetAudience: { type: Type.STRING, description: "Specific demographic (e.g. Gen Z Gamers, Tech Workers)" },
                                    exampleIdea: { type: Type.STRING, description: "One-sentence high-impact video concept" }
                                },
                                required: ["name", "velocity", "growth", "competition", "targetAudience", "exampleIdea"]
                            }
                        },
                        viralFormats: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        videoStructures: { type: Type.ARRAY, items: { type: Type.STRING } },
                        popularMusic: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hashtagPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nicheDNA: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    subject: { type: Type.STRING, description: "Characteristic name (e.g., Humor, Educational, Aesthetic, Fast-paced, Story-driven)" },
                                    value: { type: Type.NUMBER, description: "Score from 0 to 100" }
                                },
                                required: ["subject", "value"]
                            },
                            description: "5-6 characteristics that define the 'vibe' of this trend/niche"
                        }
                    },
                    required: ["trendingTopics", "viralFormats", "hooks", "videoStructures", "popularMusic", "hashtagPatterns", "nicheDNA"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        let result;
        try { result = JSON.parse(response.text); }
        catch { throw new Error("Gemini returned malformed JSON. Please try again."); }
        setCachedAnalysis(cacheKey, result);
        // Ensure returning after response to prevent double-sends in complex flows
        return res.json(result);
    } catch (error) {
        console.error("Analyze error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});

app.post('/api/analyze-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required.' });

        // Extract video ID from URL
        let videoId;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/')[2];
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
        } catch (e) { /* ignore invalid url parsing here, transcript will throw */ }

        // YouTube video IDs are always exactly 11 alphanumeric chars, dashes, or underscores.
        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.' });
        }

        console.log("Fetching transcript for video ID:", videoId);
        let transcriptText = "";
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            if (!transcript || transcript.length === 0) {
                return res.status(400).json({ error: 'This video has no transcript. It may be a music video or have closed captions disabled.' });
            }
            transcriptText = transcript.map(t => t.text).join(' ');
        } catch (e) {
            console.error("Transcript fetch failed:", e.message);
            return res.status(400).json({ error: 'Could not fetch transcript for this video. It might not have closed captions enabled.' });
        }

        // L4 FIX: Limit transcript before string injection, avoid inline comments in prompt
        const truncatedTranscript = transcriptText.slice(0, 15000); // limit to roughly 20-30 mins of speech
        const response = await generateWithFallback({
            contents: `Analyze this viral YouTube video transcript: 
"${truncatedTranscript}"

Extract the specific niche formula from this video as if it were a general trend. Do not mention that this comes from a specific video, present it as a proven niche trend.

Output exactly this JSON format:
{
  "trendingTopics": [
    {
      "name": "Topic directly from video",
      "velocity": 95,
      "growth": "exploding",
      "competition": "High",
      "targetAudience": "Audience of this video",
      "exampleIdea": "Title idea inspired by this video"
    }
  ],
  "viralFormats": ["Format used in the video"],
  "hooks": ["The exact hook or style used in the start of the video"],
  "videoStructures": ["How the video script is structured"],
  "popularMusic": ["Appropriate intense/trending music style for this"],
  "hashtagPatterns": ["#RelevantHashtag"],
  "nicheDNA": [
    { "subject": "Pacing", "value": 90 },
    { "subject": "Visual Changes", "value": 85 },
    { "subject": "Storytelling", "value": 80 }
  ]
}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trendingTopics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    velocity: { type: Type.NUMBER },
                                    growth: { type: Type.STRING, enum: ["exploding", "steady", "declining"] },
                                    competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                                    targetAudience: { type: Type.STRING },
                                    exampleIdea: { type: Type.STRING },
                                },
                            },
                        },
                        viralFormats: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        videoStructures: { type: Type.ARRAY, items: { type: Type.STRING } },
                        popularMusic: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hashtagPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nicheDNA: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { subject: { type: Type.STRING }, value: { type: Type.NUMBER } },
                            },
                        },
                    },
                    required: ["trendingTopics", "viralFormats", "hooks", "videoStructures", "popularMusic", "hashtagPatterns", "nicheDNA"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        let parsed;
        try { parsed = JSON.parse(response.text); }
        catch { throw new Error("Gemini returned malformed JSON. Please try again."); }
        res.json(parsed);

    } catch (error) {
        console.error("URL Analysis error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const trend = sanitizeInput(req.body.trend);
        const visualStyle = sanitizeInput(req.body.visualStyle);
        const { visualGenerationType } = req.body;
        if (!trend) return res.status(400).json({ error: 'Trend is required.' });

        // ── Input Validation ──────────────────────────────────────────────────
        let segmentLength = undefined;
        if (req.body.segmentLength !== undefined && req.body.segmentLength !== null) {
            segmentLength = Number(req.body.segmentLength);
            if (!Number.isFinite(segmentLength) || segmentLength < 2 || segmentLength > 30) {
                return res.status(400).json({ error: 'segmentLength must be a finite number between 2 and 30 seconds.' });
            }
            segmentLength = Math.floor(segmentLength);
        }

        let totalDuration = 60;
        if (req.body.totalDuration !== undefined && req.body.totalDuration !== null) {
            totalDuration = Number(req.body.totalDuration);
            if (!Number.isFinite(totalDuration) || totalDuration < 10 || totalDuration > 300) {
                return res.status(400).json({ error: 'totalDuration must be a number between 10 and 300 seconds.' });
            }
            totalDuration = Math.floor(totalDuration);
        }

        const ALLOWED_GEN_TYPES = ['image', 'video', 'image-to-video'];
        if (visualGenerationType !== undefined && !ALLOWED_GEN_TYPES.includes(visualGenerationType)) {
            return res.status(400).json({ error: 'visualGenerationType must be "image", "video", or "image-to-video".' });
        }



        // ── Timing Math (server-side) ─────────────────────────────────────────
        // segmentLength defined  → fixed mode: exact segmentCount enforced
        // segmentLength undefined → dynamic mode: AI picks 10-20 segments
        let segmentCount = 0;
        let maxWordsPerSegment = 0;
        let timingRules = '';

        if (segmentLength) {
            segmentCount = Math.floor(totalDuration / segmentLength);
            const remainder = totalDuration % segmentLength;
            if (remainder > 0) segmentCount += 1; // last short segment
            maxWordsPerSegment = Math.floor(segmentLength * 2.7);

            const shortSegmentNote =
                segmentLength <= 4 ? '\n- SHORT SEGMENTS (≤4s): Use punchy micro-sentences only. No multi-clause sentences.' :
                    segmentLength <= 8 ? '\n- MEDIUM SEGMENTS (5-8s): Use short impactful statements.' :
                        '\n- LONGER SEGMENTS (≥10s): Slightly more explanation allowed but still no padding.';

            const scriptRule = `- maxWordsPerSegment = ${maxWordsPerSegment} words (2.7 words/second speech pacing)\n- Each \"script\" field MUST NOT exceed ${maxWordsPerSegment} words${shortSegmentNote}`;

            timingRules = `
TIMING RULES (MANDATORY — DO NOT DEVIATE):
- segmentLength = ${segmentLength}s per segment
- totalDuration = ${totalDuration}s total
- segmentCount = ${segmentCount} — you MUST generate EXACTLY ${segmentCount} segments
${scriptRule}`;
        } else {
            // When no segmentLength is specified, use High-Retention mode.
            // For IMAGE type, enforce a 3s max frame duration since a static image
            // longer than 3s causes viewer drop-off on short-form platforms.
            const imageNote = visualGenerationType === 'image'
                ? '\n- IMAGE MODE: Each segment represents ONE still-frame image. Max visual duration = 3s. Generate MORE segments (20–25) to maintain variety.'
                : '';

            timingRules = `
TIMING RULES (ULTRA HIGH-RETENTION MODE):
- totalDuration = 60s
- You MUST break this 60-second video into 35–45 distinct segments (Dynamic Cinematic Cut Rule).
- Every sentence, major comma, or switch in subject must have its own segment.
- NEVER group more than 2.5 seconds of script under one visual.
- The Hook (0-5 seconds): Change visual every 1.2 seconds.
- Extreme Granularity: Ensure the visual pace is relentless. Every emotional beat gets a new shot.${imageNote}`;
        }

        // ── Character Block ──────────────────────────────────────────────────
        let characterBlock = '';
        if (req.body.character && req.body.character.name) {
            const charName = sanitizeInput(req.body.character.name);
            const charDesc = sanitizeScriptInput(req.body.character.description || '');
            const charType = ['image', 'video', 'image-to-video', 'both'].includes(req.body.character.type) ? req.body.character.type : 'both';
            if (charName && charDesc) {
                characterBlock = `

CUSTOM CHARACTER REQUIREMENT (FIXED REFERENCE SHEET):
You MUST maintain absolute visual consistency for character "${charName}".
Character Description: ${charDesc}
Applies to: ${charType === 'both' ? 'script AND visual prompts' : charType === 'video' || charType === 'image-to-video' ? 'video visuals only' : 'image visuals only'}

STRICT CONSISTENCY RULES:
- FIXED IDENTITY: Maintain the exact same facial features, body proportions, skin tone, hair color/style, and eye color in EVERY visual.
- NO DEVIATION: The character must look identical across all segments regardless of camera angle, lighting, or scene context.
- DISTINGUISHING MARKS: Any scars, tattoos, or jewelry must be rendered in every shot where relevant.
- ${charType !== 'video' && charType !== 'image-to-video' ? `Every visual prompt must prominently feature ${charName}.` : ''}
- ${charType !== 'image' ? `Every video prompt must show ${charName} in action/motion.` : ''}`;
            }
        }

        // ── Genre Block ──────────────────────────────────────────────────────
        const GENRE_INSTRUCTIONS = {
            'Storytelling': `Script: Narrative arc with emotional build — character-focused scenes.\nVisual: Warm, intimate framing; human subjects in natural environments.\nPacing: Steady; avoid rapid cuts in first 15 seconds. Let moments breathe.\nCamera: Slow dolly / push-in movements. Hold close-ups on faces.\nVoice: Warm, conversational, first-person storytelling tone.`,
            'POV': `Script: Direct address or relatable first-person scenarios. "You know when..." or "pov: you are..."\nVisual: First-person perspective shots. The viewer feels like they are physically in the scene.\nPacing: Engaging and personal, matching the emotional tone of the scenario.\nCamera: Eye-level, handheld movement mimicking human sight. Subjects look directly into the lens.\nVoice: Conversational, intimate, relatable, speaking directly to "you".`,
            'Action': `Script: Short, punchy, high-energy sentences with urgency and momentum.\nVisual: Dynamic wide-angle shots, motion blur, dramatic perspectives.\nPacing: Rapid-fire cuts every 1.5–2s. Hook MUST be explosive.\nCamera: Whip pans, POV shots, shaky-cam for intensity.\nVoice: Fast, intense, adrenaline-driven delivery.`,
            'Timelapse': `Script: Minimal narration. Emphasize passage of time and transformation.\nVisual: Environmental changes — sky movement, crowds, construction, seasons.\nPacing: Meditative but dynamic. Each segment = a distinct time shift.\nCamera: Static wide-frame or slow tracking shots to reveal change.\nVoice: Calm, thoughtful, nature-documentary cadence.`,
            'Horror': `Script: Suspenseful, dread-building sentences. Sparse dialogue with long pauses.\nVisual: Dark, high-contrast, dramatic shadow lighting. Focus on ominous details.\nPacing: Slow build with sudden intense moments. Sound design matters.\nCamera: Low angles, extreme close-ups of unsettling details, slow push-ins.\nVoice: Hushed, eerie, whispering tone that builds to urgency.`,
            'Comedy': `Script: Witty, snappy dialogue with comedic timing and punchlines.\nVisual: Expressive visuals, exaggerated reactions, bright fun colors.\nPacing: Dynamic — quick beats for jokes, brief pauses before punchlines.\nCamera: Wide shots for physical comedy, close-ups for reaction moments.\nVoice: Upbeat, playful, personality-driven delivery.`,
            'Documentary': `Script: Factual, informative narration with supporting evidence and stats.\nVisual: Real-world footage aesthetic, archival style, crisp journalism visuals.\nPacing: Deliberate and measured. Each fact gets its own segment.\nCamera: B-roll cutaways, interview-style framing, objective perspectives.\nVoice: Authoritative, neutral, trust-building documentary tone.`,
            'Educational': `Script: Clear step-by-step explanations. Use numbered lists or sequences.\nVisual: Diagram-style visuals, explainer graphics, clean product shots.\nPacing: Methodical — give each concept room to register before moving on.\nCamera: Overhead or straight-on angles for clarity. Avoids distraction.\nVoice: Friendly teacher tone — approachable, clear, encouraging.`,
            'Cinematic': `Script: Poetic, evocative language. Less is more — let visuals tell the story.\nVisual: Epic wide shots, golden hour lighting, stunning landscapes.\nPacing: Slow and intentional. Each frame is a painting.\nCamera: Crane shots, slow-motion, widescreen cinematic compositions.\nVoice: Deep, resonant, cinematic narrator quality.`,
            'Motivational': `Script: Powerful affirmations and calls-to-action. Begin with a bold statement.\nVisual: Aspirational scenes — success, achievement, determination, triumph.\nPacing: Building energy — start steady, end with high-energy rapid cuts.\nCamera: Low angles (hero shots), upward movements showing growth.\nVoice: Passionate, inspiring, authoritative — speaks directly to the viewer.`,
            'Tutorial': `Script: Clear numbered steps. Start with the end result to hook, then break down the process.\nVisual: Close-up product/tool shots, screen recordings, before/after splits.\nPacing: Steady and deliberate. Each step = one segment.\nCamera: Overhead or straight-on for demonstrations. Zoom in on key actions.\nVoice: Calm, patient, instructional — speak as if helping a friend.`,
            'Vlog': `Script: Casual, first-person narration. Conversational and authentic.\nVisual: Real-life candid moments, selfie angles, B-roll of environments.\nPacing: Relaxed but engaging. Jump cuts keep energy up.\nCamera: Handheld selfie POV and wide environmental shots alternating.\nVoice: Natural, unscripted feel — personal and relatable.`,
            'Gaming': `Script: High-energy commentary with reactions and hype moments.\nVisual: Dynamic gameplay footage, reaction face-cam inserts, score/stat overlays.\nPacing: Rapid cuts synced to game events. Hook = the most hype moment.\nCamera: Screen-capture style with picture-in-picture face reaction.\nVoice: Energetic, hype, reactive — like a live stream highlight.`,
            'Fitness': `Script: Motivating, command-style cues. Short and punchy between reps.\nVisual: Athletic bodies in motion, gym environments, dramatic lighting on form.\nPacing: Fast during exercise segments, brief pauses for breathing emphasis.\nCamera: Low angles for power shots, side profile for form demonstration.\nVoice: Commanding, energetic, push-through-it tone.`,
            'Travel': `Script: Wanderlust-inspiring narration. Paint vivid pictures of places.\nVisual: Sweeping landscapes, local culture, food markets, iconic landmarks.\nPacing: Medium — let scenic shots breathe while keeping momentum.\nCamera: Drone aerials, wide establishing shots, intimate street-level footage.\nVoice: Adventurous, curious, awestruck — invite the viewer to join.`,
            'Food': `Script: Sensory-rich language. Describe taste, texture, and smell through words.\nVisual: Extreme close-ups of food, steam rising, cheese pulls, satisfying pours.\nPacing: Slow and indulgent for hero moments, quicker for prep sequences.\nCamera: Overhead flat-lay, macro close-ups, 45° angle beauty shots.\nVoice: Warm, indulgent, passionate about ingredients and flavor.`,
            'Fashion': `Script: Confident, trend-aware narration. Short punchy statements about style.\nVisual: Clean editorial lighting, outfit transitions, detail close-ups on textures.\nPacing: Rhythmic — cuts synced to music beat. Quick outfit reveal transitions.\nCamera: Full-body to close-up alternation. Mirror selfie aesthetic when appropriate.\nVoice: Confident, aspirational, style-authority tone.`,
            'Mystery': `Script: Intriguing questions and revelations. Withhold information to build suspense.\nVisual: Atmospheric environments, clue reveals, dramatic shadow play.\nPacing: Slow tension build with sudden reveal moments.\nCamera: Zoom-ins on clues, dramatic close-ups, ominous wide shots.\nVoice: Hushed, conspiratorial, "I need to tell you something" energy.`,
            'ASMR': `Script: Minimal dialogue. Focus on sensory descriptions and gentle narration.\nVisual: Extreme close-ups of textures, objects, and tactile actions.\nPacing: Very slow and deliberate. Every movement is intentional.\nCamera: Macro close-up shots. Intimacy is key — feels like it\'s just for you.\nVoice: Ultra-soft whisper, slow cadence, trigger-word awareness.`,
            'Restoration': `Script: Focus on the transformation process. Minimal talking during work, emphasize the before and after.\nVisual: Side-by-side or sequential before/after reveals. Extreme close-ups on rust removal, polishing, or delicate repairs.\nPacing: Methodical during the process, accelerating toward the final satisfying reveal.\nCamera: Static overhead workbench angles, smooth macro panning over textures.\nVoice: Calm, appreciative, focusing on craftsmanship and satisfaction.`,
        };
        
        let genreBlock = '';
        if (req.body.customGenre) {
            const safeCustomGenre = sanitizeInput(req.body.customGenre);
            genreBlock = `\nCONTENT GENRE RULES (Custom): Follow these specific framing, narrative, and stylistic rules for the ENTIRE output:\n${safeCustomGenre}`;
        } else {
            const rawGenre = sanitizeInput(req.body.genre || 'Storytelling');
            const genre = GENRE_INSTRUCTIONS[rawGenre] ? rawGenre : 'Storytelling';
            genreBlock = `\nCONTENT GENRE: ${genre}\nFollow these genre-specific directives for the ENTIRE output:\n${GENRE_INSTRUCTIONS[genre]}`;
        }

        const expectedSegments = segmentLength ? segmentCount : 0;
        const variationBlock = req.body.variationId ? `\n\n━━━ REGENERATION VARIANCE ━━━\nCreate a highly distinct creative variation of this concept. DO NOT simply repeat the previous output. New hooks, new visual angles, distinct narrative pacing.\nVariation Seed: ${sanitizeInput(req.body.variationId)}\n━━━━━━━━━━━━━━━━━━━━━━━` : '';

        let result = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await generateWithFallback({
                    contents: `ROLE: You are a High-Retention Short-Form Video Director for TikTok, Reels, and YouTube Shorts.
Goal: Convert a content idea into a perfectly synced, high-energy production timeline.${variationBlock}

Niche: "${trend}"
Visual Generation Type: ${visualGenerationType === 'video' ? 'VIDEO (cinematic motion descriptions)' : 'IMAGE (still-frame composition)'}

${timingRules}
${genreBlock}

━━━ VISUAL DNA REFERENCE SHEET (MANDATORY — lock this across EVERY segment) ━━━
Visual Style: "${visualStyle}"
This style string is your CONSTITUTION. Every visual prompt must begin by silently grounding itself in this style's materials, lens, lighting quality, and texture language. The viewer must feel the same tactile world in frame 1 and frame 45.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SUBJECT PERMANENCE (ALWAYS ON — no exceptions) ━━━
At the very first segment, define your CORE SUBJECT (the main character, creature, or object central to this niche). Then:
- Every subsequent visual prompt MUST carry the EXACT same description of that subject: same materials, same textures, same colors, same distinguishing marks.
- If the subject is a human: identical skin tone, hair style, clothing color/texture, facial features.
- If the subject is an object or creature: identical shape, material, surface finish, and size relationship to environment.
- ZERO deviation allowed — different camera angle, lighting, or scene context does NOT change the subject's core description.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL PRODUCTION INSTRUCTIONS:
1. THE 3-SECOND REFRESH: Viewers scroll away if a visual stays static for more than 3 seconds.
2. THE HOOK (0-5s): Visually aggressive, fast-paced (visual change every ~1.5s).
3. EXTREME GRANULARITY: Every sentence fragment or emotional "beat" must have its own timestamp and unique visual.
4. NO RANGES: Only use the start timestamp for each segment.

━━━ MANDATORY 5-PART VISUAL PROMPT STRUCTURE ━━━
EVERY "visual" field MUST be built from ALL 5 parts, in this order:
  PART 1 — SHOT TYPE: One of [extreme close-up | close-up | medium shot | wide shot | overhead | low-angle | POV | tracking shot | tilt-shift].
  PART 2 — SUBJECT DETAIL: The main subject with precise textures, surface finish, colors, and distinguishing marks (minimum 8 words).
  PART 3 — ENVIRONMENT: Specific background elements, materials, spatial context — never generic (minimum 6 words).
  PART 4 — LIGHTING & LENS: Light quality/direction, shadow character, color grade tone, and lens style (minimum 6 words).
  PART 5 — ASPECT: Always terminate with --ar 9:16.
Example of a CORRECT visual: "Extreme close-up of a tiny clay worker with a blue linen shirt, visible thumbprint texture on clay shoulders and forehead, perched on a mossy river stone with water-smoothed pebbles in background, soft diffused morning sunlight casting warm amber shadows, tilt-shift macro lens --ar 9:16"
Example of an INCORRECT visual: "A clay figure building a house --ar 9:16"  ← REJECTED, too vague.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ MOTION FIELD (MANDATORY FOR EVERY SEGMENT) ━━━
Provide a "motion" value for EVERY segment — even image mode benefits from describing the implied or animated motion.
Format: [Subject or Camera] + [Action verb] + [Direction/Quality] + [Speed/Intensity].
Examples of CORRECT motion:
  • "Slow cinematic push-in toward the clay face, revealing thumbprint texture on forehead"
  • "Rhythmic vertical hammer motion synced to the script beat"
  • "Camera pans slowly left across the muddy riverbank construction site"
  • "Subtle blink animation on the clay worker's face, held for 1.5 seconds"
NEVER write generic values like "camera pan" or "zoom" without direction, subject, and purpose.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASPECT RATIO: Append "--ar 9:16" to the END of EVERY visual prompt.
${characterBlock}

━━━ POST-PRODUCTION REQUIREMENTS ━━━
Generate the following with PRODUCTION-LEVEL specificity (not generic 1-word answers):
- editingEffects: List 4–6 NAMED effects with descriptive adjectives, e.g. ["J-cuts on every script beat transition", "Motion blur on fast-action cuts", "Color grade: warm earthy tones with lifted shadows", "Soft vignette on wide environmental shots", "Stop-motion frame jitter overlay for tactile feel"]. Match the visual style's physical/aesthetic quality.
- fontStyle: Include the font FAMILY NAME, weight, color, and shadow spec, e.g. "Clean minimalist sans-serif (e.g. Inter Regular), white, 2px drop shadow at 60% opacity".
- editingEffectsContext: Write 2–3 sentences as a DIRECTOR'S NOTE that describes HOW the editing should feel — referencing the visual style's physical/tactile qualities. Must be specific enough for an editor to use as a brief.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Also generate:
- 3 hook variations (Curiosity / Direct-Aggressive / Contrarian psychological triggers)
- SEO title, description, and pinned comment idea
- Hashtags (10-15)
- Coaching tips for the creator

⚠️ FINAL SEGMENT COUNT LOCK: Before you finish, count your segments array. In dynamic mode you MUST output between 35 and 45 segments. If you have fewer than 35, split more script beats and add more visual cuts until you reach the minimum. Do NOT submit fewer than 35 segments.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                segments: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            index: { type: Type.NUMBER, description: "Zero-based segment index" },
                                            startTime: { type: Type.NUMBER, description: "Segment start in seconds" },
                                            timestamp: { type: Type.STRING, description: "Start point in MM:SS format" },
                                            script: { type: Type.STRING, description: "A short, punchy sentence fragment for narration" },
                                            visual: { type: Type.STRING, description: "5-part visual prompt: shot type + subject detail + environment + lighting/lens + --ar 9:16. Minimum 25 words." },
                                            motion: { type: Type.STRING, description: "Mandatory: [Subject or Camera] + [Action verb] + [Direction/Quality] + [Speed/Intensity]. E.g. 'Slow push-in toward the clay face revealing thumbprint texture'" }
                                        },
                                        required: ["index", "startTime", "timestamp", "script", "visual", "motion"]
                                    },
                                    description: "Storyboard timeline — one entry per segment"
                                },
                                metadata: {
                                    type: Type.OBJECT,
                                    properties: {
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["tags"]
                                },
                                visualStyle: { type: Type.STRING },
                                hookVariations: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING },
                                            text: { type: Type.STRING }
                                        },
                                        required: ["type", "text"]
                                    }
                                },
                                seoMetadata: {
                                    type: Type.OBJECT,
                                    properties: {
                                        youtubeTitle: { type: Type.STRING },
                                        youtubeDescription: { type: Type.STRING },
                                        pinnedCommentIdea: { type: Type.STRING }
                                    },
                                    required: ["youtubeTitle", "youtubeDescription", "pinnedCommentIdea"]
                                },
                                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                coachingTips: { type: Type.STRING },
                                editingEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                fontStyle: { type: Type.STRING },
                                editingEffectsContext: { type: Type.STRING }
                            },
                            required: ["title", "segments", "metadata", "visualStyle", "hookVariations", "seoMetadata", "hashtags", "coachingTips", "editingEffects", "fontStyle", "editingEffectsContext"]
                        }
                    }
                });

                if (!response.text) throw new Error("No response text from Gemini API");
                const parsed = JSON.parse(response.text);

                // ── Structural Validation ─────────────────────────────────────
                if (expectedSegments > 0) {
                    if (parsed.segments.length !== expectedSegments) {
                        throw new Error(`Validation failed: Expected exactly ${expectedSegments} segments, got ${parsed.segments.length}.`);
                    }
                } else {
                    // Loosened range: accept 10–60 segments to avoid repeated hard failures.
                    // The auto-split pass after this will expand segments further if needed.
                    if (parsed.segments.length < 10 || parsed.segments.length > 60) {
                        throw new Error(`Validation failed: Expected 10–60 segments for high-density mode, got ${parsed.segments.length}.`);
                    }
                }

                result = parsed;
                break;
            } catch (err) {
                console.warn(`[Generate Attempt ${attempts}] failed:`, err.message);
                if (attempts >= maxAttempts) {
                    return res.status(500).json({ error: "Failed to generate valid structure after multiple attempts." });
                }
            }
        }

        if (!result) {
            return res.status(500).json({ error: 'Generation failed: no valid result after multiple attempts.' });
        }

        // ── Mathematically Enforce Timestamps ────────────────────────────────
        // Override LLM timestamps with exact arithmetic — clock-perfect every time.
        if (result.segments && result.segments.length > 0) {
            const count = result.segments.length;
            result.segments = result.segments.map((seg, i) => {
                let start = 0; // Default to 0 — prevents NaN:NaN timestamps if both parse paths fail
                if (segmentLength) {
                    start = i * segmentLength;
                } else {
                    // Try to parse timestamp (MM:SS) if startTime is missing or invalid
                    if (seg.timestamp && typeof seg.timestamp === 'string') {
                        const parts = seg.timestamp.split(':');
                        if (parts.length === 2) {
                            start = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                        }
                    }
                    if (start === undefined) {
                        start = Math.max(0, Math.min(Number(seg.startTime) || 0, totalDuration - 1));
                    }
                }

                // Strictly enforce 3-second refresh by calculating end as the next segment's start or totalDuration
                let end;
                if (i < count - 1) {
                    const nextSeg = result.segments[i + 1];
                    if (segmentLength) {
                        end = (i + 1) * segmentLength;
                    } else if (nextSeg.timestamp && typeof nextSeg.timestamp === 'string') {
                        const nextParts = nextSeg.timestamp.split(':');
                        if (nextParts.length === 2) {
                            end = parseInt(nextParts[0], 10) * 60 + parseInt(nextParts[1], 10);
                        }
                    }
                    if (end === undefined) {
                        end = Math.max(start + 1, Math.min(Number(nextSeg.startTime) || start + 3, totalDuration));
                    }
                } else {
                    end = totalDuration;
                }

                // Fallback for timestamp string if LLM missed it or we need to normalize
                const formatTime = (secs) => {
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                };

                let visual = (seg.visual || '').trim();
                if (!visual.includes('--ar 9:16')) visual = `${visual} --ar 9:16`;

                return {
                    index: i,
                    startTime: start,
                    endTime: end,
                    timestamp: formatTime(start),
                    script: seg.script || '',
                    visual,
                    ...(seg.motion ? { motion: seg.motion } : {})
                };
            });

            // ── Auto-Split at Punctuation Beats ──────────────────────────────
            // Only in dynamic (non-fixed) mode: split multi-clause segments at
            // commas, periods, etc. for frame-perfect visual sync.
            if (!segmentLength) {
                const expanded = [];
                for (const seg of result.segments) {
                    expanded.push(...splitSegmentAtBeats(seg));
                }
                // L1 FIX: Cap to prevent runaway expansion from bloating JSON responses.
                const capped = expanded.slice(0, MAX_AUTO_SPLIT_SEGMENTS);
                if (capped.length < expanded.length) {
                    console.warn(`[AutoSplit] Capped at ${MAX_AUTO_SPLIT_SEGMENTS} (was ${expanded.length}) segments.`);
                }
                result.segments = capped.map((seg, i) => ({ ...seg, index: i }));
                console.log(`[AutoSplit] ${count} segments → ${result.segments.length} after beat-splitting`);
            }
        }

        // Ensure metadata exists for frontend mapping if LLM missed it
        if (!result.metadata) {
            result.metadata = {
                tags: result.hashtags || ['#shorts', '#viral']
            };
        }

        // Also map metadata back to root fields for backward compatibility if needed
        result.hashtags = result.metadata.tags;

        res.json(result);

    } catch (error) {
        console.error("Generate error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});


app.post('/api/improve', async (req, res) => {
    try {
        const script = sanitizeScriptInput(req.body.script);
        const critique = sanitizeScriptInput(req.body.critique);
        const visualStyle = sanitizeInput(req.body.visualStyle) || 'Default';
        const { visualGenerationType } = req.body;
        if (!script) return res.status(400).json({ error: 'Script is required.' });

        // ── Input Validation ──────────────────────────────────────────────────
        let segmentLength = undefined;
        if (req.body.segmentLength !== undefined && req.body.segmentLength !== null) {
            segmentLength = Number(req.body.segmentLength);
            if (!Number.isFinite(segmentLength) || segmentLength < 2 || segmentLength > 30) {
                return res.status(400).json({ error: 'segmentLength must be a finite number between 2 and 30 seconds.' });
            }
            segmentLength = Math.floor(segmentLength);
        }

        let totalDuration = 60;
        if (req.body.totalDuration !== undefined && req.body.totalDuration !== null) {
            totalDuration = Number(req.body.totalDuration);
            if (!Number.isFinite(totalDuration) || totalDuration < 10 || totalDuration > 300) {
                return res.status(400).json({ error: 'totalDuration must be a number between 10 and 300 seconds.' });
            }
            totalDuration = Math.floor(totalDuration);
        }

        const ALLOWED_GEN_TYPES = ['image', 'video', 'image-to-video'];
        if (visualGenerationType !== undefined && !ALLOWED_GEN_TYPES.includes(visualGenerationType)) {
            return res.status(400).json({ error: 'visualGenerationType must be "image", "video", or "image-to-video".' });
        }

        // ── Extract Original Timeline Segment Count ───────────────────────────
        // Use client-provided expectedSegments if available, otherwise fallback to parsing script text.
        let expectedSegments = req.body.expectedSegments;
        if (typeof expectedSegments !== 'number' || expectedSegments <= 0) {
            const originalTimelineLines = script.split('\n').filter(line => line.trim().startsWith('['));
            expectedSegments = originalTimelineLines.length;
        }

        if (expectedSegments === 0) {
            return res.status(400).json({ error: 'Could not extract a valid timeline from the script. Ensure it contains timestamped segments.' });
        }

        const maxWordsPerSegment = segmentLength ? Math.floor(segmentLength * 2.7) : 21;
        const timingConstraint = segmentLength
            ? `Each segment is exactly ${segmentLength}s. Max script words per segment: ${maxWordsPerSegment} (2.7 wps).`
            : `Preserve original segment durations. Keep script concise and punchy.`;

        // ── Character Block ──────────────────────────────────────────────────
        let characterImproveBlock = '';
        if (req.body.character && req.body.character.name) {
            const charName = sanitizeInput(req.body.character.name);
            const charDesc = sanitizeScriptInput(req.body.character.description || '');
            const charType = ['image', 'video', 'image-to-video', 'both'].includes(req.body.character.type) ? req.body.character.type : 'both';
            if (charName && charDesc) {
                characterImproveBlock = `

CUSTOM CHARACTER REQUIREMENT (MANDATORY):
Deepen "${charName}"'s presence 10x. Character: ${charDesc}
- ${charType !== 'video' && charType !== 'image-to-video' ? `All visual prompts must feature ${charName} prominently.` : ''}
- ${charType !== 'image' ? `All video prompts must show ${charName} in action.` : ''}`;
            }
        }

        let result = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await generateWithFallback({
                    contents: `Based on this critique, generate a 10x stronger viral storyboard.

ORIGINAL SCRIPT:
${script}

CRITIQUE:
${critique}
${characterImproveBlock}

STRUCTURAL PRESERVATION (MANDATORY):
- Return EXACTLY ${expectedSegments} segments — no merging, splitting, or deleting.
- Preserve each segment's index exactly (0 through ${expectedSegments - 1}).
- Timing: ${timingConstraint}

━━━ VISUAL DNA REFERENCE SHEET (lock across EVERY segment) ━━━
Visual Style: "${visualStyle}"
Every visual prompt must silently ground itself in this style's materials, lens, lighting quality, and texture language.
- Type: ${visualGenerationType === 'video' || visualGenerationType === 'image-to-video' ? 'VIDEO generation (cinematic motion descriptions)' : 'IMAGE generation (still-frame composition)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SUBJECT PERMANENCE (ALWAYS ON) ━━━
Carry the EXACT same description of the core subject across every improved visual: same materials, textures, colors, and distinguishing marks. ZERO deviation allowed regardless of camera angle or scene context.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ MANDATORY 5-PART VISUAL PROMPT STRUCTURE ━━━
Each "visual" MUST include ALL 5 parts in order:
  PART 1 — SHOT TYPE: [extreme close-up | close-up | medium shot | wide shot | overhead | low-angle | POV | tracking shot | tilt-shift]
  PART 2 — SUBJECT DETAIL: Precise textures, surface finish, colors, distinguishing marks (min 8 words)
  PART 3 — ENVIRONMENT: Specific background/spatial context — never generic (min 6 words)
  PART 4 — LIGHTING & LENS: Light quality, shadow character, color grade, lens style (min 6 words)
  PART 5 — ASPECT: Always end with --ar 9:16
Example CORRECT: "Extreme close-up of a tiny clay worker with a blue linen shirt, visible thumbprint texture on clay shoulders and forehead, perched on a mossy river stone with water-smoothed pebbles, soft diffused morning sunlight casting warm amber shadows, tilt-shift macro lens --ar 9:16"
Example REJECTED: "A clay figure building a house --ar 9:16" ← too vague.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ MOTION FIELD (MANDATORY FOR EVERY SEGMENT) ━━━
Format: [Subject or Camera] + [Action verb] + [Direction/Quality] + [Speed/Intensity].
Correct examples:
  • "Slow cinematic push-in toward the clay face, revealing thumbprint texture on forehead"
  • "Rhythmic vertical hammer motion synced to the script beat"
  • "Camera pans slowly left across the muddy riverbank construction site"
NEVER write generic values like "camera pan" or "zoom" without direction, subject, and purpose.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10X UPGRADE RULES:
1. Hook (index 0): Punchy pattern-interrupt — NO generic openings
2. Every script line must provoke curiosity, shock, or relatable frustration
3. Cut ALL filler words. Short punchy active-voice sentences
4. Replace vague statements with hyper-specific micro-details

━━━ POST-PRODUCTION REQUIREMENTS ━━━
- improvedEditingEffects: List 4–6 named effects with adjectives, e.g. ["J-cuts on every script beat", "Motion blur on fast-action cuts", "Color grade: warm earthy tones with lifted shadows", "Soft vignette on wide shots"]. Match the visual style.
- improvedFontStyle: Font FAMILY NAME + weight + color + shadow spec, e.g. "Clean minimalist sans-serif (Inter Regular), white, 2px drop shadow at 60% opacity".
- improvedEditingEffectsContext: 2–3 sentences as a DIRECTOR'S NOTE describing the editing feel, referencing the visual style's physical/tactile qualities.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Also provide: improved hook (1 line max), caption, hashtags.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                improvedSegments: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            index: { type: Type.NUMBER },
                                            startTime: { type: Type.NUMBER },
                                            timestamp: { type: Type.STRING },
                                            script: { type: Type.STRING },
                                            visual: { type: Type.STRING, description: "5-part visual prompt: shot type + subject detail + environment + lighting/lens + --ar 9:16. Minimum 25 words." },
                                            motion: { type: Type.STRING, description: "Mandatory: [Subject or Camera] + [Action verb] + [Direction/Quality] + [Speed/Intensity]." }
                                        },
                                        required: ["index", "startTime", "timestamp", "script", "visual", "motion"]
                                    }
                                },
                                improvedHook: { type: Type.STRING, description: "First 1 line maximum" },
                                improvedCaption: { type: Type.STRING },
                                improvedHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                improvedEditingEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                improvedFontStyle: { type: Type.STRING },
                                improvedEditingEffectsContext: { type: Type.STRING }
                            },
                            required: ["improvedSegments", "improvedHook", "improvedCaption", "improvedHashtags", "improvedEditingEffects", "improvedFontStyle", "improvedEditingEffectsContext"]
                        }
                    }
                });

                if (!response.text) throw new Error("No response text from Gemini API");
                const parsed = JSON.parse(response.text);

                if (parsed.improvedSegments.length !== expectedSegments) {
                    throw new Error(`Validation failed: Expected exactly ${expectedSegments} segments, got ${parsed.improvedSegments.length}.`);
                }

                result = parsed;
                break;
            } catch (err) {
                console.warn(`[Improve Attempt ${attempts}] failed:`, err.message);
                if (attempts >= maxAttempts) {
                    return res.status(500).json({ error: "Failed to generate valid structure after multiple attempts." });
                }
            }
        }

        // ── Re-enforce Timestamps Mathematically ─────────────────────────────
        if (result && result.improvedSegments && result.improvedSegments.length === expectedSegments) {
            result.improvedSegments = result.improvedSegments.map((seg, i) => {
                let start = 0; // Default to 0 — prevents NaN:NaN timestamps if both parse paths fail
                if (segmentLength) {
                    start = i * segmentLength;
                } else {
                    if (seg.timestamp && typeof seg.timestamp === 'string') {
                        const parts = seg.timestamp.split(':');
                        if (parts.length === 2) {
                            start = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                        }
                    }
                    if (start === undefined) {
                        start = Math.max(0, Math.min(Number(seg.startTime) || 0, totalDuration - 1));
                    }
                }

                // Strictly enforce 3-second refresh by calculating end as the next segment's start or totalDuration
                let end;
                if (i < expectedSegments - 1) {
                    const nextSeg = result.improvedSegments[i + 1];
                    if (segmentLength) {
                        end = (i + 1) * segmentLength;
                    } else if (nextSeg.timestamp && typeof nextSeg.timestamp === 'string') {
                        const nextParts = nextSeg.timestamp.split(':');
                        if (nextParts.length === 2) {
                            end = parseInt(nextParts[0], 10) * 60 + parseInt(nextParts[1], 10);
                        }
                    }
                    if (end === undefined) {
                        end = Math.max(start + 1, Math.min(Number(nextSeg.startTime) || start + 3, totalDuration));
                    }
                } else {
                    end = totalDuration;
                }

                const formatTime = (secs) => {
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                };

                let visual = (seg.visual || '').trim();
                if (!visual.includes('--ar 9:16')) visual = `${visual} --ar 9:16`;

                return {
                    index: i,
                    startTime: start,
                    endTime: end,
                    timestamp: formatTime(start),
                    script: seg.script || '',
                    visual,
                    ...(seg.motion ? { motion: seg.motion } : {})
                };
            });

            // ── Auto-Split at Punctuation Beats ──────────────────────────────
            if (!segmentLength) {
                const expanded = [];
                for (const seg of result.improvedSegments) {
                    expanded.push(...splitSegmentAtBeats(seg));
                }
                // L1 FIX: Cap to prevent runaway expansion.
                const capped = expanded.slice(0, MAX_AUTO_SPLIT_SEGMENTS);
                if (capped.length < expanded.length) {
                    console.warn(`[AutoSplit Improve] Capped at ${MAX_AUTO_SPLIT_SEGMENTS} (was ${expanded.length}) segments.`);
                }
                result.improvedSegments = capped.map((seg, i) => ({ ...seg, index: i }));
                console.log(`[AutoSplit Improve] ${expectedSegments} → ${result.improvedSegments.length} after beat-splitting`);
            }
        }

        res.json(result);
    } catch (error) {
        console.error("Improve error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});


app.post('/api/workflow', async (req, res) => {
    try {
        const response = await generateWithFallback({
            contents: "Provide a step-by-step workflow for creating high-quality YouTube Shorts, including recommended software and optimization tips.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        software: {
                            type: Type.OBJECT,
                            properties: {
                                voiceGen: { type: Type.STRING },
                                imageGen: { type: Type.STRING },
                                videoGen: { type: Type.STRING },
                                editing: { type: Type.STRING },
                            },
                            required: ["voiceGen", "imageGen", "videoGen", "editing"],
                        },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        optimizationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["software", "steps", "optimizationTips"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        let workflowData;
        try { workflowData = JSON.parse(response.text); }
        catch { throw new Error("Gemini returned malformed JSON. Please try again."); }
        res.json(workflowData);
    } catch (error) {
        console.error("Workflow error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});

// ─── 404 Catch-All ───────────────────────────────────────────────────────────
// Must be registered after all other routes. Returns JSON (not HTML default)
// so the client always gets a consistent error format.
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend Proxy running on http://localhost:${PORT}`);
});
