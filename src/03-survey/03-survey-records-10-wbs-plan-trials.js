/* ============================================================================
   FILE    : src/03-survey/03-survey-records-10-wbs-plan-trials.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Work breakdown structure, plan versus actual, plan export with formulas, item file and the trials page.
   DEFINES : wbsRows, wbsKeys, wbsDepth, wbsChildren, wbsPct, wbsSvPct, wbsSvPctT, wbsInsPct, wbsAutoPct, wbsPlanPct, wbsVar, wbsVarPill, wbsProjectPct, wbsPlanCard … (+30 more)
   GLOBALS : WBS_AUTO, WBS_DOS, WBS_F
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ جدولُ المتابعة — هيكلُ تقسيم العمل ═══
   الجدولُ الذي يُتابَع به المشروعُ مع الوزارة كان ملفَّ إكسل يُرسَل ويُعدَّل
   باليد: ١٦٣ بندًا بمعرِّف هيكلٍ وبدايةٍ ونهايةٍ وإنجازٍ ومسؤولٍ وجهة. صار في
   النظام: يُستورَد من الملف نفسِه، ويُعدَّل إنجازُ كلِّ بندٍ من المكتب، وتُحسَب
   حالتُه وموقفُه الزمنيُّ من تاريخ اليوم لا من خليةٍ مكتوبة، ويراه الجميعُ —
   والوزارةُ قراءةً — لحظةً بلحظة. الآباءُ يُجمَّع إنجازُهم من أبنائهم. */
function wbsRows(){ return (STATE.wbs && Array.isArray(STATE.wbs.rows)) ? STATE.wbs.rows : []; }
function wbsKeys(){ return (STATE.wbs && Array.isArray(STATE.wbs.keys)) ? STATE.wbs.keys : []; }
function wbsDepth(id){ return String(id || '').split('.').length; }
function wbsChildren(id){ var p = String(id) + '.'; return wbsRows().filter(function(r){ return String(r.id).indexOf(p) === 0 && wbsDepth(r.id) === wbsDepth(id) + 1; }); }
function wbsPct(r){
  var kids = wbsChildren(r.id);
  if (!kids.length){ var ap = wbsAutoPct(r); return ap != null ? ap : Math.max(0, Math.min(100, +r.pct || 0)); }   /* (V30.2) المقيسُ تلقائيًّا */
  var tot = 0, w = 0;
  kids.forEach(function(k){ var d = Math.max(1, +k.dur || 1); tot += wbsPct(k) * d; w += d; });
  return w ? Math.round(tot / w) : 0;
}
/* ═══ (V30.2) الخطةُ مقابلَ الفعلي (فكرةُ المالك #٣) ═══
   المخطّطُ من التواريخ: نسبةُ ما انقضى من مدة البند حتى اليوم (المعلَمُ صفرٌ قبل موعده ومئةٌ بعده)، والآباءُ بأوزان الأبناء.
   الفعليُّ التلقائي: البنودُ التي يقيسها النظامُ بنفسه (المسحُ بالمشعر، تأكيدُ الجمرات، مواقعُ التفويج، التركيبُ) تُقرأ من
   بياناته لا من يد — وغيرُها بما يُكتَب في الملف. والانحرافُ = الفعلي − المخطّط. */
var WBS_AUTO = [
  [/^مسح.*(النوارية|النورية)/, function(){ return wbsSvPctT('النورية'); }],
  [/^مسح.*(الزايدي)/, function(){ return wbsSvPctT('الزايدي'); }],
  [/^مسح.*(الهجرة)/, function(){ return wbsSvPctT('محطات طريق الهجرة'); }],
  [/^مسح.*(التفويج)/, function(){ return wbsSvPct('مراكز التفويج'); }],
  [/^مسح.*(منى)/, function(){ return wbsSvPct('منى'); }],
  [/^مسح.*(عرفات)/, function(){ return wbsSvPct('عرفات'); }],
  [/^مسح.*(مزدلفة|المزدلفة)/, function(){ return wbsSvPct('المزدلفة'); }],
  [/^(مسح|تأكيد).*(الجمرات)/, function(){ var j = jmrConfirm().tot; return j.n ? Math.round(j.ok / j.n * 100) : 0; }],
  [/^مسح.*(القطار|المحطات)/, function(){ return wbsSvPctT('محطات قطار'); }],
  [/^مسح.*(كاميرات|الكاميرات)/, function(){ return wbsSvPct('كاميرات المتابعة'); }],
  [/^(المسح الميداني الشامل|اكتمال المسح الميداني)/, function(){ return svStats().pct; }],
  [/^تركيب.*(منى)/, function(){ return wbsInsPct('منى'); }],
  [/^تركيب.*(عرفات)/, function(){ return wbsInsPct('عرفات'); }],
  [/^تركيب.*(المزدلفة|مزدلفة)/, function(){ return wbsInsPct('المزدلفة'); }],
  [/^(تركيب النقاط|التركيب الميداني|تركيب المواقع|اكتمال التركيب)/, function(){ var K = siteKeyStats().total; return K.n ? Math.round(K.ins / K.n * 100) : 0; }]
];
function wbsSvPct(g){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).g !== g) return; n++; if (svVisited(STATE.recs[x.id])) d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsSvPctT(ty){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).t !== ty) return; n++; if (svVisited(STATE.recs[x.id])) d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsInsPct(g){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).g !== g) return; n++; var st = (STATE.inss[x.id] || {}).status; if (st === 'مُركّب' || x.fstat === 'مُركّب') d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsAutoPct(r){ if (wbsChildren(r.id).length || r.manual) return null; var nm0 = String(r.n || ''); for (var i = 0; i < WBS_AUTO.length; i++){ if (WBS_AUTO[i][0].test(nm0)){ try { return Math.max(0, Math.min(100, +WBS_AUTO[i][1]() || 0)); } catch (e){ return null; } } } return null; }
function wbsPlanPct(r){
  var kids = wbsChildren(r.id), today = dayKey(Date.now());
  if (kids.length){ var tot = 0, w = 0; kids.forEach(function(k){ var d = Math.max(1, +k.w || +k.dur || 1); tot += wbsPlanPct(k) * d; w += d; }); return w ? Math.round(tot / w) : 0; }
  if (!r.s || !r.e) return 0;
  if (r.type === 'معلم') return r.e <= today ? 100 : 0;
  if (today <= r.s) return 0; if (today >= r.e) return 100;
  var a = new Date(r.s).getTime(), b = new Date(r.e).getTime(), n = new Date(today).getTime(); return b > a ? Math.round((n - a) / (b - a) * 100) : 100;
}
function wbsVar(r){ return wbsPct(r) - wbsPlanPct(r); }
function wbsVarPill(v){ return v <= -10 ? pill(t('متأخر') + ' ' + nm(v) + '٪', 'bad') : (v < 0 ? pill(nm(v) + '٪', 'warn') : pill('+' + nm(v) + '٪', 'ok')); }


function wbsStatus(r){ var p = wbsPct(r); return p >= 100 ? 'مكتملة' : (p > 0 ? 'قيد التنفيذ' : 'لم تبدأ'); }
function wbsTiming(r){
  var p = wbsPct(r), today = dayKey(Date.now());
  if (p >= 100) return 'مكتمل';
  if (r.e && r.e < today) return 'متأخر';
  if (r.s && r.s > today) return 'لم يحن موعده';
  /* ═══ بندٌ حلَّ بدؤُه ولم يبدأ (V17.15) ═══
     كان يُقال عنه «ضمن مدته» لأن نهايتَه لم تحن — وهو قد تأخّر عن **بدئه**:
     تاريخُ البدء مضى والإنجازُ صفر. فيُقرأ «لم تبدأ · ضمن مدته» فيُطمأنُّ
     إليه وهو أوّلُ ما يجب أن يُسأل عنه. صار له اسمُه: «تأخّر البدء». */
  if (r.s && r.s < today && p <= 0) return 'تأخّر البدء';
  return 'ضمن مدته';
}
function wbsLeft(r){
  if (!r.e) return null;
  var d = Math.round((new Date(r.e) - new Date(dayKey(Date.now()))) / 86400000);
  return d;
}
/* المرشِّحُ نفسُه للشاشة وللورقة */
function wbsPass(r){
  if (WBS_Q && (r.n + ' ' + r.id + ' ' + (r.resp || '') + ' ' + (r.party || '')).indexOf(WBS_Q) < 0) return false;
  var st = wbsStatus(r), tm = wbsTiming(r);
  if (WBS_F === 'late') return tm === 'متأخر';
  if (WBS_F === 'run') return st === 'قيد التنفيذ';
  if (WBS_F === 'done') return st === 'مكتملة';
  if (WBS_F === 'todo') return st === 'لم تبدأ';
  if (WBS_F === 'ms') return r.type === 'معلم';
  return true;
}
function wbsFiltered(){
  if (!WBS_F && !WBS_Q) return wbsRows();
  var keep = {};
  wbsRows().forEach(function(r){
    if (!wbsPass(r)) return;
    keep[r.id] = 1;                                   /* والآباءُ معه ليُقرأ في سياقه */
    var p = String(r.id).split('.');
    for (var i = 1; i < p.length; i++) keep[p.slice(0, i).join('.')] = 1;
  });
  return wbsRows().filter(function(r){ return keep[r.id]; });
}


function wbsSave(){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return false; }
  STATE.wbs = STATE.wbs || { rows:[], keys:[] };
  STATE.wbs.at = Date.now(); STATE.wbs.by = STATE.meta.name || '';
  CORE.set('cfg', 'wbs', { rows:STATE.wbs.rows, keys:STATE.wbs.keys, at:STATE.wbs.at, by:STATE.wbs.by });
  CORE.saveSoon(); return true;
}
/* ═══ ملفُّ البند (V17.11) ═══
   الجدولُ يقول متى يبدأ البندُ ومتى ينتهي وكم أُنجز — ولا يقول ما يُشترى له
   ولا مَن يدفع ثمنَه ولا ماذا يُركَّب وأين، ولا ما العائدُ منه. فتُسأل هذه
   أربعَ مرات في كلِّ اجتماعٍ وتُجاب من الذاكرة. فصار لكلِّ بندٍ **ملفٌّ**:
   جهةُ الدفع والتكلفة، وأصنافُ ما يُشترى بكمياتها وأسعارها، وماذا يُركَّب
   وكيف وأين، والعائدُ منه بقيمته، وروابطُ ملفاته (كراسة · عرض · مخطّط).
   يُحفَظ في صفِّ البند نفسِه — لا مجموعةَ جديدة ولا قاعدةَ جديدة. */
var WBS_DOS = '';
function dosOf(r){ return (r && r.dos) || {}; }
function dosItems(r){ var d = dosOf(r); return Array.isArray(d.items) ? d.items : []; }
function dosFiles(r){ var d = dosOf(r); return Array.isArray(d.files) ? d.files : []; }
function dosCost(r){ return dosItems(r).reduce(function(a, x){ return a + (+x.q || 0) * (+x.p || 0); }, 0); }
function wbsRow(id){ return wbsRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }


/* شارةٌ على الصفِّ تقول إن للبند ملفًّا — فلا يُفتَح كلُّ بندٍ ليُعرَف */
function dosBadge(r){
  var d = dosOf(r), n = dosItems(r).length, fl = dosFiles(r).length, c = dosCost(r);
  var any = d.payer || d.buy || d.inst || d.val || n || fl;
  return '<button type="button" class="btn btn-quiet btn-sm" data-wbsdos="' + esc(r.id) + '" title="' + esc(t('ملفُّ البند')) + '">'
    + (any ? '\u{1F4C1}' : '\u2795') + (c ? ' <span class="num">' + nm(c) + '</span>' : (fl ? ' <span class="num">' + nm(fl) + '</span>' : '')) + '</button>';
}
function wbsDosSheet(){
  if (!WBS_DOS) return '';
  var r = wbsRow(WBS_DOS); if (!r){ WBS_DOS = ''; return ''; }
  var d = dosOf(r), me = may('settings'), its = dosItems(r), fls = dosFiles(r), cost = dosCost(r);
  var fld = function(k, lab, val, ph){
    return '<div class="field"><label>' + esc(t(lab)) + '</label>'
      + (me ? '<input id="ds' + k + '" dir="auto" value="' + esc(val || '') + '" placeholder="' + esc(t(ph || '')) + '">'
            : '<div style="padding:6px 0">' + (val ? esc(val) : '<span class="hint">' + esc(t('—')) + '</span>') + '</div>') + '</div>';
  };
  return '<div class="wt-back" data-dosclose="0"></div>'
    + '<div class="pop wt-sheet" id="dosSheet" role="dialog" aria-label="' + esc(t('ملفُّ البند')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid num hint" style="margin:0">' + esc(r.id) + '</div>'
    +   '<h3 style="margin-top:3px">' + esc(r.n) + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-dosclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    /* من يدفع وكم */
    + '<div class="grid cols-2">'
    +   fld('Payer', 'من يدفع', d.payer, 'الوزارة · أفاقي · مناصفةً')
    +   fld('Val', 'العائد من البند', d.val, 'ماذا يكسب المشروعُ به؟')
    + '</div>'
    + (me ? '<div class="field"><label>' + esc(t('قيمةُ العائد التقديرية')) + '</label><input id="dsGain" type="number" min="0" step="1" inputmode="numeric" value="' + esc(d.gain || '') + '"></div>'
          : (d.gain ? '<p class="hint" style="margin:0 0 8px">' + esc(t('قيمةُ العائد التقديرية')) + ': <b class="num">' + nm(d.gain) + '</b></p>' : ''))
    /* ماذا يُشترى — أصنافٌ بأسعارها */
    + '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F6D2} ' + esc(t('ما يُشترى'))
    +   (cost ? ' <span class="num">' + nm(cost) + '</span> ' + esc(t('ريال')) : '') + '</div>'
    + fld('Buy', 'وصفُ المشتريات', d.buy, 'ما الذي يُشترى لهذا البند؟')
    + (its.length
        ? table(['الصنف','الكمية','سعر الوحدة','الإجمالي'].concat(me ? [''] : []),
            its.map(function(x, ix){
              var row = [esc(x.n), N(+x.q || 0), N(+x.p || 0), '<b class="num">' + nm((+x.q || 0) * (+x.p || 0)) + '</b>'];
              if (me) row.push(btn('\u{1F5D1}','btn-quiet btn-sm',' data-dosdel="' + esc(r.id) + '|' + ix + '"'));
              return row;
            }).concat([['<b>' + esc(t('الإجمالي')) + '</b>', '', '', '<b class="num">' + nm(cost) + '</b>'].concat(me ? [''] : [])]))
        : '')
    + (me
        ? '<div class="grid cols-3" style="gap:6px">'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الصنف')) + '</label><input id="diN" dir="auto"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الكمية')) + '</label><input id="diQ" type="number" min="0" step="1" value="1"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('سعر الوحدة')) + '</label><input id="diP" type="number" min="0" step="0.01"></div>'
          + '</div><div class="actions" style="margin:6px 0 0">' + btn('\u2795 ' + t('أضِف الصنف'),'btn-secondary btn-sm',' data-dositem="' + esc(r.id) + '"') + '</div>'
        : '')
    /* ماذا يُركَّب وكيف وأين */
    + '<div class="hint" style="margin:12px 0 4px;font-weight:700">\u{1F527} ' + esc(t('ما يُركَّب')) + '</div>'
    + fld('Inst', 'ماذا يُركَّب', d.inst, 'القارئُ والهوائيُّ والراوتر…')
    + '<div class="grid cols-2">'
    +   fld('How', 'كيف', d.how, 'على عمودٍ · على العارضة · داخل لوحة')
    +   fld('Where', 'أين', d.where, 'المشعرُ والمربعُ والنقاطُ المشمولة')
    + '</div>'
    /* الملفات */
    + '<div class="hint" style="margin:12px 0 4px;font-weight:700">\u{1F4CE} ' + esc(t('ملفاتُ البند'))
    +   (fls.length ? ' <span class="num">' + nm(fls.length) + '</span>' : '') + '</div>'
    + (fls.length
        ? '<div class="wt-log">' + fls.map(function(x, ix){
            return '<div class="wt-le"><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.n) + '</a>'
              + ' <span class="hint num" style="margin:0">' + esc(stepAgo(x.at || 0)) + '</span>'
              + (me ? ' ' + btn('\u{1F5D1}','btn-quiet btn-sm',' data-dosfdel="' + esc(r.id) + '|' + ix + '"') : '') + '</div>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('بلا ملفات — أضِف رابطًا من شيربوينت أو درايف.')) + '</p>')
    + (me
        ? '<div class="grid cols-2" style="gap:6px;margin-top:6px">'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('اسمُ الملف')) + '</label><input id="dfN" dir="auto"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الرابط')) + '</label><input id="dfU" dir="ltr" placeholder="https://"></div>'
          + '</div><div class="actions" style="margin:6px 0 0">' + btn('\u{1F4CE} ' + t('أضِف الملف'),'btn-secondary btn-sm',' data-dosfile="' + esc(r.id) + '"') + '</div>'
        : '')
    + (me ? '<div class="actions" style="margin:12px 0 0">' + btn('\u{1F4BE} ' + t('حفظ ملفِّ البند'),'btn-primary btn-sm',' data-dossave="' + esc(r.id) + '"') + '</div>' : '')
    + (d.at ? '<p class="hint" style="margin:8px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(d.by || '')) + ' ' + esc(stepAgo(d.at)) + '</p>' : '')
    + '</div></div>';
}


function wbsSetPct(id, pct){
  var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  r.pct = Math.max(0, Math.min(100, +pct || 0));
  if (wbsSave()){ logEvent('جدول المتابعة — ' + id + ' \u00b7 ' + r.pct + '٪', id); toast(id + ' \u00b7 ' + nm(r.pct) + '٪'); }
}
/* تاريخٌ من خلية إكسل: Date أو رقمٌ تسلسليٌّ أو نصٌّ */
function wbsDate(v){
  if (!v && v !== 0) return '';
  var iso = '';
  if (v && typeof v.getTime === 'function'){ iso = isNaN(v.getTime()) ? '' : new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  else if (typeof v === 'number'){ var d = new Date(Math.round((v - 25569) * 86400000)); iso = isNaN(d) ? '' : d.toISOString().slice(0, 10); }
  else { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(v)); iso = m ? m[1] + '-' + m[2] + '-' + m[3] : ''; }
  return (iso && iso >= '2000-01-01') ? iso : '';
}
function wbsImport(file){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var A = XLSX.utils.sheet_to_json(ws, { header:1, raw:true });
        var hdr = -1, keys = [], v2 = -1;
        /* (V30.2) الإصدارُ ٢ من الخطة: ورقةُ «الجدول الزمني الرئيسي» بأعمدةٍ مسمّاة — تُقرأ بأسمائها لا بمواضعها */
        wb.SheetNames.forEach(function(sn){ if (v2 >= 0) return; var W = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, raw:true });
          for (var q = 0; q < W.length; q++){ if (String(W[q][0] || '').replace(/[\u200f\u200e\s]/g, '') === 'رقمالبند'){ A = W; v2 = q; break; } } });
        if (v2 >= 0){
          var H = A[v2].map(function(h){ return String(h || '').replace(/\s+/g, ' ').trim(); }), col = function(n){ return H.indexOf(n); };
          var ci = { id:col('رقم البند'), n:col('اسم البند'), type:col('النوع'), resp:col('المسؤول'), party:col('الجهة المعنية'), s:col('البداية المعتمدة'), e:col('النهاية المعتمدة'), dur:col('المدة بأيام العمل'), w:col('الوزن'), ms:col('طريقة القياس'), pct:col('الإنجاز الفعلي') };
          var rows2 = [];
          for (var r2 = v2 + 1; r2 < A.length; r2++){ var row2 = A[r2]; if (!row2 || !row2[ci.n]) continue; var id2 = String(row2[ci.id] || '').replace(/[\u200f\u200e\s]/g, ''); if (!id2 || !/^\d/.test(id2)) continue;
            rows2.push({ id:id2, n:String(row2[ci.n]).trim(), s:wbsDate(row2[ci.s]), e:wbsDate(row2[ci.e]), dur:+row2[ci.dur] || 0, pct:Math.max(0, Math.min(100, +row2[ci.pct] || 0)), type:String(row2[ci.type] || 'مهمة').trim(), resp:String(row2[ci.resp] || '').trim(), party:String(row2[ci.party] || '').trim(), w:+row2[ci.w] || 0, ms:String(row2[ci.ms] || '').trim() }); }
          if (!rows2.length){ toast(t('لا صفوفَ في الملف')); return; }
          STATE.wbs = { rows:rows2, keys:(STATE.wbs && STATE.wbs.keys) || [] };
          if (wbsSave()){ logEvent('استيرادُ الخطة التفصيلية (الإصدار ٢) — ' + rows2.length + ' بندًا'); toast(nm(rows2.length) + ' ' + t('بندًا استُورد من الإصدار ٢')); render(1); }
          return;
        }
        for (var i = 0; i < A.length; i++){
          var c0 = String(A[i][0] || '').trim();
          if (c0 === 'المواعيد الحاكمة' && A[i + 1]){
            for (var c = 1; c < A[i].length; c++){ var lab = String(A[i][c] || '').trim(), dt = wbsDate(A[i + 1][c]); if (lab && dt && lab !== 'تاريخ اليوم') keys.push({ n:lab, d:dt }); }
          }
          if (c0 === 'هيكل تقسيم العمل'){ hdr = i; break; }
        }
        if (hdr < 0){ toast(t('لم يُعثَر على صفِّ العناوين «هيكل تقسيم العمل»')); return; }
        var rows = [];
        for (var r = hdr + 1; r < A.length; r++){
          var row = A[r]; if (!row || !row[1]) continue;
          var id = String(row[0] || '').replace(/[\u200f\u200e\s]/g, ''); if (!id) continue;
          rows.push({ id:id, n:String(row[1]).trim(), s:wbsDate(row[2]), e:wbsDate(row[3]), dur:+row[4] || 0,
                      pct:Math.max(0, Math.min(100, +row[5] || 0)), type:String(row[8] || 'مهمة').trim(),
                      resp:String(row[9] || '').trim(), party:String(row[10] || '').trim() });
        }
        if (!rows.length){ toast(t('لا صفوفَ في الملف')); return; }
        /* الإنجازُ المكتوبُ في الملف للآباء يُهمَل — يُجمَّع من الأبناء */
        STATE.wbs = { rows:rows, keys:keys };
        if (wbsSave()){ logEvent('استيرادُ جدول المتابعة — ' + rows.length + ' بندًا'); toast(nm(rows.length) + ' ' + t('بندًا استُورد') + ' \u00b7 ' + nm(keys.length) + ' ' + t('موعدًا حاكمًا')); render(1); }
      } catch (e){ softErr('استيراد جدول المتابعة', e, 'تعذّرت قراءةُ الملف'); }
    };
    fr.readAsArrayBuffer(file);
  });
}
var WBS_F = '', WBS_Q = '', WBS_T = 0, WBS_OPEN = {}, WBS_RESET = 0, WBS_EDIT = '';
/* الجذرُ مفتوحٌ أو مطويّ — والافتراضُ الطيُّ ليُقرأ الجدولُ من فوق */
function wbsShown(id){
  var parts = String(id).split('.');
  for (var i = 1; i < parts.length; i++) if (!WBS_OPEN[parts.slice(0, i).join('.')]) return false;
  return true;
}
/* ═══ التجارب صفحةٌ في «التخطيط» (V17.12) ═══
   التجربةُ تسبق العملَ: يُجرَّب ثم يُقرَّر أيصلح أم لا. فموضعُها مع التخطيط
   لا مع الصرف — وإن كان مصروفُها يظهر في الميزانية ويحكمه مفتاحُها هناك.
   فبقيت الأرقامُ واحدةً في الموضعين: ما يُسجَّل هنا يُحسَب هناك. */
PAGE.trials = { m:'التخطيط', t:'التجارب',
  l:'كلُّ ريالٍ وكلُّ ساعةٍ في التجارب — وقرارُ دخولها في تكاليف المشروع.',
  body:function(){
    return (function(){
      var me = trialMay(), R = trialRows(), inC = trialInCost(), d = trialsDoc();
      var spend = trialsTotal(), hrs = trialsHours(), items = trialsItemsSpend(), buysP = trialsSpend();
      return '<p class="lede" style="margin:0 0 16px">' + esc(t('التجربةُ مصروفٌ ووقتٌ قبل أن تصير عملًا. سجِّل هنا ما اشتُري لها وكم استغرقت، ثم قرِّر بمفتاحٍ واحدٍ أيدخل مصروفُها في تكاليف المشروع أم يبقى مسجَّلًا خارجَها.')) + '</p>'
        + stats([['تجارب', N(R.length)], ['ساعات', N(hrs)],
                 ['أصناف', N(items), 'acc'], ['مشتريات مربوطة', N(buysP)],
                 ['إجماليُّ التجارب', N(spend), 'acc'],
                 ['في تكاليف المشروع', inC ? esc(t('نعم')) : esc(t('لا')), inC ? 'ok' : 'wrn']])
        /* المفتاحُ: قرارٌ يُبدَّل متى شئت ولا يُعاد تسجيلُ شيء */
        + card('', '<label class="sw-row' + (me ? '' : ' is-off') + '">'
            + '<input type="checkbox"' + (inC ? ' checked' : '') + (me ? '' : ' disabled') + ' data-trcost="1">'
            + '<span><b>' + esc(t('احسب مصروف التجارب ضمن تكاليف المشروع')) + '</b>'
            + '<span class="hint" style="display:block;margin:2px 0 0">'
            +   esc(t(inC ? 'المصروفُ داخلٌ الآن في المنصرف المعتمد وفي نسبة استهلاك السقف.'
                          : 'المصروفُ خارجٌ الآن — يُرى في هذا الدفتر ولا يُحسَب على السقف.')) + '</span></span></label>')
        + (me ? card('تجربةٌ جديدة',
            '<div class="grid cols-2">'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('اسم التجربة')) + '</label><input id="trN" dir="auto" placeholder="' + esc(t('ما الذي جُرِّب؟')) + '"></div>'
            + '<div class="field"><label>' + esc(t('التاريخ')) + '</label><input id="trD" type="date" value="' + esc(dayKey()) + '"></div>'
            + '<div class="field"><label>' + esc(t('الساعات')) + '</label><input id="trH" type="number" min="0" step="0.5" inputmode="decimal"></div>'
            /* ما جُرِّب وأين وبأيِّ نتيجة (V17.73): التجربةُ عُدّةٌ في موضعٍ تنتهي بقرار */
            + '<div class="field"><label>' + esc(t('البوابة')) + '</label><input id="trGw" dir="auto" list="trGwL" placeholder="TZone · Milesight">'
            +   '<datalist id="trGwL"><option value="TZone"><option value="Milesight"></datalist></div>'
            + '<div class="field"><label>' + esc(t('عدد البوابات')) + '</label><input id="trGwN" type="number" min="0" step="1" inputmode="numeric"></div>'
            + '<div class="field"><label>' + esc(t('الحساس')) + '</label><input id="trSn" dir="auto" list="trSnL" placeholder="TG08 · EM300">'
            +   '<datalist id="trSnL"><option value="TG08"><option value="EM300"></datalist></div>'
            + '<div class="field"><label>' + esc(t('عدد الحساسات')) + '</label><input id="trSnN" type="number" min="0" step="1" inputmode="numeric"></div>'
            + '<div class="field"><label>' + esc(t('الموضع')) + '</label><input id="trWhere" dir="auto" placeholder="' + esc(t('الوزارة · مخيمٌ قياسي · معرّفُ نقطة')) + '"></div>'
            + '<div class="field"><label>' + esc(t('النتيجة')) + '</label><select id="trOut">'
            +   ['جارية','ناجحة','تحتاج إعادة','لم تنجح'].map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(o)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('رابطُ التقرير على الدرايف')) + '</label><input id="trRep" dir="ltr" inputmode="url" placeholder="https://drive.google.com/…"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('ملاحظة')) + '</label><input id="trNote" dir="auto" placeholder="' + esc(t('النتيجةُ أو ما تعلّمناه')) + '"></div>'
            + '</div>', btn('\u{1F9EA} ' + t('سجّل التجربة'),'btn-primary btn-sm',' data-trnew="1"')) : '')
        + (R.length
            ? R.map(function(r){
                var bs = trialBuys(r.id), sp = trialSpend(r.id), its = trialItems(r), isum = itemsSum(r), tot = trialTotal(r);
                return card('', '<div class="wt-row" style="justify-content:space-between">'
                  + '<div style="min-width:0"><strong>' + esc(r.n) + '</strong>'
                  +   '<div class="hint" style="margin:2px 0 0">' + esc(r.date || '') + (r.by ? ' \u00b7 ' + esc(dispName(r.by)) : '') + '</div></div>'
                  + '<div class="wt-row" style="margin:0">' + pill(nm(+r.hours || 0) + ' ' + t('ساعة'), 'acc')
                  +   pill(nm(tot) + ' ' + t('ريال'), tot ? (inC ? 'ok' : 'warn') : 'off') + '</div></div>'
                  + trialKitHtml(r, me)
                  + (r.note ? '<div class="hint" style="margin:6px 0 0">' + esc(r.note) + '</div>' : '')
                  /* أصنافُ التجربة: كلُّ صنفٍ بكميته وسعرِ وحدته وإجماليِّ سطره */
                  + '<div class="hint" style="margin:8px 0 4px;font-weight:700">\u{1F9FE} ' + esc(t('أصناف التجربة'))
                  +   (isum ? ' <span class="num">' + nm(isum) + '</span> ' + esc(t('ريال')) : '') + '</div>'
                  + (its.length
                      ? table(['الصنف','الكمية','سعر الوحدة','الإجمالي', me ? '' : null].filter(function(x){ return x !== null; }),
                          its.map(function(x, ix){
                            var row = [esc(x.n), N(+x.q || 0), N(+x.p || 0), '<b class="num">' + nm((+x.q || 0) * (+x.p || 0)) + '</b>'];
                            if (me) row.push(btn('\u{1F5D1}','btn-quiet btn-sm',' data-tridel="' + esc(r.id) + '|' + ix + '"'));
                            return row;
                          }).concat([[ '<b>' + esc(t('إجمالي الأصناف')) + '</b>', '', '', '<b class="num">' + nm(isum) + '</b>' ].concat(me ? [''] : [])]))
                      : '<p class="hint" style="margin:0 0 6px">' + esc(t('بلا أصناف — أضِف ما اشتُري لها أدناه.')) + '</p>')
                  + (me ? trialPickHtml(r) : '')   /* (V37.76) المشعرُ والنوعُ ثم قطعُ النوع من الكتالوج */
                  + (bs.length
                      ? '<div class="hint" style="margin:10px 0 4px;font-weight:700">' + esc(t('مشترياتُ هذه التجربة'))
                        +   ' <span class="num">' + nm(sp) + '</span> ' + esc(t('ريال')) + '</div>'
                        + table(['الصنف','المورّد','المبلغ','الحال'], bs.map(function(b){
                            return [esc(b.item), esc(b.sup || ''), N(+b.amt || 0), pill(b.st, b.st === 'معتمد' ? 'ok' : 'warn')]; }))
                      : '<p class="hint" style="margin:8px 0 0">' + esc(t('ولا مشترياتٍ مربوطة — تُربَط من دفتر المشتريات باختيار التجربة.')) + '</p>')
                  + '<div class="alert info" style="margin:8px 0 0"><span><b>' + esc(t('إجمالي التجربة')) + ':</b> <b class="num">' + nm(tot) + '</b> ' + esc(t('ريال'))
                  +   (isum && sp ? ' <span class="hint" style="margin:0">(' + esc(t('أصناف')) + ' ' + nm(isum) + ' + ' + esc(t('مشتريات')) + ' ' + nm(sp) + ')' + '</span>' : '') + '</span></div>'
                  + (me ? '<div class="actions" style="margin:8px 0 0">'
                      + btn('+1 ' + t('ساعة'),'btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|1"')
                      + btn('+0.5','btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|0.5"')
                      + btn('\u2212 0.5','btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|-0.5"')
                      + (tot ? '' : btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-trdel="' + esc(r.id) + '"'))
                      + '</div>' : ''));
              }).join('')
            : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تجاربَ بعد.')) + '</p>'))
        + (d.at ? '<p class="hint" style="margin:6px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(d.by || '')) + ' ' + esc(stepAgo(d.at)) + '</p>' : '');
    })();
  }};

PAGE.wbs = { m:'التخطيط', t:'متابعة الخطة التفصيلية', l:'بنودُ المشروع كلُّها — من يعمل عليها ومتى تنتهي وأين وقفت؛ تُحدَّث من المكتب ويراها الجميع.',
  body:function(){
    /* الإطارُ يرسم ترويسةَ الصفحة — كانت تُرسَم هنا ثانيةً فتظهر مرتين */
    var head = may('settings')
      ? card('', '<div class="actions" style="margin:0">'
          + '<label class="btn btn-secondary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('استيراد من إكسل'))
          + '<input type="file" accept=".xlsx,.xls" data-wbsfile="1" style="display:none"></label>'
          + (wbsRows().length ? btn('\u{1F5D1} ' + t(WBS_RESET ? 'تأكيد المسح — يُمحى الجدولُ كلُّه' : 'امسح الجدول وابدأ من جديد'), WBS_RESET ? 'btn-danger btn-sm' : 'btn-quiet btn-sm', ' data-wbsreset="1"') : '')
          + '</div>') : '';
    var R = wbsRows();
    if (!R.length) return head + card('', '<p class="hint" style="text-align:center;margin:0">'
      + esc(t(may('settings') ? 'لا جدولَ بعد — استورد ملفَ «متابعة مشروع قارئات أفاقي» من الزرِّ أعلاه.' : 'لا جدولَ بعد — يستورده المكتب.')) + '</p>');
    var today = dayKey(Date.now());
    var strip = wbsKeys().length ? '<div class="grid cols-3" style="margin-bottom:10px">' + wbsKeys().map(function(k){
      var left = Math.round((new Date(k.d) - new Date(today)) / 86400000);
      return '<div class="card" style="padding:10px 12px"><div class="hint" style="margin:0">' + esc(k.n) + '</div>'
        + '<div class="num" style="font-size:15px;font-weight:700">' + esc(k.d) + '</div>'
        + '<div>' + (left < 0 ? pill(t('مضى') + ' ' + nm(-left) + ' ' + t('يوم'), 'off') : pill(t('بقي') + ' ' + nm(left) + ' ' + t('يوم'), left <= 14 ? 'warn' : 'ok')) + '</div></div>';
    }).join('') + '</div>' : '';
    var leaves = R.filter(function(r){ return !wbsChildren(r.id).length; });
    var c = { done:0, run:0, todo:0, late:0, ms:0 };
    leaves.forEach(function(r){ var st = wbsStatus(r), tm = wbsTiming(r); if (st === 'مكتملة') c.done++; else if (st === 'قيد التنفيذ') c.run++; else c.todo++; if (tm === 'متأخر') c.late++; if (r.type === 'معلم') c.ms++; });
    var chips = [['','الكل',leaves.length],['late','متأخر',c.late],['run','قيد التنفيذ',c.run],['done','مكتمل',c.done],['todo','لم يبدأ',c.todo],['ms','المعالم',c.ms]];
    var pass = wbsPass;
    /* الأبُ يظهر إن ظهر أحدُ أبنائه أو طابق هو نفسُه */
    var show = {}; R.forEach(function(r){ if (pass(r)){ show[r.id] = 1; var parts = String(r.id).split('.'); for (var i = 1; i < parts.length; i++) show[parts.slice(0, i).join('.')] = 1; } });
    /* البحثُ والمرشِّحُ يفتحان الطريقَ إلى ما طابق؛ وبلا بحثٍ يُطوى ما لم يُفتَح */
    var filtering = !!(WBS_Q || WBS_F);
    var rows = R.filter(function(r){ return show[r.id] && (filtering || wbsShown(r.id)); }).map(function(r){
      var dep = wbsDepth(r.id), kids = wbsChildren(r.id).length, p = wbsPct(r), st = wbsStatus(r), tm = wbsTiming(r), left = wbsLeft(r);
      var op = !!WBS_OPEN[r.id];
      var name = '<div style="padding-inline-start:' + ((dep - 1) * 14) + 'px">'
        + (kids ? '<button type="button" class="btn btn-quiet btn-sm" data-wbstog="' + esc(r.id) + '" style="padding:0 6px;margin-inline-end:4px" aria-label="' + esc(t(op ? 'اطوِ' : 'افتح')) + '">' + (op ? '\u25BE' : '\u25B8') + '</button>' : '')
        /* عددُ الفروع كان رقمًا ملتصقًا باسم البند بين نِسَبٍ وأيامٍ أخرى،
           فيُقرأ جزءًا من الاسم («إدارة المشروع والحوكمة ٣»). صار عمودًا
           قائمًا بذاته له عنوانٌ يقول ما هو (V17.10). */
        + (kids ? '<strong>' : '') + esc(r.n) + (kids ? '</strong>' : '')
        + (r.type === 'معلم' ? ' ' + pill('معلم', 'acc') : '')
        + wtWbsBadge(r.id) + '</div>';
      /* ═══ لا حقلَ مفتوحًا خارج وضع التحرير (V17.17) ═══
         كان إنجازُ البنود الورقيةِ حقلَ رقمٍ مفتوحًا في الجدول لمن يملك
         الضبط — يبدو صفًّا «مفتوحًا» بين صفوفٍ مغلقة بلا سبب، وأخطرُ منه أن
         عجلةَ الفأرة تغيّر قيمةَ حقلِ رقمٍ تحتها وهي تمرّر الصفحة، فتُكتَب
         نسبةٌ لم يقصدها أحدٌ وتُرفَع. صار الإنجازُ يُقرأ في الجدول ويُكتَب
         في وضع التحرير كسائر الحقول — بزرِّ ✎ لا بمرورِ مؤشِّر. */
      var pctTxt = '<span class="num">' + nm(p) + '٪</span>';
      var pctCell = (may('settings') && !kids && wbsAutoPct(r) == null)   /* (V30.2) المقيسُ من النظام لا يُكتَب بيد */
        ? '<input type="number" min="0" max="100" value="' + p + '" data-wbspct="' + esc(r.id) + '" style="width:64px">'
        : pctTxt;
      var tmPill = tm === 'مكتمل' ? pill('مكتمل','ok')
        : (tm === 'متأخر' ? pill('متأخر','bad')
        : (tm === 'تأخّر البدء' ? pill('تأخّر البدء','bad')
        : (tm === 'لم يحن موعده' ? pill('لم يحن موعده','off') : pill('ضمن مدته','warn'))));
      if (WBS_EDIT === r.id && may('settings')){
        /* الحالةُ تُشتقُّ من الإنجاز فلا تُكتَب؛ والنوعُ قائمةٌ تُختار — وكان
           حقلُه يقع تحت عمود «الحالة» لأن الرأسَ بلا عمودِ نوعٍ أصلًا (V17.15) */
        var typeSel = '<select data-wbse="type" style="width:100px">'
          + ['مهمة','معلم'].map(function(x){
              return '<option value="' + esc(x) + '"' + ((r.type || 'مهمة') === x ? ' selected' : '') + '>' + esc(t(x)) + '</option>';
            }).join('') + '</select>';
        return ['<span class="num hint" style="margin:0">' + esc(r.id) + '</span>',
                '<input value="' + esc(r.n) + '" data-wbse="n" dir="auto" style="min-width:200px">',
                kids ? '<span class="num">' + nm(kids) + '</span>' : '<span class="hint">—</span>',
                '<input type="date" value="' + esc(r.s || '') + '" data-wbse="s" style="width:140px">',
                '<input type="date" value="' + esc(r.e || '') + '" data-wbse="e" style="width:140px">',
                pctCell, '<span class="num">' + nm(wbsPlanPct(r)) + '٪</span>', wbsVarPill(wbsVar(r)),   /* (V30.2) */
                pill(st, st === 'مكتملة' ? 'ok' : (st === 'قيد التنفيذ' ? 'warn' : '')),
                typeSel, tmPill,
                '<input value="' + esc(r.resp || '') + '" data-wbse="resp" dir="auto" style="width:130px">',
                '<input value="' + esc(r.party || '') + '" data-wbse="party" dir="auto" style="width:130px">', '', dosBadge(r),
                btn('\u{1F4BE}','btn-primary btn-sm',' data-wbssave="' + esc(r.id) + '" aria-label="' + esc(t('حفظ')) + '"')
                + btn('\u2715','btn-quiet btn-sm',' data-wbscancel="1" aria-label="' + esc(t('إلغاء')) + '"')];
      }
      return ['<span class="num hint" style="margin:0">' + esc(r.id) + '</span>', name,
              kids ? '<span class="num">' + nm(kids) + '</span>' : '<span class="hint">—</span>',
              '<span class="num">' + esc(r.s || '—') + '</span>', '<span class="num">' + esc(r.e || '—') + '</span>',
              pctTxt + (wbsAutoPct(r) != null ? ' <span class="hint" title="' + esc(t('يُقاس من النظام تلقائيًّا')) + '">\u2699</span>' : ''), '<span class="num">' + nm(wbsPlanPct(r)) + '٪</span>', wbsVarPill(wbsVar(r)),   /* (V30.2) */
              pill(st, st === 'مكتملة' ? 'ok' : (st === 'قيد التنفيذ' ? 'warn' : '')),
              r.type === 'معلم' ? pill('معلم','acc') : '<span class="hint">' + esc(t(r.type || 'مهمة')) + '</span>',
              tmPill,
              esc(r.resp || '—'), esc(r.party || '—'),
              left == null || p >= 100 ? '—' : '<span class="num">' + (left < 0 ? '-' : '') + nm(Math.abs(left)) + '</span>',
              dosBadge(r),
              may('settings')
                ? btn('\u270E','btn-quiet btn-sm',' data-wbsedit="' + esc(r.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                  + btn('\u{1F5D1}','btn-quiet btn-sm',' data-wbsdel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"')
                : ''];
    });
    /* بطاقةُ كلِّ بندٍ رئيسيّ: إنجازُه وشريطُه وما تأخّر منه — تُضغَط فتفتح فرعَه */
    var roots = R.filter(function(r){ return wbsDepth(r.id) === 1; });
    var cards = roots.length ? '<div class="grid cols-3" style="margin:0 0 10px">' + roots.map(function(r){
      var p = wbsPct(r), kids = R.filter(function(x){ return String(x.id).indexOf(r.id + '.') === 0 && !wbsChildren(x.id).length; });
      var late = kids.filter(function(x){ return wbsTiming(x) === 'متأخر'; }).length;
      var done = kids.filter(function(x){ return wbsPct(x) >= 100; }).length;
      var col = late ? '#E05252' : (p >= 100 ? '#3AD6A0' : (p > 0 ? '#E8C34B' : '#9FB0AA'));
      return '<button type="button" class="card" data-wbstog="' + esc(r.id) + '" style="text-align:start;cursor:pointer;padding:10px 12px;border-inline-start:4px solid ' + col + (WBS_OPEN[r.id] ? ';outline:1px solid var(--brand)' : '') + '">'
        + '<div class="hint num" style="margin:0">' + esc(r.id) + '</div>'
        + '<div style="font-weight:700;font-size:13.5px;line-height:1.35">' + esc(r.n) + '</div>'
        + '<div style="height:6px;border-radius:99px;background:rgba(255,255,255,.09);margin:6px 0 4px"><div style="height:100%;width:' + p + '%;border-radius:99px;background:' + col + '"></div></div>'
        + '<div class="hint" style="margin:0"><b class="num">' + nm(p) + '٪</b> \u00b7 ' + nm(done) + '/' + nm(kids.length) + ' ' + esc(t('بند'))
        + (late ? ' \u00b7 <span style="color:#E05252">' + nm(late) + ' ' + esc(t('متأخر')) + '</span>' : '') + '</div></button>';
    }).join('') + '</div>' : '';
    return head + strip + cards
      + stats([['البنود', N(leaves.length)], ['مكتمل', N(c.done), 'ok'], ['قيد التنفيذ', N(c.run), 'wrn'], ['لم يبدأ', N(c.todo)], ['متأخر', N(c.late), c.late ? 'bad' : 'ok'], ['المعالم', N(c.ms), 'acc']])
      + '<div class="chips">' + chips.map(function(x){ return '<button type="button" class="chip' + (WBS_F === x[0] ? ' on' : '') + '" data-wbsf="' + x[0] + '">' + esc(t(x[1])) + ' <span class="num">' + nm(x[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-wbsq value="' + esc(WBS_Q) + '" placeholder="' + esc(t('ابحث بالبند أو المسؤول أو الجهة')) + '" dir="auto">')
      + cardRaw(esc(t('جدول المتابعة')) + ' \u2014 ' + nm(rows.length) + (STATE.wbs && STATE.wbs.by ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(t('آخر تحديث')) + ' ' + esc(dispName(STATE.wbs.by)) + ' ' + esc(stepAgo(STATE.wbs.at || 0)) + '</span>' : ''),
          table(['#','البند','فروع','البدء','الانتهاء','الإنجاز','المخطّط','الانحراف','الحالة','النوع','الموقف الزمني','المسؤول','الجهة','المتبقي','الملف',''], rows, null, { sticky:true }),   /* (V30.2) */
          btn('\u2B07 ' + t('إكسل — بالمعادلات وتجميع الصفوف'),'btn-primary btn-sm',' data-wbsxl="1" title="' + esc(t('ملفٌّ كملفِّ المتابعة: صيغٌ تُحدِّث نفسَها ومستوياتُ طيٍّ وألوانٌ شرطية')) + '"')
          + btn('\u2B07 ' + t('إكسل — قيمًا فقط'),'btn-secondary btn-sm',' data-xls="wbs"'))
      + '<p class="hint">' + esc(t('الإنجازُ يُكتب للبنود الفرعية، ويُجمَّع للآباء بالمدة. والحالةُ والموقفُ الزمنيُّ يُحسَبان من تاريخ اليوم — لا يُكتبان.')) + '</p>';
  }};
