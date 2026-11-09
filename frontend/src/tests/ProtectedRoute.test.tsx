import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';

describe('ProtectedRoute Role Redirection & RBAC Enforcement', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });

  it('redirects unauthenticated users to /login', () => {
    render(
      <MemoryRouter initialEntries={['/my-learning']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route
            path="/my-learning"
            element={
              <ProtectedRoute requiredRole="learner">
                <div>Learner Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Learner Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to landing page / when user is logging out', () => {
    sessionStorage.setItem('learnflow_logging_out', 'true');
    render(
      <MemoryRouter initialEntries={['/my-learning']}>
        <Routes>
          <Route path="/" element={<div>Landing Page Target</div>} />
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route
            path="/my-learning"
            element={
              <ProtectedRoute requiredRole="learner">
                <div>Learner Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Landing Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Login Page Target')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('learnflow_logging_out')).toBeNull();
  });

  it('renders children when authenticated user has the required role', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u-1',
        email: 'instructor@learnflow.edu',
        first_name: 'Alan',
        last_name: 'Turing',
        full_name: 'Alan Turing',
        is_active: true,
        roles: [{ id: 2, name: 'instructor', description: 'Instructor' }],
      },
      token: 'jwt-instructor',
    });

    render(
      <MemoryRouter initialEntries={['/instructor/courses']}>
        <Routes>
          <Route
            path="/instructor/courses"
            element={
              <ProtectedRoute requiredRole="instructor">
                <div>Instructor Studio Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Instructor Studio Dashboard')).toBeInTheDocument();
  });

  it('blocks access and displays 403 Forbidden screen when user lacks required role', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u-2',
        email: 'learner@learnflow.edu',
        first_name: 'Ada',
        last_name: 'Lovelace',
        full_name: 'Ada Lovelace',
        is_active: true,
        roles: [{ id: 3, name: 'learner', description: 'Learner' }],
      },
      token: 'jwt-learner',
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Administrative Operations</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Access Denied · 403 Forbidden/i)).toBeInTheDocument();
    expect(screen.queryByText('Administrative Operations')).not.toBeInTheDocument();
  });
});

