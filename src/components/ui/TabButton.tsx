import React from 'react';
import { cn } from '../../lib/utils';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    theme: {
        primary: string;
        bg: string;
        hoverBg: string;
        text: string;
        shadowAccent: string;
    };
}

export function TabButton({ active, onClick, icon, label, disabled = false, theme }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
                "flex-shrink-0 whitespace-nowrap flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all border",
                active
                    ? "text-[#0a0a0a]"
                    : "text-white/60 border-transparent hover:bg-white/5",
                disabled && "opacity-30 cursor-not-allowed"
            )}
            style={active ? {
                backgroundColor: theme.primary,
                borderColor: theme.primary
            } : undefined}
        >
            {icon}
            {label}
        </button>
    );
}
