import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { type ReactElement, type ReactNode, type Ref } from 'react';
import { RefreshControl, View } from 'react-native';

import { BazaarCard, type BazaarCardProps } from '@/components/media/BazaarCard';
import { EmptyState } from '@/components/ui/states';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useGutter } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

/**
 * One flat list: headings, cards and anything else in a single virtualized
 * column. Sections and rows share a list rather than nesting a list per section
 * — a list inside a list settles at one visible row and never re-measures
 * (PING.md §9.2).
 */
export type CardRow =
  | { type: 'heading'; key: string; node: ReactNode }
  | { type: 'card'; key: string; props: BazaarCardProps }
  | { type: 'node'; key: string; node: ReactNode };

type Empty = { title: string; body: string; action?: { label: string; onPress: () => void } };

type CardListProps = {
  rows: CardRow[];
  header?: ReactElement;
  empty?: Empty;
  refreshing?: boolean;
  onRefresh?: () => void;
  listRef?: Ref<FlashListRef<CardRow>>;
};

/**
 * The only virtualized container in the app. It pads for the floating nav
 * itself, because the bar is absolutely positioned and reserves no layout
 * (PING.md §8.3); a caller that forgets leaves its last row under the glass.
 */
export function CardList({ rows, header, empty, refreshing, onRefresh, listRef }: CardListProps) {
  const navBarSpace = useNavBarSpace();
  const gutter = useGutter();

  return (
    <FlashList
      ref={listRef}
      data={rows}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.type}
      // Anchoring is for chat. Here the data changed because the user ticked or
      // searched, and holding their old offset strands them mid-list.
      maintainVisibleContentPosition={{ disabled: true }}
      ListHeaderComponent={header}
      ListEmptyComponent={empty ? <EmptyState title={empty.title} body={empty.body} action={empty.action} /> : undefined}
      contentContainerStyle={{ paddingBottom: navBarSpace + 8 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={COLORS.muted} colors={[COLORS.accent]} />
        ) : undefined
      }
      renderItem={({ item }) => {
        if (item.type === 'card') {
          return (
            <View className={[gutter, 'pb-1.5'].join(' ')}>
              <BazaarCard {...item.props} />
            </View>
          );
        }
        if (item.type === 'heading') return <View className={[gutter, 'pb-2 pt-5'].join(' ')}>{item.node}</View>;
        return <>{item.node}</>;
      }}
    />
  );
}
