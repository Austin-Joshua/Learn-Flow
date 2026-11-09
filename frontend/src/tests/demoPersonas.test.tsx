import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { LoginPage } from '../pages/LoginPage';
import { isDemoPersonasEnabled, DEMO_PERSONAS, getActiveDemoPersonas } from '../config/demoPersonas';

describe('Demo Personas Configuration & LoginPage Rendering', () => {
  const originalEnvValue = import.meta.env.VITE_ENABLE_DEMO_PERSONAS;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    if (originalEnvValue === undefined) {
      delete (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS;
    } else {
      (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS = originalEnvValue;
    }
    vi.unstubAllEnvs();
  });

  describe('isDemoPersonasEnabled helper', () => {
    it('returns false when VITE_ENABLE_DEMO_PERSONAS is "false"', () => {
      (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS = 'false';
      expect(isDemoPersonasEnabled()).toBe(false);
      expect(getActiveDemoPersonas()).toEqual([]);
    });

    it('returns true when VITE_ENABLE_DEMO_PERSONAS is "true"', () => {
      (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS = 'true';
      expect(isDemoPersonasEnabled()).toBe(true);
      expect(getActiveDemoPersonas().length).toBe(4);
    });

    it('returns true when VITE_ENABLE_DEMO_PERSONAS is unset', () => {
      delete (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS;
      expect(isDemoPersonasEnabled()).toBe(true);
      expect(getActiveDemoPersonas()).toEqual(DEMO_PERSONAS);
    });
  });

  describe('LoginPage persona buttons rendering', () => {
    it('does NOT render persona buttons when VITE_ENABLE_DEMO_PERSONAS="false"', () => {
      (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS = 'false';

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(screen.queryByText(/Role Personas/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Learner')).not.toBeInTheDocument();
      expect(screen.queryByText('Instructor')).not.toBeInTheDocument();
      expect(screen.queryByText('HOD')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('renders persona buttons when VITE_ENABLE_DEMO_PERSONAS is unset (default)', () => {
      delete (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS;

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(screen.getByText(/Role Personas/i)).toBeInTheDocument();
      expect(screen.getByText('Learner')).toBeInTheDocument();
      expect(screen.getByText('Instructor')).toBeInTheDocument();
      expect(screen.getByText('HOD')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders persona buttons when VITE_ENABLE_DEMO_PERSONAS="true"', () => {
      (import.meta.env as Record<string, unknown>).VITE_ENABLE_DEMO_PERSONAS = 'true';

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(screen.getByText(/Role Personas/i)).toBeInTheDocument();
      expect(screen.getByText('Learner')).toBeInTheDocument();
      expect(screen.getByText('Instructor')).toBeInTheDocument();
      expect(screen.getByText('HOD')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
