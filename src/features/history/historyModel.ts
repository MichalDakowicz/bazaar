import type { Lang } from '@/lib/categories';
import { dayLabel } from '@/lib/when';
import type { BazaarList, Trip } from '@/types/bazaar';

/**
 * The two small decisions History makes about a trip, kept out of the screen so
 * they can be tested: what to call it, and where "Reuse" puts its items.
 */

/** The list it was shopped from, else the shop, else just the day — never blank. */
export function tripTitle(list: BazaarList | null, trip: Trip, lang: Lang): string {
  return list?.name || trip.store || dayLabel(trip.endedAt ?? trip.startedAt, lang);
}

/**
 * Reusing a trip copies its items back to the list it came from — unless that
 * list is gone or archived, in which case they land on the list you are
 * looking at now. `null` only when you have no list at all.
 */
export function reuseTarget(own: BazaarList | null, current: BazaarList | null): BazaarList | null {
  return own && own.archivedAt === null ? own : current;
}
