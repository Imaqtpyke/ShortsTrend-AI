import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function MobileNavButton({ active, onClick, icon, label, disabled = false, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean, theme: any }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all relative px-4 py-1",
                active ? theme.text : "text-white/70",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {active && (
                <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-full -z-10 bg-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            {icon}
            <span className="hidden sm:block text-[10px] font-mono uppercase font-bold">{label}</span>
        </button>
    );
}
