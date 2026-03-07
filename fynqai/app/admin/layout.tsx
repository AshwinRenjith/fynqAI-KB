import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { getWorkspaceShellContext } from '@/lib/supabase/workspace';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const context = await getWorkspaceShellContext();

    return (
        <WorkspaceShell
            userEmail={context.userEmail}
            workspaceName={context.workspaceName}
            role={context.role}
            contradictionCount={context.contradictionCount}
        >
            {children}
        </WorkspaceShell>
    );
}
