import type { NewItem } from '@/types/bazaar';

/** The same typed item is used by Add, the planner and unmatched recipe rows. */
export function customItem(text: string, qty = '1'): NewItem | null {
  const name = text.trim();
  if (!name) return null;
  return { productId: null, cat: 'other', nameEn: name, namePl: name, opt: '', qty };
}
