// Screenshots of the site, so an agent can see what it changed.
//
//   npm run shots                                  the home page
//   npm run shots -- / /blog /pricing              several pages
//   npm run shots -- / blog pricing --dark --width=390   (dark theme, phone width)
//   npm run shots -- /blog/why-we-dropped-the-stand-up --height=900 --top   (first screen only)
//
//   npm run shots -- / pricing --all              desktop + phone, light + dark: 4 PNGs per page
//
// --all         every page at desktop (1280) and phone (390) width, in light and dark
//               (the review before you report a change: AGENTS.md "Seeing your work")
// --dark        dark color scheme
// --width=N     viewport width (default 1280); 390 is a phone
// --height=N    viewport height (default 800)
// --top         only the first screen instead of the whole page
//
// Starts its own `astro dev` on port 4399 (alongside any dev server you run),
// stops it afterwards, and prints the browser's errors and warnings for each
// page: fix them. PNGs go to shots/.
import { spawn } from 'node:child_process';
import { mkdirSync, openSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const flag = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const all = args.includes('--all');
const dark = args.includes('--dark');
const top = args.includes('--top');
const width = Number(flag('width', 1280));
const height = Number(flag('height', 800));
// [width, dark] combinations to photograph.
const variants = all ? [[1280, false], [1280, true], [390, false], [390, true]] : [[width, dark]];
// Pages: every argument that isn't a --flag, with or without the leading slash.
// Git Bash on Windows turns "/pricing" into "C:/Program Files/Git/pricing"; undo that.
const paths = args.filter((a) => !a.startsWith('--')).map((a) => {
  const msys = a.match(/^[A-Za-z]:[\\/].*?[\\/]Git([\\/].*)$/);
  const p = (msys ? msys[1] : a).replace(/\\/g, '/');
  return p.startsWith('/') ? p : `/${p}`;
});
if (paths.length === 0) paths.push('/');

const PORT = 4399;
const BASE = `http://localhost:${PORT}`;

async function waitFor(url, seconds = 90) {
  for (let i = 0; i < seconds * 2; i++) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`the dev server didn't start at ${url}`);
}

mkdirSync('.data', { recursive: true });
const log = openSync('.data/shots-server.log', 'w');
// --ignore-lock: run next to a dev server you may already have open (Astro 7
// otherwise allows one `astro dev` per project).
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--port', String(PORT), '--ignore-lock'], {
  env: { ...process.env, CODEPLATE_SHOTS: '1', FORM_PROVIDER: 'console' },
  stdio: ['ignore', log, log],
});
let exitCode = 0;
let browser;

/** Opens a page and waits until it's ready to photograph. */
async function load(page, path) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  if (!top) {
    // Load lazy images now, so the full-page shot shows them.
    await page.evaluate(async () => {
      const pending = [...document.images].filter((img) => !img.complete);
      for (const img of pending) img.loading = 'eager';
      await Promise.all(pending.map((img) => new Promise((done) => {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        if (img.complete) done();
      })));
    });
  }
  await page.waitForTimeout(300);
  return res;
}

try {
  try {
    await waitFor(`${BASE}/`);
  } catch (e) {
    console.error(readFileSync('.data/shots-server.log', 'utf8').slice(-3000));
    throw e;
  }
  browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  let problems = [];
  mkdirSync('shots', { recursive: true });
  let total = 0;
  for (const [w, isDark] of variants) {
    const page = await browser.newPage({ viewport: { width: w, height }, colorScheme: isDark ? 'dark' : 'light' });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
    for (const path of paths) {
      problems = [];
      let res;
      // The dev server reloads the page when it first optimizes dependencies for
      // it (it prints "optimized dependencies changed. reloading"): try again.
      for (let attempt = 1; ; attempt++) {
        try {
          res = await load(page, path);
          break;
        } catch (e) {
          if (attempt === 4 || !/context was destroyed|navigation/i.test(String(e))) throw e;
          problems = [];
          await page.waitForTimeout(1000);
        }
      }
      const name = path === '/' ? 'home' : path.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-');
      const size = w !== 1280 ? `-${w}` : '';
      const file = `shots/${name}${size}${isDark ? '-dark' : ''}.png`;
      await page.screenshot({ path: file, fullPage: !top });
      console.log(`saved ${file}${res && res.status() !== 200 ? `  (HTTP ${res.status()})` : ''}`);
      for (const p of problems) console.log(`  ${p.slice(0, 800)}`);
      total += problems.length;
    }
    await page.close();
  }
  if (total) console.log(`${total} browser error(s)/warning(s) above. Fix them before moving on (the screen tests fail on console errors).`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill('SIGTERM');
}
process.exitCode = exitCode;
