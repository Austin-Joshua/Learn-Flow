/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  setMemoryToken: vi.fn(),
  getMemoryToken: vi.fn(),
  subscribeAuthSync: vi.fn(() => () => {}),
  subscribeUserSync: vi.fn(() => () => {}),
  broadcastUserSync: vi.fn(),
  api: {
    system: {
      getNotifications: vi.fn().mockResolvedValue({ data: [] }),
    },
    auth: {
      changePassword: vi.fn().mockResolvedValue({ data: { message: 'Password updated successfully' } }),
      logout: vi.fn().mockResolvedValue({ data: {} }),
      updateProfile: vi.fn().mockResolvedValue({ data: {} }),
    },
    users: {
      getMyAvatar: vi.fn().mockResolvedValue({ data: null }),
      updateMyAvatar: vi.fn().mockResolvedValue({ data: {} }),
    },
  },
}));

describe('AppShell Profile Dropdown & Real-Time Sync', () => {
  const mockUser = {
    id: 'user-learner-01',
    email: 'learner@learnflow.edu',
    first_name: 'Ada',
    last_name: 'Lovelace',
    full_name: 'Ada Lovelace',
    is_active: true,
    roles: [{ id: 1, name: 'Learner' }],
    avatar_gender: 'female',
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: mockUser as any,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it('renders the 3 functions in the dropdown: My Account, Change Password, and Logout', async () => {
    render(
      <MemoryRouter initialEntries={['/my-learning']}>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Open profile menu
    const profileBtn = screen.getAllByLabelText(/Account Profile Menu/i)[0];
    fireEvent.click(profileBtn);

    // Upper half contains avatar and user info and links to /avatar-studio
    const upperLink = screen.getByLabelText(/Manage Avatar and Atmosphere Studio/i);
    expect(upperLink).toBeInTheDocument();
    expect(upperLink.getAttribute('href')).toBe('/avatar-studio');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('learner@learnflow.edu')).toBeInTheDocument();

    // The 3 functions are present
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();

    // Verify My Account links to /settings
    const myAccountLink = screen.getByText('My Account').closest('a');
    expect(myAccountLink?.getAttribute('href')).toBe('/settings');

    // Verify old duplicate links are removed from menu list
    expect(screen.queryByText('Avatar & Atmosphere Studio')).not.toBeInTheDocument();
    expect(screen.queryByText('My Credentials & Profile')).not.toBeInTheDocument();
  });

  it('submits genuine change password request to backend API', async () => {
    render(
      <MemoryRouter initialEntries={['/my-learning']}>
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      </MemoryRouter>
    );

    // Open profile menu
    fireEvent.click(screen.getAllByLabelText(/Account Profile Menu/i)[0]);

    // Click Change Password button
    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    // Modal opens
    expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();

    // Fill inputs
    fireEvent.change(screen.getByPlaceholderText(/Enter current password/i), {
      target: { value: 'CurrentSecret123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 8 characters/i), {
      target: { value: 'NewSuperSecret123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter new password/i), {
      target: { value: 'NewSuperSecret123!' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(api.auth.changePassword).toHaveBeenCalledWith({
        current_password: 'CurrentSecret123!',
        new_password: 'NewSuperSecret123!',
      });
      expect(screen.getByText(/Password Updated Successfully/i)).toBeInTheDocument();
    });
  });

  it('dispatches learnflow_user_updated and broadcasts when updateUser is called', () => {
    const eventSpy = vi.fn();
    window.addEventListener('learnflow_user_updated', eventSpy);

    useAuthStore.getState().updateUser({
      first_name: 'Grace',
      last_name: 'Hopper',
    });

    expect(eventSpy).toHaveBeenCalled();
    const updated = useAuthStore.getState().user;
    expect(updated?.first_name).toBe('Grace');
    expect(updated?.full_name).toBe('Grace Hopper');

    window.removeEventListener('learnflow_user_updated', eventSpy);
  });
});
