import { Pressable, ScrollView, Text, View } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import type { RecipeLine } from '@/features/recipe/recipeLines';
import { RecipeRows } from '@/features/recipe/RecipeRows';

/**
 * What was found, as a scrolling plan under its own heading. The footer is not
 * in here: a long recipe scrolls, the buttons do not.
 */
export function RecipeResults({
  lines,
  hasList,
  desktop,
  onToggle,
  onClose,
}: {
  lines: RecipeLine[];
  hasList: boolean;
  desktop: boolean;
  onToggle: (raw: string) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const found = lines.length;

  return (
    <View className="min-h-0 flex-1">
      {desktop ? (
        <View className="flex-row items-baseline gap-2.5 pb-4">
          <Text className="flex-1 text-lg font-bold text-foreground" numberOfLines={1}>
            {found > 0 ? t.foundIngredients(found) : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
            hitSlop={8}
            onPress={onClose}
            className="active:opacity-70"
          >
            <Text className="text-xs text-muted-foreground">Esc</Text>
          </Pressable>
        </View>
      ) : (
        found > 0 && (
          <Text className="pb-2 pt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground" numberOfLines={1}>
            {t.foundIngredients(found)}
          </Text>
        )
      )}
      <ScrollView
        className="min-h-0 flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {found > 0 ? (
          <RecipeRows lines={lines} onToggle={onToggle} />
        ) : (
          <Text className="px-4 py-10 text-center text-sm text-muted-foreground">
            {hasList ? t.recipeEmpty : t.noListToAdd}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
