export type ContentGenre =
  | 'Storytelling'
  | 'POV'
  | 'Action'
  | 'Timelapse'
  | 'Horror'
  | 'Comedy'
  | 'Documentary'
  | 'Educational'
  | 'Cinematic'
  | 'Motivational'
  | 'Tutorial'
  | 'Vlog'
  | 'Gaming'
  | 'Fitness'
  | 'Travel'
  | 'Food'
  | 'Fashion'
  | 'Mystery'
  | 'ASMR'
  | 'Interview'
  | 'Restoration';

export const CONTENT_GENRES: ContentGenre[] = [
  'Storytelling',
  'POV',
  'Action',
  'Documentary',
  'Motivational',
  'Restoration'
];

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
  id: string;          // Stable unique ID for DND and list keys
  index: number;
  startTime: number;   // seconds from start (e.g. 0, 4, 8...)
  endTime: number;     // seconds from start (e.g. 4, 8, 12...)
  timestamp: string;   // MM:SS format
  script: string;      // narration / voiceover script for this segment
  visual: string;      // image/video generation prompt (incl. --ar 9:16)
  motion?: string;     // AI generated motion instructions for video types
  cutType?: 'hard_cut' | 'soft_transition' | 'hold_zoom' | 'impact' | 'zoom_shift' | 'smash_cut';
  copiedScript?: boolean; // UI state: user marked script as copied
  copiedVisual?: boolean; // UI state: user marked visual as copied
  copiedMotion?: boolean; // UI state: user marked motion as copied
}

export interface ProductionTimeline {
  title: string;
  hook: string;
  segments: TimelineSegment[];
  metadata: {
    tags: string[];
  }
}

export interface ContentIdea extends ProductionTimeline {
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
  "Minimalist Vector Art",
  "Vintage 90s VHS",
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
  visualGenerationType: 'image' | 'video' | 'image-to-video';
  segmentLength: number;
  customSegmentLength: number | null;
  segmentMode: 'adjustable' | 'fixed';
  history: HistoryItem[];
  searchQuery: string;
  currentAnalyzedQuery: string;
  // Custom Character System
  useCustomCharacter: boolean;
  customCharacter: CustomCharacter;
  // Genre System
  selectedGenre: ContentGenre;
  useCustomGenre: boolean;
  customGenreString: string;
  // Custom Style Feature State
  useCustomStyle: boolean;
  // Direct Idea Feature State
  searchMode: 'keyword' | 'url' | 'idea';
  directIdea: string;
  showPreGenModal: boolean;
  showTimelineEditorModal: boolean;
  pendingTrend: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
