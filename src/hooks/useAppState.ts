import { useState, useEffect, useRef } from 'react';
import { AppState, HistoryItem, Toast } from '../types';
import { analyzeTrends, generateContentIdea, getWorkflow, critiqueScript, generateImprovement } from '../services/geminiService';
import { VISUAL_STYLES } from '../types';

export function useAppState() {
    const [state, setState] = useState<AppState>(() => {
        let history: HistoryItem[] = [];
        try {
            const savedHistory = localStorage.getItem('shorts_trend_history');
            if (savedHistory) {
                history = JSON.parse(savedHistory);
            }
        } catch (e) {
            console.error('Failed to parse history from localStorage', e);
        }

        return {
            analysis: null,
            contentIdea: null,
            workflow: null,
            critique: null,
            isLoading: false,
            error: null,
            selectedVisualStyle: VISUAL_STYLES[0],
            visualGenerationType: 'image',
            temperature: 0.7,
            targetAudience: 'General Audience',
            tone: 'Informative',
            history,
            searchQuery: '',
            isDarkMode: false,
        };
    });

    const toggleDarkMode = () => {
        setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
    };

    const [activeTab, setActiveTab] = useState<'trends' | 'generator' | 'workflow' | 'history' | 'critique'>('trends');
    const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
    const [trendFilter, setTrendFilter] = useState<'all' | 'exploding' | 'steady' | 'declining'>('all');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [historySearch, setHistorySearch] = useState('');
    const [confirmApply, setConfirmApply] = useState(false);
    const [confirmClearHistory, setConfirmClearHistory] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!state.isLoading && (state.analysis || activeTab === 'history')) {
            setTimeout(() => {
                mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [activeTab, state.isLoading, state.analysis]);

    const addToast = (message: string, type: Toast['type'] = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const theme = (() => {
        const defaultTheme = {
            primary: 'emerald-500',
            secondary: 'emerald-400',
            border: 'border-emerald-500',
            bg: 'bg-emerald-500',
            text: 'text-emerald-500',
            glow: 'shadow-emerald-500/20',
            hoverBg: 'hover:bg-emerald-400',
            hoverBorder: 'hover:border-emerald-500',
            ring: 'focus:ring-emerald-500',
            focusBorder: 'focus:border-emerald-500',
            accent: 'emerald',
            bgOpacity: 'bg-emerald-500/5',
            textAccent: 'text-emerald-400',
            borderAccent: 'border-emerald-500/30',
            bgAccent: 'bg-emerald-500/10',
            hoverBgAccent: 'hover:bg-emerald-500/20',
            borderAccent2: 'border-emerald-500/20',
            shadowAccent: 'shadow-emerald-500/10'
        };

        if (!selectedTrend || !state.analysis) return defaultTheme;

        const topic = state.analysis.trendingTopics.find(t => t.name === selectedTrend);
        if (!topic) return defaultTheme;

        switch (topic.growth) {
            case 'exploding':
                return {
                    primary: 'red-500', secondary: 'red-400', border: 'border-red-500', bg: 'bg-red-500',
                    text: 'text-red-500', glow: 'shadow-red-500/20', hoverBg: 'hover:bg-red-400', hoverBorder: 'hover:border-red-500',
                    ring: 'focus:ring-red-500', focusBorder: 'focus:border-red-500', accent: 'red', bgOpacity: 'bg-red-500/5',
                    textAccent: 'text-red-400', borderAccent: 'border-red-500/30', bgAccent: 'bg-red-500/10',
                    hoverBgAccent: 'hover:bg-red-500/20', borderAccent2: 'border-red-500/20', shadowAccent: 'shadow-red-500/10'
                };
            case 'steady':
                return {
                    primary: 'blue-500', secondary: 'blue-400', border: 'border-blue-500', bg: 'bg-blue-500',
                    text: 'text-blue-500', glow: 'shadow-blue-500/20', hoverBg: 'hover:bg-blue-400', hoverBorder: 'hover:border-blue-500',
                    ring: 'focus:ring-blue-500', focusBorder: 'focus:border-blue-500', accent: 'blue', bgOpacity: 'bg-blue-500/5',
                    textAccent: 'text-blue-400', borderAccent: 'border-blue-500/30', bgAccent: 'bg-blue-500/10',
                    hoverBgAccent: 'hover:bg-blue-500/20', borderAccent2: 'border-blue-500/20', shadowAccent: 'shadow-blue-500/10'
                };
            case 'declining':
                return {
                    primary: 'slate-500', secondary: 'slate-400', border: 'border-slate-500', bg: 'bg-slate-500',
                    text: 'text-slate-500', glow: 'shadow-slate-500/20', hoverBg: 'hover:bg-slate-400', hoverBorder: 'hover:border-slate-500',
                    ring: 'focus:ring-slate-500', focusBorder: 'focus:border-slate-500', accent: 'slate', bgOpacity: 'bg-slate-500/5',
                    textAccent: 'text-slate-400', borderAccent: 'border-slate-500/30', bgAccent: 'bg-slate-500/10',
                    hoverBgAccent: 'hover:bg-slate-500/20', borderAccent2: 'border-slate-500/20', shadowAccent: 'shadow-slate-500/10'
                };
            default:
                return defaultTheme;
        }
    })();

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        addToast('Copied to clipboard!', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const copyAllForProduction = () => {
        if (!state.contentIdea) return;
        const { title, script, hook, caption, hashtags, musicStyle, soundEffects, visualStyle, imagePrompts } = state.contentIdea;

        const text = `TITLE: ${title}

HOOK: ${hook}

SCRIPT:
${script.map(s => `[${s.timestamp}] ${s.text}`).join('\n')}

VISUAL STYLE: ${visualStyle}

STORYBOARD PROMPTS:
${imagePrompts?.map(p => `[${p.frame}] ${p.prompt}`).join('\n') || 'None Generated'}

AUDIO:
Music: ${musicStyle}
SFX: ${soundEffects.join(', ')}

CAPTION:
${caption}
${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`.trim();

        copyToClipboard(text, 'all');
    };

    useEffect(() => {
        try {
            localStorage.setItem('shorts_trend_history', JSON.stringify(state.history));
        } catch (e) {
            console.warn("Local storage full, trimming history...");
            const trimmed = state.history.slice(0, 3);
            try {
                localStorage.setItem('shorts_trend_history', JSON.stringify(trimmed));
            } catch (trimmedError) {
                console.error('Even trimmed history failed to save', trimmedError);
            }
        }
    }, [state.history]);

    const resetApp = () => {
        setState(prev => ({
            ...prev,
            analysis: null,
            contentIdea: null,
            critique: null,
            workflow: null,
            searchQuery: ''
        }));
        setActiveTab('trends');
    };

    const handleAnalyze = async (queryOverride?: string) => {
        const query = queryOverride !== undefined ? queryOverride : state.searchQuery;
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const analysis = await analyzeTrends(query || undefined);

            const newHistoryItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                query: query || 'General Trends',
                timestamp: Date.now(),
                analysis,
            };

            setState(prev => ({
                ...prev,
                analysis,
                isLoading: false,
                history: [newHistoryItem, ...prev.history].slice(0, 10)
            }));
            setActiveTab('trends');
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to analyze trends. Please try again.' }));
        }
    };

    const handleGenerate = async (trend: string) => {
        setSelectedTrend(trend);
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const [idea, workflow] = await Promise.all([
                generateContentIdea(
                    trend,
                    state.selectedVisualStyle,
                    state.visualGenerationType,
                    state.temperature,
                    state.targetAudience,
                    state.tone
                ),
                getWorkflow()
            ]);
            setState(prev => ({ ...prev, contentIdea: idea, workflow, critique: null, isLoading: false }));
            setCompletedSteps([]);
            setActiveTab('generator');
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to generate content. Please try again.' }));
        }
    };

    const handleCritique = async () => {
        if (!state.contentIdea) return;
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const critique = await critiqueScript(scriptText, state.contentIdea.hook);
            setState(prev => ({ ...prev, critique, isLoading: false }));
            setActiveTab('critique');
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to critique script. Please try again.' }));
        }
    };

    const handleImprove = async () => {
        if (!state.contentIdea || !state.critique) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const critiqueText = `Score: ${state.critique.viralityScore}. Feedback: ${state.critique.overallFeedback}`;
            const improvement = await generateImprovement(scriptText, critiqueText);

            const improvedScriptText = improvement.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
            const newCritique = await critiqueScript(improvedScriptText, state.contentIdea.hook);

            setState(prev => ({
                ...prev,
                isLoading: false,
                critique: {
                    ...newCritique,
                    improvedScript: improvement.improvedScript,
                    improvedImagePrompts: improvement.improvedImagePrompts
                }
            }));
            addToast('AI has generated and critiqued an improved version of your script!', 'success');
        } catch (err) {
            console.error(err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to generate improvement. Please try again.' }));
        }
    };

    const applyImprovedScript = () => {
        if (!state.contentIdea || !state.critique || !state.critique.improvedScript) return;

        setState(prev => ({
            ...prev,
            contentIdea: {
                ...prev.contentIdea!,
                script: state.critique!.improvedScript!,
                imagePrompts: state.critique!.improvedImagePrompts || prev.contentIdea!.imagePrompts
            }
        }));
        setActiveTab('generator');
        addToast('Improved script and visual prompts applied!', 'success');
    };

    const loadFromHistory = (item: HistoryItem) => {
        setState(prev => ({
            ...prev,
            analysis: item.analysis,
            searchQuery: item.query === 'General Trends' ? '' : item.query
        }));
        setActiveTab('trends');
    };

    const clearHistory = () => {
        setState(prev => ({ ...prev, history: [] }));
    };

    return {
        state,
        setState,
        activeTab,
        setActiveTab,
        selectedTrend,
        setSelectedTrend,
        trendFilter,
        setTrendFilter,
        toasts,
        setToasts,
        completedSteps,
        setCompletedSteps,
        historySearch,
        setHistorySearch,
        confirmApply,
        setConfirmApply,
        confirmClearHistory,
        setConfirmClearHistory,
        mainContentRef,
        theme,
        toggleDarkMode,
        addToast,
        copiedId,
        setCopiedId,
        copyToClipboard,
        copyAllForProduction,
        resetApp,
        handleAnalyze,
        handleGenerate,
        handleCritique,
        handleImprove,
        applyImprovedScript,
        loadFromHistory,
        clearHistory
    };
}
