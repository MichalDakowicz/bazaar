import { useCallback, useMemo } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useLiveTrips } from '@/features/bazaar/useLiveTrips';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { viewList } from '@/lib/listModel';
import { justLines, listSections, type PlannerLine, type PlannerSection } from '@/lib/planner';
import type { BazaarList, ListItem } from '@/types/bazaar';

export type PlannerListModel = {
  name: string;
  /** "22 items · 6 in basket · Marta is shopping" */
  meta: string;
  total: number;
  just: PlannerLine[];
  sections: PlannerSection[];
  toggle: (line: PlannerLine) => void;
};

/**
 * The right-hand column: the list you are filling, cut into what you have just
 * put on it and the shop's sections. Read straight off the workspace cache —
 * a tick made on the phone in the aisle lands here through realtime.
 */
export function usePlannerList(list: BazaarList | null, items: ListItem[], justIds: readonly string[]): PlannerListModel | null {
  const { t, productLang } = useLang();
  const { me, nameOf } = useWorkspace();
  const { openFor } = useLiveTrips();
  const writes = useBazaarWrites();

  const view = useMemo(() => viewList(items, productLang), [items, productLang]);
  const trip = list ? openFor(list.id) : null;
  const shopper = !trip ? '' : trip.shopperId === me ? t.youShopping : t.isShopping(nameOf(trip.shopperId) ?? t.someone);

  const toggle = useCallback(
    (line: PlannerLine) => void (line.ticked ? writes.uncheck(line.item) : writes.check(line.item)),
    [writes],
  );

  return useMemo(() => {
    if (!list) return null;
    return {
      name: list.name,
      meta: [t.itemsCount(view.total), `${view.done} ${t.inBasket}`, shopper].filter(Boolean).join(' · '),
      total: view.total,
      just: justLines(items, justIds, productLang),
      sections: listSections(view, justIds, t.inBasketH, productLang),
      toggle,
    };
  }, [list, view, items, justIds, productLang, t, shopper, toggle]);
}
