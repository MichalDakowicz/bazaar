import { Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { useHouseholdCopy } from '@/features/household/copy';
import { Avatar } from '@/features/friends/Avatar';
import type { FriendStanding } from '@/features/household/householdModel';
import { COLORS } from '@/theme/colors';

/**
 * One friend in the people sheet. On every picked list already: a quiet tick.
 * Otherwise a round + that puts them on the lists they are missing from — and
 * nothing to press while no list is picked, because then there is nowhere to put
 * them.
 */
export function PeopleFriendRow({
  standing,
  working,
  disabled,
  onAdd,
}: {
  standing: FriendStanding;
  working: boolean;
  disabled: boolean;
  onAdd: () => void;
}) {
  const copy = useHouseholdCopy();
  const { person, onAll } = standing;

  return (
    <BazaarCard
      dense
      leading={<Avatar profile={person} size={36} />}
      title={person.displayName || person.username}
      subtitle={person.username ? `@${person.username}` : undefined}
      trailing={
        onAll ? (
          <Text className="px-2 text-base text-muted-foreground" accessibilityLabel={copy.alreadyOn}>
            ✓
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.addToPicked(person.displayName || person.username)}
            accessibilityState={{ disabled: disabled || working }}
            disabled={disabled || working}
            onPress={onAdd}
            hitSlop={6}
            className={['h-8 w-8 items-center justify-center rounded-full active:opacity-80', disabled ? 'bg-secondary' : 'bg-primary'].join(' ')}
          >
            {working ? (
              <ActivityIndicator size="small" color={COLORS.accentInk} />
            ) : (
              <Plus size={16} color={disabled ? COLORS.muted : COLORS.accentInk} strokeWidth={2.4} />
            )}
          </Pressable>
        )
      }
    />
  );
}
