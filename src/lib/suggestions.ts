import type { Lang } from '@/lib/categories';
import { productById, type Product } from '@/lib/catalog';
import { fold } from '@/lib/text';

/**
 * "Pierogi usually need these too": when a query names a dish, offer what the
 * dish is made of. Hand-written on purpose — a dozen dishes people actually type
 * into a Polish shopping list, each with the products that go with it by
 * catalogue id, so a suggestion can never be something the catalogue cannot add.
 */

type Rule = {
  /** Folded words in the query that name the dish. */
  words: string[];
  title: Record<Lang, string>;
  products: string[];
};

const RULES: Rule[] = [
  {
    words: ['pierog'],
    title: { en: 'Pierogi usually need these too', pl: 'Do pierogów zwykle potrzeba też' },
    products: ['quark', 'potatoes', 'onions'],
  },
  {
    words: ['nalesnik', 'pancake'],
    title: { en: 'Pancakes usually need these too', pl: 'Do naleśników zwykle potrzeba też' },
    products: ['milk', 'eggs', 'sugar'],
  },
  {
    words: ['pizz'],
    title: { en: 'Pizza usually needs these too', pl: 'Do pizzy zwykle potrzeba też' },
    products: ['yeast', 'mozzarella', 'passata'],
  },
  {
    words: ['chleb', 'bread'],
    title: { en: 'For baking bread', pl: 'Do pieczenia chleba' },
    products: ['yeast', 'salt', 'sunflower-seeds'],
  },
  {
    words: ['ciast', 'cake', 'tort', 'biszkopt'],
    title: { en: 'Cakes usually need these too', pl: 'Do ciasta zwykle potrzeba też' },
    products: ['sugar', 'butter', 'baking-powder'],
  },
  {
    words: ['zur'],
    title: { en: 'For żurek', pl: 'Do żurku' },
    products: ['white-sausage', 'marjoram', 'garlic'],
  },
  {
    words: ['bigos'],
    title: { en: 'Bigos usually needs these too', pl: 'Do bigosu zwykle potrzeba też' },
    products: ['sauerkraut', 'sausage', 'bacon'],
  },
  {
    words: ['kotlet', 'schabow'],
    title: { en: 'For breaded cutlets', pl: 'Do kotletów' },
    products: ['pork-loin', 'eggs', 'breadcrumbs'],
  },
];

export type Suggestion = { title: string; products: Product[] };

/** What the query's dish needs, restricted to products the catalogue has. */
export function suggestFor(query: string, lang: Lang): Suggestion | null {
  const folded = ` ${fold(query)} `;
  const rule = RULES.find((candidate) => candidate.words.some((word) => folded.includes(word)));
  if (!rule) return null;
  const products = rule.products.map((id) => productById(id)).filter((product): product is Product => product !== null);
  return products.length > 0 ? { title: rule.title[lang], products } : null;
}

/** Example queries for the empty search field: the words people actually type. */
export const TRIES: Record<Lang, string[]> = {
  pl: ['mąka do pierogów', 'duże jajka wiejskie', 'mleko bez laktozy', 'mąka żytnia na żurek'],
  en: ['flour for dumplings', 'large free-range eggs', 'lactose-free milk', 'rye flour for żurek'],
};

export function ruleIds(): string[] {
  return RULES.flatMap((rule) => rule.products);
}
