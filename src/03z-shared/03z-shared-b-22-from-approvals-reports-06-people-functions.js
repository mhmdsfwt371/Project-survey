/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-22-from-approvals-reports-06-people-functions.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-06-people-functions.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : jobSet, jobAssign, lessSet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function jobSet(id, patch){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var j = jobOf(id); if (!j) return;
  Object.keys(patch).forEach(function(k){ j[k] = patch[k]; });
  jobSave();
}

/* إسنادُ وظيفةٍ لشخص: تُسجَّل النقلةُ ولا تُمحى السابقة */
function jobAssign(who, jobId){
  var uid = techUid(who);
  if (!uid) return;
  var u = STATE.users[uid];
  var was = u.job ? (jobOf(u.job) || {}).n : '';
  if (u.job === jobId) return;
  u = Object.assign({}, u, { job:jobId,
    jobLog:(u.jobLog || []).concat([{ job:jobId, at:Date.now(), by:STATE.meta.name || '' }]) });
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  var now = (jobOf(jobId) || {}).n || '—';
  logEvent('وظيفة — ' + who + ': ' + (was || 'بلا وظيفة') + ' → ' + now);
  notifPush('وظيفة', who + ': ' + (was || 'بلا وظيفة') + ' → ' + now, { to:who, lv:'عادي' });
}

function lessSet(i, patch){
  if (!may('settings')) return;
  var l = lessList()[i]; if (!l) return;
  Object.keys(patch).forEach(function(k){ l[k] = patch[k]; });
  lessSave();
}
