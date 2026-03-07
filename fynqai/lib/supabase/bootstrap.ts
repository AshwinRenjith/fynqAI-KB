import { createAdminClient } from '@/lib/supabase/server';

export async function bootstrapNewUser(userId: string, email: string) {
	const supabase = createAdminClient();
	const prefix = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'workspace';
	const slug = `${prefix}-${Date.now()}`;
	const name = `${email.split('@')[0] || 'User'}'s Workspace`;

	const { data: workspace, error } = await supabase
		.from('workspaces')
		.insert({ name, slug })
		.select()
		.single();

	if (error || !workspace) {
		throw new Error(`Failed to create workspace: ${error?.message || 'unknown error'}`);
	}

	const { error: memberError } = await supabase.from('workspace_members').insert({
		workspace_id: workspace.id,
		user_id: userId,
		role: 'admin',
	});

	if (memberError) {
		throw new Error(`Failed to create workspace membership: ${memberError.message}`);
	}

	return workspace;
}
