import { FileText } from 'lucide-react-native';
import { type Ref } from 'react';
import { Pressable, Text, View, type NativeSyntheticEvent, type TextInput, type TextInputKeyPressEventData } from 'react-native';

import { SearchInput } from '@/components/ui/SearchInput';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePlannerCopy } from '@/features/planner/copy';
import { COLORS } from '@/theme/colors';

/**
 * The planner's top row: the one search field and the recipe door. Esc empties
 * the field and closes the open product; Enter adds that product as configured —
 * so a line like "duże jajka" is typed, confirmed and gone without the mouse.
 */
export function PlannerSearchBar({
  inputRef,
  value,
  onChangeText,
  onEscape,
  onSubmit,
  onRecipe,
}: {
  inputRef: Ref<TextInput>;
  value: string;
  onChangeText: (text: string) => void;
  onEscape: () => void;
  onSubmit: () => void;
  onRecipe: () => void;
}) {
  const { t } = useLang();
  const copy = usePlannerCopy();

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const native = event.nativeEvent as TextInputKeyPressEventData & { isComposing?: boolean };
    if (native.isComposing) return;
    if (native.key === 'Escape') onEscape();
    else if (native.key === 'Enter') onSubmit();
  };

  return (
    <View className="flex-row gap-2.5">
      <View className="min-w-0 flex-1">
        <SearchInput
          inputRef={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={t.searchPh}
          clearLabel={copy.clearSearch}
          hint="Esc"
          height={44}
          onKeyPress={onKeyPress}
          // Enter adds; it must not also take the cursor out of the field.
          blurOnSubmit={false}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.pasteRecipe}
        onPress={onRecipe}
        className="h-11 flex-row items-center gap-2 rounded-full bg-secondary px-[18px] active:opacity-80"
      >
        <FileText size={16} color={COLORS.foreground} strokeWidth={2} />
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {t.pasteRecipe}
        </Text>
      </Pressable>
    </View>
  );
}
