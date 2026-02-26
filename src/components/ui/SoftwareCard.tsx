import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function SoftwareCard({ label, name, isDarkMode }: { label: string, name: string, isDarkMode: boolean }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={cn(
                "p-4 border transition-colors",
                isDarkMode ? "bg-[#1a1a1a] border-white/10 hover:border-emerald-500" : "bg-white border-[#141414] hover:border-purple-600"
            )}
        >
            <p className="text-[10px] font-mono uppercase opacity-50 mb-1">{label}</p>
            <p className="text-sm font-bold">{name}</p>
        </motion.div>
    );
}
