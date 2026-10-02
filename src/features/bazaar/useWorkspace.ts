import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  fetchActivity,
  fetchLiveItems,
  fetchLists,
  fetchPeople,
  fetchPurchaseHistory,
  fetchTrips,
} from '@/features/bazaar/bazaarApi';
import type { Activity, BazaarList, ListItem, Person, Trip } from '@/types/bazaar';

/**
 * Everything the screens read, in one place and one cache.
 *
 * Four queries chained off the first: the lists I am on say which items, trips
 * and activity to ask for, and the people named anywhere in those say whose
 * profiles to fetch. Every screen reads this same hook, so the Lists tab, a
 * list's page, the Household tab and the web planner can never disagree about
 * what is on the list — they are looking at the same cache, which realtime and
 * every write keep right.
 */

export const bazaarKeys = {
  all: ['bazaar'] as const,
  lists: (uid: string | undefined) => ['bazaar', 'lists', uid] as const,
  items: (uid: string | undefined) => ['bazaar', 'items', uid] as const,
  trips: (uid: string | undefined) => ['bazaar', 'trips', uid] as const,
  activity: (uid: string | undefined) => ['bazaar', 'activity', uid] as const,
  people: (uid: string | undefined) => ['bazaar', 'people', uid] as const,
  friends: (uid: string | undefined) => ['bazaar', 'friends', uid] as const,
  history: (uid: string | undefined) => ['bazaar', 'history', uid] as const,
  tripItems: (tripId: string) => ['bazaar', 'tripItems', tripId] as const,
  settings: (uid: string | undefined) => ['bazaar', 'settings', uid] as const,
};

const NO_LISTS: BazaarList[] = [];
const NO_ITEMS: ListItem[] = [];
const NO_TRIPS: Trip[] = [];
const NO_ACTIVITY: Activity[] = [];
const NO_PEOPLE: Person[] = [];

export type Workspace = {
  me: string | null;
  /** Lists I am on that are not archived, in my order. */
  lists: BazaarList[];
  archived: BazaarList[];
  /** Live items across every list. */
  items: ListItem[];
  trips: Trip[];
  activity: Activity[];
  people: Map<string, Person>;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  /** Items on one list. */
  itemsOf: (listId: string | null | undefined) => ListItem[];
  list: (listId: string | null | undefined) => BazaarList | null;
  /** A person's display name, "You" for me. */
  nameOf: (userId: string | null | undefined) => string | null;
};

export function useWorkspace(): Workspace {
  const { user } = useAuth();
  const uid = user?.id;
  const enabled = !!uid;

  const listsQuery = useQuery({ queryKey: bazaarKeys.lists(uid), queryFn: fetchLists, enabled });
  const allLists = listsQuery.data ?? NO_LISTS;
  const idsKey = useMemo(() => allLists.map((list) => list.id).sort().join(','), [allLists]);
  const listIds = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);
  const hasLists = listIds.length > 0;

  const itemsQuery = useQuery({
    queryKey: [...bazaarKeys.items(uid), idsKey],
    queryFn: () => fetchLiveItems(listIds),
    enabled: enabled && listsQuery.isSuccess && hasLists,
  });
  const tripsQuery = useQuery({
    queryKey: [...bazaarKeys.trips(uid), idsKey],
    queryFn: () => fetchTrips(listIds),
    enabled: enabled && listsQuery.isSuccess && hasLists,
  });
  const activityQuery = useQuery({
    queryKey: [...bazaarKeys.activity(uid), idsKey],
    queryFn: () => fetchActivity(listIds),
    enabled: enabled && listsQuery.isSuccess && hasLists,
  });

  const trips = tripsQuery.data ?? NO_TRIPS;
  const activity = activityQuery.data ?? NO_ACTIVITY;
  const items = itemsQuery.data ?? NO_ITEMS;

  const personIds = useMemo(() => {
    const ids = new Set<string>();
    for (const list of allLists) list.memberIds.forEach((id) => ids.add(id));
    for (const trip of trips) ids.add(trip.shopperId);
    for (const entry of activity) {
      if (entry.actorId) ids.add(entry.actorId);
      if (entry.detail.userId) ids.add(entry.detail.userId);
    }
    for (const item of items) {
      if (item.addedBy) ids.add(item.addedBy);
    }
    return [...ids].sort().join(',');
  }, [allLists, trips, activity, items]);

  const peopleQuery = useQuery({
    queryKey: [...bazaarKeys.people(uid), personIds],
    queryFn: () => fetchPeople(personIds.split(',')),
    enabled: enabled && personIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const peopleList = peopleQuery.data ?? NO_PEOPLE;
  const people = useMemo(() => new Map(peopleList.map((person) => [person.id, person])), [peopleList]);

  const lists = useMemo(() => allLists.filter((list) => list.archivedAt === null), [allLists]);
  const archived = useMemo(() => allLists.filter((list) => list.archivedAt !== null), [allLists]);

  const itemsOf = useCallback(
    (listId: string | null | undefined) => (listId ? items.filter((item) => item.listId === listId) : NO_ITEMS),
    [items],
  );
  const list = useCallback(
    (listId: string | null | undefined) => (listId ? (allLists.find((candidate) => candidate.id === listId) ?? null) : null),
    [allLists],
  );
  const nameOf = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) return null;
      if (userId === uid) return null;
      return people.get(userId)?.displayName ?? null;
    },
    [people, uid],
  );

  const refetch = useCallback(() => {
    void listsQuery.refetch();
    void itemsQuery.refetch();
    void tripsQuery.refetch();
    void activityQuery.refetch();
  }, [listsQuery, itemsQuery, tripsQuery, activityQuery]);

  return {
    me: uid ?? null,
    lists,
    archived,
    items,
    trips,
    activity,
    people,
    loading: listsQuery.isLoading || (hasLists && (itemsQuery.isLoading || tripsQuery.isLoading)),
    // An error only counts while there is nothing to show: a refetch that fails
    // behind good cached data (a dropped connection on a tram) must not replace
    // the list with an error screen.
    error:
      (!listsQuery.data && listsQuery.error) ||
      (hasLists && !itemsQuery.data && itemsQuery.error) ||
      (hasLists && !tripsQuery.data && tripsQuery.error) ||
      null,
    refetch,
    itemsOf,
    list,
    nameOf,
  };
}

/** My own purchase history — usuals are cut from it. Separate: it is large and rarely changes. */
export function usePurchaseHistory(): ListItem[] {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: bazaarKeys.history(user?.id),
    queryFn: () => fetchPurchaseHistory(user!.id),
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
  return query.data ?? NO_ITEMS;
}
