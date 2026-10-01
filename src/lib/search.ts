import { CATALOG, type Product } from '@/lib/catalog';
import type { Lang } from '@/lib/categories';
import { fold, words } from '@/lib/text';

/**
 * Catalogue search, in either language, with Polish endings forgiven.
 *
 * Polish inflects: you type "mąkę", the catalogue says "Mąka"; you type
 * "pierogów", it says "Pierogi". Rather than a stemmer, two words match when one starts
 * with the other (typing "mle" finds "mleko") or when they share all but their last
 * couple of letters (a case ending does not matter). The rule is deliberately dumb
 * and deliberately written down here, because a search nobody can predict is a
 * search nobody trusts.
 */

/** Words that join a query ("mąka do pierogów", "milk for tea") and name nothing. */
const FILLER = new Set([
  'do', 'na', 'z', 'ze', 'i', 'a', 'w', 'we', 'po', 'dla', 'od', 'bez', 'czy',
  'for', 'to', 'the', 'of', 'and', 'with', 'in', 'on', 'my', 'some', 'any',
]);

/** The words of a query that can name something. */
export function queryTokens(query: string): string[] {
  return words(query).filter((word) => !FILLER.has(word));
}

/**
 * Whether a typed token names a catalogue word.
 *
 * Typing is prefix matching ("mle" -> "mleko"); inflection is the other direction
 * ("mleka" -> "mleko"): both words share all but their last couple of letters.
 */
export function tokenMatches(token: string, word: string): boolean {
  if (word.startsWith(token)) return true;
  if (token.length < 4 || word.length < 3) return false;
  let shared = 0;
  const limit = Math.min(token.length, word.length);
  while (shared < limit && token[shared] === word[shared]) shared += 1;
  // Same stem, different ending: "mąkę"/"mąka", "pierogów"/"pierogi". Long
  // adjective endings ("półtłustego") get one more letter of slack.
  return shared >= 3 && token.length - shared <= (token.length >= 7 ? 3 : 2) && word.length - shared <= 2;
}

export type Match = {
  product: Product;
  /** At least one token hit a name in the language the user reads products in. */
  primary: boolean;
  /** How many of the query's tokens this product answered. */
  hits: number;
  /** The other-language name, when that is what matched ("matched “Flour”"). */
  via: string | null;
};

function wordsFor(product: Product, lang: Lang): { own: readonly string[]; other: readonly string[] } {
  return lang === 'pl' ? { own: product.w.pl, other: product.w.en } : { own: product.w.en, other: product.w.pl };
}

/**
 * Products answering a query, best first.
 *
 * A product matches when at least one token names it, and ranks by how many
 * did: "mąka do pierogów" finds flour (mąka), then the pierogi (pierog), with
 * the flour-and-pierogi products — if there were any — on top. Ties keep the
 * catalogue's own order, which is the order sections are walked in a shop.
 */
export function searchProducts(query: string, lang: Lang, limit = 60): Match[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];

  const out: (Match & { score: number; order: number })[] = [];
  CATALOG.forEach((product, order) => {
    const { own, other } = wordsFor(product, lang);
    let hits = 0;
    let primary = false;
    let startsWith = 0;
    let exact = 0;
    let viaWord = false;
    for (const token of tokens) {
      const inOwn = own.some((word) => tokenMatches(token, word));
      const inOther = !inOwn && (other.some((word) => tokenMatches(token, word)) || product.w.alias.some((word) => tokenMatches(token, word)));
      if (!inOwn && !inOther) continue;
      hits += 1;
      if (inOwn) {
        primary = true;
        if (own.includes(token)) exact += 1;
        if (own[0] && tokenMatches(token, own[0])) startsWith += 1;
      } else {
        viaWord = true;
      }
    }
    if (hits === 0) return;
    const nameLength = own.length || 1;
    // Hits dominate; then "you typed the whole word" (sól is Salt, not Sole);
    // then "the name starts with what you typed"; then shorter names ("Milk"
    // before "Milk chocolate with hazelnuts").
    const score = hits * 100 + exact * 10 + startsWith * 16 + (primary ? 6 : 0) - nameLength;
    out.push({
      product,
      primary,
      hits,
      via: viaWord && !primary ? (lang === 'pl' ? product.en : product.pl) : null,
      score,
      order,
    });
  });

  out.sort((a, b) => b.score - a.score || a.order - b.order);
  return out.slice(0, limit).map(({ product, primary, hits, via }) => ({ product, primary, hits, via }));
}

/** The name an item or product is shown by. */
export function productName(product: { en: string; pl: string }, lang: Lang): string {
  return lang === 'pl' ? product.pl : product.en;
}

/** The other language's name — the small print under the headline name. */
export function productAlt(product: { en: string; pl: string }, lang: Lang): string {
  return lang === 'pl' ? product.en : product.pl;
}

/** Whether `needle` appears in `text` once both are folded. */
export function foldedIncludes(text: string, needle: string): boolean {
  return fold(text).includes(fold(needle));
}
