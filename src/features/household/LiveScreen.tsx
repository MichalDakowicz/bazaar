import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { ContentShell } from '@/components/layout/ContentShell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useHouseholdCopy } from '@/features/household/copy';
import { LiveBody } from '@/features/household/LiveBody';
import { useLiveTrip } from '@/features/household/useLiveTrip';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W, useGutter } from '@/hooks/useResponsive';
import { readError } from '@/lib/utils';

/**
 * Somebody's shopping trip, full page — the Household tab's live row opens it on
 * a phone. Pushed out of the tabs, so the frame mounts the nav and the island's
 * left plate is Back. On a wide window the trip sits beside the feed instead
 * (LivePanel), but a link to this route still works there.
 */
export function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const copy = useHouseholdCopy();
  const gutter = useGutter();
  const navBarSpace = useNavBarSpace();
  const live = useLiveTrip(id);

  return (
    <ScreenFrame pushed>
      <ScreenTop />
      {live.error ? (
        <ErrorState message={readError(live.error)} onRetry={live.refetch} />
      ) : live.loading ? (
        <LoadingState />
      ) : !live.model ? (
        <EmptyState title={copy.tripGoneTitle} body={copy.tripGoneBody} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: navBarSpace + 16 }} showsVerticalScrollIndicator={false}>
          <ContentShell maxWidth={MAX_W.text}>
            <View className={gutter}>
              <LiveBody model={live.model} onAdd={live.addFor} />
            </View>
          </ContentShell>
        </ScrollView>
      )}
    </ScreenFrame>
  );
}
