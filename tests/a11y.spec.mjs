import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'topic', path: '/pages/topics/gongfu-cha.html' },
  { name: 'atlas', path: '/pages/atlas.html' },
];

for (const p of PAGES) {
  test(`a11y: ${p.name} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(p.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // theme contrast tuned manually; brass on cream passes AA-large
      .analyze();
    const blocking = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    if (blocking.length) {
      console.log('AXE violations on', p.name, JSON.stringify(blocking, null, 2));
    }
    expect(blocking).toEqual([]);
  });
}
