import { ShoppingBasket } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { StatusChip } from '@/components/ui/StatusChip';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { COLORS } from '@/theme/colors';

/**
 * The state of the shopping trip, as the one control the list page offers:
 * nobody is out (start one), you are (finish it), or somebody else is (watch
 * them do it). A trip is what turns a list from a plan into a thing happening.
 */
export function TripBar({
  shopper,
  shopperName,
  onStart,
  onFinish,
  onWatch,
}: {
  shopper: 'nobody' | 'me' | 'other';
  shopperName: string | null;
  onStart: () => void;
  onFinish: () => void;
  onWatch: () => void;
}) {
  const { t } = useLang();

  if (shopper === 'me') {
    return (
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.finishShopping}
          onPress={onFinish}
          className="rounded-full bg-primary px-4 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-foreground">{t.finishShopping}</Text>
        </Pressable>
        <Text className="text-xs text-muted-foreground">{t.youShopping}</Text>
      </View>
    );
  }

  if (shopper === 'other') {
    return (
      <View className="flex-row items-center gap-3">
        <StatusChip label={t.shoppingChip(shopperName ?? t.someone)} />
        <Pressable accessibilityRole="button" accessibilityLabel={t.live} onPress={onWatch} hitSlop={8} className="active:opacity-70">
          <Text className="text-sm font-semibold text-primary">{t.live}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.startShopping}
      onPress={onStart}
      className="flex-row items-center gap-2 self-start rounded-full bg-secondary px-4 py-2.5 active:opacity-80"
    >
      <ShoppingBasket size={15} color={COLORS.foreground} strokeWidth={2.2} />
      <Text className="text-sm font-semibold text-foreground">{t.startShopping}</Text>
    </Pressable>
  );
}
