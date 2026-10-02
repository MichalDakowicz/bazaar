import type { OptionSet } from '@/lib/options';

import { BUTTER, MILK, QUARK, SOUR_CREAM } from './dairy';
import { EGGS } from './eggs';
import { FLOUR } from './flour';
import { RICE, SUGAR, TOMATOES } from './staples';

/**
 * The products that ask a follow-up question. Keyed by catalogue id.
 *
 * Adding one is data: a few groups, the words in a query that answer them, and a
 * default for each. Flour, eggs and milk come from the approved design; the rest
 * are the products where "which one?" is a real question in a Polish shop. A
 * product that is not here simply adds with one tap.
 */
export const OPTION_SETS: readonly OptionSet[] = [FLOUR, EGGS, MILK, BUTTER, SOUR_CREAM, QUARK, SUGAR, RICE, TOMATOES];

const BY_PRODUCT = new Map(OPTION_SETS.map((set) => [set.productId, set]));

/** The option set a catalogue product asks, or null for a one-tap product. */
export function optionSetFor(productId: string | null | undefined): OptionSet | null {
  return productId ? (BY_PRODUCT.get(productId) ?? null) : null;
}
