import { defineConfig, devices } from '@playwright/test';

// Full live-site sweep against production. Run via `npm run test:live`.
// Tests use root-relative paths like `/pages/atlas.html`; the basepath
// fixture in tests/_fixtures.mjs prepends `/misbah-exploration` when
// MISBAH_BASE_PATH is set.
process.env.MISBAH_BASE_PATH = '/misbah-exploration';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    baseURL: 'https://hunterdellere.github.io',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      // Skip a11y on mobile — axe rules duplicate the chromium pass and
      // mobile viewport occasionally collapses the TOC away which we already
      // assert on chromium.
      testIgnore: ['**/a11y.spec.mjs'],
      use: { ...devices['iPhone 13'] },
    },
  ],
});
