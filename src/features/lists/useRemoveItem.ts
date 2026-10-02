import { useCallback } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { itemName, toNewItem } from '@/lib/listModel';
import type { ListItem } from '@/types/bazaar';

/**
 * Take one item off a list, with an Undo that puts it back. The one place that
 * does it, so the row's menu, the item sheet and the planner cannot disagree
 * about what "remove" leaves behind: a ticked item comes back unticked, which is
 * as close as a delete can get without keeping the row around.
 */
export function useRemoveItem() {
  const writes = useBazaarWrites();
  const { say } = useToast();
  const { t, productLang } = useLang();

  return useCallback(
    async (item: ListItem) => {
      const done = await writes.removeItems([item.id]);
      if (!done) return false;
      say(`${itemName(item, productLang)} · ${t.removed}`, {
        label: t.undo,
        onPress: () => void writes.addItems(item.listId, [toNewItem(item)]),
      });
      return true;
    },
    [writes, say, productLang, t],
  );
}
