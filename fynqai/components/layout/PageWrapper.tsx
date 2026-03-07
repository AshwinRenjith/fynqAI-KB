'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion/scroll-variants';
import { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative flex-1 p-8 md:p-12 overflow-y-auto overflow-x-hidden min-h-[calc(100vh-var(--topnav-height))]"
        >
            {/* ── Ambient Glow Fixes [design §5] ── */}
            <div className="absolute top-[-10vh] left-1/4 right-1/4 h-[40vh] bg-fynq-red/5 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fynq-steel to-transparent opacity-30" />

            {/* ── Page Content ── */}
            <div className="relative z-10 max-w-[var(--content-max)] mx-auto">
                {children}
            </div>
        </motion.div>
    );
}
