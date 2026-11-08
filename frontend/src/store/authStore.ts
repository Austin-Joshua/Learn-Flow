import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types';
import { api, setMemoryToken, subscribeAuthSync } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: { email: string; password: string; first_name: string; last_name: string }) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  hasRole: (role: 'admin' | 'instructor' | 'learner' | 'hod' | string) => boolean;
  getDefaultDashboardPath: () => string;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: typeof window !== 'undefined' && Boolean(localStorage.getItem('learnflow_user')),
  error: null,
  isAuthenticated: false,

  loadFromStorage: async () => {
    const storedUser = localStorage.getItem('learnflow_user');
    if (!storedUser) {
      setMemoryToken(null);
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    let cachedUser: User | null = null;
    try {
      cachedUser = JSON.parse(storedUser);
      set({ user: cachedUser, isLoading: true });
    } catch {
      localStorage.removeItem('learnflow_user');
      setMemoryToken(null);
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.auth.refresh();
      const access_token = res.data.access_token;
      setMemoryToken(access_token);
      set({ token: access_token, user: cachedUser, isAuthenticated: true, isLoading: false });
    } catch {
      setMemoryToken(null);
      localStorage.removeItem('learnflow_user');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login({ email, password });
      const { access_token, user } = res.data;
      // In-memory token storage (RFC 6819 defense against XSS token exfiltration)
      setMemoryToken(access_token);
      localStorage.removeItem('learnflow_token');
      localStorage.setItem('learnflow_user', JSON.stringify(user));
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: unknown) {
      let detail = 'Invalid email or password.';
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.detail) {
          detail = String(err.response.data.detail);
        } else if (!err.response) {
          detail = 'Unable to connect to the Learnflow server. Please check your connection.';
        }
      }
      set({ error: detail, isLoading: false });
      return false;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(payload);
      const { access_token, user } = res.data;
      setMemoryToken(access_token);
      localStorage.removeItem('learnflow_token');
      localStorage.setItem('learnflow_user', JSON.stringify(user));
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Registration failed.';
      set({ error: detail, isLoading: false });
      return false;
    }
  },

  logout: () => {
    setMemoryToken(null);
    localStorage.removeItem('learnflow_token');
    localStorage.removeItem('learnflow_user');
    set({ token: null, user: null, isAuthenticated: false, error: null });
    api.auth.logout().catch(() => {});
  },

  hasRole: (role: 'admin' | 'instructor' | 'learner' | 'hod' | string) => {
    const user = get().user;
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name.toLowerCase() === role.toLowerCase());
  },

  getDefaultDashboardPath: () => {
    const user = get().user;
    if (!user || !user.roles) return '/courses';
    const roleNames = user.roles.map((r) => r.name.toLowerCase());
    if (roleNames.includes('admin')) return '/admin';
    if (roleNames.includes('hod')) return '/hod';
    if (roleNames.includes('instructor')) return '/instructor/courses';
    if (roleNames.includes('learner')) return '/my-learning';
    return '/courses';
  },

  clearError: () => set({ error: null }),
}));

// Cross-tab broadcast sync subscription
subscribeAuthSync((newToken) => {
  if (newToken) {
    useAuthStore.setState({ token: newToken, isAuthenticated: true });
  } else {
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  }
});
