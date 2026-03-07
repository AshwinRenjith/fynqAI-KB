'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SearchPalette } from './SearchPalette';

interface TopNavProps {
    title: string;
    openContradictions?: number;
    workspaceName: string;
    role: 'admin' | 'member';
}

export function TopNav({ title, openContradictions = 0, workspaceName, role }: TopNavProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    const openSearch = useCallback(() => setSearchOpen(true), []);
    const closeSearch = useCallback(() => setSearchOpen(false), []);

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(prev => !prev);
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <>
        <header className="sticky top-0 right-0 h-[var(--topnav-height)] border-b border-fynq-steel bg-fynq-ink backdrop-blur-3xl z-40 flex items-center justify-between px-8 transition-all duration-500">
            {/* ── Page Title ── */}
            <h1 className="font-ui text-[18px] font-semibold text-fynq-chalk tracking-tight">{title}</h1>

            {/* ── Actions ── */}
            <div className="flex items-center gap-6">
                {/* Search Bar */}
                <button
                    onClick={openSearch}
                    className="hidden md:flex items-center h-10 w-[240px] px-4 rounded-xl border border-fynq-steel bg-white/[0.03] text-fynq-fog hover:border-fynq-iron hover:bg-white/[0.05] transition-all group cursor-pointer"
                >
                    <Search className="w-4 h-4 mr-2.5 transition-colors group-hover:text-fynq-silver" strokeWidth={1.5} />
                    <span className="font-ui text-[13px] tracking-tight flex-1 text-left">Search workspace...</span>
                    <kbd className="hidden lg:inline font-mono text-[10px] text-fynq-fog/40 border border-fynq-steel rounded px-1.5 py-0.5 bg-fynq-graphite/50">⌘K</kbd>
                </button>

                {/* Theme Switcher [Claude-inspired Light Mode] */}
                <ThemeToggle />

                {/* Notification Bell */}
                <button className="relative p-2 rounded-xl text-fynq-fog hover:text-fynq-chalk hover:bg-white/[0.05] transition-all group">
                    <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" strokeWidth={1.5} />
                    {openContradictions > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fynq-red border border-fynq-ink ring-2 ring-fynq-red/20 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    )}
                </button>

                {/* Workspace Avatar */}
                <div className="flex items-center gap-3 pl-4 border-l border-fynq-steel">
                    <div className="text-right hidden sm:block">
                        <p className="font-ui text-[12px] font-bold text-fynq-chalk tracking-tight">{workspaceName}</p>
                        <p className="font-ui text-[10px] text-fynq-red font-semibold uppercase tracking-widest">{role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl glass-panel bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-red font-display italic text-[18px] font-bold shadow-xl">
                        f
                    </div>
                </div>
            </div>
        </header>

        <SearchPalette open={searchOpen} onClose={closeSearch} />
        </>
    );
}
