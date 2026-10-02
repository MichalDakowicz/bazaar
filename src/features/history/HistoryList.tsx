import { useMemo } from 'react';

import { CardList, type CardRow } from '@/components/media/CardList';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { HistorySectionTitle } from '@/features/history/HistorySectionTitle';
import { tripCardProps } from '@/features/history/tripCardProps';
import type { useHistoryScreen } from '@/features/history/useHistoryScreen';
import { readError } from '@/lib/utils';

/** History on a phone: one virtualized column, a heading row before each run of trips. */
export function HistoryList({ screen }: { screen: ReturnType<typeof useHistoryScreen> }) {
  const { t } = useLang();
  const { sections } = screen;

  const rows = useMemo<CardRow[]>(
    () =>
      sections.flatMap((section) => [
        { type: 'heading' as const, key: `h:${section.key}`, node: <HistorySectionTitle title={section.title} /> },
        ...section.trips.map((trip) => ({ type: 'card' as const, key: trip.id, props: tripCardProps(trip) })),
      ]),
    [sections],
  );

  if (screen.error) return <ErrorState message={readError(screen.error)} onRetry={screen.refetch} />;
  if (screen.loading) return <LoadingState />;

  return (
    <CardList
      rows={rows}
      onRefresh={screen.refetch}
      empty={screen.empty ? { title: t.historyEmptyTitle, body: t.historyEmptyBody } : undefined}
    />
  );
}
