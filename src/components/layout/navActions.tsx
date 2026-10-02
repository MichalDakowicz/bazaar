import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';

import { isPushedRoute } from '@/components/layout/navDestinations';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useIsDesktop } from '@/hooks/useResponsive';
import { useBazaarUi } from '@/store/bazaarPrefs';

export type NavAction = {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge: number;
  /** The alert dot — an action whose effect is currently on. */
  active: boolean;
};

/**
 * The left island: the *one* thing the current screen wants you to do.
 *
 * In Bazaar that is the same verb everywhere — Add — because the whole app is a
 * list you are putting things on, and the design settled on it: Lists, Catalog,
 * History and Household all lead to the add screen, and the add screen and a
 * live trip lead back out. On a phone Add opens the add screen; in a browser
 * the planner's search field is already on the page, so Add moves the cursor
 * there instead.
 *
 * On a route pushed out of the tabs it is Back, which is why no pushed screen
 * in this app draws a back button of its own.
 */
export function useNavAction(pathname: string, activeTab: string | null): NavAction {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { t } = useLang();
  const requestSearch = useBazaarUi((state) => state.requestSearch);

  return useMemo(() => {
    if (activeTab === null || isPushedRoute(pathname)) {
      return {
        Icon: ArrowLeft,
        label: t.back,
        badge: 0,
        active: false,
        onPress: () => (router.canGoBack() ? router.back() : router.navigate('/')),
      };
    }

    return {
      Icon: Plus,
      label: t.add,
      badge: 0,
      active: false,
      onPress: () => {
        if (isDesktop) {
          router.navigate('/');
          requestSearch();
        } else {
          router.navigate('/add');
        }
      },
    };
  }, [activeTab, pathname, router, isDesktop, t, requestSearch]);
}
