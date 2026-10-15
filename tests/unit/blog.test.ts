// Blog and SEO helpers (src/lib/blog.ts, src/lib/seo.ts).
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { blogBase, blogUrl, formatDate, postUrl, tagUrl, isVisible, readingMinutes, sortByDate, tagCounts, tagLabel, type PostLike } from '../../src/lib/blog';
import { absoluteUrl, metaDescription, pageTitle } from '../../src/lib/seo';

const post = (id: string, date: string, tags: string[] = [], draft = false): PostLike => ({ id, data: { date: new Date(date), tags, draft } });

describe('blog helpers', () => {
  it('reading time counts words, at least one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes(Array(660).fill('word').join(' '))).toBe(3);
    // Code blocks and MDX tags don't count.
    expect(readingMinutes(`<Callout>${'x '.repeat(10)}</Callout>\n\`\`\`js\n${'code '.repeat(2000)}\n\`\`\``)).toBe(1);
  });

  it('hides drafts outside development', () => {
    const draft = post('a', '2026-01-01', [], true);
    expect(isVisible(draft, false)).toBe(false);
    expect(isVisible(draft, true)).toBe(true);
  });

  it('sorts newest first, stable on the same day', () => {
    const sorted = sortByDate([post('b', '2026-01-01'), post('c', '2026-03-01'), post('a', '2026-01-01')]);
    expect(sorted.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('counts tags, most used first', () => {
    const counts = tagCounts([post('a', '2026-01-01', ['writing', 'remote-work']), post('b', '2026-01-02', ['remote-work'])]);
    expect(counts).toEqual([{ tag: 'remote-work', count: 2 }, { tag: 'writing', count: 1 }]);
  });

  it('labels and dates read well', () => {
    expect(tagLabel('time-zones')).toBe('Time zones');
    expect(formatDate(new Date('2026-10-09'))).toBe('9 October 2026');
  });
});

describe('blog URLs', () => {
  it('are all built from blogBase', () => {
    expect(blogBase).toMatch(/^\/[a-z0-9-]+$/);
    expect(blogUrl()).toBe(`${blogBase}/`);
    expect(postUrl('hello')).toBe(`${blogBase}/hello/`);
    expect(tagUrl('news')).toBe(`${blogBase}/tags/news/`);
  });

  it('match the folder in src/pages/ (rename both together)', () => {
    expect(existsSync(`src/pages${blogBase}/index.astro`), `move src/pages/blog/ to src/pages${blogBase}/`).toBe(true);
  });
});

describe('seo helpers', () => {
  it('builds titles from the template', () => {
    expect(pageTitle('Brightside', 'Calm check-ins')).toBe('Brightside: Calm check-ins');
    expect(pageTitle('Brightside', 'Calm check-ins', 'Pricing')).toBe('Pricing · Brightside');
  });

  it('makes absolute URLs', () => {
    expect(absoluteUrl('/blog/', 'https://brightside.example')).toBe('https://brightside.example/blog/');
    expect(absoluteUrl('https://cdn.example/a.png', 'https://brightside.example')).toBe('https://cdn.example/a.png');
  });

  it('trims long descriptions on a word boundary', () => {
    const d = metaDescription('word '.repeat(60));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith('word…')).toBe(true);
    expect(metaDescription('Short.')).toBe('Short.');
  });
});
