import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useHiddenUsuals, usePurchaseHistory } from '@/features/bazaar/useWorkspace';
import type { CategoryTile } from '@/features/catalog/CategoryGrid';
import { useCatalogAdder } from '@/features/catalog/useCatalogAdder';
import { CATEGORY_COUNTS } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import { CATEGORIES, categoryName } from '@/lib/categories';
import { productName } from '@/lib/search';
import { buildUsuals, starterUsuals, usualToItem } from '@/lib/usuals';
import { useBazaarUi } from '@/store/bazaarPrefs';

export type UsualTile = {
  key: string;
  cat: CategoryKey;
  name: string;
  /** "L · Free-range · 10" */
  detail: string;
  have: boolean;
  add: () => void;
  /** Hold to stop suggesting it. Absent on the starters: they are not your history. */
  hide?: () => void;
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
  const hidden = useHiddenUsuals();
  const openSheet = useBazaarUi((state) => state.open);
  const { add, have } = useCatalogAdder();
  // "Bought recently" is a 45-day window; the age of this session is noise.
  const [now] = useState(() => Date.now());

  const shelf = useMemo(() => {
    // Starters are for a household with no history. Once there are usuals, hiding
    // them all leaves an empty shelf — not the starters, which would put milk
    // straight back in front of someone who just said they never want it offered.
    if (buildUsuals(history, now).length > 0) {
      return { title: t.usuals, usuals: buildUsuals(history, now, 6, hidden), own: true };
    }
    return { title: t.popular, usuals: starterUsuals(), own: false };
  }, [history, hidden, now, t]);

  const tiles = useMemo<UsualTile[]>(
    () =>
      shelf.usuals.map((usual) => {
        const name = productName({ en: usual.nameEn, pl: usual.namePl }, productLang);
        return {
          key: usual.key,
          cat: usual.cat,
          name,
          detail: [usual.opt, usual.qty !== '1' ? usual.qty : ''].filter(Boolean).join(' · '),
          have: have({ id: usual.productId, en: usual.nameEn }),
          add: () => void add(usualToItem(usual)),
          hide: shelf.own ? () => openSheet({ kind: 'hideUsual', key: usual.key, name }) : undefined,
        };
      }),
    [shelf, productLang, have, add, openSheet],
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
    /** Only a shelf of your own usuals can be hidden from, so only it says how. */
    shelfHint: shelf.own,
    tiles,
    categories,
    openSearch: () => router.navigate('/add'),
  };
}
