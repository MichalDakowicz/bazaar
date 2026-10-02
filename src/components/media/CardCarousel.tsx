import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { BazaarCard, type BazaarCardProps } from '@/components/media/BazaarCard';
import { FadeRight } from '@/components/ui/FadeRight';

/**
 * The horizontal shelf of tiles. Deliberately not virtualized: every caller caps
 * its row at a couple of dozen items, and a list inside another list's header
 * can settle at one visible card (PING.md §9.2).
 */
export type CarouselCard = { key: string; props: BazaarCardProps };

const GAP = 10;
const EDGE = 16;

export function CardCarousel({ cards, heading }: { cards: CarouselCard[]; heading?: ReactNode }) {
  return (
    <View>
      {heading}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: GAP, paddingHorizontal: EDGE }}
        >
          {cards.map((card) => (
            <BazaarCard key={card.key} {...card.props} variant="tile" />
          ))}
        </ScrollView>
        <FadeRight />
      </View>
    </View>
  );
}
