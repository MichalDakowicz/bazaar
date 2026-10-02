import { Pressable, Text } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * The universal selection chip (PING.md §9.6): fully round, an accent hairline
 * and soft accent ground when chosen, a quiet ground when not. A chip has no
 * border until it is selected, so a wrap of them reads as one cloud of words
 * rather than a row of boxes.
 */
export function PickChip({
  label,
  selected,
  onPress,
  minWidth,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  minWidth?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center justify-center rounded-full border px-3 py-1.5 active:opacity-80"
      style={{
        minWidth,
        borderColor: selected ? COLORS.accent : 'transparent',
        backgroundColor: selected ? COLORS.accentSoft : COLORS.chipGround,
      }}
    >
      <Text className={['text-sm', selected ? 'font-semibold text-primary' : 'text-foreground'].join(' ')} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
