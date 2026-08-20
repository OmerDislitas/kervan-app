import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

interface SettingsState {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  hapticFeedback: boolean;
  setTheme: (theme: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      notificationsEnabled: false,
      hapticFeedback: true,
      setTheme: (theme) => set({ theme }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
    }),
    {
      name: 'fikirforum-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
