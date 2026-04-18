'use client';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion/scroll-variants';
import { User, Mail, Shield, Building2, Calendar, KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
    userId: string;
    email: string;
    workspaceName: string;
    workspaceSlug: string;
    role: 'admin' | 'member';
    joinedAt: string;
    lastSignIn: string | null;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data: membership } = await supabase
                .from('workspace_members')
                .select('workspace_id, role, joined_at, workspaces(name, slug)')
                .eq('user_id', user.id)
                .maybeSingle();

            const workspace = membership?.workspaces as { name?: string; slug?: string } | null;

            setProfile({
                userId: user.id,
                email: user.email ?? '',
                workspaceName: workspace?.name ?? 'Workspace',
                workspaceSlug: workspace?.slug ?? '',
                role: membership?.role ?? 'member',
                joinedAt: membership?.joined_at ?? user.created_at,
                lastSignIn: user.last_sign_in_at ?? null,
            });
            setLoading(false);
        }
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-var(--topnav-height))] items-center justify-center">
                <Loader2 className="w-12 h-12 text-fynq-red animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    const initials = profile.email
        .split('@')[0]
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 2)
        .toUpperCase() || 'US';

    return (
        <PageWrapper>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-10"
            >
                {/* ── Heading ── */}
                <motion.div variants={staggerItem} className="flex flex-col gap-2">
                    <h2 className="font-display italic text-2xl md:text-4xl text-fynq-silver">Your</h2>
                    <h1 className="font-ui text-3xl md:text-5xl font-bold text-fynq-chalk tracking-tight">Profile</h1>
                </motion.div>

                {/* ── Profile Card ── */}
                <motion.div variants={staggerItem} className="card-elevated p-6 md:p-8 lg:p-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                        {/* Avatar */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-fynq-graphite border border-fynq-steel flex items-center justify-center text-fynq-silver text-xl md:text-2xl font-bold shadow-inner shrink-0">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h3 className="font-ui text-xl md:text-2xl font-bold text-fynq-chalk truncate">
                                {profile.email.split('@')[0]}
                            </h3>
                            <p className="font-ui text-sm text-fynq-fog mt-1">{profile.email}</p>
                            <span className={`inline-flex items-center mt-3 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${profile.role === 'admin'
                                    ? 'bg-fynq-red/10 border border-fynq-red/20 text-fynq-red'
                                    : 'bg-fynq-steel/20 border border-fynq-steel/30 text-fynq-silver'
                                }`}>
                                <Shield className="w-3 h-3 mr-1.5" strokeWidth={2} />
                                {profile.role}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Details Grid ── */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <DetailCard
                        icon={Mail}
                        label="Email Address"
                        value={profile.email}
                    />
                    <DetailCard
                        icon={Building2}
                        label="Workspace"
                        value={profile.workspaceName}
                        sub={profile.workspaceSlug}
                    />
                    <DetailCard
                        icon={Shield}
                        label="Role"
                        value={profile.role === 'admin' ? 'Administrator' : 'Member'}
                    />
                    <DetailCard
                        icon={Calendar}
                        label="Joined"
                        value={formatDate(profile.joinedAt)}
                    />
                    <DetailCard
                        icon={KeyRound}
                        label="User ID"
                        value={profile.userId}
                        mono
                    />
                    <DetailCard
                        icon={User}
                        label="Last Sign In"
                        value={profile.lastSignIn ? formatDate(profile.lastSignIn) : 'Current session'}
                    />
                </motion.div>
            </motion.div>
        </PageWrapper>
    );
}

function DetailCard({
    icon: Icon,
    label,
    value,
    sub,
    mono,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: string;
    sub?: string;
    mono?: boolean;
}) {
    return (
        <div className="card p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-fynq-graphite border border-fynq-steel flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-fynq-fog" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-ui text-xs text-fynq-fog uppercase tracking-wider mb-1">{label}</p>
                <p className={`font-ui text-sm text-fynq-chalk truncate ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
                    {value}
                </p>
                {sub && (
                    <p className="font-ui text-xs text-fynq-fog mt-0.5 truncate">{sub}</p>
                )}
            </div>
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}
