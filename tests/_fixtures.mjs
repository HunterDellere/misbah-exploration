// Custom test fixture that rewrites absolute paths to include the subpath
// when the live config sets MISBAH_BASE_PATH.
import { test as base, expect } from '@playwright/test';

const BASE_PATH = process.env.MISBAH_BASE_PATH || '';

export const test = base.extend({
  page: async ({ page }, use) => {
    if (BASE_PATH) {
      const origGoto = page.goto.bind(page);
      page.goto = (url, opts) => {
        if (typeof url === 'string' && url.startsWith('/') && !url.startsWith(BASE_PATH)) {
          url = BASE_PATH.replace(/\/$/, '') + url;
        }
        return origGoto(url, opts);
      };
      const origRequestGet = page.request.get.bind(page.request);
      page.request.get = (url, opts) => {
        if (typeof url === 'string' && url.startsWith('/') && !url.startsWith(BASE_PATH)) {
          url = BASE_PATH.replace(/\/$/, '') + url;
        }
        return origRequestGet(url, opts);
      };
    }
    await use(page);
  },
});

export { expect };
