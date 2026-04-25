import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  TrendingUp,
  Zap,
  Video,
  Wand2,
  Settings,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Hash,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Layers,
  History,
  Search,
  X,
  Clock,
  AlertTriangle,
  ThumbsUp,
  BarChart,
  Copy,
  Check,
  TrendingUp as TrendingIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from './lib/utils';
import { TabButton } from './components/ui/TabButton';
import { MobileNavButton } from './components/ui/MobileNavButton';
import { Section } from './components/ui/Section';
import { TrendCard } from './components/ui/TrendCard';
import { Skeleton } from './components/ui/Skeleton';
import { SoftwareCard } from './components/ui/SoftwareCard';
import { NicheDNARadar } from './components/ui/NicheDNARadar';
import { RetentionGraph } from './components/ui/RetentionGraph';
import { ToastContainer } from './components/ui/ToastContainer';
import { useAppStore, useTheme } from './store/useAppStore';
import { PreGenModal } from './components/views/PreGenModal';

// Code-split the heavy view components so only the visible tab's code is loaded
const TrendsView = lazy(() => import('./components/views/TrendsView').then(m => ({ default: m.TrendsView })));
const GeneratorView = lazy(() => import('./components/views/GeneratorView').then(m => ({ default: m.GeneratorView })));
const CritiqueView = lazy(() => import('./components/views/CritiqueView').then(m => ({ default: m.CritiqueView })));
const WorkflowView = lazy(() => import('./components/views/WorkflowView').then(m => ({ default: m.WorkflowView })));
const HistoryView = lazy(() => import('./components/views/HistoryView').then(m => ({ default: m.HistoryView })));


function StarBorder({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("relative p-[1px] rounded-sm overflow-hidden group", className)}>
      <div
        className="absolute inset-[-100%] origin-center animate-[spin_4s_linear_infinite]"
        style={{ background: `conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.8) 100%)` }}
      />
      <div className="relative w-full h-full rounded-sm bg-[#1a1a1a]">
        {children}
      </div>
    </div>
  );
}

function AnimatedGrid({ theme }: { theme: any }) {
  const lineColor = "rgba(255,255,255,0.04)";
  const beamColor = "rgba(16,185,129,0.4)";

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid Pattern with Radial Fade */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${lineColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
        }}
      >
        {/* Animated Beams */}
        <motion.div
          className="absolute top-0 bottom-0 w-[1px] will-change-transform"
          style={{ left: '20%', background: `linear-gradient(to bottom, transparent, ${beamColor}, transparent)` }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-0 bottom-0 w-[1px] will-change-transform"
          style={{ left: '60%', background: `linear-gradient(to bottom, transparent, ${beamColor}, transparent)` }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 h-[1px] will-change-transform"
          style={{ top: '30%', background: `linear-gradient(to right, transparent, ${beamColor}, transparent)` }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 h-[1px] will-change-transform"
          style={{ top: '70%', background: `linear-gradient(to right, transparent, ${beamColor}, transparent)` }}
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 2 }}
        />
      </div>

      {/* Subtle Ambient Glows */}
      <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] opacity-10 rounded-full -z-10 pointer-events-none", theme.bg)} />
      <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] opacity-10 rounded-full -z-10 pointer-events-none", theme.bg)} />
    </div>
  );
}

// Pre-computed at module level so Math.random() is called only once, preventing
// React StrictMode double-invoke from producing different bar heights on each render.
const _HERO_BARS = Array.from({ length: 14 }, () => ({
  heightSeq: [10, 30 + Math.random() * 50, 15 + Math.random() * 20] as [number, number, number],
  ySeq: [100, 80 - Math.random() * 50, 95 - Math.random() * 20] as [number, number, number],
  duration: 2.5 + Math.random()
}));

const HeroAnimation = React.memo(() => {
  const color = "#ffffff";
  const accent = "#10b981"; // emerald-500

  return (
    <div className="w-full h-32 md:h-40 mb-8 flex items-center justify-center overflow-hidden">
      <motion.svg width="320" height="140" viewBox="0 0 320 140" fill="none">
        {/* AI Viewfinder Corners */}
        <motion.path d="M 20 40 L 20 20 L 40 20" stroke={color} strokeWidth="2" strokeOpacity="0.3" fill="none" />
        <motion.path d="M 300 40 L 300 20 L 280 20" stroke={color} strokeWidth="2" strokeOpacity="0.3" fill="none" />
        <motion.path d="M 20 100 L 20 120 L 40 120" stroke={color} strokeWidth="2" strokeOpacity="0.3" fill="none" />
        <motion.path d="M 300 100 L 300 120 L 280 120" stroke={color} strokeWidth="2" strokeOpacity="0.3" fill="none" />

        {/* Center Play Icon Outline */}
        <motion.polygon
          points="150,55 175,70 150,85"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.1"
          fill="none"
        />

        {/* Animated Bars (representing video retention/engagement) */}
        {_HERO_BARS.map((bar, i) => (
          <motion.rect
            key={i}
            x={45 + i * 17}
            y={110}
            width="6"
            height="0"
            fill={color}
            fillOpacity="0.15"
            initial={{ height: 0, y: 110 }}
            animate={{
              height: bar.heightSeq,
              y: bar.ySeq
            }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}

        {/* Trend Line */}
        <motion.path
          d="M 40 100 Q 100 90, 160 50 T 280 30"
          stroke={accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
        />

        {/* Pulse Node at the end of trend line */}
        <motion.circle
          cx="280" cy="30" r="4" fill={accent}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.8, delay: 2 }}
        />
        <motion.circle
          cx="280" cy="30" r="12" fill={accent} fillOpacity="0.2"
          animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </motion.svg>
    </div>
  );
});

export default function App() {
  const {
    analysis, contentIdea, workflow, critique, isLoading, error, history, searchQuery,
    activeTab, setActiveTab, selectedTrend, toasts, historySearch, handleAnalyze, resetApp,
    loadingMessage, isHydrated, initStore, searchMode, setSearchMode, youtubeUrl, setYoutubeUrl,
    directIdea, setDirectIdea, setShowPreGenModal
  } = useAppStore();

  // Bug 3 Fix: Use the shared useTheme hook instead of a duplicate inline theme object.
  // The previous inline version was missing 'declining' and other keys, causing inconsistency.
  const theme = useTheme();

  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHydrated) {
      initStore();
    }
  }, [isHydrated, initStore]);

  useEffect(() => {
    if (!isLoading && (analysis || activeTab === 'history') && isHydrated) {
      setTimeout(() => {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeTab, isLoading, analysis, isHydrated]);

  return (
    <div className="min-h-screen font-sans transition-colors duration-500 relative overflow-x-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-[#f5f5f5] selection:text-[#0a0a0a]">
      {/* Visual Enhancements: Background Pattern & Glows */}
      <AnimatedGrid theme={theme} />

      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 transition-colors duration-300 bg-[#0a0a0a]/80 border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
              <div className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center transition-colors",
                theme.bg
              )}>
                <TrendingUp className="w-5 h-5 text-[#0a0a0a]" />
              </div>
              <span className="font-mono font-bold tracking-tighter text-xl uppercase">ShortsTrend AI</span>
            </div>
            <div className="flex items-center gap-4">
              {analysis && (
                <button
                  onClick={resetApp}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px] focus-ring bg-white/10 text-white hover:bg-white/20"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">New Search</span>
                </button>
              )}
              <button
                onClick={() => handleAnalyze()}
                disabled={isLoading}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-ring text-[#0a0a0a]",
                  theme.bg + " " + theme.hoverBg
                )}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Analyze
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 overflow-hidden rounded-sm border border-red-500/30 bg-[#1a1a1a]/80 backdrop-blur-md shadow-lg shadow-red-500/5 flex"
            >
              <div className="w-1.5 bg-red-500 shrink-0" />
              <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 w-full">
                 <div className="p-2 bg-red-500/10 rounded-sm shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                 </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-red-400 mb-1">System Notice</h3>
                  <p className="text-sm text-red-100/90 leading-relaxed">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!analysis && !contentIdea && !isLoading && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center py-12 md:py-24 text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl"
              >
                <HeroAnimation />
                <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight mb-4 text-white">
                  Turn Viral Trends into Viral Content
                </h1>
                <p className="text-base md:text-lg xl:text-xl opacity-60 mb-6 md:mb-12">
                  AI-powered trend analysis and content generation for YouTube Shorts creators.
                </p>

                <StarBorder className="mb-8 shadow-lg">
                  <div className="flex bg-[#0a0a0a] rounded-t-sm overflow-hidden p-1 border-b border-white/5">
                    <button
                        onClick={() => setSearchMode('keyword')}
                        className={cn(
                            "flex-1 pb-2 pt-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors",
                            searchMode === 'keyword' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
                        )}>Keyword Search</button>
                    <button
                        onClick={() => setSearchMode('url')}
                        className={cn(
                            "flex-1 pb-2 pt-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors",
                            searchMode === 'url' ? "bg-white/10 text-emerald-400" : "text-white/40 hover:text-white/80"
                        )}>Paste YouTube URL</button>
                    <button
                        onClick={() => setSearchMode('idea')}
                        className={cn(
                            "flex-1 pb-2 pt-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors",
                            searchMode === 'idea' ? "bg-white/10 text-blue-400" : "text-white/40 hover:text-white/80"
                        )}>Direct Idea</button>
                  </div>
                  <div className="flex flex-col sm:flex-row relative gap-2 sm:gap-0 p-1">
                    <div className="relative w-full flex-grow">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                        <Search className="w-5 h-5 opacity-40" />
                      </div>
                      {searchMode === 'keyword' && (
                        <input
                          type="text"
                          placeholder="Enter a niche (e.g. Tech, Cooking)..."
                          value={searchQuery}
                          onChange={(e) => useAppStore.getState().setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && isHydrated && handleAnalyze()}
                          disabled={isLoading || !isHydrated}
                          className="w-full pl-12 pr-4 py-4 sm:py-5 font-mono text-base sm:text-lg focus:outline-none focus:ring-0 transition-all bg-transparent relative z-10 text-white disabled:opacity-50"
                        />
                      )}
                      {searchMode === 'url' && (
                        <input
                          type="text"
                          placeholder="https://youtube.com/shorts/..."
                          value={youtubeUrl}
                          onChange={(e) => useAppStore.getState().setYoutubeUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && isHydrated && handleAnalyze()}
                          disabled={isLoading || !isHydrated}
                          className="w-full pl-12 pr-4 py-4 sm:py-5 font-mono text-base sm:text-lg focus:outline-none focus:ring-0 transition-all bg-transparent relative z-10 text-emerald-100 placeholder-emerald-500/30 disabled:opacity-50"
                        />
                      )}
                      {searchMode === 'idea' && (
                        <input
                          type="text"
                          placeholder="I want to make a video about..."
                          value={directIdea}
                          onChange={(e) => useAppStore.getState().setDirectIdea(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !isLoading && isHydrated && directIdea.trim() && setShowPreGenModal(true)}
                          disabled={isLoading || !isHydrated}
                          className="w-full pl-12 pr-4 py-4 sm:py-5 font-mono text-base sm:text-lg focus:outline-none focus:ring-0 transition-all bg-transparent relative z-10 text-blue-100 placeholder-blue-500/30 disabled:opacity-50"
                        />
                      )}
                    </div>
                    {searchMode === 'idea' ? (
                      <button
                        onClick={() => setShowPreGenModal(true)}
                        disabled={isLoading || !isHydrated || !directIdea.trim()}
                        className={cn(
                          "w-full sm:w-auto py-4 sm:py-0 px-6 font-mono text-xs uppercase tracking-wider sm:tracking-widest transition-colors min-h-[44px] z-20 rounded-sm sm:m-1 focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
                          theme.bg + " text-[#0a0a0a] " + theme.hoverBg
                        )}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                        Config & Gen
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAnalyze()}
                        disabled={isLoading || !isHydrated || (searchMode === 'url' ? !youtubeUrl.trim() : !searchQuery.trim())}
                        className={cn(
                          "w-full sm:w-auto py-4 sm:py-0 px-6 font-mono text-xs uppercase tracking-wider sm:tracking-widest transition-colors min-h-[44px] z-20 rounded-sm sm:m-1 focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
                          theme.bg + " text-[#0a0a0a] " + theme.hoverBg
                        )}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                        Analyze
                      </button>
                    )}
                  </div>
                </StarBorder>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => handleAnalyze('')}
                    disabled={isLoading}
                    className="text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity underline underline-offset-4 focus-ring px-2 py-1 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Or see general trends
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity focus-ring px-2 py-1 rounded-sm"
                    >
                      <History className="w-3 h-3" />
                      View History
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {(analysis || contentIdea || isLoading || activeTab === 'history') && (
          <div ref={mainContentRef} className="flex flex-col gap-6 items-start scroll-mt-24 w-full">
            {/* Sidebar Navigation - Sticky Desktop */}
            <div className="hidden lg:flex w-full flex-wrap gap-2 pb-2 sticky top-16 z-40 transition-colors pt-4 -mt-4 bg-[#0a0a0a]">
              <TabButton
                active={activeTab === 'trends'}
                onClick={() => setActiveTab('trends')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Trends Analysis"
                theme={theme}
              />
              <TabButton
                active={activeTab === 'generator'}
                onClick={() => setActiveTab('generator')}
                disabled={!contentIdea}
                icon={<Wand2 className="w-4 h-4" />}
                label="Content Generator"
                theme={theme}
              />
              <TabButton
                active={activeTab === 'critique'}
                onClick={() => setActiveTab('critique')}
                disabled={!contentIdea}
                icon={<BarChart className="w-4 h-4" />}
                label="Roast My Script"
                theme={theme}
              />
              <TabButton
                active={activeTab === 'workflow'}
                onClick={() => setActiveTab('workflow')}
                disabled={!workflow}
                icon={<Settings className="w-4 h-4" />}
                label="Production Workflow"
                theme={theme}
              />
              <TabButton
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                icon={<History className="w-4 h-4" />}
                label="Search History"
                theme={theme}
              />
            </div>

            {/* Main Content Area */}
            <div className={`w-full border transition-all duration-300 p-3 sm:p-4 md:p-8 min-h-0 md:min-h-[600px] bg-[#1a1a1a] border-white/10 shadow-lg ${theme.shadowAccent}`}>
              <Suspense fallback={
                <div className="space-y-8 animate-pulse w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10">
                        <div className="space-y-2 w-full max-w-md">
                            <div className="flex items-center gap-3 mb-2">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                <span className="font-mono text-sm tracking-widest text-emerald-500 uppercase">Connecting to AI...</span>
                            </div>
                            <div className="h-10 w-3/4 bg-white/5 rounded-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="h-6 w-32 bg-white/5 rounded-sm" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-sm" />)}
                            </div>
                        </div>
                        <div className="h-64 w-full bg-white/5 rounded-sm" />
                    </div>
                </div>
              }>
                <AnimatePresence mode="wait">
                  {activeTab === 'trends' ? (
                    isLoading && !analysis ? (
                      <motion.div
                        key="trends-loading-app"
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        variants={{
                          hidden: { opacity: 0 },
                          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="space-y-8"
                      >
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10">
                          <div className="space-y-2 w-full max-w-md">
                            <div className="flex items-center gap-3 mb-2">
                              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                              <span className="font-mono text-sm tracking-widest text-emerald-500 uppercase">{loadingMessage || 'Loading...'}</span>
                            </div>
                            <Skeleton className="h-10 w-full" />
                          </div>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="grid grid-cols-1 gap-4">
                              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                          </motion.div>
                          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-64 w-full" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ) : (
                      <TrendsView key="trends" />
                    )
                  ) : activeTab === 'generator' ? (
                    <GeneratorView key="generator" />
                  ) : activeTab === 'critique' ? (
                    <CritiqueView key="critique" />
                  ) : activeTab === 'workflow' ? (
                    <WorkflowView key="workflow" />
                  ) : activeTab === 'history' ? (
                    <HistoryView key="history" />
                  ) : null}
                </AnimatePresence>
              </Suspense>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 pb-safe bg-[#0a0a0a] border-white/10">
        <div className="grid grid-cols-5 h-16">
          <MobileNavButton
            active={activeTab === 'trends'}
            onClick={() => setActiveTab('trends')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Trends"
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'generator'}
            onClick={() => setActiveTab('generator')}
            disabled={!contentIdea}
            icon={<Wand2 className="w-5 h-5" />}
            label="Gen"
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'critique'}
            onClick={() => setActiveTab('critique')}
            disabled={!contentIdea}
            icon={<BarChart className="w-5 h-5" />}
            label="Roast"
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'workflow'}
            onClick={() => setActiveTab('workflow')}
            disabled={!workflow}
            icon={<Settings className="w-5 h-5" />}
            label="Work"
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History className="w-5 h-5" />}
            label="Hist"
            theme={theme}
          />
        </div>
      </div>

      <footer className="mt-12 md:mt-24 border-t pt-8 pb-28 lg:py-12 transition-colors duration-300 bg-[#0a0a0a] border-white/10 text-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4 text-center">
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] opacity-80 text-center leading-relaxed">
            Powered by Gemini Flash-Lite & Google Search
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs uppercase tracking-wider font-mono opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">v1.2.0</a>
            <a href="#" className="hover:opacity-100 transition-opacity">GitHub</a>
            <a href="#" className="hover:opacity-100 transition-opacity">About</a>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer />
      <PreGenModal />
    </div>
  );
}
