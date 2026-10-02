import { useCallback, useMemo } from 'react';

import { useAdder } from '@/features/add/useAdder';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { findOnList } from '@/lib/listModel';

/**
 * Adding from the catalogue, and whether a product is already on the list it
 * would land on. `useAdder` already knows both; it hands its list's items back
 * as a fresh array on every render, which would make every row model below
 * rebuild on every render. This keys the same answer on the live items instead,
 * so it only changes when the list does.
 */
export function useCatalogAdder() {
  const { list, add } = useAdder();
  const { items: all } = useWorkspace();
  const listId = list?.id ?? null;

  const items = useMemo(() => all.filter((item) => item.listId === listId), [all, listId]);
  const have = useCallback(
    (product: { id?: string | null; en: string }) => findOnList(items, product) !== null,
    [items],
  );

  return { add, have };
}
