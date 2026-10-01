import type { OptionChoice, OptionSet } from '@/lib/options';

/**
 * The products that ask a follow-up question. Keyed by catalogue id.
 *
 * Adding one is data: a few groups, the words in a query that answer them, and
 * a default for each. Flour, eggs and milk come from the approved design; the
 * rest are the products where "which one?" is a real question in a Polish shop.
 * A product that is not here simply adds with one tap.
 */

const pack = (values: string[], fallback: string, label = 'Pack'): OptionSet['groups'][number] => ({
  id: 'pack',
  label,
  kind: 'chips',
  isQty: true,
  choices: () => values.map((value): OptionChoice => ({ value, label: value })),
  fallback: () => fallback,
});

// ── Flour ────────────────────────────────────────────────────────────────────
// Polish flour is named by ash content: typ 550 is the all-purpose one.
type Flour = { en: string; pl: string; fallback: number; types: [number, string, string][] };
const FLOURS: Record<string, Flour> = {
  wheat: {
    en: 'Wheat',
    pl: 'pszenna',
    fallback: 550,
    types: [
      [450, 'cakes', 'cakes, sponges'],
      [500, 'pastry', 'shortcrust, pastries'],
      [550, 'all-purpose', 'all-purpose: pierogi, pancakes'],
      [650, 'bread', 'bread, rolls'],
      [750, 'pizza', 'pizza, light bread'],
      [1850, 'wholemeal', 'wholemeal bread'],
      [2000, 'graham', 'graham, coarse bakes'],
    ],
  },
  rye: {
    en: 'Rye',
    pl: 'żytnia',
    fallback: 720,
    types: [
      [580, 'pastry', 'light pastries'],
      [720, 'mixed bread', 'rye-wheat bread'],
      [1150, 'dark bread', 'darker rye bread'],
      [1400, 'gingerbread', 'dark bread, gingerbread'],
      [2000, 'wholemeal', 'wholemeal rye, żurek starter'],
    ],
  },
  spelt: {
    en: 'Spelt',
    pl: 'orkiszowa',
    fallback: 1050,
    types: [
      [630, 'cakes', 'cakes, pasta'],
      [1050, 'bread', 'bread, pizza'],
      [2000, 'wholemeal', 'wholemeal bread'],
    ],
  },
};

const flourOf = (resolved: Record<string, unknown>): Flour => FLOURS[String(resolved.grain ?? 'wheat')] ?? FLOURS.wheat;

const FLOUR: OptionSet = {
  productId: 'flour',
  hint: 'grain · type',
  groups: [
    {
      id: 'grain',
      label: 'Grain · zboże',
      kind: 'tiles',
      cols: 3,
      choices: () => Object.entries(FLOURS).map(([value, f]) => ({ value, label: f.en, sub: f.pl })),
      fallback: () => 'wheat',
    },
    {
      id: 'type',
      label: 'Type · typ',
      kind: 'tiles',
      cols: 4,
      choices: (resolved) =>
        flourOf(resolved).types.map(([value, short]) => ({ value, label: String(value), sub: short, text: `typ ${value}` })),
      fallback: (resolved) => flourOf(resolved).fallback,
      hint: (resolved) => {
        const hit = flourOf(resolved).types.find(([value]) => value === resolved.type);
        return hit ? `Typ ${hit[0]} is for ${hit[2]}.` : '';
      },
    },
    pack(['1 kg', '2 kg', '5 kg'], '1 kg'),
  ],
  infer: [
    { words: ['pierog', 'nalesnik', 'pancake', 'kluski', 'dumpling'], set: { grain: 'wheat', type: 550 } },
    { words: ['chleb', 'bread', 'bulk'], set: { type: 650 } },
    { words: ['ciast', 'cake', 'tort', 'biszkopt', 'sponge'], set: { grain: 'wheat', type: 450 } },
    { words: ['pizz'], set: { grain: 'wheat', type: 750 } },
    { words: ['zyt', 'rye'], set: { grain: 'rye' } },
    { words: ['orkisz', 'spelt'], set: { grain: 'spelt' } },
    { words: ['razow', 'wholemeal', 'pelnoziarn'], set: { type: 'max' } },
    { words: ['zur'], set: { grain: 'rye', type: 2000 } },
  ],
};

// ── Eggs ─────────────────────────────────────────────────────────────────────
const EGG_SIZES: [string, string][] = [
  ['S', 'under 53 g'],
  ['M', '53–63 g'],
  ['L', '63–73 g'],
  ['XL', '73 g +'],
];
// The first digit stamped on the shell is the farming code.
const EGG_FARMING: [number, string, string][] = [
  [0, 'Organic', 'ekologiczny'],
  [1, 'Free-range', 'z wolnego wybiegu'],
  [2, 'Barn', 'ściółkowy'],
  [3, 'Cage', 'klatkowy'],
];

const EGGS: OptionSet = {
  productId: 'eggs',
  hint: 'size · farming',
  groups: [
    {
      id: 'size',
      label: 'Size · rozmiar',
      kind: 'tiles',
      cols: 4,
      choices: () => EGG_SIZES.map(([value, weight]) => ({ value, label: value, sub: weight })),
      fallback: () => 'L',
    },
    {
      id: 'farm',
      label: 'Farming · chów',
      kind: 'rows',
      choices: () => EGG_FARMING.map(([value, en, pl]) => ({ value, label: en, sub: pl, lead: String(value) })),
      fallback: () => 1,
      hint: () => 'The first digit stamped on the shell.',
    },
    {
      id: 'pack',
      label: 'Pack',
      kind: 'chips',
      isQty: true,
      choices: () => [6, 10, 15, 30].map((value) => ({ value, label: String(value) })),
      fallback: () => 10,
    },
  ],
  infer: [
    { words: ['mal', 'small'], set: { size: 'S' } },
    { words: ['sredn', 'medium'], set: { size: 'M' } },
    { words: ['duz', 'large'], set: { size: 'L' } },
    { words: ['xl', 'bardzo duz', 'extra'], set: { size: 'XL' } },
    { words: ['wiejsk', 'wolnego', 'free'], set: { farm: 1 } },
    { words: ['eko', 'bio', 'organic'], set: { farm: 0 } },
    { words: ['sciolk', 'barn'], set: { farm: 2 } },
    { words: ['30', 'trzydziesc'], set: { pack: 30 } },
    { words: ['15'], set: { pack: 15 } },
    { words: ['szesc', ' 6 '], set: { pack: 6 } },
  ],
};

// ── Milk ─────────────────────────────────────────────────────────────────────
const MILK: OptionSet = {
  productId: 'milk',
  hint: 'fat · kind',
  groups: [
    {
      id: 'fat',
      label: 'Fat · tłuszcz',
      kind: 'tiles',
      cols: 4,
      choices: () => [
        { value: '0.5', label: '0.5%', sub: 'skimmed' },
        { value: '1.5', label: '1.5%', sub: 'light' },
        { value: '2', label: '2%', sub: 'semi' },
        { value: '3.2', label: '3.2%', sub: 'whole' },
      ],
      fallback: () => '3.2',
    },
    {
      id: 'kind',
      label: 'Kind',
      kind: 'rows',
      choices: () => [
        { value: 'fresh', label: 'Fresh', sub: 'świeże · 7–10 days' },
        { value: 'uht', label: 'Long-life', sub: 'UHT · months unopened', text: 'UHT' },
        { value: 'lf', label: 'Lactose-free', sub: 'bez laktozy' },
      ],
      fallback: () => 'fresh',
    },
    pack(['1 L', '2 L', '6 × 1 L'], '2 L', 'Amount'),
  ],
  infer: [
    { words: ['chud', 'skim'], set: { fat: '0.5' } },
    { words: ['tlust', 'whole', 'pelne'], set: { fat: '3.2' } },
    { words: ['laktoz', 'lactose'], set: { kind: 'lf' } },
    { words: ['uht', 'karton'], set: { kind: 'uht' } },
    { words: ['swiez', 'fresh'], set: { kind: 'fresh' } },
  ],
};

// ── Butter ───────────────────────────────────────────────────────────────────
const BUTTER: OptionSet = {
  productId: 'butter',
  hint: 'fat · salt',
  groups: [
    {
      id: 'fat',
      label: 'Fat · tłuszcz',
      kind: 'tiles',
      cols: 2,
      choices: () => [
        { value: '82', label: '82%', sub: 'extra' },
        { value: '83', label: '83%', sub: 'extra, richer' },
      ],
      fallback: () => '82',
    },
    {
      id: 'salt',
      label: 'Salt · sól',
      kind: 'chips',
      choices: () => [
        { value: 'unsalted', label: 'Unsalted' },
        { value: 'salted', label: 'Salted' },
      ],
      fallback: () => 'unsalted',
    },
    pack(['100 g', '200 g', '250 g', '500 g'], '200 g'),
  ],
  infer: [
    { words: ['83'], set: { fat: '83' } },
    { words: ['solon', 'salted'], set: { salt: 'salted' } },
    { words: ['niesolon', 'unsalted'], set: { salt: 'unsalted' } },
  ],
};

// ── Sour cream ───────────────────────────────────────────────────────────────
const SOUR_CREAM: OptionSet = {
  productId: 'sour-cream',
  hint: '12 · 18 · 30%',
  groups: [
    {
      id: 'fat',
      label: 'Fat · tłuszcz',
      kind: 'tiles',
      cols: 3,
      choices: () => [
        { value: '12', label: '12%', sub: 'light' },
        { value: '18', label: '18%', sub: 'classic' },
        { value: '30', label: '30%', sub: 'thick' },
      ],
      fallback: () => '18',
    },
    pack(['200 g', '330 g', '400 g', '500 g'], '400 g'),
  ],
  infer: [
    { words: ['12'], set: { fat: '12' } },
    { words: ['30', 'kremowk', 'thick'], set: { fat: '30' } },
  ],
};

// ── Quark ────────────────────────────────────────────────────────────────────
const QUARK: OptionSet = {
  productId: 'quark',
  hint: 'fat level',
  groups: [
    {
      id: 'fat',
      label: 'Fat · tłuszcz',
      kind: 'rows',
      choices: () => [
        { value: 'lean', label: 'Lean', sub: 'chudy' },
        { value: 'half', label: 'Half-fat', sub: 'półtłusty' },
        { value: 'full', label: 'Full-fat', sub: 'tłusty' },
      ],
      fallback: () => 'half',
    },
    pack(['250 g', '500 g', '1 kg'], '250 g'),
  ],
  // Order matters: "półtłusty" contains "tłusty", so half-fat is read last.
  infer: [
    { words: ['chud', 'lean'], set: { fat: 'lean' } },
    { words: ['tlust', 'full'], set: { fat: 'full' } },
    { words: ['polt', 'half'], set: { fat: 'half' } },
  ],
};

// ── Sugar ────────────────────────────────────────────────────────────────────
const SUGAR: OptionSet = {
  productId: 'sugar',
  hint: 'kind',
  groups: [
    {
      id: 'kind',
      label: 'Kind · rodzaj',
      kind: 'tiles',
      cols: 3,
      choices: () => [
        { value: 'white', label: 'White', sub: 'biały' },
        { value: 'brown', label: 'Brown', sub: 'trzcinowy' },
        { value: 'icing', label: 'Icing', sub: 'puder' },
      ],
      fallback: () => 'white',
    },
    pack(['500 g', '1 kg', '5 kg'], '1 kg'),
  ],
  infer: [
    { words: ['puder', 'powder', 'icing'], set: { kind: 'icing' } },
    { words: ['brazow', 'brown', 'trzcin', 'cane'], set: { kind: 'brown' } },
    { words: ['bial', 'white'], set: { kind: 'white' } },
  ],
};

// ── Rice ─────────────────────────────────────────────────────────────────────
const RICE: OptionSet = {
  productId: 'rice',
  hint: 'kind',
  groups: [
    {
      id: 'kind',
      label: 'Kind · rodzaj',
      kind: 'rows',
      choices: () => [
        { value: 'long', label: 'Long-grain', sub: 'długoziarnisty' },
        { value: 'basmati', label: 'Basmati', sub: 'basmati' },
        { value: 'jasmine', label: 'Jasmine', sub: 'jaśminowy' },
        { value: 'round', label: 'Risotto', sub: 'okrągłoziarnisty' },
        { value: 'brown', label: 'Brown', sub: 'brązowy' },
      ],
      fallback: () => 'long',
    },
    pack(['400 g', '1 kg', '2 kg'], '1 kg'),
  ],
  infer: [
    { words: ['basmati'], set: { kind: 'basmati' } },
    { words: ['jasmin'], set: { kind: 'jasmine' } },
    { words: ['risotto', 'arborio', 'okragl', 'round'], set: { kind: 'round' } },
    { words: ['brazow', 'brown', 'pelnoziarn'], set: { kind: 'brown' } },
  ],
};

// ── Tomatoes ─────────────────────────────────────────────────────────────────
const TOMATOES: OptionSet = {
  productId: 'tomatoes',
  hint: 'kind',
  groups: [
    {
      id: 'kind',
      label: 'Kind · rodzaj',
      kind: 'chips',
      choices: () => [
        { value: 'raspberry', label: 'Raspberry' },
        { value: 'cherry', label: 'Cherry' },
        { value: 'plum', label: 'Plum' },
        { value: 'vine', label: 'On the vine' },
      ],
      fallback: () => null,
    },
    pack(['500 g', '1 kg', '2 kg'], '1 kg'),
  ],
  infer: [
    { words: ['malinow', 'raspberry'], set: { kind: 'raspberry' } },
    { words: ['koktajl', 'cherry'], set: { kind: 'cherry' } },
    { words: ['slivk', 'plum', 'roma'], set: { kind: 'plum' } },
    { words: ['galez', 'vine'], set: { kind: 'vine' } },
  ],
};

export const OPTION_SETS: readonly OptionSet[] = [FLOUR, EGGS, MILK, BUTTER, SOUR_CREAM, QUARK, SUGAR, RICE, TOMATOES];

const BY_PRODUCT = new Map(OPTION_SETS.map((set) => [set.productId, set]));

/** The option set a catalogue product asks, or null for a one-tap product. */
export function optionSetFor(productId: string | null | undefined): OptionSet | null {
  return productId ? (BY_PRODUCT.get(productId) ?? null) : null;
}
