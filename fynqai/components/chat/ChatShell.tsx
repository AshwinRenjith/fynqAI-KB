'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Plus, MessageSquare, ShieldAlert, Send, Trash2, PanelLeftOpen, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import 'katex/dist/katex.min.css';

import { useChatSessions, useSessionMessages, useCreateSession, useDeleteSession } from '@/hooks/use-fynq-api';
import type { ChatMessage, Citation, ChatSession } from '@/types/app.types';
import { fadeUp } from '@/lib/motion/scroll-variants';
import { CitationChip } from '@/components/chat/CitationChip';
import { CitationPanel } from '@/components/chat/CitationPanel';

interface ChatShellProps {
    sessionId?: string;
    workspaceId: string;
    initialMessages: ChatMessage[];
}

const CITATION_PREFIX = 'citation:';

function normalizeCitationMarkers(content: string): string {
    return content
        .replace(/\[(?:SOURCE|REF)\s+(\d+)\]/gi, (_match, idx: string) => {
            return `[SOURCE ${idx}](${CITATION_PREFIX}${idx})`;
        })
        .replace(/\[(\d+)\]/g, (_match, idx: string) => {
            return `[SOURCE ${idx}](${CITATION_PREFIX}${idx})`;
        })
        .replace(/\bREF\s+(\d+)\b/gi, (_match, idx: string) => {
            return `[SOURCE ${idx}](${CITATION_PREFIX}${idx})`;
        })
        .replace(/\bSOURCE\s+(\d+)\b/gi, (_match, idx: string) => {
            return `[SOURCE ${idx}](${CITATION_PREFIX}${idx})`;
        });
}

function childrenToText(children: ReactNode): string {
    if (typeof children === 'string' || typeof children === 'number') {
        return String(children);
    }
    if (Array.isArray(children)) {
        return children.map(childrenToText).join('');
    }
    return '';
}

function getCitationIndexFromLink(href: string | undefined, children: ReactNode): number | null {
    const text = childrenToText(children);
    const candidates = [href ?? '', text];

    for (const candidate of candidates) {
        const normalized = decodeURIComponent(candidate);
        const match = normalized.match(/(?:citation:|source\s*#?\s*|ref\s*#?\s*|\[)(\d+)/i);
        if (match) {
            const parsed = Number(match[1]);
            if (Number.isFinite(parsed) && parsed > 0) {
                return parsed;
            }
        }
    }

    return null;
}

export function ChatShell({ sessionId: initialSessionId, workspaceId, initialMessages }: ChatShellProps) {
    const endRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [query, setQuery] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
    const [chatSidebarOpen, setChatSidebarOpen] = useState(false);

    const { data: sessions } = useChatSessions();
    const { data: savedMessages } = useSessionMessages(currentSessionId);
    const createSessionMutation = useCreateSession();
    const deleteSessionMutation = useDeleteSession();

    useEffect(() => {
        if (!currentSessionId) {
            return;
        }

        setMessages(savedMessages ?? []);
    }, [savedMessages, currentSessionId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, streamedText]);

    const onAsk = async () => {
        if (!query.trim() || streaming) return;
        const text = query.trim();
        setQuery('');
        setStreaming(true);
        setStreamedText('');

        // 1. Create session if it doesn't exist
        let sessId = currentSessionId;
        if (!sessId) {
            const { session } = await createSessionMutation.mutateAsync(text.slice(0, 40));
            sessId = session.id;
            setCurrentSessionId(sessId);
        }

        // 2. Add optimistic user message
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            session_id: sessId as string,
            role: 'user',
            content: text,
            citations: [],
            had_contradiction: false,
            contradiction_ids: [],
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);

        // 3. Initiate Stream
        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, session_id: sessId, workspace_id: workspaceId })
            });

            if (!response.ok || !response.body) {
                let details = `HTTP ${response.status}`;
                try {
                    const payload = await response.json();
                    if (payload?.error) {
                        details = `${details}: ${payload.error}`;
                    }
                } catch {
                    // Ignore parse failures and keep status-only detail.
                }
                throw new Error(`Stream failed (${details})`);
            }

            const reader = response.body.getReader();
            const textDecoder = new TextDecoder();
            let buffer = '';
            let fullAssistantContent = '';
            let finalCitations: Citation[] = [];
            const hadContradiction = false;
            const contradictionIds: string[] = [];

            const handlePayload = (rawPayload: string) => {
                const data = JSON.parse(rawPayload) as {
                    type: string;
                    content?: string;
                    citations?: Citation[];
                    had_contradiction?: boolean;
                    contradiction_ids?: string[];
                };

                if (data.type === 'token') {
                    fullAssistantContent += data.content ?? '';
                    setStreamedText(fullAssistantContent);
                    return;
                }

                if (data.type === 'citations') {
                    finalCitations = data.citations ?? [];
                    return;
                }

                if (data.type === 'done') {
                    const aiMsg: ChatMessage = {
                        id: crypto.randomUUID(),
                        session_id: sessId as string,
                        role: 'assistant',
                        content: fullAssistantContent,
                        citations: finalCitations,
                        had_contradiction: data.had_contradiction ?? hadContradiction,
                        contradiction_ids: data.contradiction_ids ?? contradictionIds,
                        created_at: new Date().toISOString(),
                    };

                    setMessages(prev => [...prev, aiMsg]);
                    setStreamedText('');
                    setStreaming(false);
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += textDecoder.decode(value, { stream: true });
                const frames = buffer.split('\n\n');
                buffer = frames.pop() ?? '';

                for (const frame of frames) {
                    const lines = frame
                        .split('\n')
                        .filter((line) => line.startsWith('data: '));

                    for (const line of lines) {
                        try {
                            handlePayload(line.slice(6));
                        } catch (e) {
                            console.error("Payload parse error:", e);
                        }
                    }
                }
            }

            if (buffer.trim().startsWith('data: ')) {
                try {
                    handlePayload(buffer.trim().slice(6));
                } catch (e) {
                    console.error('Trailing payload parse error:', e);
                }
            }
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Unknown error while sending message';
            const aiErrMsg: ChatMessage = {
                id: crypto.randomUUID(),
                session_id: sessId as string,
                role: 'assistant',
                content: `I couldn't complete this request. ${message}`,
                citations: [],
                had_contradiction: false,
                contradiction_ids: [],
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiErrMsg]);
            setStreaming(false);
            setStreamedText('');
        }
    };

    const renderMarkdown = (content: string, citations: Citation[]) => {
        const markdown = normalizeCitationMarkers(content);

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    a: ({ href, children, ...props }) => {
                        const citationIndex = getCitationIndexFromLink(href, children);

                        if (citationIndex !== null) {
                            const index = citationIndex;
                            const citation = citations.find((item) => item.index === index);

                            if (citation) {
                                return (
                                    <CitationChip
                                        citation={citation}
                                        onClick={setActiveCitation}
                                    />
                                );
                            }

                            return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-fynq-steel text-[10px] font-bold text-fynq-ash mx-0.5 align-top">
                                    {children}
                                </span>
                            );
                        }

                        return (
                            <a
                                {...props}
                                href={href}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-fynq-mist underline decoration-fynq-red/40 hover:decoration-fynq-red"
                            >
                                {children}
                            </a>
                        );
                    },
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 md:pl-6 mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 md:pl-6 mb-3 space-y-1">{children}</ol>,
                    pre: ({ children }) => (
                        <pre className="whitespace-pre-wrap rounded-xl p-3 bg-fynq-ink border border-fynq-steel text-[12px] md:text-[13px] leading-relaxed mb-3 overflow-x-auto">
                            {children}
                        </pre>
                    ),
                    code: ({ children }) => (
                        <code className="px-1 py-0.5 rounded bg-fynq-ink border border-fynq-steel text-[0.9em]">
                            {children}
                        </code>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-fynq-red/60 pl-3 md:pl-4 italic text-fynq-fog mb-3">
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {markdown}
            </ReactMarkdown>
        );
    };

    const sessionSidebarContent = (
        <>
            <div className="p-4 border-b border-fynq-steel flex items-center justify-between">
                <button
                    onClick={() => {
                        setCurrentSessionId(undefined);
                        setMessages([]);
                        setChatSidebarOpen(false);
                    }}
                    className="flex-1 h-11 flex items-center justify-center gap-2 bg-white/[0.03] border border-fynq-steel rounded-xl text-fynq-chalk font-ui text-[13px] font-bold tracking-tight hover:border-fynq-red transition-all group shadow-xl">
                    <Plus className="w-4 h-4 text-fynq-red group-hover:scale-125 transition-transform" />
                    <span>New Chat</span>
                </button>
                {/* Close — mobile only */}
                <button
                    onClick={() => setChatSidebarOpen(false)}
                    className="lg:hidden ml-3 p-2 rounded-xl text-fynq-fog hover:text-fynq-pure hover:bg-white/[0.05] transition-all"
                    aria-label="Close sessions"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
                <p className="px-2 mb-3 text-[11px] font-bold text-fynq-ash uppercase tracking-widest">Recent Sessions</p>
                {sessions?.map((sess: ChatSession) => (
                    <div
                        key={sess.id}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-xl transition-all font-ui text-[13px] group ${currentSessionId === sess.id ? 'bg-fynq-graphite text-fynq-pure border border-white/[0.05] shadow-lg shadow-black/40' : 'text-fynq-ash hover:text-fynq-mist hover:bg-white/[0.02]'}`}
                    >
                        <button
                            onClick={() => {
                                setCurrentSessionId(sess.id);
                                setChatSidebarOpen(false);
                            }}
                            className="min-w-0 flex-1 flex items-center gap-3 px-1 py-1.5 text-left"
                        >
                            <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${currentSessionId === sess.id ? 'text-fynq-red' : 'text-fynq-ash group-hover:text-fynq-red'}`} strokeWidth={1.5} />
                            <span className="truncate tracking-tight">{sess.title}</span>
                        </button>
                        <button
                            type="button"
                            aria-label={`Delete session ${sess.title ?? sess.id}`}
                            onClick={async (event) => {
                                event.stopPropagation();
                                try {
                                    await deleteSessionMutation.mutateAsync(sess.id);
                                    if (currentSessionId === sess.id) {
                                        setCurrentSessionId(undefined);
                                        setMessages([]);
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            }}
                            disabled={deleteSessionMutation.isPending}
                            className="shrink-0 p-2 rounded-lg border border-transparent text-fynq-ash/70 hover:text-fynq-red hover:border-fynq-red/40 transition-all disabled:opacity-40"
                        >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.9} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="flex w-full h-[calc(100vh-var(--topnav-height))] overflow-hidden bg-fynq-void relative text-fynq-chalk">

            {/* ── Desktop Inner Chat Sidebar (200px) ── */}
            <div className="hidden lg:flex w-[200px] flex-col border-r border-fynq-steel bg-fynq-ink backdrop-blur-3xl shrink-0">
                {sessionSidebarContent}
            </div>

            {/* ── Mobile Chat Sidebar Overlay ── */}
            <AnimatePresence>
                {chatSidebarOpen && (
                    <>
                        <motion.div
                            key="chat-sidebar-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 bg-fynq-void/70 backdrop-blur-sm z-[80]"
                            onClick={() => setChatSidebarOpen(false)}
                        />
                        <motion.div
                            key="chat-sidebar-drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] max-w-[80vw] bg-fynq-ink border-r border-fynq-steel flex flex-col z-[90] shadow-2xl"
                        >
                            {sessionSidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Chat Area ── */}
            <div className="flex-1 flex flex-col items-center relative overflow-hidden min-w-0">
                {/* Mobile session toggle */}
                <div className="lg:hidden w-full flex items-center gap-2 px-4 py-2 border-b border-fynq-steel bg-fynq-ink/50 backdrop-blur-xl shrink-0">
                    <button
                        onClick={() => setChatSidebarOpen(true)}
                        className="p-2 rounded-xl text-fynq-fog hover:text-fynq-pure hover:bg-white/[0.05] transition-all"
                        aria-label="Open sessions"
                    >
                        <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <span className="font-ui text-[12px] text-fynq-ash uppercase tracking-widest font-bold truncate">
                        {currentSessionId ? 'Chat Session' : 'New Chat'}
                    </span>
                </div>

                <div className="flex-1 w-full overflow-y-auto custom-scrollbar px-4 md:px-12 pt-6 md:pt-12">
                    <div className="max-w-[var(--chat-max)] mx-auto space-y-6 md:space-y-10 pb-32">

                        {messages.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center justify-center py-12 md:py-20">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl glass-panel flex items-center justify-center mb-6 md:mb-8 border-fynq-steel shadow-2xl relative">
                                    <span className="font-display italic text-3xl md:text-4xl text-fynq-red font-bold">f</span>
                                    <div className="absolute inset-0 bg-fynq-red/5 blur-2xl rounded-full" />
                                </div>
                                <h2 className="font-ui text-xl md:text-2xl font-bold text-fynq-pure tracking-tight mb-2">Knowledge Verification Hub</h2>
                                <p className="font-ui text-fynq-fog text-[13px] md:text-[15px] max-w-[340px] md:max-w-[400px] leading-relaxed italic">
                                    Ask fynqAI about your synced documentation. I will provide verified answers with precise citations.
                                </p>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="max-w-[95%] md:max-w-[90%]">
                                        {message.role === 'user' ? (
                                            <div className="bg-fynq-carbon border border-fynq-steel rounded-2xl rounded-tr-sm px-4 md:px-6 py-3 md:py-4 text-fynq-chalk font-ui text-[14px] md:text-[15px] leading-relaxed shadow-xl backdrop-blur-xl">
                                                {message.content}
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 md:gap-6 items-start">
                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-fynq-red flex items-center justify-center shrink-0 mt-1 shadow-fynq-red/30 shadow-[0_0_12px]">
                                                    <span className="text-white font-display italic font-bold text-[12px] md:text-[14px]">f</span>
                                                </div>
                                                <div className="space-y-4 flex-1 min-w-0">
                                                    {message.had_contradiction && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                                                            animate={{ opacity: 1, scaleY: 1 }}
                                                            className="card-contradiction p-3 md:p-5 mb-2 flex items-start gap-3 md:gap-4 animate-progress-pulse"
                                                        >
                                                            <ShieldAlert className="w-5 h-5 text-fynq-red shrink-0 mt-0.5" strokeWidth={2.5} />
                                                            <div>
                                                                <div className="badge-critical mb-2">⚠ Conflict Detected</div>
                                                                <p className="font-ui text-[12px] md:text-[13.5px] text-fynq-chalk leading-relaxed tracking-tight">
                                                                    Contradictory information found across your audit scope. I have merged both sources below for manual verification.
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    <div className="text-fynq-mist font-ui text-[14px] md:text-[16px] leading-relaxed py-1">
                                                        {renderMarkdown(message.content, message.citations)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {streamedText && (
                                <motion.div
                                    className="flex items-start gap-3 md:gap-6 max-w-[95%] md:max-w-[90%]"
                                >
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-fynq-red animate-pulse flex items-center justify-center shrink-0 mt-1 shadow-fynq-red/30 shadow-[0_0_12px]">
                                        <span className="text-white font-display italic font-bold text-[12px] md:text-[14px]">f</span>
                                    </div>
                                    <div className="text-fynq-mist font-ui text-[14px] md:text-[16px] leading-relaxed py-1 streaming-cursor min-w-0">
                                        {renderMarkdown(streamedText, [])}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={endRef} />
                    </div>
                </div>

                {/* ── Input Area ── */}
                <div className="w-full bg-gradient-to-t from-fynq-void via-fynq-void/90 to-transparent pt-6 md:pt-12 pb-6 md:pb-10 px-4 md:px-12 flex justify-center sticky bottom-0 z-20">
                    <div className="w-full max-w-[var(--chat-max)] relative">
                        <textarea
                            className="input-base w-full pr-14 py-3 md:py-4 resize-none h-12 md:h-14 min-h-[48px] md:min-h-[56px] max-h-32 transition-all leading-relaxed whitespace-pre-wrap overflow-hidden text-[14px] md:text-base"
                            placeholder="Ask fynqAI anything..."
                            rows={1}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAsk(); }
                            }}
                            disabled={streaming}
                        />
                        <button
                            onClick={onAsk}
                            disabled={streaming || !query.trim()}
                            className="absolute right-2 top-1.5 md:top-2 p-2 md:p-2.5 rounded-xl bg-fynq-red text-white hover:bg-fynq-crimson transition-all disabled:opacity-20 disabled:grayscale shadow-xl shadow-fynq-red/20 active:scale-95 group"
                        >
                            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                        </button>
                        <p className="text-center mt-3 md:mt-4 font-ui text-[10px] md:text-[11px] font-bold text-fynq-ash uppercase tracking-[0.15em] opacity-40">
                            fynqAI generates answers from your verified documents only.
                        </p>
                    </div>
                </div>

                <CitationPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
            </div>
        </div>
    );
}
