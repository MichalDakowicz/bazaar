import { type Product } from '@/lib/catalog';
import type { CategoryKey } from '@/lib/catalog/types';
import type { Lang } from '@/lib/categories';
import { customItem } from '@/lib/customItem';
import { resolveOptions } from '@/lib/options';
import { optionSetFor } from '@/lib/optionSets';
import { compareQty, formatQty, parseQty, shopQty, splitLeadingQty, type Qty } from '@/lib/quantity';
import { searchProducts } from '@/lib/search';
import { isChecked, isLive } from '@/lib/listModel';
import type { Usual } from '@/lib/usuals';
import type { ListItem, NewItem } from '@/types/bazaar';

/**
 * Paste a recipe, get a shopping plan.
 *
 * The pasted text is read line by line into ingredients, each matched to the
 * catalogue, and then compared with what is already on the list — because the
 * useful answer is not "here are eight ingredients" but "two of these are
 * covered, one needs more, three are already at home, and these two are new".
 * Everything the screen shows comes out of `planRecipe`, and everything it
 * writes goes in through `applyPlan`; neither touches the network.
 */

export type RecipeAction = 'add' | 'update' | 'covered' | 'skip' | 'custom';

export type RecipeReason =
  | { kind: 'covered'; have: string; need: string }
  | { kind: 'update'; have: string; need: string }
  | { kind: 'home' }
  | { kind: 'new' }
  | { kind: 'custom' };

export type PlanRow = {
  id: string;
  raw: string;
  product: Product | null;
  nameEn: string;
  namePl: string;
  cat: CategoryKey;
  action: RecipeAction;
  /** Whether the row is ticked to be applied. Covered and skipped rows start off. */
  on: boolean;
  reason: RecipeReason;
  /** The right-hand cell: "1 L", "→ 300 g", or empty for covered / skipped (the screen words those). */
  act: string;
  /** What adding this row writes. Always present, so an off row can be switched on. */
  add: NewItem;
  /** Present when the row would raise a quantity already on the list. */
  update: { itemId: string; qty: string } | null;
};

export type RecipePlan = { title: string; rows: PlanRow[] };

export type PlanContext = {
  items: readonly ListItem[];
  /** Catalogue ids the household never needs to buy. */
  alwaysHome: readonly string[];
  usuals?: readonly Usual[];
  lang: Lang;
};

const HEADER = /^(?:sk[łl]adniki|ingredients?|you(?:'|’)ll need|potrzebne|na\s+ciasto|na\s+farsz)\b.*:?$/i;
const BULLET = /^[-–—•*·✓☐□▪]\s*/;
/** A line longer than this with no quantity is a sentence of method, not an ingredient. */
const MAX_INGREDIENT_WORDS = 8;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

type Raw = { raw: string; need: Qty | null; text: string };

/** Split pasted text into a title and ingredient lines. */
export function readRecipe(text: string): { title: string; ingredients: Raw[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let title = '';
  const startsWithNumber = (line: string) => /^[-–—•*·✓☐□▪\s]*(?:\d|[½¼¾⅓⅔])/.test(line);
  const hasQuantities = lines.some(startsWithNumber);
  // "Pierogi ruskie (ok. 50 szt.)" — the first line is the dish, not a purchase,
  // when quantities follow it (or it carries a parenthetical like a yield).
  if (lines.length > 1 && !startsWithNumber(lines[0]) && !HEADER.test(lines[0]) && (hasQuantities || /\(/.test(lines[0]))) {
    title = lines[0].replace(/\s*\(.*?\)\s*/g, ' ').replace(/:$/, '').trim();
    lines.shift();
  }

  const ingredients: Raw[] = [];
  for (const original of lines) {
    const line = original.replace(BULLET, '').trim();
    if (!line || HEADER.test(line)) continue;
    const { qty, rest } = splitLeadingQty(line);
    const cleaned = rest.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    if (qty === null) {
      // "sól, pieprz" — several plain ingredients on one line.
      if (wordCount(cleaned) > MAX_INGREDIENT_WORDS) continue;
      for (const part of cleaned.split(/\s*(?:,|;|\bi\b|\band\b)\s*/i)) {
        const piece = part.trim();
        if (piece) ingredients.push({ raw: piece, need: null, text: piece });
      }
    } else {
      // "300 g twarogu półtłustego, startego" — everything after a comma is method.
      const name = cleaned.split(/\s*,\s*/)[0];
      if (name && wordCount(name) <= MAX_INGREDIENT_WORDS) ingredients.push({ raw: line, need: qty, text: name });
    }
  }
  return { title, ingredients };
}

function bestProduct(text: string, lang: Lang, usuals: readonly Usual[]): Product | null {
  const matches = searchProducts(text, lang, 12);
  if (matches.length === 0) return null;
  const top = matches[0];
  // Among the products that answer the line equally well, the one you actually
  // buy wins — "oleju" is a dozen oils, and yours is the rapeseed.
  const equal = matches.filter((m) => m.hits === top.hits && m.primary === top.primary);
  const usual = equal.find((m) => usuals.some((u) => u.productId === m.product.id));
  return (usual ?? top).product;
}

function liveItemFor(items: readonly ListItem[], product: Product): ListItem | null {
  return items.find((item) => isLive(item) && !isChecked(item) && item.productId === product.id) ?? null;
}

function addSpec(product: Product, text: string, need: Qty | null): NewItem {
  const set = optionSetFor(product.id);
  const resolved = set ? resolveOptions(set, text) : null;
  let qty = need ? formatQty(shopQty(need)) : '1';
  if (resolved) {
    // A product with a pack size (eggs, milk, flour) is bought by the pack: the
    // default pack stands unless the recipe needs more than it holds.
    const pack = parseQty(resolved.qty);
    const verdict = compareQty(pack, need);
    if (need === null || verdict === 'covers' || verdict === 'unknown') qty = resolved.qty;
  }
  return { productId: product.id, cat: product.cat, nameEn: product.en, namePl: product.pl, opt: resolved?.opt ?? '', qty };
}

export function planRecipe(text: string, context: PlanContext): RecipePlan {
  const { title, ingredients } = readRecipe(text);
  const usuals = context.usuals ?? [];
  const home = new Set(context.alwaysHome);
  const seen = new Set<string>();
  const rows: PlanRow[] = [];

  ingredients.forEach((ingredient, index) => {
    const id = String(index);
    const product = bestProduct(ingredient.text, context.lang, usuals);

    if (!product) {
      const name = ingredient.text.charAt(0).toUpperCase() + ingredient.text.slice(1);
      const add = customItem(name, ingredient.need ? formatQty(shopQty(ingredient.need)) : '1');
      if (!add) return;
      rows.push({
        id, raw: ingredient.raw, product: null, nameEn: name, namePl: name, cat: add.cat, action: 'custom', on: true,
        reason: { kind: 'custom' }, act: add.qty, add, update: null,
      });
      return;
    }

    // The same product named twice in one recipe is one purchase.
    if (seen.has(product.id)) return;
    seen.add(product.id);

    const add = addSpec(product, ingredient.text, ingredient.need);
    const base = { id, raw: ingredient.raw, product, nameEn: product.en, namePl: product.pl, cat: product.cat, add };

    if (home.has(product.id)) {
      rows.push({ ...base, action: 'skip', on: false, reason: { kind: 'home' }, act: '', update: null });
      return;
    }

    const onList = liveItemFor(context.items, product);
    if (!onList) {
      rows.push({ ...base, action: 'add', on: true, reason: { kind: 'new' }, act: add.qty, update: null });
      return;
    }

    const have = parseQty(onList.qty);
    const verdict = compareQty(have, ingredient.need);
    const needText = ingredient.need ? formatQty(ingredient.need) : '';
    if (verdict === 'short' && ingredient.need) {
      const qty = formatQty(shopQty(ingredient.need));
      rows.push({
        ...base, action: 'update', on: true,
        reason: { kind: 'update', have: onList.qty, need: needText }, act: `→ ${qty}`,
        update: { itemId: onList.id, qty },
      });
      return;
    }
    // Covers, or cannot be compared (2 cups against a kilo): it is already on the
    // list, and that is the honest answer — never double up on a guess.
    rows.push({
      ...base, action: 'covered', on: false,
      reason: { kind: 'covered', have: onList.qty, need: needText || onList.qty }, act: '', update: null,
    });
  });

  return { title, rows };
}

export function planTotals(rows: readonly PlanRow[]): { add: number; update: number } {
  let add = 0;
  let update = 0;
  for (const row of rows) {
    if (!row.on) continue;
    if (row.action === 'update' && row.update) update += 1;
    else add += 1;
  }
  return { add, update };
}

export type PlanWrites = {
  adds: NewItem[];
  updates: { itemId: string; qty: string }[];
};

/** The writes a plan implies. A covered or skipped row switched on is simply added. */
export function applyPlan(rows: readonly PlanRow[]): PlanWrites {
  const adds: NewItem[] = [];
  const updates: { itemId: string; qty: string }[] = [];
  for (const row of rows) {
    if (!row.on) continue;
    if (row.action === 'update' && row.update) updates.push(row.update);
    else adds.push(row.add);
  }
  return { adds, updates };
}

export function toggleRow(rows: readonly PlanRow[], id: string): PlanRow[] {
  return rows.map((row) => (row.id === id ? { ...row, on: !row.on } : row));
}
