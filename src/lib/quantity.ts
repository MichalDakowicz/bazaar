import { fold } from '@/lib/text';

/**
 * Quantities as people write them on a list: "2 kg", "250 g", "6 × 1.5 L",
 * "1 bunch", "10". Stored as the text they typed, read leniently here.
 *
 * Mass and volume convert (g/kg, ml/L, and the spoons and cups a recipe uses);
 * everything else is a count of something, and counts of different things do not
 * compare. The point of reading them at all is the recipe paste, which has to
 * answer "does the 1 kg of flour already on the list cover 500 g?" without a human.
 */

export type Dimension = 'mass' | 'volume' | 'count';

export type Qty = {
  /** Per pack: the 1.5 in "6 × 1.5 L". */
  amount: number;
  /** Canonical unit: g kg ml L, or a count word (bunch, pack…), or '' for plain pieces. */
  unit: string;
  /** The 6 in "6 × 1.5 L". 1 when there is no multiplier. */
  times: number;
  dim: Dimension;
};

type UnitDef = { dim: Dimension; unit: string; factor: number };

/**
 * Every spelling we read (folded) to what it means. `factor` turns the typed
 * amount into the canonical unit: 2 dag -> 20 g, 3 tbsp -> 45 ml, 2 kg -> 2 kg.
 */
const UNITS: Record<string, UnitDef> = {
  g: { dim: 'mass', unit: 'g', factor: 1 },
  gr: { dim: 'mass', unit: 'g', factor: 1 },
  gram: { dim: 'mass', unit: 'g', factor: 1 },
  gramy: { dim: 'mass', unit: 'g', factor: 1 },
  dag: { dim: 'mass', unit: 'g', factor: 10 },
  dkg: { dim: 'mass', unit: 'g', factor: 10 },
  kg: { dim: 'mass', unit: 'kg', factor: 1 },
  kilo: { dim: 'mass', unit: 'kg', factor: 1 },
  oz: { dim: 'mass', unit: 'g', factor: 28.3495 },
  lb: { dim: 'mass', unit: 'g', factor: 453.592 },
  lbs: { dim: 'mass', unit: 'g', factor: 453.592 },
  ml: { dim: 'volume', unit: 'ml', factor: 1 },
  cl: { dim: 'volume', unit: 'ml', factor: 10 },
  dl: { dim: 'volume', unit: 'ml', factor: 100 },
  l: { dim: 'volume', unit: 'L', factor: 1 },
  litr: { dim: 'volume', unit: 'L', factor: 1 },
  litry: { dim: 'volume', unit: 'L', factor: 1 },
  litre: { dim: 'volume', unit: 'L', factor: 1 },
  liter: { dim: 'volume', unit: 'L', factor: 1 },
  lyzka: { dim: 'volume', unit: 'ml', factor: 15 },
  lyzki: { dim: 'volume', unit: 'ml', factor: 15 },
  lyzek: { dim: 'volume', unit: 'ml', factor: 15 },
  tbsp: { dim: 'volume', unit: 'ml', factor: 15 },
  tablespoon: { dim: 'volume', unit: 'ml', factor: 15 },
  tablespoons: { dim: 'volume', unit: 'ml', factor: 15 },
  lyzeczka: { dim: 'volume', unit: 'ml', factor: 5 },
  lyzeczki: { dim: 'volume', unit: 'ml', factor: 5 },
  lyzeczek: { dim: 'volume', unit: 'ml', factor: 5 },
  tsp: { dim: 'volume', unit: 'ml', factor: 5 },
  teaspoon: { dim: 'volume', unit: 'ml', factor: 5 },
  teaspoons: { dim: 'volume', unit: 'ml', factor: 5 },
  szklanka: { dim: 'volume', unit: 'ml', factor: 250 },
  szklanki: { dim: 'volume', unit: 'ml', factor: 250 },
  szklanek: { dim: 'volume', unit: 'ml', factor: 250 },
  cup: { dim: 'volume', unit: 'ml', factor: 240 },
  cups: { dim: 'volume', unit: 'ml', factor: 240 },
  szt: { dim: 'count', unit: '', factor: 1 },
  pcs: { dim: 'count', unit: '', factor: 1 },
  piece: { dim: 'count', unit: '', factor: 1 },
  pieces: { dim: 'count', unit: '', factor: 1 },
  sztuka: { dim: 'count', unit: '', factor: 1 },
  sztuki: { dim: 'count', unit: '', factor: 1 },
  sztuk: { dim: 'count', unit: '', factor: 1 },
  bunch: { dim: 'count', unit: 'bunch', factor: 1 },
  bunches: { dim: 'count', unit: 'bunch', factor: 1 },
  peczek: { dim: 'count', unit: 'bunch', factor: 1 },
  peczki: { dim: 'count', unit: 'bunch', factor: 1 },
  pack: { dim: 'count', unit: 'pack', factor: 1 },
  packs: { dim: 'count', unit: 'pack', factor: 1 },
  pkg: { dim: 'count', unit: 'pack', factor: 1 },
  opakowanie: { dim: 'count', unit: 'pack', factor: 1 },
  opakowania: { dim: 'count', unit: 'pack', factor: 1 },
  can: { dim: 'count', unit: 'can', factor: 1 },
  cans: { dim: 'count', unit: 'can', factor: 1 },
  puszka: { dim: 'count', unit: 'can', factor: 1 },
  puszki: { dim: 'count', unit: 'can', factor: 1 },
  clove: { dim: 'count', unit: 'clove', factor: 1 },
  cloves: { dim: 'count', unit: 'clove', factor: 1 },
  zabek: { dim: 'count', unit: 'clove', factor: 1 },
  zabki: { dim: 'count', unit: 'clove', factor: 1 },
  roll: { dim: 'count', unit: 'roll', factor: 1 },
  rolls: { dim: 'count', unit: 'roll', factor: 1 },
  rolka: { dim: 'count', unit: 'roll', factor: 1 },
  rolki: { dim: 'count', unit: 'roll', factor: 1 },
  slice: { dim: 'count', unit: 'slice', factor: 1 },
  slices: { dim: 'count', unit: 'slice', factor: 1 },
  plaster: { dim: 'count', unit: 'slice', factor: 1 },
  plasterki: { dim: 'count', unit: 'slice', factor: 1 },
  pinch: { dim: 'count', unit: 'pinch', factor: 1 },
  szczypta: { dim: 'count', unit: 'pinch', factor: 1 },
  szczypty: { dim: 'count', unit: 'pinch', factor: 1 },
  bottle: { dim: 'count', unit: 'bottle', factor: 1 },
  bottles: { dim: 'count', unit: 'bottle', factor: 1 },
  butelka: { dim: 'count', unit: 'bottle', factor: 1 },
  butelki: { dim: 'count', unit: 'bottle', factor: 1 },
};

const VULGAR: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function number(token: string): number | null {
  const text = token.trim().replace(',', '.');
  if (VULGAR[text] !== undefined) return VULGAR[text];
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2]);
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  return Number(text);
}

const AMOUNT = String.raw`(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔])`;
const PATTERN = new RegExp(String.raw`^\s*(?:${AMOUNT}\s*[x×*]\s*)?${AMOUNT}?\s*([^\d\s][^\d]*)?\s*$`, 'i');

/** Read a quantity, or null when there is nothing numeric in it ("a pinch", "to taste"). */
export function parseQty(text: string | null | undefined): Qty | null {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const match = PATTERN.exec(raw.replace(/\s+/g, ' '));
  if (!match) return null;
  const [, lead, main, unitText] = match;

  let times = 1;
  let amount: number | null;
  if (lead !== undefined && main !== undefined) {
    times = number(lead) ?? 1;
    amount = number(main);
  } else {
    amount = number(lead ?? main ?? '');
  }
  if (amount === null) return null;

  const key = fold(unitText ?? '').replace(/[^a-z]/g, '');
  if (!key) return { amount, unit: '', times, dim: 'count' };
  const def = UNITS[key];
  if (def) return { amount: amount * def.factor, unit: def.unit, times, dim: def.dim };
  // Something we do not know ("jar", "tin"): keep the word, treat it as a count of it.
  return { amount, unit: key, times, dim: 'count' };
}

/** Total in the dimension's base unit (g, ml, or pieces). */
export function baseValue(q: Qty): number {
  const base = q.unit === 'kg' ? q.amount * 1000 : q.unit === 'L' ? q.amount * 1000 : q.amount;
  return base * q.times;
}

function trim(n: number): string {
  return String(Math.round(n * 100) / 100);
}

const COUNT_PLURAL: Record<string, string> = { bunch: 'bunches', pack: 'packs', can: 'cans', clove: 'cloves', roll: 'rolls', slice: 'slices', bottle: 'bottles', pinch: 'pinches' };

/** The canonical text: "1.5 kg", "250 g", "6 × 1.5 L", "2 bunches". */
export function formatQty(q: Qty): string {
  if (q.dim === 'mass' || q.dim === 'volume') {
    const total = baseValue(q);
    const [big, small] = q.dim === 'mass' ? ['kg', 'g'] : ['L', 'ml'];
    if (q.times > 1) return `${q.times} × ${trim(q.amount)} ${q.unit}`;
    return total >= 1000 ? `${trim(total / 1000)} ${big}` : `${trim(total)} ${small}`;
  }
  const n = q.amount * q.times;
  if (!q.unit) return trim(n);
  const plural = n === 1 ? q.unit : (COUNT_PLURAL[q.unit] ?? q.unit);
  return `${trim(n)} ${plural}`;
}

export type Comparison = 'covers' | 'short' | 'unknown';

/**
 * Whether what is already on the list (`have`) covers what a recipe needs.
 * Unknown means "do not decide for the user": different dimensions, or counts of
 * different things.
 */
export function compareQty(have: Qty | null, need: Qty | null): Comparison {
  if (!have || !need) return 'unknown';
  if (have.dim !== need.dim) return 'unknown';
  if (have.dim === 'count' && have.unit !== need.unit) {
    // Bare pieces cover anything counted in pieces; a named count only covers itself.
    if (have.unit !== '' && need.unit !== '') return 'unknown';
  }
  return baseValue(have) + 1e-9 >= baseValue(need) ? 'covers' : 'short';
}

/** Sum two quantities of the same kind, or null when they do not add up. */
export function sumQty(a: Qty, b: Qty): Qty | null {
  if (a.dim !== b.dim) return null;
  if (a.dim === 'count' && a.unit !== b.unit) return null;
  const total = baseValue(a) + baseValue(b);
  if (a.dim === 'mass') return { amount: total, unit: 'g', times: 1, dim: 'mass' };
  if (a.dim === 'volume') return { amount: total, unit: 'ml', times: 1, dim: 'volume' };
  return { amount: total, unit: a.unit, times: 1, dim: 'count' };
}

const MASS_PACKS = [100, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000];
const VOLUME_PACKS = [250, 330, 500, 750, 1000, 1500, 2000, 5000];

/**
 * The amount worth buying for an amount needed. Nobody buys 30 ml of oil or 3 g
 * of yeast: round up to the nearest size things come in, and past the biggest
 * pack to the next whole kilo or litre.
 */
export function shopQty(need: Qty): Qty {
  if (need.dim === 'count') return { ...need, amount: Math.ceil(need.amount * need.times), times: 1 };
  const total = baseValue(need);
  const sizes = need.dim === 'mass' ? MASS_PACKS : VOLUME_PACKS;
  const fit = sizes.find((size) => size >= total) ?? Math.ceil(total / 1000) * 1000;
  return need.dim === 'mass'
    ? { amount: fit, unit: 'g', times: 1, dim: 'mass' }
    : { amount: fit, unit: 'ml', times: 1, dim: 'volume' };
}

const LEAD = new RegExp(
  String.raw`^\s*(?:(\d+(?:[.,]\d+)?)\s*[x×*]\s*)?(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔])\s*([^\s\d,;()]+)?\s*(.*)$`,
  'u',
);

/**
 * Split a recipe line into its leading quantity and the ingredient that follows:
 * "500 g mąki" -> 500 g + "mąki"; "1 jajko" -> 1 + "jajko"; "2 łyżki oleju" ->
 * 30 ml + "oleju". The word after the number is a unit only if it is one we
 * know — "jajko" is the thing being counted, not a unit.
 */
export function splitLeadingQty(line: string): { qty: Qty | null; rest: string } {
  const match = LEAD.exec(line.trim());
  if (!match) return { qty: null, rest: line.trim() };
  const [, lead, main, word = '', tail = ''] = match;
  const times = lead !== undefined ? (number(lead) ?? 1) : 1;
  const amount = number(main);
  if (amount === null) return { qty: null, rest: line.trim() };

  const key = fold(word).replace(/[^a-z]/g, '');
  const def = key ? UNITS[key] : undefined;
  const rest = (def ? tail : `${word} ${tail}`).trim().replace(/^(?:of|z|ze)\s+/i, '');
  if (def) return { qty: { amount: amount * def.factor, unit: def.unit, times, dim: def.dim }, rest };
  return { qty: { amount, unit: '', times, dim: 'count' }, rest };
}
