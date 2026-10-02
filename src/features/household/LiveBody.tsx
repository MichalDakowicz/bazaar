import { Pressable, Text, View } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { ProgressBar } from '@/components/stats/ProgressBar';
import { StatusChip } from '@/components/ui/StatusChip';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useHouseholdCopy } from '@/features/household/copy';
import type { LiveModel } from '@/features/household/useLiveTrip';

/**
 * Somebody else's shopping trip, as the page and as the desktop panel beside the
 * feed — the same body in both, so what you see at your desk is what you would
 * have seen on the phone. `panel` is the narrower of the two: a smaller title and
 * a button that is as wide as its label rather than the screen.
 *
 * A finished trip keeps the frame but not the measuring: its basket has gone to
 * History, so a progress bar would only ever read zero.
 */
export function LiveBody({ model, onAdd, panel = false }: { model: LiveModel; onAdd: () => void; panel?: boolean }) {
  const { t } = useLang();
  const copy = useHouseholdCopy();

  return (
    <View>
      <View className="flex-row">
        {model.ended ? (
          <View className="rounded-full bg-secondary px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-muted-foreground" numberOfLines={1}>
              {model.chip}
            </Text>
          </View>
        ) : (
          <StatusChip label={model.chip} />
        )}
      </View>

      <Text
        className={['mt-2.5 font-bold tracking-tight text-foreground', panel ? 'text-xl' : 'text-2xl'].join(' ')}
        numberOfLines={2}
      >
        {model.title}
      </Text>
      {!!model.listName && (
        <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={1}>
          {model.listName}
        </Text>
      )}

      {!model.ended && (
        <>
          <View className={panel ? 'mt-4' : 'mt-5'}>
            <ProgressBar percent={model.percent} height={6} />
            <Text className="mt-2 text-xs text-muted-foreground" numberOfLines={1}>
              {model.caption}
            </Text>
          </View>

          <Text className="mb-2 mt-[22px] text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.picked}</Text>
          {model.picked.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{copy.nothingPicked}</Text>
          ) : (
            <View className="gap-1.5">
              {model.picked.map((row) => (
                <BazaarCard
                  key={row.id}
                  dense
                  title={row.name}
                  trailing={
                    row.qty ? (
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {row.qty}
                      </Text>
                    ) : undefined
                  }
                />
              ))}
            </View>
          )}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={model.addLabel}
        onPress={onAdd}
        className={[
          'rounded-full bg-primary active:opacity-80',
          panel ? 'mt-[18px] self-start px-[18px] py-[11px]' : 'mt-[22px] items-center py-3.5',
        ].join(' ')}
      >
        <Text className="text-sm font-semibold text-primary-foreground" numberOfLines={1}>
          {model.addLabel}
        </Text>
      </Pressable>
    </View>
  );
}
