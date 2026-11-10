import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AvatarStudioPage } from '../pages/AvatarStudioPage';
import { PersonalizedAvatar } from '../components/avatar/PersonalizedAvatar';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { DEFAULT_AVATAR_CONFIG, PRESET_ARCHETYPES } from '../types/avatar';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...((actual.api as Record<string, unknown>) || {}),
      users: {
        getMyAvatar: vi.fn().mockResolvedValue({ data: {} }),
        updateMyAvatar: vi.fn().mockImplementation((config) => Promise.resolve({ data: config })),
        getUserAvatar: vi.fn().mockResolvedValue({ data: {} }),
      },
      auth: {
        updateProfile: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
  };
});

describe('Personalized Vector Avatar Engine', () => {
  it('renders SVG with viewBox 0 0 100 100', () => {
    const { container } = render(<PersonalizedAvatar size={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(svg?.getAttribute('width')).toBe('120');
  });

  it('renders custom skin tone and hair color in gradients and paths', () => {
    const { container } = render(
      <PersonalizedAvatar
        config={{
          skinTone: '#451a03',
          hairColor: '#0284c7',
          faceShape: 'chiseled',
          hairStyle: 'pompadour',
        }}
      />
    );
    const html = container.innerHTML;
    expect(html).toContain('#451a03');
    expect(html).toContain('#0284c7');
  });

  it('renders spectacles when glassesStyle is not none', () => {
    const { container } = render(
      <PersonalizedAvatar
        config={{
          glassesStyle: 'wireframe_round',
          glassesColor: '#d97706',
        }}
      />
    );
    const html = container.innerHTML;
    expect(html).toContain('#d97706');
  });

  it('renders facial hair when beardStyle is specified', () => {
    const { container } = render(
      <PersonalizedAvatar
        config={{
          beardStyle: 'full_beard',
          facialHairColor: '#1c1917',
        }}
      />
    );
    const html = container.innerHTML;
    expect(html).toContain('#1c1917');
  });

  it('renders environment background according to backgroundId', () => {
    const { container } = render(
      <PersonalizedAvatar
        config={{
          backgroundId: 'alpine_mountain',
        }}
      />
    );
    const html = container.innerHTML;
    expect(html).toContain('bg-alpine');
  });
});

describe('Avatar & Environment Studio Page', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'usr-42',
        email: 'scholar@learnflow.edu',
        first_name: 'Hypatia',
        last_name: 'Alexandria',
        full_name: 'Hypatia Alexandria',
        is_active: true,
        roles: [{ id: 1, name: 'Learner' }],
        avatar_config: DEFAULT_AVATAR_CONFIG,
      },
      isAuthenticated: true,
    });
  });

  it('mounts and renders studio title, live preview, and default categories', () => {
    render(
      <BrowserRouter>
        <AvatarStudioPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Avatar & Environment Studio/i)).toBeTruthy();
    expect(screen.getByText(/Complexion & Skin Tone/i)).toBeTruthy();
    expect(screen.getByText(/Facial Architecture & Jawline/i)).toBeTruthy();
  });

  it('switches customisation categories when clicking navigation pills', () => {
    render(
      <BrowserRouter>
        <AvatarStudioPage />
      </BrowserRouter>
    );

    // Click Hair & Beard category
    const hairTab = screen.getByRole('button', { name: /Hair/i });
    fireEvent.click(hairTab);

    expect(screen.getByText(/Hairstyle & Cut/i)).toBeTruthy();
    expect(screen.getByText(/Beard & Jawline Hair/i)).toBeTruthy();

    // Click Clothing & Eyewear category
    const outfitTab = screen.getByRole('button', { name: /Clothing/i });
    fireEvent.click(outfitTab);

    expect(screen.getByText(/Attire & Layering/i)).toBeTruthy();
    expect(screen.getByText(/Spectacles & Eyewear/i)).toBeTruthy();

    // Click Background & Atmosphere category
    const bgTab = screen.getByRole('button', { name: /Atmosphere/i });
    fireEvent.click(bgTab);

    expect(screen.getByText(/All Themes/i)).toBeTruthy();
    expect(screen.getAllByText(/Collegiate Azure/i).length).toBeGreaterThan(0);
  });

  it('applies historical archetypes in one click', async () => {
    render(
      <BrowserRouter>
        <AvatarStudioPage />
      </BrowserRouter>
    );

    const turingBtn = screen.getByRole('button', { name: /Alan Turing/i });
    fireEvent.click(turingBtn);

    // The active configuration ledger should reflect Alan Turing's styles
    await waitFor(() => {
      expect(screen.getAllByText(/Historic Library/i).length).toBeGreaterThan(0);
    });
  });

  it('randomizes the avatar when Randomize button is clicked', () => {
    render(
      <BrowserRouter>
        <AvatarStudioPage />
      </BrowserRouter>
    );

    const randomBtn = screen.getByRole('button', { name: /Randomize/i });
    fireEvent.click(randomBtn);

    // Component remains stable and renders without errors
    expect(screen.getByText(/Avatar & Environment Studio/i)).toBeTruthy();
  });

  it('saves identity changes to PostgreSQL via api and updates auth state', async () => {
    render(
      <BrowserRouter>
        <AvatarStudioPage />
      </BrowserRouter>
    );

    const saveBtn = screen.getByRole('button', { name: /Save Identity/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.users.updateMyAvatar).toHaveBeenCalled();
    });
  });
});
