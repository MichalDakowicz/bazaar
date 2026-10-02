import { buildFeed } from '@/lib/feed';
import type { Activity, BazaarList, Person } from '@/types/bazaar';

import {
  effectiveSelection,
  feedSubtitle,
  feedText,
  feedWhen,
  friendStanding,
  liveSubtitle,
  memberIds,
  otherNames,
  ownedLists,
  productFirst,
  sharedCount,
  toggleSelection,
} from './householdModel';

const list = (id: string, ownerId: string, memberIds: string[]): BazaarList => ({
  id,
  ownerId,
  name: id,
  store: '',
  whenText: '',
  position: 0,
  createdAt: '2026-09-01T00:00:00Z',
  archivedAt: null,
  memberIds,
});

const person = (id: string): Person => ({ id, displayName: id, username: id, pfp: null });

describe('heading', () => {
  const names: Record<string, string> = { marta: 'Marta', anna: 'Anna' };
  const nameOf = (id: string) => names[id] ?? null;

  it('names everyone else once and skips me and the unknown', () => {
    const lists = [list('a', 'me', ['me', 'marta']), list('b', 'me', ['me', 'marta', 'anna']), list('c', 'me', ['me', 'ghost'])];
    expect(otherNames(lists, nameOf)).toEqual(['Marta', 'Anna']);
  });

  it('counts a list as shared when somebody else is on it', () => {
    expect(sharedCount([list('a', 'me', ['me']), list('b', 'me', ['me', 'marta']), list('c', 'marta', ['marta', 'me'])])).toBe(2);
    expect(sharedCount([])).toBe(0);
  });
});

describe('feed text', () => {
  const at = '2026-09-24T09:10:00Z';
  const activity = (id: string, en: string, pl: string, createdAt: string): Activity => ({
    id,
    listId: 'l1',
    actorId: 'marta',
    kind: 'added',
    detail: { nameEn: en, namePl: pl },
    createdAt,
  });
  const [row] = buildFeed([activity('1', 'Sour cream', 'Śmietana', at), activity('2', 'Dill', 'Koperek', '2026-09-24T09:12:00Z')]);

  it('puts the product names in the product language, the sentence in the app language', () => {
    expect(feedText(row, 'Marta', '', 'en', 'en')).toBe('Marta added Sour cream, Dill');
    expect(feedText(row, 'Marta', '', 'en', 'pl')).toBe('Marta added Śmietana, Koperek');
    expect(feedText(row, 'Marta', '', 'pl', 'en')).toBe('Marta — dodano: Sour cream, Dill');
    expect(feedText(row, 'Marta', '', 'pl', 'pl')).toBe('Marta — dodano: Śmietana, Koperek');
  });

  it('falls back to the other language when a name is missing', () => {
    const [bare] = buildFeed([activity('3', 'Dill', '', at)]);
    expect(feedText(bare, 'Marta', '', 'en', 'pl')).toBe('Marta added Dill');
  });

  it('does not touch a row that carries no products', () => {
    const done = buildFeed([{ id: 'd', listId: 'l1', actorId: 'marta', kind: 'shopping_done', detail: { itemCount: 3 }, createdAt: at }])[0];
    expect(productFirst(done, 'en', 'pl')).toBe(done);
    expect(feedText(done, 'Marta', '', 'en', 'pl')).toBe('Marta finished shopping · 3 items');
  });

  it('says who was added on a joined row', () => {
    const joined = buildFeed([{ id: 'j', listId: 'l1', actorId: 'anna', kind: 'joined', detail: { userId: 'marta' }, createdAt: at }])[0];
    expect(feedText(joined, 'Anna', 'Marta', 'en', 'en')).toBe('Anna added Marta');
  });
});

describe('feed lines', () => {
  const now = new Date('2026-09-24T12:00:00').getTime();

  it('shows the clock for today and the relative day after', () => {
    const today = new Date('2026-09-24T09:12:00').toISOString();
    const earlier = new Date('2026-09-22T09:12:00').toISOString();
    expect(feedWhen(today, now, 'en')).toBe('9:12');
    expect(feedWhen(earlier, now, 'en')).toBe('2d ago');
    expect(feedWhen(earlier, now, 'pl')).toBe('2 dni temu');
  });

  it('joins list and time, dropping what is empty', () => {
    const at = new Date('2026-09-24T09:12:00').toISOString();
    expect(feedSubtitle('Weekly shop', at, now, 'en')).toBe('Weekly shop · 9:12');
    expect(feedSubtitle('', at, now, 'en')).toBe('9:12');
  });

  it('describes a live trip with its length', () => {
    const started = new Date('2026-09-24T11:50:00').toISOString();
    expect(liveSubtitle('Weekly shop', 'Lidl', started, now)).toBe('Weekly shop · Lidl · 10 min');
    expect(liveSubtitle('Weekly shop', '', started, now)).toBe('Weekly shop · 10 min');
  });
});

describe('people sheet', () => {
  const mine1 = list('a', 'me', ['me', 'marta']);
  const mine2 = list('b', 'me', ['me']);
  const theirs = list('c', 'marta', ['marta', 'me']);
  const lists = [mine1, mine2, theirs];

  it('owns only the lists I made', () => {
    expect(ownedLists(lists, 'me').map((l) => l.id)).toEqual(['a', 'b']);
    expect(ownedLists(lists, null)).toEqual([]);
  });

  it('selects every owned list until a chip is touched', () => {
    const owned = ownedLists(lists, 'me');
    expect(effectiveSelection(owned, null)).toEqual(['a', 'b']);
    expect(toggleSelection(owned, null, 'a')).toEqual(['b']);
    expect(toggleSelection(owned, ['b'], 'a')).toEqual(['b', 'a']);
    expect(effectiveSelection(owned, ['b', 'gone'])).toEqual(['b']);
    expect(toggleSelection(owned, ['b'], 'b')).toEqual([]);
  });

  it('knows which picked lists a friend is still missing from', () => {
    const owned = ownedLists(lists, 'me');
    const marta = friendStanding(person('marta'), owned, ['a', 'b']);
    expect(marta.missing).toEqual(['b']);
    expect(marta.onAll).toBe(false);

    const onlyA = friendStanding(person('marta'), owned, ['a']);
    expect(onlyA.missing).toEqual([]);
    expect(onlyA.onAll).toBe(true);

    const anna = friendStanding(person('anna'), owned, ['a', 'b']);
    expect(anna.missing).toEqual(['a', 'b']);
  });

  it('is on nothing when nothing is picked', () => {
    const standing = friendStanding(person('marta'), ownedLists(lists, 'me'), []);
    expect(standing.onAll).toBe(false);
    expect(standing.missing).toEqual([]);
  });

  it('lists members with me first', () => {
    expect(memberIds(list('x', 'me', ['marta', 'anna', 'me']), 'me')).toEqual(['me', 'marta', 'anna']);
    expect(memberIds(list('x', 'marta', ['marta', 'anna']), 'me')).toEqual(['marta', 'anna']);
  });
});
