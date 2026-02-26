import React from 'react';
import { motion } from 'motion/react';
import { Search, BarChart, Zap, MessageSquare, Music, Hash, Check } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { TrendCard } from '../ui/TrendCard';
import { NicheDNARadar } from '../ui/NicheDNARadar';
import { useAppState } from '../../hooks/useAppState';

interface TrendsViewProps {
    appState: ReturnType<typeof useAppState>;
}

export function TrendsView({ appState }: TrendsViewProps) {
    const {
        state,
        setState,
        theme,
        trendFilter,
        setTrendFilter,
        handleAnalyze,
        handleGenerate,
        copiedId,
        copyToClipboard
    } = appState;

    if (!state.analysis) return null;

    return (
        <motion.div
            key="trends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            <div className={cn(
                "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6",
                state.isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1 block">Analysis Result</span>
                    <h2 className="text-4xl font-bold tracking-tight break-words">
                        {state.searchQuery ? `Niche: ${state.searchQuery}` : 'General Trends'}
                    </h2>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search another niche..."
                        value={state.searchQuery}
                        onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        className={cn(
                            "w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border",
                            state.isDarkMode
                                ? "bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500"
                                : "bg-gray-50 border-[#141414] text-[#141414] focus:border-[#141414]"
                        )}
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                </div>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                        <div className={cn(
                            "h-64 w-full p-4 border",
                            state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                        )} style={{ minHeight: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <ReBarChart data={state.analysis.trendingTopics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.isDarkMode ? "#ffffff10" : "#14141420"} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: state.isDarkMode ? '#ffffff60' : '#14141460' }}
                                    />
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 50 }}
                                        allowEscapeViewBox={{ x: false, y: true }}
                                        cursor={{ fill: state.isDarkMode ? '#ffffff05' : '#14141405' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className={cn(
                                                        "p-2 font-mono text-[10px] uppercase border",
                                                        state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/20" : "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                                                    )}>
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
                                        {state.analysis.trendingTopics.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.growth === 'exploding' ? '#ef4444' : state.isDarkMode ? '#10b981' : '#9333ea'}
                                            />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    <Section title="Niche DNA Fingerprint" icon={<Zap className={cn("w-5 h-5", `text-${theme.primary}`)} />} isDarkMode={state.isDarkMode}>
                        <div className={cn(
                            "h-64 w-full p-4 border transition-colors",
                            state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                        )}>
                            <NicheDNARadar data={state.analysis.nicheDNA} isDarkMode={state.isDarkMode} />
                        </div>
                    </Section>
                </div>

                <Section title="Trending Topics" isDarkMode={state.isDarkMode}>
                    <div className="space-y-6">
                        <div className={cn(
                            "flex flex-wrap gap-2 border-b pb-4",
                            state.isDarkMode ? "border-white/10" : "border-[#141414]/10"
                        )}>
                            {(['all', 'exploding', 'steady', 'declining'] as const).map(filter => {
                                const count = filter === 'all'
                                    ? state.analysis!.trendingTopics.length
                                    : state.analysis!.trendingTopics.filter(t => t.growth === filter).length;

                                return (
                                    <button
                                        key={filter}
                                        onClick={() => setTrendFilter(filter)}
                                        className={cn(
                                            "px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all focus-visible:ring-2 focus-visible:outline-none",
                                            theme.ring,
                                            trendFilter === filter
                                                ? (state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.primary}` : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                                : (state.isDarkMode ? `bg-[#1a1a1a] text-white border-white/10 ${theme.hoverBorder}` : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
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
                            {state.analysis.trendingTopics
                                .filter(t => trendFilter === 'all' || t.growth === trendFilter)
                                .map((topic, i) => {
                                    const isFeatured = i === 0 && trendFilter === 'all';
                                    return (
                                        <motion.div
                                            key={i}
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            className={cn(isFeatured && "sm:col-span-2 lg:col-span-2")}
                                        >
                                            <TrendCard
                                                title={topic.name}
                                                velocity={topic.velocity}
                                                growth={topic.growth}
                                                featured={isFeatured}
                                                onAction={() => handleGenerate(topic.name)}
                                                isDarkMode={state.isDarkMode}
                                            />
                                        </motion.div>
                                    );
                                })}
                        </motion.div>
                    </div>
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    <Section title="Viral Formats" isDarkMode={state.isDarkMode}>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {state.analysis.viralFormats.map((f, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Zap className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-red-500")} />
                                    <span>{f}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Winning Hooks" isDarkMode={state.isDarkMode}>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {state.analysis.hooks.map((h, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm italic">
                                    <MessageSquare className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-blue-500")} />
                                    <span>"{h}"</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Popular Music & SFX" isDarkMode={state.isDarkMode}>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {state.analysis.popularMusic.map((m, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Music className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-purple-500")} />
                                    <span>{m}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                </div>

                <Section title="Hashtag Patterns" isDarkMode={state.isDarkMode}>
                    <motion.div
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                        initial="hidden" animate="show"
                        className="flex flex-wrap gap-2"
                    >
                        {state.analysis.hashtagPatterns.map((h, i) => (
                            <motion.button
                                key={i}
                                variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9, rotate: [0, -5, 5, 0] }}
                                onClick={() => copyToClipboard(`#${h.replace('#', '')}`, `tag-${i}`)}
                                aria-label="Copy tag"
                                className={cn(
                                    "px-3 py-1.5 border font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center gap-2",
                                    state.isDarkMode
                                        ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500 text-white/60 hover:text-emerald-400"
                                        : "bg-white border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
                                )}
                            >
                                {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : <Hash className="w-3 h-3 opacity-40" />}
                                #{h.replace('#', '')}
                            </motion.button>
                        ))}
                    </motion.div>
                </Section>
            </div>
        </motion.div>
    );
}
