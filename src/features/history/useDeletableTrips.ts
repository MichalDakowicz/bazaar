import { useMemo } from 'react';

import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { deletableTrips } from '@/lib/trips';
import type { Trip } from '@/types/bazaar';

/**
 * The finished trips this person may delete — the ones they shopped and every
 * one on a list they own. The server has the last word (`bazaar_delete_trips`
 * skips what it must); this keeps the screens from offering what it would.
 */
export function useDeletableTrips(): Trip[] {
  const { me, trips, lists, archived } = useWorkspace();

  const owned = useMemo(
    () => new Set([...lists, ...archived].filter((list) => list.ownerId === me).map((list) => list.id)),
    [lists, archived, me],
  );

  return useMemo(() => deletableTrips(trips, me, owned), [trips, me, owned]);
}
