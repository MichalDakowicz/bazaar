# The shared database — Bazaar's half of the contract

Bazaar runs on the **same Supabase project** as Radar, Lidar, Sonar, Pulsar and Cellar. Not a
copy, not a sync — the same rows. One identity, one login, one friend list, one theme
preference, across all six.

Radar owns the shared core. Bazaar is a reader of it, with its own `bazaar_*` tables.

---

## What Bazaar reads

| Table | Columns | Why |
| --- | --- | --- |
| `public.profiles` | `id, username, display_name, pfp, created_at` | the avatar on the right nav island, and every person on a list |
| `public.friendships` | `friend_id` (where `user_id = me`) | who may be added to a list — and the insert policy checks it too |
| `public.user_settings` | `theme` | the theme switch, shared with the siblings on purpose |

`profiles.favorites` is Radar's film shelf and is **off limits** — Bazaar's selects name
their columns rather than taking `*`, so the column never reaches memory and can never be
round-tripped back on an update.

`user_settings.current_streak` / `streak_updated_at` (and the per-app streak columns) are
**Radar's publish channel** and read-only to everyone else. Bazaar neither reads nor writes
them: it has no streak.

## What Bazaar writes to a shared table

Exactly one column:

- `user_settings.theme`

That is enforced in `src/lib/userSettings.ts`, not just documented — the update payload is
built from an allow-list, so a future feature cannot widen it by accident.

Bazaar does **not** write `user_settings.friends_visibility`. It has no public surface at
all (see below), so a privacy switch here would be a control with nothing behind it. It
does not write `friendships` or `friend_requests` either: you make friends in Radar, and
Bazaar only lets you put one onto a list.

## What Bazaar owns

Seven tables, all namespaced, all with RLS:

| Table | Holds |
| --- | --- |
| `bazaar_lists` | one shopping list — a name, a shop, a day (labels, not data) |
| `bazaar_list_members` | who is on a list; the owner is a member too |
| `bazaar_items` | one thing on a list. `trip_id is null` means it is still live |
| `bazaar_trips` | one person in a shop with a list. `ended_at is null` means they are there now |
| `bazaar_activity` | the household feed. Written only by triggers, never by a client |
| `bazaar_settings` | Bazaar-only preferences: the two languages, swipe, notices, "always at home" |
| `bazaar_hidden_usuals` | the usuals the owner never wants offered again — only the refusal is stored, the usual is derived |

## Bazaar is shared, but not public

Every other sibling calls `private.can_view(uuid)` somewhere, because a shelf of films or a
wall of habits is a thing you show people. A shopping list is not. So **no policy in
`supabase/schema.sql` calls `private.can_view`** and `friends_visibility` has no effect on
Bazaar: nobody sees a list unless its owner put them on it.

What gates access instead is a row in `bazaar_list_members`:

- Reading or changing a list, its items, its trips and its feed is one question —
  *am I on this list?* — answered by `private.bazaar_on_list(list_id)`, a security-definer
  function. It exists because a policy on `bazaar_list_members` that reads
  `bazaar_list_members` recurses, and because every child table would otherwise pay the
  list table's own policy on every row.
- Only the **owner** adds someone, and only a **friend** (`public.friendships`, Radar's).
  Friendship is the prerequisite, enforced in the insert policy rather than by a foreign
  key: a foreign key across an ownership boundary is exactly the coupling this document
  warns off.
- Anyone but the owner can leave. The owner cannot leave their own list; they delete it.
  Taking someone *else* off is `bazaar_remove_member(list, user)`, an RPC, because "the
  owner may delete other people's rows" would be a policy on the table the owner check is
  answered from.
- **Who did it is the database's to say.** `bazaar_items_guard` sets `added_by` and
  `checked_by` from `auth.uid()` on every write and ignores what the client sent, and the
  feed is filled by triggers. A household feed that says "Marta ticked the milk" has to be
  true.

## Trips

Starting a trip is an insert (`bazaar_trips`, one open per list — the partial unique index
is the arbiter when two people both press Start). **Ending** one is
`bazaar_finish_trip(trip)`, an RPC, because it is three facts that have to agree: the ticked
items are hung off the trip (which takes them off the live list), the count goes on the
history row, and the unticked ones stay behind and are counted as skipped. As three client
requests that can leave half a basket in History and half still on the list.
`bazaar_reuse_trip(trip, list)` is the same kind of RPC for History's Reuse, and returns the
ids it inserted so Undo can take back exactly those.

## Notifications — what there is and is not

Bazaar has **no push channel**. Radar owns `device_tokens` and the sender, and siblings may
not write that table. So *when someone adds items* and *when someone starts shopping* are
in-app notices while Bazaar is open (`useBazaarLive`), driven by the same realtime
subscription that keeps the lists current; a closed app learns on its next open. Giving it
real push means a Bazaar function in Radar's sender, and is a Radar change first.

## Realtime

The five list tables are added to `supabase_realtime`. RLS decides which events a session
hears, so the client subscribes without filters; an event only says which query is stale.

## Order of operations

Radar's `supabase/schema.sql` must be applied **first**. Bazaar's file starts with a
prerequisite check for `public.profiles`, `public.friendships` and `public.user_settings`
and raises without them, so a wrong order fails immediately instead of half-applying.

Schema changes are applied by hand: Supabase Dashboard → SQL Editor → paste → Run. The file
is idempotent and never drops a table, a column or a row. Adding a column means an
`alter table ... add column if not exists` under **COLUMN MIGRATIONS** at the bottom — never
editing the `create table`, which is skipped entirely on a live database.

## Deleting

- Deleting a **list** cascades to its members, items, trips and feed — for everyone on it.
  The confirm says so. Archiving (`archived_at`) is the strongest thing short of that.
- Deleting a **user** cascades to their lists and memberships; items they added to someone
  else's list stay (`added_by` is set null).
- Deleting a finished **trip** is `bazaar_delete_trips(uuid[])`, never a row delete: the
  items carry `trip_id` with `on delete set null`, so deleting only the trip would put every
  item it bought back on the live list. The function takes the items and the feed lines that
  name either, and skips what the caller may not delete (the shopper or the list's owner may;
  an open trip never). It returns how many it took, so "clear my history" is one call.
- Clearing a list's **feed** is `bazaar_clear_activity(list)`, owner only. Clients still have
  no write access to `bazaar_activity`; the feed is what everyone on the list sees.
- **Delete my Bazaar data** is `bazaar_delete_my_data()`: the lists the caller owns, their
  place on every other list, their hidden usuals and their settings, in one transaction.
  What they put on somebody else's list stays on it, and the account is Radar's.
- A client that has not run the latest `schema.sql` loses only the features that need it:
  hidden usuals is its own table so settings still load, and the three functions above fail
  with a toast instead of taking a screen down.

## Signing in from a sibling

No table and no column, but one dependency on Radar. When another Ping app on the phone
signs Bazaar in (`PING.md` §9.13), the one-time token it hands over is minted by Radar's
`sign-in-handoff` edge function, and when Bazaar is the one giving it calls that same
function. The QR sign-in (§9.14) is Radar's `qr-login` function and `qr-login.sql`.
Sign-out passes its scope explicitly: "Every Ping app" is `signOut({ scope: 'global' })`.
