import { memo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useHover, webTransition } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

/**
 * The one card (PING.md §9.1). Every tile and row in Bazaar is this — a list on
 * the Lists tab, an item on a list, a product in the catalogue, a trip in
 * History, a line in the household feed — and they differ only in what they are
 * given, never in how they are drawn.
 *
 * `row` is the default: a raised ground, a leading mark, a title with a quiet
 * line under it, something on the right. It carries **no border on any edge**;
 * the ground is what separates it from the scope. `tile` is the same card stood
 * on end for a horizontal shelf ("Your usuals").
 *
 * Memoized: it renders in every virtualized cell, and without it a theme swap or
 * a tick re-renders every mounted card.
 */

export type BazaarCardProps = {
  variant?: 'row' | 'tile';
  /** The mark at the left: a glyph, an avatar, a tick circle. */
  leading?: ReactNode;
  title: string;
  /** One quiet line, or any node when it needs to be richer (a name and its twin). */
  subtitle?: ReactNode;
  /** Whatever sits at the right: a quantity, a round button, a chip. */
  trailing?: ReactNode;
  /** Sits under the title row, full width: the progress bar of a list. */
  footer?: ReactNode;
  /** The row's ground, one step up. Never a border. */
  selected?: boolean;
  /** Tighter padding and a hair less height, for the web catalogue grid. */
  dense?: boolean;
  /** The title in the card's strongest weight. Off for secondary lines like feed text. */
  strong?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function BazaarCardBase({
  variant = 'row',
  leading,
  title,
  subtitle,
  trailing,
  footer,
  selected = false,
  dense = false,
  strong = true,
  onPress,
  accessibilityLabel,
}: BazaarCardProps) {
  const { hovered, bind } = useHover();

  const ground = selected ? 'bg-neutral-800' : 'bg-neutral-900';
  // Web hover lifts the ground one step; it never transforms (PING.md §9.1).
  const hover = hovered && !selected && onPress ? { backgroundColor: COLORS.rowHover } : null;

  const body =
    variant === 'tile' ? (
      <View className="gap-2.5">
        <View className="flex-row items-start justify-between">
          {leading}
          {trailing}
        </View>
        <View className="min-w-0">
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            {title}
          </Text>
          {typeof subtitle === 'string' ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
      </View>
    ) : (
      <>
        <View className={['flex-row items-center', dense ? 'gap-2.5' : 'gap-3'].join(' ')}>
          {leading}
          <View className="min-w-0 flex-1">
            <Text className={[strong ? 'font-bold' : 'font-medium', 'text-foreground', dense ? 'text-sm' : 'text-base'].join(' ')} numberOfLines={1}>
              {title}
            </Text>
            {typeof subtitle === 'string' ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : (
              subtitle
            )}
          </View>
          {trailing}
        </View>
        {footer}
      </>
    );

  const className = [
    ground,
    variant === 'tile' ? 'w-[124px] rounded-xl p-3' : ['gap-2.5 rounded-xl', dense ? 'px-3 py-2.5' : 'p-3'].join(' '),
  ].join(' ');

  if (!onPress) {
    return (
      <View className={className} style={hover}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected }}
      onPress={onPress}
      {...bind}
      style={[webTransition('background-color'), hover]}
      className={[className, 'active:opacity-80'].join(' ')}
    >
      {body}
    </Pressable>
  );
}

export const BazaarCard = memo(BazaarCardBase);
