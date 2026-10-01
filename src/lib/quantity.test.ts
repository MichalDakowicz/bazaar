import { baseValue, compareQty, formatQty, parseQty, shopQty, sumQty } from './quantity';

describe('parseQty', () => {
  it('reads the quantities the design puts on a list', () => {
    expect(parseQty('1 kg')).toMatchObject({ amount: 1, unit: 'kg', dim: 'mass' });
    expect(parseQty('250 g')).toMatchObject({ amount: 250, unit: 'g', dim: 'mass' });
    expect(parseQty('2 L')).toMatchObject({ amount: 2, unit: 'L', dim: 'volume' });
    expect(parseQty('4')).toMatchObject({ amount: 4, unit: '', dim: 'count' });
    expect(parseQty('1 bunch')).toMatchObject({ amount: 1, unit: 'bunch', dim: 'count' });
    expect(parseQty('2 bunches')).toMatchObject({ amount: 2, unit: 'bunch' });
  });

  it('reads a multiplier', () => {
    const q = parseQty('6 × 1.5 L')!;
    expect(q).toMatchObject({ times: 6, amount: 1.5, unit: 'L' });
    expect(baseValue(q)).toBe(9000);
    expect(parseQty('6 x 1,5 l')).toMatchObject({ times: 6, amount: 1.5, unit: 'L' });
  });

  it('reads Polish recipe units and converts to the canonical unit', () => {
    expect(parseQty('2 łyżki')).toMatchObject({ amount: 30, unit: 'ml', dim: 'volume' });
    expect(parseQty('1 łyżeczka')).toMatchObject({ amount: 5, unit: 'ml' });
    expect(parseQty('1 szklanka')).toMatchObject({ amount: 250, unit: 'ml' });
    expect(parseQty('5 dag')).toMatchObject({ amount: 50, unit: 'g' });
    expect(parseQty('2 ząbki')).toMatchObject({ amount: 2, unit: 'clove' });
    expect(parseQty('½ szklanki')).toMatchObject({ amount: 125, unit: 'ml' });
    expect(parseQty('1/2 kg')).toMatchObject({ amount: 0.5, unit: 'kg' });
  });

  it('refuses what has no number in it', () => {
    expect(parseQty('')).toBeNull();
    expect(parseQty('a pinch')).toBeNull();
    expect(parseQty(null)).toBeNull();
    expect(parseQty('to taste')).toBeNull();
  });

  it('keeps an unknown unit as a count of that thing', () => {
    expect(parseQty('3 jars')).toMatchObject({ amount: 3, unit: 'jars', dim: 'count' });
  });
});

describe('formatQty', () => {
  it('prints the unit a person would write', () => {
    expect(formatQty(parseQty('1000 g')!)).toBe('1 kg');
    expect(formatQty(parseQty('0.5 kg')!)).toBe('500 g');
    expect(formatQty(parseQty('1500 ml')!)).toBe('1.5 L');
    expect(formatQty(parseQty('6 × 1.5 L')!)).toBe('6 × 1.5 L');
    expect(formatQty(parseQty('2 bunch')!)).toBe('2 bunches');
    expect(formatQty(parseQty('1 bunch')!)).toBe('1 bunch');
    expect(formatQty(parseQty('4')!)).toBe('4');
  });
});

describe('compareQty', () => {
  const q = (text: string) => parseQty(text);
  it('lets 1 kg cover 500 g', () => {
    expect(compareQty(q('1 kg'), q('500 g'))).toBe('covers');
    expect(compareQty(q('2 kg'), q('600 g'))).toBe('covers');
  });
  it('knows 250 g is short of 300 g', () => {
    expect(compareQty(q('250 g'), q('300 g'))).toBe('short');
  });
  it('does not guess across kinds', () => {
    expect(compareQty(q('10'), q('500 g'))).toBe('unknown');
    expect(compareQty(q('2 bunches'), q('1 clove'))).toBe('unknown');
    expect(compareQty(null, q('1 kg'))).toBe('unknown');
  });
  it('counts bare pieces against pieces', () => {
    expect(compareQty(q('10'), q('1'))).toBe('covers');
  });
});

describe('sumQty and shopQty', () => {
  it('adds the same kind and refuses the rest', () => {
    expect(formatQty(sumQty(parseQty('250 g')!, parseQty('0.75 kg')!)!)).toBe('1 kg');
    expect(sumQty(parseQty('1 kg')!, parseQty('1 L')!)).toBeNull();
  });
  it('rounds a recipe amount up to a size things come in', () => {
    expect(formatQty(shopQty(parseQty('600 g')!))).toBe('750 g');
    expect(formatQty(shopQty(parseQty('2 łyżki')!))).toBe('250 ml');
    expect(formatQty(shopQty(parseQty('8 kg')!))).toBe('8 kg');
    expect(formatQty(shopQty(parseQty('2')!))).toBe('2');
  });
});
