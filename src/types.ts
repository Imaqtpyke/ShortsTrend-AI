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

export type ScriptPersona = 'Narrator' | 'First-Person' | 'Character' | 'Interview';

export type TargetPlatform = 'YouTube Shorts' | 'TikTok' | 'Instagram Reels' | 'Facebook Reels' | 'All Platforms';

export const PLATFORM_DURATION_DEFAULTS: Record<TargetPlatform, number> = {
  'YouTube Shorts': 60,
  'TikTok': 15,
  'Instagram Reels': 30,
  'Facebook Reels': 45,
  'All Platforms': 60,
};

export const PLATFORM_DURATION_MAX: Record<TargetPlatform, number> = {
  'YouTube Shorts': 60,
  'TikTok': 60,
  'Instagram Reels': 60,
  'Facebook Reels': 60,
  'All Platforms': 60,
};

export const PLATFORM_DURATION_NOTES: Record<TargetPlatform, string> = {
  'YouTube Shorts': 'YouTube Shorts maxes at 60s. 50-60s performs best for retention.',
  'TikTok': 'TikTok sweet spot is 7-15s for virality, up to 60s for storytelling.',
  'Instagram Reels': 'Reels sweet spot is 15-30s. Shorter clips get more replays.',
  'Facebook Reels': 'Facebook Reels performs best at 30-45s for emotional storytelling.',
  'All Platforms': 'Keep under 60s for cross-platform compatibility.',
};

export const CONTENT_GENRES: ContentGenre[] = [
  'Storytelling',
  'POV',
  'Action',
  'Documentary',
  'Motivational',
  'Restoration'
];

export const PERSONA_DESCRIPTIONS: Record<ScriptPersona, string> = {
  Narrator: "Third-person authoritative voice. Speaks about subjects from the outside. Cinematic and objective tone.",
  'First-Person': "Creator speaks as themselves. Authentic, personal, direct. Uses I, me, my. Builds parasocial connection.",
  Character: "Script is written for a fictional or recurring character persona. Consistent voice, catchphrases, and worldview across all segments.",
  Interview: "Question and answer format. Creator poses questions then answers them. Creates natural curiosity gaps."
};

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

export interface ABTestVariant {
  label: string;
  hook: string;
  title: string;
  thumbnailText: string;
  testHypothesis: string;
  suggestedAudience: string;
  platformFit: string;
  testInstructions: string;
}

export interface ABTestPack {
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  variantC: ABTestVariant;
}

export interface ContentIdea extends ProductionTimeline {
  hashtags: string[];
  visualStyle: string;
  hookVariations: { type: string; text: string }[];
  abTestPack?: ABTestPack;
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

export interface BrandProfile {
  brandName: string;
  creatorVoice: string;
  bannedWords: string;
  ctaStyle: string;
  visualRules: string;
  targetAudienceDescription: string;
  contentPillars: string;
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
  previousContentIdea: ContentIdea | null;
  workflow: ProductionWorkflow | null;
  critique: ScriptCritique | null;
  isLoading: boolean;
  error: string | null;
  selectedVisualStyle: string;
  visualGenerationType: 'image' | 'video' | 'image-to-video';
  totalDuration: number;
  segmentLength: number;
  customSegmentLength: number | null;
  segmentMode: 'adjustable' | 'fixed';
  history: HistoryItem[];
  searchQuery: string;
  currentAnalyzedQuery: string;
  // Custom Character System
  useCustomCharacter: boolean;
  customCharacter: CustomCharacter;
  useBrandMemory: boolean;
  brandProfile: BrandProfile;
  // Genre System
  selectedGenre: ContentGenre;
  selectedPlatform: TargetPlatform;
  useCustomGenre: boolean;
  customGenreString: string;
  selectedPersona: ScriptPersona;
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
