# Deploy

Use when the site goes live, or gets a preview copy. Pick one: (A) **Cloudflare** Workers, (B) **Vercel**, (C) **Netlify**, (D) a **Node server** you run, or (E) **any static host** without the form server (GitHub Pages, S3, a shared host). Do **Before any host** first, then one section, then the **Smoke test**.

You can't create hosting accounts, connect repositories, buy domains or see dashboards. The user does that; you tell them exactly what to click and set, and you never invent or print secrets. **These steps were checked by building and previewing each adapter locally (2026-10-13); the deploys themselves weren't run from this template.** If a host's screen differs from what's written, follow the host's current docs and update this recipe. Record the choices (host, domain; never keys) in `docs/project.md` under Hosting.

## Before any host

1. **Run `npm run check`** on the code you'll deploy. It must end with `CODEPLATE CHECKS: PASS`.
2. **Set the real address** in `site` in `astro.config.mjs` (e.g. `https://crumbandco.com`, no trailing slash). Canonical links, the sitemap, RSS and share images are built from it. If the domain isn't known yet, use the host's address for now (`https://<project>.pages.dev`, `https://<project>.vercel.app`) and change it later (`custom-domain-and-seo-checklist.md`).
3. **Know the variables.** All are in `.env.example`; on a host, set them in its settings, never in a committed file:
   | Variable | Production value |
   |---|---|
   | `FORM_PROVIDER` | `webhook` (or `resend`/`buttondown` after `connect-the-form.md`). With `console`, submissions are only printed in the host's logs. |
   | `FORM_WEBHOOK_URL` | The webhook URL (secret). |
   | Any added by recipes | e.g. `RESEND_API_KEY`, `PUBLIC_CF_ANALYTICS_TOKEN`. |

   Server variables (`astro:env/server`) are read when a request comes in, so changing them needs a restart or redeploy, not a rebuild. `PUBLIC_*` client variables are baked in when the site builds: set them before the build, and rebuild after changing them.
4. **What runs where.** Every page is static HTML in the build output. Only `/api/subscribe` needs a server, through the adapter in `astro.config.mjs`. The template ships with `@astrojs/node`; the sections below swap or remove it.

## A. Cloudflare Workers

5. Install the adapter and Wrangler (exact versions, AGENTS.md rule 7):
   ```bash
   npm uninstall @astrojs/node
   npm install --save-exact @astrojs/cloudflare
   npm install --save-exact --save-dev wrangler
   ```
6. In `astro.config.mjs`, replace `import node from '@astrojs/node';` with `import cloudflare from '@astrojs/cloudflare';`, and the adapter line with:
   ```js
   // Cloudflare Workers. Images are optimized when the site builds (no Cloudflare Images binding needed).
   adapter: cloudflare({ imageService: 'compile' }),
   ```
   Update the comment above it. Add `.wrangler/` to `.gitignore`.
7. **Check it locally.** `npm run check` now builds for Workers, and `astro preview` (used by the screen tests) runs the site in Cloudflare's local runtime (workerd), so a passing check means the form works there too.
8. **Deploy.** The build writes a Wrangler config to `dist/server/wrangler.json`. Two ways:
   - **From the user's machine:** `npx wrangler login` (opens the browser; the user signs in), then `npm run build && npx wrangler deploy --config dist/server/wrangler.json`. Wrangler prints the `*.workers.dev` URL.
   - **From GitHub** (redeploys on every push): Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**; build command `npm run build`, deploy command `npx wrangler deploy --config dist/server/wrangler.json`.

   The adapter declares a `SESSION` KV namespace (Astro sessions, unused by this site) that Wrangler creates on the first deploy; it's free and harmless.
9. **Variables:** the Worker → **Settings** → **Variables and Secrets**: `FORM_PROVIDER` as text, `FORM_WEBHOOK_URL` (and other keys) as **Secret**. Or `npx wrangler secret put FORM_WEBHOOK_URL --config dist/server/wrangler.json`. For a custom domain: the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** (the domain must be on Cloudflare).

## B. Vercel

Vercel's adapter can't run `astro preview`, which the screen tests use, so the checks keep using the Node adapter and Vercel builds with its own, chosen by a variable.

10. Install: `npm install --save-exact @astrojs/vercel`.
11. In `astro.config.mjs`, add `import vercel from '@astrojs/vercel';` and replace the adapter line with:
    ```js
    // DEPLOY_TARGET=vercel on Vercel (docs/recipes/deploy.md); Node everywhere else, including the checks.
    adapter: process.env.DEPLOY_TARGET === 'vercel' ? vercel() : node({ mode: 'standalone' }),
    ```
    Document the variable in `.env.example` (the `env` check requires it):
    ```
    # --- Deploy (docs/recipes/deploy.md) ----------------------------------------------
    # The host's adapter: set it in the host's settings, never locally. Unset = Node.
    DEPLOY_TARGET=
    ```
    Add `.vercel/` to `.gitignore`.
12. Check the Vercel build locally: `DEPLOY_TARGET=vercel npm run build` writes `.vercel/output/` (static files in `.vercel/output/static/`, the form route as a function). Then run `npm run check` without the variable.
13. **Deploy.** The user pushes the code to GitHub (or GitLab, Bitbucket), then in Vercel: **Add New…** → **Project** → import the repository; Vercel detects Astro. In **Settings** → **Environment Variables**, add `DEPLOY_TARGET=vercel`, `FORM_PROVIDER` and `FORM_WEBHOOK_URL` (for Production; Preview too if previews should send real submissions), and set the Node.js version to 24. Redeploy after changing variables. Custom domain: **Settings** → **Domains**.

## C. Netlify

As with Vercel, the checks keep the Node adapter and Netlify builds with its own.

14. Install: `npm install --save-exact @astrojs/netlify @netlify/blobs`. (`@netlify/blobs` is needed at the top level for the adapter's session storage; without it the build fails with "Cannot find package '@netlify/blobs'".)
15. In `astro.config.mjs`, add `import netlify from '@astrojs/netlify';` and:
    ```js
    // DEPLOY_TARGET=netlify on Netlify (docs/recipes/deploy.md); Node everywhere else, including the checks.
    // imageCDN: false optimizes images when the site builds instead of through Netlify's image service.
    adapter: process.env.DEPLOY_TARGET === 'netlify' ? netlify({ imageCDN: false }) : node({ mode: 'standalone' }),
    ```
    Document `DEPLOY_TARGET` in `.env.example` as in step 11, and add `.netlify/` to `.gitignore`.
16. Check it locally: `DEPLOY_TARGET=netlify npm run build`, then `node checks/links.mjs` (it checks `dist/`, where Netlify's build puts the pages). Then `npm run check` without the variable.
17. **Deploy.** Netlify → **Add new site** → **Import an existing project** → the repository. Build command `npm run build`, publish directory `dist`. **Site configuration** → **Environment variables**: `DEPLOY_TARGET=netlify`, `FORM_PROVIDER`, `FORM_WEBHOOK_URL`. Or commit a `netlify.toml`:
    ```toml
    [build]
      command = "npm run build"
      publish = "dist"

    [build.environment]
      DEPLOY_TARGET = "netlify"
      NODE_VERSION = "24"
    ```
    (keep secrets out of it: set `FORM_WEBHOOK_URL` in the dashboard).

## D. A Node server

The template's own adapter. Good for a VPS, Docker, Render, Railway or Fly.io.

18. Build and run (Node 22.12+ on the server):
    ```bash
    npm ci
    npm run build
    HOST=0.0.0.0 PORT=8080 FORM_PROVIDER=webhook FORM_WEBHOOK_URL=… node dist/server/entry.mjs
    ```
    The server serves the static pages from `dist/client/` and the form route. Run it under a process manager (systemd, pm2, Docker) that restarts it and passes the environment.
19. Put a reverse proxy with HTTPS in front (Caddy gets certificates by itself: a `Caddyfile` with `example.com {` / `reverse_proxy 127.0.0.1:8080` / `}`). Keep the port closed to the outside.
20. **Platforms** (Render, Railway, Fly.io): build command `npm ci && npm run build`, start command `node dist/server/entry.mjs`, and set `HOST=0.0.0.0` (they set `PORT`).

## E. Any static host (no form server)

For hosts that only serve files. The forms become "email us" links.

21. Set `formEndpoint: null` in `src/data/site.ts`. Delete `src/pages/api/subscribe.ts`, `src/lib/form.ts` and `tests/unit/form.test.ts`, and the `FORM_*` entries from `env.schema` in `astro.config.mjs` and from `.env.example`.
22. In `astro.config.mjs`, delete the `node` import and the `adapter` line. `npm uninstall @astrojs/node`.
23. Replace `tests/e2e/form.spec.ts` with a test of the fallback:
    ```ts
    import { expect, test } from '@playwright/test';

    // Static site: the forms are "email us" links (site.formEndpoint is null).
    test('the waitlist section offers an email link', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#waitlist').getByRole('link', { name: /Email us/ })).toHaveAttribute('href', /^mailto:/);
    });
    ```
24. `npm run check` (the build now writes everything to `dist/`; the link check finds it there). Upload the contents of `dist/` to the host, or point the host's build at `npm run build` with output directory `dist`. Cloudflare Pages, Netlify and Vercel can host this too, with no adapter.

## Smoke test (after every deploy)

25. On the live URL, check (or ask the user to, if you can't reach it):
    - `/`, `/pricing/`, `/blog/`, a post, `/contact/` load over HTTPS, with styles, in light and dark mode.
    - `/no-such-page/` shows the 404 page (with status 404).
    - `/sitemap-index.xml`, `/robots.txt` and `/rss.xml` load, and their URLs use the real domain (if not, fix `site`, step 2).
    - Submit the waitlist form and the contact form: the success message shows, and the submission arrives where `connect-the-form.md` sends it (the user confirms; you can't see it).
    - A post's share preview shows its image (paste the URL into a chat app or a link-preview checker).
26. **Tell the user** what's live and where, what's still placeholder (testimonials, legal pages), and update `docs/project.md` (Hosting, plus a dated line in the log).

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` on the commit you deploy (for B and C, also `DEPLOY_TARGET=<host> npm run build` succeeds).
2. Every item of the smoke test (step 25) passes on the live URL. You can't run the deploy or see the host's dashboard yourself: say which steps the user did and which you checked.
