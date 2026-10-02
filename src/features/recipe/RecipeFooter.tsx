import { Pressable, Text, View } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';

/**
 * Cancel, and the one button that does the thing — worded with its own sum
 * ("Add 2 · update 1") so there is no surprise about what pressing it writes.
 * With nothing ticked it stays, greyed, and says so.
 */
export function RecipeFooter({
  label,
  enabled,
  desktop,
  onApply,
  onCancel,
}: {
  label: string;
  enabled: boolean;
  desktop: boolean;
  onApply: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();

  return (
    <View className={desktop ? 'flex-row justify-end gap-2 pt-5' : 'flex-row gap-2 pt-3'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cancel}
        onPress={onCancel}
        className={['items-center rounded-full bg-secondary active:opacity-80', desktop ? 'px-[18px] py-2.5' : 'px-5 py-3.5'].join(' ')}
      >
        <Text className="text-sm font-semibold text-foreground">{t.cancel}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={onApply}
        className={[
          'items-center rounded-full active:opacity-80',
          desktop ? 'px-[18px] py-2.5' : 'flex-1 py-3.5',
          enabled ? 'bg-primary' : 'bg-secondary',
        ].join(' ')}
      >
        <Text className={['text-sm font-semibold', enabled ? 'text-primary-foreground' : 'text-muted-foreground'].join(' ')} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
