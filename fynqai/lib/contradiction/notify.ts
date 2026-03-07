// lib/contradiction/notify.ts
/**
 * Phase 6 — Contradiction Agent
 * Creates notifications for critical contradictions detected by the agent
 */

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Creates a notification for a critical contradiction, alerting workspace admins
 * 
 * @param contradictionId - ID of the detected contradiction
 * @param workspaceId - Workspace where the contradiction was found
 * @returns Promise that resolves when notification is created
 */
export async function createContradictionNotification(
	contradictionId: string,
	workspaceId: string
): Promise<void> {
	const supabase = createAdminClient();

	// Find all workspace admins to notify
	const { data: admins } = await supabase
		.from('workspace_members')
		.select('user_id')
		.eq('workspace_id', workspaceId)
		.eq('role', 'admin');

	if (!admins || admins.length === 0) return;

	// Create notification for each admin
	const notifications = admins.map((admin) => ({
		workspace_id: workspaceId,
		contradiction_id: contradictionId,
		notify_user_id: admin.user_id,
		seen: false,
	}));

	await supabase.from('contradiction_notifications').insert(notifications);
}
