// The waitlist and contact forms, end to end, against the real endpoint
// (src/pages/api/subscribe.ts) with FORM_PROVIDER=console.
import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('joining the waitlist shows a confirmation', async ({ page }) => {
  const noErrors = watchErrors(page);
  await page.goto('/');
  const form = page.locator('#waitlist form');
  await form.getByLabel('Email').fill('ada@example.com');
  await form.getByRole('button', { name: 'Join the waitlist' }).click();
  await expect(form.getByRole('status')).toHaveText('You’re on the list. We’ll email you when there’s room.');
  await expect(form.getByLabel('Email')).toHaveValue('');
  noErrors();
});

test('the contact form sends a message', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByLabel('Name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Message').fill('Can we get a demo for a team of 12?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status')).toHaveText('Thanks! We’ll reply within two working days.');
});

test('the browser stops an empty email before sending', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('#waitlist form');
  await form.getByRole('button', { name: 'Join the waitlist' }).click();
  expect(await form.getByLabel('Email').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await expect(form.getByRole('status')).toHaveText('');
});

// Browsers send Sec-Fetch-Site with every form post; Astro's origin check
// (security.checkOrigin) refuses cross-site ones.
test('the endpoint rejects bad input with field errors', async ({ request }) => {
  const res = await request.post('/api/subscribe', {
    form: { kind: 'waitlist', email: 'not-an-email' },
    headers: { accept: 'application/json', 'sec-fetch-site': 'same-origin' },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).errors.email).toBe('Enter a valid email address.');
});

test('the endpoint refuses form posts from other sites', async ({ request }) => {
  const res = await request.post('/api/subscribe', {
    form: { kind: 'waitlist', email: 'ada@example.com' },
    headers: { 'sec-fetch-site': 'cross-site' },
  });
  expect(res.status()).toBe(403);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the form still works and lands on the thank-you page', async ({ page }) => {
    await page.goto('/contact/');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Message').fill('Hello from a browser without JavaScript.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page).toHaveURL(/\/thanks\/$/);
    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  });
});
