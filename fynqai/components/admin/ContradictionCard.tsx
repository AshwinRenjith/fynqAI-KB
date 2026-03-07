'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, CheckCircle2, FileText, AlertTriangle, Info } from 'lucide-react';
import { Contradiction } from '@/types/app.types';

interface ContradictionCardProps {
    contradiction: Contradiction;
    docAName: string;
    docBName: string;
    onResolve: (
        id: string,
        action: 'mark_a' | 'mark_b' | 'dismiss',
        options?: { deprecateLosingDocument?: boolean }
    ) => void;
}

export function ContradictionCard({ contradiction, docAName, docBName, onResolve }: ContradictionCardProps) {
    const [deprecateLosingDocument, setDeprecateLosingDocument] = useState(true);
    const isCritical = contradiction.severity === 'critical';
    const isWarning = contradiction.severity === 'warning';
    const shortDocA = docAName.length > 24 ? `${docAName.slice(0, 24)}...` : docAName;
    const shortDocB = docBName.length > 24 ? `${docBName.slice(0, 24)}...` : docBName;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`card-elevated overflow-hidden group transition-all duration-300 ${isCritical ? 'border-fynq-red/30 bg-fynq-red/[0.01]' : ''
                }`}
        >
            <div className="p-6 md:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {isCritical ? (
                                <div className="badge-critical flex items-center gap-1.5 font-bold">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    Critical Conflict
                                </div>
                            ) : isWarning ? (
                                <div className="badge-warning flex items-center gap-1.5 font-bold">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Policy Mismatch
                                </div>
                            ) : (
                                <div className="badge-info flex items-center gap-1.5 font-bold">
                                    <Info className="w-3.5 h-3.5" />
                                    Advisory
                                </div>
                            )}
                            <span className="text-[11px] font-mono text-fynq-ash uppercase tracking-widest pl-2 border-l border-fynq-steel">
                                TYPE: {contradiction.contradiction_type}
                            </span>
                        </div>
                        <h3 className="font-ui text-xl font-bold text-fynq-pure tracking-tight">
                            Discrepancy in <span className="text-fynq-red italic">&quot;{contradiction.entity_subject}&quot;</span>
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-fynq-ash uppercase tracking-widest mb-1 opacity-50">Audit Trust</div>
                        <div className={`font-display text-3xl font-medium ${contradiction.confidence > 0.9 ? 'text-fynq-resolved' : 'text-fynq-chalk'}`}>
                            {Math.round(contradiction.confidence * 100)}%
                        </div>
                    </div>
                </div>

                {/* Conflict Comparison Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-fynq-steel border border-fynq-steel rounded-2xl overflow-hidden shadow-inner">
                    {/* Source A */}
                    <div className="bg-fynq-ink p-6 md:p-8 space-y-4 relative group/a">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-fynq-red opacity-50" />
                            <span className="text-[11px] font-bold text-fynq-ash uppercase tracking-widest">{docAName}</span>
                        </div>
                        <div className="text-fynq-mist font-ui text-[15px] leading-relaxed relative z-10">
                            {contradiction.value_a}
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-fynq-red opacity-20 group-hover/a:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {/* Source B */}
                    <div className="bg-fynq-ink p-6 md:p-8 space-y-4 relative group/b">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-fynq-red opacity-50" />
                            <span className="text-[11px] font-bold text-fynq-ash uppercase tracking-widest">{docBName}</span>
                        </div>
                        <div className="text-fynq-mist font-ui text-[15px] leading-relaxed relative z-10">
                            {contradiction.value_b}
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-fynq-red opacity-20 group-hover/b:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                    <div className="space-y-3">
                        <div className="flex items-center gap-6 text-[12px] font-ui text-fynq-fog">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-fynq-red" />
                                <span>Manual resolution required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-fynq-ash" />
                                <span>KB update pending</span>
                            </div>
                        </div>
                        <label className="inline-flex items-center gap-2 text-[12px] font-ui text-fynq-fog select-none">
                            <input
                                type="checkbox"
                                checked={deprecateLosingDocument}
                                onChange={(event) => setDeprecateLosingDocument(event.target.checked)}
                                className="h-4 w-4 rounded border-fynq-steel bg-fynq-ink accent-fynq-red"
                            />
                            Deprecate losing document in retrieval
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => onResolve(contradiction.id, 'dismiss')}
                            className="flex-1 sm:flex-none px-6 py-2.5 h-11 bg-white/[0.03] border border-fynq-steel rounded-xl text-fynq-ash font-ui text-[13px] font-bold hover:text-white hover:border-fynq-iron transition-all"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() =>
                                onResolve(contradiction.id, 'mark_a', {
                                    deprecateLosingDocument,
                                })
                            }
                            className="flex-1 sm:flex-none px-4 py-2.5 h-11 bg-fynq-red border border-fynq-crimson rounded-xl text-white font-ui text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-fynq-red/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark A Correct ({shortDocA})
                        </button>
                        <button
                            onClick={() =>
                                onResolve(contradiction.id, 'mark_b', {
                                    deprecateLosingDocument,
                                })
                            }
                            className="flex-1 sm:flex-none px-4 py-2.5 h-11 bg-fynq-red border border-fynq-crimson rounded-xl text-white font-ui text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-fynq-red/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark B Correct ({shortDocB})
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            {isCritical && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-fynq-red/5 blur-3xl pointer-events-none rounded-full translate-x-16 -translate-y-16" />
            )}
        </motion.div>
    );
}
