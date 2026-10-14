// The checks: one command that tells you whether the site still works.
//   npm run check
// Runs, in order:
//   env     every environment variable the code reads is documented in .env.example
//   types   astro check: TypeScript (strict) in .astro and .ts files, and the
//           content collection schemas (frontmatter of every post and page)
//   unit    vitest: the form handler, blog and SEO helpers, data files, color contrast
//   build   astro build (static pages + the server route for the forms)
//   links   the built site: internal links and #anchors, titles, descriptions,
//           one <h1> per page, alt text, sitemap/RSS/robots.txt
//   e2e     Playwright against `astro preview`: every page, phone width, dark
//           mode, the theme toggle, the forms (with and without JavaScript), SEO tags
// A failing step doesn't stop the later ones (except where one needs another),
// so one run shows every problem. The last line is
// CODEPLATE CHECKS: PASS or FAIL (<n> failed).
//   --skip=e2e,build   skip steps (for a quick loop; always finish with a full run)
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { checkSite } from './links.mjs';

const skip = new Set((process.argv.find((a) => a.startsWith('--skip='))?.slice(7) ?? '').split(',').filter(Boolean));
const results = [];
const ASTRO = ['node_modules/astro/bin/astro.mjs'];
// One command line for the shell (npx needs a shell on Windows).
const line = (cmd, args) => [cmd, ...args].map((a) => (/[\s"]/.test(a) ? `"${a}"` : a)).join(' ');

// The output of the step that's running, so the summary can repeat the end of
// a failed step's output (long logs scroll away).
let stepOutput = '';
function sh(cmd, args, env = process.env) {
  const r = spawnSync(line(cmd, args), { env, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out);
  stepOutput += out;
  return r.status === 0;
}
const node = (args, env) => sh(process.execPath, args, env);

async function step(name, fn, needs = []) {
  const missing = needs.filter((n) => results.find((r) => r.name === n && !r.ok));
  if (skip.has(name) || missing.length) {
    const why = skip.has(name) ? 'skipped' : `skipped (${missing.join(', ')} failed)`;
    console.log(`\n--- ${name}: ${why}`);
    results.push({ name, ok: !missing.length, skipped: true });
    return;
  }
  console.log(`\n--- ${name}`);
  const start = Date.now();
  let ok = false;
  stepOutput = '';
  const log = console.log;
  console.log = (...a) => {
    stepOutput += `${a.join(' ')}\n`;
    log(...a);
  };
  try {
    ok = await fn();
  } catch (e) {
    console.error(e);
    stepOutput += `${e?.stack ?? e}\n`;
  } finally {
    console.log = log;
  }
  console.log(`--- ${name}: ${ok ? 'pass' : 'FAIL'} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  results.push({ name, ok, tail: ok ? '' : stepOutput.trim().split('\n').slice(-25).join('\n') });
}

function sourceFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|mjs|js|astro|mdx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// Set by Node, Astro, Vite or the test tools, not by the site's owner.
const PLATFORM_VARS = new Set(['NODE_ENV', 'CI', 'PW_CHANNEL', 'CODEPLATE_SHOTS', 'DEV', 'PROD', 'MODE', 'SSR', 'BASE_URL', 'SITE', 'ASSETS_PREFIX']);

await step('env', () => {
  const documented = new Set([...readFileSync('.env.example', 'utf8').matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]));
  const used = new Map();
  // Declared in astro.config.mjs (env.schema)…
  for (const m of readFileSync('astro.config.mjs', 'utf8').matchAll(/^\s*([A-Z][A-Z0-9_]*):\s*envField\./gm)) used.set(m[1], 'astro.config.mjs (env.schema)');
  // …or read directly.
  for (const f of ['astro.config.mjs', ...sourceFiles('src'), ...sourceFiles('scripts')]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:process\.env|import\.meta\.env)\.([A-Z][A-Z0-9_]*)/g)) if (!used.has(m[1])) used.set(m[1], f);
  }
  let ok = true;
  for (const [v, f] of used) {
    if (documented.has(v) || PLATFORM_VARS.has(v)) continue;
    console.log(`${v} (read in ${f}) is not in .env.example: add it there with a comment.`);
    ok = false;
  }
  if (ok) console.log(`${documented.size} variables documented in .env.example`);
  return ok;
});

await step('types', () => node([...ASTRO, 'check']));

await step('unit', () => sh('npx', ['vitest', 'run']));

await step('build', () => {
  rmSync('dist', { recursive: true, force: true });
  return node([...ASTRO, 'build']);
});

await step(
  'links',
  () => {
    const problems = checkSite();
    for (const p of problems) console.log(p);
    if (!problems.length) console.log('internal links, anchors, titles, descriptions, headings and alt text are fine');
    return problems.length === 0;
  },
  ['build'],
);

await step(
  'e2e',
  () => {
    const ok = sh('npx', ['playwright', 'test']);
    if (!ok) console.log('Screenshots and traces of failures are in .data/test-results/. No browser? Run `npm run setup` once, or set PW_CHANNEL=chrome (or msedge).');
    return ok;
  },
  ['build'],
);

const failed = results.filter((r) => !r.ok);
for (const r of failed.filter((f) => f.tail)) console.log(`\n=== ${r.name} failed; the end of its output:\n${r.tail}`);
console.log('\n' + results.map((r) => `${r.ok ? (r.skipped ? 'skip' : 'pass') : 'FAIL'}  ${r.name}`).join('\n'));
console.log(failed.length ? `CODEPLATE CHECKS: FAIL (${failed.length} failed)` : 'CODEPLATE CHECKS: PASS');
process.exitCode = failed.length ? 1 : 0;
