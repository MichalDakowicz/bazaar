import { CatalogScreen } from '@/features/catalog/CatalogScreen';
import { PlannerScreen } from '@/features/planner/PlannerScreen';
import { useIsDesktop } from '@/hooks/useResponsive';

/** Catalog. In a wide window it is the planner, browsing the section picked in the sidebar. */
export default function CatalogTab() {
  return useIsDesktop() ? <PlannerScreen /> : <CatalogScreen />;
}
