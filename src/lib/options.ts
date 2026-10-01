import { fold } from '@/lib/text';

/**
 * Product options — the "which flour?" a plain list item cannot answer.
 *
 * A product with options (flour, eggs, milk…) carries groups, each a small
 * question: grain, type, pack. Every group has a sensible default, and the typed
 * query can answer groups on its own — "mąka do pierogów" is wheat flour, typ 550
 * without the user touching a tile — in which case the group is marked as
 * *inferred* and says which word it heard. Any group can be skipped ("Any"), and
 * the whole picker can be skipped ("Just add").
 *
 * Pure: the screens only render a `Resolution`.
 */

/** `null` is "Any" — the user declined to choose. */
export type OptionValue = string | number | null;

export type Picked = Record<string, OptionValue>;

export type OptionChoice = {
  value: OptionValue;
  label: string;
  /** The small second line: "pszenna", "63–73 g". */
  sub?: string;
  /** A leading mark on a row choice: the digit stamped on an egg shell. */
  lead?: string;
  /** What the item's option text says instead of `label` ("typ 550"). */
  text?: string;
};

export type GroupKind = 'tiles' | 'rows' | 'chips';

export type OptionGroupDef = {
  id: string;
  /** Bilingual on purpose: "Grain · zboże". Options are where the two languages teach each other. */
  label: string;
  kind: GroupKind;
  /** Tile columns. */
  cols?: number;
  /** The choices on offer, given what the earlier groups resolved to. */
  choices: (resolved: Picked) => OptionChoice[];
  fallback: (resolved: Picked) => OptionValue;
  hint?: (resolved: Picked) => string;
  /** This group is the item's quantity ("2 L"), not part of its option text. */
  isQty?: boolean;
};

/** A word in the query that answers a group. `'max'` means the last choice on offer. */
export type InferRule = { words: string[]; set: Record<string, OptionValue | 'max'> };

export type OptionSet = {
  productId: string;
  /** The line under the product while it is not selected: "grain · type". */
  hint: string;
  groups: OptionGroupDef[];
  infer: InferRule[];
};

export type ResolvedChoice = OptionChoice & { selected: boolean };

export type ResolvedGroup = {
  id: string;
  label: string;
  kind: GroupKind;
  cols: number;
  choices: ResolvedChoice[];
  value: OptionValue;
  /** The query answered this group. */
  inferred: boolean;
  /** The word the query was heard by — shown as “from pierogów”. */
  why: string;
  /** Chosen as Any. */
  isAny: boolean;
  hint: string;
};

export type Resolution = {
  groups: ResolvedGroup[];
  /** "Wheat · typ 550" — the option text stored on the item. */
  opt: string;
  /** "1 kg" — the pack group, or "1" when it is skipped. */
  qty: string;
};

/** Read what the query says about each group. */
function inferFrom(set: OptionSet, query: string): { values: Picked; why: Record<string, string> } {
  const folded = ` ${fold(query)} `;
  const rawTokens = query.split(/\s+/).filter(Boolean);
  const values: Picked = {};
  const why: Record<string, string> = {};
  for (const rule of set.infer) {
    const hit = rule.words.find((word) => folded.includes(word));
    if (!hit) continue;
    const trimmed = hit.trim();
    const spoken = rawTokens.find((token) => fold(token).includes(trimmed)) ?? trimmed;
    for (const [group, value] of Object.entries(rule.set)) {
      values[group] = value as OptionValue;
      why[group] = spoken;
    }
  }
  return { values, why };
}

/**
 * The picker's state for one product, one query and the user's manual picks.
 * Manual beats inferred beats default, and a value the choices no longer offer
 * (typ 650 after switching to rye) falls back to the group's default.
 */
export function resolveOptions(set: OptionSet, query: string, manual: Picked = {}): Resolution {
  const { values: inferred, why } = inferFrom(set, query);
  const resolved: Picked = {};
  const labels: Record<string, string | null> = {};
  const texts: Record<string, string | null> = {};

  const groups = set.groups.map((group): ResolvedGroup => {
    const choices = group.choices(resolved);
    let value: OptionValue =
      manual[group.id] !== undefined
        ? manual[group.id]
        : inferred[group.id] !== undefined
          ? inferred[group.id]
          : group.fallback(resolved);
    if (value === ('max' as OptionValue)) value = choices[choices.length - 1]?.value ?? null;
    if (value !== null && !choices.some((choice) => choice.value === value)) value = group.fallback(resolved);
    resolved[group.id] = value;

    const current = choices.find((choice) => choice.value === value);
    labels[group.id] = current ? current.label : null;
    texts[group.id] = current ? (current.text ?? current.label) : null;

    const wasInferred = manual[group.id] === undefined && inferred[group.id] !== undefined && value !== null;
    const hint = value !== null && group.hint ? group.hint(resolved) : '';
    return {
      id: group.id,
      label: group.label,
      kind: group.kind,
      cols: group.cols ?? 4,
      choices: choices.map((choice) => ({ ...choice, selected: choice.value === value })),
      value,
      inferred: wasInferred,
      why: wasInferred ? why[group.id] : '',
      isAny: value === null,
      hint,
    };
  });

  const opt = set.groups
    .filter((group) => !group.isQty)
    .map((group) => texts[group.id])
    .filter((text): text is string => !!text)
    .join(' · ');
  const qtyGroup = set.groups.find((group) => group.isQty);
  const qty = (qtyGroup && labels[qtyGroup.id]) || '1';

  return { groups, opt, qty };
}

/** A manual pick toggles: tapping the chosen value again clears it to Any. */
export function pick(manual: Picked, group: ResolvedGroup, value: OptionValue): Picked {
  return { ...manual, [group.id]: group.value === value ? null : value };
}

/** Whether a query says anything about a set's groups — drives "from …" captions in tests. */
export function inferredGroups(set: OptionSet, query: string): string[] {
  return Object.keys(inferFrom(set, query).values);
}
