import type { ListItem } from '@/types/bazaar';

import { buildUsuals } from './usuals';

const NOW = new Date('2026-09-24T12:00:00Z').getTime();

function bought(productId: string, name: string, opt: string, at: string): ListItem {
  return {
    id: `${productId}-${at}`,
    listId: 'l1',
    addedBy: 'me',
    tripId: 't1',
    productId,
    cat: 'dairy',
    nameEn: name,
    namePl: name,
    opt,
    qty: '1',
    checkedBy: null,
    checkedAt: null,
    createdAt: at,
  };
}

// Milk twice and eggs twice, milk more recently — so milk ranks first.
const HISTORY = [
  bought('milk', 'Milk', '3.2%', '2026-09-20T10:00:00Z'),
  bought('milk', 'Milk', '3.2%', '2026-09-22T10:00:00Z'),
  bought('eggs', 'Eggs', 'L', '2026-09-01T10:00:00Z'),
  bought('eggs', 'Eggs', 'L', '2026-09-02T10:00:00Z'),
];

describe('buildUsuals with hidden usuals', () => {
  it('offers every usual when none is hidden', () => {
    expect(buildUsuals(HISTORY, NOW).map((u) => u.key)).toEqual(['milk|3.2%', 'eggs|l']);
  });

  it('drops a hidden usual and keeps the rest', () => {
    expect(buildUsuals(HISTORY, NOW, 6, new Set(['milk|3.2%'])).map((u) => u.key)).toEqual(['eggs|l']);
  });

  it('lets the next-best usual take a hidden one’s place instead of leaving a gap', () => {
    const shelf = buildUsuals(HISTORY, NOW, 1, new Set(['milk|3.2%']));
    expect(shelf.map((u) => u.key)).toEqual(['eggs|l']);
  });

  it('ignores a hidden key that is not a usual', () => {
    expect(buildUsuals(HISTORY, NOW, 6, new Set(['bread|'])).map((u) => u.key)).toEqual(['milk|3.2%', 'eggs|l']);
  });

  it('is an empty shelf, not an error, when everything is hidden', () => {
    expect(buildUsuals(HISTORY, NOW, 6, new Set(['milk|3.2%', 'eggs|l']))).toEqual([]);
  });
});
