# Nusuk Survey — Developer Guide

**Audience:** developers joining the AFAQY team to maintain and extend the Nusuk Survey application.
**Status of this guide:** living document, generated and verified alongside the code (V38.32). The Arabic documents in `docs/` (`system.md`, `START-HERE.md`, `decisions.md`, `handover.md`) remain the authoritative project record; this guide is the English on-ramp to the code.

---

## 1. What you are maintaining

Nusuk Survey is an **offline-first Progressive Web App** used by field teams in Mina, Arafat, Muzdalifah and the Jamarat to survey, install and track RFID readers and related devices for Hajj 1448H, and by the office and the Ministry to follow up. It runs on phones in the field with poor or no connectivity, so every design decision serves one rule: **a technician must be able to record work with no network and lose nothing.**

| Fact | Value |
|---|---|
| Runtime | One HTML file (`index.html`, ~3 MB, ~1 MB gzipped) — HTML + CSS + JavaScript, **no framework, no bundler, no transpiler** |
| Source | `src/` — 131 files in 11 domain folders, concatenated by full path into `index.html` (shipped without comments) |
| Backend | Firebase Firestore (data) + Firebase Auth (login) + GitHub Actions (scheduled jobs: backups, photo sync, reports) |
| Hosting | GitHub Pages from branch `main`; staging is branch `staging` |
| Languages | UI in Arabic (default), English and Urdu through one dictionary (`i18n/dict-*.js`) |
| Quality gate | 164 automated audits in the cloud + 13 end-to-end scenarios (85 checks) + a real-browser test; nothing reaches `main` without all of them |

## 2. Why plain JavaScript (and why that will not change)

The code is deliberately framework-free: 40,000 lines that work in the field today, guarded by 164 audits written against this exact structure. A rewrite into a framework would cost months, break the offline single-file model and invalidate the guards. New work therefore follows the existing style: ES5-compatible functions, global state, delegated events, string-built HTML. The structure is modular at the **file and folder** level, not at the module-system level.

## 3. Repository map

```
src/
  00-shell/      page head and all CSS
  01-core/       language, engine, write queue and sync, DB gate, site registry, train E-GATE seed
  02-catalog/    definitions, classification, permissions, site editing, survey edit-without-redo
  03-survey/     survey and installation forms, installation points, assignment, plan (WBS)
  03z-shared/    definitions the core needs before the office/ministry/reports domains (moved verbatim, V38.38 — stage A of core + chunks; put NEW shared helpers in 01-core or 02-catalog, not here)
  04-office/     photos, governance, the assistant and word-driven reports, drawing on the map
  05-map/        map painting, export/import, login, service worker, ministry screen
  06-ministry/   alerts, follow-up tabs, Nusuk card system, PowerPoint, what's new (release notes)
  07-reports/    approvals, inventory and workshop, devices, notifications, roles and permissions
  08-events/     settings, users, all delegated click handlers, boot
  99-shell/      page tail
scripts/         build, audits (audit-*.mjs), unit tests, server jobs, release tooling
i18n/            the translation dictionary (one file, content-hashed name)
docs/            system record (Arabic), decisions, runbooks, this guide, code-map.md (generated)
.github/workflows/   the gate (docs-check.yml), the train (promotion to main), scheduled jobs
firestore.rules  database security rules (frozen by owner decision — do not edit without the owner)
```

`docs/code-map.md` is **generated** (`node scripts/code-map.mjs`) and lists every file with its line count, function count and purpose. Regenerate it after any change; the gate fails if it is stale.

**Every `.js` file begins with an English header** (`FILE / DOMAIN / PURPOSE / DEFINES / GLOBALS`). Read the header before reading the code. The gate fails if a file has no header.

## 4. Runtime model — the six things to know

1. **`STATE`** — one global object holding everything: `STATE.sites` (the registry as site objects), `STATE.recs` (survey visits keyed by site id), `STATE.inss` (installations), `STATE.tasks`, `STATE.queue` (writes waiting for upload), `STATE.meta` (who/where/online), and many more collections mirrored from Firestore.
2. **`CORE`** — the write engine. `CORE.set(collection, id, value)` is the only way to persist anything: it updates `STATE`, queues the write locally (`STATE.queue`), and uploads when online with backoff. Never write to Firestore directly.
3. **`DB`** — the gate to Firestore for reads and raw operations. Any `FB.db.collection(...)` outside the gate is a gate failure (audit-health).
4. **Rendering** — screens are entries in `PAGE` (`PAGE.site`, `PAGE.map`, …) with a `body()` function returning an HTML string. `render(1)` redraws the current screen (`CUR`) and its tab (`PTAB`). Rendering is cheap; redraw rather than mutate the DOM.
5. **Events** — one delegated `click` handler on `document` dispatches by `data-*` attributes (`data-fly`, `data-svqsave`, `data-egsave`, …). Handlers live in `08-events/*clicks*.js` and return `true` when they consume the event. Inputs use `data-form="field"` to bind to `FORM`.
6. **Permissions** — `may('key')` and `rankOf(ROLE)` decide what a role can do; the same matrix is mirrored in `firestore.rules`. The UI never grants what the rules deny.

### Reading a screen in five minutes
1. Find the page: search `PAGE.<name> =` or the tab in `TABS`.
2. Read its `body()` — it is a sequence of `card(...)` calls building HTML.
3. Find the actions: every `data-xyz` attribute in that HTML has a handler — search `[data-xyz]` in `08-events/`.
4. Follow the data: handlers call domain functions (`svSave`, `egSave`, …) which end in `CORE.set`.
5. Check the guard: search the feature name in `scripts/audit-*.mjs` and `scripts/audit-scenarios.mjs` to see what the gate asserts about it.

## 5. Conventions

| Topic | Rule |
|---|---|
| **Comments** | **New and changed code is commented in English.** Existing Arabic block comments are the original decision log (owner decisions by version, e.g. `(V37.59) بلاغُ المالك: …`) — keep them; do not translate or delete them. |
| **Version tags** | Every behavioural change carries its version in the comment: `/* (V38.31) … */`. The version is the project's unit of change. |
| **User-visible text** | Always Arabic source strings wrapped in `t('…')`; add English and Urdu to `i18n/dict-*.js` then run `node scripts/i18n-rehash.mjs`. The gate fails on an untranslated string. |
| **Numbers** | Never hard-code a count in the UI; derive it from data (`audit-zero` scans every screen for numbers with no source). |
| **Globals** | Do not add top-level `var`s; attach state to a function (`egCard.open`) or an existing object. `audit-health` fails on a global count regression. |
| **File size** | No source file above 1,500 lines; split at a section header into a new numbered file in the same folder. |
| **Map vectors** | Any Leaflet vector must use `renderer: MAP_CV` (the shared canvas); a second canvas swallows clicks (`audit-pop-race`). |
| **Database** | Reads and writes go through `DB`/`CORE` only. Rules are frozen; a new collection needs the owner. |
| **Branches** | Push to `staging` only. `main` is written by the train after the gate passes. Never push to `main`. |
| **Secrets** | Nothing secret in the repo or in Actions logs; the repo is public. |

## 6. How to add a field to the survey

1. **Define** the field label in `SV_LABELS` and its position in `SV_ORDER` (`03-survey/…05-forms-approvals.js`, `…06-survey-form.js`). Add it to `SV_EXTRA_KEYS` so it is saved and reset with the form.
2. **Render** it in the survey form (`03-survey/…06-survey-form.js`) with `data-form="yourKey"`.
3. **Edit path**: if it should be editable after the visit, make sure `svqKeys` lists it (`02-catalog/…07-layers-dismantle-svedit.js`) — selects go in `SVQ_OPT`, free text is default.
4. **Validation**: add to the `need` list in `svSave` if required.
5. **Reports**: the exports in `07-reports/` pick up `SV_EXTRA_KEYS` automatically; the word-driven reports parser (`04-office/…10-assistant-reports.js`) needs a rule if users should filter by it.
6. **Translate** new strings; **guard** it with a check in `scripts/audit-scenarios.mjs`; **bump** and release (section 8).

Worked example: `loc` ("point location", V38.23–V38.27) — follow the `(V38.2x)` comments across those files.

## 7. How to add an audit

An audit is a Node script in `scripts/` that loads `index.html` into jsdom and asserts behaviour. Copy the smallest existing one (`scripts/audit-waasn.mjs` is a good template), keep its `T(condition, 'message')` style, and add it to the cloud list in `.github/workflows/docs-check.yml` (step names must not contain a colon — the YAML guard will reject it). Scenario checks (end-to-end flows) go into `scripts/audit-scenarios.mjs` as a new numbered block.

## 8. Release cycle — never skip a step

```
node scripts/build.mjs                      # src/ → index.html
node scripts/bump.mjs V38.xx --date … --note … --row …   # version in the six places + release notes
node scripts/code-map.mjs                   # regenerate the code map
node scripts/fast-run.mjs                   # the fast layer (must be green)
git commit -m "V38.xx — …" && git push origin HEAD:staging
GH_TOKEN=… node scripts/release-now.mjs     # gate → full list (4 shards) → train → deploy → smoke
```

`release-now.mjs` runs the whole promotion in the right order and **stops on any red step**, reading the job annotations (a failed shard can still look green in the UI). Do not trigger the full list manually while the push gate is running — they share a concurrency group and cancel each other (decision Q-020).

If the gate blocks you: read the annotation it prints, fix the **code** when the behaviour is wrong, fix the **audit** only when the behaviour changed on purpose (and say so in the commit message).

## 9. Glossary (Arabic ↔ English as used in code and UI)

| Arabic | English | In code |
|---|---|---|
| نقطة / موقع | point / site | `site`, `STATE.sites`, `siteFind(id)` |
| مشعر | zone (Mina, Arafat, Muzdalifah, Jamarat…) | `zone`, `taxOf(x).g`, `TAX_G` |
| مخيم / ممر / كاميرا / جسر / محطة / بوابة | camp / corridor / camera / Jamarat path / station / gate | `type` |
| مسح / زيارة | survey / visit | `STATE.recs`, `svVisited`, `svDone` |
| تركيب | installation | `STATE.inss`, `insDone` |
| فك | dismantle | `STATE.diss` |
| إسناد | assignment | `STATE.tasks`, `asn*` |
| تحدٍّ / معوق | challenge / obstacle | `chals`, `chalCats`, `chal_note` |
| موقع النقطة | point location (under bridge, tunnel, sign, no frame, canopy) | `loc`, `locOpts`, `locApplies` |
| نوع التركيب | installation type (pole, wall, fence, existing structure) | `mount` |
| اعتماد | approval | `review`, `approve*` |
| الوزارة | the Ministry (of Hajj and Umrah) | `mfu*`, `min*` |
| نُسُك / نظام البطاقات | Nusuk card system (the Ministry's reader platform) | `ext*` in `06-ministry/…nusuk-card-system.js` |
| بانتظار الرفع / الطابور | pending upload / the queue | `STATE.queue`, `CORE.flush` |
| ملف انتظار | pending file (export/import of unsynced work) | `CORE.queueExport/Import` |
| البوابات الإلكترونية | E-GATEs (train station turnstiles) | `eg*`, `egSeed()` |
| صحة النظام | system health | `PAGE.sys` |
| المساعد | the assistant | `aq*`, `assist*` |
| جرد | audit | `scripts/audit-*.mjs` |
| البوابة / القطار | the gate (CI) / the train (promotion) | `docs-check.yml`, `train.yml` |

## 10. Where to look when something is wrong

| Symptom | First place |
|---|---|
| A screen shows a wrong number | `audit-zero`, then the counting function named in the card |
| Data recorded on a phone never arrived | pending window (`queueHtml`), `CORE.flush`, `STATE.poison`, the device row on the speed board |
| Login fails on a new domain | Firebase Auth → Authorized domains (console), then `appUrl()` |
| Map opens but does not fly to the point | `mapFlySoon`, `mapInit` |
| Gate red with no obvious reason | the job annotation; `release-now` prints it; `scripts/cloud-steps.mjs` lists the steps |
| Behaviour differs between languages | `t()` strings and `wKeyNorm` (weights are keyed by raw Arabic names) |

Keep this guide honest: when you change a convention, change this file in the same commit.
