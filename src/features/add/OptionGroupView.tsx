import { Pressable, Text, View } from 'react-native';

import { PickChip } from '@/components/ui/PickChip';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import type { OptionValue, ResolvedGroup } from '@/lib/options';
import { COLORS } from '@/theme/colors';

/**
 * One question of the option picker, drawn for a phone: a small heading with the
 * word it was heard from and a way to say "Any", then the choices as tiles,
 * rows or chips depending on how many there are and how much each needs to say.
 */
export function OptionGroupView({
  group,
  onChoose,
  onSkip,
}: {
  group: ResolvedGroup;
  onChoose: (group: ResolvedGroup, value: OptionValue) => void;
  onSkip: (group: ResolvedGroup) => void;
}) {
  const { t } = useLang();

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</Text>
        <View className="ml-auto flex-row items-baseline gap-2">
          {group.inferred && (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.accentSoft }}>
              <Text className="text-[11px] font-semibold text-primary">{`from “${group.why}”`}</Text>
            </View>
          )}
          {group.value !== null && (
            <Pressable accessibilityRole="button" accessibilityLabel={`${group.label}: ${t.any}`} onPress={() => onSkip(group)} hitSlop={8} className="active:opacity-70">
              <Text className="text-xs text-muted-foreground">{t.any}</Text>
            </Pressable>
          )}
          {group.isAny && <Text className="text-xs text-muted-foreground">{t.anyNo}</Text>}
        </View>
      </View>

      {group.kind === 'tiles' && (
        <View className="-m-1 flex-row flex-wrap">
          {group.choices.map((choice) => (
            <View key={String(choice.value)} style={{ width: `${100 / group.cols}%` }} className="p-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${choice.label}${choice.sub ? `, ${choice.sub}` : ''}`}
                accessibilityState={{ selected: choice.selected }}
                onPress={() => onChoose(group, choice.value)}
                className="items-center rounded-lg border-2 px-1 py-2 active:opacity-80"
                style={{
                  borderColor: choice.selected ? COLORS.accent : 'transparent',
                  backgroundColor: COLORS.chipGround,
                }}
              >
                <Text className="text-lg font-bold text-foreground">{choice.label}</Text>
                {!!choice.sub && (
                  <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                    {choice.sub}
                  </Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {group.kind === 'rows' && (
        <View className="gap-1">
          {group.choices.map((choice) => (
            <Pressable
              key={String(choice.value)}
              accessibilityRole="radio"
              accessibilityLabel={`${choice.label}${choice.sub ? `, ${choice.sub}` : ''}`}
              accessibilityState={{ selected: choice.selected }}
              onPress={() => onChoose(group, choice.value)}
              className={['flex-row items-center gap-3 rounded-xl px-3 py-2 active:opacity-80', choice.selected ? 'bg-neutral-800' : 'bg-neutral-900'].join(' ')}
            >
              {!!choice.lead && (
                <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-secondary">
                  <Text className="text-sm font-bold text-foreground">{choice.lead}</Text>
                </View>
              )}
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {choice.label}
                </Text>
                {!!choice.sub && (
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {choice.sub}
                  </Text>
                )}
              </View>
              <View
                className="h-[18px] w-[18px] rounded-full"
                style={{ borderWidth: choice.selected ? 5 : 2, borderColor: choice.selected ? COLORS.accent : COLORS.ring }}
              />
            </Pressable>
          ))}
        </View>
      )}

      {group.kind === 'chips' && (
        <View className="flex-row flex-wrap gap-2">
          {group.choices.map((choice) => (
            <PickChip
              key={String(choice.value)}
              label={choice.label}
              selected={choice.selected}
              minWidth={52}
              onPress={() => onChoose(group, choice.value)}
            />
          ))}
        </View>
      )}

      {!!group.hint && <Text className="text-sm text-muted-foreground">{group.hint}</Text>}
    </View>
  );
}
