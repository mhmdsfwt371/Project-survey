/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-14-view-as.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : «View as user» for the admin: see the app with another person's role and name — nothing is saved meanwhile.
   DEFINES : viewAsOn, viewAsUsers, viewAsSheet, viewAsStart, viewAsStop, viewAsBanner, viewAsBlock
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             design notes.
   ============================================================================ */
/* (V39.92) owner: «زوّد لي فيو أشوف بيوزرات الناس — أضغط عليه: فيو اليوزر عمار، خالد، حد في الوزارة، شكري — فأشوف اللي هو
   بيشوفه». The admin picks a person; ROLE, the name and the id become theirs, so menus, «شغلي», permissions and every
   screen render as for them. Safety first: while viewing, NOTHING is written — local writes (CORE.set), every Firestore
   write (set/update/delete/add/batch/transaction) and every non-GET request are refused with a toast. Not kept across a
   reload: reopening the app is always the admin again. The data is this phone's copy (an admin's), so a list may show
   more than that person's own phone holds — the banner says so. */
function viewAsOn(){ return !!PV.VIEW_AS; }
function viewAsUsers(){
  var me = STATE.meta.uid || '';
  return Object.keys(STATE.users || {}).map(function(k){ var u = STATE.users[k] || {}; return { uid:u.uid || k, name:u.name || u.displayName || k, role:u.role || 'tech', off:u.disabled || u.off }; })
    .filter(function(u){ return u.uid !== me && !u.off; })
    .sort(function(a, b){ return String(a.name).localeCompare(String(b.name), 'ar'); });
}
function viewAsSheet(q){
  q = String(q || '').trim();
  var L = viewAsUsers().filter(function(u){ return !q || String(u.name).indexOf(q) > -1 || String(typeof roleName === 'function' ? roleName(u.role) : u.role).indexOf(q) > -1; });
  return '<div class="svq-back" id="vaSheet" role="dialog" aria-modal="true"><div class="svq-box">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px"><b>\u{1F441} ' + esc(t('اعرض التطبيق كمستخدم')) + '</b>' + btn('\u2715', 'btn-quiet btn-sm', ' data-vaclose="1"') + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('ترى الشاشاتِ بدوره واسمه — ولا شيءَ يُحفَظ وأنت تعرض. والبياناتُ من جهازك، فقد تظهر قوائمُ أطولُ مما على جهازه.')) + '</p>'
    + '<input class="in" id="vaQ" dir="auto" placeholder="' + esc(t('ابحث بالاسم أو الدور')) + '" value="' + esc(q) + '" style="margin:0 0 8px">'
    + '<div id="vaList">' + L.slice(0, 80).map(function(u){
        return '<button type="button" class="btn btn-quiet btn-sm" data-viewas="' + esc(u.uid) + '" style="width:100%;justify-content:space-between;margin-bottom:4px;text-align:start"><span>' + esc(u.name) + '</span><span class="hint" style="margin:0">' + esc(t(typeof roleName === 'function' ? roleName(u.role) : u.role)) + '</span></button>';
      }).join('') + '</div></div></div>';
}
/* every write refused while viewing — patched on the compat SDK prototypes and undone on exit */
function viewAsBlock(on){
  var W = viewAsBlock.W || (viewAsBlock.W = {}), fs = window.firebase && window.firebase.firestore;
  var deny = function(){ toast(t('وضعُ العرض — لا شيءَ يُحفَظ')); return Promise.reject(new Error('view-as: read only')); };
  var spots = fs ? [[fs.DocumentReference && fs.DocumentReference.prototype, ['set', 'update', 'delete']], [fs.CollectionReference && fs.CollectionReference.prototype, ['add']],
    [fs.WriteBatch && fs.WriteBatch.prototype, ['commit']], [fs.Firestore && fs.Firestore.prototype, ['runTransaction']]] : [];
  spots.forEach(function(sp){ var P = sp[0]; if (!P) return; sp[1].forEach(function(m){ var key = m + '@' + spots.indexOf(sp);
    if (on){ if (!W[key]) W[key] = P[m]; P[m] = deny; } else if (W[key]){ P[m] = W[key]; delete W[key]; } }); });
  if (on && !W.fetch){ W.fetch = window.fetch; window.fetch = function(u, o){ var m = String((o && o.method) || 'GET').toUpperCase(); if (m !== 'GET' && m !== 'HEAD') return deny(); return W.fetch.apply(this, arguments); }; }
  if (!on && W.fetch){ window.fetch = W.fetch; delete W.fetch; }
}
function viewAsStart(uid){
  if (viewAsOn()) viewAsStop(true);
  if (effRole(ROLE) !== 'admin'){ toast(t('للمدير فقط')); return false; }
  var u = viewAsUsers().filter(function(x){ return x.uid === uid; })[0]; if (!u) return false;
  PV.VIEW_AS = { real:{ role:ROLE, mrole:STATE.meta.role, name:STATE.meta.name, uid:STATE.meta.uid, cur:CUR }, as:u };
  viewAsBlock(true);
  ROLE = u.role; STATE.meta.role = u.role; STATE.meta.name = u.name; STATE.meta.uid = u.uid;
  if (typeof DB === 'object' && DB.memoReset) DB.memoReset();
  var s = document.getElementById('vaSheet'); if (s) s.remove();
  CUR = seesPage('mywork') ? 'mywork' : (seesPage('mfu') ? 'mfu' : 'map');
  viewAsBanner(); var nav = document.getElementById('nav'); if (nav) nav.innerHTML = navHtml(); render();
  toast(t('تعرض الآن كـ') + ' ' + u.name);
  return true;
}
function viewAsStop(quiet){
  var V = PV.VIEW_AS; if (!V) return false;
  ROLE = V.real.role; STATE.meta.role = V.real.mrole; STATE.meta.name = V.real.name; STATE.meta.uid = V.real.uid;
  viewAsBlock(false); PV.VIEW_AS = null;
  if (typeof DB === 'object' && DB.memoReset) DB.memoReset();
  var b = document.getElementById('vaBar'); if (b) b.remove();
  if (!quiet){ CUR = V.real.cur || 'over'; var nav = document.getElementById('nav'); if (nav) nav.innerHTML = navHtml(); render(); toast(t('رجعتَ إلى حسابك')); }
  return true;
}
function viewAsBanner(){
  var V = PV.VIEW_AS, b = document.getElementById('vaBar'); if (!V){ if (b) b.remove(); return; }
  if (!b){ b = document.createElement('div'); b.id = 'vaBar'; document.body.appendChild(b); }
  b.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));background:#7C3AED;color:#fff;font-size:13px');
  b.innerHTML = '<span>\u{1F441} ' + esc(t('تعرض كـ')) + ' <b>' + esc(V.as.name) + '</b> (' + esc(t(typeof roleName === 'function' ? roleName(V.as.role) : V.as.role)) + ') \u00b7 ' + esc(t('لا شيءَ يُحفَظ')) + '</span>'
    + '<button type="button" class="btn btn-sm" data-vastop="1" style="background:#fff;color:#7C3AED">\u21A9 ' + esc(t('رجوع لحسابي')) + '</button>';
}
