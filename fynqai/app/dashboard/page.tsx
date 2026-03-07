'use client';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/dashboard/StatCard';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/scroll-variants';
import { FileText, Plus, ChevronRight, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDashboardStats } from '@/hooks/use-fynq-api';
import type { Document } from '@/types/app.types';

export default function DashboardPage() {
    const { data: stats, isLoading } = useDashboardStats();
    const userName = "Admin"; // Will be dynamic later

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-var(--topnav-height))] items-center justify-center">
                <Loader2 className="w-12 h-12 text-fynq-red animate-spin" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-12"
            >
                {/* ── Heading ── */}
                <motion.div variants={staggerItem} className="flex flex-col gap-2">
                    <h2 className="font-display italic text-4xl text-fynq-silver">Good morning,</h2>
                    <h1 className="font-ui text-5xl font-bold text-fynq-chalk tracking-tight">{userName}</h1>
                </motion.div>

                {/* ── Stats Row ── */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Documents" value={stats?.totalDocuments || 0} />
                    <StatCard label="Verified Chunks" value={stats?.verifiedChunks || 0} />
                    <StatCard label="Open Conflicts" value={stats?.openContradictions || 0} isRed={stats?.openContradictions > 0} />
                </motion.div>

                {/* ── Main Dashboard Hub ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

                    {/* Quick Upload Zone (Full height left column) */}
                    <motion.div variants={staggerItem} className="lg:col-span-1 h-full">
                        <div className="card-elevated h-full min-h-[400px] flex flex-col p-8 md:p-10 group overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fynq-red/20 to-transparent opacity-40" />
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-fynq-red/10 border border-fynq-red/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Plus className="w-8 h-8 text-fynq-red" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-ui text-lg font-semibold text-fynq-chalk mb-3">Quick Upload</h3>
                                <p className="font-ui text-sm text-fynq-fog max-w-[200px] leading-relaxed mb-10">
                                    Drag and drop your regulatory documents here to start verifying.
                                </p>
                                <Link href="/documents" className="px-6 py-2.5 bg-fynq-red/10 border border-fynq-red/30 rounded-xl text-fynq-red text-[13px] font-bold uppercase tracking-widest hover:bg-fynq-red hover:text-fynq-bone transition-all shadow-xl shadow-fynq-red/5">
                                    Browse Workspace
                                </Link>
                            </div>
                            <div className="mt-8 pt-6 border-t border-fynq-steel flex items-center gap-4 text-fynq-fog font-ui text-[12px]">
                                <LayoutGrid className="w-4 h-4" />
                                <span>Supports PDF, DOCX, TXT, MD</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Documents Table (Full height right columns) */}
                    <motion.div variants={staggerItem} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-ui text-sm font-bold text-fynq-fog uppercase tracking-[0.1em]">Recent Documents</h3>
                            <Link href="/documents" className="text-fynq-red font-ui text-[12px] font-semibold flex items-center group">
                                View All <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        <div className="card border-fynq-steel overflow-hidden shadow-2xl">
                            <table className="w-full font-ui text-[13px]">
                                <thead className="bg-fynq-obsidian/5">
                                    <tr className="text-fynq-silver border-b border-fynq-steel">
                                        <th className="text-left px-6 py-4 font-semibold tracking-tight">Name</th>
                                        <th className="text-left px-6 py-4 font-semibold tracking-tight">Status</th>
                                        <th className="text-left px-6 py-4 font-semibold tracking-tight">Size/Chunks</th>
                                        <th className="text-right px-6 py-4 font-semibold tracking-tight">Uploaded</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-fynq-steel">
                                    {stats?.recentDocuments?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-fynq-fog italic">
                                                No documents yet available.
                                            </td>
                                        </tr>
                                    ) : stats?.recentDocuments?.map((doc: Document) => (
                                        <tr key={doc.id} className="group hover:bg-fynq-obsidian/5 transition-colors cursor-pointer">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-fynq-red" />
                                                    <span className="text-fynq-chalk font-medium truncate max-w-[200px]">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`${doc.status === 'ready' ? 'badge-resolved' : doc.status === 'error' ? 'badge-critical' : 'text-fynq-silver'} badge lowercase first-letter:uppercase`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-fynq-fog">{doc.chunk_count} units</td>
                                            <td className="px-6 py-5 text-fynq-fog text-right">{new Date(doc.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {/* Empty state pad row */}
                                    {stats?.recentDocuments && stats.recentDocuments.length < 3 && Array.from({ length: 3 - stats.recentDocuments.length }).map((_, i) => (
                                        <tr key={`pad-${i}`} className="opacity-0 pointer-events-none">
                                            <td colSpan={4} className="px-6 py-5">&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </PageWrapper>
    );
}
