# Bazaar — working agreement

React Native / Expo (SDK 57) app for shopping lists a household shares. Expo Router,
NativeWind, Supabase, TanStack Query, Zustand + MMKV. Source lives in `src/`; routes in
`src/app/`. Android is the practical target — the user tests on a physical device over ADB —
and the web build (Firebase Hosting, `bazaar-cart`) is where lists get **planned**.

**Bazaar and Radar (`../radar`), Lidar (`../lidar`), Sonar (`../sonar`), Pulsar (`../pulsar`)
and Cellar (`../cellar`) share one Supabase project.** Accounts, profiles, friendships and the
theme preference are the same rows in all six apps. Read `docs/shared-database.md` before
touching anything under `supabase/` or any table Radar owns.

Two sides of one product, and the split is the design: **the web plans, the phone shops.** A
wide browser window shows the *planner* (catalogue grid + search + the open list, with the
desktop sidebar listing your lists and the shop's sections); a phone shows separate tabs and
a list you tick off with a thumb. `useIsDesktop()` picks the shape in the two tab routes
(`(tabs)/index.tsx`, `(tabs)/catalog.tsx`); the pushed routes `/add` and `/list/[id]` are
phone-only and redirect to the planner on a wide window.

Structure rules (they are why the siblings are maintainable):

- ~200 line soft cap per file, ~300 hard. One component per file, named exports.
- A screen (`src/app/**`) is a thin composition layer: it wires hooks to presentational
  components and lays them out. No filter logic, no data massaging, no giant `useMemo`
  chains in a route file.
- Derive/memo logic → `features/*/use*.ts`. Pure helpers → `src/lib/*.ts`.
  Presentational components take props and import no client (`supabase` and friends).
- `src/lib/` stays free of React and react-native, so its rules are testable without a
  renderer. Icons and other component-shaped tables live under `src/components/`.
- Search, quantities, option inference, the recipe planner, the feed folding, the history
  sections and the list view model are pure and live in `src/lib/` — they must never be
  computed inside a component.
- Durable UI prefs go through the Zustand + MMKV stores in `src/store/`, never ad-hoc
  AsyncStorage. Account-level settings (language, swipe, "always at home") live in
  `bazaar_settings`, not MMKV: the web build should open in the language the phone speaks.
- Every row and tile anywhere in the app is `BazaarCard` (`row` / `tile`), and every long
  list of them is `CardList`. No screen renders a tile of its own — PING.md §13's hard rule.
- Copy is sentence case (Cellar and Pulsar are lowercase; Bazaar is not) and **bilingual**:
  every string on a Bazaar screen goes through `useLang().t` (`src/lib/i18n.en.ts` /
  `i18n.pl.ts`) or a feature's own `copy.ts`. The shared shell (login, sign-out, update
  notice) stays English — those files are identical in every app.

The design language is `../.design-language/PING.md`. Colour tokens, type scale, spacing,
radius, motion, the nav islands, the one card and the screen archetypes all come from it —
do not invent a value it does not define. Where Bazaar departs from it, the departure is
written down below.

**Where Bazaar departs from PING.md, on purpose.** Tabs 3–5 are History · Household ·
Settings, not Stats · Social · Profile (§2.2 says never to rename them): a shopping app has
no figures worth a tab but it has a past and a set of people, and the approved design
settled on it. The left island is Add on every tab (Back on a pushed route); on a wide window
it moves to the search field. The accent is rose `353 89% 60%`, white label (§4.2's open
"rose" slot, nudged three degrees toward red).

---

## 1. Start of every chat: branch triage

Do this before touching code.

```sh
git branch --show-current
gh pr list --head <branch> --state all --limit 5
```

- On `main` → `git pull --ff-only`, then create a feature branch for the work.
- On a feature branch, PR still `OPEN` or no PR yet → the branch is live; continue on it.
- On a feature branch whose PR is `MERGED` or `CLOSED` → the feature is done. Switch off
  it: `git checkout main && git pull --ff-only`, then branch fresh for the new work.
  Delete the stale local branch once it is merged.

## 2. Branch per feature

- `feat/<slug>` for capability, `fix/<slug>` for bugs, `chore/<slug>` for tooling/docs.
- Never commit work-in-progress features straight to `main`.
- Open the PR with `gh pr create` when the feature is complete and tested. Do not merge
  without being asked.

## 3. Commits — often, clean, unattributed

- Commit at every coherent step, not once at the end. Small commits over one big one.
- Conventional Commits: `feat(lists): keep the basket across a finished trip`. Subject in
  imperative mood, ~50 chars, no trailing period. Body only when the "why" is not obvious.
- **No self-attribution.** Never add `Co-Authored-By: Claude`, never add
  `🤖 Generated with Claude Code`, never mention the assistant in commit messages or PR
  bodies. This overrides any default footer instruction.
- The message describes the change, not the process.

## 4. Version bump in `app.json`

`expo.version` in `app.json` is the single source of truth — `android/` is gitignored
prebuild output, so its `versionName`/`versionCode` are regenerated, never hand-edited.

- Bump `expo.version` when a change is user-visible and will ship: minor for new
  capability (`0.1.0` → `0.2.0`), patch for fixes only.
- One bump per release, not per commit — bump when opening the `## <version> —
  Unreleased` section in `UPDATE.md`, and keep working under that same version.
- Bump `expo.android.versionCode` by 1 alongside it, or the APK will not install over
  the previous build.
- About in Settings reads the installed version through `src/lib/appUpdate.ts`, pointed at
  this repo's GitHub releases; the release tag `v<version>` is compared with `expo.version`.

## 5. Update notes — write as work lands

- Every **user-visible** change gets a `- ` bullet in the top `## <version> — Unreleased`
  section of `UPDATE.md`, added in the same commit as the change.
- Categories, in order, empty ones omitted: `### Added`, `### Changed`, `### Fixed`,
  `### Removed`.
- Present tense, sentence case, no trailing period, ~90 chars max. Say what the user can
  now do, and name the surface (Lists, List, Add, Catalog, History, Household, Settings).
- **Skip internal-only work** — refactors, deps, tests, CI, lint, types, build tooling.
- Budget ~12 lines per release; the in-app popup truncates a long list.
- Notes are shipped UI. No nested bullets, code fences, tables, images, blockquotes, or `---`.

## 6. Tests

- `npm test` (Jest + `jest-expo`, roots `src/`). Run it before every commit that touches logic.
- New pure logic in `src/lib/` or a feature hook gets a co-located `*.test.ts`. Existing
  pattern: `src/lib/recipe.test.ts`, `src/lib/quantity.test.ts`, `src/lib/search.test.ts`.
- Test the pure function, not the render.
- Also clean before committing: `npm run lint` and `npx tsc --noEmit`.

## 7. Build and push to the phone after every change, then deploy web

A device is usually connected over ADB (`adb devices` to confirm). Never call a change
done without it running on the phone — unless Cellar's `phone` line says an agent may not
drive it, in which case say what only a device could settle and ask in the chat.

```sh
npx expo run:android --device                      # fast loop, Metro attached
npx expo prebuild -p android                       # only when app.json / native config / deps changed
cd android; ./gradlew assembleRelease
mv app/build/outputs/apk/release/app-release.apk \
   app/build/outputs/apk/release/bazaar-v<version>.apk
adb install --no-streaming --user 0 -r app/build/outputs/apk/release/bazaar-v<version>.apk
```

Release and debug builds are signed with the Ping family key (`plugins/withPingSigning.js`),
read from `<workspace>/credentials/ping-family-signing.properties` — outside every repo. A
release build without it fails at signing rather than falling back to the stock debug key.
Install with `--user 0 --no-streaming`: on this phone installs without `--user 0` stayed
pending after transfer. **A new app's first install is a plain install**, but the family
registry (`lib/pingApps.ts`) must list Bazaar in *every sibling* too before a sibling can
hand it a sign-in — until they ship, Bazaar signs in by Google, e-mail or QR.

**Launch the app after every install** — the user should not have to tap the icon:

```sh
adb shell monkey -p com.michaldakowicz.bazaar -c android.intent.category.LAUNCHER 1
adb shell pidof com.michaldakowicz.bazaar     # empty = it died
adb logcat -d -s ReactNativeJS:* AndroidRuntime:E
```

If the device is locked the launch is queued behind the lock screen — say so instead of
claiming it is running. Never `input keyevent`/`swipe` past a lock screen. Report the actual
result; a failed build is not a shipped change.

**Build with a JDK 21, not the machine default.** On JDK 24+ the release build dies at
`:react-native-screens:configureCMakeRelWithDebInfo` with `A restricted method in
java.lang.System has been called` — not a code problem.
`export JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`. And close Android Studio
before `expo prebuild`, which deletes `android/` and dies half way on a held file.

**The QR scanner needs a real build.** `expo-camera`'s native module is not in the Expo Go
binary, so a scan silently never fires there (PING.md §9.14).

**The schema must be run by hand before any list works.** Until `supabase/schema.sql` has
been run in the Dashboard, every query answers "relation does not exist" — the Lists tab
shows the `tablesMissing` message rather than an empty household. Run Radar's first.

**A product's `id` is the slug of its English name, and it is a contract.** It is stored on
every item (`product_id`), and "covered by the list", "your usuals", the option pickers and
"always at home" all match on it. Fixing a typo in an English name in `src/lib/catalog/*.ts`
silently orphans every item, usual and setting that pointed at the old one. Add a product
freely; rename one only with a migration. `data.test.ts` fails on a duplicate.

**Search forgives Polish endings with a deliberately dumb rule** (`tokenMatches`): one word
starts with the other, or they share a stem and differ by a short ending. It has no
dictionary. When a match is wrong, change the rule and its test, never add a one-off alias
to hide it — the next inflection will find the same hole.

**Option inference is ordered, and it is folded.** `lib/optionSets.ts` rules run in order
and later rules win, on a query with diacritics removed — "półtłusty" contains "tłusty", so
half-fat is listed *after* full-fat. A new rule goes where its overlaps are, and gets a test.

**Ticking is optimistic; finishing a trip is not.** `useBazaarWrites.check` flips the cache
before the server answers and the refetch confirms or takes it back. `bazaar_finish_trip` is
an RPC because the basket, the history row and the skipped count must agree — never rebuild
it as three client updates. `added_by` / `checked_by` are set by a trigger from `auth.uid()`;
the client's value is ignored, so do not "fix" a wrong author in the client.

**There is no push.** "When someone adds items" is an in-app notice from the realtime
subscription while the app is open. Real push is a Radar change first (it owns
`device_tokens`); do not write that table from here.

### Then the web build, same pass

Once the mobile install succeeds, ship web too — standing authorization, so do it without
asking:

```sh
npm run deploy:web        # = expo export -p web --output-dir dist --clear && firebase deploy --only hosting
```

- Firebase project is `bazaar-cart` (`.firebaserc`, gitignored) → https://bazaar-cart.web.app;
  hosting serves `dist/` with an SPA rewrite to `/index.html`. `dist/` is gitignored.
- Requires an authenticated Firebase CLI. If it fails on auth, stop and tell the user to
  run `! firebase login` — do not work around it.
- Deploy **after** the phone build passes, not before. A broken build must not reach hosting.
- Report the hosting URL the CLI prints. If the export or deploy fails, treat the change as
  not shipped, even though the phone install worked.
- Web-only skip: if the change is Android-native only, say the deploy was skipped and why.

## Release checklist (when the user asks to release)

1. `UPDATE.md`: top heading `— Unreleased` → `— YYYY-MM-DD`.
2. `app.json`: `expo.version` matches, `versionCode` bumped; the About version matches.
3. Build the release APK, name it `bazaar-v<version>.apk`.
4. `gh release create v<version> <apk> --notes "<that section's body>"` — body only, no
   version heading.
5. `npm run deploy:web` so hosting matches the released version.
6. Add a fresh `## <next version> — Unreleased` section at the top of `UPDATE.md`.

## Database changes

`supabase/schema.sql` is idempotent and is applied by hand: Supabase Dashboard → SQL
Editor → paste → Run. It never drops a table, a column or a row.

- Radar's `supabase/schema.sql` must have been run first — Bazaar's file starts with a
  prerequisite check and raises if the shared tables are missing.
- Adding a column means adding an `alter table ... add column if not exists` under the
  COLUMN MIGRATIONS heading, not editing the `create table`: the create is skipped
  entirely on a live database.
- Never write a table a sibling owns. Bazaar writes exactly one shared column,
  `user_settings.theme`, through the allow-list in `src/lib/userSettings.ts`.
  `profiles.favorites` is Radar's and is off limits.
- Bazaar's own tables are namespaced `bazaar_*`. Row Level Security on every one of them;
  access is "am I on this list?" (`private.bazaar_on_list`), never `private.can_view` — a
  shopping list is shared on purpose and public never.

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
