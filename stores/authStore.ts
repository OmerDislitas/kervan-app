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
  loadCachedProfile: () => Promise<void>;
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
      const previousUserId = await AsyncStorage.getItem('@fikirforum_last_logged_in_user');
      if (previousUserId !== userId) {
        const keysToClear = [
          '@fikirforum_notifications',
          '@fikirforum_compass_task',
          '@fikirforum_compass_time',
          '@fikirforum_compass_completed',
          '@fikirforum_compass_points_earned',
          '@fikirforum_compass_start_points',
          '@fikirforum_last_comment_time',
          '@fikirforum_last_fact_read',
          '@fikirforum_last_like_time',
          '@fikirforum_last_profile_view',
          '@fikirforum_last_quote_read',
          '@fikirforum_last_follow',
          '@fikirforum_last_explore_view',
          '@fikirforum_last_event_view'
        ];
        if (previousUserId) {
          keysToClear.push(`@fikirforum_notif_first_prompt_shown_${previousUserId}`);
        }
        await AsyncStorage.multiRemove(keysToClear);
        await AsyncStorage.setItem('@fikirforum_last_logged_in_user', userId);
      }

      // Kendi tam profilini (email/phone/push_token dahil) SECURITY DEFINER
      // RPC üzerinden oku. Bu sütunlar artık doğrudan SELECT ile okunamıyor
      // (PII sızıntısı koruması — bkz. supabase/security_fixes.sql K-2).
      let { data, error } = await supabase
        .rpc('get_my_profile')
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
            .rpc('get_my_profile')
            .single();

          data = newData;
          error = newError;

          set({ pendingProfileData: null });
        }
      }

      if (error) throw error;

      const prof = data as UserProfile;
      set({
        profile: prof,
        isAdmin: prof?.role === 'admin',
      });
      try {
        await AsyncStorage.setItem('@fikirforum_cached_profile', JSON.stringify(prof));
      } catch (cacheErr) {
        console.warn('[authStore] Error caching profile:', cacheErr);
      }
    } catch (err) {
      console.error('[authStore] fetchProfile error:', err);
      // Hata olsa bile isLoading'i kaldır; aksi hâlde uygulama
      // splash ekranında sonsuza dek takılı kalır.
      set({ isLoading: false });
    }
  },

  loadCachedProfile: async () => {
    try {
      const cached = await AsyncStorage.getItem('@fikirforum_cached_profile');
      if (cached) {
        const prof = JSON.parse(cached) as UserProfile;
        set({
          profile: prof,
          isAdmin: prof?.role === 'admin',
        });
      }
    } catch (err) {
      console.warn('[authStore] loadCachedProfile error:', err);
    }
  },

  signOut: async () => {
    try {
      const keysToClear = [
        '@fikirforum_notifications',
        '@fikirforum_compass_task',
        '@fikirforum_compass_time',
        '@fikirforum_compass_completed',
        '@fikirforum_compass_points_earned',
        '@fikirforum_compass_start_points',
        '@fikirforum_last_comment_time',
        '@fikirforum_last_fact_read',
        '@fikirforum_last_like_time',
        '@fikirforum_last_profile_view',
        '@fikirforum_last_quote_read',
        '@fikirforum_last_follow',
        '@fikirforum_last_explore_view',
        '@fikirforum_last_event_view',
        '@fikirforum_cached_profile'
      ];
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
