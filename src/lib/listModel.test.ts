import type { ListItem } from '@/types/bazaar';

import { findOnList, isLive, itemAlt, itemName, justPicked, viewList } from './listModel';

let n = 0;
function item(over: Partial<ListItem> = {}): ListItem {
  n += 1;
  return {
    id: `i${n}`,
    listId: 'l1',
    addedBy: 'a',
    tripId: null,
    productId: null,
    cat: 'produce',
    nameEn: 'Tomatoes',
    namePl: 'Pomidory',
    opt: '',
    qty: '1 kg',
    checkedBy: null,
    checkedAt: null,
    createdAt: `2026-09-24T08:${String(10 + n).padStart(2, '0')}:00Z`,
    ...over,
  };
}

describe('viewList', () => {
  it('walks the shop: sections in order, items in the order they were added', () => {
    const milk = item({ cat: 'dairy', nameEn: 'Milk', namePl: 'Mleko' });
    const dill = item({ cat: 'produce', nameEn: 'Dill', namePl: 'Koperek' });
    const bread = item({ cat: 'bakery', nameEn: 'Bread', namePl: 'Chleb' });
    const tomato = item({ cat: 'produce' });
    const view = viewList([milk, dill, bread, tomato], 'en');
    expect(view.groups.map((g) => g.cat)).toEqual(['produce', 'bakery', 'dairy']);
    expect(view.groups[0].items.map((i) => i.nameEn)).toEqual(['Dill', 'Tomatoes']);
    expect(view.groups[0].name).toBe('Produce');
    expect(view.groups[0].alt).toBe('Warzywa i owoce');
  });

  it('names sections in the product language', () => {
    expect(viewList([item()], 'pl').groups[0].name).toBe('Warzywa i owoce');
  });

  it('counts the basket and the progress', () => {
    const a = item({ checkedAt: '2026-09-24T09:00:00Z' });
    const b = item({ checkedAt: '2026-09-24T09:30:00Z' });
    const c = item();
    const view = viewList([a, b, c], 'en');
    expect(view).toMatchObject({ total: 3, done: 2, left: 1, percent: 67 });
    expect(view.inBasket.map((i) => i.id)).toEqual([b.id, a.id]);
  });

  it('is empty without dividing by zero', () => {
    expect(viewList([], 'en')).toMatchObject({ total: 0, done: 0, left: 0, percent: 0, groups: [] });
  });

  it('leaves out what a finished trip carried home', () => {
    const gone = item({ tripId: 't1', checkedAt: '2026-09-20T09:00:00Z' });
    const live = item();
    expect(isLive(gone)).toBe(false);
    expect(viewList([gone, live], 'en').total).toBe(1);
  });
});

describe('names', () => {
  it('shows the product language first and the other as small print', () => {
    const tomatoes = item();
    expect(itemName(tomatoes, 'pl')).toBe('Pomidory');
    expect(itemAlt(tomatoes, 'pl')).toBe('Tomatoes');
    expect(itemName(tomatoes, 'en')).toBe('Tomatoes');
    expect(itemAlt(tomatoes, 'en')).toBe('Pomidory');
  });

  it('shows no small print when the two names are the same word', () => {
    expect(itemAlt(item({ nameEn: 'Kefir', namePl: 'Kefir' }), 'pl')).toBe('');
  });
});

describe('findOnList and justPicked', () => {
  it('finds the unticked live item for a product', () => {
    const quark = item({ productId: 'quark', nameEn: 'Quark' });
    expect(findOnList([quark], { id: 'quark', en: 'Quark' })).toBe(quark);
    expect(findOnList([{ ...quark, checkedAt: '2026-09-24T09:00:00Z' }], { id: 'quark', en: 'Quark' })).toBeNull();
    expect(findOnList([{ ...quark, tripId: 't1' }], { id: 'quark', en: 'Quark' })).toBeNull();
  });

  it('matches a custom item by its English name', () => {
    const custom = item({ productId: null, nameEn: 'Dog treats' });
    expect(findOnList([custom], { en: 'dog treats' })).toBe(custom);
  });

  it('lists the last things ticked, newest first', () => {
    const a = item({ checkedAt: '2026-09-24T09:00:00Z' });
    const b = item({ checkedAt: '2026-09-24T09:10:00Z' });
    const c = item({ checkedAt: '2026-09-24T09:05:00Z' });
    expect(justPicked([a, b, c], 2).map((i) => i.id)).toEqual([b.id, c.id]);
  });
});
