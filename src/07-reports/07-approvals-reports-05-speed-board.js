/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-05-speed-board.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Speed board per device and per page (presence heartbeat: version, pending queue, photos).
   DEFINES : speedCell, speedRows, speedCard, devActCard, perfCard
   GLOBALS : SPEED_PAGES
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V37.34) البندُ ٤ — لوحةُ السرعة لكلِّ جهازٍ ولكلِّ صفحة ═══
   من قياسات الأجهزة نفسِها (نبضتُها اليومية): زمنُ رسم كلِّ صفحةٍ (الربعُ الأعلى)، واستجابةُ اللمس، وزمنُ الفتح — لكلِّ جهازٍ صفّ،
   ولكلِّ صفحةٍ رئيسيةٍ عمود؛ أخضرُ دون ٠٫٣ ثانية (الهدف)، وأصفرُ دون ثانية، وأحمرُ فوقها. فيُعرَف الجهازُ البطيءُ والصفحةُ البطيئةُ قبل الشكوى. */
PV.SPEED_PAGES = [['map', 'الخريطة'], ['mfu', 'المتابعة'], ['forms', 'النموذج'], ['survey', 'المسح'], ['mywork', 'شغلي'], ['sites', 'المواقع']];
function speedCell(v){ if (v == null) return '<span class="hint" style="margin:0">\u2014</span>'; var c = v < 300 ? 'ok' : v < 1000 ? 'wrn' : 'bad'; return pill(nm(Math.round(v / 10) / 100) + t('ث'), c); }
function speedRows(){
  var P = STATE.presence || {}, now = Date.now();
  return Object.keys(P).map(function(k){ return P[k] || {}; }).filter(function(x){ return x && x.name && x.pf && x.pf.pages && now - (+x.at || 0) < 7 * 864e5; }).map(function(x){
    var pg = x.pf.pages || {}, worst = 0;
    var cells = PV.SPEED_PAGES.map(function(p){ var v = pg[p[0]] && pg[p[0]].p75; if (v != null && v > worst) worst = v; return v == null ? null : +v; });
    return { name:x.name, model:(typeof uaModel === 'function' ? uaModel(x.ua) : ''), ver:x.ver || '', cells:cells, inp:x.pf.inp && x.pf.inp.p75, open:x.pf.open, worst:worst };
  }).sort(function(a, b){ return b.worst - a.worst; });
}
function speedCard(){
  if (!(may('users') || may('exportAll'))) return '';
  var R = speedRows(); if (!R.length) return '';
  var slow = R.filter(function(r){ return r.worst >= 1000; }).length, ok = R.filter(function(r){ return r.worst < 300; }).length;
  return card('سرعة الصفحات لكل جهاز',
    '<p class="hint" style="margin-top:0">' + esc(t('زمن رسم كل صفحة على كل جهاز (من قياس الجهاز نفسه، آخر ٧ أيام). الهدف أقل من ٠٫٣ ثانية.')) + ' '
    + '<b>' + nm(ok) + '</b> ' + esc(t('جهاز داخل الهدف')) + ' \u00b7 <b>' + nm(slow) + '</b> ' + esc(t('جهاز فيه صفحة أبطأ من ثانية')) + '</p>'
    + '<div style="overflow-x:auto">' + table(['الجهاز'].concat(PV.SPEED_PAGES.map(function(p){ return p[1]; })).concat(['اللمس', 'الفتح']),
      R.map(function(r){ return [esc(r.name) + '<div class="hint" style="margin:0">' + esc(r.model) + ' \u00b7 ' + esc(r.ver) + '</div>'].concat(r.cells.map(speedCell)).concat([speedCell(r.inp), speedCell(r.open)]); })) + '</div>');
}
function devActCard(){
  if (!(may('users') || may('exportAll'))) return '';
  try { presenceFetch(false); } catch (e){ LS_ERR = e; }
  var R = devActRows();
  return card('أجهزة تحتاج إجراء', R.length
    ? '<p class="hint" style="margin-top:0">' + esc(t('من نبضات الأجهزة في آخر ٧ أيام — اطلب من صاحب كل جهاز الإجراء المكتوب أمامه.')) + '</p>'
      + table(['الجهاز', 'المشكلة', 'المطلوب منه', 'آخر ظهور'], R.map(function(r){ return [esc(r.name) + ' <span class="hint" style="margin:0">' + esc(t(r.role)) + '</span>', esc(r.iss.join(' · ')), '<b>' + esc(r.act.join('، ') || t('متابعة')) + '</b>', '<span class="num">' + esc(r.at ? fmtTime(r.at) : '') + '</span>']; }))
    : alertBox('ok', 'كلُّ الأجهزة النشطة سليمة: على آخر نسخة، ولا شيءَ واقف.'));
}
function perfCard(){
  if (!(may('users') || may('exportAll'))) return '';
  var R = perfRows(); if (!R.length) return '';
  var band = function(v, good, poor){ return v == null ? pill('\u2014', '') : pill(String(v), v <= good ? 'ok' : v <= poor ? 'wrn' : 'bad'); };
  var lcp = p75(R.map(function(r){ return r.pf.lcp && r.pf.lcp.p75; }).filter(function(x){ return x != null; }));
  var inp = p75(R.map(function(r){ return r.pf.inp && r.pf.inp.p75; }).filter(function(x){ return x != null; }));
  var cls = p75(R.map(function(r){ return r.pf.cls; }).filter(function(x){ return x != null; }));
  var devs = R.filter(function(r){ return r.pf.inp && r.pf.inp.p75 != null; }).sort(function(a, b){ return b.pf.inp.p75 - a.pf.inp.p75; }).slice(0, 5);
  var pages = {}; R.forEach(function(r){ Object.keys(r.pf.pages || {}).forEach(function(k){ var v = r.pf.pages[k]; if (v && v.p75 != null){ pages[k] = pages[k] || []; pages[k].push(v.p75); } }); });
  var pg = Object.keys(pages).map(function(k){ return [k, p75(pages[k])]; }).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  return card('أداءُ الميدان — ما يشعر به الفني',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap"><span>LCP p75: ' + band(lcp == null ? null : Math.round(lcp / 100) / 10, 2.5, 4) + ' ' + esc(t('ث')) + '</span>'
    + '<span>INP p75: ' + band(inp, 200, 500) + ' ' + esc(t('م.ث')) + '</span><span>CLS p75: ' + band(cls, 0.1, 0.25) + '</span>'
    + '<span class="hint" style="margin:0">' + nm(R.length) + ' ' + esc(t('جهازًا أرسل قياسًا اليوم')) + '</span></div>'
    + (devs.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الأجهزة')) + '</th><th>INP p75</th><th>' + esc(t('فتح←خريطة')) + '</th><th>' + esc(t('مهامّ طويلة')) + '</th></tr></thead><tbody>'
        + devs.map(function(r){ return '<tr><td>' + esc(r.model) + ' <span class="hint" style="margin:0">' + esc(r.ver || '') + '</span></td><td class="num">' + nm(r.pf.inp.p75) + '</td><td class="num">' + (r.pf.open != null ? nm(r.pf.open) : '\u2014') + '</td><td class="num">' + (r.pf.lt != null ? nm(r.pf.lt) : '\u2014') + '</td></tr>'; }).join('') + '</tbody></table>' : '')
    + (pg.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الصفحات')) + '</th><th>' + esc(t('رسمٌ p75 (م.ث)')) + '</th></tr></thead><tbody>'
        + pg.map(function(x){ return '<tr><td>' + esc(PAGE[x[0]] ? t(PAGE[x[0]].t) : x[0]) + '</td><td class="num">' + nm(x[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : ''));
}
PAGE.sys = { m:'النظام', t:'صحة النظام',
  l:'سلامةُ البيانات ومزامنتُها ونسخُ الأجهزة وعمرُها وتصفيرُها — صيانةُ النظام كلُّها.',
  body:function(){
    var head = tabHead('sys'), cur = tabCur('sys');
    if (cur === 'hb') return head + (function(){
    /* الأربعةُ كانت أصفارًا مكتوبةً بيدٍ مهما نبضت الأجهزة — تُعَدُّ من النبضات:
       الوثيقةُ التي فيها `st` نبضةٌ، والتي فيها `from/to` انتقالٌ (hbev) */
    var HB = STATE.hb || {}, hbk = Object.keys(HB);
    var beats = hbk.filter(function(k){ return HB[k] && HB[k].st; });
    var up = beats.filter(function(k){ return HB[k].st === 'up'; }).length, down = beats.length - up;
    var gap = beats.filter(function(k){
      var h = HB[k]; return h.st === 'down' && h.since && Date.now() - Date.parse(h.since) >= 10 * 60000;
    }).length;
    var day0 = dayKey();
    var flap = hbk.filter(function(k){
      var h = HB[k]; return h && h.from && h.to && dayKey(Date.parse(h.ts) || 0) === day0;   /* (V26.2) يومُ مكة لا نصُّ التاريخ العالمي */
    }).length;
    return (may('settings') ? readyCard() : '')
      + contCard()   /* (V38.8) ما يعتمد على شخص */
      + bkCard()
      + (beats.length ? '' : alertBox('error','لم تصل أي إشارة بعد — شغّل أداة الفحص على جهاز المكتب المتصل بشبكة الميدان.'))
      + stats([['متصل', N(up), 'ok'], ['غير متصل', N(down), down ? 'bad' : ''],
               ['فاصل ≥١٠ دقائق', N(gap), gap ? 'wrn' : ''], ['متذبذب اليوم', N(flap)]])
      + card('اصطلاح العناوين', table(['الجهاز','آخر خانة','مثال'], [
          ['راوتر','<span class="num">.1</span>','<span class="num">10.20.30.1</span>'],
          ['قارئ','<span class="num">.2</span>','<span class="num">10.20.30.2</span>'],
          ['كاميرا','<span class="num">.3</span>','<span class="num">10.20.30.3</span>']
        ]));
  })();
    if (cur === 'probe') return head + (function(){
    var withIp = STATE.sites.filter(function(s){ return probeIp(s); }).length;
    var el = PV.PROBE.t ? Math.round((Date.now() - PV.PROBE.t) / 1000) : 0;
    return alertBox('info','المتصفّح لا يملك ping — تُطلَب صفحةُ الجهاز ويُقاس ردُّه. والردُّ بخطأٍ دليلُ حياةٍ أيضًا: المنفذُ موجود. الصمتُ وحده موت.')
      + stats([['عناوين مسجّلة', N(withIp), withIp?'':'wrn'],
               ['فُحص', N(PV.PROBE.done)],
               ['حيّ', N(PV.PROBE.up), 'ok'],
               ['صامت', N(PV.PROBE.down), PV.PROBE.down?'bad':'']])
      + card('التشغيل',
          (withIp
            ? '<div class="actions">'
              + btn(PV.PROBE.on ? '⏸ ' + t('أوقف') : '▶ ' + t('ابدأ الفحص'),
                    PV.PROBE.on ? 'btn-danger' : 'btn-primary', ' data-probe="1"')
              + (PV.PROBE.on ? '<span class="hint" style="margin:0">'
                  + nm(PV.PROBE.done) + ' / ' + nm(withIp) + ' · ' + nm(el) + ' ث</span>' : '')
              + '</div>'
              + (PV.PROBE.on ? meter('التقدم', PV.PROBE.done, withIp) : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا عناوين بعد — تُشتقّ من بادئة الشبكة التي تُدخَل عند التركيب.')) + '</p>'))
      + (PV.PROBE.log.length
        ? cardFlush('آخر ما فُحص',
            table(['النقطة','العنوان','الحالة'],
              PV.PROBE.log.slice(0, 24).map(function(r){
                return ['<span class="num">' + esc(r.id) + '</span>',
                        '<span class="num" dir="ltr">' + esc(r.ip) + '</span>',
                        pill(r.alive ? 'حيّ' : 'صامت', r.alive ? 'ok' : 'off')];
              })))
        : '')
      + card('اصطلاح العناوين',
          table(['الجهاز','آخر خانة','مثال'], [
            ['راوتر','<span class="num">.1</span>','<span class="num" dir="ltr">10.20.30.1</span>'],
            ['قارئ','<span class="num">.2</span>','<span class="num" dir="ltr">10.20.30.2</span>'],
            ['كاميرا','<span class="num">.3</span>','<span class="num" dir="ltr">10.20.30.3</span>']
          ])
          + '<p class="hint">' + esc(t('تُشتقّ كلها من بادئةٍ واحدةٍ تُكتب مرةً عند التركيب.')) + '</p>');
  })();
    if (cur === 'drive') return head + (function(){
    drvCfg();
    var n = STATE.sites.length;
    var est = Math.round(n * 4 * 180 / 1024);   /* أربعُ صورٍ للنقطة بمئةٍ وثمانين كيلو */
    return (PV.PHOTO_FAIL.length
        ? alertBox('warn','صورٌ تعذّر رفعُها بعد خمس محاولات — لم تُفقَد، وهي على هذا الجهاز.')
          + card('بانتظار إعادة المحاولة',
              '<div class="pop-rows" style="margin:0">'
              + PV.PHOTO_FAIL.slice(0, 12).map(function(x){
                  return '<div><span class="k">' + esc(x.site) + ' · ' + esc(t(x.kind)) + '</span>'
                    + '<span>' + esc(x.why || t('سببٌ غير معروف')) + '</span></div>';
                }).join('') + '</div>',
              btn('أعد المحاولة','btn-primary btn-sm',' data-pretry="1"'))
        : '')
      + stats([['في الطابور', N(PHOTO_Q.length), PHOTO_Q.length?'wrn':'ok'],
                  ['تعذّر رفعُها', N(PV.PHOTO_FAIL.length), PV.PHOTO_FAIL.length?'wrn':'ok'],
                  ['رُفعت', N(Object.keys(STATE.photos || {}).length), 'ok'],
                  ['المتوقَّع للمشروع', N(est) + ' ' + t('ميجا')],
                  ['الإذن', PV.DRV.ready ? t('ممنوح') : t('لم يُطلَب'), PV.DRV.ready?'ok':'wrn']])

      + (drvCfg()
        ? alertBox('success','درايفك موصولٌ — الصورُ تُرفَع إليه ويُحفَظ رابطُها في السجل.')
        : alertBox('warn','لم يُوصَل درايفك بعد — الصورُ تُحفَظ على الجهاز وتنتظر.'))

      + card('الوصل',
          '<div class="field"><label>Client ID</label>'
          + '<input id="drvClient" dir="ltr" placeholder="xxxxx.apps.googleusercontent.com" value="'
          +   esc(PV.DRV.clientId) + '"></div>'
          + '<div class="field"><label>' + esc(t('معرّف مجلّد المشروع')) + ' — ' + esc(t('اختياري')) + '</label>'
          + '<input id="drvFolder" dir="ltr" placeholder="1AbC…" value="' + esc(PV.DRV.folderId) + '"></div>'
          + '<p class="hint">' + esc(t('المعرّفُ من رابط المجلّد في درايفك — ما بعد ‎/folders/‎. وإن تُرك فارغًا رُفعت في الجذر.')) + '</p>',
          '<div class="actions">'
          + btn('احفظ','btn-primary btn-sm',' data-drvsave="1"')
          + btn('اختبر الإذن','btn-secondary btn-sm',' data-drvtest="1"')
          + '</div>')

      + card('كيف يُنشَأ Client ID',
          table(['#','الخطوة'], [
            ['١','افتح console.cloud.google.com وأنشئ مشروعًا أو اختر قائمًا'],
            ['٢','فعّل Google Drive API من مكتبة الواجهات'],
            ['٣','في «بيانات الاعتماد» أنشئ OAuth client ID من نوع تطبيق ويب'],
            ['٤','أضف ' + location.host + ' إلى Authorized JavaScript origins'],   /* (V38.29) الدومينُ الحاليّ */
            ['٥','انسخ المعرّفَ والصقه أعلاه'],
            ['٦','أنشئ مجلّدًا في درايفك للمشروع وانسخ معرّفه من رابطه']
          ])
          + '<p class="hint">' + esc(t('النطاقُ المطلوبُ drive.file — لا يرى إلا ما يرفعه التطبيق، لا بقيةَ درايفك.')) + '</p>')

      + card('لماذا لا تُحفَظ في قاعدة البيانات',
          '<p class="hint" style="margin:0">'
          + esc(t('وثيقةُ Firestore لا تتجاوز ميغابايتًا، وصورةٌ واحدةٌ تقاربه. ولو حُفظت هناك لامتلأت الحصّةُ في أيام. أما درايفك فخمسةُ تيرا — تكفي المشروعَ مرارًا. ويبقى في السجل معرّفُ الملف ورابطُه فيُفتَح بضغطة.'))
          + '</p>');
  })();
    if (cur === 'bugs') return head + bugsPageHtml();
    if (cur === 'sys') return head + localStoreCard() + sysReportCard() + (function(){
    /* ═══ فحوصٌ حقيقيةٌ لا أصفارٌ مكتوبة ═══
       كانت الشاشةُ أربعةَ أصفارٍ بيدٍ — تقول «سليم» ولو كانت القاعدةُ مليئةً
       بالتناقض. صارت كلُّ خانةٍ تُحسَب من البيانات لحظةَ الفتح، وكلُّ رقمٍ فوق
       الصفر يُضغَط فيفتح ما فيه. ما يسوء يُرى هنا قبل أن تراه الوزارة. */
    var R = STATE.recs || {}, I = STATE.inss || {}, T = STATE.tasks || {}, U = STATE.users || {};
    var names = {}; Object.keys(U).forEach(function(k){ if (U[k] && U[k].name) names[U[k].name] = 1; });
    techsList(true).forEach(function(x){ names[x.n] = 1; });
    var q = {};
    q.insNoSol = Object.keys(I).filter(function(id){ var r = I[id]; var so = solutionOf(id); return r && r.status === 'مُركّب' && !(so && so.status === 'معتمد'); });
    q.schedNoSv = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.kind === 'install' && x.status !== 'مُنجز' && x.status !== 'معتمد' && !svDone(R[x.site]); });
    q.negStock = stockBalance().filter(function(b){ return b.store < 0 || b.custody < 0; });
    q.buyNoSup = buysList().filter(function(b){ return !b.sup && !b.vendor; });
    q.noCoord = (STATE.sites || []).filter(function(x){ return !(+x.lat) || !(+x.lng); });
    var comp = coCompounds(); q.compound = Object.keys(comp);
    q.svNoPhoto = Object.keys(R).filter(function(id){ return svDone(R[id]) && !photoCount(id); });
    q.taskGhost = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.to && x.status !== 'مُنجز' && x.status !== 'معتمد' && !names[x.to]; });
    q.dupUsers = usrDupes();
    q.poison = STATE.poison || [];
    q.oldRevisit = Object.keys(R).filter(function(id){ var r = R[id]; return r && r.review === 'revisit' && (Date.now() - (r.revisitAt || r.at || 0)) > 3 * 86400000; });
    var rowOf = function(lab, arr, sev, go, hint){
      var n = arr.length;
      return [esc(t(lab)) + (hint ? '<br><span class="hint" style="margin:0">' + esc(t(hint)) + '</span>' : ''),
              n ? pill(nm(n), sev || 'bad') : pill(nm(0), 'ok'),
              n && go ? btn(t('افتح'),'btn-quiet btn-sm',' data-p="' + esc(go) + '"') : ''];
    };
    var bad = q.insNoSol.length + q.schedNoSv.length + q.negStock.length + q.noCoord.length + q.taskGhost.length + q.dupUsers.length + q.poison.length;
    return (bad ? alertBox('warn', nm(bad) + ' ' + t('ملاحظةً تحتاج نظرًا — الأرقامُ أدناه حيّةٌ لحظةَ الفتح'))
                : alertBox('ok', t('لا تناقضَ في البيانات — كلُّ الفحوص صفر')))
      + cardFlush('فحوص التناقض', table(['الفحص','النتيجة',''], [
          rowOf('نقاط مُركّبة بلا حلٍّ معتمد', q.insNoSol, 'bad', 'qa', 'رُكّبت والحلُّ لم يُعتمَد — لا يُقفَل إقفالٌ ولا يُحسَب استلامٌ'),
          rowOf('تركيبات مُسندة لنقاطٍ لم يتم الوصول إليها', q.schedNoSv, 'bad', 'req', 'إسنادُ تركيبٍ قبل المسح — الفنيُّ سيصل بلا حلّ'),
          rowOf('أصناف برصيد سالب', q.negStock, 'bad', 'inv', 'صرفٌ أكثرُ من التوريد — سجلٌّ ناقص'),
          rowOf('مشتريات بلا مورّد', q.buyNoSup, 'wrn', 'inv'),
          rowOf('مهام مُسندة لاسمٍ لا حسابَ له', q.taskGhost, 'bad', 'req', 'كُتب الاسمُ ولم يُطابق حسابًا — لا يصله شيء'),
          rowOf('حسابات مكرَّرة', q.dupUsers, 'bad', 'users'),
          rowOf('وثائق معزولة عن الرفع على هذا الجهاز', q.poison, 'bad', 'sync')
        ]))
      + cardFlush('جودة البيانات', table(['الفحص','النتيجة',''], [
          rowOf('مواقع بلا إحداثيات', q.noCoord, 'wrn', 'sites', 'لا تظهر على الخريطة ولا تُسنَد'),
          rowOf('أسماء شركات مركَّبة (تحمل أكثر من شركة)', q.compound, 'wrn', 'co', 'لا تُحسَب نقاطُها لشركةٍ — توحَّد من شاشة الشركات'),
          rowOf('زيارات تمّت بلا صورة', q.svNoPhoto, 'wrn', 'survey', 'المعتمِدُ لا يرى ما رآه المشرف'),
          rowOf('مردودة لزيارةٍ أخرى منذ أكثر من ٣ أيام', q.oldRevisit, 'wrn', 'svappr', 'رُدّت ولم تُزَر ثانيةً')
        ]));
  })();
    if (cur === 'sync') return head + (function(){
    /* كانت أربعةَ أصفارٍ مكتوبةً بيدٍ — والحارسُ لم يمسكها لأن جسمَ الصفحة
       التي بعدها كان يمدّها بمصدرٍ حيٍّ صدفةً. كُشفت حين حُذفت تلك الصفحة. */
    var Q = STATE.queue || [], PZ = STATE.poison || [];
    /* ═══ ما يكلّف يُرى قبل الفاتورة (V17.8) ═══
       القراءةُ من القاعدة تُحسَب على المشروع مالًا ووقتًا، ولا تظهر إلا في
       فاتورةٍ آخرَ الشهر. فيُعرَض هنا: كم قرأ هذا الجهازُ منذ فتحِ التطبيق،
       وتقديرُ ما يعنيه لو صار كلَّ يوم — ليُعرَف التسرّبُ يومَه لا بعد شهر. */
    var rdN = (typeof FB === 'object' && FB.readCount) || 0;
    var upMin = Math.max(1, Math.round((Date.now() - (PV.BOOT_AT || Date.now())) / 60000));
    var perDay = Math.round(rdN / upMin * 60 * 8);      /* ثماني ساعاتِ عمل */
    var FREE = 50000;
    /* «Missing or insufficient permissions» بلا هويةٍ لا يُشخَّص: من يكتب؟
       وبأيِّ دورٍ في وثيقته؟ وهل هو فعّال؟ وهل وثيقتُه باسم uid أصلًا؟ */
    var me = STATE.meta || {}, uid0 = myUid();
    var myDoc = (STATE.users || {})[uid0] || null;
    if (uid0 && MYDOC.has === null) myDocFetch(false);
    var rdCard = card(t('قراءاتُ هذه الجلسة'),
      stats([['قُرئت الآن', N(rdN), rdN > 5000 ? 'wrn' : 'ok'],
             ['منذ الفتح', esc(nm(upMin) + ' ' + t('دقيقة'))],
             ['تقديرٌ ليومِ عملٍ كامل', N(perDay), perDay > FREE / 3 ? 'wrn' : 'ok'],
             ['الحصةُ المجانية', esc(nm(FREE) + ' / ' + t('يوم'))]])
      + '<p class="hint" style="margin:6px 0 0">'
      + esc(t('التقديرُ لهذا الجهاز وحدَه في ثماني ساعات. اضربه في عدد الأجهزة لتقدّر يومَ المشروع — والحصةُ المجانية خمسون ألفًا لكلِّ المشروع في اليوم.')) + '</p>');
    var idRows = [
      ['uid', uid0 ? '<span class="num" dir="ltr">' + esc(uid0) + '</span>' : pill('غير مسجَّل الدخول','off')],
      ['الاسم', esc(me.name || '—')],
      ['الدورُ في التطبيق', esc(t((ROLES[ROLE] || {}).n || ROLE))],
      ['وثيقةُ الحساب users/{uid}',
        myDoc ? pill('موجودة','ok')
              : (MYDOC.has === false ? pill('غيرُ موجودة — هذا سببُ الرفض','off')
                 : (MYDOC.err === 'offline' ? pill('بلا شبكة — تُقرأ عند الاتصال','warn')
                                            : pill('تُقرأ…','warn')))],
      ['دورُها', myDoc ? esc(t((ROLES[myDoc.role] || {}).n || myDoc.role || '—')) : '—'],
      ['active', myDoc ? (myDoc.active === false ? pill('false — معطَّل','off') : pill(myDoc.active === true ? 'true' : 'غير مكتوب (يُعدُّ فعّالًا)', myDoc.active === true ? 'ok' : 'warn')) : '—']
    ];
    var errs = SOFT_ERRS.filter(function(e){ return /رفع|sync|push/i.test(e.where || '') || /رفع/.test(e.msg || ''); });
    var day = dayKey();
    var today = SOFT_ERRS.filter(function(e){ return dayKey(e.at) === day; }).length;
    return rdCard + card('\u{1FAAA} ' + t('بأيِّ هويةٍ يكتب هذا الجهاز'),
        table(['','' ], idRows.map(function(r){ return [esc(t(r[0])), r[1]]; }))
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('«Missing or insufficient permissions» معناه أن القاعدةَ لا تعرف هذا الحساب: وثيقتُه ليست باسم uid، أو دورُها ليس من الأدوار، أو active مكتوبةٌ false.')) + '</p>'
        + (uid0 && MYDOC.has === false
          ? alertBox('error', 'لا وثيقةَ لحسابك باسم معرِّفه — فكلُّ ما تكتبه يُرفَض. أنشئها الآن (فنيًّا) ليُرفَع عملُك، ثم اطلب من المكتب ترقيةَ دورك.')
            + '<div class="actions">' + btn('\u{1F527} ' + t('أنشئ وثيقة حسابي'),'btn-primary btn-sm',' data-mydocfix="1"') + '</div>'
          : '<div class="actions" style="margin-top:8px">'
            + btn('\u21BB ' + t('أعد قراءة وثيقتي'),'btn-quiet btn-sm',' data-mydocfix="1"') + '</div>'))
      + softErrCard()
      + (PZ.length
        ? cardFlush('\u26A0 ' + t('وثائقُ عُزلت عن الرفع') + ' — ' + nm(PZ.length),
            /* «حذفٌ» أم «كتابة»؟ كان الجدولُ لا يقول — فحذفٌ ردّته القاعدةُ يُقرأ
               رفضًا للحساب ويُبحَث في الوثيقة عن عيبٍ ليس فيها */
            table(['الأمر','النوع','المعرّف','السبب',''],
              PZ.map(function(x, i){
                return [x.v === null ? pill('حذف','off') : pill('كتابة','acc'),
                        esc(x.kind), '<span class="num">' + esc(String(x.id)) + '</span>',
                        '<span class="hint" style="margin:0">' + esc(x.err) + '</span>',
                        '<div class="actions" style="margin:0">'
                        + btn('\u21BB','btn-quiet btn-sm',' data-pzretry="' + i + '" aria-label="' + esc(t('أعد الرفع')) + '"')
                        + btn('\u{1F5D1}','btn-danger btn-sm',' data-pzdrop="' + i + '" aria-label="' + esc(t('أسقط')) + '"')
                        + '</div>'];
              }))
            + (PZ.length > 1
              ? '<div class="actions" style="margin:8px 0 0">'
                + btn('\u21BB ' + t('أعد رفع الكل'),'btn-secondary btn-sm',' data-pzall="retry"')
                + btn('\u{1F5D1} ' + t('أسقط الكل'),'btn-danger btn-sm',' data-pzall="drop"')
                + '</div>'
              : '')
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('رُفضت ثلاثَ مرات فعُزلت كي لا تعيق ما بعدها — السببُ مكتوب: قيمةٌ غيرُ مقبولة أو قاعدةٌ تمنع. أعد رفعَها بعد الإصلاح، أو أسقطها إن كانت خطأً.')) + '</p>'
            + (PZ.some(function(x){ return x.v === null && /permission|insufficient/i.test(String(x.err || '')); })
              ? '<p class="hint" style="margin:6px 0 0">' + esc(t('أمرُ حذفٍ ردّته القاعدة ليس رفضًا للحساب: الحذفُ في تلك المجموعة للإدارة وحدَها — وسجلُّ الأحداث لا يُحذَف أبدًا.')) + '</p>'
              : ''))
        : '')
      /* الدورةُ تدفع كلَّ دقيقة — ومن رأى «بانتظار الرفع ١» ينتظر ولا يدري
         متى. زرٌّ يدفع الآن ويقول كم ذهب وكم بقي. */
      + (Q.length
        ? card('', '<div class="actions" style="margin:0">'
            + btn('\u2191 ' + t('ادفع الطابور الآن'),'btn-primary btn-sm',' data-pushnow="1"')
            + '<span class="hint" style="margin:0 10px">'
            + esc(t('الدورةُ تدفع تلقائيًّا كلَّ دقيقة — وهذا يدفع فورًا.')) + '</span></div>')
        : '')
      + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok'],
               ['أخطاءُ رفع', N(errs.length), errs.length ? 'bad' : 'ok'],
               ['أخطاءُ اليوم', N(today), today ? 'wrn' : 'ok'],
               ['الشبكة', pill(STATE.meta.online ? 'متصلة' : 'مقطوعة', STATE.meta.online ? 'ok' : 'off')]])
      + (Q.length
        ? cardFlush('الطابور — ' + nm(Q.length),
            table(['النوع','السجل','سُجّل'],
              Q.slice(0, 50).map(function(x){
                return [pill(t(PV.Q_LBL[x.kind] || x.kind), 'acc'), '<strong>' + esc(String(x.id || '—')) + '</strong>',
                        '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا شيءَ بانتظار الرفع — كلُّ ما سُجّل وصل.')) + '</p>'));
  })();
    if (cur === 'integ') return head + integTabHtml();   /* (V39.70) */
    if (cur === 'iotdash') return head + iotDashHtml();   /* (V40.7) */
    if (cur === 'dq') return head + (function(){
    var dup = dqDupPos(), noco = dqNoCo(), comp = dqCompound(), nosign = dqNoSign(), far = dqFar();
    var compN = Object.keys(comp).length, compPts = Object.keys(comp).reduce(function(a, k){ return a + comp[k].length; }, 0);
    var may2 = maySiteEdit();
    var row = function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px">'
      + '<span>' + esc(x.id) + '</span><span class="hint" style="margin:0">' + esc((x.name || '').slice(0, 30)) + '</span></button>'; };
    return '<p class="lede" style="margin:0 0 12px">' + esc(t('عيوبٌ في البيانات لا في الشيفرة — كلُّ عيبٍ بعدده، وما يُصلَح دفعةً يُسجَّل باسمك ويُزامَن كأيِّ تعديل.')) + '</p>'
      + stats([['على إحداثيةٍ واحدة', N(dup.length), dup.length ? 'wrn' : 'ok'],
               ['مخيمٌ بلا شركة', N(noco.length), noco.length ? 'wrn' : 'ok'],
               ['اسمٌ مركَّب', N(compN), compN ? 'wrn' : 'ok'],
               ['بلا مربعٍ أو شاخص', N(nosign.length), nosign.length ? 'wrn' : 'ok'],
               ['بعيدةٌ عن مشعرها', N(far.length), far.length ? 'wrn' : 'ok']])
      + (far.length
          ? card('\u{1F9ED} ' + t('نقاطٌ بعيدةٌ عن مشعرها') + ' \u2014 ' + nm(far.length),
              '<p class="hint" style="margin:0 0 8px">' + esc(t('إحداثياتُها على بُعد كيلومتراتٍ من جسم المشعر — غالبًا نقطةٌ أُضيفت من الميدان والجهازُ في مكانٍ آخر. افتح النقطةَ وصحّح موضعَها من نافذتها (أو اعتمد إحداثيات الزيارة)، أو أخفِها إن كانت خطأً.')) + '</p>'
              + far.slice(0, 30).map(function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + bdi(x.id) + ' <span class="hint" style="margin:0">' + esc(t(x.zone)) + '</span></span><span class="hint num" style="margin:0">' + esc((+x.lat).toFixed(5) + ', ' + (+x.lng).toFixed(5)) + '</span></button>'; }).join(''))
          : '')

      + card('\u{1F4CD} ' + t('نقطتان على إحداثيةٍ واحدة') + ' — ' + nm(dup.length),
          dup.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('أكثرُها المخيمُ الواحدُ مسجَّلًا مرتين بشاخصٍ مكتوبٍ بصفتين — فيُزار أحدُهما ويبقى توأمُه «لم يُزر» ويُعَدُّ في الإجمالي. اختر الأصلَ (ما مُسح إن مُسح أحدُهما) فيُدمَج التوأمُ فيه ويخرج من العدّ — ويُفَكُّ الدمجُ متى شئت. وإن كانا مخيمين حقًّا فافصل إحداثياتِهما من «تحريك».')) + '</p>'
              + dup.slice(0, 40).map(function(p){
                  var st = function(x){ var r = STATE.recs[x.id]; return svVisited(r) ? '<span class="pill ok">' + esc(t('تمت الزيارة')) + '</span>' : '<span class="pill">' + esc(t('لم يُزر')) + '</span>'; };
                  var lab = function(x){ return '<b>' + esc(x.id) + '</b> <span class="hint" style="margin:0">' + esc((x.sq || '') + ' / ' + (x.sign || '')) + '</span> ' + st(x); };
                  var a = p[0], b = p[1], aS = svVisited(STATE.recs[a.id]), bS = svVisited(STATE.recs[b.id]);   /* (V32.8) */
                  var btnA = may2 && !(bS && !aS) ? btn(t('الأصلُ الأولى — ادمج الثانية'),'btn-quiet btn-sm',' data-dupkeep="' + esc(a.id) + '|' + esc(b.id) + '"') : '';
                  var btnB = may2 && !(aS && !bS) ? btn(t('الأصلُ الثانية — ادمج الأولى'),'btn-quiet btn-sm',' data-dupkeep="' + esc(b.id) + '|' + esc(a.id) + '"') : '';
                  return '<div class="card" style="margin:0 0 8px;padding:8px 10px"><div class="wt-row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'
                    + '<span>' + lab(a) + '</span><span>\u2194</span><span>' + lab(b) + '</span>'
                    + '<span class="hint num" style="margin:0">' + esc((+a.lat).toFixed(5)) + ', ' + esc((+a.lng).toFixed(5)) + '</span></div>'
                    + (btnA || btnB ? '<div class="actions" style="margin:6px 0 0">' + btnA + btnB + '</div>' : '') + '</div>';
                }).join('')
              + (dupMerged().length
                  ? '<p class="hint" style="margin:10px 0 4px">' + esc(t('مدمَجةٌ من قبل')) + ' <b class="num">' + nm(dupMerged().length) + '</b></p>'
                    + dupMerged().slice(0, 40).map(function(x){
                        return '<div class="wt-row" style="justify-content:space-between;margin:0 0 4px"><span>' + esc(x.id) + ' \u2192 ' + esc(x.dupOf) + '</span>'
                          + (may2 ? btn(t('فكّ الدمج'),'btn-quiet btn-sm',' data-dupundo="' + esc(x.id) + '"') : '') + '</div>'; }).join('')
                  : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا تكرارَ في الإحداثيات.')) + '</p>')

      /* (V39.70) owner: «الـ٦١ دول معمولين من خالد وعمار ولا حاجات قديمة؟» — who set «ترددي» on each camp, and the values that
         no longer count (filled in by the old form, or written by the office) */
      + (function(){
          var by = {}, un = [];
          (STATE.sites || []).forEach(function(x){ if (x.type !== 'مخيم') return; var cs = ctypeSrc(x); if (!cs || cs.v !== 'ترددي') return; if (cs.field) by[cs.by] = (by[cs.by] || 0) + 1; else un.push({ x:x, cs:cs }); });
          var names = Object.keys(by); if (!names.length && !un.length) return '';
          return card('\u{1F3F7} ' + t('مَن حدّد «ترددي»'),
            '<p class="hint" style="margin:0 0 8px">' + esc(t('يُحتسب «ترددي» وعددُ بوابات التفويج حين يختاره الفني أو المشرف أو المهندس الميداني بنفسه — في «تعديل المسح» أو باختياره في نموذج المسح.')) + '</p>'
            + names.sort(function(a, b){ return by[b] - by[a]; }).map(function(n){ return '<div style="display:flex;justify-content:space-between;margin:0 0 4px"><span>\u2705 ' + esc(n) + '</span><b class="num">' + nm(by[n]) + '</b></div>'; }).join('')
            + (un.length ? '<p class="hint" style="margin:10px 0 4px">' + esc(t('لا يُحتسب — اتملا وحده في النموذج القديم أو كتبه المكتب')) + ' <b class="num">' + nm(un.length) + '</b></p>'
                + un.slice(0, 30).map(function(o){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(o.x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + esc(o.x.name || o.x.id) + '</span><span class="hint" style="margin:0">' + esc(o.cs.by || t('تلقائي')) + '</span></button>'; }).join('') : ''));
        })()
      + recoveredPhotosHtml()   /* (V39.80) */
      /* (V39.60) owner: «اعرضهالي كده بس، وخلّي البيانات الأساسية القديمة الصح، وأعدّل أنا أي وقت» — camps whose name says one
         square/sign and whose fields say another (65 in the registry itself, e.g. 0631: name «A2/38», sign «D/204»). Shown only:
         nothing is changed automatically; each opens its point, where «تعديل البيانات» fixes it. */
      + (function(){
          var M = typeof campNameMismatch === 'function' ? campNameMismatch() : [];
          if (!M.length) return '';
          return card('\u{1F3F7} ' + t('اسم المخيم لا يطابق مربعه وشاخصه') + ' — ' + nm(M.length),
            '<p class="hint" style="margin:0 0 8px">' + esc(t('للعرض فقط — لا يتغيّر شيءٌ تلقائيًّا. افتح النقطة ثم «تعديل البيانات» وصحّح ما يلزم متى شئت.')) + '</p>'
            + M.slice(0, campNameMismatch.all ? 200 : 12).map(function(o){ var x = o.x;
                return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px;text-align:start"><span><b>' + esc(x.id) + '</b><br><span class="hint" style="margin:0">' + esc(t('الاسم')) + ': ' + esc(t('مربع')) + ' ' + esc(o.nSq) + ' · ' + esc(t('شاخص')) + ' ' + esc(o.nSign) + '</span><br><span class="hint" style="margin:0">' + esc(t('البيانات')) + ': ' + esc(t('مربع')) + ' ' + esc(x.sq || '—') + ' · ' + esc(t('شاخص')) + ' ' + esc(x.sign || '—') + '</span></span><span>\u270E</span></button>'; }).join('')
            + (M.length > 12 ? '<div class="actions" style="margin:6px 0 0">' + btn(campNameMismatch.all ? t('اعرض أقل') : t('اعرض الكل') + ' (' + nm(M.length) + ')', 'btn-quiet btn-sm', ' data-cnmall="1"') + '</div>' : ''));   /* (V39.61) the screen stays light: twelve, the rest on demand */
        })()
      /* (V39.58) owner: «الدوائر اللي في عرفات امسحها وارسمها مخيمات — مش عايز أي دائرة على مخيم». A camp is drawn as a circle
         only when it has no boundary: a point added on the map after the registry. Inside a registered camp's boundary it is
         that camp registered twice — merged here: its visit moves to the registered camp (when that one has none) and it
         leaves the map; outside every boundary it is a new camp waiting for its boundary to be drawn. */
      + (function(){
          var C = typeof campCircles === 'function' ? campCircles() : { inside:[], outside:[] };
          if (!C.inside.length && !C.outside.length) return '';
          var nm2 = function(x){ return '<b>' + esc(x.name || x.id) + '</b> <span class="hint num" style="margin:0">' + esc(x.id) + '</span>'; };
          return card('\u2B55 ' + t('مخيماتٌ تظهر دوائر') + ' — ' + nm(C.inside.length + C.outside.length),
            '<p class="hint" style="margin:0 0 8px">' + esc(t('المخيمُ يُرسم دائرةً حين لا حدودَ له. ما يقع داخل حدود مخيمٍ مسجَّلٍ هو المخيمُ نفسُه مضافًا مرةً ثانية: «ادمج» ينقل زيارتَه إليه إن كان بلا زيارة ويُخفيه من الخريطة؛ وما يقع خارج كلِّ الحدود مخيمٌ جديدٌ تُرسم حدودُه.')) + '</p>'
            + (C.inside.length && may2 ? '<div class="actions" style="margin:0 0 8px">' + btn('\u21C4 ' + t('ادمج الكل') + ' (' + nm(C.inside.length) + ')', 'btn-primary btn-sm', ' data-ccmergeall="1"') + '</div>' : '')
            + C.inside.slice(0, 60).map(function(o){
                return '<div class="card" style="margin:0 0 6px;padding:8px 10px"><div>' + nm2(o.dup) + ' \u2192 ' + nm2(o.keep) + (o.both ? ' <span class="pill warn">' + esc(t('الاثنان مُسحا — تُخفى الدائرة ويبقى سجلّها')) + '</span>' : '') + '</div>'
                  + '<div class="actions" style="margin:6px 0 0">' + btn(t('افتح'), 'btn-quiet btn-sm', ' data-site="' + esc(o.dup.id) + '"') + (may2 ? btn('\u21C4 ' + t('ادمج'), 'btn-quiet btn-sm', ' data-ccmerge="' + esc(o.keep.id) + '|' + esc(o.dup.id) + '"') : '') + '</div></div>'; }).join('')
            + (C.outside.length ? '<p class="hint" style="margin:10px 0 4px">' + esc(t('خارج كلِّ الحدود — مخيماتٌ جديدةٌ تنتظر رسمَ حدودها')) + ' <b class="num">' + nm(C.outside.length) + '</b></p>'
                + C.outside.slice(0, 40).map(function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + nm2(x) + '</span><span>\u270F</span></button>'; }).join('') : ''));
        })()

      + card('\u{1F3E2} ' + t('مخيماتٌ بلا شركة') + ' — ' + nm(noco.length),
          (noco.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('تسقط من تقارير الشركات ولا يصلها إشعارُ مواعيد التركيب. إمّا تُعبَّأ من كشف التخصيص، أو تُوسَم «بلا تخصيص» فتُستثنى صراحةً بدل أن تُحسَب صفرًا صامتًا.')) + '</p>'
              + noco.slice(0, 30).map(row).join('')
              + (noco.length > 30 ? '<p class="hint" style="margin:6px 0 0">' + esc(t('يُعرَض ثلاثون — والباقي في شاشة المواقع بترشيح الشركة.')) + '</p>' : '')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له شركة.')) + '</p>'),
          (noco.length && may2) ? btn('\u{1F3F7} ' + t('صنّف الكلَّ «بلا تخصيص»'),'btn-secondary btn-sm',' data-dqnoco="1"') : '')

      + card('\u{1F517} ' + t('أسماءٌ مركَّبة') + ' — ' + nm(compN) + ' ' + t('اسمًا على') + ' ' + nm(compPts) + ' ' + t('نقطة'),
          (compN
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('خانةٌ واحدةٌ تحمل شركتين أو أكثر، فلا تُنسَب نقاطُها لأيٍّ منها في العدّ. الشطرُ يُبقي الأولى في «الشركة» ويضع الباقيَ في «شركات مشاركة» — فتُعَدُّ للأولى ويبقى الباقي مقروءًا.')) + '</p>'
              + Object.keys(comp).slice(0, 12).map(function(c){
                  return '<div class="wt-le"><b class="num">' + nm(comp[c].length) + '</b> \u00b7 <span dir="auto">' + esc(c.slice(0, 90)) + '</span></div>';
                }).join('')
            : '<p class="hint" style="margin:0">' + esc(t('لا أسماءَ مركَّبة.')) + '</p>'),
          (compN && may2) ? btn('\u2702 ' + t('اشطر الكلَّ إلى «شركة» و«شركات مشاركة»'),'btn-secondary btn-sm',' data-dqsplit="1"') : '')

      + card('\u{1F3AF} ' + t('مخيماتٌ بلا مربعٍ أو شاخص') + ' — ' + nm(nosign.length),
          nosign.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('الشاخصُ ما يقرؤه الفنيُّ على الأرض؛ بدونه يبحث بالإحداثية وحدها. تُستكمَل من «تعديل البيانات» في نافذة النقطة قبل إسنادها.')) + '</p>'
              + nosign.slice(0, 30).map(row).join('')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له مربعٌ وشاخص.')) + '</p>');
  })();
if (cur === 'usage') return head + costCard() + devActCard() + speedCard() + usageCard() + perfCard() + (function(){
    if (may('users') || may('exportAll')) presenceFetch(false);
    var rows = presenceRows(), now = Date.now(), cur9 = appVer();
    var H = 3600000, work = (function(){ var h = new Date().getHours(); return h >= 7 && h <= 23; })();
    var totReads = 0, online = 0, stale = 0, old = 0, back = 0, errs = 0;
    /* الجسرُ: آخرُ تشغيلٍ له — إن تجاوز ٤٥ دقيقةً فالبلاغاتُ والصورُ الجديدةُ معلّقة (V17.39) */
    var br = (STATE.bridge || {}), brAge = br.at ? now - (+br.at || 0) : -1;
    var brStale = brAge < 0 || brAge > 45 * 60000;
    var T = rows.map(function(p){
      var age = now - (+p.at || 0), isOn = age < 15 * 60000, isStale = age > 2 * H && work;
      var oldV = p.ver && p.ver !== cur9, hasBack = (+p.q || 0) + (+p.pz || 0) + (+p.pfl || 0) > 0;   /* (V31.1) */
      var reads = (p.rd != null) ? +p.rd : (+p.reads || 0);      /* اليومُ إن رُفع، وإلا الجلسة */
      totReads += reads; if (isOn) online++; if (isStale) stale++; if (oldV) old++; if (hasBack) back++; errs += (+p.err || 0);
      var flags = [];
      var tip = function(txt, cls, why){ return '<span class="pill ' + cls + '" title="' + esc(t(why)) + '">' + esc(t(txt)) + '</span>'; };
      if (isStale) flags.push(tip('منقطع', 'bad', 'لم يرسل الجهازُ إشارةً منذ أكثر من ساعتين في وقت العمل — مغلقٌ أو بلا شبكة'));
      if (oldV) flags.push(tip('نسخة قديمة', 'warn', 'على نسخةٍ أقدمَ من الحالية — يُحدَّث بإعادة فتح التطبيق على شبكة'));
      if (+p.pz || 0) flags.push(tip('طابورٌ مسموم', 'bad', 'وثيقةٌ رُفض رفعُها مرارًا فعُزلت كي لا توقف الطابور — تُراجَع في شاشة المزامنة: تُعاد أو تُهمَل'));
      if (+p.pf || 0) flags.push(tip(nm(p.pf) + ' ' + t('صور فشلت'), 'warn', 'صورٌ تعذّر رفعُها بعد خمس محاولات — تبقى على الجهاز حتى تُعاد'));
      if (reads > 3000) flags.push(tip('قراءاتٌ عالية', 'warn', 'قرأ اليومَ أكثرَ من ثلاثة آلاف وثيقة — طبيعيٌّ بعد سحبةٍ باردة، ويُراقَب إن تكرّر'));
      if ((+p.cp || 0) > 1) flags.push(tip(nm(p.cp) + ' ' + t('سحبات باردة'), 'warn', 'أعاد تحميلَ نطاقه كلِّه أكثرَ من مرة — كلُّ مرةٍ آلافُ القراءات'));
      if ((+p.rms || 0) > 400) flags.push(tip('رسمٌ بطيء', 'warn', 'متوسّطُ رسم الشاشة فوق ٤٠٠ م.ث — جهازٌ ضعيفٌ أو بياناتٌ ثقيلة'));
      if (p.pulse === false) flags.push(tip('بلا إشارة', 'warn', 'لم يتصل بإشعار التغيير — يعتمد على السحب الدوريِّ وحدَه'));
      return [
        '<b>' + esc(dispName(p.name || '')) + '</b><br><span class="hint" style="margin:0">' + esc(t(roleName(p.role) || p.role || '')) + ' \u00b7 ' + esc(p.ver || '—') + '</span>',
        '<span class="num">' + esc(p.at ? stepAgo(p.at) : '—') + '</span>' + (isOn ? ' ' + pill('متصل', 'ok') : ''),
        N(reads) + (p.rd == null ? ' <span class="hint" style="margin:0">' + esc(t('جلسة')) + '</span>' : ''),
        N(+p.q || 0) + (+p.pq ? ' + ' + nm(p.pq) + '\u{1F4F7}' : ''),
        N(+p.err || 0),
        '<span class="num">' + (p.rms != null ? nm(p.rms) + ' ' + t('م.ث') : '—') + '</span>',
        '<span class="num">' + (p.pms ? nm(p.pms) + ' ' + t('م.ث') : '—') + '</span>',
        flags.join(' ') || '<span class="pill ok" title="' + esc(t('لا شيءَ يستدعي النظر: متصلٌ وعلى النسخة الحالية وبلا طوابيرَ عالقةٍ ولا أخطاء')) + '">' + esc(t('سليم')) + '</span>'
      ];
    });
    /* ═══ خلاصةٌ بلا مصطلحات قبل الجدول التقنيّ (V17.35) ═══
       المهندسُ يريد جملةً: النظامُ بخير أم لا، ومن غاب، وماذا يلزم — والتفاصيلُ
       التقنيةُ لمن يريدها تحت «التفاصيل التقنية». */
    var okAll = !stale && !back && !old && totReads <= 40000;
    var plain = [];
    plain.push(okAll ? t('النظامُ يعمل بشكلٍ طبيعيّ: كلُّ الأجهزة تتزامن ولا شيءَ عالق.') : t('يوجد ما يستحقُّ نظرة:'));
    if (stale) plain.push(nm(stale) + ' ' + t('جهازًا لم يتزامن منذ أكثر من ساعتين في وقت العمل — قد يكون مغلقًا أو بلا شبكة.'));
    if (back)  plain.push(nm(back) + ' ' + t('جهازًا عنده عملٌ لم يُرفَع بعد (صورٌ أو زيارات) — يُفتَح على شبكةٍ فيُرفَع وحدَه.'));
    if (old)   plain.push(nm(old) + ' ' + t('جهازًا على نسخةٍ قديمة — يُعاد فتحُ التطبيق فيحدّث نفسَه.'));
    if (totReads > 40000) plain.push(t('استهلاكُ القاعدة اليوم قريبٌ من الحدِّ المجانيّ.'));
    if (errs) plain.push(nm(errs) + ' ' + t('خطأً برمجيًّا مسجَّلًا على الأجهزة — يراه المطوّرُ في السجل.'));
    return card((okAll ? '\u2705 ' : '\u26A0\uFE0F ') + t('الخلاصة'),
        '<p style="margin:0;font-size:15px;line-height:1.8">' + plain.map(esc).join('<br>') + '</p>'
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('متصلٌ الآن')) + ' <b class="num">' + nm(online) + '</b> ' + t('من') + ' <b class="num">' + nm(rows.length) + '</b> \u00b7 '
        + esc(t('قراءاتُ اليوم')) + ' <b class="num">' + nm(totReads) + '</b> / ' + nm(50000) + '</p>')
      + '<details' + (okAll ? '' : ' open') + '><summary class="hint" style="cursor:pointer;margin:0 0 10px">\u{1F527} ' + esc(t('التفاصيل التقنية')) + '</summary>'
      + '<p class="lede" style="margin:0 0 12px">' + esc(t('كلُّ جهازٍ يقيس نفسَه ويرفع قياسَه مع إشارة حضوره: ما قرأ، وما ينتظر في طوابيره، وما وقع فيه من أخطاء، وكم يستغرق رسمُه وسحبُه.')) + '</p>'
      + stats([['أجهزة', N(rows.length)], ['متصلةٌ الآن', N(online), online ? 'ok' : ''],
               ['منقطعةٌ في وقت العمل', N(stale), stale ? 'wrn' : 'ok'],
               ['على نسخةٍ قديمة', N(old), old ? 'wrn' : 'ok'],
               ['بطوابيرَ عالقة', N(back), back ? 'wrn' : 'ok'],
               ['قراءاتُ اليوم كلِّها', N(totReads), totReads > 40000 ? 'wrn' : 'ok'],
               ['أخطاءٌ مسجَّلة', N(errs), errs ? 'wrn' : 'ok'],
               ['آخر تشغيلٍ للجسر', br.at ? esc(stepAgo(br.at)) : esc(t('لم يُسجَّل بعد')), brStale ? 'wrn' : 'ok']])
      + (brStale ? '<p class="hint" style="margin:0 0 8px;color:var(--warn)">' + esc(t('الجسرُ (الحساباتُ والصورُ والبلاغات) لم يعمل منذ أكثر من ٤٥ دقيقة — الجدولةُ تتأخّر أحيانًا. يُشغَّل يدويًّا من المستودع: Actions ← Provision ← Run workflow، ويعمل تلقائيًّا مع كلِّ دفعةِ نسخة.')) + '</p>' : '')
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('الحصةُ المجانيةُ خمسون ألفَ قراءةٍ في اليوم للمشروع كلِّه — والأرقامُ هنا من آخر إشارةٍ لكلِّ جهاز (كلَّ نصف ساعة أو عند التغيّر).'))
      +   ' ' + esc(t('«قراءات» هي قراءاتُ اليوم؛ وما وُسم «جلسة» فمن نسخةٍ أقدمَ يعدُّ منذ الفتح. و«سحبة باردة» تعني أن الجهازَ أعاد تحميلَ نطاقه كلِّه — وهي ما يرفع القراءاتِ بالآلاف.')) + '</p>'
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('مفتاحُ الحالات — اضغط أيَّ حالةٍ لترى معناها:')) + ' '
      +   esc(t('منقطع')) + ' = ' + esc(t('بلا إشارةٍ لساعتين في وقت العمل')) + ' \u00b7 '
      +   esc(t('طابورٌ مسموم')) + ' = ' + esc(t('وثيقةٌ رُفض رفعُها فعُزلت — تُراجَع في المزامنة')) + ' \u00b7 '
      +   esc(t('نسخة قديمة')) + ' = ' + esc(t('يُحدَّث بإعادة الفتح على شبكة')) + ' \u00b7 '
      +   esc(t('سليم')) + ' = ' + esc(t('لا شيءَ يستدعي النظر')) + '</p>'
      + card(t('الأجهزة'), rows.length
          ? table(['الجهاز','آخر ظهور','قراءات','طوابير','أخطاء','زمن الرسم','زمن السحب','الحالة'], T, null, { sticky:true })
          : '<p class="hint" style="margin:0">' + esc(t('لا إشاراتٍ بعد.')) + '</p>')
      + '</details>';
  })();
if (cur === 'vers') return head + (function(){
    /* كان جدولًا مكتوبًا بيدٍ من عهد V14 — اسمان ونسختان وإنذارٌ ثابت */
    if (may('users') || may('exportAll')) presenceFetch(false);
    var cur9 = appVer(), rows = presenceRows(), week = Date.now() - 7 * 86400000;
    var onCur = rows.filter(function(r){ return r.ver === cur9; }).length;
    var stale = rows.filter(function(r){ return r.ver && r.ver !== cur9 && (r.at || 0) > week; });
    /* حصةُ القاعدة تُرى من هنا: كلُّ جهازٍ يرسل عدَّ قراءاته في نبضة حضوره،
       ومجموعُ أجهزة اليوم تقديرٌ لما استُهلك — والرقمُ الحاسمُ في لوحة Firebase */
    var today = dayKey();
    var readsToday = rows.reduce(function(a, r){ return a + ((r.day === today && r.reads) || 0); }, 0);
    return stats([['أجهزة ظهرت', N(rows.length)],
                  ['على النسخة الحالية', N(onCur), 'ok'],
                  ['على إصدار أقدم', N(stale.length), stale.length ? 'bad' : 'ok'],
                  ['قراءات القاعدة اليوم — تقديرًا من الأجهزة', N(readsToday), readsToday > 40000 ? 'bad' : (readsToday > 25000 ? 'wrn' : 'ok')]])
      + '<p class="hint">' + esc(t('الرقمُ الفعليُّ في لوحة Firebase: Firestore ← Usage. والخطةُ Blaze لا توقف الخدمةَ عند الحصة (٥٠ ألف قراءة/يوم) بل تحاسب ما فوقها.')) + '</p>'
      + card('الأجهزة الظاهرة',
          (rows.length
            ? table(['المستخدم','النسخة','الدور','آخر ظهور'], rows.map(function(r){
                return [esc(dispName(r.name || r.uid)), pill(r.ver || '—', r.ver === cur9 ? 'ok' : 'off'),
                        esc(t((ROLES[r.role] || {}).n || r.role || '—')),
                        '<span class="num">' + esc(agoTxt(r.at)) + '</span>'];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لم يصل من أيِّ جهازٍ بعد — تُكتَب نسخةُ كلِّ جهازٍ حين يدخل.')) + '</p>')
          + '<div class="actions" style="margin-top:8px">'
          + btn('\u21BB ' + t('حدّث القائمة'),'btn-quiet btn-sm',' data-presfetch="1"') + '</div>')
      + (stale.length
        ? '<div class="alert error"><span>' + esc(t('أجهزةٌ على إصدارٍ قديم')) + ' — ' + nm(stale.length) + ': '
          + esc(stale.map(function(r){ return dispName(r.name || r.uid) + ' (' + (r.ver || '—') + ')'; }).join('، '))
          + ' — ' + esc(t('المفتوحُ منها يتحدّث تلقائيًّا خلال دقيقة — والمغلقُ حين يُفتَح.')) + '</span></div>'
        : (rows.length ? alertBox('ok','كلُّ الأجهزة الظاهرة على النسخة الحالية.') : ''));
  })();
    if (cur === 'retain') return head + (function(){
    /* أعدادُ السجلات تُعَدُّ من الحالة لا تُكتَب: كانت محفورةً «سجل الأحداث
       ٤٬٨٢٠» و«الصور ١٢» — أرقامَ يومٍ مضى تُقرأ اليومَ حجمًا حقيقيًّا،
       ويُبنى عليها قرارُ أرشفة. والحجمُ بالميغا يُقدَّر من العدد بمتوسّطٍ
       معلومٍ لكلِّ نوعٍ فيبقى تقديرًا معلنًا لا رقمًا مخترعًا. */
    var cnt = function(k){
      var v = STATE[k];
      return Array.isArray(v) ? v.length : Object.keys(v || {}).length;
    };
    var mb = function(n, kb){ return (n * kb / 1024).toFixed(1); };
    var SETS = [
      ['المواقع',       (STATE.sites || []).length, mb((STATE.sites || []).length, 1.4),
                        'دائم',      'أصل المشروع لا يُؤرشَف'],
      ['سجل الأحداث',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٩٠ يومًا',  'يُؤرشَف شهريًّا في ملف مضغوط'],
      ['إشارات الأجهزة', cnt('hb'),   mb(cnt('hb'), 0.2),
                        '٣٠ يومًا',  'الأكثر نموًّا — إشارةٌ كل خمس دقائق'],
      ['الصور',         cnt('photos'),  mb(cnt('photos'), 1600),
                        'دائم',      'مضغوطة على الجهاز قبل الرفع'],
      ['دفتر المخزون',  cnt('moves'),   mb(cnt('moves'), 0.3),
                        'دائم',      'الأرصدة مشتقّة منه فلا يُمسّ'],
      ['المشتريات',     cnt('buys'),    mb(cnt('buys'), 0.3),
                        'دائم',      'مستند مالي'],
      ['سجل التدقيق',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٣ سنوات',  'مدة المساءلة'],
      ['مسودّات محلية', (STATE.queue || []).length, mb((STATE.queue || []).length, 0.5),
                        '٧ أيام',    'تُمسح بعد المزامنة الناجحة']
    ];
    var tot = SETS.reduce(function(a,s){ return a + parseFloat(s[2]); }, 0);
    return stats([['الحجم الكلي', '<span class="num">'+tot.toFixed(1)+'</span> م.ب'],
                  ['سجلات', '<span class="num">'+nm(SETS.reduce(function(a,s){return a+s[1];},0))+'</span>'],
                  ['الأسرع نموًّا','إشارات','wrn'],
                  ['حدّ الخطة المجانية','١ ج.ب','acc']])
      + card('مجموعات البيانات',
          table(['المجموعة','سجلات', t('م.ب'),'مدة الاحتفاظ','السياسة'],
            SETS.map(function(s){
              return [esc(t(s[0])), '<span class="num">'+nm(s[1])+'</span>',
                      '<span class="num">'+s[2]+'</span>',
                      s[3]==='دائم' ? pill('دائم','acc') : pill(s[3],'warn'),
                      '<span class="hint" style="margin:0">'+esc(t(s[4]))+'</span>'];
            })),
          btn('تشغيل الأرشفة الآن','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('الأرشفةُ التلقائيةُ تحتاج دالةً على الخادم — لم تُبنَ بعد. الحذفُ اليدويُّ من Firestore متاحٌ لمن يملك القاعدة.')) + '"'))
      /* كانت بطاقةً محفورةً تقول «لا نسخة فعلية — مطلوب مفتاح» بعد أن صار
         النسخُ يوميًّا إلى درايف — البطاقةُ الحيّةُ نفسُها التي في صحة الأجهزة */
      + bkCard()
      + card('دورة المزامنة', flow(['يُكتب محليًّا','في الطابور','رُفع','أُكِّد'],0)
        + '<p class="hint">' + esc(t('الكتابة تنجح دائمًا على الجهاز — والشبكة تفصيلٌ لاحق لا شرطٌ مسبق.')) + '</p>')
      + card('سياسة التعارض',
          table(['الحقل','السياسة','لماذا'], [
            ['حالة المسح','<span class="pill acc">' + esc(t('الأحدث يفوز')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تقدُّمٌ لا يرجع')) + '</span>'],
            ['حالة التركيب','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('«مُركّب» و«متعذّر» لا يجتمعان')) + '</span>'],
            ['الإحداثيات','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تحريكان مختلفان يعنيان خلافًا على الموقع')) + '</span>'],
            ['الصور','<span class="pill ok">' + esc(t('تُضاف كلها')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('لا صورة تُلغي أخرى')) + '</span>'],
            ['القطع المستهلكة','<span class="pill off">' + esc(t('يُرفض الثاني')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('وإلا استُهلك المخزون مرتين')) + '</span>'],
            ['الملاحظات','<span class="pill ok">' + esc(t('تُدمَج بسطر فاصل')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('كلاهما شهادة')) + '</span>']
          ]),
          btn('حفظ السياسة','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('مددُ الاحتفاظ أعلاه معلَنةٌ لا مضبوطة — تعديلُها يحتاج تطبيقَ الأرشفةِ أولًا.')) + '"'))
      + card('تعارضات بانتظار القرار',
          '<p class="hint">' + esc(t('لا تعارضات — تظهر هنا بالنسختين جنبًا إلى جنب ليختار المهندس.')) + '</p>')
      + card('طابور الرفع',
          '<div class="actions">'
          + btn('رفع الآن','btn-primary btn-sm',' data-pull="1"')
          + btn('عرض الطابور','btn-secondary btn-sm',' data-pq="1"')
          + '<span class="hint" style="margin:0">' + esc(t('آخر مزامنة')) + ' <span class="num">'
          + esc(STATE.meta.lastSync ? fmtTime(STATE.meta.lastSync, { hour:'2-digit', minute:'2-digit' }) : '—')
          + '</span></span></div>')
      + '<p class="hint">' + esc(t('«آخر كتابة تفوز» صامتةً هي أخطر سياسة: تمحو عمل زميلٍ بلا أن يعلم أحد. ما لا يُحسم آليًّا يُعرَض.')) + '</p>';
  })();
    return head + (function(){
    var C = wipeCounts(), tot = C.reduce(function(a, r){ return a + r[1]; }, 0);
    return alertBox('warn','يمسحُ ما سُجِّل من الجهاز ومن القاعدة: المسحُ والتركيبُ والفكُّ والمهامُّ والصورُ وحركاتُ المخزون والمشترياتُ والمقترحاتُ واللقطاتُ اليومية. وسجلُّ الأحداث والإشعاراتُ يُفرَغان من هذا الجهاز فقط — الأثرُ لا يُمحى من القاعدة. ولا يمسّ المواقعَ الألفَ والسبعمئةَ والسبعةَ والثمانين، ولا الطاقمَ، ولا الكتالوجَ، ولا الإعدادات — يمسح ما سُجِّل لا ما عُرِّف.')
      + halves(t('ما سيُمسَح') + ' — ' + nm(tot) + ' ' + t('سجلًّا'),
          ['البند','العدد'],
          C.map(function(r){
            return [esc(t(r[0])) + (r[2] ? '' : ' <span class="hint" style="margin:0">' + esc(t('من الجهاز فقط')) + '</span>'),
                    r[1] ? pill(nm(r[1]), 'wrn') : N(0)];
          }))
      + (may('delete')
        ? card('التأكيد',
            '<div class="field"><label>' + esc(t('اكتب «مسح نهائي» للتأكيد')) + '</label>'
            + '<input id="wipeOk" dir="auto" placeholder="' + esc(t('مسح نهائي')) + '"></div>'   /* (V39.6) the phrase in the screen's language */
            + '<div class="actions">' + btn('صفّر الآن','btn-danger',' data-wipego="1"') + '</div>'
            + '<p class="hint">' + esc(t('لا رجعةَ بعدها — ولكلِّ سجلٍّ له مجموعةٌ أمرُ حذفٍ يُنفَّذ على السحابة فلا يعود مع المزامنة، وما هو من الجهاز فقط يُفرَغ هنا.')) + '</p>')
        : alertBox('info','التصفيرُ للمهندس وحده.'));
  })();
  }};


/* (V39.80) owner approved: «كارت الصور المسترجعة». The Drive sync gives a record back to every Drive photo that had lost its own
   (the repeated number overwrote it — 23 photos on 10 points on 27 Oct). Listed here by point, newest first, so the office can see
   them and the technician can delete a copy uploaded twice. A kind+uploader seen twice on one point is marked «قد تكون مكرّرة». */
function recoveredPhotos(){
  var by = {};
  Object.keys(STATE.photos || {}).forEach(function(k){
    var p = STATE.photos[k]; if (!p || !p.recovered || p.del || !p.site) return;
    (by[p.site] = by[p.site] || []).push(p);
  });
  return Object.keys(by).map(function(id){
    var L = by[id].sort(function(a, b){ return (b.at || 0) - (a.at || 0); }), seen = {}, dup = 0, same = 0, md = {};
    L.forEach(function(p){ var k = (p.kind || '') + '|' + (p.by || ''); if (seen[k]) dup++; seen[k] = 1; });
    /* (V39.90) certainty: the same Drive file (md5) twice on this point, recovered or not */
    Object.keys(STATE.photos || {}).forEach(function(k){ var p = STATE.photos[k]; if (!p || p.site !== id || p.del || !p.md5) return; if (md[p.md5]) same++; md[p.md5] = 1; });
    return { id:id, x:(STATE.sites || []).filter(function(s){ return s.id === id; })[0] || { id:id }, list:L, dup:dup, same:same, at:L[0].at || 0 };
  }).sort(function(a, b){ return b.at - a.at; });
}
function recoveredPhotosHtml(){
  var R = recoveredPhotos(); if (!R.length) return '';
  var n = R.reduce(function(s, o){ return s + o.list.length; }, 0);
  return card('\u{1F5BC} ' + t('صورٌ مسترجَعة'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('صورٌ كانت على الدرايف بلا سجلّ — رقمُها تكرّر بين جهازين فكُتب سجلُّها فوقه — فأعادها الخادم إلى «صور الزيارة». راجعها، وإن رُفعت صورةٌ مرتين فاحذف النسخة الزائدة من «تعديل المسح».')) + '</p>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px"><span class="pill">' + nm(n) + ' ' + esc(t('صورة')) + '</span><span class="pill">' + nm(R.length) + ' ' + esc(t('نقطة')) + '</span></div>'
    + R.slice(0, 40).map(function(o){
        var who = {}; o.list.forEach(function(p){ if (p.by) who[typeof dispName === 'function' ? dispName(p.by) : p.by] = 1; });
        return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(o.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px;text-align:start">'
          + '<span>' + esc(o.x.name ? o.x.name + ' \u00b7 ' + o.id : o.id) + ' <span class="hint" style="margin:0">' + esc(Object.keys(who).join('، ')) + '</span>'
          + (o.same ? ' <span class="pill" style="border-color:#EF4444;color:#EF4444">' + nm(o.same) + ' ' + esc(t('مكرّرة — نفس الملف')) + '</span>' : o.dup ? ' <span class="pill" style="border-color:#F59E0B;color:#F59E0B">' + esc(t('قد تكون مكرّرة')) + '</span>' : '') + '</span>'
          + '<b class="num">' + nm(o.list.length) + '</b></button>';
      }).join(''));
}
