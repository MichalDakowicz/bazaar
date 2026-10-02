import { strings } from '@/lib/i18n';
import { applyPlan, planRecipe } from '@/lib/recipe';
import type { ListItem } from '@/types/bazaar';

import { recipeLine, withFlips } from './recipeLines';

const RECIPE = `Pierogi ruskie (ok. 50 szt.)
500 g mąki
2 łyżki oleju
300 g twarogu półtłustego
2 cebule
sól, pieprz`;

function onList(id: string, productId: string, nameEn: string, qty: string): ListItem {
  return {
    id, listId: 'l1', addedBy: 'a', tripId: null, productId, cat: 'pantry', nameEn, namePl: nameEn,
    opt: '', qty, checkedBy: null, checkedAt: null, createdAt: '2026-09-24T08:00:00Z',
  };
}

const LIST = [onList('i1', 'flour', 'Flour', '1 kg'), onList('i2', 'quark', 'Quark', '250 g')];
const CONTEXT = { items: LIST, alwaysHome: ['salt', 'salt-pepper', 'black-pepper', 'white-pepper'], lang: 'pl' as const };

const en = strings('en');
const pl = strings('pl');
const plan = planRecipe(RECIPE, CONTEXT);
const row = (nameEn: string) => plan.rows.find((r) => r.nameEn === nameEn)!;

describe('recipeLine', () => {
  it('words a row the plan wants to add', () => {
    const line = recipeLine(row('Onions'), en, 'en');
    expect(line).toMatchObject({ on: true, name: 'Onions', reason: 'Not on the list yet', act: '2' });
    expect(line.alt).not.toBe('');
  });

  it('shows the name in the product language with the other as small print', () => {
    const line = recipeLine(row('Onions'), en, 'pl');
    expect(line.name).toBe(row('Onions').namePl);
    expect(line.alt).toBe('Onions');
  });

  it('says how a quantity on the list falls short', () => {
    const line = recipeLine(row('Quark'), en, 'en');
    expect(line.reason).toBe('250 g on the list, recipe needs 300 g');
    expect(line.act).toBe('→ 300 g');
  });

  it('says a row is covered while it is off, and what it will add once it is on', () => {
    const flour = row('Flour');
    expect(recipeLine(flour, en, 'en')).toMatchObject({ on: false, act: 'covered' });
    expect(recipeLine(flour, en, 'en').reason).toMatch(/^On the list: 1 kg covers/);
    const on = recipeLine({ ...flour, on: true }, en, 'en');
    expect(on.act).toBe(flour.add.qty);
  });

  it('says a skipped row is skipped', () => {
    const salt = plan.rows.find((r) => r.action === 'skip')!;
    expect(recipeLine(salt, en, 'en')).toMatchObject({ on: false, act: 'skip', reason: 'Marked as always at home' });
    expect(recipeLine(salt, pl, 'pl').act).toBe('pomiń');
  });

  it('prints no small print when the two names are the same word', () => {
    const custom = planRecipe('Dip\n1 szt. kzxqv', { items: [], alwaysHome: [], lang: 'pl' }).rows[0];
    const line = recipeLine(custom, en, 'en');
    expect(line.alt).toBe('');
    expect(line.reason).toBe('Not in the catalog — added as typed');
  });
});

describe('withFlips', () => {
  it('switches a row by the line it came from, and leaves the rest', () => {
    const flour = row('Flour');
    const rows = withFlips(plan.rows, new Set([flour.raw]));
    expect(rows.find((r) => r.nameEn === 'Flour')!.on).toBe(true);
    expect(rows.find((r) => r.nameEn === 'Quark')!.on).toBe(true);
    expect(applyPlan(rows).adds.map((a) => a.nameEn)).toContain('Flour');
  });

  it('turns an update row off', () => {
    const quark = row('Quark');
    const rows = withFlips(plan.rows, new Set([quark.raw]));
    expect(applyPlan(rows).updates).toEqual([]);
  });

  it('keeps a flip when another line of the paste changes', () => {
    const flour = row('Flour');
    const edited = planRecipe(RECIPE.replace('2 cebule', '3 cebule'), CONTEXT);
    const rows = withFlips(edited.rows, new Set([flour.raw]));
    expect(rows.find((r) => r.nameEn === 'Flour')!.on).toBe(true);
  });
});
