# خريطةُ الكود — تُولَّد آليًّا (node scripts/code-map.mjs)

المصدرُ في `src/` مجلّداتٌ بالمجال، تُجمَّع بترتيب المسار الكامل إلى `index.html` (ملفٌّ واحدٌ عند النشر ليعمل بلا شبكة). سقفُ الملف **1500 سطر** — البوابةُ تقع فوقه.

## `00-shell/` — الهيكل — رأسُ الصفحة والأنماط  (1 ملفات · 1318 سطر · 0 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `00-head.html` | 1318 | 0 |  |

## `01-core/` — النواة — اللغة والمحرك والمزامنة والسجل  (8 ملفات · 2793 سطر · 132 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `01-core-registry-01-boot-i18n.js` | 325 | 38 | Boot guard (crash-loop breaker), language engine (Arabic/English/Urdu), number and date formatting per language, barcode scan of serials, screen wake-lock durin |
| `01-core-registry-02-data-display-search.js` | 222 | 23 | Project constants, display helpers (HTML escaping, pills, cards, tables), isolation of Latin tokens inside Arabic text, and the per-page search box. |
| `01-core-registry-03-config-values.js` | 189 | 18 | Single source of configurable values (CFG): rates, weights keyed by zone and type, numeric constants edited from Settings and synced to every device. |
| `01-core-registry-04-engine-storage.js` | 223 | 14 | Local-first storage engine: IndexedDB/localStorage persistence, resilience when the local store fails, and the save banner when data is at risk. |
| `01-core-registry-05-sync-scale.js` | 1105 | 1 | CORE: the write queue, deduplication, upload with backoff and poison isolation, pending-upload limit and pending-file export/import, pull scheduling and scale-o |
| `01-core-registry-06-data-gate-live.js` | 412 | 13 | DB gate (the only path to Firestore), silent-failure capture, live listeners that mirror other devices' writes, sync counters and pull accounting. |
| `01-core-registry-07-blackbox-registry.js` | 239 | 17 | Black box (crash forensics) and the embedded site registry SITES_RAW with its publish/cache cycle to the database. |
| `01-core-registry-08-egates-seed.js` | 78 | 8 | Al Mashaaer train: the nine stations and their 62 E-GATE points (registry points at the station reference, owner decision Q-023), the station card listing its g |

## `02-catalog/` — الكتالوج والنقطة — التعريفات والتصنيف والصلاحيات وتعديل المسح  (9 ملفات · 4045 سطر · 228 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `02-catalog-forms-01-site-edit-twins.js` | 397 | 32 | Site rows from the registry (siteRow/loadSites), zone-of-type rules, editing site data without a visit (override layer), bulk data corrections, twin points on o |
| `02-catalog-forms-02-types-shapes-filters.js` | 554 | 37 | Point classification and map shapes per type, owner taxonomy (five zones, nine types), path filters, ministry camera details, tafweej layer, camp path and the f |
| `02-catalog-forms-03-site-details-points.js` | 365 | 11 | Full site details page (PAGE.site) and technician points computed from work. |
| `02-catalog-forms-04-mywork-diary.js` | 536 | 10 | 'My work' screens, project diary, weight/target simulator and how dues are computed. |
| `02-catalog-forms-05-management-performance.js` | 522 | 15 | Management records, methodology matching and the single performance page with five levels. |
| `02-catalog-forms-06-teams-accounts-perms.js` | 551 | 12 | Teams and shares, crews and rates, the permissions module (UI + Firebase rules mirror) and role/team assignment to users. |
| `02-catalog-forms-07-layers-dismantle-svedit.js` | 367 | 19 | Three map layers (what each shows and assigns), dismantle and maintenance forms, the brief line on visit documents, and editing a survey without redoing it (svq |
| `02-definitions-08-definitions.js` | 523 | 77 | Canonical definitions used everywhere: visit/survey/installation states, challenge categories (chalCats), location choices (locOpts/locApplies), helper predicat |
| `02-edit-09-edit-requests.js` | 230 | 15 | Data-correction requests from the field (fixreqs) and their review. |

## `03-survey/` — المسح والتركيب — النماذج والنقاط والإسناد والخطة  (11 ملفات · 5188 سطر · 250 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `03-survey-records-01-labels-colors.js` | 260 | 15 | Human-readable labels for recorded data, texts written about a point, layer colour by approval stage, field names and company names per UI language. |
| `03-survey-records-02-install-points.js` | 948 | 11 | Installation points for a given type read from one place (what gets installed where). |
| `03-survey-records-03-assign-solutions.js` | 461 | 20 | Assignment from list or map, request codes, and the proposed device solution for a point before an installation request. |
| `03-survey-records-04-readiness-conditions.js` | 407 | 10 | What is ready per request type and the condition chain explaining why a point cannot be assigned. |
| `03-survey-records-05-forms-approvals.js` | 234 | 17 | Field forms that write to the engine, the two approvals, missing survey fields, required-field marking and save blocking. |
| `03-survey-records-06-survey-form.js` | 460 | 19 | The survey form: basic fields first and details on demand, prefix generation, automatic photo checks, and the draft that survives iOS closing the page. |
| `03-survey-records-07-demo-single-errors.js` | 295 | 21 | Demo-point kits, single-point form, production error capture, events carrying their point and actor. |
| `03-survey-records-08-parts-history-onboarding.js` | 420 | 23 | Parts picker, three items missing from the worker, the point's full history, and the first-run tour. |
| `03-survey-records-09-team-bugs-companies.js` | 506 | 33 | Team numbers in one pass, bug report and bug screen, accepted-only work rule, daily WhatsApp briefing, company phone book and company rename. |
| `03-survey-records-10-wbs-plan-trials.js` | 680 | 44 | Work breakdown structure, plan versus actual, plan export with formulas, item file and the trials page. |
| `03-survey-records-11-weekly-tasks-paths.js` | 517 | 37 | Weekly tasks as sentence cards, meeting mode, the one filter for screen and paper, and path filtering with each path's status. |

## `03z-shared/` — المشتركُ — تعريفاتٌ تحتاجها النواةُ قبل مجالات المكتب والوزارة والتقارير (نُقلت حرفيًّا، لا كودَ جديدًا هنا)  (63 ملفات · 9713 سطر · 530 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `03z-shared-01-from-tasks-office-01-task-panel-map3d.js` | 81 | 5 | Definitions moved verbatim from src/04-office/04-tasks-office-01-task-panel-map3d.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these n |
| `03z-shared-02-from-tasks-office-02-newsite-schedule.js` | 96 | 6 | Definitions moved verbatim from src/04-office/04-tasks-office-02-newsite-schedule.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these n |
| `03z-shared-03-from-tasks-office-03-photos-drive.js` | 347 | 16 | Definitions moved verbatim from src/04-office/04-tasks-office-03-photos-drive.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names |
| `03z-shared-04-from-tasks-office-04-pmi-weekplan.js` | 73 | 6 | Definitions moved verbatim from src/04-office/04-tasks-office-04-pmi-weekplan.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names |
| `03z-shared-05-from-tasks-office-05-account-backup-continuity.js` | 131 | 8 | Definitions moved verbatim from src/04-office/04-tasks-office-05-account-backup-continuity.js (V38.38, stage A of core + chunks): the core (01–05, 08) reference |
| `03z-shared-06-from-tasks-office-06-risks-changes-coverage.js` | 83 | 4 | Definitions moved verbatim from src/04-office/04-tasks-office-06-risks-changes-coverage.js (V38.38, stage A of core + chunks): the core (01–05, 08) references t |
| `03z-shared-07-from-tasks-office-07-incidents-milestones.js` | 140 | 7 | Definitions moved verbatim from src/04-office/04-tasks-office-07-incidents-milestones.js (V38.38, stage A of core + chunks): the core (01–05, 08) references the |
| `03z-shared-08-from-tasks-office-08-reports-center-sop-help.js` | 200 | 0 | Definitions moved verbatim from src/04-office/04-tasks-office-08-reports-center-sop-help.js (V38.38, stage A of core + chunks): the core (01–05, 08) references  |
| `03z-shared-09-from-tasks-office-09-assistant.js` | 163 | 9 | Definitions moved verbatim from src/04-office/04-tasks-office-09-assistant.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, s |
| `03z-shared-10-from-tasks-office-10-assistant-reports.js` | 179 | 7 | Definitions moved verbatim from src/04-office/04-tasks-office-10-assistant-reports.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these  |
| `03z-shared-11-from-tasks-office-11-site-popup.js` | 366 | 5 | Definitions moved verbatim from src/04-office/04-tasks-office-11-site-popup.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names,  |
| `03z-shared-12-from-tasks-office-12-draw-paths-areas.js` | 307 | 28 | Definitions moved verbatim from src/04-office/04-tasks-office-12-draw-paths-areas.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these n |
| `03z-shared-13-from-tasks-office-13-perf-distribution-cameras.js` | 256 | 14 | Definitions moved verbatim from src/04-office/04-tasks-office-13-perf-distribution-cameras.js (V38.38, stage A of core + chunks): the core (01–05, 08) reference |
| `03z-shared-14-from-tasks-office-14-pull-scope-listen-map.js` | 306 | 16 | Definitions moved verbatim from src/04-office/04-tasks-office-14-pull-scope-listen-map.js (V38.38, stage A of core + chunks): the core (01–05, 08) references th |
| `03z-shared-15-from-tasks-office-15-handover-minutes.js` | 184 | 8 | Definitions moved verbatim from src/04-office/04-tasks-office-15-handover-minutes.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these n |
| `03z-shared-16-from-exec-report-01-exec-report.js` | 116 | 13 | Definitions moved verbatim from src/06-ministry/06-exec-report-01-exec-report.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names |
| `03z-shared-17-from-ext-camps-03-nusuk-card-system.js` | 515 | 35 | Definitions moved verbatim from src/06-ministry/06-ext-camps-03-nusuk-card-system.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these n |
| `03z-shared-18-from-mfu-tabs-04-followup-tabs.js` | 118 | 17 | Definitions moved verbatim from src/06-ministry/06-mfu-tabs-04-followup-tabs.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, |
| `03z-shared-19-from-ministry-alerts-05-alerts-dashboard.js` | 277 | 29 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-05-alerts-dashboard.js (V38.38, stage A of core + chunks): the core (01–05, 08) references th |
| `03z-shared-20-from-ministry-alerts-06-followup-sources-daily.js` | 155 | 16 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-06-followup-sources-daily.js (V38.38, stage A of core + chunks): the core (01–05, 08) referen |
| `03z-shared-21-from-ministry-alerts-07-weekly-export-scope.js` | 86 | 5 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-07-weekly-export-scope.js (V38.38, stage A of core + chunks): the core (01–05, 08) references |
| `03z-shared-22-from-ministry-alerts-09-pilot-workflow-readiness.js` | 18 | 1 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-09-pilot-workflow-readiness.js (V38.38, stage A of core + chunks): the core (01–05, 08) refer |
| `03z-shared-23-from-ministry-alerts-10-season-start-invites.js` | 327 | 14 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-10-season-start-invites.js (V38.38, stage A of core + chunks): the core (01–05, 08) reference |
| `03z-shared-24-from-ministry-alerts-11-whats-new.js` | 9 | 1 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-11-whats-new.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these nam |
| `03z-shared-25-from-ministry-alerts-12-attendance-route-field-assistant.js` | 225 | 17 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-12-attendance-route-field-assistant.js (V38.38, stage A of core + chunks): the core (01–05, 0 |
| `03z-shared-26-from-props-13-props.js` | 60 | 10 | Definitions moved verbatim from src/06-ministry/06-props-13-props.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they mu |
| `03z-shared-27-from-approvals-reports-01-approvals-review.js` | 27 | 0 | Definitions moved verbatim from src/07-reports/07-approvals-reports-01-approvals-review.js (V38.38, stage A of core + chunks): the core (01–05, 08) references t |
| `03z-shared-28-from-approvals-reports-02-inventory-workshop.js` | 134 | 11 | Definitions moved verbatim from src/07-reports/07-approvals-reports-02-inventory-workshop.js (V38.38, stage A of core + chunks): the core (01–05, 08) references |
| `03z-shared-29-from-approvals-reports-03-trials-invoices.js` | 141 | 24 | Definitions moved verbatim from src/07-reports/07-approvals-reports-03-trials-invoices.js (V38.38, stage A of core + chunks): the core (01–05, 08) references th |
| `03z-shared-30-from-approvals-reports-04-devices-reset-pulse.js` | 119 | 6 | Definitions moved verbatim from src/07-reports/07-approvals-reports-04-devices-reset-pulse.js (V38.38, stage A of core + chunks): the core (01–05, 08) reference |
| `03z-shared-31-from-approvals-reports-06-people-functions.js` | 209 | 17 | Definitions moved verbatim from src/07-reports/07-approvals-reports-06-people-functions.js (V38.38, stage A of core + chunks): the core (01–05, 08) references t |
| `03z-shared-32-from-approvals-reports-07-network-notifications.js` | 418 | 27 | Definitions moved verbatim from src/07-reports/07-approvals-reports-07-network-notifications.js (V38.38, stage A of core + chunks): the core (01–05, 08) referen |
| `03z-shared-33-from-approvals-reports-08-shipments-vehicles.js` | 130 | 15 | Definitions moved verbatim from src/07-reports/07-approvals-reports-08-shipments-vehicles.js (V38.38, stage A of core + chunks): the core (01–05, 08) references |
| `03z-shared-34-from-approvals-reports-09-followup-export-events.js` | 124 | 7 | Definitions moved verbatim from src/07-reports/07-approvals-reports-09-followup-export-events.js (V38.38, stage A of core + chunks): the core (01–05, 08) refere |
| `03z-shared-35-from-approvals-reports-10-point-actions-export-pdf.js` | 151 | 8 | Definitions moved verbatim from src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js (V38.38, stage A of core + chunks): the core (01–05, 08) refe |
| `03z-shared-36-from-approvals-reports-11-import-roles-perms.js` | 622 | 24 | Definitions moved verbatim from src/07-reports/07-approvals-reports-11-import-roles-perms.js (V38.38, stage A of core + chunks): the core (01–05, 08) references |
| `03z-shared-b-01-from-tasks-office-01-task-panel-map3d.js` | 60 | 4 | Definitions moved verbatim from src/04-office/04-tasks-office-01-task-panel-map3d.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) ref |
| `03z-shared-b-02-from-tasks-office-02-newsite-schedule.js` | 11 | 0 | Definitions moved verbatim from src/04-office/04-tasks-office-02-newsite-schedule.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) ref |
| `03z-shared-b-03-from-tasks-office-03-photos-drive.js` | 56 | 3 | Definitions moved verbatim from src/04-office/04-tasks-office-03-photos-drive.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) referen |
| `03z-shared-b-04-from-tasks-office-04-pmi-weekplan.js` | 9 | 1 | Definitions moved verbatim from src/04-office/04-tasks-office-04-pmi-weekplan.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) referen |
| `03z-shared-b-05-from-tasks-office-05-account-backup-continuity.js` | 9 | 1 | Definitions moved verbatim from src/04-office/04-tasks-office-05-account-backup-continuity.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05 |
| `03z-shared-b-06-from-tasks-office-06-risks-changes-coverage.js` | 177 | 8 | Definitions moved verbatim from src/04-office/04-tasks-office-06-risks-changes-coverage.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 0 |
| `03z-shared-b-07-from-tasks-office-07-incidents-milestones.js` | 118 | 10 | Definitions moved verbatim from src/04-office/04-tasks-office-07-incidents-milestones.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) |
| `03z-shared-b-08-from-tasks-office-08-reports-center-sop-help.js` | 165 | 1 | Definitions moved verbatim from src/04-office/04-tasks-office-08-reports-center-sop-help.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05,  |
| `03z-shared-b-09-from-tasks-office-09-assistant.js` | 332 | 12 | Definitions moved verbatim from src/04-office/04-tasks-office-09-assistant.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references |
| `03z-shared-b-10-from-tasks-office-10-assistant-reports.js` | 144 | 5 | Definitions moved verbatim from src/04-office/04-tasks-office-10-assistant-reports.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) re |
| `03z-shared-b-11-from-tasks-office-12-draw-paths-areas.js` | 30 | 3 | Definitions moved verbatim from src/04-office/04-tasks-office-12-draw-paths-areas.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) ref |
| `03z-shared-b-12-from-tasks-office-13-perf-distribution-cameras.js` | 27 | 1 | Definitions moved verbatim from src/04-office/04-tasks-office-13-perf-distribution-cameras.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05 |
| `03z-shared-b-13-from-tasks-office-15-handover-minutes.js` | 46 | 3 | Definitions moved verbatim from src/04-office/04-tasks-office-15-handover-minutes.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) ref |
| `03z-shared-b-14-from-exec-report-01-exec-report.js` | 22 | 2 | Definitions moved verbatim from src/06-ministry/06-exec-report-01-exec-report.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) referen |
| `03z-shared-b-15-from-ext-camps-03-nusuk-card-system.js` | 236 | 9 | Definitions moved verbatim from src/06-ministry/06-ext-camps-03-nusuk-card-system.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) ref |
| `03z-shared-b-16-from-ministry-alerts-06-followup-sources-daily.js` | 21 | 1 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-06-followup-sources-daily.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01– |
| `03z-shared-b-17-from-ministry-alerts-10-season-start-invites.js` | 72 | 3 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-10-season-start-invites.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05 |
| `03z-shared-b-18-from-ministry-alerts-11-whats-new.js` | 943 | 4 | Definitions moved verbatim from src/06-ministry/06-ministry-alerts-11-whats-new.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) refer |
| `03z-shared-b-19-from-approvals-reports-02-inventory-workshop.js` | 14 | 1 | Definitions moved verbatim from src/07-reports/07-approvals-reports-02-inventory-workshop.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, |
| `03z-shared-b-20-from-approvals-reports-03-trials-invoices.js` | 50 | 6 | Definitions moved verbatim from src/07-reports/07-approvals-reports-03-trials-invoices.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08 |
| `03z-shared-b-21-from-approvals-reports-04-devices-reset-pulse.js` | 21 | 1 | Definitions moved verbatim from src/07-reports/07-approvals-reports-04-devices-reset-pulse.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05 |
| `03z-shared-b-22-from-approvals-reports-06-people-functions.js` | 37 | 3 | Definitions moved verbatim from src/07-reports/07-approvals-reports-06-people-functions.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 0 |
| `03z-shared-b-23-from-approvals-reports-07-network-notifications.js` | 107 | 8 | Definitions moved verbatim from src/07-reports/07-approvals-reports-07-network-notifications.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01– |
| `03z-shared-b-24-from-approvals-reports-08-shipments-vehicles.js` | 23 | 2 | Definitions moved verbatim from src/07-reports/07-approvals-reports-08-shipments-vehicles.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, |
| `03z-shared-b-25-from-approvals-reports-09-followup-export-events.js` | 9 | 0 | Definitions moved verbatim from src/07-reports/07-approvals-reports-09-followup-export-events.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01 |
| `03z-shared-b-26-from-approvals-reports-10-point-actions-export-pdf.js` | 52 | 2 | Definitions moved verbatim from src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js (V38.38–V38.39, stage A of core + chunks, pass b): the core ( |
| `03z-shared-b-27-from-approvals-reports-11-import-roles-perms.js` | 29 | 0 | Definitions moved verbatim from src/07-reports/07-approvals-reports-11-import-roles-perms.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, |

## `04-office/` — المكتب — الصور والحوكمة والمساعد والتقارير بالكلام والرسم على الخريطة  (15 ملفات · 2251 سطر · 67 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `04-tasks-office-01-task-panel-map3d.js` | 341 | 15 | Task panel, challenge-point window, field/office work on a challenge, and the 3D map toggle. |
| `04-tasks-office-02-newsite-schedule.js` | 184 | 6 | Unregistered site added from the field, who decides what it becomes, visit recorded on add, and scheduling visits for office-added points. |
| `04-tasks-office-03-photos-drive.js` | 64 | 4 | Photos: Google Drive bridge, naming, upload to the database then server move to Drive, who uploaded/viewed/deleted, open/download in app, and plain-language tra |
| `04-tasks-office-04-pmi-weekplan.js` | 485 | 8 | Project governance per PMI and the engineer's week plan. |
| `04-tasks-office-05-account-backup-continuity.js` | 141 | 4 | Account document, identity from auth, pending-activation state, cause fixes that release blocked work, backup/Drive status, and the 'what depends on a person' c |
| `04-tasks-office-06-risks-changes-coverage.js` | 310 | 0 | Live risk register, approved changes applied to the baseline, and coverage from company departments to client management. |
| `04-tasks-office-07-incidents-milestones.js` | 139 | 0 | Incidents (correct/delete) and milestones managed, not just read. |
| `04-tasks-office-08-reports-center-sop-help.js` | 138 | 3 | Reports centre, the operations guide (every cycle step by step) and 'what is this page' help. |
| `04-tasks-office-09-assistant.js` | 22 | 2 | The assistant: local search with no API, glossary, pending-upload window, diagnostics, usage learning, and the data assistant answering with numbers from the de |
| `04-tasks-office-10-assistant-reports.js` | 56 | 3 | Reports by words ('Excel/PDF for the points that…'): parser, data, grouping, card, export; plus the pending-upload window HTML. |
| `04-tasks-office-11-site-popup.js` | 11 | 0 | The point popup on the map — every button acts. |
| `04-tasks-office-12-draw-paths-areas.js` | 226 | 16 | Drawing on the map: paths that generate points, tafweej routes, drag before save, areas filled with grids, camp boundaries, office-placed points, and a visible  |
| `04-tasks-office-13-perf-distribution-cameras.js` | 50 | 3 | Performance for 150 concurrent users, distribution by zone and type, survey progress per zone, ministry cameras (Bullet/PTZ/LPR) and hierarchy views. |
| `04-tasks-office-14-pull-scope-listen-map.js` | 26 | 0 | Pull scope per role, differential pulls, per-device read caps, change-pulse listening, and the Leaflet map with two layers and camp polygons. |
| `04-tasks-office-15-handover-minutes.js` | 58 | 3 | Handover and official receipt minutes. |

## `05-map/` — الخريطة ودورةُ الحياة — الطبقات والتصدير والاستيراد والدخول وشاشةُ الوزارة  (13 ملفات · 5392 سطر · 288 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `05-lifecycle-map-01-lifecycle-task-index.js` | 272 | 13 | Point lifecycle (one state read by all), task index by point and type, and stacked points on one coordinate. |
| `05-lifecycle-map-02-map-incremental.js` | 340 | 13 | Incremental map painting (never rebuilt from scratch), marker cache MK, faster first paint, flying to a point, locate, theme and satellite toggles. |
| `05-lifecycle-map-03-export-import-docx.js` | 724 | 5 | Export/import with real data, ExcelJS for self-updating files, and Word export that stays inside the app. |
| `05-lifecycle-map-04-excel-templates-kmz.js` | 539 | 22 | Current page to Excel, the tasks file from a template, and KMZ/KML import. |
| `05-lifecycle-map-05-geojson-basemap-layers.js` | 162 | 12 | GeoJSON export, offline Makkah basemap, device map for outages, ministry buildings and tafweej places layers, Mina sensor planning and camp-boundary editing. |
| `05-lifecycle-map-06-sensors-gateways-split.js` | 347 | 43 | Sensors and gateways as first-class points, and splitting a camp. |
| `05-lifecycle-map-07-report-lines-hybrid-google.js` | 391 | 27 | Report lines (Abar Mid), hybrid map with street names over satellite, and Google Maps inside our map. |
| `05-lifecycle-map-08-cameras-report-sw-update.js` | 371 | 20 | Ministry camera report, service worker registration, auto-update, version announcement, the epoch (no uploads from a pre-epoch device) and 'sync everyone now'. |
| `05-lifecycle-map-09-role-switch-login-install.js` | 562 | 22 | Role switching, logout, add-to-home-screen prompts (incl. iPhone) and the login page. |
| `05-lifecycle-map-10-field-companies.js` | 382 | 17 | Field map-first home, composite-name parsing, companies board and company camps classified. |
| `05-lifecycle-map-11-drawing-board-modules.js` | 447 | 23 | Drawing board and its modules: survey details, single challenge key, rooms with sensors. |
| `05-lifecycle-map-12-ministry-screen-progress.js` | 384 | 22 | Ministry hall screen, completion forecast, progress map, far points, satellite in the ministry screen, week sentence and the hall view. |
| `05-lifecycle-map-13-ministry-followup.js` | 471 | 49 | Ministry follow-up page: dynamic follow-up, season brief header, 'whose turn' groups, two modes, and the no-challenge camps card. |

## `06-ministry/` — متابعةُ الوزارة — التنبيهات والتقارير ونظامُ البطاقات وما الجديد  (13 ملفات · 3149 سطر · 149 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `06-exec-report-01-exec-report.js` | 118 | 7 | Executive report builder. |
| `06-exec-template-02-exec-template.js` | 13 | 0 | Executive report template. |
| `06-ext-camps-03-nusuk-card-system.js` | 581 | 35 | Nusuk card system bridge: bulk linking, signal status, overview sheet, point status card, setup bar. |
| `06-mfu-tabs-04-followup-tabs.js` | 208 | 22 | Ministry follow-up tabs: installation status, challenges (who handles, which challenge, by location per zone), daily summary. |
| `06-ministry-alerts-05-alerts-dashboard.js` | 178 | 11 | Alert rules configured from Settings, card popups from the ministry page, and the readable dashboard. |
| `06-ministry-alerts-06-followup-sources-daily.js` | 195 | 16 | Challenges from three sources, everything linked and heard in the report, weekly tasks in follow-up, follow-up maturity and the daily work summary. |
| `06-ministry-alerts-07-weekly-export-scope.js` | 211 | 15 | Weekly update export, scope selection of points for the file, and the pre-download file check. |
| `06-ministry-alerts-08-pptx-template.js` | 966 | 16 | PowerPoint built from the original ministry template. |
| `06-ministry-alerts-09-pilot-workflow-readiness.js` | 285 | 6 | Pilot installation timings, the workflow map, today's decisions box and season readiness. |
| `06-ministry-alerts-10-season-start-invites.js` | 176 | 8 | Season start values, invitations (single and bulk), creation requests, run-server-now, requests when the screen lies, and first-login password change. |
| `06-ministry-alerts-11-whats-new.js` | 73 | 3 | 'What's new' — the version log shown once per update (also the release notes source for bump.mjs). |
| `06-ministry-alerts-12-attendance-route-field-assistant.js` | 113 | 7 | Attendance (start/end my day), today's route, field assistant suggestions and WhatsApp to the technician on assignment. |
| `06-props-13-props.js` | 32 | 3 | Ministry props helpers. |

## `07-reports/` — الاعتمادُ والتقارير — المخزن والورشة والأجهزة والإشعارات والأدوار  (11 ملفات · 3275 سطر · 105 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `07-approvals-reports-01-approvals-review.js` | 192 | 11 | Visit approvals by the engineer, challenge/notification search, review of unreachable and stalled points. |
| `07-approvals-reports-02-inventory-workshop.js` | 254 | 13 | Inventory, purchases and catalogue from movements, workshop requests (CR/AR/IR), request log and the single item key. |
| `07-approvals-reports-03-trials-invoices.js` | 500 | 15 | Trials with cost and hours, trial kits from the catalogue, trial points on camps, and invoice photos. |
| `07-approvals-reports-04-devices-reset-pulse.js` | 178 | 10 | Live crew list, device versions, season reset, pulse and in-app report, page usage card, cost guard, field performance card and devices needing action. |
| `07-approvals-reports-05-speed-board.js` | 577 | 5 | Speed board per device and per page (presence heartbeat: version, pending queue, photos). |
| `07-approvals-reports-06-people-functions.js` | 202 | 15 | People and functions: who gets field work, unified department page, functions from which roles derive. |
| `07-approvals-reports-07-network-notifications.js` | 72 | 5 | Network addresses, notifications (four channels, one message), generated where read, collision detection, bell window and per-device controls. |
| `07-approvals-reports-08-shipments-vehicles.js` | 641 | 13 | Shipments tracked, vehicles as moving custody with their own log. |
| `07-approvals-reports-09-followup-export-events.js` | 268 | 8 | Follow-up file export from its template, events log, classification by action, and the audit trail read from the database in batches. |
| `07-approvals-reports-10-point-actions-export-pdf.js` | 69 | 0 | Point window actions, click identity, export centre by section, export by role, PDF cover page. |
| `07-approvals-reports-11-import-roles-perms.js` | 322 | 10 | Import via downloaded template, roles (who sees and does what), the owner is never locked out, database permissions matrix, custom roles, ranks, org tree and me |

## `08-events/` — البياناتُ والأحداث — الإعدادات والمستخدمون والنقرات والإقلاع  (13 ملفات · 5665 سطر · 156 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `08-data-events-boot-01-data-sources-role-guide.js` | 201 | 11 | Where data comes from and where it is read, page usage, and the role guide generated from permissions. |
| `08-data-events-boot-02-approvals-governance.js` | 375 | 21 | Approvals from proposal to decision, ministry financial summary, governance gaps, escalation, responsibility matrix and stage chain. |
| `08-data-events-boot-03-settings-types-users.js` | 959 | 49 | Settings: point types, moving points between categories, users from the database, user log, delete/duplicate accounts, passwords, login-name change and on-devic |
| `08-data-events-boot-04-weights-zones.js` | 596 | 10 | Weight rows, zones from one source, display-name fixes and the constants card (incl. pending-upload limit). |
| `08-data-events-boot-05-menu-shell-perf.js` | 293 | 24 | Menu and shell, scroll position kept across renders, measured performance and browser vitals, focus kept in fields. |
| `08-data-events-boot-06-long-lists-storage-clicks.js` | 468 | 11 | Long lists (100 first then 'show more'), persistent storage request, table and window clicks. |
| `08-data-events-boot-07-clicks-a-1.js` | 268 | 3 | Delegated click handlers, group A part 1 (return true when the event is consumed). |
| `08-data-events-boot-08-clicks-a-2.js` | 364 | 3 | Delegated click handlers, group A part 2. |
| `08-data-events-boot-09-clicks-a-3.js` | 255 | 2 | Delegated click handlers, group A part 3. |
| `08-data-events-boot-10-clicks-doc-1.js` | 346 | 4 | Document-level click handlers part 1 (onDocClick and parts 1–3): settings, constants, survey edit, pending file, E-GATE verification. |
| `08-data-events-boot-11-clicks-doc-2.js` | 515 | 4 | Document-level click handlers part 2 (parts 4–7). |
| `08-data-events-boot-12-clicks-doc-3.js` | 257 | 3 | Document-level click handlers part 3 (parts 8–9). |
| `08-data-events-boot-13-toast-wheel-ios-boot.js` | 768 | 11 | Toast, label cells, mouse wheel never types numbers, iOS viewport stability, assistant scroll fix, file-input change handlers and the boot sequence. |

## `99-shell/` — الهيكل — ذيلُ الصفحة  (1 ملفات · 4 سطر · 0 دالة)

| الملف | الأسطر | الدوال | الغرض (PURPOSE) |
|---|---:|---:|---|
| `99-tail.html` | 4 | 0 |  |

**الإجمالي:** 158 ملفًّا · 42793 سطر · 1905 دالة.
