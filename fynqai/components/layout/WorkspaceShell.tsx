'use client';

import { ReactNode, useState, useCallback } from 'react';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    return (
        <div className="flex w-full min-h-screen bg-fynq-void overflow-hidden">
            {/* ── Sidebar ── */}
            <Sidebar
                openContradictions={contradictionCount}
                userEmail={userEmail}
                workspaceName={workspaceName}
                mobileOpen={sidebarOpen}
                onMobileClose={closeSidebar}
            />

            {/* ── Main Layout (Topnav + Content) ── */}
            <main className="md:ml-[var(--sidebar-width)] flex-1 flex flex-col relative w-full min-w-0">
                <TopNav
                    title={pageTitle === 'fynqai' ? 'fynqAI Hub' : pageTitle}
                    openContradictions={contradictionCount}
                    workspaceName={workspaceName}
                    role={role}
                    onMenuClick={openSidebar}
                />

                {/* ── Page Content ── */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
