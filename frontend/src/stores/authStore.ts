import { create } from 'zustand';
import type { UserProfile } from '@/types/user';
import type { LoginRequest } from '@/types/auth';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import { setOnSessionExpired } from '@/api/client';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/token';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Register callback so HTTP client can invalidate auth state without circular imports
  setOnSessionExpired(() => set({ user: null, isAuthenticated: false }));

  return {
  user: null,
  isAuthenticated: !!getAccessToken(),
  isLoading: false,

  login: async (data) => {
    const response = await authApi.login(data);
    setTokens(response.access_token, response.refresh_token);
    set({ isAuthenticated: true });
    await get().fetchUser();
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout API errors
      }
    }
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await userApi.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  initialize: async () => {
    if (getAccessToken()) {
      await get().fetchUser();
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },
};});
