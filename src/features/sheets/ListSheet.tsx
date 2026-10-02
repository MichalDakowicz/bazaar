import { Pressable, Text, View } from 'react-native';

import { Field, Overline } from '@/components/ui/controls';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { useSheetDraft } from '@/features/sheets/useSheetDraft';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

/**
 * Make a list, or change one. The same fields either way — a name, where it is
 * bought, when — and none of them is more than a label: nothing sorts on the
 * shop or the day, so there is no picker to get wrong.
 *
 * Editing adds the two ways out of a list. The owner can delete it (which takes
 * its items and history with it, for everybody, so it asks first); anyone else
 * can leave it, which only takes them off.
 */
export function ListSheet({ open, listId, onClose }: { open: boolean; listId: string | null; onClose: () => void }) {
  const { t } = useLang();
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const setList = useBazaarPrefs((state) => state.setList);

  const editing = workspace.list(listId);
  const isOwner = editing ? editing.ownerId === workspace.me : true;

  const { values, set, confirming, setConfirming } = useSheetDraft(open, listId, {
    name: editing?.name ?? '',
    store: editing?.store ?? '',
    whenText: editing?.whenText ?? '',
  });
  const trimmed = values.name.trim();

  const save = async () => {
    if (!trimmed) return;
    const draft = { name: trimmed, store: values.store.trim(), whenText: values.whenText.trim() };
    if (editing) {
      await writes.updateList(editing.id, draft);
    } else {
      const id = await writes.createList(draft, workspace.lists.length);
      if (id) setList(id);
    }
    onClose();
  };

  const destroy = async () => {
    if (!editing) return;
    const done = isOwner ? await writes.removeList(editing.id) : await writes.leaveList(editing.id);
    if (done) {
      onClose();
      // The list that was current is gone; fall back to whichever is first.
      const fallback = workspace.lists.find((list) => list.id !== editing.id);
      setList(fallback?.id ?? null);
    }
  };

  const archive = async () => {
    if (!editing) return;
    await writes.archiveList(editing.id, true);
    onClose();
  };

  if (editing && confirming) {
    return (
      <SheetDialog
        open={open}
        title={isOwner ? t.deleteListTitle : t.leaveList}
        body={isOwner ? t.deleteListBody : undefined}
        confirmLabel={isOwner ? t.deleteList : t.leaveList}
        dismissLabel={t.cancel}
        tone="destructive"
        onConfirm={() => void destroy()}
        onDismiss={() => setConfirming(false)}
        onRequestClose={onClose}
      />
    );
  }

  return (
    <SheetDialog
      open={open}
      title={editing ? t.editList : t.newList}
      confirmLabel={editing ? t.save : t.create}
      confirmDisabledReason={trimmed ? null : t.listName}
      dismissLabel={editing ? (isOwner ? t.deleteList : t.leaveList) : t.cancel}
      onConfirm={() => void save()}
      onDismiss={() => (editing ? setConfirming(true) : onClose())}
      onRequestClose={onClose}
    >
      <View className="mt-4 gap-4">
        <View className="gap-1.5">
          <Overline>{t.listName}</Overline>
          <Field value={values.name} onChangeText={(name) => set({ name })} placeholder={t.listNamePh} autoFocus returnKeyType="next" maxLength={60} />
        </View>
        <View className="gap-1.5">
          <Overline>{t.listStore}</Overline>
          <Field value={values.store} onChangeText={(store) => set({ store })} placeholder={t.listStorePh} returnKeyType="next" maxLength={60} />
        </View>
        <View className="gap-1.5">
          <Overline>{t.listWhen}</Overline>
          <Field value={values.whenText} onChangeText={(whenText) => set({ whenText })} placeholder={t.listWhenPh} returnKeyType="done" maxLength={40} />
        </View>
        {editing && isOwner && (
          <Pressable accessibilityRole="button" accessibilityLabel={t.archive} onPress={() => void archive()} className="self-start active:opacity-70">
            <Text className="text-sm font-semibold text-muted-foreground">{t.archive}</Text>
          </Pressable>
        )}
      </View>
    </SheetDialog>
  );
}
