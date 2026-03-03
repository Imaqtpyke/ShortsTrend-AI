import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../store/useAppStore';

export function FloatingScrollButton({ containerRef }: { containerRef?: React.RefObject<HTMLDivElement> }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const target = containerRef?.current || window;

        const handleScroll = () => {
            const isWindow = target === window;
            const scrollY = isWindow ? window.scrollY : (target as HTMLDivElement).scrollTop;
            const windowHeight = isWindow ? window.innerHeight : (target as HTMLDivElement).clientHeight;
            const documentHeight = isWindow ? document.documentElement.scrollHeight : (target as HTMLDivElement).scrollHeight;

            if (documentHeight > windowHeight * 1.5) {
                if (scrollY > 100) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            } else {
                setIsVisible(false);
            }

            const maxScroll = documentHeight - windowHeight;
            const scrollPercentage = maxScroll > 0 ? (scrollY / maxScroll) : 0;

            setIsAtBottom(scrollPercentage > 0.3);
        };

        target.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => target.removeEventListener('scroll', handleScroll);
    }, [containerRef]);

    const handleClick = () => {
        const target = containerRef?.current || window;
        const isWindow = target === window;

        if (isAtBottom) {
            target.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            const documentHeight = isWindow ? document.documentElement.scrollHeight : (target as HTMLDivElement).scrollHeight;
            target.scrollTo({
                top: documentHeight,
                behavior: 'smooth'
            });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={handleClick}
                    className={cn(
                        "absolute bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300",
                        theme.bg + " text-[#0a0a0a] hover:scale-110 active:scale-95"
                    )}
                    aria-label={isAtBottom ? "Scroll to top" : "Scroll to bottom"}
                >
                    {isAtBottom ? (
                        <ArrowUp className="w-6 h-6 animate-in fade-in zoom-in" />
                    ) : (
                        <ArrowDown className="w-6 h-6 animate-in fade-in zoom-in" />
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    );
}
