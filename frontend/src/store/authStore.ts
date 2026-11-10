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
  hasRole: (role: 'admin' | 'instructor' | 'learner' | string) => boolean;
  getDefaultDashboardPath: () => string;
  updateUser: (updatedFields: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: typeof window !== 'undefined' && Boolean(localStorage.getItem('learnflow_user')),
  error: null,
  isAuthenticated: false,

  loadFromStorage: async () => {
    // If active session token already exists in memory, skip blocking refresh
    if (get().isAuthenticated && get().token) {
      set({ isLoading: false });
      return;
    }
    const storedUser = localStorage.getItem('learnflow_user');
    if (!storedUser) {
      setMemoryToken(null);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('learnflow_session_token');
      }
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    let cachedUser: User | null = null;
    try {
      cachedUser = JSON.parse(storedUser);
      set({ user: cachedUser, isLoading: true });
    } catch {
      localStorage.removeItem('learnflow_user');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('learnflow_session_token');
      }
      setMemoryToken(null);
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Step A: Check for active session token in sessionStorage (persists across tab reloads on mobile & desktop)
    const sessionToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('learnflow_session_token') : null;
    if (sessionToken) {
      setMemoryToken(sessionToken);
      set({ token: sessionToken, user: cachedUser, isAuthenticated: true, isLoading: false });

      // Verify and hydrate user profile in background
      try {
        const meRes = await api.auth.me();
        if (meRes.data) {
          const updatedUser = { ...cachedUser, ...meRes.data };
          localStorage.setItem('learnflow_user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      } catch (err: unknown) {
        // If 401 Unauthorized, token actually expired; try refresh
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          try {
            const refreshRes = await api.auth.refresh();
            const newToken = refreshRes.data.access_token;
            setMemoryToken(newToken);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('learnflow_session_token', newToken);
            }
            set({ token: newToken });
          } catch {
            // Both expired, clean up session
            setMemoryToken(null);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('learnflow_session_token');
            }
            localStorage.removeItem('learnflow_user');
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      }
      return;
    }

    // Step B: No active session token found (fresh browser launch or cold start)
    // Perform silent atomic token refresh via HttpOnly cookie
    try {
      const res = await api.auth.refresh();
      const access_token = res.data.access_token;
      setMemoryToken(access_token);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('learnflow_session_token', access_token);
      }
      let userToSet = cachedUser;
      try {
        const meRes = await api.auth.me();
        if (meRes.data) {
          userToSet = { ...cachedUser, ...meRes.data };
          localStorage.setItem('learnflow_user', JSON.stringify(userToSet));
        }
      } catch {
        // preserve cachedUser if network or mock
      }
      set({ token: access_token, user: userToSet, isAuthenticated: true, isLoading: false });
    } catch {
      setMemoryToken(null);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('learnflow_session_token');
      }
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
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('learnflow_session_token', access_token);
      }
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
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('learnflow_session_token', access_token);
      }
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
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('learnflow_session_token');
      sessionStorage.setItem('learnflow_logging_out', 'true');
    }
    set({ token: null, user: null, isAuthenticated: false, error: null });
    api.auth.logout().catch(() => {});
  },

  hasRole: (role: 'admin' | 'instructor' | 'learner' | string) => {
    const user = get().user;
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name.toLowerCase() === role.toLowerCase());
  },

  getDefaultDashboardPath: () => {
    const user = get().user;
    if (!user || !user.roles) return '/courses';
    const roleNames = user.roles.map((r) => r.name.toLowerCase());
    if (roleNames.includes('admin')) return '/admin';
    if (roleNames.includes('instructor')) return '/instructor/courses';
    if (roleNames.includes('learner')) return '/my-learning';
    return '/courses';
  },

  updateUser: (updatedFields: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const first = updatedFields.first_name ?? currentUser.first_name;
    const last = updatedFields.last_name ?? currentUser.last_name;
    const fullName = `${first || ''} ${last || ''}`.trim() || updatedFields.full_name || currentUser.full_name;

    const updatedUser: User = {
      ...currentUser,
      ...updatedFields,
      first_name: first,
      last_name: last,
      full_name: fullName,
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('learnflow_user', JSON.stringify(updatedUser));
      } catch {
        // ignore quota error
      }
    }
    set({ user: updatedUser });

    // Sync profile edits to backend database
    if (get().isAuthenticated) {
      api.auth.updateProfile({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        avatar_gender: updatedUser.avatar_gender,
        bio: updatedUser.bio,
      }).catch(() => {});
    }
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
