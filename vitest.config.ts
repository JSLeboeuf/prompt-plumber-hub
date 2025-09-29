import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    include: [
      'src/**/*.{spec,test}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    // Disable threading to avoid native module issues with rollup
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      lines: 0.8,
      functions: 0.8,
      branches: 0.7,
      statements: 0.8,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': process.env,
  },
  // Force disable rollup native optimizations
  optimizeDeps: {
    disabled: true
  },
});
