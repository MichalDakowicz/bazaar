import { categoryAlt, categoryName, CATEGORY_ORDER, type Lang } from '@/lib/categories';
import type { CategoryKey } from '@/lib/catalog/types';
import { productAlt, productName } from '@/lib/search';
import type { ListItem, NewItem } from '@/types/bazaar';

/**
 * A list, as the screen draws it. Everything here is derived — the database
 * stores items, and "to get", "in basket", the sections and the progress bar are
 * all read off them, never kept (PING.md §9.4: the score is the truth).
 */

export type ItemGroup = {
  cat: CategoryKey;
  name: string;
  alt: string;
  items: ListItem[];
};

export type ListView = {
  /** Unticked items, by shop section, in the order a shop walks them. */
  groups: ItemGroup[];
  /** Ticked items, most recently ticked first. */
  inBasket: ListItem[];
  total: number;
  done: number;
  left: number;
  /** 0–100, whole number. */
  percent: number;
};

/** An item still on the list: not carried out of the shop in a finished trip. */
/**
 * An item as the payload that would put it back. Everything an Undo re-inserts
 * comes through here, so what survives a remove — the name, options and amount,
 * but not the tick or who added it — is decided in one place.
 */
export function toNewItem(item: ListItem): NewItem {
  return {
    productId: item.productId,
    cat: item.cat,
    nameEn: item.nameEn,
    namePl: item.namePl,
    opt: item.opt,
    qty: item.qty,
  };
}

export function isLive(item: ListItem): boolean {
  return item.tripId === null;
}

export function isChecked(item: ListItem): boolean {
  return item.checkedAt !== null;
}

export function itemName(item: ListItem, lang: Lang): string {
  return productName({ en: item.nameEn, pl: item.namePl }, lang);
}

/** The other language's name — "Pomidory" under "Tomatoes". */
export function itemAlt(item: ListItem, lang: Lang): string {
  const alt = productAlt({ en: item.nameEn, pl: item.namePl }, lang);
  return alt === itemName(item, lang) ? '' : alt;
}

export function viewList(items: readonly ListItem[], lang: Lang): ListView {
  const live = items.filter(isLive);
  const open = live.filter((item) => !isChecked(item));
  const checked = live.filter(isChecked);

  const groups: ItemGroup[] = [];
  for (const cat of CATEGORY_ORDER) {
    const inSection = open
      .filter((item) => item.cat === cat)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (inSection.length === 0) continue;
    groups.push({ cat, name: categoryName(cat, lang), alt: categoryAlt(cat, lang), items: inSection });
  }

  const inBasket = [...checked].sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''));
  const total = live.length;
  return {
    groups,
    inBasket,
    total,
    done: checked.length,
    left: open.length,
    percent: total === 0 ? 0 : Math.round((checked.length / total) * 100),
  };
}

/** The unticked live item that already stands for a product — what "on the list" means. */
export function findOnList(
  items: readonly ListItem[],
  product: { id?: string | null; en: string },
): ListItem | null {
  return (
    items.find(
      (item) =>
        isLive(item) &&
        !isChecked(item) &&
        (product.id ? item.productId === product.id : item.nameEn.toLowerCase() === product.en.toLowerCase()),
    ) ?? null
  );
}

/** The last few things ticked, newest first — "Just picked up". */
export function justPicked(items: readonly ListItem[], count = 4): ListItem[] {
  return items
    .filter((item) => isLive(item) && isChecked(item))
    .sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''))
    .slice(0, count);
}

/** "Quark · half-fat" — the second line under an item: the other name and the picked options. */
export function itemSubline(item: ListItem, lang: Lang): { alt: string; opt: string } {
  return { alt: itemAlt(item, lang), opt: item.opt };
}
