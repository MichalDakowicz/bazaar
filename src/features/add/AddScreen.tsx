import { Check, ChevronRight, Plus } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { BazaarCard } from '@/components/media/BazaarCard';
import { GlyphDisc } from '@/components/media/GlyphDisc';
import { PickChip } from '@/components/ui/PickChip';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/states';
import { ProductPanel } from '@/features/add/ProductPanel';
import { useAdder } from '@/features/add/useAdder';
import { useProductSearch } from '@/features/add/useProductSearch';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { categoryName } from '@/lib/categories';
import { optionSetFor } from '@/lib/optionSets';
import { productAlt, productName } from '@/lib/search';
import { productToItem } from '@/lib/usuals';
import { COLORS } from '@/theme/colors';

/**
 * Add, on a phone: one search box that understands both languages and what you
 * mean by them. "mąka do pierogów" opens the flour picker already on typ 550,
 * "duże jajka" opens the eggs on size L — and everything else is one tap on a
 * row. The island's left plate is Back, so leaving never takes a button of its
 * own.
 */
export function AddScreen() {
  const { t, productLang } = useLang();
  const navBarSpace = useNavBarSpace();
  const { list, add, onList } = useAdder();
  const search = useProductSearch();
  const input = useRef<TextInput>(null);
  const empty = search.query.trim().length === 0;

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenFrame pushed>
      <ScreenTop />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}>
        <View className="px-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground" numberOfLines={1}>
            {t.addTo} {list?.name ?? ''}
          </Text>
          <View className="mt-2.5">
            <SearchInput
              inputRef={input}
              value={search.query}
              onChangeText={search.setQuery}
              placeholder={t.searchPh}
              clearLabel={t.back}
            />
          </View>
        </View>

        {empty && (
          <View className="mt-5 gap-2.5 px-4">
            <Text className="text-xs text-muted-foreground">{t.tryWords}</Text>
            <View className="flex-row flex-wrap gap-2">
              {search.tries.map((words) => (
                <PickChip key={words} label={words} selected={false} onPress={() => search.setQuery(words)} />
              ))}
            </View>
          </View>
        )}

        <ProductPanel search={search} onAdd={(item) => void add(item)} />

        {search.suggestion && (
          <View className="mt-5 gap-2.5 px-4">
            <Text className="text-xs text-muted-foreground">{search.suggestion.title}</Text>
            <View className="flex-row flex-wrap gap-2">
              {search.suggestion.products.map((product) => {
                const have = !!onList(product);
                return (
                  <PickChip
                    key={product.id}
                    label={`${have ? '✓' : '+'} ${productName(product, productLang)}`}
                    selected={have}
                    onPress={() => {
                      if (!have) void add(productToItem(product));
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {search.others.length > 0 && (
          <View className="mt-5 gap-1.5 px-4">
            <Text className="mb-1 text-xs text-muted-foreground">{search.selected ? t.alsoMatching : t.results}</Text>
            {search.others.map((match) => {
              const product = match.product;
              const have = !!onList(product);
              const hasOptions = !!optionSetFor(product.id);
              const note = [
                match.primary ? productAlt(product, productLang) : t.matched(match.via ?? ''),
                hasOptions ? optionSetFor(product.id)?.hint : have ? t.onTheList : categoryName(product.cat, productLang),
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <BazaarCard
                  key={product.id}
                  leading={<GlyphDisc cat={product.cat} size={40} />}
                  title={productName(product, productLang)}
                  subtitle={note}
                  trailing={
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      {hasOptions ? (
                        <ChevronRight size={16} color={COLORS.foreground} strokeWidth={2.2} />
                      ) : have ? (
                        <Check size={16} color={COLORS.foreground} strokeWidth={2.6} />
                      ) : (
                        <Plus size={16} color={COLORS.foreground} strokeWidth={2.2} />
                      )}
                    </View>
                  }
                  onPress={() => {
                    if (hasOptions) search.select(product.id);
                    else if (!have) void add(productToItem(product));
                  }}
                />
              );
            })}
          </View>
        )}

        {search.noResults && (
          <View className="items-center gap-2 px-8 py-14">
            <Text className="text-sm font-semibold text-foreground">{`${t.nothing} “${search.query.trim()}”`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.addOwn} ${search.query.trim()}`}
              onPress={() => {
                const text = search.query.trim();
                void add({ productId: null, cat: 'pantry', nameEn: text, namePl: text, opt: '', qty: '1' });
                search.setQuery('');
              }}
              className="mt-2 rounded-full bg-secondary px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-foreground">{`${t.addOwn} “${search.query.trim()}”`}</Text>
            </Pressable>
          </View>
        )}

        {!list && <EmptyState title={t.noListToAdd} body={t.noListToAddBody} />}
      </ScrollView>
    </ScreenFrame>
  );
}
