import { DEFAULT_SHARED_SETTINGS, normalizeShared, settingsToRow } from '@/lib/userSettings';

describe('normalizeShared', () => {
  it('falls back to defaults with no row', () => {
    expect(normalizeShared(null)).toEqual(DEFAULT_SHARED_SETTINGS);
  });

  it('reads the theme and rejects one it does not know', () => {
    expect(normalizeShared({ theme: 'light' }).theme).toBe('light');
    expect(normalizeShared({ theme: 'system' }).theme).toBe('system');
    expect(normalizeShared({ theme: 'sepia' }).theme).toBe('dark');
    expect(normalizeShared({ theme: null }).theme).toBe('dark');
  });
});

describe('settingsToRow', () => {
  it('emits only the one column Bazaar is allowed to write', () => {
    expect(settingsToRow({ theme: 'dark' })).toEqual({ theme: 'dark' });
  });

  it('refuses to write anything else even when handed it', () => {
    expect(settingsToRow({ radarStreak: 99, friendsVisibility: 'noone' } as never)).toEqual({});
    expect(settingsToRow({})).toEqual({});
  });
});
