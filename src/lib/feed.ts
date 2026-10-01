import type { Lang } from '@/lib/categories';
import { strings } from '@/lib/i18n';
import { isToday } from '@/lib/when';
import type { Activity, BazaarList, Trip } from '@/types/bazaar';

/**
 * The household feed: activity rows folded into the sentences a person would say.
 *
 * A burst of adds is one row ("Marta added Sour cream, Dill"), not six — the
 * database writes one activity row per item so that nothing is lost, and the
 * folding happens here, where the window for "the same breath" is a number we
 * can test.
 */

/** Adds by one person to one list within this long of each other are one row. */
export const BURST_MS = 30 * 60_000;

export type FeedRow = {
  id: string;
  kind: 'added' | 'done' | 'joined';
  actorId: string | null;
  listId: string;
  /** Newest activity in the row. */
  at: string;
  /** For `added`: the items, as [en, pl] pairs, oldest first and deduplicated. */
  items: [string, string][];
  /** For `done`: how many went into the basket. */
  count: number;
  /** For `joined`: the person who was added. */
  subjectId: string | null;
};

export type FeedSection = { key: 'today' | 'earlier'; rows: FeedRow[] };

export function buildFeed(activity: readonly Activity[]): FeedRow[] {
  // Oldest first so a burst accumulates in the order it happened; flipped at the end.
  const ordered = [...activity].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows: FeedRow[] = [];

  for (const entry of ordered) {
    if (entry.kind === 'added') {
      const previous = [...rows].reverse().find((row) => row.kind === 'added' && row.actorId === entry.actorId && row.listId === entry.listId);
      const name: [string, string] = [entry.detail.nameEn ?? '', entry.detail.namePl ?? entry.detail.nameEn ?? ''];
      if (!name[0] && !name[1]) continue;
      const withinBurst = previous && new Date(entry.createdAt).getTime() - new Date(previous.at).getTime() <= BURST_MS;
      if (previous && withinBurst && rows[rows.length - 1] === previous) {
        if (!previous.items.some(([en]) => en === name[0])) previous.items.push(name);
        previous.at = entry.createdAt;
      } else {
        rows.push({ id: entry.id, kind: 'added', actorId: entry.actorId, listId: entry.listId, at: entry.createdAt, items: [name], count: 1, subjectId: null });
      }
    } else if (entry.kind === 'shopping_done') {
      rows.push({ id: entry.id, kind: 'done', actorId: entry.actorId, listId: entry.listId, at: entry.createdAt, items: [], count: entry.detail.itemCount ?? 0, subjectId: null });
    } else if (entry.kind === 'joined') {
      rows.push({ id: entry.id, kind: 'joined', actorId: entry.actorId, listId: entry.listId, at: entry.createdAt, items: [], count: 0, subjectId: entry.detail.userId ?? null });
    }
    // `shopping_started` is not a feed row: a trip that is still open is the
    // live row at the top (see liveTrips), and one that ended is a `done`.
  }
  return rows.reverse();
}

export function sectionFeed(rows: readonly FeedRow[], now: number): FeedSection[] {
  const today = rows.filter((row) => isToday(row.at, now));
  const earlier = rows.filter((row) => !isToday(row.at, now));
  const sections: FeedSection[] = [];
  if (today.length) sections.push({ key: 'today', rows: today });
  if (earlier.length) sections.push({ key: 'earlier', rows: earlier });
  return sections;
}

/** Trips somebody else is out on right now, newest first. */
export function liveTrips(trips: readonly Trip[], me: string | null): Trip[] {
  return trips
    .filter((trip) => trip.endedAt === null && trip.shopperId !== me)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** The open trip on a list, whoever is on it. */
export function openTripFor(trips: readonly Trip[], listId: string): Trip | null {
  return trips.find((trip) => trip.listId === listId && trip.endedAt === null) ?? null;
}

/** The sentence for a feed row. `who` is the actor's name as the reader should see it. */
export function describeRow(
  row: FeedRow,
  who: string,
  subject: string,
  lang: Lang,
): string {
  const t = strings(lang);
  if (row.kind === 'added') {
    const names = row.items.map(([en, pl]) => (lang === 'pl' ? pl || en : en || pl));
    return t.addedItems(who, names.join(', '));
  }
  if (row.kind === 'done') return t.finishedTrip(who, row.count);
  return t.joinedList(who, subject);
}

/** The small line under a row: which list, and when. */
export function listNameFor(row: FeedRow, lists: readonly BazaarList[]): string {
  return lists.find((list) => list.id === row.listId)?.name ?? '';
}
