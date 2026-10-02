import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

/**
 * Delete everything Bazaar holds about you. It says what goes and what stays —
 * your lists go for everyone on them, the lists you were only a guest on lose
 * you, what you put on other people's lists stays on them — because "delete my
 * data" that quietly leaves a household's list without its owner is the kind
 * of surprise this sheet exists to prevent. Your account is Radar's, and stays.
 */
export function DeleteDataSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const writes = useBazaarWrites();
  const { say } = useToast();
  const setList = useBazaarPrefs((state) => state.setList);

  const confirm = async () => {
    if (!(await writes.deleteMyData())) return;
    setList(null);
    say(t.dataDeleted);
    onClose();
  };

  return (
    <SheetDialog
      open={open}
      title={t.deleteDataTitle}
      body={t.deleteDataBody}
      confirmLabel={t.deleteData}
      dismissLabel={t.cancel}
      tone="destructive"
      onConfirm={() => void confirm()}
      onDismiss={onClose}
    />
  );
}
