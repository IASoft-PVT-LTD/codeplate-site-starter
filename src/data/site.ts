import { blogUrl } from '../lib/blog';

// The site's name, words, navigation and contact details. Pages and components
// read them from here, so a rename touches this file (and the content), not the
// layout code. The public URL is `site` in astro.config.mjs.

export const site = {
  name: 'Brightside',
  /** Short line used in titles and the footer. */
  tagline: 'Daily check-ins for teams that work apart',
  /** Default meta description (pages can pass their own). */
  description:
    'Brightside replaces the daily stand-up meeting with a two-minute written check-in. See what your team is working on, where they are stuck and what went well.',
  /** Shown on the contact page and in the mailto fallback of the forms. */
  email: 'hello@brightside.example',
  /** Social profiles shown in the footer. Remove the ones you don't have. */
  social: [
    { label: 'Mastodon', href: 'https://mastodon.example/@brightside' },
    { label: 'GitHub', href: 'https://github.com/brightside-example' },
  ],
  /** Header links, left to right. The last call-to-action button is `cta`. */
  nav: [
    { label: 'Pricing', href: '/pricing/' },
    { label: 'Blog', href: blogUrl() },
    { label: 'Changelog', href: '/changelog/' },
    { label: 'About', href: '/about/' },
  ],
  cta: { label: 'Join the waitlist', href: '/#waitlist' },
  /** Footer link columns. */
  footer: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/pricing/' },
        { label: 'Changelog', href: '/changelog/' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about/' },
        { label: 'Blog', href: blogUrl() },
        { label: 'Contact', href: '/contact/' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy/' },
        { label: 'Terms', href: '/terms/' },
      ],
    },
  ],
  /**
   * Where the waitlist and contact forms send to. '/api/subscribe' is the
   * server route in src/pages/api/subscribe.ts. Set it to null for a fully
   * static site with no server: the forms then become "email us" links to
   * `email` (docs/recipes/deploy.md, "Static only").
   */
  formEndpoint: '/api/subscribe' as string | null,
  /** The default Open Graph image (1200×630) in public/, for pages without their own. */
  ogImage: '/og/default.png',
  /** The language of the pages (<html lang>). */
  lang: 'en',
};

export type NavLink = { label: string; href: string };
