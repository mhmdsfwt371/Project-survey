/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-08-pptx-template.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : PowerPoint built from the original ministry template.
   DEFINES : pptxTemplate, ooxRead, ooxWrite, pxE, pxRun, pxP, pxBox, pxTable, pxScale, pxLvl, pxCards, mfuSlides, mfuPptx, expScopeRow … (+2 more)
   GLOBALS : PX_ID, PX, PX_K
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ باوربوينت من قالب العرض الأصلي (V20.4) ═══
   templates/weekly-readers.pptx: شرائحُ مسار القارئات من «التحديث الدوري لمشروع بطاقة
   نسك» مقصوصةً (٣٫٩ ميجا): الغلاف بتاريخين نائبين، والفاصل، وثماني شرائحِ محتوى بعنوان
   العرض وشعاره وعنصرٍ نائبٍ للجسم، والشكر — بقوالبه وخلفياته وخطوطه المضمَّنة (Alexandria
   وAbar Mid). الشرائحُ مخزَّنةٌ بلا ضغطٍ في القالب فتُقرأ بلا فكّ، وسائرُ الأجزاء تُنسَخ
   بضغطها كما هي — فالناتجُ بحجم القالب ويُبنى في لحظة. يُحمَّل القالبُ مرةً ويُخبَّأ. */
EXP.pptxTpl = null;
function pptxTemplate(){
  if (EXP.pptxTpl) return Promise.resolve(EXP.pptxTpl);
  return fetch('templates/ministry-unified.pptx').then(   /* (V28.8) القالبُ الموحَّدُ للوزارة */function(r){ if (!r.ok) throw new Error('tpl ' + r.status); return r.arrayBuffer(); })
    .then(function(b){ EXP.pptxTpl = new Uint8Array(b); return EXP.pptxTpl; });
}
function ooxRead(u8){
  /* قراءةُ الأعداد بايتًا بايتًا بلا DataView — يعمل في كلِّ متصفّحٍ وفي بيئة الفحص */
  var g16 = function(o){ return u8[o] | (u8[o + 1] << 8); }, g32 = function(o){ return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0; };
  var e = u8.length - 22;
  while (e >= 0 && g32(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip');
  var n = g16(e + 10), p = g32(e + 16), out = [], dec = new TextDecoder();
  for (var i = 0; i < n; i++){
    var method = g16(p + 10), crc = g32(p + 16), cs = g32(p + 20), us = g32(p + 24), nl = g16(p + 28), xl = g16(p + 30), cl = g16(p + 32), lo = g32(p + 42);
    var name = dec.decode(u8.subarray(p + 46, p + 46 + nl)), ds = lo + 30 + g16(lo + 26) + g16(lo + 28);
    out.push({ name:name, method:method, crc:crc, csize:cs, usize:us, raw:u8.subarray(ds, ds + cs) });
    p += 46 + nl + xl + cl;
  }
  return out;
}
/* يكتب ZIP من مدخلاتٍ خام (بضغطها الأصليّ) أو نصوصٍ جديدة (مخزّنة) */
function ooxWrite(entries){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  entries.forEach(function(f){
    var nb = enc.encode(f.name), raw, method, crc, cs, us;
    if (f.text != null){ raw = enc.encode(f.text); method = 0; crc = crc32(raw); cs = us = raw.length; }
    else { raw = f.raw; method = f.method; crc = f.crc; cs = f.csize; us = f.usize; }
    var lh = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(method), u16(0), u16(0), u32(crc), u32(cs), u32(us), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lh), nb, raw); cen.push({ nb:nb, method:method, crc:crc, cs:cs, us:us, off:off }); off += lh.length + nb.length + raw.length;
  });
  var cd0 = off;
  cen.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(c.method), u16(0), u16(0), u32(c.crc), u32(c.cs), u32(c.us), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); parts.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  parts.push(new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(cen.length), u16(cen.length), u32(off - cd0), u32(cd0), u16(0))));
  var size = 0; parts.forEach(function(q){ size += q.length; });
  var out = new Uint8Array(size), at = 0; parts.forEach(function(q){ out.set(q, at); at += q.length; });
  return out;
}
/* ── رسمٌ بلغة العرض (EMU؛ الشريحة ١٨٬٢٨٨٬٠٠٠ × ١٠٬٢٨٧٬٠٠٠) ── */
var PX_ID = 1000;
function pxE(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pxRun(txt, o){ o = o || {}; return '<a:r><a:rPr lang="ar-SA" sz="' + (o.sz || 1600) + '"' + (o.b ? ' b="1"' : '') + ' dirty="0"><a:solidFill><a:srgbClr val="' + (o.c || '163E35') + '"/></a:solidFill><a:latin typeface="Abar Mid"/><a:ea typeface="Abar Mid"/><a:cs typeface="Abar Mid"/></a:rPr><a:t>' + pxE(txt) + '</a:t></a:r>'; }
function pxP(txt, o){ o = o || {}; return '<a:p><a:pPr algn="' + (o.al || 'r') + '" rtl="1"/>' + pxRun(txt, o) + '</a:p>'; }
function pxBox(x, y, w, h, paras, o){
  o = o || {}; var id = ++PX_ID;
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Box ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="' + (o.geom || 'roundRect') + '"><a:avLst/></a:prstGeom>'
    + (o.fill ? '<a:solidFill><a:srgbClr val="' + o.fill + '"/></a:solidFill>' : '<a:noFill/>')
    + (o.line ? '<a:ln w="' + (o.lw || 12700) + '"><a:solidFill><a:srgbClr val="' + o.line + '"/></a:solidFill></a:ln>' : '<a:ln><a:noFill/></a:ln>')
    + '</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="' + (o.anchor || 'ctr') + '" rtlCol="1"><a:normAutofit/></a:bodyPr><a:lstStyle/>' + (paras || '<a:p><a:endParaRPr lang="ar-SA"/></a:p>') + '</p:txBody></p:sp>';
}
function pxTable(x, y, w, head, rows, o){
  o = o || {}; var id = ++PX_ID, wt = o.cols || head.map(function(){ return 1; }), sw = wt.reduce(function(a, b){ return a + b; }, 0), rh = o.rh || 520000;
  var cw = wt.map(function(k){ return Math.floor(w * k / sw); });
  var cell = function(v, hd, i){ var t0 = v && typeof v === 'object' ? v.t : v, c = hd ? 'FFFFFF' : (v && v.c) || '163E35', bg = hd ? (o.hf || '163E35') : (v && v.bg) || (i % 2 ? 'FAF6F3' : 'FFFFFF');
    return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>' + pxP(t0, { sz:hd ? (o.hsz || 1500) : (o.sz || 1400), b:hd || (v && v.b), c:c }) + '</a:txBody><a:tcPr marL="91440" marR="91440" marT="45720" marB="45720" anchor="ctr"><a:lnB w="6350"><a:solidFill><a:srgbClr val="E0E0E0"/></a:solidFill></a:lnB><a:solidFill><a:srgbClr val="' + bg + '"/></a:solidFill></a:tcPr></a:tc>'; };
  var body = (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r, i){ return '<a:tr h="' + rh + '">' + r.map(function(v){ return cell(v, false, i); }).join('') + '</a:tr>'; }).join('');
  return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="Table ' + id + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
    + '<p:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + (rh * ((rows.length || 1) + 1)) + '"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr rtl="1" firstRow="1" bandRow="1"/><a:tblGrid>'
    + cw.map(function(c){ return '<a:gridCol w="' + c + '"/>'; }).join('') + '</a:tblGrid><a:tr h="' + rh + '">' + head.map(function(h){ return cell(h, true, 0); }).join('') + '</a:tr>' + body + '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}
var PX = { X0:1100000, W:16100000, Y0:1850000 };
/* (V28.8) ملاحظةُ «تحديثات المنصة»: خطوطُ العرض غيرُ المعتمدة — والقالبُ الموحَّدُ للوزارة لكلِّ التقارير. المولِّدُ يرسم على
   مقاس القالب القديم (٢٠×١١٫٢٥ بوصة) والموحَّدُ ١٣٫٣٣×٧٫٥ — النسبةُ نفسُها، فيُصغَّر كلُّ موضعٍ ومقاسٍ وحجمِ خطٍّ بالثلثين
   فتبقى الشريحةُ كما صُمِّمت، والخطُّ «Abar Mid» كما في القالب. */
var PX_K = 12192000 / 18288000;
function pxScale(xml, k){
  var sc = function(v){ return Math.round(+v * k); };
  return String(xml)
    .replace(/<a:(off|chOff) x="(\d+)" y="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' x="' + sc(x) + '" y="' + sc(y) + '"'; })
    .replace(/<a:(ext|chExt) cx="(\d+)" cy="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' cx="' + sc(x) + '" cy="' + sc(y) + '"'; })
    .replace(/<a:gridCol w="(\d+)"/g, function(m, w){ return '<a:gridCol w="' + sc(w) + '"'; })
    .replace(/<a:tr h="(\d+)"/g, function(m, h){ return '<a:tr h="' + sc(h) + '"'; })
    .replace(/ sz="(\d+)"/g, function(m, z){ return ' sz="' + Math.max(800, Math.round(+z * k / 50) * 50) + '"'; })
    .replace(/ (marL|marR|marT|marB)="(\d+)"/g, function(m, a, v){ return ' ' + a + '="' + sc(v) + '"'; });
}
function pxLvl(p){ p = parseInt(p, 10) || 0; return p >= 75 ? { c:'1E8449', bg:'E8F6EE' } : p >= 40 ? { c:'8A6D0B', bg:'FDF3D9' } : { c:'A93226', bg:'FBE7E4' }; }
function pxCards(items, y, h){
  var n = items.length, gap = 220000, w = (PX.W - gap * (n - 1)) / n;
  return items.map(function(it, i){ var x = PX.X0 + PX.W - (i + 1) * w - i * gap;   /* من اليمين */
    return pxBox(x, y, w, h, pxP(it[0], { sz:1500, b:1, c:'C8943E' }) + pxP(it[1], { sz:it[4] || 3600, b:1, c:it[3] || '163E35' }) + (it[2] ? pxP(it[2], { sz:1200, c:'7F8C8D' }) : ''), { fill:'FAF6F3', line:'D6A561' }); }).join('');
}
function mfuSlides(R){
  var dl = function(k){ return k == null ? '' : (k > 0 ? '▲ +' + k : k < 0 ? '▼ ' + k : '=') + ' عن الأسبوع الماضي'; };
  var K = R.kpis, S = [];
  S.push(['ملخص مسار القارئات', pxCards(K.slice(0, 4).map(function(k){ return [k[0], k[1], [k[2], dl(k[3])].filter(Boolean).join(' · ')]; }), PX.Y0, 2600000)
    + pxCards(K.slice(4).map(function(k){ return [k[0], k[1], '']; }), PX.Y0 + 3000000, 2200000)
    + (R.upd.length ? pxTable(PX.X0, PX.Y0 + 5450000, PX.W, ['متى', 'النوع', 'البند', R.updTitle && /اجتماع/.test(R.updTitle) ? 'ما تغيّر منذ آخر اجتماع' : 'آخر التحديثات هذا الأسبوع', 'بواسطة'], R.upd.slice(0, 5).map(function(u){ return [u[0], u[1], u[2], u[3], u[4]]; }), { cols:[1, 1.1, 3, 4.2, 1.3], rh:340000, sz:1000, hsz:1100 })
       : pxBox(PX.X0, PX.Y0 + 5500000, PX.W, 700000, pxP('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:1300, c:'7F8C8D' }), { geom:'rect' }))]);
  /* (V29.1) المسحُ الميدانيُّ: نظرةٌ عامةٌ ثم المشعرُ والنوع */
  var SV = R.sv || svStats(), so = SV.O, pcv = function(v){ var n = parseInt(v, 10) || 0; return { t:String(v), c:pxLvl(n).c, bg:pxLvl(n).bg, b:1 }; };
  S.push(['المسح الميداني — نظرة عامة', pxCards([['نسبة الزيارة', SV.pct + '٪', so.sv + ' من ' + so.tot, '1E8449'], ['تمت الزيارة', String(so.sv), 'نقطة', '163E35'], ['المتبقي', String(so.tot - so.sv), 'نقطة لم تُمسح بعد', '8A6D0B'], ['فيها تحديات', String(so.chal), 'من الممسوحة', 'A93226'], ['تحتاج زيارة أخرى', String(so.unreach), 'تحتاج زيارةً أخرى', 'A93226']], PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى'], SV.zones.map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], pcv(r[4]), r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', r[6] ? { t:String(r[6]), c:'A93226' } : '0']; }), { cols:[2.2, 1, 1, 1, 1, 1.2, 1.2], rh:600000, sz:1500, hsz:1500 })]);
  S.push(['المسح الميداني — المشعر والنوع', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ'], SV.detail.slice(0, 16).map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], r[4], pcv(r[5]), r[6] ? { t:String(r[6]), c:'A93226', b:1 } : '0', r[7]]; }), { cols:[1.3, 1.6, 0.9, 0.9, 0.9, 0.9, 1, 3.3], rh:470000, sz:1150, hsz:1200 })]);
  var JM = jmrConfirm(), jt = JM.tot;   /* (V29.2) */
  S.push(['منشأة الجمرات — تأكيد النقاط بالمسح', pxCards([['نسبة التأكيد', (jt.n ? Math.round(jt.ok / jt.n * 100) : 0) + '٪', jt.ok + ' من ' + jt.n, '1E8449'], ['مؤكَّدة بالمسح', String(jt.ok), 'وصلها المسح', '163E35'], ['لم تُزر', String(jt.no), 'تحتاج زيارة', '8A6D0B'], ['تحتاج زيارة أخرى', String(jt.un), 'تحتاج زيارة أخرى', 'A93226'], ['فيها تحديات', String(jt.ch), 'من المؤكَّدة', 'A93226']], PX.Y0, 1900000)
    + (JM.rows.length ? pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد'], JM.rows.map(function(r, i){ var last = i === JM.rows.length - 1; return [{ t:r[0], b:1 }, r[1], { t:String(r[2]), c:'1E8449', b:1 }, r[3] ? { t:String(r[3]), c:'A93226', b:1 } : '0', r[4] ? { t:String(r[4]), c:'8A6D0B', b:1 } : '0', r[5] ? { t:String(r[5]), c:'A93226' } : '0', last ? { t:r[6], b:1 } : pcv(r[6])]; }), { cols:[1.8, 1, 1.3, 1.2, 1, 1.2, 1.2], rh:560000, sz:1400, hsz:1400 })
       : pxBox(PX.X0, PX.Y0 + 2400000, PX.W, 700000, pxP('لا نقاطَ لمنشأة الجمرات في النطاق', { sz:1400, c:'7F8C8D' }), { geom:'rect' }))]);
  var stc = function(v){ return v === 'مكتمل' ? { t:v, c:'1E8449', b:1 } : v === 'متأخر' ? { t:v, c:'A93226', b:1 } : v === 'جارٍ' ? { t:v, c:'8A6D0B', b:1 } : v; };
  var stc2 = function(v){ v = String(v || ''); return /مكتمل/.test(v) ? { t:v, c:'1E8449', b:1 } : /متوقف|متأخر/.test(v) ? { t:v, c:'A93226', b:1 } : /جاري|جارٍ/.test(v) ? { t:v, c:'8A6D0B', b:1 } : v; };
  S.push(['حالة أبرز مهام مسار القارئات', pxTable(PX.X0, PX.Y0, PX.W, ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ'], R.tasks.slice(0, 11).map(function(r){ return [r[0], r[1] || '—', r[2] || '—', stc2(r[3]), r[4] || '—', r[5] || '—', r[6] ? (/^✓/.test(r[6]) ? { t:r[6], c:'1E8449', b:1 } : { t:r[6], c:'A93226' }) : '—']; }), { cols:[3, 1.2, 1.3, 1.3, 1.2, 2.6, 1.8], sz:1100, rh:560000 })]);
  var B4 = R.blocks, col4 = function(k, color, i){ var L = B4.filter(function(r){ return r[0] === k; }).slice(0, 7), gap = 180000, w = (PX.W - 3 * gap) / 4, x = PX.X0 + PX.W - (i + 1) * w - i * gap, y = PX.Y0 + 1750000;
      return pxBox(x, y, w, 520000, pxP(k + ' · ' + B4.filter(function(r){ return r[0] === k; }).length, { sz:1500, b:1, c:'FFFFFF', al:'ctr' }), { fill:color })
        + pxBox(x, y + 560000, w, 5300000, L.length ? L.map(function(r){ return pxP('• ' + r[1], { sz:1200, b:1, c:'163E35' }) + pxP(r[2], { sz:1000, c:'7F8C8D' }); }).join('') : pxP('—', { sz:1200, c:'7F8C8D', al:'ctr' }), { fill:'FAF6F3', line:'D6A561', anchor:'t' }); };
  var bk = R.blk || {}, dlt = (bk.done || 0) - (bk.doneLast || 0);
  S.push(['المســـار | القارئات', pxCards([['أُنجز هذا الأسبوع', String(bk.done || 0), (dlt > 0 ? '▲ +' : dlt < 0 ? '▼ ' : '') + dlt + ' عن الأسبوع الماضي', '1E8449'], ['مستحقٌّ خلال ٧ أيام', String(bk.next || 0), ''], ['متأخرة', String(bk.late || 0), '', 'A93226'], ['متوقفة أو بانتظار قرار', String(bk.wait || 0), '', '8A6D0B']].concat(bk.meet ? [['آخر اجتماع', dayKey(bk.meet.at), bk.meet.n + ' تغييرًا منذه', '163E35', 2200]] : []), PX.Y0, 1500000)
    + col4('أبرز الأعمال المنجزة', '27AE60', 0) + col4('أبرز المهام القادمة', 'C8943E', 1) + col4('الاعتمادات والدعم المطلوب', '1C3674', 2) + col4('المهام المتأخرة', 'C0392B', 3)]);
  S.push(['حالة التركيبات', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة'], R.inst.slice(0, 12).map(function(r){ var L = pxLvl(r[4]); return [r[0], r[1], r[2], r[3], { t:r[4], c:L.c, bg:L.bg, b:1 }]; }), { cols:[1.4, 2.6, 1.2, 1.2, 1.2] })]);
  /* (V29.1) الشركاتُ بحسب المرحلة: في المسح نسبةُ المسح وما تبقّى والتحديات — لا تصنيفَ بالتركيب قبل بدئه */
  var cn = 0, csv = 0, cch = 0, cins = 0; R.cos.forEach(function(c){ cn += +c[2] || 0; csv += +c[3] || 0; cch += +c[5] || 0; cins += +c[7] || 0; });
  var weak = R.cos.slice().sort(function(a, b){ return (parseInt(a[6], 10) || 0) - (parseInt(b[6], 10) || 0) || (+b[2] || 0) - (+a[2] || 0); }).slice(0, 10);
  S.push(['شركات الخدمة — المسح والتركيب', pxCards([['نسبة مسح المخيمات', (cn ? Math.round(csv / cn * 100) : 0) + '٪', csv + ' من ' + cn, '1E8449'], ['المتبقي للمسح', String(cn - csv), 'مخيم', '8A6D0B'], ['فيها تحديات', String(cch), 'مخيم ممسوح', 'A93226'], ['التركيب', String(cins), cins ? 'مخيم' : 'لم يبدأ بعد', '163E35'], ['الشركات', String(R.cos.length), R.phase === 'survey' ? 'مرحلة المسح — لم يبدأ التواصل' : '']], PX.Y0, 1500000)
    + pxBox(PX.X0, PX.Y0 + 1580000, PX.W, 420000, pxP(R.phase === 'survey' ? 'المرحلة الحالية: المسح الميداني — التواصلُ مع الشركات والتركيبُ لم يبدآ بعد، فلا تصنيفَ لها بالتركيب. الأقلُّ مسحًا أوّلًا، والكلُّ في ملف الإكسل' : 'دليل نسبة الإنجاز: ممتاز ٧٥٪ فأكثر · متوسط ٤٠–٧٤٪ · ضعيف أقل من ٤٠٪ — الأضعفُ أوّلًا، والكلُّ في ملف الإكسل', { sz:1200, c:'7F8C8D' }), { geom:'rect' })
    + pxTable(PX.X0, PX.Y0 + 2050000, PX.W, ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'الحالة'], weak.map(function(r){ var L = pxLvl(r[6]); return [r[0], r[1], r[2], r[3], r[4], r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', { t:r[6], c:L.c, bg:L.bg, b:1 }, { t:r[8], c:'7F8C8D' }]; }), { cols:[3, 1.6, 0.9, 0.9, 1, 1, 1, 2.6], rh:470000, sz:1200 })]);
  S.push(['بيان المعوقات وتصنيفها', pxCards([['إجمالي المعوقات', String(R.obsTotal), 'نقطةٌ لم تُركَّب وفيها عائق', 'A93226']].concat(R.parties.map(function(p){ return ['تُعالَج من خلال ' + p[0], String(p[1]), '']; })), PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2300000, PX.W, ['الفئة', 'العدد', 'الجهة المعالجة'], R.cats.slice(0, 9), { cols:[4, 1, 2] })]);
  S.push(['التحديات / آليات المعالجة', R.chal.length ? pxTable(PX.X0, PX.Y0, PX.W, ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة'], R.chal.slice(0, 9).map(function(r){ return [r[0], r[1], r[2], r[3], r[4], /تم الحل|مغلق/.test(r[5]) ? { t:r[5], c:'1E8449', b:1 } : { t:r[5], c:'A93226', b:1 }]; }), { cols:[1.4, 3, 1.3, 1.4, 3, 1.6], hf:'86432B', rh:640000, sz:1200 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا تحدياتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'86432B', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  S.push(['تحديث حالة طلبات الوزارة', R.req.length ? pxTable(PX.X0, PX.Y0, PX.W, ['#', 'الوصف', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة'], R.req.slice(0, 8).map(function(r){ return [String(r[0]), r[1], r[2] || '—', r[3] || '—', /منجز/.test(r[4]) ? { t:r[4], c:'1E8449', b:1 } : r[4]]; }), { cols:[0.5, 3, 3, 2.4, 1.1], rh:700000, sz:1300 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا طلباتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'163E35', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  var D = R.daily.slice().reverse(), mx = Math.max.apply(null, D.map(function(d){ return Math.max(d[1], d[2]); }).concat([1]));
  var cw = PX.W / Math.max(1, D.length), base = PX.Y0 + 6600000, hmax = 5400000, bars = '';
  D.forEach(function(d, i){ var x = PX.X0 + PX.W - (i + 1) * cw, bw = cw * 0.34, hi = d[2] / mx * hmax, hs = d[1] / mx * hmax;   /* (V24.0) الصفُّ: اليوم، المسح، التركيب، الفك، المتعذر */
    bars += pxBox(x + cw * 0.12, base - hi, bw, Math.max(1, hi), '', { geom:'rect', fill:'27AE60' }) + pxBox(x + cw * 0.12 + bw, base - hs, bw, Math.max(1, hs), '', { geom:'rect', fill:'D6A561' })
      + pxBox(x, base - Math.max(hi, hs) - 420000, cw, 400000, pxP(String(d[2]), { sz:1200, b:1, c:'1E8449', al:'ctr' }), { geom:'rect' })
      + pxBox(x, base + 60000, cw, 400000, pxP(String(d[0]).slice(5), { sz:1100, c:'7F8C8D', al:'ctr' }), { geom:'rect' }); });
  S.push(['ملخص العمل اليومي — آخر ١٤ يومًا', bars + pxBox(PX.X0, base + 560000, PX.W, 420000, pxP('■ التركيب (أخضر) · ■ المسح (ذهبي) — الرقمُ فوق العمود عددُ التركيبات', { sz:1200, c:'7F8C8D' }), { geom:'rect' })]);
  return S;
}
function mfuPptx(){
  toast(t('يُجهَّز العرضُ من قالب الوزارة…'));
  return pptxTemplate().then(function(tpl){
    var R = mfuReport(), E = ooxRead(tpl), dec = new TextDecoder(), slides = mfuSlides(R), chk = mfuReportCheck(R);   /* (V28.9) */
    var order = ['2','3','4','5','6','7','8','9','10','11','12','13'].map(function(k){ return 'ppt/slides/slide' + k + '.xml'; });   /* (V29.2) اثنتا عشرة شريحة بتأكيد الجمرات */   /* (V28.8، و٢٩٫١ إحدى عشرة شريحة بالمسح) شرائحُ المحتوى في القالب الموحَّد */
    var out = E.map(function(e){
      if (e.method !== 0 || !/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return e;
      var x = dec.decode(e.raw);
      if (e.name === 'ppt/slides/slide1.xml') return { name:e.name, text:x.replace('{{H}}', pxE(R.hijri)).replace('{{G}}', pxE(R.greg)) };
      var k = order.indexOf(e.name); if (k < 0) return e;
      PX_ID = 1000;
      var sl = slides[k];
      x = x.replace('{{T}}', pxE(sl[0])).replace(/<p:sp><p:nvSpPr><p:cNvPr id="990" name="BODY"\/>[\s\S]*?<\/p:sp>/, function(){ return pxScale(sl[1], PX_K); });
      return { name:e.name, text:x };
    });
    if (!expGate('باوربوينت', chk.concat(pptxCheck(out)))) return false;   /* (V28.9) فحصُ الملف قبل نزوله */
    var ok = dl(new Blob([ooxWrite(out)], { type:'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), mfuFileName('pptx'));
    if (ok){ logEvent('تصديرُ التحديث الأسبوعي — باوربوينت', ''); toast(t('صُدّر العرض')); }
    return ok;
  }).catch(function(e){ softErr('pptx', e, ''); toast(t('تعذّر تحميلُ قالب العرض — تحقّق من الشبكة')); return false; });
}
function expScopeRow(){
  var ids = expScopeIds(), n = ids ? ids.length : (STATE.sites || []).length;
  var opt = function(list, cur, blank){ return '<option value="">' + esc(t(blank)) + '</option>' + list.map(function(v){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join(''); };
  var chip = function(m, l){ return '<button type="button" class="chip' + (EXP.scope.m === m ? ' on' : '') + '" data-expscope="' + m + '">' + esc(l) + '</button>'; };
  return '<div class="chips" style="margin:8px 0 0;align-items:center"><span class="hint" style="margin:0">' + esc(t('نطاقُ الملف')) + ':</span>'
    + chip('all', t('كلُّ النقاط')) + chip('tax', t('مشعرٌ ونوع')) + chip('sel', t('المحدَّدُ على الخريطة') + ' (' + nm(SEL_N) + ')')
    + (EXP.scope.m === 'tax' ? '<select data-expsg="1" style="max-width:170px">' + opt(TAX_G, EXP.scope.g, 'كلُّ المشاعر') + '</select><select data-expst="1" style="max-width:170px">' + opt(TAX_T, EXP.scope.t, 'كلُّ الأنواع') + '</select>' : '')
    + (EXP.scope.m === 'sel' && !SEL_N ? btn('\u2611 ' + t('حدِّد من الخريطة'), 'btn-quiet btn-sm', ' data-expselgo="1"') : '')
    + '<span class="pill ' + (n ? 'acc' : 'wrn') + '">' + nm(n) + ' ' + esc(t('نقطة في الملف')) + '</span></div>';
}
/* (V37.61) وحدةُ «التقرير التنفيذي» انتقلت إلى 06-exec-report.js */

function mfuExportBar(){
  return '<div class="card" style="margin:0 0 12px"><div class="actions" style="align-items:center">'
    + '<b style="color:#C8943E">\u2B07 ' + esc(t('تصدير التحديث الأسبوعي')) + '</b>'
    + btn('\u{1F4CB} ' + t('التقرير التنفيذي'), 'btn-primary btn-sm', ' data-execxls="1" title="' + esc(t('قالب الوزارة — التحديات بستّ مجموعات والإجراء والجهة — بأرقام اللحظة')) + '"')   /* (V37.46) زرُّه وحدَه */
    + btn('PowerPoint', 'btn-primary btn-sm', ' data-mfuexp="pptx"') + btn('Word', 'btn-secondary btn-sm', ' data-mfuexp="docx"') + btn('Excel', 'btn-secondary btn-sm', ' data-mfuexp="xlsx"') + btn('PDF', 'btn-secondary btn-sm', ' data-mfuexp="pdf"')
    + (mfuFltLabel() ? '<span class="pill wrn">' + esc(t('بفلتر')) + ': ' + esc(mfuFltLabel()) + ' \u2014 ' + esc(t('أزل الفلتر لتصدير الكلّ')) + '</span>' : '')   /* (V27.3) */
    + '<span class="hint" style="margin:0">' + esc(t('من الجهاز نفسِه — لحظي، بالأرقام الحالية')) + '</span></div>'
    + expScopeRow()   /* (V29.0) */
    + (EXP.chk && EXP.chk.n ? '<div class="alert warn" style="margin:8px 0 0"><b>' + esc(t('أوقف الفحصُ آخرَ تصدير')) + ' (' + esc(EXP.chk.kind) + ') — ' + nm(EXP.chk.n) + ' ' + esc(t('خطأ')) + '</b><ul style="margin:4px 0 0;padding-inline-start:18px">' + EXP.chk.issues.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'
       : (EXP.chk ? '<span class="pill ok" style="margin:8px 0 0">\u2713 ' + esc(t('آخرُ ملفٍّ اجتاز الفحص')) + ' (' + esc(EXP.chk.kind) + ')</span>' : ''))   /* (V28.9) */
    + '</div>';
}
PAGE.mfu = { m:'المتابعة', t:'متابعة الوزارة',
  l:'العرضُ الأسبوعيُّ للوزارة حيًّا — بعناوينه نفسِها: المهامُّ والتركيباتُ والشركاتُ والمعوقاتُ والتحدياتُ والطلبات.',
  body:function(){
    mfuFetch();
    if (!EXP.pptxTpl && !MFU.tplAsk && FB.ready){ MFU.tplAsk = 1; setTimeout(function(){ try { if (!(navigator.connection && navigator.connection.saveData)) pptxTemplate().catch(function(){ MFU.tplAsk = 0; }); } catch (e){ LS_ERR = e; } }, 4000); }
    var head = tabHead('mfu'), cur = tabCur('mfu');
    if (!(STATE.sites || []).length) return head + alertBox('warn', 'لا مواقع محمّلة.');
    setTimeout(ringsGrow, 30);   /* (V34.3) */   /* (V37.49) الرابطُ القديمُ لشاشة القاعة = الملخّص في وضع العرض */
    if (cur === 'kiosk' || (cur === 'mfu' && KIOSK_ON)){ setTimeout(kioskAnimate, 30); setTimeout(function(){ try { kkSatInit(); } catch (e){ softErr('kkSat', e, ''); } }, 40); return head + kioskBody(); }
    head += mfuExportBar();   /* التصديرُ على كلِّ عنوان (V20.2) */
    if (cur === 'mweek') return head + mtWeek() + mtDetails('تحديث المهام والمعالم', '<details class="mfu-add" open><summary>' + esc(t('حالة أبرز المهام')) + '</summary>' + mfuTasks() + '</details>' + PAGE.wtask.body(), '\u270E');   /* (V37.62) اللوحةُ أوّلًا، والتحديثُ كما هو في قسمٍ مطويّ */   /* (V27.1) شريحتان من مصدرٍ واحد صارتا واحدة */   /* المهامُّ الأسبوعيةُ كما هي — تُحدَّث من هنا (V20.5) */
    if (cur === 'msurv') return head + mfuSurv();   /* (V29.2) */
    if (cur === 'minst') return (svListPop() + supPopHtml()) + head + mtInst();   /* (V37.62) */
    if (cur === 'mcos') return (svListPop() + supPopHtml()) + head + mtCos();   /* (V37.62) */
    if (cur === 'mobs') return (svListPop() + supPopHtml()) + head + mtObs();   /* (V37.62) */
    if (cur === 'mchal') return head + mfuChal();
    if (cur === 'mreq') return head + mfuReq();
    if (cur === 'mdaily') return (svListPop() + supPopHtml()) + head + mtDaily();   /* (V37.62) */
    if (cur === 'mcamps') return head + mtCamps();   /* (V37.75) المخيماتُ المركزية — إشغالٌ حيٌّ من نظام البطاقات */
    return head + mfuSummary();
  }};
/* (V27.1) كان «المعدل اليومي» شريحةً وحدَه — صار قسمًا مطويًّا في «أمس · الآن · غدًا» */
function overDailyBody(){ return '<details class="mfu-add"><summary>' + esc(t('المعدل اليومي')) + '</summary>' + (function(){
    /* كانت خمسةَ تواريخَ مكتوبةً بيدٍ وأصفارًا: تُعرَض على الوزارة فتبدو
       لوحةَ متابعةٍ وهي لا تقرأ شيئًا. الآن تُقرأ اللقطاتُ المحفوظة، فإن لم
       تُحفَظ بعدُ حُسب اليومُ من السجلات وقيل ذلك صراحةً. */
    var H = (typeof statsHistory === 'function') ? statsHistory(14) : [];
    if (!H.length){
      var S = siteStats(), day = dayKey(Date.now());
      var sv = 0, ins = 0;
      Object.keys(STATE.recs).forEach(function(k){
        if (dayKey(STATE.recs[k].at || STATE.recs[k]._at) === day && svVisited(STATE.recs[k])) sv++; });
      Object.keys(STATE.inss).forEach(function(k){
        var r = STATE.inss[k];
        if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++; });
      return alertBox('info','لا لقطاتٍ محفوظةً بعد — هذا يومُك أنت محسوبًا من سجلاتك.')
        + card('اليوم', table(['التاريخ','مسح','تركيب','الإجمالي'],
            [['<span class="num">' + esc(day) + '</span>', N(sv), N(ins), N(sv + ins)]]));
    }
    var tot = [0,0,0];
    var rows = H.slice().reverse().map(function(r){
      var sv = r.daySurvey || 0, ins = r.dayInstall || 0, dis = r.dayDismantle || 0;
      tot[0] += sv; tot[1] += ins; tot[2] += dis;
      return ['<span class="num">' + esc(r.day) + '</span>', N(sv), N(ins), N(dis),
              N(sv + ins + dis), N(r.dayBlocked || 0)];
    });
    return card('آخر ' + nm(rows.length) + ' يومًا',
        table(['التاريخ','مسح','تركيب','فك','الإجمالي','تعذّر'], rows,
              ['الإجمالي', N(tot[0]), N(tot[1]), N(tot[2]), N(tot[0]+tot[1]+tot[2]), '']))
      + '<p class="hint">' + esc(t('اللقطةُ تُكتَب من جهاز المكتب مرةً كلَّ ربع ساعة — فما لم يُزامَن بعدُ لا يظهر هنا.')) + '</p>';
  })() + '</details>'; }
PAGE.over = { m:'المتابعة', t:'نظرة عامة',
  l:'تقدّمُ المشروع من كلِّ زاوية — الصورةُ والتوزيعُ والوتيرةُ والمعدلُ اليوميُّ والتركيب.',
  body:function(){
    var head = tabHead('over'), cur = tabCur('over');
    if (cur === 'svdash') return head + svdashBody();
    if (cur === 'now') return head + overDailyBody() + (function(){   /* (V27.1) المعدلُ اليومي صار قسمًا هنا */
    /* الوزارةُ تسأل ثلاثةَ أسئلةٍ لا تجيبها لوحةٌ واحدة: ماذا انتهى؟ ماذا يجري
       الآن ومن يفعله وأين؟ وماذا سيحدث غدًا؟ فصارت شاشةً واحدةً بثلاثة
       أعمدةٍ تُقرأ من السجلات والمهام لحظيًّا — لا من أرقامٍ تُكتَب. */
    var S = siteStats(), DAY = 86400000, now = Date.now();
    var today = dayKey(now), yday = dayKey(now - DAY), tmr = dayKey(now + DAY);
    var Y = dayDone(yday), T0 = dayDone(today);
    /* المهامُّ المفتوحة: بمشرفها، وما تمّ منها اليوم، وما جُدول لغد */
    var bySup = {}, open = 0, tmrN = 0, bySupTmr = {}, byZoneTmr = {}, lateN = 0;
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (!x || x.status === 'معتمد') return;
      open++;
      var who = x.to || '\u2014', st = siteFind(x.site), r = STATE.recs[x.site];
      var g = bySup[who] = bySup[who] || { n:0, doneToday:0, wait:0, rev:0 };
      g.n++;
      var rv = svReview(r);
      if (rv === 'revisit') g.rev++;
      else if (svVisited(r)){ if (dayKey(r.at || r._at) === today) g.doneToday++; }   /* (V32.6) */
      else g.wait++;
      if (x.when === tmr){ tmrN++; bySupTmr[who] = (bySupTmr[who] || 0) + 1; if (st) byZoneTmr[st.zone] = (byZoneTmr[st.zone] || 0) + 1; }
      if (x.when && x.when < today && !svVisited(r)) lateN++;
    });
    /* أين نحن اليوم: زياراتُ اليوم بالمشعر */
    var zoneToday = {};
    Object.keys(STATE.recs).forEach(function(k){
      var r = STATE.recs[k]; if (dayKey(r.at || r._at) !== today || !svVisited(r)) return;
      var st = siteFind(k); if (st) zoneToday[st.zone] = (zoneToday[st.zone] || 0) + 1;
    });
    var sups = Object.keys(bySup).sort(function(a, b){ return bySup[b].n - bySup[a].n; });
    var col = function(title, inner){ return '<div>' + card(title, inner) + '</div>'; };
    return (rankOf(ROLE) >= rankOf('supervisor')
              ? '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الحضور'),'btn-secondary btn-sm',' data-xls="attendance"') + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('التركيبات'),'btn-secondary btn-sm',' data-xls="installs"') + '</div>' : '')
      + attTeamCard()
      + (may('approve') ? inboxCard() : '')
      + stepsCard(10)
      + '<div class="grid cols-3" style="align-items:start">'
      + col('\u2705 ' + t('ما انتهى'),
          stats([['أمس — مسح', N(Y.sv), Y.sv ? 'ok' : ''], ['أمس — تركيب', N(Y.ins), Y.ins ? 'ok' : ''],
                 ['أمس — فك', N(Y.dis)]])
          + table(['حتى الآن','العدد','من'], [
              [esc(t('زيارات معتمدة')), N(S.approved), N(S.total)],
              [esc(t('زيارات تمّت')), N(S.surveyed), N(S.total)],
              [esc(t('مُركّب')), N(S.installed), N(S.total)]])
          + meter('نسبة الزيارة', S.surveyed, S.total) + meter('نسبة التركيب', S.installed, S.total))
      + col('\u26A1 ' + t('الآن — اليوم'),
          stats([['اليوم — مسح', N(T0.sv), T0.sv ? 'acc' : ''], ['اليوم — تركيب', N(T0.ins), T0.ins ? 'acc' : ''],
                 ['تنتظر الاعتماد', N(S.pending), S.pending ? 'wrn' : ''],
                 ['متأخّرة عن موعدها', N(lateN), lateN ? 'bad' : '']])
          + (sups.length
            ? table(['المشرف','مُسند','تمّ اليوم','بانتظار','مردود'], sups.slice(0, 12).map(function(sp){
                var g = bySup[sp];
                return [esc(dispName(sp)), N(g.n), N(g.doneToday), N(g.wait), g.rev ? '<b>' + nm(g.rev) + '</b>' : N(0)];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لا مهامَّ مفتوحةً الآن — لم يُسنَد شيءٌ بعد.')) + '</p>')
          + (Object.keys(zoneToday).length
            ? '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('أين نحن اليوم')) + ':</b> '
              + Object.keys(zoneToday).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(zoneToday[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : ''))
      + col('\u{1F4C5} ' + t('غدًا — المجدول'),
          stats([['نقاطٌ مجدولةٌ لغد', N(tmrN), tmrN ? 'acc' : ''], ['مشرفون', N(Object.keys(bySupTmr).length)]])
          + (tmrN
            ? table(['المشرف','نقاط'], Object.keys(bySupTmr).map(function(sp){ return [esc(dispName(sp)), N(bySupTmr[sp])]; }))
              + '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('بالمشعر')) + ':</b> '
              + Object.keys(byZoneTmr).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(byZoneTmr[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : '<p class="hint" style="margin:0">' + esc(t('لا شيءَ مجدولٌ لغد بعد — تُجدوَل النقاطُ بموعدها من الخريطة أو «توزيع الفرق».')) + '</p>'))
      + '</div>'
      + '<div class="actions" style="margin-top:12px">'
      + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-p="map"')
      + (may('approve') ? btn('\u2705 ' + t('اعتماد الزيارات'),'btn-primary btn-sm',' data-p="svappr"') : '')
      + btn('\u2753 ' + t('كيف تسير الدورة؟'),'btn-quiet btn-sm',' data-p="wf"')
      + '</div>'
      + '<p class="hint">' + esc(t('الخريطةُ تلوّن الدورةَ كلَّها: لم يُزر · مُسند · مجدولٌ غدًا · تحتاج زيارةً أخرى · تمت وتنتظر الاعتماد · معتمدة.')) + '</p>';
  })();
    if (cur === 'reg') return head + (function(){
    /* كان جدولًا محفورًا صحيحًا يومَ كُتب. ويبقى صحيحًا حتى يُسجَّل موقعٌ
       جديدٌ واحد — ثم يكذب ولا يقول. يُحسَب من السجلات. */
    var S = siteStats(), rows = [];
    Object.keys(S.byKey).forEach(function(k){
      var p = k.split('|');
      rows.push([p[0], (CAT_DEF[p[1]] || {}).l || p[1], S.byKey[k]]);
    });
    rows.sort(function(a, b){ return b[2] - a[2]; });
    return card('التوزيع', table(['المشعر','النوع','العدد','النسبة'],
      rows.map(function(r){
        return [esc(t(r[0])), esc(t(r[1])), N(r[2]),
                nm(Math.round(r[2] / (S.total || 1) * 100)) + '٪'];
      }), ['الإجمالي','', N(S.total), '١٠٠٪']));
  })();
    if (cur === 'pace') return head + (function(){
    /* كانت تنبيهًا دائمًا «لم تُضبط المواعيد» وأصفارًا مكتوبةً بيد، لأن صفحةَ
       المواعيد لم تكن تحفظ شيئًا. صارت تقرأ الموعدين من CFG وتجيب سؤالَ
       «هنلحق؟» بالأرقام: المتبقّي، والمطلوبُ يوميًّا لبلوغ الموعد، ومعدّلُ
       آخر سبعة أيامٍ كما سُجّل، والانتهاءُ المتوقّعُ على هذا المعدل. */
    var S = siteStats(), DAY = 86400000, now = Date.now();
    var dueS = cfgGet('dueSurvey'), dueI = cfgGet('dueInstall');
    var doneOn = dayDone;
    var y = doneOn(dayKey(now - DAY)), w = { sv:0, ins:0 };
    for (var d = 1; d <= 7; d++){ var o = doneOn(dayKey(now - d * DAY)); w.sv += o.sv; w.ins += o.ins; }
    function daysTo(due){ return due ? Math.ceil((due - now) / DAY) : 0; }
    function stage(name, left, due, avg7, yday){
      var days = daysTo(due), avg = avg7 / 7;
      var need = !due ? 0 : (days > 0 ? Math.ceil(left / days) : left);
      var finish = avg > 0 && left > 0 ? now + Math.ceil(left / avg) * DAY : (left > 0 ? 0 : now);
      var late = due && finish && finish > due;
      var verdict = !left ? ['اكتملت', 'ok']
        : !due ? ['لا موعدَ مضبوطًا', 'wrn']
        : !avg ? ['لا إنجازَ في آخر سبعة أيام — لا يُحسَب موعدٌ متوقّع', 'bad']
        : late ? ['على هذا المعدل تتأخّر عن موعدها', 'bad'] : ['على هذا المعدل تلحق موعدَها', 'ok'];
      return card(name,
          stats([['المتبقّي', N(left), left ? '' : 'ok'],
                 ['الموعد', due ? '<span class="num">' + esc(dayKey(due)) + '</span>' : '—', due ? '' : 'wrn'],
                 ['أيامٌ للموعد', due ? N(Math.max(0, days)) : '—', due && days <= 0 && left ? 'bad' : ''],
                 ['المطلوب يوميًّا', due ? N(need) : '—'],
                 ['معدل آخر ٧ أيام', nm(Math.round(avg * 10) / 10)],
                 ['المنجز أمس', N(yday)],
                 ['الانتهاء المتوقع', finish ? '<span class="num">' + esc(dayKey(finish)) + '</span>' : '—', late ? 'bad' : (finish ? 'ok' : '')]])
        + alertBox(verdict[1] === 'ok' ? 'success' : (verdict[1] === 'bad' ? 'error' : 'warn'), verdict[0]));
    }
    return (!dueS || !dueI
      ? alertBox('warn', 'موعدٌ أو أكثرُ لم يُضبط بعد — يُكتب في «التخطيط ← المواعيد والأزمنة» فتُحسَب الوتيرةُ عليه.')
      : '')
      + stage('المسح', S.total - S.surveyed, dueS, w.sv, y.sv)
      + stage('التركيب', S.total - S.installed, dueI, w.ins, y.ins)
      + '<p class="hint">' + esc(t('المعدلُ من اللقطات اليومية المحفوظة، وما لم تُحفَظ لقطتُه يُحسَب من السجلات التي على هذا الجهاز.')) + '</p>';
  })();
    if (cur === 'inst') return head + (function(){
    var tot = { notStarted:0, blocked:0, scheduled:0, installed:0 };
    var byType = Object.create(null);

    STATE.sites.forEach(function(x){
      var ty = x.type || 'أخرى';
      if (!byType[ty]) byType[ty] = { notStarted:0, blocked:0, scheduled:0, installed:0, total:0 };
      byType[ty].total++;
      var r = STATE.recs[x.id];
      var ins = STATE.inss[x.id];
      if (ins && ins.status === 'مُركّب' && ins.approved){
        tot.installed++; byType[ty].installed++; return;
      }
      if (!svDone(r)){
        if (r){ tot.blocked++; byType[ty].blocked++; }
        else { tot.notStarted++; byType[ty].notStarted++; }
        return;
      }
      /* مُسحت بنجاح ولم تُركَّب بعد — سواءٌ جُدولت لفريقٍ أو لم تُجدوَل بعد،
         فكلتاهما «جاهزةٌ أو مجدولة» من منظور المتابعة الإدارية. */
      tot.scheduled++; byType[ty].scheduled++;
    });

    return stats([['لم يُزَر', N(tot.notStarted)],
                  ['متعذّر', N(tot.blocked), tot.blocked ? 'bad' : 'ok'],
                  ['مُسح — جاهزٌ أو مجدول', N(tot.scheduled), 'wrn'],
                  ['مُركّب معتمد', N(tot.installed), 'ok']])

      + card('حسب نوع النقطة — كم خلص فعليًّا',
          table(['النوع','لم يُزَر','متعذّر','جاهز/مجدول','مُركّب','الإجمالي'],
            Object.keys(byType).map(function(ty){
              var b = byType[ty];
              return [typeLabel(ty), N(b.notStarted), N(b.blocked), N(b.scheduled),
                      '<b>' + nm(b.installed) + '</b>', N(b.total)];
            }),
            ['<b>' + t('الإجمالي') + '</b>', N(tot.notStarted), N(tot.blocked), N(tot.scheduled),
             '<b>' + nm(tot.installed) + '</b>', N(STATE.sites.length)]))

      + card('دورة التركيب', flow(['لم يبدأ','مسح','جدولة','مُركّب'], 0)
        + '<p class="hint">' + esc(t('النقطة لا تدخل الجدولة إلا بعد مسحها بنجاح، ولا تُحسَب مُركّبةً إلا بعد اعتماد قطعها في «التدقيق الهندسي».')) + '</p>');
  })();
    /* «نظرة عامة» شاشةُ الوزارة الأولى — يبدأ فيها آخرُ ما تمّ */
    return head + stepsCard(8) + (function(){
    var K = siteKeyStats();
    if (OVER_ZONE && !K.zones[OVER_ZONE]) OVER_ZONE = '';
    var S = OVER_ZONE ? K.zones[OVER_ZONE] : K.total, zl = OVER_ZONE ? t(OVER_ZONE) : t('كلُّ المشاعر');
    var pc = S.n ? Math.round(S.sv / S.n * 100) : 0;
    /* «لم يُزر» = بلا سجلٍّ أصلًا؛ والمتعذّرُ له عدُّه — كما في صفحة المتابعة والخريطة */
    return card(t('المسحُ بالمشعر') + ' \u2014 ' + zl,
          '<p class="hint" style="margin-top:0">' + esc(t('اختر مشعرًا لتقرأ أرقامَه وحدَه — وبلا اختيارٍ الأرقامُ للكلِّ نسبًا من الكلّ.')) + '</p>'
          + overZoneCards(K))
      + stats([['إجمالي المواقع', N(S.n)], ['تمت الزيارة', N(S.sv), 'acc'], ['متبقٍّ', N(S.n - S.sv), S.n - S.sv ? 'wrn' : 'ok'],
               ['مُركّب', N(S.ins), 'ok'], ['لم يُزر', N(S.noRec)], ['متعذّر', N(S.stuck), S.stuck ? 'wrn' : '']])
      + card(t('تقدّم المشروع') + ' \u2014 ' + zl, meter('تقدّم المسح من إجمالي المواقع', S.sv, S.n)
                            + meter('نسبة التركيب من إجمالي المشروع', S.ins, S.n)
                            + '<p class="hint">' + esc(t('أُنجز')) + ' <b class="num">' + nm(pc) + '٪</b> \u00b7 ' + esc(t('وبقي')) + ' <b class="num">' + nm(100 - pc) + '٪</b>'
                            +   ' (' + nm(S.n - S.sv) + ' ' + esc(t('نقطة')) + ')</p>')
      + cardFlush('المشاعرُ كلُّها — كم أُنجز وكم بقي',
          /* ستةُ أعمدةٍ لتقرأ على الهاتف: النسبةُ في خلية المسح */
          table(['المشعر','المواقع','تمت الزيارة','متبقٍّ','مُركّب','متعذّر'],
            Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }).map(function(z){
              var o = K.zones[z];
              return ['<button class="btn btn-quiet btn-sm" data-ovz="' + esc(z) + '">' + esc(t(z)) + '</button>',
                      N(o.n), N(o.sv) + ' <span class="hint" style="margin:0">' + nm(o.n ? Math.round(o.sv / o.n * 100) : 0) + '٪</span>', N(o.n - o.sv), N(o.ins), N(o.stuck)];
            }),
            ['الإجمالي', N(K.total.n), N(K.total.sv) + ' <span class="hint" style="margin:0">' + nm(K.total.n ? Math.round(K.total.sv / K.total.n * 100) : 0) + '٪</span>', N(K.total.n - K.total.sv), N(K.total.ins), N(K.total.stuck)]))
      + cardFlush(t('التوزيع حسب المشعر والنوع') + (OVER_ZONE ? ' \u2014 ' + zl : ''),
          table(['المشعر','النوع','العدد','تمت الزيارة','مُركّب'],
            K.keys.filter(function(k){ return !OVER_ZONE || k.split('|')[0] === OVER_ZONE; }).map(function(k){
              var p = k.split('|'), n = K.by[k], v = K.sv[k] || 0;
              return [esc(t(p[0])), esc(t(p[1])), N(n), N(v) + ' <span class="hint" style="margin:0">' + nm(n ? Math.round(v / n * 100) : 0) + '٪</span>', N(K.ins[k] || 0)];
            }),
            ['الإجمالي','', N(S.n), N(S.sv) + ' <span class="hint" style="margin:0">' + nm(pc) + '٪</span>', N(S.ins)]))
      /* كانت بعد فاصلةٍ منقوطةٍ في غير موضعها — تُحسَب ولا تُعاد، فلم تظهر قطّ */
      + card('المخرجات الورقية',
          '<div class="actions">'
          + btn('⬇ '+t('الملخص التنفيذي — إكسل'),'btn-primary btn-sm',' data-xls="over"')
          + btn('🖨 '+t('طباعة'),'btn-secondary btn-sm',' data-print="1"')
          + '</div>');
  })();
  }};







PAGE.survey = { m:'الميدان', t:'متابعة العمل الميداني',
  l:'دورةُ النقطة كلُّها — مسحُها واعتمادُها وحلُّها وتدقيقُ تركيبها، وما أفاد به الميدان وما تعثّر.',
  body:function(){
    var head = tabHead('survey'), cur = tabCur('survey');
    if (cur === 'qa') return head + (function(){
    var wait = Object.keys(STATE.inss).filter(function(k){
      return insDone(k) && !STATE.inss[k].approved;   /* (V38.58) the same test as the map colour */
    });
    var done = Object.keys(STATE.inss).filter(function(k){ return STATE.inss[k].approved; });
    return stats([['بانتظار التدقيق', N(wait.length), wait.length?'wrn':''],
                  ['معتمد', N(done.length), 'ok'],
                  ['مسودّات', N(Object.keys(STATE.inss).filter(function(k){
                      return STATE.inss[k].status === 'مسودّة'; }).length)],
                  ['نقاط معتمدة', N(done.reduce(function(a,k){ return a + insPtsOf(k); }, 0))]])
      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','المنفِّذ','القطع','النقاط','الوقت',''],
              wait.slice(0, 30).map(function(k){
                var r = STATE.inss[k], s = siteFind(k);
                /* (V38.59) the review needs what it reviews: each part with its serial, and the installation photos */
                var sn = Object.keys(r.parts || {}).map(function(code){ var v = (r.serials || {})[code]; return '<div class="hint" style="margin:0"><bdi>' + esc(itemName(code)) + '</bdi> \u00d7' + nm(r.parts[code]) + (v ? ' \u00b7 <span class="num" dir="ltr">' + esc(v) + '</span>' : ' \u00b7 <span style="color:var(--danger)">' + esc(t('بلا سيريال')) + '</span>') + '</div>'; }).join('');
                /* (V38.62) the difference from the approved solution — normal in the field, shown so the engineer sees it */
                var solI = ((r.solution || (STATE.inss[k] || {}).solution || {}).items) || {}, dv = [];
                Object.keys(solI).concat(Object.keys(r.parts || {})).filter(function(c, i, a){ return a.indexOf(c) === i; }).forEach(function(c){ var a1 = cfgN(solI[c]) || 0, b1 = cfgN((r.parts || {})[c]) || 0; if (a1 !== b1) dv.push(itemName(c) + ' ' + nm(a1) + '\u2192' + nm(b1)); });
                if (Object.keys(solI).length) sn += '<div class="hint" style="margin:2px 0 0">' + (dv.length ? '\u0394 ' + esc(t('عن الحلّ المعتمد')) + ': ' + esc(dv.join('، ')) : '\u2713 ' + esc(t('مطابقٌ للحلّ المعتمد'))) + '</div>';
                var ph = (typeof photosOf === 'function' ? photosOf(k) : []).filter(function(x){ return x[1] && !x[1].del && /^ins/.test(String(x[1].kind || '')); });
                var phH = ph.length ? '<div style="display:flex;gap:4px;margin-top:4px">' + ph.slice(0, 4).map(function(x){ var p = x[1], src = phSrc(x[0], p, 200); return src ? '<img src="' + esc(src) + '" alt="" loading="lazy" data-phview="' + esc(x[0]) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;cursor:zoom-in">' : '<span class="hint" style="margin:0;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:6px">\u23F3</span>'; }).join('') + '</div>' : '<div class="hint" style="margin:4px 0 0;color:var(--danger)">' + esc(t('لا صورَ تركيبٍ وصلت')) + '</div>';
                return ['<strong>' + esc(k) + '</strong><br><span class="hint" style="margin:0">'
                          + esc((s && s.name) || '') + '</span>' + demoTag(s) + ' ' + btn('\u25C8', 'btn-quiet btn-sm', ' data-site="' + esc(k) + '" title="' + esc(t('صفحة النقطة')) + '"'),   /* (V37.78) */
                        esc(r.by), N(Object.keys(r.parts || {}).length) + sn + phH, N(insPtsOf(k)),
                        '<span class="num">' + fmtTime(r.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-appr="' + esc(k) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-rej="' + esc(k) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبات بانتظار التدقيق.')) + '</p>'))
      + card('قاعدة الاعتماد',
          flow(['تركيب مُبلَّغ','مراجعة الصور','مطابقة السيريال','معتمد'], 0)
          + '<p class="hint">' + esc(t('الردُّ يُعيد النقطة لمنفّذها بحالة «مُعاد» مع سبب — ولا تُحتسب نقاطُها حتى تُعتمد.')) + '</p>');
  })();
    if (cur === 'ncr') return head + (function(){
    var open = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى'; });
    return stats([['بلاغات', N(NCRS.length)],
                  ['مفتوحة', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['مغلقة', N(NCRS.length - open.length), 'ok'],
                  ['متوسط الإغلاق', NCRS.length ? N(3) + ' ' + t('يوم') : '—']])

      /* الوزارةُ تقرأ البلاغاتِ ولا تفتحها — فتحُها وإغلاقُها من يملك التعديل */
      + (may('edit') ? card('بلاغ جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          + '<input id="ncrSite" placeholder="NSK-…" dir="ltr"></div>'
          + '<div class="field"><label>' + esc(t('الفئة')) + '</label>'
          + '<select id="ncrCat">'
          + ['تركيبٌ مخالفٌ للمواصفة','قطعةٌ غيرُ معتمدة','توصيلٌ كهربائيٌّ خاطئ',
             'ارتفاعٌ غيرُ مطابق','توثيقٌ ناقص','سيريالٌ غيرُ مطابق']
              .map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الخطورة')) + '</label>'
          + '<select id="ncrSev">'
          + ['جوهري','متوسط','طفيف'].map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
          + '<textarea id="ncrWhy" rows="2"></textarea></div>',
          btn('افتح بلاغًا','btn-primary',' data-ncradd="1"')) : '')

      + (NCRS.length
        ? cardFlush('البلاغات',
            table(['#','النقطة','الفئة','الخطورة','الوصف','الحالة',''],
              NCRS.map(function(x, i){
                return ['<span class="num">NCR-' + nm(i+1) + '</span>',
                        '<span class="num">' + esc(x.site || '—') + '</span>',
                        esc(x.cat),
                        pill(x.sev, x.sev==='جوهري'?'off':(x.sev==='متوسط'?'warn':'')),
                        '<span class="hint" style="margin:0">' + esc(x.why.slice(0,40)) + '</span>',
                        pill(x.st, x.st==='مغلق'?'ok':'warn'),
                        x.st !== 'مغلق' && may('approve')
                          ? btn('أغلِق','btn-quiet btn-sm',' data-ncrok="' + i + '"') : ''];
              })),
            btn('⬇ إكسل — عدم المطابقة','btn-secondary btn-sm',' data-xls="ncr"'))
        : card('', alertBox('success','لا بلاغاتِ عدمِ مطابقةٍ مفتوحة.')))

      + card('دورة البلاغ',
          flow(['رُصد','أُبلغ','إجراءٌ تصحيحي','تُحقّق','أُغلق'], 0)
          + '<p class="hint">' + esc(t('لا تُقفَل نقطةٌ عليها بلاغٌ جوهريٌّ مفتوح — والتحقّقُ بمن لم يرتكب.')) + '</p>');
  })();
    if (cur === 'solution') return head + (function(){
    var all = Object.keys(STATE.inss).map(function(k){ return STATE.inss[k]; })
      .filter(function(r){ return r && r.solution; });
    var wait = all.filter(function(r){ return r.solution.status === 'مقترح'; });
    var done = all.filter(function(r){ return r.solution.status === 'معتمد'; });
    /* لا يُقترَح حلٌّ إلا لزيارةٍ اعتمدها المهندس — فالبياناتُ التي يُبنى
       عليها الحلُّ راجعها أحدٌ قبل أن يُشترى على أساسها */
    var surveyed = STATE.sites.filter(function(s){
      return svApproved(STATE.recs[s.id]) && !solutionOf(s.id);
    });
    var unreviewed = STATE.sites.filter(function(s){
      return svReview(STATE.recs[s.id]) === 'pending' && !solutionOf(s.id);
    }).length;

    return stats([['بانتظار الاعتماد', N(wait.length), wait.length ? 'wrn' : ''],
                  ['معتمد', N(done.length), 'ok'],
                  ['زيارةٌ معتمدةٌ بلا حلٍّ بعد', N(surveyed.length)],
                  ['زيارةٌ تنتظر اعتمادَها أولًا', N(unreviewed), unreviewed ? 'wrn' : '']])

      + (function(){
          /* الإجمالي المعتمد لموسم ١٤٤٨: كم نقطةً من كل نوعٍ خلصت حلَّها،
             وكم قطعةً من كلِّ صنفٍ ستُركَّب فعليًّا — لا تقديرَ ولا بذرة،
             مجموعُ ما اعتمده المهندس فعلًا على كل نقطة. */
          var byType = {}, itemTotals = {};
          done.forEach(function(r){
            var s = siteFind(r.id), ty = (s && s.type) || 'أخرى';
            byType[ty] = (byType[ty] || 0) + 1;
            Object.keys(r.solution.items || {}).forEach(function(code){
              itemTotals[code] = (itemTotals[code] || 0) + cfgN((r.solution.items || {})[code]);
            });
          });
          var types = Object.keys(byType), codes = Object.keys(itemTotals);
          if (!done.length) return '';
          /* (V38.62) owner's model: the survey's approved solution is the procurement number; the installation is what
             leaves the warehouse. Side by side per item — and «to order» is approved minus received. */
          var bal = {}; (typeof stockBalance === 'function' ? stockBalance() : []).forEach(function(b){ bal[b.item] = b; });
          var recv = {}; movesList().forEach(function(m){ if (m && m.kind === 'توريد') recv[itemKey(m.item)] = (recv[itemKey(m.item)] || 0) + cfgN(m.qty); });
          return card('الإجمالي المعتمد — موسم ١٤٤٨',
              stats(types.map(function(ty){ return [typeLabel(ty), N(byType[ty]), 'acc']; }))
              + (codes.length
                ? table(['الصنف','المعتمد من المسح (للتوريد)','ورد','في المستودع','مع المنفِّذين','رُكِّب (خُصم)','المتبقّي للطلب'],
                    codes.sort(function(a,b){ return itemTotals[b] - itemTotals[a]; }).map(function(code){
                      var k = itemKey(code), b = bal[k] || {}, need = Math.round(itemTotals[code]), got = Math.round(recv[k] || 0), left = Math.max(0, need - got);
                      return [esc(itemName(code)), N(need), N(got), N(Math.round(b.store || 0)), N(Math.round(b.custody || 0)), N(Math.round(b.used || 0)), left ? '<b style="color:var(--warn)">' + nm(left) + '</b>' : '\u2713'];
                    }))
                  + '<p class="hint" style="margin:6px 0 0">' + esc(t('المعتمدُ من حلول المسح هو رقمُ التوريد؛ والخصمُ من المستودع بما رُكِّب فعلًا — وفرقُ التركيب عن الحلّ طبيعيٌّ ويظهر في صفِّ التدقيق.')) + '</p>'
                : ''));
        })()

      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','الأجهزة المقترحة','المقترِح','الوقت',''],
              wait.slice(0, 30).map(function(r){
                var s = siteFind(r.id);
                return [siteIdHtml(siteOf(r)) + '<br><span class="hint" style="margin:0">'
                          + esc(((s && s.name) || '').slice(0,28)) + '</span>',
                        Object.keys(r.solution.items || {}).map(function(c){
                          return esc(itemName(c)) + ' \u00d7' + nm(r.solution.items[c]);
                        }).join('، '),
                        esc(r.solution.by),
                        '<span class="num">' + fmtTime(r.solution.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-solappr="' + esc(r.id) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-solrej="' + esc(r.id) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا حلولَ بانتظار الاعتماد.')) + '</p>'))

      + (may('edit')
        ? card('اقتراح حلٍّ لنقطة',
            surveyed.length
              ? '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
                + '<select id="solSite">' + surveyed.map(function(s){
                    return '<option value="' + esc(s.id) + '">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' (' + esc(s.id) + ')' : '')
                      + ' — ' + esc((s.name || '').slice(0,30)) + '</option>';
                  }).join('') + '</select></div>'
                + itemPickerHtml()
              : '<p class="hint" style="margin:0">' + esc(t('لا زيارةَ معتمدةً بلا حلٍّ الآن — اعتمد زيارةً أولًا من «اعتماد الزيارات» ثم اقترح حلَّها.')) + '</p>',
            surveyed.length ? btn('➕ اقترح الحل','btn-primary btn-sm',' data-solgo="1"') : '')
        : '')

      + '<p class="hint">' + esc(t('لا يُتاح طلبُ تركيبٍ (DR) لنقطةٍ إلا بعد اعتماد حلِّها هنا — والفكُّ (PR) لا يحتاج هذه البوابة، فما رُكِّب معروفٌ من سجله فور اختيار النقطة.')) + '</p>';
  })();
    if (cur === 'survey') return head + (function(){
    var all = surveyList();
    var S = siteStats();
    var day = dayKey();
    var weekAgo = Date.now() - 7 * 86400000;
    var todayN = all.filter(function(x){ return dayKey(x.rec.at || 0) === day; }).length;
    var weekN  = all.filter(function(x){ return (x.rec.at || 0) >= weekAgo; }).length;
    var blocked = all.filter(function(x){ return svStuck(x.rec); });
    var revisit = all.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });

    var rows = all;
    /* شريحةُ الحالة: من أراد «الزياراتِ التي تمّت» وحدها ليصدّرها أو
       يراجعها كان يقرأ الجدولَ كلَّه بعينه — فصارت تُفرَز بضغطة. */
    if (SURV_ST === 'done')  rows = rows.filter(function(x){ return x.done; });
    if (SURV_ST === 'block') rows = rows.filter(function(x){ return svStuck(x.rec); });
    if (SURV_ST === 'revisit') rows = rows.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });
    if (SURV_Q) rows = rows.filter(function(x){
      var hay = x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '');
      return hay.indexOf(SURV_Q) > -1;
    });

    var views = [['','الكل', all.length],
                 ['done','تم الوصول', all.length - blocked.length - revisit.length],   /* (V32.6/V32.7) «تمت الزيارة» الكلُّ بأيِّ نتيجة — و«تم الوصول» تقسيمٌ داخله بمصطلح نموذج الزيارة */
                 ['revisit','تحتاج زيارة أخرى', revisit.length],
                 ['block','متعذّر', blocked.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SURV_ST===v[0]?' on':'')
          + '" data-survst="' + v[0] + '">' + esc(t(v[1]))
          + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['تمت الزيارة', N(S.surveyed), 'acc'],   /* (V32.6) بأيِّ نتيجة */
                       ['لم يُزر', N(siteKeyStats().total.noRec)],
                       ['اليوم', N(todayN)], ['هذا الأسبوع', N(weekN)],
                       ['متعذّر', N(blocked.length), blocked.length ? 'wrn' : 'ok'],
                      ['تحتاج زيارة أخرى', N(revisit.length), revisit.length ? 'wrn' : '']])

      + card('بحث في السجلّ',
          '<input type="search" id="survQ" value="' + esc(SURV_Q)
          + '" placeholder="' + esc(t('ابحث بالنقطة أو الاسم أو الفني')) + '" dir="auto">',
          btn('⬇ إكسل — المسح','btn-secondary btn-sm',' data-xls="recs"'));

    if (SURV_REOPEN){
      var rx = all.filter(function(x){ return x.id === SURV_REOPEN; })[0];
      html += card('سبب تعذُّر ' + esc(SURV_REOPEN) + (rx ? ' — ' + esc((rx.site.name||'').slice(0,30)) : ''),
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('السبب')) + '</label>'
          + '<select id="reopenReason">' + SV_ACCESS.filter(function(a){ return a !== 'تم الوصول'; }).map(function(a){
              return '<option value="' + esc(a) + '">' + esc(t(a)) + '</option>'; }).join('') + '</select></div>'
          + '<div class="field"><label>' + esc(t('تفصيلٌ إضافي')) + '</label>'
          + '<input id="reopenNote" dir="auto"></div>'
          + '</div>',
          btn('تأكيد — أعِدها متعذّرة','btn-danger btn-sm',' data-svreopengo="' + esc(SURV_REOPEN) + '"')
          + btn('تراجع','btn-quiet btn-sm',' data-svreopencancel="1"'));
    }

    html += (rows.length
      ? cardFlush(t('السجلّ') + ' — ' + nm(rows.length) + ' ' + t('من') + ' ' + nm(all.length),
          table(['النقطة','الحالة','الفني','التاريخ','ملاحظة',''],
            capList(rows, 300).map(function(x){
              return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                        + esc((x.site.name || '').slice(0, 28)) + '</span>',
                      x.done ? pill('تمت الزيارة','ok') : pill(x.rec.access || 'متعذّر','wrn'),
                      esc(dispName(x.rec.by) || '—'),
                      '<span class="num">' + esc(fmtDate(x.rec.at || 0)) + '</span>',
                      esc(x.rec.note || x.rec.reopenNote || '—'),
                      /* الوزارةُ تتابع ولا تُعيد التصنيف — والزرُّ لمن يكتب */
                      x.done && may('edit')
                        ? btn('أعِد تصنيفها كمتعذّرة','btn-quiet btn-sm',' data-svreopen="' + esc(x.id) + '"')
                        : '—'];
            })))
        + (rows.length > 300
            ? '' : '')
      : card('لا عمليات بعد',
          '<p class="hint" style="text-align:center;margin:0">'
          + esc(t('تظهر هنا فور أول مسحٍ ميداني.')) + '</p>'));

    html += '<p class="hint">' + esc(t('«أعِد تصنيفها كمتعذّرة» تُبقي بيانات الزيارة السابقة كما هي — لا حذف ولا فقدان سجلّ — لكنها تُخرجها من عِداد المُنجَز حتى تُزار ثانيةً.')) + '</p>';
    return html;
  })();
    if (cur === 'minappr') return head + (function(){
    /* ═══ اعتمادُ الوزارة لإعداد التركيب ═══
       الوزارةُ ترى ما اعتُمد تقنيًّا بصوره وبياناته (الموضعُ والتثبيتُ والكهرباءُ
       والمقاسات) وتعتمد أو تُعيد بملاحظة. والمهندسُ يرى ما أُعيد ليعالجه ويرفعه
       ثانيةً. لا يُسنَد تركيبٌ لنقطةٍ لم تمرَّ من هنا. */
    var all = surveyList().filter(function(x){ return x.rec && svReview(x.rec) === 'approved'; });
    var lists = { pending:[], returned:[], approved:[] };
    all.forEach(function(x){ var ms = minState(x.rec); if (lists[ms]) lists[ms].push(x); });
    var rows = (lists[MIN_ST] || []).slice();
    if (MIN_Q) rows = rows.filter(function(x){ return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '') + ' ' + (x.site.co || '')).indexOf(MIN_Q) > -1; });
    rows.sort(function(a, b){ return (b.rec.reviewAt || 0) - (a.rec.reviewAt || 0); });
    var views = [['pending','بانتظار اعتماد الوزارة',lists.pending.length],['returned','أعادتها الوزارة',lists.returned.length],['approved','اعتمدتها الوزارة',lists.approved.length]];
    var canMin = may('minapprove'), canEng = may('approve');
    var out = [];
    capList(rows, 150).forEach(function(x){
      var r = x.rec, isOpen = MIN_OPEN === x.id, ms = minState(r);
      out.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                esc(t(x.site.zone || '—')) + (x.site.sq ? ' \u00b7 ' + esc(x.site.sq) : '') + '<br><span class="hint" style="margin:0">' + esc(x.site.co || '—') + '</span>',
                esc(dispName(r.by) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.at ? dayKey(r.at) : '') + '</span>',
                esc(dispName(r.reviewBy) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.reviewAt ? dayKey(r.reviewAt) : '') + '</span>',
                ms === 'approved' ? pill('اعتمدت الوزارة','ok') : (ms === 'returned' ? pill('أعادتها الوزارة','bad') : pill('بانتظار الوزارة','warn')),
                btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-minopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen){
        var meta = [['نوع التركيب', r.mount || '—'], ['مصدر الكهرباء', r.power || '—'], ['ارتفاع التركيب (م)', r.hgt != null ? String(r.hgt) : '—'],
                    ['العرض المتاح (م)', r.wid_m != null ? String(r.wid_m) : '—'], ['الارتفاع المتاح (م)', r.hgt_m != null ? String(r.hgt_m) : '—'],
                    ['طول الكابل (م)', r.cable != null ? String(r.cable) : '—'], ['تحديات التركيب', (r.chals || []).join(' \u00b7 ') || '—'],
                    ['هل الموقع مناسب', r.fit || '—'], ['الملاحظات', r.note || '—'], ['الشاخص', x.site.sign || '—']];
        if (r.minNote) meta.push([ms === 'returned' ? 'ملاحظة الوزارة' : 'ملاحظة الاعتماد', r.minNote + ' \u2014 ' + dispName(r.minBy || '') + ' \u00b7 ' + (r.minAt ? dayKey(r.minAt) : '')]);
        if (r.minResubmitNote) meta.push(['معالجة المهندس', r.minResubmitNote + ' \u2014 ' + dispName(r.minResubmitBy || '')]);
        var actions = '';
        if (canMin && ms !== 'approved')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ملاحظة الوزارة')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto" placeholder="' + esc(t('اختياريةٌ عند الاعتماد — مطلوبةٌ عند الإعادة')) + '"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u{1F3DB} ' + t('اعتماد إعداد التركيب'),'btn-primary btn-sm',' data-minok="' + esc(x.id) + '"')
            + btn('\u21A9 ' + t('إعادة للمهندس'),'btn-secondary btn-sm',' data-minback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else if (canEng && ms === 'returned')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ما عُولج')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u2B06 ' + t('أعد الرفع للوزارة'),'btn-primary btn-sm',' data-minre="' + esc(x.id) + '"')
            + btn('\u{1F501} ' + t('يعود المشرف لزيارة أخرى'),'btn-secondary btn-sm',' data-stkback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else actions = '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';   /* اعتمادُ الوزارة */
        out.push({ raw:'<tr><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px"><div class="grid cols-2">'
          + '<div>' + table(['البند','القيمة'], meta.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
          + '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(x.id)) + '</div>' + photoGalleryHtml(x.id) + '</div>'
          + '</div>' + actions + '</td></tr>' });
      }
    });
    return stats([['بانتظار اعتماد الوزارة', N(lists.pending.length), lists.pending.length ? 'wrn' : 'ok'],
                  ['أعادتها الوزارة', N(lists.returned.length), lists.returned.length ? 'bad' : 'ok'],
                  ['اعتمدتها الوزارة', N(lists.approved.length), 'ok']])
      + '<div class="chips">' + views.map(function(v){ return '<button type="button" class="chip' + (MIN_ST === v[0] ? ' on' : '') + '" data-minst="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-minq value="' + esc(MIN_Q) + '" placeholder="' + esc(t('ابحث بالنقطة أو المشرف أو الشركة')) + '" dir="auto">')
      + (out.length
          ? cardFlush(t(views.filter(function(v){ return v[0] === MIN_ST; })[0][1]) + ' \u2014 ' + nm(rows.length),
              table(['النقطة','المشعر / الشركة','المشرف','الاعتماد التقني','الحالة',''], out),
              btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-xls="minappr"'))
          : alertBox('success', 'لا نقاطَ في هذه الخانة.'))
      + '<p class="hint">' + esc(t('الدورة: زيارةُ المشرف ← الاعتمادُ التقنيُّ (المهندس) ← اعتمادُ الوزارة لإعداد التركيب ← اقتراحُ الحل واعتمادُه ← إسنادُ التركيب. لا يُسنَد تركيبٌ لنقطةٍ لم تعتمدها الوزارة.')) + '</p>';
  })();
    if (cur === 'svappr') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الزيارات'),'btn-secondary btn-sm',' data-xls="visits"') + '</div>' + (function(){
    var S = siteStats();
    var lists = svaLists();
    var rows = svaFilter(lists[SVA_ST] || []);

    var views = [['pending','بانتظار اعتمادك', lists.pending.length],
                 ['approved','معتمدة', lists.approved.length],
                 ['revisit','تحتاج زيارة أخرى', lists.revisit.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SVA_ST === v[0] ? ' on' : '')
          + '" data-svast="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['بانتظار اعتمادك', N(S.pending), S.pending ? 'wrn' : ''],
               ['معتمدة', N(S.approved), 'ok'],
               ['تحتاج زيارة أخرى', N(S.revisit), S.revisit ? 'bad' : ''],
               ['لم يُزر', N(siteKeyStats().total.noRec)]])
      + card('بحث', '<input type="search" id="svaQ" data-svaq value="' + esc(SVA_Q) + '" placeholder="'
          + esc(t('ابحث بالنقطة أو الاسم أو المشرف')) + '" dir="auto">');

    if (!rows.length){
      return html + card('', '<p class="hint" style="text-align:center;margin:0">'
        + esc(t(SVA_ST === 'pending' ? 'لا زياراتٍ تنتظر اعتمادك — كلُّ ما زاره المشرفون رُوجع.'
              : (SVA_ST === 'approved' ? 'لا زياراتٍ معتمدةً بعد.' : 'لا زياراتٍ مردودةً — كلُّ ما رُوجع اعتُمد.'))) + '</p>');
    }
    /* (V38.93) the owner's decision: no approval by elapsed time — the engineer ticks what he wants and approves it at once */
    var selMode = SVA_ST === 'pending' && may('approve');
    if (selMode){
      var selN = svaSelIds().length;
      html += cardRaw(t('اعتمادٌ بالتحديد'), '<div class="actions" style="margin:0">'
          + btn('\u2611 ' + t('حدّد المعروض') + ' (' + nm(Math.min(rows.length, 60)) + ')', 'btn-secondary btn-sm', ' data-svaselall="shown"')
          + (rows.length > 60 ? btn('\u2611 ' + t('حدّد كلَّ النتائج') + ' (' + nm(rows.length) + ')', 'btn-secondary btn-sm', ' data-svaselall="all"') : '')
          + btn(t('ألغِ التحديد'), 'btn-quiet btn-sm', ' data-svaselnone="1"' + (selN ? '' : ' hidden'))
          + btn('\u2705 ' + t('اعتمد المحدَّد') + ' (' + nm(selN) + ')', 'btn-primary btn-sm', ' data-svaselgo="1"' + (selN ? '' : ' disabled'))
          + '</div><p class="hint" style="margin:6px 0 0">' + esc(t('كلُّ زيارةٍ تمرّ بشروط الاعتماد نفسِها، وما لا يمرّ يُقال سببُه. والبحثُ أعلاه يضيّق ما يُحدَّد.')) + '</p>'
          + (svApproveMany.last && svApproveMany.last.items.length
              ? '<div class="actions" style="margin:8px 0 0">' + btn('\u21B6 ' + t('تراجع عن آخر دفعة') + ' (' + nm(svApproveMany.last.items.length) + ')', 'btn-quiet btn-sm', ' data-svaundo="1"') + '</div>' : ''));
    }
    html += rows.slice(0, 60).map(function(x){
      var r = x.rec, rv = svReview(r);
      var facts = svFacts(r);
      var so = solutionOf(x.id);
      var head0 = (selMode && rv === 'pending' ? '<input type="checkbox" class="svasel" data-svasel="' + esc(x.id) + '"' + (svaSel()[x.id] ? ' checked' : '') + ' aria-label="' + esc(t('حدّد') + ' ' + x.id) + '" style="margin-inline-end:6px;width:18px;height:18px;vertical-align:middle"> ' : '')
        + siteIdHtml(siteOf(x)) + ' \u2014 ' + esc((x.site.name || '').slice(0, 40))
        + ' <span class="hint" style="margin:0;display:inline">\u00b7 ' + esc(dispName(r.by) || '\u2014')
        + ' \u00b7 <span class="num">' + esc(fmtDate(r.at || 0)) + '</span>'
        + (r.round > 1 ? ' \u00b7 ' + esc(t('الجولة')) + ' <span class="num">' + nm(r.round) + '</span>' : '') + '</span>';
      var nPh = photoCount(x.id);
      var body = (r.prevNote ? alertBox('info', t('سببُ الردِّ السابق') + ': ' + r.prevNote) : '')
        + table(['البند','ما أفاد به المشرف'], facts.map(function(f){ return [esc(t(f[0])), esc(f[1])]; }))
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F4F7} ' + t('الصور') + ' (' + nm(nPh) + ')', (SVA_PH === x.id ? 'btn-primary' : 'btn-secondary') + ' btn-sm', ' data-svph="' + esc(x.id) + '"') + '</div>'
        + (SVA_PH === x.id ? photoGalleryHtml(x.id) : '')
        + (rv === 'revisit' && r.revisitNote
            ? alertBox('warn', t('رُدَّت') + ' \u2014 ' + r.revisitNote + ' \u00b7 ' + (dispName(r.revisitBy) || '')) : '')   /* (V37.89) alertBox يهرّب بنفسه */
        + (rv === 'approved'
            ? alertBox('success', t('اعتمدها') + ' ' + (dispName(r.reviewBy) || '\u2014') + ' \u00b7 '   /* (V37.89) كان وسمُ span يُهرَّب فيظهر نصًّا */
                + fmtDate(r.reviewAt || 0)
                + (so ? ' \u00b7 ' + t('الحل') + ': ' + t(so.status) : ' \u00b7 ' + t('بلا حلٍّ بعد'))) : '');
      var actions = '';
      if (rv === 'pending' && may('approve')){
        /* الاعتمادُ واختيارُ الأجهزة خطوةٌ واحدة: كان يعتمد ثم يبحث عن النقطة في
           «معتمدة» ليقترح حلَّها — فصار الاختيارُ هنا، والحفظُ يعتمد ويحفظ الحلَّ
           معًا، فتدخل النقطةُ طبقةَ التركيب برتقاليةً جاهزةً للإسناد. */
        if (SVA_SOL === x.id && may('edit')){
          actions = card('اعتماد الزيارة واختيار الأجهزة', itemPickerHtml()
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحفظُ يعتمد الزيارةَ ويحفظ الأسطرَ حلًّا معتمدًا — فتدخل طبقةَ التركيب جاهزةً للإسناد.')) + '</p>'
            + btn('\u2705 ' + t('اعتمد واحفظ الأجهزة'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
          return cardRaw(head0, body + actions);
        }
        actions = '<div class="actions">'
          + (may('edit') ? btn('\u2705 ' + t('اعتمد واختر الأجهزة'),'btn-primary btn-sm',' data-svsol="' + esc(x.id) + '"') : '')
          + btn('\u2705 ' + t('اعتمد الزيارة'),(may('edit') ? 'btn-secondary' : 'btn-primary') + ' btn-sm',' data-svappr="' + esc(x.id) + '"')
          + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"')
          + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';
        if (SVA_REV === x.id){
          actions += '<div class="field" style="margin-top:10px"><label>' + esc(t('ما ينقص الزيارة — يقرؤه المشرفُ في مهامّه')) + '</label>'
            + '<input id="svaNote" dir="auto" placeholder="' + esc(t('مثلًا: الصورة لا تُظهر نقطةَ التثبيت، وقياسُ الطول ناقص')) + '"></div>'
            + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>';
        }
      } else if (rv === 'pending' && rankOf(ROLE) >= rankOf('supervisor')){   /* (V28.6) المشرفُ يردّ الزيارةَ للتصحيح بسببٍ مكتوب — والاعتمادُ يبقى للمهندس */
        actions = SVA_REV === x.id
          ? card(t('ردُّ الزيارة'), '<div class="field"><label>' + esc(t('ما الذي ينقص — يصل الفنيَّ في مهامّه')) + '</label><input id="svaNote" dir="auto"></div>'
              + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"') + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>')
          : '<div class="actions">' + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"') + '<span class="hint" style="margin:0">' + esc(t('الاعتمادُ للمهندس')) + '</span></div>';
      }
      if (rv === 'approved' && !so && may('edit')){
        if (SVA_SOL === x.id){
          actions = card('الأجهزة المقترحة لهذه النقطة', itemPickerHtml()
              + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحفَظ الأسطرُ حلًّا للنقطة وتُعتمَد فورًا — فتدخل طبقةَ التركيب.')) + '</p>',
              btn('\u{1F4BE} ' + t('احفظ الحلَّ واعتمده'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
              + btn(t('لاحقًا'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
        } else {
          actions = '<div class="actions">' + btn('\u{1F527} ' + t('اقترح حلَّها الآن'),'btn-secondary btn-sm',' data-svsol="' + esc(x.id) + '"') + '</div>';
        }
      }
      if (rv === 'revisit' && may('approve')){
        actions = '<div class="actions">' + btn('\u2705 ' + t('اعتمدها رغم ذلك'),'btn-quiet btn-sm',' data-svappr="' + esc(x.id) + '"') + '</div>';
      }
      return cardRaw(head0, body + actions);
    }).join('')
    + (rows.length > 60 ? '<p class="hint">' + esc(t('يُعرَض ستون — ضيّق البحث لترى الباقي.')) + '</p>' : '')
    + '<p class="hint">' + esc(t('الردُّ لا يمحو بيانات الزيارة — يبقيها للمقارنة ويعيد النقطةَ إلى مهام المشرف بسببه. والاعتمادُ يُغلق مهمةَ الزيارة فتُحتسب نقاطُها.')) + '</p>';
    return html;
  })();
    if (cur === 'ready') return head + (function(){
      /* الحلقةُ بين الاعتماد والتركيب: ما اعتُمد يظهر هنا برتقاليًّا حتى يُسنَد */
      var L = asnReadyList('install');
      return stats([['جاهزة للتركيب — بانتظار الإسناد', N(L.length), L.length ? 'wrn' : 'ok']])
        + (L.length && may('approve')
            ? '<div class="actions" style="margin:0 0 10px">' + btn('\u26A1 ' + t('أسند الجاهزَ للتركيب الآن') + ' (' + nm(L.length) + ')','btn-primary btn-sm',' data-asnq="install"')
              + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-golayer="install"') + '</div>' : '')
        + (L.length
            ? cardFlush(t('جاهز للتركيب') + ' \u2014 ' + nm(L.length),
                table(['النقطة','الاسم','الحل','اعتُمد','إجراء'], capList(L, 200).map(function(x){
                  var so = solutionOf(x.id) || {}, r = STATE.recs[x.id] || {};
                  return [siteIdHtml(siteOf(x)), esc((x.name || '').slice(0, 30)),
                          '<span class="num">' + nm(Object.keys(so.items || so.lines || {}).length) + '</span> ' + esc(t('سطر')),
                          '<span class="num">' + esc(r.reviewAt ? fmtDate(r.reviewAt) : '—') + '</span>',
                          btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"')];
                })))
            : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا نقاطَ جاهزةً — ما يُعتمَد مع حلِّه يظهر هنا.')) + '</p>'));
    })();
    if (cur === 'chal') return head + (function(){
    var L = chalSitesQ(), open = L.filter(function(x){ return !x.closed; });

    return stats([['إفاداتٌ مسجَّلة', N(L.length), 'acc'],
                  ['بانتظار حل', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['أُغلقت بالتركيب', N(L.length - open.length), 'ok']])

      + (L.length
        ? cardFlush(t('الإفادات') + ' — ' + nm(L.length),
            table(['النقطة','التحديات','الملاحظة','المُفيد','الحالة'],
              capList(L, 200).map(function(x){
                return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                          + esc(((x.site && x.site.name) || '').slice(0, 28)) + '</span>',
                        x.chals.map(function(c){ return pill(c, 'warn'); }).join(' '),
                        esc(x.note || '—'), esc(dispName(x.by) || '—'),
                        x.closed ? pill('أُغلقت بالتركيب', 'ok') : pill('بانتظار حل', 'wrn')];
              })))
        : card('لا إفاداتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور تسجيل تحدٍّ أثناء المسح الميداني — «حالة الموقع» في نموذج المسح.'))
            + '</p>'))

      + '<p class="hint">' + esc(t('التحديات تُسجَّل أثناء المسح («المسح الميداني»)، وتُغلَق تلقائيًّا حين تُعتمَد تركيبتُها — لا يدويًّا.')) + '</p>';
  })();
    /* ═══ المتعذّرُ والراكدُ شريحتان لا واحدة (بلاغ #٢ · V17.40) ═══
   جُمعا في شاشةٍ لأنهما «ما توقّف»، وهما أمران مختلفان: المتعذّرُ زيارةٌ لم
   تقع ويُقرَّر فيها (يُقبَل العذرُ أو يُعاد الإسناد)، والراكدُ زيارةٌ وقعت
   ولم يُركَّب موقعُها فيُسأل عن التركيب. ومن يعمل على أحدهما لا يعنيه الآخر،
   وخلطُهما يجعل العدَّ مضلِّلًا والقرارَ بطيئًا. فصار لكلٍّ شريحتُه بكلِّ
   تفاصيله وشرائحِه وبحثِه وتصديره — كما طلب البلاغُ من الميدان. */
if (cur === 'stuck' || cur === 'idle') return head + (function(){
    var ONLY = cur;                       /* 'stuck' متعذّر · 'idle' راكد */
    var L = stuckList().filter(function(x){ return ONLY === 'stuck' ? x.blocked : !x.blocked; });
    var blocked = L.filter(function(x){ return x.blocked; });
    var stuck7  = L.filter(function(x){ return !x.blocked && x.days >= 7 && x.days < 14; });
    var stuck14 = L.filter(function(x){ return !x.blocked && x.days >= 14; });
    var oldest = L.length ? L[0] : null;

    var open = blocked.filter(function(x){ return !x.accepted; }), accepted = blocked.filter(function(x){ return x.accepted; });
    /* شرائحُ كلِّ شاشةٍ من جنسها: المتعذّرُ بقراره، والراكدُ بعمره */
    var chips = ONLY === 'stuck'
      ? [['','الكل',L.length],['open','يحتاج قرارًا',open.length],['ok','عذرٌ مقبول',accepted.length]]
      : [['','الكل',L.length],['w7','راكدٌ أسبوعًا فأكثر',stuck7.length + stuck14.length],['w14','راكدٌ أسبوعين فأكثر',stuck14.length]];
    var show = L.filter(function(x){
      if (ONLY === 'stuck'){
        if (STK_F === 'open') return !x.accepted;
        if (STK_F === 'ok') return x.accepted;
        return true;
      }
      if (STK_F === 'w7') return x.days >= 7;
      if (STK_F === 'w14') return x.days >= 14;
      return true;
    });
    var rows = [];
    capList(show, 200).forEach(function(x){
      var r = x.rec, isOpen = STK_OPEN === x.id;
      rows.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                 x.blocked ? (x.accepted ? pill('متعذّر — مقبول', 'ok') : pill(r.access || 'متعذّر', 'bad')) : pill('راكد بانتظار التركيب', 'wrn'),
                 '<span dir="auto">' + esc((x.blocked ? (r.reason || r.note || '—') : t(idleStep(x.id).why)).slice(0, 60)) + '</span>',
                 nm(x.days) + ' ' + t('يوم'),
                 esc(dispName(r.by) || '—') + (photoCount(x.id) ? ' <span class="hint" style="margin:0">\u{1F4F7}' + nm(photoCount(x.id)) + '</span>' : ''),
                 btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-stkopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen) rows.push({ raw: stuckPanel(x) });
    });
    return stats([['متعذّر يحتاج قرارًا', N(open.length), open.length ? 'bad' : 'ok'],
                  ['متعذّر مقبول', N(accepted.length), 'ok'],
                  ['راكد ٧–١٤ يومًا', N(stuck7.length), stuck7.length ? 'wrn' : 'ok'],
                  ['راكد أكثر من أسبوعين', N(stuck14.length), stuck14.length ? 'bad' : 'ok'],
                  ['أقدم عنصر', oldest ? (nm(oldest.days) + ' ' + t('يوم')) : '—']])
      + '<div class="chips">' + chips.map(function(c){ return '<button type="button" class="chip' + (STK_F === c[0] ? ' on' : '') + '" data-stkf="' + c[0] + '">' + esc(t(c[1])) + ' <span class="num">' + nm(c[2]) + '</span></button>'; }).join('') + '</div>'
      + (show.length
        ? cardFlush(t('القائمة') + ' — ' + nm(show.length),
            table(['النقطة','الحالة','السبب / الملاحظة','منذ','المشرف / الفني',''], rows))
        : alertBox('success','لا عناصرَ في هذه الخانة الآن.'))
      + '<p class="hint">' + esc(t('المتعذّر: وصل المشرفُ ولم يستطع المسح — يُراجَع بصوره وسببه ويُقرَّر فيه: يعود لزيارةٍ أخرى، أو يُقبَل التعذّرُ بحُجّةٍ مكتوبة. والراكد: زيارةٌ تمّت ولم تُركَّب نقطتُه بعد.')) + '</p>';
  })();
    return head + (function(){
    /* (V26.9) قرارُ المالك: للميدان أيضًا صفحةٌ واحدة «التحديات والمعوقات» بأرقام متابعة الوزارة نفسِها (mfuObstaclesF) وفلترها،
       واضغط التحدي تنفتح نافذةٌ بنقاطه: المخيمُ بشاخصه أو الممرُّ باسمه، ومشعرُه ونوعُه، ووصفُ العائق، وزرُّ الخريطة. */
    var O = mfuObstaclesF(), byCat = {}, ed = rankOf(ROLE) >= rankOf('engineer');
    O.forEach(function(o){ o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; }); });
    var cats = Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; });
    var nr = O.filter(function(o){ return o.cats.indexOf('تعذّر الوصول') > -1; }).length;
    return mfuFilterRow()
      + stats([['نقاطٌ فيها معوقات', N(O.length), O.length ? 'wrn' : 'ok'],
               ['أنواع التحديات', N(cats.length)],
               ['متعذّر الوصول', N(nr), nr ? 'wrn' : 'ok']])
      + (cats.length
        ? cardFlush(t('التحديات') + ' \u2014 ' + esc(t('اضغط التحدي ترى نقاطه')),
            table(['التحدي', 'كم نقطة', 'الجهة', ''],
              cats.map(function(c){ return ['<button type="button" class="btn btn-quiet btn-sm" data-chalpop="' + esc(c) + '" style="white-space:normal;text-align:start">' + esc(t(c)) + '</button>' + chalAssignBox(c) + chalUpdBox(c), N(byCat[c]), esc(t(mfuPartyLabel(mfuOwnerOf(c)))), btn('\u25B8 ' + t('النقاط'), 'btn-secondary btn-sm', ' data-chalpop="' + esc(c) + '"')]; }))   /* (V27.0) التكليفُ والتحديثات */
            + '<div style="padding:8px 12px">' + btn(t('كل النقاط') + ' (' + nm(O.length) + ')', 'btn-quiet btn-sm', ' data-chalpop="*"') + '</div>')
        : alertBox('success', 'لا معوقاتٍ في هذا الفلتر.'))
      + (ed ? chalOtherCard() : '')
      + '<p class="hint">' + esc(t('المعوقات تُقرأ من المسح الميداني للنقاط غير المركَّبة وتُغلَق تلقائيًّا عند التركيب — والأرقامُ هنا هي نفسُها في متابعة الوزارة.')) + '</p>';
  })();
  }};

/* (V38.93) the visit lists of the approvals screen, shared by the screen and its selection buttons */
function svaLists(){
  var lists = { pending:[], approved:[], revisit:[] };
  surveyList().filter(function(x){ return x.rec && (x.rec.review || x.done); })
    .forEach(function(x){ var rv = svReview(x.rec); if (lists[rv]) lists[rv].push(x); });
  return lists;
}
function svaFilter(rows){
  return SVA_Q ? rows.filter(function(x){ return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '')).indexOf(SVA_Q) > -1; }) : rows;
}
/* the ticked visits (kept on the function, not a new global) — and those that still wait: one approved elsewhere in the
   meantime drops out */
function svaSel(){ return svaSel.m || (svaSel.m = {}); }
function svaSelIds(){
  var pend = {}; svaLists().pending.forEach(function(x){ pend[x.id] = 1; });
  return Object.keys(svaSel()).filter(function(id){ return pend[id]; });
}
/* (V38.93) a tick repaints the count, not the screen: re-drawing sixty visit cards per tick took half a second each */
function svaSelPaint(){
  var n = svaSelIds().length;
  var go = document.querySelector('[data-svaselgo]');
  if (go){ go.textContent = '\u2705 ' + t('اعتمد المحدَّد') + ' (' + nm(n) + ')'; go.disabled = !n; }
  var none = document.querySelector('[data-svaselnone]');
  if (none) none.hidden = !n;
}
function svaSelGo(){
  if (!may('approve')){ toast(t('الاعتمادُ للمهندس وحده')); return; }
  var all = svaSelIds();
  if (!all.length){ toast(t('حدِّد زيارةً واحدةً على الأقل')); return; }
  /* a batch is at most 200 visits: each approval writes the visit, its task and a log line, so a thousand at once froze a
     phone for minutes before the first write left; the rest stay ticked for the next press */
  var BATCH = 200, ids = all.slice(0, BATCH), rest = all.length - ids.length;
  if (!confirm(t('اعتمادُ') + ' ' + nm(ids.length) + ' ' + t('زيارة؟ تُرفع كلُّها للوزارة — ويمكن التراجعُ عن هذه الدفعة بزرٍّ يظهر بعدها.')
      + (rest ? '\n' + t('وتبقى') + ' ' + nm(rest) + ' ' + t('محدَّدةً للدفعة التالية.') : ''))) return;
  var res = svApproveMany(ids);
  ids.forEach(function(id){ delete svaSel()[id]; });
  toast(t('اعتُمدت') + ' ' + nm(res.ok.length) + ' ' + t('زيارة')
    + (res.fail.length ? ' \u00b7 ' + t('لم تُعتمَد') + ' ' + nm(res.fail.length) + ' \u2014 ' + res.fail[0][0] + ': ' + res.fail[0][1] : '')
    + (rest ? ' \u00b7 ' + t('وتبقى') + ' ' + nm(rest) + ' ' + t('محدَّدةً للدفعة التالية.') : ''));
  render(1);
}
