import { create } from 'zustand';
import { authService } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  loginWithGoogle: (idToken: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

function readStoredUser(): User | null {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(userStr);

    if (
      parsedUser &&
      typeof parsedUser === 'object' &&
      typeof parsedUser.id === 'string' &&
      typeof parsedUser.email === 'string' &&
      typeof parsedUser.isAdmin === 'boolean'
    ) {
      return parsedUser as User;
    }
  } catch (error) {
    console.warn('Failed to parse stored user:', error);
  }

  localStorage.removeItem('user');
  return null;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loginWithGoogle: async (idToken) => {
    try {
      set({ isLoading: true });
      const { token, user } = await authService.loginWithGoogle(idToken);
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    // Check if we have a token and user in localStorage
    const token = localStorage.getItem('authToken');
    const user = readStoredUser();

    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true,
      });

      try {
        const response = await authService.getCurrentUser();
        const verifiedUser = response.user;

        localStorage.setItem('user', JSON.stringify(verifiedUser));
        set({
          token,
          user: verifiedUser,
          isAuthenticated: true,
        });
      } catch (error) {
        console.warn('Stored auth is no longer valid, logging out:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      }

      return;
    }

    if (token && !user) {
      localStorage.removeItem('authToken');
    }
  },
}));
