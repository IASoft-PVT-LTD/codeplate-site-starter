// The data files in src/data/: plans make sense, and every internal link in
// the navigation, footer and calls to action points to a page that exists.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cta, features, hero, pricingTeaser } from '../../src/data/home';
import { plans } from '../../src/data/pricing';
import { site } from '../../src/data/site';

/** True if a site path like "/pricing/" or "/#waitlist" has a page in src/pages/ or src/content/pages/. */
function pageExists(href: string): boolean {
  const path = href.split('#')[0]!.replace(/^\/|\/$/g, '');
  if (path === '') return true; // the home page (and its #anchors)
  return [`src/pages/${path}.astro`, `src/pages/${path}/index.astro`, `src/pages/${path}.md`, `src/pages/${path}.ts`, `src/content/pages/${path}.md`].some((f) => existsSync(f));
}

describe('site data', () => {
  const links = [
    ...site.nav,
    site.cta,
    ...site.footer.flatMap((c) => c.links),
    hero.primary,
    hero.secondary,
    pricingTeaser.link,
    ...plans.map((p) => p.cta),
  ].filter((l) => l.href.startsWith('/'));

  it.each(links.map((l) => [l.label, l.href]))('"%s" links to a page that exists (%s)', (_label, href) => {
    expect(pageExists(href), `${href}: no page in src/pages/ or src/content/pages/`).toBe(true);
  });

  it('has exactly one highlighted plan', () => {
    expect(plans.filter((p) => p.highlight)).toHaveLength(1);
  });

  it('has no empty text', () => {
    for (const f of features) expect(f.title && f.text).toBeTruthy();
    expect(cta.title && cta.text).toBeTruthy();
    expect(site.name && site.tagline && site.description).toBeTruthy();
  });

  it('keeps the meta description short enough for search results', () => {
    expect(site.description.length).toBeLessThanOrEqual(200);
  });
});
