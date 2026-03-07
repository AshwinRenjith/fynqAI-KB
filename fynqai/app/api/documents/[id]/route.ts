import { NextResponse } from 'next/server';

import { createAdminClient, createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface DeprecationBody {
  is_deprecated?: boolean;
  reason?: string;
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('id, workspace_id, uploaded_by, raw_storage_path, markdown_storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', doc.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const isAllowed = membership?.role === 'admin' || doc.uploaded_by === user.id;
  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  if (doc.raw_storage_path) {
    await admin.storage.from('raw-documents').remove([doc.raw_storage_path]);
  }
  if (doc.markdown_storage_path) {
    await admin.storage.from('parsed-documents').remove([doc.markdown_storage_path]);
  }

  const { error } = await admin.from('documents').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: DeprecationBody;
  try {
    body = (await request.json()) as DeprecationBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body.is_deprecated !== 'boolean') {
    return NextResponse.json({ error: 'is_deprecated boolean is required' }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('id, workspace_id')
    .eq('id', id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', doc.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const nextState = body.is_deprecated
    ? {
        is_deprecated: true,
        deprecated_at: now,
        deprecated_reason: body.reason?.trim() || 'Manually deprecated by admin',
      }
    : {
        is_deprecated: false,
        deprecated_at: null,
        deprecated_reason: null,
      };

  const { data: updated, error } = await supabase
    .from('documents')
    .update(nextState)
    .eq('id', id)
    .eq('workspace_id', doc.workspace_id)
    .select('id, is_deprecated, deprecated_at, deprecated_reason')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to update document deprecation state' }, { status: 500 });
  }

  return NextResponse.json({ document: updated });
}
