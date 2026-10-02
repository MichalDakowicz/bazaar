import { ScrollView, View } from 'react-native';

import { LiveBody } from '@/features/household/LiveBody';
import { useLiveTrip } from '@/features/household/useLiveTrip';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';

/**
 * The right-hand column of the desktop Household: the trip that is being
 * watched, in the same body the phone's Live page has. It renders nothing for
 * a trip that has vanished — the column keeps its width so the feed beside it
 * does not jump when somebody starts or finishes shopping.
 */
export function LivePanel({ tripId }: { tripId: string | null }) {
  const live = useLiveTrip(tripId ?? undefined);
  const navBarSpace = useNavBarSpace();

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: navBarSpace }} showsVerticalScrollIndicator={false}>
      {live.model && (
        <View className="pl-2 pr-8 pt-1">
          <LiveBody model={live.model} onAdd={live.addFor} panel />
        </View>
      )}
    </ScrollView>
  );
}
