import { describe, it, expect } from 'vitest';
import { ROLE_NAVIGATION_MAP, getNavigationForUser } from '../config/navigation';

// Declared application routes
const DECLARED_APP_ROUTES = [
  '/',
  '/courses',
  '/courses/:id',
  '/verify',
  '/verify/:code',
  '/login',
  '/register',
  '/my-learning',
  '/my-journey',
  '/my-certificates',
  '/adaptive-path',
  '/lessons/:id',
  '/assessments/:id',
  '/assessments/:id/results/:attemptId',
  '/instructor/courses',
  '/instructor/courses/:id/builder',
  '/instructor/grading',
  '/instructor/courses/:id/analytics',
  '/admin',
  '/settings',
];

// Role authorization rules per route (undefined = public / any authenticated user)
const ROUTE_ROLE_PERMISSIONS: Record<string, string[]> = {
  '/my-learning': ['learner'],
  '/my-journey': ['learner'],
  '/my-certificates': ['learner', 'instructor', 'admin'],
  '/adaptive-path': ['learner'],
  '/lessons/:id': ['learner'],
  '/assessments/:id': ['learner'],
  '/assessments/:id/results/:attemptId': ['learner'],
  '/instructor/courses': ['instructor', 'admin'],
  '/instructor/courses/:id/builder': ['instructor', 'admin'],
  '/instructor/grading': ['instructor', 'admin'],
  '/instructor/courses/:id/analytics': ['instructor', 'admin'],
  '/admin': ['admin'],
  '/settings': ['learner', 'instructor', 'admin'],
};

describe('Navigation and Route Governance Matrix', () => {
  const roles = Object.keys(ROLE_NAVIGATION_MAP);

  describe('Every navigation item path matches a declared application route', () => {
    it.each(roles)('role "%s" nav paths all match declared routes', (role) => {
      const navItems = ROLE_NAVIGATION_MAP[role];
      expect(navItems.length).toBeGreaterThan(0);

      navItems.forEach((item) => {
        const matchesDeclaredRoute = DECLARED_APP_ROUTES.some((route) => {
          if (route === item.path) return true;
          // Handle parameterized routes if any
          const routePattern = new RegExp(`^${route.replace(/:[^\s/]+/g, '[^/]+')}$`);
          return routePattern.test(item.path);
        });

        expect(
          matchesDeclaredRoute,
          `Nav item "${item.label}" with path "${item.path}" in role "${role}" must match a declared route`
        ).toBe(true);
      });
    });
  });

  describe('Each role can reach every item in its own navigation map', () => {
    it.each([
      { role: 'learner', expectedRoles: ['learner'] },
      { role: 'instructor', expectedRoles: ['instructor'] },
      { role: 'admin', expectedRoles: ['admin'] },
      { role: 'public', expectedRoles: [] },
    ])('role "$role" has authorization to access every path in its navigation', ({ role, expectedRoles }) => {
      const navItems = getNavigationForUser(expectedRoles.map((r) => ({ name: r })));
      expect(navItems).toEqual(ROLE_NAVIGATION_MAP[role]);

      navItems.forEach((item) => {
        const requiredRoles = ROUTE_ROLE_PERMISSIONS[item.path];
        if (requiredRoles) {
          const hasAccess = expectedRoles.some((r) => requiredRoles.includes(r));
          expect(
            hasAccess,
            `Role "${role}" should have access to nav route "${item.path}" (requires: ${requiredRoles.join(', ')})`
          ).toBe(true);
        }
      });
    });
  });

  describe('Admin navigation specific accessibility verification', () => {
    it('verifies seeded admin can reach instructor studio without 403', () => {
      const adminNav = getNavigationForUser([{ name: 'admin' }]);
      const instructorCoursesItem = adminNav.find((i) => i.path === '/instructor/courses');
      expect(instructorCoursesItem).toBeDefined();

      const requiredForInstructorCourses = ROUTE_ROLE_PERMISSIONS['/instructor/courses'];
      expect(requiredForInstructorCourses).toContain('admin');
    });
  });
});
