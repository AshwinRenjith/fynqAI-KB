'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Unplug, RefreshCw, FolderSync } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────── */

type ConnectorStatus = 'idle' | 'authenticating' | 'syncing' | 'connected' | 'error';

export interface ConnectorConfig {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    brandColor: string;          // tailwind color token, e.g. '#4285F4'
    brandColorTw: string;        // tailwind-safe class fragment, e.g. '[#4285F4]'
    fileCount?: number;          // dummy synced file count
}

interface ConnectorCardProps {
    connector: ConnectorConfig;
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */

const STORAGE_PREFIX = 'fynq_connector_';

function loadStatus(id: string): { status: ConnectorStatus; connectedAt: string | null } {
    if (typeof window === 'undefined') return { status: 'idle', connectedAt: null };
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { status: parsed.status ?? 'idle', connectedAt: parsed.connectedAt ?? null };
        }
    } catch { /* noop */ }
    return { status: 'idle', connectedAt: null };
}

function saveStatus(id: string, status: ConnectorStatus, connectedAt: string | null) {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify({ status, connectedAt }));
    } catch { /* noop */ }
}

/* ──────────────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────────────── */

export function ConnectorCard({ connector }: ConnectorCardProps) {
    const [status, setStatus] = useState<ConnectorStatus>('idle');
    const [connectedAt, setConnectedAt] = useState<string | null>(null);
    const [syncProgress, setSyncProgress] = useState(0);
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Hydrate from localStorage
    useEffect(() => {
        const saved = loadStatus(connector.id);
        setStatus(saved.status === 'authenticating' || saved.status === 'syncing' ? 'idle' : saved.status);
        setConnectedAt(saved.connectedAt);
        if (saved.connectedAt) {
            setLastSynced(saved.connectedAt);
        }
    }, [connector.id]);

    const simulateConnect = useCallback(async () => {
        // ── Step 1: Authenticating ──
        setStatus('authenticating');
        saveStatus(connector.id, 'authenticating', null);

        await new Promise(r => setTimeout(r, 1800));

        // ── Step 2: Syncing ──
        setStatus('syncing');
        setSyncProgress(0);

        // Animate progress bar
        const totalSteps = 20;
        for (let i = 1; i <= totalSteps; i++) {
            await new Promise(r => setTimeout(r, 80));
            setSyncProgress(Math.round((i / totalSteps) * 100));
        }

        // ── Step 3: Connected ──
        const now = new Date().toISOString();
        setStatus('connected');
        setConnectedAt(now);
        setLastSynced(now);
        saveStatus(connector.id, 'connected', now);
    }, [connector.id]);

    const disconnect = useCallback(() => {
        setStatus('idle');
        setConnectedAt(null);
        setSyncProgress(0);
        saveStatus(connector.id, 'idle', null);
    }, [connector.id]);

    const resync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncProgress(0);

        const totalSteps = 15;
        for (let i = 1; i <= totalSteps; i++) {
            await new Promise(r => setTimeout(r, 60));
            setSyncProgress(Math.round((i / totalSteps) * 100));
        }

        const now = new Date().toISOString();
        setLastSynced(now);
        setConnectedAt(now);
        saveStatus(connector.id, 'connected', now);
        setSyncProgress(0);
        setIsSyncing(false);
    }, [connector.id, isSyncing]);

    const isProcessing = status === 'authenticating' || status === 'syncing';
    const fileCount = connector.fileCount ?? Math.floor(Math.random() * 40) + 12;

    return (
        <motion.div
            whileHover={!isProcessing ? { y: -3, transition: { duration: 0.2 } } : undefined}
            className={`card-elevated relative overflow-hidden transition-all duration-500 group ${
                status === 'connected'
                    ? 'border-fynq-resolved/30'
                    : isProcessing
                        ? `border-${connector.brandColorTw}/30`
                        : ''
            }`}
        >
            {/* Subtle brand glow when connected */}
            {status === 'connected' && (
                <div
                    className="absolute top-0 right-0 w-40 h-40 blur-3xl pointer-events-none rounded-full -translate-y-16 translate-x-16 opacity-10"
                    style={{ backgroundColor: connector.brandColor }}
                />
            )}

            <div className="p-5 md:p-6 space-y-5">

                {/* ── Header Row ── */}
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                        className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110"
                        style={{
                            backgroundColor: `${connector.brandColor}15`,
                            borderColor: `${connector.brandColor}30`,
                        }}
                    >
                        {connector.icon}
                    </div>

                    {/* Title + Desc */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-ui text-[15px] font-bold text-fynq-chalk tracking-tight">{connector.name}</h4>
                        <p className="font-ui text-[12px] text-fynq-fog leading-relaxed mt-0.5">{connector.description}</p>
                    </div>

                    {/* Status indicator */}
                    <div className="shrink-0 mt-1">
                        <AnimatePresence mode="wait">
                            {status === 'connected' ? (
                                <motion.div
                                    key="connected"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fynq-resolved/10 border border-fynq-resolved/25"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-fynq-resolved animate-pulse" />
                                    <span className="font-ui text-[10px] font-bold text-fynq-resolved uppercase tracking-widest">Live</span>
                                </motion.div>
                            ) : isProcessing ? (
                                <motion.div
                                    key="processing"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: connector.brandColor }} strokeWidth={2} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-fynq-steel"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-fynq-ash" />
                                    <span className="font-ui text-[10px] font-bold text-fynq-ash uppercase tracking-widest">Offline</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Progress / Syncing State ── */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 py-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-ui text-[11px] font-bold uppercase tracking-widest" style={{ color: connector.brandColor }}>
                                        {status === 'authenticating' ? 'Authenticating...' : 'Syncing files...'}
                                    </span>
                                    {status === 'syncing' && (
                                        <span className="font-mono text-[11px] font-bold" style={{ color: connector.brandColor }}>
                                            {syncProgress}%
                                        </span>
                                    )}
                                </div>

                                {status === 'authenticating' ? (
                                    /* Shimmer bar during auth */
                                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-fynq-steel">
                                        <div
                                            className="h-full w-1/3 rounded-full animate-shimmer"
                                            style={{
                                                background: `linear-gradient(90deg, transparent, ${connector.brandColor}80, transparent)`,
                                                backgroundSize: '400px 100%',
                                            }}
                                        />
                                    </div>
                                ) : (
                                    /* Progress bar during sync */
                                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-fynq-steel">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                backgroundColor: connector.brandColor,
                                                boxShadow: `0 0 12px ${connector.brandColor}50`,
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${syncProgress}%` }}
                                            transition={{ duration: 0.15 }}
                                        />
                                    </div>
                                )}

                                <p className="font-ui text-[11px] text-fynq-fog italic">
                                    {status === 'authenticating'
                                        ? 'Opening secure OAuth window...'
                                        : `Indexing workspace files into knowledge base...`
                                    }
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Connected Info ── */}
                <AnimatePresence>
                    {status === 'connected' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-4 py-2 px-3 rounded-xl bg-white/[0.02] border border-fynq-steel/50">
                                <div className="flex items-center gap-2 flex-1">
                                    <FolderSync className="w-3.5 h-3.5 text-fynq-resolved shrink-0" />
                                    <span className="font-ui text-[11px] text-fynq-mist font-medium">
                                        {fileCount} files synced
                                    </span>
                                </div>
                                <div className="h-3 w-px bg-fynq-steel" />
                                <span className="font-ui text-[10px] text-fynq-ash font-mono">
                                    {lastSynced ? new Date(lastSynced).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : '—'}
                                </span>

                                {/* Re-sync progress bar inline */}
                                {isSyncing && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fynq-steel overflow-hidden rounded-b-xl">
                                        <motion.div
                                            className="h-full"
                                            style={{ backgroundColor: connector.brandColor }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${syncProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Actions ── */}
                <div className="flex items-center gap-2">
                    {status === 'idle' || status === 'error' ? (
                        <button
                            onClick={simulateConnect}
                            className="flex-1 h-10 rounded-xl font-ui text-[12px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-xl active:scale-95"
                            style={{
                                backgroundColor: `${connector.brandColor}15`,
                                borderColor: `${connector.brandColor}35`,
                                color: connector.brandColor,
                                border: `1px solid ${connector.brandColor}35`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = connector.brandColor;
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = `${connector.brandColor}15`;
                                e.currentTarget.style.color = connector.brandColor;
                            }}
                        >
                            Connect {connector.name}
                        </button>
                    ) : status === 'connected' ? (
                        <>
                            <button
                                onClick={resync}
                                disabled={isSyncing}
                                className="flex-1 h-10 rounded-xl bg-white/[0.03] border border-fynq-steel font-ui text-[12px] font-bold text-fynq-mist flex items-center justify-center gap-2 hover:border-fynq-iron hover:bg-white/[0.06] transition-all disabled:opacity-40"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Re-sync'}
                            </button>
                            <button
                                onClick={disconnect}
                                className="h-10 px-4 rounded-xl bg-white/[0.02] border border-fynq-steel font-ui text-[12px] font-bold text-fynq-fog flex items-center justify-center gap-2 hover:border-fynq-red/40 hover:text-fynq-red hover:bg-fynq-red/5 transition-all"
                            >
                                <Unplug className="w-3.5 h-3.5" />
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            disabled
                            className="flex-1 h-10 rounded-xl border border-fynq-steel font-ui text-[12px] font-bold text-fynq-fog flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                        >
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Connecting...
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
