# Product Requirements Document
# fynqAI — AI Intelligence Layer for Business Knowledge

**Version:** 2.0  
**Status:** Ready for Development  
**Target:** Demo build (10–100 docs) → Production scalable  
**IDE:** Antigravity AI IDE (Vibe Coding)  
**Last Updated:** 2025  
**AI Stack:** LlamaParse (parsing) · Mistral Embed (embeddings) · Gemini 2.5 Flash (LLM)

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core Value Proposition](#2-core-value-proposition)
3. [User Personas](#3-user-personas)
4. [Feature Requirements](#4-feature-requirements)
5. [High-Level Architecture](#5-high-level-architecture)
6. [Low-Level Architecture](#6-low-level-architecture)
7. [Tech Stack](#7-tech-stack)
8. [Database Schema](#8-database-schema)
9. [Data Workflow](#9-data-workflow)
10. [Contradiction Agent Layer](#10-contradiction-agent-layer)
11. [AI Query Layer](#11-ai-query-layer)
12. [UI/UX Workflow](#12-uiux-workflow)
13. [Component Architecture](#13-component-architecture)
14. [API Design](#14-api-design)
15. [File Structure](#15-file-structure)
16. [Environment Variables](#16-environment-variables)
17. [MVP Build Scope](#17-mvp-build-scope)
18. [Demo Script](#18-demo-script)
19. [Workspace Bootstrap Flow](#19-workspace-bootstrap-flow-auth--onboarding)
20. [Supabase Storage Bucket Setup](#20-supabase-storage-bucket-setup)
21. [Middleware — Route Protection](#21-middleware--route-protection)
22. [Token Counting for Chunking](#22-token-counting-for-chunking)

---

## 1. Product Vision

fynqAI is an AI-powered knowledge intelligence layer for businesses. It connects to a company's existing document systems, ingests all their knowledge, and provides an AI assistant that answers questions with precise citations from source documents.

The core differentiator is a **background Contradiction Agent** that continuously audits the entire knowledge base for conflicting information across documents — flagging inconsistencies to admins before the AI gives a wrong answer.

**In one sentence:** It is the difference between an AI that confidently answers wrong and one that knows when it doesn't know.

---

## 2. Core Value Proposition

| Problem | fynqAI's Solution |
|---|---|
| AI hallucinates or blends contradictory sources | Contradiction detection flags conflicts before they reach users |
| "Where did this answer come from?" | Every answer has inline citations with source document links |
| Outdated documents silently corrupt AI answers | Contradiction agent catches stale vs new document conflicts |
| No audit trail for AI-generated answers | Full resolution history and source lineage tracking |
| Company knowledge is siloed across tools | Unified ingestion from all connected sources into one queryable layer |

---

## 3. User Personas

### Persona 1: The Workspace Admin
- Sets up integrations, manages users and documents
- Reviews and resolves contradiction flags
- Sees the full health dashboard of the knowledge base
- Has full access to all documents regardless of source

### Persona 2: The End User (Knowledge Worker)
- Asks questions through the chat interface
- Sees answers with citations
- Sees contradiction warnings when relevant
- Cannot resolve contradictions — must escalate to admin

### Persona 3: The Document Uploader
- Uploads files directly to the system
- Gets notified when their uploaded document causes a contradiction
- Can view but not resolve contradictions without admin role

---

## 4. Feature Requirements

### F1 — Document Ingestion
- **F1.1** User can upload files (PDF, DOCX, TXT, MD) via drag-and-drop UI
- **F1.2** System stores raw file in Supabase Storage
- **F1.3** System converts file to clean Markdown
- **F1.4** System chunks Markdown by section headers
- **F1.5** System embeds each chunk using Mistral mistral-embed model
- **F1.6** System extracts typed entities from each chunk
- **F1.7** Upload shows real-time status: Uploading → Parsing → Analyzing → Ready
- **F1.8** Failed ingestion shows error with reason and retry option

### F2 — AI Chat with Citations
- **F2.1** User types a question in the chat interface
- **F2.2** System performs hybrid search (vector + keyword) against all chunks
- **F2.3** AI generates answer grounded only in retrieved chunks
- **F2.4** Every factual claim in the answer is linked to its source chunk
- **F2.5** User can click a citation to see the exact source text and document
- **F2.6** AI refuses to answer from memory — only from retrieved documents

### F3 — Contradiction Detection
- **F3.1** After every chunk is stored, agent scans for contradictions against existing knowledge base
- **F3.2** Detected contradictions are stored in the contradictions table with full context
- **F3.3** Critical contradictions trigger immediate admin notification
- **F3.4** When a user query hits a contradicted topic, AI surfaces both answers with a warning
- **F3.5** Admin can resolve, dismiss, or mark as different-scope

### F4 — Admin Contradiction Dashboard
- **F4.1** Dashboard shows all open contradictions with severity badges
- **F4.2** Each contradiction card shows: both document names, the conflicting values, the topic
- **F4.3** Side-by-side chunk viewer with full surrounding context
- **F4.4** One-click resolution actions: "Mark A Correct", "Mark B Correct", "Dismiss"
- **F4.5** Resolved contradictions shown in history log with who resolved and when

### F5 — Document Management
- **F5.1** Documents list view showing all ingested files with status
- **F5.2** Document detail page showing extracted entities and chunks
- **F5.3** Delete document (cascades to chunks, triggers re-scan)
- **F5.4** Document source badge (upload, Google Drive, etc.)

### F6 — Authentication & Workspaces
- **F6.1** Email/password auth via Supabase Auth
- **F6.2** Google OAuth login
- **F6.3** Single workspace per account for MVP
- **F6.4** Admin vs Member roles

---

## 5. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│         Next.js 16 App Router — React — TailwindCSS          │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │   Chat   │  │  Upload  │  │ Docs     │  │  Admin   │   │
│   │   UI     │  │   UI     │  │ Manager  │  │Dashboard │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / Supabase Client
┌──────────────────────────▼──────────────────────────────────┐
│                      API LAYER                               │
│              Next.js API Routes (/api/*)                     │
│                                                              │
│  /api/ingest   /api/chat   /api/contradict   /api/resolve   │
└──────┬────────────────┬──────────────────────────────────────┘
       │                │
┌──────▼──────┐  ┌──────▼──────────────────────────────────┐
│  SUPABASE   │  │           AI PROCESSING LAYER            │
│             │  │                                          │
│ • Auth      │  │  Ingestion Pipeline:                     │
│ • Storage   │  │    LlamaParse → Markdown                    │
│ • Postgres  │  │    Mistral → Embeddings                   │
│ • pgvector  │  │    Gemini 2.5 Flash → Entity Extraction            │
│ • Realtime  │  │                                          │
└─────────────┘  │  Contradiction Agent:                    │
                 │    Entity Matching                        │
                 │    Confidence Scoring                     │
                 │    Flag & Notify                          │
                 │                                          │
                 │  Query Pipeline:                          │
                 │    Hybrid Search                          │
                 │    Gemini 2.5 Flash → Grounded Answer               │
                 │    Citation Builder                       │
                 └──────────────────────────────────────────┘
```

---

## 6. Low-Level Architecture

### 6.1 Ingestion Pipeline — Step by Step

```
Step 1: FILE UPLOAD
  Client → multipart/form-data POST to /api/ingest/upload
  Server validates: file type (PDF/DOCX/TXT/MD), file size (max 50MB)
  Server uploads raw file to Supabase Storage bucket: "raw-documents/{workspace_id}/{uuid}.{ext}"
  Server creates document record in DB with status: 'processing'
  Server returns document_id to client immediately
  Client begins polling /api/ingest/status/{document_id} every 2 seconds

Step 2: MARKDOWN CONVERSION
  Server pulls raw file from Supabase Storage
  Routes to parser based on file type:
    PDF → LlamaParse API (handles complex tables, multi-column)
    DOCX → mammoth.js (Node library, no external API needed)
    TXT/MD → pass-through, minimal cleaning
  Output: clean Markdown string
  Server saves .md file to Supabase Storage: "parsed-documents/{workspace_id}/{uuid}.md"
  Updates document.status → 'chunking'

Step 3: CHUNKING
  Load the Markdown string
  Split on header boundaries (## and ###) using regex
  Minimum chunk size: 150 tokens. If a section is under 150 tokens, merge with next.
  Maximum chunk size: 800 tokens. If a section exceeds 800 tokens, split at paragraph boundaries.
  Each chunk stores: text, chunk_index, section_header (the ## that preceded it)
  Updates document.status → 'embedding'

Step 4: EMBEDDING
  For each chunk, call Mistral API with model: mistral-embed
  Batch in groups of 20 chunks per API call to minimize latency
  Store embedding vector (1024 dimensions) in chunks table
  Updates document.status → 'extracting'

Step 5: ENTITY EXTRACTION
  For each chunk, call Mistral Small (mistral-small-latest)
  Prompt instructs: extract entities as strict JSON (see Section 10)
  Use response_mime_type: "application/json" in Gemini config for guaranteed JSON output
  Store entities as JSONB array in chunks.entities column
  Updates document.status → 'scanning'

Step 6: CONTRADICTION SCAN
  Trigger contradiction agent for this document (see Section 10)
  Updates document.status → 'ready' when scan completes
  Triggers Supabase Realtime event → client stops polling, shows 'Ready'
```

### 6.2 Query Pipeline — Step by Step

```
Step 1: USER SUBMITS QUESTION
  Client sends POST /api/chat with: { query, session_id, workspace_id }
  Conversation history: fetch last 6 messages from chat_messages WHERE session_id = $session_id
  Format for Gemini: array of { role: "user"|"model", parts: [{ text }] }
  Always append current query as the last user turn
  Cap history at 6 messages (3 exchanges) to control token usage

Step 2: HYBRID RETRIEVAL
  Dense search: embed query with Mistral mistral-embed model
    Run pgvector cosine similarity search → top 30 chunks
  Keyword search: extract key terms from query
    Run PostgreSQL full-text search (tsvector) against chunks.text → top 20 results
  Merge and deduplicate, rank by combined score → final top 10 chunks

Step 3: CONTRADICTION CHECK
  For each of the top 10 chunks, query contradictions table:
    SELECT * FROM contradictions
    WHERE (chunk_a_id = ANY($chunk_ids) OR chunk_b_id = ANY($chunk_ids))
    AND status = 'open'
    AND severity IN ('critical', 'warning')
  If contradictions found: set response_mode = 'conflicted'
  If no contradictions: set response_mode = 'normal'

Step 4: CONTEXT ASSEMBLY
  Build context block for Gemini:
    For each retrieved chunk:
      [SOURCE {index}: {document_name} — {section_header}]
      {chunk_text}
      ---

Step 5: GEMINI ANSWER GENERATION
  Use generateContentStream() for token-by-token streaming.
  Prompt instructs Gemini to:
    Answer ONLY from the provided sources
    Cite every factual claim using [SOURCE N] inline markers
    If response_mode = 'conflicted': surface both conflicting answers explicitly
    Never use prior knowledge — if answer not in sources, say so

Step 6: CITATION PARSING
  Parse Gemini's response for [SOURCE N] markers
  Replace each marker with a rich citation object:
    { index, document_name, section_header, chunk_id, document_id }
  Build final response with inline citations as clickable references

Step 7: STREAM TO CLIENT
  Stream Gemini's response token by token via SSE (Server-Sent Events)
  Send citation metadata as final JSON block after stream ends
```

### 6.3 Contradiction Agent — Step by Step

```
Step 1: ENTITY CANDIDATE EXTRACTION
  For newly ingested chunks with entities, collect all entities where confidence > 0.6

Step 2: VECTOR CANDIDATE MATCHING
  For each entity in the new chunk:
    Run pgvector search filtered to same workspace_id
    Exclude chunks from this same document
    Retrieve top 20 semantically similar chunks
    Filter to chunks where entities[*].subject overlaps with current entity.subject

Step 3: VALUE COMPARISON
  For each candidate pair:
    Normalize units (kg/g, $k/$, days/weeks, %, etc.)
    Compare normalized values
    If values are identical → skip (not a contradiction)
    If scopes are disjoint (e.g. EU vs US) → skip (Scope Drift)
    If new doc is newer AND contains supersession language → auto-resolve

Step 4: CONFIDENCE SCORING
  Calculate score 0–1:
    subject_match_strength × 0.35
    value_divergence_score × 0.30
    scope_collision_score × 0.20
    temporal_recency_score × 0.15

Step 5: THRESHOLD DECISION
  Score ≥ 0.70 → severity: 'critical' → flag, notify admin immediately
  Score 0.50–0.69 → severity: 'warning' → flag, add to daily digest
  Score < 0.50 → suppress, do not write to DB

Step 6: WRITE & NOTIFY
  INSERT into contradictions table (check UNIQUE constraint first)
  INSERT into contradiction_notifications for workspace admin
  Emit Supabase Realtime event on contradictions channel
  Admin UI badge increments in real time
```

---

## 7. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 (App Router) | Full-stack React framework |
| React | 19 | UI component library |
| TypeScript | 5.x | Type safety throughout |
| TailwindCSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Pre-built accessible components |
| Framer Motion | Latest | Animations and transitions |
| Zustand | Latest | Client-side state management |
| React Query (TanStack) | Latest | Server state, caching, polling |
| Lucide React | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Next.js API Routes | 16 | API endpoints |
| Supabase JS Client | Latest | Database, auth, storage, realtime |
| Mistral AI SDK | Latest | Embeddings (mistral-embed model) |
| Google Generative AI SDK | Latest | Gemini 2.5 Flash — entity extraction + chat answers |
| LlamaParse | API | PDF-to-Markdown conversion (primary parser) |
| mammoth | Latest | DOCX-to-HTML-to-Markdown |

### Infrastructure
| Technology | Purpose |
|---|---|
| Supabase | Database (PostgreSQL + pgvector), Auth, Storage, Realtime |
| Vercel | Frontend + API deployment |
| Supabase Storage | Raw files + parsed Markdown files |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL 15 | Primary relational database |
| pgvector | Vector similarity search extension |
| Full-text search (tsvector) | Keyword search on chunks |

---

## 8. Database Schema

### Complete SQL — Run in Supabase SQL Editor

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================
CREATE TYPE member_role AS ENUM ('admin', 'member');

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TYPE document_status AS ENUM (
  'processing', 'chunking', 'embedding',
  'extracting', 'scanning', 'ready', 'error'
);

CREATE TYPE document_source AS ENUM (
  'upload', 'google_drive', 'notion',
  'confluence', 'sharepoint', 'slack'
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,           -- 'pdf' | 'docx' | 'txt' | 'md'
  file_size_bytes BIGINT,
  source document_source NOT NULL DEFAULT 'upload',
  source_url TEXT,                    -- external link if from integration
  raw_storage_path TEXT,              -- Supabase Storage path
  markdown_storage_path TEXT,         -- Supabase Storage path
  status document_status DEFAULT 'processing',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHUNKS
-- ============================================================
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  text_search tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  embedding VECTOR(1024),             -- Mistral mistral-embed = 1024 dimensions
  chunk_index INTEGER NOT NULL,
  section_header TEXT,               -- the ## heading above this chunk
  token_count INTEGER,
  entities JSONB DEFAULT '[]',       -- array of extracted entity objects
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRADICTIONS
-- ============================================================
CREATE TYPE contradiction_type AS ENUM (
  'quantitative', 'policy', 'temporal', 'definitional', 'scope_drift'
);

CREATE TYPE contradiction_severity AS ENUM ('critical', 'warning', 'info');

CREATE TYPE contradiction_status AS ENUM (
  'open', 'resolved', 'dismissed', 'auto_resolved'
);

CREATE TABLE contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  chunk_a_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  chunk_b_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  document_a_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_b_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_subject TEXT NOT NULL,      -- what topic the contradiction is about
  value_a TEXT NOT NULL,             -- what document A says
  value_b TEXT NOT NULL,             -- what document B says
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

-- ============================================================
-- CONTRADICTION NOTIFICATIONS
-- ============================================================
CREATE TABLE contradiction_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contradiction_id UUID NOT NULL REFERENCES contradictions(id) ON DELETE CASCADE,
  notify_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,                        -- auto-generated from first message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',      -- array of citation objects with chunk_id refs
  had_contradiction BOOLEAN DEFAULT FALSE,
  contradiction_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Vector similarity search (core search index)
CREATE INDEX idx_chunks_embedding
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);  -- Use 10 for MVP (<50k chunks). Increase to 100 when you have >50k chunks.

-- Full-text keyword search
CREATE INDEX idx_chunks_text_search
  ON chunks USING GIN (text_search);

-- Lookup chunks by document
CREATE INDEX idx_chunks_document_id ON chunks(document_id);

-- Lookup chunks by workspace (for contradiction scan filtering)
CREATE INDEX idx_chunks_workspace_id ON chunks(workspace_id);

-- Contradiction lookups
CREATE INDEX idx_contradictions_workspace_status
  ON contradictions(workspace_id, status);

CREATE INDEX idx_contradictions_chunks
  ON contradictions(chunk_a_id, chunk_b_id);

CREATE INDEX idx_contradictions_documents
  ON contradictions(document_a_id, document_b_id);

-- Notification lookups
CREATE INDEX idx_notifications_user_unseen
  ON contradiction_notifications(notify_user_id, seen)
  WHERE seen = FALSE;

-- Documents by workspace
CREATE INDEX idx_documents_workspace_id ON documents(workspace_id);

-- Chat sessions by user
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, workspace_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user belongs to a workspace
CREATE OR REPLACE FUNCTION user_in_workspace(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if current user is admin of a workspace
CREATE OR REPLACE FUNCTION user_is_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- WORKSPACES: users can only see workspaces they belong to
CREATE POLICY workspaces_select ON workspaces
  FOR SELECT USING (user_in_workspace(id));

CREATE POLICY workspaces_insert ON workspaces
  FOR INSERT WITH CHECK (TRUE); -- anyone can create a workspace (triggers bootstrap)

-- WORKSPACE_MEMBERS: members can see their own workspace members
CREATE POLICY members_select ON workspace_members
  FOR SELECT USING (user_in_workspace(workspace_id));

CREATE POLICY members_insert ON workspace_members
  FOR INSERT WITH CHECK (user_is_admin(workspace_id));

-- DOCUMENTS: workspace members can read, admins/uploaders can write
CREATE POLICY documents_select ON documents
  FOR SELECT USING (user_in_workspace(workspace_id));

CREATE POLICY documents_insert ON documents
  FOR INSERT WITH CHECK (user_in_workspace(workspace_id));

CREATE POLICY documents_delete ON documents
  FOR DELETE USING (user_is_admin(workspace_id) OR uploaded_by = auth.uid());

-- CHUNKS: workspace members can read (needed for search), no direct write from client
CREATE POLICY chunks_select ON chunks
  FOR SELECT USING (user_in_workspace(workspace_id));

-- CONTRADICTIONS: workspace members can read, only admins can update (resolve)
CREATE POLICY contradictions_select ON contradictions
  FOR SELECT USING (user_in_workspace(workspace_id));

CREATE POLICY contradictions_update ON contradictions
  FOR UPDATE USING (user_is_admin(workspace_id));

-- CONTRADICTION_NOTIFICATIONS: users see only their own notifications
CREATE POLICY notifications_select ON contradiction_notifications
  FOR SELECT USING (notify_user_id = auth.uid());

CREATE POLICY notifications_update ON contradiction_notifications
  FOR UPDATE USING (notify_user_id = auth.uid()); -- mark as seen

-- CHAT_SESSIONS: users see only their own sessions
CREATE POLICY chat_sessions_select ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY chat_sessions_insert ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- CHAT_MESSAGES: users see messages from their own sessions
CREATE POLICY chat_messages_select ON chat_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );
```

### Entity JSON Schema (stored in chunks.entities)

```json
[
  {
    "type": "QUANTITY | DATE | PRICE | POLICY_RULE | DEFINITION | PERSON | PRODUCT",
    "value": "10kg",
    "normalized_value": { "amount": 10, "unit": "kg" },
    "subject": "minimum order weight",
    "scope": "domestic orders",
    "confidence": 0.92
  }
]
```

### Citation JSON Schema (stored in chat_messages.citations)

```json
[
  {
    "index": 1,
    "chunk_id": "uuid",
    "document_id": "uuid",
    "document_name": "Supplier Agreement 2024.pdf",
    "section_header": "## Delivery Terms",
    "excerpt": "First 150 chars of chunk text...",
    "storage_url": "https://..."
  }
]
```

---

## 9. Data Workflow

### 9.1 Upload Flow

```
[User drags file onto upload zone]
         │
         ▼
Client validates: type (PDF/DOCX/TXT/MD), size (<50MB)
         │
         ▼
POST /api/ingest/upload
  → Upload raw file to Supabase Storage
  → INSERT documents row (status: 'processing')
  → Return { document_id }
         │
         ▼
Client subscribes to Supabase Realtime on documents table
Filters by: id = document_id
Shows progress bar polling status field
         │
         ▼
Server kicks off ingestion pipeline using Next.js streaming response to avoid timeout:
  IMPORTANT: Add this export to /api/ingest/upload/route.ts to extend timeout:
    export const maxDuration = 120; // 120 seconds — requires Vercel Pro
  For Hobby plan: use Supabase Edge Function instead (no timeout limit)
  Pipeline runs synchronously inside a streaming Response to keep connection alive:
  status → 'chunking'   [Parse to Markdown]
  status → 'embedding'  [Chunk + Embed]
  status → 'extracting' [Entity Extraction]
  status → 'scanning'   [Contradiction Scan]
  status → 'ready'      [Complete]

Pipeline Error Handling — every step follows this pattern:
  try {
    await runStep();
    await updateStatus(documentId, nextStatus);
  } catch (error) {
    await updateStatus(documentId, 'error', error.message);
    return; // STOP — do not continue to next step
  }

  ON FAILURE RULES:
  - Status is set to 'error' with error_message populated
  - No retry is attempted automatically (user must re-upload for MVP)
  - Chunks already written ARE deleted on failure (cascades from document delete)
  - Client receives Realtime update: status = 'error', shows error banner with message
  - Common errors to handle explicitly:
      LlamaParse timeout → "PDF parsing timed out. Try a smaller file."
      Gemini rate limit  → "AI extraction rate limit hit. Wait 60s and retry."
      Embedding failure  → "Embedding service unavailable. Retry in a moment."
         │
         ▼
Client receives Realtime update: status = 'ready'
Progress bar completes, document appears in Documents list
```

### 9.2 Chat Flow

```
[User types question and presses Enter]
         │
         ▼
POST /api/chat/stream
  Body: { query, session_id, workspace_id }
         │
         ▼
Server: embed query → pgvector search → full-text search → merge results
         │
         ▼
Server: check contradictions for retrieved chunk IDs
         │
    ┌────┴────┐
  Clean    Contradicted
    │           │
    ▼           ▼
Normal    Build conflict
prompt    context prompt
    │           │
    └────┬──────┘
         │
         ▼
Gemini streams response via SSE to client
Client renders tokens in real-time
         │
         ▼
Stream ends → server sends citation metadata as final event
Client renders inline citation chips on the completed message
         │
         ▼
INSERT chat_messages (user message + assistant message with citations)
```

### 9.3 Contradiction Resolution Flow

```
[Admin clicks contradiction card]
         │
         ▼
GET /api/contradictions/{id}
Returns: full contradiction + both chunks with surrounding context + document metadata
         │
         ▼
Admin sees side-by-side view
Clicks: "Mark A Correct" | "Mark B Correct" | "Dismiss"
         │
         ▼
POST /api/contradictions/{id}/resolve
  Body: { action, resolution_note }
         │
         ▼
Server:
  UPDATE contradictions SET status = 'resolved', authoritative_chunk_id = ..., resolved_by = ..., resolved_at = NOW()
  UPDATE contradiction_notifications SET seen = TRUE
  Log resolution to document metadata
         │
         ▼
Supabase Realtime event fires
Admin dashboard badge decrements
Future AI queries on this topic use authoritative chunk only
```

---

## 10. Contradiction Agent Layer

### 10.1 Entity Extraction — Mistral Implementation

Mistral supports structured JSON output via response format controls, enabling reliable schema-constrained extraction without markdown wrappers.

```typescript
// lib/ai/extract.ts
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// Thinking budgets — tune per operation for speed vs accuracy tradeoff
// 0 = thinking off (fast + cheap), higher number = deeper reasoning
export const THINKING_BUDGETS = {
  entity_extraction:      0,     // structured JSON — no reasoning needed, max speed
  contradiction_score:    1024,  // light reasoning for borderline pairs
  chat_answer:            2048,  // accurate, grounded, admits uncertainty
  contradiction_verify:   8192,  // careful deliberation before flagging a conflict
};

export async function extractEntities(chunkText: string) {
  const response = await mistral.chat.complete({
    model: "mistral-small-latest",
    temperature: 0,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: "Extract structured entities and return strict JSON." },
      { role: "user", content: prompt },
    ],
  });

  const prompt = `
You are a structured entity extractor for a business document system.
Extract all typed entities from the chunk below.

Return a JSON object with this exact schema:
{
  "entities": [
    {
      "type": "QUANTITY | DATE | PRICE | POLICY_RULE | DEFINITION | PERSON | PRODUCT",
      "value": "<exact value as written>",
      "normalized_value": "<standardized form as object>",
      "subject": "<what this value applies to — be specific>",
      "scope": "<limiting context if any, else null>",
      "confidence": <0.0 to 1.0>
    }
  ]
}

Normalization rules:
- QUANTITY: { "amount": number, "unit": "kg|g|l|ml|m|km|units" }
- DATE: { "iso": "YYYY-MM-DD", "relative": "original text" }
- PRICE: { "amount": number, "currency": "USD|EUR|INR|etc" }
- POLICY_RULE: { "rule": "text of the rule" }
- DEFINITION: { "term": "word", "definition": "meaning" }

Document chunk:
"""
${chunkText}
"""
  `;

  const result = await model.generateContent(prompt);
  const json = JSON.parse(result.response.text());
  return json.entities ?? [];
}
```

### 10.2 Mistral Embedding Implementation

```typescript
// lib/ai/embed.ts
import MistralClient from "@mistralai/mistralai";

const mistral = new MistralClient(process.env.MISTRAL_API_KEY!);

export async function embedChunks(texts: string[]): Promise<number[][]> {
  const response = await mistral.embeddings({
    model: "mistral-embed",
    input: texts,                     // batch up to 20 at a time
  });
  return response.data.map((d) => d.embedding);  // 1024-dim vectors
}

export async function embedQuery(query: string): Promise<number[]> {
  const response = await mistral.embeddings({
    model: "mistral-embed",
    input: [query],
  });
  return response.data[0].embedding;
}
```

### 10.3 Contradiction Scoring Algorithm

```typescript
interface EntityPair {
  entityA: Entity;
  entityB: Entity;
  docA: Document;
  docB: Document;
}

function scoreContradiction(pair: EntityPair): number {
  let score = 0;

  // 1. Subject match strength (0.35 weight)
  const subjectSimilarity = cosineSimilarity(
    embed(pair.entityA.subject),
    embed(pair.entityB.subject)
  );
  score += subjectSimilarity * 0.35;

  // 2. Value divergence (0.30 weight)
  // For quantities: percentage difference
  // For policy rules: semantic dissimilarity
  const valueDivergence = computeValueDivergence(
    pair.entityA.normalized_value,
    pair.entityB.normalized_value
  );
  score += valueDivergence * 0.30;

  // 3. Scope collision (0.20 weight)
  // 0 = scopes are disjoint (not a contradiction)
  // 1 = scopes overlap or are identical
  const scopeCollision = computeScopeCollision(
    pair.entityA.scope,
    pair.entityB.scope
  );
  score += scopeCollision * 0.20;

  // 4. Temporal recency (0.15 weight)
  // If one document is significantly newer, lower the score
  // (expected that newer doc has different values)
  const ageGapDays = Math.abs(
    daysBetween(pair.docA.created_at, pair.docB.created_at)
  );
  const temporalPenalty = ageGapDays > 180 ? 0.3 : 0;
  score += (1 - temporalPenalty) * 0.15;

  return Math.min(Math.max(score, 0), 1);
}

// Unit normalization before value comparison
function normalizeToBaseUnit(entity: Entity): number | null {
  const unitMap = {
    g: 0.001, kg: 1, t: 1000,       // weight to kg
    ml: 0.001, l: 1,                  // volume to liters
    cm: 0.01, m: 1, km: 1000,         // distance to meters
    days: 1, weeks: 7, months: 30,    // time to days
  };
  if (entity.normalized_value?.amount && entity.normalized_value?.unit) {
    const factor = unitMap[entity.normalized_value.unit] ?? 1;
    return entity.normalized_value.amount * factor;
  }
  return null;
}
```

### 10.4 False Positive Filters (Applied in Order)

```
Filter 1: Unit Normalization
  1000g == 1kg → NOT a contradiction
  Implementation: normalize to base unit before numeric comparison

Filter 2: Scope Disjoint
  Entity A scope: "EU customers"
  Entity B scope: "US customers"
  Scopes are disjoint → suppress
  Implementation: embed both scopes, if cosine similarity < 0.4 → suppress

Filter 3: Identical Value
  After normalization, if values are equal → suppress
  Implementation: Math.abs(normalizedA - normalizedB) < 0.01 → suppress

Filter 4: Duplicate Check
  PostgreSQL UNIQUE(chunk_a_id, chunk_b_id) constraint
  INSERT ... ON CONFLICT DO NOTHING
```

---

## 11. AI Query Layer

### 11.1 Chat Implementation — Mistral Streaming

```typescript
// lib/ai/chat.ts
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export async function* streamAnswer(
  query: string,
  contextChunks: Chunk[],
  hasContradiction: boolean,
  contradictionData?: ContradictionData
) {
  const stream = await mistral.chat.stream({
    model: "mistral-small-latest",
    temperature: hasContradiction ? 0 : 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const contextBlock = contextChunks
    .map((c, i) => `[SOURCE ${i + 1}: ${c.document_name} — ${c.section_header}]\n${c.text}`)
    .join("\n---\n");

  const systemPrompt = hasContradiction
    ? CONTRADICTION_PROMPT(contradictionData!)
    : NORMAL_PROMPT;

  const fullPrompt = `${systemPrompt}\n\nSOURCE DOCUMENTS:\n${contextBlock}\n\nUser question: ${query}`;

  const result = await model.generateContentStream(fullPrompt);

  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}
```

### 11.2 Normal Query Prompt

```
You are an intelligent knowledge assistant for a business.
Answer questions using ONLY the source documents provided below.
Do not use any knowledge from your training.

CRITICAL RULES:
1. Every factual claim must be cited using [SOURCE N] inline
2. If the answer is not in the sources, say: "I couldn't find this in your knowledge base."
3. Never guess or infer beyond what is written in the sources
4. Be concise and direct

SOURCE DOCUMENTS:
{CONTEXT_BLOCK}

User question: {QUERY}
```

### 11.3 Contradiction-Aware Query Prompt

```
You are an intelligent knowledge assistant. A conflict has been detected in
the knowledge base regarding the topic of this question.

CRITICAL: You must present BOTH conflicting answers and cannot pick a side.

Conflicting information found:
- [Document A: {doc_a_name}] states: {value_a}
- [Document B: {doc_b_name}] states: {value_b}

Format your response as:
1. Explain that conflicting information was found
2. Present both answers with their source documents
3. Tell the user an admin has been notified to resolve this
4. Do NOT guess which is correct

User question: {QUERY}
```

### 11.4 Hybrid Search SQL

```sql
-- Dense vector search
WITH vector_results AS (
  SELECT
    c.id,
    c.text,
    c.document_id,
    c.section_header,
    c.entities,
    1 - (c.embedding <=> $query_embedding) AS vector_score
  FROM chunks c
  WHERE c.workspace_id = $workspace_id
  ORDER BY c.embedding <=> $query_embedding
  LIMIT 30
),
-- Keyword search
keyword_results AS (
  SELECT
    c.id,
    c.text,
    c.document_id,
    c.section_header,
    c.entities,
    ts_rank(c.text_search, plainto_tsquery('english', $query_text)) AS keyword_score
  FROM chunks c
  WHERE c.workspace_id = $workspace_id
    AND c.text_search @@ plainto_tsquery('english', $query_text)
  LIMIT 20
),
-- Merge with RRF (Reciprocal Rank Fusion)
merged AS (
  SELECT
    COALESCE(v.id, k.id) AS id,
    COALESCE(v.text, k.text) AS text,
    COALESCE(v.document_id, k.document_id) AS document_id,
    COALESCE(v.section_header, k.section_header) AS section_header,
    COALESCE(v.entities, k.entities) AS entities,
    COALESCE(v.vector_score, 0) * 0.7 +
    COALESCE(k.keyword_score, 0) * 0.3 AS combined_score
  FROM vector_results v
  FULL OUTER JOIN keyword_results k ON v.id = k.id
)
SELECT * FROM merged
ORDER BY combined_score DESC
LIMIT 10;
```

---

## 12. UI/UX Workflow

### 12.1 Page Map

```
/                       → Landing page (if not logged in) or redirect to /dashboard
/auth/login             → Login page (email/password + Google OAuth)
/auth/signup            → Signup page
/dashboard              → Main dashboard: recent docs, contradiction count, quick chat
/chat                   → Full chat interface
/chat/{session_id}      → Specific chat session
/documents              → All documents list with status badges
/documents/{id}         → Document detail: chunks, entities, linked contradictions
/admin/contradictions   → Contradiction dashboard (admin only)
/admin/contradictions/{id} → Contradiction detail: side-by-side resolver
/settings               → Workspace settings, integrations, team members
```

### 12.2 Chat Interface Layout

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (240px)          │  CHAT AREA              │
│                           │                         │
│  [+ New Chat]             │  ┌───────────────────┐  │
│                           │  │  Message history  │  │
│  Recent Chats:            │  │                   │  │
│  • Delivery policy Q      │  │  USER: What is    │  │
│  • Supplier pricing       │  │  the min order?   │  │
│  • Refund rules           │  │                   │  │
│                           │  │  AI: The minimum  │  │
│  ─────────────────        │  │  order weight is  │  │
│                           │  │  10kg [¹]         │  │
│  ⚠ 3 Contradictions       │  │                   │  │
│    [View →]               │  │  ¹ Supplier       │  │
│                           │  │  Agreement 2024   │  │
│                           │  │  §Delivery Terms  │  │
│                           │  └───────────────────┘  │
│                           │                         │
│                           │  ┌───────────────────┐  │
│                           │  │ Type a question.. │  │
│                           │  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 12.3 Contradiction Warning in Chat

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Conflicting Information Detected                    │
│                                                         │
│  I found contradictory answers to your question about   │
│  minimum order weight:                                  │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ 📄 Supplier Agreement│  │ 📄 Operations Manual    │  │
│  │    2024.pdf          │  │    v2.docx              │  │
│  │                      │  │                         │  │
│  │    "10 kg minimum    │  │    "50 kg minimum       │  │
│  │    for all orders"   │  │    for bulk orders"     │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                                                         │
│  I cannot determine which is correct. An admin has      │
│  been notified to resolve this conflict.                │
│                                                         │
│  [View in Admin Dashboard →]                            │
└─────────────────────────────────────────────────────────┘
```

### 12.4 Contradiction Resolution Card (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL — Minimum Order Weight                          │
│  Detected 2 hours ago • Not yet resolved                     │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────┐  │
│  │  Document A            │  │  Document B                │  │
│  │  Supplier Agreement    │  │  Operations Manual v2      │  │
│  │  Uploaded Jan 15, 2024 │  │  Uploaded Mar 2, 2024      │  │
│  │                        │  │                            │  │
│  │  ...for all domestic   │  │  ...all bulk domestic      │  │
│  │  orders, the MINIMUM   │  │  orders require a MINIMUM  │  │
│  │  ORDER WEIGHT IS 10KG  │  │  ORDER WEIGHT OF 50KG      │  │
│  │  unless...             │  │  per shipment...           │  │
│  └────────────────────────┘  └────────────────────────────┘  │
│                                                              │
│  AI Suggestion: Document B is newer (Mar 2024 vs Jan 2024).  │
│  Consider marking B as authoritative unless A is a signed    │
│  contract that supersedes internal manuals.                  │
│                                                              │
│  Resolution note (optional): ________________________        │
│                                                              │
│  [✓ Mark A Correct]  [✓ Mark B Correct]  [✕ Dismiss]        │
└──────────────────────────────────────────────────────────────┘
```

### 12.5 Document Upload UI State Machine

```
States:
  IDLE         → Drop zone visible, browse button
  DRAGGING     → Drop zone highlighted with blue border
  UPLOADING    → Progress bar 0–30% (file transfer to Supabase)
  PARSING      → Progress bar 30–50% (Markdown conversion)
  EMBEDDING    → Progress bar 50–70% (chunking + embeddings)
  EXTRACTING   → Progress bar 70–85% (entity extraction)
  SCANNING     → Progress bar 85–99% (contradiction scan)
  READY        → Green checkmark, document appears in list
  ERROR        → Red banner with error message + retry button
```

---

## 13. Component Architecture

### 13.1 Component Tree

```
app/
├── layout.tsx                    ← Root layout, providers
├── page.tsx                      ← Landing / redirect
├── auth/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── dashboard/
│   ├── layout.tsx                ← Sidebar + top nav
│   └── page.tsx                  ← Dashboard home
├── chat/
│   ├── page.tsx                  ← New chat
│   └── [sessionId]/page.tsx      ← Existing session
├── documents/
│   ├── page.tsx                  ← Documents list
│   └── [documentId]/page.tsx     ← Document detail
└── admin/
    └── contradictions/
        ├── page.tsx              ← Contradictions list
        └── [id]/page.tsx         ← Contradiction resolver

components/
├── chat/
│   ├── ChatInterface.tsx         ← Full chat layout
│   ├── MessageList.tsx           ← Scrollable message history
│   ├── MessageBubble.tsx         ← Single message with citations
│   ├── CitationChip.tsx          ← Inline citation badge [¹]
│   ├── CitationPanel.tsx         ← Expanded citation sidebar
│   ├── ContradictionWarning.tsx  ← ⚠ conflict banner in chat
│   └── ChatInput.tsx             ← Text input + send button
├── documents/
│   ├── DocumentList.tsx          ← Table of all docs
│   ├── DocumentCard.tsx          ← Single doc row/card
│   ├── DocumentStatus.tsx        ← Status badge with progress
│   ├── UploadZone.tsx            ← Drag-and-drop upload area
│   └── DocumentUploadItem.tsx    ← Individual upload progress
├── contradictions/
│   ├── ContradictionDashboard.tsx ← List + filters
│   ├── ContradictionCard.tsx      ← Summary card
│   ├── ContradictionResolver.tsx  ← Full side-by-side view
│   └── ContradictionBadge.tsx     ← 🔴/🟡 severity badge
├── layout/
│   ├── Sidebar.tsx               ← Left nav
│   ├── TopNav.tsx                ← Top bar with user menu
│   └── NotificationBell.tsx      ← Bell icon with badge count
└── ui/
    └── (shadcn components)
```

### 13.2 Key State Management (Zustand)

```typescript
// stores/workspace.store.ts
interface WorkspaceStore {
  workspaceId: string | null;
  role: 'admin' | 'member' | null;
  openContradictionCount: number;
  setWorkspace: (id: string, role: string) => void;
  incrementContradictions: () => void;
  decrementContradictions: () => void;
}

// stores/chat.store.ts
interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  setActiveSession: (id: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeMessage: (citations: Citation[]) => void;
}
```

---

## 14. API Design

### POST /api/ingest/upload
```
Request: multipart/form-data
  file: File

Response: 200 (text/event-stream)
  Header: X-Document-Id: <uuid>
  Body: streaming response used to keep the connection alive while ingestion runs

Client contract:
  1. Read `X-Document-Id` from response headers
  2. Subscribe to status updates via `/api/ingest/status/:document_id` or Supabase Realtime
```

### GET /api/ingest/status/:document_id
```
Response: 200
  {
    document_id: string,
    status: document_status,
    chunk_count: number,
    contradiction_count: number,
    error_message: string | null
  }
```

### POST /api/chat/stream
```
Request: application/json
  {
    query: string,
    session_id: string | null,
    workspace_id: string
  }

Response: text/event-stream (SSE)
  event: token        data: "partial response text"
  event: token        data: "more text"
  event: citations    data: JSON array of citation objects
  event: contradiction data: JSON array of contradiction objects (if any)
  event: done         data: { session_id, message_id }
```

### GET /api/contradictions
```
Query params: workspace_id, status, severity, page, limit

Response: 200
  {
    contradictions: Contradiction[],
    total: number,
    open_count: number
  }
```

### GET /api/contradictions/:id
```
Response: 200
  {
    contradiction: {
      id, entity_subject, value_a, value_b,
      contradiction_type, severity, status, confidence,
      created_at, resolved_at, resolution_note,
      resolved_by_user: { email },
      chunk_a: {
        id, text, section_header,
        document: { id, name, source, created_at, uploaded_by_user: { email } }
      },
      chunk_b: {
        id, text, section_header,
        document: { id, name, source, created_at, uploaded_by_user: { email } }
      }
    }
  }
```

### POST /api/contradictions/:id/resolve
```
Request: application/json
  {
    action: 'mark_a' | 'mark_b' | 'dismiss',
    resolution_note: string | null
  }

Response: 200
  { contradiction_id, status: 'resolved' | 'dismissed' }
```

### DELETE /api/documents/:id
```
Response: 200
  { deleted: true, chunks_removed: number }
```

---

## 15. File Structure

```
fynqai/
├── app/                          ← Next.js App Router
│   ├── api/
│   │   ├── ingest/
│   │   │   ├── upload/route.ts
│   │   │   └── status/[id]/route.ts
│   │   ├── chat/
│   │   │   └── stream/route.ts
│   │   ├── contradictions/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── resolve/route.ts
│   │   └── documents/
│   │       └── [id]/route.ts
│   └── (pages as above)
├── components/                   ← React components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← Browser client
│   │   ├── server.ts             ← Server client (cookies)
│   │   └── middleware.ts         ← Auth middleware
│   ├── ai/
│   │   ├── embed.ts              ← Mistral embedding calls
│   │   ├── extract.ts            ← Gemini entity extraction
│   │   ├── chat.ts               ← Gemini query + streaming
│   │   └── prompts.ts            ← All prompt templates
│   ├── ingestion/
│   │   ├── parse.ts              ← PDF/DOCX → Markdown
│   │   ├── chunk.ts              ← Markdown → chunks
│   │   └── pipeline.ts           ← Full ingestion orchestration
│   ├── contradiction/
│   │   ├── agent.ts              ← Main contradiction scan
│   │   ├── score.ts              ← Confidence scoring
│   │   ├── normalize.ts          ← Unit normalization
│   │   └── notify.ts             ← Notification creation
│   └── search/
│       └── hybrid.ts             ← Vector + keyword search
├── stores/                       ← Zustand stores
├── types/                        ← TypeScript interfaces
│   ├── database.types.ts         ← Generated from Supabase
│   └── app.types.ts              ← Application-level types
├── hooks/
│   ├── useContradictions.ts
│   ├── useDocuments.ts
│   └── useChat.ts
├── middleware.ts                  ← Next.js auth middleware
├── .env.local                    ← Environment variables
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 16. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mistral AI (embeddings)
# Get free key at: console.mistral.ai
MISTRAL_API_KEY=your-mistral-api-key

# Mistral AI (entity extraction + chat answers)
# Get key at: console.mistral.ai
MISTRAL_API_KEY=your-mistral-api-key

# LlamaParse (PDF parsing)
# Get free key at: cloud.llamaindex.ai — 1000 pages/day free
LLAMA_CLOUD_API_KEY=llx-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Free Tier Limits Reference

| Service | Free Limit | Notes |
|---|---|---|
| **LlamaParse** | 1,000 pages/day | Plenty for demo + early users |
| **Mistral Embed** | Free tier available | ~500M tokens/month on free |
| **Gemini 2.5 Flash** | 15 RPM / 1M TPM / 1,500 req/day | Very generous, enough for serious usage |
| **Supabase** | 500MB DB / 1GB storage / 2GB bandwidth | More than enough for MVP |

---

## 17. MVP Build Scope

### In Scope for Demo Build
- File upload (PDF, DOCX, TXT)
- Markdown parsing via LlamaParse (PDF) + mammoth (DOCX)
- Chunking + embedding via Mistral mistral-embed
- Entity extraction via Gemini 2.5 Flash
- Contradiction detection (Quantitative + Policy types only)
- Chat with citations (normal + contradiction-aware responses)
- Contradiction dashboard with resolver
- Basic auth (email/password via Supabase)
- Single workspace

### Out of Scope for Demo
- Google Drive / Notion integrations
- Multi-workspace / multi-tenant
- Email/Slack notifications (in-app only)
- Document versioning
- Source authority scoring
- Daily digest notifications
- User roles beyond admin

### Demo Pre-Seeded Documents (Upload These)
Create these 3 test documents to guarantee a contradiction in the demo:

**Document 1:** `supplier-agreement.pdf`
Include: "All domestic orders have a minimum order weight of 10kg."

**Document 2:** `operations-manual.docx`
Include: "Bulk domestic orders require a minimum order weight of 50kg per shipment."

**Document 3:** `refund-policy.pdf`
Include: "Customers may request a refund within 30 days of delivery."

**Document 4:** `support-guidelines.docx`
Include: "Refunds are accepted within 14 days of delivery only."

This gives you 2 contradictions ready to demo.

---

## 18. Demo Script

### The 5-Minute Demo Flow

```
1. [0:00] Open the app — show the clean dashboard
   "This is fynqAI — your company's AI intelligence layer. Every answer cited. Every conflict caught."

2. [0:30] Upload supplier-agreement.pdf and operations-manual.docx live
   Watch the progress bar: Uploading → Parsing → Analyzing
   "The system is reading the documents and looking for conflicts"

3. [1:30] Red badge appears on the sidebar: ⚠ 1 Contradiction
   "It found something."

4. [2:00] Go to Chat. Ask: "What is the minimum order weight?"
   Watch the AI surface BOTH answers with a warning banner
   "Instead of confidently answering wrong, it shows you the conflict"

5. [3:00] Go to Admin → Contradictions
   Show the side-by-side resolver card
   Click "Mark B Correct" (operations manual, more recent)
   Add note: "Operations manual supersedes supplier agreement on this point"

6. [3:45] Go back to Chat. Ask the same question again.
   AI now gives a clean single answer with citation to the correct document
   "The conflict is resolved. The AI now knows the truth."

7. [4:30] Upload refund-policy.pdf and support-guidelines.docx
   Second contradiction appears automatically
   "This works across your entire knowledge base, for every document you add"
```

**The wow moment is Step 4 → Step 6.** Before resolution and after resolution, same question, different answer — with a full audit trail of who fixed it and why. That is the product.

---

---

## 19. Workspace Bootstrap Flow (Auth + Onboarding)

This flow is missing from standard auth setups and MUST be implemented or the app breaks on first login.

### On Signup — Auto-Create Workspace

```typescript
// lib/supabase/bootstrap.ts
export async function bootstrapNewUser(userId: string, email: string) {
  const supabase = createServerClient();

  // 1. Create workspace named after user's domain or email prefix
  const workspaceName = email.split('@')[0] + "'s Workspace";
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

  const { data: workspace } = await supabase
    .from('workspaces')
    .insert({ name: workspaceName, slug })
    .select()
    .single();

  // 2. Add user as admin of their workspace
  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'admin',
  });

  return workspace;
}
```

### Where to call it

In the Supabase Auth callback route (`/auth/callback/route.ts`):

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { bootstrapNewUser } from '@/lib/supabase/bootstrap';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const supabase = createServerClient();

  if (code) {
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // Check if user already has a workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', session.user.id)
        .single();

      // New user — bootstrap their workspace
      if (!membership) {
        await bootstrapNewUser(session.user.id, session.user.email!);
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Page Map Addition
```
/auth/callback        → Supabase OAuth callback handler (REQUIRED — do not skip)
/onboarding           → Optional: workspace name setup for new users
```

---

## 20. Supabase Storage Bucket Setup

Run these in the Supabase Dashboard → Storage → Buckets, OR via SQL:

```sql
-- Raw uploaded files (private — never exposed directly to users)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'raw-documents',
  'raw-documents',
  FALSE,                          -- PRIVATE: only accessible via signed URLs
  52428800,                       -- 50MB max file size
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/markdown']
);

-- Parsed markdown files (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parsed-documents',
  'parsed-documents',
  FALSE,                          -- PRIVATE
  10485760,                       -- 10MB max (markdown is small)
  ARRAY['text/markdown', 'text/plain']
);
```

### Storage RLS Policies

```sql
-- raw-documents: only workspace members can upload and read their own files
CREATE POLICY raw_docs_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'raw-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY raw_docs_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'raw-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- parsed-documents: same pattern
CREATE POLICY parsed_docs_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'parsed-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY parsed_docs_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'parsed-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

### Generating Signed URLs for Citations

```typescript
// When building citation objects, generate a signed URL (valid 1 hour)
const { data } = await supabase.storage
  .from('raw-documents')
  .createSignedUrl(document.raw_storage_path, 3600);

citation.storage_url = data?.signedUrl ?? null;
```

---

## 21. Middleware — Route Protection

```typescript
// middleware.ts (root of project)
import { createServerClient } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return response;
  }

  // Redirect unauthenticated users to login
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Protect admin routes — only admins can access /admin/*
  if (path.startsWith('/admin')) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (membership?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
  // Note: API routes handle their own auth via Supabase service role key
};
```

---

## 22. Token Counting for Chunking

Use character-based estimation for simplicity — no extra dependency needed:

```typescript
// lib/ingestion/chunk.ts

// Approximate token count: 1 token ≈ 4 characters (works for English business text)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MIN_TOKENS = 150;  // ~600 chars
const MAX_TOKENS = 800;  // ~3200 chars

export function chunkMarkdown(markdown: string): Chunk[] {
  // Split on ## and ### headers
  const sections = markdown.split(/(?=^#{1,3} )/m).filter(s => s.trim());
  const chunks: Chunk[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^(#{1,3} .+)/m);
    const sectionHeader = headerMatch?.[1] ?? null;
    const tokens = estimateTokens(section);

    if (tokens < MIN_TOKENS && chunks.length > 0) {
      // Too small — merge with previous chunk
      chunks[chunks.length - 1].text += '

' + section;
    } else if (tokens > MAX_TOKENS) {
      // Too large — split at paragraph boundaries
      const paragraphs = section.split(/

+/);
      let currentChunk = '';
      for (const para of paragraphs) {
        if (estimateTokens(currentChunk + para) > MAX_TOKENS && currentChunk) {
          chunks.push({ text: currentChunk.trim(), section_header: sectionHeader,
                        token_count: estimateTokens(currentChunk) });
          currentChunk = para;
        } else {
          currentChunk += (currentChunk ? '

' : '') + para;
        }
      }
      if (currentChunk) {
        chunks.push({ text: currentChunk.trim(), section_header: sectionHeader,
                      token_count: estimateTokens(currentChunk) });
      }
    } else {
      chunks.push({ text: section.trim(), section_header: sectionHeader,
                    token_count: tokens });
    }
  }

  return chunks.map((c, i) => ({ ...c, chunk_index: i }));
}
```

*End of PRD — fynqAI v2.0*
