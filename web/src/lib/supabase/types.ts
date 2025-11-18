export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      localities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          city: string;
          state: string;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          city?: string;
          state?: string;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          city?: string;
          state?: string;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [];
      };
      pubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          google_maps_url: string;
          website_url: string | null;
          phone: string | null;
          status: string;
          average_rating: number | null;
          review_count: number | null;
          cost_for_two_min: number | null;
          cost_for_two_max: number | null;
          cover_charge_min: number | null;
          cover_charge_max: number | null;
          cover_charge_redeemable: boolean | null;
          stag_entry_policy: string | null;
          couples_entry_policy: string | null;
          wheelchair_accessible: boolean | null;
          wifi_available: boolean | null;
          valet_available: boolean | null;
          happy_hours_note: string | null;
          operating_hours_raw: Json | null;
          overall_rating_average: number | null;
          overall_rating_min: number | null;
          overall_rating_max: number | null;
          overall_rating_details: string | null;
          ratings_last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          google_maps_url: string;
          website_url?: string | null;
          phone?: string | null;
          status?: string;
          average_rating?: number | null;
          review_count?: number | null;
          cost_for_two_min?: number | null;
          cost_for_two_max?: number | null;
          cover_charge_min?: number | null;
          cover_charge_max?: number | null;
          cover_charge_redeemable?: boolean | null;
          stag_entry_policy?: string | null;
          couples_entry_policy?: string | null;
          wheelchair_accessible?: boolean | null;
          wifi_available?: boolean | null;
          valet_available?: boolean | null;
          happy_hours_note?: string | null;
          operating_hours_raw?: Json | null;
          overall_rating_average?: number | null;
          overall_rating_min?: number | null;
          overall_rating_max?: number | null;
          overall_rating_details?: string | null;
          ratings_last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          google_maps_url?: string;
          website_url?: string | null;
          phone?: string | null;
          status?: string;
          average_rating?: number | null;
          review_count?: number | null;
          cost_for_two_min?: number | null;
          cost_for_two_max?: number | null;
          cover_charge_min?: number | null;
          cover_charge_max?: number | null;
          cover_charge_redeemable?: boolean | null;
          stag_entry_policy?: string | null;
          couples_entry_policy?: string | null;
          wheelchair_accessible?: boolean | null;
          wifi_available?: boolean | null;
          valet_available?: boolean | null;
          happy_hours_note?: string | null;
          operating_hours_raw?: Json | null;
          overall_rating_average?: number | null;
          overall_rating_min?: number | null;
          overall_rating_max?: number | null;
          overall_rating_details?: string | null;
          ratings_last_synced_at?: string | null;
        };
        Relationships: [];
      };
      pub_localities: {
        Row: {
          pub_id: string;
          locality_id: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pub_id: string;
          locality_id: string;
          is_primary?: boolean;
        };
        Update: {
          pub_id?: string;
          locality_id?: string;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "pub_localities_locality_id_fkey";
            columns: ["locality_id"];
            referencedRelation: "localities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pub_localities_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      pub_attribute_evidence: {
        Row: {
          pub_id: string;
          attribute_id: string;
          source_url: string;
          source_title: string | null;
          source_publisher: string | null;
          source_snippet: string | null;
          provider: string | null;
          confidence: number | null;
          retrieved_at: string;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          pub_id: string;
          attribute_id: string;
          source_url: string;
          source_title?: string | null;
          source_publisher?: string | null;
          source_snippet?: string | null;
          provider?: string | null;
          confidence?: number | null;
          retrieved_at?: string;
          verified_at?: string | null;
        };
        Update: {
          pub_id?: string;
          attribute_id?: string;
          source_url?: string;
          source_title?: string | null;
          source_publisher?: string | null;
          source_snippet?: string | null;
          provider?: string | null;
          confidence?: number | null;
          retrieved_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pub_attribute_evidence_attribute_id_fkey";
            columns: ["attribute_id"];
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pub_attribute_evidence_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      pub_vote_events: {
        Row: {
          id: string;
          pub_id: string;
          topic: string;
          option_id: string;
          voter_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          topic: string;
          option_id: string;
          voter_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          topic?: string;
          option_id?: string;
          voter_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pub_vote_events_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      attributes: {
        Row: {
          id: string;
          code: string;
          label: string;
          description: string | null;
          tier: string;
          data_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          description?: string | null;
          tier: string;
          data_type: string;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          description?: string | null;
          tier?: string;
          data_type?: string;
        };
        Relationships: [];
      };
      pub_attribute_values: {
        Row: {
          pub_id: string;
          attribute_id: string;
          boolean_value: boolean | null;
          int_value: number | null;
          numeric_min: number | null;
          numeric_max: number | null;
          text_value: string | null;
          tags_value: string[] | null;
          schedule_value: Json | null;
          rating_value: number | null;
          source: string | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pub_id: string;
          attribute_id: string;
          boolean_value?: boolean | null;
          int_value?: number | null;
          numeric_min?: number | null;
          numeric_max?: number | null;
          text_value?: string | null;
          tags_value?: string[] | null;
          schedule_value?: Json | null;
          rating_value?: number | null;
          source?: string | null;
          last_verified_at?: string | null;
        };
        Update: {
          pub_id?: string;
          attribute_id?: string;
          boolean_value?: boolean | null;
          int_value?: number | null;
          numeric_min?: number | null;
          numeric_max?: number | null;
          text_value?: string | null;
          tags_value?: string[] | null;
          schedule_value?: Json | null;
          rating_value?: number | null;
          source?: string | null;
          last_verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pub_attribute_values_attribute_id_fkey";
            columns: ["attribute_id"];
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pub_attribute_values_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      // NOTE: Populated by the external crawl4ai project; consumed by Plan Your Visit UI.
      pub_plan_visit_content: {
        Row: {
          pub_id: string;
          status: "draft" | "published" | "archived";
          data_source: "manual" | "ai_generated" | "editorial" | "hybrid";
          visit_summary: string | null;
          highlights: Json | null;
          itinerary: Json | null;
          faqs: Json | null;
          tips: Json | null;
          provenance: Json | null;
          last_enriched_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pub_id: string;
          status?: "draft" | "published" | "archived";
          data_source?: "manual" | "ai_generated" | "editorial" | "hybrid";
          visit_summary?: string | null;
          highlights?: Json | null;
          itinerary?: Json | null;
          faqs?: Json | null;
          tips?: Json | null;
          provenance?: Json | null;
          last_enriched_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          pub_id?: string;
          status?: "draft" | "published" | "archived";
          data_source?: "manual" | "ai_generated" | "editorial" | "hybrid";
          visit_summary?: string | null;
          highlights?: Json | null;
          itinerary?: Json | null;
          faqs?: Json | null;
          tips?: Json | null;
          provenance?: Json | null;
          last_enriched_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pub_plan_visit_content_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pub_plan_visit_content_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_content_jobs: {
        Row: {
          id: string;
          pub_id: string;
          job_type: "description" | "attributes" | "full_enrichment" | "faq" | "schema" | "insight";
          status:
            | "pending"
            | "processing"
            | "awaiting_review"
            | "approved"
            | "rejected"
            | "failed"
            | "completed";
          payload: Json | null;
          output: Json | null;
          error: Json | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          pub_id: string;
          job_type: "description" | "attributes" | "full_enrichment" | "faq" | "schema" | "insight";
          status?:
            | "pending"
            | "processing"
            | "awaiting_review"
            | "approved"
            | "rejected"
            | "failed"
            | "completed";
          payload?: Json | null;
          output?: Json | null;
          error?: Json | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          pub_id?: string;
          job_type?: "description" | "attributes" | "full_enrichment" | "faq" | "schema" | "insight";
          status?:
            | "pending"
            | "processing"
            | "awaiting_review"
            | "approved"
            | "rejected"
            | "failed"
            | "completed";
          payload?: Json | null;
          output?: Json | null;
          error?: Json | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_content_jobs_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_content_jobs_approved_by_fkey";
            columns: ["approved_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      pub_claims: {
        Row: {
          id: string;
          pub_id: string;
          email: string;
          status: string;
          verification_token: string;
          requested_at: string;
          verified_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          pub_id: string;
          email: string;
          status?: string;
          verification_token: string;
          requested_at?: string;
          verified_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          pub_id?: string;
          email?: string;
          status?: string;
          verification_token?: string;
          requested_at?: string;
          verified_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "pub_claims_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      pub_change_history: {
        Row: {
          id: string;
          pub_id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action?: string;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pub_change_history_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
      community_reports: {
        Row: {
          id: string;
          pub_id: string;
          email: string | null;
          message: string | null;
          evidence_url: string | null;
          status: string;
          created_at: string;
          resolved_at: string | null;
          resolver_id: string | null;
        };
        Insert: {
          id?: string;
          pub_id: string;
          email?: string | null;
          message?: string | null;
          evidence_url?: string | null;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
          resolver_id?: string | null;
        };
        Update: {
          id?: string;
          pub_id?: string;
          email?: string | null;
          message?: string | null;
          evidence_url?: string | null;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
          resolver_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_reports_pub_id_fkey";
            columns: ["pub_id"];
            referencedRelation: "pubs";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
