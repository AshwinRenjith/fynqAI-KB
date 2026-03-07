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

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: contradiction } = await supabase
    .from('contradictions')
    .select(
      `id, entity_subject, value_a, value_b, contradiction_type,
       confidence, severity, status, resolution_note,
       resolved_at, resolved_by, created_at,
       chunk_a:chunks!chunk_a_id(
         id, text, section_header,
         document:documents!document_id(id, name, source, created_at)
       ),
       chunk_b:chunks!chunk_b_id(
         id, text, section_header,
         document:documents!document_id(id, name, source, created_at)
       )`
    )
    .eq('id', id)
    .eq('workspace_id', membership.workspace_id)
    .maybeSingle();

  if (!contradiction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ contradiction });
}
