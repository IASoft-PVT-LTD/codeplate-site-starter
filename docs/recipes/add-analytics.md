# Add analytics

Use when the user wants to know how many people visit and which pages they read, without cookies or a consent banner: (A) **Cloudflare Web Analytics** (free, works on any host) or (B) **Plausible** (paid, or self-hosted; more reports). Both are privacy-friendly: no cookies, no personal data, so most sites need no cookie banner for them. Avoid Google Analytics unless the user insists; it needs a consent banner in the EU and UK.

The script is added only to production builds, and only when its variable is set, so `npm run dev` and the checks never load it.

1. **The user gets the value.**
   - **Cloudflare:** dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site** → enter the domain → copy the token from the JavaScript snippet (`data-cf-beacon='{"token": "…"}'`). If the site is proxied through Cloudflare, they can instead turn on automatic setup there and skip this recipe.
   - **Plausible:** add the site in Plausible with its domain (`example.com`, no `https://`).

2. **Declare the variables** in `env.schema` in `astro.config.mjs`. They're public (they end up in the HTML anyway), and `client` context makes Astro inline them at build time:
   ```js
   PUBLIC_CF_ANALYTICS_TOKEN: envField.string({ context: 'client', access: 'public', optional: true }),
   PUBLIC_PLAUSIBLE_DOMAIN: envField.string({ context: 'client', access: 'public', optional: true }),
   ```
   Document them in `.env.example` (the `env` check requires it):
   ```
   # --- Analytics (docs/recipes/add-analytics.md) -------------------------------------
   # Cloudflare Web Analytics token (from the JS snippet). Used in production builds only.
   PUBLIC_CF_ANALYTICS_TOKEN=
   # Plausible: the site's domain as added in Plausible, e.g. example.com.
   PUBLIC_PLAUSIBLE_DOMAIN=
   ```

3. **The component**, `src/components/Analytics.astro`:
   ```astro
   ---
   // Privacy-friendly analytics (docs/recipes/add-analytics.md). Rendered only in
   // production builds, and only for the services whose variable is set.
   import { PUBLIC_CF_ANALYTICS_TOKEN, PUBLIC_PLAUSIBLE_DOMAIN } from 'astro:env/client';

   const on = import.meta.env.PROD;
   const cfBeacon = PUBLIC_CF_ANALYTICS_TOKEN ? JSON.stringify({ token: PUBLIC_CF_ANALYTICS_TOKEN }) : null;
   ---

   {on && cfBeacon && <script is:inline defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={cfBeacon} />}
   {on && PUBLIC_PLAUSIBLE_DOMAIN && <script is:inline defer data-domain={PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />}
   ```
   `is:inline` tells Astro to leave the external script tag as it is instead of bundling it. If Plausible's dashboard shows a different snippet for the site (newer accounts get a personal script URL like `https://plausible.io/js/pa-….js`), use that `src` and keep `defer`; follow its snippet exactly.

4. **Add it to every page**: in `src/layouts/BaseLayout.astro`, `import Analytics from '../components/Analytics.astro';` in the frontmatter, and `<Analytics />` at the end of `<head>`, after `<slot name="head" />`.

5. **Update the privacy page** (`src/content/pages/privacy.md`): replace "No tracking cookies." with a line naming the service, e.g. "We count visits with Cloudflare Web Analytics, which uses no cookies and stores no personal data." Record the service in `docs/project.md` under Hosting.

6. **Set the variable** on the host (see `deploy.md`) and rebuild: values are baked in when the site builds. Don't put it in `.env` unless the user wants local production builds (`npm run build`) to report visits too.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` (the variable isn't set there, so no script is added and no request leaves the test browser).
2. Build once with a test value and look for the tag:
   ```bash
   PUBLIC_CF_ANALYTICS_TOKEN=test-token npm run build
   grep -o 'data-cf-beacon="[^"]*"' dist/client/index.html
   ```
   It prints the beacon with `test-token` (as `{&quot;token&quot;:&quot;test-token&quot;}`). Without the variable, `grep -c cloudflareinsights dist/client/index.html` prints `0`. Run `npm run build` again without it afterwards, so `dist/` doesn't keep the test token.
3. After deploying, the user opens the site once and checks the dashboard (Cloudflare shows visits within a few minutes; Plausible in real time). You can't see the dashboard: ask them.
