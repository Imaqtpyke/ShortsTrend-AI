import React from 'react';
import { motion } from 'motion/react';
import { Wand2, ArrowLeft, ImageIcon, Video, Layers, MessageSquare, Lightbulb, RefreshCw, Copy, Check, Clock, Zap, Hash, Volume2, Music } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { useAppState } from '../../hooks/useAppState';
import { VISUAL_STYLES } from '../../types';

interface GeneratorViewProps {
    appState: ReturnType<typeof useAppState>;
}

export function GeneratorView({ appState }: GeneratorViewProps) {
    const {
        state,
        setState,
        theme,
        setActiveTab,
        selectedTrend,
        handleGenerate,
        copiedId,
        copyToClipboard,
        copyAllForProduction,
        handleCritique
    } = appState;

    if (!state.contentIdea) {
        return (
            <motion.div
                key="generator-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center space-y-6"
            >
                <div className={cn(
                    "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                    state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                )}>
                    <Wand2 className="w-10 h-10" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">No Idea Selected</h2>
                    <p className="text-sm opacity-60">
                        Select a trend from the dashboard to generate a viral script and production plan.
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
            </motion.div>
        );
    }

    return (
        <motion.div
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            <div className={cn(
                "z-30 backdrop-blur-md border-b -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-8 flex flex-wrap items-center justify-between gap-4 transition-colors",
                state.isDarkMode ? "bg-[#0a0a0a]/90 border-white/10" : "bg-white/90 border-[#141414]"
            )}>
                <div className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                Visual Style
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {VISUAL_STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setState(prev => ({ ...prev, selectedVisualStyle: style }))}
                                        className={cn(
                                            "px-3 py-2 text-[10px] sm:text-xs font-mono uppercase border transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center",
                                            state.selectedVisualStyle === style
                                                ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                                : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                        )}
                                    >
                                        {style.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <Video className="w-2.5 h-2.5" />
                                Type
                            </label>
                            <div className="flex gap-2">
                                {(['image', 'video'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setState(prev => ({ ...prev, visualGenerationType: type }))}
                                        className={cn(
                                            "px-3 py-2 text-[10px] sm:text-xs font-mono uppercase border transition-all flex items-center gap-2 whitespace-nowrap w-full justify-center min-h-[44px]",
                                            state.visualGenerationType === type
                                                ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                                : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                        )}
                                    >
                                        {type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="target-audience-input" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <Layers className="w-2.5 h-2.5" />
                                Audience
                            </label>
                            <input
                                id="target-audience-input"
                                type="text"
                                value={state.targetAudience}
                                onChange={(e) => setState(prev => ({ ...prev, targetAudience: e.target.value }))}
                                placeholder="e.g., Gen Z gamers"
                                className={cn(
                                    "w-full px-3 py-3 text-xs font-mono uppercase border transition-all min-h-[44px]",
                                    state.isDarkMode
                                        ? "bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500"
                                        : "bg-white text-[#141414] border-gray-200 focus:border-[#141414]"
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="tone-input" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <MessageSquare className="w-2.5 h-2.5" />
                                Tone
                            </label>
                            <input
                                id="tone-input"
                                type="text"
                                value={state.tone}
                                onChange={(e) => setState(prev => ({ ...prev, tone: e.target.value }))}
                                placeholder="e.g., Sarcastic, Informative"
                                className={cn(
                                    "w-full px-3 py-3 text-xs font-mono uppercase border transition-all min-h-[44px]",
                                    state.isDarkMode
                                        ? "bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500"
                                        : "bg-white text-[#141414] border-gray-200 focus:border-[#141414]"
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="temperature-slider" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                            <Lightbulb className="w-2.5 h-2.5" />
                            Creativity ({state.temperature})
                        </label>
                        <input
                            id="temperature-slider"
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={state.temperature}
                            onChange={(e) => setState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className={cn(
                                "w-full h-1 rounded-lg appearance-none cursor-pointer mt-2.5",
                                state.isDarkMode ? "bg-white/10 accent-emerald-500" : "bg-gray-200 accent-[#141414]"
                            )}
                        />
                    </div>

                    <button
                        onClick={() => handleGenerate(selectedTrend || '')}
                        disabled={state.isLoading}
                        className={cn(
                            "w-full px-3 py-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm active:translate-y-0.5 active:shadow-none",
                            state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.accent}-600 ${theme.hoverBg}` : "bg-red-600 text-white border-red-700 hover:bg-red-700"
                        )}
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", state.isLoading && "animate-spin")} />
                        <span>Regenerate</span>
                    </button>
                </div>
            </div>

            <div className={cn(
                "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6",
                state.isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
                <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 block">Generated Content for: {selectedTrend}</span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{state.contentIdea.title}</h2>
                </div>
                <button
                    onClick={copyAllForProduction}
                    className={cn(
                        "flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none",
                        state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                    )}
                >
                    {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>Copy All for Production</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Script (Bento Box) */}
                <div className="lg:col-span-7 space-y-8 flex flex-col">
                    <Section title="Production Timeline" icon={<Clock className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className="relative max-h-[600px] overflow-y-auto pr-4 custom-scrollbar max-w-3xl mx-auto w-full">
                            <div className="relative space-y-4 pl-8">
                                {/* Vertical Timeline Line */}
                                <div className={cn(
                                    "absolute left-[15px] top-2 bottom-2 w-[2px] opacity-10",
                                    state.isDarkMode ? "bg-white" : "bg-[#141414]"
                                )} />

                                {state.contentIdea.script.map((segment, i) => {
                                    const visualPrompt = state.contentIdea?.imagePrompts.find(p => p.frame === segment.timestamp);
                                    return (
                                        <div key={i} className={cn(
                                            "group relative flex flex-col md:flex-row border transition-all shadow-sm",
                                            state.isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500" : "bg-white border-[#141414] hover:border-red-600"
                                        )}>
                                            {/* Timeline Dot */}
                                            <div className={cn(
                                                "absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border z-10 transition-colors",
                                                state.isDarkMode
                                                    ? `border-white/20 bg-[#0a0a0a] group-hover:bg-${theme.primary} group-hover:border-${theme.primary}`
                                                    : "border-[#141414] bg-[#E4E3E0] group-hover:bg-red-600 group-hover:border-red-600"
                                            )} />

                                            <div className={cn(
                                                "md:w-20 flex-shrink-0 p-4 border-b md:border-b-0 md:border-r flex items-center justify-center font-mono text-xs font-bold",
                                                state.isDarkMode ? "bg-[#0a0a0a] border-white/10 text-white/40" : "bg-gray-100 border-[#141414] text-gray-500"
                                            )}>
                                                {segment.timestamp}
                                            </div>
                                            <div className={cn(
                                                "flex-1 p-4 border-b md:border-b-0 md:border-r relative min-w-0",
                                                state.isDarkMode ? "border-white/10" : "border-[#141414]"
                                            )}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-mono uppercase opacity-60">Script Segment</span>
                                                    <button
                                                        onClick={() => copyToClipboard(segment.text, `script-${i}`)}
                                                        aria-label="Copy script segment"
                                                        className={cn(
                                                            "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                                            state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                                                        )}
                                                    >
                                                        {copiedId === `script-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                                <p className="text-sm leading-relaxed">{segment.text}</p>
                                            </div>
                                            <div className={cn(
                                                "flex-1 p-4 min-w-0",
                                                state.isDarkMode ? `${theme.bgOpacity} ${theme.textAccent}` : "bg-[#141414] text-[#E4E3E0]"
                                            )}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-mono uppercase opacity-60">Visual Prompt</span>
                                                    {visualPrompt && (
                                                        <button
                                                            onClick={() => copyToClipboard(visualPrompt.prompt, `visual-${i}`)}
                                                            className={cn(
                                                                "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                                                state.isDarkMode ? theme.hoverBgAccent : "hover:bg-white/20"
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
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-2 pb-2">
                    <Section title="Hook (0-3s)" icon={<Zap className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className="relative group">
                            <p className="text-xl font-bold italic pr-8">"{state.contentIdea.hook}"</p>
                            <button
                                onClick={() => copyToClipboard(state.contentIdea!.hook, 'hook')}
                                aria-label="Copy hook"
                                className={cn(
                                    "absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                    state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                                )}
                            >
                                {copiedId === 'hook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </Section>

                    <Section title="Caption & Tags" icon={<Hash className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className="space-y-4 relative group">
                            <button
                                onClick={() => copyToClipboard(`${state.contentIdea!.caption}\n${state.contentIdea!.hashtags.map(h => `#${h}`).join(' ')}`, 'caption')}
                                aria-label="Copy caption"
                                className={cn(
                                    "absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                    state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                                )}
                            >
                                {copiedId === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <p className="text-sm pr-8 opacity-80">{state.contentIdea.caption}</p>
                            <div className="flex flex-wrap gap-2">
                                {state.contentIdea.hashtags.map((h, i) => {
                                    const tag = `#${h.replace('#', '')}`;
                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                            className={cn(
                                                "text-xs font-mono px-2 py-1 rounded-sm border transition-colors flex items-center gap-1",
                                                state.isDarkMode
                                                    ? `${theme.textAccent} ${theme.borderAccent} ${theme.bgAccent}`
                                                    : "text-blue-600 border-blue-600/30 hover:bg-blue-50"
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

                    <Section title="Audio Design" icon={<Volume2 className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Music className={cn("w-4 h-4", state.isDarkMode ? theme.textAccent : "text-purple-500")} />
                                <span className="font-bold">Music:</span> {state.contentIdea.musicStyle}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {state.contentIdea.soundEffects.map((s, i) => (
                                    <span key={i} className={cn(
                                        "px-2 py-1 border text-[10px] uppercase font-mono",
                                        state.isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-[#141414] bg-white"
                                    )}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="Editing & Post" icon={<Layers className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className="space-y-3">
                            {state.contentIdea.editingEffects.map((effect, i) => (
                                <div key={i} className={cn(
                                    "flex items-start gap-2 p-3 text-sm border",
                                    state.isDarkMode ? `${theme.bgOpacity} ${theme.borderAccent2} ${theme.textAccent}` : "bg-blue-50 border-blue-100 text-blue-900"
                                )}>
                                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{effect}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Recommended Font Style" icon={<ImageIcon className="w-5 h-5 text-blue-600" />} isDarkMode={state.isDarkMode}>
                        <p className={cn("text-sm leading-relaxed", state.isDarkMode ? "text-white/80" : "text-[#141414]")}>
                            <span className="font-bold">{state.contentIdea.fontStyle}</span>
                        </p>
                    </Section>

                    <Section title="Editing Effects Context" icon={<Video className="w-5 h-5 text-purple-600" />} isDarkMode={state.isDarkMode}>
                        <p className={cn("text-sm leading-relaxed", state.isDarkMode ? "text-white/80" : "text-[#141414]")}>
                            {state.contentIdea.editingEffectsContext}
                        </p>
                    </Section>

                    <div className={cn(
                        "pt-6 border-t border-dashed sticky bottom-0 z-20 transition-colors",
                        state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]/10"
                    )}>
                        <button
                            onClick={handleCritique}
                            disabled={state.isLoading}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                                state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
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
