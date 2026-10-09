import { currentList, isGeneralList, shoppingTrips } from './currentList';
import type { BazaarList, Trip } from '@/types/bazaar';

const list = (id: string): BazaarList => ({
  id, ownerId: 'me', name: id, store: '', whenText: '', position: 0,
  createdAt: '', archivedAt: null, memberIds: ['me'],
});
const lists = [list('weekly'), list('general')];

it('keeps the selected sublist and its usual fallback when general mode is off', () => {
  const settings = { generalList: false, generalListId: 'general' };
  expect(currentList(lists, 'weekly', settings)?.id).toBe('weekly');
  expect(currentList(lists, 'gone', settings)?.id).toBe('weekly');
  expect(currentList([], null, settings)).toBeNull();
});

it('sends adds to General even when a different list was previously selected', () => {
  expect(currentList(lists, 'weekly', { generalList: true, generalListId: 'general' })?.id).toBe('general');
});

it('never sends items to a sublist when General was deleted or access was removed', () => {
  expect(currentList(lists, 'weekly', { generalList: true, generalListId: 'gone' })).toBeNull();
  expect(currentList(lists, 'weekly', { generalList: true, generalListId: null })).toBeNull();
});

it('removes trip controls only from General while its mode is enabled', () => {
  const settings = { generalList: true, generalListId: 'general' };
  expect(isGeneralList(settings, 'general')).toBe(true);
  expect(isGeneralList(settings, 'weekly')).toBe(false);
  expect(isGeneralList(settings, undefined)).toBe(false);
  expect(isGeneralList({ ...settings, generalList: false }, 'general')).toBe(false);
});

it('hides an existing General trip without changing stored trips or other lists', () => {
  const trip = (id: string, listId: string): Trip => ({
    id, listId, shopperId: 'me', store: '', startedAt: '', endedAt: null, itemCount: 0, skippedCount: 0,
  });
  const trips = [trip('old', 'general'), trip('other', 'weekly')];
  const settings = { generalList: true, generalListId: 'general' };
  expect(shoppingTrips(trips, settings)).toEqual([trips[1]]);
  expect(trips).toHaveLength(2);
  expect(shoppingTrips(trips, { ...settings, generalList: false })).toBe(trips);
});
