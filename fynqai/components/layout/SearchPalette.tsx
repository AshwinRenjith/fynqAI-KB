'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, ShieldAlert, MessageSquare, X, CornerDownLeft } from 'lucide-react';
import type { Document, Contradiction, ChatSession } from '@/types/app.types';

type ResultCategory = 'documents' | 'contradictions' | 'sessions';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: ResultCategory;
    href: string;
}

const CATEGORY_META: Record<ResultCategory, { icon: typeof FileText; label: string }> = {
    documents: { icon: FileText, label: 'Documents' },
    contradictions: { icon: ShieldAlert, label: 'Contradictions' },
    sessions: { icon: MessageSquare, label: 'Chat Sessions' },
};

interface SearchPaletteProps {
    open: boolean;
    onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('');
            setResults([]);
            setActiveIndex(0);
            // Small delay so the DOM is rendered
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && open) onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    // Search on query change (debounced)
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(query.trim());
        }, 200);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const performSearch = useCallback(async (q: string) => {
        // Abort previous request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
            const [docsRes, contradictionsRes, sessionsRes] = await Promise.all([
                fetch(`/api/documents?limit=50`, { signal: controller.signal }),
                fetch(`/api/contradictions?limit=50`, { signal: controller.signal }),
                fetch(`/api/chat/sessions`, { signal: controller.signal }),
            ]);

            const matched: SearchResult[] = [];
            const lower = q.toLowerCase();

            // Documents
            if (docsRes.ok) {
                const { documents } = await docsRes.json() as { documents: Document[] };
                for (const doc of documents) {
                    if (
                        doc.name.toLowerCase().includes(lower) ||
                        doc.original_filename.toLowerCase().includes(lower) ||
                        doc.file_type.toLowerCase().includes(lower)
                    ) {
                        matched.push({
                            id: doc.id,
                            title: doc.name,
                            subtitle: `${doc.status} · ${doc.chunk_count} chunks · ${doc.file_type}`,
                            category: 'documents',
                            href: `/documents/${doc.id}`,
                        });
                    }
                }
            }

            // Contradictions
            if (contradictionsRes.ok) {
                const { contradictions } = await contradictionsRes.json() as { contradictions: Contradiction[] };
                for (const c of contradictions) {
                    const docA = c.document_a?.name ?? c.document_a_name ?? '';
                    const docB = c.document_b?.name ?? c.document_b_name ?? '';
                    if (
                        c.entity_subject.toLowerCase().includes(lower) ||
                        c.value_a.toLowerCase().includes(lower) ||
                        c.value_b.toLowerCase().includes(lower) ||
                        docA.toLowerCase().includes(lower) ||
                        docB.toLowerCase().includes(lower) ||
                        c.contradiction_type.toLowerCase().includes(lower)
                    ) {
                        matched.push({
                            id: c.id,
                            title: c.entity_subject,
                            subtitle: `${c.severity} · ${c.contradiction_type} · ${c.status}`,
                            category: 'contradictions',
                            href: `/admin/contradictions/${c.id}`,
                        });
                    }
                }
            }

            // Chat sessions
            if (sessionsRes.ok) {
                const { sessions } = await sessionsRes.json() as { sessions: ChatSession[] };
                for (const s of sessions) {
                    const title = s.title ?? 'Untitled session';
                    if (title.toLowerCase().includes(lower)) {
                        matched.push({
                            id: s.id,
                            title,
                            subtitle: new Date(s.created_at).toLocaleDateString(),
                            category: 'sessions',
                            href: `/chat/${s.id}`,
                        });
                    }
                }
            }

            if (!controller.signal.aborted) {
                setResults(matched);
                setActiveIndex(0);
            }
        } catch {
            // Ignore abort errors
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    const navigate = useCallback((result: SearchResult) => {
        onClose();
        router.push(result.href);
    }, [onClose, router]);

    // Keyboard navigation
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[activeIndex]) {
            e.preventDefault();
            navigate(results[activeIndex]);
        }
    }

    // Group results by category
    const grouped = results.reduce<Record<ResultCategory, SearchResult[]>>((acc, r) => {
        (acc[r.category] ??= []).push(r);
        return acc;
    }, {} as Record<ResultCategory, SearchResult[]>);

    let flatIndex = -1;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-fynq-void/70 backdrop-blur-sm" onClick={onClose} />

                    {/* Palette */}
                    <motion.div
                        className="relative w-full max-w-[560px] mx-4 rounded-2xl border border-fynq-steel bg-fynq-obsidian shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 px-5 h-14 border-b border-fynq-steel">
                            <Search className="w-4.5 h-4.5 text-fynq-fog shrink-0" strokeWidth={1.5} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search documents, contradictions, sessions..."
                                className="flex-1 bg-transparent text-fynq-chalk font-ui text-[14px] placeholder:text-fynq-fog/50 outline-none"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="p-1 text-fynq-fog hover:text-fynq-chalk transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Results */}
                        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                            {loading && !results.length && (
                                <div className="px-5 py-8 text-center text-fynq-fog font-ui text-[13px]">
                                    Searching...
                                </div>
                            )}

                            {!loading && query && !results.length && (
                                <div className="px-5 py-8 text-center text-fynq-fog font-ui text-[13px]">
                                    No results for &ldquo;{query}&rdquo;
                                </div>
                            )}

                            {!query && (
                                <div className="px-5 py-8 text-center text-fynq-fog/60 font-ui text-[13px]">
                                    Start typing to search your workspace
                                </div>
                            )}

                            {(Object.entries(grouped) as [ResultCategory, SearchResult[]][]).map(([cat, items]) => {
                                const meta = CATEGORY_META[cat];
                                const Icon = meta.icon;
                                return (
                                    <div key={cat}>
                                        <div className="px-5 pt-3 pb-1.5 flex items-center gap-2">
                                            <Icon className="w-3.5 h-3.5 text-fynq-fog/60" strokeWidth={1.5} />
                                            <span className="font-ui text-[11px] font-semibold text-fynq-fog/60 uppercase tracking-widest">
                                                {meta.label}
                                            </span>
                                        </div>
                                        {items.map(item => {
                                            flatIndex++;
                                            const idx = flatIndex;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => navigate(item)}
                                                    onMouseEnter={() => setActiveIndex(idx)}
                                                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                                                        idx === activeIndex
                                                            ? 'bg-fynq-graphite/60'
                                                            : 'hover:bg-fynq-graphite/30'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-ui text-[13px] font-medium text-fynq-chalk truncate">
                                                            {item.title}
                                                        </p>
                                                        <p className="font-ui text-[11px] text-fynq-fog truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                    {idx === activeIndex && (
                                                        <CornerDownLeft className="w-3.5 h-3.5 text-fynq-fog/40 shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 h-10 border-t border-fynq-steel text-fynq-fog/40">
                            <div className="flex items-center gap-3 font-ui text-[11px]">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-fynq-graphite border border-fynq-steel text-[10px] font-mono">↑↓</kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-fynq-graphite border border-fynq-steel text-[10px] font-mono">↵</kbd>
                                    open
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-fynq-graphite border border-fynq-steel text-[10px] font-mono">esc</kbd>
                                    close
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
