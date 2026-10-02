import { Pressable, Text } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';

/** "Restore" on an archived list's row — the same quiet accent word as Reuse in History. */
export function RestoreButton({ name, onPress }: { name: string; onPress: () => void }) {
  const { t } = useLang();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.restore} · ${name}`}
      hitSlop={10}
      onPress={onPress}
      className="active:opacity-70"
    >
      <Text className="text-xs font-semibold text-primary">{t.restore}</Text>
    </Pressable>
  );
}
