import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, isDarkMode }: { className?: string, isDarkMode: boolean }) {
    return (
        <div className={cn(
            "animate-pulse rounded-sm",
            isDarkMode ? "bg-white/5" : "bg-[#141414]/10",
            className
        )} />
    );
}
