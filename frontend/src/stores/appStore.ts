import { create } from 'zustand';
import { storage } from '@/utils/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Locale = 'en-US' | 'zh-CN';

interface AppState {
  theme: ThemeMode;
  locale: Locale;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  initTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  if (resolved === 'dark') {
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    document.body.removeAttribute('arco-theme');
  }
}

export const useAppStore = create<AppState>()((set, get) => ({
  theme: (storage.get<ThemeMode>('theme') ?? 'system'),
  locale: (storage.get<Locale>('locale') ?? 'zh-CN'),
  sidebarCollapsed: false,

  setTheme: (theme) => {
    storage.set('theme', theme);
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(resolved);
    set({ theme });
  },

  setLocale: (locale) => {
    storage.set('locale', locale);
    document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
    set({ locale });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },

  initTheme: () => {
    const theme = get().theme;
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(resolved);

    // Listen for system theme changes when in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (get().theme === 'system') {
        applyTheme(getSystemTheme());
      }
    });
  },
}));
