import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  university_id: number | null;
  university_name: string | null;
  department: string | null;
  university_year: string | null;
  gender: 'male' | 'female';
  role: 'user' | 'admin';
  push_token: string | null;
  points: number;
  is_private: boolean;
  bio: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  pendingProfileData: any | null;

  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingProfileData: (data: any) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  pendingProfileData: null,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setProfile: (profile) =>
    set({
      profile,
      isAdmin: profile?.role === 'admin',
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setPendingProfileData: (data) => set({ pendingProfileData: data }),

  fetchProfile: async (userId: string) => {
    try {
      // Hesap değişimi (veya ilk giriş) durumunda önceki hesaba ait lokal verileri (pusula, bildirim) temizle
      const previousUserId = await AsyncStorage.getItem('@kervan_last_logged_in_user');
      if (previousUserId !== userId) {
        const keysToClear = [
          '@kervan_notifications',
          '@kervan_compass_task',
          '@kervan_compass_time',
          '@kervan_compass_completed',
          '@kervan_compass_points_earned',
          '@kervan_compass_start_points',
          '@kervan_last_comment_time',
          '@kervan_last_fact_read',
          '@kervan_last_like_time',
          '@kervan_last_profile_view',
          '@kervan_last_quote_read',
          '@kervan_last_follow',
          '@kervan_last_explore_view',
          '@kervan_last_event_view'
        ];
        if (previousUserId) {
          keysToClear.push(`@kervan_notif_first_prompt_shown_${previousUserId}`);
        }
        await AsyncStorage.multiRemove(keysToClear);
        await AsyncStorage.setItem('@kervan_last_logged_in_user', userId);
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, phone, university_id, university_name, department, university_year, gender, role, push_token, points, is_private, bio')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profil bulunamadı — yeni kayıt oluştur (ilk giriş senaryosu)
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const state = get();
          const pendingData = state.pendingProfileData || {};

          await supabase.from('profiles').insert({
            id: userId,
            email: authData.user.email || pendingData.email?.trim().toLowerCase() || '',
            full_name: pendingData.fullName || authData.user.user_metadata?.full_name || 'İsimsiz Kullanıcı',
            phone: pendingData.phone || null,
            university_id: null,
            university_name: pendingData.university || null,
            department: pendingData.department || null,
            university_year: pendingData.year || null,
            gender: pendingData.gender || 'male',
            role: 'user',
            created_at: new Date().toISOString(),
          });

          const { data: newData, error: newError } = await supabase
            .from('profiles')
            .select('id, email, full_name, username, phone, university_id, university_name, department, university_year, gender, role, push_token, points, is_private, bio')
            .eq('id', userId)
            .single();

          data = newData;
          error = newError;

          set({ pendingProfileData: null });
        }
      }

      if (error) throw error;

      set({
        profile: data as UserProfile,
        isAdmin: data.role === 'admin',
      });
    } catch (err) {
      console.error('[authStore] fetchProfile error:', err);
    }
  },

  signOut: async () => {
    try {
      const user = get().user;
      const keysToClear = [
        '@kervan_notifications',
        '@kervan_compass_task',
        '@kervan_compass_time',
        '@kervan_compass_completed',
        '@kervan_compass_points_earned',
        '@kervan_compass_start_points',
        '@kervan_last_comment_time',
        '@kervan_last_fact_read',
        '@kervan_last_like_time',
        '@kervan_last_profile_view',
        '@kervan_last_quote_read',
        '@kervan_last_follow',
        '@kervan_last_explore_view',
        '@kervan_last_event_view'
      ];
      if (user?.id) {
        keysToClear.push(`@kervan_notif_first_prompt_shown_${user.id}`);
      }
      await AsyncStorage.multiRemove(keysToClear);
    } catch (err) {
      console.error('[authStore] Error clearing AsyncStorage on signOut:', err);
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, isAdmin: false });
  },

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isAdmin: false,
    }),
}));
