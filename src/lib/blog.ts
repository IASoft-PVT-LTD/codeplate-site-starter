// Plain helpers for the blog: no Astro imports, so tests/unit/blog.test.ts can
// run them directly. src/lib/posts.ts applies them to the real collection.

/**
 * Where the blog lives on the site. The ONE place to rename it (say to '/journal'):
 * change this, then move src/pages/blog/ to match (docs/recipes/add-a-blog-post.md,
 * "Rename the blog"). Every link, the RSS feed, the navigation and the tests use it.
 * Leading slash, no trailing slash.
 */
export const blogBase = '/blog';

/** The blog index: /blog/ */
export const blogUrl = () => `${blogBase}/`;
/** One post: /blog/<id>/ */
export const postUrl = (id: string) => `${blogBase}/${id}/`;
/** The tag page: /blog/tags/<tag>/ */
export const tagUrl = (tag: string) => `${blogBase}/tags/${tag}/`;

/** The fields these helpers need from a post. */
export type PostLike = { id: string; body?: string; data: { date: Date; draft: boolean; tags: string[] } };

/** Words per minute used for the reading time. */
export const WORDS_PER_MINUTE = 220;

/** Reading time in whole minutes (at least 1), from the post's Markdown source. */
export function readingMinutes(markdown: string): number {
  const text = markdown
    .replace(/^---[\s\S]*?---/, '') // frontmatter, if present
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/<[^>]+>/g, ' ') // MDX/HTML tags
    .replace(/[#>*_`~[\]()!-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Drafts are visible in development only. */
export function isVisible(post: PostLike, isDev: boolean): boolean {
  return isDev || !post.data.draft;
}

/** Newest first; same-day posts by id, so the order is stable. */
export function sortByDate<T extends PostLike>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

/** Every tag with its post count, most used first, then alphabetical. */
export function tagCounts(posts: PostLike[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** "remote-work" → "Remote work". */
export function tagLabel(tag: string): string {
  const words = tag.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A date as readers see it, e.g. "9 October 2026". Fixed to UTC so the build machine's time zone doesn't shift it. */
export function formatDate(date: Date, locale = 'en-GB'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
