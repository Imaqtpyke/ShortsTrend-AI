import React, { useState, useEffect } from 'react';
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
import { analyzeTrends, generateContentIdea, getWorkflow, critiqueScript } from './services/geminiService';
import { AppState, VISUAL_STYLES, HistoryItem, Toast, RetentionLeak } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const savedHistory = localStorage.getItem('shorts_trend_history');
    return {
      analysis: null,
      contentIdea: null,
      workflow: null,
      critique: null,
      isLoading: false,
      error: null,
      selectedVisualStyle: VISUAL_STYLES[0],
      visualGenerationType: 'image',
      history: savedHistory ? JSON.parse(savedHistory) : [],
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

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard');
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
        generateContentIdea(trend, state.selectedVisualStyle, state.visualGenerationType),
        getWorkflow()
      ]);
      setState(prev => ({ ...prev, contentIdea: idea, workflow, isLoading: false }));
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
      const scriptText = state.contentIdea.script.map(s => s.text).join(' ');
      const critique = await critiqueScript(scriptText, state.contentIdea.hook);
      setState(prev => ({ ...prev, critique, isLoading: false }));
      setActiveTab('critique');
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to critique script. Please try again.' }));
    }
  };

  const applyImprovedScript = () => {
    if (!state.contentIdea || !state.critique) return;
    
    setState(prev => ({
      ...prev,
      contentIdea: {
        ...prev.contentIdea!,
        script: state.critique!.improvedScript
      }
    }));
    setActiveTab('generator');
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
      "min-h-screen font-sans transition-colors duration-300",
      state.isDarkMode 
        ? "bg-[#0a0a0a] text-[#f5f5f5] selection:bg-[#f5f5f5] selection:text-[#0a0a0a]" 
        : "bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0]"
    )}>
      {/* Navigation */}
      <nav className={cn(
        "border-b sticky top-0 z-50 transition-colors duration-300",
        state.isDarkMode ? "bg-[#0a0a0a]/80 border-white/10 backdrop-blur-md" : "bg-[#E4E3E0]/80 border-[#141414] backdrop-blur-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center transition-colors",
                state.isDarkMode ? "bg-emerald-500" : "bg-[#141414]"
              )}>
                <TrendingUp className={cn("w-5 h-5", state.isDarkMode ? "text-[#0a0a0a]" : "text-[#E4E3E0]")} />
              </div>
              <span className="font-mono font-bold tracking-tighter text-xl uppercase">ShortsTrend AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className={cn(
                  "p-2 rounded-sm transition-colors",
                  state.isDarkMode ? "bg-white/10 text-emerald-400 hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                )}
              >
                {state.isDarkMode ? <Wand2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => handleAnalyze()}
                disabled={state.isLoading}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50",
                  state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                )}
              >
                {state.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Analyze Trends
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {state.error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-sm font-mono text-sm">
            {state.error}
          </div>
        )}

        {!state.analysis && !state.isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl"
            >
              <h1 className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter uppercase mb-4",
                state.isDarkMode ? "text-white" : "text-[#141414]"
              )}>
                Turn Viral Trends into Viral Content
              </h1>
              <p className="text-lg md:text-xl opacity-60 mb-12">
                AI-powered trend analysis and content generation for YouTube Shorts creators.
              </p>
              
              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 opacity-40" />
                </div>
                <input 
                  type="text"
                  placeholder="Enter a niche (e.g. Tech, Cooking, Fitness)..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className={cn(
                    "w-full pl-12 pr-4 py-5 border-2 rounded-sm font-mono text-lg focus:outline-none focus:ring-0 transition-all",
                    state.isDarkMode 
                      ? "bg-[#1a1a1a] border-white/10 text-white focus:border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.5)]" 
                      : "bg-white border-[#141414] text-[#141414] focus:border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                  )}
                />
                <button 
                  onClick={() => handleAnalyze()}
                  className={cn(
                    "absolute right-3 top-3 bottom-3 px-6 font-mono text-xs uppercase tracking-widest transition-colors",
                    state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                  )}
                >
                  Search
                </button>
              </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Navigation - Sticky Desktop */}
            <div className="hidden lg:block lg:col-span-3 space-y-2 lg:sticky lg:top-24">
              <TabButton 
                active={activeTab === 'trends'} 
                onClick={() => setActiveTab('trends')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Trend Analysis"
                isDarkMode={state.isDarkMode}
              />
              <TabButton 
                active={activeTab === 'generator'} 
                onClick={() => setActiveTab('generator')}
                disabled={!state.contentIdea}
                icon={<Wand2 className="w-4 h-4" />}
                label="Content Generator"
                isDarkMode={state.isDarkMode}
              />
              <TabButton 
                active={activeTab === 'critique'} 
                onClick={() => setActiveTab('critique')}
                disabled={!state.contentIdea}
                icon={<BarChart className="w-4 h-4" />}
                label="Roast My Script"
                isDarkMode={state.isDarkMode}
              />
              <TabButton 
                active={activeTab === 'workflow'} 
                onClick={() => setActiveTab('workflow')}
                disabled={!state.workflow}
                icon={<Settings className="w-4 h-4" />}
                label="Production Workflow"
                isDarkMode={state.isDarkMode}
              />
              <TabButton 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')}
                icon={<History className="w-4 h-4" />}
                label="Search History"
                isDarkMode={state.isDarkMode}
              />
            </div>

            {/* Main Content Area */}
            <div className={cn(
              "lg:col-span-9 border transition-all duration-300 p-4 md:p-8 min-h-[600px]",
              state.isDarkMode 
                ? "bg-[#1a1a1a] border-white/10 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]" 
                : "bg-white border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            )}>
              <AnimatePresence mode="wait">
                {state.isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className={cn(
                      "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6",
                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                    )}>
                      <div className="space-y-2 w-full max-w-md">
                        <Skeleton className="h-4 w-24" isDarkMode={state.isDarkMode} />
                        <Skeleton className="h-10 w-full" isDarkMode={state.isDarkMode} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" isDarkMode={state.isDarkMode} />
                        <div className="grid grid-cols-1 gap-4">
                          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" isDarkMode={state.isDarkMode} />)}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" isDarkMode={state.isDarkMode} />
                        <Skeleton className="h-64 w-full" isDarkMode={state.isDarkMode} />
                      </div>
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
                        <h2 className="text-4xl font-bold tracking-tighter uppercase">
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
                          )}>
                            <ResponsiveContainer width="100%" height="100%">
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
                                      fill={entry.growth === 'exploding' ? '#ef4444' : state.isDarkMode ? '#10b981' : '#141414'} 
                                    />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            </ResponsiveContainer>
                          </div>
                        </Section>

                        <Section title="Niche DNA Fingerprint" icon={<Zap className="w-5 h-5 text-emerald-500" />} isDarkMode={state.isDarkMode}>
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
                            {(['all', 'exploding', 'steady', 'declining'] as const).map(filter => (
                              <button
                                key={filter}
                                onClick={() => setTrendFilter(filter)}
                                className={cn(
                                  "px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all",
                                  trendFilter === filter 
                                    ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]") 
                                    : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                )}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {state.analysis.trendingTopics
                              .filter(t => trendFilter === 'all' || t.growth === trendFilter)
                              .map((topic, i) => {
                                const isFeatured = i < 3 && trendFilter === 'all';
                                return (
                                  <TrendCard 
                                    key={i} 
                                    title={topic.name} 
                                    velocity={topic.velocity}
                                    growth={topic.growth}
                                    featured={isFeatured}
                                    onAction={() => handleGenerate(topic.name)}
                                    isDarkMode={state.isDarkMode}
                                  />
                                );
                              })}
                          </div>
                        </div>
                      </Section>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        <Section title="Viral Formats" isDarkMode={state.isDarkMode}>
                          <ul className="space-y-2.5">
                            {state.analysis.viralFormats.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs md:text-sm">
                                <Zap className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-red-500")} />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                        <Section title="Winning Hooks" isDarkMode={state.isDarkMode}>
                          <ul className="space-y-2.5">
                            {state.analysis.hooks.map((h, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs md:text-sm italic">
                                <MessageSquare className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-blue-500")} />
                                <span>"{h}"</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                        <Section title="Popular Music & SFX" isDarkMode={state.isDarkMode}>
                          <ul className="space-y-2.5">
                            {state.analysis.popularMusic.map((m, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs md:text-sm">
                                <Music className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", state.isDarkMode ? "text-emerald-400" : "text-purple-500")} />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                      </div>

                      <Section title="Hashtag Patterns" isDarkMode={state.isDarkMode}>
                        <div className="flex flex-wrap gap-2">
                          {state.analysis.hashtagPatterns.map((h, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9, rotate: [0, -5, 5, 0] }}
                              onClick={() => copyToClipboard(`#${h.replace('#', '')}`, `tag-${i}`)}
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
                        </div>
                      </Section>
                    </div>
                  </motion.div>
                ) : activeTab === 'generator' && state.contentIdea ? (
                  <motion.div 
                    key="generator"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    <div className={cn(
                      "sticky top-16 z-30 backdrop-blur-md border-b -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-8 flex flex-wrap items-center justify-between gap-4 transition-colors",
                      state.isDarkMode ? "bg-[#0a0a0a]/90 border-white/10" : "bg-white/90 border-[#141414]"
                    )}>
                      <div className="flex flex-wrap items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar py-1">
                        <div className="space-y-1 flex-shrink-0">
                          <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            Visual Style
                          </label>
                          <div className="flex gap-1">
                            {VISUAL_STYLES.map(style => (
                              <button
                                key={style}
                                onClick={() => setState(prev => ({ ...prev, selectedVisualStyle: style }))}
                                className={cn(
                                  "px-2 py-0.5 text-[9px] font-mono uppercase border transition-all whitespace-nowrap",
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

                        <div className="space-y-1 flex-shrink-0">
                          <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                            <Video className="w-2.5 h-2.5" />
                            Type
                          </label>
                          <div className="flex gap-1">
                            {(['image', 'video'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setState(prev => ({ ...prev, visualGenerationType: type }))}
                                className={cn(
                                  "px-2 py-0.5 text-[9px] font-mono uppercase border transition-all flex items-center gap-1.5 whitespace-nowrap",
                                  state.visualGenerationType === type
                                    ? (state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]")
                                    : (state.isDarkMode ? "bg-[#1a1a1a] text-white border-white/10 hover:border-emerald-500" : "bg-white text-[#141414] border-gray-200 hover:border-[#141414]")
                                )}
                              >
                                {type === 'image' ? <ImageIcon className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleGenerate(selectedTrend || '')}
                        disabled={state.isLoading}
                        className={cn(
                          "flex-shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none",
                          state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-600 hover:bg-emerald-400" : "bg-red-600 text-white border-red-700 hover:bg-red-700"
                        )}
                      >
                        <RefreshCw className={cn("w-3 h-3", state.isLoading && "animate-spin")} />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6",
                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                    )}>
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block">Generated Content for: {selectedTrend}</span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter uppercase leading-tight">{state.contentIdea.title}</h2>
                      </div>
                      <button 
                        onClick={copyAllForProduction}
                        className={cn(
                          "flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none",
                          state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                        )}
                      >
                        {copiedId === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copy All for Production</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Script (Bento Box) */}
                      <div className="lg:col-span-7 space-y-8">
                        <Section title="Production Timeline" icon={<Clock className="w-5 h-5" />} isDarkMode={state.isDarkMode}>
                          <div className="relative max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
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
                                    "group relative flex flex-col md:flex-row border transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]",
                                    state.isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500" : "bg-white border-[#141414] hover:border-red-600"
                                  )}>
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                      "absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 z-10 transition-colors",
                                      state.isDarkMode 
                                        ? "border-white/20 bg-[#0a0a0a] group-hover:bg-emerald-500 group-hover:border-emerald-500" 
                                        : "border-[#141414] bg-[#E4E3E0] group-hover:bg-red-600 group-hover:border-red-600"
                                    )} />
                                    
                                    <div className={cn(
                                      "md:w-20 flex-shrink-0 p-4 border-b md:border-b-0 md:border-r flex items-center justify-center font-mono text-xs font-bold",
                                      state.isDarkMode ? "bg-[#0a0a0a] border-white/10 text-white/40" : "bg-gray-100 border-[#141414] text-gray-500"
                                    )}>
                                      {segment.timestamp}
                                    </div>
                                    <div className={cn(
                                      "flex-1 p-4 border-b md:border-b-0 md:border-r relative",
                                      state.isDarkMode ? "border-white/10" : "border-[#141414]"
                                    )}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono uppercase opacity-40">Script Segment</span>
                                        <button 
                                          onClick={() => copyToClipboard(segment.text, `script-${i}`)}
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
                                      "flex-1 p-4",
                                      state.isDarkMode ? "bg-emerald-500/5 text-emerald-400" : "bg-[#141414] text-[#E4E3E0]"
                                    )}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono uppercase opacity-40">Visual Prompt</span>
                                        {visualPrompt && (
                                          <button 
                                            onClick={() => copyToClipboard(visualPrompt.prompt, `visual-${i}`)}
                                            className={cn(
                                              "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                                              state.isDarkMode ? "hover:bg-emerald-500/20" : "hover:bg-white/20"
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
                                        ? "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" 
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
                              <Music className={cn("w-4 h-4", state.isDarkMode ? "text-emerald-400" : "text-purple-500")} />
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
                                state.isDarkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-blue-50 border-blue-100 text-blue-900"
                              )}>
                                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{effect}</span>
                              </div>
                            ))}
                          </div>
                        </Section>

                        <div className={cn(
                          "pt-6 border-t border-dashed sticky bottom-0 z-20 transition-colors",
                          state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]/10"
                        )}>
                          <button 
                            onClick={handleCritique}
                            disabled={state.isLoading}
                            className={cn(
                              "w-full flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none",
                              state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                            )}
                          >
                            {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            Roast My Script
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'critique' ? (
                  <motion.div 
                    key="critique-empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 text-center space-y-6"
                  >
                    {!state.critique ? (
                      <>
                        <div className={cn(
                          "w-20 h-20 border-2 flex items-center justify-center rounded-full mb-4",
                          state.isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
                        )}>
                          <Zap className="w-10 h-10" />
                        </div>
                        <div className="max-w-md space-y-2">
                          <h2 className="text-3xl font-bold uppercase tracking-tighter">No Roast Yet</h2>
                          <p className="text-sm opacity-60">
                            You haven't roasted this script yet. Let our AI find the boring parts and fix them for you.
                          </p>
                        </div>
                        <button 
                          onClick={handleCritique}
                          disabled={state.isLoading}
                          className={cn(
                            "flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none",
                            state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                          )}
                        >
                          {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          Roast My Script
                        </button>
                      </>
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
                          <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2 block">AI Critique Result</span>
                          <h2 className="text-4xl font-bold tracking-tighter uppercase">Script Roast</h2>
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
                            <span className="text-6xl md:text-8xl font-bold tracking-tighter">{state.critique.viralityScore}</span>
                            <span className="text-sm opacity-70 mt-2">/ 100</span>
                          </div>

                          <div className="space-y-6">
                            <Section title="Simulated Retention Graph" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} isDarkMode={state.isDarkMode}>
                              <div className={cn(
                                "p-6 border transition-colors",
                                state.isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
                              )}>
                                <RetentionGraph leaks={state.critique.retentionLeaks} isDarkMode={state.isDarkMode} />
                                <div className="mt-4 flex flex-wrap gap-6 justify-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span className="font-mono text-[10px] uppercase opacity-60">Original Script</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-emerald-500 border-dashed rounded-full" />
                                    <span className="font-mono text-[10px] uppercase opacity-60">Improved Script (Predicted)</span>
                                  </div>
                                </div>
                              </div>
                            </Section>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <Section title="Retention Leaks (Boring Parts)" icon={<AlertTriangle className="w-5 h-5 text-red-600" />} isDarkMode={state.isDarkMode}>
                            <ul className="space-y-3">
                              {state.critique.retentionLeaks.map((leak, i) => (
                                <li key={i} className={cn(
                                  "flex items-start gap-2 text-sm p-3 border transition-colors",
                                  state.isDarkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-900"
                                )}>
                                  <div className="font-mono text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5">
                                    {leak.timestamp}s
                                  </div>
                                  <span>{leak.issue}</span>
                                </li>
                              ))}
                            </ul>
                          </Section>

                          <Section title="Punchier Hook Alternatives" icon={<Zap className="w-5 h-5 text-yellow-600" />} isDarkMode={state.isDarkMode}>
                            <ul className="space-y-4">
                              {state.critique.hookSuggestions.map((hook, i) => (
                                <li key={i} className={cn(
                                  "p-4 border text-sm font-bold italic transition-colors",
                                  state.isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-[#141414]"
                                )}>
                                  "{hook}"
                                </li>
                              ))}
                            </ul>
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

                        <Section title="Improved Script Comparison" icon={<Wand2 className="w-5 h-5 text-purple-600" />} isDarkMode={state.isDarkMode}>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                              <span className="text-[10px] font-mono uppercase opacity-40">Original Script</span>
                              <div className={cn(
                                "font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 opacity-60 border transition-colors flex-1",
                                state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-[#141414]"
                              )}>
                                {state.contentIdea.script.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                              </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                              <span className="text-[10px] font-mono uppercase text-purple-600 font-bold">Improved Script</span>
                              <div className="relative group flex-1 flex flex-col">
                                <div className={cn(
                                  "border-2 font-mono text-xs leading-relaxed whitespace-pre-wrap p-4 pr-12 shadow-[4px_4px_0px_0px_rgba(147,51,234,0.1)] transition-colors flex-1",
                                  state.isDarkMode ? "bg-purple-500/10 border-purple-600 text-purple-400" : "bg-purple-50 border-purple-600 text-[#141414]"
                                )}>
                                  {state.critique.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n')}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(state.critique!.improvedScript.map(s => `[${s.timestamp}] ${s.text}`).join('\n\n'), 'improved-script')}
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
                          <button 
                            onClick={applyImprovedScript}
                            className={cn(
                              "w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 font-mono text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none sticky bottom-0 z-20",
                              state.isDarkMode ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400" : "bg-purple-600 text-white hover:bg-purple-700"
                            )}
                          >
                            <Wand2 className="w-4 h-4" />
                            Apply Improved Script to Generator
                          </button>
                        </Section>
                      </motion.div>
                    )}
                  </motion.div>
                ) : activeTab === 'workflow' && state.workflow ? (
                  <motion.div 
                    key="workflow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    <Section title="Recommended Software Stack" isDarkMode={state.isDarkMode}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SoftwareCard label="Voice Generation" name={state.workflow.software.voiceGen} isDarkMode={state.isDarkMode} />
                        <SoftwareCard label="Image Generation" name={state.workflow.software.imageGen} isDarkMode={state.isDarkMode} />
                        <SoftwareCard label="Video Generation" name={state.workflow.software.videoGen} isDarkMode={state.isDarkMode} />
                        <SoftwareCard label="Editing" name={state.workflow.software.editing} isDarkMode={state.isDarkMode} />
                      </div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <Section title="Step-by-Step Process" isDarkMode={state.isDarkMode}>
                        <div className="space-y-3">
                          {state.workflow.steps.map((step, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                setCompletedSteps(prev => 
                                  prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]
                                );
                              }}
                              className={cn(
                                "flex gap-4 p-4 border cursor-pointer transition-all group",
                                state.isDarkMode ? "border-white/10" : "border-[#141414]",
                                completedSteps.includes(i) 
                                  ? (state.isDarkMode ? "bg-emerald-500/10 opacity-60" : "bg-emerald-50/50 opacity-60") 
                                  : (state.isDarkMode ? "bg-[#0a0a0a] hover:border-emerald-500" : "bg-white hover:border-emerald-500")
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                state.isDarkMode ? "border-white/20" : "border-[#141414]",
                                completedSteps.includes(i) 
                                  ? (state.isDarkMode ? "bg-emerald-500 border-emerald-500 text-[#0a0a0a]" : "bg-[#141414] text-white") 
                                  : (state.isDarkMode ? "bg-[#0a0a0a] group-hover:border-emerald-500" : "bg-white group-hover:border-emerald-500")
                              )}>
                                {completedSteps.includes(i) && <Check className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <span className="font-mono text-[10px] uppercase opacity-30 block mb-1">Step {(i + 1).toString().padStart(2, '0')}</span>
                                <p className={cn(
                                  "text-sm",
                                  completedSteps.includes(i) && "line-through opacity-50"
                                )}>{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                      <Section title="Optimization Tips" isDarkMode={state.isDarkMode}>
                        <ul className="space-y-4">
                          {state.workflow.optimizationTips.map((tip, i) => (
                            <li key={i} className={cn(
                              "flex items-start gap-3 p-4 border text-sm transition-colors",
                              state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-gray-200"
                            )}>
                              <Zap className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    </div>
                  </motion.div>
                ) : activeTab === 'history' ? (
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
                      <h2 className="text-4xl font-bold tracking-tighter uppercase">Search History</h2>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                          <input 
                            type="text"
                            placeholder="Filter history..."
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-2 font-mono text-xs focus:outline-none border",
                              state.isDarkMode ? "bg-[#0a0a0a] border-white/10 text-white focus:border-emerald-500" : "bg-gray-50 border-[#141414] text-[#141414]"
                            )}
                          />
                        </div>
                        <button 
                          onClick={clearHistory}
                          className="text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 whitespace-nowrap"
                        >
                          <X className="w-3 h-3" />
                          Clear All
                        </button>
                      </div>
                    </div>

                    {state.history.filter(item => item.query.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                      <div className="py-24 text-center opacity-40">
                        <Clock className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-mono text-sm uppercase tracking-widest">
                          {state.history.length === 0 ? 'No recent searches found' : 'No matches for your filter'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {state.history
                          .filter(item => item.query.toLowerCase().includes(historySearch.toLowerCase()))
                          .map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => loadFromHistory(item)}
                            className={cn(
                              "p-6 border transition-all cursor-pointer group flex items-center justify-between",
                              state.isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:bg-white/5" : "bg-white border-[#141414] hover:bg-gray-50"
                            )}
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-lg uppercase tracking-tight">{item.query}</p>
                              <p className="font-mono text-[10px] opacity-40">
                                {new Date(item.timestamp).toLocaleString()} • {item.analysis.trendingTopics.length} trends found
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
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
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300",
        state.isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#E4E3E0] border-[#141414]"
      )}>
        <div className="grid grid-cols-5 h-16">
          <MobileNavButton 
            active={activeTab === 'trends'} 
            onClick={() => setActiveTab('trends')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Trends"
            isDarkMode={state.isDarkMode}
          />
          <MobileNavButton 
            active={activeTab === 'generator'} 
            onClick={() => setActiveTab('generator')}
            disabled={!state.contentIdea}
            icon={<Wand2 className="w-5 h-5" />}
            label="Gen"
            isDarkMode={state.isDarkMode}
          />
          <MobileNavButton 
            active={activeTab === 'critique'} 
            onClick={() => setActiveTab('critique')}
            disabled={!state.contentIdea}
            icon={<BarChart className="w-5 h-5" />}
            label="Roast"
            isDarkMode={state.isDarkMode}
          />
          <MobileNavButton 
            active={activeTab === 'workflow'} 
            onClick={() => setActiveTab('workflow')}
            disabled={!state.workflow}
            icon={<Settings className="w-5 h-5" />}
            label="Work"
            isDarkMode={state.isDarkMode}
          />
          <MobileNavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History className="w-5 h-5" />}
            label="Hist"
            isDarkMode={state.isDarkMode}
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
                  ? "bg-[#1a1a1a] text-white border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]" 
                  : "bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/20 shadow-[4px_4px_0px_0px_rgba(228,227,224,0.2)]",
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

function TabButton({ active, onClick, icon, label, disabled = false, isDarkMode }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, isDarkMode: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all border",
        active 
          ? (isDarkMode ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500" : "bg-[#141414] text-[#E4E3E0] border-[#141414]") 
          : (isDarkMode ? "text-white/60 border-transparent hover:bg-white/5" : "text-[#141414] border-transparent hover:bg-black/5"),
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label, disabled = false, isDarkMode }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, isDarkMode: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all",
        active 
          ? (isDarkMode ? "text-emerald-500" : "text-[#141414]") 
          : (isDarkMode ? "text-white/40" : "text-[#141414]/40"),
        disabled && "opacity-10 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="text-[10px] font-mono uppercase font-bold">{label}</span>
    </button>
  );
}

function Section({ title, children, icon, isDarkMode }: { title: string, children: React.ReactNode, icon?: React.ReactNode, isDarkMode?: boolean }) {
  return (
    <div className="space-y-4">
      <div className={cn(
        "flex items-center gap-2 border-b pb-2 mb-4",
        isDarkMode ? "border-white/10" : "border-[#141414]"
      )}>
        {icon}
        <h3 className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div className="px-1 md:px-0">
        {children}
      </div>
    </div>
  );
}

function TrendCard({ title, velocity, growth, featured, onAction, isDarkMode }: { title: string, velocity?: number, growth?: string, featured?: boolean, onAction: () => void, isDarkMode: boolean }) {
  return (
    <div 
      className={cn(
        "group p-3 md:p-4 border transition-all cursor-pointer flex justify-between items-center",
        isDarkMode ? "border-white/10" : "border-[#141414]",
        featured 
          ? (isDarkMode ? "bg-emerald-500 text-[#0a0a0a] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)] py-4 md:py-6" : "bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] py-4 md:py-6")
          : (isDarkMode ? "bg-[#1a1a1a] hover:bg-emerald-500 hover:text-[#0a0a0a]" : "bg-white hover:bg-[#141414] hover:text-[#E4E3E0]")
      )}
      onClick={onAction}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={cn(
          "flex flex-col items-center justify-center w-8 h-8 md:w-10 md:h-10 border border-current",
          featured ? "opacity-100" : "opacity-20 group-hover:opacity-100"
        )}>
          {growth === 'exploding' ? <ArrowUpRight className={cn("w-4 h-4 md:w-5 md:h-5", !featured && !isDarkMode && "text-red-500")} /> : 
           growth === 'declining' ? <ArrowDownRight className={cn("w-4 h-4 md:w-5 md:h-5", !featured && !isDarkMode && "text-gray-400")} /> : 
           <Minus className="w-4 h-4 md:w-5 md:h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-bold block leading-tight", featured ? "text-base md:text-lg" : "text-xs md:text-sm")}>{title}</span>
            {featured && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] md:text-[8px] font-mono uppercase tracking-tighter">Featured</span>
            )}
          </div>
          {velocity !== undefined && (
            <span className={cn(
              "text-[9px] md:text-[10px] font-mono uppercase",
              featured ? "opacity-60" : "opacity-50 group-hover:opacity-80"
            )}>Velocity: {velocity}%</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {featured && (
          <div className="hidden sm:block text-right">
            <p className="text-[7px] md:text-[8px] font-mono uppercase opacity-40 mb-0.5">Growth Status</p>
            <p className={cn("text-[9px] md:text-[10px] font-mono uppercase font-bold", isDarkMode ? "text-[#0a0a0a]" : "text-red-400")}>{growth}</p>
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className={cn(
            "p-1.5 md:p-2 transition-opacity",
            featured ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
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
    <div className={cn(
      "p-4 border transition-colors",
      isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-[#141414]"
    )}>
      <p className="text-[10px] font-mono uppercase opacity-50 mb-1">{label}</p>
      <p className="text-sm font-bold">{name}</p>
    </div>
  );
}

function NicheDNARadar({ data, isDarkMode }: { data: { subject: string, value: number }[], isDarkMode: boolean }) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.5}
            animationDuration={1500}
          />
          <Tooltip 
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
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            stroke="#10b981" 
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
