import { useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { tripTitle } from '@/features/history/historyModel';
import { useDeletableTrips } from '@/features/history/useDeletableTrips';
import { useReuseTrip } from '@/features/history/useReuseTrip';
import { historySections, tripMeta } from '@/lib/trips';
import { useBazaarUi } from '@/store/bazaarPrefs';

export type TripCardModel = {
  id: string;
  /** The list it was shopped from. */
  title: string;
  /** "Wed 24 · Lidl · Marta · 19 items · 2 skipped" */
  meta: string;
  reuse: () => void;
  /** Opens the trip: what it carried, Reuse, and Delete. */
  open: () => void;
};

export type HistorySectionModel = { key: string; title: string; trips: TripCardModel[] };

/**
 * History: the finished trips under their headings, each with a Reuse that
 * copies its items back onto a list. A trip still in progress is not history —
 * it lives in Household — so only trips with an end are listed.
 */
export function useHistoryScreen() {
  const { trips, list: listOf, nameOf, loading, error, refetch } = useWorkspace();
  const { t, appLang } = useLang();
  const reuse = useReuseTrip();
  const openSheet = useBazaarUi((state) => state.open);
  const deletable = useDeletableTrips();
  // The week's edge only moves on a Monday; a screen left open across one is a
  // pull-to-refresh away from being right.
  const [now] = useState(() => Date.now());

  const sections = useMemo<HistorySectionModel[]>(
    () =>
      historySections(trips, now, appLang).map((section) => ({
        key: section.key,
        title: section.title,
        trips: section.trips.map((trip) => ({
          id: trip.id,
          title: tripTitle(listOf(trip.listId), trip, appLang),
          meta: tripMeta(trip, nameOf(trip.shopperId) ?? t.you, appLang),
          reuse: () => void reuse(trip),
          open: () => openSheet({ kind: 'trip', tripId: trip.id }),
        })),
      })),
    [trips, listOf, nameOf, now, appLang, t, reuse, openSheet],
  );

  return {
    sections,
    empty: sections.length === 0,
    /** How many trips Delete history would take — 0 hides the control. */
    deletable: deletable.length,
    clearHistory: () => openSheet({ kind: 'clearHistory' }),
    loading,
    error,
    refetch,
  };
}
