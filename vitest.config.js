import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['index.js', 'lib/**/*.js'],
      reporter: ['text', 'lcov'],
    },
  },
});
