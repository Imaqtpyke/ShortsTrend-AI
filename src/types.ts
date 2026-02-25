export interface TrendingTopic {
  name: string;
  velocity: number; // 0-100 score
  growth: 'exploding' | 'steady' | 'declining';
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

export interface ScriptSegment {
  timestamp: string;
  text: string;
}

export interface ContentIdea {
  title: string;
  script: ScriptSegment[];
  imagePrompts: { frame: string; prompt: string }[];
  musicStyle: string;
  soundEffects: string[];
  visualStyle: string;
  hook: string;
  caption: string;
  hashtags: string[];
  coachingTips: string;
  editingEffects: string[];
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
];

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  analysis: TrendAnalysis;
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
  improvedScript: ScriptSegment[];
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
  history: HistoryItem[];
  searchQuery: string;
  isDarkMode: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
