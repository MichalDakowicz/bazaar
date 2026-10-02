import { ScrollView, useWindowDimensions, View } from 'react-native';

import { Overline } from '@/components/ui/controls';
import { PickChip } from '@/components/ui/PickChip';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { EmptyState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useHouseholdCopy } from '@/features/household/copy';
import { PeopleFriendRow } from '@/features/household/PeopleFriendRow';
import { PeopleMembers } from '@/features/household/PeopleMembers';
import { usePeopleSheet } from '@/features/household/usePeopleSheet';
import { useIsDesktop } from '@/hooks/useResponsive';

/** How much of a phone's height the sheet's body may take before it scrolls. */
const PHONE_BODY_HEIGHT = 0.5;

/**
 * Put friends on your lists, and take them off. Pick which of your lists you
 * mean, then press + beside a friend; the sheet's one button only closes it,
 * because every change has already landed and can be undone from its toast.
 *
 * Friends come from Radar and are read-only here: Bazaar never makes or ends a
 * friendship, it only lets you put one onto a list.
 */
export function PeopleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const copy = useHouseholdCopy();
  const isDesktop = useIsDesktop();
  const { height } = useWindowDimensions();
  const sheet = usePeopleSheet(open);

  const noLists = sheet.owned.length === 0;

  const content = noLists ? (
    <EmptyState title={t.noListsTitle} body={t.noListsBody} />
  ) : (
    <View className="gap-5 pb-1 pt-4">
      <View className="gap-2">
        <Overline>{copy.whichLists}</Overline>
        <View className="flex-row flex-wrap gap-2">
          {sheet.owned.map((list) => (
            <PickChip key={list.id} label={list.name} selected={list.selected} onPress={() => sheet.toggle(list.id)} />
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Overline className="mb-0.5">{copy.friendsH}</Overline>
        {sheet.standings.length === 0 && !sheet.loadingFriends ? (
          <EmptyState title={t.noFriends} body={t.noFriendsBody} />
        ) : (
          sheet.standings.map((standing) => (
            <PeopleFriendRow
              key={standing.person.id}
              standing={standing}
              working={sheet.busy === standing.person.id}
              disabled={sheet.selectedCount === 0 || !!sheet.busy}
              onAdd={() => void sheet.add(standing)}
            />
          ))
        )}
      </View>

      <PeopleMembers lists={sheet.owned} busy={sheet.busy} onRemove={(list, member) => void sheet.remove(list, member)} />
    </View>
  );

  return (
    <SheetDialog
      open={open}
      title={t.addPersonTitle}
      body={t.addPersonBody}
      confirmLabel={copy.done}
      dismissLabel={t.back}
      onConfirm={onClose}
      onDismiss={onClose}
    >
      {/* The desktop card scrolls its own body; a phone's sheet does not, so a
          long friend list would push the buttons off the screen. */}
      {isDesktop ? (
        content
      ) : (
        <ScrollView style={{ maxHeight: height * PHONE_BODY_HEIGHT }} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      )}
    </SheetDialog>
  );
}
