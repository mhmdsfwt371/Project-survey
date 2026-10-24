/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-12-from-tasks-office-13-perf-distribution-cameras.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-13-perf-distribution-cameras.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : renderKey
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ── الرسم: لا يُعاد إن لم يتغيّر شيء ── */
var RENDER_CUR = '';

/* آخرُ صفحةٍ رُسمت — لتمييز الانتقال من إعادة الرسم */
var RENDER_KEY = '', RENDER_N = 0;

function renderKey(){
  return CUR + '|' + ROLE + '|' + LANG + '|' + STAT_VER + '|' + SITE_Q + '|' + LIST_SHOWN
       + '|' + FILT.zone + '|' + FILT.type + '|' + FILT.work + '|' + DETAIL_ID
       + '|' + (MAP_SAT?1:0) + '|' + (MAP_FILT_OPEN?1:0) + '|' + (MYPOS?1:0) + '|' + MOVE_ID
       + '|' + Object.keys(STATE.recs).length + '|' + Object.keys(STATE.inss).length
       + '|' + (ASN_OPEN?1:0) + '|' + SEL_N + '|' + STAGE_TAB + '|' + CTEAM_CUR + '|' + ASN_TO
       + '|' + (BASE?BASE.ver:0) + '|' + CHANGES.length + '|' + NCRS.length
       + '|' + IPCS.length + '|' + HSE.incidents.length + '|' + EXP.repSide + '|' + SOP_CUR + '|' + ASN_MODE + '|' + ASN_TEAM + '|' + (ASN_PICK?1:0) + '|' + (HELP_OPEN?1:0) + '|' + (ASSIST_OPEN?1:0) + '|' + (QUEUE_OPEN?1:0) + '|' + PHOTO_Q.length + '|' + (DRV.ready?1:0) + '|' + (SEL_MODE?1:0) + '|' + (MAP_SELECT?1:0)
       + '|' + (MY_ONLY?1:0) + '|' + Object.keys(STATE.tasks).length
       + '|' + (POP_OPEN?1:0) + '|' + (EXP_OPEN?1:0) + '|' + (CO_OPEN?1:0)
       + '|' + CO_SEL.length + '|' + FIELD_MODE + '|' + NAV_Q + '|' + CREW_VIEW
       + '|' + PLAN_MONTHS + '|' + CFG_VER;
}
