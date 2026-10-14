# Generate OG images

Use when each blog post (or page) should get its own share image: the picture shown when someone posts the link on social media or in a chat. By default every page uses `public/og/default.png`. This recipe draws one 1200×630 PNG per post with the post's title, using the same card design as `npm run og`, and makes each post use its own.

The images are drawn with the test browser (Playwright) on your machine and committed as files in `public/og/blog/`, not at build time: hosting build machines don't have a browser, and a PNG in `public/` works on every host.

1. **The script**, `scripts/og-posts.mjs`. It reuses the card from `scripts/og-image.mjs` and reads each post's `title` from its frontmatter:
   ```js
   // Draws a share image for every blog post: public/og/blog/<post id>.png.
   //   npm run og:posts
   // Run it after adding a post or changing a title, and commit the PNGs.
   // The card design is ogHtml() in scripts/og-image.mjs.
   import { readdirSync, readFileSync } from 'node:fs';
   import { join, relative } from 'node:path';
   import { ogHtml, ogOptions, renderCards } from './og-image.mjs';

   const BLOG = 'src/content/blog';

   /** Every .md/.mdx file under the blog folder (files starting with _ are skipped, as the collection does). */
   function posts(dir) {
     return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
       const p = join(dir, e.name);
       if (e.isDirectory()) return posts(p);
       return /^[^_].*\.mdx?$/.test(e.name) ? [p] : [];
     });
   }

   /** A frontmatter field's value, without quotes. */
   function field(source, name) {
     const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
     const raw = fm.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
     return raw.replace(/^(['"])(.*)\1$/, '$2');
   }

   const cards = posts(BLOG).map((file) => {
     const source = readFileSync(file, 'utf8');
     // The post id: its path in the blog folder without the extension, as the glob loader makes it.
     const id = relative(BLOG, file).replace(/\\/g, '/').replace(/\.mdx?$/, '');
     return { html: ogHtml(ogOptions(field(source, 'title'), undefined, 'Blog')), out: `public/og/blog/${id}.png` };
   });
   await renderCards(cards);
   ```
   Add it to `package.json` `scripts`: `"og:posts": "node scripts/og-posts.mjs"`.

2. **Use the image on the post page.** In `src/pages/blog/[...id].astro`, add `import { existsSync } from 'node:fs';` to the frontmatter, and after `const { Content } = await render(post);`:
   ```ts
   // This post's share image from `npm run og:posts`, if it has been drawn.
   const ogImage = existsSync(`public/og/blog/${post.id}.png`) ? `/og/blog/${post.id}.png` : undefined;
   ```
   Then pass it to the layout: `<BaseLayout title={title} description={description} image={ogImage} imageAlt={title} article={…}>` (keep the existing `article` prop). Pages run at build time in the project folder, so the check works; a post without an image falls back to the default.

3. **Keep them in step with a test**, `tests/unit/og.test.ts`, so a new post without its image fails the checks with the fix in the message:
   ```ts
   // Every blog post has its share image (docs/recipes/generate-og-images.md).
   import { existsSync, readdirSync } from 'node:fs';
   import { join, relative } from 'node:path';
   import { expect, it } from 'vitest';

   const BLOG = 'src/content/blog';
   const posts = (dir: string): string[] =>
     readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? posts(join(dir, e.name)) : /^[^_].*\.mdx?$/.test(e.name) ? [join(dir, e.name)] : []));

   it.each(posts(BLOG).map((f) => relative(BLOG, f).replace(/\\/g, '/').replace(/\.mdx?$/, '')))('post %s has its share image in public/og/blog/', (id) => {
     expect(existsSync(`public/og/blog/${id}.png`), 'run `npm run og:posts` and commit the PNG').toBe(true);
   });
   ```

4. **Draw them:** `npm run og:posts` (needs the test browser from `npm run setup`, or `PW_CHANNEL=msedge`/`chrome`). It prints each saved file. Open two or three PNGs and look: long titles must fit (the card shrinks the font above 40 characters; shorten a title over about 80).

5. **Other pages** can get their own image the same way: `npm run og -- --title="Pricing" --subtitle="Free for small teams" --out=public/og/pricing.png`, then pass `image="/og/pricing.png"` to `BaseLayout` in that page.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` (the new unit test passes only if every post has its PNG).
2. In the built site, a post points at its own image:
   ```bash
   grep -o '<meta property="og:image" content="[^"]*"' dist/client/blog/*/index.html
   ```
   Each post shows `…/og/blog/<its id>.png`; other pages show `…/og/default.png`.
3. Open the PNGs in `public/og/blog/` and check the text fits. After the site is live, the user can paste a post URL into a link-preview checker (or a chat app) to see it.
