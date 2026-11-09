import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PersonalizedProgressTelemetry } from '../components/dashboard/PersonalizedProgressTelemetry';
import { User, Course } from '../types';

describe('PersonalizedProgressTelemetry Component', () => {
  const mockUser: User = {
    id: '1',
    email: 'learner@learnflow.edu',
    first_name: 'Ada',
    last_name: 'Lovelace',
    full_name: 'Ada Lovelace',
    is_active: true,
    roles: [{ id: 1, name: 'Learner' }],
  };

  const mockCourses: Course[] = [
    {
      id: 'c1',
      title: 'Full-Stack System Design',
      slug: 'full-stack-systems',
      progress_percentage: 50,
      difficulty: 'intermediate',
      status: 'published',
      instructor_id: 'inst-1',
      modules: [],
    },
  ];

  it('renders account readiness overview with tabs and percentage', () => {
    render(
      <MemoryRouter>
        <PersonalizedProgressTelemetry user={mockUser} courses={mockCourses} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Academic Account Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/5-Day Active Streak/i)).toBeInTheDocument();
  });

  it('switches to velocity tab and shows weekly study momentum', () => {
    render(
      <MemoryRouter>
        <PersonalizedProgressTelemetry user={mockUser} courses={mockCourses} />
      </MemoryRouter>
    );

    const velocityTab = screen.getByRole('button', { name: /Weekly Study Velocity/i });
    fireEvent.click(velocityTab);

    expect(screen.getByText(/Weekly Learning Hours & Study Momentum/i)).toBeInTheDocument();
    expect(screen.getByText(/Consistency Target/i)).toBeInTheDocument();
  });

  it('switches to competency radar tab', () => {
    render(
      <MemoryRouter>
        <PersonalizedProgressTelemetry user={mockUser} courses={mockCourses} />
      </MemoryRouter>
    );

    const compTab = screen.getByRole('button', { name: /Competency Radar/i });
    fireEvent.click(compTab);

    expect(screen.getByText(/Domain Competency & Skill Distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Systems Architecture/i)).toBeInTheDocument();
  });
});
