import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { SwipeRow } from '@/features/lists/SwipeRow';
import { itemAlt, itemName } from '@/lib/listModel';
import type { Lang } from '@/lib/categories';
import { COLORS } from '@/theme/colors';
import type { ListItem } from '@/types/bazaar';

/**
 * One thing on a list.
 *
 * Unticked it is a card with an empty circle, a swipe and a long press; ticked
 * it drops to the basket as a struck-through line you can tap to put back. The
 * circle's hit area is 44pt although it draws at 22 — it is the thing pressed
 * one-handed in an aisle, and a small target is how you tick the wrong item.
 */
type ItemRowProps = {
  item: ListItem;
  lang: Lang;
  swipe: boolean;
  onCheck: (item: ListItem) => void;
  onUncheck: (item: ListItem) => void;
  onMore: (item: ListItem) => void;
  /** Rendered in a list on a wide window: no swipe, and the whole row can open the editor. */
  dense?: boolean;
};

function ItemRowBase({ item, lang, swipe, onCheck, onUncheck, onMore, dense }: ItemRowProps) {
  const name = itemName(item, lang);
  const alt = itemAlt(item, lang);

  if (item.checkedAt) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onUncheck(item)}
        className="flex-row items-center gap-3 px-3 py-2.5 active:opacity-80"
      >
        <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-secondary">
          <Check size={12} color={COLORS.foreground} strokeWidth={3} />
        </View>
        <Text className="flex-1 text-sm text-muted-foreground line-through" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs text-muted-foreground">{item.qty}</Text>
      </Pressable>
    );
  }

  return (
    <SwipeRow enabled={swipe && !dense} onCommit={() => onCheck(item)}>
      <Pressable
        accessibilityLabel={name}
        delayLongPress={350}
        onLongPress={() => onMore(item)}
        disabled={false}
      >
        <BazaarCard
          leading={
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={name}
              accessibilityState={{ checked: false }}
              hitSlop={6}
              onPress={() => onCheck(item)}
              className="-my-[11px] -ml-[11px] -mr-2 h-11 w-11 items-center justify-center active:opacity-70"
            >
              <View className="h-[22px] w-[22px] rounded-full border-2" style={{ borderColor: COLORS.ring }} />
            </Pressable>
          }
          title={name}
          subtitle={
            alt || item.opt ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {alt}
                {!!item.opt && <Text className="font-semibold text-foreground">{alt ? ' · ' : ''}{item.opt}</Text>}
              </Text>
            ) : undefined
          }
          trailing={<Text className="text-sm text-muted-foreground">{item.qty}</Text>}
        />
      </Pressable>
    </SwipeRow>
  );
}

export const ItemRow = memo(ItemRowBase);
