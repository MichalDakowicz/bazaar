import type { OptionChoice, OptionSet } from '@/lib/options';

/** The "Pack" group nearly every set ends with: how much to buy. It becomes the item's quantity. */
export const pack = (values: string[], fallback: string, label = 'Pack'): OptionSet['groups'][number] => ({
  id: 'pack',
  label,
  kind: 'chips',
  isQty: true,
  choices: () => values.map((value): OptionChoice => ({ value, label: value })),
  fallback: () => fallback,
});
