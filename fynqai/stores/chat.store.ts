import { create } from 'zustand';
import type { ChatMessage, ChatSession, Citation } from '@/types/app.types';

interface ChatStore {
    sessions: ChatSession[];
    activeSessionId: string | null;
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingContent: string;
    setSessions: (sessions: ChatSession[]) => void;
    setActiveSession: (id: string) => void;
    setMessages: (messages: ChatMessage[]) => void;
    appendStreamChunk: (chunk: string) => void;
    setStreaming: (value: boolean) => void;
    finalizeMessage: (fullContent: string, citations: Citation[]) => void;
    clearStream: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isStreaming: false,
    streamingContent: '',
    setSessions: (sessions) => set({ sessions }),
    setActiveSession: (id) => set({ activeSessionId: id }),
    setMessages: (messages) => set({ messages }),
    appendStreamChunk: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
    setStreaming: (value) => set({ isStreaming: value }),
    finalizeMessage: (fullContent, citations) => set((s) => ({
        messages: [...s.messages, {
            id: crypto.randomUUID(), session_id: s.activeSessionId!,
            role: 'assistant', content: fullContent,
            citations, had_contradiction: false, contradiction_ids: [], created_at: new Date().toISOString(),
        }],
        streamingContent: '',
        isStreaming: false,
    })),
    clearStream: () => set({ streamingContent: '', isStreaming: false }),
}));
