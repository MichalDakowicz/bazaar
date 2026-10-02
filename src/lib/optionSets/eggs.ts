import type { OptionSet } from '@/lib/options';

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

export const EGGS: OptionSet = {
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
