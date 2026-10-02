import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ScreenAction } from '@/components/layout/ScreenAction';
import { useGutter, useIsDesktop } from '@/hooks/useResponsive';

/**
 * The title block every tab opens with: a heading, one quiet line under it, and
 * on a wide window the screen's own action as a labelled button on the right —
 * the desktop half of the nav island's left plate (PING.md §8.6).
 */
export function ScreenHeading({
  title,
  meta,
  right,
  action = true,
}: {
  title: string;
  meta?: string;
  /** Anything that belongs beside the heading on the right, before the action. */
  right?: ReactNode;
  /** Set false on a screen whose action is already on the page (the planner's search). */
  action?: boolean;
}) {
  const gutter = useGutter();
  const isDesktop = useIsDesktop();

  return (
    <View className={[gutter, 'flex-row items-end gap-3'].join(' ')}>
      <View className="min-w-0 flex-1">
        <Text className="text-2xl font-bold tracking-tight text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {!!meta && (
          <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>
      {right}
      {isDesktop && action && <ScreenAction />}
    </View>
  );
}
