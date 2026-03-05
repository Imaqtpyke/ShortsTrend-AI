import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { rateLimit } from 'express-rate-limit'; // Rate limiting to protect API credits
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

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

app.use(generalLimiter);
// CORS: Restrict to the frontend origin. Set ALLOWED_ORIGIN in your deployment env.
// Falls back to localhost:3000 for local development only.
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '16kb' })); // Prevent oversized payloads

// Health check — used for uptime monitoring (no credentials required)
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Applied to expensive endpoints below
app.post('/api/generate', expensiveLimiter);
app.post('/api/improve', expensiveLimiter);

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
        .replace(/\bignore\b.{0,80}\bprevious\b/gi, '[FILTERED]')
        .replace(/\bsystem\s*prompt\b/gi, '[FILTERED]')
        .replace(/\bpretend\b.{0,60}\byou are\b/gi, '[FILTERED]')
        .replace(/\bforget\b.{0,60}\binstructions\b/gi, '[FILTERED]')
        .trim();
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_FILE = path.join(process.cwd(), '.trend_cache.json');

function loadDiskCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to load trend cache from disk", e);
    }
    return {};
}

function saveDiskCache(cacheObj) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2));
    } catch (e) {
        console.error("Failed to write trend cache to disk", e);
    }
}

function getCachedAnalysis(key) {
    const cacheObj = loadDiskCache();
    const entry = cacheObj[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        delete cacheObj[key];
        saveDiskCache(cacheObj);
        return null;
    }
    return entry.data;
}

function setCachedAnalysis(key, data) {
    const cacheObj = loadDiskCache();
    cacheObj[key] = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    saveDiskCache(cacheObj);
}

// ─── Multi-Model Fallback Strategy ────────────────────────────────────────────
// If the primary model is rate-limited or unavailable, automatically fallback
// through the cascade until a model succeeds.
const MODEL_CASCADE = [
    'gemini-2.5-flash',
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
    throw lastError;
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
            model: "gemini-2.5-flash",
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
        res.json(JSON.parse(response.text));
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
            model: "gemini-2.5-flash",
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
        const result = JSON.parse(response.text);
        setCachedAnalysis(cacheKey, result);
        res.json(result);
    } catch (error) {
        console.error("Analyze error:", error);
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

        const ALLOWED_GEN_TYPES = ['image', 'video'];
        if (visualGenerationType !== undefined && !ALLOWED_GEN_TYPES.includes(visualGenerationType)) {
            return res.status(400).json({ error: 'visualGenerationType must be "image" or "video".' });
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

            timingRules = `
TIMING RULES (MANDATORY — DO NOT DEVIATE):
- segmentLength = ${segmentLength}s per segment
- totalDuration = ${totalDuration}s total
- segmentCount = ${segmentCount} — you MUST generate EXACTLY ${segmentCount} segments
- maxWordsPerSegment = ${maxWordsPerSegment} words (2.7 words/second speech pacing)
- Each "audio" field MUST NOT exceed ${maxWordsPerSegment} words${shortSegmentNote}`;
        } else {
            timingRules = `
TIMING RULES (HIGH-RETENTION MODE):
- totalDuration = 60s
- You MUST break this 60-second video into 15–30 distinct segments (The 2-4 Second Refresh Rule).
- Every sentence, major comma, or change in emotional "beat" must have its own segment.
- NEVER group more than 4 seconds of audio under one visual.
- The Hook (0-5 seconds): Change visual every 1.5 seconds. The hook MUST be visually aggressive and fast-paced.
- Extreme Granularity: Treat every pause as a cut point. If a sentence is 5 seconds long, split it into two segments.`;
        }

        // ── Character Block ──────────────────────────────────────────────────
        let characterBlock = '';
        if (req.body.character && req.body.character.name) {
            const charName = sanitizeInput(req.body.character.name);
            const charDesc = sanitizeScriptInput(req.body.character.description || '');
            const charType = ['image', 'video', 'both'].includes(req.body.character.type) ? req.body.character.type : 'both';
            if (charName && charDesc) {
                characterBlock = `

CUSTOM CHARACTER REQUIREMENT (MANDATORY):
Feature "${charName}" throughout the ENTIRE output. Character: ${charDesc}
Applies to: ${charType === 'both' ? 'audio AND visual prompts' : charType === 'video' ? 'video visuals only' : 'image visuals only'}
- ${charType !== 'video' ? `Every visual prompt must prominently feature ${charName}.` : ''}
- ${charType !== 'image' ? `Every video prompt must show ${charName} in action/motion.` : ''}`;
            }
        }

        const expectedSegments = segmentLength ? segmentCount : 0;

        let result = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await generateWithFallback({
                    model: "gemini-2.5-flash",
                    contents: `ROLE: You are a High-Retention Short-Form Video Director for TikTok, Reels, and YouTube Shorts.
Goal: Convert a content idea into a perfectly synced, high-energy production timeline.

Niche: "${trend}"
Visual Style: "${visualStyle}"
Visual Generation Type: ${visualGenerationType === 'video' ? 'VIDEO (cinematic motion descriptions)' : 'IMAGE (still-frame composition)'}

${timingRules}

CRITICAL PRODUCTION INSTRUCTIONS:
1. THE 3-SECOND REFRESH: Viewers scroll away if a visual stays static for more than 3 seconds.
2. THE HOOK (0-5s): Visually aggressive, fast-paced (visual change every ~1.5s).
3. EXTREME GRANULARITY: Every sentence fragment or emotional "beat" must have its own timestamp and unique visual.
4. VISUAL DENSITY: Focus on clear, high-resolution snapshots of specific actions ("Beat-Based" logic) rather than long, vague atmospheric descriptions.
5. NO RANGES: Only use the start timestamp for each segment.

ASPECT RATIO: Append "--ar 9:16" to the END of EVERY visual prompt.
${characterBlock}

Also generate:
- 3 hook variations (Curiosity / Direct-Aggressive / Contrarian psychological triggers)
- SEO title, description, and pinned comment idea
- Hashtags (10-15)
- Music style and sound effects
- Editing effects, font style, and editing context
- Coaching tips for the creator`,
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
                                            audio: { type: Type.STRING, description: "A short, punchy sentence fragment" },
                                            visual: { type: Type.STRING, description: "Detailed, high-action prompt with --ar 9:16" }
                                        },
                                        required: ["index", "startTime", "timestamp", "audio", "visual"]
                                    },
                                    description: "Storyboard timeline — one entry per segment"
                                },
                                metadata: {
                                    type: Type.OBJECT,
                                    properties: {
                                        music: { type: Type.STRING },
                                        sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["music", "sfx", "tags"]
                                },
                                musicStyle: { type: Type.STRING },
                                soundEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                            required: ["title", "segments", "metadata", "musicStyle", "soundEffects", "visualStyle", "hookVariations", "seoMetadata", "hashtags", "coachingTips", "editingEffects", "fontStyle", "editingEffectsContext"]
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
                    if (parsed.segments.length < 15 || parsed.segments.length > 30) {
                        throw new Error(`Validation failed: High-retention mode expected 15–30 segments, got ${parsed.segments.length}.`);
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
                let start;
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
                    audio: seg.audio || '',
                    visual
                };
            });
        }

        // Ensure metadata exists for frontend mapping if LLM missed it
        if (!result.metadata) {
            result.metadata = {
                music: result.musicStyle || 'Trending Phonk',
                sfx: result.soundEffects || ['Whoosh', 'Glitch'],
                tags: result.hashtags || ['#shorts', '#viral']
            };
        }

        // Also map metadata back to root fields for backward compatibility if needed
        result.musicStyle = result.metadata.music;
        result.soundEffects = result.metadata.sfx;
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

        const ALLOWED_GEN_TYPES = ['image', 'video'];
        if (visualGenerationType !== undefined && !ALLOWED_GEN_TYPES.includes(visualGenerationType)) {
            return res.status(400).json({ error: 'visualGenerationType must be "image" or "video".' });
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
            ? `Each segment is exactly ${segmentLength}s. Max audio words per segment: ${maxWordsPerSegment} (2.7 wps).`
            : `Preserve original segment durations. Keep audio concise and punchy.`;

        // ── Character Block ──────────────────────────────────────────────────
        let characterImproveBlock = '';
        if (req.body.character && req.body.character.name) {
            const charName = sanitizeInput(req.body.character.name);
            const charDesc = sanitizeScriptInput(req.body.character.description || '');
            const charType = ['image', 'video', 'both'].includes(req.body.character.type) ? req.body.character.type : 'both';
            if (charName && charDesc) {
                characterImproveBlock = `

CUSTOM CHARACTER REQUIREMENT (MANDATORY):
Deepen "${charName}"'s presence 10x. Character: ${charDesc}
- ${charType !== 'video' ? `All visual prompts must feature ${charName} prominently.` : ''}
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
                    model: "gemini-2.5-flash",
                    contents: `Based on this critique, generate a 10x stronger viral storyboard.

ORIGINAL SCRIPT:
${script}

CRITIQUE:
${critique}
${characterImproveBlock}

STRUCTURAL PRESERVATION (MANDATORY):
- Return EXACTLY ${expectedSegments} segments in improvedTimeline — no merging, splitting, or deleting.
- Preserve each segment's index exactly (0 through ${expectedSegments - 1}).
- Timing: ${timingConstraint}

VISUAL INTENSITY — every "visual" prompt MUST:
- Have strong subject focus, clear emotional trigger, dynamic/high-contrast lighting
- Append "--ar 9:16" at the end
- Match the "${visualStyle}" style strictly
- Type: ${visualGenerationType === 'video' ? 'VIDEO generation (cinematic motion descriptions)' : 'IMAGE generation (still-frame composition)'}

10X UPGRADE RULES:
1. Hook (index 0): Punchy pattern-interrupt — NO generic openings
2. Every audio line must provoke curiosity, shock, or relatable frustration
3. Cut ALL filler words. Short punchy active-voice sentences
4. Replace vague statements with hyper-specific micro-details
5. Make every visual prompt dramatic, cinematic, hyper-detailed

Also provide: improved hook (1 line max), caption, hashtags, music style, sound effects, editing effects, font style, editing context.`,
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
                                            audio: { type: Type.STRING },
                                            visual: { type: Type.STRING }
                                        },
                                        required: ["index", "startTime", "timestamp", "audio", "visual"]
                                    }
                                },
                                improvedHook: { type: Type.STRING, description: "First 1 line maximum" },
                                improvedCaption: { type: Type.STRING },
                                improvedHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                improvedMusicStyle: { type: Type.STRING },
                                improvedSoundEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                improvedEditingEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                improvedFontStyle: { type: Type.STRING },
                                improvedEditingEffectsContext: { type: Type.STRING }
                            },
                            required: ["improvedSegments", "improvedHook", "improvedCaption", "improvedHashtags", "improvedMusicStyle", "improvedSoundEffects", "improvedEditingEffects", "improvedFontStyle", "improvedEditingEffectsContext"]
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
                let start;
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
                    audio: seg.audio || '',
                    visual
                };
            });
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
            model: "gemini-2.5-flash",
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
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Workflow error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend Proxy running on http://localhost:${PORT}`);
});
