# Customization map

"I want to change X." Here is where to go. If a recipe exists, follow it.

| I want to… | Change | Recipe |
|---|---|---|
| Rename the site, tagline, description, contact email | `src/data/site.ts` | `recipes/rebrand-and-retheme.md` |
| Change colors (light and dark) | `src/styles/global.css` (`@theme` tokens) | `recipes/rebrand-and-retheme.md` |
| Change fonts | `src/styles/global.css`, `fonts` in `astro.config.mjs` | `recipes/rebrand-and-retheme.md` |
| Replace the logo or favicon | `src/components/Logo.astro`, `public/favicon.svg` | `recipes/rebrand-and-retheme.md` |
| Change the share image (link previews) | `npm run og`, `public/og/default.png` | `recipes/rebrand-and-retheme.md`, `recipes/generate-og-images.md` |
| Change the home page words | `src/data/home.ts` | `recipes/edit-home-sections.md` |
| Reorder, remove or add home sections | `src/pages/index.astro`, `src/components/home/` | `recipes/edit-home-sections.md` |
| Change the product screenshot | `src/assets/screenshot.png`, `screenshot.alt` in `src/data/home.ts` | `recipes/edit-home-sections.md` |
| Change plans and prices | `src/data/pricing.ts` | `recipes/edit-home-sections.md` |
| Change the header links or the button | `nav` and `cta` in `src/data/site.ts` | `recipes/add-a-page.md` |
| Change the footer links or social profiles | `footer` and `social` in `src/data/site.ts` | — |
| Add a text page (FAQ, careers, press) | `src/content/pages/<name>.md` | `recipes/add-a-page.md` |
| Add a page with its own layout | `src/pages/<name>.astro` | `recipes/add-a-page.md` |
| Edit About, Privacy, Terms | `src/content/pages/about.md`, `privacy.md`, `terms.md` | — |
| Write a blog post | `src/content/blog/<id>.md` or `.mdx` | `recipes/add-a-blog-post.md` |
| Add an author | `src/content/authors.json` | `recipes/add-a-blog-post.md` |
| Add a changelog entry | `src/content/changelog/<version>.md` | — |
| Rename the blog's URL or section (Journal, News) | `blogBase` in `src/lib/blog.ts`, move `src/pages/blog/`, `nav`/`footer` labels | `recipes/add-a-blog-post.md` |
| Change the post page or post cards | `src/pages/blog/[...id].astro`, `src/components/PostCard.astro` | — |
| Add a box style for MDX posts | `src/components/Callout.astro` | `recipes/add-a-blog-post.md` |
| Change how long text looks | `.prose` in `src/styles/global.css` | — |
| Send form submissions somewhere | `FORM_PROVIDER`, `FORM_WEBHOOK_URL`; `src/lib/form.ts` | `recipes/connect-the-form.md` |
| Change the form fields or messages | `src/components/SubscribeForm.astro`, `submissionSchema` and `messages` in `src/lib/form.ts` | `recipes/connect-the-form.md` |
| Remove the forms (fully static site) | `formEndpoint: null` in `src/data/site.ts`, the adapter | `recipes/deploy.md` |
| Add documentation pages | new collection + `src/pages/docs/` | `recipes/add-a-docs-section.md` |
| Count visitors | `src/layouts/BaseLayout.astro` | `recipes/add-analytics.md` |
| A share image per post | `scripts/og-image.mjs` | `recipes/generate-og-images.md` |
| A second language | `i18n` in `astro.config.mjs`, `src/pages/<lang>/` | `recipes/add-i18n.md` |
| Change titles, meta tags, JSON-LD | `src/components/Seo.astro`, `src/lib/seo.ts` | `recipes/custom-domain-and-seo-checklist.md` |
| Set the real domain | `site` in `astro.config.mjs` | `recipes/custom-domain-and-seo-checklist.md` |
| Keep a page out of search and the sitemap | `noindex` prop or frontmatter, `sitemap({ filter })` in `astro.config.mjs` | `recipes/custom-domain-and-seo-checklist.md` |
| Add an icon | `paths` in `src/components/Icon.astro` | — |
| Add an environment variable | `env.schema` in `astro.config.mjs` and `.env.example` (the checks require both) | `recipes/connect-the-form.md` |
| Go live | adapter, host settings | `recipes/deploy.md` |
