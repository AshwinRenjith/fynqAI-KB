import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type ResolveAction = 'mark_a' | 'mark_b' | 'dismiss';

interface ResolveBody {
  action: ResolveAction;
  resolution_note?: string;
  deprecate_losing_document?: boolean;
}

const VALID_ACTIONS: ResolveAction[] = ['mark_a', 'mark_b', 'dismiss'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ error: 'No workspace membership found' }, { status: 403 });
  }

  if (membership.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  let body: ResolveBody;
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!VALID_ACTIONS.includes(body.action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be one of: mark_a, mark_b, dismiss' },
      { status: 400 }
    );
  }

  const { data: contradiction } = await supabase
    .from('contradictions')
    .select('id, chunk_a_id, chunk_b_id, document_a_id, document_b_id, status')
    .eq('id', id)
    .eq('workspace_id', membership.workspace_id)
    .maybeSingle();

  if (!contradiction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (contradiction.status !== 'open') {
    return NextResponse.json(
      { error: 'Contradiction is already resolved or dismissed' },
      { status: 409 }
    );
  }

  const authChunkId =
    body.action === 'mark_a'
      ? contradiction.chunk_a_id
      : body.action === 'mark_b'
        ? contradiction.chunk_b_id
        : null;

  const newStatus = body.action === 'dismiss' ? 'dismissed' : 'resolved';
  const now = new Date().toISOString();
  const shouldDeprecateLosingDocument =
    body.action !== 'dismiss' && body.deprecate_losing_document === true;

  const losingDocumentId =
    body.action === 'mark_a'
      ? contradiction.document_b_id
      : body.action === 'mark_b'
        ? contradiction.document_a_id
        : null;

  const operations = [
    supabase
      .from('contradictions')
      .update({
        status: newStatus,
        authoritative_chunk_id: authChunkId,
        resolution_note: body.resolution_note?.trim() || null,
        resolved_by: user.id,
        resolved_at: now,
      })
      .eq('id', id),
    supabase
      .from('contradiction_notifications')
      .update({ seen: true, seen_at: now })
      .eq('contradiction_id', id),
  ];

  if (shouldDeprecateLosingDocument && losingDocumentId) {
    operations.push(
      supabase
        .from('documents')
        .update({
          is_deprecated: true,
          deprecated_at: now,
          deprecated_reason: `Deprecated via contradiction ${id} resolution`,
        })
        .eq('id', losingDocumentId)
        .eq('workspace_id', membership.workspace_id)
    );
  }

  const [{ error: updateError }] = await Promise.all(operations);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update contradiction' }, { status: 500 });
  }

  return NextResponse.json({
    contradiction_id: id,
    status: newStatus,
    losing_document_deprecated: shouldDeprecateLosingDocument,
  });
}
