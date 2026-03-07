-- Phase 3.2 - Storage buckets and storage policies (PRD §20)

-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'raw-documents',
  'raw-documents',
  FALSE,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parsed-documents',
  'parsed-documents',
  FALSE,
  10485760,
  ARRAY['text/markdown', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'raw_docs_insert') THEN
    CREATE POLICY raw_docs_insert ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'raw-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'raw_docs_select') THEN
    CREATE POLICY raw_docs_select ON storage.objects
      FOR SELECT USING (
        bucket_id = 'raw-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'parsed_docs_insert') THEN
    CREATE POLICY parsed_docs_insert ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'parsed-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'parsed_docs_select') THEN
    CREATE POLICY parsed_docs_select ON storage.objects
      FOR SELECT USING (
        bucket_id = 'parsed-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
