import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' })); // Prevent oversized payloads

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── Input Sanitization ────────────────────────────────────────────────────────
// Strips prompt injection attempts before injecting user content into prompts.
const MAX_INPUT_LENGTH = 500;
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

async function generateStreamWithFallback(requestConfig, res) {
    let lastError = null;

    for (const model of MODEL_CASCADE) {
        try {
            console.log(`[Model] Trying ${model} (stream)...`);
            const stream = await ai.models.generateContentStream({ ...requestConfig, model });
            console.log(`[Model] Success with ${model} (stream started)`);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const chunk of stream) {
                if (chunk.text) {
                    res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        } catch (err) {
            const status = err?.status ?? err?.code ?? 0;
            if (res.headersSent) {
                // Too late to fallback if headers already sent
                console.error("[Model] Stream failed mid-flight", err);
                res.write(`data: ${JSON.stringify({ error: err.message || "Interrupted" })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }
            if (RETRYABLE_CODES.has(status)) {
                console.warn(`[Model] ${model} failed (${status}) during stream init. Trying next model...`);
                lastError = err;
                continue;
            }
            throw err;
        }
    }

    console.error('[Model] All models in cascade failed (stream).');
    if (lastError && (lastError.status === 429 || lastError.code === 429)) {
        res.status(429).json({ error: "API overload. Please wait a minute, the Google model is busy." });
        return;
    }
    res.status(lastError?.status || 500).json({ error: lastError?.message || "All fallback models failed" });
}



app.post('/api/critique', async (req, res) => {
    try {
        const script = sanitizeInput(req.body.script);
        const hook = sanitizeInput(req.body.hook);
        if (!script) return res.status(400).json({ error: 'Script is required.' });
        const response = await generateWithFallback({
            model: "gemini-2.5-flash",
            contents: `Analyze this YouTube Shorts script and hook for virality.
      
      Hook: "${hook}"
      Script: "${script}"

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
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/improve', async (req, res) => {
    try {
        const script = sanitizeInput(req.body.script);
        const critique = sanitizeInput(req.body.critique);
        const visualStyle = sanitizeInput(req.body.visualStyle) || 'Default';
        const { visualGenerationType, videoDuration } = req.body;
        if (!script) return res.status(400).json({ error: 'Script is required.' });

        let extraInstructions = "";
        let originalTimeline = "";

        if (script) {
            originalTimeline = script.split('\n').filter(line => line.trim().startsWith('[')).join('\n');
        }

        if (videoDuration) {
            let minWords = Math.floor(videoDuration * 1.2);
            let maxWords = Math.floor(videoDuration * 1.5);

            if (videoDuration === 8) {
                minWords = 10;
                maxWords = 13;
            } else if (videoDuration <= 6) {
                minWords = 8;
                maxWords = 10;
            }

            extraInstructions = `\n      4. STRICT STRUCTURAL PRESERVATION: You are receiving an original script with a specific number of segmented blocks and timestamps. You MUST return EXACTLY the same number of segment blocks. Do not combine, merge, or delete frames. Keep the exact timestamps identical to the original script provided. Only refine the dialogue inside. You must preserve the original narrative progression and scene order. Do not reorder segments.
      - EXACT ORIGINAL TIMELINE TO FOLLOW:\n${originalTimeline}
      - TIMESTAMPS: Format the timestamp as a duration range reflecting the specific start and end time of each chunk.
      - WORD LIMIT: You MUST write between ${minWords} and ${maxWords} words total to ensure a natural 1.5 words/second speaking pace.`;
        }

        let result = null;
        let attempts = 0;
        const maxAttempts = 3;

        let originalTimelineLines = [];
        if (script) {
            originalTimelineLines = script.split('\n').filter(line => line.trim().startsWith('['));
        }
        const expectedSegments = originalTimelineLines.length;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await generateWithFallback({
                    model: "gemini-2.5-flash",
                    contents: `Based on the following script and its critique, generate a highly optimized, viral version of the script.
          
          Original Script: "${script}"
          Critique: "${critique}"
    
          Requirements for the Improved Script:
          1. Shorten the Hook: Ensure the opening hook is punchy and high-energy.
          2. Enhance, Do NOT Lessen: You must ENHANCE the script's vocabulary, flow, and impact without chopping or deeply shortening the narrative. Retain the same amount of detail and spoken lines, but make them more viral and engaging. 
          3. Precise Timestamps: Use the exact timestamps from the original script.${extraInstructions}
    
    
          Additionally, you must re-generate updated metadata that fits this newly improved script, including:
          - A shortened, punchy hook (1 line max).
          - A catchy caption and hashtags.
          - Updated audio design (music style and sound effects).
          - Editing and post-production advice (editing effects, font style, and context).
    
          CRITICAL INSTRUCTIONS FOR VISUAL PROMPTS:
          1. Extremely Granular: Provide a new prompt for EVERY SINGLE script segment.
          2. Strict Visual Style: Every single prompt MUST strictly match the "${visualStyle}" style. Do not default to generic styles.
          3. Prompt Type: The prompts are for ${visualGenerationType === 'video' ? 'VIDEO generation (e.g., Veo, Runway)' : 'IMAGE generation (e.g., Midjourney, Flux)'}. Format the description strictly for this medium (e.g., "Cinematic tracking shot..." for video).
          4. 9:16 Aspect Ratio: Explicitly add exactly "--ar 9:16" at the very end of EVERY distinct visual prompt. Descriptions must be optimized for a vertical, mobile-first composition.
          5. Visual Direction: Include specific lighting and camera movement instructions formatted to match the vertical 9:16 frame.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                improvedScript: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            timestamp: { type: Type.STRING, description: "Start time (e.g. 00:00)" },
                                            text: { type: Type.STRING, description: "Spoken text or action description" }
                                        },
                                        required: ["timestamp", "text"]
                                    }
                                },
                                improvedImagePrompts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            frame: { type: Type.STRING, description: "Timestamp (e.g. 00:00)" },
                                            prompt: { type: Type.STRING, description: "Detailed visual prompt" }
                                        },
                                        required: ["frame", "prompt"]
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
                            required: ["improvedScript", "improvedImagePrompts", "improvedHook", "improvedCaption", "improvedHashtags", "improvedMusicStyle", "improvedSoundEffects", "improvedEditingEffects", "improvedFontStyle", "improvedEditingEffectsContext"],
                        },
                    },
                });

                if (!response.text) throw new Error("No response text from Gemini API");
                const parsed = JSON.parse(response.text);

                if (expectedSegments > 0 && parsed.improvedScript.length !== expectedSegments) {
                    throw new Error(`Validation failed: Expected exactly ${expectedSegments} segments, but LLM generated ${parsed.improvedScript.length}.`);
                }

                result = parsed;
                break; // Validation passed!
            } catch (err) {
                console.warn(`[Improve Attempt ${attempts}] failed:`, err.message);
                if (attempts >= maxAttempts) {
                    return res.status(500).json({ error: "Failed to generate valid structure after multiple attempts." });
                }
            }
        }

        // Strictly enforce original timestamps and AR tags
        if (result.improvedScript && result.improvedScript.length === expectedSegments) {
            result.improvedScript = result.improvedScript.map((segment, index) => {
                const originalMatch = originalTimelineLines[index].match(/\[(.*?)\]/);
                const exactTimestamp = originalMatch ? originalMatch[1] : segment.timestamp;

                if (result.improvedImagePrompts && result.improvedImagePrompts[index]) {
                    result.improvedImagePrompts[index].frame = exactTimestamp;
                    let prompt = result.improvedImagePrompts[index].prompt.trim();
                    if (!prompt.includes('--ar 9:16')) {
                        prompt = `${prompt} --ar 9:16`;
                    }
                    result.improvedImagePrompts[index].prompt = prompt;
                }

                return { ...segment, timestamp: exactTimestamp };
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Improve error:", error);
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const niche = sanitizeInput(req.body.niche);
        const cacheKey = niche ? niche.toLowerCase() : '__general__';

        // Serve from cache if available
        const cached = getCachedAnalysis(cacheKey);
        if (cached) {
            console.log(`[Cache HIT] /api/analyze for: "${cacheKey}"`);
            return res.json({ ...cached, _cached: true });
        }

        console.log(`[Cache MISS] /api/analyze for: "${cacheKey}"`);
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
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const trend = sanitizeInput(req.body.trend);
        const visualStyle = sanitizeInput(req.body.visualStyle);
        const { visualGenerationType, videoDuration } = req.body;
        if (!trend) return res.status(400).json({ error: 'Trend is required.' });

        let extraInstructions = "";
        let durationInstruction = "      3. The script must be exactly 1 minute long when read at a normal pace. Break the script down into segments with precise timestamps.";

        if (videoDuration) {
            let minWords = Math.floor(videoDuration * 1.2);
            let maxWords = Math.floor(videoDuration * 1.5);

            if (videoDuration === 8) {
                minWords = 10;
                maxWords = 13;
            } else if (videoDuration <= 6) {
                minWords = 8;
                maxWords = 10;
            }

            const fullSegments = Math.floor(60 / videoDuration);
            const remainder = 60 % videoDuration;
            const totalSegments = remainder > 0 ? fullSegments + 1 : fullSegments;

            let roundingInstruction = remainder > 0
                ? ` The first ${fullSegments} segments must be exactly ${videoDuration} seconds each, and the final segment must be exactly ${remainder} seconds to reach 60 seconds total.`
                : ` Every segment must be exactly ${videoDuration} seconds.`;

            durationInstruction = `      3. Break the script down into exactly ${totalSegments} distinct sequential segments.${roundingInstruction} Format the timestamp as a duration range (e.g., 00:00 - 00:08, 00:08 - 00:16) reflecting the exact start and end times of each chunk.`;
            extraInstructions = `\n      4. STRICT STRUCTURAL PRESERVATION: The complete script MUST be a full 60-second video. You MUST output exactly ${totalSegments} separate script segment blocks.
      - WORD LIMIT PER BLOCK: For EVERY distinct segment block, you MUST write between ${minWords} and ${maxWords} words to ensure a natural 1.5 words/second speaking pace.`;
        }

        let result = null;
        let attempts = 0;
        const maxAttempts = 3;

        let expectedSegments = 0;
        if (videoDuration) {
            const remainder = 60 % videoDuration;
            expectedSegments = Math.floor(60 / videoDuration) + (remainder > 0 ? 1 : 0);
        }

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await generateWithFallback({
                    model: "gemini-2.5-flash",
                    contents: `Generate a complete YouTube Shorts content idea based on this trend: "${trend}".
        
              CRITICAL INSTRUCTIONS FOR SCRIPT WRITING:
              1. Hook Variations: Generate 3 distinct hook variations based on psychological triggers (e.g., Curiosity, Direct/Aggressive, Contrarian).
              2. Enhance Segments: Build strong pacing and engaging narrative. Use a natural 1.5 words per second speaking rate.
        ${durationInstruction}${extraInstructions}
        
              CRITICAL INSTRUCTIONS FOR VISUAL PROMPTS:
              1. Extremely Granular: Provide a new prompt for EVERY SINGLE sentence, comma, pause, or change in scenario.
              2. Strict Visual Style: Every single prompt MUST strictly match the "${visualStyle}" style. Do not default to generic styles.
              3. Prompt Type: The prompts are for ${visualGenerationType === 'video' ? 'VIDEO generation (e.g., Veo, Runway)' : 'IMAGE generation (e.g., Midjourney, Flux)'}. Format the description strictly for this medium (e.g., "Cinematic tracking shot..." for video).
              4. 9:16 Aspect Ratio: Explicitly add exactly "--ar 9:16" at the very end of EVERY distinct visual prompt. Descriptions must be optimized for a vertical, mobile-first composition.
              5. Visual Direction: Include specific lighting and camera movement instructions formatted to match the vertical 9:16 frame.
        
              CRITICAL INSTRUCTIONS FOR METADATA:
              Generate SEO-optimized YouTube Shorts metadata including a title, a description (with hashtags embedded), and an engaging pinned comment designed to drive audience interaction.
        
              CRITICAL INSTRUCTIONS FOR EDITING EFFECTS:
              Provide specific recommendations for visual effects, transitions, and post-production techniques. Provide a short contextual explanation for why they suit the story.
        
              CRITICAL INSTRUCTIONS FOR FONT STYLE:
              Recommend a specific font style suitable for the story, and explain why.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                script: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            timestamp: { type: Type.STRING, description: "Start time (e.g. 00:00)" },
                                            text: { type: Type.STRING, description: "Spoken text or action description" }
                                        },
                                        required: ["timestamp", "text"]
                                    },
                                    description: "A full 60-second script broken into segments with timestamps"
                                },
                                imagePrompts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            frame: { type: Type.STRING, description: "Timestamp matching the script segment" },
                                            prompt: { type: Type.STRING, description: `9: 16 vertical ${visualGenerationType} prompt` },
                                        },
                                        required: ["frame", "prompt"],
                                    },
                                },
                                musicStyle: { type: Type.STRING },
                                soundEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                visualStyle: { type: Type.STRING },
                                hookVariations: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING, description: "e.g., Curiosity, Direct, Contrarian" },
                                            text: { type: Type.STRING, description: "The hook script" }
                                        },
                                        required: ["type", "text"]
                                    },
                                },
                                seoMetadata: {
                                    type: Type.OBJECT,
                                    properties: {
                                        youtubeTitle: { type: Type.STRING, description: "SEO optimized short title" },
                                        youtubeDescription: { type: Type.STRING, description: "Algorithm-friendly description" },
                                        pinnedCommentIdea: { type: Type.STRING, description: "Comment to drive engagement" }
                                    },
                                    required: ["youtubeTitle", "youtubeDescription", "pinnedCommentIdea"]
                                },
                                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                coachingTips: { type: Type.STRING },
                                editingEffects: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "Recommended visual effects and transitions for editing"
                                },
                                fontStyle: { type: Type.STRING, description: "Recommended font style for text overlays" },
                                editingEffectsContext: { type: Type.STRING, description: "Contextual explanation for editing effects" }
                            },
                            required: ["title", "script", "imagePrompts", "musicStyle", "soundEffects", "visualStyle", "hookVariations", "seoMetadata", "hashtags", "coachingTips", "editingEffects", "fontStyle", "editingEffectsContext"],
                        },
                    },
                });

                if (!response.text) throw new Error("No response text from Gemini API");
                const parsed = JSON.parse(response.text);

                if (expectedSegments > 0 && parsed.script.length !== expectedSegments) {
                    throw new Error(`Validation failed: Expected exactly ${expectedSegments} segments, but LLM generated ${parsed.script.length}.`);
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

        // Mathematically enforce exact timestamps so we don't rely on LLM formatting
        if (result.script && result.script.length > 0) {
            result.script = result.script.map((segment, index) => {
                let startTimeSecs, endTimeSecs;

                if (videoDuration) {
                    startTimeSecs = index * videoDuration;
                    endTimeSecs = Math.min(startTimeSecs + videoDuration, 60);
                } else {
                    const segmentDuration = 60 / result.script.length;
                    startTimeSecs = Math.floor(index * segmentDuration);
                    endTimeSecs = Math.floor((index + 1) * segmentDuration);
                }

                const formatTime = (secs) => {
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                };

                const exactTimestamp = `${formatTime(startTimeSecs)} – ${formatTime(endTimeSecs)}`;

                if (result.imagePrompts && result.imagePrompts[index]) {
                    result.imagePrompts[index].frame = exactTimestamp;
                    let prompt = result.imagePrompts[index].prompt.trim();
                    if (!prompt.includes('--ar 9:16')) {
                        prompt = `${prompt} --ar 9:16`;
                    }
                    result.imagePrompts[index].prompt = prompt;
                }

                return { ...segment, timestamp: exactTimestamp };
            });
        }

        res.json(result);

    } catch (error) {
        console.error("Generate error:", error);
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
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
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend Proxy running on http://localhost:${PORT}`);
});
