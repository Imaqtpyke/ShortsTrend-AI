import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';

export const TrendCard = React.memo(({ title, velocity, growth, competition, targetAudience, exampleIdea, featured, onAction }: { title: string, velocity?: number, growth?: string, competition?: 'Low' | 'Medium' | 'High', targetAudience?: string, exampleIdea?: string, featured?: boolean, onAction: () => void }) => {
    const cardTheme = (() => {
        switch (growth) {
            case 'exploding': return { primary: 'red-500', glow: 'shadow-red-500/20', text: 'text-red-400', bg: 'bg-red-500/10', ring: 'focus:ring-red-500', border: 'border-red-500/30' };
            case 'steady': return { primary: 'blue-500', glow: 'shadow-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'focus:ring-blue-500', border: 'border-blue-500/30' };
            case 'declining': return { primary: 'slate-500', glow: 'shadow-slate-500/20', text: 'text-slate-400', bg: 'bg-slate-500/10', ring: 'focus:ring-slate-500', border: 'border-slate-500/30' };
            default: return { primary: 'emerald-500', glow: 'shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'focus:ring-emerald-500', border: 'border-emerald-500/30' };
        }
    })();

    const cardBgClass = growth === 'exploding' ? 'bg-red-500/10' : growth === 'steady' ? 'bg-blue-500/10' : growth === 'declining' ? 'bg-slate-500/10' : 'bg-emerald-500/10';
    const cardBorderClass = growth === 'exploding' ? 'border-red-500/30' : growth === 'steady' ? 'border-blue-500/30' : growth === 'declining' ? 'border-slate-500/30' : 'border-emerald-500/30';
    const cardHoverBorderClass = growth === 'exploding' ? 'hover:border-red-500/50' : growth === 'steady' ? 'hover:border-blue-500/50' : growth === 'declining' ? 'hover:border-slate-500/50' : 'hover:border-emerald-500/50';

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
                cardTheme.ring,
                "border-white/10",
                featured
                    ? `bg-[#1a1a1a] shadow-2xl ${cardTheme.glow} ${cardBorderClass}`
                    : `bg-[#0a0a0a] ${cardHoverBorderClass}`
            )}
            onClick={onAction}
        >
            {/* Background Accent for Featured */}
            {featured && (
                <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 blur-3xl opacity-20 rounded-full transition-opacity group-hover:opacity-40", cardTheme.bg)} />
            )}

            <div className="flex justify-between items-start relative z-10">
                <div className={cn(
                    "flex items-center justify-center w-9 h-9 border border-current flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3",
                    featured ? "opacity-100" : "opacity-40 group-hover:opacity-100",
                    cardTheme.text
                )}>
                    {growth === 'exploding' ? <ArrowUpRight className="w-4 h-4" /> :
                        growth === 'declining' ? <ArrowDownRight className="w-4 h-4" /> :
                            <Minus className="w-4 h-4" />}
                </div>

                {featured && (
                    <span className={cn(
                        "px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-[0.2em] font-bold",
                        cardTheme.primary === 'red-500' ? 'bg-red-500 text-[#0a0a0a]' :
                        cardTheme.primary === 'blue-500' ? 'bg-blue-500 text-[#0a0a0a]' :
                        cardTheme.primary === 'slate-500' ? 'bg-slate-500 text-[#0a0a0a]' :
                        'bg-emerald-500 text-[#0a0a0a]'
                    )}>Featured</span>
                )}
            </div>

            <div className="space-y-3 relative z-10">
                <h4 className={cn(
                    "font-bold leading-[1.2] tracking-tight break-words",
                    featured ? "text-base md:text-lg" : "text-xs md:text-sm",
                    "text-white"
                )}>
                    {title}
                </h4>

                {competition && targetAudience && exampleIdea && (
                    <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-1.5 py-0.5 text-[8px] font-mono uppercase font-bold text-black",
                                competition === 'Low' ? 'bg-emerald-500' : competition === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                            )}>
                                {competition} Competition
                            </span>
                            <span className="text-[10px] text-white/60 font-mono truncate" title={targetAudience}>
                                🎯 {targetAudience}
                            </span>
                        </div>
                        <p className="text-[11px] text-white/80 italic leading-snug line-clamp-2" title={exampleIdea}>
                            "{exampleIdea}"
                        </p>
                    </div>
                )}

                <div className="flex items-end justify-between gap-2 pt-2 border-t border-current/10">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-mono uppercase opacity-50 mb-0.5">Velocity</span>
                        <span className="text-xs font-mono font-bold">{velocity}%</span>
                    </div>

                    <div className="flex flex-col text-right">
                        <span className="text-[8px] font-mono uppercase opacity-50 mb-0.5">Growth</span>
                        <span className={cn(
                            "text-[10px] font-mono font-bold uppercase tracking-wider",
                            cardTheme.text
                        )}>{growth}</span>
                    </div>
                </div>
            </div>

            {/* Hover Action Button */}
            <div className={cn(
                "absolute bottom-3 right-3 transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border shadow-lg",
                cardTheme.primary === 'red-500' ? 'bg-red-500 text-[#0a0a0a] border-red-500' :
                cardTheme.primary === 'blue-500' ? 'bg-blue-500 text-[#0a0a0a] border-blue-500' :
                cardTheme.primary === 'slate-500' ? 'bg-slate-500 text-[#0a0a0a] border-slate-500' :
                'bg-emerald-500 text-[#0a0a0a] border-emerald-500'
            )}>
                <span>Generate Script</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </div>
    );
});
