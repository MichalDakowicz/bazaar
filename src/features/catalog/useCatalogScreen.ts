import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePurchaseHistory } from '@/features/bazaar/useWorkspace';
import type { CategoryTile } from '@/features/catalog/CategoryGrid';
import { useCatalogAdder } from '@/features/catalog/useCatalogAdder';
import { CATEGORY_COUNTS } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import { CATEGORIES, categoryName } from '@/lib/categories';
import { productName } from '@/lib/search';
import { buildUsuals, starterUsuals, usualToItem } from '@/lib/usuals';

export type UsualTile = {
  key: string;
  cat: CategoryKey;
  name: string;
  /** "L · Free-range · 10" */
  detail: string;
  have: boolean;
  add: () => void;
};

/**
 * The Catalog tab on a phone: what you keep buying, one tap from the list, and
 * the ten sections to browse. A household with no history yet is offered a few
 * starters under a different heading, so the shelf is never an empty promise.
 */
export function useCatalogScreen() {
  const { t, productLang } = useLang();
  const router = useRouter();
  const history = usePurchaseHistory();
  const { add, have } = useCatalogAdder();
  // "Bought recently" is a 45-day window; the age of this session is noise.
  const [now] = useState(() => Date.now());

  const shelf = useMemo(() => {
    const own = buildUsuals(history, now);
    return own.length > 0 ? { title: t.usuals, usuals: own } : { title: t.popular, usuals: starterUsuals() };
  }, [history, now, t]);

  const tiles = useMemo<UsualTile[]>(
    () =>
      shelf.usuals.map((usual) => ({
        key: usual.key,
        cat: usual.cat,
        name: productName({ en: usual.nameEn, pl: usual.namePl }, productLang),
        detail: [usual.opt, usual.qty !== '1' ? usual.qty : ''].filter(Boolean).join(' · '),
        have: have({ id: usual.productId, en: usual.nameEn }),
        add: () => void add(usualToItem(usual)),
      })),
    [shelf, productLang, have, add],
  );

  const categories = useMemo<CategoryTile[]>(
    () =>
      CATEGORIES.map(({ key }) => {
        const count = CATEGORY_COUNTS[key] ?? 0;
        return {
          key,
          name: categoryName(key, productLang),
          label: t.products(count),
          count,
          open: () => router.navigate({ pathname: '/category/[key]', params: { key } }),
        };
      }),
    [productLang, t, router],
  );

  return {
    shelfTitle: shelf.title,
    tiles,
    categories,
    openSearch: () => router.navigate('/add'),
  };
}
