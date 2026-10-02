import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ScreenFrame } from '@/components/layout/ScreenFrame';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { CardList, type CardRow } from '@/components/media/CardList';
import { CategoryGlyph } from '@/components/media/CategoryGlyph';
import { ProgressBar } from '@/components/stats/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { ItemRow } from '@/features/lists/ItemRow';
import { TripBar } from '@/features/lists/TripBar';
import { useListScreen } from '@/features/lists/useListScreen';
import { useGutter } from '@/hooks/useResponsive';
import { categoryOf } from '@/lib/categories';
import { readError } from '@/lib/utils';
import { COLORS } from '@/theme/colors';

/**
 * One list on a phone: sections in shop order, then the basket. Pushed out of
 * the tabs, so it mounts the nav itself — and the island's left plate is Back.
 */
export function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, productLang } = useLang();
  const gutter = useGutter();
  const screen = useListScreen(id);
  const { view, list, check, uncheck, remove, swipe } = screen;

  const rows = useMemo<CardRow[]>(() => {
    const out: CardRow[] = [];
    for (const group of view.groups) {
      out.push({
        type: 'heading',
        key: `h:${group.cat}`,
        node: (
          <View className="flex-row items-center gap-2">
            <CategoryGlyph glyph={categoryOf(group.cat).glyph} size={16} color={COLORS.muted} />
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.name}</Text>
            <Text className="ml-auto text-xs text-muted-foreground">{group.items.length}</Text>
          </View>
        ),
      });
      for (const item of group.items) {
        out.push({
          type: 'node',
          key: item.id,
          node: (
            <View className={[gutter, 'pb-1.5'].join(' ')}>
              <ItemRow item={item} lang={productLang} swipe={swipe} onCheck={check} onUncheck={uncheck} onMore={remove} />
            </View>
          ),
        });
      }
    }
    if (view.inBasket.length > 0) {
      out.push({
        type: 'heading',
        key: 'h:basket',
        node: (
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.inBasketH}</Text>
            <Text className="ml-auto text-xs text-muted-foreground">{view.done}</Text>
          </View>
        ),
      });
      for (const item of view.inBasket) {
        out.push({
          type: 'node',
          key: item.id,
          node: (
            <View className={gutter}>
              <ItemRow item={item} lang={productLang} swipe={false} onCheck={check} onUncheck={uncheck} onMore={remove} />
            </View>
          ),
        });
      }
    }
    return out;
  }, [view, productLang, t, gutter, check, uncheck, remove, swipe]);

  if (screen.error) return <ErrorState message={readError(screen.error)} onRetry={screen.refetch} />;
  if (screen.loading) return <LoadingState />;
  if (!list) return <EmptyState title={t.noListsTitle} body={t.noListsBody} />;

  const header = (
    <View className={[gutter, 'gap-3 pb-1'].join(' ')}>
      <View>
        <Text className="text-2xl font-bold tracking-tight text-foreground" numberOfLines={1}>
          {list.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
          {[list.store, list.whenText].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <ProgressBar percent={view.percent} />
      <Text className="text-xs text-muted-foreground">
        {view.left} {t.toGet} · {view.done} {t.inBasket}
      </Text>
      <TripBar
        shopper={screen.shopper}
        shopperName={screen.shopperName}
        onStart={screen.startShopping}
        onFinish={screen.finishShopping}
        onWatch={screen.watchLive}
      />
    </View>
  );

  return (
    <ScreenFrame pushed>
      <ScreenTop />
      <CardList
        rows={rows}
        header={header}
        onRefresh={screen.refetch}
        // The island's left plate is Back on this route, so the empty state has
        // to carry its own way to add — there is no + here to point at.
        empty={
          view.total === 0
            ? { title: t.emptyListTitle, body: t.emptyListBody, action: { label: t.emptyListAction, onPress: screen.addHere } }
            : undefined
        }
      />
    </ScreenFrame>
  );
}
