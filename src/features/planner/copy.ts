import { useLang } from '@/features/bazaar/useBazaarSettings';

/** What only the web planner says. Everything shared with the phone lives in lib/i18n. */
const en = {
  showMore: (n: number) => `Show ${n} more`,
  onListNote: (list: string) => `On ${list}`,
  fromWord: (word: string) => `from “${word}”`,
  clearSearch: 'Clear search',
  closeOptions: 'Close options',
  addNamed: (name: string) => `Add ${name}`,
  optionsFor: (name: string) => `Options for ${name}`,
  alreadyOn: (name: string) => `${name} is on the list`,
  tick: (name: string) => `Tick off ${name}`,
  untick: (name: string) => `Put ${name} back`,
  emptyBody: 'Search, or pick a section, and add the first thing.',
  noListsBody: 'Make your first list, then fill it from here.',
};

const pl: typeof en = {
  showMore: (n) => `Pokaż jeszcze ${n}`,
  onListNote: (list) => `Na liście ${list}`,
  fromWord: (word) => `z „${word}”`,
  clearSearch: 'Wyczyść wyszukiwanie',
  closeOptions: 'Zamknij opcje',
  addNamed: (name) => `Dodaj ${name}`,
  optionsFor: (name) => `Opcje: ${name}`,
  alreadyOn: (name) => `${name} jest już na liście`,
  tick: (name) => `Odhacz ${name}`,
  untick: (name) => `Cofnij odhaczenie: ${name}`,
  emptyBody: 'Wyszukaj lub wybierz dział i dodaj pierwszą rzecz.',
  noListsBody: 'Zrób pierwszą listę, a potem uzupełniaj ją stąd.',
};

export function usePlannerCopy() {
  return useLang().appLang === 'pl' ? pl : en;
}
