import type { ListItem } from '@/types/bazaar';

import { applyPlan, planRecipe, planTotals, readRecipe, toggleRow } from './recipe';
import { buildUsuals, starterUsuals } from './usuals';

const RECIPE = `Pierogi ruskie (ok. 50 szt.)
500 g mąki
1 jajko
250 ml ciepłej wody
2 łyżki oleju
600 g ziemniaków
300 g twarogu półtłustego
2 cebule
sól, pieprz`;

let n = 0;
function onList(productId: string, nameEn: string, qty: string, over: Partial<ListItem> = {}): ListItem {
  n += 1;
  return {
    id: `i${n}`, listId: 'l1', addedBy: 'a', tripId: null, productId, cat: 'pantry', nameEn, namePl: nameEn,
    opt: '', qty, checkedBy: null, checkedAt: null, createdAt: '2026-09-24T08:00:00Z', ...over,
  };
}

// The weekly shop from the approved design: flour 1 kg, eggs 10, potatoes 2 kg, quark 250 g.
const LIST = [
  onList('flour', 'Flour', '1 kg'),
  onList('eggs', 'Eggs', '10'),
  onList('potatoes', 'Potatoes', '2 kg'),
  onList('quark', 'Quark', '250 g'),
];
const CONTEXT = { items: LIST, alwaysHome: ['salt', 'salt-pepper', 'black-pepper', 'white-pepper', 'water'], lang: 'pl' as const };

describe('readRecipe', () => {
  it('takes the dish as the title and the rest as ingredients', () => {
    const { title, ingredients } = readRecipe(RECIPE);
    expect(title).toBe('Pierogi ruskie');
    expect(ingredients.map((i) => i.text)).toEqual([
      'mąki', 'jajko', 'ciepłej wody', 'oleju', 'ziemniaków', 'twarogu półtłustego', 'cebule', 'sól', 'pieprz',
    ]);
    expect(ingredients[0].need).toMatchObject({ amount: 500, unit: 'g' });
    expect(ingredients[7].need).toBeNull();
  });

  it('has no title when the paste is only ingredients', () => {
    expect(readRecipe('jajka, mleko, mąka').title).toBe('');
    expect(readRecipe('jajka, mleko, mąka').ingredients.map((i) => i.text)).toEqual(['jajka', 'mleko', 'mąka']);
  });

  it('skips headings and method', () => {
    const { ingredients } = readRecipe(
      'Ciasto\nSkładniki:\n- 200 g mąki\nWymieszaj wszystkie składniki w misce i odstaw na pół godziny w ciepłe miejsce',
    );
    expect(ingredients.map((i) => i.text)).toEqual(['mąki']);
  });

  it('reads bullets and an English recipe', () => {
    const { ingredients } = readRecipe('Pancakes\n• 2 cups flour\n• 1 tbsp sugar\n• 2 eggs');
    expect(ingredients.map((i) => i.text)).toEqual(['flour', 'sugar', 'eggs']);
    expect(ingredients[0].need).toMatchObject({ amount: 480, unit: 'ml' });
  });
});

describe('planRecipe — the design recipe against the design list', () => {
  const plan = planRecipe(RECIPE, CONTEXT);
  const byName = (name: string) => plan.rows.find((r) => r.nameEn === name)!;

  it('names the dish', () => {
    expect(plan.title).toBe('Pierogi ruskie');
  });

  it('covers what the list already holds', () => {
    expect(byName('Flour')).toMatchObject({ action: 'covered', on: false });
    expect(byName('Eggs')).toMatchObject({ action: 'covered', on: false });
    expect(byName('Potatoes')).toMatchObject({ action: 'covered', on: false });
  });

  it('raises the quark from 250 g to what the recipe needs', () => {
    const quark = byName('Quark');
    expect(quark).toMatchObject({ action: 'update', on: true, act: '→ 300 g' });
    expect(quark.update).toEqual({ itemId: LIST[3].id, qty: '300 g' });
    expect(quark.reason).toMatchObject({ kind: 'update', have: '250 g' });
  });

  it('adds what is new, in a quantity you can buy', () => {
    const onions = byName('Onions');
    expect(onions).toMatchObject({ action: 'add', on: true });
    expect(onions.add.qty).toBe('2');
    expect(byName('Rapeseed oil').action).toBe('add');
  });

  it('skips what is always at home', () => {
    expect(byName('Water')).toMatchObject({ action: 'skip', on: false });
    expect(plan.rows.filter((r) => r.action === 'skip').length).toBeGreaterThanOrEqual(2);
  });

  it('counts what pressing the button will do', () => {
    expect(planTotals(plan.rows)).toEqual({ add: 2, update: 1 });
  });
});

describe('applyPlan', () => {
  it('writes the ticked rows and nothing else', () => {
    const plan = planRecipe(RECIPE, CONTEXT);
    const writes = applyPlan(plan.rows);
    expect(writes.updates).toHaveLength(1);
    expect(writes.adds.map((a) => a.nameEn).sort()).toEqual(['Onions', 'Rapeseed oil']);
  });

  it('adds a covered row that was switched on', () => {
    const plan = planRecipe(RECIPE, CONTEXT);
    const flour = plan.rows.find((r) => r.nameEn === 'Flour')!;
    const writes = applyPlan(toggleRow(plan.rows, flour.id));
    expect(writes.adds.map((a) => a.nameEn)).toContain('Flour');
  });

  it('chooses the flour options the recipe implies', () => {
    const plan = planRecipe('Pierogi\n500 g mąki do pierogów', { items: [], alwaysHome: [], lang: 'pl' });
    expect(plan.rows[0].add.opt).toBe('Wheat · typ 550');
    expect(plan.rows[0].add.qty).toBe('1 kg');
  });
});

describe('planRecipe — edge cases', () => {
  it('adds what the catalogue has never heard of, as typed', () => {
    const plan = planRecipe('Dip\n1 szt. kzxqv', { items: [], alwaysHome: [], lang: 'pl' });
    expect(plan.rows[0]).toMatchObject({ action: 'custom', on: true, product: null });
    expect(plan.rows[0].add.nameEn).toBe('Kzxqv');
  });

  it('does not double up when the list has the product but in a unit it cannot compare', () => {
    const plan = planRecipe('Naleśniki\n2 szklanki mąki', { items: [onList('flour', 'Flour', '1 kg')], alwaysHome: [], lang: 'pl' });
    expect(plan.rows[0].action).toBe('covered');
  });

  it('treats a product named twice as one purchase', () => {
    const plan = planRecipe('Ciasto\n200 g mąki\n100 g mąki', { items: [], alwaysHome: [], lang: 'pl' });
    expect(plan.rows).toHaveLength(1);
  });
});

describe('usuals', () => {
  const bought = (productId: string, opt: string, qty: string, at: string): ListItem =>
    onList(productId, productId === 'eggs' ? 'Eggs' : 'Milk', qty, { opt, createdAt: at, tripId: 't' });

  it('needs a thing to be bought twice, and remembers how', () => {
    const now = new Date('2026-09-24T12:00:00Z').getTime();
    const usuals = buildUsuals(
      [
        bought('eggs', 'L · Free-range', '10', '2026-09-10T10:00:00Z'),
        bought('eggs', 'L · Free-range', '15', '2026-09-17T10:00:00Z'),
        bought('milk', '3.2% · Fresh', '2 L', '2026-09-17T10:00:00Z'),
      ],
      now,
    );
    expect(usuals).toHaveLength(1);
    expect(usuals[0]).toMatchObject({ productId: 'eggs', opt: 'L · Free-range', qty: '15', count: 2 });
  });

  it('keeps different options of one product apart', () => {
    const now = new Date('2026-09-24T12:00:00Z').getTime();
    const usuals = buildUsuals(
      [
        bought('eggs', 'L · Free-range', '10', '2026-09-10T10:00:00Z'),
        bought('eggs', 'M · Barn', '10', '2026-09-17T10:00:00Z'),
      ],
      now,
    );
    expect(usuals).toEqual([]);
  });

  it('offers real starters to a household with no history', () => {
    const starters = starterUsuals();
    expect(starters.length).toBeGreaterThanOrEqual(4);
    expect(starters.find((s) => s.productId === 'eggs')).toMatchObject({ opt: 'L · Free-range', qty: '10' });
  });
});
