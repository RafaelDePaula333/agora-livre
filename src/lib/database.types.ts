// src/lib/database.types.ts
// Auto-generate with: npx supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts
// This is a manual version matching our schema.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                  string;
          name:                string | null;
          addiction_type:      string;
          trigger_times:       string[];
          trigger_causes:      string[];
          coping_strategies:   string[];
          sober_since:         string;
          lang:                string;
          is_premium:          boolean;
          created_at:          string;
          updated_at:          string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      checkins: {
        Row: {
          id:             string;
          user_id:        string;
          date:           string;
          mood:           string;
          emotions:       string[];
          urge_intensity: number;
          notes:          string | null;
          created_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>;
        Relationships: [];
      };
      crisis_sessions: {
        Row: {
          id:                string;
          user_id:           string;
          started_at:        string;
          ended_at:          string | null;
          trigger_emotions:  string[];
          intensity:         number;
          actions_used:      string[];
          urge_decreased:    boolean | null;
          timer_completed:   boolean;
        };
        Insert: Omit<Database['public']['Tables']['crisis_sessions']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['crisis_sessions']['Insert']>;
        Relationships: [];
      };
      relapses: {
        Row: {
          id:          string;
          user_id:     string;
          occurred_at: string;
          location:    string;
          emotion:     string;
          intensity:   number;
          notes:       string | null;
          created_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['relapses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['relapses']['Insert']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id:              string;
          user_id:         string;
          plan:            string;
          status:          string;
          started_at:      string;
          expires_at:      string;
          play_store_sku:  string;
          purchase_token:  string;
          updated_at:      string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'started_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
