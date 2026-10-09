import type { BazaarList, Trip } from '@/types/bazaar';

import { reuseTarget, tripTitle } from './historyModel';

const list = (id: string, name: string, archivedAt: string | null = null): BazaarList => ({
  id, ownerId: 'u', name, store: '', whenText: '', position: 0, createdAt: '2026-09-01T00:00:00Z', archivedAt, memberIds: ['u'],
});

const trip: Trip = {
  id: 't1', listId: 'l1', shopperId: 'u', store: 'Lidl', startedAt: '2026-09-24T09:00:00Z',
  endedAt: '2026-09-24T10:00:00Z', itemCount: 19, skippedCount: 2,
};

describe('tripTitle', () => {
  it('prefers the list it was shopped from', () => {
    expect(tripTitle(list('l1', 'Weekly shop'), trip, 'en')).toBe('Weekly shop');
  });

  it('falls back to the shop when the list is gone', () => {
    expect(tripTitle(null, trip, 'en')).toBe('Lidl');
    expect(tripTitle(list('l1', ''), trip, 'en')).toBe('Lidl');
  });

  it('falls back to the day when it has neither', () => {
    expect(tripTitle(null, { ...trip, store: '' }, 'en')).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe('reuseTarget', () => {
  const own = list('l1', 'Weekly shop');
  const current = list('l2', 'Party');

  it('puts the items back on the list they came from', () => {
    expect(reuseTarget(own, current)).toBe(own);
  });

  it('uses the current list when the original is gone or archived', () => {
    expect(reuseTarget(null, current)).toBe(current);
    expect(reuseTarget(list('l1', 'Old', '2026-09-30T00:00:00Z'), current)).toBe(current);
  });

  it('has nowhere to put them when there is no list at all', () => {
    expect(reuseTarget(null, null)).toBeNull();
  });

  it('reuses an old sublist trip into General while general mode is enabled', () => {
    expect(reuseTarget(own, current, true)).toBe(current);
    expect(reuseTarget(own, null, true)).toBeNull();
  });
});
