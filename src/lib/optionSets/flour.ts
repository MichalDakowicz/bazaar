import type { OptionSet } from '@/lib/options';

import { pack } from './pack';

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

export const FLOUR: OptionSet = {
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
