import { MoreHorizontal } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * The three dots: where a row keeps what you can do to it besides tapping it —
 * edit, archive, remove. A long press does the same, but nobody finds a long
 * press by looking at the screen, and "how do I delete this" has to have an
 * answer you can see.
 */
export function MoreButton({ label, onPress, size = 18 }: { label: string; onPress: () => void; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      className="items-center justify-center rounded-full p-1 active:opacity-60"
    >
      <MoreHorizontal size={size} color={COLORS.muted} strokeWidth={2.2} />
    </Pressable>
  );
}
