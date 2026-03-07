'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-xl glass-panel bg-white/[0.03] border border-fynq-steel flex items-center justify-center text-fynq-fog hover:text-fynq-chalk hover:border-fynq-iron transition-all group overflow-hidden"
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Sun className="w-5 h-5" strokeWidth={1.5} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Moon className="w-5 h-5" strokeWidth={1.5} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${theme === 'dark' ? 'bg-fynq-warning' : 'bg-fynq-info'
                }`} />
        </button>
    );
}
