# Add a docs section

Use when the site needs documentation, a help center or guides: several pages with a sidebar, grouped into sections, written in Markdown. The example adds `/docs/` with a "Getting started" and a "Guides" group.

It's a new content collection (`docs`), a layout with the sidebar, and one route for all docs pages.

1. **The collection.** In `src/content.config.ts`, add before `export const collections`:
   ```ts
   const docs = defineCollection({
     // src/content/docs/getting-started/install.md → /docs/getting-started/install/
     loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/docs' }),
     schema: z.object({
       title: z.string().min(1),
       description: z.string().min(1).max(200),
       /** The sidebar group this page belongs to. */
       section: z.string().min(1),
       /** Position in its group (and of the group, by its first page): lower comes first. */
       order: z.number().int().default(100),
     }),
   });
   ```
   and add `docs` to the exported object: `export const collections = { blog, authors, changelog, pages, docs };`.

2. **The helper** that sorts pages and groups them, in `src/lib/docs.ts`:
   ```ts
   // The docs collection, sorted and grouped for the sidebar.
   import { getCollection, type CollectionEntry } from 'astro:content';

   export type Doc = CollectionEntry<'docs'>;

   /** Every docs page in reading order: by group (its lowest `order`), then by `order`, then title. */
   export async function getDocs(): Promise<Doc[]> {
     const docs = await getCollection('docs');
     const groupOrder = new Map<string, number>();
     for (const d of docs) groupOrder.set(d.data.section, Math.min(groupOrder.get(d.data.section) ?? Infinity, d.data.order));
     return docs.sort(
       (a, b) =>
         groupOrder.get(a.data.section)! - groupOrder.get(b.data.section)! ||
         a.data.section.localeCompare(b.data.section) ||
         a.data.order - b.data.order ||
         a.data.title.localeCompare(b.data.title),
     );
   }

   /** The sidebar: groups in reading order, each with its pages. */
   export function groupDocs(docs: Doc[]): { section: string; docs: Doc[] }[] {
     const groups: { section: string; docs: Doc[] }[] = [];
     for (const d of docs) {
       const last = groups.at(-1);
       if (last?.section === d.data.section) last.docs.push(d);
       else groups.push({ section: d.data.section, docs: [d] });
     }
     return groups;
   }
   ```

3. **The layout** with the sidebar, `src/layouts/DocsLayout.astro`. On phones the sidebar folds into a disclosure (no JavaScript, AGENTS.md rule 4):
   ```astro
   ---
   // Docs pages: a sidebar of every page (grouped), the page, and previous/next links.
   import { groupDocs, type Doc } from '../lib/docs';
   import BaseLayout from './BaseLayout.astro';

   interface Props {
     doc: Doc;
     docs: Doc[];
   }
   const { doc, docs } = Astro.props;
   const i = docs.findIndex((d) => d.id === doc.id);
   const prev = docs[i - 1];
   const next = docs[i + 1];
   const href = (d: Doc) => `/docs/${d.id}/`;
   ---

   <BaseLayout title={`${doc.data.title} · Docs`} description={doc.data.description}>
     <div class="mx-auto grid max-w-6xl gap-8 px-4 pt-10 sm:px-6 md:grid-cols-[14rem_1fr]">
       <details class="docs-nav rounded-(--radius-card) border border-line bg-paper p-4 md:border-0 md:bg-transparent md:p-0" open>
         <summary class="cursor-pointer font-semibold md:hidden">Docs menu</summary>
         <nav aria-label="Docs" class="mt-3 md:sticky md:top-24 md:mt-0">
           {
             groupDocs(docs).map((g) => (
               <div class="mb-6">
                 <p class="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">{g.section}</p>
                 <ul class="space-y-1 text-sm">
                   {g.docs.map((d) => (
                     <li>
                       <a href={href(d)} aria-current={d.id === doc.id ? 'page' : undefined} class="block rounded-lg px-3 py-1.5 text-ink-soft hover:text-ink aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold aria-[current=page]:text-brand">
                         {d.data.title}
                       </a>
                     </li>
                   ))}
                 </ul>
               </div>
             ))
           }
         </nav>
       </details>
       <article class="min-w-0">
         <p class="text-sm font-medium text-brand">{doc.data.section}</p>
         <h1 class="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.data.title}</h1>
         <p class="mt-3 text-lg text-ink-soft">{doc.data.description}</p>
         <div class="prose mt-8">
           <slot />
         </div>
         <nav aria-label="Previous and next" class="mt-12 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
           {prev ? <a href={href(prev)} class="rounded-xl border border-line bg-paper p-4 hover:border-brand"><span class="block text-xs text-ink-soft">Previous</span><span class="font-semibold">{prev.data.title}</span></a> : <span />}
           {next && <a href={href(next)} class="rounded-xl border border-line bg-paper p-4 text-right hover:border-brand"><span class="block text-xs text-ink-soft">Next</span><span class="font-semibold">{next.data.title}</span></a>}
         </nav>
       </article>
     </div>
   </BaseLayout>

   <style>
     /* Always open on wide screens, where it's a sidebar. */
     @media (min-width: 48rem) {
       .docs-nav > summary {
         display: none;
       }
     }
   </style>
   ```

4. **The routes.** One page per doc, `src/pages/docs/[...id].astro`:
   ```astro
   ---
   import { render } from 'astro:content';
   import Callout from '../../components/Callout.astro';
   import DocsLayout from '../../layouts/DocsLayout.astro';
   import { getDocs, type Doc } from '../../lib/docs';

   export async function getStaticPaths() {
     const docs = await getDocs();
     return docs.map((doc) => ({ params: { id: doc.id }, props: { doc, docs } }));
   }

   interface Props {
     doc: Doc;
     docs: Doc[];
   }
   const { doc, docs } = Astro.props;
   const { Content } = await render(doc);
   ---

   <DocsLayout doc={doc} docs={docs}>
     <Content components={{ Callout }} />
   </DocsLayout>
   ```
   And `/docs/` itself, `src/pages/docs/index.astro`, listing the groups:
   ```astro
   ---
   import PageHeader from '../../components/PageHeader.astro';
   import BaseLayout from '../../layouts/BaseLayout.astro';
   import { getDocs, groupDocs } from '../../lib/docs';

   const groups = groupDocs(await getDocs());
   ---

   <BaseLayout title="Docs" description="Guides and reference for getting the most out of the product.">
     <PageHeader eyebrow="Docs" title="Documentation" intro="Everything you need to set up and run your team’s check-ins." />
     <div class="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2">
       {
         groups.map((g) => (
           <section class="rounded-(--radius-card) border border-line bg-paper p-6">
             <h2 class="text-lg font-bold">{g.section}</h2>
             <ul class="mt-3 space-y-2">
               {g.docs.map((d) => (
                 <li>
                   <a href={`/docs/${d.id}/`} class="font-medium text-brand hover:underline">{d.data.title}</a>
                   <p class="text-sm text-ink-soft">{d.data.description}</p>
                 </li>
               ))}
             </ul>
           </section>
         ))
       }
     </div>
   </BaseLayout>
   ```
   Replace the page's description, title and intro with the user's words.

5. **The pages.** Each is a Markdown file in `src/content/docs/`; a folder groups the URL (`getting-started/install.md` → `/docs/getting-started/install/`), and `section` groups the sidebar. Headings in the body start at `##`. For example `src/content/docs/getting-started/install.md`:
   ```md
   ---
   title: Set up your team
   description: Create your workspace, invite your team and choose when the questions are sent.
   section: Getting started
   order: 1
   ---

   ## Create a workspace

   Sign in with your work email and name your workspace.

   ## Invite your team

   Paste their email addresses, or share the invite link. Next: [write your first check-in](/docs/getting-started/first-check-in/).
   ```
   Write at least two pages per group. Use `.mdx` for pages with a `<Callout>`.

6. **Link and test it.** Add `{ label: 'Docs', href: '/docs/' }` to `nav` in `src/data/site.ts`, and `'/docs/'` plus each docs page's URL to `PAGES` in `tests/e2e/helpers.ts`.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` (the `links` step checks every sidebar and previous/next link).
2. Screenshots:
   ```
   npm run shots -- docs docs/getting-started/install
   npm run shots -- docs/getting-started/install --width=390 --dark
   ```
   Check: the sidebar groups are in order and the current page is highlighted; on the phone, "Docs menu" sits above the page and the text doesn't overflow; long code blocks scroll inside their box.
