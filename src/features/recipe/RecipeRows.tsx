import { Check } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { CategoryGlyph } from '@/components/media/CategoryGlyph';
import type { RecipeLine } from '@/features/recipe/recipeLines';
import { categoryOf } from '@/lib/categories';
import { COLORS } from '@/theme/colors';

/**
 * The plan, one card per ingredient. The whole card is the switch: a filled
 * circle means "this goes on the list", an empty ring means it does not, and an
 * off row steps back to 55% so a long plan reads as a few things to do among
 * several already dealt with.
 */
function Leading({ line }: { line: RecipeLine }) {
  return (
    <View className="flex-row items-center gap-2.5">
      {line.on ? (
        <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-foreground">
          <Check size={12} color={COLORS.ground} strokeWidth={3} />
        </View>
      ) : (
        <View className="h-[22px] w-[22px] rounded-full border-2" style={{ borderColor: COLORS.ring }} />
      )}
      <CategoryGlyph glyph={categoryOf(line.cat).glyph} size={16} color={COLORS.muted} />
    </View>
  );
}

export function RecipeRows({ lines, onToggle }: { lines: RecipeLine[]; onToggle: (raw: string) => void }) {
  return (
    <View className="gap-1.5">
      {lines.map((line) => (
        <View key={line.id} style={{ opacity: line.on ? 1 : 0.55 }}>
          <BazaarCard
            dense
            leading={<Leading line={line} />}
            title={line.name}
            subtitle={
              <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                {line.alt ? `${line.alt} · ` : ''}
                {line.reason}
              </Text>
            }
            trailing={
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {line.act}
              </Text>
            }
            onPress={() => onToggle(line.raw)}
          />
        </View>
      ))}
    </View>
  );
}
