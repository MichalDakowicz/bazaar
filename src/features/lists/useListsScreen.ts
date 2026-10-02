import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
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
  /** The list's own menu: rename, archive, empty, delete or leave. */
  edit: () => void;
};

export type ArchivedRowModel = {
  id: string;
  name: string;
  /** "Lidl · 3 items" */
  meta: string;
  restore: () => void;
  edit: () => void;
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
  const writes = useBazaarWrites();
  const { say } = useToast();

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
          edit: () => open({ kind: 'editList', listId: list.id }),
        };
      }),
    [workspace, productLang, t, byList, router, setList, open],
  );

  // Out of the Lists tab but not gone: one tap back, or the same menu to delete it for good.
  const archived = useMemo<ArchivedRowModel[]>(
    () =>
      workspace.archived.map((list) => ({
        id: list.id,
        name: list.name,
        meta: [list.store, t.itemsCount(workspace.itemsOf(list.id).length)].filter(Boolean).join(' · '),
        restore: () => void writes.archiveList(list.id, false).then((done) => done && say(t.restored(list.name))),
        edit: () => open({ kind: 'editList', listId: list.id }),
      })),
    [workspace, t, writes, say, open],
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
    archived,
    meta: t.listsMeta(rows.length, others.join(', ')),
    loading: workspace.loading,
    error: workspace.error,
    refetch: workspace.refetch,
    newList: () => open({ kind: 'newList' }),
  };
}
