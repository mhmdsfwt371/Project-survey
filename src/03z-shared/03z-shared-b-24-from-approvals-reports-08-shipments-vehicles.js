/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-24-from-approvals-reports-08-shipments-vehicles.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-08-shipments-vehicles.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : shipSet, vehSet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function shipSet(id, patch){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var x = (STATE.ships || {})[id]; if (!x) return;
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  /* وصلت: يُقفَل التأخّرُ ويُسجَّل اليومُ إن لم يُكتَب */
  if (patch.st === 'وصلت المستودع' && !x.got) x.got = todayISO();
  shipSave(x);
}

function vehSet(id, patch){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var v = vehOf(id); if (!v) return;
  Object.keys(patch).forEach(function(k){ v[k] = patch[k]; });
  vehSave(v);
}
