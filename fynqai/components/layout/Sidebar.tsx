'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    ShieldAlert,
    LogOut,
    User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Contradictions', href: '/admin/contradictions', icon: ShieldAlert, badge: true },
];

interface SidebarProps {
    openContradictions?: number;
    userEmail: string;
    workspaceName: string;
}

function initialsFromEmail(email: string) {
    const local = email.split('@')[0] || 'user';
    return local.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'US';
}

export function Sidebar({ openContradictions = 0, userEmail, workspaceName }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const onSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/auth/login');
        router.refresh();
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-fynq-ink border-r border-fynq-steel flex flex-col z-50 backdrop-blur-xl">
            {/* ── Logo Section ── */}
            <div className="h-[var(--topnav-height)] flex items-center px-8 border-b border-fynq-steel">
                <Link href="/dashboard" className="flex items-center gap-0.5 group">
                    <span className="text-fynq-red font-display italic text-2xl font-bold transition-transform group-hover:scale-110 duration-300">f</span>
                    <span className="font-ui text-[18px] font-medium text-fynq-chalk tracking-tight">ynq</span>
                    <span className="font-display italic text-[18px] font-medium text-fynq-fog">AI</span>
                </Link>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 py-10 px-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex items-center h-12 px-4 rounded-xl transition-all duration-300 group ${isActive ? 'text-fynq-pure font-semibold' : 'text-fynq-fog hover:text-fynq-silver hover:bg-white/[0.03]'
                                }`}
                        >
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute inset-0 bg-white/[0.06] border border-white/[0.05] rounded-xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    >
                                        <div className="absolute left-[-1px] top-3 bottom-3 w-[2px] bg-fynq-red rounded-full" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Icon className={`w-5 h-5 mr-3 shrink-0 transition-transform duration-300 ${isActive ? 'text-fynq-red' : 'group-hover:scale-110'}`} strokeWidth={1.5} />
                            <span className="font-ui text-[14px] tracking-tight relative z-10">{item.label}</span>

                            {item.badge && openContradictions > 0 && (
                                <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={openContradictions}
                                    className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fynq-red/10 border border-fynq-red/20 px-1.5 text-[10px] font-bold text-fynq-red animate-pulse-red"
                                >
                                    {openContradictions}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* ── User Footer ── */}
            <div className="p-4 border-t border-fynq-steel">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-silver text-[12px] font-bold overflow-hidden shadow-inner">
                        {initialsFromEmail(userEmail)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-ui text-[12px] font-semibold text-fynq-chalk truncate">{workspaceName}</p>
                        <p className="font-ui text-[10px] text-fynq-fog truncate">{userEmail}</p>
                    </div>
                </div>
                <Link href="/profile" className="w-full flex items-center h-10 px-4 rounded-lg text-fynq-fog hover:text-fynq-chalk hover:bg-fynq-graphite/60 transition-all text-[13px] font-medium group">
                    <User className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" strokeWidth={2} />
                    Profile
                </Link>
                <button onClick={onSignOut} className="w-full flex items-center h-10 px-4 rounded-lg text-fynq-fog hover:text-fynq-red hover:bg-fynq-red/5 transition-all text-[13px] font-medium group">
                    <LogOut className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
