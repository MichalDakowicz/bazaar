import { View } from 'react-native';

import { CategoryGlyph } from '@/components/media/CategoryGlyph';
import { categoryOf } from '@/lib/categories';
import type { CategoryKey } from '@/lib/catalog/types';
import { COLORS } from '@/theme/colors';

/**
 * A shop section's glyph on its round ground — the artwork stand-in. A grocery
 * list has no covers or sleeves, so a product's picture is its section, drawn
 * the same way everywhere it appears (PING.md §9.3: no artwork, a centred glyph
 * on `bg-neutral-800`).
 */
export function GlyphDisc({
  cat,
  size = 40,
  glyphSize,
  color = COLORS.foreground,
}: {
  cat: CategoryKey;
  size?: number;
  glyphSize?: number;
  color?: string;
}) {
  return (
    <View className="items-center justify-center bg-neutral-800" style={{ width: size, height: size, borderRadius: size / 2 }}>
      <CategoryGlyph glyph={categoryOf(cat).glyph} size={glyphSize ?? Math.round(size * 0.5)} color={color} strokeWidth={1.75} />
    </View>
  );
}
