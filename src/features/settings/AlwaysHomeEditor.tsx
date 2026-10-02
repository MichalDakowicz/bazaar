import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SearchInput } from '@/components/ui/SearchInput';
import { PickChip } from '@/components/ui/PickChip';
import { useBazaarSettings, useLang } from '@/features/bazaar/useBazaarSettings';
import { useSettingsCopy } from '@/features/settings/copy';
import { productById } from '@/lib/catalog';
import { productName, searchProducts } from '@/lib/search';
import { COLORS } from '@/theme/colors';

/**
 * The things you never need to buy. A pasted recipe skips these instead of
 * putting salt on the list for the tenth time — the design's "Marked as always
 * at home". Shown as removable chips with a small search to add more from the
 * catalogue.
 */
export function AlwaysHomeEditor() {
  const { t, productLang } = useLang();
  const copy = useSettingsCopy();
  const { settings, update } = useBazaarSettings();
  const [query, setQuery] = useState('');

  const suggestions = useMemo(
    () =>
      searchProducts(query, productLang, 6)
        .map((match) => match.product)
        .filter((product) => !settings.alwaysHome.includes(product.id)),
    [query, productLang, settings.alwaysHome],
  );

  const add = (id: string) => {
    void update({ alwaysHome: [...settings.alwaysHome, id] });
    setQuery('');
  };

  const remove = (id: string) => void update({ alwaysHome: settings.alwaysHome.filter((candidate) => candidate !== id) });

  return (
    <View className="gap-3">
      <View>
        <Text className="text-base font-semibold text-foreground">{t.alwaysHome}</Text>
        <Text className="text-xs text-muted-foreground">{t.alwaysHomeSub}</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {settings.alwaysHome.length === 0 && <Text className="text-xs text-muted-foreground">{copy.homeEmpty}</Text>}
        {settings.alwaysHome.map((id) => {
          const product = productById(id);
          const name = product ? productName(product, productLang) : id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={copy.homeRemove(name)}
              onPress={() => remove(id)}
              className="flex-row items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 active:opacity-80"
              style={{ backgroundColor: COLORS.chipGround }}
            >
              <Text className="text-sm text-foreground" numberOfLines={1}>
                {name}
              </Text>
              <X size={14} color={COLORS.muted} strokeWidth={2.2} />
            </Pressable>
          );
        })}
      </View>

      <SearchInput value={query} onChangeText={setQuery} placeholder={copy.homeAdd} height={42} />
      {suggestions.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((product) => (
            <PickChip key={product.id} label={`+ ${productName(product, productLang)}`} selected={false} onPress={() => add(product.id)} />
          ))}
        </View>
      )}
    </View>
  );
}
