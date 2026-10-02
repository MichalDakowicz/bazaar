import { Pressable, Text, View } from 'react-native';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import { usePlannerCopy } from '@/features/planner/copy';
import { OptionSegment } from '@/features/planner/OptionSegment';
import type { PlannerPanel } from '@/features/planner/usePlanner';

/**
 * The open product, opened inline under its grid row: name in both languages,
 * its questions side by side, and the two ways out — Add as configured (also
 * Enter), or Just add with nothing chosen. Esc, or the word at the top right,
 * puts it away again.
 */
export function OptionPanel({ panel }: { panel: PlannerPanel }) {
  const { t } = useLang();
  const copy = usePlannerCopy();

  return (
    <View className="gap-[18px] rounded-xl border border-border bg-background px-5 py-5">
      <View className="flex-row items-center gap-3">
        <Text className="min-w-0 flex-1 text-base font-bold text-foreground" numberOfLines={1}>
          {panel.name}
          <Text className="text-sm font-medium text-muted-foreground">{` · ${panel.alt}`}</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.closeOptions}
          hitSlop={8}
          onPress={panel.close}
          className="active:opacity-70"
        >
          <Text className="text-xs text-muted-foreground">Esc</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-x-7 gap-y-5">
        {panel.groups.map((group) => (
          <OptionSegment key={group.id} group={group} onChoose={panel.choose} onSkip={panel.skip} />
        ))}
      </View>

      <View className="flex-row flex-wrap items-center gap-2.5">
        <Text className="min-w-[200px] flex-1 text-xs text-muted-foreground">{t.webHint}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.justAdd} ${panel.name}`}
          onPress={panel.justAdd}
          className="rounded-full bg-secondary px-4 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-foreground">{t.justAdd}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[t.addOwn, panel.summary].filter(Boolean).join(' ')}
          onPress={panel.add}
          className="rounded-full bg-primary px-[18px] py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-foreground" numberOfLines={1}>
            {`${[t.addOwn, panel.summary].filter(Boolean).join(' · ')} ↵`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
