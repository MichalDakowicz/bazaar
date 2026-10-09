import { Apple, Beef, Container, Cookie, Croissant, Fish, GlassWater, Milk, Package, Snowflake, SprayCan } from 'lucide-react-native';

import type { CategoryGlyphKey } from '@/lib/categories';

/**
 * The glyph for a shop section. A component with a `switch`, not a lookup table
 * returning a component: `const Icon = iconFor(x)` mints a component identity
 * during render, which resets any state it holds (PING.md §13).
 */
export function CategoryGlyph({
  glyph,
  size = 18,
  color,
  strokeWidth = 2,
}: {
  glyph: CategoryGlyphKey;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  const props = { size, color, strokeWidth };
  switch (glyph) {
    case 'apple':
      return <Apple {...props} />;
    case 'bread':
      return <Croissant {...props} />;
    case 'milk':
      return <Milk {...props} />;
    case 'beef':
      return <Beef {...props} />;
    case 'fish':
      return <Fish {...props} />;
    case 'jar':
      return <Container {...props} />;
    case 'snow':
      return <Snowflake {...props} />;
    case 'bottle':
      return <GlassWater {...props} />;
    case 'cookie':
      return <Cookie {...props} />;
    case 'spray':
      return <SprayCan {...props} />;
    case 'box':
      return <Package {...props} />;
  }
}
