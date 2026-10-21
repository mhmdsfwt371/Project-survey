/* ============================================================================
   FILE    : src/03-survey/03-survey-records-02-install-points.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Installation points for a given type read from one place (what gets installed where).
   DEFINES : insPtsOf, insRecalcPlan, insRecalcCard, insRecalcRun, ptsDis, selPts, layerStats, layerFiltered, layerBar, disSchedule, disComplete
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V37.77) نقاطُ تركيبٍ بعينه تُقرأ من مكانٍ واحد ═══
   كانت أربعُ شاشاتٍ تقرأ الرقمَ المحفوظ مع التركيب مباشرةً، فتركيبٌ سُجِّل وأوزانُ القطع
   صفرٌ يبقى صفرًا فيها وإن ضُبطت الأوزانُ بعدُ — بينما ptsInstall تحسبه من قطعه. */
function insPtsOf(id){ return ptsInstall(siteFind(id) || { id:id, type:'' }); }
/* إعادةُ احتساب نقاط التركيب بالأوزان الحالية — للمهندس، بمعاينةٍ قبل التنفيذ.
   كلُّ تركيبٍ يتجمّد على أوزان يوم تسجيله (فلا يتغيّر تقييمُ الفنيِّ من تحته)؛ هذه الأداةُ
   هي الطريقُ الوحيدُ المعلَنُ لتطبيق وزنٍ جديدٍ بأثرٍ رجعيّ، وكلُّ تنفيذٍ يُسجَّل في سجلِّ التدقيق. */
function insRecalcPlan(){
  var ch = [], zero = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var r = STATE.inss[id];
    if (!r || r.deleted || r.status === 'مسودّة' || !r.parts || !Object.keys(r.parts).length) return;
    var nw = 0; Object.keys(r.parts).forEach(function(k){ nw += cfgN(r.parts[k]) * itPts(k); });
    nw = Math.round(nw * 100) / 100;
    var old = cfgN(r.pts);
    if (!nw){ if (old) zero++; return; }   /* لا يُصفَّر تركيبٌ لأن أوزانَ قطعه لم تُضبط بعد */
    if (Math.abs(nw - old) > 0.001) ch.push({ id:id, old:old, nw:nw, ok:!!r.approved });
  });
  ch.sort(function(a, b){ return Math.abs(b.nw - b.old) - Math.abs(a.nw - a.old); });
  return { ch:ch, zero:zero,
           before:ch.reduce(function(a, x){ return a + x.old; }, 0),
           after:ch.reduce(function(a, x){ return a + x.nw; }, 0),
           appr:ch.filter(function(x){ return x.ok; }).length };
}
function insRecalcCard(){
  var P = insRecalcPlan();
  var body = !P.ch.length
    ? '<p class="hint" style="margin:0">' + esc(t('كلُّ التركيبات المسجّلة متطابقةٌ مع الأوزان الحالية — لا شيءَ يُعاد احتسابه.')) + '</p>'
    : stats([['تركيباتٌ ستتغيّر', N(P.ch.length), 'wrn'], ['منها معتمد', N(P.appr)],
             ['النقاط قبل', N(Math.round(P.before * 100) / 100)], ['النقاط بعد', N(Math.round(P.after * 100) / 100), 'ok']])
      + table(['النقطة','قبل','بعد',''], P.ch.slice(0, 10).map(function(x){
          var st = siteFind(x.id);
          return ['<bdi>' + esc(x.id) + '</bdi>' + (st && st.name ? '<br><span class="hint" style="margin:0">' + esc(st.name) + '</span>' : ''),
                  N(x.old), '<b class="num">' + nm(x.nw) + '</b>', x.ok ? pill('معتمد','ok') : ''];
        }))
      + (P.ch.length > 10 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(P.ch.length - 10) + '</p>' : '')
      + '<div class="actions" style="margin:8px 0 0">' + btn('\u21BB ' + t('نفّذ إعادة الاحتساب'),'btn-primary btn-sm',' data-insrecalc="1"') + '</div>';
  return card('إعادة احتساب نقاط التركيب بالأوزان الحالية',
    '<p class="hint" style="margin:0 0 8px">' + esc(t('كلُّ تركيبٍ يحتفظ بنقاط يوم تسجيله. إذا عدّلتَ وزنَ قطعةٍ وأردتَ تطبيقه على ما سُجِّل قبلُ، فمن هنا — بعد مراجعة الفرق.')) + '</p>'
    + body
    + (P.zero ? '<p class="hint" style="margin:6px 0 0">' + esc(t('تركيباتٌ قطعُها كلُّها بوزن صفر لم تُمسّ')) + ': ' + nm(P.zero) + '</p>' : ''));
}
function insRecalcRun(){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var P = insRecalcPlan(); if (!P.ch.length){ toast(t('لا شيءَ يُعاد احتسابه')); return; }
  if (!confirm(t('ستتغيّر نقاطُ') + ' ' + P.ch.length + ' ' + t('تركيبًا') + ' (' + Math.round(P.before) + ' → ' + Math.round(P.after) + '). ' + t('متابعة؟'))) return;
  var by = STATE.meta.name || '', at = Date.now();
  P.ch.forEach(function(x){
    var r = STATE.inss[x.id]; if (!r) return;
    CORE.set('inss', x.id, Object.assign({}, r, { pts:x.nw, ptsRe:{ at:at, by:by, old:x.old } }));
  });
  logEvent('إعادةُ احتساب نقاط التركيب — ' + P.ch.length + ' تركيب · ' + Math.round(P.before * 100) / 100 + ' ← ' + Math.round(P.after * 100) / 100);
  toast(t('أُعيد احتسابُ نقاط التركيب') + ' (' + nm(P.ch.length) + ')'); render(1);
}

function ptsDis(x){
  var base = cfgGet('dw', x.zone + '|' + catLabel(x)) || cfgGet('dw', catLabel(x));
  var r = STATE.diss ? STATE.diss[x.id] : null;
  var f = (r && r.cond === 'تالف') ? cfgGet('disBad') : cfgGet('disOk');
  return base * (f || 1);
}

/* مجموعُ نقاطِ ما حُدِّد — يُعرَف قبل الإسناد */
function selPts(){
  var n = 0, L = LAYER();
  selIds().forEach(function(id){
    var x = siteFind(id);
    if (x) n += L.pts(x);
  });
  return Math.round(n * 100) / 100;
}

/* ── إحصاءُ الطبقة ── */
function layerStats(mode){
  var L = LAYERS[mode || FIELD_MODE] || LAYERS.survey;
  var pool = 0, ready = 0, done = 0, asn = 0, ptsReady = 0, ptsDone = 0;
  for (var i = 0; i < STATE.sites.length; i++){
    var x = STATE.sites[i];
    if (!L.pass(x)) continue;
    pool++;
    var p = L.pts(x);
    if (L.done(x)){ done++; ptsDone += p; }
    else { ready++; ptsReady += p; }
    /* المُسنَدُ في هذه الطبقة: إسنادٌ من نوعها هي — كان أيُّ إسنادٍ مفتوحٍ
       على النقطة يُعَدُّ في كلِّ طبقة، فيُقال «مُسنَد» في الفكِّ عن نقطةٍ
       إسنادُها تركيبٌ لم يُغلَق. */
    if (taskKindOf(x.id, L.kind)) asn++;
  }
  return { pool:pool, ready:ready, done:done, asn:asn,
           ptsReady:Math.round(ptsReady), ptsDone:Math.round(ptsDone),
           ptsAll:Math.round(ptsReady + ptsDone) };
}

/* الخريطةُ تُرشِّح بالطبقة ثم بالتصنيف */
function layerFiltered(){
  var L = LAYER();
  var base = (MY_ONLY || isCrewRole(ROLE)) ? mineFiltered() : filtered();
  return base.filter(function(x){ return L.pass(x); });
}

/* ── شريطُ الطبقة على الخريطة ── */
function layerBar(){
  var L = LAYER(), S = layerStats();
  return '<div class="map-layerbar">'
    + '<span class="lb-t" style="color:' + L.c + '">' + L.i + ' ' + esc(t(L.n)) + '</span>'
    + '<span class="lb-n"><b>' + nm(S.ready) + '</b> ' + esc(t('جاهز')) + '</span>'
    + '<span class="lb-n">' + nm(S.done) + ' ' + esc(t('تمّ')) + '</span>'
    + (S.ptsAll ? '<span class="lb-n">' + nm(S.ptsReady) + ' ' + esc(t('وزن')) + '</span>' : '')
    /* QA: كانت الكلمةُ خارج الرقم فتُركَّب الجملةُ بالجمع وتنكسر بالإنجليزية
       («1,787 outside the view Offered») — صار النصُّ كلُّه يُبنى في موضعٍ واحد */
    + '<span class="lb-c"><span class="num" id="mapCount">\u2014</span></span>'
    + '</div>';
}

/* ── لوحُ الطبقة: يُظهر ما ينقص قبل أن يُجدوَل ── */
PAGE.tfwdraw = { m:'الميدان', t:'رسم المسارات من وإلى الجمرات', l:'ارسم بيدك على الخريطة مسارَ كلِّ دورٍ ذهابًا وعودة — يلتصق بالشوارع ويُعرَض على الأجهزة كلِّها بدل المولَّد.',
  body:function(){
    var D = tfdDrawn(), rows = [], drawnBy = (CFG.tfwdraw && CFG.tfwdraw.by) || '', meta = STATE.meta || {};
    TFW_FL.forEach(function(n, f){ ['go', 'back'].forEach(function(d){ var pls = (D[f] && D[f][d]) || [], m = Math.round(tfdLen(pls));
      rows.push([esc(t(floorName(f))), esc(t(d === 'go' ? 'الذهاب' : 'العودة')), pls.length ? pill(nm(pls.length) + ' ' + t('خط') + ' \u00b7 ' + nm(m) + ' ' + t('م'), 'ok') : pill(t('المولَّد من المخطّط'), 'wrn'),
        (tfdMay() ? btn('\u270F ' + t('ارسم على الخريطة'), 'btn-secondary btn-sm', ' data-tfdgo="' + f + '|' + d + '"') + (pls.length ? ' ' + btn('\u2715 ' + t('احذف المرسوم'), 'btn-quiet btn-sm', ' data-tfdclear="' + f + '|' + d + '"') : '') : '')]); }); });
    return card('\u{1F6B6} ' + t('كيف أرسم؟'), '<ol class="hint" style="margin:0;padding-inline-start:18px"><li>' + esc(t('اختر الدور والاتجاه ثم «ارسم على الخريطة» — تُفتَح الخريطةُ وعليها مخيماتُ الدور.')) + '</li><li>' + esc(t('اضغط نقطةً بعد نقطة من أوّل المسار إلى آخره؛ كلُّ نقطةٍ تلتصق بأقرب شارع وتُوصَل بما قبلها على الشوارع وحدَها — لا فوق خيمةٍ ولا بيت.')) + '</li><li>' + esc(t('«تراجع» يرفع آخرَ نقطة، و«احفظ المسار» يثبّته ويعرضه على الأجهزة كلِّها بدل المولَّد. ارسم أكثرَ من خطٍّ للدور نفسِه إن تفرّع.')) + '</li></ol>')
      + cardFlush(t('المسارات'), table(['الدور', 'الاتجاه', 'المرسوم', ''], rows))
      + '<p class="hint">' + esc(t('المولَّدُ من مخطّط الوزارة يبقى حيث لا رسم؛ وما يُرسَم يحلُّ محلَّه للدور والاتجاه نفسَيهما، ويُحذَف من هنا.')) + '</p>';
  } };
PAGE.sel = { m:'الميدان', t:'الطبقات والمحدَّد',
  l:'طبقةُ العمل الحالية، وما حدّدته منها لعملٍ جماعيٍّ عليه.',
  body:function(){
    var head = tabHead('sel'), cur = tabCur('sel');
    if (cur === 'sel') return head + (function(){
    /* كانت ثلاثةَ صفوفٍ مزروعةٍ لا تُزال مهما ضُغط «أزل»، وأزرارٌ بلا خاصيةٍ
       يبتلعها حارسُ الأزرار الميتة فيقول نصَّها. والتحديدُ الحقيقيُّ في `SEL`. */
    var ids = selIds();
    var L = ids.map(siteFind).filter(Boolean);
    var sv = 0, ins = 0, zones = {};
    L.forEach(function(x){
      if (svVisited(STATE.recs[x.id])) sv++;
      var r = STATE.inss[x.id];
      if (r && r.status === 'مُركّب' && r.approved) ins++;
      zones[x.zone] = 1;
    });
    return stats([['نقاط محدَّدة', N(L.length), L.length ? 'acc' : ''],
                  ['منها مُسح', N(sv)],
                  ['منها مُركّب', N(ins)],
                  ['مشاعر', N(Object.keys(zones).length)]])

      + cardFlush('النقاط',
          L.length
            ? table(['المعرّف','الموقع','المشعر','الحالة',''],
                capList(L, 200).map(function(x){
                  var r = STATE.inss[x.id];
                  var st2 = (r && r.status) || (svVisited(STATE.recs[x.id]) ? 'تمت الزيارة' : 'لم يُزر');
                  return [siteIdHtml(x),
                          esc(x.name), esc(t(x.zone)),
                          pill(t(st2), st2 === 'مُركّب' ? 'ok' : 'warn'),
                          btn('أزل','btn-quiet btn-sm',' data-selrm="' + esc(x.id) + '"')];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا نقاطَ محدَّدة — حدّدها من الخريطة أو من قائمة المواقع.')) + '</p>')

      + (L.length
        ? card('عملٌ على المحدَّد',
            '<div class="actions">'
            + btn('أسند لفني','btn-primary',' data-asn="1"')
            + btn('جدولة تركيب','btn-secondary',' data-lasn="ins"')
            + btn('طلب زيارة','btn-secondary',' data-lasn="srv"')
            + (may('exportAll') ? btn('⬇ KMZ للمحدَّد','btn-secondary',' data-kmz="sel"') : '')
            + btn('امسح التحديد','btn-danger',' data-selnone="1"')
            + '</div>')
        : '');
  })();
    return head + (function(){
    return '<div class="chips">' + Object.keys(LAYERS).map(function(k){
        var L = LAYERS[k];
        return '<button type="button" class="chip' + (FIELD_MODE===k?' on':'') + '" data-mode="' + k + '">'
          + L.i + ' ' + esc(t(L.n)) + '</button>';
      }).join('') + '</div>'

      + Object.keys(LAYERS).map(function(k){
          var L = LAYERS[k], S = layerStats(k);
          return card(L.i + ' ' + t(L.n),
            '<p class="hint" style="margin:0 0 12px">' + esc(t(L.d)) + '</p>'
            + '<div class="stats" style="margin:0">'
            +   stat('في الطبقة', N(S.pool))
            +   stat('جاهزٌ للجدولة', N(S.ready), S.ready?'acc':'')
            +   stat('تمّ', N(S.done), 'ok')
            +   stat('مُسند', N(S.asn), S.asn?'wrn':'')
            + '</div>'
            + (S.ptsAll
              ? '<div class="alert info" style="margin:12px 0 0"><span>'
                + esc(t('نقاط الوزن')) + ': ' + esc(t('جاهز')) + ' <b>' + nm(S.ptsReady) + '</b> · '
                + esc(t('منجَز')) + ' <b>' + nm(S.ptsDone) + '</b> · '
                + esc(t('الإجمالي')) + ' <b>' + nm(S.ptsAll) + '</b></span></div>'
              : alertBox('warn','لم تُضبط أوزانُ هذه الطبقة بعد — اكتبها في الإعدادات لتُحسب النقاط.'))
            + (S.pool ? '' : '<p class="hint">' + esc(t(L.empty)) + '</p>'),
            '<div class="actions">'
            + btn('◈ ' + t('افتح الطبقة'),'btn-secondary btn-sm',' data-mode="' + k + '"')
            + (S.ready ? btn('➕ ' + t('إسناد'),'btn-primary btn-sm',' data-lasn="' + k + '"') : '')
            + '</div>');
        }).join('')

      + card('ترتيب الدورة',
          flow(['مسح','تركيب','فك'], FIELD_MODE==='dis'?2:(FIELD_MODE==='install'?1:0))
          + '<p class="hint">' + esc(t('لا تُجدوَل مرحلةٌ قبل ما يسبقها: التركيبُ لا يظهر إلا لما مُسح، والفكُّ لا يظهر إلا لما رُكِّب واعتُمد.')) + '</p>');
  })();
  }};

/* ── صفحة الفك ── */
PAGE.forms = { m:'الميدان', t:'النماذج الميدانية',
  l:'كلُّ ما يُدخَل عن نقطة — مسحُها وتركيبُها وفكُّها وتسليمُها وعناوينُها، وتسجيلُ نقطةٍ جديدة.',
  body:function(){
    var head = tabHead('forms'), cur = tabCur('forms');
    if (cur === 'hand') return head + (function(){
    var S = siteStats();
    var ready = [];
    var ncrOpen = (typeof NCRS !== 'undefined')
      ? NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى' && x.sev === 'جوهري'; }) : [];
    /* «جاهزٌ للتسليم» ما رُكِّب واعتُمد ولم يُسلَّم بعد — لا كلُّ ما رُكِّب */
    var handedL = STATE.sites.filter(function(x){ return handDone(x.id); });
    ready = STATE.sites.filter(handReady);
    var coL = {};
    STATE.sites.forEach(function(x){
      var r = STATE.inss[x.id];
      if (!x.co || !r || r.status !== 'مُركّب' || !r.approved) return;
      var g = coL[x.co] = coL[x.co] || { n:0, done:0 };
      g.n++; if (handDone(x.id)) g.done++;
    });
    var coKeys = Object.keys(coL).sort(function(a, b){ return coL[b].n - coL[a].n; });

    return stats([['جاهزٌ للتسليم', N(ready.length), ready.length ? 'acc' : ''],
                  ['سُلّم', N(handedL.length), handedL.length ? 'ok' : ''],
                  ['بلاغاتٌ تمنع', N(ncrOpen.length), ncrOpen.length ? 'bad' : 'ok'],
                  ['شهور الضمان', N(cfgGet('warranty') || 12)]])

      + (ncrOpen.length
        ? alertBox('error','لا تُسلَّم نقطةٌ عليها بلاغُ عدمِ مطابقةٍ جوهريٌّ مفتوح — '
            + nm(ncrOpen.length) + ' بلاغًا يمنع.')
        : '')

      + card('شروط التسليم',
          table(['الشرط','الحالة'], [
            ['التركيبُ معتمدٌ من المهندس', ready.length ? pill('مستوفٍ','ok') : pill('لم يبدأ','')],
            ['الصورُ موثَّقةٌ قبل وبعد', pill('مستوفٍ','ok')],
            ['السيرياتُ مسجّلةٌ ومطابقة', pill('مستوفٍ','ok')],
            ['لا بلاغَ جوهريًّا مفتوحًا', ncrOpen.length ? pill('غيرُ مستوفٍ','off') : pill('مستوفٍ','ok')],
            ['العناوينُ مشتقّةٌ ومختبرة', pill('يُفحَص بأداة الفحص','warn')]
          ]))

      /* ═══ تسليمُ نقطة ═══ */
      + (may('approve')
        ? card('تسليم نقطة',
            ready.length
              ? '<div class="grid cols-3">'
                + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
                +   '<select id="hoSite">' + ready.slice(0, 400).map(function(x){
                      return '<option value="' + esc(x.id) + '">' + esc(siteKey(x)) + (siteKey(x) !== x.id ? ' (' + esc(x.id) + ')' : '') + ' \u2014 '
                        + esc((x.name || '').slice(0, 30)) + '</option>'; }).join('') + '</select></div>'
                + '<div class="field"><label>' + esc(t('المستلِم عن العميل')) + ' <span class="req">*</span></label>'
                +   '<input id="hoTo" dir="auto" placeholder="' + esc(t('الاسم والصفة')) + '"></div>'
                + '<div class="field"><label>' + esc(t('ملاحظات')) + '</label>'
                +   '<input id="hoNote" dir="auto"></div>'
                + '</div>'
              : '<p class="hint" style="margin:0">' + esc(t('لا نقطةَ جاهزةً للتسليم — تُعتمَد التركيباتُ أولًا في «التدقيق الهندسي».')) + '</p>',
            ready.length ? btn('\u{1F91D} ' + t('حرّر محضر التسليم'),'btn-primary btn-sm',' data-hogo="1"') : '')
        : '')

      /* ═══ المحاضر: نقطةً نقطة، وشركةً بكلِّ نقاطها ═══ */
      + card('محضر تسليم',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('محضر نقطة')) + '</label>'
          +   '<select id="hoDocSite">'
          +   (handedL.concat(STATE.sites.filter(function(x){
                 var r = STATE.inss[x.id];
                 return r && r.status === 'مُركّب' && r.approved && !handDone(x.id); })))
                .slice(0, 400).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (HO_DOC === x.id ? ' selected' : '') + '>'
                    + esc(siteKey(x)) + (handDone(x.id) ? ' \u2705' : '') + '</option>'; }).join('')
          +   '</select></div>'
          + '<div class="field"><label>' + esc(t('محضر شركة')) + '</label>'
          +   '<select id="hoDocCo">' + coKeys.map(function(c){
                return '<option value="' + esc(c) + '"' + (HO_CO === c ? ' selected' : '') + '>'
                  + esc(c.length > 34 ? c.slice(0, 33) + '\u2026' : c)
                  + ' \u00b7 ' + nm(coL[c].done) + '/' + nm(coL[c].n) + '</option>'; }).join('')
          +   '</select></div>'
          + '</div>',
          btn('\u{1F4C4} ' + t('اعرض محضر النقطة'),'btn-secondary btn-sm',' data-hodoc="site"')
          + btn('\u{1F3E2} ' + t('اعرض محضر الشركة'),'btn-secondary btn-sm',' data-hodoc="co"')
          + (HO_DOC || HO_CO ? btn('\u{1F5A8} ' + t('طباعة'),'btn-quiet btn-sm',' data-print="1"') : ''))

      + (HO_DOC
        ? (function(){
            var sx = siteFind(HO_DOC);
            var co = sx && sx.co;
            return card('', handDocSite(HO_DOC)
              + '<div class="actions" style="margin-top:12px">'
              + btn('\u2B07 ' + t('إكسل — المحضر'),'btn-secondary btn-sm',' data-xls="hodoc"')
              + btn('\u{1F5A8} PDF','btn-secondary btn-sm',' data-print="1"')
              + (co && coTelOf(co)
                  ? btn('\u{1F4AC} ' + t('أبلغ') + ' ' + esc(co.length > 22 ? co.slice(0, 21) + '\u2026' : co),
                        'btn-quiet btn-sm',' data-wasend="hand|' + esc(co) + '"')
                  : '')
              + '</div>');
          })()
        : '')
      /* الزرُّ في جسم البطاقة لا في رأسها: البطاقةُ بلا عنوانٍ تُسقِط الرأسَ
         ومعه ما فيه — فيختفي الزرُّ ولا يشكو أحد. */
      + (HO_CO
        ? card('', handDocCo(HO_CO)
            + '<div class="actions" style="margin-top:12px">'
            + (coTelOf(HO_CO)
                ? btn('\u{1F4AC} ' + t('أبلغ الشركة على واتساب'),'btn-primary btn-sm',' data-wasend="hand|' + esc(HO_CO) + '"')
                : '<span class="hint" style="margin:0">' + esc(t('لا جوالَ لهذه الشركة — احفظه في «الشركات ← إشعار الشركات»')) + '</span>')
            + '</div>')
        : '')

      + (handedL.length
        ? cardFlush(t('ما سُلِّم') + ' — ' + nm(handedL.length),
            table(['النقطة','رقم المحضر','المستلِم','التاريخ','الضمان ينتهي'],
              capList(handedL, 200).map(function(x){
                var h = handOf(x.id);
                var end = new Date(h.at + (h.warranty || 12) * 30 * 86400000);
                return [siteIdHtml(x),
                        '<span class="num">' + esc(h.no) + '</span>',
                        esc(h.to), '<span class="num">' + esc(fmtDate(h.at)) + '</span>',
                        '<span class="num">' + esc(fmtDate(end)) + '</span>'];
              })))
        : '')

      + card('الضمان',
          '<div class="field" style="max-width:280px;margin:0"><label>'
          + esc(t('مدّة الضمان')) + ' (' + esc(t('شهر')) + ')</label>'
          + cfgInput('warranty', undefined, { dec:0 }) + '</div>'
          + '<p class="hint">' + esc(t('تبدأ من تاريخ التسليم الابتدائي — وفيها يُستبدل التالفُ بلا كلفةٍ على العميل.')) + '</p>')

      + '<p class="hint">' + esc(t('الفكُّ إرجاعُ ما سُلِّم: لا تظهر نقطةٌ في طبقة الفك قبل تحرير محضر تسليمها.')) + '</p>';
  })();
    if (cur === 'disp2') return head + (function(){
    var ready = (STATE.sites || []).filter(function(x){
      return insDone(x.id) && (typeof handDone !== 'function' || handDone(x.id)) && !disDone(x.id);
    });
    var done = (STATE.sites || []).filter(function(x){ return disDone(x.id); });
    var sel = DISF.site && siteFind(DISF.site);
    var ins = sel ? (STATE.inss[sel.id] || {}) : null;
    var ed = may('edit');
    return stats([['جاهزٌ للفك', N(ready.length), ready.length ? 'acc' : 'ok'],
                  ['فُكَّ', N(done.length), 'ok'],
                  ['مُسنَدٌ للفك', N((STATE.sites || []).filter(function(x){ return taskKindOf(x.id, 'dis'); }).length), 'wrn']])

      + (ed
        ? card('\u{1F9E9} ' + t('تسجيلُ فكّ') + ' (UR)',
            '<div class="field"><label>' + esc(t('النقطة')) + ' <span class="req">*</span></label>'
            + '<select data-dissite="1"><option value="">— ' + esc(t('اختر نقطةً سُلِّمت ولم تُفَكّ')) + ' —</option>'
            +   capList(ready, 300).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (DISF.site === x.id ? ' selected' : '') + '>'
                    + esc(x.id + ' \u00b7 ' + (x.name || '').slice(0, 30)) + '</option>'; }).join('')
            + '</select></div>'
            + (sel
              ? '<div class="pop-rows"><div><span class="k">' + esc(t('الشركة')) + '</span><span>' + esc(coName(sel.co) || '\u2014') + '</span></div>'
                + '<div><span class="k">' + esc(t('المشعر')) + '</span><span>' + esc(t(sel.zone)) + '</span></div></div>'
                + cardFlush(t('العُهدةُ المُرجَعة'),
                    table(['الصنف','العدد','حالتُه'],
                      Object.keys(ins.parts || {}).map(function(k){
                        return [esc(itemName(k)), N(ins.parts[k]),
                          '<select data-discond="' + esc(k) + '">' + DIS_COND.map(function(c){
                            return '<option value="' + esc(c) + '"' + ((DISF.items[k] || 'سليم') === c ? ' selected' : '') + '>'
                              + esc(t(c)) + '</option>'; }).join('') + '</select>'];
                      })))
                + '<p class="hint">' + esc(t('ما سلِم يعود مخزونًا وما تلِف يُشطَب — والعهدةُ تُقفَل بالحالة لا بالعدد.')) + '</p>'
                + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label>'
                +   '<input data-disnote="1" value="' + esc(DISF.note) + '" dir="auto"></div>'
                + photoBox('after', DISF.photos, 'disph', 'صورةُ الموضع بعد الفكّ')
              : '<p class="hint">' + esc(t('لا يُفَكُّ إلا ما رُكِّب واعتُمد وسُلِّم بمحضر.')) + '</p>'),
            sel ? btn('\u{1F4E6} ' + t('سجّل الفكَّ وأرجِع العُهدة'),'btn-primary btn-sm',' data-dissave="1"') : '')
        : '')

      + (done.length
        ? cardFlush(t('ما فُكَّ') + ' \u2014 ' + nm(done.length),
            table(['النقطة','التاريخ','بواسطة','القطع'],
              done.slice(0, 60).map(function(x){
                var r = STATE.diss[x.id];
                var bad = Object.keys(r.items || {}).filter(function(k){ return r.items[k].cond !== 'سليم'; }).length;
                return [siteIdHtml(x),
                        '<span class="num">' + esc(fmtDate(r.at)) + '</span>',
                        esc(dispName(r.by)),
                        N(Object.keys(r.items || {}).length) + (bad ? ' \u00b7 ' + pill(nm(bad) + ' ' + t('غير سليم'), 'off') : '')];
              })))
        : '');
  })();

    if (cur === 'maintForm') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الصيانة'),'btn-secondary btn-sm',' data-xls="maints"') + '</div>' + (function(){
    var pool = (STATE.sites || []).filter(function(x){ return insDone(x.id); });
    var asn  = pool.filter(function(x){ return taskKindOf(x.id, 'maint'); });
    var sel = MNTF.site && siteFind(MNTF.site);
    var ed = may('edit');
    var hist = [];
    Object.keys(STATE.maints || {}).forEach(function(id){
      maintList(id).forEach(function(r){ hist.push({ id:id, r:r }); });
    });
    hist.sort(function(a, b){ return b.r.at - a.r.at; });
    return stats([['قابلٌ للصيانة', N(pool.length), 'acc'],
                  ['مُسنَدٌ للصيانة', N(asn.length), asn.length ? 'wrn' : 'ok'],
                  ['زياراتُ صيانةٍ سُجِّلت', N(hist.length), hist.length ? 'ok' : '']])

      + (ed
        ? card('\u{1F6E1} ' + t('تسجيلُ صيانة') + ' (MR)',
            '<div class="field"><label>' + esc(t('النقطة')) + ' <span class="req">*</span></label>'
            + '<select data-mntsite="1"><option value="">— ' + esc(t('اختر نقطةً مُركّبةً معتمدة')) + ' —</option>'
            +   capList((asn.length ? asn : pool), 300).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (MNTF.site === x.id ? ' selected' : '') + '>'
                    + esc(x.id + ' \u00b7 ' + (x.name || '').slice(0, 30)) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('العطل')) + ' <span class="req">*</span></label>'
            +   '<input data-mntfault="1" value="' + esc(MNTF.fault) + '" dir="auto" placeholder="' + esc(t('ما الذي وُجد؟')) + '"></div>'
            + '<div class="field"><label>' + esc(t('ما عُمل')) + ' <span class="req">*</span></label>'
            +   '<input data-mntact="1" value="' + esc(MNTF.act) + '" dir="auto" placeholder="' + esc(t('الإجراءُ المتَّخَذ')) + '"></div>'
            + (sel
              ? cardFlush(t('قطعٌ استُبدلت'),
                  table(['الصنف','العدد'],
                    itemsList().slice(0, 24).map(function(i){
                      return [esc(i.name),
                        '<input type="number" min="0" value="' + esc(String(cfgN(MNTF.parts[i.code]))) + '" data-mntpart="' + esc(i.code) + '" style="width:78px">'];
                    })))
                + '<p class="hint">' + esc(t('ما استُبدل يُخصَم من العُهدة كما يُخصَم في التركيب.')) + '</p>'
                + photoBox('fix', MNTF.photos, 'mntph', 'صورةٌ بعد الإصلاح')
              : '')
            + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label>'
            +   '<input data-mntnote="1" value="' + esc(MNTF.note) + '" dir="auto"></div>',
            btn('\u{1F6E1} ' + t('سجّل الصيانة'),'btn-primary btn-sm',' data-mntsave="1"'))
        : '')

      + (hist.length
        ? cardFlush(t('سجلُّ الصيانة') + ' \u2014 ' + nm(hist.length),
            table(['النقطة','التاريخ','العطل','ما عُمل','بواسطة',''],
              hist.slice(0, 60).map(function(h){
                return ['<span class="num">' + esc(h.id) + '</span>',
                        '<span class="num">' + esc(fmtDate(h.r.at)) + '</span>',
                        esc(h.r.fault.slice(0, 40)), esc(h.r.act.slice(0, 40)), esc(dispName(h.r.by)),
                        buyMayEdit() || rankOf(ROLE) >= rankOf('engineer') ? btn('\u2715','btn-quiet btn-sm',' data-mntdel="' + esc(h.id + '|' + h.r.at) + '" title="' + esc(t('حذف')) + '"') : ''];   /* (V29.5) */
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا زيارةَ صيانةٍ بعد — تُسجَّل هنا فتُغلَق مهمةُ MR ويبقى للنقطة تاريخُ خدمة.')) + '</p>'));
  })();

    if (cur === 'ips') return head + (function(){
    var L = ipRows(), all = (STATE.sites || []).filter(function(x){ return x.net; }).length;
    var missBy = {}, heldBy = {}, heldN = 0;
    (STATE.sites || []).forEach(function(x){
      if (x.net) return;
      /* المفتاحُ مركَّبٌ بالجمع فلا يبلغه القاموس — يُخزَّن جزآه ويُترجَم كلٌّ
         على حدة عند العرض */
      var k = x.zone + '\u0000' + x.type;
      if (ipPreset(x)){ heldBy[k] = (heldBy[k] || 0) + 1; heldN++; return; }
      missBy[k] = (missBy[k] || 0) + 1;
    });
    var heldKeys = Object.keys(heldBy).sort(function(a, b){ return heldBy[b] - heldBy[a]; });
    /* ═══ ما له عنوانٌ — بالمشعر والنوع ═══
       سُئل: «المفروض ٧٤٤ نقطةً لها عنوان». والعددُ لا يُناقَش بالذاكرة:
       يُعرَض ما هو كائنٌ مفصَّلًا، فيُقارَن بالمتوقَّع ويُعرَف أين الفرق.
       (نسخةُ ١٣٫٩٩ فُحصت: العمودُ العشرون فيها يحمل ٥٤٦ بادئةً كلُّها
       مخيماتُ منى، ولا بادئةَ فيها لممرٍّ ولا قارئٍ ولا كاميرا.) */
    var haveBy = {};
    (STATE.sites || []).forEach(function(x){
      if (!x.net) return;
      var k = x.zone + '\u0000' + x.type;
      haveBy[k] = (haveBy[k] || 0) + 1;
    });
    var haveKeys = Object.keys(haveBy).sort(function(a, b){ return haveBy[b] - haveBy[a]; });
    var missKeys = Object.keys(missBy).sort(function(a, b){ return missBy[b] - missBy[a]; });
    return stats([['نقاطٌ لها شبكة', N(all), all ? 'ok' : 'wrn'],
                  ['بلا عنوان', N((STATE.sites || []).length - all),
                   (STATE.sites || []).length - all ? 'wrn' : 'ok'],
                  ['عنوانُها في الميدان', N(heldN), heldN ? 'acc' : ''],
                  ['معروض', N(L.length)]])

      + (haveKeys.length
        ? card('\u2705 ' + t('ما له عنوان — بالمشعر والنوع'),
            table(['المشعر والنوع','له عنوان'],
              haveKeys.slice(0, 20).map(function(k){
                var pr = k.split('\u0000');
                return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(haveBy[k])];
              }))
            + '<p class="hint" style="margin:8px 0 0">'
            + esc(t('العددُ يُقارَن بالمتوقَّع هنا لا بالذاكرة. وما ورثه النظامُ من النسخة السابقة خمسُمئةٍ وستةٌ وأربعون بادئةً كلُّها مخيماتُ منى — لا بادئةَ فيها لممرٍّ ولا قارئٍ ولا كاميرا؛ وما زاد عنها أُدخل بعدها.')) + '</p>')
        : '')

      /* ما رُكِّب سابقًا عنوانُه قائمٌ في جهازه — لا يُخترَع له بديل */
      /* بادئةٌ واحدةٌ على نقطتين: خطأٌ يمنع الجهازين من العمل معًا ولا يظهر
         إلا حين يسقط أحدُهما. يُكشَف هنا ولا يُصلَح صامتًا — تصحيحُه قرارُ
         مهندسٍ يعرف أيَّ الجهازين يبقى على عنوانه. */
      + (function(){
          var seen = {}, dup = [];
          (STATE.sites || []).forEach(function(x){
            if (!x.net) return;
            if (seen[x.net]) dup.push([x.net, seen[x.net], x.id]);
            else seen[x.net] = x.id;
          });
          if (!dup.length) return '';
          return card('\u26A0 ' + t('بادئةٌ واحدةٌ على أكثرَ من نقطة'),
            '<p class="hint" style="margin:0 0 10px">'
            + esc(t('عنوانان متطابقان على الشبكة يمنعان الجهازين من العمل معًا، ولا يظهر العطلُ إلا حين يسقط أحدُهما. صحّح البادئةَ في الجدول أدناه — لا يُصلِحها النظامُ صامتًا لأن اختيارَ من يبقى على عنوانه قرارُ مهندس.')) + '</p>'
            + table(['البادئة','النقطة الأولى','النقطة الثانية'],
                dup.slice(0, 30).map(function(r){
                  return ['<span class="num">' + esc(r[0]) + '</span>',
                          '<span class="num">' + esc(r[1]) + '</span>',
                          '<span class="num">' + esc(r[2]) + '</span>'];
                }))
            + (dup.length > 30 ? '<p class="hint" style="margin:8px 0 0">' + esc(t('و')) + ' '
                + nm(dup.length - 30) + ' ' + esc(t('أخرى')) + '</p>' : ''));
        })()

      + (heldN
        ? card('\u{1F517} ' + t('مُركّبةٌ سابقًا — عنوانُها يُقرأ من الميدان'),
            '<p class="hint" style="margin:0 0 10px">'
            + esc(t('هذه النقاطُ رُكِّبت في موسمٍ ماضٍ (إعادةُ تركيبٍ أو ترقيةٌ أو تفعيل)، وعناوينُها مكتوبةٌ في أجهزتها فعلًا. لا يُولَّد لها عنوانٌ يخالف الواقع: يقرؤه الفنيُّ من الراوتر ويكتبه في «العنوان القائم» داخل نموذج المسح، فيُحفَظ على النقطة.')) + '</p>'
            + table(['المشعر والنوع','بانتظار قراءة الميدان'],
                heldKeys.slice(0, 20).map(function(k){
                  var pr = k.split('\u0000');
                  return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(heldBy[k])];
                })))
        : '')

      /* الناقصُ بالمشعر والنوع: كان يُقال «بلا عنوان ٩٠٠» ولا يُعرف أينها —
         فتُعنوَن المخيماتُ وتُنسى الممرات. */
      + (missKeys.length
        ? card('ما ينقصه عنوان — بالمشعر والنوع',
            table(['المشعر والنوع','بلا عنوان'],
              missKeys.slice(0, 20).map(function(k){
                var pr = k.split('\u0000');
                return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(missBy[k])];
              }))
            + '<p class="hint" style="margin:8px 0 0">'
            + esc(t('التوليدُ يملأ الناقصَ وحدَه: لكلِّ مشعرٍ نطاقُه ولكلِّ نوعٍ شريحتُه، وما له بادئةٌ لا يُمَسّ.')) + '</p>',
            may('edit')
              ? btn('\u26A1 ' + t('ولّد البادئات الناقصة'),'btn-primary btn-sm',' data-ipfill="1"')
                + btn('\u26A1 ' + t('الممرات فقط'),'btn-secondary btn-sm',' data-ipfill="ممر"')
              : '')
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('كلُّ نقطةٍ لها بادئةُ شبكة.')) + '</p>'))

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="ipQ" data-ipq="1" value="' + esc(IP_Q) + '" placeholder="'
      +     esc(t('ابحث بالمعرّف أو الاسم أو البادئة')) + '" dir="auto">'
      + '</form>'

      /* إضافةُ عنوانٍ لنقطةٍ بمعرّفها: كان الطريقُ الوحيدُ الاستيرادَ من ملف —
         ونقطةٌ واحدةٌ لا تستحق ملفًّا. */
      + (may('edit')
          ? card('إضافة عنوان لنقطة',
              '<div class="grid cols-2">'
              + '<div class="field"><label>' + esc(t('معرّف النقطة')) + ' <span class="req">*</span></label>'
              +   '<input id="ipAddId" dir="ltr" placeholder="NSK-MIN-CMP-0001" list="ipSiteList">'
              +   '<datalist id="ipSiteList">' + (STATE.sites || []).slice(0, 400).map(function(x){
                    return '<option value="' + esc(x.id) + '">'; }).join('') + '</datalist></div>'
              + '<div class="field"><label>' + esc(t('البادئة')) + ' <span class="req">*</span></label>'
              +   '<input id="ipAddNet" dir="ltr" placeholder="10.20.30"></div>'
              + '</div>'
              + '<p class="hint">' + esc(t('تُشتقّ العناوينُ الثلاثةُ من البادئة — .1 راوتر و.2 قارئ و.3 كاميرا — وتُعدَّل من الجدول إن اختلفت.')) + '</p>',
              btn('➕ أضِف','btn-primary btn-sm',' data-ipadd="1"'))
          : '')

      + cardFlush(t('العناوين') + ' — ' + nm(L.length),
          L.length
            ? table(['المعرّف','الموقع','البادئة','الراوتر','القارئ','الكاميرا',''],
                capList(L, 200).map(function(x){
                  return [siteIdHtml(x),
                          esc(x.name),
                          '<input value="' + esc(x.net || '') + '" data-ipn="' + esc(x.id) + '" dir="ltr" placeholder="10.20.30">',
                          '<input value="' + esc(x.ipRtr || '') + '" data-ipr="' + esc(x.id) + '" dir="ltr" placeholder=".1">',
                          '<input value="' + esc(x.ipRdr || '') + '" data-ipd="' + esc(x.id) + '" dir="ltr" placeholder=".2">',
                          '<input value="' + esc(x.ipCam || '') + '" data-ipc="' + esc(x.id) + '" dir="ltr" placeholder=".3">',
                          may('edit') ? btn('مسح','btn-quiet btn-sm',' data-ipclr="' + esc(x.id) + '"') : ''];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا عناوينَ بعد — استوردها من «التصدير والاستيراد» بنوع «عناوين الشبكة».')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ips"') : '')

      + '<p class="hint">' + esc(t('البادئةُ تُكتَب بلا نقطةٍ أخيرة، والعناوينُ الثلاثةُ تُكتَب بنقطةٍ أولى — فيُقرأ العنوانُ كاملًا بضمّهما.')) + '</p>';
  })();
    if (cur === 'svForm') return head + (function(){
    var s = formSite();
    if (!s) return formPickHtml('survey');   /* (V38.68) */
    var done = !!STATE.recs[s.id];
    /* زيارةٌ سُجِّلت بإضافة النقطة ولم تُستكمَل بياناتُها ليست «تصويبًا» (V17.57) */
    var fresh = done && STATE.recs[s.id].src === 'newsite' && !STATE.recs[s.id].mount;
    return (fresh ? alertBox('info','سُجِّلت الزيارةُ بإضافة النقطة — أكمل بياناتِ المسح؛ فلا تُعتمَد قبل استكمالها.')
            : (done ? alertBox('success','هذا الموقع مُسِح — ما تكتبه الآن تصويبٌ يُسجَّل باسمك.') : ''))
      + svCopyBar(s)   /* (V29.4) */
      + card('الموقع',
          '<div class="inline-form" style="margin:0 0 12px">'
          + '<input type="search" id="fSiteQ" placeholder="' + esc(t('ابحث بالمعرّف أو الشاخص')) + '" dir="auto">'
          + btn('بحث','btn-secondary btn-sm',' data-fsq="1"') + '</div>'
          + '<div class="pop-rows" style="margin:0">'
          + (siteKey(s) !== s.id ? '<div><span class="k">' + esc(t(siteKeyLabel(s))) + '</span><span class="num">' + bdi(siteKey(s)) + '</span></div>' : '') + '<div><span class="k">' + esc(t('المعرّف')) + '</span><span class="num">' + esc(s.id) + '</span></div>'
          + '<div><span class="k">' + esc(t('الاسم')) + '</span><span>' + esc(s.name) + '</span></div>'
          + '<div><span class="k">' + esc(t('المشعر')) + '</span><span>' + esc(t(s.zone)) + ' \u00b7 ' + esc(t(s.type)) + '</span></div>'
          + (s.sign ? '<div><span class="k">' + esc(t('الشاخص')) + '</span><span class="num">' + esc(s.sign) + '</span></div>' : '')
          + (s.work ? '<div><span class="k">' + esc(t('وجه العمل')) + '</span><span>' + esc(t(s.work)) + '</span></div>' : '')
          + (s.co   ? '<div><span class="k">' + esc(t('الشركة')) + '</span><span>' + esc(s.co) + '</span></div>' : '')
          + '</div>'
          + '<p class="hint">' + esc(t('فيها خطأ؟ اطلب تصحيحًا — يعتمده المهندس.')) + '</p>',
          btn('طلب تصويب','btn-quiet btn-sm',' data-fix="' + esc(s.id) + '"'))
      + fixCard(s.id)

      + card('الوصول',
          /* (V37.1) قرارُ المالك: «تم الوصول» أو سببٌ واحدٌ من خمسة — من قائمةٍ لا بالكتابة؛ وحالةُ الوصول القديمة تُشتقّ منه */
          (FORM.access && FORM.access !== 'تم الوصول' && !FORM.why ? (FORM.why = visitWhy({ access:FORM.access, note:FORM.note }) || '', '') : '')
          + '<div class="chips" style="margin:0">'
          + '<button type="button" class="chip' + (FORM.access === 'تم الوصول' ? ' on' : '') + '" data-acc="تم الوصول">' + esc(t('تم الوصول — مُسح')) + '</button>'
          + whyList().filter(function(o){ return !o.off || FORM.why === o.k; }).map(function(o){ return '<button type="button" class="chip' + (FORM.access !== 'تم الوصول' && FORM.why === o.k ? ' on' : '') + '" data-why="' + o.k + '">' + esc(t(o.n)) + '</button>'; }).join('') + '</div>'
          + (FORM.access === 'تم الوصول' ? ''
             : '<p class="hint" style="margin:10px 0 0">'
               + esc(t('زيارة بلا مسح — اختر السبب؛ والملاحظةُ تفصيلٌ اختياري. لا تُطلَب القياسات.'))
               + (FORM.why && whyOf(FORM.why) && whyOf(FORM.why).photo ? ' <b>' + esc(t('صورةُ إثباتٍ مطلوبة (اللقطة العامة).')) + '</b>' : '')
               + '</p>'))

      + card('ما يُجمَع في الموقع',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نوع التركيب')) + ' <span class="req">*</span></label>'
          + '<select data-form="mount">' + ['','عمود','جدار','سور','هيكل قائم'].concat(FORM.mount === 'لوحة استرشادية' ? ['لوحة استرشادية'] : []).map(function(o){   /* (V38.25) اللوحةُ الاسترشاديةُ انتقلت إلى «موقع النقطة» — وما حُفظ بها يبقى ظاهرًا */
              return '<option value="' + esc(o) + '"' + (FORM.mount===o?' selected':'') + '>' + esc(t(o)) + '</option>'; }).join('')
          + '</select></div>'
          /* (V38.23) «موقع النقطة» اختيارٌ صريحٌ بدل أن يُستنتَج من الكلام: تحت كوبري · عند نفق — حقلٌ مستقلٌّ عن «نوع التركيب»
             لأن النقطةَ قد تكون على جدارٍ وتحت كوبري معًا. منه يُبنى «حسب الموقع» في التحديات والمعوقات */
          + '</div>'
          /* (V38.25) «موقع النقطة» شرائحُ تُختار (أكثرُ من واحد) — للممرات والجمرات وكاميرات الوزارة وحدَها */
          + (locApplies(s) ? '<div class="field" style="margin:10px 0 0"><label>' + esc(t('موقع النقطة')) + ' <span class="hint" style="margin:0;font-weight:400">' + esc(t('اختر كل ما ينطبق')) + '</span></label>'
              + '<div class="chips" style="margin:6px 0 0">' + locOpts().map(function(o){ var L = locList(FORM.loc);
                  return '<button type="button" class="chip' + (L.indexOf(o) > -1 ? ' on' : '') + '" data-svloc="' + esc(o) + '">' + esc(t(o)) + '</button>'; }).join('') + '</div></div>' : '')
          + '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('مصدر الكهرباء')) + ' <span class="req">*</span></label>'
          + '<select data-form="power">' + ['','شبكة','مولد','طاقة شمسية','لا يوجد'].map(function(o){
              return '<option value="' + esc(o) + '"' + (FORM.power===o?' selected':'') + '>' + esc(t(o)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('ارتفاع التركيب')) + ' (' + t('م') + ')</label>'
          + '<input type="number" step="0.5" min="0" data-form="height" value="' + esc(FORM.height) + '"></div>'
          + '<div class="field"><label>' + esc(t('طول الكابل المطلوب')) + ' (' + t('م') + ')</label>'
          + '<input type="number" min="0" data-form="cable" value="' + esc(FORM.cable) + '"></div>'
          + '</div>'
          /* (V38.21) «خلّيها أسهل وواضحة وصريحة»: عنوانٌ يقول ماذا يُفعَل، و«أخرى» مميّزة، وسطرٌ يقول متى تُختار */
          + '<div class="field"><label>' + esc(t('تحديات التركيب')) + ' <span class="req">*</span> <span class="hint" style="margin:0;font-weight:400">' + esc(t('اختر واحدًا أو أكثر')) + '</span></label>'
          + '<div class="chips" style="margin:6px 0 0">'
          + ((FORM.chals = chalsToCats(FORM.chals, FORM.chal_note || FORM.note)), chalNames()).map(function(c){   /* (V37.1) الفئاتُ الثماني — اختيارٌ لا كتابة */
              return '<button type="button" class="chip' + (FORM.chals.indexOf(c)>-1?' on':'')
                + '" data-chal="' + esc(c) + '"' + (c === chalOther() ? ' style="border-style:dashed"' : '') + '>' + esc(t(c)) + '</button>';
            }).join('') + '</div>'
            + '<p class="hint" style="margin:6px 0 0">' + esc(t('التحدي مش في القائمة؟ اختر «أخرى» واكتب وصفه تحت.')) + '</p></div>'
          /* (V38.20) وصفُ التحدي تحت التحديات مباشرةً متى اختير تحدٍّ — كان في «تفاصيل إضافية» المطويّة فلا يراه الفنيّ */
          + (FORM.chals.some(function(c){ return c && c !== 'لا توجد تحديات'; })
              ? '<div class="field"><label>' + esc(t('وصف التحدي بالتفصيل')) + ' '
                + (FORM.chals.indexOf(chalOther()) > -1 ? '<span class="req">*</span> <span class="hint" style="margin:0;font-weight:400">' + esc(t('مطلوب مع «أخرى»')) + '</span>' : '<span class="hint" style="margin:0;font-weight:400">' + esc(t('اختياري')) + '</span>')
                + '</label><textarea data-form="chal_note" rows="2" placeholder="'
                + esc(t('مثال: الجدار مائل ولا يتحمّل الحامل — نحتاج عمودًا بارتفاع ٣ م')) + '">' + esc(FORM.chal_note || '') + '</textarea></div>' : '')
          + '<div class="field"><label>' + esc(t('ملاحظات (اختيارية)')) + '</label>'
          + '<textarea rows="3" data-form="note">' + esc(FORM.note) + '</textarea></div>')

      + svExtra(s)

      + photoCard.apply(null, SV_PHOTOS)

      + card('', '<div class="actions">'
          + btn('حفظ المسح','btn-primary',' data-svsave="1"')
          + btn('حفظ ومتابعة للتالي','btn-secondary',' data-svnext="1"')
          + '</div>'
          + '<p class="hint">' + esc(t('يُحفظ على جهازك فورًا ويُرفع حين تعود الشبكة — لا تنتظرها.')) + '</p>');
  })();
    if (cur === 'insForm') return head + (function(){
    var s = formSite();
    if (!s) return formPickHtml('install');   /* (V38.68) */
    var zone = siteZone(s);
    /* (V37.90) قطعُ النوع كلُّها — كانت تُعرض ذاتُ الوزن وحدَها، وبلا أوزانٍ أوّلُ ثمانٍ فقط فلا تُسجَّل البقية */
    var parts = itemsList().filter(function(i){ return i.z === zone && i.name; });
    var rec = STATE.recs[s.id];
    var pre47 = insPrefill47(s, parts);   /* (V37.90) أجهزةُ ١٤٤٧ نفسُها هذا الموسم */

    return (!rec ? alertBox('warn','هذا الموقع لم تتم زيارتُه بعد — التركيبُ قبل الزيارة يُخلّ بالترتيب.') : '')
      + (pre47 ? alertBox('info', t('عُبّئت من بيانات موسم ١٤٤٧') + ': ' + pre47 + ' \u2014 ' + t('راجعها على الأجهزة قبل الحفظ')) : '')
      + card('حالة التركيب',
          '<div class="chips" style="margin:0">'
          + ['قيد التركيب','مُركّب','متعذّر'].map(function(c){
              return '<button type="button" class="chip' + (FORM.status===c?' on':'')
                + '" data-fst="' + esc(c) + '">' + esc(t(c)) + '</button>';
            }).join('') + '</div>'
          + '<p class="hint">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' \u00b7 ' + esc(s.id) : '') + ' — ' + esc(s.name) + '</p>')

      + cardFlush(t('القطع المستهلكة') + ' — ' + nm(parts.length),
          table(['القطعة','النقاط','المستهلك','السيريال'],
            parts.map(function(i){
              /* (V37.90) القطعةُ كائنٌ {code,name} منذ V14.27 — كانت تُقرأ i[1] وi[2] فتخرج الأسماءُ فارغةً
                 وكلُّ الكميات والسيريالات بمفتاحٍ واحد «undefined»، فلا قطعةَ تُحفَظ باسمها ولا نقاط */
              return [esc(i.name), N(itPts(i.code)),
                      '<input type="number" min="0" data-part="' + esc(i.code) + '" value="'
                        + (FORM.parts[i.code] || 0) + '">',
                      '<input dir="ltr" placeholder="SN-…" data-serial="' + esc(i.code) + '" value="'
                        + esc(FORM.serials[i.code] || '') + '"> ' + scanBtn(i.code)];
            })),
          '<span class="hint" style="margin:0">' + esc(t('مجموع النقاط'))
          + ' <b>' + nm(formPts()) + '</b></span>')

      + photoCard(['before','قبل التركيب',1], ['after','بعد التركيب',1],
                  ['plate','لوحة رقم الموقع',0],
                  ['panel','لوحة الأجهزة',0], ['serial','السيريال',0])

      + card('الشبكة',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('بادئة الشبكة')) + '</label>'
          + '<input dir="ltr" data-form="prefix" placeholder="10.20.30" value="' + esc(FORM.prefix) + '"></div>'
          + '<div class="field"><label>' + esc(t('العناوين المشتقّة')) + '</label>'
          + '<input dir="ltr" readonly value="' + esc(ipsOf(FORM.prefix)) + '"'
          + ' style="background:var(--surface-2);color:var(--ink-soft)"></div>'
          + '</div>'
          + '<p class="hint">' + esc(t('‎.1 راوتر · ‎.2 قارئ · ‎.3 كاميرا — تُشتقّ من البادئة ولا تُكتب.')) + '</p>')

      + card('', '<div class="actions">'
          + '<div class="field" style="max-width:220px"><label>' + esc(t('عدد الأطقم المركّبة')) + '</label>'
          + '<input type="number" min="0" data-form="kits_done" value="' + esc(FORM.kits_done || '') + '"></div>'
          + btn('إتمام التركيب','btn-primary',' data-inssave="1"')
          + btn('حفظ مسودّة','btn-secondary',' data-insdraft="1"')
          + '</div>'
          + '<p class="hint">' + esc(t('لا تُحسَب النقطة مُركّبةً حتى يعتمد المهندس قطعها وأرقامها التسلسلية في التدقيق الهندسي.')) + '</p>');
  })();
    if (cur === 'newsite') return head + (NEWSITE.orph ? alertBox('info', t('تُضاف نقطةُ ملف ١٤٤٧') + ': ' + NEWSITE.orph + ' \u2014 ' + t('وتُحمَل إليها بياناتُ أجهزتها')) + '<div class="actions" style="margin:0 0 8px">' + btn('\u2715 ' + t('ليست من الملف'), 'btn-quiet btn-sm', ' data-orcancel="1"') + '</div>' : '') + (function(){   /* (V37.92) */
    if (NS_CO_OPEN) return nsCoCard();

    var has  = NEWSITE.lat && NEWSITE.lng;
    var minProp = ROLE === 'viewer', office = nsOffice() || minProp;   /* (V37.71) نموذجُ الوزارة: مقترحةٌ بلا سببٍ ولا تحدياتٍ ولا صور */
    var near = nsNear();
    var camp = NEWSITE.type === 'مخيم';

    /* اختِير الموضعُ على الخريطة؟ فلا حاجةَ لالتقاط الموضع (V17.44) */
    var head = !MYPOS && !has && !NEWSITE.byMap
      ? alertBox('warn','لم يُلتقَط موضعُك بعد — اضغط «التقط موضعي» قبل تعبئة النموذج.')
      : (near && near.length
          ? alertBox('warn','انتبه — يوجد مواقعُ مسجّلةٌ قريبةٌ منك. أغلبُ حالات «غير موجود» وقوفٌ بجانب مسجَّل، فراجعها قبل الإنشاء.')
            + card('الأقربُ إليك الآن',
                near.map(function(x){
                  return '<button type="button" class="btn btn-quiet" data-site="' + esc(siteKey(x.s)) + '" '
                    + 'style="width:100%;justify-content:space-between;margin-bottom:6px">'
                    + '<span>' + esc(siteKey(x.s)) + '</span><span class="num">' + nm(Math.round(x.d))
                    + ' ' + esc(t('م')) + '</span></button>';
                }).join(''))
          : alertBox('success','لا موقعَ مسجَّلًا خلال مئةٍ وأربعين مترًا منك — الأرجحُ أنه غيرُ مسجَّلٍ فعلًا.'));

    return head

      + card('الموضع',
          '<div class="pop-rows" style="margin:0">'
          + '<div><span class="k">' + esc(t('الإحداثيات')) + '</span><span class="num">'
          +   (has ? (NEWSITE.lat.toFixed(6) + ', ' + NEWSITE.lng.toFixed(6))
                   : (MYPOS ? (MYPOS.lat.toFixed(6) + ', ' + MYPOS.lng.toFixed(6)) : '—'))
          + '</span></div></div>',
          btn('◎ ' + t('التقط موضعي'),'btn-secondary btn-sm',' data-nsloc="1"')
          + (may('settings')   /* (V37.96) كان «newsite» مفتاحًا لا وجودَ له فيُرجع كاذبًا دائمًا */
              ? btn('\u{1F4CC} ' + t('اختر الموضع على الخريطة'),'btn-quiet btn-sm',' data-nspin="1"') : ''))

      + card('هوية الموقع',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('المشعر')) + ' <span class="req">*</span></label>'
          + '<select data-ns="zone">' + zoneOptions().map(function(z){
              /* القيمةُ المفتاحُ العربيُّ والمعروضُ ترجمتُه (V17.72) */
              return '<option value="' + esc(z) + '"' + (NEWSITE.zone===z?' selected':'') + '>' + esc(t(z)) + '</option>'; }).join('')
          + '</select><p class="hint">' + esc(t('اختر المنطقة التي يتبعها الموقع')) + '</p></div>'

          + '<div class="field"><label>' + esc(t('نوع الموقع')) + ' <span class="req">*</span></label>'
          + '<select data-ns="type">' + Object.keys(CAT_DEF).map(function(k){
              return '<option value="' + esc(k) + '"' + (NEWSITE.type===k?' selected':'') + '>'
                + CAT_DEF[k].i + ' ' + esc(t(CAT_DEF[k].l)) + '</option>'; }).join('')
          + '</select></div>'

          /* (V29.7) غيرُ المخيم: اسمُ النقطة إلزاميّ، ومراكزُ التفويج بمركزها */
          + (!camp ? '<div class="field"><label>' + esc(t('اسم النقطة')) + (office ? '' : ' <span class="req">*</span>') + '</label>'
              + '<input data-ns="nm" value="' + esc(NEWSITE.nm) + '" dir="auto" placeholder="' + esc(t('مثال: ممر الملك فهد — البوابة ٣')) + '"></div>' : '')
          + (NEWSITE.type === 'LPR' ? '<div class="field"><label>' + esc(t('المركز')) + ' <span class="req">*</span></label>'
              + '<select data-ns="center"><option value="">— ' + esc(t('اختر')) + ' —</option>' + NS_CENTERS.map(function(c){ return '<option value="' + esc(c[1]) + '"' + (NEWSITE.center === c[1] ? ' selected' : '') + '>' + esc(t(c[0])) + '</option>'; }).join('') + '</select></div>' : '')
          /* المربعُ والشاخصُ من هويّة المخيمات وحدَها — الممرُّ والكاميرا والمحطةُ
             والجمراتُ ونمرةُ والتسكينُ لا مربعَ لها ولا شاخص، فلا يُطلَبان ولا يُعرَضان */
          + (camp
            ? '<div class="field"><label>' + esc(t('رقم المربع')) + ' <span class="req">*</span></label>'
          + '<input data-ns="sq" value="' + esc(NEWSITE.sq) + '" dir="auto">'
          + '<p class="hint">' + esc(t('من الشاخص المثبت في الموقع')) + '</p></div>'
          + '<div class="field"><label>' + esc(t('رقم الشاخص')) + ' <span class="req">*</span></label>'
          + '<input data-ns="sign" value="' + esc(NEWSITE.sign) + '" dir="auto">'
          + '<p class="hint">' + esc(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')) + '</p></div>'
            : '')
          + '</div>'

          + (camp ? '<div class="field"><label>' + esc(t('شركة تقديم الخدمة'))   /* (V29.7) الشركةُ للمخيمات وحدَها */
          +   ' <span class="req">*</span></label>'
          + btn(NEWSITE.co ? NEWSITE.co
                : (NEWSITE.coReq ? t('بانتظار اعتماد المهندس') + ': ' + NEWSITE.coReq
                                 : '— ' + t('اختر الشركة من القائمة') + ' —'),
                NEWSITE.co ? 'btn-secondary' : 'btn-quiet', ' data-nsco="1" style="width:100%"')
          + '<p class="hint">' + esc(t('إلزامية للمخيمات — من القائمة الموحّدة فقط. اتركها فارغة إن كان السبب «عدم وجود تخصيص».')) + '</p>'
          /* شركةٌ ليست في القائمة؟ تُضاف من شاشتها ثم يعود — بلا خروجٍ من
             القائمة الجانبية والبحثِ عن اسم الشاشة. */
          + (seesPage('co')
            ? '<div class="actions" style="margin:6px 0 0">'
              + btn('\u{1F3E2} ' + t('إدارةُ الشركات'),'btn-quiet btn-sm',
                    ' data-p="co" title="' + esc(t('أضِف شركةً جديدةً ثم عُد — تظهر في القائمة فورًا')) + '"')
              + '</div>'
            : '')
          + '</div>'

          + '<div class="field"><label>' + esc(t('عدد الخيام أو الغرف')) + '</label>'
          + '<input data-ns="tents" type="number" min="0" value="' + esc(NEWSITE.tents) + '"></div>' : '')
          + (camp ? '<p class="hint" style="margin:6px 0 0">' + esc(t('الاسم')) + ': <b>' + esc(NEWSITE.zone + ' - مربع ' + (NEWSITE.sq || '…') + ' - شاخص ' + (NEWSITE.sign || '…')) + '</b></p>' : ''))

      + (minProp ? '' : ''
      + card('لماذا ليس في السجل؟',
          '<div class="field"><label>' + esc(t('السبب')) + (office ? '' : ' <span class="req">*</span>') + '</label>'
          + '<select data-ns="reason"><option value="">— ' + esc(t('اختر')) + ' —</option>'
          + (camp ? cfgList('reasonsCamp', NS_REASONS) : cfgList('reasonsPt', NS_REASONS_PT)).map(function(r){   /* (V30.3) من الإعدادات */
              return '<option value="' + esc(r) + '"' + (NEWSITE.reason===r?' selected':'') + '>' + esc(t(r)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('شرح مختصر')) + '</label>'
          + '<textarea data-ns="why" rows="2" placeholder="'
          + esc(t('اختياري — اكتبه فقط لو فيه تفصيلةٌ تساعد المكتب')) + '">' + esc(NEWSITE.why) + '</textarea></div>')

      + card(t('التحديات') + (office ? '' : ' *'), '<p class="hint" style="margin-top:0">' + esc(t('اختر ما ينطبق — أو «لا توجد تحديات»')) + '</p><div class="chips">'   /* (V29.7) إلزاميةٌ للكلّ */
          + chalsOf({ type:NEWSITE.type }).map(function(c){ var on = (NEWSITE.chals || []).indexOf(c) > -1; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-nschal="' + esc(c) + '">' + (on ? '\u2713 ' : '') + esc(t(c)) + '</button>'; }).join('') + '</div>')

      )
      + (minProp ? '' : ''
      + card('الصور',
          '<p class="hint" style="margin-top:0">' + esc(t(office
              ? 'الصورُ اختياريةٌ للمكتب — تُرفَع إن وُجدت، وتُلتقَط في الزيارة التي تُجدوَل بعد الحفظ.'
              : 'الأوليان إلزاميتان — بهما يطابق المكتبُ الموقع. الباقي اختياريٌّ وكلُّ صورةٍ تساعد.')) + '</p>'
          + '<div class="grid cols-2">'
          + NS_PHOTOS.map(function(lbl, i){
              var p = NEWSITE.photos[i];
              return '<div class="field"><label>' + nm(i+1) + ' · ' + esc(t(lbl))
                + (i < 2 && !office ? ' <span class="req">*</span>' : '') + '</label>'   /* (V29.7) أوّلُ صورتين */
                + '<label class="btn ' + (p ? 'btn-secondary' : 'btn-primary')
                + '" style="cursor:pointer;width:100%">'
                + (p ? '✓ ' + esc(t('التُقطت')) : '📷 ' + esc(t('صوّر أو اختر')))
                + '<input type="file" accept="image/*" data-nsphoto="' + i
                + '" style="display:none"></label>'
                + (p ? '<div class="hint" style="margin:4px 0 0">' + nm(Math.round(p.size/1024))
                     + ' ' + esc(t('كيلو')) + '</div>' : '')
                + '</div>';
            }).join('')
          + '</div>')
      )

      + card('', '<div class="actions">'
          + (office
              ? (minProp ? btn('\u{1F3DB} ' + t('أرسل المقترحة للمهندس'),'btn-primary',' data-nssave="1"') : btn('\u{1F4C5} ' + t('احفظ وجدوِل زيارة'),'btn-primary',' data-nssave="1"'))
              : btn('إرسال للاعتماد','btn-primary',' data-nssave="1"'))
          + btn('إلغاء','btn-secondary',' data-p="map"')
          + '</div>'
          + '<p class="hint">' + esc(t(office
              ? (minProp ? 'تُرسَل «مقترحةً من الوزارة» إلى المهندس: لا تدخل الأرقامَ ولا التقاريرَ قبل اعتماده، وتظهر على الخريطة بعلامةٍ بنفسجية حتى ذلك.' : 'نقطةُ المكتب لا تُحتسَب زيارة: تُحفَظ «جديدةً بانتظار الاعتماد»، ثم يُفتَح لوحُ الإسناد عليها لتُجدوَل زيارتُها — والميدانُ هو من يمسحها.')
              : 'الإرسالُ يُحتسَب زيارةً بانتظار الاعتماد، والموقعُ يدخل الأرقامَ فورًا موسومًا «جديدًا بانتظار الاعتماد» حتى يعتمده المهندس. وبعد الإرسال يُفتَح نموذجُ المسح عليه فتُستكمَل بياناتُه — ولا تُعتمَد الزيارةُ قبل استكمالها.')) + '</p>');
  })();
    return head + (function(){
    if (!STATE.diss) STATE.diss = {};
    var S = layerStats('dis');
    var pool = STATE.sites.filter(LAYERS.dis.pass);
    var sched = pool.filter(function(x){ var r = STATE.diss[x.id]; return r && r.status === 'مجدول'; });
    var done = pool.filter(function(x){ return disDone(x.id); });

    return stats([['قابل للفك', N(S.pool), S.pool?'acc':''],
                  ['مجدول', N(sched.length), sched.length?'wrn':''],
                  ['تم الفك', N(done.length), 'ok'],
                  ['نقاط الفك', N(S.ptsAll)]])
      + (pool.length
        ? cardFlush(t('القابل للفك') + ' — ' + nm(pool.length),
            table(['النقطة','المشعر','النوع','نقاط الفك','الحالة',''],
              pool.slice(0, 40).map(function(x){
                var r = STATE.diss[x.id] || {};
                var d = catDefOf(x) || { l:x.type, i:'' };
                return [siteIdHtml(siteOf(x)),
                        esc(x.zone), d.i + ' ' + esc(t(d.l)),
                        N(ptsDis(x)),
                        pill(r.status || 'قابل للفك', r.status==='تم الفك'?'ok':(r.status?'warn':'')),
                        '<div class="actions">'
                        + (!r.status ? btn('جدوِل','btn-quiet btn-sm',' data-dsch="' + esc(x.id) + '"') : '')
                        + (r.status === 'مجدول'
                          ? btn('سليم','btn-quiet btn-sm',' data-ddone="' + esc(x.id) + '|سليم"')
                            + btn('تالف','btn-quiet btn-sm',' data-ddone="' + esc(x.id) + '|تالف"')
                          : '')
                        + '</div>'];
              })),
            '<div class="actions">'
            + btn('◈ ' + t('طبقة الفك'),'btn-secondary btn-sm',' data-mode="dis"')
            + btn('➕ ' + t('إسناد فك'),'btn-primary btn-sm',' data-lasn="dis"')
            + '</div>')
        : card('', alertBox('info','لا نقاط مركَّبةً بعد — الفكُّ آخرُ الدورة ولا يبدأ قبلها.')))
      + card('معاملا الحالة',
          table(['الحالة','المعامل','الأثر'], [
            ['سليم', N(cfgGet('disOk') || 1),
             '<span class="hint" style="margin:0">' + esc(t('يعود للمخزن قابلًا للاستعمال')) + '</span>'],
            ['تالف', N(cfgGet('disBad') || 1),
             '<span class="hint" style="margin:0">' + esc(t('يُعزَل ويُوثَّق — وفكُّه أثقل')) + '</span>']
          ])
          + '<p class="hint">' + esc(t('المعاملان يُضبطان في الإعدادات ← نقاط الفك، ويضربان وزنَ الفك بحسب حالة الجهاز.')) + '</p>');
  })();
  }};

function disSchedule(id){
  if (!may('edit')){ toast(t('جدولةُ الفك تحتاج صلاحية تعديل')); return; }
  /* لا يُفَكُّ ما لم يُركَّب: كان يُجدوَل أيُّ معرّفٍ يُمرَّر، فتظهر في جدول
     الفكِّ نقاطٌ لم يُوضَع فيها جهازٌ قط، ويُرسَل إليها طاقم. */
  var r0 = STATE.inss[id];
  if (!r0 || r0.status !== 'مُركّب' || !r0.approved){
    toast(t('الفكُّ يتاح بعد اعتماد تركيب النقطة'));
    return;
  }
  if (!STATE.diss) STATE.diss = {};
  STATE.diss[id] = { id:id, status:'مجدول', at:Date.now(), by:STATE.meta.name || '' };
  CORE.set('diss', id, STATE.diss[id]);
  logEvent('جدولة فك — ' + id, id);
  statBump(); toast(t('جُدوِل للفك')); render(1);
}

function disComplete(id, cond){
  if (!may('edit')){ toast(t('إتمامُ الفك يحتاج صلاحية تعديل')); return; }
  var sched = STATE.diss && STATE.diss[id];
  if (!sched || sched.status !== 'مجدول'){
    toast(t('جدوِل الفكَّ أولًا قبل إتمامه')); return;
  }
  var x = siteFind(id);
  STATE.diss[id] = { id:id, status:'تم الفك', cond:cond, at:Date.now(),
                     by:STATE.meta.name || '', pts:x ? ptsDis(x) : 0 };
  CORE.set('diss', id, STATE.diss[id]);
  /* العُهدةُ ترجع: السليمُ للمخزن والتالفُ يُعزَل — بمعرّفٍ فريدٍ لكل
     صنفٍ لا معرّف الموقع نفسِه، وإلا كتب صنفٌ فوق آخر في القاعدة. */
  var ins = STATE.inss[id];
  STATE.moves = STATE.moves || [];
  if (ins && ins.parts) Object.keys(ins.parts).forEach(function(k){
    var mv = { id:uid36(), at:dayKey(),
               kind: cond === 'تالف' ? 'إرجاع تالف' : 'إرجاع سليم',
               item:k, qty:ins.parts[k], by:STATE.meta.name || '—', site:id, cond:cond };
    STATE.moves.push(mv);
    CORE.dirty('moves', mv.id, mv);
  });
  logEvent('فك ' + cond + ' — ' + id, id);
  statBump(); toast(t('تم الفك') + ' · ' + t(cond)); render(1);
}

