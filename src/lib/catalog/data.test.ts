import required from './required.json';
import { BAKERY } from './bakery';
import { DAIRY } from './dairy';
import { DRINKS } from './drinks';
import { FISH } from './fish';
import { FROZEN } from './frozen';
import { HOME } from './home';
import { GYM } from './gym';
import { CLOTHING } from './clothing';
import { HOUSEHOLD } from './household';
import { MEDICINE } from './medicine';
import { SUPPLEMENTS } from './supplements';
import { MEAT } from './meat';
import { PANTRY } from './pantry';
import { PRODUCE } from './produce';
import { SNACKS } from './snacks';
import { CATALOG_CATEGORY_ORDER as CATEGORY_ORDER, type CatalogEntry, type CatalogCategoryKey as CategoryKey } from './types';

const CATALOG: Record<CategoryKey, readonly CatalogEntry[]> = {
  produce: PRODUCE,
  bakery: BAKERY,
  dairy: DAIRY,
  meat: MEAT,
  fish: FISH,
  pantry: PANTRY,
  frozen: FROZEN,
  drinks: DRINKS,
  snacks: SNACKS,
  home: HOME,
  gym: GYM,
  clothing: CLOTHING,
  household: HOUSEHOLD,
  medicine: MEDICINE,
  supplements: SUPPLEMENTS,
};

const MINIMUM: Record<CategoryKey, number> = {
  produce: 110,
  bakery: 45,
  dairy: 80,
  meat: 70,
  fish: 35,
  pantry: 140,
  frozen: 40,
  drinks: 70,
  snacks: 60,
  home: 80,
  gym: 25,
  clothing: 25,
  household: 25,
  medicine: 20,
  supplements: 20,
};

const REQUIRED = required as Record<CategoryKey, [string, string][]>;

/** Words allowed to carry capitals mid-name: acronyms and proper nouns. */
const CAPITALS_OK = new Set(['UHT', 'BBQ', 'LED', 'AA', 'AAA', 'WC', 'Grey', 'D3', 'C', 'B12']);

/** Lowercase, strip diacritics (ł has no decomposition, so by hand). */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l');
}

/** True when a name is not "Sentence case": first letter up, the rest down. */
function isBadCase(name: string): boolean {
  return name.split(' ').some((word, index) => {
    if (CAPITALS_OK.has(word)) return false;
    if (index > 0) return word !== word.toLowerCase();
    const first = word.charAt(0);
    const isCapital = first !== first.toLowerCase();
    return !isCapital || word.slice(1) !== word.slice(1).toLowerCase();
  });
}

/** Every [category, entry] pair, flattened. */
const ALL = CATEGORY_ORDER.flatMap((category) =>
  CATALOG[category].map((entry) => ({ category, entry })),
);

describe('catalogue data', () => {
  it('has every catalogue category', () => {
    expect(Object.keys(CATALOG)).toEqual([...CATEGORY_ORDER]);
    expect(Object.keys(REQUIRED).sort()).toEqual([...CATEGORY_ORDER].sort());
  });

  it('writes every entry as [en, pl] or [en, pl, aliases] of strings', () => {
    const bad = ALL.filter(({ entry }) => {
      const parts: readonly unknown[] = entry;
      return (
        (parts.length !== 2 && parts.length !== 3) ||
        parts.some((part) => typeof part !== 'string')
      );
    }).map(({ category, entry }) => `${category}: ${JSON.stringify(entry)}`);
    expect(bad).toEqual([]);
  });

  for (const category of CATEGORY_ORDER) {
    describe(category, () => {
      it(`has at least ${MINIMUM[category]} entries`, () => {
        expect(CATALOG[category].length).toBeGreaterThanOrEqual(MINIMUM[category]);
      });

      it('contains every required pair verbatim', () => {
        const missing = REQUIRED[category]
          .filter(([en, pl]) => !CATALOG[category].some((e) => e[0] === en && e[1] === pl))
          .map(([en, pl]) => `${en} / ${pl}`);
        expect(missing).toEqual([]);
      });

      it('has no duplicate Polish name', () => {
        const seen = new Set<string>();
        const dupes: string[] = [];
        for (const [, pl] of CATALOG[category]) {
          const key = pl.toLowerCase();
          if (seen.has(key)) dupes.push(pl);
          seen.add(key);
        }
        expect(dupes).toEqual([]);
      });
    });
  }

  it('has no duplicate English name anywhere (they become ids)', () => {
    const firstSeenIn = new Map<string, CategoryKey>();
    const dupes: string[] = [];
    for (const { category, entry } of ALL) {
      const key = entry[0].toLowerCase();
      const earlier = firstSeenIn.get(key);
      if (earlier) dupes.push(`${entry[0]} (${earlier}, ${category})`);
      else firstSeenIn.set(key, category);
    }
    expect(dupes).toEqual([]);
  });

  it('keeps every string trimmed, non-empty and free of double spaces', () => {
    const bad: string[] = [];
    for (const { category, entry } of ALL) {
      for (const part of entry) {
        if (part === undefined) continue;
        if (part.length === 0 || part !== part.trim() || part.includes('  ')) {
          bad.push(`${category}: ${JSON.stringify(part)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('writes every name in sentence case', () => {
    const bad: string[] = [];
    for (const { category, entry } of ALL) {
      for (const name of [entry[0], entry[1]]) {
        if (isBadCase(name)) bad.push(`${category}: ${name}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('writes aliases as lowercase words that neither name already contains', () => {
    const bad: string[] = [];
    for (const { category, entry } of ALL) {
      const [en, pl, aliases] = entry;
      if (aliases === undefined) continue;
      const names = `${fold(en)} ${fold(pl)}`;
      for (const word of aliases.split(' ')) {
        const plain = /^[\p{L}\p{N}]+$/u.test(word) && word === word.toLowerCase();
        if (!plain || names.includes(fold(word))) bad.push(`${category}: ${en} -> ${word}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
