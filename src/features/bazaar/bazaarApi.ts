import {
  newItemToRow,
  normalizeActivity,
  normalizeItem,
  normalizeList,
  normalizeSettings,
  normalizeTrip,
  settingsToRow,
} from '@/lib/normalize';
import { supabase } from '@/lib/supabase';
import type {
  Activity,
  ActivityRow,
  BazaarList,
  BazaarSettings,
  ItemRow,
  ListItem,
  ListRow,
  MemberRow,
  NewItem,
  Person,
  SettingsRow,
  Trip,
  TripRow,
} from '@/types/bazaar';

/**
 * Every query the app makes, and nothing else. No React import — this is the
 * transport, not a hook. Row shapes and their normalizers live in lib/normalize.
 *
 * Every column is named. `profiles.favorites` is Radar's and is never selected.
 */

const LIST_COLUMNS = 'id, owner_id, name, store, when_text, position, created_at, archived_at';
const MEMBER_COLUMNS = 'list_id, user_id, added_by, created_at';
const ITEM_COLUMNS =
  'id, list_id, added_by, trip_id, product_id, cat, name_en, name_pl, opt, qty, checked_by, checked_at, created_at';
const TRIP_COLUMNS = 'id, list_id, shopper_id, store, started_at, ended_at, item_count, skipped_count';
const ACTIVITY_COLUMNS = 'id, list_id, actor_id, kind, detail, created_at';
const SETTINGS_COLUMNS = 'app_lang, product_lang, swipe_to_check, notify_adds, notify_shopping, always_home';
const PERSON_COLUMNS = 'id, username, display_name, pfp';

type PersonRow = { id: string; username: string; display_name: string | null; pfp: string | null };

function toPerson(row: PersonRow): Person {
  return { id: row.id, username: row.username, displayName: row.display_name || row.username, pfp: row.pfp };
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** Every list I am on, with who else is on it. Archived lists are included; the screens decide. */
export async function fetchLists(): Promise<BazaarList[]> {
  const { data, error } = await supabase
    .from('bazaar_lists')
    .select(LIST_COLUMNS)
    .order('position')
    .order('created_at');
  if (error) throw error;
  const rows = data as ListRow[];
  if (rows.length === 0) return [];

  const { data: members, error: memberError } = await supabase
    .from('bazaar_list_members')
    .select(MEMBER_COLUMNS)
    .in('list_id', rows.map((row) => row.id));
  if (memberError) throw memberError;
  return rows.map((row) => normalizeList(row, members as MemberRow[]));
}

/** What is on the lists right now — not what finished trips carried home. */
export async function fetchLiveItems(listIds: string[]): Promise<ListItem[]> {
  if (listIds.length === 0) return [];
  const { data, error } = await supabase
    .from('bazaar_items')
    .select(ITEM_COLUMNS)
    .in('list_id', listIds)
    .is('trip_id', null)
    .order('created_at');
  if (error) throw error;
  return (data as ItemRow[]).map(normalizeItem);
}

/** The items a finished trip carried home — the body of a History row. */
export async function fetchTripItems(tripId: string): Promise<ListItem[]> {
  const { data, error } = await supabase.from('bazaar_items').select(ITEM_COLUMNS).eq('trip_id', tripId).order('created_at');
  if (error) throw error;
  return (data as ItemRow[]).map(normalizeItem);
}

/**
 * Everything I put on a list in the last few months, trips included — the raw
 * material for "your usuals". Capped: a usual is a habit, and a hundred
 * trips ago is not one.
 */
export async function fetchPurchaseHistory(userId: string): Promise<ListItem[]> {
  const since = new Date(Date.now() - 120 * 24 * 60 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('bazaar_items')
    .select(ITEM_COLUMNS)
    .eq('added_by', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(600);
  if (error) throw error;
  return (data as ItemRow[]).map(normalizeItem);
}

export async function fetchTrips(listIds: string[]): Promise<Trip[]> {
  if (listIds.length === 0) return [];
  const { data, error } = await supabase
    .from('bazaar_trips')
    .select(TRIP_COLUMNS)
    .in('list_id', listIds)
    .order('started_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as TripRow[]).map(normalizeTrip);
}

export async function fetchActivity(listIds: string[]): Promise<Activity[]> {
  if (listIds.length === 0) return [];
  const { data, error } = await supabase
    .from('bazaar_activity')
    .select(ACTIVITY_COLUMNS)
    .in('list_id', listIds)
    .order('created_at', { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data as ActivityRow[]).map(normalizeActivity).filter((entry): entry is Activity => entry !== null);
}

export async function fetchPeople(ids: string[]): Promise<Person[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select(PERSON_COLUMNS).in('id', ids);
  if (error) throw error;
  return (data as PersonRow[]).map(toPerson);
}

/** My friends, from Radar's `friendships`: the only people a list can be shared with. */
export async function fetchFriends(userId: string): Promise<Person[]> {
  const { data, error } = await supabase.from('friendships').select('friend_id').eq('user_id', userId);
  if (error) throw error;
  return fetchPeople((data as { friend_id: string }[]).map((row) => row.friend_id));
}

export async function fetchSettings(userId: string, locale: string | null): Promise<BazaarSettings> {
  const { data, error } = await supabase
    .from('bazaar_settings')
    .select(SETTINGS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return normalizeSettings(data as SettingsRow | null, locale);
}

// ── Writes ───────────────────────────────────────────────────────────────────

export type ListDraft = { name: string; store: string; whenText: string };

export async function insertList(ownerId: string, draft: ListDraft, position: number): Promise<string> {
  const { data, error } = await supabase
    .from('bazaar_lists')
    .insert({ owner_id: ownerId, name: draft.name, store: draft.store, when_text: draft.whenText, position })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function patchList(listId: string, patch: Partial<ListDraft> & { archived?: boolean }): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.store !== undefined) row.store = patch.store;
  if (patch.whenText !== undefined) row.when_text = patch.whenText;
  if (patch.archived !== undefined) row.archived_at = patch.archived ? new Date().toISOString() : null;
  const { error } = await supabase.from('bazaar_lists').update(row).eq('id', listId);
  if (error) throw error;
}

export async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase.from('bazaar_lists').delete().eq('id', listId);
  if (error) throw error;
}

/** Returns the new ids, so an Undo can take exactly these back. */
export async function insertItems(listId: string, items: NewItem[]): Promise<string[]> {
  if (items.length === 0) return [];
  const { data, error } = await supabase
    .from('bazaar_items')
    .insert(items.map((item) => newItemToRow(listId, item)))
    .select('id');
  if (error) throw error;
  return (data as { id: string }[]).map((row) => row.id);
}

export async function setItemChecked(itemId: string, checked: boolean): Promise<void> {
  const { error } = await supabase
    .from('bazaar_items')
    .update({ checked_at: checked ? new Date().toISOString() : null })
    .eq('id', itemId);
  if (error) throw error;
}

export async function patchItem(itemId: string, patch: { qty?: string; opt?: string }): Promise<void> {
  const { error } = await supabase.from('bazaar_items').update(patch).eq('id', itemId);
  if (error) throw error;
}

export async function deleteItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('bazaar_items').delete().in('id', ids);
  if (error) throw error;
}

export async function startTrip(listId: string, shopperId: string, store: string): Promise<string> {
  const { data, error } = await supabase
    .from('bazaar_trips')
    .insert({ list_id: listId, shopper_id: shopperId, store })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function finishTrip(tripId: string): Promise<void> {
  const { error } = await supabase.rpc('bazaar_finish_trip', { p_trip: tripId });
  if (error) throw error;
}

export async function reuseTrip(tripId: string, listId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('bazaar_reuse_trip', { p_trip: tripId, p_list: listId });
  if (error) throw error;
  return (data as string[] | null) ?? [];
}

export async function addMember(listId: string, userId: string, addedBy: string): Promise<void> {
  const { error } = await supabase.from('bazaar_list_members').insert({ list_id: listId, user_id: userId, added_by: addedBy });
  if (error) throw error;
}

export async function removeMember(listId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('bazaar_remove_member', { p_list: listId, p_user: userId });
  if (error) throw error;
}

export async function leaveList(listId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('bazaar_list_members').delete().eq('list_id', listId).eq('user_id', userId);
  if (error) throw error;
}

export async function saveSettings(userId: string, patch: Partial<BazaarSettings>): Promise<void> {
  const row = settingsToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('bazaar_settings').upsert({ user_id: userId, ...row }, { onConflict: 'user_id' });
  if (error) throw error;
}
