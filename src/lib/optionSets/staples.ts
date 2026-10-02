import type { OptionSet } from '@/lib/options';

import { pack } from './pack';

// ── Sugar ────────────────────────────────────────────────────────────────────
export const SUGAR: OptionSet = {
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
export const RICE: OptionSet = {
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
export const TOMATOES: OptionSet = {
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
