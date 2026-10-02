// Runs supabase/schema.sql against a real Postgres (PGlite, in-process) with a
// stand-in for Supabase's auth schema and Radar's shared tables, then exercises
// every policy and RPC as different users. There is no other way to learn that a
// row-level-security rule is wrong short of a user seeing someone else's list.
//
//   npm i --no-save @electric-sql/pglite && node supabase/tests/schema.test.mjs

import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const db = new PGlite();
const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';

let failures = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
};

// ---- a minimal Supabase + Radar stand-in -----------------------------------
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated;
  create role anon;
  create table public.profiles (id uuid primary key references auth.users(id), username text unique not null, display_name text, pfp text);
  create table public.user_settings (user_id uuid primary key references auth.users(id), theme text default 'dark');
  create table public.friendships (user_id uuid not null references auth.users(id), friend_id uuid not null references auth.users(id), primary key (user_id, friend_id));
  create schema private;
  create publication supabase_realtime;
  insert into auth.users values ('${A}'), ('${B}'), ('${C}');
  insert into public.friendships values ('${A}','${B}'), ('${B}','${A}');
`);

const schema = readFileSync(fileURLToPath(new URL('../schema.sql', import.meta.url)), 'utf8');
try {
  await db.exec(schema);
  await db.exec(schema); // idempotent
  ok('schema applies, twice', true);
} catch (e) {
  ok('schema applies, twice', false, e.message);
  process.exit(1);
}

await db.exec(`
  grant usage on schema public, private, auth to authenticated;
  grant all on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
  grant execute on all functions in schema private to authenticated;
  grant execute on function auth.uid() to authenticated;
`);

const as = async (uid, sql, params = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  return db.query(sql, params);
};
const fails = async (uid, sql, params = []) => {
  try {
    await as(uid, sql, params);
    return false;
  } catch {
    return true;
  }
};
const val = async (uid, sql, params = []) => (await as(uid, sql, params)).rows;

// ---- A makes a list --------------------------------------------------------
const list = (await val(A, `insert into public.bazaar_lists (owner_id, name, store) values ('${A}', 'Weekly shop', 'Lidl') returning id`))[0].id;
ok('owner can create a list and read it back', (await val(A, `select id from public.bazaar_lists where id = '${list}'`)).length === 1);
ok('owner is a member (trigger)', (await val(A, `select user_id from public.bazaar_list_members where list_id = '${list}'`)).map((r) => r.user_id).join() === A);
ok('cannot create a list owned by someone else', await fails(A, `insert into public.bazaar_lists (owner_id, name) values ('${B}', 'Sneaky')`));

// ---- items: author is the database's to say --------------------------------
await val(A, `insert into public.bazaar_items (list_id, added_by, name_en, name_pl, cat, qty) values ('${list}', '${B}', 'Milk', 'Mleko', 'dairy', '2 L')`);
const item = (await val(A, `select * from public.bazaar_items where list_id = '${list}'`))[0];
ok('added_by is forced to the caller', item.added_by === A, `got ${item.added_by}`);
ok('adding logs an activity row', (await val(A, `select kind, detail->>'name_en' as n from public.bazaar_activity where list_id = '${list}'`)).some((r) => r.kind === 'added' && r.n === 'Milk'));

// ---- an outsider sees nothing ---------------------------------------------
ok('outsider cannot read the list', (await val(B, `select id from public.bazaar_lists`)).length === 0);
ok('outsider cannot read items', (await val(B, `select id from public.bazaar_items`)).length === 0);
ok('outsider cannot add items', await fails(B, `insert into public.bazaar_items (list_id, name_en, name_pl) values ('${list}', 'Spam', 'Spam')`));
ok('outsider cannot read the feed', (await val(B, `select id from public.bazaar_activity`)).length === 0);
ok('outsider cannot add themselves', await fails(B, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${list}', '${B}', '${B}')`));

// ---- sharing: owner adds a friend, not a stranger -------------------------
ok('owner cannot add a non-friend', await fails(A, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${list}', '${C}', '${A}')`));
await val(A, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${list}', '${B}', '${A}')`);
ok('owner adds a friend', (await val(B, `select id from public.bazaar_lists`)).length === 1);
ok('joining is logged in the feed', (await val(A, `select 1 from public.bazaar_activity where kind = 'joined'`)).length === 1);
ok('a friend cannot add other people', await fails(B, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${list}', '${C}', '${B}')`));
ok('a friend sees the items', (await val(B, `select id from public.bazaar_items`)).length === 1);

// ---- B ticks: checked_by is B whatever the client says --------------------
await val(B, `update public.bazaar_items set checked_at = now(), checked_by = '${A}' where id = '${item.id}'`);
const ticked = (await val(B, `select checked_by, checked_at from public.bazaar_items where id = '${item.id}'`))[0];
ok('checked_by is forced to the ticker', ticked.checked_by === B && ticked.checked_at !== null, `got ${ticked.checked_by}`);
await val(A, `update public.bazaar_items set qty = '3 L' where id = '${item.id}'`);
ok('editing a ticked item keeps who ticked it', (await val(A, `select checked_by from public.bazaar_items where id = '${item.id}'`))[0].checked_by === B);
await val(B, `update public.bazaar_items set checked_at = null where id = '${item.id}'`);
ok('unticking clears checked_by', (await val(B, `select checked_by from public.bazaar_items where id = '${item.id}'`))[0].checked_by === null);
ok('an item cannot be moved to another list', await (async () => {
  const other = (await val(A, `insert into public.bazaar_lists (owner_id, name) values ('${A}', 'Other') returning id`))[0].id;
  await val(A, `update public.bazaar_items set list_id = '${other}' where id = '${item.id}'`);
  return (await val(A, `select list_id from public.bazaar_items where id = '${item.id}'`))[0].list_id === list;
})());

// ---- trips -----------------------------------------------------------------
await val(B, `update public.bazaar_items set checked_at = now() where id = '${item.id}'`);
await val(A, `insert into public.bazaar_items (list_id, name_en, name_pl, cat) values ('${list}', 'Bread', 'Chleb', 'bakery')`);
const trip = (await val(B, `insert into public.bazaar_trips (list_id, shopper_id, store) values ('${list}', '${B}', 'Lidl') returning id`))[0].id;
ok('starting a trip is logged', (await val(A, `select 1 from public.bazaar_activity where kind = 'shopping_started'`)).length === 1);
ok('a second open trip on the list is refused', await fails(A, `insert into public.bazaar_trips (list_id, shopper_id) values ('${list}', '${A}')`));
ok('cannot start a trip as someone else', await fails(A, `insert into public.bazaar_trips (list_id, shopper_id) values ('${list}', '${B}')`));
ok('only the shopper may finish', await fails(A, `select public.bazaar_finish_trip('${trip}')`));
await val(B, `select public.bazaar_finish_trip('${trip}')`);
const done = (await val(A, `select item_count, skipped_count, ended_at from public.bazaar_trips where id = '${trip}'`))[0];
ok('finishing counts bought and skipped', done.item_count === 1 && done.skipped_count === 1 && done.ended_at !== null, JSON.stringify(done));
ok('the ticked item left the live list', (await val(A, `select name_en from public.bazaar_items where list_id = '${list}' and trip_id is null`)).map((r) => r.name_en).join() === 'Bread');
ok('finishing is logged with counts', (await val(A, `select detail->>'item_count' as n from public.bazaar_activity where kind = 'shopping_done'`))[0].n === '1');
ok('a finished trip cannot be finished again', await fails(B, `select public.bazaar_finish_trip('${trip}')`));

// ---- reuse -----------------------------------------------------------------
const reused = (await val(A, `select public.bazaar_reuse_trip('${trip}', '${list}') as ids`))[0].ids;
ok('reuse copies the trip onto the list and returns ids', Array.isArray(reused) && reused.length === 1, JSON.stringify(reused));
const again = (await val(A, `select public.bazaar_reuse_trip('${trip}', '${list}') as ids`))[0].ids;
ok('reuse does not duplicate what is already waiting', again.length === 0);
ok('reuse needs both lists', await fails(C, `select public.bazaar_reuse_trip('${trip}', '${list}')`));

// ---- leaving and removing --------------------------------------------------
ok('the owner cannot leave their own list', await fails(A, `delete from public.bazaar_list_members where list_id = '${list}' and user_id = '${A}'`) || (await val(A, `select 1 from public.bazaar_list_members where list_id = '${list}' and user_id = '${A}'`)).length === 1);
ok('a member cannot remove someone else directly', (await (async () => { await val(B, `delete from public.bazaar_list_members where list_id = '${list}' and user_id = '${A}'`); return (await val(A, `select 1 from public.bazaar_list_members where list_id = '${list}' and user_id = '${A}'`)).length; })()) === 1);
ok('a non-owner cannot use remove_member', await fails(B, `select public.bazaar_remove_member('${list}', '${A}')`));
await val(A, `select public.bazaar_remove_member('${list}', '${B}')`);
ok('the owner removes a member', (await val(B, `select id from public.bazaar_lists`)).length === 0);
await val(A, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${list}', '${B}', '${A}')`);
await val(B, `delete from public.bazaar_list_members where list_id = '${list}' and user_id = '${B}'`);
ok('a member can leave', (await val(B, `select id from public.bazaar_lists`)).length === 0);
ok('only the owner deletes a list', await (async () => { await val(B, `delete from public.bazaar_lists where id = '${list}'`); return (await val(A, `select 1 from public.bazaar_lists where id = '${list}'`)).length === 1; })());

// ---- activity is read-only to clients; settings are private ----------------
ok('a client cannot write the feed', await fails(A, `insert into public.bazaar_activity (list_id, actor_id, kind) values ('${list}', '${A}', 'added')`));
await val(A, `insert into public.bazaar_settings (user_id, app_lang) values ('${A}', 'pl')`);
ok('settings are the owner\'s alone', (await val(B, `select 1 from public.bazaar_settings`)).length === 0 && (await val(A, `select always_home from public.bazaar_settings`))[0].always_home.includes('salt-pepper'));
ok('cannot write someone else\'s settings', await fails(B, `insert into public.bazaar_settings (user_id) values ('${A}')`));

// ---- deleting the list takes everything with it ----------------------------
await val(A, `delete from public.bazaar_lists where id = '${list}'`);
const left = (await db.query(`select (select count(*) from public.bazaar_items where list_id = '${list}')::int as items, (select count(*) from public.bazaar_trips where list_id = '${list}')::int as trips, (select count(*) from public.bazaar_activity where list_id = '${list}')::int as act, (select count(*) from public.bazaar_list_members where list_id = '${list}')::int as members`)).rows[0];
ok('deleting a list cascades', left.items + left.trips + left.act + left.members === 0, JSON.stringify(left));

// ---- taking things back ----------------------------------------------------
// A owns "Home" and shares it with B; B owns "Garden" and shares it with A.
const home = (await val(A, `insert into public.bazaar_lists (owner_id, name) values ('${A}', 'Home') returning id`))[0].id;
await val(A, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${home}', '${B}', '${A}')`);
const garden = (await val(B, `insert into public.bazaar_lists (owner_id, name) values ('${B}', 'Garden') returning id`))[0].id;
await val(B, `insert into public.bazaar_list_members (list_id, user_id, added_by) values ('${garden}', '${A}', '${B}')`);

// One finished trip per shopper on Home, each carrying one item, plus one trip left open.
const shop = async (uid, name) => {
  await val(uid, `insert into public.bazaar_items (list_id, name_en, name_pl, checked_at) values ('${home}', '${name}', '${name}', now())`);
  const id = (await val(uid, `insert into public.bazaar_trips (list_id, shopper_id) values ('${home}', '${uid}') returning id`))[0].id;
  await val(uid, `select public.bazaar_finish_trip('${id}')`);
  return id;
};
const tripA = await shop(A, 'Rice');
const tripB = await shop(B, 'Pasta');
const shopB = await shop(B, 'Beans');
const open = (await val(B, `insert into public.bazaar_trips (list_id, shopper_id) values ('${home}', '${B}') returning id`))[0].id;
// As the table owner, so a count is what is in the table and not what the last caller may see.
const count = async (sql) => {
  await db.exec('reset role');
  return (await db.query(sql)).rows[0].n;
};

ok('a member cannot delete a trip they did not shop and do not own', (await val(B, `select public.bazaar_delete_trips(array['${tripA}']::uuid[]) as n`))[0].n === 0
  && (await count(`select count(*)::int as n from public.bazaar_trips where id = '${tripA}'`)) === 1);
ok('an outsider cannot delete a trip', (await val(C, `select public.bazaar_delete_trips(array['${tripA}']::uuid[]) as n`))[0].n === 0);
ok('an open trip is not history and is never deleted', (await val(B, `select public.bazaar_delete_trips(array['${open}']::uuid[]) as n`))[0].n === 0);
ok('the shopper deletes their own trip', (await val(B, `select public.bazaar_delete_trips(array['${tripB}']::uuid[]) as n`))[0].n === 1);
ok('deleting a trip deletes the items it carried, not just the row', (await count(`select count(*)::int as n from public.bazaar_items where name_en = 'Pasta'`)) === 0);
ok('deleting a trip does not put its items back on the list', (await val(A, `select 1 from public.bazaar_items where list_id = '${home}' and trip_id is null and name_en = 'Pasta'`)).length === 0);
ok('feed lines naming a deleted trip and its items go too', (await count(`select count(*)::int as n from public.bazaar_activity where detail->>'trip_id' = '${tripB}' or detail->>'name_en' = 'Pasta'`)) === 0);
ok('the other trip and its feed lines are untouched', (await count(`select count(*)::int as n from public.bazaar_activity where detail->>'trip_id' = '${tripA}'`)) === 2
  && (await count(`select count(*)::int as n from public.bazaar_items where name_en = 'Rice'`)) === 1);
ok('the owner deletes a trip someone else shopped', (await val(A, `select public.bazaar_delete_trips(array['${shopB}', '${tripA}']::uuid[]) as n`))[0].n === 2);
ok('a batch deletes only what it may and says how many', (await val(A, `select public.bazaar_delete_trips(array['${open}']::uuid[]) as n`))[0].n === 0);

ok('a member who is not the owner cannot clear the feed', await fails(B, `select public.bazaar_clear_activity('${home}')`));
await val(A, `select public.bazaar_clear_activity('${home}')`);
ok('the owner clears the feed', (await count(`select count(*)::int as n from public.bazaar_activity where list_id = '${home}'`)) === 0);

await val(A, `insert into public.bazaar_hidden_usuals (user_id, usual_key) values ('${A}', 'milk|3.2%')`);
ok('a hidden usual is private to its owner', (await val(B, `select 1 from public.bazaar_hidden_usuals`)).length === 0);
ok('cannot hide a usual for someone else', await fails(B, `insert into public.bazaar_hidden_usuals (user_id, usual_key) values ('${A}', 'eggs|L')`));
await val(A, `delete from public.bazaar_hidden_usuals where usual_key = 'milk|3.2%'`);
ok('a hidden usual can be shown again', (await val(A, `select 1 from public.bazaar_hidden_usuals`)).length === 0);

await val(A, `insert into public.bazaar_hidden_usuals (user_id, usual_key) values ('${A}', 'eggs|L')`);
await val(A, `select public.bazaar_delete_my_data()`);
ok('delete my data removes the lists I own, with their items', (await count(`select count(*)::int as n from public.bazaar_lists where id = '${home}'`)) === 0
  && (await count(`select count(*)::int as n from public.bazaar_items where list_id = '${home}'`)) === 0);
ok('...and takes me off the lists I was only on', (await count(`select count(*)::int as n from public.bazaar_list_members where user_id = '${A}'`)) === 0);
ok('...but leaves the other person\'s list alone', (await count(`select count(*)::int as n from public.bazaar_lists where id = '${garden}'`)) === 1
  && (await val(B, `select 1 from public.bazaar_list_members where list_id = '${garden}' and user_id = '${B}'`)).length === 1);
ok('...and my settings and hidden usuals', (await count(`select (select count(*) from public.bazaar_settings where user_id = '${A}')::int + (select count(*) from public.bazaar_hidden_usuals where user_id = '${A}')::int as n`)) === 0);
ok('delete my data touches nobody else\'s settings', await (async () => {
  await val(B, `insert into public.bazaar_settings (user_id) values ('${B}')`);
  await val(A, `select public.bazaar_delete_my_data()`);
  return (await val(B, `select 1 from public.bazaar_settings`)).length === 1;
})());

console.log(failures === 0 ? '\nall good' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
