import type { CategoryKey } from '@/lib/catalog/types';
import type { Lang } from '@/lib/categories';
import type { Strings } from '@/lib/i18n';
import { toggleRow, type PlanRow, type RecipeReason } from '@/lib/recipe';
import { productAlt, productName } from '@/lib/search';

/**
 * One row of the recipe plan, worded. `planRecipe` decides what each ingredient
 * *is*; this says it in the household's language so the row component only has
 * to draw strings. Pure, so the sentences are tested rather than eyeballed.
 */

export type RecipeLine = {
  id: string;
  /** The pasted line the row came from — what a switch is keyed by. */
  raw: string;
  on: boolean;
  cat: CategoryKey;
  name: string;
  /** The other language's name, or '' when there is none worth printing. */
  alt: string;
  /** Why the plan did what it did: "Not on the list yet". */
  reason: string;
  /** The right-hand cell: "1 L", "→ 300 g", "covered", "skip". */
  act: string;
};

export function reasonText(reason: RecipeReason, t: Strings): string {
  switch (reason.kind) {
    case 'new':
      return t.reasonNew;
    case 'covered':
      return t.reasonCovered(reason.have, reason.need);
    case 'update':
      return t.reasonUpdate(reason.have, reason.need);
    case 'home':
      return t.reasonHome;
    case 'custom':
      return t.reasonCustom;
  }
}

/**
 * Covered and skipped rows say so while they are off. Switch one on and it is
 * simply added (`applyPlan`), so the cell tells you what it will add.
 */
export function actText(row: PlanRow, t: Strings): string {
  if (row.action === 'covered') return row.on ? row.add.qty : t.actCovered;
  if (row.action === 'skip') return row.on ? row.add.qty : t.actSkip;
  return row.act;
}

export function recipeLine(row: PlanRow, t: Strings, lang: Lang): RecipeLine {
  const names = { en: row.nameEn, pl: row.namePl };
  const name = productName(names, lang);
  const alt = productAlt(names, lang);
  return {
    id: row.id,
    raw: row.raw,
    on: row.on,
    cat: row.cat,
    name,
    alt: alt === name ? '' : alt,
    reason: reasonText(row.reason, t),
    act: actText(row, t),
  };
}

/**
 * Apply the user's switches over a fresh plan. Rows are keyed by the line they
 * came from, not by position, so editing a different line of the paste does not
 * flip the wrong ingredient.
 */
export function withFlips(rows: readonly PlanRow[], flipped: ReadonlySet<string>): PlanRow[] {
  return rows.reduce<PlanRow[]>((acc, row) => (flipped.has(row.raw) ? toggleRow(acc, row.id) : acc), [...rows]);
}
