import { useState } from 'react';
import { Text, View } from 'react-native';

import { Field } from '@/components/ui/controls';
import { useLang } from '@/features/bazaar/useBazaarSettings';

/** Height of the paste box when it does not fill its column (the phone sheet). */
const COMPACT_HEIGHT = 132;
const MIN_FILL_HEIGHT = 140;

/**
 * The paste box and the words above it. On a wide window the box takes whatever
 * height its column has left — measured, because `Field` wraps its input in a
 * plain View that a flex child cannot stretch — and on a phone it is a fixed
 * strip so the plan stays in view beneath it.
 */
export function RecipeInput({
  value,
  onChange,
  fill,
  autoFocus,
}: {
  value: string;
  onChange: (text: string) => void;
  fill: boolean;
  autoFocus: boolean;
}) {
  const { t } = useLang();
  const [space, setSpace] = useState(0);

  return (
    <View className={fill ? 'min-h-0 flex-1 gap-4' : 'gap-3'}>
      <View>
        <Text className="text-lg font-bold text-foreground">{t.pasteRecipe}</Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">{t.recipeSub}</Text>
      </View>
      <View
        className={fill ? 'min-h-0 flex-1' : ''}
        onLayout={fill ? (event) => setSpace(Math.floor(event.nativeEvent.layout.height)) : undefined}
      >
        <Field
          multiline
          autoFocus={autoFocus}
          accessibilityLabel={t.pasteRecipe}
          value={value}
          onChangeText={onChange}
          placeholder={t.recipePh}
          style={{ height: fill ? Math.max(space, MIN_FILL_HEIGHT) : COMPACT_HEIGHT, textAlignVertical: 'top', paddingTop: 14 }}
        />
      </View>
    </View>
  );
}
