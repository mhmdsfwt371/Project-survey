/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-13-risk-register.js
   DOMAIN  : Catalogue & point — shared helpers the core needs before the office chunk lands
   PURPOSE : The risk register as AFAQY keeps it internally (register v6, owner's request V47.16): three statuses, the
             20/12/6 level rule with «وقع فعلًا» as a level of its own, the management method each level calls for,
             a due date read and written as Hijri above Gregorian with the days left, and one column set shared by the
             Excel import and the export so an exported file goes back in unchanged.
   DEFINES : riskSt, riskLv, riskMethod, riskNum, riskDueIso, riskHijri, riskDueTxt, riskDays, riskDig, riskSees,
             riskNextId, riskFromAoa, riskXlsRows
   GLOBALS : PV.RISK_ST, PV.RISK_METHOD, PV.RISK_COLS, PV.RISK_IMP
   NOTE    : Build order is the full path (see scripts/build.mjs). The register is internal to AFAQY: settings/risks is
             read by engineers, admins and executives only (firestore.rules), the sync asks for it only for them
             (riskSees), and no Ministry page draws anything from it.
   ============================================================================ */

/* the three statuses of the internal register, in its own words */
PV.RISK_ST = ['قائم', 'وقع فعلًا', 'مغلق'];
/* a register read from Excel, held until the engineer confirms the replacement (riskImport → riskImportApply) */
PV.RISK_IMP = null;

/* A stored status read the register's way: the old «مفتوح» is «قائم», and a status typed without its tanween (or with
   stray marks) is the same status. Anything unknown is a live risk — never silently closed. */
function riskSt(r){
  var s = String((r && r.st) || '').replace(/[ً-ٰٟـ]/g, '').replace(/\s+/g, ' ').trim();
  if (/^مغلق/.test(s)) return 'مغلق';
  if (/^وقع/.test(s)) return 'وقع فعلًا';
  return 'قائم';
}

/* a risk's level, from its score and its status (riskLevel holds the rule) */
function riskLv(r){ return riskLevel(riskScore(r), riskSt(r)); }

/* the management method follows the level, exactly as the register's formula writes it */
PV.RISK_METHOD = { 'وقع فعلًا':'مشكلة قائمة تُدار بالتصعيد', 'حرج':'قرار من الإدارة خلال أسبوع', 'مرتفع':'إجراء بمسؤول وموعد ومتابعة أسبوعية', 'مغلق':'لا شيء' };
function riskMethod(lv){ return PV.RISK_METHOD[lv] || 'متابعة كل أسبوعين'; }

/* a 1–5 score from a cell or a field: Arabic-Indic or Persian digits read as digits; anything else is not a score */
function riskNum(v){
  var s = String(v == null ? '' : v).replace(/[٠-٩]/g, function(c){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }).replace(/[۰-۹]/g, function(c){ return '۰۱۲۳۴۵۶۷۸۹'.indexOf(c); }).trim();
  var n = s === '' ? NaN : +s;
  return (isFinite(n) && n >= 1 && n <= 5 && Math.floor(n) === n) ? n : 0;
}

/* A due date as ISO yyyy-mm-dd from whatever holds it: a Date or an Excel serial (wbsDate), ISO text, or the register's
   text — Hijri «13/06/1448هـ» above Gregorian «23/11/2026م». The Gregorian date is the one read; a Hijri date alone
   is not guessed at. */
function riskDueIso(v){
  if (v == null || v === '') return '';
  if (typeof v === 'number' || (v && typeof v.getTime === 'function')) return wbsDate(v);
  var s = String(v).replace(/[‏‎]/g, '').replace(/[٠-٩]/g, function(c){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }).replace(/[۰-۹]/g, function(c){ return '۰۱۲۳۴۵۶۷۸۹'.indexOf(c); });
  var iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);
  var all = s.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
  for (var i = 0; i < all.length; i++){
    var m = all[i].split('/'), y = +m[2], mo = +m[1], d = +m[0];
    if (y >= 1900 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
  }
  return '';
}

/* the Umm al-Qura date of an ISO day, «dd/mm/yyyy» in Latin digits as the register writes it ('' if the device cannot) */
function riskHijri(iso){
  if (!iso) return '';
  var c = riskHijri.c || (riskHijri.c = {}); if (c[iso] != null) return c[iso];
  var v = '';
  try {
    var P = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' }).formatToParts(new Date(iso + 'T12:00:00Z'));
    var g = function(k){ var x = P.filter(function(p){ return p.type === k; })[0]; return x ? String(x.value).replace(/\D/g, '') : ''; };
    if (g('day') && g('month') && g('year')) v = ('0' + g('day')).slice(-2) + '/' + ('0' + g('month')).slice(-2) + '/' + g('year');
  } catch (e){ v = ''; }
  c[iso] = v; return v;
}

/* the due date written the register's way — Hijri above Gregorian — so an exported file reads back as it was */
function riskDueTxt(iso){
  if (!iso) return '';
  var p = String(iso).split('-'), h = riskHijri(iso);
  return (h ? h + 'هـ\n' : '') + p[2] + '/' + p[1] + '/' + p[0] + 'م';
}

/* days left to the due date from today (Mecca's day, as dayKey); none for a closed risk or one without a date */
function riskDays(r){
  if (!r || !r.due || riskSt(r) === 'مغلق') return null;
  var a = Date.parse(r.due + 'T00:00:00Z'), b = Date.parse(dayKey(Date.now()) + 'T00:00:00Z');
  return (isFinite(a) && isFinite(b)) ? Math.round((a - b) / 86400000) : null;
}

/* digits of a display string in the screen's numerals (data keeps Latin digits) */
function riskDig(s){
  var L = (typeof LANG === 'string' && LANG) || 'ar', dg = (I18N[L] || I18N.ar).dig;
  return (L === 'ar' || L === 'ur') ? String(s).replace(/[0-9]/g, function(c){ return dg.charAt(+c); }) : String(s);
}

/* who reads the register — the same roles firestore.rules lets read settings/risks */
function riskSees(){
  var r = (typeof effRole === 'function' && typeof ROLE !== 'undefined') ? effRole(ROLE) : '';
  return r === 'engineer' || r === 'admin' || r === 'exec';
}

/* the next id in the register's own pattern: «خ-١٧» after «خ-١٦»; a register still on the seed's R-ids goes on as R9 */
function riskNextId(L){
  var num = function(s){ return +String(s).replace(/[٠-٩]/g, function(c){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }); };
  var kh = L.filter(function(x){ return /^خ-[0-9٠-٩]+$/.test(String(x.id || '')); });
  if (kh.length){
    var n = Math.max.apply(null, kh.map(function(x){ return num(String(x.id).slice(2)); })) + 1;
    return 'خ-' + String(n < 10 ? '0' + n : n).replace(/[0-9]/g, function(c){ return '٠١٢٣٤٥٦٧٨٩'.charAt(+c); });
  }
  var k = L.length + 1, id = 'R' + k;
  while (L.some(function(x){ return x.id === id; })) id = 'R' + (++k);
  return id;
}

/* ═══ one column set for import and export ═══
   The register's own sheet: computed columns (level, method, days left) are written on export and ignored on import —
   they are always recomputed from probability, impact, status and due date. */
PV.RISK_COLS = ['الرقم', 'الخطر', 'الوضع الآن', 'الاحتمال', 'الأثر', 'الحالة', 'المستوى', 'طريقة الإدارة', 'الإجراء', 'المسؤول', 'الموعد', 'الأيام المتبقية', 'المرجع'];

/* Rows of a sheet (array of arrays) → the register. The header row is found by name (its first cell «الرقم»), and every
   column by its name, so a reordered sheet reads the same. Strict: a row whose probability or impact is not 1–5, or an id
   seen twice, stops the import with the row named — the register is replaced whole, so nothing is guessed. */
function riskFromAoa(A){
  var cell = function(v){ return String(v == null ? '' : v).replace(/[‏‎]/g, '').replace(/[ \t ]+/g, ' ').replace(/ *\r?\n */g, '\n').trim(); };
  var h = -1;
  for (var i = 0; i < A.length; i++){ if (cell((A[i] || [])[0]).replace(/\s+/g, '') === 'الرقم'){ h = i; break; } }
  if (h < 0) return { err:'لم يُعثر على صف العناوين الذي يبدأ بـ«الرقم»' };
  var H = (A[h] || []).map(function(x){ return cell(x).replace(/\s+/g, ' '); }), col = function(n){ return H.indexOf(n); };
  var c = { id:col('الرقم'), t:col('الخطر'), ctx:col('الوضع الآن'), p:col('الاحتمال'), i:col('الأثر'), st:col('الحالة'), plan:col('الإجراء'),
            own:col('المسؤول'), due:col('الموعد'), ref:col('المرجع'), cat:col('الفئة'), resp:col('الاستجابة') };
  var miss = ['الخطر', 'الاحتمال', 'الأثر'].filter(function(n){ return col(n) < 0; });
  if (miss.length) return { err:'أعمدة غير موجودة: ' + miss.join('، ') };
  var out = [], seen = {}, bad = [];
  for (var r = h + 1; r < A.length; r++){
    var row = A[r] || [], g = function(k){ return c[k] < 0 ? '' : cell(row[c[k]]); };
    var id = g('id').replace(/\s+/g, ''), tt = g('t');
    if (!tt) continue;   /* blank lines and notes under the table */
    var p = riskNum(row[c.p]), i2 = riskNum(row[c.i]);
    if (!p || !i2){ bad.push((id || ('صف ' + (r + 1))) + ': ' + (!p ? 'الاحتمال' : 'الأثر')); continue; }
    if (id && seen[id]){ bad.push(id + ': مكرر'); continue; }
    if (id) seen[id] = 1;
    var x = { id:id, t:tt, ctx:g('ctx'), p:p, i:i2, st:riskSt({ st:g('st') }), plan:g('plan'), own:g('own'), due:riskDueIso(c.due < 0 ? '' : row[c.due]), ref:g('ref') };
    if (g('cat')) x.cat = g('cat');
    if (g('resp')) x.resp = g('resp');
    out.push(x);
  }
  if (bad.length) return { err:'صفوف لا تُقرأ: ' + bad.slice(0, 5).join('، ') + (bad.length > 5 ? '…' : '') };
  if (!out.length) return { err:'لا مخاطر تحت صف العناوين' };
  out.forEach(function(x){ if (!x.id) x.id = riskNextId(out.filter(function(y){ return y.id; })); });
  return { list:out };
}

/* the register → its sheet, in the register's own order and columns (the import reads it back unchanged) */
function riskXlsRows(L){
  var out = [PV.RISK_COLS.slice()];
  (L || []).forEach(function(r){
    var lv = riskLv(r), d = riskDays(r);
    out.push([r.id, r.t || '', r.ctx || '', +r.p || 0, +r.i || 0, riskSt(r), lv.t, riskMethod(lv.t), r.plan || '', r.own || '', riskDueTxt(r.due || ''), d == null ? '' : d, r.ref || '']);
  });
  return out;
}
