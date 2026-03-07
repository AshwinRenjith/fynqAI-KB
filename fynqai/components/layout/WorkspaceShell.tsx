'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { usePathname } from 'next/navigation';

interface WorkspaceShellProps {
    children: ReactNode;
    userEmail: string;
    workspaceName: string;
    role: 'admin' | 'member';
    contradictionCount: number;
}

export function WorkspaceShell({
    children,
    userEmail,
    workspaceName,
    role,
    contradictionCount,
}: WorkspaceShellProps) {
    const pathname = usePathname();
    const pageTitle = pathname.split('/').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || 'Dashboard';

    return (
        <div className="flex w-full min-h-screen bg-fynq-void overflow-hidden">
            {/* ── Sidebar ── */}
            <Sidebar openContradictions={contradictionCount} userEmail={userEmail} workspaceName={workspaceName} />

            {/* ── Main Layout (Topnav + Content) ── */}
            <main className="ml-[var(--sidebar-width)] flex-1 flex flex-col relative">
                <TopNav
                    title={pageTitle === 'fynqai' ? 'fynqAI Hub' : pageTitle}
                    openContradictions={contradictionCount}
                    workspaceName={workspaceName}
                    role={role}
                />

                {/* ── Page Content ── */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
