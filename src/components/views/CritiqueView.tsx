import React from 'react';
import { motion } from 'motion/react';
import { BarChart, ArrowLeft, Zap, Loader2, TrendingUp, AlertTriangle, ThumbsUp, Wand2, Copy, Check, ImageIcon, Lightbulb, Play, Square, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeTs } from '../../lib/utils';
import { Section } from '../ui/Section';
import { RetentionGraph } from '../ui/RetentionGraph';
import { useAppStore, useTheme } from '../../store/useAppStore';
import { useTTS } from '../../hooks/useTTS';
import { downloadAsMarkdown } from '../../lib/exportUtils';



export function CritiqueView() {
    const {
        isLoading,
        contentIdea,
        critique,
        workflow,
        history,
        setActiveTab,
        handleCritique,
        handleImprove,
        copiedId,
        copyToClipboard,
        confirmApply,
        setConfirmApply,
        applyImprovedScript,
        visualGenerationType
    } = useAppStore();
    const theme = useTheme();
    const { speak, stop, isPlaying, activeText } = useTTS();

    if (!contentIdea) {
        return (
            <motion.div key="critique-no-idea" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto py-16 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center border-white/10 text-white/20">
                    <BarChart className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">No Script to Roast</h2>
                    <p className="text-sm text-white/50">
                        You need a generated script first. Analyze a niche, pick a trend, then generate your script.
                    </p>
                </div>
                <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3 justify-center">
                    <button onClick={() => setActiveTab('trends')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all focus-ring bg-white/10 text-white hover:bg-white/20">
                        <ArrowLeft className="w-4 h-4" /> Analyze Trends
                    </button>
                    <button onClick={() => setActiveTab('generator')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all focus-ring bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400">
                        <Wand2 className="w-4 h-4" /> Content Generator
                    </button>
                </div>
            </motion.div>
        );
    }

    if (!critique) {
        return (
            <motion.div key="critique-view-no-roast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto py-16 space-y-8">
                {/* Animated icon */}
                <div className="text-center space-y-3">
                    <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center border-emerald-500/40 text-emerald-400">
                        <Zap className="w-8 h-8" />
                    </motion.div>
                    <h2 className="text-2xl font-bold tracking-tight">Ready to Roast</h2>
                    <p className="text-sm max-w-sm mx-auto text-white/50">
                        Your script is generated. Now let AI tear it apart — and then make it 10× better.
                    </p>
                </div>
                {/* What the roast does */}
                {[
                    { icon: <BarChart className="w-4 h-4" />, label: 'Virality Score', desc: 'Rated 0-100 vs current trends' },
                    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Retention Leaks', desc: 'Pinpoint every second viewers might scroll past' },
                    { icon: <Lightbulb className="w-4 h-4" />, label: 'Hook Alternatives', desc: '3 punchier opening lines to test' },
                ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-start gap-3 p-4 border border-white/10 bg-white/[0.02]">
                        <div className="text-emerald-500 mt-0.5">{item.icon}</div>
                        <div>
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
                <div className="flex justify-center">
                    <button onClick={handleCritique} disabled={isLoading}
                        className="flex items-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none disabled:opacity-50 bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        Roast My Script Now
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="critique-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-12 text-left"
        >
            {/* Bug 1+5 Fix: Inline loading banner so the user sees feedback while Roast/Improve
                runs. The full-page skeleton no longer replaces this view, so we show a subtle
                top banner with the current loading message instead. */}
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-4 py-3 border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-mono uppercase tracking-widest"
                >
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>AI is working on your script — this may take 30–45 seconds...</span>
                </motion.div>
            )}
            <div className="border-b pb-6 border-white/10">
                <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2 block">
                    {critique.improvedScript ? "Improved Script Critique" : "AI Critique Result"}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {critique.improvedScript ? "New Roast Results" : "Script Roast"}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Overall Feedback (Hero Tile - Left, extends 2 rows) */}
                <div className="md:col-span-6 md:row-span-2 flex flex-col p-6 rounded-2xl border transition-colors bg-blue-500/5 border-blue-500/20 text-blue-400">
                    <div className="flex items-center gap-2 mb-4">
                        <ThumbsUp className="w-5 h-5 flex-shrink-0" />
                        <h3 className="font-bold">Overall Feedback</h3>
                    </div>
                    <div className="text-sm leading-relaxed flex-1">
                        {critique.overallFeedback}
                    </div>
                </div>

                {/* Simulated Retention Graph (Top Right) */}
                <div className="md:col-span-6 flex flex-col p-6 rounded-2xl border transition-colors bg-[#1a1a1a] border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <h3 className="font-bold">Simulated Retention Graph</h3>
                    </div>
                    <RetentionGraph leaks={critique.retentionLeaks} />
                    <div className="mt-4 flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span className="font-mono text-[10px] uppercase opacity-60">
                                {critique.improvedScript ? "Improved Script" : "Original Script"}
                            </span>
                        </div>
                        {!critique.improvedScript && (
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 border border-dashed rounded-full", `${theme.border}`)} />
                                <span className="font-mono text-[10px] uppercase opacity-60">Improved (Predicted)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Virality Score (Bottom Right - Left half) */}
                <div className={cn(
                    "md:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors text-center border-white/10",
                    critique.viralityScore >= 80 ? "bg-emerald-600 text-white" :
                        critique.viralityScore >= 50 ? "bg-yellow-400 text-[#141414]" :
                            "bg-red-600 text-white"
                )}>
                    <span className="font-mono text-xs uppercase tracking-widest opacity-70 mb-2">Virality Score</span>
                    <span className="text-5xl sm:text-6xl font-bold tracking-tighter">{critique.viralityScore}</span>
                    <span className="text-sm opacity-70 mt-2">/ 100</span>
                </div>

                {/* Retention Leaks (Bottom Right - Right half) */}
                <div className="md:col-span-3 flex flex-col p-6 rounded-2xl border transition-colors overflow-hidden bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <h3 className="font-bold text-sm text-red-400">Retention Leaks</h3>
                    </div>
                    {critique.retentionLeaks.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                            {critique.retentionLeaks.map((leak, i) => (
                                <div key={i} className="flex flex-col gap-1 text-xs text-red-400">
                                    <div className="font-mono text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-sm inline-block w-max">
                                        {leak.timestamp}s
                                    </div>
                                    <span className="opacity-80 line-clamp-3">{leak.issue}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs italic opacity-80 flex-1 flex items-center text-emerald-400">
                            No retention leaks found!
                        </div>
                    )}
                </div>

                {/* Punchier Hook Alternatives (Full Width) */}
                <div className="md:col-span-12 flex flex-col p-6 rounded-2xl border transition-colors bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <h3 className="font-bold text-yellow-400">Punchier Hook Alternatives</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {critique.hookSuggestions.map((hook, i) => (
                            <div key={i} className="p-4 rounded-xl border text-sm font-bold italic transition-colors flex items-center justify-center text-center bg-yellow-500/10 border-yellow-500/20 text-yellow-400">
                                "{hook}"
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {!critique.improvedScript ? (
                <div className="pt-8 flex flex-col items-center justify-center text-center space-y-6 border-t border-dashed border-white/10">
                    <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight">Ready to level up?</h3>
                        <p className="opacity-60 max-w-md mx-auto text-sm md:text-base">Our AI can rewrite your script based on this roast, fixing every retention leak and optimizing for maximum virality.</p>
                    </div>

                    <button
                        onClick={handleImprove}
                        disabled={isLoading}
                        className="flex items-center gap-3 px-12 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none bg-purple-600 text-white hover:bg-purple-500"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                        Generate Viral Script
                    </button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12 border-t border-dashed border-white/10 pt-12"
                >
                    <Section title="Improved Script Comparison" icon={<Wand2 className="w-5 h-5 text-purple-600" />}>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => downloadAsMarkdown(contentIdea, critique)}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none bg-[#1a1a1a] border border-white/10 hover:bg-white/5",
                                )}
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Final Artifact .MD</span>
                            </button>
                        </div>
                        <div className="space-y-6">
                            {critique.improvedScript.map((improvedSegment, i) => {
                                const originalSegment = contentIdea.script.find(
                                    // Bug 4 Fix: Use shared normalizeTs so em-dash vs hyphen
                                    // differences don't cause "No original mapped" for every row.
                                    s => normalizeTs(s.timestamp) === normalizeTs(improvedSegment.timestamp)
                                ) || { timestamp: improvedSegment.timestamp, text: "No original mapped" };

                                return (
                                    <div key={i} className="flex flex-col md:flex-row border border-white/10 overflow-hidden bg-[#1a1a1a]">
                                        {/* Original Segment */}
                                        <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 flex flex-col group relative">
                                            <div className="p-2 border-b border-white/10 flex justify-between items-center opacity-60">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-white px-1.5 py-0.5 rounded-sm">{originalSegment.timestamp}</span>
                                                    <span className="text-[10px] font-mono uppercase">Original</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => isPlaying && activeText === originalSegment.text ? stop() : speak(originalSegment.text)}
                                                        className={cn(
                                                            "p-1 rounded transition-colors",
                                                            isPlaying && activeText === originalSegment.text ? "bg-emerald-500 text-black border-transparent" : "hover:bg-white/10 border border-transparent hover:border-white/10"
                                                        )}
                                                    >
                                                        {isPlaying && activeText === originalSegment.text ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 font-mono text-xs leading-relaxed text-white/60">
                                                {originalSegment.text}
                                            </div>
                                        </div>

                                        {/* Improved Segment */}
                                        <div className="flex-1 bg-purple-500/5 group relative flex flex-col">
                                            <div className="p-2 border-b border-purple-500/20 flex justify-between items-center bg-purple-500/10">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-sm">{improvedSegment.timestamp}</span>
                                                    <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">Improved Revision</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => isPlaying && activeText === improvedSegment.text ? stop() : speak(improvedSegment.text)}
                                                        className={cn(
                                                            "p-1 rounded transition-colors",
                                                            isPlaying && activeText === improvedSegment.text ? "bg-purple-600 text-white border-transparent" : "hover:bg-purple-500/20 text-purple-400 border border-transparent hover:border-purple-500/30"
                                                        )}
                                                    >
                                                        {isPlaying && activeText === improvedSegment.text ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(improvedSegment.text, `improved-${i}`)}
                                                        className="p-1 rounded transition-colors hover:bg-purple-500/20 text-purple-400 border border-transparent hover:border-purple-500/30"
                                                    >
                                                        {copiedId === `improved-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 font-mono text-xs leading-relaxed text-purple-300 font-bold shadow-inner">
                                                {improvedSegment.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    <Section title="Improved Visual Prompts" icon={<ImageIcon className="w-5 h-5 text-emerald-500" />} collapsible defaultCollapsed>
                        <div className="space-y-4">
                            {critique.improvedImagePrompts && critique.improvedImagePrompts.length > 0 ? (
                                critique.improvedImagePrompts.map((p, i) => (
                                    <div
                                        key={i}
                                        className="p-4 border font-mono text-xs bg-[#1a1a1a] border-white/10"
                                    >
                                        <div className="flex items-center gap-2 mb-2 opacity-50">
                                            <ImageIcon className="w-3 h-3" />
                                            <span>{p.frame}</span>
                                        </div>
                                        <p className="leading-relaxed">{p.prompt}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm opacity-60 italic p-4">No visual prompts provided for improved script.</p>
                            )}
                        </div>
                    </Section>

                    <button
                        onClick={() => {
                            if (confirmApply) {
                                applyImprovedScript();
                                setConfirmApply(false);
                            } else {
                                setConfirmApply(true);
                                setTimeout(() => setConfirmApply(false), 3000);
                            }
                        }}
                        className={cn(
                            "w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 font-mono text-xs uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none sticky bottom-0 z-20",
                            confirmApply
                                ? "bg-red-500 text-white"
                                : "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400"
                        )}
                    >
                        {confirmApply ? <AlertTriangle className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                        {confirmApply ? "Are you sure? Original script will be replaced." : "Apply Improved Script to Generator"}
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
