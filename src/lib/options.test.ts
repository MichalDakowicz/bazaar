import { pick, resolveOptions } from './options';
import { OPTION_SETS, optionSetFor } from './optionSets';

const flour = optionSetFor('flour')!;
const eggs = optionSetFor('eggs')!;
const milk = optionSetFor('milk')!;

describe('defaults', () => {
  it('opens on all-purpose wheat flour, 1 kg', () => {
    const r = resolveOptions(flour, '');
    expect(r.opt).toBe('Wheat · typ 550');
    expect(r.qty).toBe('1 kg');
    expect(r.groups.every((g) => !g.inferred)).toBe(true);
  });

  it('opens on L free-range eggs, ten of them', () => {
    const r = resolveOptions(eggs, '');
    expect(r.opt).toBe('L · Free-range');
    expect(r.qty).toBe('10');
  });

  it('opens on whole fresh milk, 2 L', () => {
    const r = resolveOptions(milk, '');
    expect(r.opt).toBe('3.2% · Fresh');
    expect(r.qty).toBe('2 L');
  });
});

describe('inference', () => {
  it('hears "pierogów" and says so', () => {
    const r = resolveOptions(flour, 'mąka do pierogów');
    const grain = r.groups.find((g) => g.id === 'grain')!;
    const type = r.groups.find((g) => g.id === 'type')!;
    expect(grain.value).toBe('wheat');
    expect(type.value).toBe(550);
    expect(type.inferred).toBe(true);
    expect(type.why).toBe('pierogów');
  });

  it('turns to rye flour for żurek, typ 2000', () => {
    const r = resolveOptions(flour, 'mąka żytnia na żurek');
    expect(r.opt).toBe('Rye · typ 2000');
  });

  it('reads size and farming out of "duże jajka wiejskie"', () => {
    const r = resolveOptions(eggs, 'duże jajka wiejskie');
    expect(r.opt).toBe('L · Free-range');
    expect(r.groups.find((g) => g.id === 'size')!.inferred).toBe(true);
  });

  it('reads lactose-free milk', () => {
    expect(resolveOptions(milk, 'mleko bez laktozy').opt).toBe('3.2% · Lactose-free');
  });

  it('reads półtłusty as half-fat, not full-fat', () => {
    const quark = optionSetFor('quark')!;
    expect(resolveOptions(quark, 'twaróg półtłusty').opt).toBe('Half-fat');
    expect(resolveOptions(quark, 'twaróg tłusty').opt).toBe('Full-fat');
  });
});

describe('manual picks', () => {
  it('beat the query', () => {
    const r = resolveOptions(flour, 'mąka do pierogów', { type: 650 });
    expect(r.groups.find((g) => g.id === 'type')!.value).toBe(650);
    expect(r.groups.find((g) => g.id === 'type')!.inferred).toBe(false);
  });

  it('falls back when switching grain makes the old type invalid', () => {
    const r = resolveOptions(flour, '', { type: 650, grain: 'rye' });
    expect(r.groups.find((g) => g.id === 'type')!.value).toBe(720);
  });

  it('turns a skipped group into Any and drops it from the text', () => {
    const r = resolveOptions(eggs, '', { farm: null });
    expect(r.opt).toBe('L');
    expect(r.groups.find((g) => g.id === 'farm')!.isAny).toBe(true);
  });

  it('turns a skipped pack into a quantity of one', () => {
    expect(resolveOptions(eggs, '', { pack: null }).qty).toBe('1');
  });

  it('toggles a value off when it is tapped again', () => {
    const base = resolveOptions(eggs, '');
    const size = base.groups.find((g) => g.id === 'size')!;
    expect(pick({}, size, 'L')).toEqual({ size: null });
    expect(pick({}, size, 'XL')).toEqual({ size: 'XL' });
  });
});

describe('the sets', () => {
  it('are each keyed to a distinct product and resolve without a query', () => {
    const ids = OPTION_SETS.map((s) => s.productId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const set of OPTION_SETS) {
      const r = resolveOptions(set, '');
      expect(r.groups.length).toBe(set.groups.length);
      expect(r.qty).not.toBe('');
    }
  });
});
