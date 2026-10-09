import { useEffect, useRef } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useListMode } from '@/features/bazaar/useListMode';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { ListScreen } from '@/features/lists/ListScreen';
import { ListsScreen } from '@/features/lists/ListsScreen';
import { PlannerScreen } from '@/features/planner/PlannerScreen';
import { useIsDesktop } from '@/hooks/useResponsive';
import { currentList } from '@/lib/currentList';
import { readError } from '@/lib/utils';

/** Home embeds the shopping list with the tab shell's Add island. */
export function ListsHome() {
  const desktop = useIsDesktop();
  const { t } = useLang();
  const mode = useListMode();
  const workspace = useWorkspace();
  const attempted = useRef<string | null>(null);
  const list = currentList(workspace.lists, null, mode.settings);
  const repairKey = mode.settings.generalList ? `${workspace.me}:${mode.settings.generalListId}` : null;

  // A deletion or revoked membership on another device must not redirect adds
  // to some other list. The same idempotent transaction prepares a replacement.
  useEffect(() => {
    if (!repairKey) attempted.current = null;
    if (!repairKey || list || workspace.loading || workspace.error || mode.loading || mode.error || mode.busy) return;
    if (attempted.current === repairKey) return;
    attempted.current = repairKey;
    void mode.change(true);
  }, [repairKey, list, workspace.loading, workspace.error, mode]);

  if (mode.loading || mode.busy) return <LoadingState />;
  if (mode.error) return <ErrorState message={readError(mode.error)} onRetry={() => void mode.refetch()} />;
  if (mode.settings.generalList && !list) {
    if (workspace.loading) return <LoadingState />;
    return <ErrorState message={workspace.error ? readError(workspace.error) : t.generalListUnavailable} onRetry={() => void mode.change(true)} />;
  }
  if (desktop) return <PlannerScreen />;
  return mode.settings.generalList && list
    ? <ListScreen listId={list.id} pushed={false} title={t.generalList} />
    : <ListsScreen />;
}
