import { customItem } from './customItem';
import { newItemToRow, normalizeItem } from './normalize';
import { viewList } from './listModel';
import { searchProducts } from './search';

describe('customItem', () => {
  it('writes a typed item to Other and draws it under Inne', () => {
    const item = customItem('  My special purchase  ', '2')!;
    expect(item).toMatchObject({ productId: null, cat: 'other', nameEn: 'My special purchase', namePl: 'My special purchase', qty: '2' });
    const row = { ...newItemToRow('list', item), id: 'item', added_by: null, trip_id: null, checked_by: null, checked_at: null, created_at: 'now' };
    const normalized = normalizeItem(row as Parameters<typeof normalizeItem>[0]);
    expect(viewList([normalized], 'pl').groups).toMatchObject([{ cat: 'other', name: 'Inne', items: [{ id: 'item' }] }]);
    expect(viewList([normalized], 'en').groups[0].name).toBe('Other');
  });

  it('rejects blank input', () => {
    expect(customItem(' \n ')).toBeNull();
  });

  it('keeps the exact typed item when a fuzzy search finds something else', () => {
    const query = 'figure 8 straps';
    expect(searchProducts(query, 'pl').some(({ product }) => product.id === 'straws')).toBe(true);
    expect(customItem(query)).toMatchObject({ productId: null, nameEn: query, namePl: query, cat: 'other' });
    expect(customItem('x')).toMatchObject({ nameEn: 'x' });
  });
});
