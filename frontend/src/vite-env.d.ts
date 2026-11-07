/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_DEMO_PERSONAS?: string;
  readonly VITE_DEMO_LEARNER_EMAIL?: string;
  readonly VITE_DEMO_LEARNER_PASSWORD?: string;
  readonly VITE_DEMO_INSTRUCTOR_EMAIL?: string;
  readonly VITE_DEMO_INSTRUCTOR_PASSWORD?: string;
  readonly VITE_DEMO_ADMIN_EMAIL?: string;
  readonly VITE_DEMO_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

