import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function SoftwareCard({ label, name }: { label: string, name: string }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn(
                "p-4 border transition-all hover:shadow-md bg-[#1a1a1a] border-white/10 hover:border-emerald-500 hover:shadow-emerald-500/10"
            )}
        >
            <p className="text-[10px] font-mono uppercase opacity-50 mb-1">{label}</p>
            <p className="text-sm font-bold">{name}</p>
        </motion.div>
    );
}
