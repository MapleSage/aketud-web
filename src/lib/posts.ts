import { getCollection, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';

export type Post = CollectionEntry<'blog'> & { minutes: number };

export const TAGS = [
  'Underwriting',
  'Claims',
  'Policy & Ledger',
  'B2B Retail',
  'Trade Finance',
  'Engineering',
] as const;

/** URL slug for a tag, e.g. "Policy & Ledger" -> "policy-ledger". */
export const tagSlug = (t: string) =>
  t.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** [slug, tag] pairs for building topic routes. */
export const TAG_SLUGS = TAGS.map((t) => [tagSlug(t), t] as const);

const isProd = import.meta.env.PROD;

/** All publishable posts, newest first, enriched with reading time. */
export async function allPosts(): Promise<Post[]> {
  const raw = await getCollection('blog', ({ data }) => !(isProd && data.draft));
  return raw
    .map((p) => ({
      ...p,
      minutes: p.data.minutes ?? Math.max(1, Math.round(readingTime(p.body ?? '').minutes)),
    }))
    .sort((a, b) => +b.data.pubDate - +a.data.pubDate);
}

export async function leadPost(posts: Post[]): Promise<Post | undefined> {
  return posts.find((p) => p.data.lead) ?? posts[0];
}
