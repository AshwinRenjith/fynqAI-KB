export const easings = {
    smooth: [0.25, 0.46, 0.45, 0.94] as const,
    snap: [0.175, 0.885, 0.32, 1.275] as const,
    enter: [0.0, 0.0, 0.2, 1.0] as const,
    exit: [0.4, 0.0, 1.0, 1.0] as const,
    spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
    gentleSpring: { type: 'spring' as const, stiffness: 200, damping: 25 },
};

export const durations = {
    instant: 0.08, fast: 0.15, normal: 0.25,
    moderate: 0.35, slow: 0.5, dramatic: 0.8,
};
