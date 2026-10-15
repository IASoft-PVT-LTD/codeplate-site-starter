// /rss.xml: the blog feed. Readers find it through the <link rel="alternate"> in <Seo>.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site as meta } from '../data/site';
import { postUrl } from '../lib/blog';
import { getPosts } from '../lib/posts';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  return rss({
    title: `${meta.name} blog`,
    description: meta.description,
    site: site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      categories: p.data.tags,
      link: postUrl(p.id),
    })),
    customData: `<language>${meta.lang}</language>`,
  });
};
