-- Add document-level deprecation metadata used after contradiction resolution.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS is_deprecated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deprecated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deprecated_reason text;

-- Keep deprecated-doc filtering fast for retrieval paths.
CREATE INDEX IF NOT EXISTS idx_documents_workspace_deprecated
  ON public.documents (workspace_id, is_deprecated)
  WHERE is_deprecated = true;
