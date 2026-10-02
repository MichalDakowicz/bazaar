import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS } from '@/theme/colors';

/**
 * The right-edge fade that stands in for a scrollbar on a horizontal shelf
 * (PING.md §4.6): 44px wide, transparent into the page ground. Sits on top of
 * the scroller and swallows no touches.
 */
export function FadeRight({ width = 44 }: { width?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="fadeRight" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COLORS.ground} stopOpacity="0" />
            <Stop offset="1" stopColor={COLORS.ground} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fadeRight)" />
      </Svg>
    </View>
  );
}
