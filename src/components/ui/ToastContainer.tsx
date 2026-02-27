import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

const ICON_MAP = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
};

export function ToastContainer() {
    const { toasts, removeToast } = useAppStore();

    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none items-end w-[calc(100%-2rem)]"
        >
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className={cn(
                            "pointer-events-auto flex items-start gap-3 px-4 py-3 border shadow-xl max-w-[280px] sm:max-w-[320px] font-mono text-xs bg-[#1a1a1a] border-white/10 text-white"
                        )}
                    >
                        {ICON_MAP[toast.type ?? 'info']}
                        <span className="flex-1 leading-relaxed">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss notification"
                            className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
