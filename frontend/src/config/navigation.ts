import {
  GraduationCap,
  Compass,
  Library,
  Sparkles,
  Award,
  ClipboardCheck,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Home,
  Settings2,
  Settings,
  Layers,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  mobileLabel?: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  isPrimaryMobile?: boolean; // Included in mobile bottom 4-slot tab bar
}

export const ROLE_NAVIGATION_MAP: Record<string, NavItem[]> = {
  learner: [
    { id: 'my-learning', label: 'My Learning', mobileLabel: 'Learning', path: '/my-learning', icon: GraduationCap, isPrimaryMobile: true },
    { id: 'my-journey', label: 'My Journey', mobileLabel: 'Journey', path: '/my-journey', icon: Compass, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: Library, isPrimaryMobile: true },
    { id: 'adaptive', label: 'Adaptive Path', mobileLabel: 'Path', path: '/adaptive-path', icon: Sparkles, isPrimaryMobile: true },
    { id: 'credentials', label: 'Credentials', mobileLabel: 'Certificates', path: '/my-certificates', icon: Award, isPrimaryMobile: false },
    { id: 'verify', label: 'Public Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', path: '/settings', icon: Settings2, isPrimaryMobile: false },
  ],
  instructor: [
    { id: 'instructor-courses', label: 'Course Studio', mobileLabel: 'Studio', path: '/instructor/courses', icon: Layers, isPrimaryMobile: true },
    { id: 'instructor-grading', label: 'Grading Queue', mobileLabel: 'Grading', path: '/instructor/grading', icon: ClipboardCheck, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: true },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', path: '/settings', icon: Settings, isPrimaryMobile: true },
    { id: 'verify', label: 'Verification', mobileLabel: 'Verify', path: '/verify', icon: ShieldCheck, isPrimaryMobile: false },
  ],
  admin: [
    { id: 'admin-portal', label: 'System Governance', mobileLabel: 'Admin', path: '/admin', icon: ShieldAlert, isPrimaryMobile: true },
    { id: 'instructor-courses', label: 'Instructor Studio', mobileLabel: 'Studio', path: '/instructor/courses', icon: Layers, isPrimaryMobile: true },
    { id: 'catalog', label: 'Course Catalog', mobileLabel: 'Catalog', path: '/courses', icon: BookOpen, isPrimaryMobile: true },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', path: '/settings', icon: Settings, isPrimaryMobile: true },
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
  if (roleNames.includes('instructor')) return ROLE_NAVIGATION_MAP.instructor;
  if (roleNames.includes('learner')) return ROLE_NAVIGATION_MAP.learner;
  return ROLE_NAVIGATION_MAP.public;
}

