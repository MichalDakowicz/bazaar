import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { COLORS } from '@/theme/colors';

/**
 * "Archived · 2" — a heading you can open. Archived lists are out of the way, not
 * gone, so there has to be somewhere to find them again; it stays shut until
 * asked so that tidying a list does not leave a pile on the Lists tab.
 */
export function ArchivedHeading({ count, open, onPress }: { count: number; open: boolean; onPress: () => void }) {
  const { t } = useLang();
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.archivedHeading(count)}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      className="flex-row items-center gap-1.5 self-start py-1 active:opacity-70"
    >
      <Chevron size={14} color={COLORS.muted} strokeWidth={2.4} />
      <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.archivedHeading(count)}</Text>
    </Pressable>
  );
}
