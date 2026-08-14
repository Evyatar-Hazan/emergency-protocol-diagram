import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root: repositoryRoot,
  test: {
    environment: 'node',
    include: ['apps/server/src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['apps/server/src/__tests__/setup.ts'],
    coverage: {
      include: ['functions/**/*.ts'],
      exclude: ['functions/**/*.d.ts', 'functions/_lib/types.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
