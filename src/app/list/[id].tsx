import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ListScreen } from '@/features/lists/ListScreen';
import { useIsDesktop } from '@/hooks/useResponsive';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

/**
 * One list's page, on a phone. On a wide window the planner *is* the list page,
 * so a link to one selects it there.
 */
export default function ListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDesktop = useIsDesktop();
  const setList = useBazaarPrefs((state) => state.setList);

  useEffect(() => {
    if (isDesktop && id) setList(id);
  }, [isDesktop, id, setList]);

  if (isDesktop) return <Redirect href="/" />;
  return <ListScreen />;
}
