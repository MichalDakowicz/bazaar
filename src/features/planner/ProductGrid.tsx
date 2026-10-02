import { type ReactNode } from 'react';
import { View } from 'react-native';

import { ProductCell } from '@/features/planner/ProductCell';
import type { GridRow, PlannerCell } from '@/lib/planner';

/**
 * The catalogue grid: cells in rows of `cols`, and the open product's panel as a
 * full-width block between two rows. React Native has no `grid-column: 1 / -1`,
 * so the rows are chunked up front (lib/planner `layoutRows`) and a short last
 * row is padded with empty cells to keep every column the same width.
 */
export function ProductGrid({
  rows,
  cols,
  openId,
  panel,
  onCell,
}: {
  rows: GridRow<PlannerCell>[];
  cols: number;
  openId: string | null;
  panel: ReactNode;
  onCell: (cell: PlannerCell) => void;
}) {
  return (
    <View className="mt-[18px] gap-2.5">
      {rows.map((row) =>
        row.type === 'panel' ? (
          <View key={row.key}>{panel}</View>
        ) : (
          <View key={row.key} className="flex-row gap-2.5">
            {row.cells.map((cell) => (
              <View key={cell.id} className="min-w-0 flex-1">
                <ProductCell cell={cell} open={cell.id === openId} onPress={onCell} />
              </View>
            ))}
            {Array.from({ length: Math.max(0, cols - row.cells.length) }, (_, index) => (
              <View key={`pad${index}`} className="min-w-0 flex-1" />
            ))}
          </View>
        ),
      )}
    </View>
  );
}
