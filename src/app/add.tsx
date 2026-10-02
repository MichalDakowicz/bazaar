import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { AddScreen } from '@/features/add/AddScreen';
import { useIsDesktop } from '@/hooks/useResponsive';
import { useBazaarUi } from '@/store/bazaarPrefs';

/**
 * Add, pushed from the nav's left plate on a phone. A wide window has no such
 * screen — the planner's search field is already on the page — so landing here
 * there (a bookmark, a shared link) goes to the planner and asks for the cursor.
 */
export default function AddRoute() {
  const isDesktop = useIsDesktop();
  const requestSearch = useBazaarUi((state) => state.requestSearch);

  useEffect(() => {
    if (isDesktop) requestSearch();
  }, [isDesktop, requestSearch]);

  if (isDesktop) return <Redirect href="/" />;
  return <AddScreen />;
}
