import { Pressable, Text, View } from 'react-native';

import { Overline } from '@/components/ui/controls';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { useHiddenUsuals } from '@/features/bazaar/useWorkspace';
import { useDeletableTrips } from '@/features/history/useDeletableTrips';
import { useBazaarUi } from '@/store/bazaarPrefs';

function DataLink({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} className="self-start active:opacity-70">
      <Text className={['text-sm font-semibold', destructive ? 'text-destructive-foreground' : 'text-foreground'].join(' ')}>{label}</Text>
    </Pressable>
  );
}

/**
 * What Bazaar holds about you, and the way to take it back: bring hidden usuals
 * back, delete History, or delete everything. Only the controls that would do
 * something are shown — "Delete history" with an empty History is a button that
 * answers "there is nothing to delete" instead of just not being there.
 */
export function DataControls() {
  const { t } = useLang();
  const writes = useBazaarWrites();
  const hidden = useHiddenUsuals();
  const deletable = useDeletableTrips();
  const open = useBazaarUi((state) => state.open);

  return (
    <View className="gap-3">
      <Overline>{t.yourData}</Overline>
      <Text className="text-xs text-muted-foreground">{t.yourDataNote}</Text>
      <View className="gap-3.5 pt-1">
        {hidden.size > 0 && <DataLink label={t.showHidden(hidden.size)} onPress={() => void writes.showUsuals()} />}
        {deletable.length > 0 && <DataLink label={t.clearHistory} onPress={() => open({ kind: 'clearHistory' })} />}
        <DataLink label={t.deleteData} destructive onPress={() => open({ kind: 'deleteData' })} />
      </View>
    </View>
  );
}
