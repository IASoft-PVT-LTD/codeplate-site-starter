# Add a second language

Use when the site needs another language, with its own URLs (`/es/`), a language switcher, the right `<html lang>` and `hreflang` links for search engines. The example adds **Spanish** for the home page, the About page, the header, footer and forms; English stays the default at `/`. Other pages (pricing, blog, changelog) stay in English until you translate them the same way (step 10).

Astro's i18n routing is documented under `i18n` in `node_modules/astro/dist/types/public/config.d.ts`; the helpers (`getRelativeLocaleUrl`, …) are typed in `node_modules/astro/dist/virtual-modules/i18n.d.ts`. Translations must come from the user or be clearly marked as machine drafts for them to review (record which in `docs/project.md`).

1. **Configure the locales** in `astro.config.mjs`, after `output`:
   ```js
   // Languages: English at /, Spanish at /es/ (docs/recipes/add-i18n.md).
   i18n: {
     locales: ['en', 'es'],
     defaultLocale: 'en',
     routing: { prefixDefaultLocale: false },
   },
   ```
   and tell the sitemap, so it lists alternates: `sitemap({ filter: …, i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } } })` (keep the existing `filter`).

2. **UI strings and per-language data**, `src/i18n/index.ts`. Every hard-coded word in the shared components goes here, and `siteFor()` / `homeFor()` pick the right data file:
   ```ts
   // Languages, UI strings and per-language data (docs/recipes/add-i18n.md).
   import * as homeEn from '../data/home';
   import * as homeEs from '../data/es/home';
   import { site as siteEn } from '../data/site';
   import { site as siteEs } from '../data/es/site';

   export const languages = { en: 'English', es: 'Español' } as const;
   export type Lang = keyof typeof languages;
   export const defaultLang: Lang = 'en';

   /** Astro.currentLocale → a known language (the default for anything else). */
   export const langOf = (locale: string | undefined): Lang => (locale && locale in languages ? (locale as Lang) : defaultLang);

   const ui = {
     en: { skip: 'Skip to content', menu: 'Menu', theme: 'Switch between light and dark theme', home: 'home', email: 'Email', name: 'Name', message: 'Message', send: 'Send message', join: 'Join the waitlist' },
     es: { skip: 'Saltar al contenido', menu: 'Menú', theme: 'Cambiar entre tema claro y oscuro', home: 'inicio', email: 'Correo electrónico', name: 'Nombre', message: 'Mensaje', send: 'Enviar mensaje', join: 'Unirme a la lista' },
   } satisfies Record<Lang, Record<string, string>>;

   export type UiKey = keyof (typeof ui)['en'];
   export const t = (locale: string | undefined) => (key: UiKey) => ui[langOf(locale)][key];

   export const siteFor = (locale: string | undefined) => (langOf(locale) === 'es' ? siteEs : siteEn);
   export const homeFor = (locale: string | undefined) => (langOf(locale) === 'es' ? homeEs : homeEn);
   ```

3. **The Spanish data files**, with the same shape as the English ones:
   - `src/data/es/site.ts`: start from the English object and override what's translated:
     ```ts
     // Spanish site words (docs/recipes/add-i18n.md). Same shape as src/data/site.ts.
     import { site as en } from '../site';

     export const site = {
       ...en,
       tagline: 'Check-ins diarios para equipos que trabajan a distancia',
       description: 'Brightside sustituye la reunión diaria por un check-in escrito de dos minutos.',
       lang: 'es',
       nav: [
         { label: 'Precios', href: '/pricing/' },
         { label: 'Blog', href: '/blog/' },
         { label: 'Novedades', href: '/changelog/' },
         { label: 'Sobre nosotros', href: '/es/about/' },
       ],
       cta: { label: 'Unirme a la lista', href: '/es/#waitlist' },
       footer: [
         { title: 'Producto', links: [{ label: 'Funciones', href: '/es/#features' }, { label: 'Precios', href: '/pricing/' }] },
         { title: 'Empresa', links: [{ label: 'Sobre nosotros', href: '/es/about/' }, { label: 'Contacto', href: '/contact/' }] },
         { title: 'Legal', links: [{ label: 'Privacidad', href: '/privacy/' }, { label: 'Términos', href: '/terms/' }] },
       ],
     };
     ```
     Links to pages that aren't translated yet point at the English page.
   - `src/data/es/home.ts`: copy `src/data/home.ts` (keep its `import type { IconName } from '../../components/Icon.astro';`, one folder deeper) and translate every string; keep `href`s pointing at `/es/…` where the target is translated (`'#waitlist'` stays as it is).

4. **Use them in the shared components.** In each file, replace the `import { site } from '../data/site';` (or the `../../data/home` import) with the line shown:
   - `src/components/Header.astro` and `src/components/Footer.astro`: `import { siteFor } from '../i18n';` and, in the frontmatter, `const site = siteFor(Astro.currentLocale);`.
   - Every section in `src/components/home/` (`Hero`, `LogoStrip`, `Features`, `Screenshot`, `Testimonials`, `PricingTeaser`, `Cta`): `import { homeFor } from '../../i18n';` and `const { hero } = homeFor(Astro.currentLocale);` (with the names that file imported: `logos`, `features, featuresTitle`, `screenshot`, `testimonials`, `pricingTeaser`, `cta`). The home pages pass `faq` to `<Faq>` themselves (step 6).
   - `src/layouts/BaseLayout.astro`: `<html lang={Astro.currentLocale ?? site.lang}>`, and the skip link text `{t(Astro.currentLocale)('skip')}` (import `t` from `'../i18n'`).
   - `src/components/Header.astro`: the menu's `aria-label="Menu"` → `aria-label={tr('menu')}`, and `aria-label={`${site.name} home`}` → `aria-label={`${site.name} ${tr('home')}`}`, with `const tr = t(Astro.currentLocale);`. In `ThemeToggle.astro`, the button's `aria-label` → `{t(Astro.currentLocale)('theme')}`.
   - `src/components/SubscribeForm.astro`: `const tr = t(Astro.currentLocale);`, the labels `Name`, `Email`, `Message` → `{tr('name')}`, `{tr('email')}`, `{tr('message')}`, and the default button text → `kind === 'waitlist' ? tr('join') : tr('send')`.

5. **A language switcher** in `src/components/Header.astro`, before `<ThemeToggle />`. Pages pass their translations (step 6); without one, it links to the other language's home page, so it never points at a page that doesn't exist:
   ```astro
   <a href={switchHref} hreflang={otherLang} lang={otherLang} class="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-brand-soft hover:text-ink">{otherLang.toUpperCase()}</a>
   ```
   with, in the frontmatter (`Astro.props` reaches the header through `BaseLayout`, step 6):
   ```ts
   import { langOf, type Lang } from '../i18n';
   interface Props {
     alternates?: Partial<Record<Lang, string>>;
   }
   const otherLang: Lang = langOf(Astro.currentLocale) === 'es' ? 'en' : 'es';
   const switchHref = Astro.props.alternates?.[otherLang] ?? (otherLang === 'en' ? '/' : '/es/');
   ```

6. **Translations of a page** are declared by the page through `BaseLayout`. Add to `SeoProps` in `src/components/Seo.astro`:
   ```ts
   /** The same page in each language, e.g. { en: '/about/', es: '/es/about/' }: hreflang links and the language switcher. */
   alternates?: Partial<Record<'en' | 'es', string>>;
   ```
   take it from `Astro.props` with the other props, and render, after the canonical link:
   ```astro
   {alternates && Object.entries(alternates).map(([lang, path]) => <link rel="alternate" hreflang={lang} href={absoluteUrl(path, siteUrl)} />)}
   ```
   In `src/layouts/BaseLayout.astro`, pass it on to the header: `<Header alternates={props.alternates} />`.
   Then the pages:
   - `src/pages/index.astro`: `<BaseLayout alternates={{ en: '/', es: '/es/' }}>`.
   - `src/pages/es/index.astro`: a copy of `src/pages/index.astro` with imports one folder deeper (`../../components/…`, `../../layouts/…`), `import { homeFor } from '../../i18n';`, `const { faq } = homeFor(Astro.currentLocale);` instead of the `faq` import, and `<BaseLayout description={…the Spanish description…} alternates={{ en: '/', es: '/es/' }}>`.

7. **Translated text pages.** Let the `pages` collection read subfolders: in `src/content.config.ts`, change its pattern to `'**/*.md'`. Ids become `about` and `es/about`. In `src/pages/[page].astro`, keep only top-level pages: `const pages = (await getCollection('pages')).filter((p) => !p.id.includes('/'));`. Create `src/pages/es/[page].astro`, a copy of `src/pages/[page].astro` with imports one folder deeper and:
   ```ts
   export async function getStaticPaths() {
     const pages = (await getCollection('pages')).filter((p) => p.id.startsWith('es/'));
     return pages.map((page) => ({ params: { page: page.id.slice(3) }, props: { page } }));
   }
   ```
   and `alternates={{ en: `/${page.id.slice(3)}/`, es: `/es/${page.id.slice(3)}/` }}` on its `BaseLayout` (only for pages that exist in English too). Pass the same `alternates` from `src/pages/[page].astro` for pages that have a Spanish version. Then write `src/content/pages/es/about.md` with translated frontmatter and text.

8. **Form messages.** In `src/lib/form.ts`, add Spanish messages and pick them by the page the form was on:
   ```ts
   const messagesEs: Record<FormKind, string> = {
     waitlist: 'Ya estás en la lista. Te escribiremos cuando haya sitio.',
     contact: '¡Gracias! Te responderemos en dos días laborables.',
   };
   ```
   and in `handleSubmission()`, use `(submission.page?.startsWith('/es/') ? messagesEs : messages)[submission.kind]` in the JSON answer. Add a unit test for it in `tests/unit/form.test.ts`.

9. **Tests.** Add `'/es/'` and `'/es/about/'` to `PAGES` in `tests/e2e/helpers.ts`, and a screen test in `tests/e2e/pages.spec.ts`:
   ```ts
   test('the Spanish pages are in Spanish and link to their English versions', async ({ page }) => {
     await page.goto('/es/');
     await expect(page.locator('html')).toHaveAttribute('lang', 'es');
     await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/$/);
     await page.locator('header').getByRole('link', { name: 'EN', exact: true }).click();
     await expect(page).toHaveURL(/\/$/);
     await expect(page.locator('html')).toHaveAttribute('lang', 'en');
   });
   ```

10. **More pages later:** the same pattern. Data in `src/data/es/…`, a page in `src/pages/es/…` with `alternates`, and the English page's `alternates` updated. For the blog, put Spanish posts in `src/content/blog/es/` and filter by `post.id.startsWith('es/')` in the Spanish blog pages.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` (the `links` step checks every `/es/` link and the switcher; `e2e` checks `lang` and the switcher).
2. Screenshots:
   ```
   npm run shots -- es es/about
   npm run shots -- es --width=390 --dark
   ```
   Check the header, footer, form and home sections are in Spanish, the switcher shows "EN", and longer Spanish words still fit on the phone header and buttons.
3. In `dist/client/sitemap-0.xml`, the English and Spanish home pages list each other as `xhtml:link` alternates.
