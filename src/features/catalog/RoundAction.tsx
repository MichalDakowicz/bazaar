import { Check, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { COLORS } from '@/theme/colors';

/**
 * The round mark at the right of a catalogue tile or row: a plus on the quiet
 * ground while the product is not on the list, a filled tick once it is. It
 * only draws — the card it sits in is the button, so a tap anywhere on the card
 * does what the mark promises.
 */
export function RoundAction({ have, size = 28 }: { have: boolean; size?: number }) {
  return (
    <View
      className={['items-center justify-center rounded-full', have ? 'bg-foreground' : 'bg-secondary'].join(' ')}
      style={{ width: size, height: size }}
    >
      {have ? (
        <Check size={14} color={COLORS.ground} strokeWidth={3} />
      ) : (
        <Plus size={14} color={COLORS.foreground} strokeWidth={2.2} />
      )}
    </View>
  );
}
