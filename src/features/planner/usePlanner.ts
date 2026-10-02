import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TextInput, useWindowDimensions } from 'react-native';

import { useAdder } from '@/features/add/useAdder';
import { useProductSearch } from '@/features/add/useProductSearch';
import { useLang } from '@/features/bazaar/useBazaarSettings';
import { useWorkspace } from '@/features/bazaar/useWorkspace';
import { usePlannerCopy } from '@/features/planner/copy';
import { usePlannerCells } from '@/features/planner/usePlannerCells';
import { usePlannerList } from '@/features/planner/usePlannerList';
import { usePlannerShortcuts } from '@/features/planner/usePlannerShortcuts';
import { SIDEBAR_WIDTH } from '@/hooks/useResponsive';
import { categoryAlt, categoryName } from '@/lib/categories';
import { optionSetFor } from '@/lib/optionSets';
import { pick, resolveOptions, type OptionValue, type Picked, type ResolvedGroup } from '@/lib/options';
import {
  gridColumns,
  JUST_KEEP,
  layoutRows,
  LIST_COLUMN,
  LIST_MIN_WINDOW,
  PAGE_SIZE,
  type PlannerCell,
} from '@/lib/planner';
import { productAlt, productName } from '@/lib/search';
import { productToItem } from '@/lib/usuals';
import { useBazaarPrefs, useBazaarUi } from '@/store/bazaarPrefs';
import type { NewItem } from '@/types/bazaar';

/** The open product's panel: its questions, and the three things you can do with it. */
export type PlannerPanel = {
  name: string;
  alt: string;
  groups: ResolvedGroup[];
  /** "Wheat · typ 550 · 1 kg" — what Add will write. */
  summary: string;
  choose: (group: ResolvedGroup, value: OptionValue) => void;
  skip: (group: ResolvedGroup) => void;
  close: () => void;
  add: () => void;
  justAdd: () => void;
};

/** Which product's panel is open: a product id, `auto` (the first one a search finds), or none. */
type Open = string | null;
/** Horizontal padding of the centre column, both sides. */
const CENTRE_PADDING = 64;

/**
 * Everything the web planner shows and does, in one place.
 *
 * It borrows the phone's search brain for the query and the matches
 * (`useProductSearch`) but keeps its own idea of the *open* product: the phone
 * always has one open panel, the planner can close it, and it also opens panels
 * while browsing a section, where there is no query to borrow.
 */
export function usePlanner() {
  const { t, productLang } = useLang();
  const copy = usePlannerCopy();
  const workspace = useWorkspace();
  const { list, items, add, onList } = useAdder();
  const search = useProductSearch();
  const catalogCat = useBazaarPrefs((state) => state.catalogCat);
  const openSheet = useBazaarUi((state) => state.open);
  const searchRequests = useBazaarUi((state) => state.searchRequests);
  const { width: windowWidth } = useWindowDimensions();

  const input = useRef<TextInput>(null);
  const [open, setOpen] = useState<Open>(null);
  const [manual, setManual] = useState<Record<string, Picked>>({});
  const [shown, setShown] = useState(PAGE_SIZE);
  const [justIds, setJustIds] = useState<string[]>([]);
  const [seenCat, setSeenCat] = useState(catalogCat);

  const focus = useCallback(() => {
    setTimeout(() => input.current?.focus(), 0);
  }, []);

  const changeQuery = (text: string) => {
    search.setQuery(text);
    setOpen(text.trim() ? 'auto' : null);
    setManual({});
    setShown(PAGE_SIZE);
  };

  // A different section is a different page: the sidebar sets it, we start clean.
  if (seenCat !== catalogCat) {
    setSeenCat(catalogCat);
    changeQuery('');
  }

  const query = search.query;
  const { searching, section, cells } = usePlannerCells({ search, catalogCat, shown, listName: list?.name ?? '', onList });

  const openCell = useMemo(() => {
    if (open === 'auto') return searching ? (cells.find((cell) => cell.hasOptions) ?? null) : null;
    return open ? (cells.find((cell) => cell.id === open && cell.hasOptions) ?? null) : null;
  }, [open, searching, cells]);

  const resolution = useMemo(() => {
    const set = openCell ? optionSetFor(openCell.id) : null;
    if (!openCell || !set) return null;
    return resolveOptions(set, searching ? query : '', manual[openCell.id] ?? {});
  }, [openCell, searching, query, manual]);

  /** The write behind every way of adding. The panel closes at once; the list answers when it can. */
  const record = async (item: NewItem) => {
    setOpen(null);
    focus();
    const ids = await add(item);
    if (ids) setJustIds((current) => [...current, ...ids].slice(-JUST_KEEP));
  };

  const addOpen = () => {
    if (openCell && resolution) void record(productToItem(openCell.product, resolution.opt, resolution.qty));
  };

  const clear = () => {
    changeQuery('');
    setOpen(null);
  };

  const tap = (cell: PlannerCell) => {
    focus();
    if (cell.hasOptions) setOpen(openCell?.id === cell.id ? null : cell.id);
    else if (!cell.onList) void record(productToItem(cell.product));
  };
  // Cells are memoized; the handler they hold must not change with every keystroke.
  const latestTap = useRef(tap);
  useEffect(() => {
    latestTap.current = tap;
  });
  const onCell = useCallback((cell: PlannerCell) => latestTap.current(cell), []);

  usePlannerShortcuts(clear);

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchRequests]);

  const showList = windowWidth >= LIST_MIN_WINDOW;
  const centre = windowWidth - SIDEBAR_WIDTH - (showList ? LIST_COLUMN : 0) - CENTRE_PADDING;
  const cols = gridColumns(searching, centre);

  const panel: PlannerPanel | null =
    openCell && resolution
      ? {
          name: productName(openCell.product, productLang),
          alt: productAlt(openCell.product, productLang),
          groups: resolution.groups,
          summary: [resolution.opt, resolution.qty].filter(Boolean).join(' · '),
          choose: (group, value) => {
            setManual((current) => ({ ...current, [openCell.id]: pick(current[openCell.id] ?? {}, group, value) }));
            focus();
          },
          skip: (group) => {
            setManual((current) => ({ ...current, [openCell.id]: { ...(current[openCell.id] ?? {}), [group.id]: null } }));
            focus();
          },
          close: () => {
            setOpen(null);
            focus();
          },
          add: addOpen,
          justAdd: () => void record(productToItem(openCell.product)),
        }
      : null;

  const listModel = usePlannerList(list, items, justIds);
  const typed = query.trim();
  const hidden = searching ? 0 : Math.max(0, section.length - shown);

  return {
    input,
    focusRequests: searchRequests,
    query,
    setQuery: changeQuery,
    clear,
    /** Enter in the search field adds the open product as configured. */
    submit: addOpen,
    openRecipe: () => openSheet({ kind: 'recipe' }),

    searching,
    title: searching ? t.results : categoryName(catalogCat, productLang),
    subtitle: searching ? `“${typed}”` : categoryAlt(catalogCat, productLang),
    count: t.products(searching ? search.matches.length : section.length),
    cols,
    rows: layoutRows(cells, cols, openCell?.id ?? null),
    openId: openCell?.id ?? null,
    onCell,
    panel,
    more: hidden > 0 ? { label: copy.showMore(Math.min(hidden, PAGE_SIZE)), onPress: () => setShown((current) => current + PAGE_SIZE) } : null,
    nothingFor: search.noResults ? typed : null,
    addTyped: () => {
      void record({ productId: null, cat: 'pantry', nameEn: typed, namePl: typed, opt: '', qty: '1' });
      changeQuery('');
    },

    showList,
    loading: workspace.loading,
    error: workspace.error,
    refetch: workspace.refetch,
    list: listModel,
    newList: () => openSheet({ kind: 'newList' }),
  };
}
