import { create } from 'zustand';

interface WorkspaceStore {
    workspaceId: string | null;
    workspaceName: string | null;
    role: 'admin' | 'member' | null;
    openContradictionCount: number;
    setWorkspace: (id: string, name: string, role: 'admin' | 'member') => void;
    setContradictionCount: (count: number) => void;
    incrementContradictions: () => void;
    decrementContradictions: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
    workspaceId: null,
    workspaceName: null,
    role: null,
    openContradictionCount: 0,
    setWorkspace: (id, name, role) => set({ workspaceId: id, workspaceName: name, role }),
    setContradictionCount: (count) => set({ openContradictionCount: count }),
    incrementContradictions: () => set((s) => ({ openContradictionCount: s.openContradictionCount + 1 })),
    decrementContradictions: () => set((s) => ({ openContradictionCount: Math.max(0, s.openContradictionCount - 1) })),
}));
