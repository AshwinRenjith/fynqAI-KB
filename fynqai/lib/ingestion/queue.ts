import { createAdminClient } from '@/lib/supabase/server';

type QueueStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface ClaimedJob {
  id: string;
  document_id: string;
  workspace_id: string;
  attempts: number;
  max_attempts: number;
}

export async function enqueueIngestionJob(documentId: string, workspaceId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('ingestion_jobs')
    .upsert(
      {
        document_id: documentId,
        workspace_id: workspaceId,
        status: 'queued' satisfies QueueStatus,
        available_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: null,
        locked_at: null,
        locked_by: null,
      },
      { onConflict: 'document_id' }
    );

  if (error) {
    throw new Error(`Failed to enqueue ingestion job: ${error.message}`);
  }
}

export async function claimIngestionJobs(batchSize: number, workerId: string): Promise<ClaimedJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('claim_ingestion_jobs', {
    batch_size: batchSize,
    worker_id: workerId,
  });

  if (error) {
    throw new Error(`Failed to claim ingestion jobs: ${error.message}`);
  }

  return (data ?? []) as ClaimedJob[];
}

export async function markIngestionJobCompleted(jobId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('ingestion_jobs')
    .update({
      status: 'completed' satisfies QueueStatus,
      updated_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      last_error: null,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to complete ingestion job: ${error.message}`);
  }
}

export async function markIngestionJobFailed(jobId: string, attempts: number, maxAttempts: number, errorMessage: string) {
  const supabase = createAdminClient();

  const shouldRetry = attempts < maxAttempts;
  const backoffSeconds = Math.min(60 * 10, Math.max(15, attempts * 30));
  const nextAvailableAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

  const { error } = await supabase
    .from('ingestion_jobs')
    .update({
      status: (shouldRetry ? 'queued' : 'failed') satisfies QueueStatus,
      available_at: shouldRetry ? nextAvailableAt : new Date().toISOString(),
      last_error: errorMessage.slice(0, 1500),
      updated_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to fail ingestion job: ${error.message}`);
  }
}
