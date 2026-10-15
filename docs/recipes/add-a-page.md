# Add a page

Use when the user wants a new page: a text page (careers, press, a long FAQ, opening hours) or a page with its own layout (a team page, a menu, a services list). The example adds **Careers** as a Markdown page and **Team** as a page with its own layout, and puts both in the navigation and the tests.

Pick the kind first:

- **Text page** (headings, paragraphs, lists, links): a Markdown file in `src/content/pages/`. `src/pages/[page].astro` renders it with the standard page header and `.prose` styles. No code.
- **Page with its own layout** (cards, grids, a form): an `.astro` file in `src/pages/`, with its words in a data file in `src/data/` (AGENTS.md rule 1).

## A. Text page

1. Create `src/content/pages/careers.md`. The file name is the URL (`/careers/`): lowercase, words joined by `-`, and not the name of a file in `src/pages/` (`pricing`, `contact`, `changelog`, `thanks`, `404`), which would win.
   ```md
   ---
   title: Careers
   description: Work with us on a calmer way for teams to stay in sync. We're a small, remote team.
   intro: We're a small, remote team. Here is how we work and who we're looking for.
   ---

   ## How we work

   We write things down, keep meetings for decisions and work the hours that suit us.

   ## Open roles

   No open roles right now. If you'd like to hear when there are, [write to us](/contact/).
   ```
   The frontmatter is checked by the `pages` schema in `src/content.config.ts`: `title` and `description` (at most 200 characters) are required; `intro` (the line under the title) and `noindex: true` (keep it out of search results) are optional. Start the body's headings at `##`: the page title is the only `<h1>`.

## B. Page with its own layout

2. Put the words in `src/data/team.ts`:
   ```ts
   // The people on /team/ (src/pages/team.astro).
   export const teamPage = {
     title: 'The team',
     intro: 'Six people in four countries, building Brightside with Brightside.',
     description: 'Meet the people who build Brightside.',
   };

   export const people: { name: string; role: string; bio: string }[] = [
     { name: 'Maya Lindqvist', role: 'Co-founder', bio: 'Ran remote teams for ten years and stopped enjoying stand-ups after the first.' },
     { name: 'Tomás Reyes', role: 'Product designer', bio: 'Designs the check-in and the digest. Believes every form can be shorter.' },
   ];
   ```
3. Create `src/pages/team.astro` (the file name is the URL, `/team/`). Use `BaseLayout` (it adds the header, footer and SEO tags from the props), `PageHeader` for the one `<h1>`, and token classes for colors (rule 3):
   ```astro
   ---
   // /team/: the people from src/data/team.ts.
   import PageHeader from '../components/PageHeader.astro';
   import { people, teamPage } from '../data/team';
   import BaseLayout from '../layouts/BaseLayout.astro';
   ---

   <BaseLayout title={teamPage.title} description={teamPage.description}>
     <PageHeader title={teamPage.title} intro={teamPage.intro} />
     <ul class="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
       {
         people.map((p) => (
           <li class="rounded-(--radius-card) border border-line bg-paper p-6">
             <h2 class="text-lg font-bold">{p.name}</h2>
             <p class="text-sm font-medium text-brand">{p.role}</p>
             <p class="mt-3 text-ink-soft">{p.bio}</p>
           </li>
         ))
       }
     </ul>
   </BaseLayout>
   ```
   For photos, put them in `src/assets/team/`, import them, and render `<Image src={photo} alt={p.name} width={160} height={160} />` from `astro:assets` (rule 2). For a page nested in a folder (`/legal/cookies/`), create `src/pages/legal/cookies.astro`.

## Both kinds

4. **Link to it.** Add it to `nav` (the header, keep it to about five links so it fits) or a `footer` column in `src/data/site.ts`, with a trailing slash:
   ```ts
   { label: 'Team', href: '/team/' },
   ```
   `tests/unit/data.test.ts` checks every internal link in `site.ts` points to a page that exists.
5. **Add it to the screen tests.** Append `'/careers/'` and `'/team/'` to `PAGES` in `tests/e2e/helpers.ts`. Every page there is checked for one visible `<h1>`, no browser errors, no horizontal scroll on a phone and a dark background in dark mode.
6. It's in the sitemap automatically. To keep a page out of search and the sitemap, set `noindex` (frontmatter, or the `noindex` prop of `BaseLayout`) and add it to the `sitemap({ filter })` in `astro.config.mjs`, as `/thanks/` is.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS`. The `types` step validates the Markdown frontmatter; `links` checks the new page has a title, a description, one `<h1>` and working links; `e2e` renders it.
2. Screenshots:
   ```
   npm run shots -- careers team
   npm run shots -- careers team --width=390 --dark
   ```
   Check the header shows the new link (on the phone: in the Menu), and the page reads well in both modes.
