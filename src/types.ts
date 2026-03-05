export interface TrendingTopic {
  name: string;
  velocity: number; // 0-100 score
  growth: 'exploding' | 'steady' | 'declining';
  competition: 'Low' | 'Medium' | 'High';
  targetAudience: string;
  exampleIdea: string;
}

export interface DNAFactor {
  subject: string;
  value: number;
}

export interface TrendAnalysis {
  trendingTopics: TrendingTopic[];
  viralFormats: string[];
  hooks: string[];
  videoStructures: string[];
  popularMusic: string[];
  hashtagPatterns: string[];
  nicheDNA: DNAFactor[];
}

/**
 * Legacy interface — kept for the /api/improve internal timeline line extraction only.
 * All new generation uses TimelineSegment.
 */
export interface ScriptSegment {
  timestamp: string;
  text: string;
}

/**
 * Unified storyboard segment produced by the Storyboard Engine.
 * Replaces the old ScriptSegment+imagePrompts pair.
 */
export interface TimelineSegment {
  index: number;
  startTime: number;   // seconds from start (e.g. 0, 4, 8...)
  endTime: number;     // seconds from start (e.g. 4, 8, 12...)
  timestamp: string;   // MM:SS format
  audio: string;       // spoken script for this segment
  visual: string;      // image/video generation prompt (incl. --ar 9:16)
}

export interface ProductionTimeline {
  title: string;
  hook: string;
  segments: TimelineSegment[];
  metadata: {
    music: string;
    sfx: string[];
    tags: string[];
  }
}

export interface ContentIdea extends ProductionTimeline {
  musicStyle: string;
  soundEffects: string[];
  hashtags: string[];
  visualStyle: string;
  hookVariations: { type: string; text: string }[];
  seoMetadata: {
    youtubeTitle: string;
    youtubeDescription: string;
    pinnedCommentIdea: string;
  };
  coachingTips: string;
  editingEffects: string[];
  fontStyle: string;
  editingEffectsContext: string;
  segmentLength?: number; // seconds per segment (undefined in fixed/dynamic mode)
}

export interface ProductionWorkflow {
  software: {
    voiceGen: string;
    imageGen: string;
    videoGen: string;
    editing: string;
  };
  steps: string[];
  optimizationTips: string[];
}

export const VISUAL_STYLES = [
  "Cinematic & Photorealistic",
  "Anime / Studio Ghibli",
  "3D Pixar / Disney Style",
  "Cyberpunk / Neon",
  "Dark Fantasy",
  "Minimalist Vector Art",
  "Vintage 90s VHS",
  "Vaporwave / Retro",
  "Watercolor Art",
  "Claymation / Stop Motion",
  "Comic Book / Pop Art",
  "Low Poly 3D",
  "3D Render",
  "Oil Painting",
  "Sketch",
  "Pixel Art",
  "Glitch",
  "Surrealism",
];

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  analysis: TrendAnalysis;
}

/**
 * A user-defined character injected into all AI generation prompts.
 * Must have a name and a detailed description (≥50 words).
 */
export interface CustomCharacter {
  name: string;
  description: string;
  type: 'image' | 'video' | 'both';
}

export interface RetentionLeak {
  timestamp: number; // seconds (0-60)
  issue: string;
}

export interface ScriptCritique {
  retentionLeaks: RetentionLeak[];
  viralityScore: number;
  hookSuggestions: string[];
  overallFeedback: string;
  improvedSegments?: TimelineSegment[];
  improvedHook?: string;
  improvedCaption?: string;
  improvedHashtags?: string[];
  improvedMusicStyle?: string;
  improvedSoundEffects?: string[];
  improvedEditingEffects?: string[];
  improvedFontStyle?: string;
  improvedEditingEffectsContext?: string;
}

export interface AppState {
  analysis: TrendAnalysis | null;
  contentIdea: ContentIdea | null;
  workflow: ProductionWorkflow | null;
  critique: ScriptCritique | null;
  isLoading: boolean;
  error: string | null;
  selectedVisualStyle: string;
  visualGenerationType: 'image' | 'video';
  segmentLength: number;
  customSegmentLength: number | null;
  history: HistoryItem[];
  searchQuery: string;
  currentAnalyzedQuery: string;
  // Custom Character System
  useCustomCharacter: boolean;
  customCharacter: CustomCharacter;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
