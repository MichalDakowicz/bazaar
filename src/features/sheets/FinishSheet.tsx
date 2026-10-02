import { useToast } from '@/components/ui/Toast';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { viewList } from '@/lib/listModel';

/**
 * End a trip. The confirm says both numbers out loud — what goes to History and
 * what stays on the list — because the difference between "I got everything" and
 * "I forgot the milk" is the whole reason there is a basket.
 */
export function FinishSheet({
  open,
  listId,
  tripId,
  onClose,
}: {
  open: boolean;
  listId: string | null;
  tripId: string | null;
  onClose: () => void;
}) {
  const { t, productLang } = useLang();
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const { say } = useToast();

  const view = viewList(workspace.itemsOf(listId), productLang);

  const finish = async () => {
    if (!tripId) return;
    const done = await writes.finishTrip(tripId);
    onClose();
    if (done) say(t.tripDone(view.done));
  };

  return (
    <SheetDialog
      open={open}
      title={t.finishTitle}
      body={t.finishBody(view.done, view.left)}
      confirmLabel={t.finishShopping}
      dismissLabel={t.stillShopping}
      onConfirm={() => void finish()}
      onDismiss={onClose}
    />
  );
}
