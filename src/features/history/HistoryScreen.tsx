import { View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { ClearHistoryButton } from '@/features/history/ClearHistoryButton';
import { HistoryGrid } from '@/features/history/HistoryGrid';
import { HistoryList } from '@/features/history/HistoryList';
import { useHistoryScreen } from '@/features/history/useHistoryScreen';
import { useIsDesktop } from '@/hooks/useResponsive';

/**
 * History: every finished trip, newest first, each one tap from being put back
 * on a list. A column of cards on a phone, a two-column grid on a wide window.
 */
export function HistoryScreen() {
  const { t } = useLang();
  const isDesktop = useIsDesktop();
  const screen = useHistoryScreen();

  return (
    <ScreenFrame>
      <ScreenTop />
      {isDesktop ? (
        <HistoryGrid screen={screen} />
      ) : (
        <>
          <ScreenHeading
            title={t.history}
            right={screen.deletable > 0 ? <ClearHistoryButton onPress={screen.clearHistory} /> : undefined}
          />
          <View className="h-4" />
          <HistoryList screen={screen} />
        </>
      )}
    </ScreenFrame>
  );
}
