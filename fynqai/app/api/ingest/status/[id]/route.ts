import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
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

  const { data: doc } = await supabase
    .from('documents')
    .select('id, workspace_id, status, chunk_count, error_message')
    .eq('id', id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', doc.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    document_id: doc.id,
    status: doc.status,
    chunk_count: doc.chunk_count,
    error_message: doc.error_message,
  });
}
