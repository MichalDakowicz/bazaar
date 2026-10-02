import type { Product } from '@/lib/catalog';
import { categoryName, type CategoryKey, type Lang } from '@/lib/categories';
import { isLive, itemAlt, itemName, type ListView } from '@/lib/listModel';
import { optionSetFor } from '@/lib/optionSets';
import { productAlt, productName } from '@/lib/search';
import type { ListItem } from '@/types/bazaar';

/**
 * The web planner's arithmetic: which cells a section or a search becomes, how
 * they break into grid rows with the open product's panel dropped in after its
 * row, and how the list at the right is cut into "Just added" and sections.
 *
 * Pure on purpose — the planner hook only wires it to state.
 */

/** A section can hold 230+ products; the grid draws this many, then offers more. */
export const PAGE_SIZE = 120;
/** The list at the right, and the narrowest window that has room for it. */
export const LIST_COLUMN = 360;
export const LIST_MIN_WINDOW = 1180;
/** "Just added" keeps the last few, not a session's worth. */
export const JUST_KEEP = 12;

/** One column when searching (a result carries its reasons); three when the centre is roomy, else two. */
export function gridColumns(searching: boolean, centreWidth: number): number {
  if (searching) return 1;
  return centreWidth >= 700 ? 3 : 2;
}

export type NoteWords = {
  onList: (list: string) => string;
  matched: (name: string) => string;
};

/** The quiet line under a product's name. */
export function cellNote(input: {
  searching: boolean;
  /** The other language's name. */
  alt: string;
  /** Set when the product was found through its other-language name. */
  via: string | null;
  /** The option set's one-line hint: "size · farming". */
  hint: string | null;
  category: string;
  here: { listName: string; opt: string; qty: string } | null;
  words: NoteWords;
}): string {
  const { searching, alt, via, hint, category, here, words } = input;
  const onList = here
    ? [words.onList(here.listName), here.opt, here.qty !== '1' ? here.qty : ''].filter(Boolean).join(' · ')
    : '';

  if (searching) {
    // The name is the whole headline in a result, so its twin leads the line —
    // unless the twin is what matched, which the line then says instead.
    if (onList) return [alt, onList].filter(Boolean).join(' · ');
    if (via) return words.matched(via);
    return [alt, hint || category].filter(Boolean).join(' · ');
  }
  // Three narrow columns have room for one thing: being on the list outranks the twin.
  return onList || [alt, hint].filter(Boolean).join(' · ');
}

export type PlannerCell = {
  id: string;
  product: Product;
  cat: CategoryKey;
  name: string;
  note: string;
  onList: boolean;
  hasOptions: boolean;
};

export function buildCell(
  product: Product,
  context: {
    lang: Lang;
    searching: boolean;
    via: string | null;
    here: ListItem | null;
    listName: string;
    words: NoteWords;
  },
): PlannerCell {
  const set = optionSetFor(product.id);
  const { lang, searching, via, here, listName, words } = context;
  return {
    id: product.id,
    product,
    cat: product.cat,
    name: productName(product, lang),
    note: cellNote({
      searching,
      alt: productAlt(product, lang),
      via,
      hint: set?.hint ?? null,
      category: categoryName(product.cat, lang),
      here: here ? { listName, opt: here.opt, qty: here.qty } : null,
      words,
    }),
    onList: !!here,
    hasOptions: !!set,
  };
}

export type GridRow<T> = { type: 'cells'; key: string; cells: T[] } | { type: 'panel'; key: string };

/** Cells in rows of `cols`, with the open product's panel straight after the row that holds it. */
export function layoutRows<T extends { id: string }>(cells: readonly T[], cols: number, openId: string | null): GridRow<T>[] {
  const width = Math.max(1, Math.floor(cols));
  const rows: GridRow<T>[] = [];
  for (let start = 0; start < cells.length; start += width) {
    const slice = cells.slice(start, start + width);
    rows.push({ type: 'cells', key: slice[0].id, cells: slice });
    if (openId && slice.some((cell) => cell.id === openId)) rows.push({ type: 'panel', key: `panel:${openId}` });
  }
  return rows;
}

/** One line of the list at the right: "Milk" and the muted " · Mleko · 3.2%". */
export type PlannerLine = {
  id: string;
  item: ListItem;
  name: string;
  rest: string;
  qty: string;
  ticked: boolean;
};

export function toLine(item: ListItem, lang: Lang): PlannerLine {
  const tail = [itemAlt(item, lang), item.opt].filter(Boolean);
  return {
    id: item.id,
    item,
    name: itemName(item, lang),
    rest: tail.length > 0 ? ` · ${tail.join(' · ')}` : '',
    qty: item.qty,
    ticked: item.checkedAt !== null,
  };
}

export type PlannerSection = { key: string; title: string; lines: PlannerLine[] };

/**
 * What was put on the list from this screen, newest first. Items that have since
 * gone (the Undo on the toast) simply fall out; they are looked up, never kept.
 */
export function justLines(items: readonly ListItem[], justIds: readonly string[], lang: Lang): PlannerLine[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const lines: PlannerLine[] = [];
  for (let index = justIds.length - 1; index >= 0; index -= 1) {
    const item = byId.get(justIds[index]);
    if (item && isLive(item)) lines.push(toLine(item, lang));
  }
  return lines;
}

/** The list in shop order, then the basket — minus whatever "Just added" already shows. */
export function listSections(view: ListView, justIds: readonly string[], basketTitle: string, lang: Lang): PlannerSection[] {
  const skip = new Set(justIds);
  const sections: PlannerSection[] = view.groups
    .map((group) => ({
      key: group.cat,
      title: group.name,
      lines: group.items.filter((item) => !skip.has(item.id)).map((item) => toLine(item, lang)),
    }))
    .filter((section) => section.lines.length > 0);
  const basket = view.inBasket.filter((item) => !skip.has(item.id));
  if (basket.length > 0) sections.push({ key: 'basket', title: basketTitle, lines: basket.map((item) => toLine(item, lang)) });
  return sections;
}
