// Content collections: the blog, its authors and the changelog. Each entry's
// frontmatter is checked against these schemas when the site builds (and by
// `astro check`), so a missing title or alt text fails the checks instead of
// shipping a broken page.
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // Every .md or .mdx file in src/content/blog/. The file name is the URL:
  // src/content/blog/hello-world.mdx → /blog/hello-world/.
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1).max(90),
        /** One or two sentences: the post list, RSS and the meta description. */
        description: z.string().min(1).max(200),
        /** YYYY-MM-DD. */
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        /** The id of an entry in src/content/authors.json. */
        author: reference('authors'),
        tags: z.array(z.string().regex(/^[a-z0-9-]+$/, 'tags are lowercase-kebab-case')).default([]),
        /** A local image next to the posts (src/assets/blog/), with its alt text. */
        cover: image().optional(),
        coverAlt: z.string().min(1).optional(),
        /** Drafts show in `astro dev` but are left out of the built site. */
        draft: z.boolean().default(false),
      })
      .refine((p) => !p.cover || p.coverAlt, { message: 'a post with a cover needs coverAlt (alt text)', path: ['coverAlt'] }),
});

const authors = defineCollection({
  // One JSON array; each object's `id` is what posts put in `author`.
  loader: file('src/content/authors.json'),
  schema: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    /** Optional link to the author's own page. */
    url: z.url().optional(),
  }),
});

const changelog = defineCollection({
  // One Markdown file per release in src/content/changelog/.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/changelog' }),
  schema: z.object({
    version: z.string().min(1),
    date: z.coerce.date(),
    title: z.string().min(1),
  }),
});

const pages = defineCollection({
  // Text pages (About, Privacy, Terms…): src/content/pages/about.md → /about/.
  // src/pages/[page].astro renders them. Pages with their own layout are
  // .astro files in src/pages/ instead (docs/recipes/add-a-page.md).
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(200),
    /** The line under the title. */
    intro: z.string().optional(),
    /** Keep the page out of search results (e.g. placeholder legal pages). */
    noindex: z.boolean().default(false),
  }),
});

export const collections = { blog, authors, changelog, pages };
