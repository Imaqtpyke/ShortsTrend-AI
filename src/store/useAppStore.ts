import { create } from 'zustand';
import { AppState, HistoryItem, Toast, VISUAL_STYLES } from '../types';
import { analyzeTrends, generateContentIdea, getWorkflow, critiqueScript, generateImprovement } from '../services/geminiService';

interface AppStore extends AppState {
    // UI State
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
    toggleDarkMode: () => void;
    copiedId: string | null;
    copyToClipboard: (text: string, id: string) => void;
    copyAllForProduction: () => void;

    // Generation Settings
    setSearchQuery: (query: string) => void;
    setVisualStyle: (style: string) => void;
    setVisualGenerationType: (type: 'image' | 'video') => void;
    setTemperature: (temp: number) => void;
    setTargetAudience: (audience: string) => void;
    setTone: (tone: string) => void;

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
// Persist history
const getInitialHistory = (): HistoryItem[] => {
    try {
        const savedHistory = localStorage.getItem('shorts_trend_history');
        if (savedHistory) return JSON.parse(savedHistory);
    } catch (e) {
        console.error('Failed to parse history from localStorage', e);
    }
    return [];
};

// Persist the current session (analysis, idea, critique, workflow) so work
// survives page refreshes — even without a backend database.
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

function getInitialSession(): Partial<PersistedSession> {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return {};
        const session: PersistedSession = JSON.parse(raw);
        // Discard sessions older than 24 hours
        if (Date.now() - session.savedAt > SESSION_MAX_AGE_MS) {
            localStorage.removeItem(SESSION_KEY);
            return {};
        }
        return session;
    } catch {
        return {};
    }
}

function persistSession(partial: Partial<PersistedSession>) {
    try {
        const current = getInitialSession() as Partial<PersistedSession>;
        const next: PersistedSession = {
            analysis: partial.analysis ?? current.analysis ?? null,
            contentIdea: partial.contentIdea ?? current.contentIdea ?? null,
            critique: partial.critique ?? current.critique ?? null,
            workflow: partial.workflow ?? current.workflow ?? null,
            searchQuery: partial.searchQuery ?? current.searchQuery ?? '',
            savedAt: Date.now(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
        // Storage may be full — silently skip
    }
}

const initialSession = getInitialSession() as Partial<PersistedSession>;

export const useAppStore = create<AppStore>((set, get) => ({
    // Initial AppState — restored from session if available
    analysis: initialSession.analysis ?? null,
    contentIdea: initialSession.contentIdea ?? null,
    workflow: initialSession.workflow ?? null,
    critique: initialSession.critique ?? null,
    isLoading: false,
    error: null,
    selectedVisualStyle: VISUAL_STYLES[0],
    visualGenerationType: 'image',
    temperature: 0.7,
    targetAudience: 'General Audience',
    tone: 'Informative',
    history: getInitialHistory(),
    searchQuery: '',
    isDarkMode: true,

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

    // Theme
    toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),
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
        const { title, script, hook, caption, hashtags, musicStyle, soundEffects, visualStyle, imagePrompts } = contentIdea;

        const text = `TITLE: ${title}\n\nHOOK: ${hook}\n\nSCRIPT:\n${script.map(s => `[${s.timestamp}] ${s.text}`).join('\n')}\n\nVISUAL STYLE: ${visualStyle}\n\nSTORYBOARD PROMPTS:\n${imagePrompts?.map(p => `[${p.frame}] ${p.prompt}`).join('\n') || 'None Generated'}\n\nAUDIO:\nMusic: ${musicStyle}\nSFX: ${soundEffects.join(', ')}\n\nCAPTION:\n${caption}\n${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`.trim();

        copyToClipboard(text, 'all');
    },

    // Generation Settings Setters
    setSearchQuery: (query) => set({ searchQuery: query }),
    setVisualStyle: (style) => set({ selectedVisualStyle: style }),
    setVisualGenerationType: (type) => set({ visualGenerationType: type }),
    setTemperature: (temp) => set({ temperature: temp }),
    setTargetAudience: (audience) => set({ targetAudience: audience }),
    setTone: (tone) => set({ tone: tone }),

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
    resetApp: () => {
        try { localStorage.removeItem(SESSION_KEY); } catch { }
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
            try { localStorage.setItem('shorts_trend_history', JSON.stringify(newHistory)); } catch (e) { console.error("History save failed", e); }

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
            // Staggered loading messages to keep user engaged during long API waits
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Generating visual hooks and scene setups..." });
            }, 3000));
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Writing the script segments..." });
            }, 6000));

            const [idea, workflow] = await Promise.all([
                generateContentIdea(trend, state.selectedVisualStyle, state.visualGenerationType, state.temperature, state.targetAudience, state.tone),
                getWorkflow()
            ]);

            set({ contentIdea: idea, workflow, critique: null, isLoading: false, completedSteps: [], activeTab: 'generator' });
            persistSession({ contentIdea: idea, workflow, critique: null });
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
            const critique = await critiqueScript(scriptText, state.contentIdea.hook);
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
            const improvement = await generateImprovement(scriptText, critiqueText);

            const improvedScriptText = improvement.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const newCritique = await critiqueScript(improvedScriptText, state.contentIdea.hook);

            const finalCritique = {
                ...newCritique,
                improvedScript: improvement.improvedScript,
                improvedImagePrompts: improvement.improvedImagePrompts
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
            imagePrompts: state.critique.improvedImagePrompts || state.contentIdea.imagePrompts
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

    clearHistory: () => {
        set({ history: [] });
        try { localStorage.setItem('shorts_trend_history', JSON.stringify([])); } catch (e) { }
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
