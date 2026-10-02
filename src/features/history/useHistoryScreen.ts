import { useCallback, useMemo, useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useAdder } from '@/features/add/useAdder';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { reuseTarget, tripTitle } from '@/features/history/historyModel';
import { historySections, tripMeta } from '@/lib/trips';
import type { Trip } from '@/types/bazaar';

export type TripCardModel = {
  id: string;
  /** The list it was shopped from. */
  title: string;
  /** "Wed 24 · Lidl · Marta · 19 items · 2 skipped" */
  meta: string;
  reuse: () => void;
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
  const { list: current } = useAdder();
  const writes = useBazaarWrites();
  const { say } = useToast();
  // The week's edge only moves on a Monday; a screen left open across one is a
  // pull-to-refresh away from being right.
  const [now] = useState(() => Date.now());

  const reuse = useCallback(
    async (trip: Trip) => {
      const target = reuseTarget(listOf(trip.listId), current);
      if (!target) {
        say(t.noListToAdd);
        return;
      }
      const ids = await writes.reuseTrip(trip.id, target.id);
      if (!ids) return;
      // Undo only when there is something to undo.
      say(
        t.reused(ids.length, target.name),
        ids.length > 0 ? { label: t.undo, onPress: () => void writes.removeItems(ids) } : undefined,
      );
    },
    [listOf, current, writes, say, t],
  );

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
        })),
      })),
    [trips, listOf, nameOf, now, appLang, t, reuse],
  );

  return {
    sections,
    empty: sections.length === 0,
    loading,
    error,
    refetch,
  };
}
