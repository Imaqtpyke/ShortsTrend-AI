import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Zap,
  Video,
  Wand2,
  Settings,
  ChevronRight,
  Loader2,
  Music,
  Volume2,
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
  Minus,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { analyzeTrends, generateContentIdea, getWorkflow, critiqueScript, generateImprovement } from './services/geminiService';
import { AppState, VISUAL_STYLES, HistoryItem, Toast, RetentionLeak } from './types';
import { cn } from './lib/utils';
import { TabButton } from './components/ui/TabButton';
import { MobileNavButton } from './components/ui/MobileNavButton';
import { Section } from './components/ui/Section';
import { TrendCard } from './components/ui/TrendCard';
import { Skeleton } from './components/ui/Skeleton';
import { SoftwareCard } from './components/ui/SoftwareCard';
import { NicheDNARadar } from './components/ui/NicheDNARadar';
import { RetentionGraph } from './components/ui/RetentionGraph';
import { useAppState } from './hooks/useAppState';
import { TrendsView } from './components/views/TrendsView';
import { GeneratorView } from './components/views/GeneratorView';
import { CritiqueView } from './components/views/CritiqueView';
import { WorkflowView } from './components/views/WorkflowView';
import { HistoryView } from './components/views/HistoryView';

function StarBorder({ children, isDarkMode, className }: { children: React.ReactNode, isDarkMode: boolean, className?: string }) {
  return (
    <div className={cn("relative p-[1px] rounded-sm overflow-hidden group", className)}>
      <motion.div
        className="absolute inset-[-100%] origin-center"
        style={{
          background: isDarkMode
            ? `conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.8) 100%)`
            : `conic-gradient(from 0deg, transparent 70%, rgba(20, 20, 20, 0.3) 100%)`
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <div className={cn(
        "relative w-full h-full rounded-sm",
        isDarkMode ? "bg-[#1a1a1a]" : "bg-white"
      )}>
        {children}
      </div>
    </div>
  );
}

function AnimatedGrid({ isDarkMode, theme }: { isDarkMode: boolean, theme: any }) {
  const lineColor = isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const beamColor = isDarkMode ? "rgba(16,185,129,0.4)" : "rgba(20,20,20,0.15)";

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
          className="absolute top-0 bottom-0 w-[1px]"
          style={{ left: '20%', background: `linear-gradient(to bottom, transparent, ${beamColor}, transparent)` }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-0 bottom-0 w-[1px]"
          style={{ left: '60%', background: `linear-gradient(to bottom, transparent, ${beamColor}, transparent)` }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 h-[1px]"
          style={{ top: '30%', background: `linear-gradient(to right, transparent, ${beamColor}, transparent)` }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />
        <motion.div
          className="absolute left-0 right-0 h-[1px]"
          style={{ top: '70%', background: `linear-gradient(to right, transparent, ${beamColor}, transparent)` }}
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 2 }}
        />
      </div>

      {/* Subtle Ambient Glows */}
      {isDarkMode && (
        <>
          <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] opacity-10 rounded-full", `bg-${theme.primary}`)} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[120px] opacity-10 rounded-full" />
        </>
      )}
    </div>
  );
}

function HeroAnimation({ isDarkMode }: { isDarkMode: boolean }) {
  const color = isDarkMode ? "#ffffff" : "#141414";
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
        {[...Array(14)].map((_, i) => (
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
              height: [10, 30 + Math.random() * 50, 15 + Math.random() * 20],
              y: [100, 80 - Math.random() * 50, 95 - Math.random() * 20]
            }}
            transition={{
              duration: 2.5 + Math.random(),
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
}

export default function App() {
  const appState = useAppState();
  const { state, setState, activeTab, setActiveTab, selectedTrend, setSelectedTrend, trendFilter, setTrendFilter, toasts, completedSteps, setCompletedSteps, historySearch, setHistorySearch, confirmApply, setConfirmApply, confirmClearHistory, setConfirmClearHistory, mainContentRef, theme, toggleDarkMode, addToast, copiedId, copyToClipboard, copyAllForProduction, resetApp, handleAnalyze, handleGenerate, handleCritique, handleImprove, applyImprovedScript, loadFromHistory, clearHistory } = appState;

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 relative overflow-x-hidden",
      state.isDarkMode
        ? "bg-[#0a0a0a] text-[#f5f5f5] selection:bg-[#f5f5f5] selection:text-[#0a0a0a]"
        : "bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0]"
    )}>
      {/* Visual Enhancements: Background Pattern & Glows */}
      <AnimatedGrid isDarkMode={state.isDarkMode} theme={theme} />

      {/* Navigation */}
      <nav className={cn(
        "border-b sticky top-0 z-50 transition-colors duration-300",
        state.isDarkMode ? "bg-[#0a0a0a]/80 border-white/10 backdrop-blur-md" : "bg-[#E4E3E0]/80 border-[#141414] backdrop-blur-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
              <div className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center transition-colors",
                state.isDarkMode ? `bg-${theme.primary}` : "bg-[#141414]"
              )}>
                <TrendingUp className={cn("w-5 h-5", state.isDarkMode ? "text-[#0a0a0a]" : "text-[#E4E3E0]")} />
              </div>
              <span className="font-mono font-bold tracking-tighter text-xl uppercase">ShortsTrend AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                title="Toggle Theme"
                className={cn(
                  "p-2 rounded-sm transition-colors",
                  state.isDarkMode ? `bg-white/10 text-${theme.secondary} hover:bg-white/20` : "bg-black/5 text-black hover:bg-black/10"
                )}
              >
                {state.isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              {state.analysis && (
                <button
                  onClick={resetApp}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 sm:px-4 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px]",
                    state.isDarkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                  )}
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">New Search</span>
                </button>
              )}
              <button
                onClick={() => handleAnalyze()}
                disabled={state.isLoading}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]",
                  state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                )}
              >
                {state.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Analyze
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {state.error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-sm font-mono text-sm">
            {state.error}
          </div>
        )}

        {!state.analysis && !state.isLoading && (
          <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl"
            >
              <HeroAnimation isDarkMode={state.isDarkMode} />
              <h1 className={cn(
                "text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight mb-4",
                state.isDarkMode ? "text-white" : "text-[#141414]"
              )}>
                Turn Viral Trends into Viral Content
              </h1>
              <p className="text-lg md:text-xl opacity-60 mb-12">
                AI-powered trend analysis and content generation for YouTube Shorts creators.
              </p>

              <StarBorder isDarkMode={state.isDarkMode} className="mb-8 shadow-lg">
                <div className="flex flex-col sm:flex-row relative gap-0 p-1">
                  <div className="relative w-full flex-grow">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                      <Search className="w-5 h-5 opacity-40" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter a niche (e.g. Tech, Cooking)..."
                      value={state.searchQuery}
                      onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 sm:py-5 font-mono text-base sm:text-lg focus:outline-none focus:ring-0 transition-all bg-transparent relative z-10",
                        state.isDarkMode
                          ? "text-white"
                          : "text-[#141414]"
                      )}
                    />
                  </div>
                  <button
                    onClick={() => handleAnalyze()}
                    className={cn(
                      "w-full sm:w-auto py-4 sm:py-0 px-6 font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px] z-20 rounded-sm m-1 sm:m-2",
                      state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                    )}
                  >
                    Search Niche
                  </button>
                </div>
              </StarBorder>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleAnalyze('')}
                  className="text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity underline underline-offset-4"
                >
                  Or see general trends
                </button>
                {state.history.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <History className="w-3 h-3" />
                    View History
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {(state.analysis || state.isLoading || activeTab === 'history') && (
          <div ref={mainContentRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
            {/* Sidebar Navigation - Sticky Desktop */}
            <div className="hidden lg:block lg:col-span-3 space-y-2 self-start sticky top-24">
              <TabButton
                active={activeTab === 'trends'}
                onClick={() => setActiveTab('trends')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Trend Analysis"
                isDarkMode={state.isDarkMode}
                theme={theme}
              />
              <TabButton
                active={activeTab === 'generator'}
                onClick={() => setActiveTab('generator')}
                disabled={!state.contentIdea}
                icon={<Wand2 className="w-4 h-4" />}
                label="Content Generator"
                isDarkMode={state.isDarkMode}
                theme={theme}
              />
              <TabButton
                active={activeTab === 'critique'}
                onClick={() => setActiveTab('critique')}
                disabled={!state.contentIdea}
                icon={<BarChart className="w-4 h-4" />}
                label="Roast My Script"
                isDarkMode={state.isDarkMode}
                theme={theme}
              />
              <TabButton
                active={activeTab === 'workflow'}
                onClick={() => setActiveTab('workflow')}
                disabled={!state.workflow}
                icon={<Settings className="w-4 h-4" />}
                label="Production Workflow"
                isDarkMode={state.isDarkMode}
                theme={theme}
              />
              <TabButton
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                icon={<History className="w-4 h-4" />}
                label="Search History"
                isDarkMode={state.isDarkMode}
                theme={theme}
              />
            </div>

            {/* Main Content Area */}
            <div className={cn(
              "lg:col-span-9 border transition-all duration-300 p-4 md:p-8 min-h-[600px]",
              state.isDarkMode
                ? `bg-[#1a1a1a] border-white/10 shadow-lg ${theme.shadowAccent}`
                : "bg-white border-[#141414] shadow-lg"
            )}>
              <AnimatePresence mode="wait">
                {state.isLoading ? (
                  <motion.div
                    key="loading"
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="space-y-8"
                  >
                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className={cn(
                      "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6",
                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                    )}>
                      <div className="space-y-2 w-full max-w-md">
                        <Skeleton className="h-4 w-24" isDarkMode={state.isDarkMode} />
                        <Skeleton className="h-10 w-full" isDarkMode={state.isDarkMode} />
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                        <Skeleton className="h-6 w-32" isDarkMode={state.isDarkMode} />
                        <div className="grid grid-cols-1 gap-4">
                          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" isDarkMode={state.isDarkMode} />)}
                        </div>
                      </motion.div>
                      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="space-y-4">
                        <Skeleton className="h-6 w-32" isDarkMode={state.isDarkMode} />
                        <Skeleton className="h-64 w-full" isDarkMode={state.isDarkMode} />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : activeTab === 'trends' && state.analysis ? (
                  <TrendsView appState={appState} />
                ) : activeTab === 'generator' ? (
                  <GeneratorView appState={appState} />
                ) : activeTab === 'critique' ? (
                  <CritiqueView appState={appState} />
                ) : activeTab === 'workflow' ? (
                  <WorkflowView appState={appState} />
                ) : activeTab === 'history' ? (
                  <HistoryView appState={appState} />
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 pb-safe pt-1",
        state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#E4E3E0] border-[#141414]"
      )}>
        <div className="grid grid-cols-5 h-16 mb-4 sm:mb-2">
          <MobileNavButton
            active={activeTab === 'trends'}
            onClick={() => setActiveTab('trends')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Trends"
            isDarkMode={state.isDarkMode}
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'generator'}
            onClick={() => setActiveTab('generator')}
            disabled={!state.contentIdea}
            icon={<Wand2 className="w-5 h-5" />}
            label="Gen"
            isDarkMode={state.isDarkMode}
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'critique'}
            onClick={() => setActiveTab('critique')}
            disabled={!state.contentIdea}
            icon={<BarChart className="w-5 h-5" />}
            label="Roast"
            isDarkMode={state.isDarkMode}
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'workflow'}
            onClick={() => setActiveTab('workflow')}
            disabled={!state.workflow}
            icon={<Settings className="w-5 h-5" />}
            label="Work"
            isDarkMode={state.isDarkMode}
            theme={theme}
          />
          <MobileNavButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History className="w-5 h-5" />}
            label="Hist"
            isDarkMode={state.isDarkMode}
            theme={theme}
          />
        </div>
      </div>

      <footer className={cn(
        "mt-24 border-t py-12 transition-colors duration-300",
        state.isDarkMode ? "bg-[#0a0a0a] border-white/10 text-white/40" : "bg-[#141414] border-[#141414] text-[#E4E3E0]"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-50">Powered by Gemini 3 Flash & Google Search</p>
        </div>
      </footer>

      {/* Toast Container */}
      <div className="fixed bottom-20 lg:bottom-8 right-8 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "px-6 py-3 font-mono text-xs uppercase tracking-widest border flex items-center gap-3 transition-colors",
                state.isDarkMode
                  ? `bg-[#1a1a1a] text-white ${theme.border} shadow-lg ${theme.glow}`
                  : "bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/20 shadow-lg",
                toast.type === 'error' && "bg-red-600",
                toast.type === 'info' && "bg-blue-600"
              )}
            >
              <Check className="w-4 h-4" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}