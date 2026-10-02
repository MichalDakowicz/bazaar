import { Check } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS } from '@/theme/colors';

/** How far a swipe has to travel to count, and how far it may be dragged. */
const COMMIT = 110;
const MAX = 180;

/**
 * Swipe right to put an item in the basket.
 *
 * The row slides over an accent ground with a tick on it; let go past the
 * threshold and it commits, let go short of it and it springs back. The gesture
 * only claims a mostly-horizontal drag, so the list still scrolls under a thumb
 * that wanders. Off on the web build: a mouse has the circle, and a drag there
 * would fight text selection.
 */
export function SwipeRow({
  enabled,
  onCommit,
  children,
}: {
  enabled: boolean;
  onCommit: () => void;
  children: ReactNode;
}) {
  const dx = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled && Platform.OS !== 'web')
    .activeOffsetX([12, 9999])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      dx.value = Math.max(0, Math.min(event.translationX, MAX));
    })
    .onEnd(() => {
      const committed = dx.value >= COMMIT;
      dx.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      if (committed) runOnJS(onCommit)();
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const groundStyle = useAnimatedStyle(() => ({ opacity: dx.value > 0 ? Math.min(1, 0.35 + dx.value / COMMIT) : 0 }));

  return (
    <View className="overflow-hidden rounded-xl">
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 flex-row items-center bg-primary pl-5"
        style={groundStyle}
      >
        <Check size={20} color={COLORS.accentInk} strokeWidth={3} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
