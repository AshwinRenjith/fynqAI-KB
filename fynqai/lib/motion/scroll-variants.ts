import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const scaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.0] } },
};
export const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const revealLine: Variants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { scaleX: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};
export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] } },
};
export const countUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
