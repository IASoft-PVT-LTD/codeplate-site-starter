# Add a blog post (and authors)

Use when the user wants to publish a post, add an author, or replace the sample posts. Posts are Markdown (`.md`) or MDX (`.mdx`, Markdown that can also use components) files in `src/content/blog/`; their frontmatter is checked by the `blog` schema in `src/content.config.ts`. The example adds an author, Priya, and her post with a cover image and a callout.

1. **Add the author** (skip if they exist) to `src/content/authors.json`. The `id` is what posts put in `author`: lowercase, no spaces.
   ```json
   { "id": "priya", "name": "Priya Raman", "role": "Head of customer success", "url": "https://priya.example" }
   ```
   `name` and `role` are required; `url` (their own page) is optional and makes the byline a link.

2. **Pick the file name.** It becomes the URL: `src/content/blog/five-questions-to-ask.mdx` is `/blog/five-questions-to-ask/`. Lowercase, words joined by `-`, short. Use `.mdx` if the post uses a component (step 5), `.md` otherwise. Files starting with `_` are ignored (handy for notes).

3. **Write the frontmatter:**
   ```yaml
   ---
   title: Five questions to ask before you cancel a meeting
   description: Not every meeting should become a check-in. These five questions tell you which ones can go.
   date: 2026-10-20
   author: priya
   tags: [meetings, remote-work]
   cover: ../../assets/blog/five-questions.png
   coverAlt: A calendar page with three meetings crossed out and one circled.
   ---
   ```
   - `title` (at most 90 characters) and `description` (at most 200; it's the meta description, the RSS summary and the text on the post card) are required.
   - `date` is `YYYY-MM-DD`; posts are sorted newest first. Add `updated: YYYY-MM-DD` when you revise a post.
   - `tags`: lowercase-kebab-case (`remote-work`). Each tag gets a page at `/blog/tags/<tag>/`. Reuse existing tags where they fit (see the tag list on `/blog/`).
   - `cover` (optional): a path to an image relative to the post file, normally in `src/assets/blog/`. Astro resizes it and converts it to WebP. A post with a cover must have `coverAlt` describing the picture (the schema enforces it; AGENTS.md rule 2). Without a cover, the card and page simply have no image.
   - `draft: true` keeps a post out of the built site (and the RSS feed and sitemap) but shows it in `npm run dev` with a "Draft" badge, so the user can review it.

4. **Add the cover image** at the path you gave, e.g. `src/assets/blog/five-questions.png`. Use the user's own image or one they have the rights to (rule 7). A 1200×675 (16:9) image is plenty. If you need a placeholder, draw a simple SVG-style illustration; never take one from the web.

5. **Write the body** in Markdown under the frontmatter. Start headings at `##` (the title is the page's only `<h1>`). Links to other pages start with `/` and end with `/` (`[pricing](/pricing/)`); the link check verifies them. Images inside the post go in `src/assets/blog/` too, written as `![Alt text that describes it](../../assets/blog/figure.png)`. In `.mdx` posts you can use the callout box without importing it (it's passed to every post by `src/pages/blog/[...id].astro`):
   ```mdx
   <Callout type="tip" title="Start small">
     Pick one recurring meeting and run the five questions on it this week.
   </Callout>
   ```
   `type` is `note` (default), `tip` or `warning`; `title` is optional. To make another component available in posts, add it to the `components={{ Callout }}` object in `src/pages/blog/[...id].astro`.

6. **Replacing the sample posts:** delete the three files in `src/content/blog/`, their covers in `src/assets/blog/`, and the sample authors in `src/content/authors.json` that no post uses any more. Keep at least one published post: the blog index, RSS feed and the screen tests expect one. The screen tests find posts and tags from `/blog/` by themselves, so they need no change.

## Rename the blog (e.g. Journal, News)

The blog's URL is one constant, `blogBase` in `src/lib/blog.ts`. Every link (`blogUrl()`, `postUrl(id)`, `tagUrl(tag)`), the navigation and footer in `src/data/site.ts`, the RSS links, the 404 page and the screen tests are built from it. To make it `/journal/`:

1. **Move the pages:** `src/pages/blog/` to `src/pages/journal/` (the whole folder: index, `[...id].astro`, `tags/`). On Windows or macOS use `git mv`, or move it in the file manager.
2. **Change the constant:** `export const blogBase = '/journal';` in `src/lib/blog.ts`. `tests/unit/blog.test.ts` fails if the folder and the constant disagree.
3. **Change the words** the user sees (these are labels, not URLs): `label: 'Blog'` in `nav` and `footer` in `src/data/site.ts`; the page title and heading in `src/pages/journal/index.astro` and the "All posts" link text in `tags/[tag].astro`; the 404 button "Read the blog" in `src/pages/404.astro`; the feed title in `src/pages/rss.xml.ts` and `src/components/Seo.astro` (`${site.name} blog`).
4. **Leave `src/content/blog/` alone.** It's the collection's name, not a URL, so the post files and the `blog` schema stay as they are. (To rename the collection too, change it in `src/content.config.ts`, `getCollection('blog')` in `src/lib/posts.ts` and the folder.)
5. **Old links:** if the site was already live, add redirects from `/blog/...` (see `custom-domain-and-seo-checklist.md`). Don't hard-code `/blog/` anywhere: `grep -rn "/blog" src tests` should only show comments.
6. Tests: none need editing. `PAGES` in `tests/e2e/helpers.ts` and the blog tests use `blogUrl()` and `tagUrl()`. Run `npm run check`, then `npm run shots -- journal journal/tags/<a-tag> --all`.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS`. If `types` fails with a message about the post's frontmatter (`title`, `coverAlt`, `author`…), fix the field it names; an unknown `author` id means it's missing from `authors.json`.
2. Screenshots of the post, the blog index and the tag page:
   ```
   npm run shots -- blog/five-questions-to-ask blog blog/tags/meetings --all   (desktop + phone, light + dark)
   ```
   Check the cover, the byline, the callout and code blocks in both themes, and that the post is first on `/blog/` if it's the newest.
3. `/rss.xml` (in `npm run dev` or `dist/client/rss.xml` after a build) lists the new post with its description.
