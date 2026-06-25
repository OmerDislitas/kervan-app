import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Bu değerleri Supabase Dashboard'dan alın:
// Project Settings > API > Project URL & anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tip tanımları
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          university_id: number | null;
          university_name: string | null;
          department: string | null;
          university_year: string | null;
          gender: 'male' | 'female';
          role: 'user' | 'admin';
          push_token: string | null;
          is_private: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          event_date: string | null;
          is_recurring: boolean;
          recurring_day: number | null;
          recurring_time: string | null;
          gender_restriction: 'male' | 'female' | null;
          max_capacity: number | null;
          created_by: string;
          is_published: boolean;
          organization_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          registered_at: string;
          status: 'active' | 'cancelled';
        };
        Insert: Omit<Database['public']['Tables']['event_registrations']['Row'], 'id' | 'registered_at'>;
        Update: Partial<Database['public']['Tables']['event_registrations']['Insert']>;
      };
      universities: {
        Row: {
          id: number;
          name: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      quotes: {
        Row: {
          id: number;
          text: string;
          author: string;
          category: 'azim' | 'motivasyon' | 'inanc' | 'ekstra' | 'hikmet';
          pool: 'explore' | 'home';
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>;
      };
    };
  };
};
