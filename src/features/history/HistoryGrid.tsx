import { ScrollView, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { BazaarCard } from '@/components/media/BazaarCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { HistorySectionTitle } from '@/features/history/HistorySectionTitle';
import { tripCardProps } from '@/features/history/tripCardProps';
import type { useHistoryScreen } from '@/features/history/useHistoryScreen';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W } from '@/hooks/useResponsive';
import { readError } from '@/lib/utils';

/**
 * History on a wide window: the same trips in two columns under the same
 * headings. A plain scroll view — a household's history is a few dozen cards,
 * and a grid is the one thing FlashList's single column cannot do.
 */
export function HistoryGrid({ screen }: { screen: ReturnType<typeof useHistoryScreen> }) {
  const { t } = useLang();
  const navBarSpace = useNavBarSpace();

  let body;
  if (screen.error) body = <ErrorState message={readError(screen.error)} onRetry={screen.refetch} />;
  else if (screen.loading) body = <LoadingState />;
  else if (screen.empty) body = <EmptyState title={t.historyEmptyTitle} body={t.historyEmptyBody} />;
  else {
    body = screen.sections.map((section) => (
      <View key={section.key} className="px-8 pt-7">
        <HistorySectionTitle title={section.title} />
        <View className="-mx-1 mt-2.5 flex-row flex-wrap">
          {section.trips.map((trip) => (
            <View key={trip.id} className="w-1/2 p-1">
              <BazaarCard {...tripCardProps(trip)} />
            </View>
          ))}
        </View>
      </View>
    ));
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: navBarSpace }}>
      <ContentShell maxWidth={MAX_W.detail}>
        <ScreenHeading title={t.history} />
        {body}
      </ContentShell>
    </ScrollView>
  );
}
