import { useCallback, useMemo, useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useFriends } from '@/features/bazaar/useFriends';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { useHouseholdCopy } from '@/features/household/copy';
import {
  effectiveSelection,
  friendStanding,
  memberIds,
  ownedLists,
  toggleSelection,
  type FriendStanding,
} from '@/features/household/householdModel';
import type { Person } from '@/types/bazaar';

export type MemberModel = { id: string; name: string; person: Person | null; isMe: boolean };

export type OwnedListModel = {
  id: string;
  name: string;
  selected: boolean;
  /** Everyone on it, me first. */
  members: MemberModel[];
};

/**
 * The people sheet: which of my lists I am working on, which friends are on
 * them, and who I can take off. Only lists I own appear — being on somebody
 * else's list gives no say over who else is.
 *
 * Every change is a write that lands straight away (the sheet's one button just
 * closes it), so each says what it did and can be taken back.
 */
export function usePeopleSheet(open: boolean) {
  const workspace = useWorkspace();
  const { friends, loading: loadingFriends } = useFriends();
  const writes = useBazaarWrites();
  const { say } = useToast();
  const { t } = useLang();
  const copy = useHouseholdCopy();

  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Every time the sheet opens it starts from "all my lists". Reset while
  // rendering, on the edge of `open`, rather than in an effect that would paint
  // the old selection for a frame first.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked(null);
  }

  const { lists, me, people, nameOf } = workspace;
  const owned = useMemo(() => ownedLists(lists, me), [lists, me]);
  const selectedIds = useMemo(() => effectiveSelection(owned, picked), [owned, picked]);

  const standings = useMemo<FriendStanding[]>(
    () => friends.map((friend) => friendStanding(friend, owned, selectedIds)),
    [friends, owned, selectedIds],
  );

  const ownedModels = useMemo<OwnedListModel[]>(
    () =>
      owned.map((list) => ({
        id: list.id,
        name: list.name,
        selected: selectedIds.includes(list.id),
        members: memberIds(list, me).map((id) => ({
          id,
          isMe: id === me,
          name: id === me ? t.you_ : (nameOf(id) ?? friends.find((friend) => friend.id === id)?.displayName ?? t.someone),
          person: people.get(id) ?? friends.find((friend) => friend.id === id) ?? null,
        })),
      })),
    [owned, selectedIds, me, people, nameOf, friends, t],
  );

  const toggle = useCallback((listId: string) => setPicked((current) => toggleSelection(owned, current, listId)), [owned]);

  const add = useCallback(
    async (standing: FriendStanding) => {
      const { person, missing } = standing;
      if (missing.length === 0 || busy) return;
      setBusy(person.id);
      const results = await Promise.all(missing.map((listId) => writes.addMember(listId, person.id)));
      setBusy(null);
      const added = missing.filter((_, index) => results[index]);
      if (added.length === 0) return;
      say(copy.addedTo(person.displayName, added.length), {
        label: t.undo,
        onPress: () => void Promise.all(added.map((listId) => writes.removeMember(listId, person.id))),
      });
    },
    [busy, writes, say, copy, t],
  );

  const remove = useCallback(
    async (list: OwnedListModel, member: MemberModel) => {
      if (busy) return;
      setBusy(`${list.id}:${member.id}`);
      const done = await writes.removeMember(list.id, member.id);
      setBusy(null);
      if (done) {
        say(copy.removedFrom(member.name, list.name), {
          label: t.undo,
          onPress: () => void writes.addMember(list.id, member.id),
        });
      }
    },
    [busy, writes, say, copy, t],
  );

  return {
    owned: ownedModels,
    selectedCount: selectedIds.length,
    standings,
    loadingFriends,
    busy,
    toggle,
    add,
    remove,
  };
}
