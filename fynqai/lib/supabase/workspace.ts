import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

export interface WorkspaceShellContext {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  role: 'admin' | 'member';
  contradictionCount: number;
}

export async function getWorkspaceShellContext(): Promise<WorkspaceShellContext> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.workspace_id) {
    redirect('/auth/login');
  }

  const { count } = await supabase
    .from('contradictions')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', membership.workspace_id)
    .eq('status', 'open');

  return {
    userId: user.id,
    userEmail: user.email ?? 'user@example.com',
    workspaceId: membership.workspace_id,
    workspaceName: (membership.workspaces as { name?: string } | null)?.name ?? 'Workspace',
    role: membership.role,
    contradictionCount: count ?? 0,
  };
}
