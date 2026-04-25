import { create } from 'zustand';
import { AppState, ContentIdea, ContentGenre, CustomCharacter, HistoryItem, Toast, VISUAL_STYLES, TrendAnalysis, ScriptCritique, ProductionWorkflow, TimelineSegment } from '../types';
import { analyzeTrends, analyzeUrl, generateContentIdea, critiqueScript, generateImprovement } from '../services/geminiService';
import localforage from 'localforage';
import { persistSession, clearSession } from '../lib/storage';

export type TabType = 'trends' | 'generator' | 'critique' | 'workflow' | 'history';

// Helper to ensure segments have stable IDs for DND and keys
const assignIds = (segments: any[]): TimelineSegment[] => {
    return segments.map((seg, i) => ({
        ...seg,
        id: seg.id || `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 11)}`,
    }));
};

interface AppStore extends AppState {
    // UI State
    isHydrated: boolean;
    initStore: () => Promise<void>;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;

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
    _copyTimerId: NodeJS.Timeout | null;

    // Generation Settings
    setSearchQuery: (query: string) => void;
    setVisualStyle: (style: string) => void;
    setVisualGenerationType: (type: 'image' | 'video' | 'image-to-video') => void;
    setSegmentLength: (length: number) => void;
    setCustomSegmentLength: (length: number | null) => void;

    setSegmentMode: (mode: 'adjustable' | 'fixed') => void;
    // Custom Character
    setUseCustomCharacter: (enabled: boolean) => void;
    setCustomCharacter: (character: CustomCharacter) => void;
    // Genre
    setGenre: (genre: ContentGenre) => void;
    setUseCustomGenre: (enabled: boolean) => void;
    setCustomGenreString: (str: string) => void;
    

    // Custom Style Toggle
    setUseCustomStyle: (enabled: boolean) => void;

    // Track state for URL/Idea modes
    searchMode: 'keyword' | 'url' | 'idea';
    setSearchMode: (val: 'keyword' | 'url' | 'idea') => void;
    youtubeUrl: string;
    setYoutubeUrl: (val: string) => void;
    directIdea: string;
    setDirectIdea: (val: string) => void;
    showPreGenModal: boolean;
    setShowPreGenModal: (val: boolean) => void;
    showTimelineEditorModal: boolean;
    setShowTimelineEditorModal: (val: boolean) => void;
    pendingTrend: string;
    setPendingTrend: (val: string) => void;

    // Phase 5: UX Improvements
    loadingMessage: string;
    setLoadingMessage: (msg: string) => void;
    updateSegmentScript: (index: number, newScript: string) => void;
    updateTimelineSegments: (newSegments: TimelineSegment[]) => void;
    toggleSegmentCopyState: (index: number, field: 'copiedScript' | 'copiedVisual' | 'copiedMotion', value: boolean) => void;
    uncheckAllSegments: () => void;

    // Actions
    resetApp: () => void;
    handleAnalyze: (queryOverride?: string, bypassCache?: boolean) => Promise<void>;
    handleGenerate: (trend: string) => Promise<void>;
    handleCritique: () => Promise<void>;
    handleImprove: () => Promise<void>;
    applyImprovedScript: () => void;
    loadFromHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
    _generateRequestId: number;  // B3 FIX: tracks in-flight generate requests for dedup
}

// ─── Persistence Helpers ───────────────────────────────────────────────────────
// NOTE: The original persistSession and SESSION_KEY logic was removed here
// as per the provided diff, implying a refactor to '../lib/storage'.

let analyzeAbortController: AbortController | null = null;
let generateAbortController: AbortController | null = null;
let critiqueAbortController: AbortController | null = null;
let improveAbortController: AbortController | null = null;

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
    segmentLength: 6,
    customSegmentLength: null,
    segmentMode: 'adjustable',
    history: [],
    searchQuery: '',
    currentAnalyzedQuery: '',
    _generateRequestId: 0,
    // Custom Character initial state
    useCustomCharacter: false,
    customCharacter: { name: '', description: '', type: 'both' as const },
    selectedGenre: 'Storytelling' as ContentGenre,
    useCustomGenre: false,
    customGenreString: '',
    useCustomStyle: false,
    setUseCustomStyle: (use) => set({ useCustomStyle: use }),


    // Initial UI/Feature State
    showTimelineEditorModal: false,
    setShowTimelineEditorModal: (val) => set({ showTimelineEditorModal: val }),
    activeTab: 'trends',
    setActiveTab: (tab) => {
        set({ activeTab: tab });
        persistSession({ activeTab: tab });
    },
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

    // Analysis & Generation Modes
    searchMode: 'keyword',
    setSearchMode: (val) => {
        set({ searchMode: val });
        persistSession({ searchMode: val });
    },
    youtubeUrl: '',
    setYoutubeUrl: (val) => {
        set({ youtubeUrl: val });
        persistSession({ youtubeUrl: val });
    },
    directIdea: '',
    setDirectIdea: (val) => {
        set({ directIdea: val });
        persistSession({ directIdea: val });
    },
    showPreGenModal: false,
    setShowPreGenModal: (val) => set({ showPreGenModal: val }),
    pendingTrend: '',
    setPendingTrend: (val) => set({ pendingTrend: val }),

    // Toasts
    toasts: [],
    addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2, 11);
        // L5 FIX: Create timer first so _timerId is included in the single set() call,
        // eliminating the double-set() race window where _timerId wasn't yet attached.
        const timerId = setTimeout(() => get().removeToast(id), type === 'error' ? 8000 : 3000);
        set(state => ({ toasts: [...state.toasts, { id, message, type, _timerId: timerId }] }));
    },
    removeToast: (id) => {
        const toast = get().toasts.find(t => t.id === id) as any;
        if (toast?._timerId) clearTimeout(toast._timerId);
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },

    copiedId: null,
    _copyTimerId: null,
    copyToClipboard: (text, id) => {
        // BUG FIX #2: Handle clipboard permission denial gracefully instead of silently failing.
        navigator.clipboard.writeText(text).then(() => {
            set({ copiedId: id });
            get().addToast('Copied to clipboard!', 'success');
            setTimeout(() => set({ copiedId: null }), 2000);
        }).catch(() => {
            get().addToast('Copy failed — clipboard permission denied.', 'error');
        });
    },
    copyAllForProduction: () => {
        const { contentIdea, copyToClipboard } = get();
        if (!contentIdea) return;
        const { title, hook, segments, hookVariations, seoMetadata, hashtags, visualStyle, editingEffects, fontStyle, editingEffectsContext } = contentIdea;

        const formatTime = (secs: number) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = Math.floor(secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const text = `TITLE: ${title}\n${hook ? `PRIMARY HOOK: ${hook}\n` : ''}\nHOOKS:\n${hookVariations?.map(h => `- [${h.type}]: ${h.text}`).join('\n') || 'None'}\n\nSTORYBOARD TIMELINE:\n${segments.map(seg => `[${seg.timestamp || formatTime(seg.startTime)}]\nSCRIPT: ${seg.script}\nVISUAL: ${seg.visual}${seg.motion ? `\nMOTION: ${seg.motion}` : ''}`).join('\n\n')}\n\nVISUAL STYLE: ${visualStyle}\n\nPOST-PRODUCTION & EFFECTS:\nFont Style: ${fontStyle}\nEditing Effects: ${editingEffects.join(', ')}\nContext: ${editingEffectsContext}\n\nSEO METADATA:\nTitle: ${seoMetadata?.youtubeTitle}\nDescription: ${seoMetadata?.youtubeDescription}\nPinned Comment: ${seoMetadata?.pinnedCommentIdea}\n${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`.trim();

        copyToClipboard(text, 'all');
    },

    // Generation Settings Setters
    setSearchQuery: (query) => {
        set({ searchQuery: query });
        persistSession({ searchQuery: query });
    },
    setVisualStyle: (style) => set({ selectedVisualStyle: style }),
    setVisualGenerationType: (type) => set({ visualGenerationType: type }),
    setSegmentLength: (length) => set({ segmentLength: length }),
    setCustomSegmentLength: (length) => set({ customSegmentLength: length }),
    setSegmentMode: (mode) => {
        set({ segmentMode: mode });
        persistSession({ segmentMode: mode });
    },
    setUseCustomCharacter: (enabled) => {
        set({ useCustomCharacter: enabled });
        persistSession({ useCustomCharacter: enabled });
    },
    setCustomCharacter: (character) => {
        set({ customCharacter: character });
        persistSession({ customCharacter: character });
    },
    setGenre: (genre) => {
        set({ selectedGenre: genre });
        persistSession({ selectedGenre: genre });
    },
    setUseCustomGenre: (enabled) => {
        set({ useCustomGenre: enabled });
        persistSession({ useCustomGenre: enabled });
    },
    setCustomGenreString: (str) => {
        set({ customGenreString: str });
        persistSession({ customGenreString: str });
    },


    // Phase 5: Progressive Loading & Interactive UI
    loadingMessage: '',
    setLoadingMessage: (msg: string) => set({ loadingMessage: msg }),

    updateSegmentScript: (index: number, newScript: string) => set(state => {
        if (!state.contentIdea) return state;
        
        const WORDS_PER_SECOND = 2.7;
        const newSegments = [...state.contentIdea.segments];
        
        // 1. Update the target segment script
        const currentSegment = { ...newSegments[index], script: newScript };
        
        // 2. Calculate its new duration based on word count
        const wordCount = newScript.trim().split(/\s+/).filter(Boolean).length;
        const calculatedDuration = Math.max(2, Math.min(30, Number((wordCount / WORDS_PER_SECOND).toFixed(1))));
        
        // 3. Update the segment and its timing if it's the first one, or use previous end time
        // B6 FIX: Ensure index > 0 to strictly avoid reading newSegments[-1]
        let currentStartTime = (index === 0 || !newSegments[index - 1]) ? 0 : newSegments[index - 1].endTime;
        
        // 4. Re-calculate this segment and all subsequent segments to keep them contiguous
        for (let i = index; i < newSegments.length; i++) {
            const seg = i === index ? currentSegment : { ...newSegments[i] };
            
            // For the edited segment, we use the calculated duration. 
            // For subsequent ones, we keep their existing duration (delta) unless we want full ripple.
            // Actually, we should recalculate the START/END for ALL subsequent segments to bridge the gap.
            const duration = i === index 
                ? calculatedDuration 
                : Number((newSegments[i].endTime - newSegments[i].startTime).toFixed(1));
            
            const formatTimeLocal = (secs: number) => {
                const m = Math.floor(secs / 60).toString().padStart(2, '0');
                const s = Math.floor(secs % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };

            newSegments[i] = {
                ...seg,
                startTime: currentStartTime,
                endTime: Number((currentStartTime + duration).toFixed(1)),
                timestamp: formatTimeLocal(currentStartTime)
            };
            currentStartTime = newSegments[i].endTime;
        }

        const updatedIdea = { ...state.contentIdea, segments: newSegments };
        persistSession({ contentIdea: updatedIdea });
        return { contentIdea: updatedIdea };
    }),

    updateTimelineSegments: (newSegments: TimelineSegment[]) => {
        const state = get();
        if (!state.contentIdea) return;
        const updatedIdea = { ...state.contentIdea, segments: newSegments };
        set({ contentIdea: updatedIdea });
        persistSession({ contentIdea: updatedIdea });
    },

    toggleSegmentCopyState: (index: number, field: 'copiedScript' | 'copiedVisual' | 'copiedMotion', value: boolean) => {
        set(state => {
            if (!state.contentIdea) return state;
            const newSegments = [...state.contentIdea.segments];
            newSegments[index] = { ...newSegments[index], [field]: value };
            const updatedIdea = { ...state.contentIdea, segments: newSegments };
            persistSession({ contentIdea: updatedIdea });
            return { contentIdea: updatedIdea };
        });
    },

    uncheckAllSegments: () => {
        set(state => {
            if (!state.contentIdea) return state;
            const newSegments = state.contentIdea.segments.map(seg => ({
                ...seg,
                copiedScript: false,
                copiedVisual: false,
                copiedMotion: false
            }));
            const updatedIdea = { ...state.contentIdea, segments: newSegments };
            persistSession({ contentIdea: updatedIdea });
            return { contentIdea: updatedIdea };
        });
    },

    // Actions
    initStore: async () => {
        try {
            const historyRaw = await localforage.getItem<string>('shorts_trend_history');
            let history = [];
            if (historyRaw) {
                try { history = JSON.parse(historyRaw); } 
                catch (e) { console.warn("Corrupted history data dropped."); }
            }

            const session = await persistSession.load();

            // ── Migration Guard ───────────────────────────────────────────────────
            // Drop old-schema contentIdea (missing required .segments or incomplete)
            let contentIdea = session.contentIdea ?? null;
            if (contentIdea && (!contentIdea.segments || !Array.isArray(contentIdea.segments))) {
                console.warn('[Session] Dropping invalid/old-schema contentIdea. User will need to regenerate.');
                contentIdea = null;
            }
            // Same guard for critique improved fields (ensure it has segments if it has timeline)
            let critique = session.critique ?? null;
            if (critique && (critique as any).improvedTimeline && !critique.improvedSegments) {
                console.warn('[Session] Dropping old-schema critique (missing .improvedSegments).');
                critique = null;
            }
            if (critique && critique.improvedSegments && !Array.isArray(critique.improvedSegments)) {
                critique = null;
            }

            set({
                history,
                analysis: session.analysis ?? null,
                contentIdea,
                workflow: session.workflow ?? null,
                critique,
                searchQuery: session.searchQuery ?? '',
                currentAnalyzedQuery: session.searchQuery ?? '',
                segmentMode: session.segmentMode ?? 'adjustable',
                useCustomCharacter: session.useCustomCharacter ?? false,
                customCharacter: session.customCharacter ?? { name: '', description: '', type: 'both' },
                selectedGenre: session.selectedGenre ?? 'Storytelling',
                useCustomGenre: session.useCustomGenre ?? false,
                customGenreString: session.customGenreString ?? '',
                useCustomStyle: session.useCustomStyle ?? false,

                searchMode: session.searchMode ?? 'keyword',
                directIdea: session.directIdea ?? '',
                youtubeUrl: session.youtubeUrl ?? '',
                activeTab: session.activeTab ?? (contentIdea ? 'generator' : 'trends'), // B3 FIX: Restore tab or default to generator if idea exists
                isHydrated: true
            });
        } catch (e) {
            console.error('Failed to init store from localforage', e);
            set({ isHydrated: true });
        }
    },

    resetApp: () => {
        try { clearSession(); } catch { }
        set({
            analysis: null,
            contentIdea: null,
            critique: null,
            workflow: null,
            searchQuery: '',
            currentAnalyzedQuery: '',
            activeTab: 'trends',
            searchMode: 'keyword',
            youtubeUrl: '',
            directIdea: '',
            showPreGenModal: false
        });
    },

    handleAnalyze: async (queryOverride?: string, bypassCache = false) => {
        if (analyzeAbortController) {
            analyzeAbortController.abort();
        }
        analyzeAbortController = new AbortController();

        const state = get();
        const query = queryOverride !== undefined ? queryOverride : state.searchQuery;
        set({ isLoading: true, error: null, analysis: null, loadingMessage: state.searchMode === 'url' ? "Analyzing YouTube Video Niche DNA..." : "Analyzing niche topics... This might take a few moments." });

        try {
            const analysis = state.searchMode === 'url'
                ? await analyzeUrl(state.youtubeUrl, { signal: analyzeAbortController.signal })
                : await analyzeTrends(query || undefined, bypassCache, { signal: analyzeAbortController.signal });

            const newHistoryItem: HistoryItem = {
                id: Math.random().toString(36).slice(2, 11),
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
                currentAnalyzedQuery: query || '',
                activeTab: 'trends'
            });
            persistSession({ analysis, searchQuery: query || '', searchMode: state.searchMode, youtubeUrl: state.youtubeUrl, directIdea: state.directIdea });
        } catch (err: any) {
            if (err.name === 'AbortError') return; // Ignore manually aborted requests
            console.error(err);
            // BUG FIX #3: Surface the actual API error message instead of a generic string.
            set({ isLoading: false, error: err?.message || 'Failed to analyze trends. Please try again.' });
        }
    },

    handleGenerate: async (trend: string) => {
        if (generateAbortController) {
            generateAbortController.abort();
        }
        generateAbortController = new AbortController();

        // B3 FIX: Prevent concurrent generate calls from racing each other.
        // Each call gets a unique requestId. If the user triggers a new generate
        // before the previous one completes, the stale response is silently discarded.
        const requestId = get()._generateRequestId + 1;
        set({ _generateRequestId: requestId, selectedTrend: trend, isLoading: true, error: null, activeTab: 'generator', loadingMessage: "Analyzing virality potential for " + trend + "..." });

        const state = get();
        const timers: NodeJS.Timeout[] = [];

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Generating visual storyboard and scene setups..." });
            }, 3000));
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Writing the storyboard script segments..." });
            }, 6000));

            const finalSegmentLength = state.segmentMode === 'adjustable'
                ? undefined
                : (state.customSegmentLength || state.segmentLength);

            const character = state.useCustomCharacter ? state.customCharacter : undefined;

            const ideaPromise = generateContentIdea(
                trend,
                state.selectedVisualStyle,
                state.visualGenerationType,
                finalSegmentLength,
                60, // totalDuration always 60s
                character,
                state.selectedGenre,
                state.useCustomGenre ? state.customGenreString : undefined,
                Math.random().toString(36).substring(2, 10), // Random variation ID to force regeneration differences

                (partial) => {
                    // B3 FIX: Only update state if this request is still the current one.
                    if (get()._generateRequestId !== requestId) return;

                    const partialIdea: ContentIdea = {
                        title: partial.title || "Drafting Idea...",
                        hook: partial.hook || "",
                        segments: assignIds(partial.segments || []),
                        visualStyle: partial.visualStyle || state.selectedVisualStyle,
                        hookVariations: partial.hookVariations || [],
                        seoMetadata: partial.seoMetadata || { youtubeTitle: "...", youtubeDescription: "...", pinnedCommentIdea: "..." },
                        hashtags: partial.hashtags || [],
                        coachingTips: partial.coachingTips || "",
                        editingEffects: partial.editingEffects || [],
                        fontStyle: partial.fontStyle || "...",
                        editingEffectsContext: partial.editingEffectsContext || "",
                        segmentLength: finalSegmentLength,
                        metadata: partial.metadata || { tags: [] }
                    };

                    set({ contentIdea: partialIdea, critique: null });
                },
                { signal: generateAbortController.signal }
            );

            const idea = await ideaPromise;

            // B3 FIX: Final guard — if a newer request started during the await, abort.
            if (get()._generateRequestId !== requestId) return;

            const builtIdea = { ...idea, segments: assignIds(idea.segments), segmentLength: finalSegmentLength };

            const hardcodedWorkflow = {
                software: {
                    voiceGen: "ElevenLabs (for ultra-realistic cloning)",
                    imageGen: "Midjourney v6 or Flux (for high-fidelity frames)",
                    videoGen: "Runway Gen-3 or Luma Dream Machine (for motion)",
                    editing: "CapCut or Premiere Pro (for assembly and pacing)"
                },
                steps: [
                    "Export the `.md` script from the Generator to track lines.",
                    "Generate voiceover from the script to establish pacing.",
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
            persistSession({ contentIdea: builtIdea, workflow: hardcodedWorkflow, critique: null, activeTab: 'generator' });
        } catch (err: any) {
            // B3 FIX: Only surface the error if this is still the active request.
            if (get()._generateRequestId !== requestId) return;
            console.error(err);
            const errorMsg = err?.message || 'Failed to generate content. Please try again.';
            set({ isLoading: false, error: errorMsg });
            get().addToast(errorMsg, 'error');
        } finally {
            timers.forEach(clearTimeout);
            // NOTE: isLoading is already set to false in both try (success) and catch (error) paths above.
            // We intentionally do NOT set isLoading here to avoid a redundant Zustand flush
            // that causes AnimatePresence mode='wait' to re-evaluate and briefly flash the wrong tab.
        }
    },

    handleCritique: async () => {
        const state = get();
        if (!state.contentIdea) return;
        // B5 FIX: Abort before capturing requestId so no stale result can overwrite
        // state after the new critique request starts.
        if (critiqueAbortController) critiqueAbortController.abort();
        critiqueAbortController = new AbortController();
        const requestId = get()._generateRequestId + 1;
        set({ _generateRequestId: requestId, isLoading: true, error: null, loadingMessage: "Running script against viral retention frameworks..." });

        const timers: NodeJS.Timeout[] = [];

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Evaluating hooks and audience retention drops..." });
            }, 3000));

            const formatTimeLocal = (secs: number) => {
                const m = Math.floor(secs / 60).toString().padStart(2, '0');
                const s = Math.floor(secs % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };
            const scriptText = state.contentIdea.segments.map(seg => {
                return `[${seg.timestamp || formatTimeLocal(seg.startTime)}] ${seg.script}`;
            }).join('\n');
            const character = state.useCustomCharacter ? state.customCharacter : undefined;
            const firstHook = state.contentIdea.hook || state.contentIdea.hookVariations[0]?.text || '';
            const critique = await critiqueScript(scriptText, firstHook, character, { signal: critiqueAbortController.signal });

            if (get()._generateRequestId !== requestId) return;

            set({ critique, isLoading: false, activeTab: 'critique' });
            persistSession({ critique });
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            if (get()._generateRequestId !== requestId) return;
            console.error(err);
            set({ isLoading: false, error: err?.message || 'Failed to critique script. Please try again.' });
        } finally {
            timers.forEach(clearTimeout);
            if (get()._generateRequestId === requestId) {
                set({ isLoading: false });
            }
        }
    },

    handleImprove: async () => {
        const requestId = get()._generateRequestId + 1;
        const state = get();
        if (!state.contentIdea || !state.critique) return;

        set({ _generateRequestId: requestId, isLoading: true, error: null, loadingMessage: "Rewriting script to fix weaknesses..." });

        const timers: NodeJS.Timeout[] = [];
        if (improveAbortController) improveAbortController.abort();
        improveAbortController = new AbortController();

        try {
            timers.push(setTimeout(() => {
                if (get().isLoading) set({ loadingMessage: "Designing higher-retention visual storyboard..." });
            }, 4000));

            const formatTime = (secs: number) => {
                const m = Math.floor(secs / 60).toString().padStart(2, '0');
                const s = Math.floor(secs % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };

            const scriptText = state.contentIdea.segments.map(seg =>
                `[${seg.timestamp || formatTime(seg.startTime)}] ${seg.script}`
            ).join('\n');
            const critiqueText = `Score: ${state.critique.viralityScore}. Feedback: ${state.critique.overallFeedback}`;
            const builtSegmentLength = state.segmentMode === 'adjustable'
                ? undefined
                : (state.contentIdea.segmentLength || state.segmentLength);
            const character = state.useCustomCharacter ? state.customCharacter : undefined;
            const expectedSegments = state.contentIdea.segments.length;
            const improvement = await generateImprovement(
                scriptText, critiqueText,
                state.selectedVisualStyle, state.visualGenerationType,
                builtSegmentLength, 60, character, expectedSegments,
                { signal: improveAbortController.signal }
            );

            // B4 FIX: Safety check for improvedSegments
            if (!improvement.improvedSegments || !Array.isArray(improvement.improvedSegments)) {
                throw new Error("AI failed to generate structural script improvements. Please try again.");
            }

            const improvedSegments = assignIds(improvement.improvedSegments);

            const improvedScriptText = improvedSegments.map(seg =>
                `[${seg.timestamp || formatTime(seg.startTime)}] ${seg.script}`
            ).join('\n');
            const newCritique = await critiqueScript(
                improvedScriptText,
                improvement.improvedHook || state.contentIdea.hook || state.contentIdea.hookVariations[0]?.text || '',
                character,
                { signal: improveAbortController.signal }
            );

            const finalCritique = {
                ...newCritique,
                ...improvement,
                improvedSegments // Use the one with IDs
            };

            if (get()._generateRequestId !== requestId) return;

            set({ isLoading: false, critique: finalCritique });
            persistSession({ critique: finalCritique });
            get().addToast('AI has generated and critiqued an improved version of your script!', 'success');
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            if (get()._generateRequestId !== requestId) return;
            console.error(err);
            set({ isLoading: false, error: err?.message || 'Failed to generate improvement. Please try again.' });
        } finally {
            timers.forEach(clearTimeout);
            if (get()._generateRequestId === requestId) {
                set({ isLoading: false });
            }
        }
    },

    applyImprovedScript: () => {
        const state = get();
        if (!state.contentIdea || !state.critique || !state.critique.improvedSegments) return;

        const updated = {
            ...state.contentIdea,
            segments: state.critique.improvedSegments,
            hook: state.critique.improvedHook || state.contentIdea.hook,
            hookVariations: state.critique.improvedHook
                ? [{ type: 'Improved', text: state.critique.improvedHook }]
                : state.contentIdea.hookVariations,
            seoMetadata: state.critique.improvedCaption
                ? { ...state.contentIdea.seoMetadata, youtubeDescription: state.critique.improvedCaption }
                : state.contentIdea.seoMetadata,
            hashtags: state.critique.improvedHashtags || state.contentIdea.hashtags,
            editingEffects: state.critique.improvedEditingEffects || state.contentIdea.editingEffects,
            fontStyle: state.critique.improvedFontStyle || state.contentIdea.fontStyle,
            editingEffectsContext: state.critique.improvedEditingEffectsContext || state.contentIdea.editingEffectsContext
        };
        set({ contentIdea: updated, activeTab: 'generator', critique: null });
        persistSession({ contentIdea: updated, activeTab: 'generator', critique: null });
        get().addToast('Improved script and visual prompts applied!', 'success');
    },

    loadFromHistory: (item: HistoryItem) => {
        const query = item.query === 'General Trends' ? '' : item.query;
        set({
            analysis: item.analysis,
            searchQuery: query,
            currentAnalyzedQuery: query,
            activeTab: 'trends'
        });
        persistSession({ analysis: item.analysis, searchQuery: query });
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
        case 'exploding': return { ...defaultTheme, primary: 'red-500', ring: 'focus:ring-red-500', hoverBorder: 'hover:border-red-500', textAccent: 'text-red-400', borderAccent: 'border-red-500/30', bgAccent: 'bg-red-500/10', hoverBgAccent: 'hover:bg-red-500/20', borderAccent2: 'border-red-500/20', accent: 'red', focusBorder: 'focus:border-red-500', border: 'border-red-500', hoverBg: 'hover:bg-red-400', bg: 'bg-red-500', bgOpacity: 'bg-red-500/5', shadowAccent: 'shadow-red-500/10', groupHoverBg: 'group-hover:bg-red-500', groupHoverBorder: 'group-hover:border-red-500' };
        case 'steady': return { ...defaultTheme, primary: 'blue-500', ring: 'focus:ring-blue-500', hoverBorder: 'hover:border-blue-500', textAccent: 'text-blue-400', borderAccent: 'border-blue-500/30', bgAccent: 'bg-blue-500/10', hoverBgAccent: 'hover:bg-blue-500/20', borderAccent2: 'border-blue-500/20', accent: 'blue', focusBorder: 'focus:border-blue-500', border: 'border-blue-500', hoverBg: 'hover:bg-blue-400', bg: 'bg-blue-500', bgOpacity: 'bg-blue-500/5', shadowAccent: 'shadow-blue-500/10', groupHoverBg: 'group-hover:bg-blue-500', groupHoverBorder: 'group-hover:border-blue-500' };
        case 'declining': return { ...defaultTheme, primary: 'slate-500', ring: 'focus:ring-slate-500', hoverBorder: 'hover:border-slate-500', textAccent: 'text-slate-400', borderAccent: 'border-slate-500/30', bgAccent: 'bg-slate-500/10', hoverBgAccent: 'hover:bg-slate-500/20', borderAccent2: 'border-slate-500/20', accent: 'slate', focusBorder: 'focus:border-slate-500', border: 'border-slate-500', hoverBg: 'hover:bg-slate-400', bg: 'bg-slate-500', bgOpacity: 'bg-slate-500/5', shadowAccent: 'shadow-slate-500/10', groupHoverBg: 'group-hover:bg-slate-500', groupHoverBorder: 'group-hover:border-slate-500' };
        default: return defaultTheme;
    }
};
