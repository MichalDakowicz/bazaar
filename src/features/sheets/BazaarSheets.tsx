import { HideUsualSheet } from '@/features/catalog/HideUsualSheet';
import { ClearHistorySheet } from '@/features/history/ClearHistorySheet';
import { TripSheet } from '@/features/history/TripSheet';
import { FinishSheet } from '@/features/sheets/FinishSheet';
import { ItemSheet } from '@/features/sheets/ItemSheet';
import { ListSheet } from '@/features/sheets/ListSheet';
import { PeopleSheet } from '@/features/household/PeopleSheet';
import { RecipeDialog } from '@/features/recipe/RecipeDialog';
import { DeleteDataSheet } from '@/features/settings/DeleteDataSheet';
import { useBazaarUi } from '@/store/bazaarPrefs';

/**
 * Every sheet in the app, mounted once in the tabs layout and opened by writing
 * a request into `useBazaarUi`.
 *
 * One instance each, globally: the sidebar's New list, a list's own menu and a
 * screen's empty state all open the *same* sheet, rather than three copies
 * fighting over one modal slot (PING.md §9.8). This file is only the registrar —
 * each sheet's markup lives with its feature.
 */
export function BazaarSheets() {
  const sheet = useBazaarUi((state) => state.sheet);
  const close = useBazaarUi((state) => state.close);

  return (
    <>
      <ListSheet
        open={sheet?.kind === 'newList' || sheet?.kind === 'editList'}
        listId={sheet?.kind === 'editList' ? sheet.listId : null}
        onClose={close}
      />
      <ItemSheet open={sheet?.kind === 'item'} itemId={sheet?.kind === 'item' ? sheet.itemId : null} onClose={close} />
      <FinishSheet
        open={sheet?.kind === 'finish'}
        listId={sheet?.kind === 'finish' ? sheet.listId : null}
        tripId={sheet?.kind === 'finish' ? sheet.tripId : null}
        onClose={close}
      />
      <TripSheet open={sheet?.kind === 'trip'} tripId={sheet?.kind === 'trip' ? sheet.tripId : null} onClose={close} />
      <ClearHistorySheet open={sheet?.kind === 'clearHistory'} onClose={close} />
      <HideUsualSheet
        open={sheet?.kind === 'hideUsual'}
        usual={sheet?.kind === 'hideUsual' ? { key: sheet.key, name: sheet.name } : null}
        onClose={close}
      />
      <DeleteDataSheet open={sheet?.kind === 'deleteData'} onClose={close} />
      <PeopleSheet open={sheet?.kind === 'people'} onClose={close} />
      <RecipeDialog open={sheet?.kind === 'recipe'} onClose={close} />
    </>
  );
}
