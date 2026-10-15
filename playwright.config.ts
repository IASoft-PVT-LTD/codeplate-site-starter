// Screen tests: a real browser against the built site, served by `astro preview`
// (the production build, with the form endpoint running through the adapter).
//   npm run build && npm run e2e      (npm run check does both)
// PW_CHANNEL=msedge (or chrome) uses an installed browser instead of the one
// from `npm run setup`.
import { defineConfig } from '@playwright/test';

const PORT = 4398;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 30_000,
  reporter: [['list']],
  outputDir: '.data/test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // --ignore-lock: run even if you have `astro preview` open yourself.
    command: `node node_modules/astro/bin/astro.mjs preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    env: { FORM_PROVIDER: 'console' },
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
