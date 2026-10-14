// Unit tests: plain functions in src/lib/, the data files and the color tokens.
// Pages are tested in a real browser by tests/e2e/ (Playwright).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
