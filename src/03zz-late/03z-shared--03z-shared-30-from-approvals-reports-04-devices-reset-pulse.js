/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-30-from-approvals-reports-04-devices-reset-pulse.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-30-from-approvals-reports-04-devices-reset-pulse.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : sysReportFetch
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function sysReportFetch(force){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return Promise.resolve(null);
  if (!force && Date.now() - PV.SYSREP.at < 600000) return Promise.resolve(PV.SYSREP.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  PV.SYSREP.at = Date.now();
  return DB.col('settings').doc('sysreport').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    PV.SYSREP.v = (doc && doc.exists) ? doc.data() : {}; PV.SYSREP.err = '';
    if (CUR === 'sys') render(1);
    return PV.SYSREP.v;
  }).catch(function(e){ PV.SYSREP.err = String(e && (e.message || e.code) || e).slice(0, 80); return null; });
}
