export interface DemoPersona {
  role: string;
  label: string;
  email: string;
  password: string;
}

export const DEMO_PERSONAS: readonly DemoPersona[] = [
  {
    role: 'Learner',
    label: 'Student',
    email: import.meta.env.VITE_DEMO_LEARNER_EMAIL || 'learner@learnflow.edu',
    password: import.meta.env.VITE_DEMO_LEARNER_PASSWORD || 'LearnerPass123!',
  },
  {
    role: 'Instructor',
    label: 'Faculty',
    email: import.meta.env.VITE_DEMO_INSTRUCTOR_EMAIL || 'instructor@learnflow.edu',
    password: import.meta.env.VITE_DEMO_INSTRUCTOR_PASSWORD || 'InstructorPass123!',
  },
  {
    role: 'HOD',
    label: 'Dept Head',
    email: import.meta.env.VITE_DEMO_HOD_EMAIL || 'hod@learnflow.edu',
    password: import.meta.env.VITE_DEMO_HOD_PASSWORD || 'HodPass123!',
  },
  {
    role: 'Admin',
    label: 'Sys Admin',
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@learnflow.edu',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'AdminPass123!',
  },
];

export const isDemoPersonasEnabled = (): boolean =>
  import.meta.env.VITE_ENABLE_DEMO_PERSONAS !== 'false';

export const getActiveDemoPersonas = (): readonly DemoPersona[] =>
  isDemoPersonasEnabled() ? DEMO_PERSONAS : [];
