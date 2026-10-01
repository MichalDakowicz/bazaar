import type { Lang } from '@/lib/categories';

import { en, type Dictionary } from './i18n.en';
import { pl } from './i18n.pl';

/**
 * Every word Bazaar's own screens say, in both languages.
 *
 * There are two language settings and they are different things: the *app*
 * language (this file) and the *product* language (which name an item is called
 * by — lib/search `productName`). A Polish household may well want an English
 * interface and Polish product names; search covers both either way.
 *
 * The shell it shares with the other Ping apps — sign-in, the sign-out sheet,
 * the update notice — is deliberately not here: those files are identical in
 * every app and speak English.
 *
 * Polish plurals have three forms (1 · 2–4 · 5+), which `pl3` picks.
 */

const DICTIONARIES: Record<Lang, Dictionary> = { en, pl };

export type Strings = Dictionary;

export function strings(lang: Lang): Strings {
  return DICTIONARIES[lang];
}

export { MONTHS_EN, pl3 } from './i18nHelpers';
