// --- URL Analysis Temporary File ---
// I need to add this block of code below the /api/analyze endpoint in server/index.js

import { YoutubeTranscript } from 'youtube-transcript';

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
        } catch(e) { /* ignore invalid url parsing here, transcript will throw */ }

        if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL.' });

        console.log("Fetching transcript for video ID:", videoId);
        let transcriptText = "";
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            transcriptText = transcript.map(t => t.text).join(' ');
        } catch(e) {
            console.error("Transcript fetch failed:", e.message);
            return res.status(400).json({ error: 'Could not fetch transcript for this video. It might not have captions enabled.' });
        }
        
        const response = await generateWithFallback({
            model: "gemini-3.1-flash-lite-preview",
            contents: `Analyze this viral YouTube video transcript: 
"${transcriptText.slice(0, 15000)}" // limit to ~30 mins of speech

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
                // we can reuse the trend analysis schema here since we want the same output shape
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
        const parsed = JSON.parse(response.text);
        res.json(parsed);

    } catch (error) {
        console.error("URL Analysis error:", error);
        res.status(error.status || 500).json({ error: safeError(error) });
    }
});
