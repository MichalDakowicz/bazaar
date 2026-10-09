import {
  defaultSettings,
  deviceLang,
  newItemToRow,
  normalizeActivity,
  normalizeItem,
  normalizeList,
  normalizeSettings,
  normalizeTrip,
  settingsToRow,
} from './normalize';

const itemRow = {
  id: 'i1',
  list_id: 'l1',
  added_by: 'u1',
  trip_id: null,
  product_id: 'milk',
  cat: 'dairy',
  name_en: ' Milk ',
  name_pl: 'Mleko',
  opt: '3.2% · Fresh',
  qty: '2 L',
  checked_by: null,
  checked_at: null,
  created_at: '2026-09-24T08:00:00Z',
};

describe('normalizeItem', () => {
  it('trims and keeps the columns', () => {
    expect(normalizeItem(itemRow)).toMatchObject({ nameEn: 'Milk', namePl: 'Mleko', cat: 'dairy', qty: '2 L', tripId: null });
  });

  it('files an unknown section under Other instead of dropping the row', () => {
    expect(normalizeItem({ ...itemRow, cat: 'garden' }).cat).toBe('other');
    expect(normalizeItem({ ...itemRow, cat: null }).cat).toBe('other');
  });

  it('repairs old custom pantry items while preserving catalogue and explicit categories', () => {
    expect(normalizeItem({ ...itemRow, product_id: null, cat: 'pantry' }).cat).toBe('other');
    expect(normalizeItem({ ...itemRow, product_id: 'flour', cat: 'pantry' }).cat).toBe('pantry');
    expect(normalizeItem({ ...itemRow, product_id: null, cat: 'home' }).cat).toBe('home');
  });

  it('mirrors a name that is missing in one language', () => {
    const custom = normalizeItem({ ...itemRow, name_en: 'Dog treats', name_pl: null, product_id: null });
    expect(custom.namePl).toBe('Dog treats');
    expect(normalizeItem({ ...itemRow, qty: null }).qty).toBe('1');
  });
});

describe('normalizeList', () => {
  const row = {
    id: 'l1', owner_id: 'u1', name: null, store: ' Lidl ', when_text: null, position: null,
    created_at: '2026-09-01T00:00:00Z', archived_at: null,
  };
  it('names an unnamed list and collects its members', () => {
    const list = normalizeList(row, [
      { list_id: 'l1', user_id: 'u2', added_by: 'u1', created_at: '' },
      { list_id: 'l2', user_id: 'u9', added_by: 'u1', created_at: '' },
    ]);
    expect(list.name).toBe('Untitled list');
    expect(list.store).toBe('Lidl');
    expect(list.memberIds).toEqual(['u1', 'u2']);
  });
});

describe('normalizeTrip and normalizeActivity', () => {
  it('defaults the counts of an open trip', () => {
    const trip = normalizeTrip({ id: 't', list_id: 'l', shopper_id: 'u', store: null, started_at: 's', ended_at: null, item_count: null, skipped_count: null });
    expect(trip).toMatchObject({ itemCount: 0, skippedCount: 0, store: '', endedAt: null });
  });

  it('reads an added row and drops a kind it does not know', () => {
    const base = { id: 'a1', list_id: 'l1', actor_id: 'u1', created_at: 'now' };
    expect(
      normalizeActivity({ ...base, kind: 'added', detail: { name_en: 'Dill', name_pl: 'Koperek', qty: '1 bunch' } }),
    ).toMatchObject({ kind: 'added', detail: { nameEn: 'Dill', namePl: 'Koperek' } });
    expect(normalizeActivity({ ...base, kind: 'from-the-future', detail: {} })).toBeNull();
    expect(normalizeActivity({ ...base, kind: 'joined', detail: null })?.detail).toEqual(expect.any(Object));
  });
});

describe('settings', () => {
  it('starts Polish on a Polish device and English everywhere else', () => {
    expect(deviceLang('pl-PL')).toBe('pl');
    expect(deviceLang('en-GB')).toBe('en');
    expect(deviceLang(undefined)).toBe('en');
    expect(defaultSettings('pl').productLang).toBe('pl');
  });

  it('reads a stored row over the defaults, and a missing row as the defaults', () => {
    expect(normalizeSettings(null, 'en')).toEqual(defaultSettings('en'));
    const read = normalizeSettings(
      { app_lang: 'pl', product_lang: 'en', swipe_to_check: false, notify_adds: null, notify_shopping: true, always_home: ['salt'] },
      'en',
    );
    expect(read).toMatchObject({ appLang: 'pl', productLang: 'en', swipeToCheck: false, notifyAdds: true, alwaysHome: ['salt'] });
  });

  it('ignores a language it does not ship', () => {
    expect(normalizeSettings({ app_lang: 'de', product_lang: null, swipe_to_check: null, notify_adds: null, notify_shopping: null, always_home: null }, 'en').appLang).toBe('en');
  });

  it('writes only the settings that were touched', () => {
    expect(settingsToRow({ swipeToCheck: false })).toEqual({ swipe_to_check: false });
    expect(settingsToRow({})).toEqual({});
    expect(settingsToRow({ appLang: 'pl', alwaysHome: [] })).toEqual({ app_lang: 'pl', always_home: [] });
  });
});

describe('newItemToRow', () => {
  it('carries no author: the database says who added it', () => {
    const row = newItemToRow('l1', { productId: 'milk', cat: 'dairy', nameEn: 'Milk', namePl: 'Mleko', opt: '', qty: '1' });
    expect(row).not.toHaveProperty('added_by');
    expect(row).toMatchObject({ list_id: 'l1', name_en: 'Milk', name_pl: 'Mleko' });
  });
});
