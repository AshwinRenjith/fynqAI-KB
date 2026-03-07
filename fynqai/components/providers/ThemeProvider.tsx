'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Keep first render deterministic across server and client.
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('fynq-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
        localStorage.setItem('fynq-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
