import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ error: 'No workspace membership found' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);

  const [{ data: documents }, { count }] = await Promise.all([
    supabase
      .from('documents')
      .select(
        'id, name, original_filename, file_type, status, chunk_count, created_at, updated_at, error_message, is_deprecated, deprecated_at, deprecated_reason'
      )
      .eq('workspace_id', membership.workspace_id)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id),
  ]);

  return NextResponse.json({ documents: documents ?? [], total: count ?? 0 });
}
