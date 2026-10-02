import type { OptionSet } from '@/lib/options';

import { pack } from './pack';

// ── Milk ─────────────────────────────────────────────────────────────────────
export const MILK: OptionSet = {
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
export const BUTTER: OptionSet = {
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
export const SOUR_CREAM: OptionSet = {
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
export const QUARK: OptionSet = {
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
