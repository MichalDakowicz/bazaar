import { Search, X } from 'lucide-react-native';
import { useState, type Ref } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { ANDROID_METRICS } from '@/components/ui/controls';
import { webFocusRing } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

/**
 * The one search field (PING.md §9.7): a glyph, the text, and a way to clear it.
 * Every text field in the app that is a search goes through this, so the Android
 * metric fix and the web focus ring live in exactly one place.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder,
  inputRef,
  clearLabel = 'Clear',
  hint,
  height = 46,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  inputRef?: Ref<TextInput>;
  clearLabel?: string;
  /** A small keycap on the right while there is text to clear: "Esc". */
  hint?: string;
  height?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className="flex-row items-center gap-2.5 rounded-lg border border-input bg-secondary px-3"
      style={[{ height }, webFocusRing(focused)]}
    >
      <Search size={18} color={COLORS.muted} strokeWidth={2} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="min-w-0 flex-1 p-0 text-foreground"
        style={[{ fontSize: 16, lineHeight: undefined }, ANDROID_METRICS, { outlineStyle: 'none' } as never]}
        {...props}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={8}
          onPress={() => onChangeText('')}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          {hint ? <Text className="text-xs text-muted-foreground">{hint}</Text> : <X size={18} color={COLORS.muted} strokeWidth={2} />}
        </Pressable>
      )}
    </View>
  );
}
