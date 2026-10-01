import type { CategoryKey } from '@/lib/catalog/types';
import type { Lang } from '@/lib/categories';

/**
 * Bazaar's rows as the database sends them (snake_case), and as the app reads
 * them (camelCase, via lib/normalize). Screens only ever see the second kind.
 */

export type ListRow = {
  id: string;
  owner_id: string;
  name: string | null;
  store: string | null;
  when_text: string | null;
  position: number | null;
  created_at: string;
  archived_at: string | null;
};

export type MemberRow = {
  list_id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
};

export type ItemRow = {
  id: string;
  list_id: string;
  added_by: string | null;
  trip_id: string | null;
  product_id: string | null;
  cat: string | null;
  name_en: string | null;
  name_pl: string | null;
  opt: string | null;
  qty: string | null;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
};

export type TripRow = {
  id: string;
  list_id: string;
  shopper_id: string;
  store: string | null;
  started_at: string;
  ended_at: string | null;
  item_count: number | null;
  skipped_count: number | null;
};

export type ActivityRow = {
  id: string;
  list_id: string;
  actor_id: string | null;
  kind: string | null;
  detail: unknown;
  created_at: string;
};

export type SettingsRow = {
  app_lang: string | null;
  product_lang: string | null;
  swipe_to_check: boolean | null;
  notify_adds: boolean | null;
  notify_shopping: boolean | null;
  always_home: string[] | null;
};

export type BazaarList = {
  id: string;
  ownerId: string;
  name: string;
  store: string;
  whenText: string;
  position: number;
  createdAt: string;
  archivedAt: string | null;
  /** Everyone on the list, the owner included. */
  memberIds: string[];
};

/** One thing on a list. `tripId` is null while it is still live. */
export type ListItem = {
  id: string;
  listId: string;
  addedBy: string | null;
  tripId: string | null;
  productId: string | null;
  cat: CategoryKey;
  nameEn: string;
  namePl: string;
  opt: string;
  qty: string;
  checkedBy: string | null;
  checkedAt: string | null;
  createdAt: string;
};

export type Trip = {
  id: string;
  listId: string;
  shopperId: string;
  store: string;
  startedAt: string;
  endedAt: string | null;
  itemCount: number;
  skippedCount: number;
};

export type ActivityKind = 'added' | 'shopping_started' | 'shopping_done' | 'joined';

export type Activity = {
  id: string;
  listId: string;
  actorId: string | null;
  kind: ActivityKind;
  /** Just enough to draw the row without a join; see schema.sql section 5. */
  detail: {
    nameEn?: string;
    namePl?: string;
    store?: string;
    tripId?: string;
    itemCount?: number;
    skippedCount?: number;
    userId?: string;
  };
  createdAt: string;
};

export type BazaarSettings = {
  appLang: Lang;
  productLang: Lang;
  swipeToCheck: boolean;
  notifyAdds: boolean;
  notifyShopping: boolean;
  alwaysHome: string[];
};

/** What it takes to put something on a list. The database fills in who and when. */
export type NewItem = {
  productId: string | null;
  cat: CategoryKey;
  nameEn: string;
  namePl: string;
  opt: string;
  qty: string;
};

/** A person as the household draws them. */
export type Person = {
  id: string;
  displayName: string;
  username: string;
  pfp: string | null;
};
