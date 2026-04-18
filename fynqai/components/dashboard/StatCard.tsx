'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface StatCardProps {
    label: string;
    value: number;
    isRed?: boolean;
    prefix?: string;
}

export function StatCard({ label, value, isRed = false, prefix = "" }: StatCardProps) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.round(v));

    useEffect(() => {
        const animation = animate(count, value, { duration: 1.5, ease: [0.16, 1, 0.3, 1] });
        return animation.stop;
    }, [value, count]);

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`card-elevated p-5 md:p-8 pt-7 md:pt-10 min-h-[120px] md:min-h-[160px] flex flex-col justify-end group transition-all duration-300 ${isRed && value > 0 ? 'border-fynq-red/30 bg-fynq-red/[0.02] shadow-[0_0_24px_rgba(239,68,68,0.05)]' : ''
                }`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 bg-fynq-red rounded-bl-3xl group-hover:scale-110 transition-transform duration-500">
                {/* Placeholder for small background glyph/icon if needed */}
            </div>

            <p className="font-ui text-[11px] md:text-[12px] font-bold text-fynq-ash uppercase tracking-[0.15em] mb-3 md:mb-4">
                {label}
            </p>

            <div className="flex items-baseline">
                {prefix && <span className="font-display text-4xl text-fynq-silver font-medium mr-1">{prefix}</span>}
                <motion.h2 className={`font-display text-5xl md:text-7xl font-medium tracking-tight ${isRed && value > 0 ? 'text-fynq-red' : 'text-fynq-chalk'}`}>
                    {rounded}
                </motion.h2>
            </div>

            <div className={`mt-4 h-[1px] w-0 group-hover:w-full transition-all duration-700 ${isRed && value > 0 ? 'bg-fynq-red/20' : 'bg-fynq-steel'}`} />
        </motion.div>
    );
}
