import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useLiveTrips } from '@/features/bazaar/useLiveTrips';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { viewList } from '@/lib/listModel';
import { useBazaarPrefs, useBazaarUi } from '@/store/bazaarPrefs';

export type ListRowModel = {
  id: string;
  name: string;
  whenText: string;
  percent: number;
  /** "Lidl · 3 of 19 in basket" / "Targ · 5 items". */
  meta: string;
  /** "Marta is shopping", or null when nobody is. */
  chip: string | null;
  onPress: () => void;
};

/**
 * The Lists tab's rows, and the line under its heading. All the derive logic is
 * here; the screen only lays it out (PING.md §13).
 */
export function useListsScreen() {
  const workspace = useWorkspace();
  const { t, productLang } = useLang();
  const { byList } = useLiveTrips();
  const router = useRouter();
  const setList = useBazaarPrefs((state) => state.setList);
  const open = useBazaarUi((state) => state.open);

  const rows = useMemo<ListRowModel[]>(
    () =>
      workspace.lists.map((list) => {
        const view = viewList(workspace.itemsOf(list.id), productLang);
        const trip = byList.get(list.id);
        const count = view.done > 0 ? t.basketOf(view.done, view.total) : t.itemsCount(view.total);
        return {
          id: list.id,
          name: list.name,
          whenText: list.whenText,
          percent: view.percent,
          meta: [list.store, count].filter(Boolean).join(' · '),
          chip: trip ? t.shoppingChip(workspace.nameOf(trip.shopperId) ?? t.someone) : null,
          onPress: () => {
            setList(list.id);
            router.navigate({ pathname: '/list/[id]', params: { id: list.id } });
          },
        };
      }),
    [workspace, productLang, t, byList, router, setList],
  );

  // Everyone else on any of my lists, once each.
  const others = useMemo(() => {
    const names = new Set<string>();
    for (const list of workspace.lists) {
      for (const id of list.memberIds) {
        const name = workspace.nameOf(id);
        if (name) names.add(name);
      }
    }
    return [...names];
  }, [workspace]);

  return {
    rows,
    meta: t.listsMeta(rows.length, others.join(', ')),
    loading: workspace.loading,
    error: workspace.error,
    refetch: workspace.refetch,
    newList: () => open({ kind: 'newList' }),
  };
}
