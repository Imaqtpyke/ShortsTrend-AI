import React from 'react';
import { motion } from 'motion/react';
import { Settings, ArrowLeft, Zap, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Section } from '../ui/Section';
import { SoftwareCard } from '../ui/SoftwareCard';
import { useAppStore, useTheme } from '../../store/useAppStore';



export function WorkflowView() {
    const {
        isDarkMode,
        workflow,
        setActiveTab,
        completedSteps,
        setCompletedSteps
    } = useAppStore();
    const theme = useTheme();

    if (!workflow) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className={cn(
                    "w-20 h-20 border flex items-center justify-center rounded-full mb-4",
                    isDarkMode ? "border-white/10 text-white/20" : "border-[#141414]/10 text-[#141414]/20"
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
                        "w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all shadow-lg active:translate-y-1 active:shadow-none focus-ring",
                        isDarkMode ? `${theme.bg} text-[#0a0a0a] ${theme.hoverBg}` : "bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]"
                    )}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go to Trends
                </button>
            </div>
        );
    }

    return (
        <motion.div
            key="workflow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 md:space-y-12"
        >
            <Section title="Recommended Software Stack" isDarkMode={isDarkMode}>
                <motion.div
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                    initial="hidden" animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <SoftwareCard label="Voice Generation" name={workflow.software.voiceGen} isDarkMode={isDarkMode} />
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <SoftwareCard label="Image Generation" name={workflow.software.imageGen} isDarkMode={isDarkMode} />
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <SoftwareCard label="Video Generation" name={workflow.software.videoGen} isDarkMode={isDarkMode} />
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <SoftwareCard label="Editing" name={workflow.software.editing} isDarkMode={isDarkMode} />
                    </motion.div>
                </motion.div>
            </Section>

            <div className="space-y-6 md:space-y-12">
                <Section title="Step-by-Step Process" isDarkMode={isDarkMode} collapsible defaultCollapsed>
                    <motion.div
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden" animate="show"
                        className="space-y-3"
                    >
                        {workflow.steps.map((step, i) => (
                            <motion.div
                                key={i}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setCompletedSteps(
                                            completedSteps.includes(i) ? completedSteps.filter(s => s !== i) : [...completedSteps, i]
                                        );
                                    }
                                }}
                                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                                onClick={() => {
                                    setCompletedSteps(
                                        completedSteps.includes(i) ? completedSteps.filter(s => s !== i) : [...completedSteps, i]
                                    );
                                }}
                                className={cn(
                                    "flex gap-4 p-4 border cursor-pointer transition-all group focus:outline-none focus:ring-2",
                                    theme.ring,
                                    isDarkMode ? "border-white/10" : "border-[#141414]",
                                    completedSteps.includes(i)
                                        ? (isDarkMode ? `${theme.bgAccent} opacity-60` : "bg-emerald-50/50 opacity-60")
                                        : (isDarkMode ? `bg-[#0a0a0a] ${theme.hoverBorder}` : "bg-white hover:border-emerald-500")
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 border flex items-center justify-center flex-shrink-0 transition-colors",
                                    isDarkMode ? "border-white/20" : "border-[#141414]",
                                    completedSteps.includes(i)
                                        ? (isDarkMode ? `${theme.bg} ${theme.border} text-[#0a0a0a]` : "bg-[#141414] text-white")
                                        : (isDarkMode ? `bg-[#0a0a0a] group-hover:${theme.border}` : "bg-white group-hover:border-emerald-500")
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
                <Section title="Optimization Tips" isDarkMode={isDarkMode} collapsible defaultCollapsed>
                    <motion.ul
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden" animate="show"
                        className="space-y-4"
                    >
                        {workflow.optimizationTips.map((tip, i) => (
                            <motion.li key={i} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className={cn(
                                "flex items-start gap-3 p-4 border text-sm transition-colors",
                                isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-gray-50 border-gray-200"
                            )}>
                                <Zap className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                                <span>{tip}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </Section>
            </div>
        </motion.div>
    );
}
