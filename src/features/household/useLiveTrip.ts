import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { itemName, justPicked, viewList } from '@/lib/listModel';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

export type PickedRow = { id: string; name: string; qty: string };

export type LiveModel = {
  tripId: string;
  /** The trip has been finished: no progress to show, only the fact of it. */
  ended: boolean;
  chip: string;
  title: string;
  listName: string;
  percent: number;
  caption: string;
  picked: PickedRow[];
  addLabel: string;
};

/**
 * One shopping trip as somebody watching it sees it: who, where, how far through
 * the list they are, and the last few things they put in the basket.
 *
 * The progress is the *list's* — the trip is only the fact that somebody is out
 * with it — so it reads the same cache as the list page and moves as they tick.
 * Once the trip is finished the basket is History's, and there is nothing left to
 * watch but the fact that it ended.
 */
export function useLiveTrip(tripId: string | undefined) {
  const workspace = useWorkspace();
  const { t, productLang } = useLang();
  const router = useRouter();
  const setList = useBazaarPrefs((state) => state.setList);

  const { trips, me, nameOf } = workspace;
  const trip = tripId ? (trips.find((candidate) => candidate.id === tripId) ?? null) : null;
  const list = workspace.list(trip?.listId);
  const items = workspace.itemsOf(trip?.listId);
  const mine = !!trip && trip.shopperId === me;
  const name = trip ? (nameOf(trip.shopperId) ?? t.someone) : '';

  const model = useMemo<LiveModel | null>(() => {
    if (!trip) return null;
    const ended = trip.endedAt !== null;
    const view = viewList(items, productLang);
    const listName = list?.name ?? '';
    return {
      tripId: trip.id,
      ended,
      chip: ended ? t.tripEnded : t.liveStore(trip.store || list?.store || ''),
      title: ended ? t.finishedTrip(mine ? t.you_ : name, trip.itemCount) : mine ? t.youShopping : t.isShopping(name),
      listName,
      percent: view.percent,
      caption: t.basketOf(view.done, view.total),
      picked: ended
        ? []
        : justPicked(items, 4).map((item) => ({ id: item.id, name: itemName(item, productLang), qty: item.qty })),
      addLabel: mine ? `${t.addTo} ${listName}`.trim() : t.addFor(name),
    };
  }, [trip, list, items, productLang, t, mine, name]);

  const addFor = useCallback(() => {
    if (!trip) return;
    setList(trip.listId);
    router.navigate('/add');
  }, [trip, setList, router]);

  return { model, addFor, loading: workspace.loading, error: workspace.error, refetch: workspace.refetch };
}
