import { productById, type Product } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import { resolveOptions } from '@/lib/options';
import { optionSetFor } from '@/lib/optionSets';
import type { ListItem, NewItem } from '@/types/bazaar';

/**
 * "Your usuals": the things you keep buying, exactly as you bought them.
 *
 * Derived from the items that have crossed your lists — never stored, never
 * curated. A thing earns its place by being bought twice; eggs that were bought
 * as "L · Free-range, 10" come back as exactly that, one tap.
 */

export type Usual = {
  key: string;
  productId: string | null;
  cat: CategoryKey;
  nameEn: string;
  namePl: string;
  opt: string;
  qty: string;
  count: number;
  lastAt: string;
};

const DAY = 24 * 60 * 60_000;
/** Bought this recently counts double: what you buy now is what you will buy next. */
const RECENT_DAYS = 45;

function keyOf(item: ListItem): string {
  return `${item.productId ?? `x:${item.nameEn.toLowerCase()}`}|${item.opt.toLowerCase()}`;
}

export function buildUsuals(history: readonly ListItem[], now: number, limit = 6): Usual[] {
  const groups = new Map<string, { sample: ListItem; count: number; score: number; lastAt: string }>();
  for (const item of history) {
    const key = keyOf(item);
    const age = now - new Date(item.createdAt).getTime();
    const weight = age <= RECENT_DAYS * DAY ? 2 : 1;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { sample: item, count: 1, score: weight, lastAt: item.createdAt });
    } else {
      group.count += 1;
      group.score += weight;
      // The most recent purchase decides the quantity: it is the one you would repeat.
      if (item.createdAt > group.lastAt) {
        group.lastAt = item.createdAt;
        group.sample = item;
      }
    }
  }

  return [...groups.entries()]
    .filter(([, group]) => group.count >= 2)
    .sort(([, a], [, b]) => b.score - a.score || b.lastAt.localeCompare(a.lastAt))
    .slice(0, limit)
    .map(([key, { sample, count, lastAt }]) => ({
      key,
      productId: sample.productId,
      cat: sample.cat,
      nameEn: sample.nameEn,
      namePl: sample.namePl,
      opt: sample.opt,
      qty: sample.qty,
      count,
      lastAt,
    }));
}

/** What a brand-new household is offered until its own history can speak. */
const STARTERS = ['milk', 'eggs', 'rye-bread', 'butter', 'tomatoes', 'bananas'];

export function starterUsuals(): Usual[] {
  const out: Usual[] = [];
  for (const id of STARTERS) {
    const product = productById(id);
    if (!product) continue;
    const set = optionSetFor(id);
    const resolved = set ? resolveOptions(set, '') : null;
    out.push({
      key: `starter|${id}`,
      productId: id,
      cat: product.cat,
      nameEn: product.en,
      namePl: product.pl,
      opt: resolved?.opt ?? '',
      qty: resolved?.qty ?? '1',
      count: 0,
      lastAt: '',
    });
  }
  return out;
}

export function usualToItem(usual: Usual): NewItem {
  return {
    productId: usual.productId,
    cat: usual.cat,
    nameEn: usual.nameEn,
    namePl: usual.namePl,
    opt: usual.opt,
    qty: usual.qty,
  };
}

/** A catalogue product as an item with nothing chosen — the "Just add" payload. */
export function productToItem(product: Product, opt = '', qty = '1'): NewItem {
  return { productId: product.id, cat: product.cat, nameEn: product.en, namePl: product.pl, opt, qty };
}
