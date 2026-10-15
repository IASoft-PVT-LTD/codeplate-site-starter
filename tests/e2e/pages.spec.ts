import { expect, test, type Page } from '@playwright/test';
import { blogBase, blogUrl } from '../../src/lib/blog';
import { backgroundLuminance, PAGES, watchErrors } from './helpers';

/** A string as a literal piece of a regular expression. */
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every page renders with one heading and no browser errors.
for (const path of PAGES) {
  test(`page ${path} renders`, async ({ page }) => {
    const noErrors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header a[href]').first()).toBeVisible();
    noErrors();
  });
}

/** The post and tag pages linked from the blog index. */
async function blogPages(page: Page): Promise<string[]> {
  await page.goto(blogUrl());
  const hrefs = await page.locator(`main a[href^="${blogBase}/"]`).evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  return [...new Set(hrefs)].filter((h) => h !== blogUrl());
}

test('every blog post and tag page renders', async ({ page }) => {
  const noErrors = watchErrors(page);
  const paths = await blogPages(page);
  expect(paths.some((p) => p.startsWith(`${blogBase}/tags/`)), 'tag pages').toBe(true);
  for (const path of paths) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator('h1'), path).toHaveCount(1);
  }
  noErrors();
});

test('every page fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of [...PAGES, ...(await blogPages(page))]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal scroll on ${path}`).toBeLessThanOrEqual(0);
  }
});

test('the phone menu opens and links to the pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Menu').click();
  await page.getByRole('navigation', { name: 'Main (mobile)' }).getByRole('link', { name: 'Pricing' }).click();
  await expect(page).toHaveURL(/\/pricing\/$/);
});

test('unknown pages get the 404 page', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page.' })).toBeVisible();
});

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the system setting on every page', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      expect(await backgroundLuminance(page), `${path} is not dark`).toBeLessThan(0.05);
    }
  });
});

test('the theme toggle switches, and the choice survives a reload', async ({ page }) => {
  await page.goto('/');
  expect(await backgroundLuminance(page)).toBeGreaterThan(0.8);
  await page.getByRole('button', { name: 'Switch between light and dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await backgroundLuminance(page)).toBeLessThan(0.05);
  await page.goto('/pricing/');
  // Applied by the inline script before the page paints.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await backgroundLuminance(page)).toBeLessThan(0.05);
});

test('the skip link jumps to the content', async ({ page }) => {
  await page.goto('/pricing/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test('posts have SEO tags and JSON-LD', async ({ page }) => {
  await page.goto(blogUrl());
  const first = page.locator('article h2 a').first();
  const title = (await first.textContent())!.trim();
  const href = (await first.getAttribute('href'))!;
  await first.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  expect(await page.title()).toMatch(new RegExp(`^${escape(title)} · `));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https?://[^/]+${escape(href)}$`));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https?:\/\/.+\.(png|jpe?g|webp)$/);
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(jsonLd['@type']).toBe('BlogPosting');
  expect(jsonLd.headline).toBe(title);
  expect(jsonLd.author.name).toBeTruthy();
});

test('the blog lists posts newest first and filters by tag', async ({ page }) => {
  await page.goto(blogUrl());
  const dates = await page.locator('article time').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime')!));
  expect(dates.length).toBeGreaterThan(0);
  expect(dates, 'newest first').toEqual([...dates].sort().reverse());
  const tag = page.getByRole('navigation', { name: 'Tags' }).getByRole('link').first();
  const count = Number((await tag.textContent())!.match(/\((\d+)\)/)![1]);
  await tag.click();
  await expect(page).toHaveURL(new RegExp(`${escape(`${blogBase}/tags/`)}[a-z0-9-]+/$`));
  await expect(page.locator('article')).toHaveCount(count);
});

test('feeds and crawler files are served', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<item>');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toMatch(/<loc>https?:\/\/[^<]+\/pricing\/<\/loc>/);
  expect(sitemap).not.toContain('/thanks/');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap-index\.xml$/m);
});

test('the CodePlate credit is in the footer (required by the free license)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Built with CodePlate (codeplate.io)' })).toBeVisible();
});
