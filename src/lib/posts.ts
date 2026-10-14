// The blog collection, ready to render: published posts only (drafts too in
// `astro dev`), newest first.
import { getCollection, type CollectionEntry } from 'astro:content';
import { isVisible, sortByDate } from './blog';

export type Post = CollectionEntry<'blog'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (p) => isVisible(p, import.meta.env.DEV));
  return sortByDate(posts);
}
