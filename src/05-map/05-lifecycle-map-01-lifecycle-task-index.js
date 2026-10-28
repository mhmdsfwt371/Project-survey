/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-01-lifecycle-task-index.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Point lifecycle (one state read by all), task index by point and type, and stacked points on one coordinate.
   DEFINES : taskIndex, taskKindOf, lifeOf, lifeOfRaw, lifeColor, mapColorOf, mapLoad, mapInit, mapDupIndex, mapPosOf, mapPaintDebounced, mapPaintMove
   GLOBALS : LIFE, LIFE_ORDER, TK_IX, _mapT, MAP_DUP, _mapMoveT
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ دورةُ حياة النقطة — حالةٌ واحدةٌ يقرؤها الجميع ═══
   كانت الألوانُ تُقرَّر في ثلاثة مواضع: طبقةُ المسح لها ألوانُها، وطبقةُ
   التركيب حالاتُها، والأسطورةُ تكتب ما تظنّه. فيختلف اللونُ عن معناه ولا
   يُلاحَظ. صارت الحالةُ تُشتقُّ مرةً واحدةً من السجلات نفسِها، ومنها يُؤخَذ
   اللونُ في الخريطة وفي الأسطورة وفي رسم الدورة — فما تراه على الخريطة هو
   ما يشرحه الرسم بالحرف.

   الترتيبُ من آخر ما جرى إلى أوّله: الفكُّ يغلب الصيانة، والصيانةُ تغلب
   التركيب، والتركيبُ يغلب الجدولة، وهكذا — فالنقطةُ تلبس لونَ آخر مرحلةٍ
   بلغتها لا أوّلِها. */
var LIFE = {
  todo:      { c:'#9FB0AA', n:'لم تُزر',                 d:'لم تُسجَّل زيارتُها بعد.' },
  stuck:     { c:'#8D6E63', n:'تحتاج زيارة أخرى', d:'تمت الزيارة ولم يستكمل المسح (الطريق مغلق أو لا تصريح أو منع الدخول أو الموقع غير مطابق) — تزار مرة أخرى، والسبب في سجل النقطة.' },
  tech:      { c:'#E67E22', n:'تحتاج زيارة تقنية', d:'تحت كوبري أو عند بداية نفق، أو ممر بلا سطح تثبيت — زيارة تقنية قبل التركيب.' },   /* (V37.15) تعريفُ المالك */
  assigned:  { c:'#C9A27E', n:'زيارةٌ مُسندة',            d:'أُسندت لمشرفٍ ولم تُزر بعد.' },
  tomorrow:  { c:'#B388FF', n:'مجدولةٌ غدًا',             d:'موعدُ زيارتها غدًا.' },
  visited:   { c:'#4FA3FF', n:'زيارةٌ تمّت — تنتظر الاعتماد', d:'المشرفُ زارها وحفظ، والمهندسُ لم يراجعها بعد.' },
  revisit:   { c:'#FF8FA3', n:'أعادها المهندس — زيارة أخرى', d:'ردَّها المهندسُ بسببٍ مكتوب، وعادت إلى مهام المشرف.' },
  minwait:   { c:'#F2B134', n:'معتمدةٌ تقنيًّا — بانتظار الوزارة', d:'اعتمدها المهندسُ تقنيًّا، وتنتظر اعتمادَ الوزارة لإعداد التركيب.' },
  minback:   { c:'#D96C6C', n:'ردّتها الوزارة — تحتاج معالجة', d:'أعادتها الوزارةُ بملاحظةٍ — يعالجها المهندسُ ويرفعها ثانيةً.' },
  ready:     { c:'#FF8C42', n:'معتمدةٌ من الوزارة — بانتظار الجدولة', d:'اعتمدت الوزارةُ إعدادَ تركيبها، وتنتظر إسنادَ تركيب.' },
  sched:     { c:'#7C5CFF', n:'مجدولة للتركيب',            d:'أُسند تركيبُها لفريقٍ بموعد.' },   /* (V37.64) الاسمُ نفسُه في اللوحات */
  /* (V38.60) the two quick statuses of an installation that were pressed and never coloured */
  inprog:    { c:'#F2B134', n:'قيد التركيب',               d:'بدأ تركيبُها ولم يُكتمل بعد.' },
  insfail:   { c:'#E05252', n:'تعذّر التركيب',             d:'سُجِّل تعذُّرُ تركيبها — السببُ في سجلّ النقطة.' },
  installed: { c:'#3AD6A0', n:'مُركّبة',                  d:'اكتمل تركيبُها واعتُمد — تنتظر التسليم.' },
  handed:    { c:'#12A594', n:'سُلِّمت للعميل',            d:'حُرِّر محضرُ تسليمها وبدأ ضمانُها — ومنها يُتاح الفك.' },
  maint:     { c:'#F5D547', n:'صيانةٌ مُسندة',            d:'أُسندت لها زيارةُ صيانةٍ في أثناء الموسم.' },
  dis:       { c:'#E01B1B', n:'فكٌّ مُسند أو تمّ',         d:'أُسند فكُّها بعد الموسم أو تمّ فعلًا.' }
};
var LIFE_ORDER = ['todo','stuck','tech','assigned','tomorrow','visited',   /* (V37.52) بلاغُ المالك: «فلتر تحتاج زيارة تقنية مش لاقيه» — الحالةُ كانت تُحسَب وتُلوَّن ولا تُرشَّح */'revisit','minwait','minback','ready','sched','inprog','insfail','installed','handed','maint','dis'];
/* مهمةٌ مفتوحةٌ من نوعٍ بعينه على هذه النقطة */
/* ═══ فهرسُ المهامِّ بالنقطة والنوع (V17.47) ═══
   كانت الدالةُ تمرُّ على المهامِّ كلِّها لكلِّ نقطةٍ ولكلِّ نوع: ألفٌ وسبعُمئةٍ
   وسبعٌ وثمانون نقطةً × تسعُمئةِ مهمةٍ × أربعةِ أنواعٍ ≈ ستةُ ملايينِ دورةٍ في
   كلِّ رسم — فبلغ رسمُ الخريطة وقائمةِ المواقع سبعَ مئةِ جزءٍ من الثانية على
   بياناتِ موسم. صار الفهرسُ يُبنى مرةً ويُبطَل عند تغيُّر المهامّ: مفتاحُه
   «النقطة|النوع»، فالبحثُ لحظيّ. */
var TK_IX = null;

function taskIndex(){
  /* لا يُعاد بناءُ الفهرس إلا بعد إبطالِه في statBump — وكان التحقُّقُ من
     صلاحيته يمرُّ على مفاتيح المهامِّ في كلِّ نداءٍ (ستةُ آلافِ نداءٍ في الرسم
     الواحد × تسعُمئةِ مفتاح)، فصار التحقُّقُ أغلى من الفهرس نفسِه. */
  if (TK_IX) return TK_IX;
  var T = STATE.tasks || {}, ix = {};
  for (var k in T){
    var x = T[k];
    if (!x || !x.site || x.status === 'معتمد') continue;
    var key = x.site + '|' + x.kind;
    if (!ix[key]) ix[key] = x;
    if (!ix['*|' + x.site]) ix['*|' + x.site] = x;   /* (V26.1) أوّلُ مهمةٍ مفتوحةٍ على النقطة أيًّا كان نوعُها — لـasnOf */
  }
  TK_IX = ix;
  return ix;
}
function taskKindOf(id, kind){ return taskIndex()[id + '|' + kind] || null; }
function lifeOf(x){
  /* (V25.3) داخل رسمة الخريطة تُحسَب الحالةُ مرةً لكلِّ نقطة — الحفظُ يُفتَح مع الرسمة ويُغلَق بعدها فلا يُقدِّم قديمًا */
  var m = MK.lifeMemo || (DB.memo && x && x.id ? DB.memo.life : null);   /* (V31.6/V31.8) داخل رسم الصفحة أيضًا */
  if (!m) return lifeOfRaw(x);
  var v = m[x.id];
  if (v === undefined){ v = lifeOfRaw(x); m[x.id] = v; }
  return v;
}
function lifeOfRaw(x){
  var id = x.id;
  if (disDone(id) || taskKindOf(id, 'dis')) return 'dis';
  if (taskKindOf(id, 'maint')) return 'maint';
  if (handDone(id)) return 'handed';
  if (insDone(id)) return 'installed';
  /* (V38.60) «قيد التركيب» and «متعذّر» from the quick marks or the form colour the point — they stayed «scheduled» */
  var insQ = STATE.inss[id];
  if (insQ && insStatusIs(insQ.status, 'متعذّر')) return 'insfail';
  if (insQ && insStatusIs(insQ.status, 'قيد التركيب')) return 'inprog';
  if (taskKindOf(id, 'install')) return 'sched';
  var r = STATE.recs[id], rv = (typeof svReview === 'function') ? svReview(r) : '';
  /* المتعذّرُ يُحكَم به قبل قرار المراجعة (V17.77): سجلٌّ لم يصل صاحبُه إلى
     النقطة متعذّرٌ مهما كُتب في حقل المراجعة — كان يُعَدُّ «مردودًا» إن رُدَّ
     أو «زيارةً تمّت» إن بقي معلَّقًا، فيقول الملخّصُ خمسةً وتقول شاشةُ المسح
     عشرة أمام الوزارة نفسِها */
  if (svStuck(r)) return 'stuck';
  if (rv !== 'approved' && rv !== 'revisit' && typeof techVisit === 'function' && techVisit(x, r)) return 'tech';   /* (V37.15) قبل الاعتماد */
  if (rv === 'approved'){
    var ms = minState(r);
    if (ms === 'returned') return 'minback';
    if (ms !== 'approved') return 'minwait';
    return 'ready';
  }
  if (rv === 'revisit') return 'revisit';
  if (rv === 'pending') return 'visited';
  var tk = taskKindOf(id, 'visit');
  if (tk) return (tk.when && tk.when > dayKey(Date.now())) ? 'tomorrow' : 'assigned';
  return 'todo';
}
function lifeColor(x){ return (LIFE[lifeOf(x)] || LIFE.todo).c; }
/* ألوانُ دورة الزيارة — تبقى لتلوينِ «نقاطي» في طبقة المسح */
function mapColorOf(x){
  if (timeState().on) return timeColorOf(x);   /* (V39.17) the season replayed: the stage reached by the chosen day */
  if (liveState().on) return liveColorOf(x);   /* (V39.20) the live twin: the reader's pulse, the camp's fullness */
  /* وضعُ الشركات: ما له شركةٌ يلبس لونَها، وما لا شركةَ له يبقى على لون
     طبقته. وكان كلُّ ما لا شركةَ له يُرمَّد — فتختفي الممراتُ والمحطاتُ
     والكاميراتُ تحت لونٍ واحدٍ باهت، ويظنُّ الناظرُ أنها خرجت من الطبقة.
     وليست خارجَها: هي بلا شركةٍ فقط. والترشيحُ فعلٌ آخر يقع عند اختيار
     شركاتٍ بعينها — لا عند التلوين. */
  if ((CO_OPEN || PV.CO_MODE) && x.co) return coColor(x.co);
  if (PV.CO_SEL.length && x.co) return coColor(x.co);
  /* لونُ التصنيف كان يفوز متى رُشِّح نوعٌ — فتصير كلُّ النقاط لونًا واحدًا
     ويختفي ما زير مما لم يُزَر. والتصنيفُ معلومٌ حين يُرشَّح، والحالةُ هي
     المطلوبة. فصار لونُ التصنيف لغير طبقات الميدان وحدَها. */
  /* طبقةُ التفاصيل: اللونُ خبرٌ لا تصنيف — تمامٌ أخضرُ وتحدٍّ أحمرُ وملاحظةٌ
     صفراء، وما لم يُكتَب بعدُ رمادٌ يقول «ينتظر سطرًا». */
  if (FILT.type && FIELD_MODE !== 'survey' && typeof CAT_DEF === 'object' && catDefOf(x)) return catDefOf(x).c;
  /* طبقةُ المسح: دورةُ الزيارة كاملةً بألوانها — لم يُزر · مُسندٌ إليك ·
     مُسندٌ لغيرك · مجدولٌ غدًا · تحتاج زيارةً أخرى · تمت وتنتظر الاعتماد ·
     معتمدة. فالمشرفُ يرى نقاطَه بلونٍ لا يشبه نقاطَ غيره، والوزارةُ ترى ما
     انتهى وما يجري وما سيجري غدًا على الخريطة نفسِها. */
  /* طبقةُ المسح: لونُ دورة الحياة كاملةً — من «لم تُزر» إلى «الفك».
     ومن أراد أن يرى نقاطَه هو وحدَه ضغط «نقاطي» فتُرشَّح القائمةُ نفسُها. */
  if (FIELD_MODE === 'survey' && typeof lifeOf === 'function') return lifeColor(x);
  /* لونُ الطبقة: المنجَزُ بلونها والجاهزُ أصفرُ انتظار والمُسنَدُ برتقالي */
  if (typeof LAYERS === 'object' && LAYERS[FIELD_MODE]){
    var L = LAYERS[FIELD_MODE];
    if (L.done(x)) return L.c;
    /* التركيبُ بألوان دورة الحياة نفسِها: المعتمدةُ الجاهزةُ للإسناد برتقاليةٌ
       (كما هي في طبقة المسح) والمُسندةُ بنفسجية — فلا يتبدّل معنى اللون بين طبقتين */
    if (FIELD_MODE === 'install') return asnOf(x.id) ? LIFE.sched.c : LIFE.ready.c;
    if (asnOf(x.id)) return '#FF8C42';
    return '#E8C34B';
  }
  if (FIELD_MODE === 'survey')
    return PV.MAP_COL.survey[STATE.recs[x.id] ? 'تمت الزيارة' : 'لم يُزر'];
  var st = (STATE.inss[x.id] || {}).status || x.fstat || 'لم يبدأ';
  return PV.MAP_COL.install[st] || PV.MAP_COL.install['لم يبدأ'];
}

/* تحميل Leaflet كسولًا — لا يُثقل الإقلاع ولا يُطلَب قبل فتح الخريطة */
function mapLoad(){
  if (PV.MAP_READY) return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.L){ PV.MAP_READY = true; return Promise.resolve(true); }
  if (PV.MAP_LOADING) return PV.MAP_LOADING;

  PV.MAP_LOADING = new Promise(function(res){
    /* ═══ Leaflet من المستودع لا من شبكةٍ عامة ═══
       كانت تُحمَّل من unpkg: خدمةٌ ثالثةٌ لا يُخزّنها عاملُ الخلفية، فإن
       انقطعت الشبكةُ في المشاعر أو سقط الموقعُ العامُّ ماتت الخريطةُ وحدَها —
       والخريطةُ مدخلُ الميدان. صارت في المستودع نفسِه وتُخزَّن مع الهيكل،
       فتعمل حيث يعمل التطبيق، ويُختبَر ذلك في متصفّحٍ حقيقيٍّ بلا شبكة. */
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/leaflet/leaflet.css';
    document.head.appendChild(css);

    var js = document.createElement('script');
    js.src = 'vendor/leaflet/leaflet.js';
    js.onload  = function(){ PV.MAP_READY = true; res(true); };
    js.onerror = function(){ res(false); };
    document.head.appendChild(js);

    setTimeout(function(){ if (!PV.MAP_READY) res(false); }, 9000);
  });
  return PV.MAP_LOADING;
}

function mapInit(){
  var el = document.getElementById('mapBox');
  if (!el || !window.L) return false;
  if (MAP){
    try{ MAP.invalidateSize(); }catch(e){}
    setTimeout(function(){ try{ MAP.invalidateSize(); mapPaint(true); }catch(e){} }, 60);   /* (V30.9) تصحيحُ القياس لا يغيّر الزوم — رسمةٌ خفيفة */
    /* (V30.9) رسمُ الصفحة لا يعني تغيّرَ النقاط: إن لم يتغيّر الإحصاءُ ولا المرشِّحُ ولا الطبقةُ ولا التحديدُ ولا الشركاتُ ولا الوضعُ
       فرسمةٌ خفيفة — وما يغيّر هذه يستدعي mapPaint() بنفسه (المزامنةُ والفلاترُ والطبقاتُ والتحديدُ والوضع) */
    var sig = STAT_VER + '|' + JSON.stringify(FILT) + '|' + (typeof MAP_LAYER === 'undefined' ? '' : MAP_LAYER) + '|' + SEL_N + '|' + PV.CO_SEL.join(',') + '|' + FIELD_MODE + '|' + ((typeof SUN_ON !== 'undefined' && SUN_ON) ? 1 : 0) + '|' + ((typeof KIOSK_ON !== 'undefined' && KIOSK_ON) ? 1 : 0) + '|' + '|' + dayKey(Date.now());   /* (V32.4) يومُ مكة في البصمة: «غدًا» تصير «اليوم» بعد منتصف الليل */   /* (V31.1) */
    if (sig === MK.sig && MK.list && !MAP_3D){ mapPaint(true); basemapKick(); return true; }
    MK.sig = sig;
    mapPaint();
    basemapKick();   /* (V24.9) خريطةُ الجهاز بعد الدخول وحين تخمل الصفحة */
    return true;
  }

  bootStage('map');
  var fz = mapFlySoon.id ? siteFind(mapFlySoon.id) : null;   /* (V38.20) تُبنى الخريطةُ عند النقطة المطلوبة إن وُجدت */
  MAP = L.map(el, { preferCanvas:true, zoomControl:false, attributionControl:true })
         .setView(fz && fz.lat ? [fz.lat, fz.lng] : [21.38, 39.92], fz && fz.lat ? 18 : 12);
  try { MAP.whenReady(vitMapReady); } catch (e){ vitMapReady(); }   /* أوّلُ خريطةٍ بعد الفتح (V17.98) */
  L.control.zoom({ position:'topleft' }).addTo(MAP);

  MAP_BASE = L.tileLayer(MAP_SAT ? TILES.esri : TILES.osm, {
    maxZoom:19, maxNativeZoom:18, className:'nskBase', crossOrigin:true, keepBuffer:1, updateWhenIdle:true, updateWhenZooming:false,   /* (V39.17) maxNativeZoom: the 19th zoom stretches the 18th — the imagery has no 19th here, it sent grey «no data» tiles */   /* (V34.2) ذاكرةٌ أقلّ على الآيفون */
    attribution: MAP_SAT ? '&copy; Esri' : '&copy; OpenStreetMap'
  }).addTo(MAP);

  /* بديلٌ تلقائيٌّ مرةً واحدةً عند تعثّرٍ متكرّر */
  var errs = 0, swapped = false, tBad = 0;
  /* (V25.0) اثنا عشرَ تعثّرًا متتاليًا بلا بلاطةٍ واصلة (بعد تجربة البديل): الشبكةُ غائبةٌ فعلًا — خريطةُ الجهاز */
  MAP_BASE.on('tileload', function(){ tBad = 0; });
  MAP_BASE.on('tileerror', function(){ if (++tBad >= 12 && !BASEMAP.netDown){ BASEMAP.netDown = true; try { basemapSwap(); } catch (e){ LS_ERR = e; } } });
  MAP_BASE.on('tileerror', function(){
    if (swapped || ++errs < 8) return;
    swapped = true;
    mapSat(!MAP_SAT); if (CUR === 'map') render(1);   /* (V25.1) البديلُ هو الطبقةُ الأخرى — القمرُ هو الأساسُ الآن */
    toast('تعذّر المزوّد — تحوّلنا لبديل');
  });

  /* ═══ هامشُ اللمس ═══
     الإصبعُ أعرضُ من النقطة: ممرٌّ نصفُ قطره ثلاثةُ بكسلاتٍ على مستوى تقريبٍ
     متوسط لا يُصاب إلا بالحظّ، فيضغط المرءُ ثلاثًا فتتحرّك الخريطةُ ولا تُفتَح
     النقطة. وLeaflet يقيس الإصابةَ على الرسم نفسِه ما لم يُعطَ هامشًا —
     فأُعطي: اثنا عشرَ بكسلًا حول كلِّ شكلٍ في اللوح، لا يُرى ولا يُبطئ،
     ويجعل هدفَ اللمس أربعةً وعشرين بكسلًا فأكثرَ لأصغر نقطة. */
  MAP_CV    = L.canvas({ padding:0.3, tolerance:12 });
  PV.MAP_POLY  = L.layerGroup().addTo(MAP);
  MAP_LAYER = L.layerGroup().addTo(MAP);
  MAP_TMP   = L.layerGroup().addTo(MAP);   /* (V24.1) المؤقّتاتُ: موضعُك ومسارُ الرسم — تُمسَح وحدَها */
  MK.by = {};
  basemapKick();   /* (V24.9) خريطةُ مكة: تُلحَق — وتُنزَّل أوّلَ مرة — بعد الدخول وحين تخمل الصفحة، لا في الإقلاع */
  if (POIL.on.ministry || POIL.on.tafweej) poiPaint();   /* (V25.2) */
  if (IOT.on) iotPaint();
  if (covPaint.on) covPaint();   /* (V39.14) */
  if (heatPaint.on) heatPaint();   /* (V39.16) */   /* (V25.7) */

  MAP.on('zoomend moveend', mapPaintMove);   /* (V25.3) التحريكُ رسمةٌ خفيفة، والتقريبُ وسائرُ التغييرات كاملة */
  MAP.on('click', function(e){
    if (IOT.edit){ iotMapClick(e.latlng); return; }   /* (V25.8) */
    if (BED){ if (BED.draw){ bedSnap(); BED.pts.push([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]); bedPaint(); render(1); return; }   /* (V37.17) */
      if (BED.sel >= 0){ BED.sel = -1; bedPaint(); render(1); } return; }   /* (V25.9) النقرُ خارج المقابض يُلغي التحديد لا غير */
    if (typeof PV.TFD === 'object' && PV.TFD.on){ tfdAdd(e.latlng.lat, e.latlng.lng); return; }   /* (V28.0) */
    if (typeof MOVE_ID !== 'undefined' && MOVE_ID) moveApply(e.latlng.lat, e.latlng.lng);
    else if (typeof PIN_ON !== 'undefined' && PIN_ON) pinApply(e.latlng.lat, e.latlng.lng);
    else if (typeof ROUTE === 'object' && ROUTE.on) routeAdd(e.latlng.lat, e.latlng.lng);
  });
  mapPaint();
  setTimeout(function(){ try{ MAP.invalidateSize(); mapPaint(true); }catch(e){} }, 120);   /* (V30.9) */
  return true;
}

/* الرسم — نقاطٌ دائمًا، ومضلّعاتٌ عند التقريب وحده */
PV._mapT = 0;
/* ═══ نقاطٌ على الإحداثية نفسِها تُرى كلُّها (V22.5) ═══
   «النوارية ١٧ ومش شايف غير ١٦»: نقطتان على الإحداثية نفسِها حتى خمس خانات، فالعليا تغطّي
   السفلى ولا تُلمَس. تُوزَّع النقاطُ المتطابقةُ على دائرةٍ صغيرةٍ حول موضعها بإزاحةٍ ثابتةٍ
   بالبكسل (ثلاثة عشر) في كلِّ تقريب — تُرى وتُلمَس كلٌّ منها، والإحداثيةُ المحفوظةُ لا تتغيّر. */
PV.MAP_DUP = { v:-1, n:0, k:{} };
function mapDupIndex(){
  var sv = (typeof STAT_VER !== 'undefined') ? STAT_VER : 0, n = (STATE.sites || []).length;
  if (PV.MAP_DUP.v === sv && PV.MAP_DUP.n === n) return PV.MAP_DUP.k;
  var k = {};
  (STATE.sites || []).forEach(function(x){ if (!(+x.lat) || !(+x.lng)) return; var key = (+x.lat).toFixed(5) + ',' + (+x.lng).toFixed(5); (k[key] = k[key] || []).push(x.id); });
  PV.MAP_DUP = { v:sv, n:n, k:k };
  return k;
}
function mapPosOf(x){
  var lat = +x.lat, lng = +x.lng, L0 = mapDupIndex()[lat.toFixed(5) + ',' + lng.toFixed(5)];
  if (!L0 || L0.length < 2 || typeof MAP === 'undefined' || !MAP || !MAP.getZoom) return [lat, lng];
  var i = L0.indexOf(x.id); if (i < 0) return [lat, lng];
  var cs = Math.cos(lat * Math.PI / 180), mpp = 156543.03 * cs / Math.pow(2, MAP.getZoom());
  var off = 13 * mpp, ang = 2 * Math.PI * i / L0.length;
  return [lat + off * Math.sin(ang) / 111320, lng + off * Math.cos(ang) / (111320 * cs)];
}
function mapPaintDebounced(){
  clearTimeout(PV._mapT);
  PV._mapT = setTimeout(mapPaint, 120);
}
PV._mapMoveT = null;
function mapPaintMove(){
  clearTimeout(PV._mapMoveT);
  PV._mapMoveT = setTimeout(function(){ mapPaint(true); }, 120);
}

