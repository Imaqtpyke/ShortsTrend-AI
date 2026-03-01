import { create } from 'zustand';
import { AppState, HistoryItem, Toast, VISUAL_STYLES } from '../types';
import { analyzeTrends, generateContentIdea, critiqueScript, generateImprovement } from '../services/geminiService';
import localforage from 'localforage';

localforage.config({
    name: 'ShortsTrendAI',
    storeName: 'app_state'
});

interface AppStore extends AppState {
    // UI State
    isHydrated: boolean;
    initStore: () => Promise<void>;
    activeTab: 'trends' | 'generator' | 'workflow' | 'history' | 'critique';
    setActiveTab: (tab: 'trends' | 'generator' | 'workflow' | 'history' | 'critique') => void;

    // Feature State
    selectedTrend: string | null;
    setSelectedTrend: (trend: string | null) => void;
    trendFilter: 'all' | 'exploding' | 'steady' | 'declining';
    setTrendFilter: (filter: 'all' | 'exploding' | 'steady' | 'declining') => void;
    completedSteps: number[];
    setCompletedSteps: (steps: number[]) => void;
    historySearch: string;
    setHistorySearch: (search: string) => void;
    confirmApply: boolean;
    setConfirmApply: (confirm: boolean) => void;
    confirmClearHistory: boolean;
    setConfirmClearHistory: (confirm: boolean) => void;

    // Toast & Theme System
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: string) => void;
    copiedId: string | null;
    copyToClipboard: (text: string, id: string) => void;
    copyAllForProduction: () => void;

    // Generation Settings
    setSearchQuery: (query: string) => void;
    setVisualStyle: (style: string) => void;
    setVisualGenerationType: (type: 'image' | 'video') => void;
    setVideoDuration: (duration: number) => void;
    setCustomVideoDuration: (duration: number | null) => void;

    // Phase 5: UX Improvements
    loadingMessage: string;
    setLoadingMessage: (msg: string) => void;
    updateScriptSegment: (index: number, newText: string) => void;

    // Actions
    resetApp: () => void;
    handleAnalyze: (queryOverride?: string) => Promise<void>;
    handleGenerate: (trend: string) => Promise<void>;
    handleCritique: () => Promise<void>;
    handleImprove: () => Promise<void>;
    applyImprovedScript: () => void;
    loadFromHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
}

// ─── Persistence Helpers ───────────────────────────────────────────────────────
const SESSION_KEY = 'shorts_trend_session';

interface PersistedSession {
    analysis: AppState['analysis'];
    contentIdea: AppState['contentIdea'];
    critique: AppState['critique'];
    workflow: AppState['workflow'];
    searchQuery: string;
    savedAt: number;
}

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

async function persistSession(partial: Partial<PersistedSession>) {
    try {
        const raw = await localforage.getItem<string>(SESSION_KEY);
        let current: Partial<PersistedSession> = {};
        if (raw) current = JSON.parse(raw);

        const next: PersistedSession = {
            analysis: partial.analysis !== undefined ? partial.analysis : current.analysis ?? null,
            contentIdea: partial.contentIdea !== undefined ? partial.contentIdea : current.contentIdea ?? null,
            critique: partial.critique !== undefined ? partial.critique : current.critique ?? null,
            workflow: partial.workflow !== undefined ? partial.workflow : current.workflow ?? null,
            searchQuery: partial.searchQuery !== undefined ? partial.searchQuery : current.searchQuery ?? '',
            savedAt: Date.now(),
        };
        await localforage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
        console.error("Failed to persist session to localforage");
    }
}

export const useAppStore = create<AppStore>((set, get) => ({
    // Initial AppState
    isHydrated: false,
    analysis: null,
    contentIdea: null,
    workflow: null,
    critique: null,
    isLoading: false,
    error: null,
    selectedVisualStyle: VISUAL_STYLES[0],
    visualGenerationType: 'image',
    videoDuration: 6,
    customVideoDuration: null,
    history: [],
    searchQuery: '',

    // Initial UI/Feature State
    activeTab: 'trends',
    setActiveTab: (tab) => set({ activeTab: tab }),
    selectedTrend: null,
    setSelectedTrend: (trend) => set({ selectedTrend: trend }),
    trendFilter: 'all',
    setTrendFilter: (filter) => set({ trendFilter: filter }),
    completedSteps: [],
    setCompletedSteps: (steps) => set({ completedSteps: steps }),
    historySearch: '',
    setHistorySearch: (search) => set({ historySearch: search }),
    confirmApply: false,
    setConfirmApply: (confirm) => set({ confirmApply: confirm }),
    confirmClearHistory: false,
    setConfirmClearHistory: (confirm) => set({ confirmClearHistory: confirm }),

    // Toasts
    toasts: [],
    addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 3000);
    },
    removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

    copiedId: null,
    copyToClipboard: (text, id) => {
        navigator.clipboard.writeText(text);
        set({ copiedId: id });
        get().addToast('Copied to clipboard!', 'success');
        setTimeout(() => set({ copiedId: null }), 2000);
    },
    copyAllForProduction: () => {
        const { contentIdea, copyToClipboard } = get();
        if (!contentIdea) return;
        const { title, script, hookVariations, seoMetadata, hashtags, musicStyle, soundEffects, visualStyle, imagePrompts, editingEffects, fontStyle, editingEffectsContext } = contentIdea;

        const text = `TITLE: ${title}\n\nHOOKS:\n${hookVariations?.map(h => `- [${h.type}]: ${h.text}`).join('\n') || 'None'}\n\nSCRIPT:\n${script.map(s => `[${s.timestamp}] ${s.text}`).join('\n')}\n\nVISUAL STYLE: ${visualStyle}\n\nSTORYBOARD PROMPTS:\n${imagePrompts?.map(p => `[${p.frame}] ${p.prompt}`).join('\n') || 'None Generated'}\n\nAUDIO:\nMusic: ${musicStyle}\nSFX: ${soundEffects.join(', ')}\n\nPOST-PRODUCTION & EFFECTS:\nFont Style: ${fontStyle}\nEditing Effects: ${editingEffects.join(', ')}\nContext: ${editingEffectsContext}\n\nSEO METADATA:\nTitle: ${seoMetadata?.youtubeTitle}\nDescription: ${seoMetadata?.youtubeDescription}\nPinned Comment: ${seoMetadata?.pinnedCommentIdea}\n${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`.trim();

        copyToClipboard(text, 'all');
    },

    // Generation Settings Setters
    setSearchQuery: (query) => set({ searchQuery: query }),
    setVisualStyle: (style) => set({ selectedVisualStyle: style }),
    setVisualGenerationType: (type) => set({ visualGenerationType: type }),
    setVideoDuration: (duration) => set({ videoDuration: duration }),
    setCustomVideoDuration: (duration) => set({ customVideoDuration: duration }),

    // Phase 5: Progressive Loading & Interactive UI
    loadingMessage: '',
    setLoadingMessage: (msg: string) => set({ loadingMessage: msg }),

    updateScriptSegment: (index: number, newText: string) => set(state => {
        if (!state.contentIdea) return state;
        const newScript = [...state.contentIdea.script];
        newScript[index] = { ...newScript[index], text: newText };
        return { contentIdea: { ...state.contentIdea, script: newScript } };
    }),

    // Actions
    initStore: async () => {
        try {
            const historyRaw = await localforage.getItem<string>('shorts_trend_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            const rawSession = await localforage.getItem<string>(SESSION_KEY);
            let session: Partial<PersistedSession> = {};
            if (rawSession) {
                const parsed: PersistedSession = JSON.parse(rawSession);
                if (Date.now() - parsed.savedAt <= SESSION_MAX_AGE_MS) {
                    session = parsed;
                } else {
                    await localforage.removeItem(SESSION_KEY);
                }
            }

            set({
                history,
                analysis: session.analysis ?? null,
                contentIdea: session.contentIdea ?? null,
                workflow: session.workflow ?? null,
                critique: session.critique ?? null,
                searchQuery: session.searchQuery ?? '',
                isHydrated: true
            });
        } catch (e) {
            console.error('Failed to init store from localforage', e);
            set({ isHydrated: true });
        }
    },

    resetApp: () => {
        try { localforage.removeItem(SESSION_KEY); } catch { }
        set({
            analysis: null,
            contentIdea: null,
            critique: null,
            workflow: null,
            searchQuery: '',
            activeTab: 'trends'
        });
    },

    handleAnalyze: async (queryOverride?: string) => {
        const state = get();
        const query = queryOverride !== undefined ? queryOverride : state.searchQuery;
        set({ isLoading: true, error: null, loadingMessage: "Analyzing niche topics... This might take a few moments." });

        try {
            const analysis = await analyzeTrends(query || undefined);
            const newHistoryItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                query: query || 'General Trends',
                timestamp: Date.now(),
                analysis,
            };

            const newHistory = [newHistoryItem, ...state.history].slice(0, 10);
            try { await localforage.setItem('shorts_trend_history', JSON.stringify(newHistory)); } catch (e) { console.error("History save failed", e); }

            set({
                analysis,
                isLoading: false,
                history: newHistory,
                activeTab: 'trends'
            });
            persistSession({ analysis, searchQuery: query || '' });
        } catch (err) {
            console.error(err);
            set({ isLoading: false, error: 'Failed to analyze trends. Please try again.' });
        }
    },

    handleGenerate: async (trend: string) => {
        const state = get();
        set({ selectedTrend: trend, isLoading: true, error: null, loadingMessage: "Analyzing virality potential for " + trend + "..." });

        const timers: NodeJS.Timeout[] = [];

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Generating visual hooks and scene setups..." });
            }, 3000));
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Writing the script segments..." });
            }, 6000));

            const finalVideoDuration = state.customVideoDuration || state.videoDuration;

            let startedStreaming = false;

            const ideaPromise = generateContentIdea(
                trend,
                state.selectedVisualStyle,
                state.visualGenerationType,
                finalVideoDuration,
                (partial) => {
                    if (!startedStreaming) {
                        startedStreaming = true;
                        set({ isLoading: false, activeTab: 'generator', critique: null });
                    }

                    const partialIdea = {
                        title: partial.title || "Drafting Idea...",
                        script: partial.script || [],
                        imagePrompts: partial.imagePrompts || [],
                        musicStyle: partial.musicStyle || "Processing...",
                        soundEffects: partial.soundEffects || [],
                        visualStyle: partial.visualStyle || state.selectedVisualStyle,
                        hookVariations: partial.hookVariations || [],
                        seoMetadata: partial.seoMetadata || { youtubeTitle: "...", youtubeDescription: "...", pinnedCommentIdea: "..." },
                        hashtags: partial.hashtags || [],
                        coachingTips: partial.coachingTips || "",
                        editingEffects: partial.editingEffects || [],
                        fontStyle: partial.fontStyle || "...",
                        editingEffectsContext: partial.editingEffectsContext || "",
                        videoDuration: state.visualGenerationType === 'image' ? undefined : finalVideoDuration
                    };

                    set({ contentIdea: partialIdea });
                }
            );

            const idea = await ideaPromise;
            const builtIdea = { ...idea, videoDuration: state.visualGenerationType === 'image' ? undefined : finalVideoDuration };

            const hardcodedWorkflow = {
                software: {
                    voiceGen: "ElevenLabs (for ultra-realistic cloning)",
                    imageGen: "Midjourney v6 or Flux (for high-fidelity frames)",
                    videoGen: "Runway Gen-3 or Luma Dream Machine (for motion)",
                    editing: "CapCut or Premiere Pro (for assembly and pacing)"
                },
                steps: [
                    "Export the `.md` script from the Generator to track lines.",
                    "Generate voiceover audio first to establish pacing.",
                    "Generate visuals exactly matching the timeline timestamps.",
                    "Compile in your editor, adding music and SFX."
                ],
                optimizationTips: [
                    "Keep the first 3 seconds visually jarring to stop the scroll.",
                    "Use high-contrast captions to hold visual attention.",
                    "Duck the music volume when the AI voice is speaking."
                ]
            };

            set({ contentIdea: builtIdea, workflow: hardcodedWorkflow, critique: null, isLoading: false, completedSteps: [], activeTab: 'generator' });
            persistSession({ contentIdea: builtIdea, workflow: hardcodedWorkflow, critique: null });
        } catch (err) {
            console.error(err);
            set({ isLoading: false, error: 'Failed to generate content. Please try again.' });
        } finally {
            timers.forEach(clearTimeout);
        }
    },

    handleCritique: async () => {
        const state = get();
        if (!state.contentIdea) return;
        set({ isLoading: true, error: null, loadingMessage: "Running script against viral retention frameworks..." });

        const timers: NodeJS.Timeout[] = [];

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Evaluating hooks and audience retention drops..." });
            }, 3000));

            const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const critique = await critiqueScript(scriptText, state.contentIdea.hookVariations[0]?.text || '');
            set({ critique, isLoading: false, activeTab: 'critique' });
            persistSession({ critique });
        } catch (err) {
            console.error(err);
            set({ isLoading: false, error: 'Failed to critique script. Please try again.' });
        } finally {
            timers.forEach(clearTimeout);
        }
    },

    handleImprove: async () => {
        const state = get();
        if (!state.contentIdea || !state.critique) return;

        set({ isLoading: true, error: null, loadingMessage: "Rewriting script to fix weaknesses..." });

        const timers: NodeJS.Timeout[] = [];

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Designing higher-retention visual storyboard..." });
            }, 4000));

            const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const critiqueText = `Score: ${state.critique.viralityScore}. Feedback: ${state.critique.overallFeedback}`;
            const builtVideoDuration = state.contentIdea.videoDuration || state.videoDuration;
            const improvement = await generateImprovement(scriptText, critiqueText, state.selectedVisualStyle, state.visualGenerationType, builtVideoDuration);

            const improvedScriptText = improvement.improvedScript!.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const newCritique = await critiqueScript(improvedScriptText, improvement.improvedHook || state.contentIdea.hookVariations[0]?.text || '');

            const finalCritique = {
                ...newCritique,
                ...improvement
            };
            set({ isLoading: false, critique: finalCritique });
            persistSession({ critique: finalCritique });
            get().addToast('AI has generated and critiqued an improved version of your script!', 'success');
        } catch (err) {
            console.error(err);
            set({ isLoading: false, error: 'Failed to generate improvement. Please try again.' });
        } finally {
            timers.forEach(clearTimeout);
        }
    },

    applyImprovedScript: () => {
        const state = get();
        if (!state.contentIdea || !state.critique || !state.critique.improvedScript) return;

        const updated = {
            ...state.contentIdea,
            script: state.critique.improvedScript,
            imagePrompts: state.critique.improvedImagePrompts || state.contentIdea.imagePrompts,
            hookVariations: state.critique.improvedHook ? [{ type: 'Improved', text: state.critique.improvedHook }] : state.contentIdea.hookVariations,
            seoMetadata: state.critique.improvedCaption ? { ...state.contentIdea.seoMetadata, youtubeDescription: state.critique.improvedCaption } : state.contentIdea.seoMetadata,
            hashtags: state.critique.improvedHashtags || state.contentIdea.hashtags,
            musicStyle: state.critique.improvedMusicStyle || state.contentIdea.musicStyle,
            soundEffects: state.critique.improvedSoundEffects || state.contentIdea.soundEffects,
            editingEffects: state.critique.improvedEditingEffects || state.contentIdea.editingEffects,
            fontStyle: state.critique.improvedFontStyle || state.contentIdea.fontStyle,
            editingEffectsContext: state.critique.improvedEditingEffectsContext || state.contentIdea.editingEffectsContext
        };
        set({ contentIdea: updated, activeTab: 'generator' });
        persistSession({ contentIdea: updated });
        get().addToast('Improved script and visual prompts applied!', 'success');
    },

    loadFromHistory: (item: HistoryItem) => {
        set({
            analysis: item.analysis,
            searchQuery: item.query === 'General Trends' ? '' : item.query,
            activeTab: 'trends'
        });
        persistSession({ analysis: item.analysis, searchQuery: item.query === 'General Trends' ? '' : item.query });
    },

    clearHistory: async () => {
        set({ history: [] });
        try { await localforage.setItem('shorts_trend_history', JSON.stringify([])); } catch (e) { }
    }
}));

export const useTheme = () => {
    const analysis = useAppStore(state => state.analysis);
    const selectedTrend = useAppStore(state => state.selectedTrend);

    const defaultTheme = {
        primary: 'emerald-500', secondary: 'emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500',
        text: 'text-emerald-500', glow: 'shadow-emerald-500/20', hoverBg: 'hover:bg-emerald-400', hoverBorder: 'hover:border-emerald-500',
        ring: 'focus:ring-emerald-500', focusBorder: 'focus:border-emerald-500', accent: 'emerald', bgOpacity: 'bg-emerald-500/5',
        textAccent: 'text-emerald-400', borderAccent: 'border-emerald-500/30', bgAccent: 'bg-emerald-500/10',
        hoverBgAccent: 'hover:bg-emerald-500/20', borderAccent2: 'border-emerald-500/20', shadowAccent: 'shadow-emerald-500/10',
        groupHoverBg: 'group-hover:bg-emerald-500', groupHoverBorder: 'group-hover:border-emerald-500'
    };

    if (!analysis) return defaultTheme;

    let topic = null;
    if (selectedTrend) {
        topic = analysis.trendingTopics.find(t => t.name === selectedTrend);
    }
    if (!topic && analysis.trendingTopics.length > 0) {
        topic = analysis.trendingTopics[0];
    }

    if (!topic) return defaultTheme;

    switch (topic.growth) {
        case 'exploding': return { ...defaultTheme, primary: 'red-500', ring: 'focus:ring-red-500', hoverBorder: 'hover:border-red-500', textAccent: 'text-red-400', borderAccent: 'border-red-500/30', bgAccent: 'bg-red-500/10', hoverBgAccent: 'hover:bg-red-500/20', borderAccent2: 'border-red-500/20', accent: 'red', focusBorder: 'focus:border-red-500', border: 'border-red-500', hoverBg: 'hover:bg-red-400', groupHoverBg: 'group-hover:bg-red-500', groupHoverBorder: 'group-hover:border-red-500' };
        case 'steady': return { ...defaultTheme, primary: 'blue-500', ring: 'focus:ring-blue-500', hoverBorder: 'hover:border-blue-500', textAccent: 'text-blue-400', borderAccent: 'border-blue-500/30', bgAccent: 'bg-blue-500/10', hoverBgAccent: 'hover:bg-blue-500/20', borderAccent2: 'border-blue-500/20', accent: 'blue', focusBorder: 'focus:border-blue-500', border: 'border-blue-500', hoverBg: 'hover:bg-blue-400', groupHoverBg: 'group-hover:bg-blue-500', groupHoverBorder: 'group-hover:border-blue-500' };
        default: return defaultTheme;
    }
};
