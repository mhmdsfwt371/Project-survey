/* (V38.90) moved by scripts/split-late.mjs from src/05-map/05-lifecycle-map-13-ministry-followup.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function mfuFetch(force){
  if (!force && (MFU.v || Date.now() - MFU.at < 600000)) return;
  if (!FB.ready || !FB.db){ MFU.v = MFU.v || STATE.mfu || {}; return; }
  MFU.at = Date.now();
  DB.col('settings').doc('mfu').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    MFU.v = (doc && doc.exists) ? doc.data() : {}; STATE.mfu = MFU.v; if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('mfu', e, ''); });
}

function mfuInstalled(x){ var i = STATE.inss[x.id]; return !!(i && i.status === 'مُركّب'); }

function mfuLevel(p){ return p >= 75 ? ['ممتاز', 'ok'] : p >= 40 ? ['متوسط', 'wrn'] : ['ضعيف', 'bad']; }

function mfuCompanies(){
  if (DB.memo && DB.memo.cos) return DB.memo.cos;   /* (V33.7) مرةً في الرسمة */
  var obsIds = {}; mfuObstacles().forEach(function(o){ obsIds[o.x.id] = 1; });
  var by = {};
  (STATE.sites || []).forEach(function(x){
    if (x.type !== 'مخيم' || !x.co) return;
    var c = by[x.co] = by[x.co] || { co:x.co, n:0, ins:0, obs:0, sv:0, chal:0 };
    c.n++; if (mfuInstalled(x)) c.ins++; else if (obsIds[x.id]) c.obs++;
    var r1 = STATE.recs[x.id]; if (svVisited(r1)) c.sv++; if (r1 && svDone(r1) && chalKeys(r1.chals || []).some(function(k){ return k && k !== 'لا توجد تحديات'; })) c.chal++;   /* (V32.6) */   /* (V29.1) */
  });
  var res = Object.keys(by).map(function(k){ var c = by[k]; c.rem = c.n - c.ins - c.obs; c.pct = c.n ? Math.round(c.ins / c.n * 100) : 0; c.svp = c.n ? Math.round(c.sv / c.n * 100) : 0; return c; }).sort(function(a, b){ return b.pct - a.pct || b.n - a.n; });
  if (DB.memo) DB.memo.cos = res; return res;
}

function mfuKpis(){
  if (DB.memo && DB.memo.kpis) return DB.memo.kpis;   /* (V33.7) مرةً في الرسمة */
  var S = STATE.sites || [], tot = S.length, sv = 0, ins = 0, camp = 0, campIns = 0, cor = 0, corIns = 0;
  S.forEach(function(x){ var r = STATE.recs[x.id]; if (svVisited(r)) sv++; var i = mfuInstalled(x); if (i) ins++;   /* (V32.6) */
    if (x.type === 'مخيم'){ camp++; if (i) campIns++; } else if (x.type === 'ممر'){ cor++; if (i) corIns++; } });
  var C = mfuCompanies();
  var res = { tot:tot, sv:sv, ins:ins, camp:camp, campIns:campIns, cor:cor, corIns:corIns, obs:mfuObstacles().length,
           ex:C.filter(function(c){ return c.pct >= 75; }).length, md:C.filter(function(c){ return c.pct >= 40 && c.pct < 75; }).length, wk:C.filter(function(c){ return c.pct < 40; }).length,
           chal:mfuAllChal().filter(function(c){ return !mfuChalClosed(c); }).length, req:mfuList('req').filter(function(x){ return mfuReqView(x).st !== 'منجز'; }).length }; if (DB.memo) DB.memo.kpis = res; return res;
}

/* لقطةُ الأسبوع: تُكتَب مرةً في الأسبوع حين يفتح المكتبُ الملخّص — ومنها المقارنة */
function mfuSnapMaybe(K){
  if (!may('settings') || !FB.ready || !FB.db) return;   /* على القاعدة الحقيقية فقط */
  var k = mfuWeekKey(), snap = mfuData().snap || {};
  if (snap[k]) return;
  mfuPut('snap', k, { sv:K.sv, srv:stageCounts().srv, ins:K.ins, campIns:K.campIns, corIns:K.corIns, obs:K.obs, at:Date.now() });   /* (V37.2) والمسحُ الفعليُّ يُلتقَط أيضًا */
}

function mfuPrev(){
  var k = mfuWeekKey(), snap = mfuData().snap || {}, keys = Object.keys(snap).filter(function(x){ return x < k; }).sort();
  return keys.length ? snap[keys[keys.length - 1]] : null;
}

function mfuDelta(cur, prev, key, lowerIsBetter){
  if (!prev || prev[key] == null) return '';
  var d = cur - prev[key]; if (!d) return '<div class="hint" style="margin:2px 0 0">' + esc(t('كالأسبوع الماضي')) + '</div>';
  var good = lowerIsBetter ? d < 0 : d > 0;
  return '<div style="margin:2px 0 0;font-size:12px;font-weight:700;color:' + (good ? '#27AE60' : '#C0392B') + '">' + (d > 0 ? '\u25B2 +' : '\u25BC ') + nm(d) + ' ' + esc(t('عن الأسبوع الماضي')) + '</div>';
}

function mfuBar(p){ var c = p >= 75 ? '#27AE60' : p >= 40 ? '#E2B33C' : '#C0392B'; return '<div class="mfu-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%;background:' + c + '"></i><b>' + nm(p) + '\u066A</b></div>'; }

/* ═══ (V29.9) متابعةٌ ديناميكيةٌ بالتفكير من جهة الوزارة ═══
   ١) ملخّصٌ تنفيذيٌّ يُكتَب من الأرقام كلَّ مرة (لا يُكتَب بيد) ويُنسَخ بضغطة ويدخل التقارير.
   ٢) «ما ينتظر الوزارة»: تصاريحُ الدخول، ومنعُ الدخول، وما لم يوجد ميدانيًّا، والمخيماتُ بلا تخصيص، واعتمادُ الإعداد — كلٌّ بقائمته وتصديره.
   ٣) المعالمُ القادمة بمواعيدها وما بقي من أيام. */
function mfuBriefText(){
  var K = mfuKpis(), P = mfuPrev(), SV = svStats(), o = SV.O, C = mfuCompanies(), n = function(v){ return nm(v); };
  var d = function(k){ return P && P[k] != null ? (K[k] - P[k]) : null; }, dsv = d('sv'), dobs = d('obs');
  var L = [];
  L.push(t('حتى') + ' ' + hijriToday() + ' (' + dayKey() + '): ' + t('تمت زيارة') + ' ' + n(o.sv) + ' ' + t('من') + ' ' + n(o.tot) + ' ' + t('موقعًا') + ' (' + n(SV.pct) + '٪)' + (dsv != null ? '، ' + t('منها') + ' ' + n(Math.max(0, dsv)) + ' ' + t('هذا الأسبوع') : '') + '.');
  L.push(t('المتبقي') + ' ' + n(o.tot - o.sv) + ' ' + t('موقعًا') + (o.unreach ? '، ' + t('وتحتاج زيارةً أخرى تقنيًا') + ' ' + n(o.unreach) : '') + (o.chal ? '، ' + t('وفي') + ' ' + n(o.chal) + ' ' + t('موقعًا تحدياتٌ مسجّلة') : '') + '.');
  L.push(t('المعوقات القائمة') + ' ' + n(K.obs) + (dobs != null ? ' (' + (dobs > 0 ? '+' : '') + n(dobs) + ' ' + t('عن الأسبوع الماضي') + ')' : '') + '. ' + (K.ins ? t('التركيب') + ': ' + n(K.ins) + ' ' + t('نقطة') + '.' : t('التركيبُ لم يبدأ بعد، والشركاتُ') + ' ' + n(C.length) + ' ' + t('في مرحلة المسح') + '.'));
  /* (V33.0) قرارُ المالك: لا «ينتظر الوزارة» ولا تصاريحَ في الملخّص — ما زير ولم يُوصَل إليه «تحتاج زيارة أخرى» */
  var nRv = (STATE.sites || []).filter(function(x){ return svNeedsRevisit(STATE.recs[x.id]); }).length;
  if (nRv) L.push(n(nRv) + ' ' + t('نقطةً') + ' ' + t('تحتاج زيارة أخرى') + '.');
  if (wbsRows().length){ var PP = wbsProjectPct(); L.push(t('الخطة') + ': ' + t('المخطّط') + ' ' + n(PP.plan) + '٪ ' + t('والفعلي') + ' ' + n(PP.act) + '٪ (' + (PP.act - PP.plan >= 0 ? '+' : '') + n(PP.act - PP.plan) + '٪).'); }   /* (V30.2) */
  var al = alAll().filter(function(a){ return a.sites.length; }).map(function(a){ return n(a.sites.length) + ' ' + a.label; });   /* (V30.1) */
  if (al.length) L.push(t('تنبيهات') + ': ' + al.join('، ') + '.');
  return L.join('\n');
}

function mfuBriefCard(){
  var tx = mfuBriefText();
  return card('\u{1F4DD} ' + t('الملخّص التنفيذي'),   /* (V30.6) العنوانُ نصٌّ صِرف — كان الوسمُ يظهر حرفيًّا */
    '<p class="hint" style="margin:0 0 6px">' + esc(t('يُكتَب من الأرقام تلقائيًّا')) + '</p><p style="margin:0 0 8px;white-space:pre-line;line-height:1.7">' + esc(tx) + '</p>' + '<div class="actions" style="margin:0">' + btn(t('نسخ'), 'btn-quiet btn-sm', ' data-briefcopy="1"') + '</div>');
}

/* (V33.0) «ما ينتظر الوزارة» (mfuMinistryCard) حُذفت بقرار المالك: لا تصاريحَ ولا «متعذّر» في عرض الوزارة — السببُ الحقيقيُّ في سجلّ النقطة وسير العمل */
function mfuMilesCard(){
  var today = dayKey(), L = mileList().map(function(m){ var d = mileDateOf(m); return { n:m.n, d:d ? dayKey(d) : '', p:Math.round(mileDone(m) * 100), late:mileLate(m) }; });
  var up = L.filter(function(x){ return x.d && x.p < 100; }).sort(function(a, b){ return a.d < b.d ? -1 : 1; }).slice(0, 4);
  if (!up.length) return card('\u{1F3C1} ' + t('المعالم القادمة'), '<p class="hint" style="margin:0">' + esc(t('لا مواعيدَ للمعالم بعد — تُحدَّد من «التخطيط ← المعالم»')) + '</p>');
  return card('\u{1F3C1} ' + t('المعالم القادمة'), table(['المعلَم', 'الموعد', 'بقي', 'الإنجاز'], up.map(function(x){
    var days = Math.round((new Date(x.d) - new Date(today)) / 864e5);
    return ['<b>' + esc(x.n) + '</b>', '<span class="num">' + esc(x.d) + '</span>', x.late ? pill(t('متأخر') + ' ' + nm(-days) + ' ' + t('يوم'), 'bad') : '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>', mfuBar(x.p)]; })));
}

/* (V37.0) قمعُ المراحل الخمس، وأسبابُ «زيارة بلا مسح» بجهاتها، وتحدياتُ التركيب الثماني بجهاتها — كلُّ رقمٍ يفتح قائمتَه */
function catEditLink(){ return (typeof may === 'function' && may('settings') && !KIOSK_ON) ? ' <button type="button" class="btn btn-quiet btn-sm" data-vcedit="1" style="margin-inline-start:6px">\u270E ' + esc(t('تعديل المسميات وجهات الدعم')) + '</button>' : ''; }

/* (V37.4) */
function phGapCard(){
  if (!STATE.meta.phFull){ photosBackfill(); return '<div class="card" style="margin:0"><div class="pid">\u{1F4F7} ' + esc(t('صور ليست على الدرايف')) + '</div><p class="hint" style="margin:0">' + esc(t('جارٍ فحصُ صور الدرايف كلِّها على هذا الجهاز — مرةً في الأسبوع.')) + '</p></div>'; }
  var by = {}, pts = 0, pics = 0;
  (STATE.sites || []).forEach(function(x){ var r = STATE.recs[x.id], g = phGap(r, x.id); if (!g) return; pts++; pics += g; var w = dispName(r.by || '—'); (by[w] = by[w] || { p:0, n:0 }); by[w].p++; by[w].n += g; });
  var devs = Object.keys(STATE.presence || {}).map(function(k){ return STATE.presence[k]; }).filter(function(d){ return d && +d.pq > 0; });
  return '<div class="card" style="margin:0"><div class="pid">\u{1F4F7} ' + esc(t('صور ليست على الدرايف')) + ' — <b class="num" data-svlist="phgap" role="button" tabindex="0">' + nm(pts) + '</b> ' + esc(t('نقطة')) + ' · ' + nm(pics) + ' ' + esc(t('صورة')) + '</div>'
    + (pts ? Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; }).map(function(w){ return '<div class="kk-zl" data-svlist="phgap" role="button" tabindex="0"><span>' + esc(w) + '</span><b>' + nm(by[w].n) + ' ' + esc(t('صورة')) + ' · ' + nm(by[w].p) + ' ' + esc(t('نقطة')) + '</b></div>'; }).join('')
      : '<p class="hint" style="margin:0">' + esc(t('كلُّ صور الزيارات على الدرايف.')) + '</p>')
    + (devs.length ? '<p class="hint" style="margin:6px 0 0">' + devs.map(function(d){ return esc(dispName(d.name || '')) + ': ' + nm(+d.pq) + ' ' + esc(t('صورة معلّقة على جهازه')) + (d.pqAge ? ' ' + esc(t('منذ')) + ' ' + nm(Math.round(d.pqAge / 60)) + ' ' + esc(t('ساعة')) : ''); }).join(' · ') + '</p>' : '')
    + '<div class="actions" style="margin:6px 0 0">' + btn('\u21BB ' + t('أعد الفحص الآن'), 'btn-quiet btn-sm', ' data-phfull="1"') + '</div></div>';
}

function stageCounts(){
  var mk = STAT_VER + '|' + (typeof CFG_VER === 'number' ? CFG_VER : 0) + '|' + (STATE.sites || []).length + '|' + Math.floor(Date.now() / 60000);   /* (V37.13) مرةً لكلِّ إصدار */
  if (stageCounts.c && stageCounts.c.k === mk) return stageCounts.c.v;
  var v = stageCounts0(); stageCounts.c = { k:mk, v:v }; return v;
}

function stageCounts0(){
  var c = { n:0, vis:0, srv:0, ins:0, hand:0, dis:0, gap:0, why:{}, tech:0, none:0, cc:{}, review:0, esc:0 };
  (STATE.sites || []).forEach(function(x){ var r = STATE.recs[x.id]; c.n++;
    if (svVisited(r)) c.vis++; if (svDone(r)) c.srv++; if (insDone(x.id)) c.ins++; if (handDone(x.id)) c.hand++; if (disDone(x.id)) c.dis++;
    if (svNeedsRevisit(r)){ c.gap++; if (svStuck(r)){ var w = visitWhy(r); if (w) c.why[w] = (c.why[w] || 0) + 1; else c.none++; if (stuckEsc(r)) c.esc++; } else c.tech++; }
    chalCats(r).forEach(function(k){ if (k === 'review') c.review++; else c.cc[k] = (c.cc[k] || 0) + 1; }); });
  return c;
}

function stageRings(c){
  return kioskRing(c.vis, c.n, 'الزيارة', 'sv', 'rem') + kioskRing(c.srv, c.n, 'المسح', 'srv', 'srvr') + kioskRing(c.ins, c.n, 'التركيب', 'insd', 'insr')
    + kioskRing(c.hand, c.n, 'التسليم', 'hand', 'handr') + kioskRing(c.dis, c.n, 'الفك', 'disd', 'disr');
}

function stageFunnel(c){
  var S = [['الزيارة', c.vis, 'sv'], ['المسح', c.srv, 'srv'], ['التركيب', c.ins, 'insd'], ['التسليم', c.hand, 'hand'], ['الفك', c.dis, 'disd']];
  return '<div class="card" style="margin:0"><div class="pid">' + esc(t('قمع المراحل — من الزيارة إلى الفك')) + '</div>'
    + S.map(function(s, i){ var p = c.n ? Math.round(s[1] / c.n * 100) : 0, prev = i ? S[i - 1][1] : 0, conv = i && prev ? Math.round(s[1] / prev * 100) : null;
        return '<div class="fn-row" data-svlist="' + s[2] + '" role="button" tabindex="0"><span class="fn-l">' + esc(t(s[0])) + '</span>'
          + '<span class="fn-bar"><i style="width:' + Math.max(p ? 2 : 0, p) + '%"></i></span><b class="num">' + nm(s[1]) + '</b>'
          + '<span class="hint" style="margin:0;min-width:64px;text-align:end">' + (conv == null ? '' : nm(conv) + '٪ ' + esc(t('من السابقة'))) + '</span></div>'; }).join('')
    + '</div>';
}

function supRowHtml(r){
  var who = supParties(r[1]) || '\u2014';
  var lab = esc(t('جهة الدعم المطلوب')) + ': ' + esc(t(who));
  return '<div class="kk-zl" data-svlist="' + r[3] + '" role="button" tabindex="0"><span>' + esc(t(r[0])) + '<br>'
    + (KIOSK_ON ? '<small class="hint" style="margin:0">' + lab + '</small>'
      : '<small class="hint" style="margin:0"><a href="#" data-supq="' + esc(r[4]) + '" style="color:inherit;text-decoration:underline dotted">' + lab + ' \u24D8</a></small>')
    + '</span><b>' + nm(r[2]) + '</b></div>';
}

/* (V37.14) نافذةُ جهة الدعم المفتوحة */
function supPopHtml(){ return SUP_POP ? supPanel(SUP_POP) : ''; }

function supPanel(ref){
  var p = String(ref || '').split('|'), o = p[0] === 'why' ? whyOf(p[1]) : p[0] === 'cc' ? ccOf(p[1]) : SUP_EXTRA[p[1]];
  if (!o) return '';
  var L = supOf(o);
  return '<div id="supVeil" data-supclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2004"></div>'
    + '<div id="supBox" role="dialog" aria-modal="true" style="position:fixed;z-index:2005;top:12vh;left:50%;transform:translateX(-50%);width:min(560px,92vw);max-height:78vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.45)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">' + esc(t('جهة الدعم المطلوب')) + '</h3>' + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-supclose="1"') + '</div>'
    + '<p class="hint" style="margin:8px 0">' + esc(t(o.n)) + '</p>'
    + (L.length ? table(['الجهة', 'نوع الدعم المطلوب'], L.map(function(x){ return [esc(t(x.p)), esc(t(x.s || '\u2014'))]; })) : '<p class="hint">' + esc(t('لم تُحدَّد جهةٌ بعد.')) + '</p>')
    + (typeof may === 'function' && may('settings') && !KIOSK_ON ? '<div class="actions" style="margin:10px 0 0">' + btn('\u270E ' + t('تعديل الجهات ونوع الدعم'), 'btn-quiet btn-sm', ' data-vcedit="1"') + '</div>' : '')
    + '</div>';
}

function gapCard(c){
  var rows = whyList().map(function(o){ return [o.n, o, c.why[o.k] || 0, 'why_' + o.k, 'why|' + o.k]; });
  rows.push(['تحتاج زيارة أخرى — أعادها المهندس', SUP_EXTRA.tech, c.tech, 'why_tech', 'x|tech']);
  if (ROLE !== 'viewer' && c.none) rows.push(['بلا سبب مسجّل — يصنّفه المهندس', SUP_EXTRA.none, c.none, 'why_none', 'x|none']);
  return '<div class="card" style="margin:0"><div class="pid">' + esc(t('زيارة بلا مسح')) + ' — <b class="num" data-svlist="gap" role="button" tabindex="0">' + nm(c.gap) + '</b>' + catEditLink() + '</div>'
    + rows.filter(function(r){ return r[2]; }).map(supRowHtml).join('')
    + (c.esc ? '<div class="kk-zl" data-svlist="esc" role="button" tabindex="0" style="color:#E05252"><span>\u26A0 ' + esc(t('متوقفة — ثلاثُ محاولاتٍ أو عشرةُ أيامٍ بلا مسح')) + '</span><b>' + nm(c.esc) + '</b></div>' : '')
    + (c.gap ? '' : '<p class="hint" style="margin:0">' + esc(t('كلُّ ما زرناه مُسح.')) + '</p>') + '</div>';
}

function ccGroupCounts(){   /* (V37.64) توحيد: كانت النقطةُ ذاتُ التحديين تُعَدّ في مجموعتين — الآن مرةً بأهمِّ تحدٍّ فيها */
  var mk = STAT_VER + '|' + (typeof CFG_VER === 'number' ? CFG_VER : 0); if (ccGroupCounts.c && ccGroupCounts.c.k === mk) return ccGroupCounts.c.v;
  var out = { make:0, study:0, owner:0, access:0 }; (STATE.sites || []).forEach(function(x){ var g = mtGrpOf(x.id); if (g) out[g]++; });
  ccGroupCounts.c = { k:mk, v:out }; return out;
}

function ccGroupsHtml(){
  var C = ccGroupCounts(), tot = CC_GROUPS.reduce(function(a, G){ return a + (C[G.g] || 0); }, 0); if (!tot) return '';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 10px">' + CC_GROUPS.map(function(G){
    return '<div class="card" style="margin:0;padding:10px"><div class="num" style="font-size:22px;font-weight:700">' + nm(C[G.g] || 0) + '</div><div style="font-weight:600">' + esc(t(G.n)) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t(G.who)) + '</div></div>';
  }).join('') + '</div>';
}

function ccCard(c){
  var rows = ccList().map(function(o){ return [o.n, o, c.cc[o.k] || 0, 'cc_' + o.k, 'cc|' + o.k]; }).filter(function(r){ return r[2]; }).sort(function(a, b){ return b[2] - a[2]; });
  if (ROLE !== 'viewer' && c.review) rows.push(['يراجع المهندسُ تصنيفَه', SUP_EXTRA.review, c.review, 'cc_review', 'x|review']);
  return '<div class="card" style="margin:0"><div class="pid">' + esc(t('تحديات التركيب بفئاتها')) + catEditLink() + '</div>'
    + '<div class="hint" style="margin:0 0 6px">' + esc(t('من عليه الدور — بالمجموعات الأربع، والتفصيلُ بالفئات تحتها')) + '</div>' + ccGroupsHtml()   /* (V37.29) */
    + (rows.length ? rows.map(supRowHtml).join('')
      : '<p class="hint" style="margin:0">' + esc(t('لا تحدّيَ مسجَّلًا بعد.')) + '</p>') + '</div>';
}

function mfuHeroHtml(){
  var all = STATE.sites || [], n = all.length, sv = 0, ins = 0, hd = 0, ds = 0, now = Date.now(), today = dayKey(now);
  var SC = stageCounts();
  all.forEach(function(x){ if (svVisited(STATE.recs[x.id])) sv++; if (insDone(x.id)) ins++; if (handDone(x.id)) hd++; if (disDone(x.id)) ds++; });
  /* نبضُ ١٤ يومًا من السجلات مباشرةً — مرورٌ واحد */
  var days = [], byDay = {}; for (var i = 13; i >= 0; i--){ var k = dayKey(now - i * 864e5); days.push(k); byDay[k] = 0; }
  Object.keys(STATE.recs).forEach(function(id){ var r = STATE.recs[id]; if (!svVisited(r) || !siteFind(id)) return; var k = dayKey(r.at || r._at); if (byDay[k] != null) byDay[k]++; });
  var vals = days.map(function(k){ return byDay[k]; }), mx = Math.max(1, Math.max.apply(null, vals)), wk = vals.slice(7).reduce(function(a, b){ return a + b; }, 0), prev = vals.slice(0, 7).reduce(function(a, b){ return a + b; }, 0);
  var W = 280, H = 56, bw = W / 14;
  var bars = vals.map(function(v, i){ var h = Math.max(2, Math.round(v / mx * (H - 14))); return '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h + '" rx="2" fill="' + (i === 13 ? 'var(--min-gold)' : 'var(--min-green)') + '" opacity="' + (i < 7 ? '.45' : '.9') + '"><title>' + esc(days[i]) + ': ' + nm(v) + '</title></rect>'; }).join('');
  var spark = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:56px;display:block" aria-label="' + esc(t('الزيارات الميدانية يومًا بيوم — آخر ١٤ يومًا')) + '">' + bars + '</svg>';
  var trend = prev ? Math.round((wk - prev) / prev * 100) : (wk ? 100 : 0);
  /* توقّعُ اكتمال أكبر مشعر */
  var K = siteKeyStats(), zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }), z0 = zones[0], f = z0 ? zoneForecast(z0) : null, fc = '';
  if (f && f.eta) fc = t(z0) + ' ' + t('يكتمل نحو') + ' ' + dayKey(f.eta) + (f.due ? ' (' + (f.due >= f.eta ? t('قبل الموعد بـ') + ' ' + nm(Math.round((f.due - f.eta) / 864e5)) : t('بعد الموعد بـ') + ' ' + nm(Math.round((f.eta - f.due) / 864e5))) + ' ' + t('يومًا') + ')' : '');
  else if (f && f.stalled) fc = t(z0) + ' ' + t('بلا وتيرةٍ منذ أسبوعين');
  /* أقربُ معلَمٍ قادم */
  var next = null; try { (mileList() || []).forEach(function(m){ var d = mileDateOf(m); if (d && d >= now && (!next || d < next.d)) next = { d:d, n:m.n || m.name || m.t || '' }; }); } catch (e){ LS_ERR = e; }
  var dd = dayDone(today); dd.hand = 0;   /* (V34.3) التسليمُ اليوم من محضر التسليم في سجلّ التركيب */
  Object.keys(STATE.inss || {}).forEach(function(k){ var h = STATE.inss[k] && STATE.inss[k].hand; if (h && dayKey(h.at || h.ts || 0) === today) dd.hand++; });
  /* أبرزُ ثلاثة تحديات */
  var byCh = {}; (STATE.sites || []).forEach(function(x){ var r0 = STATE.recs[x.id]; if (!svDone(r0)) return; chalCats(r0).forEach(function(k){ if (k === 'review' || !ccOf(k)) return; var nn = ccOf(k).n; byCh[nn] = (byCh[nn] || 0) + 1; }); });   /* (V37.3) الفئاتُ الثماني */
  var top = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; }).slice(0, 3);
  return '<div class="mfu-hero">'
    + '<div class="mfu-hero-band"><div><div class="mfu-hero-t">' + esc(t('موجز الموسم')) + '</div><div class="hint" style="margin:0">' + esc(hijriToday()) + ' \u00b7 ' + esc(today) + '</div></div>'
    +   '<div class="mfu-hero-today"><span>' + esc(t('اليوم')) + '</span> <b>' + nm(dd.sv) + '</b> ' + esc(t('مسح')) + ' \u00b7 <b>' + nm(dd.ins) + '</b> ' + esc(t('تركيب')) + ' \u00b7 <b>' + nm(dd.hand) + '</b> ' + esc(t('تسليم')) + ' \u00b7 <b>' + nm(dd.dis) + '</b> ' + esc(t('فك'))   /* (V34.3) الأربعةُ يومًا بيوم */
    +     (next ? ' \u00b7 <span title="' + esc(next.n) + '">' + esc(t('أقرب معلَم')) + ' <b>' + nm(Math.max(0, Math.round((next.d - now) / 864e5))) + '</b> ' + esc(t('يومًا')) + '</span>' : '') + '</div></div>'
    + '<div class="kk kk-mini"><div class="kk-rings">'
    +   stageRings(SC)   /* (V37.0) خمسُ مراحل: الزيارة والمسح والتركيب والتسليم والفك */
    + '</div></div>'
    + '<div class="mfu-hero-grid">'
    +   '<div class="card" style="margin:0"><div class="pid">' + esc(t('مسار العمل الميداني — آخر ١٤ يومًا')) + '</div>' + spark
    +     '<div class="hint" style="margin:6px 0 0">' + esc(t('هذا الأسبوع')) + ' <b>' + nm(wk) + '</b> ' + esc(t('زيارة')) + ' (' + (trend >= 0 ? '+' : '') + nm(trend) + '٪ ' + esc(t('عن الأسبوع الماضي')) + ')' + (fc ? ' \u00b7 ' + esc(fc) : '') + '</div></div>'
    +   stageFunnel(SC) + gapCard(SC) + ccCard(SC)   /* (V37.0) */
    +   (ROLE !== 'viewer' ? phGapCard() : '')   /* (V37.8) للمهندس: صورٌ ليست على الدرايف */
    + '</div></div>';
}

/* ═══ (V37.49) صفحةٌ واحدةٌ بوضعين — قرارُ المالك: شاشةُ القاعة نسخةٌ ثانيةٌ من المتابعة لا صفحةٌ مكرَّرة ═══
   «📊 متابعة» للاجتماع والتفاعل، و«🖥 عرض القاعة» الصفحةُ نفسُها بملء الشاشة وخطٍّ كبيرٍ وتنقّلٍ تلقائيّ. وما كان في القاعة وحدَها
   (الخلاصة، المشاعر، التوقّع، آخر ٢٤ ساعة) صار في الملخّص — وكلُّ رقمٍ يُضغط فيفتح لوحةً ثم إكسلًا بالتفاصيل (قاعدةُ المالك). */
function mfuModeBar(){
  return '<div class="card mfu-mode" style="margin:0 0 12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'
    + '<div><b>' + esc(t('متابعة الوزارة — الملخّص')) + '</b><div class="hint" style="margin:2px 0 0">' + esc(t('نفسُ الصفحة بوضعين: للاجتماع هنا، وللقاعة بملء الشاشة.')) + '</div></div>'
    + '<div class="chips" style="margin:0"><button type="button" class="chip on" aria-pressed="true">\u{1F4CA} ' + esc(t('متابعة')) + '</button><button type="button" class="chip" data-kiosk="1" title="' + esc(t('يملأ الشاشةَ ويتنقّل بين الأقسام بنفسه كلَّ خمسَ عشرةَ ثانية')) + '">\u{1F5A5} ' + esc(t('عرض القاعة')) + '</button>' + '<button type="button" class="chip" data-hallcopy="1" title="' + esc(t('رابطٌ يفتح عرضَ القاعة وحدَه على جهاز القاعة')) + '">\u{1F517} ' + esc(t('رابط القاعة')) + '</button></div></div>';
}

function mfuStoryCard(){
  var st = ''; try { st = kioskStory(); } catch (e){ LS_ERR = e; }
  if (!st) return '';
  return '<div class="card mfu-story" data-svlist="sv" role="button" tabindex="0" style="margin:0 0 12px;border-inline-start:4px solid var(--acc,#2E86DE);cursor:pointer" title="' + esc(t('اضغط للوحة التفاصيل والتصدير')) + '"><div class="pid">' + esc(t('الخلاصة')) + '</div><p style="margin:4px 0 0;line-height:1.8">\u{1F50E} ' + esc(st) + ' \u203A</p></div>';
}

function mfuHallCards(){
  var K = siteKeyStats(), now = Date.now(), day = now - 864e5;
  var zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }), zoneMax = zones.length ? K.zones[zones[0]].n : 1;
  var zonesHtml = zones.map(function(z){ var o = K.zones[z], p = o.n ? Math.round(o.sv / o.n * 100) : 0;
    return '<div class="kk-zone mfu-zone" data-svlist="sv" data-svzone="' + esc(z) + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط: لوحة المشعر وتصديره')) + '"><div class="kk-zl"><b>' + esc(t(z)) + ' \u203A</b><span>' + nm(o.sv) + ' / ' + nm(o.n) + ' \u00b7 <b>' + nm(p) + '\u066A</b></span></div>'
      + '<div class="kk-bar" style="width:' + Math.max(12, Math.round(o.n / zoneMax * 100)) + '%"><i style="width:' + p + '%"></i></div><div class="kk-fc">' + forecastHtml(z) + '</div></div>'; }).join('');
  var steps = (STATE.steps || []).filter(function(x){ return +x.at >= day; }), kinds = {}, people = {};
  steps.forEach(function(x){ kinds[x.kind] = (kinds[x.kind] || 0) + 1; if (x.by) people[x.by] = 1; });
  var KN = { visit:'زيارة', ins:'تركيب', dis:'فكّ', newsite:'موقعٌ جديد', maint:'صيانة', deliver:'تسليم' }, KL = { visit:'sv', ins:'insd', dis:'disd', deliver:'hand', newsite:'sv', maint:'insd' };
  var dayHtml = steps.length ? '<div class="kk-kinds">' + Object.keys(kinds).map(function(k){ return '<div class="kk-kind" data-svlist="' + esc(KL[k] || 'sv') + '" role="button" tabindex="0" style="cursor:pointer"><div class="kk-big">' + nm(kinds[k]) + '</div><div class="kk-lab">' + esc(t(KN[k] || k)) + ' \u203A</div></div>'; }).join('')
      + '<div class="kk-kind"><div class="kk-big">' + nm(Object.keys(people).length) + '</div><div class="kk-lab">' + esc(t('فنيين')) + '</div></div></div>' : '<p class="hint" style="margin:0">' + esc(t('لا خطوةَ مرفوعةً في آخر أربعٍ وعشرين ساعة.')) + '</p>';
  return '<div class="mfu-hall" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin:0 0 12px">'
    + '<div class="card" style="margin:0"><div class="pid">' + esc(t('المشاعرُ — كم أُنجز وكم بقي')) + '</div>' + zonesHtml + '</div>'
    + '<div class="card" style="margin:0"><div class="pid">' + esc(t('شغلُ الميدان — آخر أربعٍ وعشرين ساعة')) + '</div>' + dayHtml + '</div></div>';
}

function mfuSummary(){
  /* (V32.5) طلبُ المالك: «أول حاجة في الملخّص من نسبة المسح» — البطاقاتُ أولًا وكلُّ بطاقةٍ تُضغَط فتفتح قائمتَها وتصديرَها؛
     وبطاقتا «النقاط بلا عوائق ولا تحديات» و«النقاط ذات التحديات» لكلِّ الأنواع؛ و«بانتظار قرار الوزارة» شيلت؛
     والملخّصُ التنفيذيُّ وما ينتظر الوزارة والتنبيهاتُ والمعالمُ والخطةُ تحت الصفحة. */
  var K = mfuKpis(), P = mfuPrev(); mfuSnapMaybe(K);
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var box = function(key, lbl, val, sub, dl, color){ return '<div class="mfu-kpi" data-svlist="' + esc(key) + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"><div class="mfu-kpi-l">' + esc(t(lbl)) + ' \u203A</div><div class="mfu-kpi-v"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</div>' + (sub ? '<div class="hint" style="margin:2px 0 0">' + sub + '</div>' : '') + (dl || '') + '</div>'; };
  var nClean = svListCount('clean'), nChal = svListCount('chal');   /* (V33.7) عدٌّ لا بناءُ صفوف */
  return (svListPop() + supPopHtml()) + mtWPopHtml() + mfuModeBar() + mtAlertsHtml() + mfuStoryCard() + mfuHeroHtml()   /* (V37.65) تنبيهاتُ الأسبوع */   /* (V33.8) موجزُ الموسم أوّلًا */
    + '<div class="kk mfu-obs" style="margin:0 0 12px">' + kioskObsHtml() + '</div>'   /* (V37.50) «النقاط بعوائق وبدونها» بكلِّ نوع — أوّلُ لقطات المالك، كانت في القاعة وحدَها */
    + mfuHallCards()   /* (V37.49) المشاعرُ والتوقّعُ وآخرُ ٢٤ ساعة — كانت في شاشة القاعة وحدَها */
    + '<div class="mfu-kpis">'
    /* (V37.2 ق-٠١٥) «نسبةُ المسح» = ما مُسح فعلًا؛ والزياراتُ بجوارها — كانت تعرض الزياراتِ باسم المسح */
    + (function(){ var SCk = stageCounts(); return box('srv', 'نسبة المسح', nm(pc(SCk.srv, K.tot)) + '\u066A', esc(t('تم المسح')) + ' ' + nm(SCk.srv) + ' ' + esc(t('من')) + ' ' + nm(K.tot) + ' \u00b7 ' + esc(t('الزيارات')) + ' ' + nm(K.sv), (P && P.srv != null) ? mfuDelta(SCk.srv, P, 'srv') : mfuDelta(K.sv, P, 'sv'))   /* اللقطاتُ القديمةُ بلا مسحٍ فعليّ: تُقارَن الزيارات */
      + box('gap', 'زيارة بلا مسح', nm(SCk.gap), esc(t('بأسبابها وجهة حلّ كلٍّ منها')), '', SCk.gap ? '#C0392B' : '#27AE60'); })()
    + box('clean', 'نقاط بلا عوائق', nm(nClean), esc(t('تمت الزيارة وتم الوصول بلا تحديات — كلُّ الأنواع')), '', '#27AE60')
    + box('chal', 'نقاط بعوائق', nm(nChal), esc(t('تمت الزيارة وفيها تحدٍّ أو تحتاج زيارة أخرى')), '', '#C0392B')
    + box('obs', 'المعوقات القائمة', nm(K.obs), esc(t('تحدياتٌ أو تعذّرُ وصولٍ على نقاطٍ لم تُركَّب')), mfuDelta(K.obs, P, 'obs', true))
    + box('campok', 'مخيمات بلا عائق', nm(svListCount('campok')), esc(t('تمت الزيارة وتم الوصول بلا تحديات')), '', '#27AE60')
    + box('campins', 'تركيب المخيمات', nm(pc(K.campIns, K.camp)) + '\u066A', nm(K.campIns) + ' ' + esc(t('من')) + ' ' + nm(K.camp), mfuDelta(K.campIns, P, 'campIns'))
    + (function(){ var PS = pilotSites(); if (!PS.length) return ''; var ni = PS.filter(function(x){ var i = STATE.inss[x.id]; return i && i.status && i.status !== 'مسودّة'; }).length, on = PS.filter(function(x){ return pilotNet(x).st === 'متصل'; }).length;   /* (V37.80) كارتُ التجارب */
        return box('pilot', 'التجارب والديمو', nm(PS.length), esc(t('رُكّب')) + ' ' + nm(ni) + ' \u00b7 ' + esc(t('متصل')) + ' ' + nm(on), '', on < ni ? '#E2B33C' : '#2E86DE'); })()
    + box('corins', 'تركيب الممرات', nm(pc(K.corIns, K.cor)) + '\u066A', nm(K.corIns) + ' ' + esc(t('من')) + ' ' + nm(K.cor), mfuDelta(K.corIns, P, 'corIns'))
    + (K.ins ? box('cos', 'شركات الخدمة', '<span style="color:#27AE60">' + nm(K.ex) + '</span> \u00b7 <span style="color:#E2B33C">' + nm(K.md) + '</span> \u00b7 <span style="color:#C0392B">' + nm(K.wk) + '</span>', esc(t('ممتاز · متوسط · ضعيف')), '')
             : box('cos', 'شركات الخدمة', nm(mfuCompanies().length), esc(t('مرحلة المسح — لم يبدأ التواصل والتركيب')), ''))
    + box('chalo', 'تحدياتٌ مفتوحة', nm(K.chal), esc(t('مسجّلةٌ في المتابعة')), '') + box('req', 'طلباتٌ قيد المتابعة', nm(K.req), '', '')
    + '</div>' + (P ? '' : '<p class="hint">' + esc(t('المقارنةُ بالأسبوع الماضي تبدأ من الأسبوع القادم — تُحفَظ لقطةُ هذا الأسبوع الآن.')) + '</p>')
    + mfuBlocksCard() + mfuOwnersCard() + mfuWeeksCard() + mfuTimelineCard()
    + mfuBriefCard() + alCard() + mfuMilesCard() + wbsPlanCard();   /* (V33.0) «ما ينتظر الوزارة» شيلت: لا تصاريحَ في العرض */
}

function mfuWeekRows(){
  return wtRows().slice().sort(function(a, b){ var o = { 'متوقف':0, 'جاري العمل':1, 'قيد الانتظار':2, 'مكتمل':3 }; return (o[a.st] - o[b.st]) || String(a.due || '9').localeCompare(String(b.due || '9')); }).map(function(r){
    var last = (Array.isArray(r.log) ? r.log : []).filter(function(e){ return e && e.note; })[0];
    return { r:r, upd:(last && last.note) || r.upd || '', late:wtLate(r) };
  });
}

function mfuTasks(){
  var W = mfuWeekRows(), L = mileList();
  var stp = function(r, late){ return pill(t(r.st), r.st === 'مكتمل' ? 'ok' : r.st === 'متوقف' || late ? 'bad' : r.st === 'جاري العمل' ? 'wrn' : ''); };
  return (W.length ? cardFlush(t('حالة أبرز المهام') + ' \u2014 ' + nm(W.length), table(['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث'], W.map(function(x){
      var r = x.r;
      return ['<b>' + esc(r.n) + '</b>' + (r.chal ? '<div class="hint" style="margin:2px 0 0;color:' + (r.st === 'مكتمل' ? '#27AE60' : '#C0392B') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('تم حلُّ التحدي')) : '\u26A0 ' + esc(t('معالجةُ تحدٍّ'))) + '</div>' : ''),
              esc(r.track || '\u2014'), esc(r.who || '\u2014'), stp(r, x.late) + (x.late ? ' ' + pill(t('متأخرة'), 'bad') : ''), esc(r.due || '\u2014'), esc(String(x.upd).slice(0, 90))];
    }))) : '<p class="hint">' + esc(t('لا مهامَّ أسبوعيةٌ بعد — تُضاف من «المهام الأسبوعية».')) + '</p>')
    + cardFlush(t('المعالم'), table(['المعلم', 'الموعد', 'الإنجاز', 'الحالة'], L.map(function(m){
        var p = Math.round(mileDone(m) * 100), late = mileLate(m), d = mileDateOf(m);
        var st = p >= 100 ? ['مكتمل', 'ok'] : late ? ['متأخر', 'bad'] : p > 0 ? ['جارٍ', 'wrn'] : ['لم يبدأ', ''];
        return ['<b>' + esc(t(m.n)) + '</b>', d ? esc(fmtDate(d)) : '\u2014', mfuBar(p), pill(t(st[0]), st[1])];
      })));
}

function mfuInst(){
  var Z = {};
  (STATE.sites || []).forEach(function(x){ var k = x.zone + '|' + x.type; var o = Z[k] = Z[k] || { z:x.zone, ty:x.type, n:0, i:0 }; o.n++; if (mfuInstalled(x)) o.i++; });
  var rows = Object.keys(Z).map(function(k){ return Z[k]; }).sort(function(a, b){ return a.z < b.z ? -1 : a.z > b.z ? 1 : b.n - a.n; });
  return cardFlush(t('حالة التركيبات'), table(['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة'], rows.map(function(o){
    var p = o.n ? Math.round(o.i / o.n * 100) : 0, d = CAT_DEF[o.ty] || { l:o.ty, i:'' };
    return [esc(t(o.z)), (d.i || '') + ' ' + esc(t(d.l)), N(o.n), N(o.i), mfuBar(p)];
  })));
}

/* (V37.4) قوائمُ الأسباب والفئات تُبنى عند الطلب — فالمسمّى المعدَّلُ والبندُ المضافُ لهما قائمتُهما أيضًا */
function svDynList(key){
  var m = /^why_(.+)$/.exec(key); if (m && m[1] !== 'tech' && m[1] !== 'none'){ var o = whyOf(m[1]); return o ? [o.n, function(x, r){ return svStuck(r) && visitWhy(r) === o.k; }] : null; }
  m = /^cc_(.+)$/.exec(key); if (m && m[1] !== 'review'){ var c = ccOf(m[1]); return c ? [c.n, function(x, r){ return chalCats(r).indexOf(c.k) > -1; }] : null; }
  return null;
}
