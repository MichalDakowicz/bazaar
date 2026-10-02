import { useMemo } from 'react';
import { View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { CardList } from '@/components/media/CardList';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { AddPersonButton } from '@/features/household/AddPersonButton';
import { householdRows } from '@/features/household/householdRows';
import { LivePanel } from '@/features/household/LivePanel';
import { useHouseholdScreen } from '@/features/household/useHouseholdScreen';
import { MAX_W, useIsDesktop } from '@/hooks/useResponsive';
import { readError } from '@/lib/utils';

/**
 * The Household tab: the people on your lists, who is out shopping right now,
 * and what has happened lately. On a phone one column — a live row opens the
 * trip. On a wide window the feed keeps the left and the trip being watched
 * stands on the right, which is what a desk has the room for.
 */
export function HouseholdScreen() {
  const { t } = useLang();
  const isDesktop = useIsDesktop();
  const screen = useHouseholdScreen();

  const rows = useMemo(() => householdRows(screen.sections, t.live, !isDesktop), [screen.sections, t.live, isDesktop]);

  const feed = (
    <CardList
      rows={rows}
      onRefresh={screen.refetch}
      empty={
        screen.isEmpty
          ? {
              title: t.houseEmptyTitle,
              body: t.houseEmptyBody,
              action: { label: t.addPerson, onPress: screen.addPerson },
            }
          : undefined
      }
    />
  );

  let body = feed;
  if (screen.error) {
    body = <ErrorState message={readError(screen.error)} onRetry={screen.refetch} />;
  } else if (screen.loading) {
    body = <LoadingState />;
  } else if (isDesktop && !screen.isEmpty) {
    body = (
      <View className="flex-1 flex-row">
        <View className="flex-1">{feed}</View>
        <View className="flex-1">
          <LivePanel tripId={screen.selectedTripId} />
        </View>
      </View>
    );
  }

  return (
    <ScreenFrame>
      <ScreenTop />
      <ContentShell maxWidth={MAX_W.detail} fill>
        <ScreenHeading title={t.household} meta={screen.meta} right={<AddPersonButton onPress={screen.addPerson} />} />
        {isDesktop && <View className="h-2" />}
        {body}
      </ContentShell>
    </ScreenFrame>
  );
}
