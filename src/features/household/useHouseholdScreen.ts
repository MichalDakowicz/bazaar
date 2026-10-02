import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useLiveTrips } from '@/features/bazaar/useLiveTrips';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { feedSubtitle, feedText, liveSubtitle, otherNames, sharedCount } from '@/features/household/householdModel';
import { useNow } from '@/features/household/useNow';
import { useIsDesktop } from '@/hooks/useResponsive';
import { buildFeed, sectionFeed, type FeedRow } from '@/lib/feed';
import { useBazaarUi } from '@/store/bazaarPrefs';
import type { Person } from '@/types/bazaar';

export type LiveRowModel = {
  id: string;
  person: Person | null;
  title: string;
  subtitle: string;
  /** The trip the desktop panel is showing. */
  selected: boolean;
  onPress: () => void;
};

export type FeedRowModel = {
  id: string;
  person: Person | null;
  title: string;
  subtitle: string;
};

export type HouseholdSection = {
  key: 'today' | 'earlier';
  title: string;
  /** Trips somebody else is out on. Only ever in Today: they are happening now. */
  live: LiveRowModel[];
  rows: FeedRowModel[];
};

/**
 * The Household tab: who else is on my lists, who is out shopping right now, and
 * what has happened on the lists lately. Everything the screen draws is worked
 * out here (PING.md §13).
 *
 * On a phone a live row opens the trip. On a desktop the trip is already beside
 * the feed, so a live row only chooses which one that panel shows.
 */
export function useHouseholdScreen() {
  const workspace = useWorkspace();
  const { t, appLang, productLang } = useLang();
  const { others } = useLiveTrips();
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const open = useBazaarUi((state) => state.open);
  const now = useNow();
  const [chosen, setChosen] = useState<string | null>(null);

  const { lists, activity, people, me, nameOf, list: listById } = workspace;

  const meta = useMemo(() => {
    const names = otherNames(lists, nameOf).join(', ');
    return t.houseMeta(names || t.onlyYou, sharedCount(lists));
  }, [lists, nameOf, t]);

  const feed = useMemo(() => buildFeed(activity), [activity]);

  const selectedTripId = others.find((trip) => trip.id === chosen)?.id ?? others[0]?.id ?? null;

  const openTrip = useCallback(
    (id: string) => {
      if (isDesktop) setChosen(id);
      else router.navigate({ pathname: '/live/[id]', params: { id } });
    },
    [isDesktop, router],
  );

  const sections = useMemo<HouseholdSection[]>(() => {
    const live: LiveRowModel[] = others.map((trip) => {
      const list = listById(trip.listId);
      return {
        id: trip.id,
        person: people.get(trip.shopperId) ?? null,
        title: t.isShopping(nameOf(trip.shopperId) ?? t.someone),
        subtitle: liveSubtitle(list?.name ?? '', trip.store || list?.store || '', trip.startedAt, now),
        selected: trip.id === selectedTripId,
        onPress: () => openTrip(trip.id),
      };
    });

    const toModel = (row: FeedRow): FeedRowModel => {
      const who = row.actorId === me ? t.you_ : (nameOf(row.actorId) ?? t.someone);
      const subject = row.subjectId === me ? t.you : (nameOf(row.subjectId) ?? t.someone);
      return {
        id: row.id,
        person: row.actorId ? (people.get(row.actorId) ?? null) : null,
        title: feedText(row, who, subject, appLang, productLang),
        subtitle: feedSubtitle(listById(row.listId)?.name ?? '', row.at, now, appLang),
      };
    };

    const byKey = new Map(sectionFeed(feed, now).map((section) => [section.key, section.rows]));
    const today = byKey.get('today') ?? [];
    const earlier = byKey.get('earlier') ?? [];

    const out: HouseholdSection[] = [];
    if (live.length > 0 || today.length > 0) out.push({ key: 'today', title: t.today, live, rows: today.map(toModel) });
    if (earlier.length > 0) out.push({ key: 'earlier', title: t.earlier, live: [], rows: earlier.map(toModel) });
    return out;
  }, [others, feed, now, listById, people, me, nameOf, t, appLang, productLang, selectedTripId, openTrip]);

  return {
    meta,
    sections,
    selectedTripId,
    isEmpty: sections.length === 0,
    loading: workspace.loading,
    error: workspace.error,
    refetch: workspace.refetch,
    addPerson: () => open({ kind: 'people' }),
  };
}
