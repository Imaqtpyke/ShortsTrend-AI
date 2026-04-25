import React from 'react';
import { motion } from 'motion/react';
import { Search, BarChart, Zap, MessageSquare, Music, Hash, Check, RefreshCw, Sliders } from 'lucide-react';
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
        searchMode,
        setSearchMode,
        youtubeUrl,
        setYoutubeUrl,
        currentAnalyzedQuery,
        trendFilter,
        setTrendFilter,
        handleAnalyze,
        handleGenerate,
        copiedId,
        copyToClipboard,
        isLoading,
        loadingMessage,
        setPendingTrend,
        setShowPreGenModal
    } = useAppStore();
    const theme = useTheme();
    const [sortBy, setSortBy] = React.useState<'velocity' | 'competition'>('velocity');

    const isNewSearch = searchMode === 'url'
        ? (youtubeUrl || '').trim() !== (currentAnalyzedQuery || '').trim()
        : (searchQuery || '').trim().toLowerCase() !== (currentAnalyzedQuery || '').trim().toLowerCase();

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
                        {currentAnalyzedQuery ? (searchMode === 'url' && currentAnalyzedQuery.includes('http') ? 'YouTube Video Analysis' : `Niche: ${currentAnalyzedQuery}`) : 'General Trends'}
                    </h2>
                </div>
                <div className="relative w-full md:w-[400px] flex flex-col gap-2">
                    <div className="flex bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden p-1">
                        <button
                            onClick={() => setSearchMode('keyword')}
                            className={cn(
                                "flex-1 pb-2 pt-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                                searchMode === 'keyword' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
                            )}>Keyword</button>
                        <button
                            onClick={() => setSearchMode('url')}
                            className={cn(
                                "flex-1 pb-2 pt-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                                searchMode === 'url' ? "bg-white/10 text-emerald-400" : "text-white/40 hover:text-white/80"
                            )}>YouTube URL</button>
                    </div>
                    <div className="flex gap-2 w-full">
                        <div className="relative flex-1">
                            {searchMode === 'keyword' ? (
                                <input
                                    type="text"
                                    placeholder="Search another niche..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isLoading) handleAnalyze();
                                    }}
                                    disabled={isLoading}
                                    className="w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border min-h-[44px] bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500 disabled:opacity-50"
                                />
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Paste YouTube URL..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isLoading) handleAnalyze();
                                    }}
                                    disabled={isLoading}
                                    className="w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border min-h-[44px] bg-[#0a0a0a] border-emerald-500/30 text-emerald-100 focus:border-emerald-500 disabled:opacity-50"
                                />
                            )}
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                        </div>
                        <button
                            onClick={() => {
                                if (isNewSearch) {
                                    handleAnalyze();
                                } else {
                                    handleAnalyze(searchMode === 'url' ? youtubeUrl : currentAnalyzedQuery, true);
                                }
                            }}
                            disabled={isLoading || (isNewSearch && (searchMode === 'url' ? !youtubeUrl.trim() : !searchQuery.trim()))}
                            title={isNewSearch ? "Search New Analysis" : "Regenerate Analysis"}
                            className="px-4 border min-h-[44px] transition-colors bg-[#1a1a1a] border-white/10 hover:border-emerald-500 text-white/80 hover:text-emerald-400 disabled:opacity-50 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none focus:ring-emerald-500"
                        >
                            {isNewSearch ? (
                                <Search className="w-4 h-4" />
                            ) : (
                                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />}>
                        <div className="h-48 md:h-64 w-full p-2 md:p-4 border bg-[#0a0a0a] border-white/10 overflow-hidden" style={{ minHeight: '180px', minWidth: '0' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0} debounce={50}>
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
                                                ? theme.primary === 'emerald-500' ? 'bg-emerald-500 text-[#0a0a0a] border-emerald-500'
                                                    : theme.primary === 'red-500' ? 'bg-red-500 text-[#0a0a0a] border-red-500'
                                                        : theme.primary === 'blue-500' ? 'bg-blue-500 text-[#0a0a0a] border-blue-500'
                                                            : 'bg-purple-500 text-[#0a0a0a] border-purple-500'
                                                : `bg-[#1a1a1a] text-white border-white/10 ${theme.hoverBorder}`
                                        )}
                                    >
                                        {filter} ({count || 0})
                                    </button>
                                );
                            })}
                            <div className="ml-auto flex items-center gap-2 border px-3 py-2 border-white/10 bg-[#1a1a1a] transition-all hover:border-emerald-500/50">
                                <Sliders className="w-3.5 h-3.5 text-white/50" />
                                <select
                                    className="bg-transparent text-[10px] font-mono uppercase tracking-widest outline-none text-white focus:text-emerald-400 cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'velocity' | 'competition')}
                                >
                                    <option value="velocity" className="bg-[#1a1a1a]">Sort: Velocity (High→Low)</option>
                                    <option value="competition" className="bg-[#1a1a1a]">Sort: Competition (Low→High)</option>
                                </select>
                            </div>
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
                                    if (sortBy === 'competition') {
                                        const compRank: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
                                        const rankA = a.competition ? compRank[a.competition] : 4;
                                        const rankB = b.competition ? compRank[b.competition] : 4;
                                        if (rankA !== rankB) return rankA - rankB;
                                    }
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
                                            competition={topic.competition}
                                            targetAudience={topic.targetAudience}
                                            exampleIdea={topic.exampleIdea}
                                            featured={false}
                                            onAction={() => {
                                                setPendingTrend(topic.name);
                                                setShowPreGenModal(true);
                                            }}
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

        </motion.div>
    );
}
