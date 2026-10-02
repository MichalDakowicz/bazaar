import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useLiveTrips } from '@/features/bazaar/useLiveTrips';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { itemName, viewList } from '@/lib/listModel';
import { useBazaarPrefs, useBazaarUi } from '@/store/bazaarPrefs';
import type { ListItem } from '@/types/bazaar';

/**
 * One list, ready to draw: its sections, its basket, its progress, and the
 * state of the trip (nobody, you, or somebody else) that decides which button
 * the page offers. Ticking says what it did and offers the undo.
 */
export function useListScreen(listId: string | undefined) {
  const workspace = useWorkspace();
  const { t, productLang } = useLang();
  const { settings } = useBazaarSettings();
  const writes = useBazaarWrites();
  const { say } = useToast();
  const haptics = useHaptics();
  const { openFor } = useLiveTrips();
  const router = useRouter();
  const open = useBazaarUi((state) => state.open);
  const setList = useBazaarPrefs((state) => state.setList);

  const list = workspace.list(listId);
  const items = workspace.itemsOf(listId);
  const view = useMemo(() => viewList(items, productLang), [items, productLang]);
  const trip = listId ? openFor(listId) : null;
  const shopper: 'nobody' | 'me' | 'other' = trip ? (trip.shopperId === workspace.me ? 'me' : 'other') : 'nobody';
  const shopperName = trip && shopper === 'other' ? (workspace.nameOf(trip.shopperId) ?? t.someone) : null;

  const check = useCallback(
    async (item: ListItem) => {
      const done = await writes.check(item);
      if (done) {
        haptics.tick();
        say(`${itemName(item, productLang)} · ${t.inBasket}`, { label: t.undo, onPress: () => void writes.uncheck(item) });
      }
    },
    [writes, say, haptics, productLang, t],
  );

  const uncheck = useCallback((item: ListItem) => void writes.uncheck(item), [writes]);

  const remove = useCallback(
    async (item: ListItem) => {
      const done = await writes.removeItems([item.id]);
      if (done) {
        say(`${itemName(item, productLang)} · ${t.removed}`, {
          label: t.undo,
          onPress: () => {
            const { id: _id, ...rest } = item;
            void writes.addItems(item.listId, [
              { productId: rest.productId, cat: rest.cat, nameEn: rest.nameEn, namePl: rest.namePl, opt: rest.opt, qty: rest.qty },
            ]);
          },
        });
      }
    },
    [writes, say, productLang, t],
  );

  return {
    list,
    view,
    loading: workspace.loading,
    error: workspace.error,
    refetch: workspace.refetch,
    swipe: settings.swipeToCheck,
    shopper,
    shopperName,
    tripId: trip?.id ?? null,
    check,
    uncheck,
    remove,
    startShopping: async () => {
      if (list) await writes.startTrip(list.id, list.store);
    },
    finishShopping: () => {
      if (list && trip && shopper === 'me') open({ kind: 'finish', listId: list.id, tripId: trip.id });
    },
    watchLive: () => {
      if (trip) router.navigate({ pathname: '/live/[id]', params: { id: trip.id } });
    },
    addHere: () => {
      if (list) setList(list.id);
      router.navigate('/add');
    },
    edit: () => {
      if (list) open({ kind: 'editList', listId: list.id });
    },
  };
}
