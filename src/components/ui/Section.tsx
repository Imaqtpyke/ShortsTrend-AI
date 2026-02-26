import React from 'react';
import { cn } from '../../lib/utils';

export function Section({ title, children, icon, isDarkMode }: { title: string, children: React.ReactNode, icon?: React.ReactNode, isDarkMode?: boolean }) {
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
