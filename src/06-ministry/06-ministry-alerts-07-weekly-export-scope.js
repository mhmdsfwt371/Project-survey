/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-07-weekly-export-scope.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Weekly update export, scope selection of points for the file, and the pre-download file check.
   DEFINES : hijriToday, expScopeIds, expScopeLabel, mfuReport, mfuReport0, mfuSecTitle, mfuRowsOf, mfuFileName, mfuXlsx, mfuPrintHtml, mfuPdf, zipMany, mfuDocxXml, mfuDocx … (+6 more)
   GLOBALS : MOH_LOGO
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ (V29.0) ملاحظةُ «تحديثات المنصة» #٥: «اختيارُ النقاط المراد تحميلُها في الملف — لا الملفُّ الشاملُ فقط» ═══
   نطاقُ التصدير: الكلّ (الافتراضيّ)، أو مشعرٌ ونوعٌ من تصنيف المالك، أو النقاطُ المحدَّدةُ على الخريطة («☑ تحديد»).
   يُبنى التقريرُ نفسُه على نقاط النطاق وحدَها (المؤشراتُ والتركيباتُ والشركاتُ والمعوقات)، ويُكتب النطاقُ في الغلاف واسمِ الملف. */
EXP.scope = { m:'all', g:'', t:'' };

MFU.sections = [
  ['brief', 'الملخص التنفيذي', ['النص']],   /* (V29.9) يُكتَب من الأرقام */
  ['kpis', 'الملخص', ['المؤشر', 'القيمة', 'التفصيل', 'عن الأسبوع الماضي']],
  ['svz', 'المسح الميداني — حسب المشعر', ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى']],   /* (V29.1) */
  ['svd', 'المسح الميداني — المشعر والنوع', ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ']],
  ['jmr', 'منشأة الجمرات — تأكيد النقاط بالمسح', ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد']],   /* (V29.2) */
  ['tasks', 'حالة أبرز المهام', ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ']],
  ['blocks', 'المسار | القارئات — المنجز والقادم والمطلوب', ['الكتلة', 'البند', 'التفصيل']],
  ['inst', 'حالة التركيبات', ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة']],
  ['cos', 'شركات الخدمة — المسح والتركيب', ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'رُكّب', 'الحالة']],   /* (V29.1) */
  ['parties', 'بيان المعوقات — الجهة المعالجة', ['الجهة', 'عدد المعوقات']],
  ['cats', 'فئات المعوقات', ['الفئة', 'العدد', 'الجهة المعالجة']],
  ['chal', 'التحديات وآليات المعالجة', ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة']],
  ['req', 'طلبات الوزارة', ['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ']],
  ['upd', 'آخر التحديثات — هذا الأسبوع', ['متى', 'النوع', 'البند', 'التحديث', 'بواسطة']],
  ['owners', 'الحمل على المسؤولين', ['المسؤول', 'تحديات مفتوحة', 'مهام مفتوحة', 'متأخرة']],
  ['weeks', 'مسار الأسابيع', ['الأسبوع', 'تمت الزيارة', 'تركيب المخيمات', 'تركيب الممرات', 'المعوقات']],
  ['daily', 'ملخص العمل اليومي — آخر ١٤ يومًا', ['اليوم', 'تمت الزيارة', 'التركيب', 'الفك', 'تحتاج زيارة أخرى']]];
function mfuSecTitle(R, sc){ return sc[0] === 'upd' && R.updTitle ? R.updTitle : sc[1]; }
function mfuRowsOf(R, key){
  if (key === 'kpis') return R.kpis.map(function(k){ return [k[0], k[1], k[2], k[3] == null ? '' : (k[3] > 0 ? '▲ +' : k[3] < 0 ? '▼ ' : '') + k[3]]; });
  return R[key] || [];
}
function mfuFileName(ext){ var f = [(typeof mfuFltLabel === 'function') ? mfuFltLabel() : '', (typeof expScopeLabel === 'function') ? expScopeLabel() : ''].filter(Boolean).join(' \u00b7 ');   /* (V29.0) والنطاقُ في اسم الملف */ return 'التحديث-الأسبوعي-قارئات-نسك-' + dayKey() + (f ? '-' + f.replace(/[\\/:*?"<>|\u00b7]+/g, '-').replace(/\s+/g, '-') : '') + '.' + ext; }   /* (V27.3) الفلترُ في اسم الملف */
/* ── إكسل: ورقةٌ لكلِّ عنوان ── */
function mfuXlsx(){
  toast(t('يُجهَّز ملفُّ إكسل…'));
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var R = mfuReport(), wb = XLSX.utils.book_new();
    if (!expGate('إكسل', mfuReportCheck(R))) return false;   /* (V28.9) */
    MFU.sections.forEach(function(sc){
      var rows = [sc[2]].concat(mfuRowsOf(R, sc[0]));
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = sc[2].map(function(_, i){ var wd = 10; rows.forEach(function(r){ wd = Math.max(wd, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:wd }; });
      if (!wb.Workbook) wb.Workbook = { Views:[{ RTL:true }] };
      XLSX.utils.book_append_sheet(wb, ws, sc[1].replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30));
    });
    XLSX.writeFile(wb, mfuFileName('xlsx'));
    logEvent('تصديرُ التحديث الأسبوعي — إكسل', ''); toast(t('صُدّر ملفُّ إكسل'));
    return true;
  }).catch(function(e){ softErr('xlsx', e, ''); toast(t('تعذّر التصدير')); return false; });
}
/* ── PDF: صفحةُ طباعةٍ بألوان العرض، والمتصفّحُ يحفظها PDF ── */
/* (V28.8) القالبُ الموحَّدُ للوزارة في الـPDF أيضًا: غلافٌ بلون القالب وشعارِ الوزارة، وعناوينُ ذهبيةٌ يمينًا، وجداولُ بالأخضر
   الداكن، وتذييلُ haj.gov.sa، وختامُ «شكرًا» — والخطُّ «Abar Mid» المعتمد ثم «Readex Pro» بديلًا حيث لا يوجد. */
var MOH_LOGO = 'data:image/png;base64,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';
/* (V38.54) Readex Pro (fallback after the uploaded «Abar Mid») from vendor/fonts — absolute URLs because the print
   document is written into a blank window or a srcdoc frame; Arabic and Latin subsets by unicode-range */
function readexFace(){
  var B = appUrl() + 'vendor/fonts/readex-pro/readex-pro-', ar = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC', la = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  return [400, 600, 700].map(function(w){ return ['arabic', 'latin'].map(function(sub){ return '@font-face{font-family:"Readex Pro";font-style:normal;font-display:swap;font-weight:' + w + ';src:url(' + B + sub + '-' + w + '-normal.woff2) format("woff2");unicode-range:' + (sub === 'arabic' ? ar : la) + '}'; }).join(''); }).join('');
}
function mfuPrintHtml(R, F){
  var e = function(v){ return esc(v == null ? '' : String(v)); };
  var tbl = function(head, rows){ return '<table><thead><tr>' + head.map(function(h){ return '<th>' + e(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + (rows.length ? rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + e(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + head.length + '">—</td></tr>') + '</tbody></table>'; };
  var FF = '"Abar Mid","Readex Pro","Segoe UI",Tahoma,Arial,sans-serif';   /* (V31.4) كان اسمُه F فيطمس معاملَ الخطوط المرفوعة — فلا يُضمَّن خطُّ «أبار» في الـPDF أبدًا */
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + e(mfuFileName('pdf')) + '</title>'
    + '<style>' + readexFace() + '</style>'   /* (V38.54) the fallback font from the app's own copy — the Google Fonts link was blocked by the app's own policy and never worked offline */
    + '<style>' + fontsFace(F) + '@page{size:A4 landscape;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}'
    + 'body{font-family:' + FF + ';color:#163E35;background:#FBF7F4;margin:0}'
    + '.pg{position:relative;width:297mm;min-height:210mm;padding:14mm 16mm 18mm;page-break-after:always;background:#FBF7F4}'
    + '.cover{background:#F6EDE3;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}'
    + '.cover .logo{position:absolute;top:12mm;right:16mm;height:22mm}'
    + '.cover h1{font-size:40pt;margin:0 0 4mm;color:#000;font-weight:700}.cover h2{font-size:20pt;color:#D7A562;margin:0 0 3mm;font-weight:400}.cover p{color:#D7A562;font-size:12pt;margin:1mm 0}'
    + 'h3{color:#D7A562;font-size:22pt;margin:0 0 6mm;text-align:right;font-weight:700}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5pt;background:#fff}th{background:#163E35;color:#fff;padding:2.2mm;text-align:right;font-weight:600}td{border-bottom:1px solid #E6DED4;padding:1.8mm 2.2mm}tr:nth-child(even) td{background:#FAF6F3}'
    + '.ft{position:absolute;bottom:8mm;left:16mm;right:16mm;display:flex;justify-content:space-between;color:#D7A562;font-size:8.5pt}'
    + '.end{background:#000;display:flex;align-items:center;justify-content:center}.end h1{color:#D7A562;font-size:54pt;margin:0}.end .logo{position:absolute;top:12mm;right:16mm;height:22mm;filter:brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(5deg)}'
    + '</style></head><body>'
    + '<div class="pg cover"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>التقدم في الأعمال — بطاقة نسك</h1><h2>مركز معلومات الحج والعمرة</h2><p>' + e(R.hijri) + ' · ' + e(R.greg) + '</p>'
    + '<div class="ft"><span>' + e(R.greg) + '</span><span>haj.gov.sa</span></div></div>'
    + MFU.sections.map(function(sc, i){ return '<div class="pg"><h3>' + e(mfuSecTitle(R, sc)) + '</h3>' + tbl(sc[2], mfuRowsOf(R, sc[0]))
        + '<div class="ft"><span>' + e(R.greg) + ' \u00b7 ' + (i + 2) + '</span><span>haj.gov.sa \u00b7 صدر من نظام قارئات أفاقي ' + e(R.ver) + '</span></div></div>'; }).join('')
    + '<div class="pg end"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>شكرًا</h1></div>'
    + '</body></html>';
}
function mfuPdf(){
  var R0 = mfuReport(); if (!expGate('PDF', mfuReportCheck(R0))) return false;   /* (V28.9) */
  var win = null;
  try { win = window.open('', '_blank'); } catch (e){ win = null; }   /* تُفتح النافذةُ في الضغطة نفسِها — ثم يُكتب فيها بعد تحميل الخط */
  var go = function(F){
    var html = mfuPrintHtml(R0, F);
    var doPrint = function(w){ var p = function(){ try { w.focus(); w.print(); } catch (e){ LS_ERR = e; } };
      try { if (w.document && w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(function(){ setTimeout(p, 150); }); else setTimeout(p, 350); } catch (e){ setTimeout(p, 350); } };
    if (win && win.document){ win.document.open(); win.document.write(html); win.document.close(); doPrint(win); }
    else {
      var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;inset-inline-start:-9999px'; document.body.appendChild(fr);
      fr.srcdoc = html; fr.onload = function(){ doPrint(fr.contentWindow); setTimeout(function(){ fr.remove(); }, 60000); };
    }
    return html.length;
  };
  logEvent('تصديرُ التحديث الأسبوعي — PDF', ''); toast(t('اختر «حفظ كـ PDF» في نافذة الطباعة'));
  if (CFG.fonts && CFG.fonts.r) return go(CFG.fonts);
  fontsLoad().then(go);
  return true;
}
function zipMany(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  files.forEach(function(f){
    var nb = enc.encode(f.name), bytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data, cr = crc32(bytes);
    var lf = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(cr), u32(bytes.length), u32(bytes.length), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lf), nb, bytes);
    central.push({ nb:nb, cr:cr, len:bytes.length, off:off });
    off += lf.length + nb.length + bytes.length;
  });
  var cdStart = off, cd = [];
  central.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(c.cr), u32(c.len), u32(c.len), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); cd.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  var end = new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(central.length), u16(central.length), u32(off - cdStart), u32(cdStart), u16(0)));
  var all = parts.concat(cd, [end]), n = 0; all.forEach(function(p){ n += p.length; });
  var out = new Uint8Array(n), p0 = 0; all.forEach(function(p){ out.set(p, p0); p0 += p.length; });
  return out;
}
function mfuDocxXml(R){
  var x = function(v){ return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var run = function(txt, o){ o = o || {}; return '<w:r><w:rPr><w:rFonts w:ascii="Alexandria" w:hAnsi="Alexandria" w:cs="Alexandria"/>' + (o.b ? '<w:b/><w:bCs/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + (o.sz || 20) + '"/><w:szCs w:val="' + (o.sz || 20) + '"/><w:rtl/></w:rPr><w:t xml:space="preserve">' + x(txt) + '</w:t></w:r>'; };
  var para = function(txt, o){ o = o || {}; return '<w:p><w:pPr><w:bidi/><w:spacing w:after="' + (o.after == null ? 120 : o.after) + '"/><w:jc w:val="' + (o.jc || 'right') + '"/></w:pPr>' + run(txt, o) + '</w:p>'; };
  var cell = function(txt, head, w){ return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (head ? '<w:shd w:val="clear" w:color="auto" w:fill="163E35"/>' : '') + '</w:tcPr><w:p><w:pPr><w:bidi/><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr>' + run(txt, head ? { b:1, c:'FFFFFF', sz:18 } : { sz:18 }) + '</w:p></w:tc>'; };
  var table = function(head, rows){
    var W = 14400, w = Math.floor(W / head.length);
    var b = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D6A561"/><w:bottom w:val="single" w:sz="4" w:color="D6A561"/><w:insideH w:val="single" w:sz="2" w:color="E0E0E0"/></w:tblBorders>';
    return '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="' + W + '" w:type="dxa"/>' + b + '</w:tblPr><w:tblGrid>' + head.map(function(){ return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>'
      + '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + head.map(function(h){ return cell(h, true, w); }).join('') + '</w:tr>'
      + (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r){ return '<w:tr>' + r.map(function(c){ return cell(c, false, w); }).join('') + '</w:tr>'; }).join('') + '</w:tbl>';
  };
  var body = para('التحديث الدوري — مسار القارئات', { b:1, sz:48, c:'163E35', jc:'center', after:80 })
    + para('مشروع بطاقة نسك', { sz:30, c:'C8943E', jc:'center', after:60 })
    + para(R.hijri + ' — ' + R.greg, { sz:22, c:'86432B', jc:'center', after:360 })
    + MFU.sections.map(function(sc){ return para(mfuSecTitle(R, sc), { b:1, sz:30, c:'C8943E', after:80 }) + table(sc[2], mfuRowsOf(R, sc[0])) + para('', { after:200 }); }).join('')
    + para('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:16, c:'7F8C8D' });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body
    + '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>';
}
function mfuDocx(){
  try { return mfuDocx0(); } catch (e){ softErr('docx', e, ''); toast(t('تعذّر التصدير')); return false; }
}
/* ═══ (V28.9) فحصُ الملف قبل نزوله ═══
   قرارُ المالك: «الأرقامُ والحروفُ اللي جوّه تبقى كلُّها صحيحة — لازم يكون فيه فحصٌ للملف قبل ما ينزل». نزل عرضٌ فيه
   «NaN» وأعمدةٌ مزاحة (بعد إضافة عمود ضابط الاتصال) ولم يمنعه شيء. صار كلُّ تصديرٍ (باوربوينت ووورد وإكسل وPDF) يُفحَص
   قبل التنزيل: بياناتُ التقرير نفسُها (لا نصَّ مكسورًا: NaN أو undefined أو [object…] أو نائبٌ باقٍ أو حرفٌ تالف، وعددُ
   خانات كلِّ صفٍّ = عددُ أعمدته، والنسبُ بين صفرٍ ومئة)، ثم الملفُّ المبنيُّ (شرائحُ سليمةُ البناء وكلُّ عنصرٍ داخل الشريحة).
   وأيُّ خطأٍ يوقف التنزيلَ ويُعرَض فوق أزرار التصدير ويُسجَّل في الأحداث. */
EXP.chk = null;
function expDigits(v){ return String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 1632); }).replace(/[\u06F0-\u06F9]/g, function(d){ return String(d.charCodeAt(0) - 1776); }); }
function expBadText(v){ var x = String(v == null ? '' : v); var m = x.match(/\bNaN\b|\bundefined\b|\[object [A-Za-z]+\]|\bInfinity\b|\{\{[A-Z]+\}\}|\uFFFD/); return m ? m[0] : ''; }
function mfuReportCheck(R){
  var iss = [];
  (R.kpis || []).forEach(function(k){ var b = expBadText(k[1]) || expBadText(k[2]); if (b) iss.push(t('المؤشر') + ' «' + k[0] + '»: ' + b); });
  MFU.sections.forEach(function(sc){
    var head = sc[2], rows = mfuRowsOf(R, sc[0]) || [];
    rows.forEach(function(r, i){
      if (!Array.isArray(r)){ iss.push(sc[1] + ' — ' + t('صفٌّ غيرُ صالح')); return; }
      if (r.length !== head.length) iss.push(sc[1] + ' — ' + t('الصفّ') + ' ' + (i + 1) + ': ' + r.length + ' ' + t('خانة والأعمدةُ') + ' ' + head.length);
      r.forEach(function(c, j){
        var b = expBadText(c); if (b) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('في الصفّ') + ' ' + (i + 1) + ': ' + b);
        var cs = expDigits(c); if (/^\s*-?[\d.]+\s*[\u066A%]\s*$/.test(cs)){ var n = parseFloat(cs); if (isFinite(n) && (n < 0 || n > 100)) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('نسبةٌ خارج المدى') + ': ' + c); }
      });
    });
  });
  /* اتّساقُ الأرقام: في كلِّ شركةٍ المستهدفُ = المنجزُ + المتبقي + المتعثر، والنسبةُ = المنجزُ ÷ المستهدف */
  (R.cos || []).forEach(function(r, i){ var n = +expDigits(r[2]), a = +expDigits(r[3]), b = +expDigits(r[4]), p = parseFloat(expDigits(r[6]));   /* (V29.1) مخيماتُها = تم مسحها + المتبقي، والنسبة = الممسوح ÷ المخيمات */
    if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('المخيمات لا تساوي الممسوح والمتبقي'));
    if (isFinite(n) && n > 0 && isFinite(p) && Math.abs(p - Math.round(a / n * 100)) > 1) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('نسبة المسح لا تطابق الممسوح'));
  });
  (R.svd || []).forEach(function(r){ var n = +r[2], a = +r[3], b = +r[4]; if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('المسح الميداني') + ' — ' + r[0] + ' · ' + r[1] + ': ' + t('الإجمالي لا يساوي الممسوح والمتبقي')); });
  (R.jmr || []).forEach(function(r){ var n = +r[1], a = +r[2], b = +r[3], c = +r[4]; if ([n, a, b, c].every(isFinite) && n !== a + b + c) iss.push(t('منشأة الجمرات') + ' — ' + r[0] + ': ' + t('النقاط لا تساوي المؤكَّدة وما تحتاج زيارةً أخرى وغيرَ المزورة')); });   /* (V29.2) */
  if (R.sv && R.svz){ var zt = 0; R.svz.forEach(function(r){ zt += +r[1] || 0; }); if (zt !== R.sv.O.tot) iss.push(t('المسح الميداني') + ': ' + t('مجموع المشاعر لا يساوي الإجمالي')); }
  return iss;
}
function pptxCheck(out){
  var iss = [], dec = new TextDecoder(), W = 12192000 + 25000, H = 6858000 + 25000, P = (typeof DOMParser === 'function') ? new DOMParser() : null;
  out.forEach(function(e){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return;
    var x = e.text != null ? e.text : dec.decode(e.raw), sn = e.name.replace(/^.*slide(\d+)\.xml$/, '$1');
    if (P && P.parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('بناءٌ غيرُ سليم'));
    (x.match(/<a:t>[^<]*<\/a:t>/g) || []).forEach(function(tt){ var b = expBadText(tt.slice(5, -6)); if (b) iss.push(t('الشريحة') + ' ' + sn + ': «' + tt.slice(5, -6).slice(0, 40) + '»'); });
    x.replace(/<a:off x="(\d+)" y="(\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/g, function(m, a, b, c, d){ if (+a + +c > W || +b + +d > H) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('عنصرٌ خارج حدود الشريحة')); return m; });
  });
  return iss;
}
function expGate(kind, iss){
  EXP.chk = { kind:kind, at:Date.now(), n:iss.length, issues:iss.slice(0, 25) };
  if (!iss.length) return true;
  logEvent('تصديرٌ أوقفه فحصُ الملف — ' + kind + ' · ' + iss.length + ' خطأ', '');
  toast(t('أُوقف التصدير: في الملف') + ' ' + nm(iss.length) + ' ' + t('خطأ — التفاصيلُ فوق أزرار التصدير'));
  try { render(1); } catch (e){ LS_ERR = e; }
  return false;
}
function mfuDocx0(){
  var R = mfuReport();
  if (!expGate('وورد', mfuReportCheck(R))) return false;   /* (V28.9) */
  var files = [
    { name:'[Content_Types].xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name:'_rels/.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name:'word/document.xml', data:mfuDocxXml(R) }];
  var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), mfuFileName('docx'));
  if (ok){ logEvent('تصديرُ التحديث الأسبوعي — وورد', ''); toast(t('صُدّر ملفُّ وورد')); }
  return ok;
}
