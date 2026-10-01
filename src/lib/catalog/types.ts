/**
 * The ten shop sections, in the order a shop (and so the list) walks them.
 * The key is stored on every item row, so it is a contract: adding a section
 * is a migration-free change, renaming one is not.
 */
export const CATEGORY_ORDER = [
  'produce',
  'bakery',
  'dairy',
  'meat',
  'fish',
  'pantry',
  'frozen',
  'drinks',
  'snacks',
  'home',
] as const;

export type CategoryKey = (typeof CATEGORY_ORDER)[number];

/**
 * One catalogue line as written in the data files: English name, Polish name,
 * and optionally extra search words (either language, space separated) for the
 * ways people look for it that neither name contains — "kartofle" for
 * Ziemniaki, "zucchini" for Courgettes.
 */
export type CatalogEntry = readonly [en: string, pl: string, aliases?: string];
