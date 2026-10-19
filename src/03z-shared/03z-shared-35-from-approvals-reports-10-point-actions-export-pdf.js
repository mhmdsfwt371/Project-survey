/* ============================================================================
   FILE    : src/03z-shared/03z-shared-35-from-approvals-reports-10-point-actions-export-pdf.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : BOOT_AT, POP_OPEN, POP_JUST, POP_EV, popOpenAt, expAllowed, pdfTile, pdfBar, pdfCols, pdfDonut, pdfCover, expPdf
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نافذة النقطة — كل ما تحمله النقطة من إجراءات ═══
   الخريطة الحقيقية Leaflet: هذه النافذة هي ما يفتح عند النقر على أي نقطة. */

var BOOT_AT = Date.now();

/* لحظةُ فتحِ التطبيق — لتقدير ما يكلّف */
var POP_OPEN = false, POP_JUST = 0, POP_EV = null;

/* ═══ النقرةُ تُعرَف بعينها لا بوقتها ═══
   نقرةُ النقطة تفتح النافذةَ، ثم يصل الحدثُ نفسُه إلى معالج المستند الذي
   يُغلق كلَّ لوحٍ نُقر خارجه — فكانت النافذةُ تُفتَح وتُغلَق في اللحظة
   نفسها. وحُلَّ بمهلةٍ: «إن مضى أقلُّ من ثلاثِ مئةِ جزءٍ فاتركها». والمهلةُ
   تكفي حتى يبطئ الرسم: مخيماتٌ بمضلّعاتها عند التقريب، أو قائمةٌ طويلةٌ
   يُعاد بناؤها — فيتجاوز الرسمُ المهلةَ، ويصل الحدثُ بعدها، فتُغلَق النافذةُ
   قبل أن تُرى. ولا يقع ذلك إلا على الأجهزة البطيئة وفي أثقل الحالات، فيبدو
   العطلُ متقطّعًا لا يُصدَّق.
     فصارت النقرةُ تُعلَّم بعينها: يُحفَظ الحدثُ الأصليُّ نفسُه، ويقارنه
   معالجُ المستند بهويته — فلا يهمُّ كم استغرق الرسمُ، الحدثُ الذي فتحها لا
   يُغلقها أبدًا. والمهلةُ تبقى احتياطًا لمن لا حدثَ أصليَّ له. */
function popOpenAt(id, ev){
  POP_EV = (ev && (ev.originalEvent || ev.detail && ev.detail.originalEvent)) || ev || null;
  POP_JUST = Date.now();
  POP_SITE = id; POP_OPEN = true; render();
}

function expAllowed(k){ var p = EXP.page[k] || k; return typeof seesPage === 'function' ? seesPage(p) : true; }

/* ═══ صفحةُ الغلاف: البطاقاتُ والأشرطةُ التي تُقرأ قبل الجداول ═══
   الجداولُ وحدَها لا تقول «الشغلُ تمام»: تُقرأ بعد أن يُعرَف الموقف. فالغلافُ
   بطاقاتٌ كبيرةٌ بأرقام المشروع، وأشرطةُ تقدّمٍ للمسح والتركيب، وأعمدةٌ لكلِّ
   مشعرٍ، وحلقةُ حالةٍ لدورة النقطة — كلُّها SVG مرسومٌ في الصفحة لا صورةٌ
   خارجية، فتُطبَع كما تُرى بلا مكتبةٍ ولا اتصال. */
function pdfTile(lab, val, sub, col){
  return '<div class="tile" style="border-top:4px solid ' + col + '">'
    + '<div class="tl">' + esc(t(lab)) + '</div><div class="tv">' + esc(String(val)) + '</div>'
    + (sub ? '<div class="ts">' + esc(sub) + '</div>' : '') + '</div>';
}

function pdfBar(lab, v, max, col){
  var p = max ? Math.min(100, Math.round(v / max * 100)) : 0;
  return '<div class="bar"><div class="bl"><span>' + esc(t(lab)) + '</span><span>' + nm(v) + ' / ' + nm(max) + ' \u00b7 ' + nm(p) + '٪</span></div>'
    + '<div class="btrack"><i style="width:' + p + '%;background:' + col + '"></i></div></div>';
}

/* أعمدةٌ رأسيةٌ بـSVG — لا مكتبةَ ولا صورة */
function pdfCols(rows, col){
  var mx = Math.max(1, Math.max.apply(null, rows.map(function(r){ return r[1]; })));
  var W = 96, H = 150, gap = 26, w = rows.length * (W + gap);
  return '<svg viewBox="0 0 ' + Math.max(360, w) + ' 210" style="width:100%;max-width:640px;height:auto">'
    + rows.map(function(r, i){
        var h = Math.round(r[1] / mx * H), x = i * (W + gap) + 12, y = 20 + (H - h);
        return '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + Math.max(2, h) + '" rx="6" fill="' + col + '"></rect>'
          + '<text x="' + (x + W / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="15" fill="#111" font-weight="700">' + nm(r[1]) + '</text>'
          + '<text x="' + (x + W / 2) + '" y="' + (H + 42) + '" text-anchor="middle" font-size="13" fill="#445">' + esc(r[0]) + '</text>';
      }).join('') + '</svg>';
}

/* حلقةٌ مقسَّمةٌ بحصص — دورةُ حياة النقطة بلونها */
function pdfDonut(parts){
  var tot = parts.reduce(function(a, p){ return a + p[1]; }, 0) || 1, R = 62, C = 2 * Math.PI * R, off = 0;
  return '<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">'
    + '<svg viewBox="0 0 170 170" style="width:170px;height:170px">'
    + '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="#eef2f6" stroke-width="22"></circle>'
    + parts.map(function(p){
        var len = p[1] / tot * C, el = '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="' + p[2] + '" stroke-width="22"'
          + ' stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 85 85)"></circle>';
        off += len; return el;
      }).join('')
    + '</svg><div style="font-size:12px">'
    + parts.map(function(p){ return '<div style="margin:3px 0"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:' + p[2] + ';margin-inline-end:7px"></span>'
        + esc(t(p[0])) + ' <b>' + nm(p[1]) + '</b> <span style="color:#778">' + nm(Math.round(p[1] / tot * 100)) + '٪</span></div>'; }).join('')
    + '</div></div>';
}

function pdfCover(){
  var K = siteKeyStats(), S = K.total;
  var zones = {}; STATE.sites.forEach(function(x){ zones[x.zone] = (zones[x.zone] || 0) + (svVisited(STATE.recs[x.id]) ? 1 : 0); });   /* (V32.6) */
  var zrows = Object.keys(zones).map(function(z){ return [z, zones[z]]; }).sort(function(a, b){ return b[1] - a[1]; });
  var life = {}; STATE.sites.forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var parts = LIFE_ORDER.filter(function(k){ return life[k]; }).map(function(k){ return [LIFE[k].n, life[k], LIFE[k].c]; });
  var wt = (typeof wtStats === 'function') ? wtStats() : null;
  var pct = S.n ? Math.round(S.sv / S.n * 100) : 0;
  return '<div class="tiles">'
    + pdfTile('إجمالي المواقع', nm(S.n), '', '#1F4E79')
    + pdfTile('تمت الزيارة', nm(S.sv), nm(pct) + '٪', '#2E75B6')
    + pdfTile('مُركّب', nm(S.ins), '', '#3AD6A0')
    + pdfTile('لم يُزر', nm(S.noRec), '', '#9FB0AA')
    + pdfTile('تحتاج زيارة أخرى', nm(S.stuck), '', '#8D6E63')
    + (wt ? pdfTile('مهامُّ متأخرة', nm(wt.late), nm(wt.all) + ' ' + t('مهمة'), wt.late ? '#E05252' : '#3AD6A0') : '')
    + '</div>'
    + '<div class="box">' + pdfBar('نسبة الزيارة من إجمالي المشروع', S.sv, S.n, '#2E75B6')
    + pdfBar('نسبة التركيب من إجمالي المشروع', S.ins, S.n, '#3AD6A0') + '</div>'
    + (zrows.length ? '<h3>' + esc(t('المسح المنجز حسب المشعر')) + '</h3><div class="box">' + pdfCols(zrows, '#2E75B6') + '</div>' : '')
    + (parts.length ? '<h3>' + esc(t('دورة النقطة — أين هي الآن')) + '</h3><div class="box">' + pdfDonut(parts) + '</div>' : '');
}

function expPdf(keys){
  var css = 'body{font:12px/1.6 system-ui,"Segoe UI",Tahoma;margin:20px;color:#111}'
    + 'h1{font-size:21px;margin:0 0 2px;color:#1F4E79}h2{font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid #1F4E79;color:#1F4E79;page-break-after:avoid}'
    + 'h3{font-size:13px;margin:16px 0 6px;color:#334}'
    + 'table{width:100%;border-collapse:collapse;margin:0 0 10px;font-size:11px}'
    + 'th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}'
    + '.hint{color:#667;font-size:11px}'
    + '.tiles{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}'
    + '.tile{flex:1 1 150px;min-width:140px;border:1px solid #e3e9f0;border-radius:10px;padding:10px 12px;background:#fbfdff}'
    + '.tl{font-size:11.5px;color:#667}.tv{font-size:26px;font-weight:800;line-height:1.2;color:#12203a}.ts{font-size:11px;color:#667}'
    + '.box{border:1px solid #e3e9f0;border-radius:10px;padding:12px 14px;background:#fff;margin:0 0 10px}'
    + '.bar{margin:0 0 10px}.bl{display:flex;justify-content:space-between;font-size:11.5px;color:#445;margin-bottom:4px}'
    + '.btrack{height:10px;border-radius:99px;background:#eef2f6;overflow:hidden}.btrack i{display:block;height:100%;border-radius:99px}'
    + '@media print{h2{page-break-before:always}.cover{page-break-after:always}}';
  var body = '<div style="display:flex;align-items:center;gap:12px;margin:0 0 6px">'
    +   (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:34px;width:auto">' : '')
    +   '<h1 style="margin:0">' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</h1></div>'
    + '<div class="hint">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(t('قارئات أفاقي في المشاعر')) + ' \u00b7 '
    + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>';
  /* الغلافُ أولًا: البطاقاتُ والرسومُ ثم الجداول */
  try { body += '<div class="cover">' + pdfCover() + '</div>'; } catch (e){ softErr('غلاف التقرير', e, ''); }
  var n = 0;
  keys.forEach(function(k){
    var fn = SHEETS[k]; if (!fn) return;
    var rows; try { rows = fn(); } catch (e){ return; }
    if (!rows || rows.length < 2) return;
    var lab = (EXP.secs.filter(function(x){ return x[0] === k; })[0] || [k, k])[1];
    body += '<h2>' + esc(t(lab)) + '</h2><table><thead><tr>'
      + rows[0].map(function(c){ return '<th>' + esc(String(c == null ? '' : c)) + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + rows.slice(1, 400).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>'
      + (rows.length > 400 ? '<div class="hint">' + esc(t('عُرض أربعُمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '');
    n++;
  });
  if (!n){ toast(t('لا بياناتٍ في الأقسام المختارة')); return; }
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + '<title>' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</title><style>' + css + '</style></head><body>'
    + body + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  logEvent('تصدير PDF — ' + n + ' قسمًا');
  toast(nm(n) + ' ' + t('قسمًا — اختر «حفظ كـPDF» من نافذة الطباعة'));
}
