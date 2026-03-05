import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Search, BarChart, Zap, MessageSquare, Music, Hash, Check, X, ImageIcon, Video, RefreshCw, Sliders, User, AlertCircle } from 'lucide-react';
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
        setVisualGenerationType,
        segmentLength,
        setSegmentLength,
        customSegmentLength,
        setCustomSegmentLength,
        segmentMode,
        setSegmentMode,
        useCustomCharacter,
        customCharacter,
        setUseCustomCharacter,
        setCustomCharacter
    } = useAppStore();
    const theme = useTheme();
    const [selectedTrendForModal, setSelectedTrendForModal] = React.useState<string | null>(null);
    const [sortBy, setSortBy] = React.useState<'velocity' | 'competition'>('velocity');
    const [charError, setCharError] = React.useState<string | null>(null);

    // Reset segment mode if video type is selected (video is always adjustable)
    React.useEffect(() => {
        if (visualGenerationType === 'video' && segmentMode === 'fixed') {
            setSegmentMode('adjustable');
        }
    }, [visualGenerationType, segmentMode, setSegmentMode]);

    const wordCount = customCharacter.description.trim().split(/\s+/).filter(Boolean).length;
    const isCharacterValid = !useCustomCharacter || (
        customCharacter.name.trim().length > 0 && wordCount >= 50
    );

    const handleGenerateWithValidation = (trend: string) => {
        // Force adjustable mode for video type if somehow in fixed
        if (visualGenerationType === 'video' && segmentMode === 'fixed') {
            setSegmentMode('adjustable');
        }

        if (useCustomCharacter) {
            if (!customCharacter.name.trim()) {
                setCharError('Character name is required.');
                return;
            }
            if (wordCount < 50) {
                setCharError(`Custom Character requires a detailed description (minimum 50 words). You have ${wordCount}.`);
                return;
            }
        }
        setCharError(null);
        handleGenerate(trend);
        setSelectedTrendForModal(null);
    };

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
                <div className="relative w-full md:w-80 flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search another niche..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isLoading) {
                                    handleAnalyze();
                                }
                            }}
                            disabled={isLoading}
                            className="w-full pl-8 pr-4 py-2 font-mono text-xs focus:outline-none border min-h-[44px] bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500 disabled:opacity-50"
                        />
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                    </div>
                    <button
                        onClick={() => handleAnalyze(undefined, true)}
                        disabled={isLoading}
                        title="Regenerate Trends for this Niche"
                        className="px-4 border min-h-[44px] transition-colors bg-[#1a1a1a] border-white/10 hover:border-emerald-500 text-white/80 hover:text-emerald-400 disabled:opacity-50 flex items-center justify-center focus-visible:ring-2 focus-visible:outline-none focus:ring-emerald-500"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    <Section title="Trend Velocity Analysis" icon={<BarChart className="w-5 h-5" />}>
                        <div className="h-48 md:h-64 w-full p-2 md:p-4 border bg-[#0a0a0a] border-white/10" style={{ minHeight: '180px', minWidth: '0' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
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
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] text-white border border-white/10 p-5 sm:p-6 custom-scrollbar shadow-2xl"
                    >
                        <button
                            onClick={() => setSelectedTrendForModal(null)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-5 space-y-1">
                            <h3 className="text-lg md:text-xl font-bold tracking-tight">Configure Generation: {selectedTrendForModal}</h3>
                            <p className="text-[11px] font-mono opacity-60">Set your visual directions before creating the script.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-5 border-t border-white/10 items-stretch">
                            {/* ── Box 1: Visual Style (Primary Anchor) ── */}
                            <div className="md:col-span-2 md:row-span-2 p-4 border bg-[#1a1a1a]/40 border-white/10 flex flex-col space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Visual Style
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 items-start content-start">
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
                                                    "px-3 py-2 text-[10px] sm:text-[10px] font-mono uppercase border transition-all min-h-[42px] flex items-center justify-center",
                                                    selectedVisualStyle === style
                                                        ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500 font-bold"
                                                        : "bg-[#0a0a0a] text-white border-white/10 hover:border-emerald-500"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Box 2: Visual Type (Compact) ── */}
                            <div className="md:col-span-1 p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                    <Video className="w-3 h-3" /> Type
                                </label>
                                <div className="flex flex-col gap-2">
                                    {(['image', 'video'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setVisualGenerationType(type)}
                                            className={cn(
                                                "px-4 py-2.5 text-[11px] font-mono uppercase border transition-all flex items-center gap-3 w-full min-h-[40px]",
                                                visualGenerationType === type
                                                    ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500"
                                                    : "bg-[#0a0a0a] text-white border-white/10 hover:border-emerald-500"
                                            )}
                                        >
                                            {type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Box 3: Segment Length (Compact) ── */}
                            <div className="md:col-span-1 p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-3">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                            {visualGenerationType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                            {visualGenerationType === 'video' ? 'Clip' : 'Segment'}
                                        </label>

                                        <div className="flex bg-[#0a0a0a] border border-white/10 p-0.5 rounded-sm">
                                            {visualGenerationType === 'image' && (
                                                <button
                                                    onClick={() => setSegmentMode('fixed')}
                                                    className={cn(
                                                        "px-2 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                                        segmentMode === 'fixed'
                                                            ? "bg-emerald-500 text-black font-bold"
                                                            : "text-white/50 hover:text-white"
                                                    )}
                                                >
                                                    High-Retention
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSegmentMode('adjustable')}
                                                className={cn(
                                                    "px-2 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                                    (segmentMode === 'adjustable' || visualGenerationType === 'video')
                                                        ? "bg-emerald-500 text-black font-bold"
                                                        : "text-white/50 hover:text-white"
                                                )}
                                            >
                                                Adj.
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                        {segmentMode === 'fixed' && visualGenerationType === 'image' ? (
                                            <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[9px] font-mono leading-relaxed">
                                                <p className="font-bold mb-0.5">Director Mode:</p>
                                                <p>18–25 segments (3s Rule).</p>
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full px-3 py-2.5 text-[11px] font-mono border transition-all bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[40px]"
                                                value={customSegmentLength !== null ? 'custom' : segmentLength}
                                                onChange={(e) => {
                                                    if (e.target.value === 'custom') {
                                                        setCustomSegmentLength(10);
                                                    } else {
                                                        setCustomSegmentLength(null);
                                                        setSegmentLength(Number(e.target.value));
                                                    }
                                                }}
                                            >
                                                <option value="6">6s (Min)</option>
                                                <option value="8">8s (Mid)</option>
                                                <option value="15">15s (Max)</option>
                                                <option value="custom">Custom...</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Box 4: Style Prompt (Wide) ── */}
                            <div className="md:col-span-3 p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-3">
                                <label htmlFor="modal-custom-style-input" className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Custom Style Prompt
                                </label>
                                <input
                                    id="modal-custom-style-input"
                                    type="text"
                                    value={VISUAL_STYLES.includes(selectedVisualStyle) ? '' : selectedVisualStyle}
                                    onChange={(e) => setVisualStyle(e.target.value)}
                                    placeholder="Enter your own style (e.g., Neon Noir, Retro Synthwave)..."
                                    className="w-full px-4 py-3 text-xs font-mono border transition-all min-h-[44px] bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500"
                                />
                            </div>

                            {/* ── Box 5: Custom Character (Wide) ── */}
                            <div className="md:col-span-3 p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Custom Character System
                                    </label>
                                    <button
                                        onClick={() => { setUseCustomCharacter(!useCustomCharacter); setCharError(null); }}
                                        className={cn(
                                            "relative inline-flex h-4.5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                            useCustomCharacter ? "bg-emerald-500" : "bg-white/10"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                                            useCustomCharacter ? "translate-x-[20px]" : "translate-x-[4px]"
                                        )} />
                                    </button>
                                </div>

                                {useCustomCharacter && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3 pt-1"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={customCharacter.name}
                                                onChange={e => setCustomCharacter({ ...customCharacter, name: e.target.value })}
                                                placeholder="Character name (e.g. Zyro, Dr. Nova)..."
                                                className="w-full px-4 py-3 text-xs font-mono border transition-all min-h-[44px] bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none"
                                            />
                                            <select
                                                value={customCharacter.type}
                                                onChange={e => setCustomCharacter({ ...customCharacter, type: e.target.value as 'image' | 'video' | 'both' })}
                                                className="w-full px-4 py-3 text-[11px] font-mono border transition-all bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[44px]"
                                            >
                                                <option value="image">Image Prompts Only</option>
                                                <option value="video">Video Prompts Only</option>
                                                <option value="both">Both (Image & Video)</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={customCharacter.description}
                                                onChange={e => setCustomCharacter({ ...customCharacter, description: e.target.value })}
                                                placeholder="Describe appearance, personality, tone, voice, clothing, energy, camera presence, quirks. Minimum 50 words."
                                                rows={3}
                                                className={cn(
                                                    "w-full px-4 py-3 text-xs font-mono border transition-all bg-[#0a0a0a] text-white outline-none resize-none",
                                                    wordCount >= 50
                                                        ? "border-emerald-500/50 focus:border-emerald-500"
                                                        : "border-white/10 focus:border-yellow-500"
                                                )}
                                            />
                                            <span className={cn(
                                                "absolute bottom-2.5 right-3 text-[9px] font-mono uppercase tracking-widest",
                                                wordCount >= 50 ? "text-emerald-400" : "text-yellow-400"
                                            )}>{wordCount}/50 words</span>
                                        </div>
                                        {charError && (
                                            <div className="flex items-start gap-2 p-2.5 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span>{charError}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div className="pt-5 mt-5 border-t border-white/10">
                            <button
                                onClick={() => handleGenerateWithValidation(selectedTrendForModal!)}
                                disabled={isLoading || !isCharacterValid}
                                className="w-full px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-md active:translate-y-0.5 active:shadow-none min-h-[48px] bg-emerald-500 text-[#0a0a0a] border-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                <span>{isLoading ? 'Generating...' : 'Generate Content'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    );
}
