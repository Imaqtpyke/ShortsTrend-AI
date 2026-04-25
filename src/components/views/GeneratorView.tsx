import React from 'react';
import { motion } from 'motion/react';
import { Clock, Copy, Plus, X, Play, Image as ImageIcon, Check, Video, AlertTriangle, Wand2, RefreshCw, Layers, Hash, Lightbulb, User, Zap, MessageSquare, Loader2, ArrowLeft, Download, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { useAppStore, useTheme } from '../../store/useAppStore';
import { FloatingScrollButton } from '../ui/FloatingScrollButton';
import { downloadAsCSV, downloadAsMarkdown } from '../../lib/exportUtils';
import { TimelineEditorModal } from './TimelineEditorModal';
import { TimelineSegment } from '../../types';

// B6 PERFORMANCE FIX: Memoized row with granular selectors to prevent global re-renders
// when editing a single segment's text.
const TimelineSegmentRow = React.memo(({ segment, index }: { segment: TimelineSegment; index: number }) => {
    // Select only what we need for this specific row
    const updateSegmentScript = useAppStore(state => state.updateSegmentScript);
    const toggleSegmentCopyState = useAppStore(state => state.toggleSegmentCopyState);
    const copyToClipboard = useAppStore(state => state.copyToClipboard);
    const copiedId = useAppStore(state => state.copiedId);
    const visualGenerationType = useAppStore(state => state.visualGenerationType);
    const theme = useTheme();

    const formatTime = (secs: number) => {
        if (secs == null || isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const wordCount = segment.script.trim().split(/\s+/).filter(w => w.length > 0).length;
    const segDuration = segment.endTime - segment.startTime;
    const maxWords = Math.floor(segDuration * 2.7);
    const isOverLimit = wordCount > maxWords;

    const handleCopy = (text: string, id: string, field: 'copiedScript' | 'copiedVisual' | 'copiedMotion') => {
        copyToClipboard(text, id);
        toggleSegmentCopyState(index, field, true);
    };

    const toggleIcon = (field: 'copiedScript' | 'copiedVisual' | 'copiedMotion') => {
        return segment[field] ? (
            <button
                onClick={(e) => { e.stopPropagation(); toggleSegmentCopyState(index, field, false); }}
                className="w-5 h-5 flex items-center justify-center rounded-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title="Uncheck"
            >
                <Check className="w-3 h-3" />
            </button>
        ) : null;
    };

    return (
        <div className={cn(
            "group relative flex flex-col",
            visualGenerationType === 'image' ? "md:flex-row" : "lg:flex-row",
            "border transition-all shadow-sm bg-[#1a1a1a] border-white/10 hover:border-emerald-500"
        )}>
            {/* Timeline Dot */}
            <div className={cn(
                "absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border z-10 transition-colors",
                `border-white/20 bg-[#0a0a0a] ${theme.groupHoverBg} ${theme.groupHoverBorder}`
            )} />

            {/* Timestamp */}
            <div className="md:w-24 flex-shrink-0 p-3 border-b md:border-b-0 md:border-r flex flex-col items-center justify-center font-mono text-[10px] font-bold bg-[#0a0a0a] border-white/10 text-white/40">
                <span>{segment.timestamp || formatTime(segment.startTime)}</span>
                {isOverLimit && (
                    <span title={`Word limit exceeded: ${wordCount}/${maxWords}`}>
                        <AlertTriangle className="w-3 h-3 text-orange-400 mt-1" />
                    </span>
                )}
            </div>

            {/* Audio (Script) */}
            <div className={cn(
                "flex-1 p-4 border-b relative min-w-0 border-white/10 transition-opacity duration-300",
                visualGenerationType === 'image' ? "md:border-b-0 md:border-r" : "lg:border-b-0 lg:border-r",
                segment.copiedScript ? "opacity-50 grayscale hover:opacity-100 hover:grayscale-0" : ""
            )}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase opacity-60">Script</span>
                        <span className={cn("text-[9px] font-mono", isOverLimit ? "text-orange-400" : "text-white/30")}>
                            {wordCount}/{maxWords}w
                        </span>
                    </div>
                    <div className="flex items-center gap-2 relative z-20">
                        {toggleIcon('copiedScript')}
                        <button
                            onClick={() => handleCopy(segment.script, `script-${index}`, 'copiedScript')}
                            aria-label="Copy script"
                            className="p-1.5 rounded transition-colors hover:bg-white/10 border border-transparent hover:border-white/10"
                        >
                            {copiedId === `script-${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
                <textarea
                    value={segment.script}
                    onChange={(e) => updateSegmentScript(index, e.target.value)}
                    className={cn(
                        "text-sm leading-relaxed w-full min-h-[80px] bg-transparent border p-2 text-white resize-y rounded-sm transition-all outline-none",
                        "border-transparent focus:border-emerald-500/50 focus:bg-white/5",
                        segment.copiedScript ? "line-through opacity-70" : ""
                    )}
                />
            </div>

            {/* Visual Prompt */}
            <div className={cn(
                "flex-1 p-4 min-w-0 flex flex-col justify-between transition-opacity duration-300",
                visualGenerationType === 'image-to-video' ? "lg:border-r border-b lg:border-b-0 border-white/10" : "",
                theme.bgOpacity + " " + theme.textAccent,
                segment.copiedVisual ? "opacity-50 grayscale hover:opacity-100 hover:grayscale-0" : ""
            )}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase opacity-60">Visual Prompt</span>
                        {segment.cutType && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 backdrop-blur-sm border border-white/5">
                                {segment.cutType.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 relative z-20">
                        {toggleIcon('copiedVisual')}
                        <button
                            onClick={() => handleCopy(segment.visual, `visual-${index}`, 'copiedVisual')}
                            className={cn(
                                "p-1 rounded transition-colors",
                                segment.copiedVisual ? "bg-white/10 opacity-100" : "opacity-0 group-hover:opacity-100",
                                theme.hoverBgAccent
                            )}
                        >
                            {copiedId === `visual-${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
                <p className={cn("text-sm leading-relaxed italic transition-all", segment.copiedVisual ? "line-through opacity-70" : "opacity-90")}>"{segment.visual}"</p>
            </div>

            {/* Advanced Output: Motion & Animation Containers */}
            {visualGenerationType === 'image-to-video' && (
                <div className="flex-1 flex flex-col md:flex-row border-t border-white/10">
                    {segment.motion && (
                        <div className={cn(
                            "flex-1 p-4 min-w-0 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-white/10 text-white transition-opacity duration-300",
                            segment.copiedMotion ? "opacity-50 grayscale hover:opacity-100 hover:grayscale-0" : ""
                        )}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono uppercase opacity-60">Motion Prompt</span>
                                <div className="flex items-center gap-2 relative z-20">
                                    {toggleIcon('copiedMotion')}
                                    <button
                                        onClick={() => handleCopy(segment.motion as string, `motion-${index}`, 'copiedMotion')}
                                        className={cn(
                                            "p-1 rounded transition-colors",
                                            segment.copiedMotion ? "bg-white/10 opacity-100" : "opacity-0 group-hover:opacity-100",
                                            theme.hoverBgAccent
                                        )}
                                    >
                                        {copiedId === `motion-${index}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-1 flex items-start gap-2">
                                <Video className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <p className={cn("text-sm italic leading-relaxed text-emerald-400 transition-all", segment.copiedMotion ? "line-through opacity-70" : "")}>
                                    {segment.motion}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
});

export function GeneratorView() {
    // Selectors to minimize re-renders of the shell
    const contentIdea = useAppStore(state => state.contentIdea);
    const selectedTrend = useAppStore(state => state.selectedTrend);
    const setActiveTab = useAppStore(state => state.setActiveTab);
    const handleGenerate = useAppStore(state => state.handleGenerate);
    const copiedId = useAppStore(state => state.copiedId);
    const copyToClipboard = useAppStore(state => state.copyToClipboard);
    const copyAllForProduction = useAppStore(state => state.copyAllForProduction);
    const handleCritique = useAppStore(state => state.handleCritique);
    const isLoading = useAppStore(state => state.isLoading);
    const loadingMessage = useAppStore(state => state.loadingMessage);
    const analysis = useAppStore(state => state.analysis);
    const critique = useAppStore(state => state.critique);
    const setShowTimelineEditorModal = useAppStore(state => state.setShowTimelineEditorModal);
    const setShowPreGenModal = useAppStore(state => state.setShowPreGenModal);
    const uncheckAllSegments = useAppStore(state => state.uncheckAllSegments);
    const previousContentIdea = useAppStore(state => state.previousContentIdea);
    const clearPreviousContentIdea = useAppStore(state => state.clearPreviousContentIdea);
    const directIdea = useAppStore(state => state.directIdea); // B7 FIX: needed as fallback when selectedTrend is null (Direct Idea flow)
    
    // We still need the whole theme object as it's used in many places
    const theme = useTheme();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    if (isLoading && (!contentIdea || !contentIdea.segments || !Array.isArray(contentIdea.segments))) {
        return (
            <motion.div
                key="generator-loading"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="space-y-8"
            >
                <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10">
                    <div className="space-y-2 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <Wand2 className="w-5 h-5 animate-pulse text-emerald-500" />
                            <span className="font-mono text-sm tracking-widest text-emerald-500 uppercase">{loadingMessage || 'Generating Storyboard...'}</span>
                        </div>
                        <div className="h-10 w-3/4 bg-white/5 animate-pulse rounded-sm" />
                    </div>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                        <div className="h-6 w-32 bg-white/5 animate-pulse rounded-sm" />
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 w-full bg-white/5 animate-pulse rounded-sm" />)}
                        </div>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                        <div className="h-6 w-32 bg-white/5 animate-pulse rounded-sm" />
                        <div className="h-64 w-full bg-white/5 animate-pulse rounded-sm" />
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    if (!contentIdea || !contentIdea.segments || !Array.isArray(contentIdea.segments)) {
        const steps = [
            { num: 1, label: 'Analyze Trends', desc: 'Enter a niche & discover what\'s trending right now', done: !!analysis },
            { num: 2, label: 'Pick a Topic', desc: 'Select an exploding or steady trend from the results', done: false },
            { num: 3, label: 'Generate Script', desc: 'AI writes your full 60-second viral script', done: false },
            { num: 4, label: 'Roast & Improve', desc: 'Critique and refine until your script is irresistible', done: false },
        ];

        return (
            <motion.div
                key="generator-empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto py-16 space-y-10"
            >
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto border-2 rounded-full flex items-center justify-center mb-4 border-emerald-500/40 text-emerald-400">
                        <Wand2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ready to go viral?</h2>
                    <p className="text-sm max-w-sm mx-auto text-white/50">
                        Select a trending topic from the "Trends" tab, then come back here to generate a full script and visual storyboard.
                    </p>
                </div>

                <div className="space-y-4">
                    {steps.map((step) => (
                        <div
                            key={step.num}
                            className={cn(
                                "flex items-start gap-4 p-4 border transition-all",
                                step.done
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-white/5 border-white/10 opacity-60"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold flex-shrink-0",
                                step.done
                                    ? "bg-emerald-500 text-black"
                                    : "bg-white/10 text-white"
                            )}>
                                {step.done ? <Check className="w-5 h-5" /> : step.num}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold">{step.label}</h3>
                                <p className="text-xs opacity-60">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6">
                    <button
                        onClick={() => setActiveTab('trends')}
                        className="flex items-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {analysis ? 'Back to Trends — Pick a Topic' : 'Start: Analyze a Niche'}
                    </button>
                </div>
            </motion.div>
        );
    }

    const formatTime = (secs: number) => {
        if (secs == null || isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const truncateText = (text: string, max = 100) => {
        if (!text) return '';
        return text.length > max ? `${text.slice(0, max)}...` : text;
    };

    const renderScriptDiff = (beforeText: string, afterText: string, side: 'before' | 'after') => {
        const beforeWords = beforeText.trim().split(/\s+/).filter(Boolean);
        const afterWords = afterText.trim().split(/\s+/).filter(Boolean);
        const activeWords = side === 'before' ? beforeWords : afterWords;
        const otherWords = side === 'before' ? afterWords : beforeWords;
        return activeWords.map((word, idx) => {
            const changed = word !== (otherWords[idx] || '');
            return (
                <React.Fragment key={`${side}-${idx}`}>
                    {idx > 0 ? ' ' : ''}
                    {changed ? <mark className="bg-yellow-300/40 text-white px-0.5 rounded-sm">{word}</mark> : word}
                </React.Fragment>
            );
        });
    };

    const diffItems = React.useMemo(() => {
        if (!previousContentIdea || !contentIdea) return [];
        const beforeSegments = previousContentIdea.segments || [];
        const afterSegments = contentIdea.segments || [];
        const sharedLength = Math.min(beforeSegments.length, afterSegments.length);
        const items: Array<
            | { type: 'changed'; index: number; before: TimelineSegment; after: TimelineSegment }
            | { type: 'added'; index: number; after: TimelineSegment }
            | { type: 'removed'; index: number; before: TimelineSegment }
        > = [];

        for (let i = 0; i < sharedLength; i++) {
            const before = beforeSegments[i];
            const after = afterSegments[i];
            const scriptChanged = (before.script || '').trim() !== (after.script || '').trim();
            const visualChanged = (before.visual || '').trim() !== (after.visual || '').trim();
            if (scriptChanged || visualChanged) {
                items.push({ type: 'changed', index: i, before, after });
            }
        }

        if (afterSegments.length > sharedLength) {
            for (let i = sharedLength; i < afterSegments.length; i++) {
                items.push({ type: 'added', index: i, after: afterSegments[i] });
            }
        }

        if (beforeSegments.length > sharedLength) {
            for (let i = sharedLength; i < beforeSegments.length; i++) {
                items.push({ type: 'removed', index: i, before: beforeSegments[i] });
            }
        }

        return items;
    }, [previousContentIdea, contentIdea]);

    const handleUndoChanges = () => {
        if (!previousContentIdea) return;
        useAppStore.setState({ contentIdea: previousContentIdea });
        clearPreviousContentIdea();
    };

    return (
        <motion.div
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 md:space-y-12"
        >

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-white/10">
                <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 block">Generated Content for: {selectedTrend}</span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{contentIdea.title}</h2>
                    {contentIdea.hook && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 w-fit">
                            <Zap className="w-4 h-4 text-emerald-400" />
                            <p className="text-sm font-bold text-emerald-400 italic">"{contentIdea.hook}"</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap w-full md:w-auto gap-2 justify-end">
                    <button
                        onClick={() => setShowPreGenModal(true)}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5",
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Edit Config</span>
                    </button>
                    <button
                        onClick={() => handleGenerate(selectedTrend ?? directIdea ?? '')}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        <span>Regenerate</span>
                    </button>
                    <button
                        onClick={() => setShowTimelineEditorModal(true)}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        )}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Timeline Editor</span>
                    </button>
                    <button
                        onClick={() => downloadAsMarkdown(contentIdea, critique)}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5",
                        )}
                    >
                        <Download className="w-4 h-4" />
                        <span>Export .MD</span>
                    </button>
                    <button
                        onClick={() => downloadAsCSV(contentIdea)}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5",
                        )}
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={copyAllForProduction}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none",
                            theme.bg + " text-[#0a0a0a] " + theme.hoverBg
                        )}
                    >
                        {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copy All</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Column: Storyboard Timeline */}
                <div className="xl:col-span-8 space-y-8 flex flex-col relative">
                    {previousContentIdea && diffItems.length > 0 && (
                        <Section title="What Changed" icon={<RefreshCw className="w-5 h-5" />} action={
                            <button
                                onClick={clearPreviousContentIdea}
                                className="p-1.5 rounded-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                aria-label="Dismiss changes"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        }>
                            <div className="space-y-4">
                                <p className="text-xs font-mono uppercase tracking-widest text-white/60">
                                    {diffItems.length} segments changed out of {contentIdea.segments.length} total
                                </p>
                                <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                                    {diffItems.map((item) => {
                                        if (item.type === 'changed') {
                                            return (
                                                <div key={`changed-${item.index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-white/10 p-3 bg-[#1a1a1a]">
                                                    <div className="space-y-2 border border-red-500/20 bg-red-500/10 p-3">
                                                        <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">Before</p>
                                                        <p className="text-[10px] font-mono text-white/60">{item.before.timestamp || formatTime(item.before.startTime)}</p>
                                                        <p className="text-sm leading-relaxed text-white/80">{renderScriptDiff(item.before.script || '', item.after.script || '', 'before')}</p>
                                                        <p className="text-xs italic text-white/60">"{truncateText(item.before.visual || '')}"</p>
                                                    </div>
                                                    <div className="space-y-2 border border-emerald-500/20 bg-emerald-500/10 p-3">
                                                        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">After</p>
                                                        <p className="text-[10px] font-mono text-white/60">{item.after.timestamp || formatTime(item.after.startTime)}</p>
                                                        <p className="text-sm leading-relaxed text-white">{renderScriptDiff(item.before.script || '', item.after.script || '', 'after')}</p>
                                                        <p className="text-xs italic text-white/70">"{truncateText(item.after.visual || '')}"</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item.type === 'added') {
                                            return (
                                                <div key={`added-${item.index}`} className="border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                                                    <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Added Segment</p>
                                                    <p className="text-[10px] font-mono text-white/60">{item.after.timestamp || formatTime(item.after.startTime)}</p>
                                                    <p className="text-sm text-white/90">{item.after.script}</p>
                                                    <p className="text-xs italic text-white/70">"{truncateText(item.after.visual || '')}"</p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={`removed-${item.index}`} className="border border-red-500/30 bg-red-500/10 p-3 space-y-2">
                                                <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">Removed Segment</p>
                                                <p className="text-[10px] font-mono text-white/60">{item.before.timestamp || formatTime(item.before.startTime)}</p>
                                                <p className="text-sm text-white/80">{item.before.script}</p>
                                                <p className="text-xs italic text-white/60">"{truncateText(item.before.visual || '')}"</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-white/10">
                                    <button
                                        onClick={clearPreviousContentIdea}
                                        className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Keep Changes
                                    </button>
                                    <button
                                        onClick={handleUndoChanges}
                                        className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                                    >
                                        Undo Changes
                                    </button>
                                </div>
                            </div>
                        </Section>
                    )}
                    <Section 
                        title="Production Timeline" 
                        icon={<Clock className="w-5 h-5" />}
                        action={
                            <button
                                onClick={uncheckAllSegments}
                                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Uncheck All</span>
                            </button>
                        }
                    >
                        <div ref={scrollContainerRef} className="relative max-h-[600px] overflow-y-auto pr-2 flex-1 sm:pr-4 mx-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="relative space-y-4 pl-4 sm:pl-8">
                                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] opacity-10 bg-white" />
                                {contentIdea.segments?.map((seg, i) => (
                                    <TimelineSegmentRow key={seg.id} index={i} segment={seg} />
                                ))}
                            </div>
                        </div>
                    </Section>
                    <FloatingScrollButton containerRef={scrollContainerRef} />
                </div>

                {/* Right Column: Details */}
                <div className="xl:col-span-4 space-y-6 sm:space-y-8 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto custom-scrollbar pr-0 xl:pr-2 pb-0">
                    <Section title="A/B Test Pack" icon={<Zap className="w-5 h-5" />}>
                        {contentIdea.abTestPack ? (
                            <div className="space-y-4">
                                <div className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                                    Split Test Ready
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        contentIdea.abTestPack.variantA,
                                        contentIdea.abTestPack.variantB,
                                        contentIdea.abTestPack.variantC
                                    ].map((variant, i) => (
                                        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-sm space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">{variant.label}</span>
                                                <span className="text-[9px] font-mono uppercase px-2 py-1 border border-white/10 bg-white/5 text-white/70">{variant.platformFit}</span>
                                            </div>
                                            <p className="text-sm font-bold leading-snug">"{variant.hook}"</p>
                                            <p className="text-xs text-white/80 leading-relaxed">{variant.title}</p>
                                            <span className="inline-flex text-[9px] font-mono uppercase px-2 py-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                                {variant.thumbnailText}
                                            </span>
                                            <p className="text-[11px] text-white/60 italic leading-relaxed">{variant.testHypothesis}</p>
                                            <p className="text-[11px] text-white/70 leading-relaxed">Best for: {variant.suggestedAudience}</p>
                                            <div className="p-2 border border-white/10 bg-[#0a0a0a]">
                                                <p className="text-[11px] text-white/80 leading-relaxed">{variant.testInstructions}</p>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => copyToClipboard(variant.hook, `ab-hook-${i}`)}
                                                    className="px-2 py-1 text-[10px] font-mono uppercase border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
                                                >
                                                    {copiedId === `ab-hook-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    Hook
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(variant.title, `ab-title-${i}`)}
                                                    className="px-2 py-1 text-[10px] font-mono uppercase border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
                                                >
                                                    {copiedId === `ab-title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    Title
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {contentIdea.hookVariations?.length > 0 ? (
                                    contentIdea.hookVariations.map((h, i) => (
                                        <div key={i} className="relative group p-3 bg-white/5 border border-white/10 rounded-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">{h.type}</span>
                                                <button
                                                    onClick={() => copyToClipboard(h.text, `hook-${i}`)}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-colors"
                                                >
                                                    {copiedId === `hook-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            <p className="text-sm italic font-bold leading-snug pr-4">"{h.text}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm opacity-50 italic">Generating hooks...</p>
                                )}
                            </div>
                        )}
                    </Section>

                    <Section title="SEO Metadata (Titles & Description)" icon={<Hash className="w-5 h-5" />}>
                        {contentIdea.seoMetadata ? (
                            <div className="space-y-4 relative group">
                                <button
                                    onClick={() => copyToClipboard(`${contentIdea.seoMetadata!.youtubeTitle}\n\n${contentIdea.seoMetadata!.youtubeDescription}\n\n${contentIdea.hashtags.map(h => `#${h}`).join(' ')}`, 'seo-meta')}
                                    aria-label="Copy All SEO Metadata"
                                    className="absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                >
                                    {copiedId === 'seo-meta' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase opacity-50">YouTube Title</label>
                                    <p className="font-bold text-sm">{contentIdea.seoMetadata.youtubeTitle}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase opacity-50">Description</label>
                                    <p className="text-xs opacity-80 leading-relaxed pr-6">{contentIdea.seoMetadata.youtubeDescription}</p>
                                </div>
                                <div className="space-y-1 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm mt-3">
                                    <label className="text-[10px] font-mono uppercase text-emerald-400">Pinned Comment Idea</label>
                                    <p className="text-xs font-bold italic">"{contentIdea.seoMetadata.pinnedCommentIdea}"</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                                    {contentIdea.hashtags.map((h, i) => {
                                        const tag = `#${h.replace('#', '')}`;
                                        return (
                                            <motion.button
                                                key={i}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                                className={cn(
                                                    "text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-sm border transition-colors flex items-center gap-1",
                                                    theme.textAccent + " " + theme.borderAccent + " " + theme.bgAccent
                                                )}
                                            >
                                                {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : null}
                                                {tag}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm opacity-50 italic">Generating SEO metadata...</p>
                            </div>
                        )}
                    </Section>

                    <Section title="Editing & Post" icon={<Layers className="w-5 h-5" />} collapsible defaultCollapsed>
                        <div className="space-y-3">
                            {contentIdea.editingEffects.map((effect, i) => (
                                <div key={i} className={cn(
                                    "flex items-start gap-2 p-3 text-sm border",
                                    theme.bgOpacity + " " + theme.borderAccent2 + " " + theme.textAccent
                                )}>
                                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{effect}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Recommended Font Style" icon={<ImageIcon className="w-5 h-5" />} collapsible defaultCollapsed>
                        <p className="text-sm leading-relaxed text-white/80">
                            <span className="font-bold">{contentIdea.fontStyle}</span>
                        </p>
                    </Section>

                    <Section title="Editing Effects Context" icon={<Video className="w-5 h-5" />} collapsible defaultCollapsed>
                        <p className="text-sm leading-relaxed text-white/80">
                            {contentIdea.editingEffectsContext}
                        </p>
                    </Section>

                    <div className="pt-6 pb-6 -mb-6 md:pb-8 md:-mb-8 border-t border-dashed sticky bottom-0 z-20 transition-colors bg-[#1a1a1a] border-white/10">
                        <button
                            onClick={handleCritique}
                            disabled={isLoading}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none disabled:opacity-80 disabled:cursor-not-allowed",
                                theme.bg + " text-[#0a0a0a] " + theme.hoverBg
                            )}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            {isLoading ? (loadingMessage || "Loading...") : "Roast My Script"}
                        </button>
                    </div>
                </div>
            </div>

            <TimelineEditorModal />
        </motion.div>
    );
}
