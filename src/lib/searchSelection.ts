import { optionSetFor } from '@/lib/optionSets';
import type { Match } from '@/lib/search';

/** A lower-ranked generic picker must not hide a more specific catalogue match. */
export function searchSelection(matches: readonly Match[], selectedId: string | null): Match | null {
  const match = selectedId ? matches.find(({ product }) => product.id === selectedId) : matches[0];
  return match && optionSetFor(match.product.id) ? match : null;
}
