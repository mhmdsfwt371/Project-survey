/* ============================================================================
   FILE    : src/03z-shared/03z-shared-22-from-ministry-alerts-09-pilot-workflow-readiness.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-09-pilot-workflow-readiness.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : surveyList
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ── الطلبات والمسح ──────────────────────────────── */
PV.SURV_Q = ''; PV.SURV_REOPEN = ''; PV.SURV_ST = '';

function surveyList(){
  return Object.keys(STATE.recs).map(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return null;
    return { id:id, site:x, rec:r, done:svDone(r) };
  }).filter(Boolean).sort(function(a,b){ return (b.rec.at || 0) - (a.rec.at || 0); });
}
