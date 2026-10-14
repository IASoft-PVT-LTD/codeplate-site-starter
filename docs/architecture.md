# Architecture

An Astro 7 site with static output. `astro build` renders every page to HTML once; visitors get plain HTML and CSS, plus two small bundled scripts (the theme toggle and the form). One route, `/api/subscribe`, runs on a server through an adapter, for the waitlist and contact forms. The logic that matters (validating and sending a submission, reading time, sorting, titles) lives in plain functions in `src/lib/` with unit tests.

## Layers

```
src/pages/          routes: .astro pages, .ts endpoints (rss.xml, robots.txt, api/subscribe)
  │  use
src/layouts/        BaseLayout: <head> + header + footer
src/components/     Seo, Header, Footer, SubscribeForm, PostCard, home/ sections…
  │  read
src/content/        collections: blog, authors, changelog, pages   (schemas: src/content.config.ts)
src/data/           site.ts, home.ts, pricing.ts                    (typed TypeScript objects)
src/lib/            form.ts, blog.ts, seo.ts, posts.ts              (plain functions, tested)
src/styles/         global.css: Tailwind + design tokens
```

- **Words live in `src/content/` and `src/data/`.** A component lays out what it's given. This keeps copy edits away from layout code, and the schemas and TypeScript catch a missing field before the site ships.
- **`src/lib/` has no Astro imports** (except `posts.ts`, the thin wrapper around `getCollection`), so Vitest runs it directly.
- **Routes are files.** `src/pages/pricing.astro` is `/pricing/`; `src/pages/blog/[...id].astro` makes one page per post from `getStaticPaths()`.

## Pages and where their content comes from

| URL | File | Content |
|---|---|---|
| `/` | `src/pages/index.astro` | `src/data/home.ts`, one component per section in `src/components/home/` |
| `/pricing/` | `src/pages/pricing.astro` | `src/data/pricing.ts` |
| `/blog/`, `/blog/<id>/`, `/blog/tags/<tag>/` | `src/pages/blog/` | `src/content/blog/*.md(x)`, `src/content/authors.json` |
| `/changelog/` | `src/pages/changelog.astro` | `src/content/changelog/*.md` |
| `/about/`, `/privacy/`, `/terms/` | `src/pages/[page].astro` | `src/content/pages/*.md` |
| `/contact/` | `src/pages/contact.astro` | the contact form, `site.email` |
| `/thanks/`, 404 | `src/pages/thanks.astro`, `src/pages/404.astro` | — |
| `/rss.xml`, `/robots.txt` | `src/pages/rss.xml.ts`, `src/pages/robots.txt.ts` | the blog, `site` in `astro.config.mjs` |
| `/sitemap-index.xml` | `@astrojs/sitemap` | every page except `/thanks/` and 404 |
| `POST /api/subscribe` | `src/pages/api/subscribe.ts` | `src/lib/form.ts` (server) |

## The form, end to end

1. `SubscribeForm.astro` renders `<form method="post" action="/api/subscribe">` with a hidden `kind` (`waitlist` or `contact`), the page path, and a hidden honeypot field `website`.
2. With JavaScript, its script posts the form with `fetch` and `Accept: application/json`, and shows the returned message in the `role="status"` line. Without JavaScript, the browser posts it normally.
3. Astro checks the request comes from the same site (`security.checkOrigin`: a cross-site form post gets 403), then runs `POST` in `src/pages/api/subscribe.ts`, which calls `handleSubmission()` in `src/lib/form.ts`:
   1. `parseSubmission()` validates the fields with zod (`submissionSchema`). A filled honeypot is treated as spam: it answers "success" and sends nothing.
   2. `providerFor()` picks the provider from `FORM_PROVIDER` (read from `astro:env/server`): `console` prints the submission in the server log; `webhook` POSTs `{ text, content, submission }` to `FORM_WEBHOOK_URL`.
   3. The answer: JSON (`{ ok, message }` or `{ ok: false, errors }`) for the script, or a 303 redirect for a plain post (`/thanks/` on success, back to the page with `?form=error` on failure).
4. If `site.formEndpoint` is `null` (a static site with no server), the component renders a `mailto:` link instead of a form.

## Build and adapter

- `output: 'static'` prerenders every route except those with `export const prerender = false`.
- The `@astrojs/node` adapter (standalone) builds that one server route into `dist/server/entry.mjs`; the static files go to `dist/client/`. `astro preview` runs both, which is what the screen tests use. `docs/recipes/deploy.md` swaps the adapter for Cloudflare, Vercel or Netlify, or removes it (and the route) for a purely static host.
- Images imported from `src/assets/` (and blog covers through the schema's `image()`) are resized and converted to WebP at build time by `<Image>` (sharp). Files in `public/` are copied as they are.

## SEO

`src/components/Seo.astro`, rendered in `BaseLayout`'s `<head>` from the page's props (`title`, `description`, `image`, `noindex`, `article`):

- `<title>` from `pageTitle()` (`Pricing · Brightside`; the home page gets `Brightside: <tagline>`)
- meta description (trimmed to 160 characters), canonical URL built from `site` in `astro.config.mjs`
- Open Graph and Twitter card tags, with `site.ogImage` (`public/og/default.png`, drawn by `npm run og`) unless the page passes its own
- for posts, `article:*` tags and a `BlogPosting` JSON-LD block
- RSS and sitemap `<link>`s; `robots.txt` points to the sitemap

## Theme

The tokens in `src/styles/global.css` hold both values: `--color-ink: light-dark(#1c1917, #f5f1ec)`. CSS picks one from `color-scheme`, which follows the system (`light dark`) unless `<html data-theme="light|dark">` forces one. The toggle sets `data-theme` and saves it in `localStorage`; an inline script in `BaseLayout` applies the saved choice before the page paints, so there's no flash. Code blocks in posts use Shiki's two themes the same way (`defaultColor: 'light-dark()'`).

## Tests and checks

| Layer | Where | Runs against |
|---|---|---|
| Unit | `tests/unit/*.test.ts` (Vitest) | `src/lib/`, `src/data/`, the color tokens |
| Built site | `checks/links.mjs` | `dist/client/`: links, anchors, titles, descriptions, headings, alt text |
| Screens | `tests/e2e/*.spec.ts` (Playwright) | `astro preview` on port 4398, `FORM_PROVIDER=console` |
| Checks | `checks/run.mjs` (`npm run check`) | env docs, `astro check`, unit, build, links, screens |

No check calls an outside service: the webhook provider is tested with a fake `fetch`.

## Images in this template

The logo (`src/components/Logo.astro`, `public/favicon.svg`), the product screenshot (`src/assets/screenshot.png`), the blog covers (`src/assets/blog/`) and the share image (`public/og/default.png`) were drawn for this template (CodePlate originals). Replace them with the user's own.
