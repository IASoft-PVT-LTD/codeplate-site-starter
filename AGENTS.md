# Astro Website Starter: agent brief

You are building a website for the user, starting from this template. This brief tells you how the project works, what to ask before changing anything, the rules that keep it working, and how to check every change. Read it all once. Then follow **Interview** before your first edit.

## Start here

This folder is a complete, working product website for a made-up app called **Brightside** (a placeholder). It's built with **Astro 7** (static pages, TypeScript strict) and **Tailwind CSS 4**:

- **Pages:** home (hero, logo strip, features, screenshot, testimonials, pricing teaser, FAQ, waitlist form), pricing, blog (index, tags, posts in Markdown or MDX, RSS, reading time), changelog, about, contact, privacy and terms stubs, a thank-you page and a 404 page.
- **Content lives in files, not in components:** the blog, its authors, the changelog and the text pages are content collections in `src/content/` with schemas; the home page words, plans, navigation and footer are in `src/data/`.
- **SEO built in:** titles, descriptions, canonical URLs, Open Graph and Twitter cards, JSON-LD for posts, `sitemap-index.xml`, `robots.txt`, an RSS feed and a default share image.
- **Light and dark theme** following the system, with a remembered toggle and no flash. Skip link, focus styles, alt text required.
- **A working form** for the waitlist and contact page: one server route (`/api/subscribe`) that prints submissions in development and posts them to a webhook (Slack, Discord, Zapier…) in production. Everything else is static HTML.
- **Runs with nothing to set up.** No accounts, no database, no API keys.

**Run it:** `npm install`, then `npm run dev` and open http://localhost:4321.

**Verify any change** with one command from this folder. It must end with `CODEPLATE CHECKS: PASS`:

```
npm run check
```

The first time, install the test browser: `npm run setup`. If that isn't possible, set `PW_CHANNEL=chrome` (or `msedge`) to use an installed browser. Node 22.12 or newer is required; 24 is what the template is tested with.

**Astro 7 is newer than most training data.** Its packages don't ship Markdown docs, but every config option is documented in `node_modules/astro/dist/types/public/config.d.ts` (search for `@name <option>`), the APIs of `astro:content`, `astro:assets` and the other virtual modules are typed in `node_modules/astro/client.d.ts` and `node_modules/astro/templates/content/types.d.ts`, and every error Astro can throw is explained in `node_modules/astro/dist/core/errors/errors-data.js`. Read the relevant one before using an API you're unsure of. **Common pitfalls** lists what changed from older Astro versions.

## Interview

Before you change anything, read `docs/project.md`.

- **If it still contains `<!-- codeplate:project-stub -->`, interview the user first.** Ask only what you need, in one short message, and suggest defaults so they can just say "yes":
  1. **The site.** What is it for: a product, a business (a bakery, a studio), a person, an event? Its name and a one-line pitch?
  2. **Brand.** Colors, logo (do they have a file?), tone of voice. A site they like the look of?
  3. **Pages.** Which of home, pricing, blog, changelog, about, contact do they want? Anything to add (menu, services, team, docs, events)?
  4. **Content to bring.** Text, photos, testimonials, logos of customers, blog posts. Placeholders are fine to start; you'll mark them clearly.
  5. **The form.** Waitlist, newsletter, contact or none? Where should submissions go: a Slack or Discord channel, an email inbox, a newsletter tool (Buttondown), a spreadsheet through Zapier or Make?
  6. **Domain and host.** Do they have a domain? Where will it run (Cloudflare, Vercel, Netlify, any static host)? This only matters at deploy time.

  Then replace the stub in `docs/project.md` with their answers as short decisions, and remove the marker.
- **Otherwise, the project has started.** `docs/project.md` holds the decisions made so far. Follow them, and add new decisions as the user makes them. This file is how the next session knows what was agreed.

Work in small steps. Make one change, verify it, show the result (see **Seeing your work**), then continue. The usual first steps are `rebrand-and-retheme.md`, then `edit-home-sections.md`, then `add-a-page.md` or `add-a-blog-post.md` for their content, then `connect-the-form.md`.

`README.md` and `codeplate.json` describe the template. Once the user has named their site, rewrite `README.md` for it (what it is, how to run it), and leave `codeplate.json` and `LICENSE.md` in place. `LICENSE.md` explains the user's rights to the template code.

## Architecture

Pages are made of components; the words come from content files and data files. See `docs/architecture.md` for the details, the request flow of the form and how the build works.

| Path | What lives there |
|---|---|
| `src/pages/` | One file per route: `index.astro` (home), `pricing.astro`, `contact.astro`, `changelog.astro`, `thanks.astro`, `404.astro`, `[page].astro` (Markdown text pages), `blog/` (index, `[...id].astro` posts, `tags/[tag].astro`; its URL is `blogBase` in `src/lib/blog.ts`), `rss.xml.ts`, `robots.txt.ts`, `api/subscribe.ts` (the only server route). |
| `src/content/` | Content collections: `blog/*.md(x)`, `authors.json`, `changelog/*.md`, `pages/*.md` (About, Privacy, Terms). |
| `src/content.config.ts` | The collections' schemas (zod). The build fails on a missing field. |
| `src/data/` | `site.ts` (name, tagline, description, email, navigation, footer, form endpoint), `home.ts` (every home section's words), `pricing.ts` (plans). |
| `src/components/` | `Seo.astro`, `Header.astro`, `Footer.astro`, `Logo.astro`, `Icon.astro`, `ThemeToggle.astro`, `SubscribeForm.astro`, `Callout.astro` (MDX), `PostCard.astro`, `PricingTable.astro`, `PageHeader.astro`; `home/` holds one component per home section. |
| `src/layouts/BaseLayout.astro` | `<head>`, theme script, skip link, header, footer. Every page uses it. |
| `src/lib/` | Plain TypeScript with unit tests: `form.ts` (validation, providers, responses), `blog.ts` (the blog's URL `blogBase` and link builders, reading time, sorting, tags, dates), `contrast.ts` (WCAG contrast), `seo.ts` (titles, URLs), `posts.ts` (the blog collection, drafts filtered). |
| `src/styles/global.css` | Design tokens (colors with light and dark values, fonts, radius) and the `.prose` styles for long text. |
| `src/assets/` | Images processed by Astro (resized, converted to WebP): the product screenshot, blog covers. |
| `public/` | Files served as-is: `favicon.svg`, `og/default.png` (the share image). |
| `astro.config.mjs` | Site URL, adapter, integrations (MDX, sitemap), Markdown code themes, environment variable schema. |
| `tests/unit/` | Vitest: the form handler, helpers, data files, color contrast. |
| `tests/e2e/` | Playwright: every page in a real browser, phone width, dark mode, the forms, SEO tags. |
| `checks/` | `run.mjs` (behind `npm run check`) and `links.mjs` (built-site link checker). |
| `scripts/` | `shots.mjs` (screenshots), `og-image.mjs` (draws the share image). |

## Rules

1. **Content goes in content files, not components.** Posts, authors, changelog entries and text pages go in `src/content/`; the home page words, plans, navigation and footer in `src/data/`. Components lay things out and read their words from there, so the user can change copy without touching layout code, and the schemas catch mistakes at build time. A new kind of repeated content gets a collection in `src/content.config.ts` with a schema.
2. **Every image has alt text.** `<Image>` and `<img>` always get an `alt` that says what the picture shows (`alt=""` only for pure decoration). Blog covers need `coverAlt` (the schema enforces it), and the link check fails on an `<img>` without `alt`. Put images that should be resized in `src/assets/` and render them with `<Image>` from `astro:assets`; only files that must keep their exact URL (favicon, share images) go in `public/`.
3. **Colors come from the tokens.** Style with the Tailwind classes made from the tokens in `src/styles/global.css` (`bg-brand`, `text-ink`, `text-ink-soft`, `border-line`, `bg-paper`, `bg-canvas`, `text-on-brand`…). Never put a hex color or a stock Tailwind color (`bg-orange-600`, `text-gray-500`) in a component; add a token instead, with a light and a dark value. `tests/unit/tokens.test.ts` checks the WCAG AA contrast (4.5:1) of text, links and buttons in both modes: when it fails after a brand change, darken the brand shade used for text and keep the logo color for decoration (`rebrand-and-retheme.md`, step 5).
4. **No client JavaScript unless something needs it.** Pages are HTML and CSS. The theme toggle and the form use small `<script>` tags that Astro bundles; anything else interactive should first try HTML (`<details>` for menus and FAQs, plain links and forms). If the user wants a UI framework component (React, Svelte, Vue), add its Astro integration and mark the component with a `client:*` directive, which is what makes Astro send its JavaScript: `client:visible` (loads when scrolled into view, the usual choice), `client:idle` (after the page loads), `client:load` (right away, for things above the fold), `client:only="react"` (never rendered on the server). Without a directive the component renders to static HTML and ships no JavaScript.
5. **Static first.** Every page is prerendered at build time. Only `src/pages/api/subscribe.ts` runs on the server (`export const prerender = false`). Don't add `prerender = false` to a page unless it really must be built per request (it then needs the adapter at deploy time; see `deploy.md`).
6. **No secrets in code.** Configuration comes from environment variables declared in `env.schema` in `astro.config.mjs` and imported from `astro:env/server`. Every variable is listed with a comment in `.env.example`; the checks fail if one is missing. Never create or commit `.env` files with real values; tell the user what to put in `.env` locally and in their host's settings.
7. **Keep the licensing clean.** Use only code you write here, packages from npm with permissive licenses (MIT, Apache-2.0, BSD, ISC), and images, fonts and text the user owns or that are CC0. Don't paste code from tutorials, themes or other projects. Pin new dependencies to exact versions (`npm install --save-exact`).
8. **Link to the blog with the builders, never a typed path.** Use `blogUrl()`, `postUrl(id)` and `tagUrl(tag)` from `src/lib/blog.ts`, so renaming the blog is one constant (`add-a-blog-post.md`, "Rename the blog").
9. **Never weaken a check to make it pass.** If a check fails, fix the cause. If the user deliberately changed something a test covers (say, they removed the pricing page), update that test to the new site and say so. When you add a page, add its path to `PAGES` in `tests/e2e/helpers.ts`.
10. **Don't invent facts about a real business.** Placeholder testimonials, customer logos, prices and legal text must be replaced or removed before launch. When you write placeholder copy, keep it obviously generic and list it in `docs/project.md` under open questions. Never present the privacy and terms stubs as real legal text.
11. **Keep the CodePlate credit.** This template's free license (`LICENSE.md`) asks that anything the user shares shows "Built with CodePlate (codeplate.io)" where people can see it. It's in the site footer (`src/components/Footer.astro`), and a screen test checks it. Keep it when you rebrand. The credit is only optional if `LICENSE.md` is the **CodePlate Pro License**: a copy downloaded with an active CodePlate paid plan comes with it, and names its license ID in `CODEPLATE-LICENSE.txt`. If the user asks to remove the credit and `LICENSE.md` is still the free license, tell them that.

## Verify

After every change:

1. **Run `npm run check`.** The last line must be `CODEPLATE CHECKS: PASS`. It runs these steps and lists each one's result:
   - `env`: every environment variable the code reads is in `.env.example`
   - `types`: `astro check` (TypeScript in `.astro` and `.ts` files, and every content file against its schema)
   - `unit`: the form handler, blog and SEO helpers, data links, color contrast
   - `build`: `astro build`
   - `links`: the built site's internal links and `#anchors`, page titles, descriptions, one `<h1>` per page, alt text, sitemap, RSS and robots.txt
   - `e2e`: every page in a real browser (headings, console errors, phone width, dark mode), the theme toggle, the forms with and without JavaScript, SEO tags, the credit

   For a quicker loop while working: `npm run typecheck`, `npm test`, or `node checks/run.mjs --skip=e2e`. Always finish with a full `npm run check`. If a step fails, the end of its output is repeated above the summary. Failed screen tests leave screenshots and traces in `.data/test-results/`.
2. **Look at it.** For anything visible, screenshot every page you touched with `--all` and open the PNGs (see **Seeing your work**). Taking them isn't enough. Check:
   - every piece of text is readable against its background
   - nothing overlaps or is cut off, on a phone width too (`--width=390`)
   - light and dark mode, since the site follows the system setting (`--all` covers both, and phone width)
3. **Tell the user** what changed and show the screenshots. Suggest they look with `npm run dev`.

## Recipes

Step-by-step guides for common requests. Follow the matching recipe when one fits; each ends with its own verification.

- `docs/recipes/rebrand-and-retheme.md`: name, logo, favicon, colors, fonts, share image and words.
- `docs/recipes/edit-home-sections.md`: change, reorder, remove or add sections of the home page.
- `docs/recipes/add-a-page.md`: a new page, as Markdown text or with its own layout, in the navigation and the tests.
- `docs/recipes/add-a-blog-post.md`: a post (Markdown or MDX, cover image, tags), a new author, drafts.
- `docs/recipes/connect-the-form.md`: send submissions to a webhook (Slack, Discord, Zapier), Resend email or Buttondown.
- `docs/recipes/add-a-docs-section.md`: documentation pages with a sidebar, from a new collection.
- `docs/recipes/add-analytics.md`: privacy-friendly visitor stats (Cloudflare Web Analytics or Plausible).
- `docs/recipes/generate-og-images.md`: a share image per blog post, drawn from its title.
- `docs/recipes/add-i18n.md`: a second language with Astro's i18n routing.
- `docs/recipes/deploy.md`: go live on Cloudflare, Vercel, Netlify, or any static host without the form server.
- `docs/recipes/custom-domain-and-seo-checklist.md`: the real domain, and everything to check before and after launch.

`docs/customization-map.md` answers "I want to change X — which file?" for everything else.

## Seeing your work

You can't watch the browser, but you can take screenshots of any page.

**Rule: before you report a change, screenshot every page it touched at desktop and phone width, in light and dark, and open the PNGs.** `--all` does the four combinations in one call. A change to the header, footer, tokens, a shared component or `global.css` touches every page, so shoot them all. Don't wait to be asked, and say in your report which pages you looked at.

```
npm run shots -- / pricing blog --all           (each page: desktop + phone, light + dark = 4 PNGs)npm run shots -- /                              (the home page, full length)
npm run shots -- / blog pricing --dark          (several pages, dark theme)
npm run shots -- / contact --width=390          (phone width)
npm run shots -- /blog/why-we-dropped-the-stand-up --top   (first screen only)
```

- `--all` is the four combinations of 1280 and 390 wide, light and dark; the files are `home.png`, `home-dark.png`, `home-390.png`, `home-390-dark.png`.
- It starts its own dev server on port 4399, next to any `npm run dev` you have open, and stops it afterwards.
- PNGs go to `shots/` (git-ignored) and the tool prints each path. Open them and look.
- In Git Bash on Windows, write paths without the leading slash (`blog pricing`), or the shell rewrites them.
- The tool prints the browser's errors and warnings for each page. Fix them: the screen tests fail on console errors.
- Form submissions in `npm run dev` print in the dev server's output as `[form] New waitlist sign-up: …`.

## Common pitfalls

- **"Another astro dev server is already running."** Astro 7 allows one `astro dev` per project and records it in `.astro/dev.json`. Use the one that's running (the message prints its URL), stop it with `npx astro dev stop`, or replace it with `npx astro dev --force`. `astro preview` works the same way.
- **`astro dev` returned at once and printed JSON.** When Astro detects it's run by an AI agent, on macOS and Linux it starts the dev server in the background and logs JSON. Read its output with `npx astro dev logs` and stop it with `npx astro dev stop` when you're done.
- **Content collections changed in Astro 5+.** The config is `src/content.config.ts` (not `src/content/config.ts`), every collection needs a `loader` (`glob()` or `file()` from `astro/loaders`), entries have `id` (no `slug`), and you render with `render(entry)` from `astro:content` (not `entry.render()`). Import `z` from `astro/zod` (it's zod 4: `z.email()`, `z.url()`).
- **Markdown plugins.** Astro 7 renders Markdown with its own processor (Sätteri) by default. remark and rehype plugins only work after switching `markdown.processor` to `unified()` from `@astrojs/markdown-remark` (see `markdown.processor` in `config.d.ts`). Compute things like reading time from `entry.body` instead, as `src/lib/blog.ts` does.
- **Environment variables.** Read server variables with `import { NAME } from 'astro:env/server'` after declaring them in `env.schema` (`astro.config.mjs`). `import.meta.env.NAME` is replaced at build time, so it's wrong for secrets that differ per environment. A variable is validated when the server starts; restart `npm run dev` after editing `.env`.
- **A 403 "Cross-site POST form submissions are forbidden".** Astro checks that form posts to server routes come from the same site (`security.checkOrigin`). Browsers pass it. To call the endpoint from a script or test, send `Sec-Fetch-Site: same-origin`, or post JSON.
- **An image doesn't show or the build says it can't find it.** Images in `src/assets/` are imported (`import pic from '../assets/pic.png'`) or referenced from frontmatter with a path relative to the Markdown file and the schema's `image()`. Files in `public/` are referenced by URL (`/og/default.png`) and are never processed.
- **Styles from a component don't apply to a child component.** Astro scopes `<style>` to the component's own elements. Style children with Tailwind classes passed as props, or use `:global()` / `<style is:global>` (as `ThemeToggle.astro` does for its icons).
- **A link works in dev but the link check fails.** Internal links must start with `/` (`/pricing/`, not `pricing/`): a relative link breaks on nested pages. Write page links with the trailing slash, as the built files are `pricing/index.html` and the sitemap lists `/pricing/`.
- **"The @astrojs/netlify adapter does not support the preview command"** (or Vercel's): the screen tests run on `astro preview`, which only the Node and Cloudflare adapters support. Keep the Node adapter for the checks and pick the host's adapter with `DEPLOY_TARGET` at build time, as `docs/recipes/deploy.md` (B, C) does.
- **npm prints "install-scripts" warnings** (npm 11 asks before running packages' install scripts, e.g. esbuild's). They're harmless here: the packages ship their binaries without them, and the checks pass. Don't approve scripts on the user's behalf.
