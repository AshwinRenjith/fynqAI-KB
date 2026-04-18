import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
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
  } catch (error) {
    console.error('[ingest/upload] Failed to enqueue ingestion job', {
      documentId,
      workspaceId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fallback mode: keep uploads functional even if queue infra is misconfigured.
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    runIngestionPipeline(documentId, workspaceId, fileBuffer, ext, file.name)
      .finally(() => writer.close())
      .catch((pipelineError) => {
        console.error('[ingest/upload] Inline fallback ingestion failed', {
          documentId,
          workspaceId,
          message: pipelineError instanceof Error ? pipelineError.message : 'Unknown error',
        });
      });

    const response = new Response(stream.readable, {
      status: 202,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Document-Id': documentId,
      },
    });
    response.headers.set('X-Ingestion-Mode', 'inline-fallback');
    return response;
  }

  const response = NextResponse.json({ id: documentId, queued: true }, { status: 202 });
  response.headers.set('X-Document-Id', documentId);
  return response;
}
