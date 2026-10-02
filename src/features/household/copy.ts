import { useLang } from '@/features/bazaar/useBazaarSettings';
import { pl3 } from '@/lib/i18nHelpers';

/**
 * The words only the Household tab, the live trip and the people sheet say. The
 * ones they share with the rest of the app (Household, Today, Live, Add someone…)
 * are in the main dictionary and come from `useLang().t`.
 */
const en = {
  tripGoneTitle: 'Nothing live here',
  tripGoneBody: 'That shopping trip is not around any more.',
  nothingPicked: 'Nothing in the basket yet',
  done: 'Done',
  whichLists: 'Which lists',
  pickAList: 'Pick a list to add people to',
  friendsH: 'Friends',
  alreadyOn: 'On the picked lists already',
  addToPicked: (name: string) => `Add ${name} to the picked lists`,
  removeFrom: (name: string, list: string) => `Remove ${name} from ${list}`,
  addedTo: (name: string, lists: number) => `${name} added to ${lists} ${lists === 1 ? 'list' : 'lists'}`,
  removedFrom: (name: string, list: string) => `${name} removed from ${list}`,
};

const pl: typeof en = {
  tripGoneTitle: 'Nic na żywo',
  tripGoneBody: 'Tych zakupów już nie ma.',
  nothingPicked: 'Koszyk jest jeszcze pusty',
  done: 'Gotowe',
  whichLists: 'Które listy',
  pickAList: 'Wybierz listę, do której dodajesz',
  friendsH: 'Znajomi',
  alreadyOn: 'Już na wybranych listach',
  addToPicked: (name) => `Dodaj ${name} do wybranych list`,
  removeFrom: (name, list) => `Usuń ${name} z listy ${list}`,
  addedTo: (name, lists) => `Dodano ${name} do ${lists} ${pl3(lists, 'listy', 'list', 'list')}`,
  removedFrom: (name, list) => `Usunięto ${name} z listy ${list}`,
};

export function useHouseholdCopy() {
  return useLang().appLang === 'pl' ? pl : en;
}
