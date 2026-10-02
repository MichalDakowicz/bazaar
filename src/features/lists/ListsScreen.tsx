import { Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ScreenHeading } from '@/components/layout/ScreenHeading';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { CardList, type CardRow } from '@/components/media/CardList';
import { ProgressBar } from '@/components/stats/ProgressBar';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { StatusChip } from '@/components/ui/StatusChip';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useListsScreen } from '@/features/lists/useListsScreen';
import { useGutter } from '@/hooks/useResponsive';
import { readError } from '@/lib/utils';
import { COLORS } from '@/theme/colors';

/**
 * The Lists tab on a phone: every list you are on, each with how far it is
 * through and whether somebody is out with it. A list is a card; the progress
 * bar is the accent doing its one measuring job.
 */
export function ListsScreen() {
  const { t } = useLang();
  const gutter = useGutter();
  const screen = useListsScreen();

  const rows = useMemo<CardRow[]>(() => {
    const cards: CardRow[] = screen.rows.map((row) => ({
      type: 'card',
      key: row.id,
      props: {
        title: row.name,
        onPress: row.onPress,
        trailing: row.chip ? (
          <StatusChip label={row.chip} />
        ) : row.whenText ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {row.whenText}
          </Text>
        ) : undefined,
        footer: (
          <View className="gap-2.5">
            <ProgressBar percent={row.percent} />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {row.meta}
            </Text>
          </View>
        ),
      },
    }));
    if (screen.rows.length === 0) return cards;
    if (screen.rows.length === 0) return cards;
    cards.push({
      type: 'node',
      key: 'new',
      node: (
        <View className={[gutter, 'pt-3'].join(' ')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.newList}
            onPress={screen.newList}
            className="flex-row items-center justify-center gap-2 self-start rounded-full border border-border px-4 py-2.5 active:opacity-80"
          >
            <Plus size={15} color={COLORS.foreground} strokeWidth={2.2} />
            <Text className="text-sm font-semibold text-foreground">{t.newList}</Text>
          </Pressable>
        </View>
      ),
    });
    return cards;
  }, [screen.rows, screen.newList, t, gutter]);

  if (screen.error) return <ErrorState message={readError(screen.error)} onRetry={screen.refetch} />;

  return (
    <View className="flex-1 bg-background">
      <ScreenTop />
      <ScreenHeading title={t.lists} meta={screen.meta} />
      <View className="h-4" />
      {screen.loading ? (
        <LoadingState />
      ) : (
        <CardList
          rows={rows}
          onRefresh={screen.refetch}
          empty={
            screen.rows.length === 0
              ? { title: t.noListsTitle, body: t.noListsBody, action: { label: t.newList, onPress: screen.newList } }
              : undefined
          }
        />
      )}
    </View>
  );
}
