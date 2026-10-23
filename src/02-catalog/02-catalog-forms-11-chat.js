/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-11-chat.js
   DOMAIN  : Catalog & forms — definitions, site details, forms, teams
   PURPOSE : (V38.60) Field chat between the office and the installers: a message is a small append-only document
             (msgs), optionally tied to a site; the installation save, approval and return post their own system lines,
             so the thread of a site is its record. Live through a small listener; notifications for the addressee.
   DEFINES : chMsgs, chOf, chVisible, chSend, chSystem, chIncoming, chSeen, chUnread, chLineHtml, chThreadHtml, chPageHtml
   NOTE    : Build order is the full path (see scripts/build.mjs). State lives on the functions and in STATE.msgs.
   ============================================================================ */
/* all messages, oldest first */
function chMsgs(){ var M = STATE.msgs || {}; return Object.keys(M).map(function(k){ return M[k]; }).filter(function(v){ return v && !v.deleted && v.text; }).sort(function(a, b){ return (+a.at || 0) - (+b.at || 0); }); }
/* the thread of one site */
function chOf(site){ return chMsgs().filter(function(v){ return v.site === site; }); }
/* (V38.67) owner's rule: a point has a chat only once its installation is assigned (scheduled) — an unscheduled point has none;
   a point that already has a history keeps it */
function chScheduled(site){
  if (!site) return false;
  return !!(taskKindOf(site, 'install') || (STATE.tasks || {})['TK-install-' + site] || ((STATE.inss || {})[site] || {}).status || chOf(site).length);
}
/* who may read a message: the office reads all; the field reads what is to it, from it, to the team, or on its own sites */
/* (V38.65) «كلُّ مديرٍ يرى ما تحته»: the office (engineer and above) reads everything; a supervisor reads his own lines and
   his team's (the crews he belongs to); a technician reads his own. A plain line to the whole team (no point, no addressee)
   reaches everyone; a system line reaches the office, whoever wrote it, the point's assignee and their supervisor. */
function chPeople(){
  var me = STATE.meta.name || '', key = me + '|' + ROLE + '|' + ((STATE.crews || []).length);
  if (chPeople.k === key && chPeople.v) return chPeople.v;
  var set = {}; set[me] = 1;
  /* (V38.67) the reporting line of the accounts (each user's manager): everyone under me, at any depth */
  if (typeof underNames === 'function') underNames(me).forEach(function(n){ set[n] = 1; });
  if (rankOf(ROLE) >= rankOf('supervisor') && typeof myCrews === 'function'){
    var crews = myCrews(me);
    crewsList().forEach(function(c){ if (crews.indexOf(c.n) > -1) (c.members || []).forEach(function(m){ set[m] = 1; }); });
    (typeof techsList === 'function' ? techsList() : []).forEach(function(x){ if (x.crew && crews.indexOf(x.crew) > -1) set[x.n] = 1; });
  }
  chPeople.k = key; chPeople.v = set; return set;
}
function chVisible(v){
  if (!v) return false;
  /* the project's management (admin, executive) reads everything; an engineer reads his line of reports — and everything while
     the reporting line is not set yet (no one under him), as before */
  if (rankOf(effRole(ROLE)) >= rankOf('admin')) return true;
  var P = chPeople();
  if (may('approve') && Object.keys(P).length <= 1) return true;
  if (P[v.from] || (v.to && P[v.to])) return true;
  if (!v.to && !v.site && v.kind !== 'sys') return true;
  if (v.site){ var tk = typeof asnOf === 'function' ? asnOf(v.site) : null; if (tk && P[tk.to]) return true; }
  return false;
}
/* the thread a line belongs to: its point, the person on the other side, or the whole team */
function chKey(v){ var me = STATE.meta.name || ''; if (v.site) return 'site:' + v.site; if (!v.to) return 'team'; return 'dm:' + (v.from === me ? v.to : v.from); }
function chSeenT(){ try { return JSON.parse(lsGet('nsk14.chSeenT') || '{}'); } catch (e){ return {}; } }
function chMarkSeen(key){ var S = chSeenT(); S[key] = Date.now(); try { lsSet('nsk14.chSeenT', JSON.stringify(S)); } catch (e){ LS_ERR = e; } }


/* a message that arrived from another device */
function chIncoming(v){
  if (!v || v.from === (STATE.meta.name || '') || !chVisible(v)) return;
  if ((+v.at || 0) <= (chIncoming.at || 0)) return; chIncoming.at = +v.at || 0;
  try { chAlert(v); } catch (eA){ LS_ERR = eA; }   /* (V39.8) the banner, the beep, the count and the system notice */
  var big = v.kind !== 'sys' || /^(بدأ التركيب|اكتمل التركيب|تعذّر التركيب|فُكَّت)/.test(String(v.text));   /* (V38.65) */
  if (typeof notifPush === 'function') notifPush((v.kind === 'sys' ? '\u{1F527} ' : '\u{1F4AC} ') + t(v.kind === 'sys' ? 'التركيب' : 'رسالة'), (v.kind === 'sys' ? (v.site ? v.site + ' — ' : '') : v.from + ': ') + String(v.text).slice(0, 90), { to:v.to || '', site:v.site || '', lv:big ? 'مهم' : 'عادي', actor:v.from, at:v.at });
  if (CUR === 'chat' || (CUR === 'site' && DETAIL_ID === v.site) || (POP_OPEN && POP_SITE === v.site)) { try { if (!document.querySelector('#content textarea:focus')) render(1); } catch (e){ LS_ERR = e; } }
}
/* (V39.8) owner: «أي رسالة تظهر نوتيفيكيشن للشخص اللي رايحة له عشان يعرف إن في رسالة جت، ورقم يبين عدد الرسايل وصوت صغير».
   A message to me: a banner on top (a tap opens its conversation) unless that conversation is open in front of me, a short
   double beep (muted from the chat page), the unread count on the top bar and on the app icon, and — when the app is in the
   background and the phone allows it — a notice from the system. System lines (installation started, approved) keep their
   own notification and stay silent. */
function chAlert(v){
  if (!v || v.kind === 'sys') return;
  chTopSync();
  if (lsGet('nsk14.chMute') !== '1') chBeep();
  var key = chKey(v), hidden = typeof document === 'object' && document.hidden;
  if (!(CUR === 'chat' && (chPageHtml.f || {}).open === key && !hidden)) chBanner(v, key);
  if (hidden) chSysNote(v, key);
}
/* the count on the top bar's chat button and on the app's icon */
function chTopSync(){
  var b = document.getElementById('chatTop'); if (!b) return;
  var can = !!ROLE && typeof seesPage === 'function' && seesPage('chat'); b.hidden = !can;
  var n = 0; if (can){ try { n = chUnread(); } catch (e){ LS_ERR = e; } }
  var bd = document.getElementById('chatTopN'); if (bd){ bd.hidden = !n; bd.textContent = n ? (n > 99 ? nm(99) + '+' : nm(n)) : ''; }
  try { if (typeof navigator === 'object' && navigator.setAppBadge){ if (n) navigator.setAppBadge(n); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } } catch (e2){ LS_ERR = e2; }
}
/* two short soft tones — phones only play sound after the first touch, so the first touch opens the sound */
function chBeep(){
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var C = chBeep.ctx || (chBeep.ctx = new AC()); if (C.state === 'suspended' && C.resume) C.resume();
    [0, 0.17].forEach(function(t0){
      var o = C.createOscillator(), g = C.createGain(), at = C.currentTime + t0;
      o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.2, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
      o.connect(g); g.connect(C.destination); o.start(at); o.stop(at + 0.13);
    });
  } catch (e){ LS_ERR = e; }
}
if (typeof document === 'object' && document.addEventListener) document.addEventListener('touchend', function chSoundOpen(){
  try { var AC = window.AudioContext || window.webkitAudioContext; if (AC && !chBeep.ctx) chBeep.ctx = new AC(); if (chBeep.ctx && chBeep.ctx.resume) chBeep.ctx.resume(); } catch (e){ LS_ERR = e; }
  document.removeEventListener('touchend', chSoundOpen);
}, { passive:true });
/* the banner: who and the first words; a tap opens the conversation, and it leaves by itself after seven seconds */
function chBanner(v, key){
  var old = document.getElementById('chBanner'); if (old) old.remove();
  var el = document.createElement('div'); el.id = 'chBanner'; el.setAttribute('role', 'status');
  el.innerHTML = '<b>\u{1F4AC} ' + esc(dispName(v.from) || v.from) + '</b><div style="margin-top:2px;opacity:.9">' + esc(String(v.text).slice(0, 120)) + '</div>';
  el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 8px);inset-inline:10px;z-index:130;background:var(--surface, #13203a);color:var(--ink, #fff);border:1px solid var(--brand, #4dd0e1);border-radius:14px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:pointer;font-size:14px';
  el.addEventListener('click', function(){ el.remove(); chPageHtml.f = { open:key }; PTAB.chat = 'chat'; goPage('chat'); render(1); });
  document.body.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.remove(); }, 7000);
}
/* the system's notice while the app is in the background — only when the user allowed notifications */
function chSysNote(v, key){
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function(r){ return r.showNotification('\u{1F4AC} ' + (dispName(v.from) || v.from), { body:String(v.text).slice(0, 140), tag:'chat-' + key, renotify:true, data:{ key:key } }); }).catch(function(e){ LS_ERR = e; });
  } catch (e){ LS_ERR = e; }
}
/* a tap on the system's notice opens its conversation */
if (typeof navigator === 'object' && navigator.serviceWorker && navigator.serviceWorker.addEventListener) navigator.serviceWorker.addEventListener('message', function(e){
  if (!e.data || e.data.type !== 'nsk-chat-open' || !e.data.key) return;
  try { chPageHtml.f = { open:String(e.data.key) }; PTAB.chat = 'chat'; goPage('chat'); render(1); } catch (er){ LS_ERR = er; }
});
function chSeen(){ chSeen.at = Date.now(); try { lsSet('nsk14.chSeen', String(chSeen.at)); } catch (e){ LS_ERR = e; } }
function chUnread(key){
  var seen = chSeen.at || +lsGet('nsk14.chSeen') || 0, S = chSeenT(), me = STATE.meta.name || '';
  return chMsgs().filter(function(v){ if (v.from === me || !chVisible(v)) return false; var k = chKey(v); if (key && k !== key) return false; return (+v.at || 0) > Math.max(seen, S[k] || 0); }).length;
}
function chLineHtml(v){
  var me = STATE.meta.name || '', mine = v.from === me, sys = v.kind === 'sys';
  var who = sys ? '' : '<b>' + esc(dispName(v.from) || v.from) + '</b>' + (v.role && ROLES[v.role] ? ' <span class="hint" style="margin:0">' + esc(t(ROLES[v.role].n)) + '</span>' : '') + (v.to ? ' \u2192 ' + esc(dispName(v.to) || v.to) : '');
  return '<div style="margin:4px 0;display:flex;flex-direction:column;align-items:' + (sys ? 'center' : (mine ? 'flex-start' : 'flex-end')) + '">'
    + '<div style="max-width:88%;padding:7px 11px;border-radius:12px;' + (sys ? 'background:transparent;border:1px dashed var(--line);font-size:12.5px' : (mine ? 'background:var(--brand);color:var(--brand-ink)' : 'background:var(--surface);border:1px solid var(--line)')) + '">'
    + (who ? '<div style="font-size:11.5px;opacity:.85;margin-bottom:2px">' + who + '</div>' : '') + '<div style="white-space:pre-wrap">' + (sys ? '\u2139 ' : '') + esc(v.text) + '</div>'
    + (v.kind === 'fwd' && v.ref && v.ref !== me ? '<div style="margin-top:6px">' + btn('\u{1F4AC} ' + t('ردّ على') + ' ' + (dispName(v.ref) || v.ref), 'btn-quiet btn-sm', ' data-chopen-t="dm:' + esc(v.ref) + '"') + '</div>' : '')
    + '<div class="hint" style="margin:3px 0 0;font-size:11px;opacity:.8"><span class="num">' + esc(fmtTime(v.at, { hour:'2-digit', minute:'2-digit' })) + '</span> \u00b7 ' + esc(fmtDate(v.at))
    + (chMayDel() ? ' <button type="button" class="btn-quiet" data-chdel="' + esc(v.id) + '" aria-label="' + esc(t('امسح الرسالة')) + '" style="border:0;background:transparent;padding:0 4px;cursor:pointer">\u{1F5D1}</button>' : '') + '</div></div></div>';
}
/* (V39.7) owner: «زرار مسح يكون مع المهندس والمدير» — the engineer and above delete a line or a whole conversation; the
   message is marked deleted (who and when), never erased, and disappears for everyone */
function chMayDel(){ return rankOf(ROLE) >= rankOf('engineer'); }
/* (V39.7) owner: «زرار تحويل الشات لحد تاني يكون معايا على نفس الليفل أو تحتي» — the people a conversation can be handed to:
   active accounts at the user's rank or below, not the user and not the other side */
function chFwdPeople(other){
  var U = STATE.users || {}, me = STATE.meta.name || '', r = rankOf(ROLE), seen = {};
  return Object.keys(U).map(function(k){ return U[k]; }).filter(function(u){
    if (!u || !u.name || u.active === false || u.name === me || u.name === other || seen[u.name]) return false;
    seen[u.name] = 1; return rankOf(u.role || 'tech') <= r;
  }).sort(function(a, b){ return rankOf(b.role || 'tech') - rankOf(a.role || 'tech') || String(a.name).localeCompare(String(b.name), 'ar'); });
}
/* the thread of a site with its composer; `to` defaults to the site's assignee (office) or empty = the office (field) */
function chThreadHtml(site, compact){
  if (!chScheduled(site)) return '';   /* (V38.67) */
  var L = chOf(site).filter(chVisible), tk = typeof asnOf === 'function' ? asnOf(site) : null;
  var to = may('approve') ? ((tk && tk.to) || '') : '';
  var lines = (compact ? L.slice(-3) : L).map(chLineHtml).join('') || '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا رسائلَ على هذه النقطة بعد')) + '</p>';
  var box = '<div style="display:flex;gap:6px;margin-top:8px;align-items:flex-end"><textarea class="in" data-chtext="' + esc(site) + '" rows="1" aria-label="' + esc(t('محادثة النقطة')) + '" placeholder="' + esc(t('اكتب للمهندس أو للمنفِّذ…')) + '" style="flex:1;min-height:40px"></textarea>'
    + btn('\u27A4', 'btn-primary btn-sm', ' data-chsend="' + esc(site) + '" data-chto="' + esc(to) + '" aria-label="' + esc(t('أرسل')) + '"') + '</div>'
    + (to ? '<p class="hint" style="margin:4px 0 0">' + esc(t('إلى')) + ': ' + esc(dispName(to) || to) + '</p>' : '');
  return card('\u{1F4AC} ' + t('محادثة النقطة') + (L.length ? ' \u00b7 ' + nm(L.length) : ''), '<div data-chthread="' + esc(site) + '">' + lines + '</div>' + box + (compact && L.length > 3 ? '<p class="hint" style="margin:4px 0 0">' + btn(t('المحادثةُ كاملة'), 'btn-quiet btn-sm', ' data-chopen="' + esc(site) + '"') + '</p>' : ''));
}
/* (V38.65) the conversations page reads like a messenger: a list of threads (each point, each person, the team, and the
   installation log), and an open thread with its bubbles oldest-to-newest and the composer at the bottom */
function chThreads(){
  var T = {};
  chMsgs().filter(chVisible).forEach(function(v){ var k = chKey(v); var r = T[k] || (T[k] = { key:k, n:0, last:null }); r.n++; r.last = v; });
  return Object.keys(T).map(function(k){ return T[k]; }).sort(function(a, b){ return (+b.last.at || 0) - (+a.last.at || 0); });
}
function chTitle(key){
  if (key === 'team') return '\u{1F465} ' + t('الفريق كلّه');
  if (key === 'sys') return '\u{1F527} ' + t('سجل التركيب');
  if (key.indexOf('dm:') === 0) return '\u{1F464} ' + (dispName(key.slice(3)) || key.slice(3));
  var x = siteFind(key.slice(5)); return '\u{1F4CD} ' + (x ? siteKey(x) + ' \u00b7 ' + x.name : key.slice(5));
}
function chOpenHtml(key){
  var all = chMsgs().filter(chVisible);
  var L = key === 'sys' ? all.filter(function(v){ return v.kind === 'sys'; }).slice(-300) : all.filter(function(v){ return chKey(v) === key; }).slice(-300);
  if (key !== 'sys') chMarkSeen(key); else chSeen();
  var site = key.indexOf('site:') === 0 ? key.slice(5) : '', tk = site && typeof asnOf === 'function' ? asnOf(site) : null;
  var to = key.indexOf('dm:') === 0 ? key.slice(3) : (site && may('approve') ? ((tk && tk.to) || '') : '');
  var head = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + btn('\u2192 ' + t('المحادثات'), 'btn-quiet btn-sm', ' data-chf="all"') + '<b style="flex:1">' + esc(chTitle(key)) + '</b>'
    + (site ? btn('\u{1F4C4} ' + t('صفحة النقطة'), 'btn-quiet btn-sm', ' data-site="' + esc(site) + '"') + btn('\u25C8', 'btn-quiet btn-sm', ' data-fly="' + esc(site) + '" title="' + esc(t('على الخريطة')) + '"') : '')
    + (key.indexOf('dm:') === 0 && rankOf(ROLE) >= rankOf('supervisor') ? btn('\u21AA ' + t('تحويل'), 'btn-quiet btn-sm', ' data-chfwd="' + esc(key) + '"') : '')
    + (key !== 'sys' && chMayDel() && L.length ? btn('\u{1F5D1} ' + t('امسح المحادثة'), 'btn-quiet btn-sm', ' data-chdelt="' + esc(key) + '"') : '') + '</div>'
    + (chOpenHtml.fwd === key ? chFwdHtml(key.slice(3)) : '')
    + (site && tk ? '<p class="hint" style="margin:4px 0 0">' + esc(t('مُسنَدة إلى')) + ': ' + esc(dispName(tk.to) || tk.to) + '</p>' : '');
  var lines = L.length ? L.map(chLineHtml).join('') : '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا رسائلَ بعد — اكتب أوّلَ رسالة')) + '</p>';
  var sendKey = site || (key.indexOf('dm:') === 0 ? key : (key === 'team' ? 'team' : ''));
  var composer = key === 'sys' ? '' : '<div style="display:flex;gap:6px;align-items:flex-end;margin-top:8px"><textarea class="in" data-chtext="' + esc(sendKey) + '" rows="2" aria-label="' + esc(t('رسالة…')) + '" placeholder="' + esc(t('رسالة…')) + '" style="flex:1">' + esc((chOpenHtml.draft || {})[sendKey] || '') + '</textarea>'   /* (V39.4) a draft written for this thread (the assistant's «كلّم المهندس») */
    + btn('\u27A4', 'btn-primary', ' data-chsend="' + esc(sendKey) + '" data-chto="' + esc(to) + '" aria-label="' + esc(t('أرسل')) + '"') + '</div>' + (to ? '<p class="hint" style="margin:4px 0 0">' + esc(t('إلى')) + ': ' + esc(dispName(to) || to) + '</p>' : '');
  setTimeout(function(){ var el = document.getElementById('chScroll'); if (el) el.scrollTop = el.scrollHeight; }, 0);
  return card('', head + '<div id="chScroll" style="max-height:60vh;overflow-y:auto;margin-top:8px;padding:4px 2px">' + lines + '</div>' + composer);
}
/* the hand-over list under the conversation's head: the people at my rank or below */
function chFwdHtml(other){
  var P = chFwdPeople(other);
  return '<div class="card" style="margin:8px 0 0"><p style="margin:0 0 6px">' + esc(t('حوّل المحادثة إلى')) + '</p>'
    + (P.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px">' + P.map(function(u){ return btn((dispName(u.name) || u.name) + (ROLES[u.role] ? ' \u00b7 ' + t(ROLES[u.role].n) : ''), 'btn-secondary btn-sm', ' data-chfwdto="' + esc(u.name) + '"'); }).join('') + '</div>'
                : '<p class="hint" style="margin:0">' + esc(t('لا أحدَ في مستواك أو تحتك')) + '</p>') + '</div>';
}
function chListHtml(){
  var me = STATE.meta.name || '', TH = chThreads(), S = chSeenT(), g = chSeen.at || +lsGet('nsk14.chSeen') || 0;
  var sysN = chMsgs().filter(function(v){ return v.kind === 'sys' && chVisible(v); }).length;
  var row = function(key, title, prev, at, un){
    return '<div class="list-item" data-chopen-t="' + esc(key) + '" style="cursor:pointer"><div class="li-main"><div class="li-title">' + esc(title) + '</div><div class="li-sub">' + prev + '</div></div>'
      + '<div class="li-end"><span class="hint" style="margin:0;font-size:11px">' + esc(at ? (typeof stepAgo === 'function' ? stepAgo(at) : fmtDT(at)) : '') + '</span>' + (un ? ' <span class="tb-badge" style="position:static;display:inline-block">' + nm(un) + '</span>' : '') + '</div></div>';
  };
  var rows = TH.map(function(r){
    var v = r.last, un = r.key === 'sys' ? 0 : chMsgs().filter(function(x){ return x.from !== me && chVisible(x) && chKey(x) === r.key && (+x.at || 0) > Math.max(g, S[r.key] || 0); }).length;
    var prev = (v.kind === 'sys' ? '\u2139 ' : '<b>' + esc(dispName(v.from) || v.from) + ':</b> ') + esc(String(v.text).slice(0, 70));
    return row(r.key, chTitle(r.key), prev, v.at, un);
  }).join('');
  return (sysN ? row('sys', chTitle('sys') + ' \u00b7 ' + nm(sysN), esc(t('كلُّ تركيبٍ بدأ أو اكتمل أو عُدِّل أو اعتُمد أو رُدّ — لايف')), 0, 0) : '') + rows;
}
/* (V39.8) the alerts' switches on the chat page: the system's notices (asked once, with a tap) and the beep */
function chAlertChips(){
  var muted = lsGet('nsk14.chMute') === '1', out = btn((muted ? '\u{1F507} ' + t('صوت الرسائل مكتوم') : '\u{1F514} ' + t('صوت الرسائل')), 'chip' + (muted ? '' : ' on'), ' data-chmute="1"');
  var P = typeof Notification === 'undefined' ? 'na' : Notification.permission;
  if (P === 'default') out += btn('\u{1F4E3} ' + t('فعّل تنبيهات الرسائل'), 'chip', ' data-chnotif="1"');
  else if (P === 'denied') out += '<span class="hint" style="margin:0 6px">' + esc(t('تنبيهات الرسائل مقفولة من إعدادات الجهاز')) + '</span>';
  return out;
}
function chPageHtml(){
  var all = chMsgs().filter(chVisible), me = STATE.meta.name || '', f = chPageHtml.f || {};
  /* an open thread (from the list, the point's page or a notification) */
  if (f.open) return chOpenHtml(f.open);
  if (f.sys) return chOpenHtml('sys');
  if (f.site) return chOpenHtml('site:' + f.site);
  if (f.who) return chOpenHtml('dm:' + f.who);
  var sites = {}; all.forEach(function(v){ if (v.site) sites[v.site] = 1; });
  var names = (typeof techsList === 'function' ? techsList().map(function(x){ return x.n; }) : []).concat(Object.keys(STATE.users || {}).map(function(k){ return (STATE.users[k] || {}).name; })).filter(function(n, i, a){ return n && n !== me && a.indexOf(n) === i; });
  if (!may('approve')){ var P = chPeople(); names = names.filter(function(n){ return P[n] || rankOf(((techsList().filter(function(x){ return x.n === n; })[0]) || {}).r || 'tech') >= rankOf('engineer'); }); }
  var compose = '<div class="grid cols-2" style="gap:6px;margin-bottom:6px"><select class="in" data-chto-sel="1" aria-label="' + esc(t('إلى')) + '"><option value="">' + esc(t('إلى: الفريق كلِّه')) + '</option>' + names.map(function(n){ return '<option value="' + esc(n) + '">' + esc(dispName(n) || n) + '</option>'; }).join('') + '</select>'
    + '<input class="in" data-chsite-in="1" list="chSites" aria-label="' + esc(t('النقطة (اختياري)')) + '" placeholder="' + esc(t('النقطة (اختياري)')) + '" value=""><datalist id="chSites">' + Object.keys(sites).map(function(s){ return '<option value="' + esc(s) + '">'; }).join('') + '</datalist></div>'
    + '<div style="display:flex;gap:6px;align-items:flex-end"><textarea class="in" data-chtext="*" rows="2" aria-label="' + esc(t('رسالة…')) + '" placeholder="' + esc(t('رسالة…')) + '" style="flex:1"></textarea>' + btn('\u27A4 ' + t('أرسل'), 'btn-primary', ' data-chsend="*"') + '</div>';
  var sysN = all.filter(function(v){ return v.kind === 'sys'; }).length;
  return stats([['الرسائل', N(all.length)], ['نقاط عليها محادثة', N(Object.keys(sites).length)], ['غير مقروء', N(chUnread())]])
    + '<div class="chips" style="margin:0 0 8px">' + btn('\u{1F527} ' + t('سجل التركيب') + ' \u00b7 ' + nm(sysN), 'chip', ' data-chf="sys"') + chAlertChips() + '</div>'
    + card('\u270F ' + t('رسالة جديدة'), compose)
    + cardFlush(t('المحادثات'), chListHtml() || '<p class="hint" style="text-align:center;padding:12px">' + esc(t('لا رسائلَ بعد — اكتب أوّلَ رسالة')) + '</p>')
    + '<p class="hint">' + esc(t('كلُّ رسالةٍ سطرٌ لا يُعدَّل، والمهندسُ فما فوق يمسحه — وحفظُ التركيب واعتمادُه وردُّه يكتبون سطورَهم هنا وحدَهم.')) + '</p>';
}

/* (V38.67) «سجل المحادثات» — the project's management finds any line: by point, person, date range, kind and text; each
   line opens its conversation. The page's export takes the table. */
function chHistState(){ return chHistState.s || (chHistState.s = { site:'', who:'', from:'', to:'', kind:'', q:'' }); }
function chHistHtml(){
  var F = chHistState(), all = chMsgs();
  var people = {}, sites = {}; all.forEach(function(v){ if (v.from) people[v.from] = 1; if (v.to) people[v.to] = 1; if (v.site) sites[v.site] = 1; });
  var t0 = F.from ? Date.parse(F.from + 'T00:00:00') : 0, t1 = F.to ? Date.parse(F.to + 'T23:59:59') : 0, qq = String(F.q || '').trim();
  var L = all.filter(function(v){
    if (F.site && v.site !== F.site) return false;
    if (F.who && v.from !== F.who && v.to !== F.who) return false;
    if (F.kind === 'msg' && v.kind === 'sys') return false;
    if (F.kind === 'sys' && v.kind !== 'sys') return false;
    if (t0 && (+v.at || 0) < t0) return false;
    if (t1 && (+v.at || 0) > t1) return false;
    if (qq && String(v.text).indexOf(qq) < 0) return false;
    return true;
  }).slice().reverse();
  var sel = function(attr, val, opts, all0){ return '<select class="in" data-chh="' + attr + '" aria-label="' + esc(t(all0)) + '"><option value="">' + esc(t(all0)) + '</option>' + opts.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (val === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
  var filters = '<div class="grid cols-2" style="gap:6px">'
    + sel('site', F.site, Object.keys(sites).sort().map(function(id){ var x = siteFind(id); return [id, x ? siteKey(x) + ' · ' + id : id]; }), 'كلُّ النقاط')
    + sel('who', F.who, Object.keys(people).sort().map(function(n){ return [n, dispName(n) || n]; }), 'كلُّ الأشخاص')
    + '<label class="hint" style="margin:0">' + esc(t('من تاريخ')) + '<input class="in" type="date" data-chh="from" value="' + esc(F.from) + '" aria-label="' + esc(t('من تاريخ')) + '"></label>'
    + '<label class="hint" style="margin:0">' + esc(t('إلى تاريخ')) + '<input class="in" type="date" data-chh="to" value="' + esc(F.to) + '" aria-label="' + esc(t('إلى تاريخ')) + '"></label>'
    + sel('kind', F.kind, [['msg', t('رسائل الأشخاص')], ['sys', t('سطور النظام (التركيب)')]], 'كلُّ الأنواع')
    + '<input class="in" data-chh="q" value="' + esc(F.q) + '" placeholder="' + esc(t('بحثٌ في النص')) + '" aria-label="' + esc(t('بحثٌ في النص')) + '">'
    + '</div><div class="actions" style="margin-top:6px">' + btn(t('مسح الفلاتر'), 'btn-quiet btn-sm', ' data-chhclear="1"') + '</div>';
  var rows = L.slice(0, 500).map(function(v){
    var x = v.site ? siteFind(v.site) : null;
    return ['<span class="num">' + esc(fmtDT(v.at)) + '</span>',
            v.site ? btn(esc(x ? siteKey(x) : v.site), 'btn-quiet btn-sm', ' data-chopen="' + esc(v.site) + '"') : '<span class="hint" style="margin:0">' + esc(t(v.to ? 'مباشرة' : 'الفريق')) + '</span>',
            esc(v.kind === 'sys' ? t('النظام') : (dispName(v.from) || v.from)) + (v.to ? ' \u2192 ' + esc(dispName(v.to) || v.to) : ''),
            (v.kind === 'sys' ? '\u2139 ' : '') + esc(v.text)];
  });
  return stats([['السطور المطابقة', N(L.length)], ['النقاط', N(Object.keys(sites).length)], ['الأشخاص', N(Object.keys(people).length)]])
    + card('\u{1F50E} ' + t('فلترة سجل المحادثات'), filters)
    + cardFlush(t('السجل') + ' \u00b7 ' + nm(L.length) + (L.length > 500 ? ' \u2014 ' + t('أحدثُ ٥٠٠') : ''), rows.length ? table(['الوقت', 'النقطة', 'من \u2192 إلى', 'النص'], rows) : '<p class="hint" style="text-align:center;padding:12px">' + esc(t('لا سطورَ تطابق الفلاتر')) + '</p>');
}
