import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import * as api from '@/features/bazaar/bazaarApi';
import { bazaarKeys } from '@/features/bazaar/useWorkspace';
import { readError } from '@/lib/utils';
import type { ListItem, NewItem } from '@/types/bazaar';

/**
 * Every write the screens make, with the cache kept right.
 *
 * A write that fails says so in a toast and resolves to `null` — a screen never
 * has to wrap a tap in try/catch, and never shows a success it did not get.
 * Ticking an item is optimistic (it is the thing done one-handed in a shop
 * aisle, and it must answer the thumb); the rest invalidate and let the
 * refetch, which is the truth, redraw.
 */
export function useBazaarWrites() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { say } = useToast();
  const uid = user?.id;

  const touch = useCallback(
    (...scopes: ('lists' | 'items' | 'trips' | 'activity' | 'history' | 'people')[]) => {
      for (const scope of scopes) {
        void client.invalidateQueries({ queryKey: ['bazaar', scope] });
      }
    },
    [client],
  );

  const attempt = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T | null> => {
      try {
        return await work();
      } catch (error) {
        say(readError(error));
        return null;
      }
    },
    [say],
  );

  return useMemo(() => {
    /** Flip `checkedAt` in every cached copy of the live items, before the server has answered. */
    const patchChecked = (itemId: string, checked: boolean) => {
      client.setQueriesData<ListItem[]>({ queryKey: bazaarKeys.items(uid) }, (current) =>
        current?.map((item) =>
          item.id === itemId
            ? { ...item, checkedAt: checked ? new Date().toISOString() : null, checkedBy: checked ? (uid ?? null) : null }
            : item,
        ),
      );
    };

    const setChecked = async (item: ListItem, checked: boolean) => {
      patchChecked(item.id, checked);
      const result = await attempt(async () => {
        await api.setItemChecked(item.id, checked);
        return true;
      });
      // The refetch is the truth either way: it confirms the tick, or quietly
      // takes back one the server refused.
      touch('items');
      return result;
    };

    return {
      // lists
      createList: (draft: api.ListDraft, position: number) =>
        attempt(async () => {
          const id = await api.insertList(uid!, draft, position);
          touch('lists');
          return id;
        }),
      updateList: (listId: string, patch: Partial<api.ListDraft>) =>
        attempt(async () => {
          await api.patchList(listId, patch);
          touch('lists');
          return true;
        }),
      archiveList: (listId: string, archived: boolean) =>
        attempt(async () => {
          await api.patchList(listId, { archived });
          touch('lists');
          return true;
        }),
      removeList: (listId: string) =>
        attempt(async () => {
          await api.deleteList(listId);
          touch('lists', 'items', 'trips', 'activity');
          return true;
        }),
      leaveList: (listId: string) =>
        attempt(async () => {
          await api.leaveList(listId, uid!);
          touch('lists', 'items', 'trips', 'activity');
          return true;
        }),

      // items
      addItems: (listId: string, items: NewItem[]) =>
        attempt(async () => {
          const ids = await api.insertItems(listId, items);
          touch('items', 'activity', 'history');
          return ids;
        }),
      removeItems: (ids: string[]) =>
        attempt(async () => {
          await api.deleteItems(ids);
          touch('items', 'activity');
          return true;
        }),
      changeQty: (itemId: string, qty: string) =>
        attempt(async () => {
          await api.patchItem(itemId, { qty });
          touch('items');
          return true;
        }),
      check: (item: ListItem) => setChecked(item, true),
      uncheck: (item: ListItem) => setChecked(item, false),

      // trips
      startTrip: (listId: string, store: string) =>
        attempt(async () => {
          const id = await api.startTrip(listId, uid!, store);
          touch('trips', 'activity');
          return id;
        }),
      finishTrip: (tripId: string) =>
        attempt(async () => {
          await api.finishTrip(tripId);
          touch('trips', 'items', 'activity', 'history');
          return true;
        }),
      reuseTrip: (tripId: string, listId: string) =>
        attempt(async () => {
          const ids = await api.reuseTrip(tripId, listId);
          touch('items', 'activity', 'history');
          return ids;
        }),

      // people
      addMember: (listId: string, userId: string) =>
        attempt(async () => {
          await api.addMember(listId, userId, uid!);
          touch('lists', 'activity', 'people');
          return true;
        }),
      removeMember: (listId: string, userId: string) =>
        attempt(async () => {
          await api.removeMember(listId, userId);
          touch('lists', 'activity');
          return true;
        }),
    };
  }, [attempt, client, touch, uid]);
}

export type BazaarWrites = ReturnType<typeof useBazaarWrites>;
