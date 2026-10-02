import { useMemo, useState } from 'react';

import { useLang } from '@/features/bazaar/useBazaarSettings';
import type { Product } from '@/lib/catalog';
import { pick, resolveOptions, type OptionValue, type Picked, type ResolvedGroup, type Resolution } from '@/lib/options';
import { optionSetFor } from '@/lib/optionSets';
import { searchProducts, type Match } from '@/lib/search';
import { suggestFor, TRIES, type Suggestion } from '@/lib/suggestions';
import { productToItem } from '@/lib/usuals';
import type { NewItem } from '@/types/bazaar';

export type ProductSearch = {
  query: string;
  setQuery: (query: string) => void;
  matches: Match[];
  /** The products that ask a follow-up question, and the one currently open. */
  selected: Match | null;
  select: (productId: string | null) => void;
  resolution: Resolution | null;
  /** Tapping a tile picks it; tapping the picked one again clears it to Any. */
  choose: (group: ResolvedGroup, value: OptionValue) => void;
  skip: (group: ResolvedGroup) => void;
  /** What "Add" writes for the open product. */
  itemFor: (match: Match) => NewItem;
  /** What "Just add" writes: the product with nothing chosen. */
  bareItemFor: (product: Product) => NewItem;
  others: Match[];
  suggestion: Suggestion | null;
  tries: string[];
  hasQuery: boolean;
  noResults: boolean;
};

/**
 * The search box's whole brain, shared by the phone's Add screen and the web
 * planner: what the query finds, which product's options are open, what the
 * query already answered, and what the user changed by hand.
 *
 * Manual picks are kept per product and cleared whenever the query changes — the
 * words typed are the question, and a pick made for "mąka do pierogów" should
 * not outlive "mleko".
 */
export function useProductSearch(initial = ''): ProductSearch {
  const { productLang, appLang } = useLang();
  const [query, setQueryState] = useState(initial);
  const [selId, setSelId] = useState<string | null>(null);
  const [manual, setManual] = useState<Record<string, Picked>>({});

  const matches = useMemo(() => searchProducts(query, productLang), [query, productLang]);
  const withOptions = useMemo(() => matches.filter((match) => optionSetFor(match.product.id)), [matches]);
  const selected = useMemo(
    () => withOptions.find((match) => match.product.id === selId) ?? withOptions[0] ?? null,
    [withOptions, selId],
  );
  const set = selected ? optionSetFor(selected.product.id) : null;
  const picks = useMemo<Picked>(() => (selected ? (manual[selected.product.id] ?? {}) : {}), [selected, manual]);
  const resolution = useMemo(() => (set ? resolveOptions(set, query, picks) : null), [set, query, picks]);

  const setPicks = (productId: string, next: Picked) => setManual((current) => ({ ...current, [productId]: next }));

  return {
    query,
    setQuery: (next) => {
      setQueryState(next);
      setSelId(null);
      setManual({});
    },
    matches,
    selected,
    select: setSelId,
    resolution,
    choose: (group, value) => {
      if (selected) setPicks(selected.product.id, pick(picks, group, value));
    },
    skip: (group) => {
      if (selected) setPicks(selected.product.id, { ...picks, [group.id]: null });
    },
    itemFor: (match) => {
      const matchSet = optionSetFor(match.product.id);
      if (!matchSet) return productToItem(match.product);
      const resolved = resolveOptions(matchSet, query, manual[match.product.id] ?? {});
      return productToItem(match.product, resolved.opt, resolved.qty);
    },
    bareItemFor: (product) => productToItem(product),
    others: matches.filter((match) => match !== selected),
    suggestion: suggestFor(query, appLang),
    tries: TRIES[productLang],
    hasQuery: matches.length > 0 || query.trim().length > 0,
    noResults: query.trim().length >= 2 && matches.length === 0,
  };
}
