/**
 * Supabase `public` schema typings. UUIDs and timestamptz are strings from PostgREST.
 * `date` columns are ISO date strings (`YYYY-MM-DD`). `numeric` columns are `number` in JS.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          /** Display-only; not used in distance calculations. */
          zip_code: string | null;
          latitude: number | null;
          longitude: number | null;
          auth_type: string;
          has_had_pet: boolean;
          is_verified: boolean;
          is_admin: boolean;
          is_email_verified: boolean;
          is_deactivated: boolean;
          kyc_status: 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected';
          points_balance: number;
          points_alltime_high: number;
          care_given_count: number;
          care_received_count: number;
          language: string;
          theme_pref: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          zip_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          auth_type?: string;
          has_had_pet?: boolean;
          is_verified?: boolean;
          is_admin?: boolean;
          is_email_verified?: boolean;
          is_deactivated?: boolean;
          kyc_status?: 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected';
          points_balance?: number;
          points_alltime_high?: number;
          care_given_count?: number;
          care_received_count?: number;
          language?: string;
          theme_pref?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: never[];
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          breed: string | null;
          yard_type: string | null;
          age_range: string | null;
          energy_level: string | null;
          has_special_needs: boolean;
          special_needs_description: string | null;
          /** DB `numeric` */
          age_years: number | null;
          /** DB `numeric` */
          weight_kg: number | null;
          /** Ordered pet photo URLs (gallery / feed carousel). */
          photo_urls: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          species: string;
          breed?: string | null;
          yard_type?: string | null;
          age_range?: string | null;
          energy_level?: string | null;
          has_special_needs?: boolean;
          special_needs_description?: string | null;
          age_years?: number | null;
          weight_kg?: number | null;
          photo_urls?: string[];
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pets']['Insert']>;
        Relationships: never[];
      };
      pet_likes: {
        Row: {
          user_id: string;
          pet_id: string;
          care_request_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          pet_id: string;
          care_request_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pet_likes']['Insert']>;
        Relationships: never[];
      };
      care_requests: {
        Row: {
          id: string;
          owner_id: string;
          pet_id: string;
          taker_id: string | null;
          /** DB `text` — `daytime` | `playwalk` | `overnight` | `vacation` */
          care_type: string;
          /** DB `text`, default `open` */
          status: string;
          /** DB `date` */
          start_date: string;
          /** DB `date` */
          end_date: string;
          /** DB `time` */
          start_time: string | null;
          /** DB `time` */
          end_time: string | null;
          /** DB `integer`, default 0 */
          points_offered: number;
          /** Snapshot of owner location at post time. */
          latitude: number | null;
          longitude: number | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          pet_id: string;
          taker_id?: string | null;
          care_type: string;
          status?: string;
          start_date: string;
          end_date: string;
          start_time?: string | null;
          end_time?: string | null;
          points_offered?: number;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['care_requests']['Insert']>;
        Relationships: never[];
      };
      contracts: {
        Row: {
          id: string;
          request_id: string;
          owner_id: string;
          taker_id: string;
          /** DB `boolean`, default false */
          signed_owner: boolean;
          signed_taker: boolean;
          /** DB `text`, default `draft` */
          status: string;
          /** Set when first party requests termination; cleared on reactivation. */
          terminate_requested_by: string | null;
          terminate_requested_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          owner_id: string;
          taker_id: string;
          signed_owner?: boolean;
          signed_taker?: boolean;
          status?: string;
          terminate_requested_by?: string | null;
          terminate_requested_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>;
        Relationships: never[];
      };
      check_ins: {
        Row: {
          id: string;
          contract_id: string;
          taker_id: string;
          /** DB `text[]`, default `{}` */
          photo_urls: string[];
          note: string | null;
          checked_in_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          taker_id: string;
          photo_urls?: string[];
          note?: string | null;
          checked_in_at?: string;
        };
        Update: Partial<Database['public']['Tables']['check_ins']['Insert']>;
        Relationships: never[];
      };
      reviews: {
        Row: {
          id: string;
          contract_id: string;
          reviewer_id: string;
          reviewee_id: string;
          /** DB `numeric` */
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: never[];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          /** DB `text`, default `text` — app uses e.g. `proposal` */
          type: string;
          /** DB `jsonb` */
          metadata: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          content: string;
          type?: string;
          metadata?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: never[];
      };
      user_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_blocks']['Insert']>;
        Relationships: never[];
      };
      threads: {
        Row: {
          id: string;
          participant_ids: string[];
          request_id: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_sender_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_ids: string[];
          request_id?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          last_sender_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['threads']['Insert']>;
        Relationships: never[];
      };
      taker_profiles: {
        Row: {
          id: string;
          user_id: string;
          /** DB `text[]`, default `{}` */
          accepted_species: string[];
          /** DB `integer`, default 1 */
          max_pets: number;
          /** DB `jsonb`, default `{}` */
          availability_json: Json;
          /** DB `integer`, default 0 */
          hourly_points: number;
          /** DB `numeric`, default 0 */
          experience_years: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          accepted_species?: string[];
          max_pets?: number;
          availability_json?: Json;
          hourly_points?: number;
          experience_years?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['taker_profiles']['Insert']>;
        Relationships: never[];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          /** DB `jsonb` */
          data: Json | null;
          /** DB `boolean`, default false */
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: never[];
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          relationship?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>;
        Relationships: never[];
      };
      kyc_submissions: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          front_url: string;
          back_url: string | null;
          selfie_url: string | null;
          /** DB `text`, default `pending` */
          status: string;
          reviewer_notes: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          front_url: string;
          back_url?: string | null;
          selfie_url?: string | null;
          status?: string;
          reviewer_notes?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['kyc_submissions']['Insert']>;
        Relationships: never[];
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          contract_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          contract_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['point_transactions']['Insert']>;
        Relationships: never[];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details: string | null;
          /** DB `text`, default `open` */
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: never[];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
        Relationships: never[];
      };
      push_delivery_debug: {
        Row: {
          id: string;
          notification_id: string | null;
          user_id: string | null;
          stage: string;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id?: string | null;
          user_id?: string | null;
          stage: string;
          detail?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_delivery_debug']['Insert']>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_care_request: {
        Args: {
          p_request_id: string;
          p_owner_id: string;
          p_taker_id: string;
        };
        Returns: {
          contract_id: string | null;
          accepted: boolean;
          accepted_taker_id: string | null;
          request_status: string | null;
        }[];
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      search_nearby_takers: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km: number;
        };
        Returns: Json;
      };
      search_nearby_requests: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km: number;
          care_type_filter: string | null;
        };
        Returns: Json;
      };
      distances_for_requests: {
        Args: {
          user_lat: number;
          user_lng: number;
          request_ids: string[];
        };
        Returns: Json;
      };
      distances_for_users: {
        Args: {
          user_lat: number;
          user_lng: number;
          user_ids: string[];
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}

/** Strongly typed row for a public table (use when `select('*')` infers as {}). */
export type TablesRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
