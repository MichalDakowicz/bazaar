import { View } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * The thin bar under a list: how much of it is in the basket. Accent on a quiet
 * track, and the one place the accent is *a measurement* rather than a mark.
 */
export function ProgressBar({ percent, height = 4 }: { percent: number; height?: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      className="overflow-hidden rounded-full"
      style={{ height, backgroundColor: COLORS.track }}
    >
      <View className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
    </View>
  );
}
