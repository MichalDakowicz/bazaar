import { CATALOG, productsIn, type Product } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import type { Lang } from '@/lib/categories';
import { resolveOptions } from '@/lib/options';
import { optionSetFor } from '@/lib/optionSets';
import { queryTokens, searchProducts } from '@/lib/search';
import { productToItem } from '@/lib/usuals';
import type { NewItem } from '@/types/bazaar';

/**
 * What one catalogue section shows.
 *
 * With nothing typed it is the section in the order a shop walks it. With
 * something typed it is the same search the Add screen runs — both languages,
 * Polish endings forgiven — narrowed to this section and ranked by how well
 * each product answered.
 */
export function productsFor(cat: CategoryKey, query: string, lang: Lang): readonly Product[] {
  if (queryTokens(query).length === 0) return productsIn(cat);
  // Ask for every match, not the Add screen's first sixty: the cut would be made
  // across all ten sections before this one's share of it was known.
  return searchProducts(query, lang, CATALOG.length)
    .filter((match) => match.product.cat === cat)
    .map((match) => match.product);
}

/**
 * What a tap on a catalogue row adds. A product that asks questions (eggs: which
 * size?) is added the way "Just add" would on its sensible defaults — the
 * picker lives on the Add screen — and a plain one is just itself.
 */
export function defaultItem(product: Product): NewItem {
  const set = optionSetFor(product.id);
  if (!set) return productToItem(product);
  const resolved = resolveOptions(set, '');
  return productToItem(product, resolved.opt, resolved.qty);
}
