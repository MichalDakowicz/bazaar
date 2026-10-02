/**
 * Bazaar's half of `public.user_settings`.
 *
 * The table is Radar's (docs/shared-database.md). Bazaar reads the row and writes
 * exactly one column — `theme` — because that is the one shared preference that
 * means something here: the theme you pick is the theme in every Ping app.
 *
 * `friends_visibility` is deliberately not read and not written. A shopping list
 * is shared with the people you put on it and with nobody else, whatever the
 * privacy switch says (no policy in schema.sql calls `private.can_view`), so a
 * control for it here would be a switch with nothing behind it. The streak
 * columns are Radar's publish channel and are never touched.
 */

export type ThemePref = 'dark' | 'light' | 'system';

export type SharedSettings = {
  theme: ThemePref;
};

export type SharedSettingsRow = {
  theme: string | null;
};

/** The only column Bazaar is allowed to write. Enforced, not documented. */
export type WritableSettings = Pick<SharedSettings, 'theme'>;

export const DEFAULT_SHARED_SETTINGS: SharedSettings = { theme: 'dark' };

export function normalizeShared(row: SharedSettingsRow | null | undefined): SharedSettings {
  if (!row) return DEFAULT_SHARED_SETTINGS;
  return { theme: row.theme === 'light' || row.theme === 'system' ? row.theme : 'dark' };
}

/**
 * Only ever emits `theme`, whatever it is handed. A future caller that passes a
 * streak or a visibility gets it dropped here rather than discovering at 20:00
 * that Radar stopped warning anybody.
 */
export function settingsToRow(patch: Partial<WritableSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.theme !== undefined) row.theme = patch.theme;
  return row;
}
