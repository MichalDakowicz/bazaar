import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { BazaarCard } from '@/components/media/BazaarCard';
import { CategoryGlyph } from '@/components/media/CategoryGlyph';
import { usePlannerCopy } from '@/features/planner/copy';
import { categoryOf } from '@/lib/categories';
import type { PlannerCell } from '@/lib/planner';
import { COLORS } from '@/theme/colors';

/**
 * One product in the planner's grid. Three states, told by the round button at
 * the right: a plus (one tap puts it on the list), a filled tick (it is already
 * there), a chevron (it asks questions — the panel opens under this row).
 */
type ProductCellProps = {
  cell: PlannerCell;
  open: boolean;
  onPress: (cell: PlannerCell) => void;
};

function Button({ cell, open }: { cell: PlannerCell; open: boolean }) {
  if (cell.hasOptions) {
    return (
      <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-secondary">
        {open ? (
          <ChevronUp size={15} color={COLORS.foreground} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={15} color={COLORS.foreground} strokeWidth={2.2} />
        )}
      </View>
    );
  }
  if (cell.onList) {
    return (
      <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-foreground">
        <Check size={15} color={COLORS.ground} strokeWidth={2.6} />
      </View>
    );
  }
  return (
    <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-secondary">
      <Plus size={15} color={COLORS.foreground} strokeWidth={2.2} />
    </View>
  );
}

function ProductCellBase({ cell, open, onPress }: ProductCellProps) {
  const copy = usePlannerCopy();
  const label = cell.hasOptions ? copy.optionsFor(cell.name) : cell.onList ? copy.alreadyOn(cell.name) : copy.addNamed(cell.name);

  return (
    <BazaarCard
      dense
      selected={open}
      leading={<CategoryGlyph glyph={categoryOf(cell.cat).glyph} size={16} color={COLORS.muted} />}
      title={cell.name}
      subtitle={cell.note}
      trailing={<Button cell={cell} open={open} />}
      accessibilityLabel={label}
      onPress={() => onPress(cell)}
    />
  );
}

export const ProductCell = memo(ProductCellBase);
