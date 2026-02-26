import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.post('/api/critique', async (req, res) => {
    try {
        const { script, hook } = req.body;
        const response = await ai.models.generateContent({
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
        const { script, critique } = req.body;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following script and its critique, generate a highly optimized, viral version of the script.
      
      Original Script: "${script}"
      Critique: "${critique}"

      Requirements for the Improved Script:
      1. EXTREME GRANULARITY: Break the script down into very small segments. Every sentence, major comma, significant event, or change in mood/climate must have its own timestamp.
      2. TIMESTAMPS: Use precise timestamps (e.g., 00:00, 00:02, 00:05).
      3. PACING: Ensure the pacing is fast and engaging for YouTube Shorts.
      4. VISUAL PROMPTS: For every single script segment, provide a matching high-quality visual prompt for AI generation. The prompts must reflect the specific "climate" or "event" mentioned in that segment.
      5. DURATION: The total duration of the script must be at least 60 seconds (1 minute). Ensure there is enough content to fill this time.`,
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
                        }
                    },
                    required: ["improvedScript", "improvedImagePrompts"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Improve error:", error);
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { niche } = req.body;
        const prompt = niche
            ? `Search for and analyze the current top YouTube Shorts trends specifically within the niche: "${niche}". Focus on trending topics, viral formats, hooks, structures, music, and hashtags relevant to this niche.`
            : "Search for and analyze the current top YouTube Shorts trends for this week. Focus on trending topics, viral formats, hooks, structures, music, and hashtags.";

        const response = await ai.models.generateContent({
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
                                    growth: { type: Type.STRING, enum: ["exploding", "steady", "declining"] }
                                },
                                required: ["name", "velocity", "growth"]
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
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Analyze error:", error);
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { trend, visualStyle, visualGenerationType, temperature, targetAudience, tone } = req.body;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a complete YouTube Shorts content idea based on this trend: "${trend}".
      
      Target Audience: "${targetAudience}"
      Tone: "${tone}"

      CRITICAL INSTRUCTIONS FOR VISUAL PROMPTS:
      1. The visual prompts MUST be extremely granular. Provide a new prompt for EVERY SINGLE sentence, comma, pause, or change in scenario/climate/emotion.
      2. A 60-second script should have at least 15-25 distinct visual prompts to match the fast-paced nature of Shorts.
      3. The visual style for ALL prompts must strictly follow: "${visualStyle}". Describe the lighting, camera angle, and atmosphere in each prompt to match this style.
      4. The prompts are for ${visualGenerationType === 'video' ? 'VIDEO generation (e.g. Veo, Runway, Pika)' : 'IMAGE generation (e.g. Midjourney, Flux)'}. Adjust the description accordingly (e.g. "Cinematic tracking shot of..." for video vs "High resolution photo of..." for image).

      CRITICAL INSTRUCTIONS FOR EDITING EFFECTS:
      Provide specific recommendations for visual effects, transitions, and post-production techniques (e.g., "Ken Burns effect on static images", "Glitch transitions during beat drops", "Dynamic text overlays for key phrases") that will make the video dynamic and engaging. Also, provide a short contextual explanation for why these effects are suitable for the story.

      CRITICAL INSTRUCTIONS FOR FONT STYLE:
      Recommend a specific font style (e.g., "Bold Sans-serif", "Handwritten Script", "Futuristic Display") that is suitable for the story and visual style, and explain why.

      The script must be exactly 1 minute long when read at a normal pace. Break the script down into segments with timestamps.`,
            config: {
                temperature: temperature,
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
                                    prompt: { type: Type.STRING, description: `9:16 vertical ${visualGenerationType} prompt` },
                                },
                                required: ["frame", "prompt"],
                            },
                        },
                        musicStyle: { type: Type.STRING },
                        soundEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                        visualStyle: { type: Type.STRING },
                        hook: { type: Type.STRING, description: "First 1-3 seconds" },
                        caption: { type: Type.STRING },
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
                    required: ["title", "script", "imagePrompts", "musicStyle", "soundEffects", "visualStyle", "hook", "caption", "hashtags", "coachingTips", "editingEffects", "fontStyle", "editingEffectsContext"],
                },
            },
        });

        if (!response.text) throw new Error("No response text from Gemini API");
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Generate error:", error);
        res.status(error.status || 500).json({ error: error.message || "Unknown error" });
    }
});

app.post('/api/workflow', async (req, res) => {
    try {
        const response = await ai.models.generateContent({
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
