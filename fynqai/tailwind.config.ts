import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                fynq: {
                    void: 'var(--color-void)',
                    obsidian: 'var(--color-obsidian)',
                    ink: 'var(--color-ink)',
                    carbon: 'var(--color-carbon)',
                    graphite: 'var(--color-graphite)',
                    steel: 'var(--color-steel)',
                    iron: 'var(--color-iron)',
                    ash: 'var(--color-ash)',
                    fog: 'var(--color-fog)',
                    silver: 'var(--color-silver)',
                    mist: 'var(--color-mist)',
                    chalk: 'var(--color-chalk)',
                    bone: 'var(--color-bone)',
                    red: 'var(--color-red)',
                    crimson: 'var(--color-crimson)',
                    scarlet: 'var(--color-scarlet)',
                    resolved: 'var(--color-resolved)',
                    warning: 'var(--color-warning)',
                    info: 'var(--color-info)',
                },
            },
            fontFamily: {
                display: ['var(--font-display)'],
                ui: ['var(--font-ui)'],
                mono: ['var(--font-mono)'],
            },
            backgroundImage: {
                'gradient-hero': 'var(--gradient-hero)',
                'gradient-heading': 'var(--gradient-heading)',
                'gradient-subtle': 'var(--gradient-subtle)',
                'gradient-red': 'var(--gradient-red)',
                'gradient-card': 'var(--gradient-card)',
                'glow-red': 'var(--gradient-glow-red)',
                'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            },
            backgroundSize: { 'grid': '48px 48px' },
            boxShadow: {
                'card': '0 4px 24px -4px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.03)',
                'card-hover': '0 8px 32px -4px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.08)',
                'red-glow': '0 0 24px rgba(225,29,72,0.4)',
                'red-glow-lg': '0 0 48px rgba(225,29,72,0.3)',
                'focus-red': '0 0 0 3px rgba(225,29,72,0.2)',
            },
            animation: {
                'shimmer': 'shimmer 2s infinite linear',
                'pulse-red': 'pulse-red 2s ease-in-out infinite',
                'blink': 'blink 0.8s step-end infinite',
                'slide-up': 'slide-up 0.4s ease forwards',
            },
            keyframes: {
                shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
                'pulse-red': { '0%, 100%': { boxShadow: '0 0 0px rgba(225,29,72,0)' }, '50%': { boxShadow: '0 0 20px rgba(225,29,72,0.4)' } },
                blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
                'slide-up': { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
            },
        },
    },
    plugins: [],
};
export default config;
