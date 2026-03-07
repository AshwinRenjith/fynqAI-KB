'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, ExternalLink, ShieldAlert } from 'lucide-react';
import { Citation } from '@/types/app.types';
import { slideInRight } from '@/lib/motion/scroll-variants';

interface CitationPanelProps {
    citation: Citation | null;
    onClose: () => void;
}

export function CitationPanel({ citation, onClose }: CitationPanelProps) {
    return (
        <AnimatePresence>
            {citation && (
                <>
                    {/* Overlay Overlay */}
                    <motion.div
                        key="citation-mask"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-fynq-void/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Sliding Panel */}
                    <motion.div
                        key="citation-panel"
                        variants={slideInRight}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-fynq-ink border-l border-fynq-steel z-[70] shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 flex items-center justify-between border-b border-fynq-steel bg-white/[0.01]">
                            <div>
                                <h3 className="font-ui text-xl font-bold text-fynq-chalk tracking-tight">Source Audit</h3>
                                <p className="font-ui text-xs text-fynq-ash font-medium uppercase tracking-[0.2em] mt-1">Ref ID {citation.index}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl hover:bg-white/[0.05] text-fynq-fog hover:text-fynq-pure transition-all group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="badge-resolved lowercase first-letter:uppercase tracking-[0.05em] px-3">Verified Source</div>
                                </div>
                                <h4 className="font-ui text-lg font-bold text-fynq-pure leading-tight tracking-tight">
                                    {citation.document_name}
                                </h4>
                                <div className="flex items-center gap-2 text-fynq-ash font-mono text-[11px] bg-white/[0.03] px-3 py-1.5 rounded-lg border border-fynq-steel self-start">
                                    <span className="opacity-40">SECTION:</span>
                                    <span className="text-fynq-mist font-bold">{citation.section_header || 'ROOT'}</span>
                                </div>
                            </div>

                            {/* Verified Text Block */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-fynq-red/5 blur-xl group-hover:blur-2xl transition-all duration-700 pointer-events-none rounded-2xl" />
                                <div className="card p-7 border-fynq-iron/20 bg-white/[0.02] relative z-10">
                                    <p className="font-ui text-[15px] leading-relaxed text-fynq-mist whitespace-pre-wrap italic">
                                        &ldquo;{citation.excerpt}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* Action Stack */}
                            <div className="space-y-4 pt-4">
                                <button className="w-full h-12 rounded-xl bg-white/[0.05] border border-fynq-steel text-fynq-chalk font-ui text-[13px] font-bold flex items-center justify-center gap-3 hover:border-fynq-red transition-all group shadow-xl">
                                    <ExternalLink className="w-4 h-4 text-fynq-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    <span>View Original Location</span>
                                </button>
                                <button className="w-full h-12 rounded-xl border border-transparent text-fynq-ash font-ui text-[13px] font-bold flex items-center justify-center gap-3 hover:text-fynq-red transition-all group">
                                    <Bookmark className="w-4 h-4 transition-transform group-hover:rotate-12" />
                                    <span>Flag for Manual Audit</span>
                                </button>
                            </div>
                        </div>

                        {/* Footer Pad */}
                        <div className="p-8 border-t border-fynq-steel bg-black/20 text-[10px] uppercase font-bold text-fynq-ash font-mono flex items-center gap-2 tracking-[0.15em]">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Source Consistency Check Active</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
