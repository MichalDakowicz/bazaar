import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { CategoryScreen } from '@/features/catalog/CategoryScreen';
import { useIsDesktop } from '@/hooks/useResponsive';
import { isCategory } from '@/lib/categories';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

/**
 * One catalogue section, on a phone. On a wide window the planner already shows
 * a section's grid, so a link to one selects it there.
 */
export default function CategoryRoute() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const isDesktop = useIsDesktop();
  const setCatalogCat = useBazaarPrefs((state) => state.setCatalogCat);

  useEffect(() => {
    if (isDesktop && isCategory(key)) setCatalogCat(key);
  }, [isDesktop, key, setCatalogCat]);

  if (isDesktop) return <Redirect href="/" />;
  return <CategoryScreen />;
}
