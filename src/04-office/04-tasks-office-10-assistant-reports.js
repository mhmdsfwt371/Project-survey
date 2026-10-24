/* ============================================================================
   FILE    : src/04-office/04-tasks-office-10-assistant-reports.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Reports by words ('Excel/PDF for the points that…'): parser, data, grouping, card, export; plus the pending-upload window HTML.
   DEFINES : aqRepCols, aqRepExport, aqGoTo
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function aqRepCols(){ return ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشاخص', 'المسح', 'التركيب', 'الوزارة', 'نظام البطاقات', 'القارئ', 'الإشارة', 'الإشغال']; }

function aqRepExport(fmt){
  var q = ASSIST_Q || '', D = aqRepData(q); if (!D.rows.length){ toast(t('لا نقاطَ تنطبق عليها الشروط')); return; }
  aqRepPrep();
  var cond = D.P.conds.map(function(c){ return t(c.label); }).join(' \u00b7 '), cols = aqRepCols().map(function(c){ return t(c); });
  var body = D.rows.map(aqRepRow), GR = aqRepGroup(D);
  logEvent('تقرير بالكلام — ' + q.slice(0, 80) + ' · ' + D.rows.length + ' نقطة · ' + fmt);
  if (fmt === 'xls'){
    xlsSheets((GR ? [[t('التجميع'), [GR.cols.map(function(c){ return t(c); })].concat(GR.rows).concat([GR.total])]] : []).concat([[t('النقاط'), [cols].concat(body)], [t('الشروط'), [[t('الطلب'), q], [t('ما فُهم'), cond], [t('ما لم يُفهَم'), D.P.unknown.join(' \u00b7 ')], [t('العدد'), D.rows.length], [t('الوقت'), fmtDT()], [t('بواسطة'), dispName(STATE.meta.name || '')]]]]),
      'nusuk-report-' + dayKey(Date.now()) + '.xlsx');
    return;
  }
  var css = 'body{font:11.5px/1.55 system-ui,"Segoe UI",Tahoma;margin:18px;color:#111}h1{font-size:19px;margin:0;color:#1F4E79}'
    + '.meta{color:#556;font-size:11px;margin:4px 0 10px}.box{border:1px solid #dfe6ee;border-radius:10px;padding:8px 12px;margin:0 0 10px;background:#f8fbff}'
    + '.pill{display:inline-block;border:1px solid #9cc3e6;border-radius:99px;padding:1px 9px;margin:2px;font-size:11px;background:#eef6ff}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5px}th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}.big{font-size:22px;font-weight:800;color:#12203a}'
    + '.foot{margin-top:10px;color:#889;font-size:10px}@page{size:A4 landscape;margin:12mm}';
  var html = '<div style="display:flex;align-items:center;gap:12px">' + (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:36px;width:auto">' : '')
    + '<h1>' + esc(t('قارئات أفاقي — تقرير')) + '</h1></div>'
    + '<div class="meta">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>'
    + '<div class="box"><div><b>' + esc(t('الطلب')) + ':</b> ' + esc(q) + '</div><div style="margin-top:4px"><b>' + esc(t('الشروط')) + ':</b> '
    + D.P.conds.map(function(c){ return '<span class="pill">' + esc(t(c.label)) + '</span>'; }).join('') + '</div>'
    + '<div style="margin-top:4px"><span class="big">' + esc(nm(D.rows.length)) + '</span> ' + esc(t('نقطة')) + '</div></div>'
    + (GR ? '<h3 style="margin:10px 0 6px;color:#1F4E79">' + esc(t('التجميع حسب')) + ' ' + esc(t(GR.label)) + '</h3><table><thead><tr>' + GR.cols.map(function(c){ return '<th>' + esc(t(c)) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + GR.rows.concat([GR.total]).map(function(r, ri){ return '<tr' + (ri === GR.rows.length ? ' style="font-weight:700"' : '') + '>' + r.map(function(c){ return '<td>' + esc(String(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'
        + '<h3 style="margin:14px 0 6px;color:#1F4E79">' + esc(t('النقاط')) + '</h3>' : '')
    + '<table><thead><tr>' + cols.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + body.slice(0, 1500).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
    + '</tbody></table>' + (body.length > 1500 ? '<div class="foot">' + esc(t('عُرض ألفٌ وخمسمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '')
    + '<div class="foot">' + esc(t('من بيانات الجهاز وقتَ الإصدار — قارئات أفاقي للمسح والتركيب'))   /* (V38.18) العلامةُ البيضاء: «أفاقي» لا الاسمُ السابق (V16.92) */ + '</div>';
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير ملف الطباعة')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>' + esc(t('قارئات أفاقي — تقرير')) + '</title><style>' + css + '</style></head><body>' + html + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('ملف للطباعة', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  toast(t('اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function aqGoTo(spec){
  var p = String(spec || '').split('|');
  ASSIST_OPEN = false;
  if (p[0] === 'site' && p[1]){ DETAIL_ID = p[1]; CUR = 'site'; render(); return; }
  if (p[0] === 'page' && p[1]){ if (p[2]) EXT.stF = p[2]; navPush(CUR); goPage(p[1]); render(); }
}

