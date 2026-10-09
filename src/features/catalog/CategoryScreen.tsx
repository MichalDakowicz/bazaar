import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { CardList, type CardRow } from '@/components/media/CardList';
import { GlyphDisc } from '@/components/media/GlyphDisc';
import { SearchInput } from '@/components/ui/SearchInput';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { RoundAction } from '@/features/catalog/RoundAction';
import { useCategoryScreen } from '@/features/catalog/useCategoryScreen';
import { useGutter } from '@/hooks/useResponsive';
import { categoryOf, isCategory } from '@/lib/categories';

/**
 * One section of the catalogue, pushed from the Catalog tab: every product in
 * it, a search that narrows to this section, and a tap to put one on the list.
 * Back is the nav island's left plate, so there is no button of its own.
 */
export function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useLang();
  const gutter = useGutter();
  // `categoryOf` files an unknown section under Other so the hooks always have
  // one; the redirect below keeps a mistyped link from showing the wrong shelf.
  const screen = useCategoryScreen(categoryOf(key).key);

  const rows = useMemo<CardRow[]>(
    () =>
      screen.rows.map((row) => ({
        type: 'card',
        key: row.id,
        props: {
          leading: <GlyphDisc cat={row.cat} size={40} />,
          title: row.name,
          subtitle: row.detail || undefined,
          trailing: <RoundAction have={row.have} size={32} />,
          onPress: row.have ? undefined : row.add,
          accessibilityLabel: row.have ? row.name : `${t.add} · ${row.name}`,
        },
      })),
    [screen.rows, t],
  );

  if (!isCategory(key)) return <Redirect href="/catalog" />;

  return (
    <ScreenFrame pushed>
      <ScreenTop />
      <ScreenHeading title={screen.title} meta={screen.meta} action={false} />
      <View className={[gutter, 'pb-3 pt-4'].join(' ')}>
        <SearchInput value={screen.query} onChangeText={screen.setQuery} placeholder={t.searchPh} />
      </View>
      <CardList rows={rows} empty={{ title: t.nothingMatches, body: t.tryWords }} />
    </ScreenFrame>
  );
}
