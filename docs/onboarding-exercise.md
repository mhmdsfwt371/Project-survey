# Onboarding exercise — your first change in Nusuk Survey

> For a developer joining the team. Budget: half a day. Read `docs/dev-guide.md` first (30 minutes), then do this end to end.
> The goal is not the feature — it is to go through the whole cycle once: source → build → gate → release, without touching `index.html` by hand.

## The task

Add a read-only line to the site details page: **"Last survey by: <name> on <date>"**, shown only when the site has at least one survey.

## Steps and acceptance criteria

| # | Step | How you know it is done |
|---|------|-------------------------|
| 1 | Clone, install, build, run the fast layer | `node scripts/build.mjs --check` prints ✓ · `node scripts/fast-run.mjs` ends green |
| 2 | Find where the site page is drawn | `docs/code-map.md` → `02-catalog/02-catalog-forms-03-site-details-points.js` (`PAGE.site.body`) |
| 3 | Find where the last survey of a site is already computed | search `src/` for `lastSv(` or `svOf(` — reuse it, do not re-implement |
| 4 | Add the line in the right place with `t('…')` around the label and `esc()` around data | the Arabic label appears in `i18n/dict-*.js` for English and Urdu (`node scripts/check-version.mjs` tells you what is untranslated) |
| 5 | Add one assertion in `scripts/audit-scenarios.mjs` (scenario 2 or 4) proving the line shows after a survey and not before | `node scripts/audit-scenarios.mjs` passes with one more check |
| 6 | Bump: `node scripts/bump.mjs V<next> --date <today> --note "…" --api "…" --row "…"` | six places updated, release notes written |
| 7 | `node scripts/build.mjs && node scripts/code-map.mjs && node scripts/fast-run.mjs` | green |
| 8 | Commit, push to `staging`, run `GH_TOKEN=… node scripts/release-now.mjs` | it waits for the gate, runs the four shards, merges to `main`, checks the live site |

## What a reviewer looks for

- No edit to `index.html` or `app-office.js` by hand (the build check would catch it anyway).
- The new string went through `t()` and the dictionary — no hard-coded English.
- The assertion fails if the line is removed (try it: delete the line, run the audit, watch it fail, put it back).
- The English header of the file you touched still describes it (`DEFINES` lists any new top-level function).
- Nothing was added to `src/03z-shared/` — shared helpers go to `01-core` or `02-catalog`.
- The bump row says *why* in one paragraph a future developer can understand without the chat.

## If something goes wrong

- The gate fails on a check you did not touch → read the annotation in the GitHub run; `scripts/audit-<name>.mjs` runs locally in seconds.
- `fast-run` is red on "no regression in health" → you added a global; make it a function property (`fn.state = …`) or move it inside a function.
- You cannot find a function → `grep -rn "function name(" src/` then `docs/code-map.md`; if it is in `app-office.js` territory (`04/06/07`) and the core needs it, run `node scripts/split-shared.mjs --dry` and read what it says before moving anything.
