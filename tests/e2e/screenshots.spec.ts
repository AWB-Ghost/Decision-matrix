import { test, type Page } from '@playwright/test';
import { addTask, answer } from './helpers';

const OUT = 'qa/screenshots';
async function fill(page: Page) {
  await addTask(page, 'Call my parents', 'No', 'Yes', 'No');
  await addTask(page, 'Reply to the vendor email', 'Yes', 'No', 'No');
  await addTask(page, 'Production incident follow-up', 'Yes', 'Yes', 'Yes');
  await addTask(page, 'Start a reading habit', 'No', 'Yes', 'Yes');
  await addTask(page, 'Weekly status meeting', 'Yes', 'No', 'Yes', 'Yes');
  await addTask(page, 'Watch the new series', 'No', 'No', 'Yes');
}
const shot = async (page: Page, name: string, fullPage = false) => {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
};

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  test('empty, answering, list', async ({ page }) => {
    await page.goto('/');
    await shot(page, 'mobile-empty-390');
    await page.getByLabel('Task', { exact: true }).fill('Weekly status meeting');
    await answer(page, 'Is it urgent?', 'Yes');
    await answer(page, 'Is it important to you?', 'No');
    await answer(page, 'Will it take more than 5 minutes?', 'Yes');
    await answer(page, 'Does this happen regularly?', 'Yes');
    await page.getByRole('radiogroup', { name: 'Does this happen regularly?' }).scrollIntoViewIfNeeded();
    await shot(page, 'mobile-answering-390');
    await page.getByLabel('Task', { exact: true }).fill('');
    await page.reload();
    await fill(page);
    await page.getByRole('heading', { name: 'Your list' }).scrollIntoViewIfNeeded();
    await shot(page, 'mobile-list-390');
    await shot(page, 'mobile-full-390', true);
  });
});
test.describe('320', () => {
  test.use({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  test('form at 320', async ({ page }) => {
    await page.goto('/');
    await shot(page, 'mobile-320');
  });
});
test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('board', async ({ page }) => {
    await page.goto('/');
    await shot(page, 'desktop-empty-1440');
    await fill(page);
    await page.getByRole('region', { name: 'Interruption buffer', exact: true }).getByRole('button', { name: /Weekly status meeting/ }).click();
    await shot(page, 'desktop-list-1440');
    await shot(page, 'desktop-full-1440', true);
  });
});
