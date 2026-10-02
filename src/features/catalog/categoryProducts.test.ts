import { CATEGORY_COUNTS, productById, productsIn } from '@/lib/catalog';

import { defaultItem, productsFor } from './categoryProducts';

const ids = (products: readonly { id: string }[]) => products.map((product) => product.id);

describe('productsFor', () => {
  it('lists the whole section, in shop order, when nothing is typed', () => {
    expect(productsFor('dairy', '', 'en')).toHaveLength(CATEGORY_COUNTS.dairy);
    expect(ids(productsFor('dairy', '   ', 'en'))).toEqual(ids(productsIn('dairy')));
  });

  it('shows everything for a query made only of filler words', () => {
    expect(productsFor('dairy', 'the', 'en')).toHaveLength(CATEGORY_COUNTS.dairy);
  });

  it('narrows to what the query finds in this section', () => {
    expect(ids(productsFor('dairy', 'eggs', 'en'))).toContain('eggs');
    expect(productsFor('dairy', 'eggs', 'en').every((product) => product.cat === 'dairy')).toBe(true);
  });

  it('finds a product by its other-language name and an inflected ending', () => {
    expect(ids(productsFor('dairy', 'jajka', 'en'))).toContain('eggs');
    expect(ids(productsFor('dairy', 'jajek', 'pl'))).toContain('eggs');
  });

  it('is empty when the thing is in another section', () => {
    expect(productsFor('fish', 'eggs', 'en')).toEqual([]);
  });

  it('ranks the best answer first', () => {
    expect(productsFor('dairy', 'milk', 'en')[0].id).toBe('milk');
  });
});

describe('defaultItem', () => {
  it('adds a plain product as itself', () => {
    const item = defaultItem(productById('bananas')!);
    expect(item).toMatchObject({ productId: 'bananas', opt: '', qty: '1' });
  });

  it('adds a product with options on its defaults', () => {
    const item = defaultItem(productById('eggs')!);
    expect(item).toMatchObject({ productId: 'eggs', opt: 'L · Free-range', qty: '10' });
  });
});
