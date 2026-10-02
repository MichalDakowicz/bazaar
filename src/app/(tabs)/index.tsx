import { PlannerScreen } from '@/features/planner/PlannerScreen';
import { ListsScreen } from '@/features/lists/ListsScreen';
import { useIsDesktop } from '@/hooks/useResponsive';

/**
 * Lists. On a phone, the lists you have; in a wide browser window, the planner
 * for the one you are filling — the same destination, the two shapes the design
 * gives it ("web is for adding, phone is for shopping").
 */
export default function ListsTab() {
  return useIsDesktop() ? <PlannerScreen /> : <ListsScreen />;
}
