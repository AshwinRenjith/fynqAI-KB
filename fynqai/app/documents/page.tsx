'use client';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { UploadZone } from '@/components/documents/UploadZone';
import { ConnectorsSection } from '@/components/documents/ConnectorsSection';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, ExternalLink, Download, Search, LayoutGrid, List, Loader2, Database, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { staggerContainer, staggerItem } from '@/lib/motion/scroll-variants';
import { useDocuments, useDeleteDocument, useToggleDocumentDeprecation } from '@/hooks/use-fynq-api';
import type { Document } from '@/types/app.types';

export default function DocumentsPage() {
    const [showUpload, setShowUpload] = useState(false);
    const { data: documents, isLoading, isError } = useDocuments();
    const deleteMutation = useDeleteDocument();
    const toggleDeprecationMutation = useToggleDocumentDeprecation();

    const deleteDoc = async (id: string) => {
        if (confirm('Are you sure you want to delete this document? All associated chunks and contradictions will be removed.')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const undoDeprecation = async (doc: Document) => {
        if (confirm(`Restore \"${doc.name}\" as an active retrieval source?`)) {
            await toggleDeprecationMutation.mutateAsync({
                id: doc.id,
                isDeprecated: false,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-var(--topnav-height))] items-center justify-center">
                <Loader2 className="w-12 h-12 text-fynq-red animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-var(--topnav-height))] items-center justify-center text-fynq-red">
                <p>Failed to load documents. Please check your connection.</p>
            </div>
        );
    }

    const docs = documents || [];

    return (
        <PageWrapper>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-6 md:space-y-10 pb-20"
            >
                {/* ── Page Header ── */}
                <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 pb-4 md:pb-6 border-b border-fynq-steel">
                    <div className="space-y-2">
                        <h1 className="font-ui text-2xl md:text-4xl font-bold text-fynq-chalk tracking-tight">Governance Documents</h1>
                        <p className="font-ui text-fynq-fog text-[13px] md:text-[15px] max-w-[500px] leading-relaxed">
                            Manage, sync, and audit your knowledge base documents. fynqAI automatically scans all uploads for internal contradictions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="px-4 md:px-6 py-2.5 bg-fynq-red/10 border border-fynq-pure rounded-xl text-fynq-pure font-ui text-[12px] md:text-[13px] font-bold uppercase tracking-widest shadow-xl shadow-fynq-red/10 transition-all hover:scale-105 active:scale-95"
                        >
                            {showUpload ? 'Close Importer' : 'Upload Document'}
                        </button>
                    </div>
                </motion.div>

                {/* ── Upload Zone Toggle ── */}
                <AnimatePresence>
                    {showUpload && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <UploadZone onUploadComplete={() => setTimeout(() => setShowUpload(false), 2000)} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── External Connectors ── */}
                <motion.div variants={staggerItem}>
                    <ConnectorsSection />
                </motion.div>

                {/* ── Controls Row ── */}
                <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
                    <div className="relative flex-1 sm:max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fynq-fog" />
                        <input
                            className="w-full bg-fynq-obsidian/5 border border-fynq-steel rounded-xl h-11 pl-10 pr-4 font-ui text-[14px] text-fynq-chalk outline-none focus:border-fynq-iron transition-all placeholder:text-fynq-fog"
                            placeholder="Search by filename or content..."
                        />
                    </div>

                    <div className="hidden sm:flex items-center glass-panel rounded-xl p-1 border-fynq-steel self-start">
                        <button className="p-2 rounded-lg bg-fynq-graphite text-fynq-red shadow-inner"><List className="w-4 h-4" /></button>
                        <button className="p-2 rounded-lg text-fynq-fog hover:text-fynq-chalk"><LayoutGrid className="w-4 h-4" /></button>
                    </div>
                </motion.div>

                {/* ── Desktop Documents Table ── */}
                <motion.div variants={staggerItem} className="hidden md:block card border-fynq-steel overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full font-ui text-[13.5px]">
                            <thead>
                                <tr className="bg-fynq-obsidian/5 text-fynq-fog border-b border-fynq-steel text-[11px] font-bold uppercase tracking-[0.1em]">
                                    <th className="text-left px-6 lg:px-8 py-5">Filename</th>
                                    <th className="text-left px-6 lg:px-8 py-5">Status</th>
                                    <th className="text-left px-6 lg:px-8 py-5">Size</th>
                                    <th className="text-left px-6 lg:px-8 py-5">Units</th>
                                    <th className="text-right px-6 lg:px-8 py-5">Sync Date</th>
                                    <th className="text-center px-6 lg:px-8 py-5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-fynq-steel">
                                {docs.map((doc: Document) => (
                                    <tr key={doc.id} className="group hover:bg-fynq-obsidian/10 transition-colors">
                                        <td className="px-6 lg:px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-red group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                    <FileText className="w-5 h-5" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-fynq-pure font-semibold tracking-tight group-hover:text-fynq-red transition-colors duration-300 truncate">{doc.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-fynq-ash font-mono uppercase">KBID-{doc.id.slice(0, 4)}</span>
                                                        {doc.is_deprecated && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-fynq-red/15 text-fynq-red border border-fynq-red/40">
                                                                Deprecated
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 lg:px-8 py-5">
                                            <AnimatePresence mode="wait">
                                                {doc.status === 'ready' ? (
                                                    <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="badge-resolved lowercase first-letter:uppercase">Ready</motion.div>
                                                ) : (
                                                    <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-fynq-red font-bold text-[10px] uppercase tracking-widest">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={3} />
                                                        <span>{doc.status}</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                        <td className="px-6 lg:px-8 py-5 text-fynq-fog">{doc.file_type}</td>
                                        <td className="px-6 lg:px-8 py-5 text-fynq-fog">{doc.chunk_count}</td>
                                        <td className="px-6 lg:px-8 py-5 text-fynq-fog text-right">{new Date(doc.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 lg:px-8 py-5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button className="p-2.5 rounded-lg text-fynq-fog hover:text-fynq-pure hover:bg-fynq-obsidian/10 transition-all"><Download className="w-4 h-4" /></button>
                                                <button className="p-2.5 rounded-lg text-fynq-fog hover:text-fynq-pure hover:bg-fynq-obsidian/10 transition-all"><ExternalLink className="w-4 h-4" /></button>
                                                {doc.is_deprecated && (
                                                    <button
                                                        onClick={() => undoDeprecation(doc)}
                                                        className="p-2.5 rounded-lg text-fynq-fog hover:text-fynq-warning hover:bg-fynq-warning/5 transition-all"
                                                        title="Undo deprecation"
                                                    >
                                                        <Undo2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteDoc(doc.id)}
                                                    className="p-2.5 rounded-lg text-fynq-fog hover:text-fynq-red hover:bg-fynq-red/5 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {docs.length === 0 && (
                        <div className="py-24 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-ash mb-6">
                                <Database className="w-10 h-10" />
                            </div>
                            <h3 className="font-ui text-fynq-chalk text-lg font-bold mb-2">No documents synced</h3>
                            <p className="font-ui text-fynq-fog text-sm max-w-[300px] mb-8">
                                Your knowledge base is empty. Upload regulatory documents to start the contradiction audit.
                            </p>
                            <button
                                onClick={() => setShowUpload(true)}
                                className="text-fynq-red font-ui text-[12px] font-bold uppercase tracking-widest hover:underline"
                            >
                                Get Started Now
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* ── Mobile Document Cards ── */}
                <div className="md:hidden space-y-3">
                    {docs.length === 0 ? (
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-ash mb-4">
                                <Database className="w-8 h-8" />
                            </div>
                            <h3 className="font-ui text-fynq-chalk text-base font-bold mb-2">No documents synced</h3>
                            <p className="font-ui text-fynq-fog text-sm max-w-[260px] mb-6">
                                Upload documents to start.
                            </p>
                            <button
                                onClick={() => setShowUpload(true)}
                                className="text-fynq-red font-ui text-[12px] font-bold uppercase tracking-widest hover:underline"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : docs.map((doc: Document) => (
                        <div key={doc.id} className="card p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-red shrink-0">
                                    <FileText className="w-4 h-4" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-fynq-pure font-semibold text-sm truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-fynq-ash font-mono uppercase">KBID-{doc.id.slice(0, 4)}</span>
                                        {doc.is_deprecated && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-fynq-red/15 text-fynq-red border border-fynq-red/40">
                                                Deprecated
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <AnimatePresence mode="wait">
                                    {doc.status === 'ready' ? (
                                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="badge-resolved lowercase first-letter:uppercase text-[9px]">Ready</motion.div>
                                    ) : (
                                        <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-fynq-red font-bold text-[9px] uppercase">
                                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={3} />
                                            <span>{doc.status}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-fynq-fog pl-12">
                                <span>{doc.file_type} · {doc.chunk_count} chunks</span>
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-1 pl-12 pt-1 border-t border-fynq-steel/50">
                                <button className="p-2 rounded-lg text-fynq-fog hover:text-fynq-pure transition-all"><Download className="w-3.5 h-3.5" /></button>
                                <button className="p-2 rounded-lg text-fynq-fog hover:text-fynq-pure transition-all"><ExternalLink className="w-3.5 h-3.5" /></button>
                                {doc.is_deprecated && (
                                    <button onClick={() => undoDeprecation(doc)} className="p-2 rounded-lg text-fynq-fog hover:text-fynq-warning transition-all" title="Undo deprecation">
                                        <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button onClick={() => deleteDoc(doc.id)} className="p-2 rounded-lg text-fynq-fog hover:text-fynq-red transition-all ml-auto">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </PageWrapper>
    );
}
