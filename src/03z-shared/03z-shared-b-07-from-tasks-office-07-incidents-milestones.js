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

function hseDel(i){
  if (!may('approve')){ toast(t('حذفُ الحادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  HSE.incidents.splice(i, 1);
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i + 1), null);
  logEvent('حذف حادث — ' + x.kind + ' \u00b7 ' + (x.site || ''));
  toast(t('حُذف الحادث'));
  render(1);
}

function ncrAdd(){
  if (!may('edit')){ toast(t('فتحُ البلاغ يحتاج صلاحية تعديل')); return; }
  var site = (document.getElementById('ncrSite') || {}).value || '';
  var cat  = (document.getElementById('ncrCat') || {}).value || '';
  var sev  = (document.getElementById('ncrSev') || {}).value || '';
  var why  = (document.getElementById('ncrWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب الوصف')); return; }
  NCRS.push({ site:site, cat:cat, sev:sev, why:why, st:'مفتوح',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ncr', 'NCR-' + NCRS.length, NCRS[NCRS.length-1]);
  logEvent('بلاغ عدم مطابقة — ' + cat + (site ? ' · ' + site : ''), site);
  toast(t('فُتح البلاغ'));
  render(1);
}

function ncrClose(i){
  if (!may('approve')){ toast(t('إغلاقُ البلاغ للمهندس وحده')); return; }
  var x = NCRS[i];
  if (!x) return;
  x.st = 'مغلق'; x.closeBy = STATE.meta.name || ''; x.closeAt = Date.now();
  CORE.dirty('ncr', 'NCR-' + (i+1), x);
  logEvent('إغلاق بلاغ — ' + x.cat);
  toast(t('أُغلق'));
  render(1);
}

function ipcAdd(){
  var per = (document.getElementById('ipcPer') || {}).value || ('الفترة ' + (IPCS.length + 1));
  var amt = cfgN((document.getElementById('ipcAmt') || {}).value);
  var ret = cfgN((document.getElementById('ipcRet') || {}).value);
  if (amt <= 0){ toast(t('المبلغ صفرٌ أو سالب')); return; }
  IPCS.push({ period:per, amt:amt, retPct:ret, st:'مقدَّم',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ipc', 'IPC-' + IPCS.length, IPCS[IPCS.length-1]);
  logEvent('مستخلص — ' + per + ' · ' + nm(amt));
  toast(t('قُدّم المستخلص'));
  render(1);
}

function ipcStep(i, st){
  var x = IPCS[i];
  if (!x) return;
  x.st = st; x.stBy = STATE.meta.name || ''; x.stAt = Date.now();
  CORE.dirty('ipc', 'IPC-' + (i+1), x);
  logEvent('مستخلص ' + st + ' — ' + x.period);
  toast(t(st));
  render(1);
}

function mileUpsert(id, patch){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var L = mileDates().slice(), cur = L.filter(function(x){ return x.id === id; })[0];
  if (!cur){ cur = { id:id }; L.push(cur); }
  Object.keys(patch).forEach(function(k){ if (patch[k] === undefined || patch[k] === '') delete cur[k]; else cur[k] = patch[k]; });
  STATE.mileDates = L; CORE.set('cfg', 'miles', L.slice()); CORE.saveSoon();
  logEvent('معلَم — ' + id + ' \u00b7 ' + Object.keys(patch).join(','), id);
  return true;
}

function mileAdd(name, w, d, dep){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  name = String(name || '').trim(); if (!name){ toast(t('اسمُ المعلَم مطلوب')); return false; }
  var id = 'X' + Date.now().toString(36).slice(-5).toUpperCase();
  mileUpsert(id, { custom:true, n:name, w:+w || 0, d:d || '', dep:dep || '', prog:0 });
  toast(t('أُضيف المعلَم') + ' ' + name); MILE_EDIT = ''; render(1); return true;
}

function mileRemove(id){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var o = mileOv(id);
  if (o.custom){ STATE.mileDates = mileDates().filter(function(x){ return x.id !== id; }); CORE.set('cfg', 'miles', STATE.mileDates.slice()); CORE.saveSoon(); }
  else mileUpsert(id, { hidden:true });
  logEvent('حذفُ معلَم — ' + id, id); toast(t('حُذف المعلَم')); MILE_EDIT = ''; render(1); return true;
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
