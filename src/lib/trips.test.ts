import type { Trip } from '@/types/bazaar';

import { finishedTrips, historySections, tripMeta } from './trips';
import { clock, dayLabel, relative, startOfWeek } from './when';

function trip(id: string, ended: string | null, over: Partial<Trip> = {}): Trip {
  return {
    id, listId: 'l1', shopperId: 'u1', store: 'Lidl', startedAt: ended ?? '2026-09-24T09:00:00',
    endedAt: ended, itemCount: 19, skippedCount: 0, ...over,
  };
}

// Wednesday 24 September 2026, midday, local time.
const NOW = new Date('2026-09-24T12:00:00').getTime();

describe('historySections', () => {
  it('puts this week first, then the earlier weeks of the month by name', () => {
    const sections = historySections(
      [
        trip('old', '2026-09-10T18:00:00'),
        trip('wed', '2026-09-23T18:00:00'),
        trip('mon', '2026-09-21T18:00:00'),
        trip('sat', '2026-09-19T11:00:00'),
        trip('aug', '2026-08-30T11:00:00'),
      ],
      NOW,
      'en',
    );
    expect(sections.map((s) => s.title)).toEqual(['This week', 'Earlier in September', 'Earlier in August']);
    expect(sections[0].trips.map((t) => t.id)).toEqual(['wed', 'mon']);
    expect(sections[1].trips.map((t) => t.id)).toEqual(['sat', 'old']);
  });

  it('writes the headings in Polish', () => {
    expect(historySections([trip('a', '2026-09-10T18:00:00')], NOW, 'pl')[0].title).toBe('Wcześniej we wrześniu');
  });

  it('adds the year to a month from another year', () => {
    expect(historySections([trip('a', '2025-12-10T18:00:00')], NOW, 'en')[0].title).toBe('Earlier in December 2025');
  });

  it('ignores a trip that is still open', () => {
    expect(finishedTrips([trip('open', null)])).toEqual([]);
  });
});

describe('tripMeta', () => {
  it('says what a history row says', () => {
    expect(tripMeta(trip('a', '2026-09-23T18:00:00', { skippedCount: 2 }), 'Marta', 'en')).toBe(
      'Wed 23 · Lidl · Marta · 19 items · 2 skipped',
    );
    expect(tripMeta(trip('a', '2026-09-20T18:00:00', { store: '', itemCount: 1 }), 'you', 'en')).toBe('Sun 20 · you · 1 item');
  });
});

describe('when', () => {
  it('finds Monday', () => {
    expect(new Date(startOfWeek(NOW)).getDate()).toBe(21);
    expect(new Date(startOfWeek(new Date('2026-09-27T23:59:00').getTime())).getDate()).toBe(21);
  });

  it('formats a day and a clock', () => {
    expect(dayLabel('2026-09-24T09:12:00', 'en')).toBe('Thu 24');
    expect(dayLabel('2026-09-24T09:12:00', 'pl')).toBe('czw. 24');
    expect(clock('2026-09-24T09:05:00')).toBe('9:05');
  });

  it('counts time the way PING.md §12 does', () => {
    const at = (ms: number) => new Date(NOW - ms).toISOString();
    expect(relative(at(30_000), NOW, 'en')).toBe('Just now');
    expect(relative(at(12 * 60_000), NOW, 'en')).toBe('12m ago');
    expect(relative(at(5 * 3_600_000), NOW, 'en')).toBe('5h ago');
    expect(relative(at(3 * 86_400_000), NOW, 'en')).toBe('3d ago');
    expect(relative(at(30 * 86_400_000), NOW, 'en')).toMatch(/^\w+ \d+$/);
    expect(relative(at(12 * 60_000), NOW, 'pl')).toBe('12 min temu');
  });
});
