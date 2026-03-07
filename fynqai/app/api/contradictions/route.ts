import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const VALID_STATUSES = ['open', 'resolved', 'dismissed', 'auto_resolved'] as const;
type QueryStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const rawStatus = searchParams.get('status') ?? 'open';
  const status: QueryStatus = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as QueryStatus)
    : 'open';

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ error: 'No workspace membership found' }, { status: 403 });
  }

  const [
    { data: contradictions, count },
    { count: openCount },
    { count: openCriticalCount },
    { count: openWarningCount },
    { count: resolvedCount },
  ] = await Promise.all([
    supabase
      .from('contradictions')
      .select(
        `id, entity_subject, value_a, value_b, contradiction_type,
         confidence, severity, status, created_at,
         document_a:documents!document_a_id(name, created_at),
         document_b:documents!document_b_id(name, created_at)`,
        { count: 'exact' }
      )
      .eq('workspace_id', membership.workspace_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'open'),
    supabase
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'open')
      .eq('severity', 'critical'),
    supabase
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'open')
      .eq('severity', 'warning'),
    supabase
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'resolved'),
  ]);

  return NextResponse.json({
    contradictions: contradictions ?? [],
    total: count ?? 0,
    open_count: openCount ?? 0,
    open_critical_count: openCriticalCount ?? 0,
    open_warning_count: openWarningCount ?? 0,
    resolved_count: resolvedCount ?? 0,
    page,
    limit,
  });
}
