/* ============================================================================
   FILE    : src/06-ministry/06-exec-report-01-exec-report.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Executive report builder.
   DEFINES : techDoneSet, selTechDone, selExecSet, execRows, execSheetXml, execTplParts, execXlsx
   GLOBALS : EXEC_L, EXEC_ORDER_L, EXEC_PICK, EXEC_MEMO, EXEC_POLICY, EXEC_OV, EXEC_STATIC, EXEC_O
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ (V37.61) وحدةُ «التقرير التنفيذي» في ملفٍّ مستقل — نُقلت من 06-ministry-alerts.js (كان ٤٨٩ من ٥٢٠ ك.ب) قبل بناء التبويبات الخمسة.
   لا تغييرَ في السلوك: القالبُ في 06-exec-template.js، والقواعدُ والتصنيفُ الحيُّ والتصديرُ هنا. ═══ */
/* ═══ (V37.46) «التقرير التنفيذي» — قالبُ الوزارة نفسُه حرفيًّا، يُعبَّأ بالأرقام الحية عند كلِّ تصدير ═══
   طلبُ المالك: «تعمله زي الملف بالظبط … زرار ليه لوحده … ولما أعمل إكسبورت الداتا اللي جوه تتحدث». القالبُ مضمَّنٌ بأجزائه الاثني عشر
   كما وصل (القوائمُ المنسدلة، واتجاهُ الورقة، وتذييلُ «مقيد»)، وتُكتب الصفوفُ في خلاياه نفسِها بأنماطها. التحدياتُ الثماني في ستِّ مجموعاتٍ
   بحسب الإجراء والجهة، والنقطةُ ذاتُ التحديين تُعَدُّ في كلٍّ منهما، والصياغةُ على قاعدة الوزارة (لا تصريحَ ولا تعذّر). */
/* (V37.47) القالبُ في 06-exec-template.js مضغوطًا — كان نصًّا صريحًا ٢٤٠ ك.ب فتجاوز سقفَ حجم الملف */

/* ═══ (V37.52) تصنيفُ التقرير التنفيذي طبقةٌ حيّة: تلقائيٌّ من البيانات، ويعلوه قرارُ المهندس (سحابيٌّ، يصل كلَّ الأجهزة)، ويعلوهما ما رُكّب فعلًا ═══ */
/* (V37.61) مراجعة: «if (k in CFG)» في سحب الإعدادات يُسقط كلَّ مفتاحٍ غير مسجَّل — فكان تصنيفُ المهندس اليدويُّ يبقى على جهازه وحدَه منذ ٣٧٫٥٢ */
if (!('execOv' in CFG)) CFG.execOv = null;
if (!('execOvSeeded' in CFG)) CFG.execOvSeeded = null;

   

      

   
function techDoneSet(id, on){
  var x = siteFind(id); if (!x) return false; if (!may('settings')){ toast(t('الزيارةُ التقنيةُ يقرّها المهندس')); return false; }
  if (on){ x.techDone = Date.now(); siteOvSet(id, { techDone:x.techDone }); } else { delete x.techDone; siteOvSet(id, { techDone:null }); }
  statBump(); return true;
}
function selTechDone(){ var n = 0; selIds().forEach(function(id){ var x = siteFind(id), r = STATE.recs[id]; if (x && r && !x.techDone && techVisit(x, r) && techDoneSet(id, true)) n++; }); if (n) logEvent('تمت الزيارةُ التقنية لـ' + n + ' نقطة (جماعيًّا)'); return n; }
function selExecSet(st){ var n = 0; selIds().forEach(function(id){ if (execOvSet(id, st)) n++; }); if (n) logEvent('تصنيفُ التقرير التنفيذي: ' + n + ' نقطة ← ' + (st ? EXEC_L[st][0] : 'تلقائي')); return n; }

/* صفوفٌ ثابتةٌ بلا عدد — «قراراتٌ معلّقة» كتبها المالك؛ تظهر بلا عددٍ ما لم يكن في النظام نقاطٌ لمجموعتها (فتظهر بعددها) */
var EXEC_STATIC = [
  ['مراكز تفويج', 'النورية', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الزايدي', 'كاميرات البث', '', 'SCOPE'],
  ['مراكز تفويج', 'الهجرة 1', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الهجرة 2', 'كاميرات البث', '', 'SCOPE'],
  ['المشاعر المقدسة', 'منى', 'كاميرات مزودين الخدمة', '', 'SP_MINA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات جبل الرحمه', 'WAIT_RAHMA'], ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات مسجد نمرة', 'WAIT_NAMIRA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات القطار', 'WAIT_TRAIN'], ['المشاعر المقدسة', 'عرفه', 'كاميرات البث', '', 'ARAFAT_BTH'],
  ['المشاعر المقدسة', 'عرفه', 'كاميرات مزودين الخدمة', '', 'SP_ARAFAT']
];
var EXEC_O = { c1:['مراكز تفويج', 'المشاعر المقدسة'], c2:['النورية', 'الزايدي', 'الهجرة 1', 'الهجرة 2', 'منى', 'عرفه', 'مزدلفه'],
  c3:{ 'منى':['كاميرات مزودين الخدمة', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], 'عرفه':['مخيمات', 'ممرات', 'كاميرات الحافلات', 'كاميرات البث', 'قطار', 'كاميرات مزودين الخدمة'], '*':['كاميرات الحافلات', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'] },
  c3all:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار', 'كاميرات مزودين الخدمة'], c4:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة', 'ممرات القطار'] };

   

function execRows(){
  var S = (STATE.sites || []).filter(function(x){ return !x.hidden && !x.deleted; });
  var known = S.filter(function(x){ return execT1(x) === 'مراكز تفويج' && execT2(x) && x.lat; });
  var t2 = function(x){ var v = execT2(x); if (v || execT1(x) !== 'مراكز تفويج' || !x.lat) return v; var best = null, bd = 1e9;
    known.forEach(function(k){ var d = Math.pow(k.lat - x.lat, 2) + Math.pow(k.lng - x.lng, 2); if (d < bd){ bd = d; best = k; } }); return best ? execT2(best) : 'الهجرة 2'; };
  var agg = {}, tot = { all:0, visited:0, surveyed:0, ready:0, chal:0, revisit:0, pending:0, installed:0 };
  S.forEach(function(x){ tot.all++; var r = STATE.recs[x.id], c1 = execT1(x), c2 = t2(x), c3 = execT3(x), c4 = execT4(x), st = execStatus(r, execPolicy(c1, c2, c3, c4), x), k = [c1, c2, c3, c4, st].join('|');
    agg[k] = (agg[k] || 0) + 1; if (r && svVisited(r)) tot.visited++; if (r && svDone(r)) tot.surveyed++;
    if (st === 'INSTALLED') tot.installed++; else if (/^READY/.test(st)) tot.ready++; else if (st === 'PERMIT' || st === 'LOC') tot.revisit++; else if (/^(SCOPE|WAIT_|ARAFAT_BTH|SP_)/.test(st)) tot.pending++; else tot.chal++; });
  var rows = Object.keys(agg).map(function(k){ var p = k.split('|'); return { c1:p[0], c2:p[1], c3:p[2], c4:p[3], b:p[4], n:agg[k] }; });
  EXEC_STATIC.forEach(function(s0){ if (!rows.some(function(r){ return r.c2 === s0[1] && r.c3 === s0[2] && r.c4 === s0[3]; })) rows.push({ c1:s0[0], c2:s0[1], c3:s0[2], c4:s0[3], b:s0[4], n:null }); });
  var ix = function(L, v){ var i = (L || []).indexOf(v); return i < 0 ? 99 : i; };
  var key = function(r){ var c4r = r.c3 === 'ممرات' ? (r.c4 === 'ممرات الطرق' && /^READY/.test(r.b) ? 9 : ix(EXEC_O.c4, r.c4)) : 0;   /* ممراتُ الطرق الجاهزةُ بعد الجبل ونمرة والقطار كما رتّبها المالك */
    var tail = r.b === 'SP_ARAFAT' ? 1 : 0;   /* كاميراتُ مزودي الخدمة في عرفة آخرَ الملف كما وضعها */
    var bo = r.c2 === 'الهجرة 2' && /^READY/.test(r.b) ? -1 : ix(EXEC_ORDER_L, r.b);   /* في الهجرة ٢ قدّم المالكُ الجاهزةَ */
    return [tail, ix(EXEC_O.c1, r.c1), ix(EXEC_O.c2, r.c2), ix(EXEC_O.c3[r.c2] || EXEC_O.c3['*'], r.c3), c4r, bo]; };
  rows.sort(function(a, b){ var A = key(a), B = key(b); for (var q = 0; q < A.length; q++) if (A[q] !== B[q]) return A[q] - B[q]; return 0; });
  return { rows:rows, tot:tot };
}

function execSheetXml(xml, rows){
  var esc0 = function(v){ return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var COLS = 'ABCDEFGH'.split(''), st = {};
  COLS.forEach(function(c){ var m = new RegExp('<c r="' + c + '2" s="(\\d+)"').exec(xml); st[c] = m ? m[1] : '14'; });
  var cell = function(c, r, v){ if (c === 'E') return v == null ? '<c r="E' + r + '" s="' + st[c] + '"/>' : '<c r="E' + r + '" s="' + st[c] + '"><v>' + (+v || 0) + '</v></c>';
    return v ? '<c r="' + c + r + '" s="' + st[c] + '" t="inlineStr"><is><t>' + esc0(v) + '</t></is></c>' : '<c r="' + c + r + '" s="' + st[c] + '"/>'; };
  var data = {}; rows.forEach(function(x, i){ var L = EXEC_L[x.b] || ['', '']; data[i + 2] = { A:x.c1, B:x.c2, C:x.c3, D:x.c4, E:x.n, F:L[0], G:L[1], H:'' }; });
  /* كلُّ صفٍّ من الثاني فما بعد: تُمحى خاناتُ A–H (ما كان في القالب من أرقام النسخة اليدوية) وتُكتب الحية — والقوائمُ في J–L باقية */
  xml = xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, function(m0, rr, attrs, inner){ var r = +rr; if (r < 2) return m0;
    COLS.forEach(function(c){ inner = inner.replace(new RegExp('<c r="' + c + r + '"[^>]*?(\\/>|>[\\s\\S]*?<\\/c>)'), ''); });
    var nc = data[r] ? COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') : ''; delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + inner + '</row>'; });
  xml = xml.replace(/<row r="(\d+)"([^>]*)\/>/g, function(m0, rr, attrs){ var r = +rr; if (!data[r]) return m0; var nc = COLS.map(function(c){ return cell(c, r, data[r][c]); }).join(''); delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + '</row>'; });
  var extra = Object.keys(data).map(Number).sort(function(a, b){ return a - b; }).map(function(r){ return '<row r="' + r + '" spans="1:12">' + COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') + '</row>'; }).join('');
  if (extra){   /* صفوفٌ جديدةٌ تُدرَج في موضعها بالترتيب */
    xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ return '<sheetData>' + body + extra + '</sheetData>'; });
    xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ var L = body.match(/<row r="\d+"[\s\S]*?<\/row>|<row r="\d+"[^>]*\/>/g) || []; L.sort(function(a, b){ return +/r="(\d+)"/.exec(a)[1] - +/r="(\d+)"/.exec(b)[1]; }); return '<sheetData>' + L.join('') + '</sheetData>'; });
  }
  /* (V37.48) القوائمُ المنسدلة: الخلايا التي فيها قيمٌ خارج قوائم Sheet2 (كاميرات مزودين الخدمة، ممرات القطار) تُستثنى كما استثناها المالك — والصفوفُ تتحرّك مع البيانات */
  var LST = { C:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], D:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة'] };
  ['C', 'D'].forEach(function(col){
    var bad = []; rows.forEach(function(x, i){ var v = col === 'C' ? x.c3 : x.c4; if (LST[col].indexOf(v) < 0) bad.push(i + 2); });
    xml = xml.replace(new RegExp('(<xm:sqref>)(' + col + '\\d+:' + col + '\\d+(?: ' + col + '\\d+:' + col + '\\d+)*)(</xm:sqref>)'), function(m0, a1, ref, a3){
      var nums = ref.match(/\d+/g).map(Number), end = Math.max.apply(null, nums), out = [], from = 2;
      bad.forEach(function(b){ if (b > from) out.push(col + from + ':' + col + (b - 1)); from = b + 1; }); if (from <= end) out.push(col + from + ':' + col + end);
      return a1 + out.join(' ') + a3; });
  });
  return xml;
}
function execTplParts(){   /* (V37.47) فكُّ القالب مرةً ويُحفَظ */
  if (execTplParts.p) return execTplParts.p;
  if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('no-inflate'));
  var bin = atob(EXEC_TPL_B64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  var inflate = function(bytes){ return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(b){ return new Uint8Array(b); }); };
  execTplParts.p = Promise.all(zipRead(u.buffer).map(function(e){ return (e.method === 8 ? inflate(e.data) : Promise.resolve(e.data)).then(function(b){ return [e.name, new TextDecoder().decode(b)]; }); }));
  execTplParts.p.catch(function(){ execTplParts.p = null; });
  return execTplParts.p;
}
function execXlsx(){
  var R = execRows(); if (!R.rows.length){ toast(t('لا بيانات بعد')); return Promise.resolve(false); }
  toast(t('يُجهَّز التقرير التنفيذي…'));
  return execTplParts().then(function(parts){
    var files = parts.map(function(p){ return { name:p[0], data:p[0] === 'xl/worksheets/sheet1.xml' ? execSheetXml(p[1], R.rows) : p[1] }; });
    var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'تقرير_المسح_التنفيذي_' + dayKey() + '.xlsx');
    if (ok !== false){ logEvent('تصديرُ التقرير التنفيذي — ' + R.rows.length + ' صفًّا · ' + R.tot.all + ' نقطة'); toast(t('صُدّر التقرير التنفيذي — بأرقام اللحظة')); }
    return ok;
  }).catch(function(e){ softErr('التقرير التنفيذي', e, String(e && e.message) === 'no-inflate' ? 'متصفحُ هذا الجهاز قديمٌ على فكِّ القالب — صدِّره من الكمبيوتر' : 'تعذّر تجهيز التقرير التنفيذي'); return false; });
}