import React from 'react';
import { cn } from '../../lib/utils';

export function TabButton({ active, onClick, icon, label, disabled = false, isDarkMode, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, isDarkMode: boolean, theme: any }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
                "flex-shrink-0 whitespace-nowrap flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all border",
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
