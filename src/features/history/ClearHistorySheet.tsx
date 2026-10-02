import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useDeletableTrips } from '@/features/history/useDeletableTrips';

/**
 * Delete History in one go: every finished trip you shopped or own the list of.
 * Says how many before it does it, and what it leaves — lists, and what is still
 * on them, are untouched. The count it reports afterwards is the server's, since
 * the server is the one that decides what it may take.
 */
export function ClearHistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const deletable = useDeletableTrips();
  const writes = useBazaarWrites();
  const { say } = useToast();

  const confirm = async () => {
    const taken = await writes.removeTrips(deletable.map((trip) => trip.id));
    if (taken === null) return;
    say(t.historyCleared(taken));
    onClose();
  };

  return (
    <SheetDialog
      open={open}
      title={t.clearHistoryTitle}
      body={t.clearHistoryBody(deletable.length)}
      confirmLabel={t.clearHistory}
      confirmDisabledReason={deletable.length === 0 ? t.clearHistoryBody(0) : null}
      dismissLabel={t.cancel}
      tone="destructive"
      onConfirm={() => void confirm()}
      onDismiss={onClose}
    />
  );
}
