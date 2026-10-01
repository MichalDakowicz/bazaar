import { queryTokens, searchProducts, tokenMatches } from './search';

describe('tokenMatches', () => {
  it('forgives Polish endings', () => {
    expect(tokenMatches('maki', 'maka')).toBe(true);
    expect(tokenMatches('pierogow', 'pierogi')).toBe(true);
    expect(tokenMatches('jajek', 'jajka')).toBe(true);
    expect(tokenMatches('mleka', 'mleko')).toBe(true);
  });
  it('matches what is being typed', () => {
    expect(tokenMatches('mle', 'mleko')).toBe(true);
  });
  it('does not match unrelated words', () => {
    expect(tokenMatches('woda', 'wolno')).toBe(false);
    expect(tokenMatches('sol', 'sok')).toBe(false);
  });
});

describe('queryTokens', () => {
  it('drops the words that join a query', () => {
    expect(queryTokens('mąka do pierogów')).toEqual(['maka', 'pierogow']);
    expect(queryTokens('milk for tea')).toEqual(['milk', 'tea']);
  });
  it('folds diacritics so a keyboard without them still finds things', () => {
    expect(queryTokens('Mąkę żytnią')).toEqual(['make', 'zytnia']);
  });
});

describe('searchProducts', () => {
  it('finds a product by either language', () => {
    const polish = searchProducts('maka', 'en');
    expect(polish.some((m) => m.product.id === 'flour')).toBe(true);
    const english = searchProducts('flour', 'pl');
    expect(english.some((m) => m.product.id === 'flour')).toBe(true);
  });

  it('marks a match found only through the other language', () => {
    const hit = searchProducts('maka', 'en').find((m) => m.product.id === 'flour')!;
    expect(hit.primary).toBe(false);
    expect(hit.via).toBe('Mąka');
    const own = searchProducts('flour', 'en').find((m) => m.product.id === 'flour')!;
    expect(own.primary).toBe(true);
    expect(own.via).toBeNull();
  });

  it('ranks the product that answers more of the query first', () => {
    const results = searchProducts('mleko skondensowane', 'pl');
    expect(results[0].product.id).toBe('condensed-milk');
  });

  it('finds nothing for nothing', () => {
    expect(searchProducts('', 'en')).toEqual([]);
    expect(searchProducts('do', 'pl')).toEqual([]);
    expect(searchProducts('zzzzqq', 'en')).toEqual([]);
  });
});
