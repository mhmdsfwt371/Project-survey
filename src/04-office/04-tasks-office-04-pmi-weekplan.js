/* ============================================================================
   FILE    : src/04-office/04-tasks-office-04-pmi-weekplan.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Project governance per PMI and the engineer's week plan.
   DEFINES : baseSet, evmVerdict, wplanSees, wplanMay, wplanOpenPast, isoWeekMonday, wplanNextWeek, wplanBody
   GLOBALS : BASE, WPLAN_WK, WPLAN_PRI
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ حوكمةُ المشروع بمعايير PMI ═══
   أربعةٌ يسأل عنها المدقّق ولم تكن: خطُّ أساسٍ يُقاس عليه، وقيمةٌ مكتسبةٌ
   تقول أين نحن، وسجلُّ مخاطرَ بالاحتمال والأثر، وضبطُ تغييرٍ يمنع الانزلاق. */

function baseSet(){
  /* تجميدُ خطِّ أساسٍ ميزانيتُه صفرٌ يُسكِت القيمةَ المكتسبةَ إلى الأبد ولا
     يشكو — ومن جمّده يظنُّ أنه خطّط. يُقال له ما ينقص قبل التجميد. */
  if (!cfgGet('ph')){
    toast(t('اضبط سعرَ النقطة أوّلًا — وإلا كان خطُّ الأساس بميزانيةٍ صفر'));
    return null;
  }
  var S = siteStats();
  BASE = {
    at: Date.now(),
    by: STATE.meta.name || '',
    scope: S.total,
    byKey: JSON.parse(JSON.stringify(S.byKey)),
    months: PLAN_MONTHS || cfgGet('phase') || 4,
    budget: cfgGet('budCap'),
    ph: cfgGet('ph'),
    targets: { survey:cfgGet('tgtSurvey'), ins:cfgGet('tgtInsCamp') + cfgGet('tgtInsCor'),
               prep:cfgGet('tgtPrepCamp') + cfgGet('tgtPrepCor'),
               asm:cfgGet('tgtAsmCamp') + cfgGet('tgtAsmCor'), dis:cfgGet('tgtDis') },
    ver: (BASE ? BASE.ver + 1 : 1)
  };
  /* الميزانيةُ الكلية للنطاق: نقاطُ المسح والتركيب في سعر النقطة */
  var pts = 0;
  STATE.sites.forEach(function(x){ pts += ptsSurvey(x) + ptsInstall(x); });
  BASE.bac = Math.round(pts * BASE.ph);          /* Budget At Completion */
  BASE.totalPts = Math.round(pts);
  CORE.set('baseline', 'v' + BASE.ver, BASE);
  logEvent('تجميد خط الأساس — النسخة ' + nm(BASE.ver));
  return BASE;
}

function evmVerdict(v){
  if (!v) return { t:'—', c:'' };
  if (v.SPI >= 1 && v.CPI >= 1) return { t:'متقدّمٌ وضمن الكلفة', c:'ok' };
  if (v.SPI >= 0.95 && v.CPI >= 0.95) return { t:'ضمن الحدود المقبولة', c:'ok' };
  if (v.SPI < 0.9 && v.CPI < 0.9) return { t:'متأخّرٌ ومتجاوزٌ للكلفة', c:'bad' };
  if (v.SPI < 0.95) return { t:'متأخّرٌ عن الجدول', c:'wrn' };
  return { t:'متجاوزٌ للكلفة', c:'wrn' };
}

/* (V21.3) تراها المهندسون ومن فوقهم (المدير والإدارة العليا)؛ ويكتبها المهندس والمدير */
function wplanSees(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin' || r === 'exec'; }
function wplanMay(){ var r = effRole(ROLE); return r === 'engineer' || r === 'admin'; }

function wplanOpenPast(){ var cur = mfuWeekKey(); return pmoList('wplan').filter(function(x){ return x.wk && x.wk < cur && !wplanFinal(x); }); }

/* (V21.4) الأسبوعُ التالي يُحسَب بالتاريخ: اثنينُ الأسبوع + سبعة أيام — كان العدُّ يقفز من
   الأسبوع ٥٢ إلى ١ فيُسقِط الأسبوعَ ٥٣ الذي تعرفه سنواتٌ منها ٢٠٢٦ */
function isoWeekMonday(k){ var m = /^(\d{4})-W(\d{2})$/.exec(k || ''); if (!m) return null; var j4 = new Date(Date.UTC(+m[1], 0, 4)), mon1 = j4.getTime() - ((j4.getUTCDay() + 6) % 7) * 864e5; return mon1 + (+m[2] - 1) * 7 * 864e5; }
function wplanNextWeek(k){ var mon = isoWeekMonday(k || mfuWeekKey()); return mfuWeekKey((mon == null ? Date.now() : mon) + 7 * 864e5 + 3 * 864e5); }

function wplanBody(){
  if (!wplanSees()) return alertBox('warn', 'خطةُ الأسبوع للمهندسين ومن فوقهم.');
  pmoFetch();
  var can = wplanMay(), past = wplanOpenPast();
  var wk = wplanWeek(), L = wplanItems(wk), all = pmoList('wplan'), weeks = {}; all.forEach(function(x){ if (x.wk) weeks[x.wk] = 1; });
  var cur = mfuWeekKey(), nxt = wplanNextWeek(cur); weeks[cur] = 1; weeks[nxt] = 1;
  var ed = WPLAN_EDIT ? all.filter(function(x){ return x.id === WPLAN_EDIT; })[0] : (WPLAN_PREFILL || null);
  var done = L.filter(function(x){ return x.st === 'تم'; }).length, stepsAll = 0, stepsDone = 0;
  L.forEach(function(x){ var st = wplanLines(x.steps); stepsAll += st.length; stepsDone += (x.sdone || []).filter(Boolean).length; });
  var chips = Object.keys(weeks).sort().map(function(k){ return btn((k === cur ? t('هذا الأسبوع') + ' ' : k === nxt ? t('الأسبوع القادم') + ' ' : '') + k, 'chip' + (k === wk ? ' active' : ''), ' data-wpwk="' + esc(k) + '"'); }).join('');
  var f = function(id, v){ return esc(ed ? (ed[id] || '') : ''); };
  var form = !can ? '' : card(ed && ed.id ? 'تعديل النقطة' : 'نقطةٌ جديدة في خطة الأسبوع',
      '<div class="grid2"><label>' + esc(t('العنوان')) + '<input id="wpT" value="' + f('t') + '"></label><label>' + esc(t('الأولوية')) + '<select id="wpP">' + WPLAN_PRI.map(function(p){ return '<option value="' + esc(p) + '"' + ((ed ? ed.pri : 'متوسطة') === p ? ' selected' : '') + '>' + esc(t(p)) + '</option>'; }).join('') + '</select></label></div>'
      + '<label>' + esc(t('التفاصيل والملاحظات')) + '<textarea id="wpN" rows="2">' + f('n') + '</textarea></label>'
      + '<label>' + esc(t('الخطوات — خطوةٌ في كلِّ سطر')) + '<textarea id="wpS" rows="3">' + f('steps') + '</textarea></label>'
      + '<div class="grid2"><label>' + esc(t('الاحتياجات والمتطلبات')) + '<textarea id="wpR" rows="2">' + f('needs') + '</textarea></label><label>' + esc(t('النتيجة المرجوّة')) + '<textarea id="wpG" rows="2">' + f('goal') + '</textarea></label></div>'
      + '<div class="actions">' + btn(t(ed && ed.id ? 'احفظ التعديل' : 'أضف إلى الخطة'), 'btn-primary btn-sm', ' data-wpsave="' + esc(ed && ed.id ? ed.id : '') + '"') + (ed ? btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-wpcancel="1"') : '') + '</div>');
  var cardOf = function(x){
    var st = wplanLines(x.steps), sd = x.sdone || [], tk = mfuTaskState(x.task), fin = wplanFinal(x), act = WPLAN_ACT && WPLAN_ACT.id === x.id ? WPLAN_ACT.kind : '';
    var ups = wplanUpdates(x);
    return '<div class="card wp-item wp-' + (x.st === 'تم' ? 'done' : x.st === 'مغلق' ? 'closed' : x.st === 'جارٍ' ? 'run' : x.st === 'بانتظار تجارب' ? 'wait' : 'plan') + '">'
      + '<div class="wp-h"><b>' + esc(x.t || '') + '</b> ' + pill(t(x.pri || 'متوسطة'), x.pri === 'عالية' ? 'bad' : x.pri === 'منخفضة' ? '' : 'wrn') + (x.wk && x.wk !== wk ? ' <span class="hint" style="margin:0">' + esc(x.wk) + '</span>' : '')
      + (fin ? ' ' + pill(t(x.st), x.st === 'تم' ? 'ok' : '') : (can ? ' <select data-wpst="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + ['مخطط', 'جارٍ', 'بانتظار تجارب'].map(function(v){ return '<option value="' + esc(v) + '"' + ((x.st || 'مخطط') === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>' : ' ' + pill(t(x.st || 'مخطط'), 'wrn'))) + '</div>'
      + (x.n ? '<p style="margin:6px 0">' + esc(x.n) + '</p>' : '')
      + (st.length ? '<div class="wp-sec">' + esc(t('الخطوات')) + ' · ' + nm(sd.filter(Boolean).length) + '/' + nm(st.length) + '</div><ul class="wp-steps">' + st.map(function(l, i){ return '<li><label><input type="checkbox" data-wpstep="' + esc(x.id) + '|' + i + '"' + (sd[i] ? ' checked' : '') + '> <span' + (sd[i] ? ' style="text-decoration:line-through;opacity:.7"' : '') + '>' + esc(l) + '</span></label></li>'; }).join('') + '</ul>' : '')
      + (x.needs ? '<div class="wp-sec">' + esc(t('الاحتياجات والمتطلبات')) + '</div><p style="margin:2px 0 6px">' + esc(x.needs) + '</p>' : '')
      + (x.goal ? '<div class="wp-sec">' + esc(t('النتيجة المرجوّة')) + '</div><p style="margin:2px 0 6px">' + esc(x.goal) + '</p>' : '')
      + (x.result ? '<div class="wp-sec" style="color:#27AE60">\u2713 ' + esc(t('النتيجة الفعلية')) + '</div><p style="margin:2px 0 6px;color:#27AE60;font-weight:700">' + esc(x.result) + '</p>' : '')
      + (x.closeWhy ? '<div class="wp-sec" style="color:#7F8C8D">\u23F9 ' + esc(t('أُغلقت')) + '</div><p style="margin:2px 0 6px;color:#7F8C8D">' + esc(x.closeWhy) + '</p>' : '')
      + (ups.length ? '<div class="wp-sec">' + esc(t('التحديثات')) + ' · ' + nm(ups.length) + '</div><ul class="wp-steps">' + ups.slice(0, 6).map(function(h){ return '<li><span class="hint" style="margin:0">' + esc(fmtDate(h.at)) + ' \u00b7 ' + esc(dispName(h.by)) + '</span> — ' + esc(h.v) + '</li>'; }).join('') + '</ul>' : '')
      + (act && can ? '<div class="wp-act"><label>' + esc(t(act === 'result' ? 'النتيجة الفعلية — ما الذي تحقّق' : act === 'upd' ? 'التحديث — وماذا ننتظر بعده' : 'سببُ الإغلاق')) + '<textarea id="wpAct" rows="2"></textarea></label>'
          + (act === 'close' ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="wpActNew" checked> ' + esc(t('وأضف نقطةً جديدةً بدلها')) + '</label>' : '')
          + '<div class="actions">' + btn(t(act === 'result' ? 'سجّل النتيجة وأتمم' : act === 'upd' ? 'سجّل التحديث' : 'أغلق النقطة'), 'btn-primary btn-sm', ' data-wpact="' + esc(x.id) + '|' + act + '"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-wpact="' + esc(x.id) + '|cancel"') + '</div></div>' : '')
      + (can ? '<div class="actions" style="margin-top:6px">'
        + (!fin ? btn('\u2713 ' + t('أتممتها — سجّل النتيجة'), 'btn-primary btn-sm', ' data-wpdo="' + esc(x.id) + '|result"') + btn('\u270E ' + t('تحديث'), 'btn-secondary btn-sm', ' data-wpdo="' + esc(x.id) + '|upd"') + btn('\u23F9 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-wpdo="' + esc(x.id) + '|close"') : '')
        + (tk ? pill('#' + tk.id + ' \u00b7 ' + t(tk.st), tk.done ? 'ok' : 'wrn') : (!fin ? btn('\uFF0B ' + t('مهمة أسبوعية'), 'btn-quiet btn-sm', ' data-wptask="' + esc(x.id) + '"') : ''))
        + btn('\u270E ' + t('تعديل'), 'btn-quiet btn-sm', ' data-wpedit="' + esc(x.id) + '"')
        + (!fin ? btn('\u2192 ' + t('رحّل للأسبوع القادم'), 'btn-quiet btn-sm', ' data-wpnext="' + esc(x.id) + '"') : '')
        + btn('\u2715', 'btn-quiet btn-sm', ' data-wpdel="' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') + '</div>' : (tk ? '<div class="actions" style="margin-top:6px">' + pill('#' + tk.id + ' \u00b7 ' + t(tk.st), tk.done ? 'ok' : 'wrn') + '</div>' : ''))
      + '</div>';
  };
  var cards = L.map(cardOf).join('');
  var pastHtml = past.length ? '<div class="card" style="border-inline-start:5px solid #C0392B"><b style="color:#C0392B">\u26A0 ' + esc(t('من أسابيع سابقة بلا نتيجةٍ ولا إغلاق')) + ' \u00b7 ' + nm(past.length) + '</b><p class="hint" style="margin:4px 0 0">' + esc(t('كلُّ نقطةٍ تُتمّ بنتيجة، أو تُحدَّث وتنتظر تجاربَ أخرى، أو تُغلَق وتُضاف بدلها نقطة.')) + '</p></div>' + past.map(cardOf).join('') : '';
  var closed = L.filter(function(x){ return x.st === 'مغلق'; }).length, waiting = L.filter(function(x){ return x.st === 'بانتظار تجارب'; }).length;
  return '<div class="chips" style="margin:0 0 10px">' + chips + '</div>'
    + stats([['نقاطُ الخطة', N(L.length)], ['تمّت بنتيجة', N(done), done === L.length && L.length ? 'ok' : ''], ['بانتظار تجارب', N(waiting), waiting ? 'wrn' : ''], ['مغلقة', N(closed)], ['الخطواتُ المنجزة', nm(stepsDone) + ' / ' + nm(stepsAll)], ['أسابيعُ سابقةٌ بلا إغلاق', N(past.length), past.length ? 'bad' : 'ok']])
    + (wk === cur ? pastHtml : '')
    + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل — خطة الأسبوع'), 'btn-secondary btn-sm', ' data-xls="wplan"') + '</div>'
    + (cards || '<p class="hint">' + esc(t('لا نقاطَ في هذا الأسبوع بعد.')) + '</p>')
    + form
    + '<p class="hint">' + esc(t('كلُّ نقطةٍ في أسبوعها تنتهي إلى واحدةٍ من ثلاث: تُتمّ بنتيجةٍ مكتوبة، أو تُحدَّث وتنتظر تجاربَ أخرى، أو تُغلَق وتُضاف بدلها نقطةٌ جديدة. يكتبها المهندس، ويراها المهندسون ومن فوقهم.')) + '</p>';
}
PAGE.plan = { m:'التخطيط', t:'التخطيط والمخاطر',
  l:'المواعيدُ والمعالمُ وخطُّ الأساس — وما قد يسوء وما تغيّر وسلامةُ الخط.',
  body:function(){
    var head = tabHead('plan'), cur = tabCur('plan');
    if (cur === 'wplan') return head + wplanBody();   /* (V21.2) */
    if (cur === 'risks') return head + (function(){
    var RL = risksList();
    var open = RL.filter(function(r){ return r.st === 'مفتوح'; });
    var crit = open.filter(function(r){ return riskScore(r) >= 15; });
    var high = open.filter(function(r){ return riskScore(r) >= 9 && riskScore(r) < 15; });
    var sorted = RL.slice().sort(function(a,b){ return (a.st === 'مغلق') - (b.st === 'مغلق') || riskScore(b) - riskScore(a); });
    var sig = riskSignals();

    return stats([['مخاطر مفتوحة', N(open.length), open.length?'wrn':'ok'],
                  ['حرجة', N(crit.length), crit.length?'bad':'ok'],
                  ['عالية', N(high.length), high.length?'wrn':''],
                  ['مغلقة', N(RL.length - open.length), 'ok']])

      /* ما تقوله الأرقامُ الآن — لا ما كُتب في اجتماع */
      + card('\u{1F6A8} ' + t('مؤشرات خطرٍ حيّة — من البيانات نفسِها'),
          '<div class="list">' + sig.map(function(x){
            return '<div class="list-item"><div class="li-main"><div class="li-t">'
              + pill(x[0] === 'ok' ? 'سليم' : (x[0] === 'bad' ? 'حرج' : 'انتبه'), x[0] === 'ok' ? 'ok' : (x[0] === 'bad' ? 'off' : 'warn'))
              + ' ' + esc(x[1]) + '</div></div>'
              + (x[2] && seesPage(PARENT[x[2]] || x[2]) ? '<div class="li-end">' + btn('\u{1F4CD}','btn-quiet btn-sm',' data-p="' + esc(x[2]) + '"') + '</div>' : '')
              + '</div>';
          }).join('') + '</div>'
          + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحسَب كلَّ رسمةٍ من الجدول والكلفة والزيارات والبلاغات والمهام — الخطرُ يُرى قبل أن يُكتَب.')) + '</p>')

      + cardFlush(t('السجل') + ' — ' + nm(RL.length),
          table(['#','الخطر','الفئة','احتمال','أثر','الدرجة','الاستجابة','المالك','الحالة'],
            sorted.map(function(r){
              var sc = riskScore(r), L = riskLevel(sc), ed = may('settings');
              return ['<span class="num">' + esc(r.id) + '</span>',
                      '<strong>' + esc(t(r.t)) + '</strong><br>'
                        + '<span class="hint" style="margin:0">' + esc(t(r.plan || '')) + '</span>',
                      esc(t(r.cat)),
                      ed ? '<input type="number" min="1" max="5" value="' + esc(String(cfgN(r.p))) + '" data-rkp="' + esc(r.id) + '" style="width:58px">' : N(r.p),
                      ed ? '<input type="number" min="1" max="5" value="' + esc(String(cfgN(r.i))) + '" data-rki="' + esc(r.id) + '" style="width:58px">' : N(r.i),
                      '<span class="pill ' + L.c + '">' + nm(sc) + ' · ' + esc(t(L.t)) + '</span>',
                      esc(t(r.resp)),
                      ed ? '<input value="' + esc(r.own || '') + '" data-rko="' + esc(r.id) + '" dir="auto" style="width:110px">' : esc(t(r.own)),
                      (ed ? btn('🗑','btn-quiet btn-sm',' data-rkdel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')
                      + (ed ? '<select data-rkst="' + esc(r.id) + '"><option value="مفتوح"' + (r.st === 'مفتوح' ? ' selected' : '') + '>' + esc(t('مفتوح')) + '</option><option value="مغلق"' + (r.st === 'مغلق' ? ' selected' : '') + '>' + esc(t('مغلق')) + '</option></select>'
                         : pill(r.st, r.st === 'مغلق' ? 'ok' : 'warn'))];
            })),
          btn('⬇ إكسل — سجل المخاطر','btn-secondary btn-sm',' data-xls="risks"'))

      + (may('settings')
        ? card('إضافة خطر',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الخطر')) + ' <span class="req">*</span></label><input id="rkT" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الفئة')) + '</label><select id="rkC">'
            +   ['ميداني','فني','مشتريات','موارد','مالي','جهات خارجية','سلامة'].map(function(c){ return '<option value="' + esc(c) + '">' + esc(t(c)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('الاستجابة')) + '</label><select id="rkR">'
            +   ['تخفيف','تجنّب','نقل','قبول'].map(function(c){ return '<option value="' + esc(c) + '">' + esc(t(c)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('احتمال')) + ' (' + nm(1) + '–' + nm(5) + ')</label><input type="number" id="rkP" min="1" max="5" value="3"></div>'
            + '<div class="field"><label>' + esc(t('أثر')) + ' (' + nm(1) + '–' + nm(5) + ')</label><input type="number" id="rkI" min="1" max="5" value="3"></div>'
            + '<div class="field"><label>' + esc(t('المالك')) + '</label><input id="rkO" dir="auto"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('خطة الاستجابة')) + '</label><input id="rkPl" dir="auto"></div>'
            + '</div>',
            btn('➕ ' + t('سجِّل الخطر'),'btn-primary btn-sm',' data-rkadd="1"'))
        : '')

      + card('مصفوفة الاحتمال والأثر',
          (function(){
            var rows = [];
            for (var p = 5; p >= 1; p--){
              var cells = ['<b>' + nm(p) + '</b>'];
              for (var i = 1; i <= 5; i++){
                var sc = p * i, L = riskLevel(sc);
                var here = risksList().filter(function(r){ return r.p === p && r.i === i && r.st === 'مفتوح'; });
                cells.push('<span class="pill ' + L.c + '">' + nm(sc)
                  + (here.length ? ' · ' + here.map(function(r){ return r.id; }).join(' ') : '') + '</span>');
              }
              rows.push(cells);
            }
            return table(['احتمال ↓ / أثر →','١','٢','٣','٤','٥'], rows);
          })()
          + '<p class="hint">' + esc(t('الدرجةُ حاصلُ ضربهما: خمسةَ عشرَ فأكثرُ حرجٌ يُرفع للإدارة، وتسعةٌ فأكثرُ عالٍ يُتابَع أسبوعيًّا.')) + '</p>')

      + card('توزيع الاستجابات',
          table(['الاستجابة','عددها','ما تعنيه'], [
            ['تجنّب', N(risksList().filter(function(r){ return r.resp==='تجنّب'; }).length), 'يُغيَّر الخطُّ فلا يقع'],
            ['تخفيف', N(risksList().filter(function(r){ return r.resp==='تخفيف'; }).length), 'يُقلَّل احتمالُه أو أثرُه'],
            ['نقل',   N(risksList().filter(function(r){ return r.resp==='نقل'; }).length),   'يُحمَّل طرفًا آخر'],
            ['قبول',  N(risksList().filter(function(r){ return r.resp==='قبول'; }).length),  'يُحتمَل ويُرصَد له احتياطي']
          ]));
  })();
    if (cur === 'chg') return head + (function(){
    var pend = CHANGES.filter(function(c){ return c.st === 'مقدَّم'; });
    return stats([['طلبات قائمة', N(CHANGES.length)],
                  ['بانتظار القرار', N(pend.length), pend.length?'wrn':''],
                  ['معتمدة', N(CHANGES.filter(function(c){ return c.st==='معتمد'; }).length), 'ok'],
                  ['مرفوضة', N(CHANGES.filter(function(c){ return c.st==='مرفوض'; }).length)]])

      + card('طلب تغيير جديد',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نوع التغيير')) + '</label>'
          + '<select id="chgKind">'
          + ['نطاق','جدول','ميزانية','جودة','موارد'].map(function(k){
              return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الأثر على خط الأساس')) + '</label>'
          + '<select id="chgImp">'
          + ['لا أثر','أثرٌ محدود','أثرٌ جوهري'].map(function(k){
              return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>'
          /* المقاديرُ تُكتَب رقمًا لا وصفًا — فتُطبَّق على خط الأساس عند الاعتماد
             لا أن يُقال «اعتُمد — جمّد خطًّا جديدًا» ويُترَك التطبيقُ للذاكرة */
          + '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('أثرُه على الكلفة')) + ' (' + esc(t('ريال')) + ' ±)</label>'
          +   '<input type="number" id="chgCost" value="0" inputmode="numeric"></div>'
          + '<div class="field"><label>' + esc(t('أثرُه على الجدول')) + ' (' + esc(t('يوم')) + ' ±)</label>'
          +   '<input type="number" id="chgDays" value="0" inputmode="numeric"></div>'
          + '<div class="field"><label>' + esc(t('أثرُه على النطاق')) + ' (' + esc(t('نقطة')) + ' ±)</label>'
          +   '<input type="number" id="chgScope" value="0" inputmode="numeric"></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف والمبرّر')) + '</label>'
          + '<textarea id="chgWhy" rows="3" placeholder="'
          + esc(t('ما التغيير؟ ولماذا؟ وما بديلُه إن رُفض؟')) + '"></textarea></div>',
          btn('📋 قدّم الطلب','btn-primary',' data-chgadd="1"'))

      + (CHANGES.length
        ? cardFlush('الطلبات',
            table(['#','النوع','الأثر','المبرّر','مُقدِّمه','الحالة',''],
              CHANGES.map(function(c, i){
                var q = [];
                if (+c.dCost)  q.push(nm(c.dCost) + ' ' + t('ريال'));
                if (+c.dDays)  q.push(nm(c.dDays) + ' ' + t('يوم'));
                if (+c.dScope) q.push(nm(c.dScope) + ' ' + t('نقطة'));
                return ['<span class="num">CR-' + nm(i+1) + '</span>', esc(c.kind),
                        esc(t(c.imp)) + (q.length ? '<br><span class="num hint" style="margin:0">' + esc(q.join(' · ')) + '</span>' : '')
                        + (c.applied ? '<br>' + pill('طُبِّق على خط الأساس', 'ok') : ''),
                        '<span class="hint" style="margin:0">' + esc(c.why.slice(0,60)) + '</span>',
                        esc(c.by),
                        pill(c.st, c.st==='معتمد'?'ok':(c.st==='مرفوض'?'off':'warn')),
                        c.st === 'مقدَّم'
                          ? '<div class="actions">'
                            + btn('اعتمد','btn-quiet btn-sm',' data-chgok="' + i + '"')
                            + btn('ارفض','btn-quiet btn-sm',' data-chgno="' + i + '"') + '</div>'
                          : ''];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا طلبات — وخطُّ الأساس على حاله.')) + '</p>'))

      + card('قاعدة الضبط',
          flow(['طلب','تقييم الأثر','قرار','تحديث خط الأساس'], 0)
          + '<p class="hint">' + esc(t('كلُّ طلبٍ معتمدٍ يُلزم بتجميد نسخةٍ جديدةٍ من خط الأساس — وإلا قِيس الأداءُ على مرجعٍ باطل.')) + '</p>');
  })();
    if (cur === 'pipe') return head + (function(){
    var taskInstallSite = Object.create(null);
    Object.keys(STATE.tasks).forEach(function(tid){
      var tk = STATE.tasks[tid];
      if (tk.kind === 'install') taskInstallSite[tk.site] = true;
    });
    var ready = 0, noSurvey = 0;
    STATE.sites.forEach(function(x){
      var r = STATE.recs[x.id];
      var ins = STATE.inss[x.id];
      var installed = !!(ins && ins.status === 'مُركّب' && ins.approved);
      if (svDone(r) && !installed) ready++;
      if (taskInstallSite[x.id] && !svDone(r)) noSurvey++;
    });
    var noAppr = Object.keys(STATE.inss).filter(function(id){
      var r = STATE.inss[id]; return r.status === 'مُركّب' && !r.approved;
    }).length;
    var conflicts = noSurvey + noAppr;

    return stats([['جاهز للجدولة', N(ready), 'ok'],
                  ['جُدول بلا مسح', N(noSurvey), noSurvey ? 'bad' : 'ok'],
                  ['رُكّب بلا اعتماد', N(noAppr), noAppr ? 'wrn' : 'ok'],
                  ['تعارضات', N(conflicts), conflicts ? 'bad' : 'ok']])
      + card('التسلسل السليم', flow(['مسح','اعتماد','جدولة','تركيب','تدقيق'], 0)
        + (conflicts
            ? alertBox('error', 'فيه ' + nm(conflicts) + ' ' + t('نقطةً خرجت عن التسلسل — راجع «التدقيق الهندسي» و«توزيع الفرق».'))
            : alertBox('success','لا تعارضاتٍ الآن — كلُّ نقطةٍ في مكانها من التسلسل.')));
  })();
    if (cur === 'setup') return head + (function(){
    /* كانت تاريخين مكتوبَين بيدٍ لا يُحفَظان، وزرُّ «حفظ» يقول «محفوظٌ
       بالفعل» وهو لم يحفظ شيئًا — فبقيت «الوتيرة والهدف» تقول «لم تُضبط
       المواعيد» للأبد. صار الموعدان يُقرآن ويُكتبان في CFG كسائر الإعدادات،
       وأزمنةُ التركيب تُضبط بالدقائق ويُحسَب الإجماليُّ من عدد النقاط الفعلي. */
    var S = siteStats();
    
    var mC = cfgGet('minCamp'), mR = cfgGet('minCor');
    var hrs = function(n, m){ return nm(Math.round(n * m / 60)); };
    /* ═══ صفٌّ لكلِّ نوعٍ في السجل (V17.14) ═══
       كان الجدولُ صفَّين: «مخيم» و«ممر» — والممرُّ يبتلع الكاميراتِ والمحطاتِ
       والبواباتِ والجسور، فتُحسَب أزمنةُ محطة القطار بزمن ممرٍّ. صار لكلِّ
       نوعٍ في السجل صفُّه: المخيمُ والممرُّ بمفتاحيهما القديمين، وسائرُ الأنواع
       بزمنٍ يُضبَط لكلٍّ منها ويرث زمنَ الممرِّ حتى يُضبَط. */
    var byType = {};
    STATE.sites.forEach(function(x){ var k = x.type || '—'; byType[k] = (byType[k] || 0) + 1; });
    var TYPES = Object.keys(byType).sort(function(a, b){ return byType[b] - byType[a]; });
    var minOf = function(k){
      if (k === 'مخيم') return +mC || 0;
      if (k === 'ممر') return +mR || 0;
      var v = cfgGet('minType', k); return (+v || +mR || 0);
    };
    var typeInput = function(k){
      if (k === 'مخيم') return cfgInput('minCamp');
      if (k === 'ممر') return cfgInput('minCor');
      return '<input type="number" inputmode="numeric" step="1" min="0" value="' + esc(minOf(k)) + '" data-mintype="' + esc(k) + '" style="width:90px">';
    };
    var totMin = TYPES.reduce(function(a, k){ return a + byType[k] * minOf(k); }, 0);
    return card('المواعيد المستهدفة',
      '<div class="grid cols-2">'
      + '<div class="field"><label>'+esc(t('موعد انتهاء المسح'))+'</label>' + cfgDate('dueSurvey') + '</div>'
      + '<div class="field"><label>'+esc(t('موعد انتهاء التركيب'))+'</label>' + cfgDate('dueInstall') + '</div>'
      + '</div>'
      + '<p class="hint">' + esc(t('يُحفَظ فورَ التغيير — وتقرؤه «نظرة عامة ← الوتيرة والهدف» لتقول كم يلزم يوميًّا.')) + '</p>',
      btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
    + card('أزمنة التركيب', table(['النوع','الزمن التقديري (دقيقة)','عدد النقاط','الإجمالي (ساعة)'],
        TYPES.map(function(k){ return [esc(t(k)), typeInput(k), N(byType[k]), '<span class="num">' + hrs(byType[k], minOf(k)) + '</span>']; }),
        ['الإجمالي', '', N(S.total), '<span class="num">' + nm(Math.round(totMin / 60)) + '</span>'])
      + '<p class="hint" style="margin:6px 0 0">' + esc(t('كلُّ نوعٍ بزمنه — وما لم يُضبَط يرث زمنَ الممرِّ حتى يُضبَط.')) + '</p>');
  })();
    if (cur === 'miles') return head + (function(){
    var tot = mileList().reduce(function(a,m){ return a + m.w; }, 0);
    var earned = mileList().reduce(function(a,m){ return a + m.w * mileDone(m); }, 0);
    var doneN = mileList().filter(function(m){ return mileDone(m) >= 0.999; }).length;
    var lateN = mileList().filter(mileLate).length;

    return stats([['المعالم', N(mileList().length)],
                  ['بلغت', N(doneN), doneN ? 'ok' : ''],
                  ['متأخّرة عن موعدها', N(lateN), lateN ? 'bad' : 'ok'],
                  ['الإنجاز الموزون', nm(Math.round(earned)) + '٪', 'acc'],
                  ['المتبقّي', nm(Math.round(tot - earned)) + '٪']])

      + card('', meter('الإنجاز الموزون بالمعالم', earned, tot))

      + cardFlush('المعالم',
          /* الوزنُ والتبعيةُ تخطيطٌ داخليّ: يراهما من يضبط الخطة وحدَه.
             سبعةُ أعمدةٍ على هاتف الوزارة تُقرأ بالتمرير الأفقيّ ولا تُقرأ. */
          (function(){
            var full = may('settings');
            var head = full ? ['#','المعلَم','الوزن ٪','يعتمد على','الموعد المستهدف','الإنجاز','الحالة']
                            : ['المعلَم','الموعد المستهدف','الإنجاز','الحالة'];
            var rows = mileList().map(function(m){
              var p = mileDone(m), dt = mileDateOf(m), late = mileLate(m);
              var manual = mileDates().some(function(x){ return x.id === m.id && x.d; });
              var nameCell = '<strong>' + esc(t(m.n)) + '</strong>'
                + (full ? '' : '<br><span class="hint num" style="margin:0">' + esc(m.id) + '</span>');
              var dateCell = full
                ? '<input type="date" value="' + esc(dt) + '" data-mld="' + esc(m.id) + '" style="width:150px">'
                  + (dt && !manual ? '<div class="hint" style="margin:2px 0 0">' + esc(t('مشتقٌّ من المواعيد')) + '</div>' : '')
                : (dt ? '<span class="num">' + esc(dt) + '</span>' : '—');
              var stCell = late ? pill('متأخّر', 'off')
                : pill(p >= 0.999 ? 'بلغ' : (p > 0 ? 'جارٍ' : 'لم يبدأ'),
                       p >= 0.999 ? 'ok' : (p > 0 ? 'warn' : ''));
              var pc = nm(Math.round(p * 100)) + '٪';
              if (full && MILE_EDIT === m.id){
                var o = mileOv(m.id);
                nameCell = '<input value="' + esc(m.n) + '" data-mle="n" dir="auto" style="min-width:180px">';
                return ['<span class="num">' + esc(m.id) + '</span>', nameCell,
                        '<input type="number" min="0" max="100" value="' + esc(m.w) + '" data-mle="w" style="width:70px">',
                        '<input value="' + esc(m.dep || '') + '" data-mle="dep" placeholder="M1" style="width:80px">',
                        dateCell,
                        '<input type="number" min="0" max="100" value="' + esc(o.prog != null ? o.prog : Math.round(p * 100)) + '" data-mle="prog" style="width:70px">',
                        btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-mlsave="' + esc(m.id) + '"') + ' '
                        + btn(t('إلغاء'),'btn-quiet btn-sm',' data-mlcancel="1"')];
              }
              return full
                ? ['<span class="num">' + esc(m.id) + '</span>', nameCell, N(m.w),
                   m.dep ? '<span class="num">' + esc(m.dep) + '</span>' : '—', dateCell, pc,
                   stCell + ' ' + btn('\u270E','btn-quiet btn-sm',' data-mledit="' + esc(m.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                   + btn('\u{1F5D1}','btn-quiet btn-sm',' data-mldel="' + esc(m.id) + '" aria-label="' + esc(t('حذف')) + '"')]
                : [nameCell, dateCell, pc, stCell];
            });
            var foot = full ? ['','<b>' + t('الإجمالي') + '</b>', N(tot), '', '', '<b>' + nm(Math.round(earned)) + '٪</b>', '']
                            : ['<b>' + t('الإجمالي') + '</b>', '', '<b>' + nm(Math.round(earned)) + '٪</b>', ''];
            return table(head, rows, foot);
          })(),
          btn('⬇ إكسل — المعالم','btn-secondary btn-sm',' data-xls="miles"')
          + (may('settings') ? ' ' + btn('\u2795 ' + t('معلَم جديد'),'btn-primary btn-sm',' data-mlnew="1"') : ''))
      + (may('settings') && MILE_NEW
          ? card(t('معلَم جديد'),
              '<div class="grid cols-2">'
              + '<div class="field"><label>' + esc(t('المعلَم')) + '</label><input id="mlnN" dir="auto"></div>'
              + '<div class="field"><label>' + esc(t('الوزن ٪')) + '</label><input id="mlnW" type="number" min="0" max="100" value="5"></div>'
              + '<div class="field"><label>' + esc(t('الموعد المستهدف')) + '</label><input id="mlnD" type="date"></div>'
              + '<div class="field"><label>' + esc(t('يعتمد على')) + '</label><input id="mlnDep" placeholder="M6"></div>'
              + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-mlnsave="1"') + btn(t('إلغاء'),'btn-quiet btn-sm',' data-mlncancel="1"') + '</div>'
              + '<p class="hint" style="margin:8px 0 0">' + esc(t('إنجازُ المعلَم الجديد يُكتب باليد (٪) من زرِّ التعديل — والمعالمُ المضمَّنةُ تُحسَب من الميدان ما لم يُكتب لها إنجازٌ يدويّ.')) + '</p>')
          : '')

      + card('المسار المتتابع',
          flow(mileList().map(function(m){ return m.id; }),
               Math.max(0, doneN - 1))
          + '<p class="hint">' + esc(t('كلُّ معلَمٍ يعتمد على سابقه — فتأخّرُ واحدٍ يزيح ما بعده. والأوزانُ مجموعُها مئة.')) + '</p>');
  })();
    return head + (function(){
    if (!BASE){
      return alertBox('warn','لم يُجمَّد خطُّ أساسٍ بعد — ولا تُقاس القيمةُ المكتسبةُ بلا مرجعٍ يُقاس عليه.')
        + card('تجميد خط الأساس',
            '<p class="hint" style="margin:0 0 12px">'
            + esc(t('يُثبِّت النطاقَ والميزانيةَ والتارجتات في لحظةٍ واحدة، فيصير مرجعًا لا يتغيّر إلا بطلب تغييرٍ معتمد. وعليه تُحسب SPI و CPI.'))
            + '</p>'
            + table(['ما سيُجمَّد','القيمة الآن'], [
                ['النطاق', N(siteStats().total) + ' ' + t('نقطة')],
                ['المدّة', N(PLAN_MONTHS || 4) + ' ' + t('شهر')],
                ['الميزانية', cfgGet('budCap') ? N(cfgGet('budCap')) : '—'],
                ['سعر النقطة', cfgGet('ph') ? N(cfgGet('ph')) : '—'],
                ['تارجت المسح', N(cfgGet('tgtSurvey'))]
              ]),
            may('settings') ? btn('🔒 جمّد خط الأساس','btn-primary',' data-baseset="1"') : '');
    }

    var v = evm(), V = evmVerdict(v);
    var d = new Date(BASE.at);

    return stats([['SPI — أداء الجدول', nm(v.SPI), v.SPI>=0.95?'ok':(v.SPI<0.9?'bad':'wrn')],
                  ['CPI — أداء الكلفة', nm(v.CPI), v.CPI>=0.95?'ok':(v.CPI<0.9?'bad':'wrn')],
                  ['نسبة الإنجاز', nm(v.BAC ? Math.round(v.EV/v.BAC*100) : 0) + '٪', 'acc'],
                  ['الحكم', t(V.t), V.c]])

      /* من قرأ CPI مقرَّبًا ثم قسم عليه الميزانيةَ خالف EAC المعروض — فيُقال صراحةً */
      + '<p class="hint" style="margin:-6px 0 14px">'
      + esc(t('المؤشراتُ معروضةٌ بمنزلتين، والتقديراتُ (EAC وETC وVAC) محسوبةٌ بالدقة الكاملة — فقد يختلف حسابُك اليدويُّ عنها بريالات.'))
      + '</p>'
      + card('خط الأساس — النسخة ' + nm(BASE.ver),
          table(['البند','خط الأساس','الآن','الفرق'], [
            ['النطاق', N(BASE.scope), N(siteStats().total),
             N(siteStats().total - BASE.scope)],
            ['الميزانية BAC', N(BASE.bac), N(v.EAC),
             '<span class="' + (v.VAC < 0 ? 'req' : '') + '">' + nm(v.VAC) + '</span>'],
            ['سعر النقطة', N(BASE.ph), N(cfgGet('ph')), N(cfgGet('ph') - BASE.ph)],
            ['المدّة (يوم)', N(v.days.total), N(v.days.elapsed),
             N(v.days.total - v.days.elapsed)]
          ]),
          '<span class="hint" style="margin:0">' + esc(t('جُمّد'))
          + ' <span class="num">' + fmtDate(d) + '</span> — ' + esc(BASE.by) + '</span>')

      + cardFlush('القيمة المكتسبة',
          table(['المؤشّر','الرمز','القيمة','ما يعنيه'], [
            ['المخطَّط حتى اليوم','PV', N(v.PV), 'ما كان ينبغي إنجازُه بحسب الجدول'],
            ['المكتسَب فعلًا','EV', N(v.EV), 'قيمةُ ما أُنجز واعتُمد'],
            ['المنصرف الفعلي','AC', N(v.AC), 'ما دُفع: مستحقُّ الفنيين والمشتريات'],
            ['فرق الجدول','SV', '<span class="' + (v.SV<0?'req':'') + '">' + nm(v.SV) + '</span>',
             v.SV >= 0 ? 'متقدّمٌ على الجدول' : 'متأخّرٌ عنه'],
            ['فرق الكلفة','CV', '<span class="' + (v.CV<0?'req':'') + '">' + nm(v.CV) + '</span>',
             v.CV >= 0 ? 'دون الميزانية' : 'فوقها'],
            ['المتوقَّع عند الإتمام','EAC', N(v.EAC), 'كلفةُ المشروع كاملًا بهذه الوتيرة'],
            ['المتبقّي','ETC', N(v.ETC), 'ما سيُنفَق حتى الإتمام'],
            ['فرق الإتمام','VAC', '<span class="' + (v.VAC<0?'req':'') + '">' + nm(v.VAC) + '</span>',
             v.VAC >= 0 ? 'سيوفَّر' : 'سيُتجاوَز'],
            ['كفاءة ما بقي','TCPI', nm(v.TCPI),
             v.TCPI > 1.1 ? 'يلزم أداءٌ أعلى مما مضى' : 'الوتيرةُ الحالية تكفي']
          ]),
          btn('⬇ إكسل — القيمة المكتسبة','btn-secondary btn-sm',' data-xls="evm"'))

      + card('التقدّم',
          meter('المكتسَب من الميزانية الكلية', v.EV, v.BAC)
          + meter('المنصرف من الميزانية الكلية', v.AC, v.BAC)
          + meter('الزمن المنقضي من المدّة', v.days.elapsed, v.days.total))

      + card('', '<div class="actions">'
          + btn('🔒 جمّد نسخةً جديدة','btn-secondary',' data-baseset="1"')
          + btn('📋 طلب تغيير','btn-primary',' data-p="chg"')
          + '</div>'
          + '<p class="hint">' + esc(t('لا يُعدَّل خطُّ الأساس إلا بطلب تغييرٍ معتمد — وكلُّ تجميدٍ يُحفَظ بنسخته وتاريخه ومن جمّده.')) + '</p>');
  })();
  }};

/* ── سجل المخاطر: احتمال × أثر ── */

