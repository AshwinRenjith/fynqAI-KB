'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Document, ChatMessage } from '@/types/app.types';

/**
 * FYNQ AI — CORE API HOOKS §7,8
 */

// ── DOCUMENTS ──

export function useDocuments(limit = 50) {
    return useQuery({
        queryKey: ['documents', limit],
        queryFn: async () => {
            const res = await fetch(`/api/documents?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            return data.documents as Document[];
        },
        refetchInterval: 5000, // Poll every 5s for status updates
    });
}

export function useUploadDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/ingest/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const payload = await res.json().catch(() => ({} as { id?: string }));
            const documentId = res.headers.get('X-Document-Id') ?? payload.id ?? null;
            if (!documentId) {
                throw new Error('Upload succeeded but no document id was returned');
            }

            return { id: documentId };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useIngestStatus(id?: string) {
    return useQuery({
        queryKey: ['ingest-status', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await fetch(`/api/ingest/status/${id}`);
            if (!res.ok) throw new Error('Failed to fetch status');
            return res.json();
        },
        enabled: !!id,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.status === 'ready' || data?.status === 'error') return false;
            return 2000;
        }
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useToggleDocumentDeprecation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            isDeprecated,
            reason,
        }: {
            id: string;
            isDeprecated: boolean;
            reason?: string;
        }) => {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_deprecated: isDeprecated,
                    reason,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Deprecation update failed' }));
                throw new Error(err.error || 'Deprecation update failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['contradictions'] });
        },
    });
}

// ── CONTRADICTIONS ──

export function useContradictions(status = 'open') {
    return useQuery({
        queryKey: ['contradictions', status],
        queryFn: async () => {
            const res = await fetch(`/api/contradictions?status=${status}`);
            if (!res.ok) throw new Error('Failed to fetch contradictions');
            const data = await res.json();
            return data;
        },
    });
}

export function useResolveContradiction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            action,
            resolutionNote,
            deprecateLosingDocument,
        }: {
            id: string;
            action: 'mark_a' | 'mark_b' | 'dismiss';
            resolutionNote?: string;
            deprecateLosingDocument?: boolean;
        }) => {
            const res = await fetch(`/api/contradictions/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    resolution_note: resolutionNote,
                    deprecate_losing_document: deprecateLosingDocument,
                }),
            });
            if (!res.ok) throw new Error('Resolution failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contradictions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useRescanContradictions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (documentIds?: string[]) => {
            const res = await fetch('/api/contradictions/rescan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentIds }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Rescan failed' }));
                throw new Error(err.error || 'Rescan failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contradictions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

// ── DASHBOARD ──

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const [docsRes, conRes] = await Promise.all([
                fetch('/api/documents?limit=50'),
                fetch('/api/contradictions?status=open&limit=1'),
            ]);
            const docsData = await docsRes.json();
            const conData = await conRes.json();

            const recentDocuments = docsData.documents || [];
            const verifiedChunks = recentDocuments
                .filter((doc: Document) => doc.status === 'ready')
                .reduce((acc: number, doc: Document) => acc + (doc.chunk_count || 0), 0);

            return {
                totalDocuments: docsData.total || 0,
                openContradictions: conData.open_count || 0,
                verifiedChunks,
                recentDocuments,
            };
        },
    });
}

// ── CHAT & SESSIONS ──

export function useChatSessions() {
    return useQuery({
        queryKey: ['chat-sessions'],
        queryFn: async () => {
            const res = await fetch('/api/chat/sessions');
            if (!res.ok) throw new Error('Failed to fetch sessions');
            const data = await res.json();
            return data.sessions || [];
        }
    });
}

export function useCreateSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (title: string) => {
            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            if (!res.ok) throw new Error('Create session failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        },
    });
}

export function useDeleteSession() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) => {
            const res = await fetch(`/api/chat/sessions/${sessionId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Delete session failed' }));
                throw new Error(err.error || 'Delete session failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        },
    });
}

export function useSessionMessages(sessionId?: string) {
    return useQuery({
        queryKey: ['chat-messages', sessionId],
        queryFn: async () => {
            if (!sessionId) return [];
            const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            return data.messages as ChatMessage[];
        },
        enabled: !!sessionId,
    });
}
