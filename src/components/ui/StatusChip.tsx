import { Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * A status as a real colour on a real 0.16 tint (PING.md §4.4). Here there is
 * exactly one status worth badging — somebody is shopping right now — and the
 * default state (nobody is) is never drawn.
 */
export function StatusChip({ label }: { label: string }) {
  return (
    <View className="flex-row items-center self-center rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.liveTint }}>
      <Text className="text-[11px] font-semibold" style={{ color: COLORS.live }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
