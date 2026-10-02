import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { CardCarousel, type CarouselCard } from '@/components/media/CardCarousel';
import { GlyphDisc } from '@/components/media/GlyphDisc';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { CatalogSearchEntry } from '@/features/catalog/CatalogSearchEntry';
import { CategoryGrid } from '@/features/catalog/CategoryGrid';
import { RoundAction } from '@/features/catalog/RoundAction';
import { useCatalogScreen } from '@/features/catalog/useCatalogScreen';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';

/**
 * The Catalog tab on a phone: a way into search, the things you keep buying,
 * and the shop's ten sections. On a wide window this tab is the planner instead
 * (see `app/(tabs)/catalog.tsx`).
 */
export function CatalogScreen() {
  const { t } = useLang();
  const navBarSpace = useNavBarSpace();
  const screen = useCatalogScreen();

  const cards = useMemo<CarouselCard[]>(
    () =>
      screen.tiles.map((tile) => ({
        key: tile.key,
        props: {
          leading: <GlyphDisc cat={tile.cat} size={40} glyphSize={20} />,
          title: tile.name,
          subtitle: tile.detail || undefined,
          trailing: <RoundAction have={tile.have} size={28} />,
          // On the list already: a tick to read, nothing to press.
          onPress: tile.have ? undefined : tile.add,
          accessibilityLabel: tile.have ? tile.name : `${t.add} · ${tile.name}`,
        },
      })),
    [screen.tiles, t],
  );

  return (
    <ScreenFrame>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: navBarSpace + 16 }} showsVerticalScrollIndicator={false}>
        <ScreenHeading title={t.catalog} />
        <View className="px-4 pt-3">
          <CatalogSearchEntry placeholder={t.searchPh} onPress={screen.openSearch} />
        </View>
        <View className="mt-[22px]">
          <CardCarousel
            cards={cards}
            heading={
              <Text className="mb-2.5 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {screen.shelfTitle}
              </Text>
            }
          />
        </View>
        <CategoryGrid title={t.categories} categories={screen.categories} />
      </ScrollView>
    </ScreenFrame>
  );
}
