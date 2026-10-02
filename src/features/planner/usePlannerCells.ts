import { useMemo } from 'react';

import type { ProductSearch } from '@/features/add/useProductSearch';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePlannerCopy } from '@/features/planner/copy';
import { productsIn, type Product } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/categories';
import { buildCell, type NoteWords, type PlannerCell } from '@/lib/planner';
import type { ListItem } from '@/types/bazaar';

/**
 * What the grid draws: the search's matches while there is a search, otherwise
 * the first `shown` products of the section chosen in the sidebar. `section` is
 * the whole section, so the heading can count what the grid has not drawn yet.
 */
export function usePlannerCells({
  search,
  catalogCat,
  shown,
  listName,
  onList,
}: {
  search: ProductSearch;
  catalogCat: CategoryKey;
  shown: number;
  listName: string;
  onList: (product: Pick<Product, 'id' | 'en'>) => ListItem | null;
}) {
  const { t, productLang } = useLang();
  const copy = usePlannerCopy();

  // A search with matches, or one that found nothing: either way the grid is the search's.
  const searching = search.matches.length > 0 || search.noResults;
  const section = useMemo(() => productsIn(catalogCat), [catalogCat]);
  const words = useMemo<NoteWords>(() => ({ onList: copy.onListNote, matched: t.matched }), [copy, t]);

  const cells = useMemo<PlannerCell[]>(() => {
    const context = { lang: productLang, listName, words };
    if (searching) {
      return search.matches.map((match) =>
        buildCell(match.product, { ...context, searching: true, via: match.via, here: onList(match.product) }),
      );
    }
    return section
      .slice(0, shown)
      .map((product) => buildCell(product, { ...context, searching: false, via: null, here: onList(product) }));
  }, [searching, search.matches, section, shown, productLang, listName, words, onList]);

  return { searching, section, cells };
}
