import { CATEGORY_ORDER, type CategoryKey } from '@/lib/catalog/types';

/** Which glyph stands for a section. Resolved to a component in components/media/CategoryGlyph. */
export type CategoryGlyphKey =
  | 'apple'
  | 'bread'
  | 'milk'
  | 'beef'
  | 'fish'
  | 'jar'
  | 'snow'
  | 'bottle'
  | 'cookie'
  | 'spray'
  | 'box';

export type CategoryMeta = {
  key: CategoryKey;
  en: string;
  pl: string;
  glyph: CategoryGlyphKey;
};

/** Shop sections and the final section for custom items. */
export const CATEGORIES: readonly CategoryMeta[] = [
  { key: 'produce', en: 'Produce', pl: 'Warzywa i owoce', glyph: 'apple' },
  { key: 'bakery', en: 'Bakery', pl: 'Pieczywo', glyph: 'bread' },
  { key: 'dairy', en: 'Dairy & eggs', pl: 'Nabiał', glyph: 'milk' },
  { key: 'meat', en: 'Meat & deli', pl: 'Mięso i wędliny', glyph: 'beef' },
  { key: 'fish', en: 'Fish', pl: 'Ryby', glyph: 'fish' },
  { key: 'pantry', en: 'Pantry', pl: 'Spiżarnia', glyph: 'jar' },
  { key: 'frozen', en: 'Frozen', pl: 'Mrożonki', glyph: 'snow' },
  { key: 'drinks', en: 'Drinks', pl: 'Napoje', glyph: 'bottle' },
  { key: 'snacks', en: 'Sweets', pl: 'Słodycze', glyph: 'cookie' },
  { key: 'home', en: 'Household', pl: 'Chemia', glyph: 'spray' },
  { key: 'other', en: 'Other', pl: 'Inne', glyph: 'box' },
];

const BY_KEY = new Map<string, CategoryMeta>(CATEGORIES.map((category) => [category.key, category]));

export type Lang = 'en' | 'pl';

export function isCategory(value: unknown): value is CategoryKey {
  return typeof value === 'string' && BY_KEY.has(value);
}

/** Unknown sections stay visible under Other. */
export function categoryOf(value: unknown): CategoryMeta {
  return (isCategory(value) ? BY_KEY.get(value) : BY_KEY.get('other')) as CategoryMeta;
}

/** The section's name in the language the user reads products in. */
export function categoryName(key: CategoryKey, lang: Lang): string {
  const category = categoryOf(key);
  return lang === 'pl' ? category.pl : category.en;
}

/** The other language's name, shown beside it so both stay learnable. */
export function categoryAlt(key: CategoryKey, lang: Lang): string {
  return categoryName(key, lang === 'pl' ? 'en' : 'pl');
}

export function categoryRank(key: CategoryKey): number {
  const index = CATEGORY_ORDER.indexOf(key);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export { CATEGORY_ORDER };
export type { CategoryKey };
