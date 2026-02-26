import React from 'react';
import { motion } from 'motion/react';
import { BarChart, ArrowLeft, Zap, Loader2, TrendingUp, AlertTriangle, ThumbsUp, Wand2, Copy, Check, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { RetentionGraph } from '../ui/RetentionGraph';
import { useAppState } from '../../hooks/useAppState';

interface CritiqueViewProps {
    appState: ReturnType<typeof useAppState>;
}

export function CritiqueView({ appState }: CritiqueViewProps) {
    const {
        state,
        theme,
        setActiveTab,
        handleCritique,
        handleImprove,
        copiedId,
        copyToClipboard,
        confirmApply,
        setConfirmApply,
        applyImprovedScript
    } = appState;

    if (!state.contentIdea) {
        return (
            <motion.div
                key="critique-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                    <div className={cn(
                        "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                        state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                    )}>
                        <BarChart className="w-10 h-10" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">No Script to Roast</h2>
                        <p className="text-sm opacity-60">
                            You need a generated script before you can roast it. Start by selecting a trend.
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={cn(
                            "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go to Trends
                    </button>
                </div>
            </motion.div>
        );
    }

    if (!state.critique) {
        return (
            <motion.div
                key="critique-view-no-roast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className={cn(
                            "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                            state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                        )}>
                        <Zap className="w-10 h-10" />
                    </motion.div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">No Roast Yet</h2>
                        <p className="text-sm opacity-60">
                            You haven't roasted this script yet. Let our AI find the boring parts and fix them for you.
                        </p>
                    </div>
                    <button
                        onClick={handleCritique}
                        disabled={state.isLoading}
                        className={cn(
                            "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                    >
                        {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        Roast My Script
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
            <div className={cn(
                "border-b pb-6",
                state.isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
                <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2 block">
                    {state.critique.improvedScript ? "Improved Script Critique" : "AI Critique Result"}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {state.critique.improvedScript ? "New Roast Results" : "Script Roast"}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={cn(
                    "p-8 flex flex-col items-center justify-center text-center border transition-colors h-full",
                    state.isDarkMode ? "border-white/10" : "border-[#141414]",
                    state.critique.viralityScore >= 80 ? "bg-emerald-600 text-white" :
                        state.critique.viralityScore >= 50 ? "bg-yellow-400 text-[#141414]" :
                            "bg-red-600 text-white"
                )}>
                    <span className="font-mono text-xs uppercase tracking-widest opacity-70 mb-2">Virality Score</span>
                    <span className="text-5xl md:text-8xl font-bold tracking-tighter">{state.critique.viralityScore}</span>
                    <span className="text-sm opacity-70 mt-2">/ 100</span>
                </div>

                <div className="space-y-6">
                    <Section title="Simulated Retention Graph" icon={<TrendingUp className={cn("w-5 h-5", `text-${theme.primary}`)} />} isDarkMode={state.isDarkMode}>
                        <div className={cn(
                            "p-6 border transition-colors",
                            state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                        )}>
                            <RetentionGraph leaks={state.critique.retentionLeaks} isDarkMode={state.isDarkMode} />
                            <div className="mt-4 flex flex-wrap gap-6 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span className="font-mono text-[10px] uppercase opacity-60">
                                        {state.critique.improvedScript ? "Improved Script" : "Original Script"}
                                    </span>
                                </div>
                                {!state.critique.improvedScript && (
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 border border-dashed rounded-full", `border-${theme.primary}`)} />
                                        <span className="font-mono text-[10px] uppercase opacity-60">Improved Script (Predicted)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Section title="Retention Leaks (Boring Parts)" icon={<AlertTriangle className="w-5 h-5 text-red-600" />} isDarkMode={state.isDarkMode}>
                    {state.critique.retentionLeaks.length > 0 ? (
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-3"
                        >
                            {state.critique.retentionLeaks.map((leak, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                    "flex items-start gap-2 text-sm p-3 border transition-colors",
                                    state.isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-900"
                                )}>
                                    <div className="font-mono text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5">
                                        {leak.timestamp}s
                                    </div>
                                    <span>{leak.issue}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    ) : (
                        <div className={cn(
                            "p-4 border text-sm italic",
                            state.isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-900"
                        )}>
                            No retention leaks found! This script is highly engaging.
                        </div>
                    )}
                </Section>

                <Section title="Punchier Hook Alternatives" icon={<Zap className="w-5 h-5 text-yellow-600" />} isDarkMode={state.isDarkMode}>
                    <motion.ul
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden" animate="show"
                        className="space-y-4"
                    >
                        {state.critique.hookSuggestions.map((hook, i) => (
                            <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                "p-4 border text-sm font-bold italic transition-colors",
                                state.isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-[#141414]"
                            )}>
                                "{hook}"
                            </motion.li>
                        ))}
                    </motion.ul>
                </Section>

                <Section title="Overall Feedback" icon={<ThumbsUp className="w-5 h-5 text-blue-600" />} isDarkMode={state.isDarkMode}>
                    <div className={cn(
                        "p-6 border text-sm leading-relaxed transition-colors",
                        state.isDarkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-900"
                    )}>
                        {state.critique.overallFeedback}
                    </div>
                </Section>
            </div>

            {!state.critique.improvedScript ? (
                <div className="pt-8 flex flex-col items-center justify-center text-center space-y-6 border-t border-dashed border-white/10">
                    <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight">Ready to level up?</h3>
                        <p className="opacity-60 max-w-md mx-auto text-sm md:text-base">Our AI can rewrite your script based on this roast, fixing every retention leak and optimizing for maximum virality.</p>
                    </div>
                    <button
                        onClick={handleImprove}
                        disabled={state.isLoading}
                        className={cn(
                            "flex items-center gap-3 px-12 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                    >
                        {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                        Generate Viral Script
                    </button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12 border-t border-dashed border-white/10 pt-12"
                >
                    <Section title="Improved Script Comparison" icon={<Wand2 className="w-5 h-5 text-purple-600" />} isDarkMode={state.isDarkMode}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <span className="text-[10px] font-mono uppercase opacity-60">Original Script</span>
                                <div className={cn(
                                    "font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 opacity-60 border transition-colors flex-1 break-words overflow-x-hidden max-h-[500px] overflow-y-auto custom-scrollbar",
                                    state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                                )}>
                                    {state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <span className="text-[10px] font-mono uppercase text-purple-600 font-bold">Improved Script</span>
                                <div className="relative group flex-1 flex flex-col">
                                    <div className={cn(
                                        "border font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 pr-12 shadow-lg transition-colors flex-1 break-words overflow-x-hidden max-h-[500px] overflow-y-auto custom-scrollbar",
                                        state.isDarkMode ? "bg-purple-500/10 border-purple-600 text-purple-400" : "bg-purple-50 border-purple-600 text-[#141414]"
                                    )}>
                                        {state.critique.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(state.critique!.improvedScript!.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n'), 'improved-script')}
                                        className={cn(
                                            "absolute right-3 top-3 p-2 rounded border transition-all opacity-0 group-hover:opacity-100 shadow-sm",
                                            state.isDarkMode ? "bg-white/10 border-purple-500/20" : "bg-white/50 border-purple-200"
                                        )}
                                    >
                                        {copiedId === 'improved-script' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Improved Visual Prompts" isDarkMode={state.isDarkMode}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {state.critique.improvedImagePrompts && state.critique.improvedImagePrompts.length > 0 ? (
                                state.critique.improvedImagePrompts.map((p, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-4 border font-mono text-xs",
                                            state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                                        )}
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
                                ? (state.isDarkMode ? "bg-red-500 text-white" : "bg-red-600 text-white")
                                : (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-purple-600 text-white hover:bg-purple-700")
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
