/// <reference types="vite/client" />

declare const __APP_GIT_SHA__: string;

interface ImportMetaEnv {
  readonly VITE_GIT_SHA?: string;
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

