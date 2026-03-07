-- Phase 7 - Queue-backed ingestion for serverless reliability

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingestion_job_status') THEN
    CREATE TYPE ingestion_job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  status ingestion_job_status NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 100,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_claim
  ON ingestion_jobs(status, available_at, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_workspace
  ON ingestion_jobs(workspace_id, status);

ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ingestion_jobs' AND policyname = 'ingestion_jobs_select'
  ) THEN
    CREATE POLICY ingestion_jobs_select ON ingestion_jobs
      FOR SELECT USING (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ingestion_jobs' AND policyname = 'ingestion_jobs_insert'
  ) THEN
    CREATE POLICY ingestion_jobs_insert ON ingestion_jobs
      FOR INSERT WITH CHECK (user_in_workspace(workspace_id));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION claim_ingestion_jobs(batch_size INTEGER, worker_id TEXT)
RETURNS SETOF ingestion_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM ingestion_jobs
    WHERE status = 'queued'
      AND available_at <= NOW()
      AND attempts < max_attempts
    ORDER BY priority ASC, created_at ASC
    LIMIT GREATEST(batch_size, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE ingestion_jobs j
  SET status = 'processing',
      attempts = j.attempts + 1,
      locked_at = NOW(),
      locked_by = worker_id,
      updated_at = NOW(),
      last_error = NULL
  WHERE j.id IN (SELECT id FROM candidates)
  RETURNING j.*;
END;
$$;
