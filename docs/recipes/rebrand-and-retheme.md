# Rebrand and retheme

Use when the site gets its real name, logo, colors, fonts or words: usually right after the interview, using the **Brand** answers in `docs/project.md`. The example turns "Brightside" (orange) into **Crumb & Co**, a bakery (green). Every color on the site comes from the tokens in `src/styles/global.css`, so a retheme touches few files.

1. **Name and words** in `src/data/site.ts`: `name` (header, footer, titles, share image), `tagline` (the home page's browser title, the footer, the default share image), `description` (the default meta description: one or two sentences, at most 200 characters), `email` (contact page, mailto links), `social` (remove the profiles they don't have), `nav` and `cta` (header links and button). The browser title template (`Pricing · Crumb & Co`) and the RSS feed title read `name`.

2. **Logo** in `src/components/Logo.astro`. Replace the `<svg>` mark, keeping its size and token classes so it follows light and dark mode:
   ```astro
   <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" class="shrink-0">
     <rect width="32" height="32" rx="9" class="fill-brand"></rect>
     <path d="M7 19c0-5 4-9 9-9s9 4 9 9v3H7z" class="fill-on-brand"></path>
     <path d="M11 15v4M16 13v6M21 15v4" class="stroke-brand" stroke-width="2" stroke-linecap="round"></path>
   </svg>
   ```
   Draw simple marks yourself as SVG paths. If the user has a logo file, they must own it (AGENTS.md rule 7): paste an SVG's paths here (replace its colors with `fill-brand` / `fill-on-brand` classes), or save a PNG/SVG in `src/assets/` and render it with `<Image src={logo} alt="" height={28} />` from `astro:assets` (`alt=""` because the name is written next to it). If the logo already contains the name, pass `markOnly` where `<Logo />` is used (`Header.astro`, `Footer.astro`), and keep the `aria-label` on the header link.

3. **Favicon.** Replace `public/favicon.svg` with the same mark in real colors (the file is served as-is, so classes don't work):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#166534"/><path d="M7 19c0-5 4-9 9-9s9 4 9 9v3H7z" fill="#ffffff"/><path d="M11 15v4M16 13v6M21 15v4" stroke="#166534" stroke-width="2" stroke-linecap="round"/></svg>
   ```
   Keep the file name: `BaseLayout.astro` links it, and `Seo.astro` uses it as the publisher logo in JSON-LD. Don't delete it without a replacement: browsers then request `/favicon.ico`, get a 404, and the screen tests' console check fails.

4. **Colors** in `src/styles/global.css`. Each token is one line with its light and dark value: `light-dark(<light>, <dark>)`, 6-digit hex. What each is for:
   | Token | Used for |
   |---|---|
   | `brand` | primary buttons, links, icons, focus rings |
   | `brand-strong` | primary button hover |
   | `brand-soft` | badges, icon tiles, the pricing teaser and callout backgrounds, the hero glow |
   | `on-brand` | text and icons on `brand` |
   | `ink`, `ink-soft` | main text, secondary text |
   | `paper`, `canvas` | cards and inputs, page background |
   | `line` | borders and dividers |
   | `ok`, `bad` | form success and error messages |

   In dark mode the brand color must be light to read on dark backgrounds, so `on-brand` becomes a very dark shade of it instead of white. The Crumb & Co values:
   ```css
   --color-brand: light-dark(#166534, #4ade80);
   --color-brand-strong: light-dark(#14532d, #86efac);
   --color-brand-soft: light-dark(#dcfce7, #0f2a1a);
   --color-on-brand: light-dark(#ffffff, #03140a);
   --color-ink: light-dark(#1a1c19, #eef2ec);
   --color-ink-soft: light-dark(#4f5a50, #a9b5aa);
   --color-line: light-dark(#dde5dc, #2a332b);
   --color-paper: light-dark(#ffffff, #161b17);
   --color-canvas: light-dark(#f6f8f4, #0e120f);
   --color-ok: light-dark(#15803d, #4ade80);
   --color-bad: light-dark(#b91c1c, #f87171);
   ```
   `--radius-card` sets how round cards are. Never put raw colors in components (rule 3); add a token instead.

5. **Check the contrast:** `npm test`. `tests/unit/tokens.test.ts` (helper: `src/lib/contrast.ts`) reads the tokens and checks WCAG AA, at least 4.5:1, in light and dark mode for: body text (`ink`) and muted text (`ink-soft`) on the page background, brand-colored text and links (`brand`) on it, and button text (`on-brand`) on the brand color. It names each failing pair and its ratio.

   **Run it right after picking the brand color, before building anything on it.** A user's brand color is often too light for text on a cream or white background (orange, yellow, light green, sky blue). When it fails:
   - Keep the user's exact color for decoration only: the logo, large shapes, illustrations. Don't use it for text or buttons.
   - Set `brand` (and `brand-strong`) to a darker shade of the same hue in light mode, or a lighter one in dark mode, until the test passes. Same for `on-brand` if the button label fails.
   - Never lower the bar or drop a pair from the test.
   - Record it in `docs/project.md`: the brand color the user gave, the shade used for text and buttons, and why. Tell the user in your report, with a screenshot of a button.

6. **Fonts** (optional). The default is the system font stack in `--font-sans`: fast, nothing to download. For a brand font, use Astro's fonts API, which downloads the files when the site builds and serves them from the site itself (visitors' browsers never contact Google). Docs: `fonts` and `font.*` in `node_modules/astro/dist/types/public/config.d.ts`.
   1. In `astro.config.mjs`, add `fontProviders` to the import from `astro/config`, and a `fonts` entry next to `env`:
      ```js
      fonts: [
        {
          provider: fontProviders.google(),
          name: 'Fraunces',
          cssVariable: '--font-brand',
          weights: [400, 600, 700, 800],
          fallbacks: ['Georgia', 'serif'],
        },
      ],
      ```
   2. In `src/layouts/BaseLayout.astro`, add `import { Font } from 'astro:assets';` to the frontmatter and `<Font cssVariable="--font-brand" preload />` inside `<head>`, before `<Seo>`.
   3. In `src/styles/global.css`, put the variable first: `--font-sans: var(--font-brand), ui-sans-serif, system-ui, …;` (keep the rest of the stack).
   - The build (and so `npm run check`) needs internet access to fetch a Google font. For a font file the user provides, use `fontProviders.local()` with `options: { variants: [{ src: ['./src/assets/fonts/Brand.woff2'], weight: '400 800', style: 'normal' }] }` instead.
   - Most Google Fonts are under the SIL Open Font License, which isn't in rule 7's list. Tell the user the font and its license, and record their OK in `docs/project.md` before adding it.
   - Use one family (two at most) and only the weights the site uses (400, 600, 700, 800).

7. **Share image.** Redraw `public/og/default.png` with the new logo, name, tagline and colors: `npm run og` (it reads `public/favicon.svg`, `src/data/site.ts` and the tokens, so do steps 1–4 first; it needs the test browser from `npm run setup`, or `PW_CHANNEL`). Open the PNG and look at it. To change its layout, edit `ogHtml()` in `scripts/og-image.mjs`.

8. **Words.** Rewrite the home page in `src/data/home.ts` (see `edit-home-sections.md`), the plans and the pricing page's header in `src/data/pricing.ts`, `src/content/pages/about.md`, the authors in `src/content/authors.json` and the sample posts and changelog (replace or delete them: `add-a-blog-post.md`). Keep copy short and concrete. Don't invent testimonials, customer names or numbers for a real business (rule 9): remove those sections or mark them as placeholders in `docs/project.md`. Then search for leftovers:
   ```bash
   grep -rni "brightside" src public scripts tests .env.example astro.config.mjs
   ```
   Update what's left. The screen tests don't depend on the sample content, except the form messages (`tests/e2e/form.spec.ts`, from `messages` in `src/lib/form.ts`) and the 404 heading: if you change those words, update the tests to match and say so (rule 8). Two kinds of match can stay: `brightside.example` is the placeholder site URL in `astro.config.mjs`, which `custom-domain-and-seo-checklist.md` replaces once the domain is known; and `tests/unit/blog.test.ts` uses the name and URL only as sample input.

9. **Docs.** Rewrite `README.md` for the site (as `AGENTS.md` says) and record the brand decisions (name, colors, font and its license, logo source) in `docs/project.md`.

## Verify

1. `npm run check`. It must end with `CODEPLATE CHECKS: PASS`. A Google font needs internet access during `build`.
2. Screenshots of every page, light and dark, desktop and phone (four PNGs per page):
   ```
   npm run shots -- / pricing blog contact about --all
   ```
   Look for: the new name and logo in the header and footer; buttons readable in both modes (dark mode: dark text on the light brand color); the badges, icon tiles and the pricing teaser readable; the font is the new one (compare letter shapes with an old screenshot); on the phone the header (logo, theme toggle, menu) fits on one line: with a long name, use `markOnly` in the header below `sm`.
3. Open `public/og/default.png` and check the name, title and colors.
4. With `npm run dev`, check the browser tab shows the new icon, or ask the user to.
