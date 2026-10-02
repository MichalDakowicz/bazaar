import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { SheetDialog } from '@/components/ui/SheetDialog';
import { useToast } from '@/components/ui/Toast';
import { fetchTripItems } from '@/features/bazaar/bazaarApi';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useBazaarWrites } from '@/features/bazaar/useBazaarWrites';
import { bazaarKeys, useWorkspace } from '@/features/bazaar/useWorkspace';
import { tripTitle } from '@/features/history/historyModel';
import { useDeletableTrips } from '@/features/history/useDeletableTrips';
import { useReuseTrip } from '@/features/history/useReuseTrip';
import { itemAlt, itemName } from '@/lib/listModel';
import { tripMeta } from '@/lib/trips';

/**
 * A finished trip, opened: what it carried out of the shop, Reuse, and — for the
 * person who shopped it and the list's owner — Delete, which takes the items
 * with it and asks first because it is gone for everyone on the list.
 *
 * Someone who may not delete it sees a plain Close where Delete would be.
 */
export function TripSheet({ open, tripId, onClose }: { open: boolean; tripId: string | null; onClose: () => void }) {
  const { t, appLang, productLang } = useLang();
  const { trips, list: listOf, nameOf } = useWorkspace();
  const deletable = useDeletableTrips();
  const writes = useBazaarWrites();
  const reuse = useReuseTrip();
  const { say } = useToast();
  const [confirming, setConfirming] = useState(false);

  const trip = tripId ? (trips.find((candidate) => candidate.id === tripId) ?? null) : null;
  const canDelete = !!trip && deletable.some((candidate) => candidate.id === trip.id);

  const items = useQuery({
    queryKey: bazaarKeys.tripItems(tripId ?? ''),
    queryFn: () => fetchTripItems(tripId!),
    enabled: open && !!tripId,
  });

  // A confirmation left up must not be what the next trip opens on.
  const close = () => {
    setConfirming(false);
    onClose();
  };

  const remove = async () => {
    if (!trip) return;
    const taken = await writes.removeTrips([trip.id]);
    if (taken === null) return;
    say(taken > 0 ? t.tripDeleted : t.error);
    close();
  };

  // Deleted from another device while it was open.
  if (open && !trip) return null;

  const title = trip ? tripTitle(listOf(trip.listId), trip, appLang) : '';

  if (trip && confirming) {
    return (
      <SheetDialog
        open={open}
        title={t.deleteTripTitle}
        body={t.deleteTripBody}
        confirmLabel={t.deleteTrip}
        dismissLabel={t.cancel}
        tone="destructive"
        onConfirm={() => void remove()}
        onDismiss={() => setConfirming(false)}
        onRequestClose={close}
      />
    );
  }

  return (
    <SheetDialog
      open={open}
      title={title}
      body={trip ? tripMeta(trip, nameOf(trip.shopperId) ?? t.you, appLang) : undefined}
      confirmLabel={t.reuse}
      dismissLabel={canDelete ? t.deleteTrip : t.cancel}
      onConfirm={() => {
        if (trip) void reuse(trip);
        close();
      }}
      onDismiss={() => (canDelete ? setConfirming(true) : close())}
      onRequestClose={close}
    >
      <ScrollView className="mt-4 max-h-64" showsVerticalScrollIndicator={false}>
        {(items.data ?? []).map((item) => (
          <View key={item.id} className="flex-row items-baseline gap-3 py-1.5">
            <Text className="min-w-0 flex-1 text-sm text-foreground" numberOfLines={1}>
              {itemName(item, productLang)}
              <Text className="text-muted-foreground">{itemAlt(item, productLang) ? ` · ${itemAlt(item, productLang)}` : ''}</Text>
            </Text>
            <Text className="text-xs text-muted-foreground">{item.qty}</Text>
          </View>
        ))}
        {items.isSuccess && items.data.length === 0 && <Text className="text-sm text-muted-foreground">{t.tripNoItems}</Text>}
      </ScrollView>
    </SheetDialog>
  );
}
