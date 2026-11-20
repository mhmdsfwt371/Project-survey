/* ============================================================================
   FILE    : src/04-office/04-tasks-office-23-tafweej.js
   DOMAIN  : Office — «اعتماد إدارة التفويج» (V44.2): approval on the map, the point's criterion, the dashboard
   PURPOSE : The tafweej management approves or rejects the corridor points of Mina and Arafat from the point's card on the
             map (a reason and a comment for a rejection), adds a replacement when a point is in the wrong place, and follows it
             all in «متابعة الوزارة ← اعتمادات إدارة التفويج». Every corridor point's card says WHY the point is there: for Mina,
             its place in the tafweej management's 1447 file (PV.TAF1447) or that it completes those paths this season; for
             Arafat, the paths to Namirah Mosque, Jabal al-Rahma and the train, with the purpose chosen per point.
   DEFINES : tafCatReg, tafListReg, tafNearLines, PV.TAF_PAIR_M, tafPending, PV.TAF_DOCS, PV.TAF_METHOD, PV.TAF_SPECS, tafSpecsHtml, PV.TAF_STAGE, tafStage, tafRefMay, tafRefParse, tafRefImport, tafRefApply, tafRefLoad, tafRefHtml, tafPlanParse, tafPlanImport, tafPlanSet, tafPlanPop, tafPlanDash, tafPlanCount, tafPlanListReg, tafPlanBar, tafPlanXlsx, tafCats, tafStageBar, tafCatDash, tafCatXlsx, tafSave, tafSites, tafCrit, tafCritHtml, tafPopHtml, tafDash, tafXlsx, tafLayerToggle, tafLayerSync, clickTafweej
   NOTE    : The scope, the decision and the gate are in core (03-survey-records-05: PV.TAF_SCOPE, tafInScope, tafOf,
             tafDecision, tafMay, minState). Decisions live in settings/tafappr (one live document).
   ============================================================================ */
PV.TAF_PUR = ['مسجد نمرة', 'جبل الرحمة', 'تفويج القطار'];
PV.TAF_COL = { ok:'#22C55E', no:'#E5484D', '':'#94A3B8' };

/* decisions queued on this device and not uploaded yet (kind cfg, id tafappr) */
function tafPending(){
  var it = (STATE.queue || []).filter(function(q){ return q && q.kind === 'cfg' && q.id === 'tafappr'; })[0];
  return (it && it.v && it.v.m && typeof it.v.m === 'object') ? it.v.m : {};
}
function tafSave(id, d, why, note, extra){
  if (!tafMay()){ toast(t('الاعتمادُ لإدارة التفويج والمهندس')); return false; }
  if (!tafInScope(id)){ toast(t('الاعتمادُ لنقاط الممرات في منى وعرفات')); return false; }
  if (d === 'no' && !String(note || '').trim()){ toast(t('اكتب سببَ الرفض')); return false; }
  var prev = tafOf(id) || {}, v = Object.assign({}, prev, extra || {}, { d:d, why:d === 'no' ? (why || '') : '', note:d === 'no' ? String(note || '').trim() : '' });
  if (d !== (prev.d || '') || !prev.by){ v.by = STATE.meta.name || ''; v.at = Date.now(); }   /* who decided and when — a purpose or a note added later keeps the decider */
  STATE.taf = STATE.taf || {}; STATE.taf[id] = v; if (DB.memo) DB.memo.life = null;
  /* (V45.1) QA: the decision went straight to the database, and offline (or on a dropped request) it showed as saved on the
     device and never reached anyone — the one write in the app outside the queue. It now goes through the queue like every
     other write: kept locally, retried, merged on the server; and the queued patch carries every decision still waiting
     (the queue merges a later write over an earlier one field by field — the nested map would have lost the earlier id). */
  var patch = {}; patch[id] = v;
  var pend = tafPending(); Object.keys(pend).forEach(function(k){ if (!patch[k]) patch[k] = pend[k]; });
  CORE.set('cfg', 'tafappr', { m:patch, at:Date.now() });
  if (typeof FB === 'undefined' || !FB.ready || !FB.db || (typeof navigator !== 'undefined' && navigator.onLine === false)) toast(t('حُفظ على الجهاز — يُرفَع حين يعود الاتصال'));
  var same = extra && d === (prev.d || '');
  logEvent((same ? 'تحديث معيار نقطة' : d === 'ok' ? 'اعتماد إدارة التفويج' : d === 'no' ? 'رفض إدارة التفويج' : 'تراجع عن قرار إدارة التفويج') + ' \u2014 ' + id + (v.why ? ' \u00b7 ' + v.why : '') + (v.note ? ' \u00b7 ' + v.note.slice(0, 120) : ''), id);
  PV.TAF_REJ = ''; render(1);
  return true;
}
/* the points in scope, each with its decision */
/* (V46.2) the tafweej scorecard's numbers open the detail window: one list per holy site and decision */
function tafListReg(Z){
  [['all', 'نقاطُ ممرات'], ['ok', 'معتمدة'], ['no', 'مرفوضة'], ['left', 'متبقّية']].forEach(function(k){
    var key = 'taf_' + k[0] + '|' + Z; if (MFU.lists[key]) return;
    MFU.lists[key] = { title:t(Z) + ' \u2014 ' + t(k[1]),
      base:function(){ var L = tafSites(Z).map(function(q){ return q.x; }); return { n:L.length, name:t('نقاطُ ممرات') + ' ' + t(Z), zones:svZoneTot(L) }; },
      head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
      rows:function(){
        return tafSites(Z).filter(function(q){ return k[0] === 'all' || (k[0] === 'left' ? !q.d : q.d === k[0]); }).map(function(q){
          var x = q.x, r = STATE.recs[x.id], o = q.o || {};
          return [x.id, String(x.name || ''), t(taxOf(x).g), t(taxOf(x).t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', q.d ? (o.by || '') : (r ? (r.by || '') : ''),
                  q.d === 'ok' ? t('اعتمدتها إدارة التفويج') : q.d === 'no' ? t('رفضتها إدارة التفويج') + (o.why ? ' \u2014 ' + t(o.why) : '') : t('بانتظار اعتماد إدارة التفويج')];
        });
      } };
  });
  return 'taf_';
}
function tafSites(zone){
  /* (V47.12) a gate the plan names is on its board too — the Jamarat entrances the sheet classifies, which never waited on an approval */
  return (STATE.sites || []).filter(function(x){ return (tafScopeOk(x) || !!tafPlan(x.id)) && (!zone || x.zone === zone); })
    .map(function(x){ return { x:x, o:tafOf(x.id) || {}, d:tafDecision(x.id) }; });
}
function tafDist(a, b){ var r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos(a.lat * r), y = (b.lat - a.lat) * r; return 6371000 * Math.sqrt(x * x + y * y); }

/* WHY the point is here — from the 1447 file for Mina, from the Arafat paths for Arafat; distances measured, never assumed */
/* (V45.2) owner: «لو في نقطتين جنب بعض هيكون بسبب عرض الممر — النقطة عرضها بالكتير ١٥ متر والعمق من ٤ إلى ٦ متر».
   Two corridor points within 30 m (two widths side by side) are explained on the card instead of reading as a duplicate. */
PV.TAF_PAIR_M = 30;
function tafNearLines(near){
  if (!near) return [];
  var L = [['أقربُ نقطة ممرٍّ أخرى', nm(Math.round(near)) + ' ' + t('م')]];
  if (near <= PV.TAF_PAIR_M) L.push(['نقطتان متجاورتان', t('بسبب عرض الممر: تغطّي النقطةُ عرضًا حتى ١٥ مترًا وعمقًا من ٤ إلى ٦ أمتار، فيحتاج الممرُّ الأعرضُ نقطتين متجاورتين')]);
  return L;
}
function tafCrit(x){
  if (!x || !PV.TAF_SCOPE.types[x.type]) return null;
  var P = PV.TAF1447 || { pts:[], m:{}, f:{} }, o = tafOf(x.id) || {}, L = [];
  var near = 0; (STATE.sites || []).forEach(function(y){ if (y !== x && y.zone === x.zone && tafScopeOk(y) && +y.lat){ var dd = tafDist({ lat:+x.lat, lng:+x.lng }, { lat:+y.lat, lng:+y.lng }); if (!near || dd < near) near = dd; } });
  var path = (/Path-([A-Za-z0-9_]+?)(?:-\d+[A-Z]?)?$/.exec(String(x.name || '')) || [])[1];
  if (x.zone === 'منى'){
    var m = P.m[x.id], cat;
    var re47 = x.work === 'إعادة تركيب ١٤٤٧';
    if (m) cat = m[1] === 'd' ? 'ممرات منى — إعادة تركيب من ملف إدارة التفويج ١٤٤٧' : m[1] === 's' ? 'ممرات منى — من ملف إدارة التفويج ١٤٤٧ (كانت مجدولة للتركيب)' : 'ممرات منى — من ملف إدارة التفويج ١٤٤٧ (لم يكن لها مكانُ تثبيت)';
    else if (re47) cat = 'ممرات منى — إعادة تركيب: رُكّبت في موسم ١٤٤٧';
    else cat = 'ممرات منى — نقطة إكمالٍ جديدة لموسم ١٤٤٨';
    L.push(['المصدر', P.src]);
    if (m) L.push(['في الملف', t('النقطة رقم') + ' ' + m[0] + ' \u00b7 ' + t(P.f[m[1]])]);   /* (V45.2) owner: «شيل على بعد ١١ متر» — the gap between the file's and our coordinates read as a distance to something done */
    else if (re47) L.push(['في الملف', t('رُكّبت في موسم ١٤٤٧ وفق سجلّ التركيب — وليست ضمن نقاط ملف إدارة التفويج')]);
    else {
      var nk = 0, nn = ''; P.pts.forEach(function(q){ var dd = tafDist({ lat:+x.lat, lng:+x.lng }, { lat:q[2], lng:q[3] }); if (!nk || dd < nk){ nk = dd; nn = q[0]; } });
      L.push(['في الملف', t('ليست في ملف ١٤٤٧ — أُضيفت لإكمال تغطية مسارات الملف ورفع دقة البيانات') + (nk ? ' \u00b7 ' + t('أقربُ نقطةٍ في الملف') + ' ' + nn + ' ' + t('على بعد') + ' ' + nm(Math.round(nk)) + ' ' + t('م') : '')]);
    }
    if (path) L.push(['المسار', path]);
    return { cat:cat, lines:L.concat(tafNearLines(near)).concat(o.crit ? [['ملاحظة', o.crit]] : []) };
  }
  if (x.zone === 'عرفات'){
    L.push(['الدراسة', 'تمّت الدراسةُ وتحديدُ النقاط بناءً على الذهاب إلى جبل الرحمة والدخول إليه']);   /* (V44.3) owner's sentence, on every Arafat corridor card */
    L.push(['الأساس', 'تغطيةُ مسارات المشاة إلى مسجد نمرة وجبل الرحمة وتفويج القطار']);
    L.push(['غرضُ هذه النقطة', o.pur ? t(o.pur) : t('لم يُحدَّد بعد')]);
    L.push.apply(L, tafNearLines(near));
    if (o.crit) L.push(['ملاحظة', o.crit]);
    return { cat:'ممرات عرفات', lines:L };
  }
  return null;
}
function tafCritHtml(x){
  var c = tafCrit(x); if (!c) return '';
  var me = tafMay(), o = tafOf(x.id) || {};
  return '<div class="card" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid #3B82F6">'
    + '<div class="hint" style="margin:0 0 6px;font-weight:700">\u{1F9ED} ' + esc(t('معيار النقطة')) + ' \u2014 ' + esc(t(c.cat)) + '</div>'
    + c.lines.map(function(l){ return '<div style="display:flex;gap:8px;margin:2px 0;font-size:13.5px"><span class="hint" style="margin:0;flex:0 0 auto">' + esc(t(l[0])) + ':</span><span style="min-width:0">' + esc(l[1]) + '</span></div>'; }).join('')
    + (me && x.zone === 'عرفات' ? '<div class="chips" style="margin:6px 0 0">' + PV.TAF_PUR.map(function(p){ return '<button type="button" class="chip' + (o.pur === p ? ' on' : '') + '" data-tafpur="' + esc(x.id) + '|' + esc(p) + '">' + esc(t(p)) + '</button>'; }).join('') + '</div>' : '')
    + (me ? '<div style="display:flex;gap:6px;margin-top:6px"><input id="tafCrit" dir="auto" value="' + esc(o.crit || '') + '" placeholder="' + esc(t('ملاحظةُ المعيار (مثلًا: عند مدخل نفق، اتجاهُ الحركة)')) + '" style="flex:1">'
        + btn('\u{1F4BE}', 'btn-secondary btn-sm', ' data-tafcrit="' + esc(x.id) + '"') + '</div>' : '')
    + '</div>';
}
/* the card's approval block — the status for everyone, the two buttons for whoever may decide */
function tafPopHtml(s){
  if (s && tafPlanMeta() && (tafInScope(s.id) || tafPlan(s.id))) return tafPlanPop(s) + (typeof tafReplyPop === 'function' ? tafReplyPop(s) : '') + (tafInScope(s.id) ? tafCritHtml(s) : '');   /* (V47.15) AFAQY's reply under the plan */
  if (!s || !tafInScope(s.id)) return '';   /* (V47.12) the sheet's phase and comments stand where approve / reject stood */
  var o = tafOf(s.id) || {}, d = tafDecision(s.id), me = tafMay(), id = esc(s.id);
  var head = d === 'ok' ? '<span class="pill ok">\u2713 ' + esc(t('معتمدة من إدارة التفويج')) + '</span>'
    : d === 'no' ? '<span class="pill bad">\u2715 ' + esc(t('رفضتها إدارة التفويج')) + '</span>'
    : '<span class="pill">' + esc(t('بانتظار اعتماد إدارة التفويج')) + '</span>';
  var meta = d ? '<span class="hint" style="margin:0">' + esc(dispName(o.by || '')) + (o.at ? ' \u00b7 ' + esc(stepAgo(o.at)) : '') + '</span>' : '';
  var why = d === 'no' ? '<div style="margin:6px 0 0;font-size:13.5px"><b>' + esc(t(o.why || '')) + '</b>' + (o.note ? ' \u2014 ' + esc(o.note) : '') + '</div>' : '';
  var repl = o.repl ? '<div class="hint" style="margin:4px 0 0">' + esc(t('البديل')) + ': ' + btn(o.repl, 'btn-quiet btn-sm', ' data-fly="' + esc(o.repl) + '"') + '</div>' : '';
  var acts = '';
  if (me && PV.TAF_REJ === s.id){
    acts = '<div class="chips" style="margin:8px 0 0">' + PV.TAF_WHY.map(function(w){ return '<button type="button" class="chip' + (PV.TAF_WHYSEL === w ? ' on' : '') + '" data-tafwhy="' + esc(w) + '">' + esc(t(w)) + '</button>'; }).join('') + '</div>'
      + '<textarea id="tafNote" dir="auto" rows="2" style="width:100%;margin-top:6px" placeholder="' + esc(t('التعليق — إلزاميّ')) + '"></textarea>'
      + '<div class="actions" style="margin:6px 0 0">' + btn('\u2715 ' + t('ارفض'), 'btn-primary btn-sm', ' data-tafsave="' + id + '" style="background:#E5484D;border-color:#E5484D"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-tafcancel="1"') + '</div>';
  } else if (me){
    acts = '<div class="actions" style="margin:8px 0 0;gap:6px;flex-wrap:wrap">'
      + (d !== 'ok' ? btn('\u2713 ' + t('اعتمد'), 'btn-primary btn-sm', ' data-tafok="' + id + '" style="background:#22C55E;border-color:#22C55E"') : '')
      + (d !== 'no' ? btn('\u2715 ' + t('لا تعتمد'), 'btn-secondary btn-sm', ' data-tafno="' + id + '" style="color:#E5484D;border-color:#E5484D"') : '')
      + (d ? btn('\u21BA ' + t('تراجع عن القرار'), 'btn-quiet btn-sm', ' data-tafundo="' + id + '"') : '')
      + (d === 'no' && o.why === 'مكانها غير صحيح' && !o.repl ? btn('\u2795 ' + t('أضف البديل'), 'btn-secondary btn-sm', ' data-tafrepl="' + id + '"') : '')
      + '</div>';
  }
  return '<div class="card" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid ' + PV.TAF_COL[d] + '">'
    + '<div class="hint" style="margin:0 0 6px;font-weight:700">\u{1F9ED} ' + esc(t('اعتماد إدارة التفويج')) + '</div>'
    + '<div class="wt-row" style="gap:8px;flex-wrap:wrap;align-items:center">' + head + meta + '</div>' + why + repl + acts + '</div>'
    + tafCritHtml(s);
}

/* ═══ the dashboard: «متابعة الوزارة ← اعتمادات إدارة التفويج» ═══ */
function tafPct(n, d){ return d ? Math.round(100 * n / d) : 0; }
function tafBarHtml(ok, no, tot){
  var a = tafPct(ok, tot), b = tafPct(no, tot);
  return '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:rgba(127,127,127,.18)" aria-hidden="true">'
    + '<span style="width:' + a + '%;background:' + PV.TAF_COL.ok + '"></span><span style="width:' + b + '%;background:' + PV.TAF_COL.no + '"></span></div>';
}
function tafDash(){
  if (tafPlanMeta()) return tafPlanDash();   /* (V47.12) */
  var Z = PV.TAF_Z || '', LST = PV.TAF_LIST || 'no', all = tafSites('');
  var cnt = function(L){ var r = { n:L.length, ok:0, no:0 }; L.forEach(function(q){ if (q.d === 'ok') r.ok++; else if (q.d === 'no') r.no++; }); r.left = r.n - r.ok - r.no; return r; };
  var A = cnt(all);
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('نقاطُ الممرات في منى وعرفات يعتمدها أو يرفضها قسمُ إدارة التفويج من الخريطة. المرفوضةُ لا تُركَّب، والمعتمدةُ تُجدوَل للتركيب بعد اعتمادها التقني.')) + '</p>'
    + '<div class="card" style="margin:0 0 10px"><div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">'
    + '<div style="flex:0 0 auto"><div class="hint" style="margin:0">' + esc(t('المتبقّي')) + '</div><div style="font-size:42px;font-weight:700;line-height:1.1">' + nm(tafPct(A.left, A.n)) + '\u066A</div></div>'
    + '<div style="flex:1;min-width:220px">' + tafBarHtml(A.ok, A.no, A.n)
    + '<div class="hint" style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0 0"><span>' + esc(t('تمّ')) + ' <b>' + nm(tafPct(A.ok + A.no, A.n)) + '\u066A</b></span><span style="color:' + PV.TAF_COL.ok + '">' + esc(t('معتمدة')) + ' ' + nm(A.ok) + '</span><span style="color:' + PV.TAF_COL.no + '">' + esc(t('مرفوضة')) + ' ' + nm(A.no) + '</span><span>' + esc(t('متبقّية')) + ' ' + nm(A.left) + '</span><span>' + esc(t('من')) + ' ' + nm(A.n) + '</span></div></div></div></div>';
  /* the holy sites — a click opens its scorecard */
  h += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 10px">' + Object.keys(PV.TAF_SCOPE.zones).map(function(z){
      var C = cnt(tafSites(z));
      return '<button type="button" class="card" data-tafz="' + esc(z) + '" style="flex:1 1 260px;margin:0;text-align:start;cursor:pointer;border:2px solid ' + (Z === z ? 'var(--acc, #3CC5B5)' : 'transparent') + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:18px">' + esc(t(z)) + '</b><span class="hint" style="margin:0">' + esc(t('المتبقّي')) + ' <b>' + nm(tafPct(C.left, C.n)) + '\u066A</b></span></div>'
        + '<div style="margin:8px 0">' + tafBarHtml(C.ok, C.no, C.n) + '</div>'
        + '<div class="hint" style="margin:0;display:flex;gap:12px;flex-wrap:wrap"><span style="color:' + PV.TAF_COL.ok + '">\u2713 ' + nm(C.ok) + '</span><span style="color:' + PV.TAF_COL.no + '">\u2715 ' + nm(C.no) + '</span><span>' + esc(t('متبقّية')) + ' ' + nm(C.left) + '</span><span>' + esc(t('نقاطُ ممرات')) + ' ' + nm(C.n) + '</span></div></button>';
    }).join('') + '</div>';
  /* additions by the tafweej management */
  var adds = (STATE.sites || []).filter(function(x){ return x && x.isNew && x.origin === 'tafweej'; });
  if (adds.length) h += '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 6px">\u2795 ' + esc(t('إضافاتُ إدارة التفويج')) + ' <b class="num">' + nm(adds.length) + '</b></h4>'
    + adds.slice(0, 30).map(function(x){ return '<div class="wt-row" style="justify-content:space-between;border-top:1px solid var(--line, #e2e2e2);padding:5px 0"><span><bdi>' + esc(x.id) + '</bdi> \u00b7 ' + esc(x.name || '') + (x.replOf ? ' \u00b7 ' + esc(t('بديلٌ عن')) + ' ' + esc(x.replOf) : '') + '</span><span class="hint" style="margin:0">' + esc(t((LIFE[lifeOf(x)] || LIFE.todo).n)) + '</span>' + btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-fly="' + esc(x.id) + '"') + '</div>'; }).join('') + '</div>';
  h += '<div class="actions" style="margin:0 0 10px;gap:8px;flex-wrap:wrap">' + btn('\u2B07 Excel', 'btn-secondary btn-sm', ' data-tafxl="1"')
    + btn((PV.TAF_LAYER ? '\u2713 ' : '') + t('نقاطُ ملف ١٤٤٧ على الخريطة'), 'btn-secondary btn-sm', ' data-taflayer="1"') + tafPlanImpBtn() + '</div>';
  if (!Z) return h + '<p class="hint">' + esc(t('اضغط مشعرًا لترى بطاقتَه: القوائم وأسباب الرفض.')) + '</p>' + tafSpecsHtml();   /* (V44.7) */
  /* the holy site's scorecard */
  var S = tafSites(Z), C = cnt(S), reasons = {};
  S.forEach(function(q){ if (q.d === 'no'){ var k = q.o.why || 'سببٌ آخر'; reasons[k] = (reasons[k] || 0) + 1; } });
  var rk = Object.keys(reasons).sort(function(a, b){ return reasons[b] - reasons[a]; }), rmax = rk.length ? reasons[rk[0]] : 1;
  var list = S.filter(function(q){ return LST === 'ok' ? q.d === 'ok' : LST === 'no' ? q.d === 'no' : !q.d; });
  var chip = function(k, l, n){ return '<button type="button" class="chip' + (LST === k ? ' on' : '') + '" data-taflist="' + k + '">' + esc(t(l)) + ' ' + nm(n) + '</button>'; };
  h += '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">' + esc(t(Z)) + ' \u2014 ' + esc(t('بطاقةُ المشعر')) + '</h4>'
    + (tafListReg(Z), stats([['نقاطُ ممرات', nm(C.n), '', 'taf_all|' + Z], ['معتمدة', nm(C.ok), C.ok ? 'acc' : '', 'taf_ok|' + Z], ['مرفوضة', nm(C.no), C.no ? 'bad' : '', 'taf_no|' + Z], ['متبقّية', nm(C.left), C.left ? 'wrn' : '', 'taf_left|' + Z]]))
    + (rk.length ? '<h4 style="margin:12px 0 6px">' + esc(t('أسبابُ الرفض')) + '</h4>' + rk.map(function(k){
        return '<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="flex:0 0 34%">' + esc(t(k)) + '</span><span style="flex:1;height:12px;border-radius:6px;background:rgba(127,127,127,.15);overflow:hidden"><span style="display:block;height:100%;width:' + Math.max(3, Math.round(100 * reasons[k] / rmax)) + '%;background:' + PV.TAF_COL.no + '"></span></span><b>' + nm(reasons[k]) + '</b></div>'; }).join('') : '')
    + '<div class="chips" style="margin:12px 0 6px">' + chip('no', 'المرفوضة', C.no) + chip('left', 'المتبقّية', C.left) + chip('ok', 'المعتمدة', C.ok) + '</div>'
    + (list.length ? list.slice(0, 200).map(function(q){
        var x = q.x, c = tafCrit(x);
        return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:7px 0"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline"><span><b><bdi>' + esc(x.id) + '</bdi></b> \u00b7 ' + esc(x.name || '') + '</span>'
          + '<span style="display:flex;gap:6px">' + btn('\u{1F4CD} ' + t('على الخريطة'), 'btn-quiet btn-sm', ' data-fly="' + esc(x.id) + '"') + '</span></div>'
          + (c ? '<div class="hint" style="margin:2px 0 0">' + esc(t(c.cat)) + '</div>' : '')
          + (q.d === 'no' ? '<div style="margin:3px 0 0;font-size:13.5px;color:' + PV.TAF_COL.no + '"><b>' + esc(t(q.o.why || '')) + '</b>' + (q.o.note ? ' \u2014 ' + esc(q.o.note) : '') + '</div>' : '')
          + (q.d ? '<div class="hint" style="margin:2px 0 0">' + esc(dispName(q.o.by || '')) + (q.o.at ? ' \u00b7 ' + esc(dayKey(q.o.at)) : '') + '</div>' : '') + '</div>';
      }).join('') : '<p class="hint">' + esc(t('لا نقاط في هذه القائمة')) + '</p>')
    + '</div>';
  return h + tafSpecsHtml();
}
function tafXlsx(){
  if (tafPlanMeta()) return tafPlanXlsx();   /* (V47.12) */
  var rows = tafSites('').map(function(q){ var c = tafCrit(q.x) || { cat:'', lines:[] }, m = (PV.TAF1447 || { m:{} }).m[q.x.id];
    return [q.x.id, q.x.name || '', t(q.x.zone), q.d === 'ok' ? t('معتمدة') : q.d === 'no' ? t('مرفوضة') : t('متبقّية'), q.d === 'no' ? t(q.o.why || '') : '', q.o.note || '', q.o.by || '', q.o.at ? dayKey(q.o.at) : '',
      t(c.cat), m ? m[0] : '', m ? t(PV.TAF1447.f[m[1]]) : '', q.o.pur ? t(q.o.pur) : '', q.o.repl || '', +q.x.lat || '', +q.x.lng || ''];
  });
  logEvent('تصدير اعتمادات إدارة التفويج \u2014 ' + rows.length);
  return mtXlsx('اعتمادات إدارة التفويج', ['الرقم', 'الاسم', 'المشعر', 'القرار', 'سبب الرفض', 'التعليق', 'بواسطة', 'التاريخ', 'معيار النقطة', 'رقمها في ملف ١٤٤٧', 'حالتها في ملف ١٤٤٧', 'الغرض', 'البديل', 'خط العرض', 'خط الطول'], rows);
}

/* ═══ (V47.13) the study behind the plan, kept beside it as a reference ═══
   Owner: «اعمله مكان في السيستم عشان يبقى كل حاجة موجودة كمرجع». The Word study («هندسة رصد التفويج») is read in the
   browser — headings, paragraphs and tables; its figures stay in the file — and kept in its own document, settings/tafref,
   fetched only when the board is opened. It never enters the public repository. The Ministry's read-only role does not see it. */
function tafRefMay(){ return effRole(ROLE) !== 'viewer'; }
function tafRefParse(xml){
  var doc = new DOMParser().parseFromString(String(xml || ''), 'application/xml'), body = doc.getElementsByTagName('w:body')[0], B = [], title = '';
  var txt = function(el){ var s = '', N = el.getElementsByTagName('*'), i, nn;
    for (i = 0; i < N.length; i++){ nn = N[i].nodeName; if (nn === 'w:t') s += N[i].textContent; else if (nn === 'w:tab' || nn === 'w:br' || nn === 'w:p') s += ' '; }
    return s.replace(/\s+/g, ' ').trim(); };
  for (var k = body ? body.firstChild : null; k; k = k.nextSibling){
    if (k.nodeName === 'w:p'){
      var st = k.getElementsByTagName('w:pStyle')[0], sv = st ? String(st.getAttribute('w:val') || '') : '', x = txt(k), m = /^heading\s*([1-3])$/i.exec(sv);
      if (!x || /^toc/i.test(sv) || /^(المحتويات|Contents)$/.test(x)) continue;
      if (/^title$/i.test(sv) && !title){ title = x; continue; }
      B.push([m ? 'h' + m[1] : (k.getElementsByTagName('w:numPr').length ? 'li' : 'p'), x]);
    } else if (k.nodeName === 'w:tbl'){
      var R = [], TR = k.getElementsByTagName('w:tr'), r, c, TC, row;
      for (r = 0; r < TR.length && r < 80; r++){ TC = TR[r].getElementsByTagName('w:tc'); row = []; for (c = 0; c < TC.length && c < 14; c++) row.push(txt(TC[c])); R.push(row); }
      if (R.length) B.push(['t', R]);
    }
  }
  return { title:title, b:B };
}
function tafRefImport(file){
  if (!file || !(rankOf(effRole(ROLE)) >= rankOf('engineer'))){ toast(t('رفعُ الدراسة للمهندس')); return; }
  jszipLoad().then(function(ok){
    if (!ok){ toast(t('تعذّرت قراءةُ الملف')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      JSZip.loadAsync(fr.result).then(function(z){ var f = z.file('word/document.xml'); if (!f) throw new Error('not a docx'); return f.async('string'); })
        .then(function(xml){ tafRefApply(tafRefParse(xml), file.name); })
        .catch(function(e){ softErr('دراسة التفويج', e, ''); toast(t('تعذّرت قراءةُ الملف')); });
    };
    fr.readAsArrayBuffer(file);
  });
}
function tafRefApply(P, name){
  var j = JSON.stringify((P && P.b) || []);
  if (!P || !P.b || !P.b.length){ toast(t('لم أجد نصًّا في الملف — المطلوب ملفُّ وورد (docx)')); return false; }
  if (j.length > 600000){ toast(t('الملفُّ أكبرُ من أن يُحفَظ مرجعًا')); return false; }
  var d = { name:String(name || '').slice(0, 120), title:String(P.title || '').slice(0, 160), n:P.b.length, j:j, at:Date.now(), by:STATE.meta.name || '' };
  tafRefLoad.d = d; tafRefLoad.b = null; lsSet('nsk14.tafref', JSON.stringify(d));
  CORE.set('cfg', 'tafref', d);
  logEvent('رفع دراسة رصد التفويج — ' + d.name + ' · ' + d.n);
  toast(t('حُفظت الدراسةُ مرجعًا')); render(1); return true;
}
/* the local copy first (the field opens it offline), then the server's when it is newer */
function tafRefLoad(){
  if (!tafRefLoad.d){ try { tafRefLoad.d = JSON.parse(lsGet('nsk14.tafref') || 'null'); } catch (e){ LS_ERR = e; } }
  if (!FB.ready || !FB.db || (tafRefLoad.at && Date.now() - tafRefLoad.at < 60000)) return;
  tafRefLoad.at = Date.now();
  DB.col('settings').doc('tafref').get().then(function(doc){
    var d = doc && doc.exists ? doc.data() : null; if (!d || !d.j || (tafRefLoad.d && tafRefLoad.d.at >= d.at)) return;
    tafRefLoad.d = d; tafRefLoad.b = null; lsSet('nsk14.tafref', JSON.stringify(d)); if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('دراسة التفويج', e, ''); });
}
function tafRefHtml(){
  if (!tafRefMay()) return '';
  tafRefLoad();
  var d = tafRefLoad.d, eng = rankOf(effRole(ROLE)) >= rankOf('engineer');
  var up = eng ? '<label class="btn btn-secondary btn-sm" style="cursor:pointer">⬆ ' + esc(t(d && d.j ? 'رفع إصدار أحدث (Word)' : 'رفع الدراسة (Word)')) + '<input type="file" accept=".docx" data-tafreffile="1" style="display:none"></label>' : '';
  var head = '<div class="card" id="tafRefCard" style="margin:0 0 10px"><h4 style="margin:0 0 8px">\u{1F4D8} ' + esc(t('دراسة هندسة رصد التفويج')) + '</h4>';
  if (!d || !d.j) return head + '<p class="hint" style="margin:0 0 8px">' + esc(t('لم تُرفَع الدراسةُ بعد.')) + '</p>' + up + '</div>';
  if (!tafRefLoad.b){ try { tafRefLoad.b = JSON.parse(d.j); } catch (e){ LS_ERR = e; tafRefLoad.b = []; } }
  var G = [], cur = null, cell = 'border:1px solid var(--line, #e2e2e2);padding:4px 6px;text-align:start;vertical-align:top';
  tafRefLoad.b.forEach(function(b){
    if (b[0] === 'h1' || !cur){ cur = { h:b[0] === 'h1' ? b[1] : t('مقدمة'), x:[] }; G.push(cur); if (b[0] === 'h1') return; }
    cur.x.push(b[0] === 't'
      ? '<div style="overflow-x:auto;margin:6px 0"><table style="border-collapse:collapse;font-size:12.5px;min-width:100%">' + b[1].map(function(r, i){
          return '<tr>' + r.map(function(c){ return '<' + (i ? 'td' : 'th') + ' style="' + cell + '">' + esc(c) + '</' + (i ? 'td' : 'th') + '>'; }).join('') + '</tr>'; }).join('') + '</table></div>'
      : b[0] === 'p' ? '<p style="margin:0 0 6px;line-height:1.8">' + esc(b[1]) + '</p>'
      : b[0] === 'li' ? '<p style="margin:0 0 4px;line-height:1.8">• ' + esc(b[1]) + '</p>'
      : '<p style="margin:8px 0 4px;font-weight:700">' + esc(b[1]) + '</p>');
  });
  return head + (d.title ? '<div style="font-weight:700;margin:0 0 4px">' + esc(d.title) + '</div>' : '')
    + '<div class="hint" style="margin:0 0 8px"><bdi>' + esc(d.name || '') + '</bdi> · ' + esc(dayKey(d.at || Date.now())) + (d.by ? ' · ' + esc(d.by) : '') + ' · ' + esc(t('النصُّ والجداول هنا، والأشكالُ في الملف الأصلي')) + '</div>'
    + G.map(function(g){ return '<details style="border-top:1px solid var(--line, #e2e2e2);padding:6px 0"><summary style="cursor:pointer;font-weight:700;padding:4px 0">' + esc(g.h) + '</summary><div style="padding:6px 0 0">' + g.x.join('') + '</div></details>'; }).join('')
    + (up ? '<div style="margin:8px 0 0">' + up + '</div>' : '') + '</div>';
}

/* ═══ (V47.12) «خطة رصد التفويج» — the tafweej management's sheet in the place of approve / reject ═══
   The sheet («هندسة رصد التفويج», one tab per holy site and phase) is read by its column names; a gate is matched by its id. */
PV.TAF_PLAN_TABS = [[/المرحلة\s*[١1]/, 'p1'], [/المرحلة\s*[٢2]/, 'p2'], [/خارج\s*الحاجة/, 'out']];
function tafPlanParse(wb){
  var out = { v:String(Date.now()), name:'', m:{}, n:{ p1:0, p2:0, out:0 }, miss:0 }, num = function(x){ var v = +x; return isFinite(v) && x !== '' && x != null ? v : null; };
  (wb.SheetNames || []).forEach(function(sn){
    var A = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, defval:'' });
    if (!out.name){ var mt = /الإصدار\s*([٠-٩0-9]+)/.exec(String((A[0] || [])[0] || '')); if (mt) out.name = 'الإصدار ' + mt[1]; }
    var ph = PV.TAF_PLAN_TABS.filter(function(g){ return g[0].test(sn); })[0]; if (!ph) return;
    var H = (A[0] || []).map(function(h){ return String(h).trim(); }), c = function(n){ return H.indexOf(n); }, I = c('المعرّف'); if (I < 0) return;
    var cf = function(rx){ for (var i = 0; i < H.length; i++) if (rx.test(H[i])) return i; return -1; }, iSt = cf(/^الشارع$/), iPk = cf(/^ذروة/);   /* (V47.15) the reply's reasons */
    A.slice(1).forEach(function(r){
      var id = String(r[I] || '').trim(); if (!id) return;
      var g = function(n){ var i = c(n); return i < 0 ? '' : r[i]; };
      var o = { p:ph[1], k:num(g('الترتيب')), s:num(g('المقطع')), w:num(g('العرض م')), n:num(g('أطقم الآن')), r:num(g('أطقم مطلوبة')), a:String(g('الاعتماد') || '').trim(),
                c:[g('سبب الإدراج'), g('التحدّيات')].join(' \u00b7 ').split(/\s*\u00b7\s*/).map(function(x){ return String(x || '').trim(); })
                  .filter(function(x, i, a){ return x && !/^أخرى\s*\u2014/.test(x) && a.indexOf(x) === i; }).join(' \u00b7 ').slice(0, 300) };   /* «أخرى — اذكرها…» is the form's empty choice, not a comment */
      o.t = iSt < 0 ? '' : String(r[iSt] || '').trim().slice(0, 60); o.q = iPk < 0 ? null : num(r[iPk]); if (!o.q) delete o.q;
      Object.keys(o).forEach(function(k0){ if (o[k0] == null || o[k0] === '') delete o[k0]; });
      o.p = ph[1]; out.m[id] = o; out.n[ph[1]]++;
    });
  });
  return out;
}
function tafPlanImport(file){
  if (!file || !(rankOf(effRole(ROLE)) >= rankOf('engineer'))){ toast(t('استيرادُ خطة الرصد للمهندس')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try { tafPlanApply(tafPlanParse(XLSX.read(new Uint8Array(fr.result), { type:'array' }))); }
      catch (e){ softErr('خطة الرصد', e, ''); toast(t('تعذّرت قراءةُ الملف')); }
    };
    fr.readAsArrayBuffer(file);
  });
}
/* the parsed sheet becomes the plan: every gate it names that is a point in scope takes its phase; the rest are counted, not guessed */
function tafPlanApply(P){
  var ids = Object.keys(P.m).filter(function(id){ var x = siteFind(id); return !!x && !!PV.TAF_SCOPE.zones[x.zone]; }); P.miss = Object.keys(P.m).length - ids.length;
  if (!ids.length){ toast(t('لم أجد في الملف بوّاباتٍ من نقاط الممرات — الأعمدة: المعرّف، أطقم مطلوبة، وتبويبٌ لكلِّ مرحلة')); return false; }
  var patch = { __plan:{ v:P.v, name:P.name || '', at:Date.now(), by:STATE.meta.name || '', n:ids.length, miss:P.miss, f:2 } };   /* f:2 — street and peak are in (V47.15) */
  ids.forEach(function(id){ patch[id] = Object.assign({}, tafOf(id) || {}, { pl:Object.assign({ v:P.v }, P.m[id]) }); });
  var pend = tafPending(); Object.keys(pend).forEach(function(k){ if (!patch[k]) patch[k] = pend[k]; });
  STATE.taf = Object.assign({}, STATE.taf || {}, patch); tafLifeSync(); if (DB.memo) DB.memo.life = null;
  CORE.set('cfg', 'tafappr', { m:patch, at:Date.now() });
  logEvent('استيراد خطة رصد التفويج — ' + (P.name || '') + ' · ' + ids.length + (P.miss ? ' · ' + P.miss + ' خارج النظام' : ''));
  toast(t('اعتُمدت خطةُ الرصد') + ' · ' + nm(ids.length) + ' ' + t('بوّابة') + (P.miss ? ' · ' + nm(P.miss) + ' ' + t('ليست في النظام') : '')); render(1);
  return true;
}
/* a phase or a comment changed by hand, from the point's card — the tafweej management and the engineer */
function tafPlanSet(id, p, c){
  var M = tafPlanMeta(); if (!M || !tafMay() || !(tafInScope(id) || tafPlan(id))){ toast(t('خطةُ الرصد لإدارة التفويج والمهندس')); return false; }
  var prev = tafOf(id) || {}, pl = Object.assign({}, tafPlan(id) || {}, { v:M.v, by:STATE.meta.name || '', at:Date.now() });
  if (p != null){ if (p) pl.p = p; else delete pl.p; }
  if (c != null) pl.c = String(c).trim().slice(0, 300);
  var patch = {}; patch[id] = Object.assign({}, prev, { pl:pl });
  var pend = tafPending(); Object.keys(pend).forEach(function(k){ if (!patch[k]) patch[k] = pend[k]; });
  STATE.taf = Object.assign({}, STATE.taf || {}, patch); if (DB.memo) DB.memo.life = null;
  CORE.set('cfg', 'tafappr', { m:patch, at:Date.now() });
  logEvent('خطة رصد التفويج — ' + id + ' · ' + tafPhaseDef(pl.p)[1] + (pl.c ? ' · ' + pl.c.slice(0, 120) : ''), id);
  toast(t('حُفظ')); render(1); return true;
}
function tafPlanImpBtn(){
  return rankOf(effRole(ROLE)) >= rankOf('engineer') ? '<label class="btn btn-secondary btn-sm" style="cursor:pointer">⬆ ' + esc(t('استيراد خطة الرصد (Excel)')) + '<input type="file" accept=".xlsx" data-tafplanfile="1" style="display:none"></label>' : '';
}
/* the point's card: the phase, what the sheet says of the gate, and its comments */
function tafPlanPop(s){
  var pl = tafPlan(s.id) || {}, D = tafPhaseDef(pl.p), me = tafMay(), o = tafOf(s.id) || {}, id = esc(s.id);
  var kv = function(l, v){ return v === '' || v == null ? '' : '<div style="display:flex;gap:8px;margin:2px 0;font-size:13.5px"><span class="hint" style="margin:0;flex:0 0 auto">' + esc(t(l)) + ':</span><span style="min-width:0">' + v + '</span></div>'; };
  return '<div class="card" id="tafPlanCard" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid ' + D[2] + '">'
    + '<div class="hint" style="margin:0 0 6px;font-weight:700">\u{1F9ED} ' + esc(t('خطة رصد التفويج')) + '</div>'
    + '<div class="wt-row" style="gap:8px;flex-wrap:wrap;align-items:center"><span class="pill" style="border-color:' + D[2] + ';color:' + D[2] + ';font-weight:700">' + esc(t(D[1])) + '</span>'
    + (pl.k != null ? '<span class="hint" style="margin:0">' + esc(t('الترتيب')) + ' ' + nm(pl.k) + '</span>' : '') + '</div>'
    + kv('المقطع', pl.s != null ? nm(pl.s) : '') + kv('عرض الممر', pl.w != null ? nm(pl.w) + ' ' + esc(t('م')) : '')
    + kv('الأطقم', pl.r != null ? esc(t('موجود')) + ' ' + nm(pl.n || 0) + ' · ' + esc(t('مطلوب')) + ' <b>' + nm(pl.r) + '</b>' : '')
    + kv('حالتها في ملف الخطة', pl.a ? esc(t(pl.a)) : '') + kv('التعليق', pl.c ? esc(pl.c) : '')
    + kv('تعليقٌ سابق', o.note ? esc((o.why ? t(o.why) + ' — ' : '') + o.note) : '')
    + (me ? '<div class="chips" style="margin:8px 0 0">' + PV.TAF_PH.map(function(g){ return '<button type="button" class="chip' + ((pl.p || '') === g[0] ? ' on' : '') + '" data-tafph="' + id + '|' + g[0] + '">' + esc(t(g[1])) + '</button>'; }).join('') + '</div>'
        + '<div style="display:flex;gap:6px;margin-top:6px"><input id="tafPlanC" dir="auto" value="' + esc(pl.c || '') + '" placeholder="' + esc(t('التعليق')) + '" style="flex:1">' + btn('\u{1F4BE}', 'btn-secondary btn-sm', ' data-tafphc="' + id + '"') + '</div>' : '')
    + '</div>';
}
/* the numbers of a set of gates: gates per phase, and kits there and required — a section's kits counted once */
function tafPlanCount(L){
  var C = { n:L.length, p1:0, p2:0, out:0, '':0, kn:{ p1:0, p2:0, out:0 }, kr:{ p1:0, p2:0, out:0 } }, seen = {};
  L.forEach(function(q){ var pl = tafPlan(q.x.id) || {}, k = pl.p || ''; C[k]++; if (!k) return;
    var sk = q.x.zone + '|' + k + '|' + (pl.s != null ? pl.s : q.x.id); if (seen[sk]) return; seen[sk] = 1; C.kn[k] += pl.n || 0; C.kr[k] += pl.r || 0; });
  return C;
}
function tafPlanBar(C){
  return '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:rgba(127,127,127,.18)" aria-hidden="true">'
    + PV.TAF_PH.map(function(g){ return C[g[0]] ? '<span style="width:' + (100 * C[g[0]] / (C.n || 1)) + '%;background:' + g[2] + '"></span>' : ''; }).join('') + '</div>'
    + '<div class="hint" style="display:flex;gap:12px;flex-wrap:wrap;margin:6px 0 0">' + PV.TAF_PH.filter(function(g){ return C[g[0]]; }).map(function(g){
        return '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:9px;height:9px;border-radius:2px;display:inline-block;background:' + g[2] + '"></span>' + esc(t(g[1])) + ' <b>' + nm(C[g[0]]) + '</b></span>'; }).join('') + '</div>';
}
function tafPlanListReg(Z){
  PV.TAF_PH.forEach(function(g){
    var key = 'tafp_' + (g[0] || 'none') + '|' + Z; if (MFU.lists[key]) return;
    MFU.lists[key] = { title:t(Z) + ' — ' + t(g[1]),
      base:function(){ var L = tafSites(Z).map(function(q){ return q.x; }); return { n:L.length, name:t('نقاطُ ممرات') + ' ' + t(Z), zones:svZoneTot(L) }; },
      head:['النقطة', 'الاسم', 'المشعر', 'مرحلة الرصد', 'الترتيب', 'عرض الممر', 'أطقم الآن', 'أطقم مطلوبة', 'التعليق', 'الحالة'],
      rows:function(){ return tafSites(Z).filter(function(q){ return tafPhase(q.x.id) === g[0]; }).map(function(q){ var x = q.x, pl = tafPlan(x.id) || {};
        return [x.id, String(x.name || ''), t(taxOf(x).g), t(g[1]), pl.k != null ? pl.k : '', pl.w != null ? pl.w : '', pl.n != null ? pl.n : '', pl.r != null ? pl.r : '', pl.c || '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
  });
}
function tafPlanDash(){
  var M = tafPlanMeta(), Z = PV.TAF_Z || '', LST = PV.TAF_PLIST || 'p1', A = tafPlanCount(tafSites(''));
  var kit = function(C, k){ return nm(C.kr[k]) + ' <span class="hint" style="margin:0">' + esc(t('طقمًا مطلوبًا')) + ' · ' + esc(t('موجود')) + ' ' + nm(C.kn[k]) + '</span>'; };
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('نقاطُ الممرات في منى وعرفات بحسب خطة رصد التفويج من إدارة التفويج: المرحلةُ الأولى تُجهَّز أولًا، ثم الثانية، وما خارج الحاجة الرصدية ينتظر إسنادَ غرضه.')) + '</p>'
    + '<div class="card" id="tafPlanHero" style="margin:0 0 10px"><div class="hint" style="margin:0 0 8px">' + esc(t('خطة رصد التفويج')) + (M.name ? ' · ' + esc(M.name) : '') + ' · ' + esc(dayKey(M.at || Date.now())) + (M.miss ? ' · ' + nm(M.miss) + ' ' + esc(t('بوّابةً في الملف ليست في النظام')) : '') + '</div>'
    + tafPlanBar(A)
    + '<div class="kk-zl" style="margin:8px 0 0"><span>' + esc(t('مرحلة أولى')) + ' · ' + nm(A.p1) + ' ' + esc(t('بوّابة')) + '</span><b class="num">' + kit(A, 'p1') + '</b></div>'
    + '<div class="kk-zl" style="margin:3px 0 0"><span>' + esc(t('مرحلة ثانية')) + ' · ' + nm(A.p2) + ' ' + esc(t('بوّابة')) + '</span><b class="num">' + kit(A, 'p2') + '</b></div></div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 10px">' + Object.keys(PV.TAF_SCOPE.zones).map(function(z){
      var C = tafPlanCount(tafSites(z));
      return '<button type="button" class="card" data-tafz="' + esc(z) + '" style="flex:1 1 260px;margin:0;text-align:start;cursor:pointer;border:2px solid ' + (Z === z ? 'var(--acc, #3CC5B5)' : 'transparent') + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:18px">' + esc(t(z)) + '</b><span class="hint" style="margin:0">' + esc(t('نقاطُ ممرات')) + ' <b>' + nm(C.n) + '</b></span></div>'
        + '<div style="margin:8px 0 0">' + tafPlanBar(C) + '</div></button>';
    }).join('') + '</div>';
  h += '<div class="actions" style="margin:0 0 10px;gap:8px;flex-wrap:wrap">' + btn('⬇ Excel', 'btn-secondary btn-sm', ' data-tafxl="1"')
    + btn((PV.TAF_LAYER ? '✓ ' : '') + t('نقاطُ ملف ١٤٤٧ على الخريطة'), 'btn-secondary btn-sm', ' data-taflayer="1"') + tafPlanImpBtn() + '</div>';
  if (!Z) return h + '<p class="hint">' + esc(t('اضغط مشعرًا لترى بطاقتَه: قوائمُ كلِّ مرحلةٍ وتعليقاتُها.')) + '</p>' + tafSpecsHtml();
  var S = tafSites(Z), C = tafPlanCount(S), list = S.filter(function(q){ return tafPhase(q.x.id) === (LST === 'none' ? '' : LST); });
  list.sort(function(a, b){ var pa = tafPlan(a.x.id) || {}, pb = tafPlan(b.x.id) || {}; return (pa.k == null ? 1e9 : pa.k) - (pb.k == null ? 1e9 : pb.k) || (a.x.id < b.x.id ? -1 : 1); });
  tafPlanListReg(Z);
  h += '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">' + esc(t(Z)) + ' — ' + esc(t('بطاقةُ المشعر')) + '</h4>'
    + stats([['نقاطُ ممرات', nm(C.n)]].concat(PV.TAF_PH.map(function(g){ return [g[1], nm(C[g[0]]), '', 'tafp_' + (g[0] || 'none') + '|' + Z]; })))
    + '<div class="kk-zl" style="margin:8px 0 0"><span>' + esc(t('مرحلة أولى')) + '</span><b class="num">' + kit(C, 'p1') + '</b></div><div class="kk-zl" style="margin:3px 0 0"><span>' + esc(t('مرحلة ثانية')) + '</span><b class="num">' + kit(C, 'p2') + '</b></div>'
    + '<div class="chips" style="margin:12px 0 6px">' + PV.TAF_PH.map(function(g){ var k = g[0] || 'none'; return '<button type="button" class="chip' + (LST === k ? ' on' : '') + '" data-tafplist="' + k + '">' + esc(t(g[1])) + ' ' + nm(C[g[0]]) + '</button>'; }).join('') + '</div>'
    + (list.length ? list.slice(0, 200).map(function(q){ var x = q.x, pl = tafPlan(x.id) || {};
        return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:7px 0"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline"><span>' + (pl.k != null ? '<span class="pill">#' + nm(pl.k) + '</span> ' : '') + '<b><bdi>' + esc(x.id) + '</bdi></b> · ' + esc(x.name || '') + '</span>'
          + '<span style="display:flex;gap:6px">' + btn('\u{1F4CD} ' + t('على الخريطة'), 'btn-quiet btn-sm', ' data-fly="' + esc(x.id) + '"') + '</span></div>'
          + '<div class="hint" style="margin:2px 0 0">' + (pl.w != null ? esc(t('عرض الممر')) + ' ' + nm(pl.w) + ' ' + esc(t('م')) + ' · ' : '') + (pl.r != null ? esc(t('الأطقم')) + ': ' + esc(t('موجود')) + ' ' + nm(pl.n || 0) + ' · ' + esc(t('مطلوب')) + ' ' + nm(pl.r) + ' · ' : '') + esc(t((LIFE[lifeOf(x)] || {}).n || '')) + '</div>'
          + (pl.c ? '<div style="margin:3px 0 0;font-size:13.5px">\u{1F4AC} ' + esc(pl.c) + '</div>' : '') + '</div>'; }).join('') : '<p class="hint">' + esc(t('لا نقاط في هذه القائمة')) + '</p>')
    + '</div>';
  return h + tafSpecsHtml();
}
function tafPlanXlsx(){
  var rows = tafSites('').map(function(q){ var x = q.x, pl = tafPlan(x.id) || {}, c = tafCrit(x) || { cat:'' }, v = function(a){ return a != null ? a : ''; };
    return [x.id, x.name || '', t(x.zone), t(tafPhaseDef(pl.p)[1]), v(pl.k), v(pl.s), v(pl.w), v(pl.n), v(pl.r), pl.a ? t(pl.a) : '', pl.c || '', t((LIFE[lifeOf(x)] || {}).n || ''), t(c.cat), q.o.pur ? t(q.o.pur) : '', +x.lat || '', +x.lng || '']; });
  logEvent('تصدير خطة رصد التفويج — ' + rows.length);
  return mtXlsx('خطة رصد التفويج', ['الرقم', 'الاسم', 'المشعر', 'مرحلة الرصد', 'الترتيب', 'المقطع', 'عرض الممر (م)', 'أطقم الآن', 'أطقم مطلوبة', 'حالتها في ملف الخطة', 'التعليق', 'الحالة', 'معيار النقطة', 'الغرض', 'خط العرض', 'خط الطول'], rows);
}

/* ═══ the 1447 file as a layer: its 106 points by their status in the file ═══ */
function tafLayerToggle(){ PV.TAF_LAYER = !PV.TAF_LAYER; if (PV.TAF_LAYER){ CUR = 'map'; } render(); setTimeout(tafLayerSync, 400); }
function tafLayerSync(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  if (PV.TAF_LG){ try { MAP.removeLayer(PV.TAF_LG); } catch (e){} PV.TAF_LG = null; }
  if (!PV.TAF_LAYER || !PV.TAF1447) return;
  var col = { d:PV.TAF47_C, s:'#F59E0B', x:'#94A3B8' }, g = L.layerGroup();
  PV.TAF1447.pts.forEach(function(p){
    L.circleMarker([p[2], p[3]], { renderer:MAP_CV, radius:7, color:'#111', weight:1.5, fillColor:col[p[1]], fillOpacity:.95, dashArray:'2,2' })
      .bindTooltip(t('ملف ١٤٤٧') + ' \u00b7 ' + t('النقطة رقم') + ' ' + p[0] + ' \u00b7 ' + t(PV.TAF1447.f[p[1]])).addTo(g);
  });
  PV.TAF_LG = g.addTo(MAP);
}

/* clicks — called from the click router */
function clickTafweej(e){   /* named click… so the global guard (actList) reads its attributes — a name outside that pattern had its buttons swallowed */
  var el;
  if ((el = e.target.closest('[data-tafok]'))){ tafSave(el.getAttribute('data-tafok'), 'ok'); return true; }
  if ((el = e.target.closest('[data-tafno]'))){ PV.TAF_REJ = el.getAttribute('data-tafno'); PV.TAF_WHYSEL = ''; render(1); return true; }
  if ((el = e.target.closest('[data-tafwhy]'))){ PV.TAF_WHYSEL = el.getAttribute('data-tafwhy'); var ta = document.getElementById('tafNote'), keep = ta ? ta.value : ''; render(1); var ta2 = document.getElementById('tafNote'); if (ta2) ta2.value = keep; return true; }
  if ((el = e.target.closest('[data-tafsave]'))){ var n = document.getElementById('tafNote'); if (!PV.TAF_WHYSEL){ toast(t('اختر سببَ الرفض')); return true; } tafSave(el.getAttribute('data-tafsave'), 'no', PV.TAF_WHYSEL, n ? n.value : ''); return true; }
  if (e.target.closest('[data-tafcancel]')){ PV.TAF_REJ = ''; render(1); return true; }
  if ((el = e.target.closest('[data-tafundo]'))){ if (confirm(t('تراجعٌ عن القرار — تعود النقطةُ متبقّية؟'))) tafSave(el.getAttribute('data-tafundo'), ''); return true; }
  if ((el = e.target.closest('[data-tafrepl]'))){
    var id = el.getAttribute('data-tafrepl'), x = siteFind(id); if (!x) return true;
    PV.NS_REPL = id; NEWSITE.zone = x.zone; NEWSITE.type = x.type; NEWSITE.lat = +x.lat; NEWSITE.lng = +x.lng; NEWSITE.nm = '';
    goPage('newsite'); render(); toast(t('حرّك الموضع إلى المكان الصحيح ثم احفظ — تُسجَّل بديلًا عن') + ' ' + id); return true; }
  if ((el = e.target.closest('[data-tafpur]'))){ var pp = el.getAttribute('data-tafpur').split('|'), o = tafOf(pp[0]) || {}; tafSave(pp[0], o.d || '', o.why, o.note, { pur:o.pur === pp[1] ? '' : pp[1] }); return true; }
  if ((el = e.target.closest('[data-tafcrit]'))){ var ci = document.getElementById('tafCrit'), o2 = tafOf(el.getAttribute('data-tafcrit')) || {}; tafSave(el.getAttribute('data-tafcrit'), o2.d || '', o2.why, o2.note, { crit:ci ? String(ci.value || '').trim().slice(0, 300) : '' }); toast(t('حُفظ')); return true; }
  if ((el = e.target.closest('[data-tafz]'))){ var z = el.getAttribute('data-tafz'); PV.TAF_Z = PV.TAF_Z === z ? '' : z; render(1); return true; }
  if ((el = e.target.closest('[data-tafplist]'))){ PV.TAF_PLIST = el.getAttribute('data-tafplist'); render(1); return true; }
  if ((el = e.target.closest('[data-taflist]'))){ PV.TAF_LIST = el.getAttribute('data-taflist'); render(1); return true; }
  if (e.target.closest('[data-tafxl]')){ tafXlsx(); return true; }
  if ((el = e.target.closest('[data-tafph]'))){ var ph = el.getAttribute('data-tafph').split('|'); tafPlanSet(ph[0], ph[1] || ''); return true; }   /* (V47.12) */
  if ((el = e.target.closest('[data-tafphc]'))){ var pc = document.getElementById('tafPlanC'); tafPlanSet(el.getAttribute('data-tafphc'), null, pc ? pc.value : ''); return true; }
  if ((el = e.target.closest('[data-tafcat]'))){ var ck = el.getAttribute('data-tafcat'); PV.TAF_CAT = PV.TAF_CAT === ck ? '' : ck; render(1); return true; }   /* (V44.4) */
  if (e.target.closest('[data-tafcatxl]')){ tafCatXlsx(); return true; }
  if ((el = e.target.closest('[data-tafadd]'))){
    var pn = el.getAttribute('data-tafadd'), pt = (PV.TAF1447.pts || []).filter(function(q){ return q[0] === pn; })[0]; if (!pt) return true;
    PV.NS_REPL = ''; NEWSITE.zone = 'منى'; NEWSITE.type = 'ممر'; NEWSITE.lat = pt[2]; NEWSITE.lng = pt[3]; NEWSITE.nm = t('ملف ١٤٤٧') + ' — ' + t('النقطة رقم') + ' ' + pn;
    goPage('newsite'); render(); toast(t('راجع الموضع ثم احفظ')); return true; }
  if (e.target.closest('[data-taflayer]')){ tafLayerToggle(); return true; }
  return false;
}

/* ═══ (V44.4) «تصنيف نقاط الممرات» — the corridor points by where they come from ═══
   Owner: «لستة بالنقاط الخاصة بـ١٤٤٧ … ٣ كاتيجوري: اللي تم من ملف إدارة التفويج موسم ٤٧، واللي لسه (هيتعمل السنة دي)، والإضافات
   بناءً على المسح الميداني ١٤٤٨ — وأيُّ حالةٍ تتغيّر هناك تتغيّر هنا وعلى الخريطة». Each point carries its live stage (lifeOf);
   the file points that have no point in the system yet are listed too, with «أضفها نقطة» for whoever may add. Arafat stands apart. */
PV.TAF_STAGE = [
  ['todo',  'لم تُزَر بعد',                ['todo', 'assigned', 'tomorrow', 'stuck', 'tech']],
  ['vis',   'زِيرت',                       ['visited', 'revisit']],
  ['wait',  'بانتظار اعتماد إدارة التفويج', ['minwait']],
  ['ready', 'معتمدة — للتركيب',            ['ready', 'sched', 'inprog', 'insfail']],
  ['inst',  'مركّبة',                       ['installed', 'handed', 'maint']],
  ['no',    'مرفوضة',                      ['minback']],
  ['dis',   'مفكوكة',                      ['dis']]
];
function tafStage(x){
  var lf = lifeOf(x), hit = PV.TAF_STAGE[0];
  PV.TAF_STAGE.forEach(function(g){ if (g[2].indexOf(lf) > -1) hit = g; });
  return { k:hit[0], n:hit[1], c:(LIFE[hit[2][0]] || LIFE.todo).c, life:lf };
}
/* (V46.4) each categorisation number opens the detail window with its points */
function tafCatReg(CS){
  CS.forEach(function(c){
    MFU.lists['tafcat|' + c.k] = { title:t(c.n), head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
      base:function(){ var L = tafSites('').map(function(q){ return q.x; }); return { n:L.length, name:t('نقاطُ ممرات'), zones:svZoneTot(L) }; },
      rows:function(){ return c.L.map(function(q){ var x = q.x, r = STATE.recs[x.id], cx = taxOf(x);
        return [x.id, String(x.name || ''), t(cx.g), t(cx.t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', r ? (r.by || '') : '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
  });
}
function tafCats(){
  var P = PV.TAF1447 || { pts:[], m:{} }, used = {}, A = [], B = [], C = [], D = [];
  tafSites('').forEach(function(q){
    var x = q.x, m = P.m[x.id];
    if (x.zone === 'عرفات'){ D.push(q); return; }
    if (m) used[m[0]] = 1;
    /* (V44.5) owner: «عندك النقاط اللي اتركبت في ١٤٤٧ — ٤٤، منهم واحدة في ممر الشعيبين». The registry's «إعادة تركيب ١٤٤٧» is the
       record of what was installed (44); the file holds 43 of them — the Al-Shuaibin tunnel point is not in it. */
    if (x.work === 'إعادة تركيب ١٤٤٧' || (m && m[1] === 'd')) A.push(Object.assign({ n:m ? m[0] : '', f:m ? m[1] : '' }, q));
    else if (m) B.push(Object.assign({ n:m[0], f:m[1] }, q));
    else C.push(q);
  });
  var orphan = P.pts.filter(function(p){ return p[1] !== 'd' && !used[p[0]]; });   /* file points with no point in the system yet */
  return [
    { k:'done',  n:'رُكّبت في موسم ١٤٤٧ — من نقاط إدارة التفويج',                                       L:A, orphan:[] },
    { k:'left',  n:'من ملف ١٤٤٧ ولم يُنجَز — يُنفَّذ هذا الموسم',                  L:B, orphan:orphan },
    { k:'add',   n:'إضافاتٌ بناءً على المسح الميداني ١٤٤٨',                        L:C, orphan:[] },
    { k:'arf',   n:'ممرات عرفات — دراسةُ الذهاب إلى جبل الرحمة والدخول إليه',      L:D, orphan:[] }
  ];
}
function tafStageBar(L){
  var cnt = {}; L.forEach(function(q){ var s = tafStage(q.x); cnt[s.k] = (cnt[s.k] || 0) + 1; });
  var tot = L.length || 1;
  return '<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:rgba(127,127,127,.15)" aria-hidden="true">'
    + PV.TAF_STAGE.map(function(g){ return cnt[g[0]] ? '<span title="' + esc(t(g[1]) + ' \u00b7 ' + cnt[g[0]]) + '" style="width:' + (100 * cnt[g[0]] / tot) + '%;background:' + (LIFE[g[2][0]] || LIFE.todo).c + '"></span>' : ''; }).join('') + '</div>'
    + '<div class="hint" style="display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 0">' + PV.TAF_STAGE.filter(function(g){ return cnt[g[0]]; }).map(function(g){
        return '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:9px;height:9px;border-radius:2px;display:inline-block;background:' + (LIFE[g[2][0]] || LIFE.todo).c + '"></span>' + esc(t(g[1])) + ' <b>' + nm(cnt[g[0]]) + '</b></span>'; }).join('') + '</div>';
}
function tafCatDash(){
  var CS = tafCats(), open = PV.TAF_CAT || '', me = tafMay();   /* adding a file point is the tafweej management's and the office's */
  var tot = CS.reduce(function(s, c){ return s + c.L.length; }, 0);
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('نقاطُ الممرات بحسب أصلها: ما أُنجز من ملف إدارة التفويج لموسم ١٤٤٧، وما بقي منه، وما أُضيف بناءً على المسح الميداني لهذا الموسم — بحالة كلِّ نقطةٍ الآن، وتتغيّر مع الخريطة.')) + '</p>'
    + (tafCatReg(CS), stats([['نقاطُ ممرات', nm(tot)]].concat(CS.map(function(c){ return [c.n, nm(c.L.length) + (c.orphan.length ? ' + ' + nm(c.orphan.length) : ''), '', 'tafcat|' + c.k]; }))))
    + '<div class="actions" style="margin:0 0 10px;gap:8px;flex-wrap:wrap">' + btn('\u2B07 Excel', 'btn-secondary btn-sm', ' data-tafcatxl="1"')
    + btn((PV.TAF_LAYER ? '\u2713 ' : '') + t('نقاطُ ملف ١٤٤٧ على الخريطة'), 'btn-secondary btn-sm', ' data-taflayer="1"') + '</div>';
  CS.forEach(function(c){
    var on = open === c.k;
    h += '<div class="card" style="margin:0 0 10px' + (c.k === 'done' ? ';border-inline-start:5px solid ' + PV.TAF47_C : '') + '">'
      + '<button type="button" data-tafcat="' + c.k + '" style="display:flex;justify-content:space-between;align-items:baseline;width:100%;background:none;border:0;padding:0;cursor:pointer;color:inherit;text-align:start">'
      + '<b style="font-size:16px">' + esc(t(c.n)) + '</b><span><b style="font-size:20px">' + nm(c.L.length) + '</b>' + (c.orphan.length ? ' <span class="hint" style="margin:0">+ ' + nm(c.orphan.length) + ' ' + esc(t('بلا نقطةٍ في النظام بعد')) + '</span>' : '') + ' ' + (on ? '\u25B4' : '\u25BE') + '</span></button>'
      + '<div style="margin:8px 0 0">' + tafStageBar(c.L) + '</div>';
    if (on){
      h += c.L.slice().sort(function(a, b){ return (a.n || 0) - (b.n || 0) || (a.x.id < b.x.id ? -1 : 1); }).map(function(q){
        var x = q.x, st = tafStage(x);
        return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line, #e2e2e2);padding:6px 0">'
          + (q.n ? '<span class="pill" title="' + esc(t('رقمها في ملف ١٤٤٧')) + '">#' + esc(q.n) + '</span>' : '')
          + '<span style="flex:1;min-width:180px"><b><bdi>' + esc(x.id) + '</bdi></b> \u00b7 ' + esc(x.name || '') + '</span>'
          + '<span class="pill" style="border-color:' + st.c + ';color:' + st.c + '">' + esc(t(st.n)) + '</span>'
          + btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-fly="' + esc(x.id) + '"') + '</div>';
      }).join('');
      if (c.orphan.length) h += '<h4 style="margin:12px 0 6px">' + esc(t('نقاطٌ في ملف ١٤٤٧ ليس لها نقطةٌ في النظام بعد')) + ' <b class="num">' + nm(c.orphan.length) + '</b></h4>'
        + c.orphan.map(function(p){
            return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line, #e2e2e2);padding:6px 0"><span class="pill">#' + esc(p[0]) + '</span>'
              + '<span style="flex:1;min-width:180px">' + esc(t(PV.TAF1447.f[p[1]])) + ' \u00b7 <bdi dir="ltr">' + p[2].toFixed(5) + ', ' + p[3].toFixed(5) + '</bdi></span>'
              + (me ? btn('\u2795 ' + t('أضفها نقطة'), 'btn-secondary btn-sm', ' data-tafadd="' + esc(p[0]) + '"') : '') + '</div>';
          }).join('');
    }
    h += '</div>';
  });
  return h;
}
function tafCatXlsx(){
  var rows = [];
  tafCats().forEach(function(c){
    c.L.forEach(function(q){ var st = tafStage(q.x); rows.push([t(c.n), q.x.id, q.x.name || '', q.n || '', q.f ? t(PV.TAF1447.f[q.f]) : '', t(st.n), tafPlanMeta() ? t(tafPhaseDef(tafPhase(q.x.id))[1]) : q.d === 'ok' ? t('معتمدة') : q.d === 'no' ? t('مرفوضة') : t('متبقّية'), +q.x.lat || '', +q.x.lng || '']); });
    c.orphan.forEach(function(p){ rows.push([t(c.n), '', t('بلا نقطةٍ في النظام بعد'), p[0], t(PV.TAF1447.f[p[1]]), '', '', p[2], p[3]]); });
  });
  logEvent('تصدير تصنيف نقاط الممرات \u2014 ' + rows.length);
  return mtXlsx('تصنيف نقاط الممرات', ['التصنيف', 'الرقم', 'الاسم', 'رقمها في ملف ١٤٤٧', 'حالتها في ملف ١٤٤٧', 'المرحلة الآن', tafPlanMeta() ? 'مرحلة الرصد' : 'اعتماد إدارة التفويج', 'خط العرض', 'خط الطول'], rows);
}

/* ═══ (V44.7) «المواصفات الفنية» — the corridor point's method and every device with its datasheet ═══
   Owner (5 Nov): «ضيف الملفات دي في السيستم — الأجهزة والقارئات والكاميرات — عشان طلب الدكتور وسام المواصفات كلها». The method lines are
   the owner's own statement; each device's lines are read from its datasheet in specs/ (the file opens from here). */
PV.TAF_METHOD = [
  'نقطةُ الممر بوابةٌ افتراضية: يحدّد القارئُ وهوائياتُه آخرَ قراءةٍ لبطاقة الحاج عند النقطة، وتعدّ الكاميرا الأشخاصَ في كادرٍ محدَّد فتعطي مؤشّرًا على الكثافة.',
  'تغطّي النقطةُ عرضًا حتى ١٥ مترًا بستة هوائيات، وعمقًا من ٤ إلى ٦ أمتار على امتداد الممر؛ فإن كان الممرُّ أعرضَ وُضعت فيه نقطتان متجاورتان.',
  'في كلِّ نقطةٍ من ٦ إلى ٨ هوائيات بحسب عرض الممر، وتُضبط زاويتُها وارتفاعُها بالتجربة في الموقع ضمن مدى ٣٥ إلى ٧٠ درجة.',
  'القارئُ والهوائياتُ قابلةٌ للضبط، وتُجرَّب كلُّ نقطةٍ في موقعها، فلا يقع تداخلٌ بين نطاقات النقاط.',
  'اتجاهُ الحركة: في منى من المخيمات إلى الجمرات كما في موسم ١٤٤٧، ويغطّي موسمُ ١٤٤٨ نقاطَ العودة من الجمرات إلى المخيمات؛ وفي عرفات لم يُحدَّد اتجاهٌ بعد إلى حين ورود معلوماتٍ أخرى.',
  'لكلِّ نقطةٍ اسمٌ خاصٌّ بها يظهر في بطاقتها وفي القوائم والتصدير.'
];
PV.TAF_SPECS = [
  ['قارئ نقاط الممرات والجمرات', 'SRSRU8-16', 'Path_Reader.pdf', ['٨ منافذ هوائي · شريحة Impinj E710', 'حتى ٨٠٠ بطاقة في الثانية', 'قدرة بث حتى ٣٣ ديسيبل ملّي واط قابلة للضبط', 'مسافة القراءة حتى ٢٥ مترًا بحسب الهوائي والبطاقة', 'حماية IP65 · تغذية ١٢ فولت']],
  ['هوائي نقاط الممرات', 'SRRA12-01', 'Path_Antenna.pdf', ['كسب ١٢ ديسيبل', 'عرض الحزمة ٤٠° أفقيًّا و٤٠° رأسيًّا', 'حماية IP67']],
  ['كاميرا نقاط الممرات', 'MS-C8266-X4RIPG1', 'Path_Cam.pdf', ['دقة 4K (3840×2160) · مستشعر 1/1.8″', 'عدُّ الأشخاص في حتى ٤ مناطق وعدُّ عبور الخط', 'حماية IP67 وIK10']],
  ['قارئ المخيمات', 'SRREU6-04', 'Tent_Reader.pdf', ['٤ منافذ هوائي', 'حتى ٤٠٠ بطاقة في الثانية', 'قدرة بث حتى ٣٣ ديسيبل ملّي واط قابلة للضبط', 'مسافة القراءة حتى ٢٥ مترًا بحسب الهوائي والبطاقة', 'حماية IP53']],
  ['هوائي المخيمات', 'SRRA9-01', 'Tent_Antenna.pdf', ['كسب ٩ ديسيبل', 'عرض الحزمة ٦٠° أفقيًّا و٥٥° رأسيًّا', 'حماية IP67']],
  ['كاميرا المخيمات', 'MS-C8163-PE', 'Tent_CAM.pdf', ['ميني بوليت بدقة 4K (3840×2160)', 'عدُّ العابرين للخط · رؤيةٌ ليلية حتى ٥٠ مترًا', 'حماية IP67 وIK10']],
  ['كاميرا الجمرات', 'MS-C8267-X20PE', 'PTZ_Cam.pdf', ['تحريكٌ وإمالةٌ وزوم بصري مع تتبّعٍ تلقائي', 'رؤيةٌ ليلية حتى ١٨٠ مترًا', 'حماية IP66']],
  ['الراوتر', 'UR35', 'Router_UR35.pdf', ['اتصال 4G LTE بشريحتين احتياطيتين', '٥ منافذ إيثرنت وواي فاي', 'أنفاقٌ آمنة VPN']],
  ['بوابة المستشعرات', 'UG65', 'Gateway_UG65.pdf', ['بوابة LoRaWAN بثماني قنوات', 'مدى حتى ١٥ كم في خط النظر ونحو ٢ كم في المناطق العمرانية', 'حماية IP65']],
  ['مستشعر الحرارة والرطوبة', 'EM300-TH', 'Temp_Hum_sensor.pdf', ['يقيس من −٣٠ إلى ٧٠ درجة مئوية والرطوبة من ٠ إلى ١٠٠٪', 'دقةُ الرطوبة ±٣٪ · اتصال LoRaWAN', 'بطارية ٤٠٠٠ ملّي أمبير قابلة للاستبدال · حماية IP67']]
];
/* (V44.9) owner: «ملف نطاق العمل وملف دليل إدارة التفويج يتضافوا على المنصة، واللي يدخل باليوزر بتاعه ينزّلهم زي المواصفات الفنية» */
PV.TAF_DOCS = [
  ['نطاق العمل الفني لنقاط الممرات', 'Scope_Corridor_Points_1448.pdf', 'طريقة عمل النقطة ونطاق تغطيتها، والأجهزة ومواصفاتها وأعدادها، واتجاه الحركة، وملف المواقع'],
  ['دليل المستخدم — إدارة التفويج', 'Guide_Tafweej_1448.pdf', 'الاعتماد والرفض من الخريطة، وإضافة النقاط، ولوحة الاعتمادات والتصنيف — بالصور']
];
function tafSpecsHtml(){
  return tafRefHtml() + '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">\u{1F4DA} ' + esc(t('ملفات إدارة التفويج')) + '</h4>'
    + PV.TAF_DOCS.map(function(d){
        return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:8px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
          + '<div style="flex:1 1 220px;min-width:0"><b>' + esc(t(d[0])) + '</b><div class="hint" style="margin:2px 0 0">' + esc(t(d[2])) + '</div></div>'
          + '<a class="btn btn-secondary btn-sm" href="specs/' + encodeURIComponent(d[1]) + '" target="_blank" rel="noopener">\u2B07 ' + esc(t('تنزيل')) + '</a></div>';
      }).join('') + '</div>'
    + '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">\u{1F4D0} ' + esc(t('طريقة عمل نقطة الممر')) + '</h4>'
    + PV.TAF_METHOD.map(function(l){ return '<p style="margin:0 0 6px;line-height:1.7">\u2022 ' + esc(t(l)) + '</p>'; }).join('') + '</div>'
    + '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">\u{1F4C4} ' + esc(t('المواصفات الفنية للأجهزة')) + '</h4>'
    + PV.TAF_SPECS.map(function(d){
        return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:8px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start">'
          + '<div style="flex:1 1 220px;min-width:0"><b>' + esc(t(d[0])) + '</b> <span class="hint" style="margin:0"><bdi dir="ltr">' + esc(d[1]) + '</bdi></span>'
          + d[3].map(function(l){ return '<div class="hint" style="margin:2px 0 0">' + esc(t(l)) + '</div>'; }).join('') + '</div>'
          + '<a class="btn btn-secondary btn-sm" href="specs/' + encodeURIComponent(d[2]) + '" target="_blank" rel="noopener">\u{1F4C4} ' + esc(t('ملف المواصفات')) + '</a></div>';
      }).join('') + '</div>';
}
