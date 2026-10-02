import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CategoryKey } from '@/lib/catalog/types';
import { mmkvStorage } from '@/lib/mmkvStorage';

/**
 * How you are looking at Bazaar right now.
 *
 * UI preference, so it lives in MMKV rather than on the account: which list you
 * were last standing in front of is not a fact about you, and it should survive
 * a cold start without a round trip.
 */
type PrefsState = {
  /** The list the Add screen, the web planner and "Add for Marta" write to. */
  listId: string | null;
  /** The section the web catalogue is showing. */
  catalogCat: CategoryKey;
  setList: (listId: string | null) => void;
  setCatalogCat: (cat: CategoryKey) => void;
};

export const useBazaarPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      listId: null,
      catalogCat: 'dairy',
      setList: (listId) => set({ listId }),
      setCatalogCat: (catalogCat) => set({ catalogCat }),
    }),
    { name: 'bazaar-prefs', storage: createJSONStorage(() => mmkvStorage), version: 1 },
  ),
);

/** One sheet at a time, opened from anywhere: the nav island, a row, a keyboard shortcut. */
export type SheetRequest =
  | { kind: 'newList' }
  | { kind: 'editList'; listId: string }
  | { kind: 'people' }
  | { kind: 'recipe' }
  | { kind: 'finish'; listId: string; tripId: string }
  | { kind: 'item'; itemId: string }
  | { kind: 'trip'; tripId: string }
  | { kind: 'hideUsual'; key: string; name: string }
  | { kind: 'clearHistory' }
  | { kind: 'deleteData' };

type UiState = {
  sheet: SheetRequest | null;
  open: (sheet: SheetRequest) => void;
  close: () => void;
  /**
   * Bumped by anything that wants the search field focused — the nav's Add
   * action on the web, the `/` key. The field watches the counter, so a request
   * made before the field has mounted is still honoured when it does.
   */
  searchRequests: number;
  requestSearch: () => void;
};

export const useBazaarUi = create<UiState>((set) => ({
  sheet: null,
  open: (sheet) => set({ sheet }),
  close: () => set({ sheet: null }),
  searchRequests: 0,
  requestSearch: () => set((state) => ({ searchRequests: state.searchRequests + 1 })),
}));
