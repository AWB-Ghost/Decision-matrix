import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { addTask, expectNoHorizontalOverflow } from './helpers';

const sizes = [[320, 700], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900]] as const;

test.describe('layout', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');
  for (const [w, h] of sizes) {
    test(`no sideways scroll at ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await addTask(page, 'A deliberately long task name that should truncate neatly rather than push the layout wider than the screen', 'Yes', 'No', 'Yes', 'Yes');
      await expectNoHorizontalOverflow(page);
    });
  }
  test('axe: no serious accessibility violations (empty and filled)', async ({ page }) => {
    await page.goto('/');
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
    await addTask(page, 'Call my parents', 'No', 'Yes', 'No');
    await addTask(page, 'Status meeting', 'Yes', 'No', 'Yes', 'Yes');
    await page.waitForTimeout(400); // let the toast's 180ms fade-in finish so contrast is measured at full opacity
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  });
});
