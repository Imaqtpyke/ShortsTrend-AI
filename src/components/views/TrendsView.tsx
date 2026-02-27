import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Search, BarChart, Zap, MessageSquare, Music, Hash, Check, X, ImageIcon, Video, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { VISUAL_STYLES } from '../../types';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { TrendCard } from '../ui/TrendCard';
import { NicheDNARadar } from '../ui/NicheDNARadar';
import { Skeleton } from '../ui/Skeleton';
import { useAppStore, useTheme } from '../../store/useAppStore';

export function TrendsView() {
    const {
        analysis,
        searchQuery,
        setSearchQuery,
        trendFilter,
        setTrendFilter,
        handleAnalyze,
        handleGenerate,
        copiedId,
        copyToClipboard,
        isLoading,
        loadingMessage,
        selectedVisualStyle,
        setVisualStyle,
        visualGenerationType,
        setVisualGenerationType
    } = useAppStore();
    const theme = useTheme();
    const [selectedTrendForModal, setSelectedTrendForModal] = React.useState<string | null>(null);

    if (isLoading || !analysis) {
        return (
            <motion.div
                key="trends-loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 md:space-y-12"
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10">
                    <div className="space-y-2 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-5 h-5 animate-pulse text-emerald-500" />
                            <span className="font-mono text-sm tracking-widest text-emerald-500 uppercase">{loadingMessage || 'Analyzing Niche...'}</span>
                        </div>
                        <Skeleton className="h-10 w-3/4 max-w-sm" />
                    </div>
                    <div className="w-full md:w-64">
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                        <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />}>
                            <Skeleton className="h-48 md:h-64 w-full" />
                        </Section>
                        <Section title="Niche DNA Fingerprint" icon={<Zap className="w-5 h-5" />}>
                            <Skeleton className="h-64 w-full" />
                        </Section>
                    </div>

                    <Section title="Trending Topics">
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Skeleton className="h-32 w-full sm:col-span-2 lg:col-span-2" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        </div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                        <Section title="Viral Formats">
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                            </div>
                        </Section>
                        <Section title="Winning Hooks">
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                            </div>
                        </Section>
                        <Section title="Popular Music & SFX">
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                            </div>
                        </Section>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!analysis) return null;

    return (
        <motion.div
            key="trends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 md:space-y-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10">
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1 block">Analysis Result</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">
                        {searchQuery ? `Niche: ${searchQuery}` : 'General Trends'}
                    </h2>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search another niche..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        className="w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border min-h-[44px] bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500"
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                </div>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />}>
                        <div className="h-48 md:h-64 w-full p-2 md:p-4 border bg-[#0a0a0a] border-white/10" style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <ReBarChart data={analysis.trendingTopics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#ffffff60' }}
                                    />
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 50 }}
                                        allowEscapeViewBox={{ x: false, y: true }}
                                        cursor={{ fill: '#ffffff05' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="p-2 font-mono text-[10px] uppercase border bg-[#1a1a1a] text-white border-white/20">
                                                        <p className="font-bold mb-1">{data.name}</p>
                                                        <p>Velocity: {data.velocity}</p>
                                                        <p>Growth: {data.growth}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="velocity" radius={[2, 2, 0, 0]}>
                                        {analysis.trendingTopics.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.growth === 'exploding' ? '#ef4444' : '#10b981'}
                                            />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    <Section title="Niche DNA Fingerprint" icon={<Zap className={cn("w-5 h-5", `${theme.text}`)} />}>
                        <div className="h-64 w-full p-4 border transition-colors bg-[#0a0a0a] border-white/10">
                            <NicheDNARadar data={analysis.nicheDNA} />
                        </div>
                    </Section>
                </div>

                <Section title="Trending Topics">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2 border-b pb-4 border-white/10">
                            {(['all', 'exploding', 'steady', 'declining'] as const).map(filter => {
                                const count = filter === 'all'
                                    ? analysis!.trendingTopics.length
                                    : analysis!.trendingTopics.filter(t => t.growth === filter).length;

                                return (
                                    <button
                                        key={filter}
                                        onClick={() => setTrendFilter(filter)}
                                        className={cn(
                                            "px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest border transition-all focus-visible:ring-2 focus-visible:outline-none min-h-[44px]",
                                            theme.ring,
                                            trendFilter === filter
                                                ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.primary}`
                                                : `bg-[#1a1a1a] text-white border-white/10 ${theme.hoverBorder}`
                                        )}
                                    >
                                        {filter} ({count || 0})
                                    </button>
                                );
                            })}
                        </div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                            }}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {[...analysis.trendingTopics]
                                .filter(t => trendFilter === 'all' || t.growth === trendFilter)
                                .sort((a, b) => {
                                    if (a.growth === 'exploding' && b.growth !== 'exploding') return -1;
                                    if (b.growth === 'exploding' && a.growth !== 'exploding') return 1;
                                    return b.velocity - a.velocity;
                                })
                                .map((topic, i) => (
                                    <motion.div
                                        key={i}
                                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                    >
                                        <TrendCard
                                            title={topic.name}
                                            velocity={topic.velocity}
                                            growth={topic.growth}
                                            featured={false}
                                            onAction={() => setSelectedTrendForModal(topic.name)}
                                        />
                                    </motion.div>
                                ))}
                        </motion.div>
                    </div>
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                    <Section title="Viral Formats" collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.viralFormats.map((f, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                                    <span>{f}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Winning Hooks" collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.hooks.map((h, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm italic">
                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                                    <span>"{h}"</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Popular Music & SFX" collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.popularMusic.map((m, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Music className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                                    <span>{m}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                </div>

                <Section title="Hashtag Patterns" collapsible>
                    <motion.div
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                        initial="hidden" animate="show"
                        className="flex flex-wrap gap-2"
                    >
                        {analysis.hashtagPatterns.map((h, i) => (
                            <motion.button
                                key={i}
                                variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9, rotate: [0, -5, 5, 0] }}
                                onClick={() => copyToClipboard(`#${h.replace('#', '')}`, `tag-${i}`)}
                                aria-label="Copy tag"
                                className="px-3 py-2.5 border font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center gap-2 min-h-[40px] bg-[#1a1a1a] border-white/10 hover:border-emerald-500 text-white/60 hover:text-emerald-400"
                            >
                                {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : <Hash className="w-3 h-3 opacity-40" />}
                                #{h.replace('#', '')}
                            </motion.button>
                        ))}
                    </motion.div>
                </Section>
            </div>

            {/* Pre-Generation Modal (Portaled) */}
            {selectedTrendForModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] text-white border border-white/10 p-6 sm:p-8 custom-scrollbar shadow-2xl"
                    >
                        <button
                            onClick={() => setSelectedTrendForModal(null)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6 space-y-2">
                            <h3 className="text-xl md:text-2xl font-bold tracking-tight">Configure Generation for: {selectedTrendForModal}</h3>
                            <p className="text-sm font-mono opacity-60">Set your visual directions before creating the script.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch pt-4 border-t border-white/10">
                            {/* Left Column: Visual Style */}
                            <div className="space-y-3 h-full flex flex-col">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Visual Style
                                </label>
                                <div className="flex flex-wrap gap-2 flex-1 items-start content-between">
                                    {VISUAL_STYLES.map(style => {
                                        let label = style.split(' ')[0];
                                        if (style === "Low Poly 3D") label = "LOW";
                                        if (style === "3D Pixar / Disney Style") label = "3D";
                                        if (style === "3D Render") label = "3D";

                                        return (
                                            <button
                                                key={style}
                                                onClick={() => setVisualStyle(style)}
                                                className={cn(
                                                    "px-3 py-2 text-[10px] sm:text-[11px] font-mono uppercase border transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center flex-1 min-w-[80px]",
                                                    selectedVisualStyle === style
                                                        ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500 font-bold"
                                                        : "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Type and Generate */}
                            <div className="space-y-6 flex flex-col h-full self-stretch">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <Video className="w-3 h-3" /> Type
                                    </label>
                                    <div className="flex gap-3">
                                        {(['image', 'video'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setVisualGenerationType(type)}
                                                className={cn(
                                                    "px-4 py-3 text-[11px] font-mono uppercase border transition-all flex items-center gap-2 whitespace-nowrap w-full justify-center min-h-[48px]",
                                                    visualGenerationType === type
                                                        ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500"
                                                        : "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500"
                                                )}
                                            >
                                                {type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="modal-custom-style-input" className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Custom Style Prompt
                                    </label>
                                    <input
                                        id="modal-custom-style-input"
                                        type="text"
                                        value={VISUAL_STYLES.includes(selectedVisualStyle) ? '' : selectedVisualStyle}
                                        onChange={(e) => setVisualStyle(e.target.value)}
                                        placeholder="Enter your own style (e.g., Neon Noir)..."
                                        className="w-full px-4 py-3 text-xs font-mono border transition-all min-h-[48px] bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="pt-2 mt-auto">
                                    <button
                                        onClick={() => {
                                            handleGenerate(selectedTrendForModal);
                                            setSelectedTrendForModal(null);
                                        }}
                                        disabled={isLoading}
                                        className="w-full px-4 py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-md active:translate-y-0.5 active:shadow-none min-h-[56px] bg-emerald-500 text-[#0a0a0a] border-emerald-500 hover:bg-emerald-400"
                                    >
                                        {isLoading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                        <span>{isLoading ? 'Generating...' : 'Generate Content'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    );
}
