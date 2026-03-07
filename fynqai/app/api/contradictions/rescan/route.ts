import { NextResponse } from 'next/server';

import { runContradictionScan } from '@/lib/contradiction/agent';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface RescanBody {
  documentIds?: string[];
  replaceExisting?: boolean;
}

export async function POST(request: Request) {
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

  let body: RescanBody = {};
  try {
    body = (await request.json()) as RescanBody;
  } catch {
    // Body is optional.
  }

  const admin = createAdminClient();
  let docQuery = admin
    .from('documents')
    .select('id')
    .eq('workspace_id', membership.workspace_id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(200);

  if (Array.isArray(body.documentIds) && body.documentIds.length > 0) {
    docQuery = docQuery.in('id', body.documentIds);
  }

  const { data: docs, error: docsError } = await docQuery;
  if (docsError) {
    return NextResponse.json({ error: 'Failed to fetch documents for rescan' }, { status: 500 });
  }

  const targetDocIds = (docs ?? []).map((doc) => doc.id);
  const shouldReplaceExisting = body.replaceExisting !== false;

  if (shouldReplaceExisting && targetDocIds.length > 0) {
    const { error: deleteErrorA } = await admin
      .from('contradictions')
      .delete()
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'open')
      .in('document_a_id', targetDocIds);

    if (deleteErrorA) {
      return NextResponse.json(
        { error: 'Failed to clear existing open contradictions before rescan' },
        { status: 500 }
      );
    }

    const { error: deleteErrorB } = await admin
      .from('contradictions')
      .delete()
      .eq('workspace_id', membership.workspace_id)
      .eq('status', 'open')
      .in('document_b_id', targetDocIds);

    if (deleteErrorB) {
      return NextResponse.json(
        { error: 'Failed to clear existing open contradictions before rescan' },
        { status: 500 }
      );
    }
  }

  let processed = 0;
  let skipped = 0;

  for (const doc of docs ?? []) {
    const { data: chunks, error: chunksError } = await admin
      .from('chunks')
      .select('id')
      .eq('document_id', doc.id);

    if (chunksError || !chunks || chunks.length === 0) {
      skipped += 1;
      continue;
    }

    await runContradictionScan(
      doc.id,
      membership.workspace_id,
      chunks.map((chunk) => chunk.id)
    );

    processed += 1;
  }

  return NextResponse.json({
    success: true,
    processed,
    skipped,
    totalCandidates: docs?.length ?? 0,
    replacedExisting: shouldReplaceExisting,
  });
}
