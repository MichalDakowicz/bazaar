import type { BazaarList, BazaarSettings, Trip } from '@/types/bazaar';

type ListMode = Pick<BazaarSettings, 'generalList' | 'generalListId'>;

export function isGeneralList(settings: ListMode, listId: string | undefined): boolean {
  return settings.generalList && !!listId && settings.generalListId === listId;
}

/** General is a persistent checklist; a former trip stays stored, not shown live. */
export function shoppingTrips(trips: Trip[], settings: ListMode): Trip[] {
  return settings.generalList ? trips.filter((trip) => !isGeneralList(settings, trip.listId)) : trips;
}

/** General mode never falls back to an unrelated list while its target loads. */
export function currentList(
  lists: readonly BazaarList[],
  selectedId: string | null,
  settings: ListMode,
): BazaarList | null {
  if (settings.generalList) return lists.find((list) => list.id === settings.generalListId) ?? null;
  return lists.find((list) => list.id === selectedId) ?? lists[0] ?? null;
}
