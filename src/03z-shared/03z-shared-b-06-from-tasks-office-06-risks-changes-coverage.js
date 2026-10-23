/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-06-from-tasks-office-06-risks-changes-coverage.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-06-risks-changes-coverage.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : riskSet, riskDel, riskAdd, riskSignals, chgAdd, chgApply, chgDecide, hseAdd
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */

function riskSet(id, patch){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var r = risksList().filter(function(x){ return x.id === id; })[0];
  if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (patch.st === 'مغلق') r.closedAt = Date.now();
  r.at = Date.now();   /* تاريخُ آخر مراجعة — تقيسه «مطابقة المنهجية» (V19.3) */
  riskSave();
  logEvent('خطر — ' + id + ' \u00b7 ' + Object.keys(patch).join('،'), id);
}


