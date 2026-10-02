import type { Lang } from '@/lib/categories';
import { strings } from '@/lib/i18n';
import { dayLabel, startOfWeek } from '@/lib/when';
import type { Trip } from '@/types/bazaar';

/**
 * History is the finished trips, newest first, under the headings a person
 * would give them: this week, then the earlier weeks of the month by name.
 */

export type HistorySection = { key: string; title: string; trips: Trip[] };

export function finishedTrips(trips: readonly Trip[]): Trip[] {
  return trips
    .filter((trip) => trip.endedAt !== null)
    .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''));
}

/**
 * The finished trips this person may delete: the ones they shopped, and every
 * trip on a list they own. Mirrors `bazaar_delete_trips`, which is the one that
 * decides — this only keeps the screen from offering what the server would skip.
 */
export function deletableTrips(trips: readonly Trip[], me: string | null, ownedListIds: ReadonlySet<string>): Trip[] {
  if (!me) return [];
  return finishedTrips(trips).filter((trip) => trip.shopperId === me || ownedListIds.has(trip.listId));
}

export function historySections(trips: readonly Trip[], now: number, lang: Lang): HistorySection[] {
  const t = strings(lang);
  const weekStart = startOfWeek(now);
  const today = new Date(now);
  const sections: HistorySection[] = [];

  for (const trip of finishedTrips(trips)) {
    const ended = new Date(trip.endedAt as string);
    let key: string;
    let title: string;
    if (ended.getTime() >= weekStart) {
      key = 'week';
      title = t.thisWeek;
    } else {
      key = `${ended.getFullYear()}-${ended.getMonth()}`;
      // The current month's earlier weeks read "Earlier in September"; a month
      // already over just carries its name (and its year when it is not this one).
      const sameMonth = ended.getFullYear() === today.getFullYear() && ended.getMonth() === today.getMonth();
      title = sameMonth
        ? t.earlierIn(ended.getMonth())
        : `${t.earlierIn(ended.getMonth())}${ended.getFullYear() === today.getFullYear() ? '' : ` ${ended.getFullYear()}`}`;
    }
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.trips.push(trip);
    else sections.push({ key, title, trips: [trip] });
  }
  return sections;
}

/** "Wed 24 · Lidl · Marta · 19 items · 2 skipped" — one history row's second line. */
export function tripMeta(trip: Trip, who: string, lang: Lang): string {
  const t = strings(lang);
  const parts = [
    dayLabel(trip.endedAt ?? trip.startedAt, lang),
    trip.store,
    who,
    t.itemsCount(trip.itemCount),
    trip.skippedCount > 0 ? t.skipped(trip.skippedCount) : '',
  ];
  return parts.filter(Boolean).join(' · ');
}
