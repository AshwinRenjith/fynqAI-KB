import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { enqueueIngestionJob } from '@/lib/ingestion/queue';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

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
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'No workspace membership found' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = ['pdf', 'docx', 'txt', 'md'];
  const mimeByExt: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
  };

  if (!allowed.includes(ext)) {
    return NextResponse.json(
      { error: `File type .${ext} not supported. Use: ${allowed.join(', ')}` },
      { status: 400 }
    );
  }

  if (file.size > 52_428_800) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
  }

  const workspaceId = membership.workspace_id;
  const documentId = randomUUID();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${workspaceId}/${documentId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('raw-documents')
    .upload(storagePath, fileBuffer, {
      upsert: false,
      contentType: mimeByExt[ext] ?? 'application/octet-stream',
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload source file' }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('documents').insert({
    id: documentId,
    workspace_id: workspaceId,
    uploaded_by: user.id,
    name: file.name.replace(/\.[^.]+$/, ''),
    original_filename: file.name,
    file_type: ext,
    file_size_bytes: file.size,
    source: 'upload',
    raw_storage_path: storagePath,
    status: 'processing',
  });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
  }

  try {
    await enqueueIngestionJob(documentId, workspaceId);
  } catch {
    await supabase
      .from('documents')
      .update({
        status: 'error',
        error_message: 'Queue enqueue failed. Please retry upload.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return NextResponse.json({ error: 'Upload succeeded but queueing failed' }, { status: 500 });
  }

  const response = NextResponse.json({ id: documentId, queued: true }, { status: 202 });
  response.headers.set('X-Document-Id', documentId);
  return response;
}
