import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from '../pages/SettingsPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...((actual.api as Record<string, unknown>) || {}),
      auth: {
        changePassword: vi.fn().mockResolvedValue({ message: 'Success' }),
        updateProfile: vi.fn().mockResolvedValue({ id: 'usr-42', email: 'xiofik.hasan@learnflow.edu' }),
      },
    },
  };
});

describe('Restructured SettingsPage - Reference Design Compliance', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'usr-42',
        email: 'xiofik.hasan@learnflow.edu',
        first_name: 'XioFik',
        last_name: 'Hasan',
        full_name: 'XioFik Hasan',
        is_active: true,
        roles: [{ id: 1, name: 'learner' }],
      },
      token: 'mock-token',
      isAuthenticated: true,
    });
  });

  it('renders reference header, breadcrumb, subtitle, and search bar', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Breadcrumb & Page Title
    expect(screen.getByText('Setting')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Account Settings/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Manage your preferences, security, and connected tools all in one place/i)
    ).toBeInTheDocument();

    // Search bar
    expect(screen.getByPlaceholderText(/Search by\.\.\./i)).toBeInTheDocument();
  });

  it('renders Personal Information card matching reference design with upload and trash buttons', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Section title
    expect(screen.getByRole('heading', { name: /Personal Information/i })).toBeInTheDocument();
    expect(screen.getByText(/Edit your personal infoprmations/i)).toBeInTheDocument();

    // Action buttons next to avatar
    expect(screen.getByRole('button', { name: /Upload An Image/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Remove custom image/i)).toBeInTheDocument();

    // Form fields from reference
    expect(screen.getByPlaceholderText('XioFik')).toHaveValue('XioFik');
    expect(screen.getByPlaceholderText('Hasan')).toHaveValue('Hasan');
    expect(screen.getByPlaceholderText('examplemail@gmail.com')).toHaveValue('xiofik.hasan@learnflow.edu');
    expect(screen.getByText(/English/i)).toBeInTheDocument();
    expect(screen.getByText(/UTC \+07:00 - Asia \/ US/i)).toBeInTheDocument();
  });

  it('allows country code selection and updating phone number', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Country flag dropdown button (default Canada 🇨🇦)
    const flagBtn = screen.getByText('🇨🇦').closest('button');
    expect(flagBtn).toBeInTheDocument();

    fireEvent.click(flagBtn!);
    // Open dropdown and select United States 🇺🇸
    const usOption = screen.getByText(/United States/i);
    fireEvent.click(usOption);

    expect(screen.getByText('🇺🇸')).toBeInTheDocument();

    // Phone number input
    const phoneInput = screen.getByPlaceholderText('+000 000-000 00');
    fireEvent.change(phoneInput, { target: { value: '+1 555-0199' } });
    expect(phoneInput).toHaveValue('+1 555-0199');
  });

  it('switches tabs and filters via the search bar', async () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Typing 'password' into search input automatically switches to Security tab
    const searchInput = screen.getByPlaceholderText(/Search by\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'password' } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
      expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    });

    // Typing 'notification' automatically switches to Notification Controls tab
    fireEvent.change(searchInput, { target: { value: 'notification' } });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Notification Controls/i })).toBeInTheDocument();
    });
  });

  it('saves changes and updates localStorage preferences', async () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    const firstNameInput = screen.getByPlaceholderText('XioFik');
    fireEvent.change(firstNameInput, { target: { value: 'Alex' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your profile settings have been updated/i)).toBeInTheDocument();
    });

    const savedPrefs = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
    expect(savedPrefs.firstName).toBe('Alex');
  });
});
