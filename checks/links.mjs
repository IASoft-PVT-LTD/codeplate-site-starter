// Checks the built site (run `astro build` first):
//   - every internal link, image, script and stylesheet points to a file that exists
//   - every #anchor on an internal link exists on the target page
//   - every page has its own <title>, a meta description, a canonical link and one <h1>
//   - every <img> has an alt attribute
//   - robots.txt, sitemap-index.xml and rss.xml were generated
// Server routes (/api/…) aren't files, so they're skipped.
//   node checks/links.mjs        exits 1 and lists the problems if there are any
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Where the built pages are: dist/client/ with a server adapter (Node, Cloudflare),
// dist/ with Netlify's adapter or none, .vercel/output/static/ with Vercel's.
const builtRoot = () => ['dist/client', 'dist', '.vercel/output/static'].find((d) => existsSync(join(d, 'index.html'))) ?? 'dist/client';
/** Paths served by the server, not by files. */
const SERVER_ROUTES = [/^\/api\//];

export function checkSite(root = builtRoot()) {
  const problems = [];
  if (!existsSync(root)) return [`${root} doesn't exist: run \`npm run build\` first`];

  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(relative(root, p).replace(/\\/g, '/'));
    }
  };
  walk(root);
  const fileSet = new Set(files);

  /** The file a URL path is served from, or null. */
  const resolve = (path) => {
    const p = decodeURI(path).replace(/^\//, '');
    const candidates = p === '' || p.endsWith('/') ? [`${p}index.html`] : [p, `${p}.html`, `${p}/index.html`];
    return candidates.find((c) => fileSet.has(c)) ?? null;
  };

  const ids = new Map();
  const idsOf = (file) => {
    if (!ids.has(file)) ids.set(file, new Set([...readFileSync(join(root, file), 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return ids.get(file);
  };

  const pages = files.filter((f) => f.endsWith('.html'));
  const titles = new Map();
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const where = `/${page}`;
    // Links and assets.
    const refs = [...html.matchAll(/<(?:a|link)\s[^>]*?href="([^"]*)"/g), ...html.matchAll(/<(?:img|script|source|iframe)\s[^>]*?src="([^"]*)"/g)].map((m) => m[1]);
    for (const m of html.matchAll(/srcset="([^"]*)"/g)) refs.push(...m[1].split(',').map((s) => s.trim().split(/\s+/)[0]));
    for (const raw of refs) {
      const ref = raw.replace(/&amp;/g, '&');
      if (!ref || /^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref.startsWith('//')) continue;
      const [pathAndQuery, hash] = ref.split('#');
      const path = pathAndQuery.split('?')[0];
      if (path === '' && hash) {
        if (!idsOf(page).has(hash)) problems.push(`${where}: link to #${hash}, but no element has id="${hash}"`);
        continue;
      }
      if (!path.startsWith('/')) {
        problems.push(`${where}: relative link "${ref}" (use a path starting with /)`);
        continue;
      }
      if (SERVER_ROUTES.some((r) => r.test(path))) continue;
      const target = resolve(path);
      if (!target) problems.push(`${where}: broken link ${ref}`);
      else if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) problems.push(`${where}: link to ${ref}, but ${path} has no id="${hash}"`);
    }
    // Page basics.
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    if (!title) problems.push(`${where}: no <title>`);
    else if (titles.has(title)) problems.push(`${where}: same <title> as ${titles.get(title)} ("${title}"): give each page its own`);
    else titles.set(title, where);
    if (!/<meta name="description" content="[^"]+"/.test(html)) problems.push(`${where}: no meta description`);
    if (!/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html)) problems.push(`${where}: no canonical link`);
    const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1s !== 1) problems.push(`${where}: ${h1s} <h1> elements (want exactly one)`);
    for (const img of html.match(/<img\s[^>]*>/g) ?? []) {
      if (!/\salt="/.test(img)) problems.push(`${where}: image without alt text: ${img.slice(0, 120)}`);
    }
  }

  for (const f of ['robots.txt', 'sitemap-index.xml', 'rss.xml', '404.html']) {
    if (!fileSet.has(f)) problems.push(`/${f} was not generated`);
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = builtRoot();
  const problems = checkSite(ROOT);
  for (const p of problems) console.log(p);
  const pages = existsSync(ROOT) ? readdirSync(ROOT, { recursive: true }).filter((f) => String(f).endsWith('.html') && statSync(join(ROOT, String(f))).isFile()).length : 0;
  console.log(problems.length ? `${problems.length} problem(s) in the built site` : `${pages} pages: links, anchors, titles, descriptions, headings and alt text are fine`);
  process.exitCode = problems.length ? 1 : 0;
}
