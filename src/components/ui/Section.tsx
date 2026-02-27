import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SectionProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    /** If true, the section can be collapsed by clicking the header */
    collapsible?: boolean;
    /** Initial collapsed state when collapsible=true (default: false = expanded) */
    defaultCollapsed?: boolean;
}

export function Section({ title, children, icon, collapsible = false, defaultCollapsed = false }: SectionProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    return (
        <div className={cn(
            "border transition-all duration-300 bg-white/[0.02] border-white/10 backdrop-blur-sm hover:bg-white/[0.04]"
        )}>
            {/* Header — always visible, clickable when collapsible */}
            <div
                role={collapsible ? 'button' : undefined}
                tabIndex={collapsible ? 0 : undefined}
                aria-expanded={collapsible ? !collapsed : undefined}
                onClick={collapsible ? () => setCollapsed(prev => !prev) : undefined}
                onKeyDown={collapsible ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCollapsed(prev => !prev);
                    }
                } : undefined}
                className={cn(
                    "flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b transition-colors border-white/10",
                    collapsible && "cursor-pointer select-none"
                )}
            >
                {icon}
                <h3 className="font-mono text-xs md:text-sm font-bold uppercase tracking-widest truncate flex-1">{title}</h3>
                {collapsible && (
                    <motion.span
                        animate={{ rotate: collapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 opacity-40"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.span>
                )}
            </div>

            {/* Body — animated collapse */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 relative z-10">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
