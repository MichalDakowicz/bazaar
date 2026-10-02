import type { BazaarCardProps } from '@/components/media/BazaarCard';
import { ReuseButton } from '@/features/history/ReuseButton';
import type { TripCardModel } from '@/features/history/useHistoryScreen';

/** A finished trip as the one card: its list, its meta line, and Reuse on the right. */
export function tripCardProps(trip: TripCardModel): BazaarCardProps {
  return {
    title: trip.title,
    subtitle: trip.meta,
    trailing: <ReuseButton title={trip.title} onPress={trip.reuse} />,
  };
}
