import React from 'react';
import { motion } from 'motion/react';
import { Search, BarChart, Zap, MessageSquare, Music, Hash, Check } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
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
        isDarkMode,
        trendFilter,
        setTrendFilter,
        handleAnalyze,
        handleGenerate,
        copiedId,
        copyToClipboard,
        isLoading,
        loadingMessage
    } = useAppStore();
    const theme = useTheme();

    if (isLoading || !analysis) {
        return (
            <motion.div
                key="trends-loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 md:space-y-12"
            >
                <div className={cn(
                    "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6",
                    isDarkMode ? "border-white/10" : "border-[#141414]"
                )}>
                    <div className="space-y-2 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-5 h-5 animate-pulse text-emerald-500" />
                            <span className="font-mono text-sm tracking-widest text-emerald-500 uppercase">{loadingMessage || 'Analyzing Niche...'}</span>
                        </div>
                        <Skeleton className="h-10 w-3/4 max-w-sm" isDarkMode={isDarkMode} />
                    </div>
                    <div className="w-full md:w-64">
                        <Skeleton className="h-10 w-full" isDarkMode={isDarkMode} />
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                        <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />} isDarkMode={isDarkMode}>
                            <Skeleton className="h-48 md:h-64 w-full" isDarkMode={isDarkMode} />
                        </Section>
                        <Section title="Niche DNA Fingerprint" icon={<Zap className="w-5 h-5" />} isDarkMode={isDarkMode}>
                            <Skeleton className="h-64 w-full" isDarkMode={isDarkMode} />
                        </Section>
                    </div>

                    <Section title="Trending Topics" isDarkMode={isDarkMode}>
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" isDarkMode={isDarkMode} />
                                <Skeleton className="h-10 w-24" isDarkMode={isDarkMode} />
                                <Skeleton className="h-10 w-24" isDarkMode={isDarkMode} />
                                <Skeleton className="h-10 w-24" isDarkMode={isDarkMode} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Skeleton className="h-32 w-full sm:col-span-2 lg:col-span-2" isDarkMode={isDarkMode} />
                                <Skeleton className="h-32 w-full" isDarkMode={isDarkMode} />
                                <Skeleton className="h-32 w-full" isDarkMode={isDarkMode} />
                            </div>
                        </div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                        <Section title="Viral Formats" isDarkMode={isDarkMode}>
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" isDarkMode={isDarkMode} />)}
                            </div>
                        </Section>
                        <Section title="Winning Hooks" isDarkMode={isDarkMode}>
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" isDarkMode={isDarkMode} />)}
                            </div>
                        </Section>
                        <Section title="Popular Music & SFX" isDarkMode={isDarkMode}>
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" isDarkMode={isDarkMode} />)}
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
            <div className={cn(
                "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6",
                isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
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
                        className={cn(
                            "w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border min-h-[44px]",
                            isDarkMode
                                ? "bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500"
                                : "bg-gray-50 border-[#141414] text-[#141414] focus:border-[#141414]"
                        )}
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                </div>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />} isDarkMode={isDarkMode}>
                        <div className={cn(
                            "h-48 md:h-64 w-full p-2 md:p-4 border",
                            isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                        )} style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <ReBarChart data={analysis.trendingTopics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#ffffff10" : "#14141420"} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: isDarkMode ? '#ffffff60' : '#14141460' }}
                                    />
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 50 }}
                                        allowEscapeViewBox={{ x: false, y: true }}
                                        cursor={{ fill: isDarkMode ? '#ffffff05' : '#14141405' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className={cn(
                                                        "p-2 font-mono text-[10px] uppercase border",
                                                        isDarkMode ? "bg-[#1a1a1a] text-white border-white/20" : "bg-[#141414] text-[#E4E3E0] border-[#141414]"
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
                                        {analysis.trendingTopics.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.growth === 'exploding' ? '#ef4444' : isDarkMode ? '#10b981' : '#9333ea'}
                                            />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    <Section title="Niche DNA Fingerprint" icon={<Zap className={cn("w-5 h-5", `${theme.text}`)} />} isDarkMode={isDarkMode}>
                        <div className={cn(
                            "h-64 w-full p-4 border transition-colors",
                            isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                        )}>
                            <NicheDNARadar data={analysis.nicheDNA} isDarkMode={isDarkMode} />
                        </div>
                    </Section>
                </div>

                <Section title="Trending Topics" isDarkMode={isDarkMode}>
                    <div className="space-y-6">
                        <div className={cn(
                            "flex flex-wrap gap-2 border-b pb-4",
                            isDarkMode ? "border-white/10" : "border-[#141414]/10"
                        )}>
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
                                                ? (isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.primary}` : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                                : (isDarkMode ? `bg-[#1a1a1a] text-white border-white/10 ${theme.hoverBorder}` : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
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
                            {analysis.trendingTopics
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
                                                isDarkMode={isDarkMode}
                                            />
                                        </motion.div>
                                    );
                                })}
                        </motion.div>
                    </div>
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                    <Section title="Viral Formats" isDarkMode={isDarkMode} collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.viralFormats.map((f, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Zap className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isDarkMode ? "text-emerald-400" : "text-red-500")} />
                                    <span>{f}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Winning Hooks" isDarkMode={isDarkMode} collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.hooks.map((h, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm italic">
                                    <MessageSquare className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isDarkMode ? "text-emerald-400" : "text-blue-500")} />
                                    <span>"{h}"</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                    <Section title="Popular Music & SFX" isDarkMode={isDarkMode} collapsible defaultCollapsed>
                        <motion.ul
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            initial="hidden" animate="show"
                            className="space-y-2.5"
                        >
                            {analysis.popularMusic.map((m, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-start gap-2 text-xs md:text-sm">
                                    <Music className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isDarkMode ? "text-emerald-400" : "text-purple-500")} />
                                    <span>{m}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Section>
                </div>

                <Section title="Hashtag Patterns" isDarkMode={isDarkMode} collapsible>
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
                                className={cn(
                                    "px-3 py-2.5 border font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center gap-2 min-h-[40px]",
                                    isDarkMode
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
