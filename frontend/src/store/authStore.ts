import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

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
  loadFromStorage: () => void;
  hasRole: (role: 'admin' | 'instructor' | 'learner' | 'hod' | string) => boolean;
  getDefaultDashboardPath: () => string;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('learnflow_token');
    const storedUser = localStorage.getItem('learnflow_user');
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ token, user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('learnflow_token');
        localStorage.removeItem('learnflow_user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login({ email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('learnflow_token', access_token);
      localStorage.setItem('learnflow_user', JSON.stringify(user));
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid email or password.';
      set({ error: detail, isLoading: false });
      return false;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(payload);
      const { access_token, user } = res.data;
      localStorage.setItem('learnflow_token', access_token);
      localStorage.setItem('learnflow_user', JSON.stringify(user));
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Registration failed.';
      set({ error: detail, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('learnflow_token');
    localStorage.removeItem('learnflow_user');
    set({ token: null, user: null, isAuthenticated: false, error: null });
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

