export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          citations: Json | null
          content: string
          contradiction_ids: string[] | null
          created_at: string | null
          had_contradiction: boolean | null
          id: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          workspace_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          contradiction_ids?: string[] | null
          created_at?: string | null
          had_contradiction?: boolean | null
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          workspace_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          contradiction_ids?: string[] | null
          created_at?: string | null
          had_contradiction?: boolean | null
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          chunk_index: number
          created_at: string | null
          document_id: string
          embedding: string | null
          entities: Json | null
          id: string
          section_header: string | null
          text: string
          text_search: unknown
          token_count: number | null
          workspace_id: string
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          document_id: string
          embedding?: string | null
          entities?: Json | null
          id?: string
          section_header?: string | null
          text: string
          text_search?: unknown
          token_count?: number | null
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          entities?: Json | null
          id?: string
          section_header?: string | null
          text?: string
          text_search?: unknown
          token_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contradiction_notifications: {
        Row: {
          contradiction_id: string
          created_at: string | null
          id: string
          notify_user_id: string
          seen: boolean | null
          seen_at: string | null
          workspace_id: string
        }
        Insert: {
          contradiction_id: string
          created_at?: string | null
          id?: string
          notify_user_id: string
          seen?: boolean | null
          seen_at?: string | null
          workspace_id: string
        }
        Update: {
          contradiction_id?: string
          created_at?: string | null
          id?: string
          notify_user_id?: string
          seen?: boolean | null
          seen_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contradiction_notifications_contradiction_id_fkey"
            columns: ["contradiction_id"]
            isOneToOne: false
            referencedRelation: "contradictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradiction_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contradictions: {
        Row: {
          authoritative_chunk_id: string | null
          auto_resolved: boolean | null
          chunk_a_id: string
          chunk_b_id: string
          confidence: number
          contradiction_type: Database["public"]["Enums"]["contradiction_type"]
          created_at: string | null
          document_a_id: string
          document_b_id: string
          entity_subject: string
          id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["contradiction_severity"]
          status: Database["public"]["Enums"]["contradiction_status"] | null
          value_a: string
          value_b: string
          workspace_id: string
        }
        Insert: {
          authoritative_chunk_id?: string | null
          auto_resolved?: boolean | null
          chunk_a_id: string
          chunk_b_id: string
          confidence: number
          contradiction_type: Database["public"]["Enums"]["contradiction_type"]
          created_at?: string | null
          document_a_id: string
          document_b_id: string
          entity_subject: string
          id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["contradiction_severity"]
          status?: Database["public"]["Enums"]["contradiction_status"] | null
          value_a: string
          value_b: string
          workspace_id: string
        }
        Update: {
          authoritative_chunk_id?: string | null
          auto_resolved?: boolean | null
          chunk_a_id?: string
          chunk_b_id?: string
          confidence?: number
          contradiction_type?: Database["public"]["Enums"]["contradiction_type"]
          created_at?: string | null
          document_a_id?: string
          document_b_id?: string
          entity_subject?: string
          id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["contradiction_severity"]
          status?: Database["public"]["Enums"]["contradiction_status"] | null
          value_a?: string
          value_b?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contradictions_authoritative_chunk_id_fkey"
            columns: ["authoritative_chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_chunk_a_id_fkey"
            columns: ["chunk_a_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_chunk_b_id_fkey"
            columns: ["chunk_b_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_document_a_id_fkey"
            columns: ["document_a_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_document_b_id_fkey"
            columns: ["document_b_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          deprecated_at: string | null
          deprecated_reason: string | null
          error_message: string | null
          file_size_bytes: number | null
          file_type: string
          id: string
          is_deprecated: boolean | null
          markdown_storage_path: string | null
          name: string
          original_filename: string
          raw_storage_path: string | null
          source: Database["public"]["Enums"]["document_source"]
          source_url: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string | null
          uploaded_by: string | null
          workspace_id: string
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          deprecated_reason?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          file_type: string
          id?: string
          is_deprecated?: boolean | null
          markdown_storage_path?: string | null
          name: string
          original_filename: string
          raw_storage_path?: string | null
          source?: Database["public"]["Enums"]["document_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          uploaded_by?: string | null
          workspace_id: string
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          deprecated_at?: string | null
          deprecated_reason?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_deprecated?: boolean | null
          markdown_storage_path?: string | null
          name?: string
          original_filename?: string
          raw_storage_path?: string | null
          source?: Database["public"]["Enums"]["document_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          uploaded_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          document_id: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          priority: number
          status: Database["public"]["Enums"]["ingestion_job_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          document_id: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          priority?: number
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          document_id?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          priority?: number
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_ingestion_jobs: {
        Args: {
          batch_size: number
          worker_id: string
        }
        Returns: {
          attempts: number
          available_at: string
          created_at: string
          document_id: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          priority: number
          status: Database["public"]["Enums"]["ingestion_job_status"]
          updated_at: string
          workspace_id: string
        }[]
      }
      match_chunks: {
        Args: {
          query_embedding: string
          workspace_filter: string
          match_count?: number
        }
        Returns: {
          id: string
          text: string
          document_id: string
          section_header: string | null
          entities: Json | null
          document_name: string
          similarity: number
        }[]
      }
      user_in_workspace: { Args: { ws_id: string }; Returns: boolean }
      user_is_admin: { Args: { ws_id: string }; Returns: boolean }
    }
    Enums: {
      contradiction_severity: "critical" | "warning" | "info"
      contradiction_status: "open" | "resolved" | "dismissed" | "auto_resolved"
      contradiction_type:
        | "quantitative"
        | "policy"
        | "temporal"
        | "definitional"
        | "scope_drift"
      document_source:
        | "upload"
        | "google_drive"
        | "notion"
        | "confluence"
        | "sharepoint"
        | "slack"
      document_status:
        | "processing"
        | "chunking"
        | "embedding"
        | "extracting"
        | "scanning"
        | "ready"
        | "error"
      ingestion_job_status: "queued" | "processing" | "completed" | "failed"
      member_role: "admin" | "member"
      message_role: "user" | "assistant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contradiction_severity: ["critical", "warning", "info"],
      contradiction_status: ["open", "resolved", "dismissed", "auto_resolved"],
      contradiction_type: [
        "quantitative",
        "policy",
        "temporal",
        "definitional",
        "scope_drift",
      ],
      document_source: [
        "upload",
        "google_drive",
        "notion",
        "confluence",
        "sharepoint",
        "slack",
      ],
      document_status: [
        "processing",
        "chunking",
        "embedding",
        "extracting",
        "scanning",
        "ready",
        "error",
      ],
      member_role: ["admin", "member"],
      message_role: ["user", "assistant"],
    },
  },
} as const
