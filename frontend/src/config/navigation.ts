import {
  BookOpen,
  Compass,
  Layers,
  GitBranch,
  Award,
  ClipboardCheck,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Home,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  mobileLabel?: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  isPrimaryMobile?: boolean; // Included in mobile bottom 5-slot tab bar
}

export const ROLE_NAVIGATION_MAP: Record<string, NavItem[]> = {
  learner: [
    { id: 'my-learning', label: 'My Learning', mobileLabel: 'Learning', path: '/my-learning', icon: BookOpen, isPrimaryMobile: true },
    { id: 'my-journey', label: 'My Journey', mobileLabel: 'Journey', path: '/my-journey', icon: Compass, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: Layers, isPrimaryMobile: true },
    { id: 'adaptive', label: 'Adaptive Path', mobileLabel: 'Path', path: '/adaptive-path', icon: GitBranch, isPrimaryMobile: true },
    { id: 'credentials', label: 'Credentials', mobileLabel: 'Diplomas', path: '/my-certificates', icon: Award, isPrimaryMobile: false },
    { id: 'verify', label: 'Public Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
  ],
  instructor: [
    { id: 'instructor-courses', label: 'Course Studio', mobileLabel: 'Courses', path: '/instructor/courses', icon: Layers, isPrimaryMobile: true },
    { id: 'instructor-grading', label: 'Grading Queue', mobileLabel: 'Grading', path: '/instructor/grading', icon: ClipboardCheck, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: true },
    { id: 'verify', label: 'Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
  ],
  hod: [
    { id: 'hod-portal', label: 'Department Portal', mobileLabel: 'Portal', path: '/hod', icon: Building2, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: true },
    { id: 'verify', label: 'Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
  ],
  admin: [
    { id: 'admin-portal', label: 'System Governance', mobileLabel: 'Admin', path: '/admin', icon: ShieldAlert, isPrimaryMobile: true },
    { id: 'hod-portal', label: 'Department Portal', mobileLabel: 'HOD', path: '/hod', icon: Building2, isPrimaryMobile: true },
    { id: 'instructor-courses', label: 'Instructor Studio', mobileLabel: 'Faculty', path: '/instructor/courses', icon: Layers, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: false },
    { id: 'verify', label: 'Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
  ],
  public: [
    { id: 'home', label: 'Home', mobileLabel: 'Home', path: '/', icon: Home, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: true },
    { id: 'verify', label: 'Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: true },
  ]
};

export function getNavigationForUser(roles: Array<{ name: string } | string>): NavItem[] {
  const roleNames = roles.map((r) => (typeof r === 'string' ? r : r.name));
  
  // Highest authority priority determines primary navigation set
  if (roleNames.includes('admin')) return ROLE_NAVIGATION_MAP.admin;
  if (roleNames.includes('hod')) return ROLE_NAVIGATION_MAP.hod;
  if (roleNames.includes('instructor')) return ROLE_NAVIGATION_MAP.instructor;
  if (roleNames.includes('learner')) return ROLE_NAVIGATION_MAP.learner;
  return ROLE_NAVIGATION_MAP.public;
}

