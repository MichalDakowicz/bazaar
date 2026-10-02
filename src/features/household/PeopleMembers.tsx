import { Pressable, Text, View } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { Overline } from '@/components/ui/controls';
import { Avatar } from '@/features/friends/Avatar';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useHouseholdCopy } from '@/features/household/copy';
import type { MemberModel, OwnedListModel } from '@/features/household/usePeopleSheet';

/**
 * Who is on each list I own, with a way to take them off. I appear as the owner
 * and have nothing to press: leaving your own list is deleting it, which lives
 * in the list's own sheet. A list with nobody else on it has nothing to say here.
 */
export function PeopleMembers({
  lists,
  busy,
  onRemove,
}: {
  lists: OwnedListModel[];
  busy: string | null;
  onRemove: (list: OwnedListModel, member: MemberModel) => void;
}) {
  const { t } = useLang();
  const copy = useHouseholdCopy();
  const shared = lists.filter((list) => list.members.some((member) => !member.isMe));

  if (shared.length === 0) return null;

  return (
    <View className="gap-2">
      <Overline>{t.members}</Overline>
      {shared.map((list) => (
        <View key={list.id} className="gap-1.5">
          <Text className="mt-1 text-sm font-semibold text-foreground" numberOfLines={1}>
            {list.name}
          </Text>
          {list.members.map((member) => (
            <BazaarCard
              key={member.id}
              dense
              leading={<Avatar profile={member.person} size={32} />}
              title={member.name}
              trailing={
                member.isMe ? (
                  <Text className="text-xs text-muted-foreground">{t.owner}</Text>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.removeFrom(member.name, list.name)}
                    disabled={!!busy}
                    onPress={() => onRemove(list, member)}
                    hitSlop={8}
                    className="active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-muted-foreground">{t.removeMember}</Text>
                  </Pressable>
                )
              }
            />
          ))}
        </View>
      ))}
    </View>
  );
}
