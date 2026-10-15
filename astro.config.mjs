// Astro configuration. Astro 7 documents every option in
// node_modules/astro/dist/types/public/config.d.ts (read it before adding one).
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // The public address of the site. Canonical links, the sitemap, RSS and
  // Open Graph URLs are built from it. Change it before going live
  // (docs/recipes/custom-domain-and-seo-checklist.md).
  site: 'https://brightside.example',

  // Every page is prerendered to static HTML. Only routes that say
  // `export const prerender = false` (src/pages/api/subscribe.ts) run on a server.
  output: 'static',

  // The adapter runs those server routes. Node works for `astro dev`, `astro preview`
  // (the checks) and any Node host. docs/recipes/deploy.md swaps it for Cloudflare,
  // Vercel or Netlify, or removes it for a fully static site.
  adapter: node({ mode: 'standalone' }),

  integrations: [
    mdx(),
    // sitemap-index.xml lists every page except those filtered out here
    // (pages with `noindex` belong in this list too).
    sitemap({ filter: (page) => !page.endsWith('/thanks/') }),
  ],

  markdown: {
    // Code blocks in posts follow the light/dark theme through CSS light-dark().
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: 'light-dark()' },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Environment variables the server reads, validated at startup. Each one is
  // documented in .env.example (the checks fail if one is missing there).
  env: {
    schema: {
      FORM_PROVIDER: envField.enum({ context: 'server', access: 'public', values: ['console', 'webhook'], default: 'console' }),
      FORM_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

  // The dev toolbar would show up in screenshots (scripts/shots.mjs turns it off).
  devToolbar: { enabled: process.env.CODEPLATE_SHOTS !== '1' },
});
