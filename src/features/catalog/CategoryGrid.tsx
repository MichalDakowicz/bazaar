import { Pressable, Text, View } from 'react-native';

import { GlyphDisc } from '@/components/media/GlyphDisc';
import type { CategoryKey } from '@/lib/catalog/types';

export type CategoryTile = {
  key: CategoryKey;
  name: string;
  /** "12 products" — spoken, not printed. */
  label: string;
  count: number;
  open: () => void;
};

/**
 * The ten shop sections as a three-column grid of round glyphs — the catalogue's
 * front door. Hairlines above and below, no card: the discs are the artwork.
 */
export function CategoryGrid({ title, categories }: { title: string; categories: CategoryTile[] }) {
  return (
    // The cells carry their own bottom gap, so the section's end padding is
    // what is left of the 24 once the last row's 22 is counted.
    <View className="mt-6 border-y border-border/50 px-4 pb-0.5 pt-[22px]">
      <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</Text>
      <View className="-mx-1 flex-row flex-wrap">
        {categories.map((category) => (
          <Pressable
            key={category.key}
            accessibilityRole="button"
            accessibilityLabel={`${category.name} · ${category.label}`}
            onPress={category.open}
            className="w-1/3 items-center gap-1.5 px-1 pb-[22px] active:opacity-80"
          >
            <GlyphDisc cat={category.key} size={72} glyphSize={30} />
            <Text className="max-w-full text-sm font-semibold text-foreground" numberOfLines={1}>
              {category.name}
            </Text>
            <Text className="text-xs text-muted-foreground">{category.count}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
