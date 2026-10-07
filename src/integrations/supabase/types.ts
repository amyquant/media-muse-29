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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      article_topics: {
        Row: {
          article_id: string
          score: number
          topic_id: string
        }
        Insert: {
          article_id: string
          score?: number
          topic_id: string
        }
        Update: {
          article_id?: string
          score?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_topics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string | null
          content: string | null
          external_id: string | null
          id: string
          importance: number
          ingested_at: string
          is_demo: boolean
          keywords: string[]
          language: string
          published_at: string
          search: unknown
          source_id: string | null
          summary: string | null
          text_type: string
          title: string
          type_confidence: number | null
          url: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          external_id?: string | null
          id?: string
          importance?: number
          ingested_at?: string
          is_demo?: boolean
          keywords?: string[]
          language?: string
          published_at: string
          search?: unknown
          source_id?: string | null
          summary?: string | null
          text_type?: string
          title: string
          type_confidence?: number | null
          url?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          external_id?: string | null
          id?: string
          importance?: number
          ingested_at?: string
          is_demo?: boolean
          keywords?: string[]
          language?: string
          published_at?: string
          search?: unknown
          source_id?: string | null
          summary?: string | null
          text_type?: string
          title?: string
          type_confidence?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          filters: Json
          id: string
          period_end: string
          period_start: string
          snapshot: Json | null
          title: string
          topic_id: string | null
          watchlist_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          period_end: string
          period_start: string
          snapshot?: Json | null
          title: string
          topic_id?: string | null
          watchlist_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          period_end?: string
          period_start?: string
          snapshot?: Json | null
          title?: string
          topic_id?: string | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          category: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          language: string
          last_error: string | null
          last_synced_at: string | null
          name: string
          source_type: string
          sync_status: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          last_error?: string | null
          last_synced_at?: string | null
          name: string
          source_type?: string
          sync_status?: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          last_error?: string | null
          last_synced_at?: string | null
          name?: string
          source_type?: string
          sync_status?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          detection_method: string
          id: string
          keywords: string[]
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          detection_method?: string
          id?: string
          keywords?: string[]
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          detection_method?: string
          id?: string
          keywords?: string[]
          name?: string
          slug?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          alerts_configured: boolean
          created_at: string
          exclude_keywords: string[]
          frequency: string
          id: string
          include_keywords: string[]
          is_active: boolean
          languages: string[]
          last_analyzed_at: string | null
          name: string
          source_ids: string[]
          text_types: string[]
          updated_at: string
        }
        Insert: {
          alerts_configured?: boolean
          created_at?: string
          exclude_keywords?: string[]
          frequency?: string
          id?: string
          include_keywords?: string[]
          is_active?: boolean
          languages?: string[]
          last_analyzed_at?: string | null
          name: string
          source_ids?: string[]
          text_types?: string[]
          updated_at?: string
        }
        Update: {
          alerts_configured?: boolean
          created_at?: string
          exclude_keywords?: string[]
          frequency?: string
          id?: string
          include_keywords?: string[]
          is_active?: boolean
          languages?: string[]
          last_analyzed_at?: string | null
          name?: string
          source_ids?: string[]
          text_types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
