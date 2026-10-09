import { searchProducts } from '../search';
import { productToItem } from '../usuals';
import { productById } from './index';

describe('expanded catalogue', () => {
  it.each([
    ['gym', 'figure-8-straps', 'figure 8 straps', 'paski ósemkowe'],
    ['clothing', 'socks', 'socks', 'skarpetki'],
    ['household', 'cutting-board', 'cutting board', 'deska do krojenia'],
    ['medicine', 'paracetamol', 'paracetamol', 'apap'],
    ['supplements', 'creatine-monohydrate', 'creatine monohydrate', 'monohydrat kreatyny'],
  ])('finds and files a %s product through either language', (cat, id, en, pl) => {
    for (const query of [en, pl]) {
      expect(searchProducts(query, 'pl')[0].product.id).toBe(id);
    }
    const product = productById(id)!;
    expect(productToItem(product)).toMatchObject({ productId: id, cat });
  });

  it('keeps an existing product ID when moving first-aid stock into Medicine', () => {
    expect(productById('plasters')).toMatchObject({ en: 'Plasters', pl: 'Plastry', cat: 'medicine' });
  });
});
