import { useCallback, useMemo } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import type { Product } from '@/lib/catalog';
import { findOnList } from '@/lib/listModel';
import { currentList } from '@/lib/currentList';
import { productName } from '@/lib/search';
import { useBazaarPrefs } from '@/store/bazaarPrefs';
import type { NewItem } from '@/types/bazaar';

/**
 * Where things get added, and how: the current list, the write, and the toast
 * that says what happened and takes it back.
 *
 * General mode always writes to its prepared account target. Separate-list
 * mode uses the last selected list (`useBazaarPrefs.listId`), or the first one.
 */
export function useAdder() {
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const { say } = useToast();
  const { t, productLang } = useLang();
  const { settings } = useBazaarSettings();
  const listId = useBazaarPrefs((state) => state.listId);
  const setList = useBazaarPrefs((state) => state.setList);

  const target = currentList(workspace.lists, listId, settings);
  const list = useMemo(
    () => target && settings.generalList ? { ...target, name: t.generalList } : target,
    [target, settings.generalList, t.generalList],
  );
  const items = workspace.itemsOf(list?.id);

  const add = useCallback(
    async (item: NewItem) => {
      if (!list) {
        say(t.noListToAdd);
        return null;
      }
      const ids = await writes.addItems(list.id, [item]);
      if (!ids) return null;
      const name = productName({ en: item.nameEn, pl: item.namePl }, productLang);
      const label = [name, item.opt, item.qty !== '1' ? item.qty : ''].filter(Boolean).join(' · ');
      say(t.added(label), { label: t.undo, onPress: () => void writes.removeItems(ids) });
      return ids;
    },
    [list, writes, say, t, productLang],
  );

  /** Several at once, one toast ("Pierogi ruskie · +2"). */
  const addMany = useCallback(
    async (batch: NewItem[]) => {
      if (!list) {
        say(t.noListToAdd);
        return null;
      }
      return writes.addItems(list.id, batch);
    },
    [list, writes, say, t],
  );

  const onList = useCallback((product: Pick<Product, 'id' | 'en'>) => findOnList(items, product), [items]);

  return { list, lists: workspace.lists, items, add, addMany, onList, setList, loading: workspace.loading };
}
