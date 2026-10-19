/* ============================================================================
   FILE    : src/04-office/04-tasks-office-10-assistant-reports.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Reports by words ('Excel/PDF for the points that…'): parser, data, grouping, card, export; plus the pending-upload window HTML.
   DEFINES : aqRepStop, aqRepParse, aqRepData, aqRepGroup, aqRepCols, aqRepRow, aqRepPrep, aqRepCard, aqRepExport, aqGoTo, aqExamples, assistHomeHtml, assistResHtml, queueHtml … (+1 more)
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
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>' + esc(t('قارئات أفاقي — تقرير')) + '</title><style>' + css + '</style></head><body>' + html + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  toast(t('اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function aqGoTo(spec){
  var p = String(spec || '').split('|');
  ASSIST_OPEN = false;
  if (p[0] === 'site' && p[1]){ DETAIL_ID = p[1]; CUR = 'site'; render(); return; }
  if (p[0] === 'page' && p[1]){ if (p[2]) EXT.stF = p[2]; navPush(CUR); goPage(p[1]); render(); }
}
function aqExamples(){
  if (ROLE === 'viewer') return ['كام نقطة اتركبت في منى؟', 'القرّاء اللي مش بترسل', 'المخيم 38/56'];
  return ['كام نقطة اتركبت في منى؟', 'إكسل للممرات في منى اللي تحت كوبري', 'تقرير المخيمات حسب المشعر', 'إكسل للمخيمات في منى اللي اتركبت ومش بترسل', 'PDF للنقاط اللي ليها بيانات 1447 ومش مربوطة', 'القرّاء اللي مش بترسل', 'المخيم 38/56', 'رصيد الراوتر', 'مين متأخر في المهام؟', 'التحديات في منى', 'أعلى إشغال', 'إيه الناقص علشان نجهز؟'];
}
function assistHomeHtml(){
  var fy = assistForYou(), tp = assistTopPages(), pq = ASSIST_PAGE_Q[CUR] || [];
  var base = (ROLE === 'viewer' ? ASSIST_QUICK.filter(function(q){ return !/ممنوع|لاقيه|القارئ/.test(q); }) : ASSIST_QUICK).filter(function(q){ return pq.indexOf(q) < 0; });
  var chips = function(L){ return '<div class="chips" style="margin:0 0 10px">' + L.map(function(q){ return '<button type="button" class="chip" data-assistq="' + esc(q) + '">' + esc(t(q)) + '</button>'; }).join('') + '</div>'; };
  return (fy.length ? '<div class="card" style="margin:0 0 10px"><div class="pid">' + esc(t('لك الآن')) + '</div>' + fy.map(function(x){ return '<button type="button" class="btn btn-quiet btn-block" style="justify-content:flex-start;text-align:start;margin:4px 0"' + x[2] + '>' + x[0] + ' ' + esc(x[1]) + '</button>'; }).join('') + '</div>' : '')
    + '<div class="pid" style="margin:4px 0">\u{1F4CA} ' + esc(t('اسأل عن البيانات')) + '</div>' + chips(aqExamples())   /* (V38.14) */
    + (pq.length ? '<div class="pid" style="margin:4px 0">' + esc(t('في الصفحة دي')) + '</div>' + chips(pq) : '')
    + '<div class="pid" style="margin:4px 0">' + esc(t('الأكثر تكرارًا')) + '</div>' + chips(base)
    + (tp.length ? '<div class="pid" style="margin:4px 0">' + esc(t('صفحاتك')) + '</div><div class="chips" style="margin:0 0 10px">' + tp.map(function(k){ return '<button type="button" class="chip" data-p="' + esc(k) + '" data-assist="0">' + esc(t(PAGE[k].t || k)) + ' \u2190</button>'; }).join('') + '</div>' : '');
}
function assistResHtml(){
  if (ASSIST_Q && String(ASSIST_Q).trim().length < 3){ var q0 = ASSIST_Q; ASSIST_Q = ''; var h0 = assistResHtml(); ASSIST_Q = q0; return h0; }   /* (V37.40) حرفٌ أو حرفان: الصفحةُ الرئيسيةُ لا نتائجُ عشوائية */
  var dq = ASSIST_Q ? aqAnswer(ASSIST_Q) : '';   /* (V38.14) مساعدُ البيانات أوّلًا */
  var answered = !!(ASSIST_Q && (dq || assistIntent(ASSIST_Q) || knownHits(ASSIST_Q).length));   /* (V37.37) بلاغُ المالك: «الحاجات اللي تحت بتشوّش على اللي بدوّر عليه» */
  var results = ASSIST_Q && !answered ? helpSearch(ASSIST_Q, 12) : [], gl = ASSIST_Q && !answered ? glossaryHits(ASSIST_Q) : [];
  if (ASSIST_Q){ assistLog(ASSIST_Q, !!(answered || results.length || gl.length)); }   /* (V37.30) */
  return assistDiagCard(ASSIST_Q)   /* (V37.23) التشخيصُ أوّلًا */
    + dq
    + (!ASSIST_Q
        ? assistHomeHtml()   /* (V37.40) بما يخصّ صاحبَ الجهاز ودورَه وصفحتَه */
        : (gl.map(function(g){ return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--acc, #1A5FA8)"><div class="pid">' + esc(t('المصطلح')) + '</div><h4 style="margin:2px 0 6px">' + esc(t(g.t)) + '</h4><p style="margin:0">' + esc(t(g.d)) + '</p></div>'; }).join('')
          + (results.length
            ? results.map(function(e){
                var steps = HELP_STEPS[e.id];
                return '<div class="card" style="margin:0 0 10px">'
                  + '<div class="pid">' + esc(t(e.m)) + (e.sub ? ' \u00b7 ' + esc(t(e.sub)) : '') + '</div>'
                  + '<h4 style="margin:2px 0 6px">' + esc(t(e.t)) + '</h4>'
                  + (e.l ? '<p class="hint" style="margin:0 0 8px">' + esc(t(e.l)) + '</p>' : '')
                  + (steps
                      ? '<ol style="margin:0 0 10px;padding-inline-start:20px">'
                        + steps.map(function(s){ return '<li>' + esc(t(s)) + '</li>'; }).join('')
                        + '</ol>'
                      : '')
                  + btn(t(e.t) + ' \u2190','btn-primary btn-sm',' data-p="' + e.id + '" data-assist="0"')
                  + '</div>';
              }).join('')
            : (gl.length || answered ? '' : '<p class="hint" style="text-align:center;padding:20px">'   /* (V37.37) التشخيصُ جوابٌ — لا «معنديش نتيجة» تحته */
              + esc(t('معنديش نتيجة قريبة — جرّب كلمة تانية، أو تصفّح القائمة الجانبية.')) + '</p>'
              /* (V38.16) لا طريقَ مسدودًا: صيغُ أسئلة البيانات التي يفهمها، بضغطة */
              + '<div class="pid" style="margin:4px 0">\u{1F4CA} ' + esc(t('جرّب سؤالًا عن البيانات')) + '</div><div class="chips" style="margin:0 0 10px">'
              + aqExamples().map(function(q){ return '<button type="button" class="chip" data-assistq="' + esc(q) + '">' + esc(t(q)) + '</button>'; }).join('') + '</div>'))));
}
function queueHtml(){
  var Q = (STATE.queue || []).slice().sort(function(a,b){ return (b.at||0) - (a.at||0); });
  var by = {};
  Q.forEach(function(x){ by[x.kind] = (by[x.kind] || 0) + 1; });

  return '<div class="pop" id="queuePop" style="width:min(620px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">\u{1F4E4} ' + esc(t('بانتظار الرفع')) + ' — ' + nm(Q.length) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'
    +     esc(t(STATE.meta.online ? 'الشبكةُ متاحة — تُرفَع تلقائيًّا الآن.'
                                 : 'لا شبكة — تُرفَع كاملةً حين تعود، ولا يسقط منها شيء.')) + '</p></div>'
    +   '<div class="actions" style="margin:0">'
    /* الزرُّ هنا أيضًا: من يرى الطابورَ على الخريطة لا يذهب إلى شاشةٍ أخرى ليدفعه */
    +     (Q.length && STATE.meta.online ? btn('\u2191 ' + t('ادفع الآن'),'btn-primary btn-sm',' data-pushnow="1"') : '')
    /* (V38.30) ملفُّ انتظار: يخرج من الجهاز (لنقل العنوان أو جهازٍ لا يرفع) ويُستورَد من المكتب */
    +     ((Q.length || (STATE.stale || []).length) ? btn('\u{1F4E4} ' + t('صدّر ملف انتظار'),'btn-secondary btn-sm',' data-qexport="1"') : '')
    +     (may('settings') ? '<label class="btn btn-quiet btn-sm" style="cursor:pointer">\u{1F4E5} ' + esc(t('استورد ملف انتظار')) + '<input type="file" accept=".json" data-qimport="1" style="display:none"></label>' : '')
    +     '<button type="button" class="btn btn-quiet btn-sm" data-pq="0" aria-label="'
    +       esc(t('إغلاق')) + '">\u2715</button>'
    +   '</div>'
    + '</div>'
    + '<div class="pop-body">'
    + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok']]
            .concat(Object.keys(by).map(function(k){ return [t(Q_LBL[k] || k), N(by[k])]; })))
    + (Q.length ? '' : alertBox('success','لا شيءَ بانتظار الرفع على هذا الجهاز — كلُّ ما سُجِّل هنا وصل.'))
    /* (V38.30) ما تُجوهل بالمهلة يُرى ويُصدَّر — لا يُمحى صامتًا */
    + ((STATE.stale || []).length ? alertBox('warn', t('تُجوهل') + ' ' + nm((STATE.stale || []).length) + ' ' + t('مما كان ينتظر الرفع لأنه أقدمُ من المهلة') + ' (' + nm(CORE.queueTtlDays()) + ' ' + t('يوم') + ') — ' + t('محفوظٌ على الجهاز: صدّره ليستورده المكتب، أو امحُه')) + '<div class="actions" style="margin:4px 0 8px">' + btn('\u{1F5D1} ' + t('امحُ المتجاهَل'), 'btn-quiet btn-sm', ' data-qstaleclear="1"') + '</div>' : '')
    + (Q.length ? table(['النوع','السجل','بواسطة','سُجّل'],
        capList(Q, 200).map(function(x){
          var v = x.v || {};
          /* «بواسطة» صاحبُ العمل المسجَّل في السجل نفسه لا حاملُ الجهاز:
             الجهازُ الواحد قد يحمل عملَ أكثرَ من فنيٍّ في يومٍ واحد. */
          var who = v.by || v.user || v.doneBy || v.reopenBy || STATE.meta.name || '\u2014';
          return [pill(t(Q_LBL[x.kind] || x.kind), 'acc'),
                  '<strong>' + esc(String(x.id || '\u2014')) + '</strong>',
                  esc(dispName(who)),
                  '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
        })) : '')
    + (Q.length > 200
        ? ''
        : '')

    /* ── ما وصل حديثًا: متابعةُ عمل الميدان أوّلًا بأول ──
       طابورُ جهازٍ آخر لا يُرى من هنا — ما لم يُرسَل لم يغادر ذلك الجهاز.
       فالمتابعةُ الممكنةُ هي ما وصل فعلًا: مَن سجّل ماذا ومتى، مرتَّبًا
       بالأحدث، من سجل الأحداث المُزامَن. */
    + (function(){
        var E = (STATE.events || []).slice(0, 40);
        if (!E.length) return '';
        return '<h4 style="margin:18px 0 8px">' + esc(t('وصل حديثًا')) + '</h4>'
          + table(['الحدث','بواسطة','الوقت'],
              E.map(function(x){
                return [esc(x.what || ''), esc(x.by || '\u2014'),
                        '<span class="num">' + esc((x.day||'') + ' ' + (x.at||'')) + '</span>'];
              }))
          + '<p class="hint">' + esc(t('من سجل الأحداث المُزامَن — للتفصيل الكامل والتصفية: «سجل الأحداث».')) + '</p>';
      })()

    + '<p class="hint">' + esc(t('لا شيءَ يُحذَف من الطابور إلا بعد أن يصل فعلًا — والأقدمُ يُرفَع أولًا. وما لم يُرسَل من جهازٍ آخر لا يُرى من هنا: لم يغادره بعد.')) + '</p>'
    + '</div></div>';
}

function helpHtml(){
  /* في صفحةٍ مدموجةٍ تُشرَح الشريحةُ المفتوحةُ لا الأمُّ وحدها */
  var hid = TABS[CUR] ? tabCur(CUR) : CUR;
  var p = pageMeta(hid);
  var h = helpOf(hid);
  if (!h || !p) return '';
  return '<div class="pop" id="helpPop" style="width:min(520px,92vw)">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + esc(t(p.t)) + '</h3>'
    +   '<div class="pid" style="margin-top:3px">' + esc(t(p.m)) + (p.sub ? ' \u00b7 ' + esc(t(p.sub)) : '') + '</div></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-help="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="help-rows">'
    +   '<div><span class="hk">' + esc(t('ماذا تفعل')) + '</span><p>' + esc(t(h.w)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('من أين تقرأ')) + '</span><p>' + esc(t(h.f)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('علامَ تُبنى')) + '</span><p>' + esc(t(h.o)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('متى تكتمل')) + '</span><p>' + esc(t(h.d)) + '</p></div>'
    + '</div></div>'
    + '<div class="actions" style="margin-top:13px">'
    +   btn('📘 ' + t('دليل العمليات'),'btn-secondary btn-sm',' data-p="sop"')
    +   btn('🗺 ' + t('خريطة التغطية'),'btn-secondary btn-sm',' data-p="cover"')
    + '</div></div>';
}

