import { Pressable, Text } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';

/**
 * "Reuse" on a trip row: a quiet accent word, not a button-shaped button — it
 * sits at the right of a card whose whole job is to be read, and the tap target
 * is padded out so the word does not have to be hit exactly.
 */
export function ReuseButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { t } = useLang();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.reuse} · ${title}`}
      hitSlop={10}
      onPress={onPress}
      className="active:opacity-70"
    >
      <Text className="text-xs font-semibold text-primary">{t.reuse}</Text>
    </Pressable>
  );
}
