import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

function resolveGitSha(): string {
  if (process.env.VITE_GIT_SHA) {
    return process.env.VITE_GIT_SHA.trim();
  }
  try {
    return execSync('git rev-parse HEAD', { cwd: __dirname }).toString().trim();
  } catch {
    try {
      return execSync('git rev-parse HEAD', { cwd: '..' }).toString().trim();
    } catch {
      return process.env.GIT_SHA || 'unknown';
    }
  }
}

const GIT_SHA = resolveGitSha();

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_GIT_SHA__: JSON.stringify(GIT_SHA),
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
