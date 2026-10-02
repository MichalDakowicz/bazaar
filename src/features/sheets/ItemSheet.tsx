import { View } from 'react-native';

import { Field, Overline } from '@/components/ui/controls';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { useRemoveItem } from '@/features/lists/useRemoveItem';
import { useSheetDraft } from '@/features/sheets/useSheetDraft';
import { itemAlt, itemName } from '@/lib/listModel';

/**
 * One item, changed or taken off. The amount and the details are free text
 * because that is what they are on the row — "2 kg", "3.2% · Lactose-free" —
 * and the secondary button removes it outright: it has an Undo, so there is no
 * second "are you sure" between you and a list you want shorter.
 */
export function ItemSheet({ open, itemId, onClose }: { open: boolean; itemId: string | null; onClose: () => void }) {
  const { t, productLang } = useLang();
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const removeItem = useRemoveItem();

  const item = itemId ? (workspace.items.find((candidate) => candidate.id === itemId) ?? null) : null;
  const { values, set } = useSheetDraft(open, itemId, { qty: item?.qty ?? '', opt: item?.opt ?? '' });

  const save = async () => {
    if (!item) return;
    const done = await writes.updateItem(item.id, { qty: values.qty.trim() || '1', opt: values.opt.trim() });
    if (done) onClose();
  };

  const remove = async () => {
    if (!item) return;
    if (await removeItem(item)) onClose();
  };

  // Gone while the sheet was up — somebody else took it off the list.
  if (open && !item) return null;

  const name = item ? itemName(item, productLang) : '';
  const alt = item ? itemAlt(item, productLang) : '';

  return (
    <SheetDialog
      open={open}
      title={name || t.editItem}
      body={alt || undefined}
      confirmLabel={t.save}
      dismissLabel={t.removeItem}
      onConfirm={() => void save()}
      onDismiss={() => void remove()}
      onRequestClose={onClose}
    >
      <View className="mt-4 gap-4">
        <View className="gap-1.5">
          <Overline>{t.itemQty}</Overline>
          <Field value={values.qty} onChangeText={(qty) => set({ qty })} placeholder={t.itemQtyPh} returnKeyType="next" maxLength={40} />
        </View>
        <View className="gap-1.5">
          <Overline>{t.itemDetails}</Overline>
          <Field value={values.opt} onChangeText={(opt) => set({ opt })} placeholder={t.itemDetailsPh} returnKeyType="done" maxLength={80} />
        </View>
      </View>
    </SheetDialog>
  );
}
