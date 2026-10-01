# Bazaar

Shopping lists for a household. React Native / Expo app, Android-first, with a web build on
Firebase Hosting (`bazaar-cart`).

One list, two ways to use it: the web is where you plan — search a bilingual catalogue,
paste a recipe, add things at a keyboard — and the phone is where you shop, with the same
list in your hand, ticked off by swipe while someone else watches the progress bar move.

Sibling to [Radar](https://github.com/MichalDakowicz/radar) (films & TV),
[Lidar](https://github.com/MichalDakowicz/lidar) (books),
[Sonar](https://github.com/MichalDakowicz/sonar) (records),
[Pulsar](https://github.com/MichalDakowicz/pulsar) (habits) and
[Cellar](https://github.com/MichalDakowicz/cellar) (thoughts) — all of them share one
Supabase project, so an account, its profile, friends and theme are the same everywhere
(`docs/shared-database.md`).

## What it does

- **Lists** — several, each with a shop and a day. Swipe an item to put it in the basket,
  tap it in the basket to put it back, and every tick has Undo.
- **Add** — search in English or Polish. Flour, eggs, milk and a handful of others ask the
  follow-up a shop would ("which flour?") and answer it themselves when you say
  "mąka do pierogów".
- **Catalog** — about a thousand products in ten shop sections, each named in both
  languages, and your usuals one tap away.
- **Paste a recipe** — the ingredients are matched, compared with what is already on the
  list (covered, needs more, always at home, new) and added in one go.
- **Household** — add a friend to a list and see what they add. When someone starts
  shopping you see it live: their progress, what they just picked up.
- **History** — every finished trip, with Reuse.

## Setup

1. Run Radar's `supabase/schema.sql` first — it owns the shared tables.
2. Run this repo's `supabase/schema.sql` (Dashboard → SQL Editor → paste → Run). It raises
   early if step 1 has not happened.
3. `.env` needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Stack

Expo Router · NativeWind · Supabase · TanStack Query · Zustand + MMKV

## Commands

| Task           | Command                         |
| -------------- | ------------------------------- |
| Dev server     | `npm start`                     |
| Android device | `npx expo run:android --device` |
| Tests          | `npm test`                      |
| Lint           | `npm run lint`                  |
| Types          | `npx tsc --noEmit`              |
| Web build      | `npm run build:web`             |
| Deploy web     | `npm run deploy:web`            |
| App icons      | `npm run icons`                 |
