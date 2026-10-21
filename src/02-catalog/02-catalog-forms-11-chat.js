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
/* who may read a message: the office reads all; the field reads what is to it, from it, to the team, or on its own sites */
function chVisible(v){
  if (may('approve')) return true;
  var me = STATE.meta.name || '';
  if (!v.to || v.to === me || v.from === me) return true;
  if (v.site && (STATE.tasks || {})){ var tk = typeof asnOf === 'function' ? asnOf(v.site) : null; if (tk && tk.to === me) return true; }
  return false;
}
function chSend(site, to, text, kind){
  var tx = String(text || '').trim(); if (!tx) return null;
  var id = 'M-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  var v = { id:id, site:site || '', to:to || '', from:STATE.meta.name || '', role:ROLE || '', text:tx.slice(0, 1500), kind:kind || 'msg', at:Date.now() };
  STATE.msgs = STATE.msgs || {}; CORE.set('msgs', id, v); CORE.saveSoon();
  chSeen.at = Date.now();
  return v;
}
/* a line the system writes into the site's thread (installation saved, approved, returned) — with the addressee of the event */
function chSystem(site, text, to){ try { return chSend(site, to, text, 'sys'); } catch (e){ LS_ERR = e; return null; } }
/* a message that arrived from another device */
function chIncoming(v){
  if (!v || v.from === (STATE.meta.name || '') || !chVisible(v)) return;
  if ((+v.at || 0) <= (chIncoming.at || 0)) return; chIncoming.at = +v.at || 0;
  if (typeof notifPush === 'function') notifPush('\u{1F4AC} ' + t('رسالة'), (v.kind === 'sys' ? '' : v.from + ': ') + String(v.text).slice(0, 90), { to:v.to || '', site:v.site || '', lv:v.kind === 'sys' ? 'عادي' : 'مهم', actor:v.from, at:v.at });
  if (CUR === 'chat' || (CUR === 'site' && DETAIL_ID === v.site) || (POP_OPEN && POP_SITE === v.site)) { try { if (!document.querySelector('#content textarea:focus')) render(1); } catch (e){ LS_ERR = e; } }
}
function chSeen(){ chSeen.at = Date.now(); try { lsSet('nsk14.chSeen', String(chSeen.at)); } catch (e){ LS_ERR = e; } }
function chUnread(){
  var seen = chSeen.at || +lsGet('nsk14.chSeen') || 0, me = STATE.meta.name || '';
  return chMsgs().filter(function(v){ return v.from !== me && (+v.at || 0) > seen && chVisible(v); }).length;
}
function chLineHtml(v){
  var me = STATE.meta.name || '', mine = v.from === me, sys = v.kind === 'sys';
  var who = sys ? '' : '<b>' + esc(dispName(v.from) || v.from) + '</b>' + (v.role && ROLES[v.role] ? ' <span class="hint" style="margin:0">' + esc(t(ROLES[v.role].n)) + '</span>' : '') + (v.to ? ' \u2192 ' + esc(dispName(v.to) || v.to) : '');
  return '<div style="margin:4px 0;display:flex;flex-direction:column;align-items:' + (sys ? 'center' : (mine ? 'flex-start' : 'flex-end')) + '">'
    + '<div style="max-width:88%;padding:7px 11px;border-radius:12px;' + (sys ? 'background:transparent;border:1px dashed var(--line);font-size:12.5px' : (mine ? 'background:var(--brand);color:var(--brand-ink)' : 'background:var(--surface);border:1px solid var(--line)')) + '">'
    + (who ? '<div style="font-size:11.5px;opacity:.85;margin-bottom:2px">' + who + '</div>' : '') + '<div style="white-space:pre-wrap">' + (sys ? '\u2139 ' : '') + esc(v.text) + '</div>'
    + '<div class="hint" style="margin:3px 0 0;font-size:11px;opacity:.8"><span class="num">' + esc(fmtTime(v.at, { hour:'2-digit', minute:'2-digit' })) + '</span> \u00b7 ' + esc(fmtDate(v.at)) + '</div></div></div>';
}
/* the thread of a site with its composer; `to` defaults to the site's assignee (office) or empty = the office (field) */
function chThreadHtml(site, compact){
  var L = chOf(site).filter(chVisible), tk = typeof asnOf === 'function' ? asnOf(site) : null;
  var to = may('approve') ? ((tk && tk.to) || '') : '';
  var lines = (compact ? L.slice(-3) : L).map(chLineHtml).join('') || '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا رسائلَ على هذه النقطة بعد')) + '</p>';
  var box = '<div style="display:flex;gap:6px;margin-top:8px;align-items:flex-end"><textarea class="in" data-chtext="' + esc(site) + '" rows="1" aria-label="' + esc(t('محادثة النقطة')) + '" placeholder="' + esc(t('اكتب للمهندس أو للمنفِّذ…')) + '" style="flex:1;min-height:40px"></textarea>'
    + btn('\u27A4', 'btn-primary btn-sm', ' data-chsend="' + esc(site) + '" data-chto="' + esc(to) + '" aria-label="' + esc(t('أرسل')) + '"') + '</div>'
    + (to ? '<p class="hint" style="margin:4px 0 0">' + esc(t('إلى')) + ': ' + esc(dispName(to) || to) + '</p>' : '');
  return card('\u{1F4AC} ' + t('محادثة النقطة') + (L.length ? ' \u00b7 ' + nm(L.length) : ''), '<div data-chthread="' + esc(site) + '">' + lines + '</div>' + box + (compact && L.length > 3 ? '<p class="hint" style="margin:4px 0 0">' + btn(t('المحادثةُ كاملة'), 'btn-quiet btn-sm', ' data-chopen="' + esc(site) + '"') + '</p>' : ''));
}
function chPageHtml(){
  var all = chMsgs().filter(chVisible), me = STATE.meta.name || '';
  var f = chPageHtml.f || {}, site = f.site || '', who = f.who || '';
  var L = all.filter(function(v){ return (!site || v.site === site) && (!who || v.from === who || v.to === who); }).slice(-200);
  var sites = {}; all.forEach(function(v){ if (v.site) sites[v.site] = (sites[v.site] || 0) + 1; });
  var people = {}; all.forEach(function(v){ [v.from, v.to].forEach(function(n){ if (n && n !== me) people[n] = 1; }); });
  var chips = '<div class="chips" style="margin:0 0 8px">' + btn(t('الكلّ'), 'chip' + (!site && !who ? ' on' : ''), ' data-chf="all"')
    + Object.keys(sites).sort(function(a, b){ return sites[b] - sites[a]; }).slice(0, 12).map(function(s){ var x = siteFind(s); return btn((x ? siteKey(x) : s) + ' \u00b7 ' + nm(sites[s]), 'chip' + (site === s ? ' on' : ''), ' data-chf="site:' + esc(s) + '"'); }).join('')
    + Object.keys(people).slice(0, 12).map(function(n){ return btn('\u{1F464} ' + (dispName(n) || n), 'chip' + (who === n ? ' on' : ''), ' data-chf="who:' + esc(n) + '"'); }).join('') + '</div>';
  var names = (typeof techsList === 'function' ? techsList().map(function(x){ return x.n; }) : []).concat(Object.keys(STATE.users || {}).map(function(k){ return (STATE.users[k] || {}).name; })).filter(function(n, i, a){ return n && n !== me && a.indexOf(n) === i; });
  var compose = '<div class="grid cols-2" style="gap:6px;margin-bottom:6px"><select class="in" data-chto-sel="1" aria-label="' + esc(t('إلى')) + '"><option value="">' + esc(t('إلى: الفريق كلِّه')) + '</option>' + names.map(function(n){ return '<option value="' + esc(n) + '"' + (who === n ? ' selected' : '') + '>' + esc(dispName(n) || n) + '</option>'; }).join('') + '</select>'
    + '<input class="in" data-chsite-in="1" list="chSites" aria-label="' + esc(t('النقطة (اختياري)')) + '" placeholder="' + esc(t('النقطة (اختياري)')) + '" value="' + esc(site) + '"><datalist id="chSites">' + Object.keys(sites).map(function(s){ return '<option value="' + esc(s) + '">'; }).join('') + '</datalist></div>'
    + '<div style="display:flex;gap:6px;align-items:flex-end"><textarea class="in" data-chtext="*" rows="2" aria-label="' + esc(t('رسالة…')) + '" placeholder="' + esc(t('رسالة…')) + '" style="flex:1"></textarea>' + btn('\u27A4 ' + t('أرسل'), 'btn-primary', ' data-chsend="*"') + '</div>';
  var feed = L.length ? L.map(function(v){ return (v.site ? '<div class="hint" style="margin:6px 0 0;font-size:11px">\u{1F4CD} ' + btn(esc(v.site), 'btn-quiet btn-sm', ' data-site="' + esc(v.site) + '"') + '</div>' : '') + chLineHtml(v); }).join('') : '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا رسائلَ بعد — اكتب أوّلَ رسالة')) + '</p>';
  chSeen();
  return stats([['الرسائل', N(all.length)], ['نقاط عليها محادثة', N(Object.keys(sites).length)], ['أشخاص', N(Object.keys(people).length)]])
    + card('\u270F ' + t('رسالة جديدة'), compose)
    + cardFlush(t('المحادثات') + (L.length ? ' \u00b7 ' + nm(L.length) : ''), chips + '<div style="padding:0 10px 10px">' + feed + '</div>')
    + '<p class="hint">' + esc(t('كلُّ رسالةٍ سطرٌ لا يُمحى ولا يُعدَّل — وحفظُ التركيب واعتمادُه وردُّه يكتبون سطورَهم هنا وحدَهم.')) + '</p>';
}
