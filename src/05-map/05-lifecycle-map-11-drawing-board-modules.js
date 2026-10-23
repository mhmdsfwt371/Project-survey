/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-11-drawing-board-modules.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Drawing board and its modules: survey details, single challenge key, rooms with sensors.
   DEFINES : routePanelHtml, mapUIHtml, mapDraw, mapFallback, fieldRecords, fieldTools, dayDone, chalKey, chalKeys, svdChals, chalOtherTexts, chalOtherCard, svdMetal, svdAvgRooms … (+9 more)
   GLOBALS : SITE_Q, SVD_PICK, CHAL_ALIAS, SVD_SRC, SVD_CARDS, SVD_MEMO
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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


var SVD_SRC = { field:'عدُّ الميدان', registry:'سجلُّ الوزارة', avg:'متوسطٌ مقدَّر', none:'بلا عدد' };


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


