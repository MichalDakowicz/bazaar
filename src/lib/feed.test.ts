import type { Activity, Trip } from '@/types/bazaar';

import { buildFeed, describeRow, liveTrips, openTripFor, sectionFeed } from './feed';

let n = 0;
function added(actor: string, nameEn: string, namePl: string, at: string, listId = 'l1'): Activity {
  n += 1;
  return { id: `a${n}`, listId, actorId: actor, kind: 'added', detail: { nameEn, namePl }, createdAt: at };
}

describe('buildFeed', () => {
  it('folds a burst of adds by one person into one row', () => {
    const rows = buildFeed([
      added('marta', 'Sour cream', 'Śmietana', '2026-09-24T09:10:00Z'),
      added('marta', 'Dill', 'Koperek', '2026-09-24T09:12:00Z'),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toEqual([['Sour cream', 'Śmietana'], ['Dill', 'Koperek']]);
    expect(rows[0].at).toBe('2026-09-24T09:12:00Z');
  });

  it('keeps two people, two lists and a long gap as separate rows', () => {
    const rows = buildFeed([
      added('marta', 'Milk', 'Mleko', '2026-09-24T09:00:00Z'),
      added('anna', 'Eggs', 'Jajka', '2026-09-24T09:01:00Z'),
      added('marta', 'Dill', 'Koperek', '2026-09-24T09:02:00Z', 'l2'),
      added('marta', 'Bread', 'Chleb', '2026-09-24T12:00:00Z'),
    ]);
    expect(rows).toHaveLength(4);
  });

  it('does not repeat the same product within a burst', () => {
    const rows = buildFeed([
      added('marta', 'Milk', 'Mleko', '2026-09-24T09:00:00Z'),
      added('marta', 'Milk', 'Mleko', '2026-09-24T09:01:00Z'),
    ]);
    expect(rows[0].items).toHaveLength(1);
  });

  it('lists newest first and reports finished trips and new people', () => {
    const rows = buildFeed([
      added('marta', 'Milk', 'Mleko', '2026-09-24T09:00:00Z'),
      { id: 'd', listId: 'l1', actorId: 'marta', kind: 'shopping_done', detail: { itemCount: 19 }, createdAt: '2026-09-24T10:00:00Z' },
      { id: 'j', listId: 'l1', actorId: 'anna', kind: 'joined', detail: { userId: 'marta' }, createdAt: '2026-09-23T10:00:00Z' },
    ]);
    expect(rows.map((r) => r.kind)).toEqual(['done', 'added', 'joined']);
    expect(rows[0].count).toBe(19);
    expect(rows[2].subjectId).toBe('marta');
  });

  it('does not make a row of a trip that has only started', () => {
    expect(
      buildFeed([{ id: 's', listId: 'l1', actorId: 'marta', kind: 'shopping_started', detail: {}, createdAt: '2026-09-24T09:00:00Z' }]),
    ).toEqual([]);
  });
});

describe('describeRow', () => {
  const [row] = buildFeed([added('marta', 'Sour cream', 'Śmietana', '2026-09-24T09:10:00Z'), added('marta', 'Dill', 'Koperek', '2026-09-24T09:11:00Z')]);
  it('speaks both languages', () => {
    expect(describeRow(row, 'Marta', '', 'en')).toBe('Marta added Sour cream, Dill');
    expect(describeRow(row, 'Marta', '', 'pl')).toBe('Marta — dodano: Śmietana, Koperek');
  });
});

describe('sectionFeed', () => {
  it('splits today from earlier', () => {
    const now = new Date('2026-09-24T12:00:00').getTime();
    const rows = buildFeed([
      added('a', 'Milk', 'Mleko', new Date('2026-09-24T08:00:00').toISOString()),
      added('a', 'Eggs', 'Jajka', new Date('2026-09-22T08:00:00').toISOString()),
    ]);
    expect(sectionFeed(rows, now).map((s) => [s.key, s.rows.length])).toEqual([['today', 1], ['earlier', 1]]);
  });
});

describe('trips', () => {
  const trip = (over: Partial<Trip>): Trip => ({
    id: 't', listId: 'l1', shopperId: 'marta', store: 'Lidl', startedAt: '2026-09-24T09:00:00Z', endedAt: null, itemCount: 0, skippedCount: 0, ...over,
  });
  it('finds the trips somebody else is out on', () => {
    const mine = trip({ id: 'a', shopperId: 'me' });
    const hers = trip({ id: 'b' });
    const done = trip({ id: 'c', endedAt: '2026-09-23T00:00:00Z' });
    expect(liveTrips([mine, hers, done], 'me').map((t) => t.id)).toEqual(['b']);
    expect(openTripFor([hers, done], 'l1')?.id).toBe('b');
    expect(openTripFor([done], 'l1')).toBeNull();
  });
});
