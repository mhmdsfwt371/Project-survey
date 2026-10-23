/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-07-from-tasks-office-07-incidents-milestones.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-07-incidents-milestones.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : hseSet, hseDel, ncrAdd, ncrClose, ipcAdd, ipcStep, mileUpsert, mileAdd, mileRemove, MILE_EDIT, MILE_NEW, mileDateSet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */

function hseSet(i, patch){
  if (!may('approve')){ toast(t('تصحيحُ سجل الحوادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  x.editBy = STATE.meta.name || '';
  x.editAt = Date.now();
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i), x);
  logEvent('تعديل حادث — ' + x.kind + ' \u00b7 ' + Object.keys(patch).join('،'));
}


var MILE_EDIT = '', MILE_NEW = false;

function mileDateSet(id, d){
  if (!may('settings')){ toast(t('مواعيدُ المعالم للمهندس وحده')); return; }
  var L = mileDates().filter(function(x){ return x.id !== id; });
  if (d) L.push({ id:id, d:d });
  STATE.mileDates = L;
  CORE.set('cfg', 'miles', L.slice());
  logEvent('موعد معلَم — ' + id + ' \u00b7 ' + (d || 'أُعيد إلى الاشتقاق'), id);
}
