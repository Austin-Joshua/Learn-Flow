import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  setMemoryToken: vi.fn(),
  getMemoryToken: vi.fn(),
  subscribeAuthSync: vi.fn(() => () => {}),
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn().mockResolvedValue({ data: { message: 'Logged out' } }),
      me: vi.fn(),
    },
  },
}));

describe('authStore Authentication State Transitions', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('loadFromStorage restores user session and in-memory token via refresh endpoint', async () => {
    const mockUser = {
      id: 'u-1',
      email: 'learner@learnflow.edu',
      first_name: 'Ada',
      last_name: 'Lovelace',
      full_name: 'Ada Lovelace',
      is_active: true,
      roles: [{ id: 1, name: 'learner', description: 'Learner' }],
    };
    localStorage.setItem('learnflow_user', JSON.stringify(mockUser));

    vi.mocked(api.auth.refresh).mockResolvedValueOnce({
      data: {
        access_token: 'refreshed-memory-token',
      },
    } as AxiosResponse<{ access_token: string }>);

    await useAuthStore.getState().loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('refreshed-memory-token');
    expect(state.user?.email).toBe('learner@learnflow.edu');
    // Ensure access token is NEVER written to localStorage
    expect(localStorage.getItem('learnflow_token')).toBeNull();
  });

  it('loadFromStorage safely cleans corrupted localStorage payloads', async () => {
    localStorage.setItem('learnflow_user', '{corrupted_json_payload');

    await useAuthStore.getState().loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem('learnflow_user')).toBeNull();
    expect(localStorage.getItem('learnflow_token')).toBeNull();
  });

  it('login updates in-memory token and leaves localStorage free of tokens', async () => {
    const mockUser = {
      id: 'u-admin',
      email: 'admin@learnflow.edu',
      first_name: 'Platform',
      last_name: 'Admin',
      full_name: 'Platform Admin',
      is_active: true,
      roles: [{ id: 1, name: 'admin', description: 'Administrator' }],
    };

    vi.mocked(api.auth.login).mockResolvedValueOnce({
      data: {
        access_token: 'new-admin-token',
        token_type: 'bearer',
        user: mockUser,
      },
    } as AxiosResponse<{ access_token: string; token_type: string; user: typeof mockUser }>);

    const success = await useAuthStore.getState().login('admin@learnflow.edu', 'AdminPass123!');

    expect(success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('new-admin-token');
    expect(state.user?.email).toBe('admin@learnflow.edu');
    // Critical security assertion: token must be memory-only
    expect(localStorage.getItem('learnflow_token')).toBeNull();
    expect(localStorage.getItem('learnflow_user')).not.toBeNull();
  });

  it('logout completely purges in-memory token and localStorage user cache', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'active-session-token',
      user: {
        id: 'u-1',
        email: 'user@learnflow.edu',
        first_name: 'User',
        last_name: 'Name',
        full_name: 'User Name',
        is_active: true,
        roles: [],
      },
    });
    localStorage.setItem('learnflow_user', JSON.stringify({ email: 'user@learnflow.edu' }));

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem('learnflow_token')).toBeNull();
    expect(localStorage.getItem('learnflow_user')).toBeNull();
    expect(api.auth.logout).toHaveBeenCalled();
  });

  it('hasRole evaluates role permissions case-insensitively', () => {
    useAuthStore.setState({
      user: {
        id: 'u-hod',
        email: 'hod@learnflow.edu',
        first_name: 'Grace',
        last_name: 'Hopper',
        full_name: 'Grace Hopper',
        is_active: true,
        roles: [{ id: 4, name: 'HOD', description: 'Head of Department' }],
      },
    });

    expect(useAuthStore.getState().hasRole('hod')).toBe(true);
    expect(useAuthStore.getState().hasRole('HOD')).toBe(true);
    expect(useAuthStore.getState().hasRole('instructor')).toBe(false);
  });

  it('getDefaultDashboardPath maps roles to authoritative workspace paths', () => {
    const store = useAuthStore.getState();

    // Admin
    useAuthStore.setState({
      user: {
        id: '1', email: '', first_name: '', last_name: '', full_name: '', is_active: true,
        roles: [{ id: 1, name: 'admin', description: '' }]
      }
    });
    expect(store.getDefaultDashboardPath()).toBe('/admin');

    // HOD
    useAuthStore.setState({
      user: {
        id: '2', email: '', first_name: '', last_name: '', full_name: '', is_active: true,
        roles: [{ id: 2, name: 'hod', description: '' }]
      }
    });
    expect(store.getDefaultDashboardPath()).toBe('/hod');

    // Instructor
    useAuthStore.setState({
      user: {
        id: '3', email: '', first_name: '', last_name: '', full_name: '', is_active: true,
        roles: [{ id: 3, name: 'instructor', description: '' }]
      }
    });
    expect(store.getDefaultDashboardPath()).toBe('/instructor/courses');

    // Learner
    useAuthStore.setState({
      user: {
        id: '4', email: '', first_name: '', last_name: '', full_name: '', is_active: true,
        roles: [{ id: 4, name: 'learner', description: '' }]
      }
    });
    expect(store.getDefaultDashboardPath()).toBe('/my-learning');
  });
});
