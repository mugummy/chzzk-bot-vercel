// Supabase Database Types

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          chzzk_id: string;
          channel_id: string;
          channel_name: string;
          profile_image: string | null;
          nid_auth: string | null;
          nid_session: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      bot_settings: {
        Row: {
          id: string;
          user_id: string;
          prefix: string;
          points_enabled: boolean;
          points_per_chat: number;
          points_name: string;
          song_request_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bot_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bot_settings']['Insert']>;
      };
      commands: {
        Row: {
          id: string;
          user_id: string;
          triggers: string[];
          response: string;
          enabled: boolean;
          total_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['commands']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_count'>;
        Update: Partial<Database['public']['Tables']['commands']['Insert']>;
      };
      counters: {
        Row: {
          id: string;
          user_id: string;
          trigger: string;
          response: string;
          enabled: boolean;
          total_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['counters']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_count'>;
        Update: Partial<Database['public']['Tables']['counters']['Insert']>;
      };
      viewer_points: {
        Row: {
          id: string;
          user_id: string;
          viewer_hash: string;
          viewer_nickname: string;
          points: number;
          last_chat_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['viewer_points']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['viewer_points']['Insert']>;
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          options: { id: string; text: string }[];
          results: Record<string, number>;
          is_active: boolean;
          duration_seconds: number;
          start_time: string | null;
          end_time: string | null;
          voters: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['votes']['Insert']>;
      };
      song_queue: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          title: string;
          duration: number;
          requester_nickname: string;
          requester_hash: string;
          is_played: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['song_queue']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['song_queue']['Insert']>;
      };
      bot_sessions: {
        Row: {
          id: string;
          user_id: string;
          is_active: boolean;
          last_heartbeat: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bot_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bot_sessions']['Insert']>;
      };
    };
  };
}

// Helper Types
export type User = Database['public']['Tables']['users']['Row'];
export type BotSettings = Database['public']['Tables']['bot_settings']['Row'];
export type Command = Database['public']['Tables']['commands']['Row'];
export type Counter = Database['public']['Tables']['counters']['Row'];
export type ViewerPoints = Database['public']['Tables']['viewer_points']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type SongQueue = Database['public']['Tables']['song_queue']['Row'];
export type BotSession = Database['public']['Tables']['bot_sessions']['Row'];
