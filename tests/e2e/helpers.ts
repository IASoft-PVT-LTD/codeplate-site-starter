import { expect, type Page } from '@playwright/test';
import { blogUrl } from '../../src/lib/blog';

/**
 * Every page of the site except blog posts and tag pages (pages.spec.ts finds
 * those from the blog index). Add new pages here: each one is checked for a heading,
 * browser errors, phone width and dark mode (tests/e2e/pages.spec.ts).
 */
export const PAGES = [
  '/',
  '/pricing/',
  blogUrl(),
  '/changelog/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/thanks/',
];

/** Fails the test on any console error or uncaught exception in the page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return () => expect(errors, 'browser console errors').toEqual([]);
}

/** Relative luminance (0 black … 1 white) of a CSS rgb() color. */
export function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Number(v) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** The page's background luminance, read from <body>. */
export async function backgroundLuminance(page: Page): Promise<number> {
  return luminance(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
}
