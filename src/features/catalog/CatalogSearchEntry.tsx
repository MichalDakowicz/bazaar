import { Search } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * The search field's lookalike. The Catalog tab does not search in place — the
 * Add screen is where a query becomes a product — so this is a button dressed
 * as the field it leads to, and a tap goes straight there.
 */
export function CatalogSearchEntry({ placeholder, onPress }: { placeholder: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      onPress={onPress}
      className="h-[46px] flex-row items-center gap-2.5 rounded-lg border border-input bg-secondary px-3 active:opacity-80"
    >
      <Search size={18} color={COLORS.muted} strokeWidth={2} />
      <Text className="min-w-0 flex-1 text-base text-muted-foreground" numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  );
}
