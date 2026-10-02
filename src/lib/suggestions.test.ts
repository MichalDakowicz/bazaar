import { productById } from '@/lib/catalog';
import { queryTokens } from '@/lib/search';
import { optionSetFor } from '@/lib/optionSets';
import { resolveOptions } from '@/lib/options';

import { ruleIds, suggestFor, TRIES } from './suggestions';

describe('suggestFor', () => {
  it('offers what pierogi are made of', () => {
    const s = suggestFor('mąka do pierogów', 'en')!;
    expect(s.title).toBe('Pierogi usually need these too');
    expect(s.products.map((p) => p.id)).toEqual(['quark', 'potatoes', 'onions']);
  });

  it('speaks the interface language', () => {
    expect(suggestFor('pizza', 'pl')?.title).toBe('Do pizzy zwykle potrzeba też');
  });

  it('says nothing for a plain product', () => {
    expect(suggestFor('mleko', 'en')).toBeNull();
  });

  it('only ever suggests products the catalogue has', () => {
    for (const id of ruleIds()) expect(productById(id)).not.toBeNull();
  });
});

describe('TRIES', () => {
  it('are real queries: they find something, and the option examples answer their groups', () => {
    for (const lang of ['en', 'pl'] as const) {
      for (const query of TRIES[lang]) expect(queryTokens(query).length).toBeGreaterThan(0);
    }
    const polish = resolveOptions(optionSetFor('flour')!, TRIES.pl[0]);
    expect(polish.opt).toBe('Wheat · typ 550');
  });
});
