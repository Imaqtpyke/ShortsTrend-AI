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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeTrends, generateContentIdea, getWorkflow, critiqueScript, generateImprovement } from './services/geminiService';
import { AppState, VISUAL_STYLES, HistoryItem, Toast, RetentionLeak } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const [state, setState] = useState<AppState>(() => {
    let history: HistoryItem[] = [];
    try {
      const savedHistory = localStorage.getItem('shorts_trend_history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error('Failed to parse history from localStorage', e);
    }

    return {
      analysis: null,
      contentIdea: null,
      workflow: null,
      critique: null,
      isLoading: false,
      error: null,
      selectedVisualStyle: VISUAL_STYLES[0],
      visualGenerationType: 'image',
      temperature: 0.7, // Default creativity
      targetAudience: 'General Audience', // Default target audience
      tone: 'Informative', // Default tone
      history,
      searchQuery: '',
      isDarkMode: false,
    };
  });

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const [activeTab, setActiveTab] = useState<'trends' | 'generator' | 'workflow' | 'history' | 'critique'>('trends');
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [trendFilter, setTrendFilter] = useState<'all' | 'exploding' | 'steady' | 'declining'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [confirmApply, setConfirmApply] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isLoading && (state.analysis || activeTab === 'history')) {
      setTimeout(() => {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeTab, state.isLoading, state.analysis]);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const theme = (() => {
    const defaultTheme = {
      primary: 'emerald-500',
      secondary: 'emerald-400',
      border: 'border-emerald-500',
      bg: 'bg-emerald-500',
      text: 'text-emerald-500',
      glow: 'shadow-emerald-500/20',
      hoverBg: 'hover:bg-emerald-400',
      hoverBorder: 'hover:border-emerald-500',
      ring: 'focus:ring-emerald-500',
      focusBorder: 'focus:border-emerald-500',
      accent: 'emerald',
      bgOpacity: 'bg-emerald-500/5',
      textAccent: 'text-emerald-400',
      borderAccent: 'border-emerald-500/30',
      bgAccent: 'bg-emerald-500/10',
      hoverBgAccent: 'hover:bg-emerald-500/20',
      borderAccent2: 'border-emerald-500/20',
      shadowAccent: 'shadow-emerald-500/10'
    };

    if (!selectedTrend || !state.analysis) return defaultTheme;
    
    const topic = state.analysis.trendingTopics.find(t => t.name === selectedTrend);
    if (!topic) return defaultTheme;

    switch (topic.growth) {
      case 'exploding':
        return {
          primary: 'red-500',
          secondary: 'red-400',
          border: 'border-red-500',
          bg: 'bg-red-500',
          text: 'text-red-500',
          glow: 'shadow-red-500/20',
          hoverBg: 'hover:bg-red-400',
          hoverBorder: 'hover:border-red-500',
          ring: 'focus:ring-red-500',
          focusBorder: 'focus:border-red-500',
          accent: 'red',
          bgOpacity: 'bg-red-500/5',
          textAccent: 'text-red-400',
          borderAccent: 'border-red-500/30',
          bgAccent: 'bg-red-500/10',
          hoverBgAccent: 'hover:bg-red-500/20',
          borderAccent2: 'border-red-500/20',
          shadowAccent: 'shadow-red-500/10'
        };
      case 'steady':
        return {
          primary: 'blue-500',
          secondary: 'blue-400',
          border: 'border-blue-500',
          bg: 'bg-blue-500',
          text: 'text-blue-500',
          glow: 'shadow-blue-500/20',
          hoverBg: 'hover:bg-blue-400',
          hoverBorder: 'hover:border-blue-500',
          ring: 'focus:ring-blue-500',
          focusBorder: 'focus:border-blue-500',
          accent: 'blue',
          bgOpacity: 'bg-blue-500/5',
          textAccent: 'text-blue-400',
          borderAccent: 'border-blue-500/30',
          bgAccent: 'bg-blue-500/10',
          hoverBgAccent: 'hover:bg-blue-500/20',
          borderAccent2: 'border-blue-500/20',
          shadowAccent: 'shadow-blue-500/10'
        };
      case 'declining':
        return {
          primary: 'slate-500',
          secondary: 'slate-400',
          border: 'border-slate-500',
          bg: 'bg-slate-500',
          text: 'text-slate-500',
          glow: 'shadow-slate-500/20',
          hoverBg: 'hover:bg-slate-400',
          hoverBorder: 'hover:border-slate-500',
          ring: 'focus:ring-slate-500',
          focusBorder: 'focus:border-slate-500',
          accent: 'slate',
          bgOpacity: 'bg-slate-500/5',
          textAccent: 'text-slate-400',
          borderAccent: 'border-slate-500/30',
          bgAccent: 'bg-slate-500/10',
          hoverBgAccent: 'hover:bg-slate-500/20',
          borderAccent2: 'border-slate-500/20',
          shadowAccent: 'shadow-slate-500/10'
        };
      default:
        return defaultTheme;
    }
  })();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllForProduction = () => {
    if (!state.contentIdea) return;
    const { title, script, hook, caption, hashtags, musicStyle, soundEffects, visualStyle, imagePrompts } = state.contentIdea;
    
    const text = `
TITLE: ${title}

HOOK: ${hook}

SCRIPT:
${script.map(s => `[${s.timestamp}] ${s.text}`).join('\n')}

VISUAL STYLE: ${visualStyle}

STORYBOARD PROMPTS:
${imagePrompts.map(p => `[${p.frame}] ${p.prompt}`).join('\n')}

AUDIO:
Music: ${musicStyle}
SFX: ${soundEffects.join(', ')}

CAPTION:
${caption}
${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}
    `.trim();

    copyToClipboard(text, 'all');
  };

  useEffect(() => {
    localStorage.setItem('shorts_trend_history', JSON.stringify(state.history));
  }, [state.history]);

  const resetApp = () => {
    setState(prev => ({ 
      ...prev, 
      analysis: null, 
      contentIdea: null, 
      critique: null, 
      workflow: null, 
      searchQuery: '' 
    }));
    setActiveTab('trends');
  };

  const handleAnalyze = async (queryOverride?: string) => {
    const query = queryOverride !== undefined ? queryOverride : state.searchQuery;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const analysis = await analyzeTrends(query || undefined);
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        query: query || 'General Trends',
        timestamp: Date.now(),
        analysis,
      };

      setState(prev => ({ 
        ...prev, 
        analysis, 
        isLoading: false,
        history: [newHistoryItem, ...prev.history].slice(0, 10) // Keep last 10
      }));
      setActiveTab('trends');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to analyze trends. Please try again.' }));
    }
  };

  const handleGenerate = async (trend: string) => {
    setSelectedTrend(trend);
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [idea, workflow] = await Promise.all([
        generateContentIdea(
          trend,
          state.selectedVisualStyle,
          state.visualGenerationType,
          state.temperature,
          state.targetAudience,
          state.tone
        ),
        getWorkflow()
      ]);
      setState(prev => ({ ...prev, contentIdea: idea, workflow, critique: null, isLoading: false }));
      setCompletedSteps([]);
      setActiveTab('generator');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to generate content. Please try again.' }));
    }
  };

  const handleCritique = async () => {
    if (!state.contentIdea) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
      const critique = await critiqueScript(scriptText, state.contentIdea.hook);
      setState(prev => ({ ...prev, critique, isLoading: false }));
      setActiveTab('critique');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to critique script. Please try again.' }));
    }
  };

  const handleImprove = async () => {
    if (!state.contentIdea || !state.critique) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scriptText = state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
      const critiqueText = `Score: ${state.critique.viralityScore}. Feedback: ${state.critique.overallFeedback}`;
      const improvement = await generateImprovement(scriptText, critiqueText);
      
      // Critique the improved script
      const improvedScriptText = improvement.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
      const newCritique = await critiqueScript(improvedScriptText, state.contentIdea.hook);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        critique: {
          ...newCritique,
          improvedScript: improvement.improvedScript,
          improvedImagePrompts: improvement.improvedImagePrompts
        }
      }));
      addToast('AI has generated and critiqued an improved version of your script!', 'success');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to generate improvement. Please try again.' }));
    }
  };

  const applyImprovedScript = () => {
    if (!state.contentIdea || !state.critique || !state.critique.improvedScript) return;
    
    setState(prev => ({
      ...prev,
      contentIdea: {
        ...prev.contentIdea!,
        script: state.critique!.improvedScript!,
        imagePrompts: state.critique!.improvedImagePrompts!
      }
    }));
    setActiveTab('generator');
    addToast('Improved script and visual prompts applied!', 'success');
  };

  const loadFromHistory = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      analysis: item.analysis,
      searchQuery: item.query === 'General Trends' ? '' : item.query
    }));
    setActiveTab('trends');
  };

  const clearHistory = () => {
    setState(prev => ({ ...prev, history: [] }));
  };

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
                                <XAxis 
                                  dataKey="name" 
                                  hide 
                                />
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
                          {/* Filter Pills */}
                          <div className={cn(
                            "flex flex-wrap gap-2 border-b pb-4",
                            state.isDarkMode ? "border-white/10" : "border-[#141414]/10"
                          )}>
                            {(['all', 'exploding', 'steady', 'declining'] as const).map(filter => {
                              const count = filter === 'all' 
                                ? state.analysis?.trendingTopics.length 
                                : state.analysis?.trendingTopics.filter(t => t.growth === filter).length;
                              
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
                ) : activeTab === 'generator' ? (
                  !state.contentIdea ? (
                    <motion.div 
                      key="generator-empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-24 text-center space-y-6"
                    >
                      <div className={cn(
                        "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                        state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                      )}>
                        <Wand2 className="w-10 h-10" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">No Idea Selected</h2>
                        <p className="text-sm opacity-60">
                          Select a trend from the dashboard to generate a viral script and production plan.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('trends')}
                        className={cn(
                          "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                          state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Go to Trends
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="generator"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <div className={cn(
                        "z-30 backdrop-blur-md border-b -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-8 flex flex-wrap items-center justify-between gap-4 transition-colors",
                        state.isDarkMode ? "bg-[#0a0a0a]/90 border-white/10" : "bg-white/90 border-[#141414]"
                      )}>
                        <div className="w-full space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                Visual Style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {VISUAL_STYLES.map(style => (
                                  <button
                                    key={style}
                                    onClick={() => setState(prev => ({ ...prev, selectedVisualStyle: style }))}
                                    className={cn(
                                      "px-3 py-2 text-[10px] sm:text-xs font-mono uppercase border transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center",
                                      state.selectedVisualStyle === style 
                                        ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]") 
                                        : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                    )}
                                  >
                                    {style.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <Video className="w-2.5 h-2.5" />
                                Type
                              </label>
                              <div className="flex gap-2">
                                {(['image', 'video'] as const).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setState(prev => ({ ...prev, visualGenerationType: type }))}
                                    className={cn(
                                      "px-3 py-2 text-[10px] sm:text-xs font-mono uppercase border transition-all flex items-center gap-2 whitespace-nowrap w-full justify-center min-h-[44px]",
                                      state.visualGenerationType === type
                                        ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                        : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                    )}
                                  >
                                    {type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label htmlFor="target-audience-input" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <Layers className="w-2.5 h-2.5" />
                                Audience
                              </label>
                              <input
                                id="target-audience-input"
                                type="text"
                                value={state.targetAudience}
                                onChange={(e) => setState(prev => ({ ...prev, targetAudience: e.target.value }))}
                                placeholder="e.g., Gen Z gamers"
                                className={cn(
                                  "w-full px-3 py-3 text-xs font-mono uppercase border transition-all min-h-[44px]",
                                  state.isDarkMode 
                                    ? "bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500" 
                                    : "bg-white text-[#141414] border-gray-200 focus:border-[#141414]"
                                )}
                              />
                            </div>
                            <div className="space-y-1">
                              <label htmlFor="tone-input" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <MessageSquare className="w-2.5 h-2.5" />
                                Tone
                              </label>
                              <input
                                id="tone-input"
                                type="text"
                                value={state.tone}
                                onChange={(e) => setState(prev => ({ ...prev, tone: e.target.value }))}
                                placeholder="e.g., Sarcastic, Informative"
                                className={cn(
                                  "w-full px-3 py-3 text-xs font-mono uppercase border transition-all min-h-[44px]",
                                  state.isDarkMode 
                                    ? "bg-[#1a1a1a] text-white border-white/10 focus:border-emerald-500" 
                                    : "bg-white text-[#141414] border-gray-200 focus:border-[#141414]"
                                )}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label htmlFor="temperature-slider" className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                              <Lightbulb className="w-2.5 h-2.5" />
                              Creativity ({state.temperature})
                            </label>
                            <input
                              id="temperature-slider"
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={state.temperature}
                              onChange={(e) => setState(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                              className={cn(
                                "w-full h-1 rounded-lg appearance-none cursor-pointer mt-2.5",
                                state.isDarkMode ? "bg-white/10 accent-emerald-500" : "bg-gray-200 accent-[#141414]"
                              )}
                            />
                          </div>

                          <button 
                            onClick={() => handleGenerate(selectedTrend || '')}
                            disabled={state.isLoading}
                            className={cn(
                              "w-full px-3 py-2 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm active:translate-y-0.5 active:shadow-none",
                              state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.accent}-600 ${theme.hoverBg}` : "bg-red-600 text-white border-red-700 hover:bg-red-700"
                            )}
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", state.isLoading && "animate-spin")} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>

                    <div className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6",
                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                    )}>
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 block">Generated Content for: {selectedTrend}</span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{state.contentIdea.title}</h2>
                      </div>
                      <button 
                        onClick={copyAllForProduction}
                        className={cn(
                          "flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 active:shadow-none",
                          state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                      >
                        {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copy All for Production</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Script (Bento Box) */}
                      <div className="lg:col-span-7 space-y-8 flex flex-col">
                        <Section title="Production Timeline" icon={<Clock className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="relative max-h-[600px] overflow-y-auto pr-4 custom-scrollbar max-w-3xl mx-auto w-full">
                            <div className="relative space-y-4 pl-8">
                              {/* Vertical Timeline Line */}
                              <div className={cn(
                                "absolute left-[15px] top-2 bottom-2 w-[2px] opacity-10",
                                state.isDarkMode ? "bg-white" : "bg-[#141414]"
                              )} />
                              
                              {state.contentIdea.script.map((segment, i) => {
                                const visualPrompt = state.contentIdea?.imagePrompts.find(p => p.frame === segment.timestamp);
                                return (
                                  <div key={i} className={cn(
                                    "group relative flex flex-col md:flex-row border transition-all shadow-sm",
                                    state.isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500" : "bg-white border-[#141414] hover:border-red-600"
                                  )}>
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                      "absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border z-10 transition-colors",
                                      state.isDarkMode 
                                        ? `border-white/20 bg-[#0a0a0a] group-hover:bg-${theme.primary} group-hover:border-${theme.primary}` 
                                        : "border-[#141414] bg-[#E4E3E0] group-hover:bg-red-600 group-hover:border-red-600"
                                    )} />
                                    
                                    <div className={cn(
                                      "md:w-20 flex-shrink-0 p-4 border-b md:border-b-0 md:border-r flex items-center justify-center font-mono text-xs font-bold",
                                      state.isDarkMode ? "bg-[#0a0a0a] border-white/10 text-white/40" : "bg-gray-100 border-[#141414] text-gray-500"
                                    )}>
                                      {segment.timestamp}
                                    </div>
                                    <div className={cn(
                                      "flex-1 p-4 border-b md:border-b-0 md:border-r relative min-w-0",
                                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                                    )}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono uppercase opacity-60">Script Segment</span>
                                        <button 
                                          onClick={() => copyToClipboard(segment.text, `script-${i}`)}
                                          aria-label="Copy script segment"
                                          className={cn(
                                            "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                            state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                                          )}
                                        >
                                          {copiedId === `script-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                      <p className="text-sm leading-relaxed">{segment.text}</p>
                                    </div>
                                    <div className={cn(
                                      "flex-1 p-4 min-w-0",
                                      state.isDarkMode ? `${theme.bgOpacity} ${theme.textAccent}` : "bg-[#141414] text-[#E4E3E0]"
                                    )}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono uppercase opacity-60">Visual Prompt</span>
                                        {visualPrompt && (
                                          <button 
                                            onClick={() => copyToClipboard(visualPrompt.prompt, `visual-${i}`)}
                                            className={cn(
                                              "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                              state.isDarkMode ? theme.hoverBgAccent : "hover:bg-white/20"
                                            )}
                                          >
                                            {copiedId === `visual-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        )}
                                      </div>
                                      {visualPrompt ? (
                                        <p className="text-sm leading-relaxed italic opacity-90">"{visualPrompt.prompt}"</p>
                                      ) : (
                                        <p className="text-xs italic opacity-40">No visual prompt for this segment</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Section>
                      </div>

                      {/* Right Column: Details (Bento Box) */}
                      <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-2 pb-2">
                        <Section title="Hook (0-3s)" icon={<Zap className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="relative group">
                            <p className="text-xl font-bold italic pr-8">"{state.contentIdea.hook}"</p>
                            <button 
                              onClick={() => copyToClipboard(state.contentIdea!.hook, 'hook')}
                              aria-label="Copy hook"
                              className={cn(
                                "absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                              )}
                            >
                              {copiedId === 'hook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </Section>

                        <Section title="Caption & Tags" icon={<Hash className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="space-y-4 relative group">
                            <button 
                              onClick={() => copyToClipboard(`${state.contentIdea!.caption}\n${state.contentIdea!.hashtags.map(h => `#${h}`).join(' ')}`, 'caption')}
                              aria-label="Copy caption"
                              className={cn(
                                "absolute right-0 top-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                state.isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
                              )}
                            >
                              {copiedId === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <p className="text-sm pr-8 opacity-80">{state.contentIdea.caption}</p>
                            <div className="flex flex-wrap gap-2">
                              {state.contentIdea.hashtags.map((h, i) => {
                                const tag = `#${h.replace('#', '')}`;
                                return (
                                  <motion.button 
                                    key={i} 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                    className={cn(
                                      "text-xs font-mono px-2 py-1 rounded-sm border transition-colors flex items-center gap-1",
                                      state.isDarkMode 
                                        ? `${theme.textAccent} ${theme.borderAccent} ${theme.bgAccent}` 
                                        : "text-blue-600 border-blue-600/30 hover:bg-blue-50"
                                    )}
                                  >
                                    {copiedId === `tag-${i}` ? <Check className="w-3 h-3" /> : null}
                                    {tag}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        </Section>

                        <Section title="Audio Design" icon={<Volume2 className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Music className={cn("w-4 h-4", state.isDarkMode ? theme.textAccent : "text-purple-500")} />
                              <span className="font-bold">Music:</span> {state.contentIdea.musicStyle}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {state.contentIdea.soundEffects.map((s, i) => (
                                <span key={i} className={cn(
                                  "px-2 py-1 border text-[10px] uppercase font-mono",
                                  state.isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-[#141414] bg-white"
                                )}>{s}</span>
                              ))}
                            </div>
                          </div>
                        </Section>

                        <Section title="Editing & Post" icon={<Layers className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="space-y-3">
                            {state.contentIdea.editingEffects.map((effect, i) => (
                              <div key={i} className={cn(
                                "flex items-start gap-2 p-3 text-sm border",
                                state.isDarkMode ? `${theme.bgOpacity} ${theme.borderAccent2} ${theme.textAccent}` : "bg-blue-50 border-blue-100 text-blue-900"
                              )}>
                                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{effect}</span>
                              </div>
                            ))}
                          </div>
                        </Section>

                        <Section title="Recommended Font Style" icon={<ImageIcon className="w-5 h-5 text-blue-600" />} isDarkMode={state.isDarkMode}>
                          <p className={cn("text-sm leading-relaxed", state.isDarkMode ? "text-white/80" : "text-[#141414]")}>
                            <span className="font-bold">{state.contentIdea.fontStyle}</span>
                          </p>
                        </Section>

                        <Section title="Editing Effects Context" icon={<Video className="w-5 h-5 text-purple-600" />} isDarkMode={state.isDarkMode}>
                          <p className={cn("text-sm leading-relaxed", state.isDarkMode ? "text-white/80" : "text-[#141414]")}>
                            {state.contentIdea.editingEffectsContext}
                          </p>
                        </Section>

                        <div className={cn(
                          "pt-6 border-t border-dashed sticky bottom-0 z-20 transition-colors",
                          state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]/10"
                        )}>
                          <button 
                            onClick={handleCritique}
                            disabled={state.isLoading}
                            className={cn(
                              "w-full flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                              state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                            )}
                          >
                            {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            Roast My Script
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) : activeTab === 'critique' ? (
                  <motion.div 
                    key="critique-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    {!state.contentIdea ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className={cn(
                          "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                          state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                        )}>
                          <BarChart className="w-10 h-10" />
                        </div>
                        <div className="max-w-md space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight">No Script to Roast</h2>
                          <p className="text-sm opacity-60">
                            You need a generated script before you can roast it. Start by selecting a trend.
                          </p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('trends')}
                          className={cn(
                            "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                          )}
                        >
                          <ArrowLeft className="w-5 h-5" />
                          Go to Trends
                        </button>
                      </div>
                    ) : !state.critique ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <motion.div 
                          animate={{ y: [0, -10, 0] }} 
                          transition={{ repeat: Infinity, duration: 3 }}
                          className={cn(
                          "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                          state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                        )}>
                          <Zap className="w-10 h-10" />
                        </motion.div>
                        <div className="max-w-md space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight">No Roast Yet</h2>
                          <p className="text-sm opacity-60">
                            You haven't roasted this script yet. Let our AI find the boring parts and fix them for you.
                          </p>
                        </div>
                        <button 
                          onClick={handleCritique}
                          disabled={state.isLoading}
                          className={cn(
                            "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                          )}
                        >
                          {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          Roast My Script
                        </button>
                      </div>
                    ) : (
                      <motion.div 
                        key="critique-result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-12 text-left"
                      >
                        <div className={cn(
                          "border-b pb-6",
                          state.isDarkMode ? "border-white/10" : "border-[#141414]"
                        )}>
                          <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2 block">
                            {state.critique.improvedScript ? "Improved Script Critique" : "AI Critique Result"}
                          </span>
                          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {state.critique.improvedScript ? "New Roast Results" : "Script Roast"}
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className={cn(
                            "p-8 flex flex-col items-center justify-center text-center border transition-colors h-full",
                            state.isDarkMode ? "border-white/10" : "border-[#141414]",
                            state.critique.viralityScore >= 80 ? "bg-emerald-600 text-white" :
                            state.critique.viralityScore >= 50 ? "bg-yellow-400 text-[#141414]" :
                            "bg-red-600 text-white"
                          )}>
                            <span className="font-mono text-xs uppercase tracking-widest opacity-70 mb-2">Virality Score</span>
                            <span className="text-5xl md:text-8xl font-bold tracking-tighter">{state.critique.viralityScore}</span>
                            <span className="text-sm opacity-70 mt-2">/ 100</span>
                          </div>

                          <div className="space-y-6">
                            <Section title="Simulated Retention Graph" icon={<TrendingUp className={cn("w-5 h-5", `text-${theme.primary}`)} />} isDarkMode={state.isDarkMode}>
                              <div className={cn(
                                "p-6 border transition-colors",
                                state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                              )}>
                                <RetentionGraph leaks={state.critique.retentionLeaks} isDarkMode={state.isDarkMode} />
                                <div className="mt-4 flex flex-wrap gap-6 justify-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span className="font-mono text-[10px] uppercase opacity-60">
                                      {state.critique.improvedScript ? "Improved Script" : "Original Script"}
                                    </span>
                                  </div>
                                  {!state.critique.improvedScript && (
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-3 h-3 border border-dashed rounded-full", `border-${theme.primary}`)} />
                                      <span className="font-mono text-[10px] uppercase opacity-60">Improved Script (Predicted)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Section>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <Section title="Retention Leaks (Boring Parts)" icon={<AlertTriangle className="w-5 h-5 text-red-600" />} isDarkMode={state.isDarkMode}>
                            {state.critique.retentionLeaks.length > 0 ? (
                              <motion.ul 
                                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                                initial="hidden" animate="show"
                                className="space-y-3"
                              >
                                {state.critique.retentionLeaks.map((leak, i) => (
                                  <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                    "flex items-start gap-2 text-sm p-3 border transition-colors",
                                    state.isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-900"
                                  )}>
                                    <div className="font-mono text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5">
                                      {leak.timestamp}s
                                    </div>
                                    <span>{leak.issue}</span>
                                  </motion.li>
                                ))}
                              </motion.ul>
                            ) : (
                              <div className={cn(
                                "p-4 border text-sm italic",
                                state.isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-900"
                              )}>
                                No retention leaks found! This script is highly engaging.
                              </div>
                            )}
                          </Section>

                          <Section title="Punchier Hook Alternatives" icon={<Zap className="w-5 h-5 text-yellow-600" />} isDarkMode={state.isDarkMode}>
                            <motion.ul 
                              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                              initial="hidden" animate="show"
                              className="space-y-4"
                            >
                              {state.critique.hookSuggestions.map((hook, i) => (
                                <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                  "p-4 border text-sm font-bold italic transition-colors",
                                  state.isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-[#141414]"
                                )}>
                                  "{hook}"
                                </motion.li>
                              ))}
                            </motion.ul>
                          </Section>

                          <Section title="Overall Feedback" icon={<ThumbsUp className="w-5 h-5 text-blue-600" />} isDarkMode={state.isDarkMode}>
                            <div className={cn(
                              "p-6 border text-sm leading-relaxed transition-colors",
                              state.isDarkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-900"
                            )}>
                              {state.critique.overallFeedback}
                            </div>
                          </Section>
                        </div>

                        {!state.critique.improvedScript ? (
                          <div className="pt-8 flex flex-col items-center justify-center text-center space-y-6 border-t border-dashed border-white/10">
                            <div className="space-y-2">
                              <h3 className="text-xl md:text-2xl font-bold tracking-tight">Ready to level up?</h3>
                              <p className="opacity-60 max-w-md mx-auto text-sm md:text-base">Our AI can rewrite your script based on this roast, fixing every retention leak and optimizing for maximum virality.</p>
                            </div>
                            <button 
                              onClick={handleImprove}
                              disabled={state.isLoading}
                              className={cn(
                                "flex items-center gap-3 px-12 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                                state.isDarkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                              )}
                            >
                              {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                              Generate Viral Script
                            </button>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12 border-t border-dashed border-white/10 pt-12"
                          >
                            <Section title="Improved Script Comparison" icon={<Wand2 className="w-5 h-5 text-purple-600" />} isDarkMode={state.isDarkMode}>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col">
                                  <span className="text-[10px] font-mono uppercase opacity-60">Original Script</span>
                                  <div className={cn(
                                    "font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 opacity-60 border transition-colors flex-1 break-words overflow-x-hidden max-h-[500px] overflow-y-auto custom-scrollbar",
                                    state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                                  )}>
                                    {state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                  </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                  <span className="text-[10px] font-mono uppercase text-purple-600 font-bold">Improved Script</span>
                                  <div className="relative group flex-1 flex flex-col">
                                    <div className={cn(
                                      "border font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 pr-12 shadow-lg transition-colors flex-1 break-words overflow-x-hidden max-h-[500px] overflow-y-auto custom-scrollbar",
                                      state.isDarkMode ? "bg-purple-500/10 border-purple-600 text-purple-400" : "bg-purple-50 border-purple-600 text-[#141414]"
                                    )}>
                                      {state.critique.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                    </div>
                                    <button 
                                      onClick={() => copyToClipboard(state.critique!.improvedScript!.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n'), 'improved-script')}
                                      className={cn(
                                        "absolute right-3 top-3 p-2 rounded border transition-all opacity-0 group-hover:opacity-100 shadow-sm",
                                        state.isDarkMode ? "bg-white/10 border-purple-500/20" : "bg-white/50 border-purple-200"
                                      )}
                                    >
                                      {copiedId === 'improved-script' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Section>

                            <Section title="Improved Visual Prompts" isDarkMode={state.isDarkMode}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {state.critique.improvedImagePrompts!.map((p, i) => (
                                  <div 
                                    key={i}
                                    className={cn(
                                      "p-4 border font-mono text-xs",
                                      state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-2 opacity-50">
                                      <ImageIcon className="w-3 h-3" />
                                      <span>{p.frame}</span>
                                    </div>
                                    <p className="leading-relaxed">{p.prompt}</p>
                                  </div>
                                ))}
                              </div>
                            </Section>

                            <button 
                              onClick={() => {
                                if (confirmApply) {
                                  applyImprovedScript();
                                  setConfirmApply(false);
                                } else {
                                  setConfirmApply(true);
                                  setTimeout(() => setConfirmApply(false), 3000);
                                }
                              }}
                              className={cn(
                                "w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 font-mono text-xs uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none sticky bottom-0 z-20",
                                confirmApply 
                                  ? (state.isDarkMode ? "bg-red-500 text-white" : "bg-red-600 text-white")
                                  : (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-purple-600 text-white hover:bg-purple-700")
                              )}
                            >
                              {confirmApply ? <AlertTriangle className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                              {confirmApply ? "Are you sure? Original script will be replaced." : "Apply Improved Script to Generator"}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ) : activeTab === 'workflow' ? (
                  !state.workflow ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                      <div className={cn(
                        "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                        state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                      )}>
                        <Settings className="w-10 h-10" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">No Workflow Generated</h2>
                        <p className="text-sm opacity-60">
                          Generate a script first to get a tailored production workflow and software recommendations.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('trends')}
                        className={cn(
                          "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none",
                          state.isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Go to Trends
                      </button>
                    </div>
                  ) : (
                    <motion.div 
                      key="workflow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                    <Section title="Recommended Software Stack" isDarkMode={state.isDarkMode}>
                      <motion.div 
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden" animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                      >
                        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <SoftwareCard label="Voice Generation" name={state.workflow.software.voiceGen} isDarkMode={state.isDarkMode} />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <SoftwareCard label="Image Generation" name={state.workflow.software.imageGen} isDarkMode={state.isDarkMode} />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <SoftwareCard label="Video Generation" name={state.workflow.software.videoGen} isDarkMode={state.isDarkMode} />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <SoftwareCard label="Editing" name={state.workflow.software.editing} isDarkMode={state.isDarkMode} />
                        </motion.div>
                      </motion.div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <Section title="Step-by-Step Process" isDarkMode={state.isDarkMode}>
                        <motion.div 
                          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                          initial="hidden" animate="show"
                          className="space-y-3"
                        >
                          {state.workflow.steps.map((step, i) => (
                            <motion.div 
                              key={i} 
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setCompletedSteps(prev => 
                                    prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]
                                  );
                                }
                              }}
                              variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                              onClick={() => {
                                setCompletedSteps(prev => 
                                  prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]
                                );
                              }}
                              className={cn(
                                "flex gap-4 p-4 border cursor-pointer transition-all group focus:outline-none focus:ring-2",
                                theme.ring,
                                state.isDarkMode ? "border-white/10" : "border-[#141414]",
                                completedSteps.includes(i) 
                                  ? (state.isDarkMode ? `${theme.bgAccent} opacity-60` : "bg-emerald-50/50 opacity-60") 
                                  : (state.isDarkMode ? `bg-[#0a0a0a] ${theme.hoverBorder}` : "bg-white hover:border-emerald-500")
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 border flex items-center justify-center flex-shrink-0 transition-colors",
                                state.isDarkMode ? "border-white/20" : "border-[#141414]",
                                completedSteps.includes(i) 
                                  ? (state.isDarkMode ? `bg-${theme.primary} border-${theme.primary} text-[#0a0a0a]` : "bg-[#141414] text-white") 
                                  : (state.isDarkMode ? `bg-[#0a0a0a] group-hover:${theme.border}` : "bg-white group-hover:border-emerald-500")
                              )}>
                                {completedSteps.includes(i) && <Check className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <span className="font-mono text-[10px] uppercase opacity-60 block mb-1">Step {(i + 1).toString().padStart(2, '0')}</span>
                                <p className={cn(
                                  "text-sm",
                                  completedSteps.includes(i) && "line-through opacity-50"
                                )}>{step}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </Section>
                      <Section title="Optimization Tips" isDarkMode={state.isDarkMode}>
                        <motion.ul 
                          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                          initial="hidden" animate="show"
                          className="space-y-4"
                        >
                          {state.workflow.optimizationTips.map((tip, i) => (
                            <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                              "flex items-start gap-3 p-4 border text-sm transition-colors",
                              state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-gray-200"
                            )}>
                              <Zap className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                              <span>{tip}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </Section>
                    </div>
                  </motion.div>
                )) : activeTab === 'history' ? (
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
                                {new Date(item.timestamp).toLocaleString()} • {item.analysis.trendingTopics.length} trends found
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
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

function TabButton({ active, onClick, icon, label, disabled = false, isDarkMode, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, isDarkMode: boolean, theme: any }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all border",
        active 
          ? (isDarkMode ? `bg-${theme.primary} text-[#0a0a0a] border-${theme.primary}` : "bg-[#141414] text-[#E4E3E0] border-[#141414]") 
          : (isDarkMode ? "text-white/60 border-transparent hover:bg-white/5" : "text-[#141414] border-transparent hover:bg-black/5"),
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label, disabled = false, isDarkMode, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, isDarkMode: boolean, theme: any }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all relative px-4 py-1",
        active 
          ? (isDarkMode ? theme.text : "text-[#141414]") 
          : (isDarkMode ? "text-white/70" : "text-[#141414]/70"),
        disabled && "opacity-10 cursor-not-allowed"
      )}
    >
      {active && (
        <motion.div 
          layoutId="mobile-nav-pill"
          className={cn(
            "absolute inset-0 rounded-full -z-10",
            isDarkMode ? "bg-white/10" : "bg-black/5"
          )}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {icon}
      <span className="hidden sm:block text-[10px] font-mono uppercase font-bold">{label}</span>
    </button>
  );
}

function Section({ title, children, icon, isDarkMode }: { title: string, children: React.ReactNode, icon?: React.ReactNode, isDarkMode?: boolean }) {
  return (
    <div className={cn(
      "space-y-4 p-6 border transition-all duration-300",
      isDarkMode 
        ? "bg-white/[0.02] border-white/10 backdrop-blur-sm hover:bg-white/[0.04]" 
        : "bg-white/50 border-[#141414]/10 backdrop-blur-sm hover:bg-white/80"
    )}>
      <div className={cn(
        "flex items-center gap-2 border-b pb-2 mb-4",
        isDarkMode ? "border-white/10" : "border-[#141414]"
      )}>
        {icon}
        <h3 className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest truncate">{title}</h3>
      </div>
      <div className="px-1 md:px-0 relative z-10">
        {children}
      </div>
    </div>
  );
}

function TrendCard({ title, velocity, growth, featured, onAction, isDarkMode }: { title: string, velocity?: number, growth?: string, featured?: boolean, onAction: () => void, isDarkMode: boolean }) {
  const cardTheme = (() => {
    switch (growth) {
      case 'exploding': return { primary: 'red-500', glow: 'shadow-red-500/20', text: 'text-red-400', bg: 'bg-red-500/10' };
      case 'steady': return { primary: 'blue-500', glow: 'shadow-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'declining': return { primary: 'slate-500', glow: 'shadow-slate-500/20', text: 'text-slate-400', bg: 'bg-slate-500/10' };
      default: return { primary: 'emerald-500', glow: 'shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    }
  })();

  return (
    <div 
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAction();
        }
      }}
      className={cn(
        "group relative p-4 border transition-all cursor-pointer flex flex-col justify-between gap-4 focus:outline-none focus:ring-2 overflow-hidden h-full min-h-[160px]",
        isDarkMode ? `focus:ring-${cardTheme.primary}` : "focus:ring-[#141414]",
        isDarkMode ? "border-white/10" : "border-[#141414]",
        featured 
          ? (isDarkMode ? `bg-[#1a1a1a] shadow-2xl ${cardTheme.glow} border-${cardTheme.primary}/30` : "bg-[#141414] text-[#E4E3E0] shadow-2xl")
          : (isDarkMode ? `bg-[#0a0a0a] hover:border-${cardTheme.primary}/50` : "bg-white hover:border-[#141414]")
      )}
      onClick={onAction}
    >
      {/* Background Accent for Featured */}
      {featured && isDarkMode && (
        <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 blur-3xl opacity-20 rounded-full transition-opacity group-hover:opacity-40", `bg-${cardTheme.primary}`)} />
      )}

      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 border border-current flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3",
          featured ? "opacity-100" : "opacity-40 group-hover:opacity-100",
          featured && !isDarkMode ? "text-white" : (isDarkMode ? cardTheme.text : "")
        )}>
          {growth === 'exploding' ? <ArrowUpRight className="w-4 h-4" /> : 
           growth === 'declining' ? <ArrowDownRight className="w-4 h-4" /> : 
           <Minus className="w-4 h-4" />}
        </div>
        
        {featured && (
          <span className={cn(
            "px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-[0.2em] font-bold",
            isDarkMode ? `bg-${cardTheme.primary} text-[#0a0a0a]` : "bg-red-600 text-white"
          )}>Featured</span>
        )}
      </div>

      <div className="space-y-3 relative z-10">
        <h4 className={cn(
          "font-bold leading-[1.2] tracking-tight break-words line-clamp-2",
          featured ? "text-base md:text-lg" : "text-xs md:text-sm",
          featured && !isDarkMode ? "text-white" : (isDarkMode ? "text-white" : "text-[#141414]")
        )}>
          {title}
        </h4>
        
        <div className="flex items-end justify-between gap-2 pt-2 border-t border-current/10">
          <div className="flex flex-col">
            <span className={cn(
              "text-[8px] font-mono uppercase opacity-50 mb-0.5",
              featured && !isDarkMode ? "text-white/60" : ""
            )}>Velocity</span>
            <span className={cn(
              "text-xs font-mono font-bold",
              featured && !isDarkMode ? "text-white" : ""
            )}>{velocity}%</span>
          </div>
          
          <div className="flex flex-col text-right">
            <span className={cn(
              "text-[8px] font-mono uppercase opacity-50 mb-0.5",
              featured && !isDarkMode ? "text-white/60" : ""
            )}>Growth</span>
            <span className={cn(
              "text-[10px] font-mono font-bold uppercase tracking-wider",
              isDarkMode ? cardTheme.text : (featured ? "text-red-400" : cardTheme.text)
            )}>{growth}</span>
          </div>
        </div>
      </div>

      {/* Hover Action Button */}
      <div className={cn(
        "absolute bottom-3 right-3 transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border shadow-lg",
        featured && !isDarkMode 
          ? "bg-white text-[#141414] border-white" 
          : (isDarkMode ? `bg-${cardTheme.primary} text-[#0a0a0a] border-${cardTheme.primary}` : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
      )}>
        <span>Generate Script</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}

function Skeleton({ className, isDarkMode }: { className?: string, isDarkMode: boolean }) {
  return (
    <div className={cn(
      "animate-pulse rounded-sm", 
      isDarkMode ? "bg-white/5" : "bg-[#141414]/10",
      className
    )} />
  );
}

function SoftwareCard({ label, name, isDarkMode }: { label: string, name: string, isDarkMode: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn(
        "p-4 border transition-colors",
        isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500" : "bg-white border-[#141414] hover:border-purple-600"
      )}
    >
      <p className="text-[10px] font-mono uppercase opacity-50 mb-1">{label}</p>
      <p className="text-sm font-bold">{name}</p>
    </motion.div>
  );
}

function NicheDNARadar({ data, isDarkMode }: { data: { subject: string, value: number }[], isDarkMode: boolean }) {
  return (
    <div className="h-full w-full" style={{ minHeight: '200px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontSize: 10, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Niche DNA"
            dataKey="value"
            stroke={isDarkMode ? "#10b981" : "#9333ea"}
            fill={isDarkMode ? "#10b981" : "#9333ea"}
            fillOpacity={0.5}
            animationDuration={1500}
          />
          <Tooltip 
            wrapperStyle={{ zIndex: 50 }}
            allowEscapeViewBox={{ x: false, y: true }}
            contentStyle={{ 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontSize: '10px',
              fontFamily: 'monospace',
              borderRadius: '0px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RetentionGraph({ leaks, isDarkMode }: { leaks: RetentionLeak[], isDarkMode: boolean }) {
  const data = Array.from({ length: 61 }, (_, i) => {
    // Base decay: starts at 100, decays to ~40% over 60s
    let original = 100 * Math.pow(0.985, i);
    
    // Apply drops for leaks
    leaks.forEach(leak => {
      if (i >= leak.timestamp) {
        // The drop should be more pronounced at the exact timestamp
        const dropFactor = i === leak.timestamp ? 8 : 5;
        original -= dropFactor;
      }
    });
    
    // Ensure it doesn't go below 5%
    original = Math.max(original, 5);
    
    // Improved: starts at 100, decays to ~70% over 60s
    const improved = 100 * Math.pow(0.994, i);
    
    return {
      time: i,
      original: Math.round(original),
      improved: Math.round(improved),
    };
  });

  return (
    <div className="h-64 w-full" style={{ minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
            fontSize={10}
            tickFormatter={(val) => `${val}s`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
            fontSize={10}
            tickFormatter={(val) => `${val}%`}
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            wrapperStyle={{ zIndex: 50 }}
            allowEscapeViewBox={{ x: false, y: true }}
            contentStyle={{ 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontSize: '10px',
              fontFamily: 'monospace',
              borderRadius: '0px'
            }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Line 
            type="monotone" 
            dataKey="original" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false}
            name="Original Script"
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="improved" 
            stroke={isDarkMode ? "#10b981" : "#9333ea"} 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false}
            name="Improved Script"
            animationDuration={1500}
          />
          {leaks.map((leak, idx) => (
            <ReferenceLine 
              key={idx}
              x={leak.timestamp} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ 
                value: '!', 
                position: 'top', 
                fill: '#ef4444', 
                fontSize: 12,
                fontWeight: 'bold'
              }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
