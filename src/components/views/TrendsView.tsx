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

    const wordCount = customCharacter.description.trim().split(/\s+/).filter(Boolean).length;
    const isCharacterValid = !useCustomCharacter || (
        customCharacter.name.trim().length > 0 && wordCount >= 50
    );

    const handleGenerateWithValidation = (trend: string) => {
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

                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                            {visualGenerationType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                            {visualGenerationType === 'video' ? 'Clip Length (per scene)' : 'Segment Length'}
                                        </label>

                                        <div className="flex bg-[#1a1a1a] border border-white/10 p-0.5 rounded-sm">
                                            <button
                                                onClick={() => setSegmentMode('fixed')}
                                                className={cn(
                                                    "px-2 py-1 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                                    segmentMode === 'fixed'
                                                        ? "bg-emerald-500 text-black font-bold"
                                                        : "text-white/50 hover:text-white"
                                                )}
                                            >
                                                Fixed mode
                                            </button>
                                            <button
                                                onClick={() => setSegmentMode('adjustable')}
                                                className={cn(
                                                    "px-2 py-1 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                                    segmentMode === 'adjustable'
                                                        ? "bg-emerald-500 text-black font-bold"
                                                        : "text-white/50 hover:text-white"
                                                )}
                                            >
                                                Adjustable
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                        {segmentMode === 'fixed' ? (
                                            <div className="p-4 border border-white/10 bg-[#1a1a1a] text-white/70 text-xs font-mono leading-relaxed">
                                                AI will dynamically determine optimal scene lengths to pace the story, perfectly locked to 60s total runtime.
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    className="w-full px-4 py-3 text-[11px] font-mono border transition-all bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[48px]"
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
                                                    <option value="6">6 seconds (Minimum)</option>
                                                    <option value="8">8 seconds (Medium)</option>
                                                    <option value="15">15 seconds (Maximum)</option>
                                                    <option value="custom">Customize Your Duration...</option>
                                                </select>

                                                {customSegmentLength !== null && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="flex flex-col space-y-2 pt-2"
                                                    >
                                                        <input
                                                            type="number"
                                                            min="2"
                                                            max="30"
                                                            value={customSegmentLength}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                // Bug 2 Fix: Cap at 30 to match server-side validation.
                                                                // Previously allowed up to 120, causing silent 400 errors.
                                                                setCustomSegmentLength(isNaN(val) ? 6 : Math.max(2, Math.min(30, val)));
                                                            }}
                                                            placeholder="Enter custom duration (2–30s)"
                                                            className="w-full px-4 py-3 text-[11px] font-mono border transition-all bg-[#1a1a1a] text-white border-emerald-500/50 focus:border-emerald-500 outline-none min-h-[48px]"
                                                        />
                                                        <p className="text-[9px] font-mono uppercase tracking-widest opacity-40">Range: 2–30 seconds per segment</p>
                                                    </motion.div>
                                                )}
                                            </>
                                        )}
                                    </div>
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

                            {/* ── Custom Character System ── */}
                            <div className="space-y-3 col-span-1 md:col-span-2 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Custom Character
                                    </label>
                                    <button
                                        onClick={() => { setUseCustomCharacter(!useCustomCharacter); setCharError(null); }}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                            useCustomCharacter ? "bg-emerald-500" : "bg-white/20"
                                        )}
                                        aria-label="Toggle custom character"
                                    >
                                        <span className={cn(
                                            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                                            useCustomCharacter ? "translate-x-[18px]" : "translate-x-[3px]"
                                        )} />
                                    </button>
                                </div>

                                {useCustomCharacter && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3"
                                    >
                                        <input
                                            type="text"
                                            value={customCharacter.name}
                                            onChange={e => setCustomCharacter({ ...customCharacter, name: e.target.value })}
                                            placeholder="Character name (e.g. Zyro, Dr. Nova)..."
                                            className="w-full px-4 py-3 text-xs font-mono border transition-all min-h-[48px] bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500 outline-none"
                                        />
                                        <div className="relative">
                                            <textarea
                                                value={customCharacter.description}
                                                onChange={e => setCustomCharacter({ ...customCharacter, description: e.target.value })}
                                                placeholder="Describe appearance, personality, tone, voice, clothing, energy, camera presence, quirks. Be extremely specific. Minimum 50 words."
                                                rows={4}
                                                className={cn(
                                                    "w-full px-4 py-3 text-xs font-mono border transition-all bg-[#1a1a1a] text-white outline-none resize-none",
                                                    wordCount >= 50
                                                        ? "border-emerald-500/50 focus:border-emerald-500"
                                                        : "border-white/10 focus:border-yellow-500"
                                                )}
                                            />
                                            <span className={cn(
                                                "absolute bottom-2 right-3 text-[9px] font-mono uppercase tracking-widest pointer-events-none",
                                                wordCount >= 50 ? "text-emerald-400" : "text-yellow-400"
                                            )}>{wordCount}/50 words</span>
                                        </div>
                                        <select
                                            value={customCharacter.type}
                                            onChange={e => setCustomCharacter({ ...customCharacter, type: e.target.value as 'image' | 'video' | 'both' })}
                                            className="w-full px-4 py-3 text-[11px] font-mono border transition-all bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[48px]"
                                        >
                                            <option value="image" className="bg-[#1a1a1a]">Image Prompts Only</option>
                                            <option value="video" className="bg-[#1a1a1a]">Video Prompts Only</option>
                                            <option value="both" className="bg-[#1a1a1a]">Both (Image &amp; Video)</option>
                                        </select>
                                        {charError && (
                                            <div className="flex items-start gap-2 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <span>{charError}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            <div className="pt-2 mt-auto col-span-1 md:col-span-2">
                                <button
                                    onClick={() => handleGenerateWithValidation(selectedTrendForModal!)}
                                    disabled={isLoading || !isCharacterValid}
                                    className="w-full px-4 py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-md active:translate-y-0.5 active:shadow-none min-h-[56px] bg-emerald-500 text-[#0a0a0a] border-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    );
}
