/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-23-from-approvals-reports-07-network-notifications.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-07-network-notifications.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ipSet, ipClear, vehKindSet, vehKindAdd, vehKindDel, BELL_OPEN, bellHtml, bellToggle, notifPopGo
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */

function ipSet(id, key, val){
  if (!may('edit')){ toast(t('التحريرُ ليس من صلاحيتك')); return; }
  var x = siteFind(id); if (!x) return;
  x[key] = String(val || '').trim();
  CORE.set('sites', id, { net:x.net || '', ipRtr:x.ipRtr || '', ipRdr:x.ipRdr || '', ipCam:x.ipCam || '' });
  statBump();
}


function vehKindSet(id, patch){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var k = vehKinds().filter(function(x){ return x.id === id; })[0];
  if (!k) return;
  Object.keys(patch).forEach(function(p){ k[p] = patch[p]; });
  vehKindSave();
}


/* ═══ نافذةُ الجرس ═══
   كان الجرسُ يذهب إلى صفحة الإشعارات — فيترك المستخدمُ ما كان فيه ليرى
   سطرًا. صار يفتح نافذةً تحته بآخر عشرة: كلٌّ يُضغَط فيذهب إلى فعله، و«قرأت
   الكل» و«كل الإشعارات» في أسفلها. تُغلَق بالضغط خارجها. */
var BELL_OPEN = false;


