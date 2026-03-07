'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, UploadCloud, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadDocument, useIngestStatus } from '@/hooks/use-fynq-api';

interface UploadZoneProps {
    onUploadComplete?: (docId: string) => void;
}

const statusProgress: Record<string, number> = {
    idle: 0,
    uploading: 10,
    processing: 30,
    chunking: 50,
    embedding: 75,
    scanning: 90,
    ready: 100,
    error: 0,
};

type ProcessingStage = keyof typeof statusProgress;

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
    const [dragging, setDragging] = useState(false);
    const [localStage, setLocalStage] = useState<ProcessingStage>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [localErrorHeader, setLocalErrorHeader] = useState<string | null>(null);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);

    const uploadMutation = useUploadDocument();
    const { data: statusData } = useIngestStatus(activeDocId || undefined);

    const stage = (statusData?.status as ProcessingStage | undefined) ?? localStage;
    const errorHeader = useMemo(
        () => statusData?.error_message || localErrorHeader || null,
        [statusData?.error_message, localErrorHeader]
    );

    useEffect(() => {
        if (statusData?.status === 'ready' && activeDocId) {
            onUploadComplete?.(activeDocId);
        }
    }, [statusData?.status, activeDocId, onUploadComplete]);

    async function onFileInput(file: File | undefined) {
        if (!file) return;
        setFileName(file.name);
        setLocalStage('uploading');
        setLocalErrorHeader(null);

        try {
            const result = await uploadMutation.mutateAsync(file);
            setActiveDocId(result.id);
        } catch (e) {
            setLocalStage('error');
            setLocalErrorHeader(e instanceof Error ? e.message : 'Upload failed');
        }
    }

    return (
        <div className="relative w-full h-full min-h-[300px]">
            <label
                className={`relative flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden ${dragging
                    ? 'border-fynq-red bg-fynq-red/[0.03] scale-[0.99] shadow-[0_0_32px_rgba(239,68,68,0.1)]'
                    : 'border-fynq-steel bg-fynq-ink hover:border-fynq-iron hover:bg-white/[0.02]'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => { setDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void onFileInput(e.dataTransfer.files?.[0]);
                }}
            >
                <div className="absolute inset-0 bg-fynq-red/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <AnimatePresence mode="wait">
                    {stage === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center text-center px-10"
                        >
                            <div className="w-16 h-16 rounded-3xl bg-fynq-steel border border-fynq-iron flex items-center justify-center mb-8 shadow-xl transition-transform hover:rotate-12">
                                <UploadCloud className="w-8 h-8 text-fynq-red" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-ui text-xl font-bold text-fynq-chalk tracking-tight mb-2">Import Knowledge Base</h3>
                            <p className="font-ui text-[13.5px] text-fynq-fog leading-relaxed max-w-[280px]">
                                Drag and drop your regulatory documents and fynqAI will scan for contradictions.
                            </p>
                            <div className="mt-8 px-6 py-2.5 bg-fynq-red border border-fynq-crimson rounded-xl text-white font-ui text-[13px] font-bold uppercase tracking-widest shadow-xl shadow-fynq-red/20 transition-all hover:scale-105 active:scale-95">
                                Browse Local Drive
                            </div>
                        </motion.div>
                    )}

                    {stage !== 'idle' && stage !== 'ready' && stage !== 'error' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center text-center px-10 w-full"
                        >
                            <div className="relative mb-10">
                                <div className="w-20 h-20 rounded-full border border-fynq-steel animate-spin-slow flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-fynq-red animate-spin" strokeWidth={1.5} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center font-display italic text-2xl text-fynq-mist font-bold">f</div>
                            </div>

                            <h3 className="font-ui text-lg font-semibold text-fynq-pure mb-2 uppercase tracking-widest">{stage === 'uploading' ? 'Syncing...' : 'Verifying...'}</h3>
                            <p className="font-ui text-xs text-fynq-fog mb-12 italic">{fileName}</p>

                            <div className="w-full max-w-[240px] space-y-4">
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.2em] text-fynq-red">
                                    <span>{stage}</span>
                                    <span>{statusProgress[stage]}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-fynq-steel rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-fynq-red shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${statusProgress[stage]}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {stage === 'ready' && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center px-10"
                        >
                            <div className="w-20 h-20 rounded-full bg-fynq-resolved/10 border border-fynq-resolved/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                                <CheckCircle2 className="w-10 h-10 text-fynq-resolved" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-ui text-xl font-bold text-fynq-chalk tracking-tight mb-2">Knowledge Synced</h3>
                            <p className="font-ui text-[14px] text-fynq-fog leading-relaxed italic mb-10">
                                {fileName} is now active in the knowledge base.
                            </p>
                            <button onClick={() => setLocalStage('idle')} className="text-fynq-red font-ui text-[12px] font-bold uppercase tracking-widest hover:underline px-4 py-2">
                                Verify Another Document
                            </button>
                        </motion.div>
                    )}

                    {stage === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col items-center text-center px-10"
                        >
                            <div className="w-20 h-20 rounded-full bg-fynq-red/10 border border-fynq-red/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                                <ShieldAlert className="w-10 h-10 text-fynq-red" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-ui text-xl font-bold text-fynq-pure tracking-tight mb-2">Ingestion Failed</h3>
                            <p className="font-ui text-[14px] text-fynq-red/70 mb-10 italic">
                                {errorHeader || 'Network error encountered during parsing.'}
                            </p>
                            <button onClick={() => setLocalStage('idle')} className="px-8 py-3 bg-fynq-graphite border border-fynq-steel rounded-xl text-fynq-chalk font-ui text-[13px] font-bold uppercase tracking-widest hover:border-fynq-red hover:text-fynq-red transition-all">
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => void onFileInput(e.target.files?.[0])}
                    accept=".pdf,.docx,.txt,.md"
                />
            </label>
        </div>
    );
}
