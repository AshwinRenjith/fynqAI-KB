-- Phase 3.1 - Initial schema (PRD §8)

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum types (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE member_role AS ENUM ('admin', 'member');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE document_status AS ENUM (
      'processing', 'chunking', 'embedding',
      'extracting', 'scanning', 'ready', 'error'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_source') THEN
    CREATE TYPE document_source AS ENUM (
      'upload', 'google_drive', 'notion',
      'confluence', 'sharepoint', 'slack'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contradiction_type') THEN
    CREATE TYPE contradiction_type AS ENUM (
      'quantitative', 'policy', 'temporal', 'definitional', 'scope_drift'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contradiction_severity') THEN
    CREATE TYPE contradiction_severity AS ENUM ('critical', 'warning', 'info');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contradiction_status') THEN
    CREATE TYPE contradiction_status AS ENUM ('open', 'resolved', 'dismissed', 'auto_resolved');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    CREATE TYPE message_role AS ENUM ('user', 'assistant');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  source document_source NOT NULL DEFAULT 'upload',
  source_url TEXT,
  raw_storage_path TEXT,
  markdown_storage_path TEXT,
  status document_status DEFAULT 'processing',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  text_search tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  embedding VECTOR(1024),
  chunk_index INTEGER NOT NULL,
  section_header TEXT,
  token_count INTEGER,
  entities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  chunk_a_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  chunk_b_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  document_a_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_b_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_subject TEXT NOT NULL,
  value_a TEXT NOT NULL,
  value_b TEXT NOT NULL,
  contradiction_type contradiction_type NOT NULL,
  confidence FLOAT NOT NULL,
  severity contradiction_severity NOT NULL,
  status contradiction_status DEFAULT 'open',
  auto_resolved BOOLEAN DEFAULT FALSE,
  authoritative_chunk_id UUID REFERENCES chunks(id),
  resolution_note TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chunk_a_id, chunk_b_id)
);

CREATE TABLE IF NOT EXISTS contradiction_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contradiction_id UUID NOT NULL REFERENCES contradictions(id) ON DELETE CASCADE,
  notify_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  had_contradiction BOOLEAN DEFAULT FALSE,
  contradiction_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_chunks_text_search ON chunks USING GIN (text_search);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_workspace_id ON chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_workspace_status ON contradictions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_contradictions_chunks ON contradictions(chunk_a_id, chunk_b_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_documents ON contradictions(document_a_id, document_b_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unseen ON contradiction_notifications(notify_user_id, seen) WHERE seen = FALSE;
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, workspace_id);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION user_in_workspace(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_is_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'workspaces_select') THEN
    CREATE POLICY workspaces_select ON workspaces FOR SELECT USING (user_in_workspace(id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'workspaces_insert') THEN
    CREATE POLICY workspaces_insert ON workspaces FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspace_members' AND policyname = 'members_select') THEN
    CREATE POLICY members_select ON workspace_members FOR SELECT USING (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspace_members' AND policyname = 'members_insert') THEN
    CREATE POLICY members_insert ON workspace_members FOR INSERT WITH CHECK (user_is_admin(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_select') THEN
    CREATE POLICY documents_select ON documents FOR SELECT USING (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_insert') THEN
    CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_delete') THEN
    CREATE POLICY documents_delete ON documents FOR DELETE USING (user_is_admin(workspace_id) OR uploaded_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chunks' AND policyname = 'chunks_select') THEN
    CREATE POLICY chunks_select ON chunks FOR SELECT USING (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contradictions' AND policyname = 'contradictions_select') THEN
    CREATE POLICY contradictions_select ON contradictions FOR SELECT USING (user_in_workspace(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contradictions' AND policyname = 'contradictions_update') THEN
    CREATE POLICY contradictions_update ON contradictions FOR UPDATE USING (user_is_admin(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contradiction_notifications' AND policyname = 'notifications_select') THEN
    CREATE POLICY notifications_select ON contradiction_notifications FOR SELECT USING (notify_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contradiction_notifications' AND policyname = 'notifications_update') THEN
    CREATE POLICY notifications_update ON contradiction_notifications FOR UPDATE USING (notify_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_sessions' AND policyname = 'chat_sessions_select') THEN
    CREATE POLICY chat_sessions_select ON chat_sessions FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_sessions' AND policyname = 'chat_sessions_insert') THEN
    CREATE POLICY chat_sessions_insert ON chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'chat_messages_select') THEN
    CREATE POLICY chat_messages_select ON chat_messages
      FOR SELECT USING (
        session_id IN (
          SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
