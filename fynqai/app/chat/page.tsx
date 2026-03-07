import { ChatShell } from '@/components/chat/ChatShell';
import { getWorkspaceShellContext } from '@/lib/supabase/workspace';

export default async function ChatMainPage() {
    const context = await getWorkspaceShellContext();
    return <ChatShell workspaceId={context.workspaceId} initialMessages={[]} />;
}
