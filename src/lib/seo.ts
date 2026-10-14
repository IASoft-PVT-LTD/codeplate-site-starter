// Page titles and absolute URLs for <Seo>. Plain functions, tested in tests/unit/seo.test.ts.

/** "Pricing" → "Pricing · Brightside"; the home page passes no title and gets "Brightside: <tagline>". */
export function pageTitle(siteName: string, tagline: string, title?: string): string {
  if (!title || title === siteName) return `${siteName}: ${tagline}`;
  return `${title} · ${siteName}`;
}

/** An absolute URL on the site, for canonical links and Open Graph. */
export function absoluteUrl(pathOrUrl: string, site: URL | string): string {
  return new URL(pathOrUrl, site).href;
}

/** Trims a description to what search results show (about 160 characters), on a word boundary. */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}
