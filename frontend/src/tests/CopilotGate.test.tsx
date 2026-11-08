import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CopilotGate } from '../App';
import { useAuthStore } from '../store/authStore';

// Mock LearnflowCopilot to keep test focused strictly on gate visibility
vi.mock('../components/ai/LearnflowCopilot', () => ({
  LearnflowCopilot: () => <div data-testid="learnflow-copilot">Learnflow Copilot Active</div>,
}));

describe('CopilotGate Visibility & Academic Integrity', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });

  const renderWithRoute = (initialRoute: string) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <CopilotGate />
      </MemoryRouter>
    );
  };

  it('hides Copilot for unauthenticated guests on public landing page /', () => {
    renderWithRoute('/');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot for unauthenticated guests on /verify', () => {
    renderWithRoute('/verify');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot for unauthenticated guests on /courses', () => {
    renderWithRoute('/courses');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot on /login for both unauthenticated and authenticated users', () => {
    const { unmount } = renderWithRoute('/login');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
    unmount();

    act(() => {
      useAuthStore.setState({ isAuthenticated: true });
    });
    renderWithRoute('/login');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot on /register for both unauthenticated and authenticated users', () => {
    const { unmount } = renderWithRoute('/register');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
    unmount();

    act(() => {
      useAuthStore.setState({ isAuthenticated: true });
    });
    renderWithRoute('/register');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot for authenticated learners on landing page /', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'learner@learnflow.edu',
        first_name: 'Ada',
        last_name: 'Lovelace',
        full_name: 'Ada Lovelace',
        is_active: true,
        roles: [{ id: 1, name: 'learner', description: 'Learner' }],
      },
      token: 'jwt-token',
    });

    renderWithRoute('/');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('hides Copilot for authenticated learners on /verify certificate routes', () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderWithRoute('/verify/CERT-12345');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('strictly hides Copilot for authenticated learners during active exam on /assessments/1', () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderWithRoute('/assessments/1');
    expect(screen.queryByTestId('learnflow-copilot')).not.toBeInTheDocument();
  });

  it('renders Copilot for authenticated learners in workspace /my-learning', () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderWithRoute('/my-learning');
    expect(screen.getByTestId('learnflow-copilot')).toBeInTheDocument();
  });

  it('renders Copilot for authenticated learners in /courses catalog', () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderWithRoute('/courses');
    expect(screen.getByTestId('learnflow-copilot')).toBeInTheDocument();
  });
});

