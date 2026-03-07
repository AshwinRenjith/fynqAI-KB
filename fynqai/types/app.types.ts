// types/app.types.ts

export type DocumentStatus =
  | 'processing' | 'chunking' | 'embedding'
  | 'extracting' | 'scanning' | 'ready' | 'error';

export type DocumentSource =
  | 'upload' | 'google_drive' | 'notion'
  | 'confluence' | 'sharepoint' | 'slack';

export type ContradictionType =
  | 'quantitative' | 'policy' | 'temporal' | 'definitional' | 'scope_drift';

export type ContradictionSeverity = 'critical' | 'warning' | 'info';

export type ContradictionStatus =
  | 'open' | 'resolved' | 'dismissed' | 'auto_resolved';

export type MemberRole = 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  uploaded_by: string | null;
  name: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number | null;
  source: DocumentSource;
  source_url: string | null;
  raw_storage_path: string | null;
  markdown_storage_path: string | null;
  status: DocumentStatus;
  error_message: string | null;
  chunk_count: number;
  is_deprecated: boolean;
  deprecated_at: string | null;
  deprecated_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  workspace_id: string;
  text: string;
  chunk_index: number;
  section_header: string | null;
  token_count: number | null;
  entities: Entity[];
  created_at: string;
}

export interface Entity {
  type: 'QUANTITY' | 'DATE' | 'PRICE' | 'POLICY_RULE' | 'DEFINITION' | 'PERSON' | 'PRODUCT';
  value: string;
  normalized_value: Record<string, unknown>;
  subject: string;
  scope: string | null;
  confidence: number;
}

export interface Contradiction {
  id: string;
  workspace_id: string;
  chunk_a_id: string;
  chunk_b_id: string;
  document_a_id: string;
  document_b_id: string;
  entity_subject: string;
  value_a: string;
  value_b: string;
  contradiction_type: ContradictionType;
  confidence: number;
  severity: ContradictionSeverity;
  status: ContradictionStatus;
  auto_resolved: boolean;
  authoritative_chunk_id: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  // Joined via API
  document_a?: { name: string; created_at: string };
  document_b?: { name: string; created_at: string };
  document_a_name?: string; // fallback for flattened mapping
  document_b_name?: string; // fallback for flattened mapping
}

export interface Citation {
  index: number;
  chunk_id: string;
  document_id: string;
  document_name: string;
  section_header: string | null;
  excerpt: string;
  storage_url: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  had_contradiction: boolean;
  contradiction_ids: string[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}
