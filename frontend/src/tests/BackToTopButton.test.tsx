import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { BackToTopButton } from '../components/common/BackToTopButton';

describe('BackToTopButton Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollY = 0;
    window.scrollTo = vi.fn();
    Object.defineProperty(document.documentElement, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  it('is initially hidden when scroll is at the top', () => {
    render(
      <MemoryRouter>
        <BackToTopButton threshold={300} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /Back to top of page/i })).not.toBeInTheDocument();
  });

  it('becomes visible when scrolled past the threshold and smooth-scrolls to top on click', () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(
      <MemoryRouter>
        <BackToTopButton threshold={300} />
      </MemoryRouter>
    );

    // Simulate scrolling past threshold
    act(() => {
      window.scrollY = 450;
      fireEvent.scroll(window);
    });

    // Button should now be visible
    const button = screen.getByRole('button', { name: /Back to top of page/i });
    expect(button).toBeInTheDocument();

    // Click button to smooth scroll back to top
    fireEvent.click(button);

    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        behavior: 'smooth',
      })
    );
  });

  it('hides again when scrolled back up above the threshold', async () => {
    render(
      <MemoryRouter>
        <BackToTopButton threshold={300} />
      </MemoryRouter>
    );

    // Scroll down
    act(() => {
      window.scrollY = 500;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole('button', { name: /Back to top of page/i })).toBeInTheDocument();

    // Scroll back up
    act(() => {
      window.scrollY = 100;
      fireEvent.scroll(window);
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Back to top of page/i })).not.toBeInTheDocument();
    });
  });

  it('resets and hides when navigating to a new route', async () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(
      <MemoryRouter initialEntries={['/courses']}>
        <div>
          <Link to="/settings">Go to Settings</Link>
          <Routes>
            <Route path="/courses" element={<div>Courses Page</div>} />
            <Route path="/settings" element={<div>Settings Page</div>} />
          </Routes>
          <BackToTopButton threshold={300} />
        </div>
      </MemoryRouter>
    );

    // Scroll down on /courses
    act(() => {
      window.scrollY = 600;
      fireEvent.scroll(window);
    });
    expect(screen.getByRole('button', { name: /Back to top of page/i })).toBeInTheDocument();

    // Navigate to /settings
    const link = screen.getByText('Go to Settings');
    act(() => {
      fireEvent.click(link);
    });

    // Should have reset scroll
    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
      })
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Back to top of page/i })).not.toBeInTheDocument();
    });
  });
});

