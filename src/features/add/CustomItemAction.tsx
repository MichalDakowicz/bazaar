import { Pressable, Text, View } from 'react-native';

/** An explicit way to keep the typed name instead of choosing a catalogue result. */
export function CustomItemAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View className="mt-3 items-start">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className="rounded-full bg-secondary px-4 py-2 active:opacity-80"
      >
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{label}</Text>
      </Pressable>
    </View>
  );
}
