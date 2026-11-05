/* ============================================================================
   FILE    : src/04-office/04-tasks-office-23-tafweej.js
   DOMAIN  : Office — «اعتماد إدارة التفويج» (V44.2): approval on the map, the point's criterion, the dashboard
   PURPOSE : The tafweej management approves or rejects the corridor points of Mina and Arafat from the point's card on the
             map (a reason and a comment for a rejection), adds a replacement when a point is in the wrong place, and follows it
             all in «متابعة الوزارة ← اعتمادات إدارة التفويج». Every corridor point's card says WHY the point is there: for Mina,
             its place in the tafweej management's 1447 file (PV.TAF1447) or that it completes those paths this season; for
             Arafat, the paths to Namirah Mosque, Jabal al-Rahma and the train, with the purpose chosen per point.
   DEFINES : PV.TAF_STAGE, tafStage, tafCats, tafStageBar, tafCatDash, tafCatXlsx, tafSave, tafSites, tafCrit, tafCritHtml, tafPopHtml, tafDash, tafXlsx, tafLayerToggle, tafLayerSync, clickTafweej
   NOTE    : The scope, the decision and the gate are in core (03-survey-records-05: PV.TAF_SCOPE, tafInScope, tafOf,
             tafDecision, tafMay, minState). Decisions live in settings/tafappr (one live document).
   ============================================================================ */
PV.TAF_PUR = ['مسجد نمرة', 'جبل الرحمة', 'تفويج القطار'];
PV.TAF_COL = { ok:'#22C55E', no:'#E5484D', '':'#94A3B8' };

function tafSave(id, d, why, note, extra){
  if (!tafMay()){ toast(t('الاعتمادُ لإدارة التفويج والمهندس')); return false; }
  if (!tafInScope(id)){ toast(t('الاعتمادُ لنقاط الممرات في منى وعرفات')); return false; }
  if (d === 'no' && !String(note || '').trim()){ toast(t('اكتب سببَ الرفض')); return false; }
  var prev = tafOf(id) || {}, v = Object.assign({}, prev, extra || {}, { d:d, why:d === 'no' ? (why || '') : '', note:d === 'no' ? String(note || '').trim() : '' });
  if (d !== (prev.d || '') || !prev.by){ v.by = STATE.meta.name || ''; v.at = Date.now(); }   /* who decided and when — a purpose or a note added later keeps the decider */
  STATE.taf = STATE.taf || {}; STATE.taf[id] = v; if (DB.memo) DB.memo.life = null;
  var patch = {}; patch[id] = v;
  if (typeof FB !== 'undefined' && FB.ready && FB.db) DB.col('settings').doc('tafappr').set({ m:patch, at:Date.now(), _by:STATE.meta.uid || '', _at:Date.now() }, { merge:true })
    .catch(function(e){ softErr('اعتماد إدارة التفويج', e, t('تعذّر الحفظ — تحقّق من الاتصال')); });
  else toast(t('لا اتصال — اعتمِد حين يعود الاتصال'));
  var same = extra && d === (prev.d || '');
  logEvent((same ? 'تحديث معيار نقطة' : d === 'ok' ? 'اعتماد إدارة التفويج' : d === 'no' ? 'رفض إدارة التفويج' : 'تراجع عن قرار إدارة التفويج') + ' \u2014 ' + id + (v.why ? ' \u00b7 ' + v.why : '') + (v.note ? ' \u00b7 ' + v.note.slice(0, 120) : ''), id);
  PV.TAF_REJ = ''; render(1);
  return true;
}
/* the points in scope, each with its decision */
function tafSites(zone){
  return (STATE.sites || []).filter(function(x){ return tafScopeOk(x) && (!zone || x.zone === zone); })
    .map(function(x){ return { x:x, o:tafOf(x.id) || {}, d:tafDecision(x.id) }; });
}
function tafDist(a, b){ var r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos(a.lat * r), y = (b.lat - a.lat) * r; return 6371000 * Math.sqrt(x * x + y * y); }

/* WHY the point is here — from the 1447 file for Mina, from the Arafat paths for Arafat; distances measured, never assumed */
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
    if (m) L.push(['في الملف', t('النقطة رقم') + ' ' + m[0] + ' \u00b7 ' + t(P.f[m[1]]) + ' \u00b7 ' + t('على بعد') + ' ' + nm(m[2]) + ' ' + t('م')]);
    else if (re47) L.push(['في الملف', t('رُكّبت في موسم ١٤٤٧ وفق سجلّ التركيب — وليست ضمن نقاط ملف إدارة التفويج')]);
    else {
      var nk = 0, nn = ''; P.pts.forEach(function(q){ var dd = tafDist({ lat:+x.lat, lng:+x.lng }, { lat:q[2], lng:q[3] }); if (!nk || dd < nk){ nk = dd; nn = q[0]; } });
      L.push(['في الملف', t('ليست في ملف ١٤٤٧ — أُضيفت لإكمال تغطية مسارات الملف ورفع دقة البيانات') + (nk ? ' \u00b7 ' + t('أقربُ نقطةٍ في الملف') + ' ' + nn + ' ' + t('على بعد') + ' ' + nm(Math.round(nk)) + ' ' + t('م') : '')]);
    }
    if (path) L.push(['المسار', path]);
    return { cat:cat, lines:L.concat(near ? [['أقربُ نقطة ممرٍّ أخرى', nm(Math.round(near)) + ' ' + t('م')]] : []).concat(o.crit ? [['ملاحظة', o.crit]] : []) };
  }
  if (x.zone === 'عرفات'){
    L.push(['الدراسة', 'تمّت الدراسةُ وتحديدُ النقاط بناءً على الذهاب إلى جبل الرحمة والدخول إليه']);   /* (V44.3) owner's sentence, on every Arafat corridor card */
    L.push(['الأساس', 'تغطيةُ مسارات المشاة إلى مسجد نمرة وجبل الرحمة وتفويج القطار']);
    L.push(['غرضُ هذه النقطة', o.pur ? t(o.pur) : t('لم يُحدَّد بعد')]);
    if (near) L.push(['أقربُ نقطة ممرٍّ أخرى', nm(Math.round(near)) + ' ' + t('م')]);
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
  if (!s || !tafInScope(s.id)) return '';
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
    + btn((PV.TAF_LAYER ? '\u2713 ' : '') + t('نقاطُ ملف ١٤٤٧ على الخريطة'), 'btn-secondary btn-sm', ' data-taflayer="1"') + '</div>';
  if (!Z) return h + '<p class="hint">' + esc(t('اضغط مشعرًا لترى بطاقتَه: القوائم وأسباب الرفض.')) + '</p>';
  /* the holy site's scorecard */
  var S = tafSites(Z), C = cnt(S), reasons = {};
  S.forEach(function(q){ if (q.d === 'no'){ var k = q.o.why || 'سببٌ آخر'; reasons[k] = (reasons[k] || 0) + 1; } });
  var rk = Object.keys(reasons).sort(function(a, b){ return reasons[b] - reasons[a]; }), rmax = rk.length ? reasons[rk[0]] : 1;
  var list = S.filter(function(q){ return LST === 'ok' ? q.d === 'ok' : LST === 'no' ? q.d === 'no' : !q.d; });
  var chip = function(k, l, n){ return '<button type="button" class="chip' + (LST === k ? ' on' : '') + '" data-taflist="' + k + '">' + esc(t(l)) + ' ' + nm(n) + '</button>'; };
  h += '<div class="card" style="margin:0 0 10px"><h4 style="margin:0 0 8px">' + esc(t(Z)) + ' \u2014 ' + esc(t('بطاقةُ المشعر')) + '</h4>'
    + stats([['نقاطُ ممرات', nm(C.n)], ['معتمدة', nm(C.ok), C.ok ? 'acc' : ''], ['مرفوضة', nm(C.no), C.no ? 'bad' : ''], ['متبقّية', nm(C.left), C.left ? 'wrn' : '']])
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
  return h;
}
function tafXlsx(){
  var rows = tafSites('').map(function(q){ var c = tafCrit(q.x) || { cat:'', lines:[] }, m = (PV.TAF1447 || { m:{} }).m[q.x.id];
    return [q.x.id, q.x.name || '', t(q.x.zone), q.d === 'ok' ? t('معتمدة') : q.d === 'no' ? t('مرفوضة') : t('متبقّية'), q.d === 'no' ? t(q.o.why || '') : '', q.o.note || '', q.o.by || '', q.o.at ? dayKey(q.o.at) : '',
      t(c.cat), m ? m[0] : '', m ? t(PV.TAF1447.f[m[1]]) : '', q.o.pur ? t(q.o.pur) : '', q.o.repl || '', +q.x.lat || '', +q.x.lng || ''];
  });
  logEvent('تصدير اعتمادات إدارة التفويج \u2014 ' + rows.length);
  return mtXlsx('اعتمادات إدارة التفويج', ['الرقم', 'الاسم', 'المشعر', 'القرار', 'سبب الرفض', 'التعليق', 'بواسطة', 'التاريخ', 'معيار النقطة', 'رقمها في ملف ١٤٤٧', 'حالتها في ملف ١٤٤٧', 'الغرض', 'البديل', 'خط العرض', 'خط الطول'], rows);
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
  if ((el = e.target.closest('[data-taflist]'))){ PV.TAF_LIST = el.getAttribute('data-taflist'); render(1); return true; }
  if (e.target.closest('[data-tafxl]')){ tafXlsx(); return true; }
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
    + stats([['نقاطُ ممرات', nm(tot)]].concat(CS.map(function(c){ return [c.n, nm(c.L.length) + (c.orphan.length ? ' + ' + nm(c.orphan.length) : '')]; })))
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
    c.L.forEach(function(q){ var st = tafStage(q.x); rows.push([t(c.n), q.x.id, q.x.name || '', q.n || '', q.f ? t(PV.TAF1447.f[q.f]) : '', t(st.n), q.d === 'ok' ? t('معتمدة') : q.d === 'no' ? t('مرفوضة') : t('متبقّية'), +q.x.lat || '', +q.x.lng || '']); });
    c.orphan.forEach(function(p){ rows.push([t(c.n), '', t('بلا نقطةٍ في النظام بعد'), p[0], t(PV.TAF1447.f[p[1]]), '', '', p[2], p[3]]); });
  });
  logEvent('تصدير تصنيف نقاط الممرات \u2014 ' + rows.length);
  return mtXlsx('تصنيف نقاط الممرات', ['التصنيف', 'الرقم', 'الاسم', 'رقمها في ملف ١٤٤٧', 'حالتها في ملف ١٤٤٧', 'المرحلة الآن', 'اعتماد إدارة التفويج', 'خط العرض', 'خط الطول'], rows);
}
