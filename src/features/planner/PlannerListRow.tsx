import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { usePlannerCopy } from '@/features/planner/copy';
import type { PlannerLine } from '@/lib/planner';
import { COLORS } from '@/theme/colors';

/**
 * One line of the list at the right: the name, its twin and chosen options in
 * quiet type after it, the quantity on the far side. A small ring at the left
 * ticks it — enough to cross something off at the desk; the swipe and the
 * basket belong to the phone.
 */
export function PlannerListRow({ line, onToggle }: { line: PlannerLine; onToggle: (line: PlannerLine) => void }) {
  const copy = usePlannerCopy();

  return (
    <View className={['flex-row items-center gap-2.5 py-1.5', line.ticked ? 'opacity-[0.45]' : ''].join(' ')}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={line.ticked ? copy.untick(line.name) : copy.tick(line.name)}
        accessibilityState={{ checked: line.ticked }}
        hitSlop={6}
        onPress={() => onToggle(line)}
        className="active:opacity-70"
      >
        {line.ticked ? (
          <View className="h-4 w-4 items-center justify-center rounded-full bg-secondary">
            <Check size={10} color={COLORS.foreground} strokeWidth={3} />
          </View>
        ) : (
          <View className="h-4 w-4 rounded-full border-[1.5px]" style={{ borderColor: COLORS.ring }} />
        )}
      </Pressable>
      <Text className={['min-w-0 flex-1 text-sm', line.ticked ? 'line-through' : ''].join(' ')} numberOfLines={1}>
        <Text className="font-semibold text-foreground">{line.name}</Text>
        <Text className="text-muted-foreground">{line.rest}</Text>
      </Text>
      <Text className="text-xs text-muted-foreground">{line.qty}</Text>
    </View>
  );
}
