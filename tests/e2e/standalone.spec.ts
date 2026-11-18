import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { addTask, bucket } from './helpers';

// The single-file build must work opened straight from disk (file://), with no server.
const file = `${process.cwd()}/standalone/triage.html`;
test('standalone triage.html works from file://', async ({ page, browserName }) => {
  test.skip(!existsSync(file), 'run npm run build:standalone first');
  test.skip(browserName !== 'chromium', 'once is enough');
  await page.goto(pathToFileURL(file).href);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What should you do next?');
  await addTask(page, 'Call my parents', 'No', 'Yes', 'No');
  await expect(bucket(page, 'Do now').getByText('Call my parents')).toBeVisible();
  await page.reload();
  await expect(bucket(page, 'Do now').getByText('Call my parents')).toBeVisible();
});
