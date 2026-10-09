import { useState } from 'react';
import { View } from 'react-native';

import { Field, Overline } from '@/components/ui/controls';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useListMode } from '@/features/bazaar/useListMode';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { ListActions } from '@/features/sheets/ListActions';
import { useSheetDraft } from '@/features/sheets/useSheetDraft';
import { toNewItem } from '@/lib/listModel';
import { useBazaarPrefs } from '@/store/bazaarPrefs';

/**
 * Make a list, or change one. The same fields either way — a name, where it is
 * bought, when — and none of them is more than a label: nothing sorts on the
 * shop or the day, so there is no picker to get wrong.
 *
 * Editing adds the ways out of a list. The owner can delete it (which takes
 * its items and history with it, for everybody, so it asks first); anyone else
 * can leave it, which only takes them off. Short of that: archive it and bring
 * it back, empty it, or wipe its feed (`ListActions`).
 */
export function ListSheet({ open, listId, onClose }: { open: boolean; listId: string | null; onClose: () => void }) {
  const { t } = useLang();
  const workspace = useWorkspace();
  const writes = useBazaarWrites();
  const mode = useListMode();
  const { say } = useToast();
  const setList = useBazaarPrefs((state) => state.setList);
  const [clearing, setClearing] = useState(false);

  const editing = workspace.list(listId);
  const isOwner = editing ? editing.ownerId === workspace.me : true;
  const isGeneral = !!editing && mode.settings.generalList && mode.settings.generalListId === editing.id;

  const { values, set, confirming, setConfirming } = useSheetDraft(open, listId, {
    name: editing?.name ?? '',
    store: editing?.store ?? '',
    whenText: editing?.whenText ?? '',
  });
  const trimmed = values.name.trim();

  // The feed confirmation is a second sheet with its own flag; a sheet closed
  // from behind must not reopen on it.
  const close = () => {
    setClearing(false);
    onClose();
  };

  const save = async () => {
    if (!trimmed) return;
    const draft = { name: trimmed, store: values.store.trim(), whenText: values.whenText.trim() };
    if (editing) {
      await writes.updateList(editing.id, draft);
    } else {
      const id = await writes.createList(draft, workspace.lists.length);
      if (id) setList(id);
    }
    close();
  };

  const destroy = async () => {
    if (!editing) return;
    if (isGeneral && !(await mode.change(false))) return;
    const done = isOwner ? await writes.removeList(editing.id) : await writes.leaveList(editing.id);
    if (done) {
      close();
      // The list that was current is gone; fall back to whichever is first.
      const fallback = workspace.lists.find((list) => list.id !== editing.id);
      setList(fallback?.id ?? null);
    }
  };

  const archive = async () => {
    if (!editing) return;
    if (isGeneral && !(await mode.change(false))) return;
    await writes.archiveList(editing.id, true);
    close();
  };

  const restore = async () => {
    if (!editing) return;
    if (await writes.archiveList(editing.id, false)) say(t.restored(editing.name));
    close();
  };

  const empty = async () => {
    if (!editing) return;
    const items = workspace.itemsOf(editing.id);
    if (items.length === 0) {
      say(t.nothingToEmpty);
      return;
    }
    const done = await writes.removeItems(items.map((item) => item.id));
    if (done) {
      say(t.emptied(items.length), { label: t.undo, onPress: () => void writes.addItems(editing.id, items.map(toNewItem)) });
      close();
    }
  };

  const clearActivity = async () => {
    if (!editing) return;
    if (await writes.clearActivity(editing.id)) say(t.activityCleared);
    close();
  };

  if (editing && clearing) {
    return (
      <SheetDialog
        open={open}
        title={t.clearActivityTitle}
        body={t.clearActivityBody}
        confirmLabel={t.clearActivity}
        dismissLabel={t.cancel}
        tone="destructive"
        onConfirm={() => void clearActivity()}
        onDismiss={() => setClearing(false)}
        onRequestClose={close}
      />
    );
  }

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
        onRequestClose={close}
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
      onDismiss={() => (editing ? setConfirming(true) : close())}
      onRequestClose={close}
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
        {editing && (
          <ListActions
            archived={editing.archivedAt !== null}
            isOwner={isOwner}
            hasItems={workspace.itemsOf(editing.id).length > 0}
            onArchive={() => void archive()}
            onRestore={() => void restore()}
            onEmpty={() => void empty()}
            onClearActivity={() => setClearing(true)}
          />
        )}
      </View>
    </SheetDialog>
  );
}
