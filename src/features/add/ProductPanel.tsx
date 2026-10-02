import { Pressable, Text, View } from 'react-native';

import { GlyphDisc } from '@/components/media/GlyphDisc';
import { OptionGroupView } from '@/features/add/OptionGroupView';
import type { ProductSearch } from '@/features/add/useProductSearch';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { productAlt, productName } from '@/lib/search';

/**
 * The open product on the phone's Add screen: its name in both languages, the
 * follow-up questions it asks, and the two ways out — add it as configured, or
 * just add it and skip the questions.
 */
export function ProductPanel({ search, onAdd }: { search: ProductSearch; onAdd: (item: ReturnType<ProductSearch['itemFor']>) => void }) {
  const { t, productLang } = useLang();
  const { selected, resolution } = search;
  if (!selected || !resolution) return null;

  const product = selected.product;
  const name = productName(product, productLang);
  const summary = [resolution.opt, resolution.qty].filter(Boolean).join(' · ');

  return (
    <View className="mt-4 gap-5 border-y border-border/50 px-4 pb-5 pt-4">
      <View className="flex-row items-center gap-3">
        <GlyphDisc cat={product.cat} size={48} glyphSize={24} />
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {productAlt(product, productLang)}
          </Text>
        </View>
      </View>

      {resolution.groups.map((group) => (
        <OptionGroupView key={group.id} group={group} onChoose={search.choose} onSkip={search.skip} />
      ))}

      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.addOwn} ${summary}`}
          onPress={() => onAdd(search.itemFor(selected))}
          className="items-center rounded-full bg-primary px-4 py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-foreground" numberOfLines={1}>
            {[t.addOwn, summary].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.justAdd} ${name}`}
          onPress={() => onAdd(search.bareItemFor(product))}
          className="items-center rounded-full bg-secondary px-4 py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {`${t.justAdd} “${name}”`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
