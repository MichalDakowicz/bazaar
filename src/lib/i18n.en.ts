import { MONTHS_EN } from './i18nHelpers';

/** Bazaar's English. The shape every other language has to match. */
export const en = {
  // navigation
  lists: 'Lists',
  catalog: 'Catalog',
  history: 'History',
  household: 'Household',
  settings: 'Settings',
  add: 'Add',
  back: 'Back',

  // lists
  listsMeta: (n: number, people: string) =>
    `${n} ${n === 1 ? 'list' : 'lists'}${people ? ` · shared with ${people}` : ''}`,
  itemsCount: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
  basketOf: (done: number, total: number) => `${done} of ${total} in basket`,
  toGet: 'to get',
  inBasket: 'in basket',
  inBasketH: 'In basket',
  shoppingChip: (name: string) => `${name} is shopping`,
  youShopping: 'You are shopping',
  noListsTitle: 'No lists yet',
  noListsBody: 'Make your first list to start adding things.',
  emptyListTitle: 'This list is empty',
  emptyListBody: 'Add the first thing you need.',
  emptyListAction: 'Add something',
  allInBasket: 'Everything is in the basket',
  newList: 'New list',
  editList: 'Edit list',
  listName: 'Name',
  listNamePh: 'Weekly shop',
  listStore: 'Where from',
  listStorePh: 'Lidl, the market, Rossmann…',
  listWhen: 'When',
  listWhenPh: 'Wednesday, 24 Dec, anytime…',
  create: 'Create',
  save: 'Save',
  archive: 'Archive list',
  deleteList: 'Delete list',
  deleteListTitle: 'Delete this list?',
  deleteListBody: 'Its items and its shopping history go with it, for everyone on it.',
  leaveList: 'Leave list',
  startShopping: 'Start shopping',
  finishShopping: 'Finish shopping',
  finishTitle: 'Finish shopping?',
  finishBody: (bought: number, left: number) =>
    left > 0
      ? `${bought} in the basket go to History. The ${left} you did not pick up stay on the list.`
      : `${bought} in the basket go to History.`,
  stillShopping: 'Keep shopping',
  tripDone: (n: number) => `Shopping done · ${n} ${n === 1 ? 'item' : 'items'}`,
  swipeCheck: '✓',
  putInBasket: 'Put in basket',
  removeItem: 'Remove',
  removed: 'Removed',
  edit: 'Edit',

  // add
  addTo: 'Add to',
  searchPh: 'Search in English or Polish',
  tryWords: 'Try a few words',
  any: 'Any',
  anyNo: 'Any · no preference',
  nothing: 'Nothing for',
  addOwn: 'Add',
  results: 'Results',
  alsoMatching: 'Also matching',
  matched: (name: string) => `matched “${name}”`,
  onTheList: 'on the list',
  justAdd: 'Just add',
  webHint: 'Every group is optional · ↵ adds',
  justAdded: 'Just added',
  added: (name: string) => `+ ${name}`,
  noListToAdd: 'Make a list first',
  noListToAddBody: 'Items go on a list. Tap + on the Lists tab to make one.',
  pickList: 'Which list?',

  // catalog
  usuals: 'Your usuals',
  popular: 'Popular here',
  categories: 'Categories',
  products: (n: number) => `${n} ${n === 1 ? 'product' : 'products'}`,
  allCatalog: 'All products',
  catalogEmpty: 'Nothing in this section yet',

  // history
  thisWeek: 'This week',
  earlierIn: (month: number) => `Earlier in ${MONTHS_EN[month]}`,
  reuse: 'Reuse',
  reused: (n: number, list: string) => `${n} ${n === 1 ? 'item' : 'items'} copied to ${list}`,
  historyEmptyTitle: 'No shopping yet',
  historyEmptyBody: 'Finish a trip from a list and it lands here, ready to reuse.',
  skipped: (n: number) => `${n} skipped`,
  you: 'you',

  // household
  houseMeta: (people: string, shared: number) =>
    `${people} · ${shared} ${shared === 1 ? 'shared list' : 'shared lists'}`,
  onlyYou: 'Just you',
  today: 'Today',
  earlier: 'Earlier',
  isShopping: (name: string) => `${name} is shopping`,
  picked: 'Just picked up',
  addFor: (name: string) => `Add something for ${name}`,
  live: 'Live',
  addedItems: (name: string, items: string) => `${name} added ${items}`,
  finishedTrip: (name: string, n: number) => `${name} finished shopping · ${n} ${n === 1 ? 'item' : 'items'}`,
  joinedList: (name: string, who: string) => `${name} added ${who}`,
  houseEmptyTitle: 'Nothing yet',
  houseEmptyBody: 'Add someone to a list and what they do shows up here.',
  addPerson: 'Add someone',
  addPersonTitle: 'Add someone to your lists',
  addPersonBody: 'Friends only — they can see and change the lists you pick.',
  noFriends: 'No friends to add',
  noFriendsBody: 'Friends come from Radar. Add one there and they appear here.',
  members: 'Members',
  removeMember: 'Remove',
  owner: 'Owner',
  sharedOn: (n: number) => `On ${n} ${n === 1 ? 'list' : 'lists'}`,

  // live
  liveStore: (store: string) => (store ? `Live · ${store}` : 'Live'),
  tripEnded: 'Shopping finished',

  // settings
  language: 'Language',
  appL: 'App',
  prodL: 'Product names',
  prodNote: 'Search always covers both languages, with matches in this one first.',
  shopH: 'Shopping & notifications',
  swipeLabel: 'Swipe to check',
  swipeSub: 'Or tap the circle',
  notifyAdds: 'When someone adds items',
  notifyAddsSub: 'A notice while the app is open',
  notifyShopping: 'When someone starts shopping',
  notifyShoppingSub: 'So you can add last-minute items',
  alwaysHome: 'Always at home',
  alwaysHomeSub: 'A pasted recipe skips these',
  appearance: 'Appearance',
  otherDevices: 'Other devices',
  about: 'About',
  signOut: 'Sign out',

  // recipe
  pasteRecipe: 'Paste a recipe',
  recipeSub: 'The ingredients, one per line — Polish or English.',
  recipePh: 'Pierogi ruskie\n500 g mąki\n1 jajko\n600 g ziemniaków',
  foundIngredients: (n: number) => `${n} ${n === 1 ? 'ingredient' : 'ingredients'} found`,
  cancel: 'Cancel',
  recipeBtn: (add: number, update: number) => {
    const parts = [add > 0 ? `Add ${add}` : '', update > 0 ? `update ${update}` : ''].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Nothing to add';
  },
  recipeAdded: (title: string, add: number, update: number) =>
    `${title || 'Recipe'} · +${add}${update ? ` · ${update} updated` : ''}`,
  recipeEmpty: 'Paste a recipe and the ingredients show up here.',
  reasonCovered: (have: string, need: string) => `On the list: ${have} covers ${need}`,
  reasonUpdate: (have: string, need: string) => `${have} on the list, recipe needs ${need}`,
  reasonHome: 'Marked as always at home',
  reasonNew: 'Not on the list yet',
  reasonCustom: 'Not in the catalog — added as typed',
  actCovered: 'covered',
  actSkip: 'skip',

  // shared
  undo: 'Undo',
  retry: 'Try again',
  loading: 'Loading…',
  error: 'That did not work',
  tablesMissing: 'Bazaar’s tables are not in the database yet. Run supabase/schema.sql in the Supabase dashboard, then pull to refresh.',
  nothingMatches: 'Nothing matches',
  you_: 'You',
  someone: 'Someone',
};

export type Dictionary = typeof en;
