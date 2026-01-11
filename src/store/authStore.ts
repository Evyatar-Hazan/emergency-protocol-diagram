import { create } from 'zustand';

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
  checkAuth: () => void;
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
    // Lazy import to avoid circular dependency
    import('../services/api').then(({ authService }) => {
      authService.logout();
    });
    set({ user: null, token: null, isAuthenticated: false });
  },

  loginWithGoogle: async (idToken) => {
    try {
      set({ isLoading: true });
      // Lazy import to avoid circular dependency
      const { authService } = await import('../services/api');
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

  checkAuth: () => {
    // Check if we have a token and user in localStorage
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true,
      });
    }
  },
}));
