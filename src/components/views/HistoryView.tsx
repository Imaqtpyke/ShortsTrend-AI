import React from 'react';
import { motion } from 'motion/react';
import { Search, AlertTriangle, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppState } from '../../hooks/useAppState';

interface HistoryViewProps {
    appState: ReturnType<typeof useAppState>;
}

export function HistoryView({ appState }: HistoryViewProps) {
    const {
        state,
        theme,
        historySearch,
        setHistorySearch,
        confirmClearHistory,
        setConfirmClearHistory,
        clearHistory,
        loadFromHistory
    } = appState;

    return (
        <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className={cn(
                "flex flex-col md:flex-row items-center justify-between border-b pb-6 gap-4",
                state.isDarkMode ? "border-white/10" : "border-[#141414]"
            )}>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Search History</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                        <input
                            type="text"
                            placeholder="Filter history..."
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className={cn(
                                "w-full pl-10 pr-4 py-3 font-mono text-xs focus:outline-none border min-h-[44px]",
                                state.isDarkMode ? `bg-[#0a0a0a] border-white/10 text-white ${theme.focusBorder}` : "bg-gray-50 border-[#141414] text-[#141414]"
                            )}
                        />
                    </div>
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

            {state.history.filter(item => item.query.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                <div className="py-12 md:py-24 text-center opacity-60">
                    <Clock className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-mono text-sm uppercase tracking-widest">
                        {state.history.length === 0 ? 'No recent searches found' : 'No matches for your filter'}
                    </p>
                </div>
            ) : (
                <motion.div
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                    initial="hidden" animate="show"
                    className="grid grid-cols-1 gap-4"
                >
                    {state.history
                        .filter(item => item.query.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((item) => (
                            <motion.div
                                key={item.id}
                                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                                onClick={() => loadFromHistory(item)}
                                className={cn(
                                    "p-4 md:p-6 border transition-all cursor-pointer group flex items-center justify-between",
                                    state.isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:bg-white/5" : "bg-white border-[#141414] hover:bg-gray-50"
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
