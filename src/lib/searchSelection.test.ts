import { searchProducts } from './search';
import { searchSelection } from './searchSelection';
import { productToItem } from './usuals';

describe('searchSelection', () => {
  it('offers a named bakery item directly instead of opening the generic rolls picker', () => {
    const matches = searchProducts('bulka paryska', 'pl');
    expect(matches[0].product).toMatchObject({ id: 'parisian-roll', pl: 'Bułka paryska', cat: 'bakery' });
    expect(searchSelection(matches, null)).toBeNull();
    expect(productToItem(matches[0].product)).toMatchObject({ productId: 'parisian-roll', opt: '' });
  });

  it('still opens the best match when it has options', () => {
    const matches = searchProducts('mleko', 'pl');
    expect(searchSelection(matches, null)?.product.id).toBe('milk');
  });

  it('lets the user explicitly choose a lower-ranked generic picker', () => {
    const matches = searchProducts('mleko skondensowane', 'pl');
    expect(searchSelection(matches, 'milk')?.product.id).toBe('milk');
    expect(searchSelection(matches, 'missing')).toBeNull();
    expect(searchSelection([], null)).toBeNull();
  });
});
