/**
 * Text folding for search. The catalogue is bilingual and people type Polish on
 * keyboards that have no Polish letters, so "maka" has to find "mąka" and "lodowka"
 * has to find "lodówka".
 */

/** Lowercase, diacritics removed, and `ł` -> `l` (which NFD does not decompose). */
export function fold(text: string | null | undefined): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Folded alphanumeric words of at least two characters. */
export function words(text: string | null | undefined): string[] {
  return fold(text)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);
}

/** `1 kg` and `2 kg` are the same word-shape; this is for compare-by-text. */
export function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return fold(a).trim() === fold(b).trim();
}
