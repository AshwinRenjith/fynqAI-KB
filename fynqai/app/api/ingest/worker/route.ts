import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
import {
  claimIngestionJobs,
  markIngestionJobCompleted,
  markIngestionJobFailed,
} from '@/lib/ingestion/queue';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isCronAuthorized(request: Request): boolean {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token.length > 0 && token === configured;
}

async function isAdminUser(): Promise<boolean> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return membership?.role === 'admin';
}

async function setDocumentError(documentId: string, errorMessage: string) {
  const supabase = createAdminClient();
  await supabase
    .from('documents')
    .update({
      status: 'error',
      error_message: errorMessage.slice(0, 1500),
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);
}

async function processClaimedJob(job: {
  id: string;
  document_id: string;
  workspace_id: string;
  attempts: number;
  max_attempts: number;
}) {
  const supabase = createAdminClient();

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, workspace_id, raw_storage_path, file_type, original_filename')
    .eq('id', job.document_id)
    .maybeSingle();

  if (docError || !doc) {
    const message = docError?.message ?? 'Document not found';
    await markIngestionJobFailed(job.id, job.attempts, job.max_attempts, message);
    await setDocumentError(job.document_id, message);
    return { ok: false, message };
  }

  if (!doc.raw_storage_path) {
    const message = 'Raw file path is missing';
    await markIngestionJobFailed(job.id, job.attempts, job.max_attempts, message);
    await setDocumentError(job.document_id, message);
    return { ok: false, message };
  }

  const { data: fileData, error: fileError } = await supabase.storage
    .from('raw-documents')
    .download(doc.raw_storage_path);

  if (fileError || !fileData) {
    const message = fileError?.message ?? 'Source file download failed';
    await markIngestionJobFailed(job.id, job.attempts, job.max_attempts, message);
    await setDocumentError(job.document_id, message);
    return { ok: false, message };
  }

  const fileBuffer = Buffer.from(await fileData.arrayBuffer());

  try {
    await runIngestionPipeline(
      doc.id,
      doc.workspace_id,
      fileBuffer,
      doc.file_type,
      doc.original_filename
    );
    await markIngestionJobCompleted(job.id);
    return { ok: true, message: 'processed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingestion pipeline failed';
    await markIngestionJobFailed(job.id, job.attempts, job.max_attempts, message);
    await setDocumentError(job.document_id, message);
    return { ok: false, message };
  }
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    const admin = await isAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const requestedBatch = Number.parseInt(searchParams.get('batch') ?? '2', 10);
  const batch = Number.isFinite(requestedBatch)
    ? Math.min(Math.max(requestedBatch, 1), 10)
    : 2;

  const workerId = `vercel-${randomUUID()}`;
  const jobs = await claimIngestionJobs(batch, workerId);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    processed += 1;
    const result = await processClaimedJob(job);
    if (result.ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  return NextResponse.json({
    worker_id: workerId,
    claimed: jobs.length,
    processed,
    succeeded,
    failed,
  });
}
