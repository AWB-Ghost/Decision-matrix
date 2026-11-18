import { expect, type Page } from '@playwright/test';

type YN = 'Yes' | 'No';
export async function answer(page: Page, question: string, value: YN) {
  await page.getByRole('radiogroup', { name: question }).getByRole('radio', { name: value }).click();
}

export async function addTask(page: Page, title: string, u: YN, i: YN, l: YN, recurring?: YN) {
  await page.getByLabel('Task', { exact: true }).fill(title);
  await answer(page, 'Is it urgent?', u);
  await answer(page, 'Is it important to you?', i);
  await answer(page, 'Will it take more than 5 minutes?', l);
  if (recurring) await answer(page, 'Does this happen regularly?', recurring);
  await page.getByRole('button', { name: 'Add to list' }).click();
}

export function bucket(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true });
}

export async function expectNoHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, `page is ${sw}px wide in a ${iw}px viewport`).toBeLessThanOrEqual(iw);
}
