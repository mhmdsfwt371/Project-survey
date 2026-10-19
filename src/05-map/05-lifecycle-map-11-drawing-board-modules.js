/* ═══ لوحُ الرسم (V17.58–V17.59) ═══
   المسارُ: المسافةُ بيد الراسم، والنقاطُ تُسحَب ثم تُحفَظ. والمساحةُ: المخيمُ
   بحدوده ومربعه وشاخصه، وغيرُه شبكةُ نقاطٍ بمسافتها. */
function routePanelHtml(){
  var area = ROUTE.mode === 'area', camp = area && ROUTE.type === 'مخيم';
  var hits = camp ? areaCampHits() : [];
  var n = routeCount(), big = !area && n > RT_DRAG_MAX;
  var T = typesList();
  var opt = function(v, lbl, cur){ return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(lbl) + '</option>'; };
  var hint;
  if (camp){
    hint = hits.length === 1
      ? esc(t('الحدودُ تضمُّ مخيمًا مسجَّلًا — تُربَط به ولا يُنشأ غيرُه')) + ': <b class="num">' + esc(hits[0].id) + '</b>'
      : (hits.length > 1
          ? '<b class="num">' + nm(hits.length) + '</b> ' + esc(t('مخيماتٍ مسجَّلةٍ داخل الحدود — ارسم حدودَ مخيمٍ واحد'))
          : esc(t('مخيمٌ واحدٌ بحدوده — بلا نقاطٍ داخله، وتُجدوَل زيارتُه بعد الحفظ.')));
  } else {
    hint = esc(t('ستُضاف')) + ' <b class="num" id="rtN">' + nm(n) + '</b> '
      + esc(t(area ? 'نقطةً داخل المساحة — تُراجَع قبل الحفظ.'
             : (ROUTE.gen ? 'نقطةً — مثبَّتةٌ بعد التحريك، والمسافةُ لا تغيّرها حتى «أعد التوليد».'
             : (big ? 'نقطةً — أكثرُ من أن تُسحَب؛ كبّر المسافةَ لتحريكها.'
                    : 'نقطةً على المسار — اسحب أيَّ نقطةٍ لتحريكها قبل الحفظ.'))))
      + (ROUTE.moved ? ' <span class="pill acc">' + esc(t('حُرِّك')) + ' ' + nm(ROUTE.moved) + '</span>' : '');
  }
  return '<div class="map-route-box' + (RT_MIN ? ' min' : '') + '">'
    + '<div class="wt-row" style="justify-content:space-between;margin:0 0 6px">'
    +   '<b>' + esc(t(camp ? 'مساحةُ مخيم' : (area ? 'مساحةٌ بنقاط' : 'مسارٌ بنقاط'))) + '</b>'
    +   btn(RT_MIN ? '\u25B2 ' + t('توسيع') : '\u25BC ' + t('طيّ'), 'btn-quiet btn-sm', ' data-rtmin="1"')
    +   '<span class="hint" style="margin:0">' + esc(t('نقاطُ الرسم')) + ' <span class="num">' + nm(ROUTE.pts.length) + '</span>'
    +     (!area && ROUTE.pts.length > 1 ? ' \u00b7 ' + nm(routeLen()) + ' ' + esc(t('م')) : '') + '</span></div>'
    + '<div class="grid cols-2" style="gap:6px">'
    + (camp
        ? '<div class="field"><label>' + esc(t('رقم المربع')) + '</label>'
          + '<input dir="auto" value="' + esc(ROUTE.sq) + '" data-rt="sq" placeholder="7-14"></div>'
          + '<div class="field"><label>' + esc(t('رقم الشاخص')) + '</label>'
          + '<input dir="auto" value="' + esc(ROUTE.sign) + '" data-rt="sign" placeholder="57/2"></div>'
        : '<div class="field"><label>' + esc(t('كلَّ كم مترًا')) + '</label>'
          + '<input type="number" min="' + RT_EVERY_MIN + '" step="1" inputmode="numeric" value="' + esc(ROUTE.every) + '" data-rt="every"'
          +   (ROUTE.gen ? ' disabled title="' + esc(t('المسافةُ مثبَّتةٌ بعد التحريك — «أعد التوليد» يعيدها')) + '"' : '') + '></div>')
    +   '<div class="field"><label>' + esc(t('النوع')) + '</label><select data-rt="type">'
    /* الأنواعُ من سجلِّ الأنواع الذي تُدار منه الشاشةُ نفسُها — فما يُضاف
       أو يُحذَف هناك يظهر هنا، ولا تبقى قائمةٌ ثانيةٌ فيها نوعٌ أُلغي
       (بقي «AI» فيها بعد إلغائه وكاميراتُ الوزارة هي الذكيّة). والاسمُ
       المعروضُ لا المفتاح: كان «LPR» يُقرأ حرفًا (V17.60). */
    +     Object.keys(T).map(function(x){ return opt(x, typeShort(x), ROUTE.type); }).join('')
    +     '</select></div>'
    +   '<div class="field"><label>' + esc(t('المشعر')) + '</label><select data-rt="zone">'
    +     zoneOptions().map(function(x){ return opt(x, t(x), ROUTE.zone); }).join('')
    +     '</select></div>'
    +   '<div class="field"><label>' + esc(t(camp ? 'اسم المخيم' : 'اسم المسار')) + '</label>'
    +     '<input dir="auto" value="' + esc(ROUTE.name) + '" data-rt="name" placeholder="'
    +       esc(t(camp ? 'اختياري — يُولَّد من المشعر والمربع' : 'طريق الهجرة · طريق كدانة…')) + '"></div>'
    + '</div>'
    + '<p class="hint" style="margin:6px 0">' + hint + '</p>'
    + '<div class="actions" style="margin:0">'
    +   btn('\u{1F4BE} ' + t(camp ? 'احفظ المخيم' : 'احفظ النقاط'),'btn-primary btn-sm',' data-rtsave="1"')
    +   (ROUTE.gen ? btn('\u21BB ' + t('أعد التوليد'),'btn-quiet btn-sm',' data-rtregen="1"') : '')
    +   btn('\u21A9 ' + t('تراجع'),'btn-quiet btn-sm',' data-rtundo="1"')
    +   btn(t('إلغاء'),'btn-quiet btn-sm',' data-rtcancel="1"')
    + '</div></div>';
}

function mapUIHtml(){
  var busy = (typeof MAP_SELECT !== 'undefined' && MAP_SELECT)
          || (typeof MOVE_ID !== 'undefined' && MOVE_ID);
  return '<div class="' + (busy ? 'map-busy-on' : '') + '"></div>'
    + '<div class="map-top">'
    +   Object.keys(LAYERS).map(function(k){
          return '<button type="button" class="map-chip '+(FIELD_MODE===k?'on':'')+'" data-mode="'+k+'">'
            + LAYERS[k].i + ' ' + esc(t(LAYERS[k].n)) + '</button>';
        }).join('')
    +   '<button type="button" class="map-chip'+(MAP_SAT?' on':'')+'" data-sat="1">'
    +     esc(t('قمر صناعي'))+'</button>'
    /* الثلاثيُّ وضعٌ للخريطة نفسِها لا صفحةٌ أخرى — النقاطُ والألوانُ والمرشِّحاتُ هي هي */
    +   '<button type="button" class="map-chip'+(MAP_3D?' on':'')+'" data-m3="1" title="'
    +     esc(t(MAP_3D ? 'العودة إلى الخريطة المسطّحة' : 'الخريطة بالتضاريس والأعمدة'))+'">'
    +     (MAP_3D ? '\u25A6 ' : '\u26F0 ')+esc(t(MAP_3D ? '٢د' : '٣د'))+'</button>'
    +   '<button type="button" class="map-chip'+(filtOn()?' on':'')+'" data-mfilt="'
    +     (MAP_FILT_OPEN?'0':'1')+'">'
    +     '\u2261 '+esc(t('تصفية'))+(filtOn()?' \u00b7 '+nm(layerFiltered().length):'')+'</button>'
    /* الإسنادُ والتحديدُ لمن يُسنِد — المشرفُ فما فوق. والوزارةُ ترى الخريطةَ ولا
       يُعرَض عليها زرٌّ يرفضها التطبيقُ بعد الضغط فتظنُّه عطلًا */
    +   (rankOf(ROLE) >= rankOf('supervisor') && !isCrewRole(ROLE) ? '<button type="button" class="map-chip acc" data-apick="1">'
    +     '\u2795 '+esc(t('إسناد'))+'</button>' : '')
    +   (rankOf(ROLE) >= rankOf('supervisor') ? '<button type="button" class="map-chip'+(MAP_SELECT?' on':'')+'" data-selmap="'
    +     (MAP_SELECT?'0':'1')+'">'
    +     '\u2611 '+esc(t('تحديد'))+(SEL_N?' \u00b7 '+nm(SEL_N):'')+'</button>' : '')
    +   (MY_ONLY || isCrewRole(ROLE) ? '<button type="button" class="map-chip on" data-myonly="0">'
    +     '\u25C9 '+esc(t('مهامي'))+'</button>' : '')
    +   '<span class="chip-pair">'
    +     '<button type="button" class="map-chip'+(CO_MODE?' on':'')+'" data-comode="'+(CO_MODE?'0':'1')+'">'
    +       '\u25C9 '+esc(t('الشركات'))+(CO_SEL.length?' \u00b7 '+nm(CO_SEL.length):'')+'</button>'
    +     '<button type="button" class="map-chip chip-caret'+(CO_OPEN?' on':'')+'" data-co="1"'
    +       ' aria-label="'+esc(t('اختر الشركات'))+'">\u25BE</button>'
    +   '</span>'
    + propChip()   /* (V37.69) مقترحاتُ الوزارة */
    + '</div>'

    + (MAP_FILT_OPEN ? '<div class="map-sheet">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'
        +   '<p class="hint" style="margin:0 0 9px;flex:1">'
        +     esc(t('التصنيفُ الكاملُ في «المواقع» — وهذه تصفيةٌ سريعةٌ للخريطة.')) + '</p>'
        +   '<button type="button" class="btn btn-quiet btn-sm" data-mfilt="0" aria-label="'
        +     esc(t('إغلاق')) + '" style="flex:0 0 auto">✕</button>'
        + '</div>'
        + catBar(0)
        + '<div class="wt-row" style="margin-top:10px;gap:6px;flex-wrap:wrap;align-items:center">'
        +   '<span class="hint" style="margin:0">' + esc(t('طبقات الخريطة')) + '</span>'
        +   '<button type="button" class="cat' + (POIL.on.ministry ? ' on' : '') + '" data-poil="ministry">' + esc(t('مباني الوزارة')) + '</button>'
        +   '<button type="button" class="cat' + (POIL.on.tafweej ? ' on' : '') + '" data-poil="tafweej">' + esc(t('أماكن التفويج')) + '</button>'
        +   '<button type="button" class="cat' + (IOT.on ? ' on' : '') + '" data-iot="1">' + esc(t('تخطيط حساسات منى')) + '</button>'
        +   (IOT.on ? (function(){ var k = iotCount(); return '<span class="hint" style="margin:0">' + nm(k.g) + ' ' + esc(t('جيت واي')) + ' \u00b7 ' + nm(k.s) + ' ' + esc(t('حساسًا')) + '</span>' + btn('\u2B07 ' + t('إكسل الحساسات'), 'btn-quiet btn-sm', ' data-iotx="1"'); })() : '')   /* (V37.70) عدّادُها الخاص */
        + '</div>'
        + '<div class="actions" style="margin-top:10px">'
        + btn('عرض','btn-primary btn-sm',' data-mfilt="0"')
        + btn('مسح التصفية','btn-secondary btn-sm',' data-mclear="1"')
        + btn('التصنيف الكامل','btn-secondary btn-sm',' data-p="sites"')
        + '</div></div>' : '')

    + (PIN_ON
        ? '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;margin:0">'
          + '<b>\u{1F4CC} ' + esc(t('اضغط على الخريطة حيث تريد النقطة')) + '</b>'
          + btn('\u2716 ' + t('إلغاء'), 'btn-quiet btn-sm', ' data-pincancel="1"')
          + '</div></div>'
        : '')
    + (ROUTE.on ? routePanelHtml() : '')
    + tfdPanelHtml()   /* (V28.0) */
    + (IOT.edit ? iotPanelHtml() : '')   /* (V25.8) */
    + (BED ? bedPanelHtml() : '')   /* (V25.9) */
    + (SPLIT ? splitPanelHtml() : '')   /* (V37.67) */
    + '<div class="map-fab">'
    +   ((may('edit') || ROLE === 'viewer') ? btn('+ '+t('موقع غير مسجّل'),'btn-primary btn-sm',' data-newsite="1"') : '')   /* (V37.68) الوزارةُ تقترح نقطة */
    +   (ROLE === 'viewer' ? btn((PIN_ON ? '\u23F3 ' + t('اضغط على الخريطة') : '\u{1F4CC} ' + t('نقطة هنا')), PIN_ON ? 'btn-danger btn-sm' : 'btn-secondary btn-sm', ' data-pin="1"') : '')   /* بلا أدوات الرسم */
    +   (may('settings')   /* (V37.96) كان «newsite» مفتاحًا لا وجودَ له فيُرجع كاذبًا دائمًا */
          ? btn((PIN_ON ? '\u23F3 ' + t('اضغط على الخريطة') : '\u{1F4CC} ' + t('نقطة هنا')),
                PIN_ON ? 'btn-danger btn-sm' : 'btn-secondary btn-sm', ' data-pin="1"')
            + (tfdMay() ? btn((TFD.on ? '\u270F ' + t('جارٍ رسم المسار') : '\u{1F6B6} ' + t('رسم مسار التفويج')), TFD.on ? 'btn-danger btn-sm' : 'btn-secondary btn-sm', ' data-tfd="1"') : '')   /* (V28.0) */
            + btn((ROUTE.on && ROUTE.mode === 'line' ? '\u270F ' + t('جارٍ الرسم') : '\u{1F6E3} ' + t('مسار بنقاط')),
                (ROUTE.on && ROUTE.mode === 'line') ? 'btn-danger btn-sm' : 'btn-secondary btn-sm', ' data-route="1"')
            + btn((ROUTE.on && ROUTE.mode === 'area' ? '\u270F ' + t('جارٍ الرسم') : '\u{1F17F} ' + t('مساحة بنقاط')),
                (ROUTE.on && ROUTE.mode === 'area') ? 'btn-danger btn-sm' : 'btn-secondary btn-sm', ' data-area="1"') : '')
    +   btn('\u25CE '+t('موقعي'),'btn-light btn-sm',' data-locate="1"')
    + '</div>'


    /* الأسطورةُ تحجب الخريطةَ على الشاشة الصغيرة — تُطوى بزرٍّ ويُذكَر اختيارُه */
    + '<div class="map-stack">' + layerBar()
      + '<button type="button" class="map-chip lg-toggle" data-legend="' + (LEGEND_ON ? '0' : '1') + '" title="'
      +   esc(t(LEGEND_ON ? 'إخفاء حالات النقاط' : 'إظهار حالات النقاط')) + '">'
      +   (LEGEND_ON ? '\u25BE ' + esc(t('إخفاء الحالات')) : '\u25B4 ' + esc(t('الحالات'))) + '</button>'
      + (LEGEND_ON ? '<div class="map-legend">' + legendRows() + '</div>' : '')
    + '</div>'
    + mapSelBar() + moveBar()
    + (CO_OPEN ? coFiltHtml() : '')
    + (ASN_PICK ? asnPickHtml() : '')
    + (ASN_OPEN ? asnSheet() : '')
    + (POP_OPEN ? popHtml() : '')
    + propSheetHtml() + (PROP_POP ? propPopHtml() : '');   /* (V37.69) */
}

function mapDraw(){
  if (!document.getElementById('mapBox')) return;
  mapLoad().then(function(ok){
    if (!ok){ mapFallback(); return; }
    mapInit();
    mapTheme();
  });
}

/* تعذّر تحميل Leaflet — تُعرَض قائمةٌ بدل خريطةٍ فارغة */
function mapFallback(){
  var el = document.getElementById('mapBox');
  if (!el) return;
  el.innerHTML = '<div style="padding:22px;color:#9BA5AF;font-size:13.5px;line-height:1.9">'
    + esc(t('تعذّر تحميل الخريطة — تعمل بلا شبكة أو تعذّر المزوّد.')) + '<br>'
    + esc(t('المواقع متاحةٌ من تبويب «المواقع» وبحثها يعمل محليًّا.')) + '</div>';
}

var SITE_Q = '';
/* fieldList المحسّنة في طبقة الأداء — تُعرَّف هناك لا هنا */

/* السجلاتُ من سجل الأحداث الحيّ لا من بذرةِ عرض: كانت تعرض أسماءً وأوقاتًا
   كُتبت يومَ بُنيت الشاشة، فيقرأ الفنيُّ سجلًّا ليس سجلَّه. */
function fieldRecords(){
  var E = (STATE.events || []).slice(0, 40);
  return card('السجلات',
    E.length
      ? '<div class="timeline">' + E.map(function(e){
          return '<div class="tl-item"><div class="tl-t">' + esc(e.what || '') + '</div>'
            /* `at` في الحدث نصٌّ عربيٌّ («١٢:٠٥ م») لا رقم — كان يُحوَّل تاريخًا
               فينفجر `toISOString` على أوّل حدثٍ حقيقيٍّ ويُترَك المحتوى على
               الصفحة السابقة والعنوانُ «السجلات». الوقتُ من `ts` أو النصُّ كما هو. */
            + '<div class="tl-s"><span class="num">'
            + esc(typeof e.at === 'string' ? e.at
                  : (e.ts ? fmtTime(e.ts, { hour:'2-digit', minute:'2-digit' }) : '—'))
            + '</span> · ' + esc(e.by || '') + '</div></div>';
        }).join('') + '</div>'
      : '<p class="hint" style="margin:0">' + esc(t('لا سجلاتٍ بعد — تظهر هنا أفعالُك أولًا بأول.')) + '</p>');
}

function fieldTools(){
  /* كانت ثلاثةُ أصفارٍ مكتوبةً بيدٍ بجوار رقمٍ حقيقيٍّ واحد */
  var S9 = siteStats(), pend9 = CORE.pending();
  return stats([['المواقع', N(S9.total)], ['تمت الزيارة', N(S9.surveyed), 'acc'], ['التركيب', N(S9.installed), 'ok'],
                ['غير مزامن', N(pend9), pend9 ? 'wrn' : '']])
    + card('التصديرات',
        '<div class="actions">'
        + btn('⬇ إكسل — المواقع','btn-secondary',' data-xls="sites"')
        + (may('exportAll')
            ? btn('🌍 KMZ — منى وعرفات لجوجل إيرث','btn-secondary',' data-kmz="main"')
            + btn('🌍 KMZ — إعادة تركيب ١٤٤٧','btn-secondary',' data-kmz="redo"')
            + btn('🌍 KMZ — بلون الشركة','btn-secondary',' data-kmz="co"')
            : '')
        + btn('🖨 PDF — تقرير اليوم','btn-secondary',' data-print="1"')
        + btn('\u{1F5FA} GeoJSON — ' + t('المواقع بحالتها'),'btn-secondary',' data-geojson="1"')
        + '</div>')
    + deviceCards()
    + card('المزامنة',
        '<div class="actions">' + btn('مزامنة الآن','btn-primary',' data-pull="1"')
        /* كان وقتًا محفورًا «٠٢:٥١» — يُقرأ من آخر مزامنةٍ فعلية */
        + '<span class="hint" style="margin:0">'+esc(t('آخر مزامنة'))+' <span class="num">' + esc(agoTxt(STATE.meta.lastSync)) + '</span></span></div>');
}

/* ═══ موديولات اللوحة — كل قسم بمحتواه ═══ */

/* ── لوحة القيادة ───────────────────────────────── */
/* ما أُنجز في يومٍ بعينه: من اللقطة المحفوظة إن وُجدت، وإلا من السجلات
   التي على هذا الجهاز — تقرؤه الوتيرةُ ولوحةُ «أمس · الآن · غدًا» معًا */
function dayDone(day){
  var snap = (STATE.stats || {})[day];
  if (snap) return { sv: snap.daySurvey || 0, ins: snap.dayInstall || 0, dis: snap.dayDismantle || 0 };
  var sv = 0, ins = 0, dis = 0;
  Object.keys(STATE.recs).forEach(function(k){
    var r = STATE.recs[k]; if (dayKey(r.at || r._at) === day && svVisited(r) && siteFind(k)) sv++; });   /* (V36.1) لا تُعَدّ زيارةُ نقطةٍ محذوفة */
  Object.keys(STATE.inss).forEach(function(k){
    var r = STATE.inss[k]; if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++; });
  Object.keys(STATE.diss || {}).forEach(function(k){
    var r = STATE.diss[k]; if (r && dayKey(r.at || r._at) === day && (r.status === 'تم الفك' || r.done)) dis++; });
  return { sv:sv, ins:ins, dis:dis };
}
/* ═══ تفاصيلُ المسح — ما الذي حُصر فعلًا (V17.69) ═══
   الرقمُ الكبيرُ يقول «مُسحت ألفُ نقطة»، والسؤالُ في الاجتماع غيرُه: كم غرفةً
   حُصرت؟ وكم مخيمًا بلا تحدٍّ يُسنَد تركيبُه غدًا؟ وكم يحتاج هيكلًا يُشترى
   حديدُه قبل شهر؟ فصارت لكلِّ سؤالٍ بطاقةٌ برقمه، وخلفَ الرقم قائمتُه كما هي
   — تُصدَّر، ويطير كلُّ سطرٍ إلى نقطته على الخريطة.
   والمصدرُ سجلُّ الزيارة نفسُه لا حسابٌ ثانٍ: ما لم تُسجَّل زيارتُه لا يُعَدُّ،
   و«لا توجد تحديات» ليست تحدّيًا، والغرفُ من عدِّ الميدان فإن لم يُعَدّ فمن
   سجلِّ الوزارة. */
var SVD_PICK = '';
/* ═══ مفتاحُ التحدي الواحد (V17.95) ═══
   الصيغتان في النموذجين مقصودتان: «يحتاج هيكلًا جديدًا» للمخيم و«عمودًا أو
   هيكلًا» للممر — لكنهما التحدي نفسه، فكانتا تُعدّان مرتين (٩٣ + ٤٨) في كلِّ
   شاشةٍ ولقطة. صار لكلِّ صيغةٍ مفتاحٌ واحدٌ عند العدّ — والمخزونُ في الوثائق كما
   هو، والنماذجُ بصيغها كما هي. ما بدأ بـ«أخرى» مفتاحُه «أخرى» وتفصيلُه في chal_note. */
var CHAL_ALIAS = {
  'لا يوجد سطح تثبيت — يحتاج هيكلًا جديدًا': 'لا يوجد سطح تثبيت',
  'لا يوجد سطح تثبيت — يحتاج عمودًا أو هيكلًا جديدًا': 'لا يوجد سطح تثبيت',
  'أخرى — اذكرها في وصف التحدي': 'أخرى'
};
function chalKey(c){
  c = String(c || '').trim();
  if (CHAL_ALIAS[c]) return CHAL_ALIAS[c];
  if (/^لا يوجد سطح تثبيت/.test(c)) return 'لا يوجد سطح تثبيت';
  if (/^أخرى/.test(c)) return 'أخرى';
  return c;
}
function chalKeys(list){
  var out = [], seen = {};
  (Array.isArray(list) ? list : []).forEach(function(c){ if (!c || c === 'لا توجد تحديات') return; var k = chalKey(c); if (!seen[k]){ seen[k] = 1; out.push(k); } });
  return out;
}
function svdChals(r){   /* (V37.3) الفئاتُ الثماني في تفصيل المسح أيضًا — وما لم يُصنَّف «يراجع المهندس تصنيفه» */
  return chalCats(r).map(function(k){ return k === 'review' || !ccOf(k) ? 'يراجع المهندسُ تصنيفَه' : ccOf(k).n; });
}
/* النصوصُ الحرّةُ تحت «أخرى» — تُطبَّع (مسافاتٌ وتشكيلٌ وهمزات) وتُعَدّ، ليقرّر المهندسُ ما يصير خيارًا */
function chalOtherTexts(){
  var cnt = {}, raw = {};
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id]; if (!r || !(r.chals || []).some(function(c){ return chalKey(c) === 'أخرى'; })) return;
    var txt = String(r.chal_note || r.note || '').trim(); if (!txt) return;
    var k = txt.replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة\b/g, 'ه').replace(/\s+/g, ' ').toLowerCase().slice(0, 80);
    cnt[k] = (cnt[k] || 0) + 1; if (!raw[k]) raw[k] = txt.slice(0, 80);
  });
  return Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; }).map(function(k){ return { n:cnt[k], txt:raw[k] }; });
}
function chalOtherCard(){
  if (rankOf(ROLE) < rankOf('engineer')) return '';
  var L = chalOtherTexts();
  return card('ما كُتب تحت «أخرى»', '<p class="hint" style="margin-top:0">' + esc(t('الأكثرُ تكرارًا من النصوص الحرّة — لتقرّر ما يصير خيارًا في النموذج. لا يُضاف خيارٌ من تلقاء النظام.')) + '</p>'
    + (L.length ? '<table class="tbl"><thead><tr><th>' + esc(t('النص')) + '</th><th>' + esc(t('مرات')) + '</th></tr></thead><tbody>'
        + L.slice(0, 15).map(function(o){ return '<tr><td dir="auto">' + esc(o.txt) + '</td><td class="num">' + nm(o.n) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="hint" style="margin:0">' + esc(t('لا نصَّ حرًّا تحت «أخرى» بعد.')) + '</p>'));
}
/* الهيكلُ والعارضة: حديدٌ يُشترى ويُجهَّز — يُفرَز وحدَه ليُخطَّط له مبكّرًا */
function svdMetal(ch){
  return ch.some(function(c){ return /^لا يوجد سطح تثبيت/.test(c) || /^العارضة/.test(c); });   /* (V37.3) واسمُ الفئة «العارضة ناقصة…» */
}
/* ═══ الغرفُ — لكلِّ غرفةٍ حساسُ حرارةٍ ورطوبة (V17.70) ═══
   عددُ الغرف ليس رقمًا للعلم: منه تُشترى الحساسات. فيُقرأ من عدِّ الميدان في
   الزيارة، وإلا من سجل الوزارة، وإلا — في منى وحدَها — متوسطُ اثنتي عشرة
   غرفةً للمخيم، ويُقال إنه مقدَّرٌ لا معدود. ومخيمُ منى الذي لم يُعَدَّ يُفرَز
   في بطاقةٍ ليُعَدَّ في الزيارة القادمة. */
function svdAvgRooms(zone){
  var v = cfgGet('avgRooms', zone);
  return v || (zone === 'منى' ? 12 : 0);
}
function svdRoomsOf(x, r){
  var f = r ? cfgN(r.tents) : 0;
  if (f) return { n:f, src:'field' };
  var g = cfgN(x.tents);
  if (g) return { n:g, src:'registry' };
  var a = x.type === 'مخيم' ? svdAvgRooms(x.zone) : 0;
  return a ? { n:a, src:'avg' } : { n:0, src:'none' };
}
var SVD_SRC = { field:'عدُّ الميدان', registry:'سجلُّ الوزارة', avg:'متوسطٌ مقدَّر', none:'بلا عدد' };
function svdRows(){
  var out = [];
  (STATE.sites || []).forEach(function(x){
    var r = STATE.recs[x.id];
    if (!svVisited(r)) return;   /* (V32.6) */
    var ch = svdChals(r), rm = svdRoomsOf(x, r);
    out.push({ x:x, r:r, ch:ch, camp:x.type === 'مخيم', rooms:rm.n, src:rm.src, metal:svdMetal(ch),
               life:(typeof lifeOf === 'function' ? lifeOf(x) : '') });
  });
  return out;
}
/* مخيماتُ منى كلُّها — مُسِحت أو لم تُمسَح — لتقدير الحساسات المطلوبة للموسم */
function svdMina(){
  return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && x.zone === 'منى'; })
    .map(function(x){ var r = STATE.recs[x.id], rm = svdRoomsOf(x, r && svDone(r) ? r : null);
      return { x:x, r:r, ch:[], camp:true, rooms:rm.n, src:rm.src, metal:false, life:(typeof lifeOf === 'function' ? lifeOf(x) : '') }; });
}
var SVD_CARDS = [
  { k:'camps',   t:'مخيماتٌ تمت زيارتها',            w:'زارها الميدانُ وسُجّلت زيارتُها',                    f:function(o){ return o.camp; },
    of:function(){ return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم'; }).length; } },
  { k:'rooms',   t:'غرفٌ — لكلِّ غرفةٍ حساس',   w:'من عدِّ الميدان، وإلا سجلُّ الوزارة، وإلا متوسطُ منى',  f:function(o){ return o.camp && o.rooms > 0; }, sum:true },
  { k:'nocount', t:'مخيماتٌ بلا عدِّ غرف',      w:'عُدَّت بالمتوسط — تُعَدُّ في الزيارة القادمة',         f:function(o){ return o.camp && o.src !== 'field' && o.src !== 'registry'; } },
  /* (V33.6) مراجعةُ الأرقام بعد بلاغ القطار: «بلا تحدٍّ — تُسنَد كما هي» كان يعدّ ما زير ولم يُوصَل إليه (لا تحدّيَ مكتوبًا فيه) فيقول
     للمكتب «أسنِده للتركيب» وهو يحتاج زيارةً أخرى. صار بالتعريف الواحد: svClean وsvObstacle — ومجموعُهما «تمت الزيارة». */
  { k:'clean',   t:'بلا تحدٍّ — تُسنَد كما هي', w:'لا شيءَ يمنع التركيب',                               f:function(o){ return svClean(o.r); } },
  { k:'chal',    t:'فيها تحدٍّ أو تحتاج زيارة أخرى', w:'لا تُجدوَل قبل قرارٍ أو تجهيزٍ أو زيارةٍ أخرى',        f:function(o){ return svObstacle(o.r); } },
  { k:'metal',   t:'تحتاج هيكلًا أو عارضة',     w:'حديدٌ يُشترى ويُجهَّز — يُخطَّط له مبكّرًا',          f:function(o){ return o.metal; } },
  { k:'other',   t:'ممراتٌ ونقاطٌ أخرى',        w:'ما ليس مخيمًا مما مُسح',                             f:function(o){ return !o.camp; } },
  /* التقديرُ للموسم لا ما حُصر: منى كلُّها، المعدودُ بعدِّه وما لم يُعَدَّ بالمتوسط */
  { k:'sensors', t:'حساساتٌ مطلوبةٌ لمنى — تقدير', w:'كلُّ مخيمات منى: المعدودُ بعدِّه، وغيرُه بالمتوسط', f:function(o){ return true; }, sum:true, pool:'mina' }
];
/* الصفوفُ تُحسَب مرةً لكلِّ رسمة (V17.70) — كانت تُعاد لكلِّ بطاقةٍ على حدة */
var SVD_MEMO = null;
function svdPool(c){
  if (!SVD_MEMO) SVD_MEMO = { rows:svdRows(), mina:svdMina() };
  return c && c.pool === 'mina' ? SVD_MEMO.mina : SVD_MEMO.rows;
}
function svdCard(c){
  var R = svdPool(c).filter(c.f);
  var v = c.sum ? R.reduce(function(a, o){ return a + o.rooms; }, 0) : R.length;
  var on = SVD_PICK === c.k;
  return '<button class="btn ' + (on ? 'btn-primary' : 'btn-quiet') + '" data-svd="' + esc(c.k) + '"'
    + ' style="flex:1 1 160px;min-width:160px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;text-align:start">'
    + '<span class="num" style="font-size:22px;line-height:1.1">' + nm(v)
    +   (c.of ? ' <span class="hint" style="font-size:12px">' + esc(t('من')) + ' ' + nm(c.of()) + '</span>' : '') + '</span>'
    + '<span>' + esc(t(c.t)) + '</span>'
    + (c.sum ? '<span class="hint" style="margin:0">' + esc(t('معدود')) + ' <b class="num">' + nm(R.filter(function(o){ return o.src === 'field' || o.src === 'registry'; }).reduce(function(a, o){ return a + o.rooms; }, 0)) + '</b>'
                 + ' \u00b7 ' + esc(t('مقدَّر')) + ' <b class="num">' + nm(R.filter(function(o){ return o.src === 'avg'; }).reduce(function(a, o){ return a + o.rooms; }, 0)) + '</b></span>' : '')
    + '<span class="hint" style="margin:0">' + esc(t(c.w)) + '</span></button>';
}
function svdPicked(){
  var c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  return c ? svdPool(c).filter(c.f) : [];
}
function svdWhy(o){
  var rv = svNeedsRevisit(o.r) ? [t('تحتاج زيارة أخرى')] : [];   /* (V33.6) السببُ يُقال لا «لا توجد تحديات» */
  return (rv.length || o.ch.length) ? rv.concat(o.ch.map(function(c){ return t(c); })).join(' \u00b7 ') : t('لا توجد تحديات');
}
function svdXls(){
  var c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  if (!c) return;
  var out = [['رقم الشاخص / الاسم','المعرّف','الاسم','المشعر','النوع','الشركة','المربع','الشاخص','الغرف/الخيام','مصدر العدد','الحالة','التحديات','مَن زار','متى','خط العرض','خط الطول']];
  svdPicked().forEach(function(o){
    out.push([siteKey(o.x), o.x.id, o.x.name || '', o.x.zone || '', o.x.type || '', o.x.co || '', o.x.sq || '', o.x.sign || '',
              o.rooms || '', SVD_SRC[o.src] || '', (LIFE[o.life] && LIFE[o.life].n) || '',
              o.ch.join(' | ') || (o.r ? 'لا توجد تحديات' : ''), (o.r && o.r.by) || '', o.r ? dayKey(o.r.at || 0) : '',
              o.x.lat || '', o.x.lng || '']);
  });
  xlsSheets([[t(c.t).slice(0, 28), out]], 'أفاقي — ' + t(c.t));
}
function svdashBody(){
  SVD_MEMO = null;
  var R = svdPool(), c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  var rooms = R.reduce(function(a, o){ return a + (o.camp ? o.rooms : 0); }, 0);
  var byCh = {};
  R.forEach(function(o){ o.ch.forEach(function(x){ byCh[x] = (byCh[x] || 0) + 1; }); });
  var chTop = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; });
  var L = svdPicked();
  return card('ما حُصر حتى الآن',
      '<p class="hint" style="margin-top:0">'
      + esc(t('من سجلات الزيارة نفسِها — ما لم تُسجَّل زيارتُه لا يُعَدُّ هنا. اضغط أيَّ بطاقةٍ لتفتح قائمتَها.')) + '</p>'
      + '<div class="wt-row" style="flex-wrap:wrap;gap:8px;align-items:stretch">'
      +   SVD_CARDS.map(svdCard).join('')
      + '</div>'
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('نقاطٌ تمت زيارتها')) + ' <b class="num">' + nm(R.length) + '</b>'
      +   ' \u00b7 ' + esc(t('غرفةٌ وخيمةٌ محصورة')) + ' <b class="num">' + nm(rooms) + '</b></p>'
      /* المتوسطُ يُضبَط حيث يُقرأ (V17.71) — لا في شاشةٍ بعيدة */
      + (may('settings')
          ? '<div class="field" style="max-width:300px;margin:8px 0 0"><label>' + esc(t('متوسطُ غرف مخيم منى — حين لا يُعَدّ')) + '</label>'
            + cfgInput('avgRooms', 'منى', { dec:0 })
            + '<p class="hint" style="margin:4px 0 0">' + esc(t('فارغٌ يعني اثنتي عشرة غرفة')) + '</p></div>'
          : ''))
    + (chTop.length
        ? card('التحدياتُ بأنواعها',
            table(['التحدي','النقاط'], chTop.map(function(x){ return [esc(t(x)), N(byCh[x])]; }))
            + '<p class="hint">' + esc(t('نقطةٌ واحدةٌ قد تحمل أكثرَ من تحدٍّ — فمجموعُ الأسطر أكبرُ من عدد النقاط.')) + '</p>')
        : '')
    + (c
        ? card(c.t,
            '<div class="actions" style="margin:0 0 8px">'
            + btn('\u2913 ' + t('تصدير القائمة'),'btn-secondary btn-sm',' data-svdxls="1"')
            + btn(t('إغلاق القائمة'),'btn-quiet btn-sm',' data-svd="' + esc(c.k) + '"')
            + '</div>'
            + (L.length
                ? table(['المعرّف','المشعر','الغرف','الحالة','ما فيها','مَن زار','متى',''],
                    L.slice(0, 400).map(function(o){
                      var lf = LIFE[o.life];
                      return [siteIdHtml(o.x)
                                + (o.x.name ? '<br><span class="hint" style="margin:0">' + esc(o.x.name) + '</span>' : ''),
                              esc(t(o.x.zone || '')) + '<br><span class="hint" style="margin:0">' + esc(t(o.x.type || '')) + '</span>',
                              (o.rooms ? N(o.rooms) : '\u2014')
                                + (o.camp ? '<br><span class="hint" style="margin:0">' + esc(t(SVD_SRC[o.src] || '')) + '</span>' : ''),
                              lf ? '<span class="pill" style="border-color:' + esc(lf.c) + ';color:' + esc(lf.c) + '">' + esc(t(lf.n)) + '</span>' : '\u2014',
                              '<span class="hint" style="margin:0">' + esc(o.r ? svdWhy(o) : t('لم تُزر بعد')) + '</span>',
                              esc((o.r && o.r.by) || '\u2014'), esc(o.r ? dayKey(o.r.at || 0) : '\u2014'),
                              btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(o.x.id) + '"')];
                    }))
                  + (L.length > 400 ? '<p class="hint">' + esc(t('عُرض أوّلُ أربعمئة — والتصديرُ يشمل الكلَّ.')) + '</p>' : '')
                : alertBox('info','لا نقاطَ في هذه البطاقة بعد.')))
        : '');
}

