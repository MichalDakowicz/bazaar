import type { Lang } from '@/lib/categories';
import { describeRow, type FeedRow } from '@/lib/feed';
import { clock, duration, isToday, relative } from '@/lib/when';
import type { BazaarList, Person } from '@/types/bazaar';

/**
 * What the Household tab, the live trip and the people sheet work out before
 * they draw. Pure and React-free, so the rules are tested rather than eyeballed
 * (PING.md §13).
 */

// ── The heading ──────────────────────────────────────────────────────────────

/** Everyone else on any of my lists, once each. `nameOf` answers null for me and for people not loaded yet. */
export function otherNames(lists: readonly BazaarList[], nameOf: (id: string) => string | null): string[] {
  const names = new Set<string>();
  for (const list of lists) {
    for (const id of list.memberIds) {
      const name = nameOf(id);
      if (name) names.add(name);
    }
  }
  return [...names];
}

/** Lists that more than one person is on. */
export function sharedCount(lists: readonly BazaarList[]): number {
  return lists.filter((list) => list.memberIds.length > 1).length;
}

// ── The feed ─────────────────────────────────────────────────────────────────

/**
 * A feed row whose product names read in the *product* language.
 *
 * `describeRow` frames the sentence in one language and, inside it, picks each
 * name by that same language. The household wants the sentence in the app
 * language and the products in the product language (a Polish household on an
 * English interface still reads "Marta added Śmietana"), so each pair is put
 * the way round that makes `describeRow` pick the right slot.
 */
export function productFirst(row: FeedRow, appLang: Lang, productLang: Lang): FeedRow {
  if (row.kind !== 'added') return row;
  const items = row.items.map(([en, pl]): [string, string] => {
    const wanted = productLang === 'pl' ? pl || en : en || pl;
    // describeRow reads slot 0 in English and slot 1 in Polish.
    return appLang === 'pl' ? ['', wanted] : [wanted, ''];
  });
  return { ...row, items };
}

/** The sentence for a feed row: app-language frame, product-language names. */
export function feedText(row: FeedRow, who: string, subject: string, appLang: Lang, productLang: Lang): string {
  return describeRow(productFirst(row, appLang, productLang), who, subject, appLang);
}

/** "9:12" for something that happened today, "2d ago" / "Wed 24" for the rest. */
export function feedWhen(at: string, now: number, lang: Lang): string {
  return isToday(at, now) ? clock(at) : relative(at, now, lang);
}

/** The small line under a feed row: which list, and when. */
export function feedSubtitle(listName: string, at: string, now: number, lang: Lang): string {
  return [listName, feedWhen(at, now, lang)].filter(Boolean).join(' · ');
}

/** The small line under a live row: "Weekly shop · Lidl · 10 min". */
export function liveSubtitle(listName: string, store: string, startedAt: string, now: number): string {
  return [listName, store, duration(startedAt, now)].filter(Boolean).join(' · ');
}

// ── The people sheet ─────────────────────────────────────────────────────────

/** Lists I own — the only ones I can put people on or take them off. */
export function ownedLists(lists: readonly BazaarList[], me: string | null): BazaarList[] {
  return me ? lists.filter((list) => list.ownerId === me) : [];
}

/**
 * Which of my lists are picked. `picked` is `null` until the person touches a
 * chip, which means "all of them" — so a list made while the sheet is open is in
 * the default too, and a list that has gone is never counted.
 */
export function effectiveSelection(owned: readonly BazaarList[], picked: readonly string[] | null): string[] {
  const ids = owned.map((list) => list.id);
  return picked === null ? ids : ids.filter((id) => picked.includes(id));
}

export function toggleSelection(owned: readonly BazaarList[], picked: readonly string[] | null, id: string): string[] {
  const current = effectiveSelection(owned, picked);
  return current.includes(id) ? current.filter((candidate) => candidate !== id) : [...current, id];
}

export type FriendStanding = {
  person: Person;
  /** Picked lists the friend is not on yet. */
  missing: string[];
  /** On every picked list (and there is at least one picked). */
  onAll: boolean;
};

export function friendStanding(
  friend: Person,
  lists: readonly BazaarList[],
  selectedIds: readonly string[],
): FriendStanding {
  const missing = selectedIds.filter((id) => {
    const list = lists.find((candidate) => candidate.id === id);
    return !!list && !list.memberIds.includes(friend.id);
  });
  return { person: friend, missing, onAll: selectedIds.length > 0 && missing.length === 0 };
}

/** The people on a list, me first (I own it), then in the order they joined. */
export function memberIds(list: BazaarList, me: string | null): string[] {
  const others = list.memberIds.filter((id) => id !== me);
  return me && list.memberIds.includes(me) ? [me, ...others] : others;
}
