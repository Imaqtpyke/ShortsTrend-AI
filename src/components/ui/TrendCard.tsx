import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';

export function TrendCard({ title, velocity, growth, featured, onAction, isDarkMode }: { title: string, velocity?: number, growth?: string, featured?: boolean, onAction: () => void, isDarkMode: boolean }) {
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
