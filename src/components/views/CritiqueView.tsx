import React from 'react';
import { motion } from 'motion/react';
import { BarChart, ArrowLeft, Zap, Loader2, TrendingUp, AlertTriangle, ThumbsUp, Wand2, Copy, Check, ImageIcon, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { RetentionGraph } from '../ui/RetentionGraph';
import { useAppStore, useTheme } from '../../store/useAppStore';



export function CritiqueView() {
    const {
        isDarkMode,
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
        applyImprovedScript
    } = useAppStore();
    const theme = useTheme();

    if (!contentIdea) {
        return (
            <motion.div key="critique-no-idea" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto py-16 text-center space-y-6">
                <div className={cn("w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center",
                    isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20")}>
                    <BarChart className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">No Script to Roast</h2>
                    <p className={cn("text-sm", isDarkMode ? "text-white/50" : "text-[#141414]/50")}>
                        You need a generated script first. Analyze a niche, pick a trend, then generate your script.
                    </p>
                </div>
                <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3 justify-center">
                    <button onClick={() => setActiveTab('trends')}
                        className={cn("w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all focus-ring",
                            isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#141414]/10 text-[#141414] hover:bg-[#141414]/20")}>
                        <ArrowLeft className="w-4 h-4" /> Analyze Trends
                    </button>
                    <button onClick={() => setActiveTab('generator')}
                        className={cn("w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all focus-ring",
                            isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]")}>
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
                        className={cn("w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center",
                            isDarkMode ? "border-emerald-500/40 text-emerald-400" : "border-emerald-600/40 text-emerald-600")}>
                        <Zap className="w-8 h-8" />
                    </motion.div>
                    <h2 className="text-2xl font-bold tracking-tight">Ready to Roast</h2>
                    <p className={cn("text-sm max-w-sm mx-auto", isDarkMode ? "text-white/50" : "text-[#141414]/50")}>
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
                        className={cn("flex items-start gap-3 p-4 border",
                            isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-[#141414]/10 bg-white/60")}>
                        <div className="text-emerald-500 mt-0.5">{item.icon}</div>
                        <div>
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className={cn("text-xs", isDarkMode ? "text-white/40" : "text-[#141414]/40")}>{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
                <div className="flex justify-center">
                    <button onClick={handleCritique} disabled={isLoading}
                        className={cn("flex items-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none disabled:opacity-50",
                            isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]")}>
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
            <div className={cn(
                "border-b pb-6",
                isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
                <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2 block">
                    {critique.improvedScript ? "Improved Script Critique" : "AI Critique Result"}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {critique.improvedScript ? "New Roast Results" : "Script Roast"}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={cn(
                    "p-4 sm:p-8 flex flex-col items-center justify-center text-center border transition-colors h-full",
                    isDarkMode ? "border-white/10" : "border-[#141414]",
                    critique.viralityScore >= 80 ? "bg-emerald-600 text-white" :
                        critique.viralityScore >= 50 ? "bg-yellow-400 text-[#141414]" :
                            "bg-red-600 text-white"
                )}>
                    <span className="font-mono text-xs uppercase tracking-widest opacity-70 mb-2">Virality Score</span>
                    <span className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter">{critique.viralityScore}</span>
                    <span className="text-sm opacity-70 mt-2">/ 100</span>
                </div>

                <div className="space-y-6">
                    <Section title="Simulated Retention Graph" icon={<TrendingUp className={cn("w-5 h-5", `${theme.text}`)} />} isDarkMode={isDarkMode}>
                        <div className={cn(
                            "p-6 border transition-colors",
                            isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                        )}>
                            <RetentionGraph leaks={critique.retentionLeaks} isDarkMode={isDarkMode} />
                            <div className="mt-4 flex flex-wrap gap-6 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span className="font-mono text-[10px] uppercase opacity-60">
                                        {critique.improvedScript ? "Improved Script" : "Original Script"}
                                    </span>
                                </div>
                                {!critique.improvedScript && (
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 border border-dashed rounded-full", `${theme.border}`)} />
                                        <span className="font-mono text-[10px] uppercase opacity-60">Improved Script (Predicted)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Section title="Retention Leaks (Boring Parts)" icon={<AlertTriangle className="w-5 h-5 text-red-600" />} isDarkMode={isDarkMode}>
                    {critique.retentionLeaks.length > 0 ? (
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-3"
                        >
                            {critique.retentionLeaks.map((leak, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                    "flex items-start gap-2 text-sm p-3 border transition-colors",
                                    isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-900"
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
                            isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-900"
                        )}>
                            No retention leaks found! This script is highly engaging.
                        </div>
                    )}
                </Section>

                <Section title="Punchier Hook Alternatives" icon={<Zap className="w-5 h-5 text-yellow-600" />} isDarkMode={isDarkMode}>
                    <motion.ul
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden" animate="show"
                        className="space-y-4"
                    >
                        {critique.hookSuggestions.map((hook, i) => (
                            <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                "p-4 border text-sm font-bold italic transition-colors",
                                isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-[#141414]"
                            )}>
                                "{hook}"
                            </motion.li>
                        ))}
                    </motion.ul>
                </Section>

                <div className="md:col-span-2">
                    <Section title="Overall Feedback" icon={<ThumbsUp className="w-5 h-5 text-blue-600" />} isDarkMode={isDarkMode}>
                        <div className={cn(
                            "p-6 border text-sm leading-relaxed transition-colors",
                            isDarkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-900"
                        )}>
                            {critique.overallFeedback}
                        </div>
                    </Section>
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
                        className={cn(
                            "flex items-center gap-3 px-12 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            isDarkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
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
                    <Section title="Improved Script Comparison" icon={<Wand2 className="w-5 h-5 text-purple-600" />} isDarkMode={isDarkMode}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <span className="text-[10px] font-mono uppercase opacity-60">Original Script</span>
                                <div className={cn(
                                    "font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 opacity-60 border transition-colors flex-1 break-words overflow-x-hidden max-h-[300px] md:max-h-[500px] overflow-y-auto custom-scrollbar",
                                    isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                                )}>
                                    {contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <span className="text-[10px] font-mono uppercase text-purple-600 font-bold">Improved Script</span>
                                <div className="relative group flex-1 flex flex-col">
                                    <div className={cn(
                                        "border font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 pr-12 shadow-lg transition-colors flex-1 break-words overflow-x-hidden max-h-[300px] md:max-h-[500px] overflow-y-auto custom-scrollbar",
                                        isDarkMode ? "bg-purple-500/10 border-purple-600 text-purple-400" : "bg-purple-50 border-purple-600 text-[#141414]"
                                    )}>
                                        {critique.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(critique!.improvedScript!.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n'), 'improved-script')}
                                        className={cn(
                                            "absolute right-3 top-3 p-2 rounded border transition-all opacity-0 group-hover:opacity-100 shadow-sm",
                                            isDarkMode ? "bg-white/10 border-purple-500/20" : "bg-white/50 border-purple-200"
                                        )}
                                    >
                                        {copiedId === 'improved-script' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Improved Visual Prompts" icon={<ImageIcon className="w-5 h-5 text-emerald-500" />} isDarkMode={isDarkMode} collapsible defaultCollapsed>
                        <div className="space-y-4">
                            {critique.improvedImagePrompts && critique.improvedImagePrompts.length > 0 ? (
                                critique.improvedImagePrompts.map((p, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-4 border font-mono text-xs",
                                            isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
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
                                ? (isDarkMode ? "bg-red-500 text-white" : "bg-red-600 text-white")
                                : (isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-purple-600 text-white hover:bg-purple-700")
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
