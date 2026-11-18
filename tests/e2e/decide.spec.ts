import { expect, test } from '@playwright/test';
import { addTask, answer, bucket } from './helpers';

test('empty first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What should you do next?');
  await expect(page.getByText('Nothing here yet.')).toBeVisible();
  await expect(page.getByText('Answer the questions to see the recommendation.')).toBeVisible();
});

test('all eight cases land in the right group, and the list survives a reload', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'Five minutes of scrolling', 'No', 'No', 'No');
  await addTask(page, 'Watch a series', 'No', 'No', 'Yes');
  await addTask(page, 'Call my parents', 'No', 'Yes', 'No');
  await addTask(page, 'Start a reading habit', 'No', 'Yes', 'Yes');
  await addTask(page, 'Call the plumber', 'Yes', 'No', 'No');
  await addTask(page, 'Weekly status meeting', 'Yes', 'No', 'Yes', 'Yes');
  await addTask(page, 'One-off vendor request', 'Yes', 'No', 'Yes', 'No');
  await addTask(page, 'Quick client call', 'Yes', 'Yes', 'No');
  await addTask(page, 'Production incident', 'Yes', 'Yes', 'Yes');

  const expectIn = async (group: string, titles: string[]) => {
    const region = bucket(page, group);
    for (const t of titles) await expect(region.getByText(t, { exact: true })).toBeVisible();
    await expect(region.getByRole('checkbox')).toHaveCount(titles.length);
  };
  await expectIn('Do now', ['Call my parents', 'Call the plumber', 'Quick client call']);
  await expectIn('Attend to soon', ['Production incident']);
  await expectIn('Schedule it', ['Start a reading habit']);
  await expectIn('Interruption buffer', ['Weekly status meeting']);
  await expectIn('After important work', ['Watch a series', 'One-off vendor request']);
  await expectIn('Brief breaks', ['Five minutes of scrolling']);
  await expect(page.getByText('9 open', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('9 open', { exact: true })).toBeVisible();
  await expect(bucket(page, 'Schedule it').getByText('Start a reading habit')).toBeVisible();
});

test('live preview, recurring question, validation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.getByRole('alert')).toHaveText('Name the task so you can find it in your list.');
  await page.getByLabel('Task', { exact: true }).fill('Expense report');
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.getByRole('alert')).toHaveText('Answer all three questions.');

  await answer(page, 'Is it urgent?', 'Yes');
  await answer(page, 'Is it important to you?', 'No');
  await answer(page, 'Will it take more than 5 minutes?', 'Yes');
  await expect(page.getByText('One more question.')).toBeVisible();
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.getByRole('alert')).toHaveText('Answer whether this happens regularly.');
  await answer(page, 'Does this happen regularly?', 'Yes');
  await expect(page.getByText('Reserve an urgent-allocation buffer').first()).toBeVisible();
  // Changing an answer hides the recurring question again
  await answer(page, 'Will it take more than 5 minutes?', 'No');
  await expect(page.getByRole('radiogroup', { name: 'Does this happen regularly?' })).toHaveCount(0);
  await expect(page.getByText('Get it done').first()).toBeVisible();
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(bucket(page, 'Do now').getByText('Expense report')).toBeVisible();
  // form resets for the next task
  await expect(page.getByLabel('Task', { exact: true })).toHaveValue('');
});

test('done, undo, edit moves groups, delete + undo, clear done', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'Gym', 'No', 'Yes', 'Yes');
  await addTask(page, 'Reply to Sam', 'Yes', 'Yes', 'No');

  await page.getByRole('checkbox', { name: 'Mark done: Reply to Sam' }).click();
  await expect(page.getByText('1 open · 1 done', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('2 open', { exact: true })).toBeVisible();

  // edit Gym → urgent + important + long → "Attend to soon"
  await bucket(page, 'Schedule it').getByRole('button', { name: /Gym/ }).click();
  await page.getByRole('button', { name: 'Edit Gym' }).click();
  await expect(page.getByRole('heading', { name: 'Edit task' })).toBeVisible();
  await expect(page.getByLabel('Task', { exact: true })).toHaveValue('Gym');
  await answer(page, 'Is it urgent?', 'Yes');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(bucket(page, 'Attend to soon').getByText('Gym')).toBeVisible();
  await expect(bucket(page, 'Schedule it')).toHaveCount(0);

  // delete with undo
  await bucket(page, 'Attend to soon').getByRole('button', { name: /Gym/ }).click();
  await page.getByRole('button', { name: 'Delete Gym' }).click();
  await expect(page.getByText('Gym', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(bucket(page, 'Attend to soon').getByText('Gym')).toBeVisible();

  // done + clear done
  await page.getByRole('checkbox', { name: 'Mark done: Reply to Sam' }).click();
  await page.getByText('Done (1)').click();
  await page.getByRole('button', { name: 'Clear done tasks' }).click();
  await expect(page.getByText('1 open', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 open', { exact: true })).toBeVisible();
});

test('corrupt stored data does not break the page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('triage.tasks.v1', '{broken'));
  await page.goto('/');
  await expect(page.getByText('Nothing here yet.')).toBeVisible();
});

test('keyboard: arrows answer, Enter adds', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop keyboard');
  await page.goto('/');
  await page.getByLabel('Task', { exact: true }).fill('Plan the week');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowLeft'); // urgent: No
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight'); // important: Yes
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight'); // > 5 min: Yes
  await page.getByLabel('Task', { exact: true }).press('Enter');
  await expect(bucket(page, 'Schedule it').getByText('Plan the week')).toBeVisible();
});
