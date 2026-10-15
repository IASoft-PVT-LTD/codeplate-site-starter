# Custom domain and SEO checklist

Use when the site moves to its real domain, and before and after launch, to make sure search engines and link previews see it right. The example moves Brightside to `https://brightside.app` and redirects an old URL.

You can't buy domains, edit DNS or use Google Search Console; the user does, with the steps below. You make the code changes and check the built site.

## The domain

1. **Point the domain at the host** (the user, in the host's dashboard; it tells them which DNS records to add at their registrar):
   - Cloudflare Workers: the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** (the domain must use Cloudflare's nameservers).
   - Vercel: project → **Settings** → **Domains** → **Add**.
   - Netlify: **Domain management** → **Add a domain**.
   - Node server: an `A` record to the server's IP, and the domain in the reverse proxy config (`deploy.md`, step 19).

   Pick one form, with or without `www`, and have the host redirect the other to it (all three hosts offer this when adding the domain). HTTPS certificates are issued by the host automatically; wait until the domain shows as active.

2. **Set `site`** in `astro.config.mjs` to the exact form chosen, with `https://` and no trailing slash:
   ```js
   site: 'https://brightside.app',
   ```
   Canonical URLs, `og:url`, share image URLs, the sitemap, `robots.txt` and RSS links are all built from it. Also replace the placeholder in the sample unit test if you like (`tests/unit/blog.test.ts` uses `brightside.example` only as input; it passes either way).

3. **Redirect old URLs** if the user had a site before, so links and search rankings carry over. In `astro.config.mjs`, next to `site`:
   ```js
   // Old addresses → new pages: a 301 from the server or host; on a purely static
   // site (no adapter), a small HTML page in dist/ that redirects.
   redirects: {
     '/old-pricing': '/pricing/',
     '/news/[...id]': '/blog/[...id]',
   },
   ```
   A dynamic redirect must use the parameter name of the destination's route file: posts are `src/pages/blog/[...id].astro`, so `[...id]`. Ask the user for their old site's most visited URLs (their old analytics, or Search Console → **Pages**). Only redirect to pages that exist: the link check verifies it.

4. **Rebuild and redeploy.** `npm run check`, then deploy (`deploy.md`).

## SEO checklist

Go through it before launch and tick each item in `docs/project.md` (Open questions lists what's left).

5. **Titles and descriptions.** Every page has its own `<title>` and meta description, written for that page: blog posts from their frontmatter, text pages from `src/content/pages/*.md`, other pages from the `title` and `description` props they pass to `BaseLayout`. The `links` step of the checks fails on a missing title or description and on two pages with the same title. Keep descriptions between about 70 and 160 characters (longer ones are trimmed, `src/lib/seo.ts`).
6. **One `<h1>` per page**, headings in order (`##` after the title in Markdown). Checked by the `links` step.
7. **Alt text** on every image, describing it (AGENTS.md rule 2). Checked by the schema and the `links` step.
8. **Share images.** The default `public/og/default.png` has the right name and colors (`npm run og` after a rebrand); per-post images if wanted (`generate-og-images.md`).
9. **Placeholders are gone or hidden.** Sample posts, testimonials, customer names and the privacy and terms stubs are replaced with real content, or removed. A page that must stay up but shouldn't be found gets `noindex: true` (frontmatter) or `noindex` (`BaseLayout` prop), and a line in the `sitemap({ filter })` in `astro.config.mjs`.
10. **Structured data.** Posts carry `BlogPosting` JSON-LD (`src/components/Seo.astro`). For a local business, add a `LocalBusiness` block the same way on the home page (name, address, opening hours from `src/data/`), and validate it with Google's Rich Results Test after launch.
11. **Speed and accessibility.** The site is static HTML with almost no JavaScript, so it should score well. After launch the user can run PageSpeed Insights (pagespeed.web.dev) on the home page and a post: fix anything flagged in red (usually an oversized image: put it in `src/assets/` and use `<Image>`).

## After launch (the user)

12. **Google Search Console** (search.google.com/search-console): add the domain as a property (the DNS verification covers `www` and non-`www`), then **Sitemaps** → submit `sitemap-index.xml`. **Bing Webmaster Tools** can import the property from Google.
13. **Check link previews:** paste the home page and a post URL into a chat app (Slack, Discord, WhatsApp) and check the title, description and image.
14. **Watch for errors** in Search Console → **Pages** over the next weeks (404s from old links → add redirects, step 3).

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS`.
2. The built site uses the new domain everywhere:
   ```bash
   grep -o '<link rel="canonical" href="[^"]*"' dist/client/pricing/index.html
   grep -o '<loc>[^<]*</loc>' dist/client/sitemap-0.xml | head -3
   grep Sitemap dist/client/robots.txt
   grep -rl "https://brightside.example" dist/client | head
   ```
   (with the Netlify adapter or a static build, the files are in `dist/` instead of `dist/client/`). The first three show `https://brightside.app/…`; the last prints nothing.
3. Each redirect works: `npm run build && npm run preview`, then `curl -sI http://localhost:4321/old-pricing` answers `301` with `Location: …/pricing/` (or open it in a browser).
4. On the live site, the smoke test in `deploy.md` (step 25) passes, and `https://` plus the other form of the domain (`www` or not) redirect to the chosen one. You can't check DNS or Search Console yourself: ask the user to confirm.
