// Draws the default Open Graph image (the picture link previews show) with
// the site's name, tagline and brand colors, and saves it as a 1200×630 PNG.
//
//   npm run og                                   → public/og/default.png
//   npm run og -- --title="Pricing" --subtitle="Free for small teams" --out=public/og/pricing.png
//
// The card shows the logo (public/favicon.svg) and `name` from src/data/site.ts, and the title
// (default: `tagline`), in the light values of the color tokens in
// src/styles/global.css. Run it again after a rebrand. docs/recipes/generate-og-images.md makes one per post.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const siteTs = readFileSync('src/data/site.ts', 'utf8');
const fromSite = (key) => siteTs.match(new RegExp(`^\\s*${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`, 'm'))?.[1]?.replace(/\\'/g, "'");
const css = readFileSync('src/styles/global.css', 'utf8');
/** The light value of a color token: --color-<name>: light-dark(#light, #dark). */
const token = (name) => css.match(new RegExp(`--color-${name}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '#000000';

export const ogOptions = (title, subtitle, eyebrow) => ({
  title,
  subtitle,
  eyebrow,
  colors: { brand: token('brand'), soft: token('brand-soft'), onBrand: token('on-brand'), ink: token('ink'), inkSoft: token('ink-soft'), canvas: token('canvas') },
});

// The logo mark: public/favicon.svg, so the card follows a rebrand.
const mark = `data:image/svg+xml;base64,${readFileSync('public/favicon.svg').toString('base64')}`;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** The card as HTML. Edit this to change the design of every OG image. */
export function ogHtml({ title, subtitle, eyebrow, colors: c }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: ${c.canvas}; color: ${c.ink};
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .card { position: relative; width: 100%; height: 100%; padding: 80px 90px; display: flex; flex-direction: column; justify-content: center; }
  .sun { position: absolute; right: -160px; bottom: -300px; width: 520px; height: 520px; border-radius: 50%; background: ${c.soft}; }
  .sun::after { content: ''; position: absolute; inset: 100px; border-radius: 50%; background: ${c.brand}; opacity: .9; }
  .mark { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 700; }
  .eyebrow { margin-top: 56px; font-size: 26px; font-weight: 600; color: ${c.brand}; text-transform: uppercase; letter-spacing: .06em; }
  h1 { margin-top: ${eyebrow ? 14 : 56}px; max-width: 720px; font-size: ${title.length > 40 ? 60 : 72}px; line-height: 1.08; font-weight: 800; letter-spacing: -0.02em; }
  p { margin-top: 26px; max-width: 700px; font-size: 32px; line-height: 1.35; color: ${c.inkSoft}; }
  </style></head><body><div class="card"><div class="sun"></div>
  <div class="mark"><img src="${mark}" width="56" height="56" alt="">${esc(fromSite('name'))}</div>
  ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
  <h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div></body></html>`;
}

/** Renders each { html, out } to a PNG with one browser. */
export async function renderCards(cards) {
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for (const { html, out } of cards) {
      mkdirSync(dirname(out), { recursive: true });
      await page.setContent(html, { waitUntil: 'load' });
      await page.screenshot({ path: out, type: 'png' });
      console.log(`saved ${out}`);
    }
  } finally {
    await browser.close();
  }
}

// Run directly (npm run og): one card. Other scripts import ogHtml and renderCards.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const title = flag('title') ?? fromSite('tagline');
  const out = flag('out') ?? 'public/og/default.png';
  await renderCards([{ html: ogHtml(ogOptions(title, flag('subtitle'), flag('eyebrow'))), out }]);
}
