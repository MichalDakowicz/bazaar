import { Trash2 } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { COLORS } from '@/theme/colors';

/** The outline pill beside the History heading that opens the delete-history sheet. */
export function ClearHistoryButton({ onPress }: { onPress: () => void }) {
  const { t } = useLang();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.clearHistory}
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full border border-border px-3.5 py-2 active:opacity-80"
    >
      <Trash2 size={15} color={COLORS.foreground} strokeWidth={2.2} />
      <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
        {t.clearHistory}
      </Text>
    </Pressable>
  );
}
