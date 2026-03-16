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
          latitude: number | null;
          longitude: number | null;
          points_balance: number;
          is_verified: boolean;
          kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected';
          is_admin: boolean;
          language: 'en' | 'fr';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          breed: string | null;
          age_years: number | null;
          weight_kg: number | null;
          avatar_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pets']['Insert']>;
      };
      care_requests: {
        Row: {
          id: string;
          owner_id: string;
          pet_id: string;
          taker_id: string | null;
          care_type: 'sitting' | 'walking' | 'boarding';
          status: 'open' | 'matched' | 'active' | 'completed' | 'cancelled';
          start_date: string;
          end_date: string;
          points_offered: number;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['care_requests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['care_requests']['Insert']>;
      };
      contracts: {
        Row: {
          id: string;
          request_id: string;
          owner_id: string;
          taker_id: string;
          signed_owner: boolean;
          signed_taker: boolean;
          status: 'draft' | 'signed' | 'active' | 'completed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contracts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>;
      };
      check_ins: {
        Row: {
          id: string;
          contract_id: string;
          taker_id: string;
          photo_urls: string[];
          note: string | null;
          checked_in_at: string;
        };
        Insert: Omit<Database['public']['Tables']['check_ins']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['check_ins']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          contract_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          type: 'text' | 'proposal' | 'agreement' | 'image';
          metadata: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      threads: {
        Row: {
          id: string;
          participant_ids: string[];
          request_id: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['threads']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['threads']['Insert']>;
      };
      taker_profiles: {
        Row: {
          id: string;
          user_id: string;
          accepted_species: string[];
          max_pets: number;
          availability_json: Json;
          hourly_points: number;
          experience_years: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['taker_profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['taker_profiles']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['emergency_contacts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>;
      };
      kyc_submissions: {
        Row: {
          id: string;
          user_id: string;
          document_type: 'passport' | 'drivers_license' | 'national_id';
          front_url: string;
          back_url: string | null;
          selfie_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          reviewer_notes: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['kyc_submissions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['kyc_submissions']['Insert']>;
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'earn' | 'spend' | 'bonus' | 'refund';
          description: string;
          contract_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['point_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['point_transactions']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details: string | null;
          status: 'open' | 'reviewed' | 'resolved';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['push_tokens']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
