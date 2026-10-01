import { BAKERY } from './bakery';
import { DAIRY } from './dairy';
import { DRINKS } from './drinks';
import { FISH } from './fish';
import { FROZEN } from './frozen';
import { HOME } from './home';
import { MEAT } from './meat';
import { PANTRY } from './pantry';
import { PRODUCE } from './produce';
import { SNACKS } from './snacks';
import { fold, words } from '../text';
import type { CatalogEntry, CategoryKey } from './types';

export { CATEGORY_ORDER } from './types';
export type { CategoryKey } from './types';

/**
 * A catalogue product, with the folded words search compares against already
 * split out — the catalogue is a few hundred lines and is searched on every
 * keystroke, so the folding is paid once, here, at import.
 */
export type Product = {
  /** Slug of the English name. Stored on every item, so it is a contract. */
  id: string;
  cat: CategoryKey;
  en: string;
  pl: string;
  aliases: string;
  /** Folded, split words per name — what `lib/search` matches tokens against. */
  w: { en: readonly string[]; pl: readonly string[]; alias: readonly string[] };
};

/** `Sour cream` -> `sour-cream`. Diacritics folded, so a Polish-only name still slugs. */
export function slugify(name: string): string {
  return fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const SECTIONS: readonly (readonly [CategoryKey, readonly CatalogEntry[]])[] = [
  ['produce', PRODUCE],
  ['bakery', BAKERY],
  ['dairy', DAIRY],
  ['meat', MEAT],
  ['fish', FISH],
  ['pantry', PANTRY],
  ['frozen', FROZEN],
  ['drinks', DRINKS],
  ['snacks', SNACKS],
  ['home', HOME],
];

function build(): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const [cat, entries] of SECTIONS) {
    for (const [en, pl, aliases = ''] of entries) {
      const id = slugify(en);
      // The first writer of an id keeps it; a duplicate English name is a data
      // bug that data.test.ts catches, never something to render twice.
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, cat, en, pl, aliases, w: { en: words(en), pl: words(pl), alias: words(aliases) } });
    }
  }
  return out;
}

/** Every product, in section order and then in the order the data files list them. */
export const CATALOG: readonly Product[] = build();

const BY_ID = new Map(CATALOG.map((product) => [product.id, product]));

export function productById(id: string | null | undefined): Product | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}

export function productsIn(cat: CategoryKey): readonly Product[] {
  return CATALOG.filter((product) => product.cat === cat);
}

/** How many products a section holds — the figure printed beside it. */
export const CATEGORY_COUNTS: Readonly<Record<CategoryKey, number>> = CATALOG.reduce(
  (counts, product) => ({ ...counts, [product.cat]: (counts[product.cat] ?? 0) + 1 }),
  {} as Record<CategoryKey, number>,
);
