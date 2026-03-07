'use client';

import { useContradictions, useResolveContradiction, useRescanContradictions } from '@/hooks/use-fynq-api';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ContradictionCard } from '@/components/admin/ContradictionCard';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/scroll-variants';
import { ShieldAlert, CheckCircle2, AlertTriangle, Search, Filter, History, Loader2 } from 'lucide-react';
import type { Contradiction } from '@/types/app.types';

export default function ContradictionsPage() {
    const { data: contradictionsData, isLoading } = useContradictions('open');
    const resolveMutation = useResolveContradiction();
    const rescanMutation = useRescanContradictions();

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-var(--topnav-height))] items-center justify-center">
                <Loader2 className="w-12 h-12 text-fynq-red animate-spin" />
            </div>
        );
    }

    const items: Contradiction[] = contradictionsData?.contradictions || [];
    const openCritical = contradictionsData?.open_critical_count ?? items.filter(c => c.severity === 'critical').length;
    const openWarning = contradictionsData?.open_warning_count ?? items.filter(c => c.severity === 'warning').length;
    const openTotal = contradictionsData?.open_count ?? items.length;
    const resolvedCount = contradictionsData?.resolved_count || 0;

    const handleResolve = async (
        id: string,
        action: 'mark_a' | 'mark_b' | 'dismiss',
        options?: { deprecateLosingDocument?: boolean }
    ) => {
        await resolveMutation.mutateAsync({
            id,
            action,
            deprecateLosingDocument: options?.deprecateLosingDocument,
        });
    };

    return (
        <PageWrapper>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-24"
            >
                {/* ── Page Header ── */}
                <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2 text-fynq-chalk">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-fynq-red animate-pulse" />
                            <span className="font-ui text-[11px] font-bold text-fynq-red uppercase tracking-widest">Audit Active</span>
                        </div>
                        <h1 className="font-ui text-4xl font-bold tracking-tight text-fynq-chalk">Audit Resolution Hub</h1>
                        <p className="font-ui text-fynq-fog text-[15px] max-w-[550px] leading-relaxed">
                            Below are the identified inconsistencies across your governance stack. Resolve them to ensure your knowledge base remains the single source of truth.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => rescanMutation.mutate(undefined)}
                            disabled={rescanMutation.isPending}
                            className="px-5 py-2.5 h-11 bg-fynq-red/10 border border-fynq-red/30 rounded-xl text-fynq-red font-ui text-[13px] font-bold flex items-center gap-2 hover:bg-fynq-red hover:text-fynq-bone transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {rescanMutation.isPending ? 'Re-scanning...' : 'Re-Run Contradiction Scan'}
                        </button>
                        <button className="px-5 py-2.5 h-11 bg-fynq-obsidian/5 border border-fynq-steel rounded-xl text-fynq-ash font-ui text-[13px] font-bold flex items-center gap-2 hover:border-fynq-iron transition-all shadow-xl">
                            <History className="w-4 h-4" />
                            View Audit History
                        </button>
                    </div>
                </motion.div>

                {/* ── Contradiction Quick Stats ── */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-elevated p-8 border-fynq-red/20 bg-fynq-red/[0.01]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-fynq-red/10 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-fynq-red" />
                            </div>
                            <span className="font-ui text-[11px] font-bold text-fynq-red uppercase tracking-widest">Critical</span>
                        </div>
                        <div className="font-display text-4xl font-medium text-fynq-chalk mb-1">{openCritical.toString().padStart(2, '0')}</div>
                        <p className="font-ui text-xs text-fynq-ash font-bold uppercase tracking-tight">Open Critical Conflicts</p>
                    </div>

                    <div className="card-elevated p-8 border-fynq-warning/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-fynq-warning/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-fynq-warning" />
                            </div>
                            <span className="font-ui text-[11px] font-bold text-fynq-warning uppercase tracking-widest">Warning</span>
                        </div>
                        <div className="font-display text-4xl font-medium text-fynq-chalk mb-1">{openWarning.toString().padStart(2, '0')}</div>
                        <p className="font-ui text-xs text-fynq-ash font-bold uppercase tracking-tight">Warning Discrepancies</p>
                    </div>

                    <div className="card-elevated p-8 border-fynq-resolved/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-fynq-resolved/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-fynq-resolved" />
                            </div>
                            <span className="font-ui text-[11px] font-bold text-fynq-resolved uppercase tracking-widest">Audit Score</span>
                        </div>
                        <div className="font-display text-4xl font-medium text-fynq-chalk mb-1">{resolvedCount}</div>
                        <p className="font-ui text-xs text-fynq-ash font-bold uppercase tracking-tight">Resolved Inconsistencies</p>
                    </div>
                </motion.div>

                {/* ── Filter Bar ── */}
                <motion.div variants={staggerItem} className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                    <div className="relative w-full md:max-w-[400px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fynq-fog" />
                        <input
                            className="w-full bg-fynq-obsidian/5 border border-fynq-steel rounded-xl h-11 pl-10 pr-4 font-ui text-[14px] text-fynq-chalk outline-none focus:border-fynq-iron transition-all placeholder:text-fynq-fog"
                            placeholder="Search by entity or document..."
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 text-fynq-fog hover:text-fynq-pure transition-all text-sm font-medium">
                            <Filter className="w-4 h-4" />
                            Severity: High
                        </button>
                        <div className="h-4 w-px bg-fynq-steel hidden md:block" />
                        <button className="flex items-center gap-2 px-4 py-2 text-fynq-fog hover:text-fynq-pure transition-all text-sm font-medium">
                            Source: All Documents
                        </button>
                    </div>
                </motion.div>

                {/* ── Contradiction List ── */}
                <div className="space-y-8">
                    {openTotal > items.length && (
                        <div className="px-1 text-[12px] font-ui text-fynq-fog">
                            Showing latest {items.length} of {openTotal} open contradictions.
                        </div>
                    )}

                    {items.map((c: Contradiction) => (
                        <motion.div key={c.id} variants={staggerItem}>
                            <ContradictionCard
                                contradiction={c}
                                docAName={c.document_a?.name || c.document_a_name || 'Source A'}
                                docBName={c.document_b?.name || c.document_b_name || 'Source B'}
                                onResolve={handleResolve}
                            />
                        </motion.div>
                    ))}

                    {items.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 flex flex-col items-center text-center bg-white/[0.01] rounded-3xl border border-dashed border-fynq-steel"
                        >
                            <div className="w-16 h-16 rounded-full bg-fynq-resolved/10 flex items-center justify-center text-fynq-resolved mb-6">
                                <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-ui text-fynq-chalk text-xl font-bold mb-2">Zero Conflicts Found</h3>
                            <p className="font-ui text-fynq-fog text-sm max-w-[340px] leading-relaxed italic">
                                All synced documents are consistent across your active knowledge base. Your governance stack is healthy.
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </PageWrapper>
    );
}
