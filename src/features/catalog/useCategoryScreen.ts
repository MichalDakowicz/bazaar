import { useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { defaultItem, productsFor } from '@/features/catalog/categoryProducts';
import { useCatalogAdder } from '@/features/catalog/useCatalogAdder';
import { CATEGORY_COUNTS } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import { categoryAlt, categoryName } from '@/lib/categories';
import { optionSetFor } from '@/lib/optionSets';
import { productAlt, productName } from '@/lib/search';

export type ProductRowModel = {
  id: string;
  cat: CategoryKey;
  name: string;
  /** The other language's name, and what the product asks about ("grain · type"). */
  detail: string;
  have: boolean;
  add: () => void;
};

/**
 * One catalogue section: its products, narrowed by the search above them, each
 * with the one tap that puts it on the list. Products that ask questions are
 * added on their defaults here; the full picker is on the Add screen.
 */
export function useCategoryScreen(cat: CategoryKey) {
  const { t, productLang } = useLang();
  const { add, have } = useCatalogAdder();
  const [query, setQuery] = useState('');

  const products = useMemo(() => productsFor(cat, query, productLang), [cat, query, productLang]);

  const rows = useMemo<ProductRowModel[]>(
    () =>
      products.map((product) => {
        const onList = have(product);
        return {
          id: product.id,
          cat: product.cat,
          name: productName(product, productLang),
          detail: [productAlt(product, productLang), onList ? t.onTheList : optionSetFor(product.id)?.hint]
            .filter(Boolean)
            .join(' · '),
          have: onList,
          add: () => void add(defaultItem(product)),
        };
      }),
    [products, productLang, have, add, t],
  );

  const searching = query.trim() !== '';
  return {
    title: categoryName(cat, productLang),
    meta: [categoryAlt(cat, productLang), t.products(searching ? rows.length : (CATEGORY_COUNTS[cat] ?? 0))].join(' · '),
    query,
    setQuery,
    rows,
  };
}
