-- ============================================================================
-- Bazaar — schema
--
-- Idempotent, and applied by hand: Supabase Dashboard -> SQL Editor -> paste ->
-- Run. It never drops a table, a column or a row.
--
-- This project is shared with Radar, Lidar, Sonar, Pulsar and Cellar
-- (docs/shared-database.md). Everything Bazaar creates is namespaced `bazaar_*`
-- so it cannot collide with a sibling, and every table has RLS.
--
-- Bazaar is a *shared* app in a narrower way than the rest of the family. There
-- is no public shelf and no friends_visibility: a shopping list is not something
-- you publish. What there is, is a list that several people stand in front of at
-- once — one household, one list, one person in the shop. So access is not
-- keyed to auth.uid() alone but to a row in bazaar_list_members, and the only
-- way into someone else's list is for its owner to add you, and only if you are
-- already their friend (public.friendships, Radar's).
--
-- Adding a column later means an `alter table ... add column if not exists`
-- under COLUMN MIGRATIONS at the bottom — editing a `create table` does nothing
-- on a live database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Prerequisites
--
-- Radar's schema.sql owns profiles, friendships and user_settings. Bazaar reads
-- profiles (the avatars in the household) and friendships (who may be added to a
-- list). Running this first would create policies over an account model that
-- does not exist, so it fails early instead of half-applying.
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.friendships') is null
     or to_regclass('public.user_settings') is null then
    raise exception
      'Bazaar requires the shared tables. Run the Radar supabase/schema.sql first.';
  end if;
end $$;

create schema if not exists private;

-- ----------------------------------------------------------------------------
-- 1. Lists
--
-- `store` and `when_text` are labels, not data: "Lidl", "Wednesday", "24 Dec",
-- "anytime". Nothing sorts or filters on them, and a date column would invite a
-- reminder system this app does not have.
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  store       text not null default '',
  when_text   text not null default '',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Out of the Lists tab, still in History. One tap back.
  archived_at timestamptz
);

create index if not exists bazaar_lists_owner_idx on public.bazaar_lists (owner_id, position);

-- ----------------------------------------------------------------------------
-- 2. Members — who stands in front of a list
--
-- The owner is a member too (a trigger below writes that row), so every policy
-- in this file asks one question — "am I a member of this list?" — instead of
-- "am I the owner, or a member?".
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_list_members (
  list_id    uuid not null references public.bazaar_lists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  added_by   uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index if not exists bazaar_list_members_user_idx on public.bazaar_list_members (user_id);

-- ----------------------------------------------------------------------------
-- 3. Trips — one person, in a shop, with a list
--
-- An open trip (`ended_at is null`) is what "Marta is shopping" means. At most
-- one per list, enforced by the partial unique index rather than by the client:
-- two people both pressing Start would otherwise both believe they are the one
-- in the shop.
--
-- Finishing a trip hangs the ticked items off it (bazaar_items.trip_id) and
-- takes them off the live list. That is what History is: the trips, and the
-- items each one carried out of the door.
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_trips (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references public.bazaar_lists(id) on delete cascade,
  shopper_id    uuid not null references auth.users(id) on delete cascade,
  store         text not null default '',
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  -- Frozen when the trip ends: what went into the basket, and what was left.
  item_count    int not null default 0,
  skipped_count int not null default 0
);

create unique index if not exists bazaar_trips_one_open_idx
  on public.bazaar_trips (list_id) where ended_at is null;
create index if not exists bazaar_trips_list_idx on public.bazaar_trips (list_id, started_at desc);

-- ----------------------------------------------------------------------------
-- 4. Items
--
-- Both names are stored: the catalogue is a client file, and an item has to
-- survive a catalogue edit, a product that was custom-typed, and the two
-- people on the list preferring different languages. `product_id` is the
-- catalogue key when there is one — it is what "your usuals" and "covered by
-- the list" match on — and null for something typed by hand.
--
-- `cat` is a CategoryKey (src/lib/catalog/types.ts) stored as text: adding a
-- section should not need a migration.
--
-- `opt` is the picked options as the display string ("L · free-range"), and
-- `qty` is free text ("2 kg", "6 × 1.5 L") that src/lib/quantity.ts reads
-- leniently. Both are strings because they are shown, not computed on.
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.bazaar_lists(id) on delete cascade,
  added_by   uuid references auth.users(id) on delete set null,
  trip_id    uuid references public.bazaar_trips(id) on delete set null,
  product_id text,
  cat        text not null default 'pantry',
  name_en    text not null,
  name_pl    text not null,
  opt        text not null default '',
  qty        text not null default '1',
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The live list is `trip_id is null`; the partial index is the one the Lists
-- tab reads on every open.
create index if not exists bazaar_items_live_idx
  on public.bazaar_items (list_id, created_at) where trip_id is null;
create index if not exists bazaar_items_trip_idx on public.bazaar_items (trip_id) where trip_id is not null;
create index if not exists bazaar_items_added_idx on public.bazaar_items (added_by, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. Activity — the household feed
--
-- Written only by the triggers below, never by a client: a feed a member could
-- write to is a feed one member could forge. `detail` carries just enough to
-- render the row without a join, so an item that was deleted afterwards still
-- reads "Marta added Sour cream".
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_activity (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.bazaar_lists(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  -- added | shopping_started | shopping_done | joined
  kind       text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bazaar_activity_list_idx on public.bazaar_activity (list_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 6. Bazaar's own settings
--
-- Not columns on user_settings: that row is Radar's, and the contract lets a
-- sibling write exactly two of its columns (theme, friends_visibility). These
-- are account facts rather than device ones — the language you shop in should
-- hold on the web build too — which is why they live here and not in MMKV.
-- ----------------------------------------------------------------------------
create table if not exists public.bazaar_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  -- en | pl — the interface
  app_lang        text not null default 'en',
  -- en | pl — which name an item is called by; search covers both regardless
  product_lang    text not null default 'en',
  swipe_to_check  boolean not null default true,
  notify_adds     boolean not null default true,
  notify_shopping boolean not null default true,
  -- Catalogue ids the user never needs to buy ("salt", "water"). A recipe marks
  -- these as covered instead of putting them on the list.
  always_home     text[] not null default array['salt','salt-pepper','black-pepper','white-pepper','water'],
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.bazaar_lists        enable row level security;
alter table public.bazaar_list_members enable row level security;
alter table public.bazaar_trips        enable row level security;
alter table public.bazaar_items        enable row level security;
alter table public.bazaar_activity     enable row level security;
alter table public.bazaar_settings     enable row level security;

-- Every policy below asks "am I on this list?". A policy on bazaar_list_members
-- that reads bazaar_list_members recurses forever, and a policy on a child table
-- that selects from the list table pays that table's own policy on every row —
-- so the question is a security definer function that bypasses RLS and answers
-- it once, from the one table that knows.
create or replace function private.bazaar_on_list(p_list uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.bazaar_list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
  );
$$;
revoke all on function private.bazaar_on_list(uuid) from public;
grant execute on function private.bazaar_on_list(uuid) to authenticated;

create or replace function private.bazaar_owns_list(p_list uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.bazaar_lists l
    where l.id = p_list and l.owner_id = auth.uid()
  );
$$;
revoke all on function private.bazaar_owns_list(uuid) from public;
grant execute on function private.bazaar_owns_list(uuid) to authenticated;

-- CREATE POLICY has no `if not exists` and no `or replace`, so each is dropped
-- and re-created. The pair runs inside the SQL Editor single transaction, so
-- there is no window where a table sits unprotected.

-- Lists: members read and edit; only the owner creates (as themselves) and deletes.
drop policy if exists bazaar_lists_read on public.bazaar_lists;
create policy bazaar_lists_read on public.bazaar_lists for select
  to authenticated using (private.bazaar_on_list(id) or owner_id = (select auth.uid()));

drop policy if exists bazaar_lists_insert on public.bazaar_lists;
create policy bazaar_lists_insert on public.bazaar_lists for insert
  to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists bazaar_lists_update on public.bazaar_lists;
create policy bazaar_lists_update on public.bazaar_lists for update
  to authenticated using (private.bazaar_on_list(id))
  with check (private.bazaar_on_list(id));

drop policy if exists bazaar_lists_delete on public.bazaar_lists;
create policy bazaar_lists_delete on public.bazaar_lists for delete
  to authenticated using ((select auth.uid()) = owner_id);

-- Members: you see everyone on a list you are on. The owner adds a *friend* —
-- friendships are Radar's table and two rows per friendship, so one direction is
-- enough to check — and either the owner removes someone or they leave. The
-- owner's own row is written by the trigger and can only go with the list.
drop policy if exists bazaar_members_read on public.bazaar_list_members;
create policy bazaar_members_read on public.bazaar_list_members for select
  to authenticated using (user_id = (select auth.uid()) or private.bazaar_on_list(list_id));

drop policy if exists bazaar_members_insert on public.bazaar_list_members;
create policy bazaar_members_insert on public.bazaar_list_members for insert
  to authenticated with check (
    private.bazaar_owns_list(list_id)
    and added_by = (select auth.uid())
    and exists (
      select 1 from public.friendships f
      where f.user_id = (select auth.uid()) and f.friend_id = bazaar_list_members.user_id
    )
  );

drop policy if exists bazaar_members_delete on public.bazaar_list_members;
create policy bazaar_members_delete on public.bazaar_list_members for delete
  to authenticated using (
    user_id = (select auth.uid()) and not private.bazaar_owns_list(list_id)
  );
-- Leaving is the only delete a client does directly. An owner taking someone
-- *else* off a list is the RPC bazaar_remove_member below: "the owner may delete
-- other people's rows" would be a policy on the very table the owner check is
-- answered from, and the owner must never be able to remove themselves.

-- Items: everything a member does to the list, they do to the items.
drop policy if exists bazaar_items_all on public.bazaar_items;
create policy bazaar_items_all on public.bazaar_items for all
  to authenticated using (private.bazaar_on_list(list_id))
  with check (private.bazaar_on_list(list_id));

-- Trips: members read; only the person in the shop starts or ends one.
drop policy if exists bazaar_trips_read on public.bazaar_trips;
create policy bazaar_trips_read on public.bazaar_trips for select
  to authenticated using (private.bazaar_on_list(list_id));

drop policy if exists bazaar_trips_insert on public.bazaar_trips;
create policy bazaar_trips_insert on public.bazaar_trips for insert
  to authenticated with check (
    shopper_id = (select auth.uid()) and private.bazaar_on_list(list_id)
  );

drop policy if exists bazaar_trips_update on public.bazaar_trips;
create policy bazaar_trips_update on public.bazaar_trips for update
  to authenticated using (shopper_id = (select auth.uid()))
  with check (shopper_id = (select auth.uid()));

-- Activity: read-only to clients.
drop policy if exists bazaar_activity_read on public.bazaar_activity;
create policy bazaar_activity_read on public.bazaar_activity for select
  to authenticated using (private.bazaar_on_list(list_id));

drop policy if exists bazaar_settings_owner_all on public.bazaar_settings;
create policy bazaar_settings_owner_all on public.bazaar_settings for all
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

create or replace function public.bazaar_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bazaar_lists_touch on public.bazaar_lists;
create trigger bazaar_lists_touch before update on public.bazaar_lists
  for each row execute function public.bazaar_touch_updated_at();

drop trigger if exists bazaar_settings_touch on public.bazaar_settings;
create trigger bazaar_settings_touch before update on public.bazaar_settings
  for each row execute function public.bazaar_touch_updated_at();

-- A list's owner is its first member.
create or replace function public.bazaar_lists_add_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.bazaar_list_members (list_id, user_id, added_by)
  values (new.id, new.owner_id, new.owner_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists bazaar_lists_owner on public.bazaar_lists;
create trigger bazaar_lists_owner after insert on public.bazaar_lists
  for each row execute function public.bazaar_lists_add_owner();

-- Who did it is whoever the database says did it. The client never gets to name
-- the person who added or ticked something: a household feed that says "Marta
-- ticked the milk" has to be true.
create or replace function public.bazaar_items_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.added_by := auth.uid();
    if new.checked_at is not null then
      new.checked_by := auth.uid();
    else
      new.checked_by := null;
    end if;
  else
    -- An item belongs to one list for life; moving it is a delete and an add.
    new.list_id  := old.list_id;
    new.added_by := old.added_by;
    if new.checked_at is distinct from old.checked_at then
      new.checked_by := case when new.checked_at is null then null else auth.uid() end;
    else
      new.checked_by := old.checked_by;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists bazaar_items_guard on public.bazaar_items;
create trigger bazaar_items_guard before insert or update on public.bazaar_items
  for each row execute function public.bazaar_items_guard();

create or replace function public.bazaar_items_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.bazaar_activity (list_id, actor_id, kind, detail)
  values (
    new.list_id, new.added_by, 'added',
    jsonb_build_object('item_id', new.id, 'name_en', new.name_en, 'name_pl', new.name_pl,
                       'cat', new.cat, 'qty', new.qty, 'opt', new.opt)
  );
  return new;
end;
$$;

drop trigger if exists bazaar_items_log on public.bazaar_items;
create trigger bazaar_items_log after insert on public.bazaar_items
  for each row execute function public.bazaar_items_log();

create or replace function public.bazaar_trips_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.bazaar_activity (list_id, actor_id, kind, detail)
    values (new.list_id, new.shopper_id, 'shopping_started',
            jsonb_build_object('trip_id', new.id, 'store', new.store));
  elsif new.ended_at is not null and old.ended_at is null then
    insert into public.bazaar_activity (list_id, actor_id, kind, detail)
    values (new.list_id, new.shopper_id, 'shopping_done',
            jsonb_build_object('trip_id', new.id, 'store', new.store,
                               'item_count', new.item_count, 'skipped_count', new.skipped_count));
  end if;
  return new;
end;
$$;

drop trigger if exists bazaar_trips_log on public.bazaar_trips;
create trigger bazaar_trips_log after insert or update on public.bazaar_trips
  for each row execute function public.bazaar_trips_log();

create or replace function public.bazaar_members_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The owner's own row is not news.
  if new.user_id <> new.added_by then
    insert into public.bazaar_activity (list_id, actor_id, kind, detail)
    values (new.list_id, new.added_by, 'joined', jsonb_build_object('user_id', new.user_id));
  end if;
  return new;
end;
$$;

drop trigger if exists bazaar_members_log on public.bazaar_list_members;
create trigger bazaar_members_log after insert on public.bazaar_list_members
  for each row execute function public.bazaar_members_log();

-- ============================================================================
-- Functions the client calls
-- ============================================================================

-- End a trip. Atomic on purpose: the items it carried home and the count that
-- goes on the history row have to agree, and a client doing this as three
-- requests can leave a basket that is half in History and half still on the list.
--   * every ticked live item is hung off the trip, which takes it off the list;
--   * every unticked one stays on the list and is counted as skipped.
create or replace function public.bazaar_finish_trip(p_trip uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list    uuid;
  v_bought  int;
  v_skipped int;
begin
  select t.list_id into v_list
  from public.bazaar_trips t
  where t.id = p_trip and t.shopper_id = auth.uid() and t.ended_at is null;

  if v_list is null then
    raise exception 'That trip is not yours to end, or it has already ended.';
  end if;

  update public.bazaar_items
     set trip_id = p_trip
   where list_id = v_list and trip_id is null and checked_at is not null;
  get diagnostics v_bought = row_count;

  select count(*) into v_skipped
  from public.bazaar_items i
  where i.list_id = v_list and i.trip_id is null;

  update public.bazaar_trips
     set ended_at = now(), item_count = v_bought, skipped_count = v_skipped
   where id = p_trip;
end;
$$;
revoke all on function public.bazaar_finish_trip(uuid) from public;
grant execute on function public.bazaar_finish_trip(uuid) to authenticated;

-- Reuse: copy what a past trip bought onto a list you are on, minus whatever is
-- already waiting there unticked. Returns how many rows it added.
create or replace function public.bazaar_reuse_trip(p_trip uuid, p_list uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source uuid;
  v_added  int;
begin
  select t.list_id into v_source from public.bazaar_trips t where t.id = p_trip;
  if v_source is null or not private.bazaar_on_list(v_source) or not private.bazaar_on_list(p_list) then
    raise exception 'You need to be on both lists to copy between them.';
  end if;

  insert into public.bazaar_items (list_id, added_by, product_id, cat, name_en, name_pl, opt, qty)
  select p_list, auth.uid(), i.product_id, i.cat, i.name_en, i.name_pl, i.opt, i.qty
  from public.bazaar_items i
  where i.trip_id = p_trip
    and not exists (
      select 1 from public.bazaar_items live
      where live.list_id = p_list and live.trip_id is null and live.checked_at is null
        and live.name_en = i.name_en and live.opt = i.opt
    );
  get diagnostics v_added = row_count;
  return v_added;
end;
$$;
revoke all on function public.bazaar_reuse_trip(uuid, uuid) from public;
grant execute on function public.bazaar_reuse_trip(uuid, uuid) to authenticated;

-- The owner takes someone off a list. See the note under bazaar_members_delete.
create or replace function public.bazaar_remove_member(p_list uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.bazaar_owns_list(p_list) then
    raise exception 'Only the owner of a list can take someone off it.';
  end if;
  if p_user = auth.uid() then
    raise exception 'The owner cannot leave their own list; delete it instead.';
  end if;
  delete from public.bazaar_list_members where list_id = p_list and user_id = p_user;
end;
$$;
revoke all on function public.bazaar_remove_member(uuid, uuid) from public;
grant execute on function public.bazaar_remove_member(uuid, uuid) to authenticated;

-- ============================================================================
-- Realtime
--
-- The tabs subscribe to the rows of the lists they are on, so an item added on
-- the web lands on the phone in the shop, and a tick in the shop crosses the
-- item out on the web — which is the whole point of the app.
-- ============================================================================
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['bazaar_lists','bazaar_list_members','bazaar_items','bazaar_trips','bazaar_activity'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- ============================================================================
-- COLUMN MIGRATIONS
--
-- Everything added after the first deploy goes here, newest last. Never edit a
-- create table above — on a live database the create is skipped entirely.
-- ============================================================================
