import { Pressable, Text, View } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePlannerCopy } from '@/features/planner/copy';
import type { OptionValue, ResolvedGroup } from '@/lib/options';
import { COLORS } from '@/theme/colors';

/**
 * One question of the option picker, drawn for a mouse: the overline, then every
 * choice side by side in a single segmented control. The phone's tiles, rows and
 * chips exist because a thumb needs room; with a pointer they are all the same
 * thing, so the group's `kind` is ignored here.
 */
export function OptionSegment({
  group,
  onChoose,
  onSkip,
}: {
  group: ResolvedGroup;
  onChoose: (group: ResolvedGroup, value: OptionValue) => void;
  onSkip: (group: ResolvedGroup) => void;
}) {
  const { t } = useLang();
  const copy = usePlannerCopy();

  return (
    <View className="min-w-0 max-w-full gap-2">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground" numberOfLines={1}>
          {group.label}
        </Text>
        {group.inferred && (
          <View className="rounded-full px-[7px] py-px" style={{ backgroundColor: COLORS.accentSoft }}>
            <Text className="text-[11px] font-semibold text-primary" numberOfLines={1}>
              {copy.fromWord(group.why)}
            </Text>
          </View>
        )}
        {group.value !== null && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${group.label}: ${t.any}`}
            hitSlop={8}
            onPress={() => onSkip(group)}
            className="ml-auto pl-2 active:opacity-70"
          >
            <Text className="text-xs text-muted-foreground">{t.any}</Text>
          </Pressable>
        )}
        {group.isAny && <Text className="ml-auto pl-2 text-xs text-muted-foreground">{t.any}</Text>}
      </View>

      <View className="max-w-full flex-row flex-wrap gap-0.5 self-start rounded-lg p-[3px]" style={{ backgroundColor: COLORS.chipGround }}>
        {group.choices.map((choice) => (
          <Pressable
            key={String(choice.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${choice.label}${choice.sub ? `, ${choice.sub}` : ''}`}
            accessibilityState={{ selected: choice.selected }}
            onPress={() => onChoose(group, choice.value)}
            className="items-start gap-px rounded-md px-3 py-[7px] active:opacity-80"
            style={{ backgroundColor: choice.selected ? COLORS.accentSoft : 'transparent' }}
          >
            <Text className={['text-sm font-semibold', choice.selected ? 'text-primary' : 'text-foreground'].join(' ')} numberOfLines={1}>
              {choice.lead ? `${choice.lead}  ${choice.label}` : choice.label}
            </Text>
            {!!choice.sub && (
              <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                {choice.sub}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {!!group.hint && <Text className="text-xs text-muted-foreground">{group.hint}</Text>}
    </View>
  );
}
