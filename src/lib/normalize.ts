import { categoryOf, type Lang } from '@/lib/categories';
import type {
  Activity,
  ActivityKind,
  ActivityRow,
  BazaarList,
  BazaarSettings,
  ItemRow,
  ListItem,
  ListRow,
  MemberRow,
  NewItem,
  SettingsRow,
  Trip,
  TripRow,
} from '@/types/bazaar';

/**
 * The single read boundary (PING.md §13): rows come in as the database wrote
 * them, nullable and snake_case, and leave as the shapes the app reasons about.
 * Nothing past this file branches on a missing column.
 */

export function normalizeList(row: ListRow, members: readonly MemberRow[] = []): BazaarList {
  const memberIds = members.filter((member) => member.list_id === row.id).map((member) => member.user_id);
  // The owner is always on their own list, even in the instant before the
  // membership trigger's row reaches the client.
  if (!memberIds.includes(row.owner_id)) memberIds.unshift(row.owner_id);
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: (row.name ?? '').trim() || 'Untitled list',
    store: (row.store ?? '').trim(),
    whenText: (row.when_text ?? '').trim(),
    position: row.position ?? 0,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    memberIds,
  };
}

export function normalizeItem(row: ItemRow): ListItem {
  const nameEn = (row.name_en ?? '').trim();
  const namePl = (row.name_pl ?? '').trim();
  return {
    id: row.id,
    listId: row.list_id,
    addedBy: row.added_by,
    tripId: row.trip_id,
    productId: row.product_id,
    // Earlier builds put every custom item in pantry; keep those under Other too.
    cat: categoryOf(row.product_id === null && row.cat === 'pantry' ? 'other' : row.cat).key,
    // A custom item typed in one language is the same word in the other until
    // somebody says otherwise; a blank name would render as an empty row.
    nameEn: nameEn || namePl,
    namePl: namePl || nameEn,
    opt: (row.opt ?? '').trim(),
    qty: (row.qty ?? '').trim() || '1',
    checkedBy: row.checked_by,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  };
}

export function normalizeTrip(row: TripRow): Trip {
  return {
    id: row.id,
    listId: row.list_id,
    shopperId: row.shopper_id,
    store: (row.store ?? '').trim(),
    startedAt: row.started_at,
    endedAt: row.ended_at,
    itemCount: row.item_count ?? 0,
    skippedCount: row.skipped_count ?? 0,
  };
}

const KINDS: readonly ActivityKind[] = ['added', 'shopping_started', 'shopping_done', 'joined'];

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function whole(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** A row of a kind this build does not know is dropped, not drawn as a blank. */
export function normalizeActivity(row: ActivityRow): Activity | null {
  const kind = KINDS.find((candidate) => candidate === row.kind);
  if (!kind) return null;
  const raw = (row.detail && typeof row.detail === 'object' ? row.detail : {}) as Record<string, unknown>;
  return {
    id: row.id,
    listId: row.list_id,
    actorId: row.actor_id,
    kind,
    detail: {
      nameEn: text(raw.name_en),
      namePl: text(raw.name_pl),
      store: text(raw.store),
      tripId: text(raw.trip_id),
      itemCount: whole(raw.item_count),
      skippedCount: whole(raw.skipped_count),
      userId: text(raw.user_id),
    },
    createdAt: row.created_at,
  };
}

/**
 * The language a fresh account starts in: Polish if the device says so, else
 * English. Only used the first time — after that the stored row is the truth.
 */
export function deviceLang(locale: string | undefined | null): Lang {
  return (locale ?? '').toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export const DEFAULT_ALWAYS_HOME = ['salt', 'salt-pepper', 'black-pepper', 'white-pepper', 'water'];

export function defaultSettings(locale?: string | null): BazaarSettings {
  const lang = deviceLang(locale);
  return {
    appLang: lang,
    productLang: lang,
    swipeToCheck: true,
    notifyAdds: true,
    notifyShopping: true,
    alwaysHome: [...DEFAULT_ALWAYS_HOME],
  };
}

function langOf(value: string | null | undefined, fallback: Lang): Lang {
  return value === 'pl' || value === 'en' ? value : fallback;
}

export function normalizeSettings(row: SettingsRow | null, locale?: string | null): BazaarSettings {
  const base = defaultSettings(locale);
  if (!row) return base;
  return {
    appLang: langOf(row.app_lang, base.appLang),
    productLang: langOf(row.product_lang, base.productLang),
    swipeToCheck: row.swipe_to_check ?? base.swipeToCheck,
    notifyAdds: row.notify_adds ?? base.notifyAdds,
    notifyShopping: row.notify_shopping ?? base.notifyShopping,
    alwaysHome: Array.isArray(row.always_home) ? row.always_home.filter((id) => typeof id === 'string') : base.alwaysHome,
  };
}

/**
 * The columns Bazaar may write to its own settings row. Built from the patch,
 * so a setting that was not touched is never overwritten with a default.
 */
export function settingsToRow(patch: Partial<BazaarSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.appLang !== undefined) row.app_lang = patch.appLang;
  if (patch.productLang !== undefined) row.product_lang = patch.productLang;
  if (patch.swipeToCheck !== undefined) row.swipe_to_check = patch.swipeToCheck;
  if (patch.notifyAdds !== undefined) row.notify_adds = patch.notifyAdds;
  if (patch.notifyShopping !== undefined) row.notify_shopping = patch.notifyShopping;
  if (patch.alwaysHome !== undefined) row.always_home = patch.alwaysHome;
  return row;
}

/** An insert payload. Who added it is the database's to say, not ours. */
export function newItemToRow(listId: string, item: NewItem): Record<string, unknown> {
  return {
    list_id: listId,
    product_id: item.productId,
    cat: item.cat,
    name_en: item.nameEn,
    name_pl: item.namePl,
    opt: item.opt,
    qty: item.qty,
  };
}
