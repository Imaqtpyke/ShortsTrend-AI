import React from 'react';
import { motion } from 'motion/react';
import { Search, AlertTriangle, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore, useTheme } from '../../store/useAppStore';
import { useDebounce } from '../../hooks/useDebounce';



export function HistoryView() {
    const {
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
        applyImprovedScript,
        historySearch,
        setHistorySearch,
        historyGenreFilter,
        setHistoryGenreFilter,
        loadFromHistory,
        confirmClearHistory,
        setConfirmClearHistory,
        clearHistory,
        completedSteps,
        setCompletedSteps
    } = useAppStore();
    const theme = useTheme();

    // Debounce the search to avoid filtering on every keystroke
    const debouncedSearch = useDebounce(historySearch, 250);
    const genreOptions = React.useMemo(() => {
        const genres = new Set<string>();
        history.forEach(item => {
            item.analysis?.trendingTopics?.forEach(topic => {
                const genre = (topic.name || '').trim();
                if (genre) genres.add(genre);
            });
        });
        return ['All', ...Array.from(genres)];
    }, [history]);

    const filteredHistory = React.useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();
        const selectedGenre = historyGenreFilter.trim().toLowerCase();

        return history.filter(item => {
            const queryMatches = item.query.toLowerCase().includes(search);
            if (!queryMatches) return false;
            if (historyGenreFilter === 'All') return true;
            return (item.analysis?.trendingTopics || []).some(topic => topic.name?.toLowerCase() === selectedGenre);
        });
    }, [history, debouncedSearch, historyGenreFilter]);

    return (
        <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row items-center justify-between border-b pb-6 gap-4 border-white/10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Search History</h2>
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <button
                        onClick={() => {
                            if (confirmClearHistory) {
                                clearHistory();
                                setConfirmClearHistory(false);
                            } else {
                                setConfirmClearHistory(true);
                                setTimeout(() => setConfirmClearHistory(false), 3000);
                            }
                        }}
                        className={cn(
                            "text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap px-3 py-1 rounded-sm",
                            confirmClearHistory
                                ? "bg-red-500/10 text-red-500 opacity-100"
                                : "opacity-50 hover:opacity-100"
                        )}
                    >
                        {confirmClearHistory ? <AlertTriangle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {confirmClearHistory ? "Click again to confirm" : "Clear All"}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className={cn(
                            "w-full pl-10 pr-4 py-3 font-mono text-xs focus:outline-none border min-h-[44px]",
                            `bg-[#0a0a0a] border-white/10 text-white ${theme.focusBorder}`
                        )}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {genreOptions.map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setHistoryGenreFilter(genre)}
                            className={cn(
                                "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all whitespace-nowrap min-h-[36px]",
                                historyGenreFilter === genre
                                    ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500"
                                    : "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500"
                            )}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {history.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 md:py-24 text-center opacity-60"
                >
                    <Clock className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-mono text-sm uppercase tracking-widest">
                        No recent searches yet. Analyze a niche to get started.
                    </p>
                </motion.div>
            ) : filteredHistory.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 md:py-24 text-center opacity-60"
                >
                    <Clock className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-mono text-sm uppercase tracking-widest">No history matches your search.</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                    initial="hidden" animate="show"
                    className="grid grid-cols-1 gap-4"
                >
                    {filteredHistory.map((item) => (
                            <motion.div
                                key={item.id}
                                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                                onClick={() => loadFromHistory(item)}
                                className={cn(
                                    "p-4 md:p-6 border transition-all cursor-pointer group flex items-center justify-between",
                                    "bg-[#1a1a1a] border-white/10 hover:bg-white/5"
                                )}
                            >
                                <div className="space-y-1">
                                    <p className="font-bold text-base md:text-lg uppercase tracking-tight">{item.query}</p>
                                    <p className="font-mono text-[10px] opacity-40">
                                        {new Date(item.timestamp).toLocaleString()} • {item.analysis?.trendingTopics?.length || 0} trends found
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
                            </motion.div>
                        ))}
                </motion.div>
            )}
        </motion.div>
    );
}
