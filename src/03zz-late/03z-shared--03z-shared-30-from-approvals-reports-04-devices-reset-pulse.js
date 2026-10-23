/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-30-from-approvals-reports-04-devices-reset-pulse.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function sysReportFetch(force){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return Promise.resolve(null);
  if (!force && Date.now() - SYSREP.at < 600000) return Promise.resolve(SYSREP.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  SYSREP.at = Date.now();
  return DB.col('settings').doc('sysreport').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    SYSREP.v = (doc && doc.exists) ? doc.data() : {}; SYSREP.err = '';
    if (CUR === 'sys') render(1);
    return SYSREP.v;
  }).catch(function(e){ SYSREP.err = String(e && (e.message || e.code) || e).slice(0, 80); return null; });
}
