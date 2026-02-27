import React from 'react';
import { motion } from 'motion/react';
import { Wand2, ArrowLeft, ImageIcon, Video, RefreshCw, Copy, Check, Clock, Zap, Hash, Volume2, Music, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { useAppStore, useTheme } from '../../store/useAppStore';
import { VISUAL_STYLES } from '../../types';

export function GeneratorView() {
    const {
        contentIdea,
        selectedTrend,
        setActiveTab,
        handleGenerate,
        copiedId,
        copyToClipboard,
        copyAllForProduction,
        handleCritique,
        selectedVisualStyle,
        visualGenerationType,
        isLoading,
        setVisualStyle,
        setVisualGenerationType,
        analysis
    } = useAppStore();
    const theme = useTheme();

    if (!contentIdea) {
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
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto border-2 rounded-full flex items-center justify-center mb-4 border-emerald-500/40 text-emerald-400">
                        <Wand2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ready to go viral?</h2>
                    <p className="text-sm max-w-sm mx-auto text-white/50">
                        Select a trending topic from the "Trends" tab, then come back here to generate a full script and visual storyboard.
                    </p>
                </div>

                {/* Progress Steps */}
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

                {/* Return Action */}
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
                </div>
                <button
                    onClick={copyAllForProduction}
                    className={cn(
                        "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none",
                        `${theme.bg} text-[#0a0a0a] ${theme.hoverBg}`
                    )}
                >
                    {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>Copy All for Production</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Script (Bento Box) */}
                <div className="lg:col-span-7 space-y-8 flex flex-col">
                    <Section title="Production Timeline" icon={<Clock className="w-5 h-5" />}>
                        <div className="relative max-h-[600px] overflow-y-auto pr-2 sm:pr-4 max-w-3xl mx-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="relative space-y-4 pl-8">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] opacity-10 bg-white" />

                                {contentIdea.script.map((segment, i) => {
                                    const visualPrompt = contentIdea?.imagePrompts.find(p => p.frame === segment.timestamp);
                                    return (
                                        <div key={i} className={cn(
                                            "group relative flex flex-col md:flex-row border transition-all shadow-sm",
                                            "bg-[#1a1a1a] border-white/10 hover:border-emerald-500"
                                        )}>
                                            {/* Timeline Dot */}
                                            <div className={cn(
                                                "absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border z-10 transition-colors",
                                                `border-white/20 bg-[#0a0a0a] ${theme.groupHoverBg} ${theme.groupHoverBorder}`
                                            )} />

                                            <div className="md:w-20 flex-shrink-0 p-4 border-b md:border-b-0 md:border-r flex items-center justify-center font-mono text-xs font-bold bg-[#0a0a0a] border-white/10 text-white/40">
                                                {segment.timestamp}
                                            </div>
                                            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r relative min-w-0 border-white/10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-mono uppercase opacity-60">Script Segment</span>
                                                    <button
                                                        onClick={() => copyToClipboard(segment.text, `script-${i}`)}
                                                        aria-label="Copy script segment"
                                                        className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                                    >
                                                        {copiedId === `script-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                                <div
                                                    className="text-sm leading-relaxed w-full min-h-[80px] bg-transparent border-0 p-2 select-text text-white"
                                                >
                                                    {segment.text}
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "flex-1 p-4 min-w-0",
                                                `${theme.bgOpacity} ${theme.textAccent}`
                                            )}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-mono uppercase opacity-60">Visual Prompt</span>
                                                    {visualPrompt && (
                                                        <button
                                                            onClick={() => copyToClipboard(visualPrompt.prompt, `visual-${i}`)}
                                                            className={cn(
                                                                "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                                                theme.hoverBgAccent
                                                            )}
                                                        >
                                                            {copiedId === `visual-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                                {visualPrompt ? (
                                                    <p className="text-sm leading-relaxed italic opacity-90">"{visualPrompt.prompt}"</p>
                                                ) : (
                                                    <p className="text-xs italic opacity-40">No visual prompt generated for this segment.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Right Column: Details (Bento Box) */}
                <div className="lg:col-span-5 space-y-6 sm:space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-2 pb-0">
                    <Section title="Hook (0-3s)" icon={<Zap className="w-5 h-5" />}>
                        <div className="relative group">
                            <p className="text-xl font-bold italic pr-8">"{contentIdea.hook}"</p>
                            <button
                                onClick={() => copyToClipboard(contentIdea!.hook, 'hook')}
                                aria-label="Copy hook"
                                className="absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-white/10"
                            >
                                {copiedId === 'hook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </Section>

                    <Section title="Caption & Tags" icon={<Hash className="w-5 h-5" />}>
                        <div className="space-y-4 relative group">
                            <button
                                onClick={() => copyToClipboard(`${contentIdea!.caption}\n${contentIdea!.hashtags.map(h => `#${h}`).join(' ')}`, 'caption')}
                                aria-label="Copy caption"
                                className="absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-white/10"
                            >
                                {copiedId === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <p className="text-sm pr-8 opacity-80">{contentIdea.caption}</p>
                            <div className="flex flex-wrap gap-2">
                                {contentIdea.hashtags.map((h, i) => {
                                    const tag = `#${h.replace('#', '')}`;
                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                            className={cn(
                                                "text-xs font-mono px-2 py-1 rounded-sm border transition-colors flex items-center gap-1",
                                                `${theme.textAccent} ${theme.borderAccent} ${theme.bgAccent}`
                                            )}
                                        >
                                            {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : null}
                                            {tag}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </Section>

                    <Section title="Audio Design" icon={<Volume2 className="w-5 h-5" />}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Music className={cn("w-4 h-4", theme.textAccent)} />
                                <span className="font-bold">Music:</span> {contentIdea.musicStyle}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {contentIdea.soundEffects.map((s, i) => (
                                    <span key={i} className="px-2 py-1 border text-[10px] uppercase font-mono border-white/10 bg-[#0a0a0a]">{s}</span>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="Editing & Post" icon={<Layers className="w-5 h-5" />} collapsible defaultCollapsed>
                        <div className="space-y-3">
                            {contentIdea.editingEffects.map((effect, i) => (
                                <div key={i} className={cn(
                                    "flex items-start gap-2 p-3 text-sm border",
                                    `${theme.bgOpacity} ${theme.borderAccent2} ${theme.textAccent}`
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
                                "w-full flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                                `${theme.bg} text-[#0a0a0a] ${theme.hoverBg}`
                            )}
                        >
                            <Zap className="w-5 h-5" />
                            Roast My Script
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
