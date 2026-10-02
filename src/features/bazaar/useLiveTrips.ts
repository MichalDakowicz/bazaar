import { useMemo } from 'react';

import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { liveTrips, openTripFor } from '@/lib/feed';
import type { Trip } from '@/types/bazaar';

/**
 * Who is out shopping right now — the trips nobody has ended.
 *
 * `others` is the ones that are somebody else's: those are the "Marta is
 * shopping" of the Lists tab, the live row of the Household and the badge on
 * the Household destination. A trip of your own is shown to you as a state of
 * the list you are standing in (Finish shopping), not as news.
 */
export function useLiveTrips() {
  const { trips, me } = useWorkspace();

  return useMemo(() => {
    const others = liveTrips(trips, me);
    const mine = trips.filter((trip) => trip.endedAt === null && trip.shopperId === me);
    const byList = new Map<string, Trip>(others.map((trip) => [trip.listId, trip]));
    return {
      others,
      mine,
      byList,
      count: others.length,
      /** The open trip on a list, whoever is on it. */
      openFor: (listId: string) => openTripFor(trips, listId),
    };
  }, [trips, me]);
}
