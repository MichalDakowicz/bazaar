import { productById } from '@/lib/catalog';
import { viewList } from '@/lib/listModel';
import type { ListItem } from '@/types/bazaar';

import { buildCell, cellNote, gridColumns, justLines, layoutRows, listSections, toLine, type NoteWords } from './planner';

const words: NoteWords = {
  onList: (list) => `On ${list}`,
  matched: (name) => `matched “${name}”`,
};

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
    qty: '1',
    checkedBy: null,
    checkedAt: null,
    createdAt: `2026-09-24T08:${String(10 + n).padStart(2, '0')}:00Z`,
    ...over,
  };
}

describe('gridColumns', () => {
  it('is one column while searching, whatever the room', () => {
    expect(gridColumns(true, 1400)).toBe(1);
  });

  it('is three columns when the centre is roomy and two when the list at the right squeezes it', () => {
    expect(gridColumns(false, 766)).toBe(3);
    expect(gridColumns(false, 728)).toBe(3);
    expect(gridColumns(false, 624)).toBe(2);
    expect(gridColumns(false, 524)).toBe(2);
  });
});

describe('cellNote', () => {
  const base = { searching: false, alt: 'Mleko', via: null, hint: null, category: 'Dairy & eggs', here: null, words };

  it('browsing: the twin name, then the option hint', () => {
    expect(cellNote({ ...base, hint: 'size · farming' })).toBe('Mleko · size · farming');
    expect(cellNote(base)).toBe('Mleko');
  });

  it('browsing: being on the list replaces the twin, qty 1 stays quiet', () => {
    expect(cellNote({ ...base, here: { listName: 'Weekly shop', opt: '3.2%', qty: '2 L' } })).toBe('On Weekly shop · 3.2% · 2 L');
    expect(cellNote({ ...base, here: { listName: 'Weekly shop', opt: '', qty: '1' } })).toBe('On Weekly shop');
  });

  it('searching: the twin leads, then the hint or the section', () => {
    expect(cellNote({ ...base, searching: true, hint: 'fat level' })).toBe('Mleko · fat level');
    expect(cellNote({ ...base, searching: true })).toBe('Mleko · Dairy & eggs');
  });

  it('searching: found through the other language says so instead of repeating it', () => {
    expect(cellNote({ ...base, searching: true, via: 'Milk' })).toBe('matched “Milk”');
  });

  it('searching: on the list wins over matched', () => {
    const here = { listName: 'Weekly shop', opt: '', qty: '1' };
    expect(cellNote({ ...base, searching: true, via: 'Milk', here })).toBe('Mleko · On Weekly shop');
  });
});

describe('buildCell', () => {
  const milk = productById('milk')!;
  const context = { lang: 'en' as const, searching: false, via: null, here: null, listName: 'Weekly shop', words };

  it('names the product in the product language and flags the ones that ask questions', () => {
    const cell = buildCell(milk, context);
    expect(cell).toMatchObject({ id: 'milk', name: 'Milk', hasOptions: true, onList: false });
    expect(cell.note).toBe('Mleko · fat · kind');
    expect(buildCell(milk, { ...context, lang: 'pl' }).name).toBe('Mleko');
  });

  it('marks a product already on the list', () => {
    const here = item({ productId: 'milk', opt: '3.2%', qty: '2 L', cat: 'dairy' });
    const cell = buildCell(milk, { ...context, here });
    expect(cell.onList).toBe(true);
    expect(cell.note).toBe('On Weekly shop · 3.2% · 2 L');
  });

  it('a plain product has no options', () => {
    const kefir = productById('kefir')!;
    expect(buildCell(kefir, context).hasOptions).toBe(false);
  });
});

describe('layoutRows', () => {
  const cells = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id }));

  it('breaks cells into rows of the column count', () => {
    const rows = layoutRows(cells, 3, null);
    expect(rows.map((row) => (row.type === 'cells' ? row.cells.map((c) => c.id).join('') : 'panel'))).toEqual(['abc', 'def', 'g']);
  });

  it('puts the panel after the row that holds the open cell', () => {
    const rows = layoutRows(cells, 3, 'e');
    expect(rows.map((row) => (row.type === 'cells' ? row.cells.map((c) => c.id).join('') : 'panel'))).toEqual(['abc', 'def', 'panel', 'g']);
  });

  it('puts it after the first row when the open cell is first, and last when it is last', () => {
    expect(layoutRows(cells, 3, 'a')[1].type).toBe('panel');
    const rows = layoutRows(cells, 3, 'g');
    expect(rows[rows.length - 1].type).toBe('panel');
  });

  it('one column: the panel sits right under its own cell', () => {
    const rows = layoutRows(cells, 1, 'c');
    expect(rows.map((row) => (row.type === 'cells' ? row.cells[0].id : 'panel')).slice(0, 5)).toEqual(['a', 'b', 'c', 'panel', 'd']);
  });

  it('draws no panel for an id that is not in the grid', () => {
    expect(layoutRows(cells, 3, 'zz').some((row) => row.type === 'panel')).toBe(false);
  });

  it('copes with nothing at all', () => {
    expect(layoutRows([], 3, null)).toEqual([]);
  });
});

describe('toLine', () => {
  it('splits the name from its muted tail', () => {
    const line = toLine(item({ nameEn: 'Quark', namePl: 'Twaróg', opt: 'half-fat', qty: '300 g' }), 'en');
    expect(line).toMatchObject({ name: 'Quark', rest: ' · Twaróg · half-fat', qty: '300 g', ticked: false });
  });

  it('has no tail when the twin is the same word and nothing was chosen', () => {
    expect(toLine(item({ nameEn: 'Kefir', namePl: 'Kefir' }), 'en').rest).toBe('');
  });

  it('is ticked when checked', () => {
    expect(toLine(item({ checkedAt: '2026-09-24T09:00:00Z' }), 'en').ticked).toBe(true);
  });
});

describe('justLines', () => {
  it('lists what was added newest first and forgets what is gone', () => {
    const a = item({ nameEn: 'A' });
    const b = item({ nameEn: 'B' });
    const c = item({ nameEn: 'C' });
    expect(justLines([a, b, c], [a.id, 'gone', c.id], 'en').map((l) => l.name)).toEqual(['C', 'A']);
  });
});

describe('listSections', () => {
  const dill = item({ cat: 'produce', nameEn: 'Dill', namePl: 'Koperek' });
  const milk = item({ cat: 'dairy', nameEn: 'Milk', namePl: 'Mleko' });
  const bread = item({ cat: 'bakery', nameEn: 'Bread', namePl: 'Chleb', checkedAt: '2026-09-24T09:00:00Z' });

  it('sections in shop order, then the basket', () => {
    const sections = listSections(viewList([milk, dill, bread], 'en'), [], 'In basket', 'en');
    expect(sections.map((s) => s.title)).toEqual(['Produce', 'Dairy & eggs', 'In basket']);
    expect(sections[2].lines[0]).toMatchObject({ name: 'Bread', ticked: true });
  });

  it('leaves out what "Just added" already shows, and drops sections that empties', () => {
    const sections = listSections(viewList([milk, dill, bread], 'en'), [dill.id, bread.id], 'In basket', 'en');
    expect(sections.map((s) => s.title)).toEqual(['Dairy & eggs']);
  });

  it('names sections in the product language', () => {
    expect(listSections(viewList([dill], 'pl'), [], 'W koszyku', 'pl')[0].title).toBe('Warzywa i owoce');
  });
});
