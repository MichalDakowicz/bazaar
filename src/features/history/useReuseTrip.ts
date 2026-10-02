import { useCallback } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useAdder } from '@/features/add/useAdder';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { reuseTarget } from '@/features/history/historyModel';
import type { Trip } from '@/types/bazaar';

/**
 * Copy what a past trip bought back onto a list — its own, or the one you are
 * on when that one is gone. The Reuse on a History row and the one inside the
 * trip sheet are this same function, so they cannot offer different Undos.
 */
export function useReuseTrip() {
  const { list: listOf } = useWorkspace();
  const { t } = useLang();
  const { list: current } = useAdder();
  const writes = useBazaarWrites();
  const { say } = useToast();

  return useCallback(
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
}
