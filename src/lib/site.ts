import { getCollection } from 'astro:content';

/** Site settings singleton (nav, footer, contact, locations). */
export async function settings() {
  const all = await getCollection('settings');
  if (!all.length) throw new Error('src/content/settings/site.json missing');
  return all[0].data;
}

/** One page's content object (home | insurance | retail | work | about). */
export async function page(id: string) {
  const all = await getCollection('pages');
  const e = all.find((x) => x.id === id || x.id === `${id}` || x.id.replace(/\.json$/, '') === id);
  if (!e) throw new Error(`src/content/pages/${id}.json missing (have: ${all.map((x) => x.id).join(', ')})`);
  return e.data;
}

/** Products, ordered. */
export async function products() {
  return (await getCollection('products')).sort((a, b) => a.data.order - b.data.order).map((e) => e.data);
}

export async function product(slug: string) {
  return (await getCollection('products')).find((e) => e.data.slug === slug)?.data;
}

/** Case studies, ordered. */
export async function cases() {
  return (await getCollection('cases')).sort((a, b) => a.data.order - b.data.order).map((e) => e.data);
}

/** Render a lightweight *italic* span in otherwise-plain copy (used in headings). */
export function emphasize(s: string): string {
  return s.replace(/\*([^*]+)\*/g, '<span style="font-style:italic">$1</span>');
}

/** Split a copy string on literal \n for <br>-joined headings. */
export function lines(s: string): string[] {
  return s.split('\n');
}
