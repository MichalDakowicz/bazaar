import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';

/**
 * Stop offering one usual. Usuals are worked out from what you have bought, so
 * there is nothing to delete — only a refusal to keep. Hiding it says so and
 * offers Undo; Settings can bring every hidden usual back.
 */
export function HideUsualSheet({
  open,
  usual,
  onClose,
}: {
  open: boolean;
  usual: { key: string; name: string } | null;
  onClose: () => void;
}) {
  const { t } = useLang();
  const writes = useBazaarWrites();
  const { say } = useToast();

  const confirm = async () => {
    if (!usual) return;
    const { key, name } = usual;
    if (await writes.hideUsual(key)) {
      say(t.usualHidden(name), { label: t.undo, onPress: () => void writes.showUsuals([key]) });
      onClose();
    }
  };

  return (
    <SheetDialog
      open={open && !!usual}
      title={t.hideUsualTitle(usual?.name ?? '')}
      body={t.hideUsualBody}
      confirmLabel={t.hideUsual}
      dismissLabel={t.keep}
      onConfirm={() => void confirm()}
      onDismiss={onClose}
    />
  );
}
