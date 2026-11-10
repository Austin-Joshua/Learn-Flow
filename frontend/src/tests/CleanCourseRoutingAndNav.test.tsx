import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { getCourseDetailUrl, getCourseBuilderUrl, getCourseAnalyticsUrl } from '../utils/courseUrls';
import { dataCache } from '../utils/dataCache';
import { getNavigationForUser } from '../config/navigation';
import { RootRedirect } from '../App';
import { CourseDetailPage } from '../pages/CourseDetailPage';
import { useAuthStore } from '../store/authStore';
import { Course } from '../types';

const mockCourse: Course = {
  id: 'e87a5064-efd5-4a1f-813c-f4aaa39d5d6b',
  slug: 'system-design-distributed-architecture',
  title: 'Full-Stack System Design & Distributed Architecture',
  description: 'Master high-concurrency systems and distributed architecture.',
  difficulty: 'intermediate',
  status: 'published',
  sequential_modules: true,
  instructor_id: 'inst-1',
  instructor_name: 'Alan Turing',
  modules: [],
  prerequisite_courses: [],
};

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...((actual.api as Record<string, unknown>) || {}),
      courses: {
        getDetail: vi.fn().mockImplementation((idOrSlug) => {
          if (
            idOrSlug === 'system-design-distributed-architecture' ||
            idOrSlug === 'e87a5064-efd5-4a1f-813c-f4aaa39d5d6b'
          ) {
            return Promise.resolve({ data: mockCourse });
          }
          return Promise.reject(new Error('Course not found'));
        }),
        getAssessments: vi.fn().mockResolvedValue({ data: [] }),
        getFeedback: vi.fn().mockResolvedValue({ data: { course_id: 'e87a5064-efd5-4a1f-813c-f4aaa39d5d6b', average_rating: 4.9, total_reviews: 12, rating_distribution: {}, feedbacks: [] } }),
      },
      enrollments: {
        myCourses: vi.fn().mockResolvedValue({ data: [] }),
      },
      assignments: {
        listForCourse: vi.fn().mockResolvedValue({ data: [] }),
      },
      certificates: {
        getCompletionStatus: vi.fn().mockResolvedValue({ data: { is_eligible: false, criteria_results: [] } }),
      },
    },
  };
});

describe('Clean Course Routing & Canonical URLs', () => {
  it('generates clean human-readable slug URLs', () => {
    expect(getCourseDetailUrl(mockCourse)).toBe('/courses/system-design-distributed-architecture');
    expect(getCourseBuilderUrl(mockCourse)).toBe('/instructor/courses/system-design-distributed-architecture/builder');
    expect(getCourseAnalyticsUrl(mockCourse)).toBe('/instructor/courses/system-design-distributed-architecture/analytics');
  });

  it('falls back to ID gracefully if slug is absent', () => {
    const courseNoSlug = { id: 'c-101', title: 'Bare Metal C' };
    expect(getCourseDetailUrl(courseNoSlug)).toBe('/courses/c-101');
    expect(getCourseBuilderUrl(courseNoSlug)).toBe('/instructor/courses/c-101/builder');
  });
});

describe('Two-Tier Stale-While-Revalidate Data Cache', () => {
  beforeEach(() => {
    dataCache.clear();
  });

  it('stores and retrieves data with 0ms in-memory latency and sessionStorage persistence', () => {
    const payload = [{ id: '1', title: 'Fast Retrieval' }];
    dataCache.set('test_perf_key', payload);

    // Retrieve from memory tier
    const fromMem = dataCache.get<typeof payload>('test_perf_key');
    expect(fromMem).toEqual(payload);

    // Clear memory tier to test sessionStorage tier
    (dataCache as unknown as { memoryCache: Map<string, unknown> }).memoryCache?.clear();

    const fromSession = dataCache.get<typeof payload>('test_perf_key');
    expect(fromSession).toEqual(payload);
  });
});

describe('Role Home Page & Navigation Naming Matrix', () => {
  it('sets Home as the primary base page for Learner, Instructor, and Admin', () => {
    const learnerNav = getNavigationForUser([{ name: 'learner' }]);
    expect(learnerNav[0].label).toBe('Home');
    expect(learnerNav[0].mobileLabel).toBe('Home');
    expect(learnerNav[0].path).toBe('/my-learning');

    const instructorNav = getNavigationForUser([{ name: 'instructor' }]);
    expect(instructorNav[0].label).toBe('Home');
    expect(instructorNav[0].mobileLabel).toBe('Home');
    expect(instructorNav[0].path).toBe('/instructor/courses');

    const adminNav = getNavigationForUser([{ name: 'admin' }]);
    expect(adminNav[0].label).toBe('Home');
    expect(adminNav[0].mobileLabel).toBe('Home');
    expect(adminNav[0].path).toBe('/admin');
  });

  it('redirects authenticated users on root "/" directly to their home dashboard without lag', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'usr-1',
        email: 'learner@learnflow.edu',
        first_name: 'Hypatia',
        last_name: 'Alexandria',
        full_name: 'Hypatia Alexandria',
        is_active: true,
        roles: [{ id: 1, name: 'learner' }],
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/my-learning" element={<div data-testid="learner-home">Learner Home Base</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('learner-home')).toBeTruthy();
  });
});

describe('CourseDetailPage Slug Resolution & Browser Title Sync', () => {
  it('loads course detail via clean slug and sets document title', async () => {
    render(
      <MemoryRouter initialEntries={['/courses/system-design-distributed-architecture']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Full-Stack System Design & Distributed Architecture/i)).toBeTruthy();
      expect(document.title).toContain('Full-Stack System Design & Distributed Architecture');
    });
  });
});
