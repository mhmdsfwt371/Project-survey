
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
  stuck:     { c:'#8D6E63', n:'تحتاج زيارة أخرى تقنيًا', d:'تمت الزيارة — وتحتاج زيارةً أخرى تقنيًا (والسببُ في سجلّ النقطة) — تُزار ثانيةً.' },
  assigned:  { c:'#C9A27E', n:'زيارةٌ مُسندة',            d:'أُسندت لمشرفٍ ولم تُزر بعد.' },
  tomorrow:  { c:'#B388FF', n:'مجدولةٌ غدًا',             d:'موعدُ زيارتها غدًا.' },
  visited:   { c:'#4FA3FF', n:'زيارةٌ تمّت — تنتظر الاعتماد', d:'المشرفُ زارها وحفظ، والمهندسُ لم يراجعها بعد.' },
  revisit:   { c:'#FF8FA3', n:'تحتاج زيارةً أخرى',        d:'ردَّها المهندسُ بسببٍ مكتوب، وعادت إلى مهام المشرف.' },
  minwait:   { c:'#F2B134', n:'معتمدةٌ تقنيًّا — بانتظار الوزارة', d:'اعتمدها المهندسُ تقنيًّا، وتنتظر اعتمادَ الوزارة لإعداد التركيب.' },
  minback:   { c:'#D96C6C', n:'ردّتها الوزارة — تحتاج معالجة', d:'أعادتها الوزارةُ بملاحظةٍ — يعالجها المهندسُ ويرفعها ثانيةً.' },
  ready:     { c:'#FF8C42', n:'معتمدةٌ من الوزارة — بانتظار الجدولة', d:'اعتمدت الوزارةُ إعدادَ تركيبها، وتنتظر إسنادَ تركيب.' },
  sched:     { c:'#7C5CFF', n:'مُسندةٌ للتركيب',           d:'أُسند تركيبُها لفريقٍ بموعد.' },
  installed: { c:'#3AD6A0', n:'مُركّبة',                  d:'اكتمل تركيبُها واعتُمد — تنتظر التسليم.' },
  handed:    { c:'#12A594', n:'سُلِّمت للعميل',            d:'حُرِّر محضرُ تسليمها وبدأ ضمانُها — ومنها يُتاح الفك.' },
  maint:     { c:'#F5D547', n:'صيانةٌ مُسندة',            d:'أُسندت لها زيارةُ صيانةٍ في أثناء الموسم.' },
  dis:       { c:'#E01B1B', n:'فكٌّ مُسند أو تمّ',         d:'أُسند فكُّها بعد الموسم أو تمّ فعلًا.' }
};
var LIFE_ORDER = ['todo','stuck','assigned','tomorrow','visited','revisit','minwait','minback','ready','sched','installed','handed','maint','dis'];
/* مهمةٌ مفتوحةٌ من نوعٍ بعينه على هذه النقطة */
/* ═══ فهرسُ المهامِّ بالنقطة والنوع (V17.47) ═══
   كانت الدالةُ تمرُّ على المهامِّ كلِّها لكلِّ نقطةٍ ولكلِّ نوع: ألفٌ وسبعُمئةٍ
   وسبعٌ وثمانون نقطةً × تسعُمئةِ مهمةٍ × أربعةِ أنواعٍ ≈ ستةُ ملايينِ دورةٍ في
   كلِّ رسم — فبلغ رسمُ الخريطة وقائمةِ المواقع سبعَ مئةِ جزءٍ من الثانية على
   بياناتِ موسم. صار الفهرسُ يُبنى مرةً ويُبطَل عند تغيُّر المهامّ: مفتاحُه
   «النقطة|النوع»، فالبحثُ لحظيّ. */
var TK_IX = null;
/* من كتب مهمةً محليًّا يُبطِل الفهرسَ بهذه — فلا يُنسى النداءُ في موضعٍ جديد */
function tasksTouched(){ TK_IX = null; }
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
  if (taskKindOf(id, 'install')) return 'sched';
  var r = STATE.recs[id], rv = (typeof svReview === 'function') ? svReview(r) : '';
  /* المتعذّرُ يُحكَم به قبل قرار المراجعة (V17.77): سجلٌّ لم يصل صاحبُه إلى
     النقطة متعذّرٌ مهما كُتب في حقل المراجعة — كان يُعَدُّ «مردودًا» إن رُدَّ
     أو «زيارةً تمّت» إن بقي معلَّقًا، فيقول الملخّصُ خمسةً وتقول شاشةُ المسح
     عشرة أمام الوزارة نفسِها */
  if (svStuck(r)) return 'stuck';
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
var SV_COL = { todo:'#E8C34B', mine:'#FF8C42', others:'#C9A27E', tomorrow:'#B388FF',
               revisit:'#FF8FA3', pending:'#4FA3FF', approved:'#3AD6A0' };
function mapColorOf(x){
  /* وضعُ الشركات: ما له شركةٌ يلبس لونَها، وما لا شركةَ له يبقى على لون
     طبقته. وكان كلُّ ما لا شركةَ له يُرمَّد — فتختفي الممراتُ والمحطاتُ
     والكاميراتُ تحت لونٍ واحدٍ باهت، ويظنُّ الناظرُ أنها خرجت من الطبقة.
     وليست خارجَها: هي بلا شركةٍ فقط. والترشيحُ فعلٌ آخر يقع عند اختيار
     شركاتٍ بعينها — لا عند التلوين. */
  if ((CO_OPEN || CO_MODE) && x.co) return coColor(x.co);
  if (CO_SEL.length && x.co) return coColor(x.co);
  /* لونُ التصنيف كان يفوز متى رُشِّح نوعٌ — فتصير كلُّ النقاط لونًا واحدًا
     ويختفي ما زير مما لم يُزَر. والتصنيفُ معلومٌ حين يُرشَّح، والحالةُ هي
     المطلوبة. فصار لونُ التصنيف لغير طبقات الميدان وحدَها. */
  /* طبقةُ التفاصيل: اللونُ خبرٌ لا تصنيف — تمامٌ أخضرُ وتحدٍّ أحمرُ وملاحظةٌ
     صفراء، وما لم يُكتَب بعدُ رمادٌ يقول «ينتظر سطرًا». */
  if (FIELD_MODE === 'brief') return briefColor(x.id);
  if (FILT.type && FIELD_MODE !== 'survey' && typeof CAT_DEF === 'object' && CAT_DEF[x.type]) return CAT_DEF[x.type].c;
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
    return MAP_COL.survey[STATE.recs[x.id] ? 'تمت الزيارة' : 'لم يُزر'];
  var st = (STATE.inss[x.id] || {}).status || x.fstat || 'لم يبدأ';
  return MAP_COL.install[st] || MAP_COL.install['لم يبدأ'];
}

/* تحميل Leaflet كسولًا — لا يُثقل الإقلاع ولا يُطلَب قبل فتح الخريطة */
function mapLoad(){
  if (MAP_READY) return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.L){ MAP_READY = true; return Promise.resolve(true); }
  if (MAP_LOADING) return MAP_LOADING;

  MAP_LOADING = new Promise(function(res){
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
    js.onload  = function(){ MAP_READY = true; res(true); };
    js.onerror = function(){ res(false); };
    document.head.appendChild(js);

    setTimeout(function(){ if (!MAP_READY) res(false); }, 9000);
  });
  return MAP_LOADING;
}

function mapInit(){
  var el = document.getElementById('mapBox');
  if (!el || !window.L) return false;
  if (MAP){
    try{ MAP.invalidateSize(); }catch(e){}
    setTimeout(function(){ try{ MAP.invalidateSize(); mapPaint(true); }catch(e){} }, 60);   /* (V30.9) تصحيحُ القياس لا يغيّر الزوم — رسمةٌ خفيفة */
    /* (V30.9) رسمُ الصفحة لا يعني تغيّرَ النقاط: إن لم يتغيّر الإحصاءُ ولا المرشِّحُ ولا الطبقةُ ولا التحديدُ ولا الشركاتُ ولا الوضعُ
       فرسمةٌ خفيفة — وما يغيّر هذه يستدعي mapPaint() بنفسه (المزامنةُ والفلاترُ والطبقاتُ والتحديدُ والوضع) */
    var sig = STAT_VER + '|' + JSON.stringify(FILT) + '|' + (typeof MAP_LAYER === 'undefined' ? '' : MAP_LAYER) + '|' + SEL_N + '|' + CO_SEL.join(',') + '|' + FIELD_MODE + '|' + ((typeof SUN_ON !== 'undefined' && SUN_ON) ? 1 : 0) + '|' + ((typeof KIOSK_ON !== 'undefined' && KIOSK_ON) ? 1 : 0) + '|' + '|' + dayKey(Date.now());   /* (V32.4) يومُ مكة في البصمة: «غدًا» تصير «اليوم» بعد منتصف الليل */   /* (V31.1) */
    if (sig === MK.sig && MK.list && !MAP_3D){ mapPaint(true); basemapKick(); return true; }
    MK.sig = sig;
    mapPaint();
    basemapKick();   /* (V24.9) خريطةُ الجهاز بعد الدخول وحين تخمل الصفحة */
    return true;
  }

  bootStage('map');
  MAP = L.map(el, { preferCanvas:true, zoomControl:false, attributionControl:true })
         .setView([21.38, 39.92], 12);
  try { MAP.whenReady(vitMapReady); } catch (e){ vitMapReady(); }   /* أوّلُ خريطةٍ بعد الفتح (V17.98) */
  L.control.zoom({ position:'topleft' }).addTo(MAP);

  MAP_BASE = L.tileLayer(MAP_SAT ? TILES.esri : TILES.osm, {
    maxZoom:19, className:'nskBase', crossOrigin:true, keepBuffer:1, updateWhenIdle:true, updateWhenZooming:false,   /* (V34.2) ذاكرةٌ أقلّ على الآيفون */
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
  MAP_POLY  = L.layerGroup().addTo(MAP);
  MAP_LAYER = L.layerGroup().addTo(MAP);
  MAP_TMP   = L.layerGroup().addTo(MAP);   /* (V24.1) المؤقّتاتُ: موضعُك ومسارُ الرسم — تُمسَح وحدَها */
  MK.by = {};
  basemapKick();   /* (V24.9) خريطةُ مكة: تُلحَق — وتُنزَّل أوّلَ مرة — بعد الدخول وحين تخمل الصفحة، لا في الإقلاع */
  if (POIL.on.ministry || POIL.on.tafweej) poiPaint();   /* (V25.2) */
  if (IOT.on) iotPaint();   /* (V25.7) */

  MAP.on('zoomend moveend', mapPaintMove);   /* (V25.3) التحريكُ رسمةٌ خفيفة، والتقريبُ وسائرُ التغييرات كاملة */
  MAP.on('click', function(e){
    if (IOT.edit){ iotMapClick(e.latlng); return; }   /* (V25.8) */
    if (BED){ if (BED.sel >= 0){ BED.sel = -1; bedPaint(); render(1); } return; }   /* (V25.9) النقرُ خارج المقابض يُلغي التحديد لا غير */
    if (typeof TFD === 'object' && TFD.on){ tfdAdd(e.latlng.lat, e.latlng.lng); return; }   /* (V28.0) */
    if (typeof MOVE_ID !== 'undefined' && MOVE_ID) moveApply(e.latlng.lat, e.latlng.lng);
    else if (typeof PIN_ON !== 'undefined' && PIN_ON) pinApply(e.latlng.lat, e.latlng.lng);
    else if (typeof ROUTE === 'object' && ROUTE.on) routeAdd(e.latlng.lat, e.latlng.lng);
  });
  mapPaint();
  setTimeout(function(){ try{ MAP.invalidateSize(); mapPaint(true); }catch(e){} }, 120);   /* (V30.9) */
  return true;
}

/* الرسم — نقاطٌ دائمًا، ومضلّعاتٌ عند التقريب وحده */
var _mapT = 0;
/* ═══ نقاطٌ على الإحداثية نفسِها تُرى كلُّها (V22.5) ═══
   «النوارية ١٧ ومش شايف غير ١٦»: نقطتان على الإحداثية نفسِها حتى خمس خانات، فالعليا تغطّي
   السفلى ولا تُلمَس. تُوزَّع النقاطُ المتطابقةُ على دائرةٍ صغيرةٍ حول موضعها بإزاحةٍ ثابتةٍ
   بالبكسل (ثلاثة عشر) في كلِّ تقريب — تُرى وتُلمَس كلٌّ منها، والإحداثيةُ المحفوظةُ لا تتغيّر. */
var MAP_DUP = { v:-1, n:0, k:{} };
function mapDupIndex(){
  var sv = (typeof STAT_VER !== 'undefined') ? STAT_VER : 0, n = (STATE.sites || []).length;
  if (MAP_DUP.v === sv && MAP_DUP.n === n) return MAP_DUP.k;
  var k = {};
  (STATE.sites || []).forEach(function(x){ if (!(+x.lat) || !(+x.lng)) return; var key = (+x.lat).toFixed(5) + ',' + (+x.lng).toFixed(5); (k[key] = k[key] || []).push(x.id); });
  MAP_DUP = { v:sv, n:n, k:k };
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
  clearTimeout(_mapT);
  _mapT = setTimeout(mapPaint, 120);
}
var _mapMoveT = null;
function mapPaintMove(){
  clearTimeout(_mapMoveT);
  _mapMoveT = setTimeout(function(){ mapPaint(true); }, 120);
}

/* ═══ الخريطةُ لا تُعاد من الصفر (V24.1) ═══
   كان كلُّ تحريكٍ أو تقريبٍ يمسح العلاماتِ كلَّها ويُنشئها من جديد: نحو ألفِ مضلّعِ مخيمٍ تُبنى
   وتُمسح في كلِّ مرة (نحو ثلاثِمئة ملّي ثانية على الشاشة الكبيرة قبل أن يُرسَم شيء)، ومئتا
   معيّنٍ للممرّات والكاميرات عناصرَ DOM تتحرّك مع كلِّ تقريب — فثقلت الخريطة. صارت العلاماتُ
   باقية: تُنشأ مرةً وتُعدَّل خصائصُها فقط حين يتغيّر ما يرسمها (اللونُ أو التحديدُ أو الحافّةُ
   أو التقريب)، وما ابتعد عن الشاشة كثيرًا يُطرَح ويعود حين يقترب. والممرُّ والكاميرا معيّنان
   على لوح النقاط نفسِه بحجمها لا فوق المخيمات. والمؤقّتاتُ (موضعُك، ومسارُ الرسم) في مجموعةٍ
   تُمسَح وحدَها. مضلّعاتُ المخيمات تُدفَع إلى الخلف فتبقى النقاطُ فوقها أيًّا كان ترتيبُ الإنشاء. */
var MK = { by:{}, pLast:0, pTimer:0, pFull:false, sig:'', gen:0, defer:null };
/* علامةُ الشكل على اللوح بحجمٍ ثابتٍ بالبكسل (V24.1): المعيّنُ والمربّعُ والمثلّثُ وغيرُها تُرسَم برؤوس
   SHAPE_UNIT حول نقطتها على لوح النقاط نفسِه — فلا تُعاد مع كلِّ تقريبٍ كما كانت مضلّعاتُ shapeRing،
   ولا تكون عناصرَ DOM. النقرُ يُحسَب كالدائرة بنصف قطرها مع هامش اللوح. */
var ShapeMk = null;
function shapeMk(ll, opt, shape){
  if (!ShapeMk && typeof L !== 'undefined' && L.CircleMarker){
    ShapeMk = L.CircleMarker.extend({
      _updatePath: function(){
        var r = this._renderer, U = SHAPE_UNIT[this.options.shape];
        if (!r || !r._ctx || !U || this._empty()) return L.CircleMarker.prototype._updatePath.call(this);
        var ctx = r._ctx, p = this._point, k = this._radius;
        if (r._drawing === false) return;
        r._layers[this._leaflet_id] = this;
        ctx.beginPath();
        for (var i = 0; i < U.length; i++){ var x = p.x + U[i][0] * k, y = p.y + U[i][1] * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath();
        r._fillStroke(ctx, this);
      },
      /* إطارُ اللمس لا يقلُّ عن أربعةٍ وأربعين بكسلًا كما كان في علامة DOM — هدفُ إصبعٍ كاملٌ بلا تغييرِ منظر */
      _containsPoint: function(p){ var hit = Math.max(this._radius + this._clickTolerance(), 22); return p.distanceTo(this._point) <= hit; }
    });
  }
  opt.shape = shape;
  return ShapeMk ? new ShapeMk(ll, opt) : L.circleMarker(ll, L.extend({ renderer:MAP_CV }, opt));
}
function mapClickFn(id){
  return function(ev){
    /* (V25.9) في وضعي التعديل النقرُ على المخيم تحت الإصبع لا يفتح نافذتَه: يضع المحدَّد (الحساسات) أو يلغي التحديد (الحدود)
       — كانت النافذةُ تنفتح فوق التعديل فتبتلع النقرةَ التالية */
    if (typeof IOT === 'object' && IOT.edit){ if (ev && ev.latlng) iotMapClick(ev.latlng); return; }
    if (typeof BED !== 'undefined' && BED){ if (BED.sel >= 0){ BED.sel = -1; bedPaint(); render(1); } return; }
    if (typeof MAP_SELECT !== 'undefined' && MAP_SELECT){
      if (!asnOf(id)){ selToggle(id); mapPaint(); render(1); }
      else toast(t('هذه النقطة مُسندة بالفعل'));
      return;
    }
    /* الحدثُ نفسُه يصل بعدها إلى معالج المستند الذي يُغلق ما نُقر خارجه — فيُعلَّم بعينه لا بوقته (انظر popOpenAt). */
    popOpenAt(id, ev);
  };
}
/* (V25.3) جسدٌ واحدٌ لعلامة النقطة: يحسب شكلَها ولونَها ومفتاحَها ثم يُعدِّلها أو يُنشئها — تناديه الرسمةُ
   الكاملةُ لكلِّ نقطةٍ في الإطار، والرسمةُ الخفيفةُ (تحريكٌ بلا تقريب) للداخل إلى الإطار وحدَه */
var MK_PAD = 0.4;   /* هامشُ الإطار: كان ٠٫٦ (خمسةَ أضعاف الشاشة مساحةً) فتحمل الخريطةُ ضعفَ ما تراه من مضلّعاتٍ تُقصّ وتُرسَم مع كلِّ سحبة */
function mkPlace(x, z, r, sun, TOUCH){
  var picked = (typeof selHas === 'function') && selHas(x.id);
  var col = mapColorOf(x);
  /* طبقةُ التفاصيل: حافّةٌ تحمل خبرَ السطر المكتوب فوق لونِ المرحلة */
  var ring = (FIELD_MODE === 'brief' && !picked) ? briefRing(x.id) : '';
  var pos = mapPosOf(x), posK = pos[0].toFixed(6) + ',' + pos[1].toFixed(6), FT = null, kind, shp = 'circle';
  /* المخيمُ مضلّعٌ إن تقرّبت (POLY_Z) وإلا دائرة، والممرُّ والكاميرا معيّنان، وما عداهما شكلُ نوعه */
  if (x.type === 'مخيم' && z >= POLY_Z && (FT = campFoot(x))) kind = 'poly';
  else { shp = mapShapeOf(x.type); kind = shp !== 'circle' && SHAPE_UNIT[shp] ? 'shape' : 'circle'; }
  /* ما لم يُزر يُرى على القمر الصناعي (V17.86): حافّةٌ برتقاليةٌ متقطّعة */
  var todoSat = kind === 'poly' && !ring && !picked && MAP_SAT && lifeOf(x) === 'todo';
  var st, rad = picked ? r + 2.5 : r;
  if (kind === 'poly') st = { color: todoSat ? '#FFB000' : (ring || col), dashArray: todoSat ? '6 4' : null,
      weight: picked ? 2.4 : (ring ? 2 : (todoSat ? 2 : (z >= 15 ? 1.3 : (z >= 13 ? 1 : 0.8)))),
      fillColor:col, fillOpacity: picked ? 0.55 : (todoSat ? 0.18 : (z >= 15 ? 0.4 : 0.55)) };
  else st = { color: picked ? '#fff' : (ring || '#0B1220'), weight: (picked ? 2 : (ring ? 2 : 0.9)) * (sun ? 1.8 : 1),
      fillColor:col, fillOpacity: picked ? 1 : 0.95 };
  if (kind === 'shape') rad = rad * (shp === 'diamond' ? 1.18 : 1.05);   /* المعيّنُ أوسعُ قليلًا فيُعرَف بشكله */
  var key = kind + '|' + shp + '|' + posK + '|' + z + '|' + rad + '|' + st.color + '|' + st.weight + '|' + st.fillColor + '|' + st.fillOpacity + '|' + (st.dashArray || '');
  var e = MK.by[x.id];
  if (e && e.key === key) return;
  if (e && e.kind === kind && e.pos === posK && e.shp === shp){
    /* الشكلُ نفسُه في موضعه: تُعدَّل خصائصُه ولا يُعاد إنشاؤه — والدائرةُ والشكلُ بحجمٍ ثابتٍ بالبكسل فلا يُعادان مع التقريب */
    e.l.setStyle(st);
    if (kind !== 'poly') e.l.setRadius(rad);
    e.key = key; return;
  }
  if (e){ MAP_LAYER.removeLayer(e.l); delete MK.by[x.id]; }
  var mk = null;
  if (kind === 'poly') mk = L.polygon(FT.map(function(p){ return [p[1], p[0]]; }), L.extend({ renderer:MAP_CV }, st));
  else if (kind === 'shape'){ st.radius = rad; mk = shapeMk(pos, L.extend({ renderer:MAP_CV }, st), shp); }
  if (!mk){ st.radius = rad; mk = L.circleMarker(pos, L.extend({ renderer:MAP_CV }, st)); }
  mk.on('click', mapClickFn(x.id));
  mk.addTo(MAP_LAYER);
  if (kind === 'poly'){ try { mk.bringToBack(); } catch (e2){ LS_ERR = e2; } }
  MK.by[x.id] = { l:mk, kind:kind, shp:shp, key:key, pos:posK };
}
var MK_FIRST = 400;
function mkDrain(gen, z, r, sun, TOUCH){
  requestAnimationFrame(function(){
    if (gen !== MK.gen || !MK.defer) return;   /* رسمةٌ أحدثُ بدأت: هذه الدفعةُ لم تعد مطلوبة */
    var chunk = MK.defer.splice(0, MK_FIRST);
    MK.lifeMemo = {};
    for (var i = 0; i < chunk.length; i++) if (!MK.by[chunk[i].id]) mkPlace(chunk[i], z, r, sun, TOUCH);
    MK.lifeMemo = null;
    if (MK.defer.length) mkDrain(gen, z, r, sun, TOUCH); else MK.defer = null;
  });
}
function mkSweep(want){
  /* ما لم يعد مطلوبًا — بعيدٌ عن الشاشة أو مرشَّحٌ خارجًا أو محذوف — يُطرَح */
  var ids = Object.keys(MK.by);
  for (var q = 0; q < ids.length; q++) if (!want[ids[q]]){ MAP_LAYER.removeLayer(MK.by[ids[q]].l); delete MK.by[ids[q]]; }
}
function mkCount(LIST, inView){
  var lb = document.getElementById('mapCount');
  if (lb && !MAP_3D){
    var out = LIST.length - inView;
    lb.textContent = nm(inView) + ' / ' + nm(LIST.length) + ' ' + t('في الإطار')
      + (out > 0 ? ' · ' + nm(out) + ' ' + t('خارج الإطار') : '');
  }
}
/* (V25.3) تحريكٌ بلا تقريب: العلاماتُ القائمةُ كما هي — يدخل ما اقترب من الإطار ويخرج ما ابتعد؛ كانت الرسمةُ
   تعيد قراءةَ نحو ستِّمئة نقطةٍ (لونًا وحالةً ومفتاحًا) مع كلِّ سحبةٍ لتجد أن لا شيءَ فيها تغيّر */
function mapPaintLight(z){
  var b = MAP.getBounds(), keep = b.pad(MK_PAD), LIST = MK.list, inView = 0, want = {};
  var bS = b.getSouth(), bN = b.getNorth(), bW = b.getWest(), bE = b.getEast();
  var kS = keep.getSouth(), kN = keep.getNorth(), kW = keep.getWest(), kE = keep.getEast();
  MK.lifeMemo = {};
  for (var i = 0; i < LIST.length; i++){
    var x = LIST[i];
    if (!x.lat || !x.lng) continue;
    if (x.lat >= bS && x.lat <= bN && x.lng >= bW && x.lng <= bE) inView++;
    if (!(x.lat >= kS && x.lat <= kN && x.lng >= kW && x.lng <= kE)) continue;
    want[x.id] = 1;
    if (!MK.by[x.id]) mkPlace(x, z, MK.r, MK.sun, MK.touch);
  }
  MK.lifeMemo = null;
  mkSweep(want);
  mkCount(LIST, inView);
  if (IOT.on) iotPaint();   /* (V25.7) طبقةُ الحساسات تتبع الإطار */
}
/* ═══ (V30.9) فكرةُ المالك #٩ — أولُ فتحٍ أسرع: الرسمُ يُجمَّع ═══
   قياسُ الإقلاع على الجوال: الخريطةُ تُرسَم ثلاثًا وعشرين مرةً في أول ثانيتين (كلُّ رسمِ صفحةٍ يرسمها مرتين،
   والحركةُ والتكبيرُ وتصحيحُ القياس كلٌّ يرسمها) — ١٫٤ ثانية من ٢٫٧. فصار ما يأتي خلال ثمانين ملّي ثانية من رسمةٍ
   يُجمَّع في رسمةٍ واحدةٍ تاليةٍ بأثقل ما طُلب (الكاملُ يغلب الخفيف). أولُ نداءٍ في الدفعة يُرسَم في مكانه فورًا. */
/* (V31.8) متغيراتُ التجميع صارت في MK: pLast/pTimer/pFull/sig — وحدةُ الخريطة تملك حالتَها */
function mapPaint(light){
  var now = Date.now();
  if (now - MK.pLast < 80 && MK.pLast && !MAP_3D){   /* الثلاثيُّ يُرسَم فورًا دائمًا — رسمُه رخيصٌ ومَن يبدّل طبقتَه ينتظر أثرَها في اللحظة */
    if (light !== true) MK.pFull = true;
    if (!MK.pTimer) MK.pTimer = setTimeout(function(){ MK.pTimer = 0; var full = MK.pFull; MK.pFull = false; MK.pLast = 0; mapPaint(full ? undefined : true); }, 85 - (now - MK.pLast));
    return;
  }
  MK.pLast = now;
  /* الثلاثيُّ يُرسَم بالقائمة نفسِها في اللحظة نفسِها — طبقةً ومرشِّحًا وشركةً وتحديدًا */
  if (MAP_3D) m3Paint();
  if (!MAP || !MAP_LAYER) return;
  var z = MAP.getZoom();
  if (light === true && MK.z === z && MK.list && !MAP_3D){ mapPaintLight(z); return; }
  if (!MAP_TMP) MAP_TMP = L.layerGroup().addTo(MAP);
  MAP_TMP.clearLayers();
  if (MAP_POLY) MAP_POLY.clearLayers();

  var b = MAP.getBounds(), keep = b.pad(MK_PAD);
  /* على الشاشات اللمسية تكبر النقطةُ قليلًا: البصرُ يقرأ الصغيرَ والإصبعُ لا يصيبه. */
  var TOUCH = (typeof L !== 'undefined' && L.Browser && L.Browser.touch) ? 1 : 0;
  var r = z >= 16 ? 7 : (z >= 14 ? 5 : (z >= 12 ? 3.5 : 2.5));
  if (TOUCH) r = Math.max(r + 1.5, 4.5);
  var sun = (typeof SUN_ON !== 'undefined' && SUN_ON && !(typeof KIOSK_ON !== 'undefined' && KIOSK_ON)) ? 1 : 0;
  if (sun) r = r * 1.4 + 1;   /* وضعُ الشمس: علاماتٌ أسمك (V17.99) */
  var shown = 0, inView = 0, want = {};

  var LIST = (typeof layerFiltered === 'function') ? layerFiltered() : STATE.sites;
  var bS = b.getSouth(), bN = b.getNorth(), bW = b.getWest(), bE = b.getEast();
  var kS = keep.getSouth(), kN = keep.getNorth(), kW = keep.getWest(), kE = keep.getEast();
  MK.lifeMemo = {};   /* حالةُ النقطة تُحسَب مرةً في الرسمة لا مرتين (اللونُ ثم القمر) */
  /* (V31.8) الرسمُ التدريجي (وحدةُ الخريطة): أوّلُ رسمةٍ على الجوال كانت تُنشئ ١٨٠٠ علامةٍ دفعةً واحدة (٦٢٠ م.ث بمعالجٍ مُبطَّأ)
     فتتجمّد الواجهة. صارت تُنشئ أوّلَ MK_FIRST علامةٍ في الحال والباقي دفعاتٍ في إطارات الشاشة التالية — والمتصفّحُ الآليُّ
     (navigator.webdriver) يرسم كلَّه دفعةً واحدةً كما كان، فتبقى الجرودُ تقيس الشيءَ نفسَه. */
  var made = 0; MK.gen++;
  MK.defer = (MK.progressive !== false && typeof requestAnimationFrame === 'function' && !(typeof navigator === 'object' && navigator.webdriver)) ? [] : null;
  for (var i = 0; i < LIST.length; i++){
    var x = LIST[i];
    if (!x.lat || !x.lng) continue;
    if (x.lat >= bS && x.lat <= bN && x.lng >= bW && x.lng <= bE) inView++;
    if (!(x.lat >= kS && x.lat <= kN && x.lng >= kW && x.lng <= kE)) continue;
    want[x.id] = 1; shown++;
    if (MK.defer && !MK.by[x.id] && made >= MK_FIRST){ MK.defer.push(x); continue; }   /* (V31.8) */
    if (!MK.by[x.id]) made++;
    mkPlace(x, z, r, sun, TOUCH);
  }
  MK.lifeMemo = null;
  mkSweep(want);
  if (MK.defer && MK.defer.length) mkDrain(MK.gen, z, r, sun, TOUCH); else MK.defer = null;
  MK.z = z; MK.list = LIST; MK.r = r; MK.sun = sun; MK.touch = TOUCH;

  /* علامةُ موضعك تُعاد مع كلِّ رسم — فلوحُ المؤقّتات يُمسَح في أوّله */
  if (MAP_ME_LL){
    try {
      MAP_ME = L.circleMarker(MAP_ME_LL, { renderer:MAP_CV, interactive:false,
        radius:8, color:'#fff', weight:3, fillColor:'#4FA3FF', fillOpacity:1 }).addTo(MAP_TMP);
    } catch (e){ LS_ERR = e; }
  }

  /* حدودُ المخيمات تُطلَب عند حدِّها لا قبله — ملفٌّ واحدٌ يُحمَّل مرةً ويبقى */
  if (z >= POLY_Z && !POLY) polyLoad();

  /* «معروض» يقول لماذا يقلُّ: العلاماتُ تُرشَّح بمدى الشاشة — فما خرج عن
     الإطار لا يُرسَم، وهو صوابٌ للأداء. لكنّ من رأى «٣٢ من ١٧٨٧» ظنَّ أن
     ألفًا وسبعمئةٍ ضاعت. فيُقال إن ما نقص «خارجَ الإطار» لا مفقود. */
  /* ═══ ما يُرسَم يُرى (V17.48) ═══
     كان الرسمُ أعمى: تضغط على الخريطة فلا يظهر شيءٌ إلا رقمٌ في اللوح، فلا
     تعرف أوقعت ضغطتُك في محلِّها أم لا. صار المسارُ خطًّا ونقاطُه دوائرَ
     مرقَّمة، والمساحةُ مضلَّعًا مظلَّلًا — وتُعرَض نقاطُ التوليد الناتجةُ
     باهتةً قبل الحفظ، فيُرى ما سيُحفَظ قبل أن يُحفَظ. */
  try {
    if (typeof TFD === 'object' && TFD.on && MAP_TMP){   /* (V28.0) المسارُ المرسومُ قبل حفظه */
      TFD.paths.forEach(function(pl){ L.polyline(pl, { renderer:MAP_CV, color: TFD.d === 'go' ? '#F5C400' : '#D0021B', weight:6, opacity:0.95, dashArray: TFD.d === 'back' ? '8 6' : null, interactive:false }).addTo(MAP_TMP); });
      (TFD.pts || []).forEach(function(n, i){ L.circleMarker(n, { renderer:MAP_CV, radius:6, color:'#fff', weight:2, fillColor: TFD.nodes[i] >= 0 ? '#FF8C42' : '#9B51E0', fillOpacity:1, interactive:false }).addTo(MAP_TMP); });   /* (V28.1) الحرّةُ بنفسجية */
    }
    if (typeof ROUTE === 'object' && ROUTE.on && ROUTE.pts.length && MAP_TMP){
      var pts = ROUTE.pts.map(function(p){ return [p[0], p[1]]; });
      var isArea = ROUTE.mode === 'area', isCamp = isArea && ROUTE.type === 'مخيم';
      if (isArea && pts.length > 2){
        L.polygon(pts, { renderer:MAP_CV, color:'#FF8C42', weight:2, fillColor:'#FF8C42', fillOpacity: isCamp ? 0.3 : 0.18, interactive:false }).addTo(MAP_TMP);
      } else if (pts.length > 1){
        L.polyline(pts, { renderer:MAP_CV, color:'#FF8C42', weight:3, opacity: ROUTE.gen ? 0.45 : 0.95, interactive:false }).addTo(MAP_TMP);
      }
      /* النقاطُ التي ستُولَّد — تُرى قبل الحفظ؛ ونقاطُ المسار تُسحَب بالإصبع (V17.58)،
         والمخيمُ بحدوده لا شبكةَ داخله (V17.59) */
      var gen = isArea ? (isCamp ? [] : areaPoints()) : routeGen();
      var drag = !isArea && gen.length <= RT_DRAG_MAX;
      gen.slice(0, drag ? RT_DRAG_MAX : 600).forEach(function(g, gi){
        if (!drag){
          L.circleMarker([g[0], g[1]], { renderer:MAP_CV, radius:3.5, color:'#fff', weight:1,
            fillColor:'#FFD166', fillOpacity:0.95, interactive:false }).addTo(MAP_TMP);
          return;
        }
        var hs = TOUCH ? 34 : 24;
        var pm = L.marker([g[0], g[1]], { draggable:true, autoPan:false, keyboard:false, zIndexOffset:500,
          icon:L.divIcon({ className:'rtPt', iconSize:[hs, hs], iconAnchor:[hs / 2, hs / 2], html:'<i></i>' }) });
        pm.on('dragstart', function(){ routeFreeze(); });
        pm.on('dragend', function(ev){ var ll = ev.target.getLatLng(); routeMovePt(gi, ll.lat, ll.lng); });
        pm.addTo(MAP_TMP);
      });
      pts.forEach(function(p, i){
        if (isArea){
          /* رأسُ المساحة يُسحَب فتتبعه الحدود (V17.59) */
          var vs = TOUCH ? 36 : 26;
          var vm = L.marker(p, { draggable:true, autoPan:false, keyboard:false, zIndexOffset:600,
            icon:L.divIcon({ className:'rtVx', iconSize:[vs, vs], iconAnchor:[vs / 2, vs / 2], html:'<i></i>' }) });
          vm.on('dragend', function(ev){ var ll = ev.target.getLatLng(); routeMoveVx(i, ll.lat, ll.lng); });
          vm.addTo(MAP_TMP);
          return;
        }
        L.circleMarker(p, { renderer:MAP_CV, radius:6, color:'#fff', weight:2,
          fillColor:'#FF8C42', fillOpacity:1, interactive:false }).addTo(MAP_TMP);
      });
    }
  } catch (e){ LS_ERR = e; }

  mkCount(LIST, inView);
  if (IOT.on) iotPaint();   /* (V25.7) */
}

function mapFly(id){
  var x = siteFind(id);
  if (x && MAP) MAP.setView([x.lat, x.lng], 18);
  if (x && MAP_3D && M3){ try { M3.flyTo({ center:[+x.lng, +x.lat], zoom:17, pitch:60, duration:900 }); } catch (e){ LS_ERR = e; } }
}

function mapLocate(){
  if (!navigator.geolocation){ toast(t('تعذّر تحديد الموقع')); return; }
  toast(t('يُلتقَط موضعك…'));
  navigator.geolocation.getCurrentPosition(
    function(p){
      MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, at:Date.now() };
      if (MAP) MAP.setView([MYPOS.lat, MYPOS.lng], 17);
      if (MAP_3D && M3){ try { M3.flyTo({ center:[MYPOS.lng, MYPOS.lat], zoom:16, duration:900 }); } catch (e){ LS_ERR = e; } }
      /* ═══ علامةُ موضعك على لوح النقاط نفسِه — لا على لوحٍ فوقه ═══
         كانت تُضاف إلى الخريطة بلا لوحٍ معيَّن، فيُنشئ Leaflet لها لوحًا
         ثانيًا (canvas) يغطّي الخريطةَ كلَّها فوق لوح النقاط. واللوحُ الأعلى
         يلتقط كلَّ نقرةٍ ولا يمرّرها لما تحته — فمن ضغط «موقعي» مرةً واحدةً
         لم تُفتَح له نافذةُ أيِّ نقطةٍ بعدها حتى يُعيد تحميلَ التطبيق: يضغط
         المخيمَ فلا يقع شيء، ويظنُّ العطلَ في المخيمات. فصارت العلامةُ على
         اللوح نفسِه (MAP_CV) وغيرَ قابلةٍ للنقر — تُرى ولا تحجب. */
      try{
        if (MAP_ME) MAP.removeLayer(MAP_ME);
        MAP_ME = L.circleMarker([MYPOS.lat, MYPOS.lng], {
          renderer:MAP_CV, interactive:false,
          radius:8, color:'#fff', weight:3, fillColor:'#4FA3FF', fillOpacity:1
        }).addTo(MAP_TMP ? MAP_TMP : MAP);
        /* لوحُ النقاط يُمسَح في كلِّ رسمٍ — فتُعاد العلامةُ بعده */
        MAP_ME_LL = [MYPOS.lat, MYPOS.lng];
      }catch(e){}
      toast(t('موضعُك'));
      render(1);
    },
    function(){ toast(t('تعذّر تحديد الموقع')); },
    { enableHighAccuracy:true, timeout:10000 });
}

/* الوضع الليلي على طبقة الأساس وحدها */
function mapTheme(){
  var el = document.getElementById('mapBox');
  if (el) el.classList.toggle('tdark',
    document.documentElement.getAttribute('data-theme') !== 'light');
  basemapSatCls();   /* (V25.1) القمرُ هو الأساس: لا يُقلَب من أوّل فتح */
}


/* تبديلُ طبقة الأساس — خريطةٌ أو قمرٌ صناعي */
function mapSat(on){
  MAP_SAT = !!on;
  if (!MAP || !MAP_BASE) return;
  MAP_BASE.setUrl(MAP_SAT ? TILES.esri : TILES.osm);
  MAP_BASE.options.attribution = MAP_SAT ? '&copy; Esri' : '&copy; OpenStreetMap';
  basemapSwap();   /* (V24.9) القمرُ يُرى فوق خريطة الجهاز، وتعود هي بإطفائه */
  var el = document.getElementById('mapBox');
  /* القمرُ صورةٌ حقيقية — لا يُقلَب في الوضع الداكن */
  if (el) basemapSatCls();
}

/* ═══ التصدير والاستيراد — بالبيانات الحقيقية ═══
   SheetJS يُحمَّل كسولًا عند أول تصديرٍ فلا يُثقل الإقلاع.
   وKMZ يُبنى بالكود — ضغطُ ZIP مكتوبٌ هنا فلا يحتاج مكتبةً ثالثة. */

var XLSX_READY = false, XLSX_LOADING = null;

function xlsxLoad(){
  if (XLSX_READY || (typeof window !== 'undefined' && window.XLSX)){ XLSX_READY = true; return Promise.resolve(true); }
  if (XLSX_LOADING) return XLSX_LOADING;
  XLSX_LOADING = new Promise(function(res){
    var s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload  = function(){ XLSX_READY = true; res(true); };
    s.onerror = function(){ res(false); };
    document.head.appendChild(s);
    setTimeout(function(){ if (!XLSX_READY) res(false); }, 12000);
  });
  return XLSX_LOADING;
}

/* ═══ ExcelJS — للملفّ الذي يُحدِّث نفسَه ═══
   مكتبةُ الجداول التي نستعملها للتصدير لا تكتب تنسيقًا ولا تجميعَ صفوفٍ ولا
   تنسيقًا شرطيًّا — تكتب قيمًا. وملفُّ الخطة التفصيلية ليس قيمًا: صيغٌ تحسب
   المدةَ والحالةَ والموقفَ الزمنيَّ من تاريخ اليوم، وآباءٌ يجمعون أبناءهم،
   ومستوياتُ طيٍّ، وألوانٌ شرطية. فتُحمَّل مكتبةٌ ثانيةٌ لهذا الملفِّ وحدَه. */
var EXLJS_READY = false, EXLJS_LOADING = null;
function exlLoad(){
  if (EXLJS_READY || (typeof window !== 'undefined' && window.ExcelJS)){ EXLJS_READY = true; return Promise.resolve(true); }
  if (EXLJS_LOADING) return EXLJS_LOADING;
  EXLJS_LOADING = new Promise(function(res){
    var s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
    s2.onload  = function(){ EXLJS_READY = true; res(true); };
    s2.onerror = function(){ res(false); };
    document.head.appendChild(s2);
    setTimeout(function(){ if (!EXLJS_READY) res(false); }, 15000);
  });
  return EXLJS_LOADING;
}
/* ═══ (V33.7) بلاغُ المالك: «لما بعمل إكسبورت وورد بيطلّعني برّه السيستم ويدخّلني تاني» ═══
   على الآيفون والتطبيقُ مثبّتٌ على الشاشة الرئيسية، رابطُ التنزيل يفتح الملفَّ في معاينةٍ تحلّ محلَّ التطبيق نفسِه — فإذا رجع
   المستخدمُ أُعيد تحميلُ التطبيق ودخل بالجلسة المحفوظة. صار الآيفونُ يسلّم الملفَّ بقائمة المشاركة («حفظ في الملفات»، البريد،
   واتساب) والتطبيقُ في مكانه. وإن بُني الملفُّ بعد انتهاء لمسة المستخدم (القالبُ يُحمَّل) فلا تُفتح القائمةُ إلا بلمسةٍ جديدة —
   فيظهر زرٌّ «احفظ الملف» يفتحها. وغيرُ الآيفون كما كان. */
function dlIOS(){ var ua = (typeof navigator === 'object' && navigator.userAgent) || ''; return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); }
function dlSheet(file){
  var old = document.getElementById('dlSheet'); if (old) old.remove();
  var d = document.createElement('div'); d.id = 'dlSheet'; d.setAttribute('role', 'dialog');
  d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;background:var(--surface,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:14px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);text-align:center';
  d.innerHTML = '<div style="font-weight:700;margin:0 0 10px">' + esc(t('الملفُّ جاهز')) + ' \u2014 ' + esc(file.name) + '</div>'
    + '<button type="button" class="btn btn-primary" id="dlShareGo">\u{1F4E4} ' + esc(t('احفظ الملف أو شاركه')) + '</button> '
    + '<button type="button" class="btn btn-quiet" id="dlShareX">' + esc(t('إغلاق')) + '</button>';
  document.body.appendChild(d);
  document.getElementById('dlShareGo').onclick = function(){ navigator.share({ files:[file], title:file.name }).catch(function(e){ LS_ERR = e; }).then(function(){ d.remove(); }); };
  document.getElementById('dlShareX').onclick = function(){ d.remove(); };
}
function dl(blob, name){
  try{
    if (dlIOS() && typeof File === 'function' && navigator.canShare && navigator.share){
      var file = new File([blob], name, { type:blob.type || 'application/octet-stream' });
      if (navigator.canShare({ files:[file] })){
        navigator.share({ files:[file], title:name }).catch(function(e){ if (!/abort/i.test(String(e && e.name))) dlSheet(file); });
        return true;
      }
    }
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 4000);   /* (V33.7) ٤٠٠ م.ث قليلةٌ لبعض المتصفّحات */
    return true;
  }catch(e){ return false; }
}

/* ── أوراق التقرير — كلٌّ من الأرقام التي على الشاشة ── */
var SHEETS = {
  vers: function(){
    var cur9 = appVer(), out = [['المستخدم','النسخة','الدور','آخر ظهور','الجهاز','الحالة']];
    presenceRows().forEach(function(r){
      out.push([r.name || r.uid, r.ver || '', (ROLES[r.role] || {}).n || r.role || '',
                r.at ? new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') : '',
                r.dev || '', r.ver === cur9 ? 'الحالية' : 'أقدم']);
    });
    return out;
  },
  over: function(){
    /* الورقةُ والشاشةُ من حلقةٍ واحدةٍ بتعريفٍ واحد — لا يناقض الإجماليُّ صفوفَه */
    var K = siteKeyStats(), out = [['المشعر','النوع','العدد','تمت الزيارة','مُركّب']];
    K.keys.forEach(function(k){ var p = k.split('|'); out.push([p[0], p[1], K.by[k], K.sv[k] || 0, K.ins[k] || 0]); });
    out.push(['الإجمالي','', K.total.n, K.total.sv, K.total.ins]);
    return out;
  },
  /* ═══ ورقةُ الملخّص — أوّلُ ما يُفتَح ═══
     من يفتح ملفًا فيه ثلاثون ورقةً لا يعرف من أين يبدأ. فورقةٌ أولى تقول
     الموقفَ كلَّه في عشرين سطرًا: النقاطُ والمسحُ والتركيبُ ودورةُ الحياة
     والمشاعرُ والمهامُّ الأسبوعية والخطةُ التفصيلية. */
  summary: function(){
    var K = siteKeyStats(), S = K.total, out = [];
    /* النسبةُ بأرقام لغة الواجهة — «4٪» بأرقامٍ لاتينيةٍ في ورقةٍ عربيةٍ تُقرَأ عوجاء */
    var pc = function(v, t2){ return t2 ? nm(Math.round(v / t2 * 100)) + '٪' : '—'; };
    out.push(['قارئات أفاقي — الملخّص التنفيذي', '', '']);
    out.push(['التاريخ', fmtDT(), '']);
    out.push(['', '', '']);
    out.push(['المؤشر', 'العدد', 'النسبة']);
    out.push(['إجمالي المواقع', S.n, nm(100) + '٪']);
    out.push(['تمت الزيارة', S.sv, pc(S.sv, S.n)]);
    out.push(['مُركّب', S.ins, pc(S.ins, S.n)]);
    out.push(['لم يُزر', S.noRec, pc(S.noRec, S.n)]);
    out.push(['تحتاج زيارة أخرى تقنيًا', S.stuck, pc(S.stuck, S.n)]);
    out.push(['', '', '']);
    out.push(['دورة النقطة', 'العدد', 'النسبة']);
    var life = {}; STATE.sites.forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
    LIFE_ORDER.forEach(function(k){ if (life[k]) out.push([LIFE[k].n, life[k], pc(life[k], S.n)]); });
    out.push(['', '', '']);
    out.push(['المشعر', 'العدد', 'تمت الزيارة']);
    var z = {}; STATE.sites.forEach(function(x){ z[x.zone] = z[x.zone] || { n:0, s:0 }; z[x.zone].n++; if (svVisited(STATE.recs[x.id])) z[x.zone].s++; });
    Object.keys(z).sort(function(a, b){ return z[b].n - z[a].n; }).forEach(function(k){ out.push([k, z[k].n, z[k].s]); });
    if (typeof wtStats === 'function' && wtRows().length){
      var c = wtStats();
      out.push(['', '', '']);
      out.push(['المهام الأسبوعية', 'العدد', '']);
      out.push(['إجمالي المهام', c.all, '']); out.push(['مكتملة', c.done, pc(c.done, c.all)]);
      out.push(['قيد التنفيذ والانتظار', c.run + c.wait, '']); out.push(['متأخرة', c.late, '']);
      out.push(['مستحق اليوم', c.d0, '']); out.push(['باقي الأسبوع', c.week, '']);
    }
    if (typeof wbsRows === 'function' && wbsRows().length){
      var R = wbsRows(), leaves = R.filter(function(r){ return !wbsChildren(r.id).length; });
      out.push(['', '', '']);
      out.push(['الخطة التفصيلية', 'العدد', '']);
      out.push(['بنود', leaves.length, '']);
      out.push(['مكتمل', leaves.filter(function(r){ return wbsPct(r) >= 100; }).length, '']);
      out.push(['متأخر', leaves.filter(function(r){ return wbsTiming(r) === 'متأخر'; }).length, '']);
      R.filter(function(r){ return wbsDepth(r.id) === 1; }).forEach(function(r){ out.push([r.n, wbsPct(r) + '٪', '']); });
    }
    return out;
  },
  minappr: function(){
    var out = [['رقم الشاخص / الاسم','النقطة','الاسم','المشعر','المربع','الشاخص','الشركة','المشرف','تاريخ الزيارة','الاعتماد التقني','تاريخه','حالة الوزارة','بواسطة','تاريخه','ملاحظة الوزارة','نوع التركيب','مصدر الكهرباء','العرض المتاح','الارتفاع المتاح','التحديات']];
    surveyList().filter(function(x){ return x.rec && svReview(x.rec) === 'approved'; }).forEach(function(x){ var r = x.rec, ms = minState(r);
      out.push([siteKey(x.site), x.id, x.site.name || '', x.site.zone || '', x.site.sq || '', x.site.sign || '', x.site.co || '', r.by || '', r.at ? dayKey(r.at) : '', r.reviewBy || '', r.reviewAt ? dayKey(r.reviewAt) : '',
                ms === 'approved' ? 'اعتمدت الوزارة' : (ms === 'returned' ? 'أعادتها الوزارة' : 'بانتظار الوزارة'), r.minBy || '', r.minAt ? dayKey(r.minAt) : '', r.minNote || '',
                r.mount || '', r.power || '', r.wid_m != null ? r.wid_m : '', r.hgt_m != null ? r.hgt_m : '', (r.chals || []).join(' · ')]); });
    return out;
  },
  /* ═══ ورقةُ المهام كاملةً — للتعديل خارج النظام ثم الرفع (V17.18) ═══
     الورقةُ التي يقرؤها التقريرُ مرشَّحةٌ كالشاشة، فمن صدّرها وهو يرى ترشيحًا
     ثم رفعها استبدل الجدولَ كلَّه بما رآه وضاع الباقي. فصارت ورقتان: ورقةُ
     التقرير (ما تراه) وورقةُ العمل (كلُّ المهام) — وترتيبُ أعمدتها هو الذي
     يقرؤه المستورِد حرفًا بحرف، فتدور الدورةُ: صدِّر · عدِّل · ارفع. */
  wtaskAll: function(){
    /* الأعمدةُ في مواضع ملفِّ المكتب نفسِها (V17.19): الثلاثةُ المحسوبةُ تُترَك
       فارغةً، واليدويةُ الثلاثةُ في مواضعها — فيقرؤها الاستيرادُ من أيِّ
       الورقتين صُدِّرت، ولا يضيع عمودٌ في الدورة. */
    var out = [['#','المهمة','مسار إدارة المشروع','كود المسار','الوصف','المسؤول','الحالة',
                'تاريخ الرصد (هجري)','تاريخ الاستحقاق (هجري)','مصدر المهمة','التحديث',
                'تاريخ الرصد (ميلادي)','تاريخ الاستحقاق (ميلادي)','فئة الاستحقاق',
                'توقف المهمة','اجتماع الاحد','اجتماع الاربعاء']];
    wtRows().forEach(function(r){ out.push([r.id, r.n, r.track, r.code, r.d, r.who, r.st, r.seen, r.due, r.src, r.upd, '', '', '', r.stop || '', r.mSun || '', r.mWed || '']); });
    return out;
  },
  /* ═══ ورقةُ الاجتماع: ما بقي · ما استُجدّ · ما اكتمل — لا غير (V17.18) ═══ */
  wtmeet: function(){
    var since = (STATE.wtask && STATE.wtask.meetAt) || 0;
    var out = [['القسم','المهمة','المسؤول','الاستحقاق','الحالة','ما قيل']];
    var say = function(r){
      var last = (Array.isArray(r.log) ? r.log : []).filter(function(e){ return (e.at || 0) > since; });
      var txt = last.map(function(e){ return e.note || (e.st ? t('الحالة') + ': ' + t(e.st) : ''); }).filter(Boolean).join(' \u00b7 ');
      return txt || r.upd || '';
    };
    /* ١ · ما بقي من الاجتماع الماضي: مفتوحٌ وكان قائمًا قبل الختم */
    wtRows().filter(function(r){ return r.st !== 'مكتمل' && (r.at || 0) <= since; })
      .forEach(function(r){ out.push([t('باقٍ من الاجتماع الماضي'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    /* ٢ · ما استُجدّ: مهامُّ فُتحت بعد الختم */
    wtRows().filter(function(r){ return r.st !== 'مكتمل' && (r.at || 0) > since; })
      .forEach(function(r){ out.push([t('مهمةٌ جديدة'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    /* ٣ · ما اكتمل منذ الاجتماع الماضي */
    wtRows().filter(function(r){ return r.st === 'مكتمل' && (r.doneAt || 0) > since; })
      .forEach(function(r){ out.push([t('اكتمل منذ الاجتماع الماضي'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    return out;
  },
  wtsince: function(){
    var out = [['#','المهمة','المسؤول','ما تغيّر','من','متى']], S = wtSince();
    S.items.forEach(function(x){ out.push([x.r.id, x.r.n, x.r.who || '', x.what, dispName(x.e.by || ''), fmtDT(x.e.at || 0)]); });
    return out;
  },
  wtask: function(){
    var out = [['#','المهمة','المسار','الكود','الوصف','المسؤول','الحالة','تاريخ الرصد','تاريخ الاستحقاق','المصدر','آخر تحديث','المتبقي']];
    wtFiltered().forEach(function(r){ var d = wtDue(r); out.push([r.id, r.n, r.track, r.code, r.d, r.who, r.st, r.seen, r.due, r.src, r.upd, d == null ? '—' : d]); });
    return out;
  },
  wbs: function(){
    var out = [['هيكل تقسيم العمل','البند','تاريخ البدء','تاريخ الانتهاء','المدة','الإنجاز ٪','الحالة','الموقف الزمني','النوع','المسؤول','الجهة المعنية','المتبقي']];
    wbsFiltered().forEach(function(r){ var l = wbsLeft(r); out.push([r.id, r.n, r.s, r.e, r.dur, wbsPct(r), wbsStatus(r), wbsTiming(r), r.type, r.resp, r.party, (l == null || wbsPct(r) >= 100) ? '—' : l]); });
    return out;
  },
  sites: function(){
    var out = [['رقم الشاخص / الاسم','المعرّف','الاسم','المشعر','النوع','وجه العمل','المربع','الشاخص','الشركة',
                'خط العرض','خط الطول','حالة المسح','حالة التركيب']];
    /* ما رُشِّح على الخريطة والقائمة هو ما يُصدَّر — وبلا ترشيحٍ الكلُّ */
    (typeof filtered === 'function' ? filtered() : STATE.sites).forEach(function(x){
      out.push([siteKey(x), x.id, x.name, x.zone, x.type, x.work, x.sq, x.sign, x.co, x.lat, x.lng,
                svLabel(STATE.recs[x.id]),
                (STATE.inss[x.id]||{}).status || x.fstat || 'لم يبدأ']);
    });
    return out;
  },
  qa: function(){
    var out = [['النقطة','المنفِّذ','القطع','النقاط','الحالة','الاعتماد','التاريخ']];
    Object.keys(STATE.inss).forEach(function(k){
      var r = STATE.inss[k];
      out.push([k, r.by || '', Object.keys(r.parts || {}).length, r.pts || 0,
                r.status || '', r.approved ? 'معتمد' : 'بانتظار التدقيق',
                dayKey(r.at || Date.now())]);
    });
    return out;
  },
  sop: function(){
    var out = [['الدورة','من يملكها','#','من','ما يفعل','أين']];
    SOPS.forEach(function(s){
      s.steps.forEach(function(st, i){
        out.push([s.n, s.own, i + 1, st[0], st[1], st[2]]);
      });
      s.rules.forEach(function(r){ out.push([s.n, s.own, '', 'قاعدة', r, '']); });
    });
    return out;
  },
  reps: function(){
    var out = [['التقرير','الجهة','إلى','الدورية','موعده','محتواه','أوراقه']];
    REPORTS.forEach(function(r){
      out.push([r.n, r.side === 'co' ? 'الشركة' : 'الوزارة', r.to, r.per, r.when, r.what,
                r.sheets.join(' · ')]);
    });
    return out;
  },
  hse: function(){
    var out = [['التاريخ','النوع','الموقع','أيام مفقودة','الإجراء','المسجِّل']];
    HSE.incidents.forEach(function(x){
      out.push([dayKey(x.at), x.kind, x.site || '',
                x.lost, x.why, x.by]);
    });
    return out;
  },
  ncr: function(){
    var out = [['المعرّف','النقطة','الفئة','الخطورة','الوصف','الحالة','المُبلِّغ']];
    NCRS.forEach(function(x, i){
      out.push(['NCR-' + (i+1), x.site || '', x.cat, x.sev, x.why, x.st, x.by]);
    });
    return out;
  },
  ipc: function(){
    var out = [['المعرّف','الفترة','المبلغ','استقطاع ٪','الصافي','الحالة']];
    IPCS.forEach(function(x, i){
      var r = Math.round(x.amt * x.retPct / 100);
      out.push(['IPC-' + (i+1), x.period, x.amt, x.retPct, x.amt - r, x.st]);
    });
    return out;
  },
  miles: function(){
    var out = [['المعرّف','المعلَم','الوزن ٪','يعتمد على','الإنجاز ٪','الحالة']];
    mileList().forEach(function(m){
      var p = Math.round(mileDone(m) * 100);
      out.push([m.id, m.n, m.w, m.dep || '', p, p>=100?'بلغ':(p>0?'جارٍ':'لم يبدأ')]);
    });
    return out;
  },
  raci: function(){
    return [['النشاط','R','A','C','I']].concat(RACI_ACTS.map(function(r){ return r.slice(); }));
  },
  less: function(){
    return [['المرحلة','ما وقع','ما فُعل']].concat(
      LESSONS.map(function(l){ return [l.p, l.w, l.a]; }));
  },
  evm: function(){
    var v = evm();
    if (!v) return [['المؤشّر','القيمة']];
    return [['المؤشّر','الرمز','القيمة'],
      ['المخطَّط حتى اليوم','PV',v.PV], ['المكتسَب','EV',v.EV], ['المنصرف','AC',v.AC],
      ['فرق الجدول','SV',v.SV], ['فرق الكلفة','CV',v.CV],
      ['أداء الجدول','SPI',v.SPI], ['أداء الكلفة','CPI',v.CPI],
      ['المتوقَّع عند الإتمام','EAC',v.EAC], ['المتبقّي','ETC',v.ETC],
      ['فرق الإتمام','VAC',v.VAC], ['كفاءة ما بقي','TCPI',v.TCPI],
      ['الميزانية الكلية','BAC',v.BAC]];
  },
  /* المحضرُ إكسل: الترويسةُ والأعمالُ والاعتمادُ في ورقةٍ واحدةٍ كما تُقدَّم */
  /* ورقةُ الدخول: تُطبَع وتُوزَّع مرةً — ثم تُمسَح الكلماتُ من القاعدة */
  provsheet: function(){
    var L = provList().filter(function(r){ return r.status === 'done' && r.pass; });
    var out = [['الاسم', 'اسم المستخدم', 'كلمة المرور', 'الدور', 'الوظيفة', 'الفريق', 'البريد']];
    L.sort(function(a, b){ return arCmp(a.crew || '', b.crew || ''); })
     .forEach(function(r){
       var j = r.job ? jobOf(r.job) : null;
       out.push([r.name || '', r.user, r.pass, (ROLES[r.role] || {}).n || r.role, j ? j.n : '', r.crew || '', r.email || '']);
     });
    return out;
  },
  /* ═══ ورقةٌ لكلِّ صفحةٍ فيها إسناد — بما في الصفحة وحدَها ═══ */
  /* (V26.6) نقاطُ التحديات: صفٌّ لكلِّ نقطةٍ وتحدٍّ — بفلتر صفحة التحديات والمعوقات إن وُضع، وإلا كلُّها */
  chalpts: function(){
    var out = [['المشعر','النوع','المعرّف','الاسم','الشاخص','العائق','وصف العائق','حالة الوصول','الجهة المسؤولة','من سيحلّه','آلية المعالجة','وصف المعالجة','آخر تاريخ','الحالة','مهمة المعالجة','المسّاح','تاريخ الزيارة','خط العرض','خط الطول']];
    var F = mfuData().fch || {}, CH = {}; mfuAllChal().forEach(function(c){ if (c.src === 'field') CH[c.t] = c; });
    (typeof mfuObstaclesF === 'function' ? mfuObstaclesF() : mfuObstacles()).forEach(function(o){
      var x = o.x, r = STATE.recs[x.id] || {};
      o.cats.forEach(function(c){ var f = F[c] || {}, it = CH[c] || {};
        out.push([taxOf(x).g, taxOf(x).t, x.id, x.name || '', x.sign || '', c, String(r.chal_note || r.note || ''), r.access || '', mfuOwnerOf(c), f.owner || '', f.m || '', f.desc || '', f.due || '', it.st || '', f.task ? '#' + f.task : '', r.by || '', r.at ? dayKey(r.at) : '', x.lat != null ? +x.lat : '', x.lng != null ? +x.lng : '']); });
    });
    return out;
  },
  asnreg: function(){
    var out = [['الطلب','النوع','النقطة','المشعر','المُسنَد إليه','الموعد','الحالة','أُبلغ واتساب','أُسند في','أسنده']];
    Object.keys(STATE.tasks || {}).map(function(k){ return STATE.tasks[k]; })
      .sort(function(a, b){ return (b.at || 0) - (a.at || 0); })
      .forEach(function(x){
        var st = siteFind(x.site) || {};
        out.push([x.no || '', kindLabel(x.kind), x.site, st.zone || '', x.to || '', x.when || '', x.status || '',
                  x.waAt ? dayKey(x.waAt) : '', x.at ? dayKey(x.at) : '', x.by || '']);
      });
    return out;
  },
  visits: function(){
    var out = [['النقطة','المشعر','النوع','الوصول','المراجعة','راجعه','الزائر','التاريخ','ملاحظة']];
    Object.keys(STATE.recs || {}).forEach(function(id){
      var r = STATE.recs[id], st = siteFind(id) || {};
      out.push([id, st.zone || '', st.type || '', r.access || '', svReview(r) || '', r.reviewBy || '', r.by || '', r.at ? dayKey(r.at) : '', r.note || '']);
    });
    return out;
  },
  installs: function(){
    var out = [['النقطة','المشعر','الحالة','اعتُمد','اعتمده','نفّذه','التاريخ','القطع','السيريالات']];
    Object.keys(STATE.inss || {}).forEach(function(id){
      var r = STATE.inss[id], st = siteFind(id) || {};
      var parts = Object.keys(r.parts || {}).map(function(k){ return itemName(k) + '×' + cfgN(r.parts[k]); }).join(' · ');
      var sn = Object.keys(r.serials || {}).map(function(k){ return itemName(k) + ':' + r.serials[k]; }).join(' · ');
      out.push([id, st.zone || '', r.status || '', r.approved ? 'نعم' : 'لا', r.apprBy || r.qaBy || '', r.by || '', r.at ? dayKey(r.at) : '', parts, sn]);
    });
    return out;
  },
  dismantles: function(){
    var out = [['النقطة','المشعر','الحالة','فكّه','التاريخ','سليم','تالف','مفقود','ملاحظة']];
    Object.keys(STATE.diss || {}).forEach(function(id){
      var r = STATE.diss[id], st = siteFind(id) || {}, it = r.items || {};
      var c = { ok:0, bad:0, lost:0 };
      Object.keys(it).forEach(function(k){ var q = cfgN((it[k] || {}).qty); var cd = (it[k] || {}).cond; if (cd === 'سليم') c.ok += q; else if (cd === 'تالف') c.bad += q; else c.lost += q; });
      out.push([id, st.zone || '', r.status || '', r.by || '', r.at ? dayKey(r.at) : '', c.ok, c.bad, c.lost, r.note || '']);
    });
    return out;
  },
  maints: function(){
    var out = [['النقطة','المشعر','التاريخ','الفنيّ','العطل','ما عُمل','القطع','ملاحظة']];
    Object.keys(STATE.maints || {}).forEach(function(id){
      var st = siteFind(id) || {};
      maintList(id).forEach(function(m){
        var parts = Object.keys(m.parts || {}).map(function(k){ return itemName(k) + '×' + cfgN(m.parts[k]); }).join(' · ');
        out.push([id, st.zone || '', m.at ? dayKey(m.at) : '', m.by || '', m.fault || '', m.act || '', parts, m.note || '']);
      });
    });
    return out;
  },
  attendance: function(){
    var out = [['اليوم','الشخص','الدور','بدأ','أنهى','ساعات','بدأ داخل النطاق','أنهى داخل النطاق']];
    Object.keys(STATE.att || {}).map(function(k){ return STATE.att[k]; })
      .sort(function(a, b){ return String(b.day).localeCompare(String(a.day)) || arCmp(a.name, b.name); })
      .forEach(function(r){
        out.push([r.day, r.name, (ROLES[r.role] || {}).n || r.role || '', r.in ? hm(r.in.at) : '', r.out ? hm(r.out.at) : '',
                  r.hours || '', r.in ? (r.in.ok === false ? 'لا' : (r.in.ok ? 'نعم' : '—')) : '', r.out ? (r.out.ok === false ? 'لا' : (r.out.ok ? 'نعم' : '—')) : '']);
      });
    return out;
  },
  mywork: function(){
    var me = STATE.meta.name || '', out = [['الطلب','النوع','النقطة','المشعر','الموعد','الحالة']];
    Object.keys(STATE.tasks || {}).map(function(k){ return STATE.tasks[k]; })
      .filter(function(x){ return x.to === me; })
      .forEach(function(x){ var st = siteFind(x.site) || {}; out.push([x.no || '', kindLabel(x.kind), x.site, st.zone || '', x.when || '', x.status || '']); });
    return out;
  },
  hodoc: function(){
    var id = HO_DOC || '', s2 = siteFind(id), r = STATE.inss[id], h = handOf(id);
    if (!s2 || !r) return [['لا محضرَ معروضٌ الآن — افتح محضرَ نقطةٍ أوّلًا']];
    var T = hoTpl(s2), out = [];
    out.push(['المملكة العربية السعودية']);
    out.push([hoParty('owner'), hoParty('agency')]);
    out.push([T.t]);
    out.push([]);
    out.push(['اسم المشروع', hoParty('project'), 'المقاول', hoParty('contractor')]);
    out.push(['الاستشاري', hoParty('consultant'), 'نوع التقديم', h && h.re ? 'إعادة تقديم' : 'جديد']);
    out.push(['رقم المحضر', h ? h.no : '', 'تاريخ المحضر', h ? fmtDate(h.at) : '']);
    out.push(['مكان الأعمال', s2.zone, T.loc, hoLocOf(s2)]);
    out.push([]);
    out.push(['البند', 'العدد', 'السيريال']);
    hoItems(id).forEach(function(o){ out.push([o.item, o.qty, o.sn]); });
    out.push([]);
    out.push(['يُقدَّم إلى', T.to === 'شركة تقديم الخدمة' ? (s2.co || '') : T.to]);
    out.push(['بادئة الشبكة', s2.net || '']);
    out.push(['نفّذه', r.by || '', 'اعتمده', r.qaBy || r.apprBy || '']);
    out.push(['سلَّم', h ? h.by : '', 'استلم عن العميل', h ? h.to : '']);
    out.push([]);
    out.push(['تعهدات الاستلام', String(T.pledge).replace('{co}', s2.co || '')]);
    out.push([]);
    out.push(['م', 'الاسم', 'صفته', 'الجهة', 'التوقيع']);
    hoSigners().forEach(function(g, i){ out.push([i + 1, g.n || '', g.role || '', g.org || '', '']); });
    return out;
  },
  risks: function(){
    var out = [['المعرّف','الخطر','الفئة','الاحتمال','الأثر','الدرجة','المستوى','الاستجابة','الخطة','المالك','الحالة']];
    risksList().slice().sort(function(a,b){ return riskScore(b) - riskScore(a); }).forEach(function(r){
      out.push([r.id, r.t, r.cat, r.p, r.i, riskScore(r), riskLevel(riskScore(r)).t,
                r.resp, r.plan, r.own, r.st]);
    });
    return out;
  },
  budm: function(){
    var byCat = {}, out = [['الباب','المبلغ','النسبة']];
    buysList().forEach(function(b){ if (b.st !== 'معتمد') return;
      byCat[b.cat] = (byCat[b.cat] || 0) + (+b.amt || 0); });
    var spent = buysSpent();
    Object.keys(byCat).forEach(function(c){
      out.push([c, byCat[c], spent ? Math.round(byCat[c]/spent*100) + '%' : '0%']);
    });
    out.push(['الإجمالي', spent, '100%']);
    return out;
  },
  wplan: function(){
    var out = [['الأسبوع','العنوان','الأولوية','الحالة','التفاصيل والملاحظات','الخطوات','منجز من الخطوات','الاحتياجات والمتطلبات','النتيجة المرجوّة','النتيجة الفعلية','سبب الإغلاق','التحديثات','مهمة أسبوعية']];
    wplanItems(wplanWeek()).forEach(function(x){ var st = wplanLines(x.steps); out.push([x.wk, x.t || '', x.pri || '', x.st || '', x.n || '', st.join(' | '), (x.sdone || []).filter(Boolean).length + '/' + st.length, x.needs || '', x.goal || '', x.result || '', x.closeWhy || '', wplanUpdates(x).map(function(h){ return dayKey(h.at) + ': ' + h.v; }).join(' | '), x.task ? '#' + x.task : '']); });
    return out;
  },
  pmi: function(){
    var out = [['الإطار','البند','العنوان','الدليل في النظام','القياس','الحالة']], F = { pmbok:'دليل المعرفة ٨', acp:'المنهج الرشيق', ai:'إدارة مشاريع الذكاء الاصطناعي' };
    pmiRows().forEach(function(r){ out.push([F[r.fw], r.code, r.title, r.ev, r.note, PMI_ST[r.st][0]]); });
    return out;
  },
  diary: function(){
    var out = [['اليوم','زيارات','المشاعر','تحتاج زيارة أخرى تقنيًا','تركيب','فك','مواقع جديدة','اعتمادات تقنية','اعتمادات الوزارة','من عملوا','الأكثر عملًا','ساعات الفرد (متوسط)','ساعات الفريق','تراكمي المسح','تراكمي التركيب']];
    diaryRows().slice().reverse().forEach(function(r){ out.push([r.day, r.sv, r.zones.map(function(o){ return o.z + ' ' + o.n; }).join(' · '), r.stuck, r.ins, r.dis, r.nw, r.apr, r.min, r.people, r.top.join(' · '), r.hAvg, r.hSum, r.cum, r.cumIns]); });
    return out;
  },
  score: function(){
    var S = scores();
    /* أعمدةُ المسح بنوع الموقع (عددٌ ونقاط) لكلِّ نوعٍ ظهر — (V18.6) */
    var types = {}; S.list.forEach(function(e){ Object.keys(e.surveyT || {}).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
    var cols = Object.keys(types).sort(function(a, b){ return types[b] - types[a]; });
    var out = [['#','الاسم','المرحلة','زيارة','تركيب','فك','تهيئة','تجميع',
                'أعمال','أيام','النقاط','متوسط اليوم','نقاط المسح','نقاط المسح / يوم','المستحَق']
               .concat(cols.map(function(c){ return 'مسح ' + c; })).concat(cols.map(function(c){ return 'نقاط ' + c; }))];
    S.list.forEach(function(e){
      var R = STAGE_ROLES[e.stage] || { n:e.stage };
      out.push([e.rank, e.name, R.n, e.survey, e.install, e.dis, e.prep, e.asm,
                e.acts, e.nDays, e.total, e.perDay, Math.round(e.pSurvey * 10) / 10, e.nDays ? Math.round(e.pSurvey / e.nDays * 10) / 10 : 0, e.money]
               .concat(cols.map(function(c){ return e.surveyT[c] ? e.surveyT[c].n : 0; })).concat(cols.map(function(c){ return e.surveyT[c] ? Math.round(e.surveyT[c].pts * 10) / 10 : 0; })));
    });
    return out;
  },
  invb: function(){
    var out = [['الصنف','المخزن','العُهدة','رُكّب','تالف','الإجمالي']];
    stockBalance().forEach(function(r){
      out.push([r.item, r.store, r.custody, r.used, r.scrap,
                r.store + r.custody + r.used + r.scrap]);
    });
    return out;
  },
  invmv: function(){
    var out = [['التاريخ','الحركة','الصنف','الكمية','المنفِّذ','النقطة','سجّلها','ملاحظة']];
    movesList().forEach(function(m){
      out.push([dayKey(m.at), m.kind, m.item, m.qty,
                m.by || '', m.site || '', m.user || '', m.note || '']);
    });
    return out;
  },
  buys: function(){
    var out = [['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة','سجّلها']];
    buysList().forEach(function(b){
      out.push([dayKey(b.at), b.item, b.cat, b.zone || '',
                b.amt, b.sup, b.st, b.by || '']);
    });
    return out;
  },
  appr: function(){
    var out = [['النوع','التفصيل','مَن اقترح','التاريخ','الحالة','مَن قرّر','السبب']];
    coReqList().forEach(function(x){
      out.push(['شركة مقترحة', x.name, x.by || '',
                dayKey(x.at), x.status || '', x.by2 || '', x.why2 || '']);
    });
    fixList().forEach(function(x){
      out.push(['تصويب بيان', x.site + ' · ' + x.field + ': ' + (x.was || '—') + ' → ' + x.val,
                x.by || '', dayKey(x.at),
                x.status || '', x.by2 || '', x.why2 || x.why || '']);
    });
    buysList().forEach(function(b){
      if (b.st === 'معتمد' && !b.by2) return;
      out.push(['مشترًى فوق الحد', b.item + ' · ' + b.amt, b.by || '',
                dayKey(b.at), b.st || '', b.by2 || '', b.why2 || '']);
    });
    return out;
  },
  ships: function(){
    var out = [['رقم الشحنة','الصنف','العدد','المورّد','الحالة','تاريخ الشحن','الوصول المتوقَّع','وصلت','التأخّر (يوم)']];
    shipList().forEach(function(x){
      out.push([x.ref, x.item || '', x.qty || 0, x.sup || '', x.st || '',
                x.sent || '', x.eta || '', x.got || '', shipLate(x)]);
    });
    return out;
  },
  fleetLog: function(){
    var out = [['اللوحة','النوع','أُسندت إلى','العمل','من','إلى','المدة (يوم)','ملاءمة']];
    vehAsnAll().slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); })
      .forEach(function(a){
        var v = vehOf(a.veh);
        var days = Math.max(1, Math.round(((a.end || Date.now()) - (a.at || Date.now())) / 86400000));
        out.push([v ? v.plate : a.veh, v ? vehKindName(v.kind) : '', a.to,
                  ASN_LABEL[a.kind] || a.kind || '', msDay(a.at),
                  a.end ? msDay(a.end) : 'جارٍ', days,
                  (v && a.kind && !vehFits(v.kind, a.kind)) ? 'لا تناسب' : 'مناسبة']);
      });
    return out;
  },
  ips: function(){
    var out = [['رقم الشاخص / الاسم','معرّف الموقع','الموقع','المشعر','بادئة الشبكة','الراوتر','القارئ','الكاميرا']];
    (STATE.sites || []).forEach(function(x){
      if (!x.net && !x.ipRtr && !x.ipRdr && !x.ipCam) return;
      out.push([siteKey(x), x.id, x.name, x.zone, x.net || '', x.ipRtr || '', x.ipRdr || '', x.ipCam || '']);
    });
    return out;
  },
  fleet: function(){
    var out = [['اللوحة','النوع','الموديل','سنة الصنع','رقم الرخصة','انتهاء الرخصة',
                'انتهاء التأمين','الملكية','التكلفة الشهرية','من تاريخ','الحالة','مع مَن','العمل']];
    vehList().forEach(function(v){
      var a = vehAsnOf(v.id);
      out.push([v.plate, vehKindName(v.kind), v.model || '', v.year || '', v.lic || '',
                v.licExp || '', v.insExp || '', v.own || '', v.cost || 0, v.start || '',
                v.st || '', a ? a.to : '', a ? (ASN_LABEL[a.kind] || a.kind) : '']);
    });
    return out;
  },
  fleetCost: function(){
    var out = [['اللوحة','النوع','الملكية','من تاريخ','أشهر','الشهرية','التراكمي']];
    vehList().forEach(function(v){
      var mo = v.start ? Math.max(1, Math.round((Date.now() - Date.parse(v.start)) / 2592000000)) : 1;
      out.push([v.plate, vehKindName(v.kind), v.own || '', v.start || '', mo,
                +v.cost || 0, (+v.cost || 0) * mo]);
    });
    return out;
  },
  notif: function(){
    var out = [['الوقت','النوع','الأهمية','الرسالة','الموقع','إلى','أنشأه','مقروء']];
    (STATE.notifs || []).forEach(function(n){
      out.push([new Date(n.at).toISOString().slice(0,16).replace('T',' '),
                n.kind, n.lv, n.text, n.site || '', n.to || '', n.by || '',
                n.read ? 'نعم' : 'لا']);
    });
    return out;
  },

  /* سجلُّ الأحداث كما هو معروضٌ بعد التصفية — لا كلُّه: من صفّى ثم صدّر
     يريد ما صفّاه، ومن أراد الكلَّ مسح التصفية. */
  ev: function(){
    var out = [['اليوم','الوقت','النوع','الحدث','المستخدم','الجهاز']];
    (typeof evRows === 'function' ? evRows() : (STATE.events || [])).forEach(function(e){
      out.push([e.day || '', e.at || '', evKind(e.what), e.what || '', e.by || '', e.dev || '']);
    });
    return out;
  },

  users: function(){
    var out = [['اسم المستخدم','الاسم','الدور','الحالة','أُنشئ في','المعرّف']];
    var U = STATE.users || {};
    Object.keys(U).forEach(function(uid){
      var u = U[uid] || {};
      out.push([u.user || '', u.name || '', (ROLES[u.role] || {}).n || u.role || '',
                u.active === false ? 'معطل' : 'نشط', String(u.at || '').slice(0,10), uid]);
    });
    return out;
  },

  /* الاتجاهُ عبر الأيام — تقاريرُ الوزارةِ تُقرأ بالمقارنة لا باللقطة:
     رقمُ اليوم وحده لا يقول أمتقدّمون نحن أم متأخرون. */
  daily: function(){
    var H = statsHistory(90);
    var out = [['اليوم','مسحُ اليوم','تركيبُ اليوم','فكُّ اليوم','تعذُّرُ وصول',
                'تراكمُ المسح','تراكمُ التركيب','بانتظار الرفع']];
    H.forEach(function(r){
      out.push([r.day, r.daySurvey || 0, r.dayInstall || 0, r.dayDismantle || 0,
                r.dayBlocked || 0, r.surveyed || 0, r.installed || 0, r.pending || 0]);
    });
    if (H.length > 1){
      var f = H[0], l = H[H.length - 1];
      out.push(['الفرق بين أول يومٍ وآخره', '', '', '', '',
                (l.surveyed || 0) - (f.surveyed || 0),
                (l.installed || 0) - (f.installed || 0), '']);
    }
    return out;
  },

  /* المرحلةُ المفتوحةُ وحدها — كان الزرُّ يطلب «stage» ولا ورقةَ بهذا الاسم */
  stage: function(){
    var k = (typeof STAGE_TAB !== 'undefined' && STAGE_TAB) || Object.keys(STAGE_ROLES)[0];
    var out = [['المرحلة','المنفِّذ','أعمال','النقاط','المستحَق']];
    stageList(k).forEach(function(e){
      out.push([STAGE_ROLES[k].n, e.name, e.acts,
                Math.round(e.total), Math.round(e.total * cfgGet('ph'))]);
    });
    return out;
  },
  stages: function(){
    var out = [['المرحلة','أفراد','أعمال','النقاط','المستحَق']];
    Object.keys(STAGE_ROLES).forEach(function(k){
      var L = stageList(k);
      var p = L.reduce(function(a,e){ return a + e.total; }, 0);
      out.push([STAGE_ROLES[k].n, L.length,
                L.reduce(function(a,e){ return a + e.acts; }, 0),
                Math.round(p), Math.round(p * cfgGet('ph'))]);
    });
    return out;
  },
  recs: function(){
    var out = [['النقطة','الاسم','الحالة','الفني','التاريخ','ملاحظة']];
    surveyList().forEach(function(x){
      out.push([x.id, (x.site && x.site.name) || '', x.done ? 'تمت الزيارة' : (x.rec.access || 'تحتاج زيارة أخرى تقنيًا'),
                x.rec.by || '', x.rec.at ? dayKey(x.rec.at) : '',
                x.rec.note || x.rec.reopenNote || '']);
    });
    return out;
  },
  tasks: function(){
    var out = [['المعرّف','النقطة','النوع','الفني','الموعد','الحالة','أُسند في']];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k], K = WO_KINDS[x.kind] || { n:x.kind };
      /* تاريخٌ غائبٌ أو تالفٌ كان يُسقط التصديرَ كلَّه بـInvalid time value */
      var at = x.at ? new Date(x.at) : null;
      out.push([x.id, x.site, K.n, x.to || '', x.when || x.due || '',
                x.status || x.st || '',
                (at && isFinite(at.getTime())) ? at.toISOString().slice(0,10) : '']);
    });
    return out;
  },
  work: function(){
    var S = siteStats(), out = [['وجه العمل','النقاط','النسبة']];
    Object.keys(S.byWork).sort(function(a,b){ return S.byWork[b]-S.byWork[a]; }).forEach(function(k){
      out.push([k, S.byWork[k], Math.round(S.byWork[k]/S.total*100) + '%']);
    });
    out.push(['الإجمالي', S.total, '100%']);
    return out;
  },
  co: function(){
    var S = siteStats(), out = [['الشركة','مواقعها','تمت الزيارة','مُركّب','٪']];
    Object.keys(S.byCo).sort(function(a,b){ return S.byCo[b]-S.byCo[a]; }).forEach(function(c){
      out.push([c, S.byCo[c], 0, 0, '0%']);
    });
    return out;
  },
  items: function(){
    var out = [['المنطقة','المعرّف','القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر']];
    itemsList().forEach(function(i){
      out.push([i.z==='cor'?'ممر':'مخيم', i.code, i.name,
                itPts(i.code), itPrep(i.code), itAsm(i.code), itPrice(i.code)]);
    });
    return out;
  },
techx: function(){
    var Tg = T(), out = [['الفني','زيارة','٪','تركيب','٪','فك','٪','الإجمالي']];
    scores().list.forEach(function(e){
      var x = [e.name, e.survey, e.install, e.dis];
      out.push([x[0], x[1], Tg.survey ? Math.round(x[1]/Tg.survey*100)+'%' : '—',
                x[2], Tg.ins ? Math.round(x[2]/Tg.ins*100)+'%' : '—',
                x[3], Tg.dis ? Math.round(x[3]/Tg.dis*100)+'%' : '—',
                x[1]+x[2]+x[3]]);
    });
    return out;
  },
  wos: function(){
    var Tg = T();
    return [['المرحلة','النوع','نقاط الشهر','تارجت الشهر','تارجت الأسبوع'],
            ['تهيئة','مخيمات',0,Tg.prepCamp,cfgWk(Tg.prepCamp)],
            ['تهيئة','ممرات',0,Tg.prepCor,cfgWk(Tg.prepCor)],
            ['تجميع','مخيمات',0,Tg.asmCamp,cfgWk(Tg.asmCamp)],
            ['تجميع','ممرات',0,Tg.asmCor,cfgWk(Tg.asmCor)],
            ['الإجمالي','',0,Tg.prep+Tg.asm,cfgWk(Tg.prep+Tg.asm)]];
  },
  crews: function(){
    var out = [['الفريق','مشرف','فنيون','معدّات','المعدل/يوم','النقاط','فرق لازمة','أفراد']];
    CREW_SPEC.forEach(function(s){
      var r = crewNeed(s, PLAN_MONTHS);
      out.push([s.n, r.sup, r.tech, r.gear, r.rate, r.units, r.crews, r.people]);
    });
    return out;
  },

  roles: function(){
    /* تُبنى من `ROLES` الحيّة لا من `ROLE_ORDER`/`PERMS` غيرِ الموجودتين —
       بقيةُ شاشة «الصلاحيات» القديمة المكرَّرة قبل حذفها. */
    var keys = Object.keys(ROLES);
    var caps = [];
    keys.forEach(function(k){
      Object.keys(ROLES[k].can || {}).forEach(function(c){ if (caps.indexOf(c) < 0) caps.push(c); });
    });
    var out = [['الدور'].concat(caps)];
    keys.forEach(function(k){
      out.push([ROLES[k].n].concat(caps.map(function(c){
        return (ROLES[k].can || {})[c] ? '✓' : '—';
      })));
    });
    return out;
  }
};

var SHEET_NAMES = {
  over:'نظرة عامة', sites:'المواقع', work:'أوجه العمل', co:'الشركات',
  score:'أداء الفنيين', stages:'أداء المراحل', recs:'المسح الميداني', tasks:'المهام', budm:'الملخّص المالي',
  evm:'القيمة المكتسبة', risks:'سجل المخاطر', hse:'السلامة', ncr:'عدم المطابقة',
  ipc:'المستخلصات', miles:'المعالم', raci:'المسؤوليات', less:'الدروس',
  sop:'دليل العمليات', reps:'كتالوج التقارير', qa:'التدقيق الهندسي', items:'القطع والأسعار',
  invb:'أرصدة المخزون', invmv:'دفتر الحركة', buys:'المشتريات',
  wos:'المستودع', crews:'الطواقم',
  ev:'سجل الأحداث', perms:'الصلاحيات'
};

/* ═══ إكسلُ الصفحة الحالية كاملةً ═══
   «صفحةٌ فيها مئةُ سجلٍّ في عشرِ صفحاتٍ — عايز إكسل بكلِّ اللي فيها مرةً واحدة».
   الصفحاتُ تُقصُّ للعرض (slice(0,n) و«عرض المزيد») لا للبيانات؛ فتُعاد
   بناءُ الصفحة في عنصرٍ منفصلٍ وكلُّ قصٍّ للعرض معطَّلٌ (EXP.xlsAll)، ثم يُقرأ كلُّ
   جدولٍ فيها ورقةً باسم بطاقته — فيخرج ما في الصفحة كلُّه، لا ما تراه العين. */
EXP.xlsAll = false;
/* التخزينُ المحليُّ قد يكون معطَّلًا (تصفّحٌ خاصّ) — يُلتقَط ويُذكَر مرةً */
var LS_ERR = null;
function lsGet(k){ try { return localStorage.getItem(k); } catch (e){ LS_ERR = e; return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch (e){ LS_ERR = e; return false; } }
function xlsPage(){
  var p = (typeof FIELD_PAGES === 'object' && FIELD_PAGES[CUR]) || PAGE[CUR];
  if (!p || !p.body){ toast(t('لا صفحةَ تُصدَّر')); return Promise.resolve(false); }
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return false; }
    var html = '', origSlice = Array.prototype.slice;
    EXP.xlsAll = true;
    try {
      /* قصُّ العرض slice(0, n≥10) على المصفوفات يُعطَّل أثناء البناء وحدَه */
      Array.prototype.slice = function(a, b){
        if (EXP.xlsAll && (a === 0 || a === undefined) && typeof b === 'number' && b >= 10 && this.length > b) return origSlice.call(this, 0);
        return origSlice.apply(this, arguments);
      };
      html = p.body();
    } catch (e){ softErr('إكسل الصفحة', e, 'تعذّر بناءُ الصفحة للتصدير'); }
    finally { Array.prototype.slice = origSlice; EXP.xlsAll = false; }
    if (!html) return false;
    var box = document.createElement('div'); box.innerHTML = html;
    var wb = XLSX.utils.book_new(), n = 0, used = {};
    var tables = box.querySelectorAll('table');
    Array.prototype.forEach.call(tables, function(tb, i){
      var rows = [];
      Array.prototype.forEach.call(tb.querySelectorAll('tr'), function(tr){
        var cells = [];
        Array.prototype.forEach.call(tr.children, function(td){ cells.push(String(td.textContent || '').replace(/\s+/g, ' ').trim()); });
        if (cells.some(function(c){ return c; })) rows.push(cells);
      });
      if (rows.length < 2) return;
      var card = tb.closest('.card'); var h = card ? card.querySelector('h2,h3,h4,.card-title') : null;
      var name = ((h && h.textContent) || (t(p.t) + ' ' + (i + 1))).replace(/[\\\/\?\*\[\]:]/g, ' ').trim().slice(0, 28) || ('جدول ' + (i + 1));
      if (used[name]) name = (name + ' ' + (++used[name])).slice(0, 31); else used[name] = 1;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, ci){ var w = 8; rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[ci] == null ? '' : r[ci]).length + 2)); }); return { wch:w }; });
      XLSX.utils.book_append_sheet(wb, ws, name); n++;
    });
    /* القوائمُ التي ليست جداول (المواقع وأمثالُها): عنوانٌ · تفصيلٌ · قيمة */
    Array.prototype.forEach.call(box.querySelectorAll('.list'), function(ls, i){
      var rows = [[t('العنوان'), t('التفاصيل'), t('القيمة')]];
      Array.prototype.forEach.call(ls.children, function(li){
        var g = function(sel){ var el = li.querySelector(sel); return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
        var r = [g('.li-t'), g('.li-s'), g('.li-end')];
        if (!r[0] && !r[1]) r = [String(li.textContent || '').replace(/\s+/g, ' ').trim(), '', ''];
        if (r[0]) rows.push(r);
      });
      if (rows.length < 2) return;
      var card = ls.closest('.card'); var h = card ? card.querySelector('h2,h3,h4,.card-title') : null;
      var name = ((h && h.textContent) || (t(p.t) + ' ' + (n + i + 1))).replace(/[\\\/\?\*\[\]:]/g, ' ').trim().slice(0, 28) || ('قائمة ' + (i + 1));
      if (used[name]) name = (name + ' ' + (++used[name])).slice(0, 31); else used[name] = 1;
      var ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch:34 }, { wch:46 }, { wch:16 }];
      XLSX.utils.book_append_sheet(wb, ws, name); n++;
    });
    if (!n){ toast(t('لا جداولَ في هذه الصفحة')); return false; }
    var tabT = TABS[CUR] ? (tabsOf(CUR).filter(function(x){ return x[0] === tabCur(CUR); })[0] || [])[1] : '';
    XLSX.writeFile(wb, 'نسك-' + t(p.t) + (tabT ? '-' + t(tabT) : '') + '-' + dayKey() + '.xlsx');
    logEvent('إكسل الصفحة — ' + p.t + (tabT ? ' · ' + tabT : '') + ' · ' + nm(n) + ' جدول');
    toast(nm(n) + ' ' + t('جدولًا صُدِّر بكلِّ صفوفه'));
    return true;
  });
}
/* ورقةٌ مبنيّةٌ في اللحظة لا من SHEETS — لنوافذِ التفاصيل */
function xlsSheets(pairs, fname){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return false; }
    var wb = XLSX.utils.book_new(), n = 0;
    (pairs || []).forEach(function(p){
      var rows = p[1]; if (!rows || rows.length < 2) return;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, i){
        var w = 10; rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[i] == null ? '' : r[i]).length + 2)); });
        return { wch:w };
      });
      XLSX.utils.book_append_sheet(wb, ws, String(p[0] || 'ورقة').slice(0, 30)); n++;
    });
    if (!n){ toast(t('لا بيانات للتصدير')); return false; }
    XLSX.writeFile(wb, (fname || 'نسك') + '-' + dayKey() + '.xlsx');
    toast(nm(n) + ' ' + t('ورقةً صُدّرت'));
    return true;
  });
}
/* ═══ ملفُّ المهام: كان يُبنى ورقةً ورقةً بمكتبة إكسل المجانية (V17.19) —
   فلا أنماطَ ولا جدولَ ولا تنسيقاتٍ شرطية، ومعادلاتُ النصِّ بنوعٍ يرفضه
   إكسل. أُزيل ذلك كلُّه في V17.36 لصالح القالب أدناه: الملفُّ الأصليُّ يُملأ. */
/* ═══ الملفُّ نفسُه: قالبٌ يُملأ لا ورقةٌ تُبنى (V17.36) ═══
   بناءُ الورقة من الصفر بمكتبة إكسل المجانية لا يكتب الألوانَ ولا الحدودَ
   ولا الجدولَ المنسَّق ولا التنسيقاتِ الشرطية — وكتب معادلاتِ النصِّ بنوعٍ
   خاطئٍ فرفضها إكسل وأصلحها بحذفها. فصار الملفُّ الأصليُّ نفسُه قالبًا: يُفتَح
   كما هو (بأنماطه وجدوله ولوحته ومعادلاته)، وتُستبدَل صفوفُ البيانات وحدَها
   بصفوفٍ تحمل أنماطَ صفِّه الأوّل ومعادلاتِه، ويُمَدُّ الجدولُ إلى آخر صف،
   ويُطلَب من إكسل إعادةُ الحساب عند الفتح. فما يخرج هو ملفُّ المكتب بعينه
   وفيه بياناتُ النظام. */
var JSZIP_LOADING = null;
function jszipLoad(){
  if (typeof JSZip !== 'undefined') return Promise.resolve(true);
  if (JSZIP_LOADING) return JSZIP_LOADING;
  JSZIP_LOADING = new Promise(function(res){
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.onload = function(){ res(true); }; sc.onerror = function(){ JSZIP_LOADING = null; res(false); };
    document.head.appendChild(sc);
  });
  return JSZIP_LOADING;
}
function xmlEsc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function xlSerial(iso){
  var d = iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00Z') : null;
  return d && !isNaN(d) ? Math.round((d.getTime() / 86400000) + 25569) : '';
}
function wtWorkbook(){
  return jszipLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة الضغط')); return false; }
    return fetch('docs/templates/tasks-template.xlsx', { cache:'no-store' }).then(function(r){
      if (!r.ok) throw new Error('template ' + r.status);
      return r.arrayBuffer();
    });
  }).then(function(buf){
    if (!buf) return false;
    return JSZip.loadAsync(buf).then(function(zip){
      return zip.file('xl/worksheets/sheet1.xml').async('string').then(function(xml){
        /* صفُّ القالب الأوّل: أنماطُ كلِّ عمودٍ ومعادلاتُ ل·م·ن كما هي */
        var row3 = /<row r="3"[^>]*>[\s\S]*?<\/row>/.exec(xml)[0];
        var st = {}; row3.replace(/<c r="([A-Z]+)3"([^>]*)>/g, function(m, col, attrs){ var mm = /s="(\d+)"/.exec(attrs); st[col] = mm ? mm[1] : ''; return m; });
        var fL = (/<c r="L3"[^>]*>\s*<f>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var fM = (/<c r="M3"[^>]*>\s*<f>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var fN = (/<c r="N3"[^>]*>\s*<f[^>]*>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var R = wtRows(), rows = [];
        var cell = function(ref, col, v, kind){
          var sa = st[col] ? ' s="' + st[col] + '"' : '';
          if (kind === 'n') return v === '' ? '<c r="' + ref + '"' + sa + '/>' : '<c r="' + ref + '"' + sa + '><v>' + v + '</v></c>';
          if (kind === 'f') return '<c r="' + ref + '"' + sa + ' t="str"><f>' + v + '</f></c>';
          if (kind === 'fa') return '<c r="' + ref + '"' + sa + ' t="str"><f t="array" ref="' + ref + '">' + v + '</f></c>';
          return v === '' ? '<c r="' + ref + '"' + sa + '/>' : '<c r="' + ref + '"' + sa + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
        };
        R.forEach(function(x, i){
          var n = 3 + i;
          rows.push('<row r="' + n + '" spans="1:18">'
            + cell('A' + n, 'A', i + 1, 'n')
            + cell('B' + n, 'B', x.n || '') + cell('C' + n, 'C', x.track || '') + cell('D' + n, 'D', x.code || '')
            + cell('E' + n, 'E', x.d || '') + cell('F' + n, 'F', x.who || '') + cell('G' + n, 'G', x.st || '')
            + cell('H' + n, 'H', xlSerial(x.seen), 'n') + cell('I' + n, 'I', xlSerial(x.due), 'n')
            + cell('J' + n, 'J', x.src || '') + cell('K' + n, 'K', x.upd || '')
            + cell('L' + n, 'L', fL.replace(/\$H3/g, '$H' + n), 'f')
            + cell('M' + n, 'M', fM.replace(/\$I3/g, '$I' + n), 'f')
            + (fN ? cell('N' + n, 'N', fN, 'fa') : '')
            + cell('O' + n, 'O', x.stop || '') + cell('P' + n, 'P', x.mSun || '') + cell('Q' + n, 'Q', x.mWed || '')
            + '</row>');
        });
        var last = 2 + Math.max(R.length, 1);
        /* الصفوفُ من ٣ فصاعدًا تُستبدَل كلُّها؛ ما قبلها (العنوانُ والرأس) يبقى */
        var head = xml.slice(0, xml.indexOf('<row r="3"'));
        var tail = xml.slice(xml.indexOf('</sheetData>'));
        xml = head + rows.join('') + tail;
        xml = xml.replace(/<dimension ref="[^"]+"\/>/, '<dimension ref="A1:R' + last + '"/>');
        /* التنسيقاتُ الشرطيةُ تمتدّ إلى آخر صف */
        xml = xml.replace(/sqref="([A-Z]+)3:([A-Z]+)\d+"/g, function(m, a, b){ return 'sqref="' + a + '3:' + b + last + '"'; });
        zip.file('xl/worksheets/sheet1.xml', xml);
        return zip.file('xl/tables/table1.xml').async('string').then(function(tx){
          tx = tx.replace(/ref="B2:O\d+"/g, 'ref="B2:O' + last + '"');
          zip.file('xl/tables/table1.xml', tx);
          return zip.file('xl/workbook.xml').async('string');
        }).then(function(wx){
          /* إكسل يعيد الحسابَ عند الفتح — وسلسلةُ الحساب القديمة تُحذَف لأن صفوفَها تغيّرت */
          wx = wx.replace(/<calcPr([^>]*)\/>/, function(m, a){ return '<calcPr' + a.replace(/ fullCalcOnLoad="[^"]*"/, '') + ' fullCalcOnLoad="1"/>'; });
          zip.file('xl/workbook.xml', wx);
          zip.remove('xl/calcChain.xml');
          return zip.file('[Content_Types].xml').async('string');
        }).then(function(ct){
          ct = ct.replace(/<Override[^>]*calcChain\.xml"[^>]*\/>/, '');
          zip.file('[Content_Types].xml', ct);
          return zip.file('xl/_rels/workbook.xml.rels').async('string');
        }).then(function(rl){
          rl = rl.replace(/<Relationship[^>]*calcChain\.xml"[^>]*\/>/, '');
          zip.file('xl/_rels/workbook.xml.rels', rl);
          return zip.generateAsync({ type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        });
      });
    });
  }).then(function(blob){
    if (!blob) return false;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'المهام — ' + dayKey(Date.now()) + '.xlsx';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(t('صُدّر الملفُّ بمعادلاته'));
    return true;
  }).catch(function(e){ softErr('تصدير الملف', e, 'تعذّر بناءُ الملف'); return false; });
}

function xlsExport(keys, fname){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة'); return false; }
    var wb = XLSX.utils.book_new(), n = 0;
    (keys || Object.keys(SHEETS)).forEach(function(k){
      if (!SHEETS[k]) return;
      var rows = SHEETS[k]();
      if (!rows || rows.length < 2) return;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, i){
        var w = 10;
        rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[i]==null?'':r[i]).length + 2)); });
        return { wch:w };
      });
      XLSX.utils.book_append_sheet(wb, ws, (SHEET_NAMES[k] || k).slice(0, 30));
      n++;
    });
    if (!n){ toast('لا بيانات للتصدير'); return false; }
    XLSX.writeFile(wb, fname || ('نسك-' + dayKey() + '.xlsx'));
    toast(nm(n) + ' ' + t('ورقةً صُدّرت'));
    return true;
  });
}

/* ── KMZ — ZIP مكتوبٌ بالكود بلا مكتبة ── */
function crc32(buf){
  var c, tbl = crc32.t;
  if (!tbl){
    tbl = crc32.t = new Int32Array(256);
    for (var n = 0; n < 256; n++){
      c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tbl[n] = c;
    }
  }
  var crc = -1;
  for (var i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ tbl[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

function zipStore(name, bytes){
  var nb = new TextEncoder().encode(name), cr = crc32(bytes);
  function u32(v){ return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]; }
  function u16(v){ return [v&255,(v>>>8)&255]; }
  var lf = [].concat([80,75,3,4], u16(20), u16(0), u16(0), u16(0), u16(0),
                     u32(cr), u32(bytes.length), u32(bytes.length),
                     u16(nb.length), u16(0));
  var local = new Uint8Array(lf.length + nb.length + bytes.length);
  local.set(lf, 0); local.set(nb, lf.length); local.set(bytes, lf.length + nb.length);
  var cf = [].concat([80,75,1,2], u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
                     u32(cr), u32(bytes.length), u32(bytes.length),
                     u16(nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0));
  var central = new Uint8Array(cf.length + nb.length);
  central.set(cf, 0); central.set(nb, cf.length);
  var end = [].concat([80,75,5,6], u16(0), u16(0), u16(1), u16(1),
                      u32(central.length), u32(local.length), u16(0));
  var out = new Uint8Array(local.length + central.length + end.length);
  out.set(local, 0); out.set(central, local.length);
  out.set(new Uint8Array(end), local.length + central.length);
  return out;
}

var KMZ_STY = {
  'مخيم':'camp', 'ممر':'cor', 'كاميرا':'cam', 'محطة':'stn',
  'جسر':'jam', 'بوابة':'gte', 'مبنى':'bld'
};

/* (V23.4) جدولُ كاميرات النقطة في وصف KMZ: الرقمُ والطرازُ والنوعُ والدقةُ والعنوانُ ورابطُ البثّ والوصلة */
function kmzCamTable(x){
  var c = camNetOf(x); if (!c || !c.cams || !c.cams.length) return '';
  var X = function(v){ return String(v == null ? '' : v).replace(/[<>&]/g, function(ch){ return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&amp;'; }); };
  return '<br><b>Uplink:</b> ' + X([c.cpe ? 'CPE ' + c.cpe : '', c.ant, c.sector, c.secAnt].filter(Boolean).join(' · ')) + (c.status ? '<br><b>Status:</b> ' + X(c.status) : '')
    + '<table border="1" cellpadding="3" style="border-collapse:collapse;font-size:11px"><tr><th>CAM</th><th>Model</th><th>Type</th><th>Spec</th><th>IP</th><th>VLAN</th></tr>'
    + c.cams.map(function(k){ return '<tr><td>' + X(k.n) + '</td><td>' + X(k.model) + '</td><td>' + (k.kind === 'P' ? 'PTZ' : 'Fixed') + '</td><td>' + X(CAM_SPEC[k.model] || '') + '</td><td>' + X(k.ip) + '</td><td>' + X(k.vlan) + '</td></tr>'
        + '<tr><td colspan="6">rtsp://' + X(k.ip) + ':554/cam/realmonitor?channel=1&amp;subtype=0</td></tr>'; }).join('') + '</table>';
}
function kmzBuild(filter, title){
  var X = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var K = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
    '<name>' + X(title) + '</name>',
    '<Style id="camp"><IconStyle><scale>0.8</scale><color>ff4ac9f9</color></IconStyle></Style>',
    '<Style id="cor"><IconStyle><scale>0.8</scale><color>ffa0d63a</color></IconStyle></Style>',
    '<Style id="cam"><IconStyle><scale>0.8</scale><color>ffff7dc7</color></IconStyle></Style>',
    '<Style id="stn"><IconStyle><scale>0.8</scale><color>ff60c9f2</color></IconStyle></Style>',
    '<Style id="jam"><IconStyle><scale>0.8</scale><color>ff3a87e8</color></IconStyle></Style>',
    '<Style id="gte"><IconStyle><scale>0.8</scale><color>ffacb238</color></IconStyle></Style>',
    '<Style id="bld"><IconStyle><scale>0.8</scale><color>ffbfc4b8</color></IconStyle></Style>'];
  var folders = {}, n = 0;
  STATE.sites.forEach(function(x){
    if (filter && !filter(x)) return;
    if (!x.lat || !x.lng) return;
    n++;
    var f = x.zone + ' — ' + x.type;
    if (!folders[f]) folders[f] = [];
    folders[f].push('<Placemark><name>' + X(x.id) + '</name>'
      + '<description><![CDATA[' + X(x.name)
      + (x.sign ? '<br>شاخص: ' + X(x.sign) : '')
      + (x.sq   ? '<br>مربع: '  + X(x.sq)   : '')
      + (x.co   ? '<br>' + X(x.co) : '') + kmzCamTable(x) + ']]></description>'
      + '<styleUrl>#' + (KMZ_STY[x.type] || 'bld') + '</styleUrl>'
      + '<Point><coordinates>' + x.lng + ',' + x.lat + ',0</coordinates></Point></Placemark>');
  });
  Object.keys(folders).forEach(function(f){
    K.push('<Folder><name>' + X(f) + ' (' + folders[f].length + ')</name>');
    K.push(folders[f].join(''));
    K.push('</Folder>');
  });
  K.push('</Document></kml>');
  return { xml:K.join('\n'), count:n };
}

/* ═══ استيرادُ KMZ/KML ═══
   يجيء الملفُّ من Google Earth: `doc.kml` مضغوطًا، وفيه Placemark لكلِّ نقطةٍ
   باسمٍ ووصفٍ وإحداثيات. والخطرُ في الاستيراد ليس القراءةَ بل **التكرار**:
   نقطةٌ تُضاف مرتين تُمسَح مرتين وتُركَّب مرتين وتُحسَب مرتين في تقرير
   الوزارة. والاسمُ لا يصلح ميزانًا — أسماءُ المخيمات تتكرّر في منى («مخيم ٤»
   في مربعاتٍ شتّى)، وقد تُغيَّر الأسماءُ من الوزارة. **فالمسافةُ هي الميزان**:
   خمسةَ عشرَ مترًا فأقلُّ = النقطةُ نفسُها مهما اختلف الاسم؛ وما بين خمسةَ
   عشرَ وخمسةٍ وسبعين مع اسمٍ يشبه = مشكوكٌ فيه يُعرَض ولا يُقرَّر؛ وما فوق
   ذلك جديدٌ يُضاف بمعرِّفٍ من نظامنا. ولا يُكتَب شيءٌ قبل المعاينة. */
var KMI = null, KMI_ZONE = 'منى', KMI_TYPE = 'مخيم', KMI_WORK = 'موقع جديد', KMI_BUSY = false;
var KMI_NEAR = 15, KMI_DOUBT = 75;

/* المسافةُ بالمتر — هافرساين مبسَّطٌ يكفي في نطاق المشاعر */
function geoM(a1, o1, a2, o2){
  var R = 6371000, p1 = a1 * Math.PI / 180, p2 = a2 * Math.PI / 180;
  var dp = (a2 - a1) * Math.PI / 180, dl = (o2 - o1) * Math.PI / 180;
  var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
/* تشابهُ الاسم: بعد تجريده من الزخرفة والأرقام العربية */
function nameKey(s2){
  return String(s2 || '').replace(/[\u064B-\u0652\u200f\u200e]/g, '')
    .replace(/[٠-٩]/g, function(c){ return String(c.charCodeAt(0) - 0x0660); })
    .replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064Aa-zA-Z0-9]+/g, ' ').trim().toLowerCase();
}
function nameLike(a, b){
  var x = nameKey(a), y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.indexOf(y) > -1 || y.indexOf(x) > -1;
}
/* فكُّ الضغط: مدخلاتٌ مخزونةٌ أو منكمشةٌ — والمتصفّحُ يفكُّ الثانيةَ بنفسه */
function unzipKml(buf){
  var u8 = new Uint8Array(buf), dv = new DataView(buf);
  var files = [];
  for (var i = 0; i + 4 < u8.length; i++){
    if (dv.getUint32(i, true) !== 0x04034b50) continue;
    var method = dv.getUint16(i + 8, true), csize = dv.getUint32(i + 18, true);
    var nlen = dv.getUint16(i + 26, true), elen = dv.getUint16(i + 28, true);
    var name = new TextDecoder().decode(u8.subarray(i + 30, i + 30 + nlen));
    var start = i + 30 + nlen + elen;
    if (!/\.kml$/i.test(name) || !csize) continue;
    files.push({ name:name, method:method, bytes:u8.subarray(start, start + csize) });
  }
  if (!files.length) return Promise.resolve(null);
  var f2 = files.filter(function(x){ return /doc\.kml$/i.test(x.name); })[0] || files[0];
  if (f2.method === 0) return Promise.resolve(new TextDecoder().decode(f2.bytes));
  /* ═══ فكُّ الضغط بمسارين (V17.56) ═══
     الأصلُ DecompressionStream وهو في المتصفّحات الحديثة؛ وما دونها كان
     يُرَدُّ فارغًا فيُقال «تعذّرت قراءةُ الملف» بلا سبب — والملفُّ سليم.
     فصار له بديلٌ: مكتبةُ الضغط نفسُها التي يستعملها تصديرُ إكسل. */
  if (typeof DecompressionStream === 'function'){
    try {
      var ds = new DecompressionStream('deflate-raw');
      var st = new Blob([f2.bytes]).stream().pipeThrough(ds);
      return new Response(st).text();
    } catch (e){ LS_ERR = e; }
  }
  return jszipLoad().then(function(ok){
    if (!ok || typeof JSZip === 'undefined') return null;
    return JSZip.loadAsync(buf).then(function(zip){
      var name = Object.keys(zip.files).filter(function(k){ return /\.kml$/i.test(k); });
      var pick = name.filter(function(k){ return /doc\.kml$/i.test(k); })[0] || name[0];
      return pick ? zip.file(pick).async('string') : null;
    });
  }).catch(function(e){ LS_ERR = e; return null; });
}
/* قراءةُ الأماكن — Point أوّلًا، وللمضلّع والخطِّ يُؤخَذ مركزُه */
function kmlPlaces(xml){
  var doc = new DOMParser().parseFromString(xml, 'text/xml');
  var pms = doc.getElementsByTagName('Placemark'), out = [];
  var txt = function(el, tag){
    var n2 = el.getElementsByTagName(tag)[0];
    return n2 ? String(n2.textContent || '').trim() : '';
  };
  for (var i = 0; i < pms.length; i++){
    var pm = pms[i];
    /* مُصدِّرُنا يكتب <n> وGoogle Earth يكتب <name> — يُقبلان */
    var nm2 = txt(pm, 'name') || txt(pm, 'n');
    var desc = txt(pm, 'description');
    var cs = pm.getElementsByTagName('coordinates')[0];
    if (!cs) continue;
    var raw = String(cs.textContent || '').trim().split(/\s+/).filter(Boolean);
    var lat = 0, lng = 0, shape = 'point';
    if (raw.length === 1){
      var p1 = raw[0].split(','); lng = +p1[0]; lat = +p1[1];
    } else {
      shape = pm.getElementsByTagName('Polygon').length ? 'polygon' : 'line';
      var sx = 0, sy = 0, k = 0;
      raw.forEach(function(r){ var p2 = r.split(','); if (isFinite(+p2[0]) && isFinite(+p2[1])){ sx += +p2[0]; sy += +p2[1]; k++; } });
      if (k){ lng = sx / k; lat = sy / k; }
    }
    if (!isFinite(lat) || !isFinite(lng) || (!lat && !lng)) continue;
    /* حقولٌ إضافيةٌ إن كتبها الملفُّ — تُقرأ ولا تُخترَع */
    var ext = {}, ds2 = pm.getElementsByTagName('Data');
    for (var j = 0; j < ds2.length; j++){
      var k2 = ds2[j].getAttribute('name') || '', v2 = txt(ds2[j], 'value');
      if (k2) ext[k2] = v2;
    }
    var pick = function(re){
      var m2 = re.exec(desc || ''); if (m2) return String(m2[1]).trim();
      var kk = Object.keys(ext).filter(function(x){ return re.test(x + ':'); })[0];
      return kk ? ext[kk] : '';
    };
    out.push({ name:nm2 || '', desc:desc, lat:lat, lng:lng, shape:shape,
               sign:pick(/شاخص\s*[:：]?\s*([^<\n]{1,40})/), sq:pick(/مربع\s*[:：]?\s*([^<\n]{1,20})/),
               co:pick(/شركة\s*[:：]?\s*([^<\n]{1,60})/) });
  }
  return out;
}
/* التصنيف: موجودةٌ · مشكوكٌ فيها · جديدة */
function kmiClassify(places){
  var S = (STATE.sites || []).filter(function(x){ return +x.lat && +x.lng; });
  return places.map(function(p){
    var best = null, bestD = 1e9;
    S.forEach(function(x){
      var d = geoM(p.lat, p.lng, +x.lat, +x.lng);
      if (d < bestD){ bestD = d; best = x; }
    });
    var st = 'new';
    if (best && bestD <= KMI_NEAR) st = 'same';
    else if (best && bestD <= KMI_DOUBT && nameLike(p.name, best.name || best.id)) st = 'doubt';
    return { p:p, near:best, d:bestD, st:st, take:(st === 'new') };
  });
}
function kmiImport(file){
  if (!may('edit')){ toast(t('الاستيراد لمن يكتب في الميدان')); return; }
  KMI_BUSY = true; render(1);
  var fr = new FileReader();
  fr.onload = function(){
    var buf = fr.result;
    var isZip = new Uint8Array(buf, 0, 2)[0] === 0x50 && new Uint8Array(buf, 0, 2)[1] === 0x4B;
    (isZip ? unzipKml(buf) : Promise.resolve(new TextDecoder().decode(buf))).then(function(xml){
      KMI_BUSY = false;
      if (!xml){ toast(t('تعذّرت قراءةُ الملف — تأكّد أنه KMZ أو KML')); render(1); return; }
      var places = kmlPlaces(xml);
      if (!places.length){ toast(t('لا نقاطَ في الملف')); render(1); return; }
      KMI = { rows:kmiClassify(places), file:file.name || '' };
      logEvent('معاينةُ استيراد KMZ — ' + places.length + ' نقطة');
      render(1);
    }).catch(function(e){ KMI_BUSY = false; softErr('استيراد KMZ', e, 'تعذّرت قراءةُ الملف'); render(1); });
  };
  fr.readAsArrayBuffer(file);
}
function kmiApply(){
  if (!KMI || !may('edit')) return;
  var take = KMI.rows.filter(function(r){ return r.take; });
  if (!take.length){ toast(t('لم تُحدَّد نقطةٌ للإضافة')); return; }
  var pre = zoneCode(KMI_ZONE);
  var tp  = typeCode(KMI_TYPE);
  var seq = STATE.sites.filter(function(x){ return String(x.id).indexOf('NSK-' + pre + '-' + tp + '-K') === 0; }).length;
  var n = 0;
  take.forEach(function(r){
    seq++; n++;
    var id = 'NSK-' + pre + '-' + tp + '-K' + String(seq).padStart(3, '0');
    var site = { id:id, name:r.p.name || (KMI_ZONE + ' - ' + KMI_TYPE + ' ' + seq),
      zone:KMI_ZONE, type:KMI_TYPE, work:KMI_WORK,
      lat:+r.p.lat.toFixed(6), lng:+r.p.lng.toFixed(6),
      sq:r.p.sq || '', sign:r.p.sign || '', co:r.p.co || '',
      region:'منطقة ' + KMI_ZONE, fstat:'لم يبدأ', inout:'',
      isNew:true, approved:false, src:'kmz', srcFile:KMI.file || '',
      by:STATE.meta.name || '', at:Date.now() };
    STATE.sites.push(site);
    CORE.set('newsites', id, site);
  });
  SITE_IX = null; SITE_TOK = null;
  logEvent('استيرادُ KMZ — أُضيفت ' + n + ' نقطةً · ' + KMI_ZONE + ' · ' + KMI_TYPE);
  notifPush('نقاطٌ مستورَدة', nm(n) + ' ' + t('نقطةً أُضيفت من ملف') + ' — ' + KMI_ZONE, { lv:'مهم' });
  statBump(); KMI = null; toast(nm(n) + ' ' + t('نقطةً أُضيفت'));
  render(1);
}
function kmiCard(){
  if (!may('edit')) return '';
  var ZS = zoneOptions(), TS = Object.keys(typesList());   /* من سجلَّي المشاعر والأنواع لا قوائمَ ثانية (V17.60/V17.72) */
  var head = card('استيراد KMZ / KML من جوجل إيرث',
      '<p class="hint" style="margin:0 0 10px">'
    + esc(t('يُقرأ الملفُّ ويُعايَن قبل أن يُكتب شيء. النقطةُ التي تبعد خمسةَ عشرَ مترًا فأقلَّ عن نقطةٍ عندنا هي هي — مهما اختلف الاسم — فلا تُضاف. وما تجاوزها يُضاف بمعرِّفٍ من نظامنا وبالتصنيف الذي تختاره.'))
    + '</p><div class="grid cols-3">'
    +   '<div class="field"><label>' + esc(t('المشعر')) + '</label><select data-kmiz>'
    +     ZS.map(function(z){ return '<option value="' + esc(z) + '"' + (KMI_ZONE === z ? ' selected' : '') + '>' + esc(t(z)) + '</option>'; }).join('') + '</select></div>'
    +   '<div class="field"><label>' + esc(t('النوع')) + '</label><select data-kmit>'
    +     TS.map(function(x){ return '<option value="' + esc(x) + '"' + (KMI_TYPE === x ? ' selected' : '') + '>' + esc(typeShort(x)) + '</option>'; }).join('') + '</select></div>'
    +   '<div class="field"><label>' + esc(t('وجه العمل')) + '</label><input data-kmiw value="' + esc(KMI_WORK) + '" dir="auto"></div>'
    + '</div>'
    + '<div class="actions" style="margin:8px 0 0">'
    +   '<label class="btn btn-primary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('اختر ملف KMZ أو KML'))
    +   '<input type="file" accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml" data-kmifile="1" style="display:none"></label>'
    +   (KMI ? btn(t('إلغاء المعاينة'),'btn-quiet btn-sm',' data-kmix="1"') : '')
    + '</div>'
    + (KMI_BUSY ? '<p class="hint" style="margin:8px 0 0">' + esc(t('يُقرأ الملف…')) + '</p>' : ''));
  if (!KMI) return head;
  var R = KMI.rows;
  var cnt = { same:0, doubt:0, new:0 };
  R.forEach(function(r){ cnt[r.st]++; });
  var take = R.filter(function(r){ return r.take; }).length;
  var rows = capList(R, 300).map(function(r, i){
    var p = r.p;
    var badge = r.st === 'same' ? pill('موجودة عندنا','ok') : (r.st === 'doubt' ? pill('مشكوكٌ فيها','wrn') : pill('جديدة','acc'));
    return ['<input type="checkbox" data-kmick="' + i + '"' + (r.take ? ' checked' : '') + ' style="width:18px;min-height:18px">',
            '<strong dir="auto">' + esc(p.name || '—') + '</strong>'
              + (p.shape !== 'point' ? '<br><span class="hint" style="margin:0">' + esc(t(p.shape === 'polygon' ? 'مضلّع — أُخذ مركزُه' : 'خط — أُخذ مركزُه')) + '</span>' : ''),
            '<span class="num">' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</span>',
            badge,
            r.near ? ('<span class="num">' + esc(r.near.id) + '</span><br><span class="hint" style="margin:0">' + nm(Math.round(r.d)) + ' ' + esc(t('م')) + '</span>') : '—',
            esc((p.sign || p.sq || p.co || '').slice(0, 30))];
  });
  return head
    + stats([['في الملف', N(R.length)], ['جديدة', N(cnt['new']), 'acc'],
             ['موجودة عندنا', N(cnt.same), 'ok'], ['مشكوكٌ فيها', N(cnt.doubt), cnt.doubt ? 'wrn' : 'ok'],
             ['ستُضاف', N(take), take ? 'acc' : 'wrn']])
    + cardFlush(t('معاينةُ الملف') + ' \u2014 ' + esc(KMI.file || ''),
        table(['', 'الاسم في الملف','الإحداثيات','الحكم','أقربُ نقطةٍ عندنا','حقولٌ قرأناها'], rows),
        '<div class="actions" style="margin:0">'
        + btn('\u2714 ' + t('أضِف المحدَّد') + ' (' + nm(take) + ')','btn-primary btn-sm',' data-kmigo="1"')
        + btn(t('حدّد الجديدةَ فقط'),'btn-quiet btn-sm',' data-kmiall="new"')
        + btn(t('ألغِ التحديد'),'btn-quiet btn-sm',' data-kmiall="none"')
        + '</div>')
    + '<p class="hint">' + esc(t('«موجودة عندنا» لا تُضاف افتراضًا — وإن أضفتها صارت نقطتين في موضعٍ واحد. و«مشكوكٌ فيها» قرارُك: قريبةٌ واسمُها يشبه، فراجعها على الخريطة قبل أن تقرّر.')) + '</p>';
}
/* ═══ التصديرُ القياسي GeoJSON (V18.0) ═══
   ملفٌّ يفتحه أيُّ نظامٍ جغرافي: FeatureCollection وفق RFC 7946 (WGS84،
   الترتيبُ خطُّ الطول ثم خطُّ العرض)، ولكلِّ نقطةٍ حالتُها من دورة الحياة نفسِها
   (lifeOf) وتواريخُها المفصلية. بحسب الدور: ما تصدّره الوزارةُ بلا جوالاتٍ ولا
   أسماءِ أشخاصٍ ولا ملاحظاتٍ داخلية. المخطّطُ في docs/schema/. */
function geoJsonBuild(){
  var viewer = effRole(ROLE) === 'viewer', full = !viewer;
  var feats = [];
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat) || !(+x.lng)) return;
    var r = STATE.recs[x.id], ins = STATE.inss[x.id], dis = STATE.diss && STATE.diss[x.id], hd = (typeof handOf === 'function') ? handOf(x.id) : null;
    var life = lifeOf(x);
    var p = { id:x.id, name:x.name || '', zone:x.zone || '', type:x.type || '', camera_kind:camKind(x) || null, block:x.sq || '', sign:x.sign || '', company:x.co || '',
              status:life, status_label:(LIFE[life] || LIFE.todo).n,
              surveyed_at: svVisited(r) ? new Date(+r.at).toISOString() : null,   /* (V32.6) */
              installed_at: ins && ins.status === 'مُركّب' ? new Date(+ins.at).toISOString() : null,
              handed_at: hd && hd.at ? new Date(+hd.at).toISOString() : null,
              dismantled_at: dis && dis.status === 'تم الفك' ? new Date(+dis.at).toISOString() : null };
    if (full){
      p.surveyed_by = r ? (r.by || '') : '';
      p.challenges = r ? chalKeys(r.chals) : [];
      p.note = r ? String(r.note || '') : '';
    }
    feats.push({ type:'Feature', id:x.id, geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] }, properties:p });
  });
  return { type:'FeatureCollection', name:'afaqy-readers-1448', generated_at:new Date().toISOString(), version:appVer(), features:feats };
}
function geoJsonExport(){
  var g = geoJsonBuild();
  var ok = dl(new Blob([JSON.stringify(g)], { type:'application/geo+json' }), 'afaqy-readers-' + dayKey() + '.geojson');
  toast(ok ? (nm(g.features.length) + ' ' + t('نقطةً في الملف')) : t('تعذّر التنزيل'));
  return ok;
}
/* ═══ خريطةُ المشاعر بلا شبكة (V18.0) ═══
   بلاطاتُ الخريطة شبكةٌ فقط، فتبيض الخريطةُ بلا شبكةٍ وتبقى النقاطُ وحدَها.
   صار ثمّة ملفُّ خريطةٍ متّجهيٍّ واحدٌ (PMTiles من OpenStreetMap — يُبنى كلَّ موسمٍ
   بالوصفة في docs/maps) يُنزِّله الفنيُّ بموافقةٍ صريحةٍ من الأدوات ويُحفَظ في
   Cache Storage ويُقرأ منه مقاطعَ في الذاكرة (FileSource — بلا رابطٍ ولا نطاقاتِ بايت)، ويرسمه
   عارضٌ مضمَّنٌ (vendor/protomaps) يُحمَّل عند الحاجة. الإسنادُ ظاهر. القمرُ
   الصناعيُّ يبقى عبر الشبكة، وبلا الملفِّ يبقى كلُّ شيءٍ كما كان. */
var BASEMAP = { manifest:null, have:null, layer:null, arc:null, busy:null, loading:false };
var BASEMAP_CACHE = 'nusuk-basemap', BASEMAP_FILE = 'maps/mashaer.pmtiles', BASEMAP_MAX = 30 * 1024 * 1024;
/* (V25.0) عارضُ خريطة الجهاز يُحفَظ معها في مخزنها الباقي: بلا شبكةٍ لا يُحمَّل من مكانٍ آخر، ومخزنُ الهيكل يتبدّل مع كلِّ نسخة */
var BASEMAP_JS = ['vendor/protomaps/pmtiles-4.5.0.js', 'vendor/protomaps/protomaps-leaflet-5.1.0.js'];
function basemapWarm(){
  if (typeof caches !== 'object' || !caches.open) return Promise.resolve(false);
  return caches.open(BASEMAP_CACHE).then(function(c){ return Promise.all(BASEMAP_JS.map(function(u){ return c.match(u).then(function(h){ return h || c.add(u); }); })); }).then(function(){ return true; }).catch(function(){ return false; });
}
function basemapManifest(){
  if (BASEMAP.manifest) return Promise.resolve(BASEMAP.manifest);
  if (typeof fetch !== 'function'){ BASEMAP.manifest = { bytes:0 }; return Promise.resolve(BASEMAP.manifest); }   /* بيئةٌ بلا fetch */
  return fetch('maps/manifest.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(m){ BASEMAP.manifest = m || { bytes:0 }; if (CUR === 'tools' || CUR === 'acct') render(1); return BASEMAP.manifest; }).catch(function(){ BASEMAP.manifest = { bytes:0 }; return BASEMAP.manifest; });
}
function basemapHave(){
  if (typeof caches !== 'object' || !caches.open) return Promise.resolve(false);
  return caches.open(BASEMAP_CACHE).then(function(c){ return c.match(BASEMAP_FILE); }).then(function(r){ var was = BASEMAP.have; BASEMAP.have = !!r; if (was === null && (CUR === 'tools' || CUR === 'acct')) render(1); return !!r; }).catch(function(){ BASEMAP.have = false; return false; });
}
/* ═══ خريطةُ مكة تلقائيًّا (V24.9) ═══ ملفٌّ واحدٌ (أقلُّ من ٤ م.ب) بشوارع مكة كلِّها ومبانيها وأسمائها —
   المشاعرُ والحرمُ والعزيزيةُ والنواريةُ والزايدي: يُنزَّل مرةً عند أوّل فتحٍ للخريطة ويُحفَظ في الجهاز، ثم
   تُرسَم الخلفيةُ منه فورًا وبلا شبكة؛ ولا طلبَ على سيرفراتٍ خارجية إلا للقمر الصناعي. */
function basemapAuto(){
  if (BASEMAP.auto) return; BASEMAP.auto = true;
  /* (V34.2) الصندوقُ الأسودُ في آيفون المالك: ستُّ إقلاعاتٍ ماتت بعد الرسم الأوّل على «الخريطة» و«متابعة الوزارة» (المرحلة render) — وهي
     اللحظةُ التي يبدأ فيها التنزيلُ التلقائيُّ لخريطة المشاعر (حتى ٣٠ ميجا) بجوار طبقة القمر الصناعي. على الآيفون ذاكرةُ الصفحة محدودة
     فيُقتَل محرّكُها. صار التنزيلُ التلقائيُّ لا يعمل على الآيفون؛ وزرُّ «نزّل» في «حسابي» باقٍ لمن يحتاج الخريطةَ بلا شبكة. */
  if (typeof dlIOS === 'function' && dlIOS()){ bootStage('basemap-skip-ios'); return; }
  /* (V25.0) المحفوظُ أوّلًا: من فتح التطبيقَ بلا شبكةٍ لا يصل إلى البيان، فكان الإرفاقُ ينتظره فلا تظهر خريطةُ الجهاز أبدًا */
  try { basemapHave().then(function(h){
    if (h){ basemapWarm(); if (basemapWant()) try { basemapAttach(); } catch (e){ LS_ERR = e; }
      basemapStale().then(function(st){ if (st && basemapNetOk()) basemapDownload(); });   /* (V25.2) ملفٌّ أحدث: مكة والمدينة والطريق */
      return; }
    basemapManifest().then(function(m){ if (m && m.bytes > 0 && basemapNetOk()) basemapDownload(); });
  }); } catch (e){ LS_ERR = e; }
}
/* ═══ خريطةُ الجهاز للانقطاع وحدَه (V25.0) ═══
   في V24.9 صارت خريطةُ الجهاز هي الخلفيةَ دائمًا، ورسمُها يجري على معالج الهاتف نفسِه قطعةً
   قطعةً مع كلِّ سحبٍ وتقريب — فثقُل تحريكُ الخريطة. والبلاطُ الشبكيُّ صورٌ جاهزةٌ يعرضها
   المتصفّحُ بلا كلفة. فصار: مع الشبكة تبقى الخلفيةُ كما في V24.8 تمامًا، وتُلحَق خريطةُ الجهاز
   حين تنقطع الشبكة أو يتعثّر البلاطُ الشبكيُّ مرارًا، وتُرفَع وتُترَك من الذاكرة حين تعود. */
function basemapWant(){
  /* (V25.1) والقمرُ لا يصل بلا شبكةٍ هو الآخر: عند الانقطاع خريطةُ الجهاز أيًّا كان المختار */
  return BASEMAP.netDown === true || (typeof navigator === 'object' && navigator.onLine === false);
}
/* (V25.2) المحفوظُ غيرُ ما في البيان (بحجمه): يُستبدَل بالجديد على اتصالٍ جيد، ويبقى القديمُ عاملًا حتى يتمّ */
function basemapStale(){
  if (typeof caches !== 'object' || !caches.open) return Promise.resolve(false);
  return Promise.all([basemapManifest(), caches.open(BASEMAP_CACHE).then(function(c){ return c.match(BASEMAP_FILE); })]).then(function(a){
    var m = a[0], r = a[1], n = r ? +(r.headers.get('content-length') || 0) : 0;
    return !!(m && m.bytes > 0 && n > 0 && n !== m.bytes);
  }).catch(function(){ return false; });
}
/* ═══ طبقتا الخريطة (V25.2): مباني الوزارة وأماكن التفويج ═══
   خريطةٌ فقط بقرار المالك: لا نقاطُ مسحٍ ولا تدخل في عدّادٍ ولا في أرقام الوزارة. تُحمَّل عند أوّل اختيارٍ
   من «تصفية» (layers/poi.json — يخزّنه العاملُ لما بعد)، وتُرسَم على لوح النقاط، والاسمُ بلمسة. */
var POIL = { on:{ ministry:false, tafweej:false }, data:null, busy:false, layer:null };
var POIL_C = { ministry:'#8E44AD', tafweej:'#E67E22' };
function poiLoad(){
  if (POIL.data || POIL.busy || typeof fetch !== 'function') return;
  POIL.busy = true;
  fetch('layers/poi.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ POIL.busy = false; if (!d) return; POIL.data = d; poiPaint(); }).catch(function(e){ POIL.busy = false; LS_ERR = e; });
}
function poiPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (POIL.layer && POIL.layer._map !== MAP) POIL.layer = null;
    if (POIL.layer) POIL.layer.clearLayers(); else POIL.layer = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (!POIL.data) return;
  Object.keys(POIL.on).forEach(function(k){
    var g = POIL.data[k]; if (!POIL.on[k] || !g || !g.items) return;
    g.items.forEach(function(p){
      if (!(+p.lat) || !(+p.lng)) return;
      L.circleMarker([+p.lat, +p.lng], { renderer:MAP_CV || undefined, radius:7, color:'#fff', weight:2, fillColor:POIL_C[k], fillOpacity:.95, bubblingMouseEvents:false })
        .bindPopup('<b>' + esc(p.name) + '</b><br><span class="hint">' + esc(t(g.name)) + '</span>')
        .addTo(POIL.layer);
    });
  });
}
/* ═══ طبقةُ تخطيط حساسات منى (V25.7) ═══
   بقرار المالك: ١٢ حساسَ حرارةٍ ورطوبةٍ لكلِّ مخيمٍ في منى (غرفةٌ لكلِّ حساس) وجيت واي واحدٌ يغطّيها بحسب
   رسمة المخيم — طبقةٌ مبدئيةٌ من layers/mina-sensors.json تُرسَم حين تُطلَب من «تصفية»، على تقريب ١٦ فأعلى،
   لمخيمات الإطار وحدَها (٦٧٩ مخيمًا × ١٣ شكلًا لا تُرسَم دفعةً). ليست نقاطًا ولا تدخل في العدّادات ولا أرقام
   الوزارة. التعديلُ الميداني (نقلٌ وزيادةٌ ونقص) في نسخةٍ تالية. */
var IOT = { on:false, data:null, busy:false, layer:null, Z:16, edit:null };
var IOT_C = { gw:'#F5A623', sensor:'#2EC4B6' };
function iotLoad(){
  if (IOT.data || IOT.busy || typeof fetch !== 'function') return;
  IOT.busy = true;
  fetch('layers/mina-sensors.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ IOT.busy = false; if (!d) return; IOT.data = d; iotPaint(); }).catch(function(e){ IOT.busy = false; LS_ERR = e; });
}
function iotPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (IOT.layer && IOT.layer._map !== MAP) IOT.layer = null;
    if (IOT.layer) IOT.layer.clearLayers(); else IOT.layer = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (IOT.edit){   /* (V25.8) مخيمُ التعديل وحدَه — نقرٌ على الشكل يحدِّده */
    var E = IOT.edit, xe = siteFind(E.id), ne = xe ? (xe.name || E.id) : E.id;
    E.sensors.forEach(function(q, i){
      var on = E.sel && E.sel.k === 's' && E.sel.i === i;
      shapeMk(q, { renderer:MAP_CV, radius:on ? 8 : 6, color:on ? '#E05252' : '#fff', weight:on ? 3 : 1.2, fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop')
        .on('click', function(){ E.sel = { k:'s', i:i }; E.add = false; iotPaint(); render(1); }).addTo(IOT.layer);
    });
    var ong = E.sel && E.sel.k === 'gw';
    shapeMk(E.gw, { renderer:MAP_CV, radius:ong ? 11 : 9, color:ong ? '#E05252' : '#fff', weight:ong ? 3 : 1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star')
      .on('click', function(){ E.sel = { k:'gw' }; E.add = false; iotPaint(); render(1); }).addTo(IOT.layer);
    return;
  }
  if (!IOT.on || !IOT.data || MAP.getZoom() < IOT.Z) return;
  var b = MAP.getBounds().pad(0.1), C = IOT.data.camps || {};
  Object.keys(C).forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw || !c.sensors) return;
    if (!b.contains(c.gw) && !c.sensors.some(function(q){ return b.contains(q); })) return;
    var x = siteFind(id), nm0 = x ? (x.name || id) : id;
    c.sensors.forEach(function(q, i){
      shapeMk(q, { renderer:MAP_CV, radius:5, color:'#fff', weight:1.2, fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop')
        .bindPopup('<b>' + esc(t('حساس حرارة ورطوبة')) + ' ' + nm(i + 1) + '</b><br><span class="hint">' + esc(nm0) + ' \u00b7 ' + esc(t('تخطيطٌ مبدئي — يُعدَّل ميدانيًّا')) + '</span>')
        .addTo(IOT.layer);
    });
    shapeMk(c.gw, { renderer:MAP_CV, radius:8, color:'#fff', weight:1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star')
      .bindPopup('<b>' + esc(t('جيت واي')) + '</b><br><span class="hint">' + esc(nm0) + ' \u00b7 ' + esc(t('يغطي')) + ' ' + nm(c.sensors.length) + ' ' + esc(t('حساسًا، أبعدها')) + ' ' + nm(c.maxM != null ? c.maxM : iotMax(c.gw, c.sensors)) + ' ' + esc(t('م')) + ' \u00b7 ' + esc(t(c.at && c.by !== undefined && STATE.siteOv && STATE.siteOv[id] && STATE.siteOv[id].iot ? 'عُدِّلت ميدانيًّا' : 'تخطيطٌ مبدئي — يُعدَّل ميدانيًّا')) + '</span>'
        + (mayIot() ? '<br>' + btn(t('عدّل الحساسات'), 'btn-quiet btn-sm', ' data-iotedit="' + esc(id) + '"') : ''))
      .addTo(IOT.layer);
  });
}
/* ═══ تعديلُ الحساسات من الميدان (V25.8) ═══
   قرارُ المالك: المهندسُ فما فوق والمشرفُ (هو من يمسح الموقع) — يعدّلون خطّةَ المخيم: نقلُ حساسٍ أو
   الجيت واي، وزيادةٌ ونقص. الحفظُ تعديلٌ فوق الطبقة المبدئية في وثيقة الموقع (siteOv.iot) فيصل الأجهزةَ
   كلَّها كسائر تعديلات المواقع ولا يحتاج مجموعةً ولا قاعدةً جديدة، ويُسجَّل في الأحداث. ولا جيت واي ثانٍ:
   إن بعُد حساسٌ عن ١٥٠ م نُبِّه وأُشير إلى مركز الحساسات. */
function mayIot(){ var b = (typeof effRole === 'function') ? effRole(ROLE) : ROLE; return b === 'engineer' || b === 'admin' || b === 'supervisor'; }
function iotOf(id){ var ov = STATE.siteOv && STATE.siteOv[id] && STATE.siteOv[id].iot; if (ov && ov.gw && Array.isArray(ov.sensors)) return ov; return IOT.data && IOT.data.camps ? IOT.data.camps[id] : null; }
function iotM(a, b){ var r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(a[0] * r), y = (b[0] - a[0]) * r; return 6371000 * Math.sqrt(x * x + y * y); }
function iotMax(gw, S){ var m = 0; S.forEach(function(q){ m = Math.max(m, iotM(gw, q)); }); return Math.round(m); }
function iotEditStart(id){
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  var c = iotOf(id); if (!c){ toast(t('لا خطّةَ حساساتٍ لهذا المخيم')); return false; }
  IOT.on = true; iotLoad();
  IOT.edit = { id:id, gw:[+c.gw[0], +c.gw[1]], sensors:c.sensors.map(function(q){ return [+q[0], +q[1]]; }), sel:null, add:false };
  POP_SITE = ''; POP_OPEN = false;   /* نافذةُ النقطة تُغلَق — وإلا ابتلع إغلاقُها أوّلَ نقرةٍ في لوحة التعديل */
  if (MAP && MAP.getZoom() < 17) MAP.setView([+c.gw[0], +c.gw[1]], 17, { animate:false });
  iotPaint(); render(1); toast(t('اضغط على حساسٍ أو الجيت واي ثم على مكانه الجديد')); return true;
}
function iotMapClick(ll){
  var E = IOT.edit; if (!E) return;
  var p = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)];
  if (E.add){ E.sensors.push(p); E.add = false; E.sel = { k:'s', i:E.sensors.length - 1 }; }
  else if (E.sel){ if (E.sel.k === 'gw') E.gw = p; else E.sensors[E.sel.i] = p; }
  else { toast(t('اختر حساسًا أو الجيت واي أوّلًا')); return; }
  iotPaint(); render(1);
}
function iotDel(){ var E = IOT.edit; if (!E || !E.sel || E.sel.k !== 's') return; E.sensors.splice(E.sel.i, 1); E.sel = null; iotPaint(); render(1); }
function iotSave(){
  var E = IOT.edit; if (!E) return false;
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  if (!E.sensors.length){ toast(t('لا يُحفَظ مخيمٌ بلا حساسات')); return false; }
  var maxM = iotMax(E.gw, E.sensors);
  siteOvSet(E.id, { iot:{ gw:E.gw, sensors:E.sensors, maxM:maxM, at:Date.now(), by:STATE.meta.name || '' } });
  logEvent('تعديلُ حساسات مخيم — ' + E.id + ' \u00b7 ' + nm(E.sensors.length) + ' حساسًا \u00b7 أبعدُها ' + nm(maxM) + ' م', E.id);
  if (maxM > 150){ var cx = 0, cy = 0; E.sensors.forEach(function(q){ cx += q[0]; cy += q[1]; }); cx /= E.sensors.length; cy /= E.sensors.length; toast(t('حُفظت — وحساسٌ أبعدُ من ١٥٠ م عن الجيت واي') + ' (' + nm(maxM) + ' ' + t('م') + ') \u2014 ' + t('انقل الجيت واي نحو مركز الحساسات') + ' (' + nm(iotMax([cx, cy], E.sensors)) + ' ' + t('م') + ')'); }
  else toast(t('حُفظت خطّةُ حساسات المخيم'));
  IOT.edit = null; iotPaint(); render(1); return true;
}
function iotPanelHtml(){
  var E = IOT.edit; if (!E) return '';
  var x = siteFind(E.id), nm0 = x ? (x.name || E.id) : E.id, maxM = iotMax(E.gw, E.sensors);
  var sel = !E.sel ? t('لا شيءَ محدَّد') : (E.sel.k === 'gw' ? t('الجيت واي') : t('حساس') + ' ' + nm(E.sel.i + 1));
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حساسات')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(E.sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + esc(t('أبعدها')) + ' ' + nm(maxM) + ' ' + esc(t('م')) + (maxM > 150 ? ' \u26a0' : '') + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + (E.add ? esc(t('اضغط على الخريطة حيث يُوضَع الحساسُ الجديد')) : esc(t('المحدَّد')) + ': ' + esc(sel) + ' \u2014 ' + esc(t('اضغط على مكانه الجديد'))) + '</p>'
    + '<div class="actions">'
    + btn((E.add ? '\u2716 ' : '+ ') + t('أضف حساسًا'), 'btn-quiet btn-sm', ' data-iotadd="1"')
    + (E.sel && E.sel.k === 's' ? btn('\u{1F5D1} ' + t('احذف المحدد'), 'btn-quiet btn-sm', ' data-iotdel="1"') : '')
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-iotsave="1"')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-iotcancel="1"')
    + '</div></div>';
}
/* ═══ تعديلُ حدود المخيم بسحب الزوايا (V25.9) — قرارُ المالك ═══
   كان تعديلُ الحدود إعادةَ رسمٍ كاملة بأداة «مساحة بنقاط». صار من نافذة المخيم «عدّل الحدود»: زوايا الحدود
   الحالية مقابضُ تُسحَب، ونقطةٌ صغيرةٌ بين كلِّ زاويتين تُضيف زاويةً عندها، والزاويةُ المحدَّدةُ تُحذَف (ثلاثٌ حدًّا
   أدنى)، و«رجوع للحدود الأصلية» يُعيد حدودَ السجل. الحفظُ بصيغة الرسم القائمة نفسِها (poly مسطّحًا في وثيقة
   الموقع أو المضاف) فتصل الأجهزةَ ويقرؤها المحرّكان والثلاثي، ويُسجَّل في الأحداث. للمهندس فما فوق كتعديل البيانات. */
var BED = null, BED_L = null;
function bedArea(P){
  if (!P || P.length < 3) return 0;
  var r = Math.PI / 180, kx = 111320 * Math.cos(P[0][0] * r), ky = 110540, a = 0;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][1] * kx) * (P[i][0] * ky) - (P[i][1] * kx) * (P[j][0] * ky);
  return Math.abs(a / 2);
}
function bedStart(id){
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(id); if (!x || x.type !== 'مخيم'){ toast(t('لا مخيمَ بهذا المعرِّف')); return false; }
  if (!polyOf(x).length && !POLY && typeof polyLoad === 'function'){ polyLoad().then(function(){ if (POLY) bedStart(id); }); return false; }
  var F = campFoot(x); if (!F){ toast(t('لا حدودَ لهذا المخيم — ارسمها بأداة «مساحة بنقاط»')); return false; }
  var P = F.map(function(q){ return [+q[1], +q[0]]; });
  if (P.length > 3 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) P.pop();   /* الحلقةُ المغلقةُ تُفتَح: الزاويةُ الأولى لا تتكرّر */
  BED = { id:id, pts:P, sel:-1, orig:!x.isNew && !!(POLY && POLY[id] && POLY[id].length >= 3), drawn:polyOf(x).length >= 3 };
  POP_SITE = ''; POP_OPEN = false; if (MAP) MAP.closePopup();
  try { if (MAP) MAP.fitBounds(L.latLngBounds(P).pad(0.35), { animate:false, maxZoom:19 }); } catch (e){ LS_ERR = e; }
  bedPaint(); render(1); toast(t('اسحب الزاوية لنقلها، واضغط النقطة الصغيرة بين زاويتين لإضافة زاوية')); return true;
}
function bedPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (BED_L && BED_L._map !== MAP) BED_L = null;
    if (BED_L) BED_L.clearLayers(); else BED_L = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (!BED) return;
  var P = BED.pts, poly = L.polygon(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, fillOpacity:0.18, dashArray:'6 4', interactive:false }).addTo(BED_L);
  P.forEach(function(q, i){
    var mk = L.marker(q, { draggable:true, zIndexOffset:1000, icon:L.divIcon({ className:'bed-v' + (BED.sel === i ? ' on' : ''), iconSize:[22, 22] }) });
    mk.on('drag', function(e){ var ll = e.target.getLatLng(); BED.pts[i] = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; poly.setLatLngs(BED.pts); });
    mk.on('dragend', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.on('click', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.addTo(BED_L);
  });
  for (var k = 0; k < P.length; k++){
    (function(k){
      var a = P[k], b = P[(k + 1) % P.length], mid = [+((a[0] + b[0]) / 2).toFixed(6), +((a[1] + b[1]) / 2).toFixed(6)];
      L.marker(mid, { icon:L.divIcon({ className:'bed-m', iconSize:[14, 14] }) })
        .on('click', function(){ BED.pts.splice(k + 1, 0, mid); BED.sel = k + 1; bedPaint(); render(1); })
        .addTo(BED_L);
    })(k);
  }
}
function bedDel(){ if (!BED || BED.sel < 0 || BED.pts.length <= 3) return; BED.pts.splice(BED.sel, 1); BED.sel = -1; bedPaint(); render(1); }
function bedCommit(x, flat, what){
  var patch = { poly:flat, polyBy:STATE.meta.name || '', polyAt:Date.now() };
  Object.assign(x, patch);
  if (x.isNew) CORE.set('newsites', x.id, x); else siteOvSet(x.id, patch);
  SITE_IX = null; SITE_TOK = null; statBump(); logEvent(what, x.id);
  BED = null; bedPaint(); mapPaint(); render(1);
}
function bedSave(){
  if (!BED) return false;
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  if (BED.pts.length < 3){ toast(t('الحدودُ ثلاثُ زوايا على الأقل')); return false; }
  var flat = []; BED.pts.forEach(function(q){ flat.push(+(+q[0]).toFixed(6), +(+q[1]).toFixed(6)); });
  var n = BED.pts.length;
  bedCommit(x, flat, 'تعديلُ حدود مخيم — ' + x.id + ' \u00b7 ' + nm(n) + ' زاوية');
  toast(t('حُفظت حدودُ المخيم')); return true;
}
function bedReset(){
  if (!BED || !BED.orig) return false;
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  bedCommit(x, [], 'رجوعٌ لحدود المخيم الأصلية — ' + x.id);
  toast(t('عادت حدودُ المخيم الأصلية')); return true;
}
function bedPanelHtml(){
  if (!BED) return '';
  var x = siteFind(BED.id), nm0 = x ? (x.name || BED.id) : BED.id;
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حدود')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(BED.pts.length) + ' ' + esc(t('زاوية')) + ' \u00b7 ' + nm(Math.round(bedArea(BED.pts))) + ' ' + esc(t('م²')) + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t(BED.sel >= 0 ? 'الزاويةُ المحدَّدة بالأحمر — اسحبها أو احذفها' : 'اسحب الزاوية لنقلها، واضغط النقطة الصغيرة بين زاويتين لإضافة زاوية')) + '</p>'
    + '<div class="actions">'
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-bedsave="1"')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-bedcancel="1"')
    + (BED.sel >= 0 && BED.pts.length > 3 ? btn('\u{1F5D1} ' + t('احذف الزاوية'), 'btn-quiet btn-sm', ' data-beddel="1"') : '')
    + (BED.orig && BED.drawn ? btn('\u21BA ' + t('رجوع للحدود الأصلية'), 'btn-quiet btn-sm', ' data-bedreset="1"') : '')
    + '</div></div>';
}
/* صنفُ «القمر» على الإطار يتبع ما يُعرَض فعلًا: القمرُ لا يُقلَب في الوضع الداكن، وخريطةُ الجهاز تُقلَب ولو كان القمرُ مختارًا */
/* ═══ (V28.9) خطوطُ التقارير — «Abar Mid» ═══
   قرارُ المالك: «دي الخطوط اللي يتكتب بيها التقرير». الباوربوينت يضمّنها من قالب الوزارة نفسِه. والـPDF يطبعه المتصفّح
   فيحتاج الخطَّ نفسَه: يرفعه المديرُ مرةً (العاديَّ والعريض) فيُحفَظ في وثيقة الإعدادات «fonts» — لا في المستودع العامّ لأن
   الخطَّ مرخَّص — ويُقرأ عند الطباعة وحدَها، فيُضمَّن في الـPDF ويُقرأ على أيِّ جهاز. */
var FONTS_MAX = 450 * 1024;
function fontsCard(){
  var F = CFG.fonts || {}, ed = may('settings');
  var st = function(k, l){ return '<span class="pill ' + (F[k] ? 'ok' : 'wrn') + '">' + (F[k] ? '\u2713 ' : '') + esc(t(l)) + (F[k + 'n'] ? ' \u00b7 ' + esc(F[k + 'n']) : '') + '</span>'; };
  return card('\u{1F524} ' + t('خطوط التقارير'),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('خطُّ الوزارة «Abar Mid» للـPDF: ارفع ملفَّي العاديّ والعريض مرةً واحدة فيُضمَّنان في كلِّ تقريرٍ مطبوع. الباوربوينت يضمّنه من قالب الوزارة نفسِه.')) + '</p>'
    + '<div class="chips" style="margin:0 0 8px">' + st('r', 'العادي') + ' ' + st('b', 'العريض') + '</div>'
    + (ed ? '<div class="grid cols-2"><div class="field"><label>' + esc(t('العادي (Regular)')) + '</label><input type="file" accept=".otf,.ttf,.woff,.woff2" data-fontup="r"></div>'
          + '<div class="field"><label>' + esc(t('العريض (Bold)')) + '</label><input type="file" accept=".otf,.ttf,.woff,.woff2" data-fontup="b"></div></div>' : ''));
}
function fontMime(n){ n = String(n || '').toLowerCase(); return /\.woff2$/.test(n) ? ['font/woff2', 'woff2'] : /\.woff$/.test(n) ? ['font/woff', 'woff'] : /\.ttf$/.test(n) ? ['font/ttf', 'truetype'] : ['font/otf', 'opentype']; }
function fontUp(kind, file){
  if (!may('settings')){ toast(t('الإعداداتُ للمهندس فما فوق')); return; }
  if (!file || file.size > FONTS_MAX){ toast(t('ملفُّ الخط كبير — الحدُّ ٤٥٠ ك.ب')); return; }
  var fr = new FileReader();
  fr.onload = function(){ var b64 = String(fr.result || '').split(',')[1] || ''; if (!b64){ toast(t('تعذّرت قراءةُ الملف')); return; }
    var v = Object.assign({}, CFG.fonts || {}); v[kind] = b64; v[kind + 'n'] = file.name; v.at = Date.now(); v.by = STATE.meta.name || '';
    CFG.fonts = v; CORE.set('cfg', 'fonts', v); logEvent('خطُّ التقارير — ' + (kind === 'b' ? 'العريض' : 'العادي') + ' · ' + file.name, ''); toast(t('حُفظ الخط — يُضمَّن في الـPDF')); render(1); };
  fr.readAsDataURL(file);
}
function fontsLoad(){
  if (CFG.fonts && CFG.fonts.r) return Promise.resolve(CFG.fonts);
  if (!(typeof FB === 'object' && FB.db && FB.db.collection)) return Promise.resolve(null);
  return Promise.race([
    DB.col('settings').doc('fonts').get().then(function(d){ if (d && d.exists){ CFG.fonts = Object.assign({}, d.data()); } return CFG.fonts || null; }),
    new Promise(function(res){ setTimeout(function(){ res(null); }, 3500); })
  ]).catch(function(){ return null; });
}
function fontsFace(F){
  if (!F || !F.r) return '';
  var face = function(b64, name, w){ var m = fontMime(name); return '@font-face{font-family:"Abar Mid";font-weight:' + w + ';src:url(data:' + m[0] + ';base64,' + b64 + ') format("' + m[1] + '")}'; };
  return face(F.r, F.rn, 400) + (F.b ? face(F.b, F.bn, 700) : '');
}
function gmapsCard(){
  var k = gmapsKey(), ed = may('settings');
  return card('\u{1F5FA} ' + t('خرائط جوجل'),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('بمفتاحٍ من منصة خرائط جوجل تُعرَض خرائطُ جوجل (شوارعُ وقمرٌ هجين بأسمائه) تحت نقاطنا على كلِّ الأجهزة على اتصال؛ وبلا شبكةٍ خريطةُ الجهاز كما هي. قيِّد المفتاحَ بنطاق التطبيق فقط.')) + '</p>'
    + (ed ? '<div class="wt-row" style="gap:8px;align-items:center;flex-wrap:wrap"><input id="gmKey" dir="ltr" placeholder="AIza…" value="' + esc(k) + '" style="min-width:260px;max-width:420px">' + btn(t('احفظ المفتاح'), 'btn-primary btn-sm', ' data-gmsave="1"') + (k ? btn('\u2715 ' + t('أزل المفتاح'), 'btn-quiet btn-sm', ' data-gmclear="1"') : '') + '</div>'
         : '<p class="hint">' + esc(k ? t('مفتاحٌ مضبوط') : t('لا مفتاح — تُستعمل الخريطةُ المفتوحة')) + '</p>')
    + '<p class="hint" style="margin:8px 0 0">' + esc(t(k ? (GMAP.fail ? 'تعذّر تحميلُ خرائط جوجل بهذا المفتاح — تُستعمل الخريطةُ المفتوحة حتى يُصحَّح' : 'الحالة: مضبوط') : 'الحالة: الخريطةُ المفتوحة (شوارعُ المصدر المفتوح وقمرُ إسري)')) + '</p>');
}
function basemapSatCls(){
  var el = document.getElementById('mapBox');
  if (el) el.classList.toggle('sat', !!(MAP_SAT && !(BASEMAP.layer && MAP && MAP.hasLayer(BASEMAP.layer))));
}
if (typeof window === 'object' && window.addEventListener){
  window.addEventListener('offline', function(){ try { basemapSwap(); } catch (e){ LS_ERR = e; } });
  window.addEventListener('online', function(){ BASEMAP.netDown = false; try { basemapSwap(); } catch (e){ LS_ERR = e; } });
}
/* (V24.9) الإقلاعُ أوّلًا: الخريطةُ تُنشأ في الإقلاع خلف شاشة الدخول، وكان إرفاقُ خريطة الجهاز (قراءةُ الملف
   وتحميلُ العارض ورسمُ البلاطات) وتنزيلُها يجريان معه فأبطآه على المعالج الضعيف والشبكة البطيئة. فصار ذلك
   بعد الدخول، والخريطةُ ظاهرة، والصفحةُ خاملة — ويُعاد الطلبُ مع كلِّ فتحٍ للخريطة حتى يتمّ. */
function basemapKick(){
  if (BASEMAP.kick || !MAP || CUR !== 'map' || document.getElementById('login')) return;
  if (BASEMAP.auto && (BASEMAP.layer || !basemapWant())) return;   /* (V25.0) لا شيءَ يُطلَب: نُزِّلت أو الشبكةُ حاضرة */
  BASEMAP.kick = setTimeout(function(){
    var run = function(){
      BASEMAP.kick = null;
      if (!MAP || CUR !== 'map' || document.getElementById('login')) return;
      try { if (!BASEMAP.auto) basemapAuto(); else if (basemapWant() && !BASEMAP.layer) basemapAttach(); } catch (e){ LS_ERR = e; }
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout:2000 }); else run();
  }, 800);
}
/* التنزيلُ التلقائيُّ على اتصالٍ جيدٍ فقط: على شبكةٍ مزدحمةٍ يزاحم رفعَ بيانات الميدان — ويبقى زرُّ «نزّل» في «حسابي» */
function basemapNetOk(){
  var c = (typeof navigator === 'object' && navigator.connection) || {};
  if (c.saveData) return false;
  return !/2g$|^3g$/.test(String(c.effectiveType || ''));
}
function basemapDownload(){
  if (BASEMAP.loading) return Promise.resolve(false);
  BASEMAP.loading = true; render(1);
  return fetch(BASEMAP_FILE, { cache:'no-store', priority:'low' }).then(function(r){
    if (!r.ok) throw new Error('no-file');
    return r.blob();
  }).then(function(b){
    if (b.size > BASEMAP_MAX) throw new Error('too-big');
    return caches.open(BASEMAP_CACHE).then(function(c){ return c.put(BASEMAP_FILE, new Response(b, { headers:{ 'content-type':'application/octet-stream', 'content-length':String(b.size) } })); }).then(basemapWarm).then(function(){ BASEMAP.have = true; BASEMAP.loading = false; toast(t('نُزِّلت خريطةُ المشاعر — تعمل الآن بلا شبكة')); logEvent('خريطةُ المشاعر نُزِّلت — ' + Math.round(b.size / 1048576) + ' م.ب'); render(1); try { basemapAttach(); } catch (e){ LS_ERR = e; } return true; });
  }).catch(function(e){ BASEMAP.loading = false; toast(t(String(e && e.message) === 'no-file' ? 'لم تُبنَ خريطةُ المشاعر بعد — انظر docs/maps' : 'تعذّر تنزيلُ الخريطة')); render(1); return false; });
}
function basemapRemove(){
  return caches.open(BASEMAP_CACHE).then(function(c){ return Promise.all([BASEMAP_FILE].concat(BASEMAP_JS).map(function(u){ return c.delete(u); })); }).then(function(){ BASEMAP.have = false; if (BASEMAP.layer && MAP){ try { MAP.removeLayer(BASEMAP.layer); } catch (e){ LS_ERR = e; } BASEMAP.layer = null; } BASEMAP.arc = null; basemapSwap(); toast(t('أُزيلت خريطةُ المشاعر من الجهاز')); render(1); });
}
function basemapScripts(){
  if (window.protomapsL && window.pmtiles) return Promise.resolve(true);
  var one = function(src){ return new Promise(function(res){ var sc = document.createElement('script'); sc.src = src; sc.onload = function(){ res(true); }; sc.onerror = function(){ res(false); }; document.head.appendChild(sc); }); };
  return one('vendor/protomaps/pmtiles-4.5.0.js').then(function(ok){ return ok ? one('vendor/protomaps/protomaps-leaflet-5.1.0.js') : false; });
}
/* يُلحَق بالخريطة حين يوجد الملفُّ: قاعدةٌ بلا شبكة فوق الفاتحة، والقمرُ الصناعيُّ كما هو.
   (V24.9) الملفُّ يُقرأ مقاطعَ من الذاكرة (FileSource): رابطُ Blob لا يحمل امتدادَ الملف فكانت
   المكتبةُ تعدّه عنوانَ بلاطاتٍ وتقرأ الأرشيفَ كلَّه بلاطةً واحدةً فيتعطّل الرسم. ونداءا الفتح
   والتنزيلِ التلقائي يشتركان في وعدٍ واحدٍ فلا تُلحَق طبقتان. */
function basemapAttach(){
  if (!MAP || BASEMAP.layer || !basemapWant()) return Promise.resolve(false);
  if (BASEMAP.busy) return BASEMAP.busy.then(function(){ return basemapAttach(); });   /* نداءٌ في أثناء آخر يُعاد بعده: لا طبقتان، ولا جوابٌ قديمٌ «لا ملف» يسبق التنزيل */
  BASEMAP.busy = basemapHave().then(function(has){
    if (!has) return false;
    return basemapScripts().then(function(ok){
      if (!ok || !window.protomapsL || !window.pmtiles) return false;
      return caches.open(BASEMAP_CACHE).then(function(c){ return c.match(BASEMAP_FILE); }).then(function(r){
        if (!r){ BASEMAP.have = false; if (!BASEMAP.redl){ BASEMAP.redl = true; basemapDownload(); } return null; }   /* مُسِح بين الفحص والقراءة: يُعاد مرةً */
        return r.blob();
      }).then(function(b){
        if (!b || !MAP || BASEMAP.layer || !basemapWant()) return false;
        BASEMAP.arc = new pmtiles.PMTiles(new pmtiles.FileSource(new File([b], 'mashaer.pmtiles')));
        return BASEMAP.arc.getHeader().then(function(h){
        if (!MAP || BASEMAP.layer || !basemapWant()) return false;
        /* (V25.0) تُرسَم داخل نطاق الملف وحدَه (ترويستُه تعمل بلا شبكة) — كانت خارجه بلاطاتٌ فارغةٌ بخطوطٍ وأسماءٌ طافية */
        var bb = (h && h.maxLon > h.minLon && h.maxLat > h.minLat && h.maxLon - h.minLon < 300) ? [[h.minLat, h.minLon], [h.maxLat, h.maxLon]] : undefined;
        BASEMAP.layer = protomapsL.leafletLayer({ url:BASEMAP.arc, flavor:'light', lang:'ar', maxDataZoom:15, className:'nskBase', bounds:bb, attribution:'\u00a9 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' });
        BASEMAP.layer.addTo(MAP);
        basemapSwap();
        return true;
        });
      });
    });
  }).catch(function(e){ softErr('basemap', e, ''); return false; }).then(function(v){ BASEMAP.busy = null; return v; });
  return BASEMAP.busy;
}
/* (V24.9) طبقةُ أساسٍ واحدةٌ تحت النقاط، و(V25.0) خريطةُ الجهاز حين تُطلَب وحدَه (basemapWant):
   مع الشبكة البلاطُ الشبكيُّ (الفاتحةُ أو القمر) وتُترَك خريطةُ الجهاز من الذاكرة، وعند الانقطاع هي وحدَها. */
/* ═══ (V27.6) خريطةٌ هجينة: أسماءُ الشوارع والأماكن فوق القمر الصناعي ═══
   بلاغُ المالك: الهجينةُ (V27.5 من خريطة الجهاز) أفقرُ كثيرًا من خريطة الشوارع في الأسماء عند التكبير المتوسط، لأن بلاطَ الجهاز
   يُعمِّم الطرقَ الصغيرة. فصارت الأسماءُ من ملف maps/mashaer-names.json (كلُّ طريقٍ له اسم، والأحياءُ والقرى والجبالُ والمعالم،
   بالعربية، من بيانات الخرائط المفتوحة — ODbL) تُرسَم على لوحٍ فوق البلاط: بحسب التكبير (الرئيسيةُ أوّلًا ثم كلُّ الشوارع)،
   على امتداد الشارع، بهالةٍ بيضاء، وبلا تداخل. تُركَّب مع القمر على اتصال، وتُرفَع مع خريطة الشوارع (لها أسماؤها) ومع خريطة
   الجهاز بلا شبكة. يُخزَّن الملفُّ في مخزن الخريطة فيعمل لاحقًا بلا شبكة. */
var NAMES = { data:null, busy:false, layer:null, ok:true };
var NAMES_FILE = 'maps/mashaer-names.json', NAMES_REGION = 'maps/region-names.json';   /* (V27.8) الإقليمُ للتكبير البعيد */
var NAMES_RANK = { motorway:1, trunk:1, primary:2, secondary:3, tertiary:4, unclassified:5, residential:5, pedestrian:5, living_street:5, service:6, footway:6, path:6, track:6, steps:7 };
var NAMES_PLACE = { city:0, town:1, airport:1, suburb:2, village:2, peak:3, quarter:3, neighbourhood:4, hamlet:4, locality:5, station:6, hospital:6, mosque:6, place_of_worship:6, police:6, bus_station:6 };
function namesFetch(file){
  var fromCache = (typeof caches === 'object' && caches.open) ? caches.open(BASEMAP_CACHE).then(function(c){ return c.match(file); }).catch(function(){ return null; }) : Promise.resolve(null);
  return fromCache.then(function(r){
    if (r) return r.json();
    return fetch(file, { cache:'no-store' }).then(function(res){
      if (!res.ok) throw new Error('names ' + res.status);
      var copy = res.clone();
      if (typeof caches === 'object' && caches.open) caches.open(BASEMAP_CACHE).then(function(c){ return c.put(file, copy); }).catch(function(){});
      return res.json();
    });
  }).catch(function(){ return null; });
}
function namesLoad(){
  if (NAMES.data || NAMES.busy || !NAMES.ok) return;
  NAMES.busy = true;
  Promise.all([namesFetch(NAMES_FILE), namesFetch(NAMES_REGION)]).then(function(a){
    var loc = a[0], reg = a[1];
    if (!loc && !reg){ NAMES.ok = false; return; }
    /* الإقليميُّ يُعلَّم ليُرسَم في التكبير البعيد ويُخفى داخل المشاعر عند الاقتراب (فالمحلّيُّ أدقّ) */
    var lines = (loc && loc.lines ? loc.lines : []).map(function(l){ return [l[0], l[1], l[2], '', 0]; })
      .concat(reg && reg.lines ? reg.lines.map(function(l){ return [l[0], l[1], l[2], l[3] || '', 1]; }) : []);
    var points = (loc && loc.points ? loc.points : []).map(function(q){ return [q[0], q[1], q[2], q[3], 0]; })
      .concat(reg && reg.points ? reg.points.map(function(q){ return [q[0], q[1], q[2], q[3], 1]; }) : []);
    NAMES.data = { lines:lines, points:points, bbox:(loc && loc.bbox) || [21.30, 39.78, 21.50, 40.02] };
    if (NAMES.layer) NAMES.layer.redraw();
  }).catch(function(e){ NAMES.ok = false; softErr('names', e, ''); }).then(function(){ NAMES.busy = false; });
}
function namesLayerClass(){   /* ليفلت يُحمَّل بعد هذا الملف — فالصنفُ يُبنى عند أوّل حاجة */
  if (NAMES.cls) return NAMES.cls; if (typeof L !== 'object' || !L.Layer) return null;
  NAMES.cls = L.Layer.extend({
  onAdd:function(map){
    this._map = map;
    /* في لوح النقاط نفسِه (overlayPane) وأوّلَ أبنائه: فوق البلاط وتحت النقاط والحدود — طبقاتُ ليفلت هنا كلُّها بترتيبٍ واحد فلا يُعتمَد على zIndex */
    var c = this._cv = document.createElement('canvas'); c.className = 'nskNamesCv'; c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; c.style.pointerEvents = 'none';
    var pane = map.getPane('overlayPane'); if (pane.firstChild) pane.insertBefore(c, pane.firstChild); else pane.appendChild(c);
    map.on('moveend zoomend resize', this.redraw, this); map.on('zoomstart', this._hide, this);
    this.redraw(); namesLoad();
  },
  onRemove:function(map){ map.off('moveend zoomend resize', this.redraw, this); map.off('zoomstart', this._hide, this); if (this._cv && this._cv.parentNode) this._cv.parentNode.removeChild(this._cv); this._cv = null; },
  _hide:function(){ if (this._cv) this._cv.style.visibility = 'hidden'; },
  redraw:function(){
    var map = this._map, c = this._cv; if (!map || !c) return;
    var sz = map.getSize(), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(sz.x * dpr); c.height = Math.round(sz.y * dpr); c.style.width = sz.x + 'px'; c.style.height = sz.y + 'px';
    var tl = map.containerPointToLayerPoint([0, 0]); L.DomUtil.setPosition(c, tl); c.style.visibility = '';
    var ctx = c.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, sz.x, sz.y);
    var D = NAMES.data; if (!D) return;
    var z = map.getZoom(), b = map.getBounds().pad(0.05), occ = {}, cell = 14;
    var free = function(x, y, w, h){ var x0 = Math.floor((x - w / 2) / cell), x1 = Math.floor((x + w / 2) / cell), y0 = Math.floor((y - h / 2) / cell), y1 = Math.floor((y + h / 2) / cell), i, j;
      for (i = x0; i <= x1; i++) for (j = y0; j <= y1; j++) if (occ[i + ',' + j]) return false;
      for (i = x0; i <= x1; i++) for (j = y0; j <= y1; j++) occ[i + ',' + j] = 1; return true; };
    var maxRank = z >= 16 ? 7 : z >= 15 ? 6 : z >= 14 ? 5 : z >= 13 ? 4 : z >= 12 ? 3 : z >= 10 ? 2 : 1;
    var maxPlace = z >= 14 ? 6 : z >= 12 ? 4 : z >= 11 ? 3 : z >= 10 ? 2 : z >= 8 ? 1 : 0;
    var inLoc = function(la, lo){ var bx = D.bbox; return la >= bx[0] && la <= bx[2] && lo >= bx[1] && lo <= bx[3]; };
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    /* الأماكنُ أوّلًا (أكبرُ وأهمّ)، ثم الطرقُ بترتيب أهميتها */
    var pts = D.points || [], k, p, pr, px, f;
    for (k = 0; k < pts.length; k++){ p = pts[k]; pr = NAMES_PLACE[p[1]]; if (pr == null) pr = 6; if (pr > maxPlace) continue;   /* المدينةُ رتبتُها صفرٌ — لا تسقط بـ|| */ if (!b.contains([p[2], p[3]])) continue;
      if (p[4] === 1 && z >= 13 && inLoc(p[2], p[3])) continue;   /* الإقليميُّ داخل المشاعر عند الاقتراب: المحلّيُّ يكفي */
      px = map.latLngToContainerPoint([p[2], p[3]]); f = pr === 0 ? 17 : pr <= 1 ? 15 : pr <= 3 ? 13 : 12; ctx.font = 'bold ' + f + 'px system-ui, sans-serif';
      var w = ctx.measureText(p[0]).width + 8; if (!free(px.x, px.y, w, f + 6)) continue;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeText(p[0], px.x, px.y); ctx.fillStyle = pr <= 3 ? '#1a1a1a' : '#2b2b2b'; ctx.fillText(p[0], px.x, px.y); }
    var lines = D.lines, order = lines.map(function(l, i){ return [NAMES_RANK[l[1]] || 6, i]; }).filter(function(o){ var l = lines[o[1]]; if (l[4] === 1){ if (z >= 14) return false; return o[0] <= maxRank; } return z >= 12 && o[0] <= maxRank; }).sort(function(a, b2){ return a[0] - b2[0]; });
    ctx.font = 'bold 12px system-ui, sans-serif';
    for (k = 0; k < order.length; k++){ var ln = lines[order[k][1]], g = ln[2], i, pts2 = [], tot = 0;
      if (ln[4] === 1 && z >= 13 && g.length && inLoc(g[0][0], g[0][1])) continue;
      /* (V27.8) درعُ رقم الطريق للإقليم، والاسمُ معه إن اتّسع */
      var isReg = ln[4] === 1, lab = (isReg && ln[3] && (z < 12 || !ln[0])) ? ln[3] : ln[0]; if (!lab) continue;
      /* الجزءُ الظاهرُ من الشارع بطوله كلِّه (لا قطعةً واحدة — شوارعُ منى مقطّعةٌ قطعًا قصيرة)، والاسمُ في منتصفه بميل قطعته */
      for (i = 0; i < g.length; i++){ if (!b.contains(g[i])) { if (pts2.length) break; continue; } pts2.push(map.latLngToContainerPoint(g[i])); }
      if (pts2.length < 2) continue;
      for (i = 1; i < pts2.length; i++) tot += Math.sqrt(Math.pow(pts2[i].x - pts2[i - 1].x, 2) + Math.pow(pts2[i].y - pts2[i - 1].y, 2));
      ctx.font = (isReg && lab === ln[3]) ? 'bold 11px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
      var tw = ctx.measureText(lab).width; if (tot < tw + 10 && !(isReg && lab === ln[3] && tot > 30)) continue;
      var half = tot / 2, acc = 0, seg = null; for (i = 1; i < pts2.length; i++){ var sl = Math.sqrt(Math.pow(pts2[i].x - pts2[i - 1].x, 2) + Math.pow(pts2[i].y - pts2[i - 1].y, 2)); if (acc + sl >= half){ var tt = sl ? (half - acc) / sl : 0; seg = [pts2[i - 1], pts2[i], pts2[i - 1].x + (pts2[i].x - pts2[i - 1].x) * tt, pts2[i - 1].y + (pts2[i].y - pts2[i - 1].y) * tt]; break; } acc += sl; }
      if (!seg) continue;
      var mx = seg[2], my = seg[3], ang = Math.atan2(seg[1].y - seg[0].y, seg[1].x - seg[0].x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      if (!free(mx, my, Math.abs(Math.cos(ang)) * tw + 14, Math.abs(Math.sin(ang)) * tw + 14)) continue;
      if (isReg && lab === ln[3]){   /* درعٌ: مستطيلٌ أبيضُ بحافةٍ وَرقمُ الطريق */
        if (!free(mx, my, tw + 16, 20)) continue;
        ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8c2d2d'; ctx.lineWidth = 1.5; var rw = tw + 12, rh = 17; ctx.beginPath(); ctx.rect(mx - rw / 2, my - rh / 2, rw, rh); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8c2d2d'; ctx.fillText(lab, mx, my + 0.5); ctx.restore(); continue; }
      ctx.save(); ctx.translate(mx, my); ctx.rotate(ang); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(lab, 0, 0); ctx.fillStyle = order[k][0] <= 2 ? '#1f2d3d' : '#333'; ctx.fillText(lab, 0, 0); ctx.restore(); }
  }
  }); return NAMES.cls;
}
function basemapLabelsSync(){
  var C = namesLayerClass(); if (!MAP || !C) return;
  var want = !basemapWant() && !!MAP_SAT;
  try {
    if (!want){ if (NAMES.layer && MAP.hasLayer(NAMES.layer)) MAP.removeLayer(NAMES.layer); return; }
    if (!NAMES.layer) NAMES.layer = new C();
    if (!MAP.hasLayer(NAMES.layer)) NAMES.layer.addTo(MAP);
  } catch (e){ LS_ERR = e; }
}
/* ═══ (V27.6) خرائطُ جوجل داخل خريطتنا ═══
   قرارُ المالك: «خريطة سهلة وفيها كل التفاصيل زي جوجل». تُعرَض خرائطُ جوجل (شوارعُ أو قمرٌ هجين بأسمائه) أساسًا تحت نقاطنا
   وحدودنا ومساراتنا كما هي — عبر واجهة جوجل الرسمية وإضافة ليفلت الرسمية لها (GoogleMutant)، بمفتاحٍ يضعه المدير في
   ثوابت النظام فيصل الأجهزةَ كلَّها. على اتصالٍ فقط؛ وبلا شبكةٍ خريطةُ الجهاز كما كانت، وإن فشل المفتاحُ أو التحميلُ عاد
   الأساسُ المفتوح (شوارع/قمر) بلا أثر. التكلفةُ ضمن الحصة المجانية الشهرية لحجم استعمالنا. */
var GMAP = { lib:null, api:null, fail:false, layer:null, kind:'' };
function gmapsKey(){ return (CFG.gmaps && typeof CFG.gmaps.key === 'string') ? CFG.gmaps.key.trim() : ''; }
function gmapsWant(){ return !!gmapsKey() && !GMAP.fail && !basemapWant(); }
function gmapsScript(src, test, ms){
  return new Promise(function(res){
    if (test()) return res(true);
    var el = document.createElement('script'), done = false, tm = setTimeout(function(){ if (!done){ done = true; res(false); } }, ms || 12000);
    el.src = src; el.async = true;
    el.onload = function(){ if (!done){ done = true; clearTimeout(tm); res(test()); } };
    el.onerror = function(){ if (!done){ done = true; clearTimeout(tm); res(false); } };
    document.head.appendChild(el);
  });
}
function gmapsLoad(){
  if (GMAP.api) return GMAP.api;
  var key = gmapsKey(); if (!key) return Promise.resolve(false);
  GMAP.api = gmapsScript('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&language=ar&region=SA&v=weekly&loading=async', function(){ return !!(window.google && window.google.maps); }, 15000)
    .then(function(ok){ if (!ok) return false; return gmapsScript('vendor/google/leaflet-googlemutant-0.16.0.js', function(){ return !!(window.L && L.gridLayer && L.gridLayer.googleMutant); }, 12000); })
    .then(function(ok){ if (!ok){ GMAP.fail = true; GMAP.api = null; } return ok; });
  return GMAP.api;
}
function gmapsSync(){
  if (!MAP || !MAP_BASE) return;
  var want = gmapsWant();
  if (!want){ if (GMAP.layer){ try { if (MAP.hasLayer(GMAP.layer)) MAP.removeLayer(GMAP.layer); } catch (e){} GMAP.layer = null; GMAP.kind = ''; if (!basemapWant() && !MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP); } return; }
  var kind = MAP_SAT ? 'hybrid' : 'roadmap';
  if (GMAP.layer && GMAP.kind === kind){ if (!MAP.hasLayer(GMAP.layer)) GMAP.layer.addTo(MAP); if (MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE); return; }
  gmapsLoad().then(function(ok){
    if (!ok || !MAP){ basemapSatCls(); return; }
    if (!gmapsWant()) return;
    try {
      if (GMAP.layer && MAP.hasLayer(GMAP.layer)) MAP.removeLayer(GMAP.layer);
      GMAP.kind = MAP_SAT ? 'hybrid' : 'roadmap';
      GMAP.layer = L.gridLayer.googleMutant({ type:GMAP.kind, maxZoom:21, className: GMAP.kind === 'roadmap' ? 'nskBase' : 'nskGsat' });
      GMAP.layer.addTo(MAP); if (MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE);
      if (NAMES.layer && MAP.hasLayer(NAMES.layer)) MAP.removeLayer(NAMES.layer);   /* لجوجل أسماؤها */
      logEvent('خرائطُ جوجل — ' + GMAP.kind, '');
    } catch (e){ GMAP.fail = true; GMAP.layer = null; if (!MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP); softErr('gmaps', e, ''); }
    basemapSatCls();
  });
}
function basemapSwap(){
  if (!MAP || !MAP_BASE) return;
  var want = basemapWant();
  try {
    if (want && BASEMAP.layer){ if (MAP.hasLayer(MAP_BASE)) MAP.removeLayer(MAP_BASE); if (!MAP.hasLayer(BASEMAP.layer)) BASEMAP.layer.addTo(MAP); }
    else {
      if (BASEMAP.layer){ if (MAP.hasLayer(BASEMAP.layer)) MAP.removeLayer(BASEMAP.layer); BASEMAP.layer = null; BASEMAP.arc = null; }
      if (!MAP.hasLayer(MAP_BASE)) MAP_BASE.addTo(MAP);
    }
  } catch (e){ LS_ERR = e; }
  basemapSatCls();
  if (want && !BASEMAP.layer && BASEMAP.have !== false) basemapAttach();
  gmapsSync();   /* (V27.6) جوجل أوّلًا إن كان لها مفتاح */
  if (!gmapsWant()) basemapLabelsSync();   /* (V27.5) أسماؤنا فوق القمر المفتوح فقط */
}
/* بطاقاتُ الجهاز — خريطةُ المشاعر ووضعُ الشمس والتشخيص — تظهر في «حسابي» لكلِّ
   الأدوار (الفنيُّ لا يرى الأدوات) وفي الأدوات للمشرف (V18.0) */
function deviceCards(){
  return notifSettingsCard() + basemapCard()
    + card('وضعُ الشمس',
        '<div class="actions">' + btn((SUN_ON ? '\u2713 ' : '') + t(SUN_ON ? 'وضعُ الشمس يعمل — أطفئه' : 'شغّل وضعَ الشمس'), SUN_ON ? 'btn-quiet' : 'btn-secondary', ' data-sun="1"')
        + '<span class="hint" style="margin:0">' + esc(t('تباينٌ أعلى وخطٌّ أكبرُ وأزرارٌ أكبرُ للعمل تحت الشمس — لهذا الجهاز وحدَه')) + '</span></div>')
    + card('التشخيص',
        '<div class="actions">' + btn('\u{1F4CB} ' + t('نسخ التشخيص'),'btn-secondary',' data-boxcopy="1"')
        + '<span class="hint" style="margin:0">' + esc(t('آخر مئة حدثٍ على هذا الجهاز بلا أسماءٍ ولا نصوص — يُرسَل للمهندس حين لا تصل الشبكة')) + '</span></div>');
}
function basemapCard(){
  basemapManifest(); if (BASEMAP.have === null) basemapHave();
  var mb = BASEMAP.manifest && BASEMAP.manifest.bytes ? Math.round(BASEMAP.manifest.bytes / 1048576) : 0;
  var built = !!(BASEMAP.manifest && BASEMAP.manifest.bytes);
  return card('خريطةُ المشاعر بلا شبكة',
    '<p class="hint" style="margin-top:0">' + esc(t('شوارع مكة والمدينة وطريق الهجرة ومبانيها وأسماؤها تحفظ على جهازك، فتظهر الخريطة تلقائيا عند انقطاع الشبكة. تنزل مرة واحدة تلقائيا عند فتح الخريطة إذا كان الاتصال جيدا، ويمكن تنزيلها من هنا، ويفضل ذلك على واي فاي.')) + '</p>'
    + '<div class="actions">'
    + (BASEMAP.have
        ? pill('\u2713 ' + t('محفوظةٌ على الجهاز'), 'ok') + btn(t('أزلها من الجهاز'), 'btn-quiet btn-sm', ' data-basemaprm="1"')
        : (built
            ? btn((BASEMAP.loading ? '\u23F3 ' : '\u2B07 ') + t('نزّل خريطةَ المشاعر') + ' \u2014 ' + nm(mb) + ' ' + t('ميجا'), 'btn-primary', ' data-basemapdl="1"' + (BASEMAP.loading ? ' disabled' : ''))
            : pill(t('لم تُبنَ الخريطةُ لهذا الموسم بعد'), 'wrn')))
    + '</div>');
}
function kmzExport(kind){
  var f = null, title = 'أفاقي — قارئات RFID ١٤٤٨هـ', name = 'nusuk.kmz';
  if (kind === 'main'){
    f = function(x){ return x.zone === 'منى' || x.zone === 'عرفات'; };
    title = 'أفاقي — منى وعرفات · ١٤٤٨هـ'; name = 'nusuk-mina-arafat.kmz';
  } else if (kind === 'co'){
    f = function(x){ return !CO_SEL.length || CO_SEL.indexOf(x.co) > -1; };
    title = 'أفاقي — بلون الشركة'; name = 'nusuk-companies.kmz';
  } else if (kind === 'redo'){
    f = function(x){ return x.work === 'إعادة تركيب ١٤٤٧'; };
    title = 'أفاقي — إعادة تركيب ١٤٤٧'; name = 'nusuk-redo-1447.kmz';
  } else if (kind === 'sel'){
    f = function(x){ return SEL_IDS.indexOf(x.id) > -1; };
    title = 'أفاقي — المحدَّد'; name = 'nusuk-selected.kmz';
  }
  var b = kmzBuild(f, title);
  if (!b.count){ toast('لا نقاط في هذا التحديد'); return false; }
  var zip = zipStore('doc.kml', new TextEncoder().encode(b.xml));
  var ok = dl(new Blob([zip], { type:'application/vnd.google-earth.kmz' }), name);
  toast(ok ? (nm(b.count) + ' ' + t('نقطةً في الملف')) : 'تعذّر التنزيل');
  return ok;
}

var SEL_IDS = [];

/* ── الاستيراد — قالبٌ يُنزَّل ثم يُرفع فيُعايَن قبل الحفظ ── */
var IMP_COLS = {
  sites: ['المعرّف','المشعر','النوع','الشاخص','المربع','الشركة','خط العرض','خط الطول'],
  ips:   ['معرّف الموقع','بادئة الشبكة','الراوتر','القارئ','الكاميرا'],
  users: ['المعرّف','الاسم','الدور','الحالة'],
  fleet: ['رقم اللوحة','النوع','الموديل','انتهاء الرخصة','الملكية','التكلفة الشهرية'],
  co:    ['اسم الشركة','مواقعها','المنسّق','الجوال'],
  items: ['المنطقة','اسم القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر'],
  stock: ['الصنف','الكمية','المورّد','التاريخ','رقم الفاتورة'],
  buys:  ['التاريخ','الصنف','الفئة','المشعر','الكمية','سعر الوحدة','المورّد']
};

function impTemplate(kind){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast('تعذّر تحميل محرّك إكسل'); return false; }
    var cols = IMP_COLS[kind] || [];
    var rows = [cols];
    /* صفٌّ نموذجيٌّ من بياناتٍ حقيقيةٍ يُحتذى */
    if (kind === 'sites' && STATE.sites.length){
      var x = STATE.sites[0];
      rows.push([x.id, x.zone, x.type, x.sign, x.sq, x.co, x.lat, x.lng]);
    } else if (kind === 'items' && DATA.items.length){
      var i = DATA.items[0];
      rows.push([i[0]==='cor'?'ممر':'مخيم', i[2], itPts(i[1]), itPrep(i[1]), itAsm(i[1]), itPrice(i[1])]);
    } else if (kind === 'ips' && STATE.sites.length){
      rows.push([STATE.sites[0].id, '10.20.30', '.1', '.2', '.3']);
    } else {
      rows.push(cols.map(function(){ return ''; }));
    }
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = cols.map(function(c){ return { wch:Math.max(14, c.length + 4) }; });
    XLSX.utils.book_append_sheet(wb, ws, 'القالب');
    XLSX.writeFile(wb, 'قالب-' + kind + '.xlsx');
    return true;
  });
}

var IMP_PREVIEW = null;

/* ═══ تقريرُ كاميرات الوزارة بعناوينه — من داخل التطبيق لا من الشيفرة (V22.5) ═══
   «الكاميرات ٨٨ في الإكسل وفيهم بيانات الكاميرات والـIP — محتاجها كلها واضحة». الشيفرةُ منشورةٌ
   للعموم فلا تحمل عنوانَ شبكة؛ فيُرفَع التقريرُ نفسُه (بصيغة الوزارة كما هو) من «الأدوات ← الاستيراد»:
   يُقرأ على الجهاز، ويُطابَق عمودًا عمودًا بالنقاط (العمودُ والقطاعُ والموقع، وأدوارُ الجمرات)، ويُعرَض
   قبل الحفظ ما طابق وما لم يطابق ولماذا — ثم يُكتَب في قاعدة البيانات المحمية (تجاوزُ النقطة camx)
   فيقرؤه من دخل التطبيق وحده. وكلمةُ المرور لا تُقرأ ولا تُكتَب أبدًا. */
function mohuDms(v){
  var m = String(v || '').match(/(\d+)°(\d+)'([\d.]+)"?\s*([NS])[^\d]*(\d+)°(\d+)'([\d.]+)"?\s*([EW])/);
  if (!m) return null;
  var a = +m[1] + m[2] / 60 + m[3] / 3600, b = +m[5] + m[6] / 60 + m[7] / 3600;
  return [m[4] === 'S' ? -a : a, m[8] === 'W' ? -b : b];
}
function mohuPole(p){ return String(p || '').toUpperCase().replace(/POLE/g, 'P').replace(/[^A-Z0-9]/g, ''); }
function mohuSec(p){ return String(p || '').toUpperCase().replace(/\s+/g, ''); }
function mohuSiteKey(x){
  var m = /كاميرا وزارة\s+(.*?)\s*(\[\d+ cams\])?\s*(\(PTZ\))?\s*-\s*(.+)$/.exec(String(x.name || ''));
  return m ? [mohuPole(m[1]), mohuSec(m[4])] : null;
}
function mohuParse(rows){
  var clean = function(v){ var s0 = String(v == null ? '' : v).trim(); return /PASS/i.test(s0) ? '' : s0; };   /* كلمةُ المرور لا تمرّ */
  var start = -1;
  rows.forEach(function(r, i){ if ((r || []).some(function(c){ return /^\s*SECTOR\s*$/i.test(String(c)); })) start = i; });
  var cur = { cpe:'', pole:'', ant:'', loc:'', status:'', sector:'', secAnt:'' }, cams = [];
  for (var i = start + 1; i < rows.length; i++){
    var r = (rows[i] || []).map(clean);
    if (!r.some(function(c){ return c; })) continue;
    if (/^SECTOR$/i.test(r[2])) continue;
    if (r[2]){ var ln = r[2].split(/\n/); cur.sector = ln[0].replace(/\s*\(\d+\)\s*$/, '').trim(); cur.secAnt = ln.slice(1).join(' ').trim(); }
    if (r[0] || r[3]){ cur.cpe = r[0]; cur.pole = r[3]; cur.ant = r[4]; cur.loc = r[11]; cur.status = r[12]; }
    if (!r[1] && !r[6]) continue;
    cams.push({ row:i + 1, n:r[1], vlan:r[5], ip:r[6], model:r[7], kind:/PTZ/i.test(r[8]) ? 'P' : (/LPR/i.test(r[8]) ? 'L' : 'F'),
                sector:cur.sector, secAnt:cur.secAnt, cpe:cur.cpe, pole:cur.pole, ant:cur.ant, loc:r[11] || cur.loc, status:r[12] || cur.status });
  }
  var cand = (STATE.sites || []).filter(function(x){ return x.type === 'كاميرا'; });
  var byId = {}, bad = [];
  cams.forEach(function(c){
    var id = '', L0 = String(c.loc).toUpperCase(), jam = /JAMARAT/.test(L0 + ' ' + c.sector.toUpperCase() + ' ' + c.pole.toUpperCase());
    if (jam){
      var cn = String(c.n || '').replace(/\D/g, '');   /* (V23.3) كلُّ كاميرا نقطتُها — تُطابَق برقمها كما في الإكسل */
      var byN = cn ? (STATE.sites || []).filter(function(x){ return /^NSK-JMR-CAM-/.test(x.id) && new RegExp('CAM\\s*' + cn + '(?!\\d)').test(x.name); })[0] : null;
      if (byN) id = byN.id;
      var pp = mohuPole(c.pole);
      if (id){ /* طابق برقمه */ } else if (pp === 'F144') id = 'NSK-JMR-CAM-0006'; else if (pp === 'F143') id = 'NSK-JMR-CAM-0007'; else if (pp === 'F131') id = 'NSK-JMR-CAM-0008';
      else if (/BACK/.test(L0)) id = 'NSK-JMR-CAM-0009';
      else { var fm = /\b(G|1ST|2ND|3RD|4TH)\s*F/.exec(L0); if (fm) id = 'NSK-JMR-CAM-000' + ({ G:1, '1ST':2, '2ND':3, '3RD':4, '4TH':5 })[fm[1]]; }
    } else {
      var ll = mohuDms(c.loc), kp = mohuPole(c.pole), ks = mohuSec(c.sector), best = null, bd = 9e9;
      cand.forEach(function(x){ var k = mohuSiteKey(x); if (!k || k[0] !== kp) return; var d = ll ? distKm({ lat:ll[0], lng:ll[1] }, x) * 1000 : (k[1] === ks ? 0 : 9e8); if (k[1] !== ks && d > 30) return; if (d < bd){ bd = d; best = x; } });
      if (best) id = best.id;
    }
    if (!id || !siteFind(id)){ bad.push({ row:c.row, why:(!c.loc || (!jam && !mohuDms(c.loc))) ? 'بلا إحداثيات ولا نقطةٍ تطابقه' : 'لا نقطةَ تطابقه', data:[(c.pole || c.cpe || ('كاميرا ' + c.n)) + ' · ' + c.sector] }); return; }
    var o = byId[id] = byId[id] || { id:id, camx:{ src:'MOHU 2026', at:Date.now(), by:STATE.meta.name || '', sector:c.sector, secAnt:c.secAnt, cpe:c.cpe, pole:c.pole, ant:c.ant, status:c.status, cams:[] } };
    o.camx.cams.push({ n:c.n, kind:c.kind, model:c.model, ip:c.ip, vlan:c.vlan });
  });
  var ok = Object.keys(byId).map(function(k){ return byId[k]; });
  IMP_PREVIEW = { kind:'mohu', ok:ok, bad:bad, head:['CPE','CAM','SECTOR','POLE','IP'], missing:start < 0 ? ['SECTOR'] : [], cams:cams.length };
  return IMP_PREVIEW;
}
/* صفوفُ النافذة من تقرير الوزارة المرفوع — لمن دخل التطبيق */
function camxRows(x, kvf){
  var c = camNetOf(x); if (!c || !Array.isArray(c.cams) || !c.cams.length) return '';   /* المرفوعُ ثم الثابتُ ثم العمودُ باسمه (V23.6) */
  var ltr = function(v){ return '<span dir="ltr" class="num">' + esc(v) + '</span>'; };
  /* (V23.6) كانت أسطرُ الطراز ورابطِ البثّ لا تلتفّ داخل عمود القيمة الضيّق فتفيض أفقيًّا ويبقى مكانُها مربعًا
     فارغًا. صارت كلُّ كاميرا كتلةً: سطرٌ بالعربية، وثلاثةٌ من اليسار تلتفّ بأيِّ موضع */
  var L = function(v){ return '<div dir="ltr" class="cx-l">' + v + '</div>'; };
  var list = '<div class="cx-box">' + c.cams.map(function(k){
    return '<div class="cx"><b>' + esc(t('كاميرا')) + ' ' + esc(k.n || '\u2014') + '</b> \u2014 ' + esc(t(k.kind === 'P' ? 'متحرّكة (PTZ)' : k.kind === 'L' ? 'قارئة لوحات (LPR)' : 'ثابتة (Bullet)'))
      + (k.ip ? L('IP ' + esc(k.ip) + (/\d/.test(k.vlan || '') ? ' \u00b7 VLAN ' + esc(k.vlan) : '')) : '')
      + (k.model ? L(esc(k.model) + (CAM_SPEC[k.model] ? ' \u00b7 ' + esc(CAM_SPEC[k.model]) : '')) : '')
      + (k.ip ? L('<span class="hint" style="margin:0;font-size:11px">rtsp://' + esc(k.ip) + ':554/cam/realmonitor?channel=1&amp;subtype=0</span>') : '')
      + '</div>';
  }).join('') + '</div>';
  return (c.cpe || c.ant ? kvf('المستقبِل على العمود', ltr([c.cpe, c.ant].filter(Boolean).join(' \u00b7 '))) : '')
    + (c.secAnt ? kvf('هوائي القطاع', ltr(c.secAnt)) : '')
    + (c.status ? kvf('حالة الوصلة', esc(c.status)) : '')
    + kvf('عناوين الكاميرات', list)
    + (x.lat && x.lng ? kvf('الخريطة', '<a href="https://maps.google.com/?q=' + (+x.lat) + ',' + (+x.lng) + '" target="_blank" rel="noopener">' + esc(t('افتح في خرائط جوجل')) + '</a>') : '');
}
function impRead(kind, file){
  return xlsxLoad().then(function(ok){
    if (!ok) return null;
    return new Promise(function(res){
      var fr = new FileReader();
      fr.onload = function(){
        try{
          var wb = XLSX.read(new Uint8Array(fr.result), { type:'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
          res(kind === 'mohu' ? mohuParse(rows) : impValidate(kind, rows));   /* تقريرُ الوزارة بصيغته (V22.5) */
        }catch(e){ res(null); }
      };
      fr.onerror = function(){ res(null); };
      fr.readAsArrayBuffer(file);
    });
  });
}

function impValidate(kind, rows){
  var cols = IMP_COLS[kind] || [], head = rows[0] || [];
  var missing = cols.filter(function(c){ return head.indexOf(c) < 0; });
  var okRows = [], bad = [];
  for (var i = 1; i < rows.length; i++){
    var r = rows[i];
    if (!r || !r.length || r.every(function(v){ return v === ''; })) continue;
    var why = '';
    if (kind === 'sites'){
      if (!r[0]) why = 'بلا معرّف';
      else if (!siteFind(String(r[0]).trim())) why = 'معرّف غير موجود';
    } else if (kind === 'items'){
      var z = String(r[0]||'').trim();
      if (z !== 'مخيم' && z !== 'ممر') why = 'المنطقة إما مخيم أو ممر';   /* منطقتا الكتالوج لا أنواعُ المواقع */
      else if (!r[1]) why = 'بلا اسم';
    } else if (kind === 'buys'){
      if (DATA.buyCats.indexOf(String(r[2]||'').trim()) < 0) why = 'فئة غير معتمدة';
      else if (DATA.suppliers.indexOf(String(r[6]||'').trim()) < 0) why = 'مورّد غير معتمد';
    } else if (!r[0]) why = 'الحقل الأول فارغ';
    if (why) bad.push({ row:i+1, why:why, data:r });
    else okRows.push(r);
  }
  IMP_PREVIEW = { kind:kind, missing:missing, ok:okRows, bad:bad, head:head };
  return IMP_PREVIEW;
}

function impApply(){
  var p = IMP_PREVIEW;
  if (!p || !p.ok.length) return 0;
  var n = 0;
  p.ok.forEach(function(r){
    if (p.kind === 'mohu'){ siteOvSet(r.id, { camx:r.camx }); var sx = siteFind(r.id); if (sx) sx.camx = r.camx; n++; return; }   /* (V22.5) */
    if (p.kind === 'items'){
      var id = 'imp_' + (++n);
      cfgSet('itPts', id, r[2]); cfgSet('itPrep', id, r[3]);
      cfgSet('itAsm', id, r[4]); cfgSet('itPrice', id, r[5]);
      itemsList().push({ z:String(r[0]).trim()==='ممر'?'cor':'camp', code:id,
                         name:String(r[1]), pts:0, price:0, prep:0, asm:0 });
    } else if (p.kind === 'sites'){
      var s = siteFind(String(r[0]).trim());
      if (s){ if (r[3]) s.sign = String(r[3]); if (r[4]) s.sq = String(r[4]);
              if (r[5]) s.co = String(r[5]); n++; }
    } else if (p.kind === 'fleet'){
      /* اللوحةُ مفتاحٌ: ما وُجد يُعدَّل وما لم يوجد يُنشَأ */
      var pl = String(r[0] || '').trim();
      if (pl){
        var ex = vehList().filter(function(v){ return v.plate === pl; })[0];
        var kd = vehKinds().filter(function(k){ return k.n === String(r[1] || '').trim(); })[0];
        var vv = ex || { id:'vh' + Date.now().toString(36) + n, plate:pl, st:'متاحة',
                         at:Date.now(), by:STATE.meta.name || '' };
        if (kd) vv.kind = kd.id; else if (!vv.kind) vv.kind = 'sedan';
        if (r[2]) vv.model  = String(r[2]).trim();
        if (r[3]) vv.licExp = String(r[3]).trim();
        if (r[4]) vv.own    = String(r[4]).trim();
        if (r[5]) vv.cost   = +r[5] || 0;
        if (!vv.start) vv.start = todayISO();
        vehSave(vv);
        n++;
      }
    } else if (p.kind === 'users'){
      /* الاستيرادُ يعدّل الموجودَ ولا يُنشئ حسابًا: إنشاءُ الحساب في المصادقة
         لا في القاعدة، والدورُ والحالةُ هما ما تقرؤه القواعد. */
      var uid0 = String(r[0] || '').trim();
      var cur  = (STATE.users || {})[uid0];
      if (uid0 && cur){
        var pt = {};
        if (r[1]) pt.name = String(r[1]).trim();
        if (r[2]){
          var rk = Object.keys(ROLES).filter(function(k){
            return k === String(r[2]).trim() || ROLES[k].n === String(r[2]).trim(); })[0];
          if (rk) pt.role = rk;
        }
        if (r[3]) pt.active = String(r[3]).trim() !== 'معطل';
        if (Object.keys(pt).length){
          STATE.users[uid0] = Object.assign({}, cur, pt);
          CORE.set('users', uid0, STATE.users[uid0]);
          n++;
        }
      }
    } else if (p.kind === 'ips'){
      /* كان يقول «صفًّا حُفظ» ولا يكتب حرفًا — العرضُ بلا كتابةٍ كذب */
      /* الأعمدةُ الأربعةُ كلُّها تُحفَظ: كان يُقرأ العمودُ الثاني وحدَه
         وتُهمَل ثلاثةٌ في الملف، فيُظنُّ أنها حُفظت. */
      var t2 = siteFind(String(r[0]).trim());
      if (t2 && r[1]){
        t2.net = String(r[1]).trim().replace(/\.+$/, '');
        if (r[2]) t2.ipRtr = String(r[2]).trim();
        if (r[3]) t2.ipRdr = String(r[3]).trim();
        if (r[4]) t2.ipCam = String(r[4]).trim();
        n++;
      }
    } else { n++; }
  });
  CORE.dirty(p.kind, 'import', { at:Date.now(), n:n });
  IMP_PREVIEW = null;
  return n;
}

/* ═══ عامل الخدمة — التطبيق يفتح بلا شبكة ═══
   القشرة تُكاش عند التثبيت، والملفات الثقيلة عند أول طلب،
   والصفحاتُ شبكةٌ أولًا فإن تعذّرت فمن الكاش — فلا يُعرض قديمٌ وشبكةٌ حاضرة. */

var SW_SRC = [
"const V = 'nusuk-v14-1';",
"const SHELL = ['./', './index.html'];",
"const HEAVY = ['./poly.json'];",
"",
"self.addEventListener('install', e => {",
"  self.skipWaiting();",
"  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => null)));",
"});",
"",
"self.addEventListener('activate', e => {",
"  e.waitUntil(caches.keys().then(ks =>",
"    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))",
"  ).then(() => self.clients.claim()));",
"});",
"",
"function timed(req, ms){",
"  return new Promise((res, rej) => {",
"    const t = setTimeout(() => rej(new Error('t')), ms);",
"    fetch(req).then(r => { clearTimeout(t); res(r); }, e => { clearTimeout(t); rej(e); });",
"  });",
"}",
"",
"self.addEventListener('fetch', e => {",
"  const req = e.request;",
"  if (req.method !== 'GET') return;",
"  const url = new URL(req.url);",
"",
"  /* لا يُكاش ما يخصّ قاعدة البيانات ولا المصادقة */",
"  if (/firestore|googleapis|identitytoolkit|gstatic/.test(url.host)) return;",
"",
"  /* الصفحة: شبكةٌ أولًا بمهلةٍ ثم الكاش */",
"  if (req.mode === 'navigate'){",
"    e.respondWith(",
"      timed(new Request(req.url, { cache:'reload' }), 3500)",
"        .then(r => { if (r && r.status === 200) caches.open(V).then(c => c.put('./index.html', r.clone())); return r; })",
"        .catch(() => caches.match('./index.html').then(h => h || caches.match(req)))",
"    );",
"    return;",
"  }",
"",
"  /* الثقيل والبلاطات والمكتبات: كاشٌ أولًا ثم شبكةٌ تُخزَّن */",
"  e.respondWith(",
"    caches.match(req).then(hit => hit || fetch(req).then(r => {",
"      if (r && r.status === 200 && (url.origin === location.origin",
"          || /unpkg|cdn\\.sheetjs|cdnjs\\.cloudflare|tile\\.openstreetmap|arcgisonline/.test(url.host))){",
"        const cl = r.clone();",
"        caches.open(V).then(c => c.put(req, cl));",
"      }",
"      return r;",
"    }).catch(() => hit))",
"  );",
"});",
"",
"self.addEventListener('message', e => {",
"  if (e.data === 'skip') self.skipWaiting();",
"  if (e.data === 'clear') caches.keys().then(ks => ks.forEach(k => caches.delete(k)));",
"});"
].join('\n');

var SW_STATE = { reg:null, ok:false, waiting:false };

function swInstall(){
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve(false);
  /* يُسجَّل من `./sw.js` — والمتصفّحاتُ ترفض `blob:` لتسجيل العامل، فكان
     لا يُسجَّل عاملٌ أصلًا: لا عملَ بلا شبكة، ولا دورةَ تحديث، ولا إشعارَ
     نظام. والملفُّ في المستودع يُرقَّم كلَّ دفعةٍ ولا يُستعمَل. */
  try{
    return navigator.serviceWorker.register('./sw.js', { scope:'./' })
      .then(function(r){
        SW_STATE.reg = r; SW_STATE.ok = true;
        r.addEventListener('updatefound', function(){
          var nw = r.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function(){
            if (nw.state === 'installed' && navigator.serviceWorker.controller){
              SW_STATE.waiting = true;
              swApply();
            }
          });
        });
        return true;
      })
      .catch(function(e){
        softErr('عامل الخدمة', e, 'تعذّر تجهيزُ العمل بلا شبكة — التطبيقُ يحتاج اتصالًا');
        return false;
      });
  }catch(e){ return Promise.resolve(false); }
}

/* ═══ التحديثُ التلقائيّ ═══
   العاملُ يأخذ السيطرةَ فورًا، لكنّ الصفحةَ تبقى على شيفرتها القديمة حتى
   تُعاد. وكان يُقال «أغلق التطبيقَ وافتحه» — ومن لا يقرأ الرسالةَ يبقى على
   نسخةٍ قديمةٍ أسبوعًا، ويشكو من عطلٍ أُصلح.

   فتُعاد الصفحةُ بنفسها — إلا أن يكون المستخدمُ في نموذجٍ فيه ما لم يُحفَظ،
   فإعادةُ التحميل حينئذٍ تُضيع عملَه. فيُنتظَر حتى يخرج منه. */
var SW_RELOADED = false;
function swBusy(){
  /* نموذجٌ مفتوحٌ فيه إدخال، أو طابورٌ لم يُرفَع بعد */
  if (['svForm','insForm','newsite'].indexOf(CUR) > -1) return true;
  try { if (document.querySelector('input:focus, textarea:focus, select:focus')) return true; } catch (e){}
  return false;
}
var SW_TICK = null, SW_LEFT = 0;
function swCancel(){
  clearInterval(SW_TICK); SW_TICK = null;
  var b = document.getElementById('swBar');
  if (b) b.remove();
}
/* شريطٌ يعدُّ من خمسٍ ويقول ما سيقع، وفيه «حدّث الآن» و«لاحقًا».
   وكان التحديثُ يقع بعد سبعِ أعشارِ ثانيةٍ بلا مهلة — فمن كان يقرأ شيئًا
   فقده بلا إنذار. والتأجيلُ حقٌّ لمن يعمل. */
function swApply(){
  if (SW_RELOADED || SW_TICK) return;
  if (swBusy()){
    toast(t('نسخةٌ جديدةٌ جاهزة — تُطبَّق فور انتهائك'));
    setTimeout(swApply, 20000);
    return;
  }
  SW_LEFT = 5;
  var bar = document.createElement('div');
  bar.id = 'swBar'; bar.className = 'sw-bar';
  bar.innerHTML = '<span id="swTxt"></span>'
    + '<button type="button" class="btn btn-primary btn-sm" data-swnow="1">'
    + esc(t('حدّث الآن')) + '</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-swlater="1">'
    + esc(t('لاحقًا')) + '</button>';
  document.body.appendChild(bar);
  var paint = function(){
    var el = document.getElementById('swTxt');
    if (el) el.textContent = t('نسخةٌ جديدةٌ نزلت — تُطبَّق بعد') + ' ' + nm(SW_LEFT);
  };
  paint();
  SW_TICK = setInterval(function(){
    SW_LEFT--;
    if (SW_LEFT > 0){ paint(); return; }
    swCancel(); swNow();
  }, 1000);
}
function swNow(){
  if (SW_RELOADED) return;
  SW_RELOADED = true; swCancel();
  toast(t('تُحدَّث النسخة…'));
  swLighten();
  setTimeout(function(){ try { location.reload(); } catch (e){} }, 600);
}
/* (V21.9) الانتقالُ إلى النسخة الجديدة كان يُحمِّل الصفحةَ الجديدةَ فوق القديمة بكلِّ ما فيها
   (خريطةٌ بألفٍ وثمانمئة نقطة، وشجرةُ الصفحة، والإنصاتُ الحيّ) — فذروةُ الذاكرة في سفاري
   الآيفون تتجاوز حدَّها فيُسقِطها. يُطفأ الثقيلُ أوّلًا ثم يُعاد التحميل. */
function swLighten(){
  bootOk('update');
  try { if (typeof liveStop === 'function') liveStop(); } catch (e){ LS_ERR = e; }
  try { if (typeof M3 !== 'undefined' && M3 && M3.remove){ M3.remove(); M3 = null; } } catch (e){ LS_ERR = e; }
  try { if (typeof MAP !== 'undefined' && MAP && MAP.remove){ MAP.remove(); MAP = null; } } catch (e){ LS_ERR = e; }
  try { ['content', 'mapBox'].forEach(function(id){ var el = document.getElementById(id); if (el) el.innerHTML = ''; }); } catch (e){ LS_ERR = e; }
}
/* ═══ النسخةُ تُعلَن من القاعدة ═══
   كان الجهازُ يعرف بالإصدار الجديد حين يسأل الخادمَ كلَّ ربع ساعة — فتبقى أجهزةٌ
   على إصدارٍ أقدم ساعةً وأكثر، والمكتبُ يرى ذلك في «نسخ الأجهزة» ولا يملك إلا
   أن يطلب من أصحابها الإغلاقَ والفتح. صار المكتبُ يكتب رقمَ نسخته في
   settings/app أوّلَ ما يدخل، وكلُّ جهازٍ مفتوحٍ يُنصِت إليه: نسخةٌ أعلى من نسختي
   = اسأل عامل الخدمة الآن، وإن لم يجد جديدًا (تأخّرُ النشر) يسأل كلَّ دقيقة حتى
   يجد. والمغلقُ يتحدّث حين يُفتَح — لا سبيلَ إلى جهازٍ مغلق. */
function verNum(v){ var m = /V(\d+)\.(\d+)/.exec(String(v || '')); return m ? (+m[1]) * 1000 + (+m[2]) : 0; }
function verPublish(){
  var mine = appVer(); if (!mine || !may('roles')) return;
  var cloud = (STATE.appVerCloud || '');
  if (verNum(mine) > verNum(cloud)){ STATE.appVerCloud = mine; CORE.set('cfg', 'app', { ver:mine, at:Date.now(), by:STATE.meta.name || '' }); }
}
/* ═══ العهدُ الجديد — لا يُرفَع من جهازٍ ما سبق العهدَ ═══
   «هنبدأ كلَّه على السيرفر جديدًا»: التصفيرُ يمحو القاعدةَ، لكن أجهزةَ الفريق
   تحمل طوابيرَ وسجلاتِ تجربةٍ ترفعها أوّلَ دخول فتعود القاعدةُ ملأى بالقديم.
   فصار للتصفير عهدٌ: رقمٌ في settings/app يقرؤه كلُّ جهازٍ قبل أن يدفع طابورَه
   (pullStatic قبل أيِّ رفع، والإنصاتُ لمن كان مفتوحًا): عهدٌ لا يعرفه = يُفرِغ
   ما عنده — سجلاتٍ وطابورًا ومعزولًا — ويسحب من القاعدة باردًا. الحساباتُ
   والإعداداتُ وطبقةُ النقاط تبقى لأنها في القاعدة أصلًا. */
var EPOCH_PENDING = false;   /* قراءةُ العهد جارية — لا رفعَ حتى تنتهي */
/* ═══ «زامِن الجميع الآن» ═══
   كان المكتبُ إن أراد أن يصل الفريقَ شيءٌ فورًا لا يملك إلا أن يطلب من كلٍّ أن
   يضغط المزامنة. والقاعدةُ تصل كلَّ جهازٍ مفتوحٍ أصلًا (settings/app منصَتٌ إليه):
   فرقمٌ يزيد هناك = أمرٌ بسحبٍ فوريٍّ يمرُّ به كلُّ مفتوح، والمغلقُ يسحب حين يُفتَح.
   ولمديرِ المشروع وحدَه — والقاعدةُ تحرسه لا الشاشةُ فقط. */
var SYNC_ALL_SEEN = 0;
function syncAllNow(){
  if (!may('roles')){ toast(t('لمدير المشروع وحدَه')); return false; }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return false; }
  var n = Date.now();
  CORE.set('cfg', 'app', { syncAll:n, syncAllBy:STATE.meta.name || '', syncAllAt:n });
  SYNC_ALL_SEEN = n;
  logEvent('مزامنةٌ فوريةٌ للجميع');
  toast(t('أُرسل الأمرُ — كلُّ جهازٍ مفتوحٍ يسحب الآن، والمغلقُ حين يُفتَح'));
  SYNC.pullAsk = true; syncCycle();
  return true;
}
function syncAllApply(v){
  var n = +v || 0;
  if (!n || n <= (SYNC_ALL_SEEN || 0)) return false;
  var first = !SYNC_ALL_SEEN;
  SYNC_ALL_SEEN = n;
  if (first) return false;                      /* أوّلُ قراءةٍ تضبط العلامةَ ولا تسحب */
  SYNC.pullAsk = true; FB._staticAt = 0; syncCycle();   /* أمرُ المكتب يجلب الثوابتَ أيضًا */
  toast(t('مزامنةٌ من المكتب — يُسحَب الآن'));
  return true;
}
function epochApply(cloud){
  cloud = +cloud || 0;
  if (!cloud || cloud === (STATE.meta.epoch || 0)) return false;
  var n = 0;
  WIPE_KEYS.forEach(function(k){ var v = STATE[k[0]]; n += Array.isArray(v) ? v.length : Object.keys(v || {}).length; STATE[k[0]] = Array.isArray(v) ? [] : {}; });
  ['steps','poison','queue'].forEach(function(k){ STATE[k] = []; });
  ['evlog','notifs','att','presence'].forEach(function(k){ STATE[k] = Array.isArray(STATE[k]) ? [] : {}; });
  STATE.notifs = [];
  (STATE.sites || []).forEach(function(x){ x.fstat = 'لم يبدأ'; });
  SITE_IX = null; SITE_TOK = null;
  STATE.meta.pullAt = {}; STATE.meta.notifAt = Date.now(); STATE.meta.epoch = cloud;
  CORE.saveSoon(); statBump();
  logEvent('عهدٌ جديد — أُفرغ هذا الجهاز (' + nm(n) + ' سجلًّا) وسُحب من القاعدة');
  toast(t('بدايةٌ جديدة من المكتب — أُفرغ هذا الجهازُ ويُسحَب من القاعدة'));
  return true;
}
/* ═══ الدورُ يتبدّل تحت اليد ═══
   الشاشةُ تُبنى من ROLE، والنطاقُ والإنصاتُ منه، والقاعدةُ تحكم بوثيقة الحساب.
   فإن غُيّر الدورُ من المكتب طُبِّق على الفور: الصلاحياتُ تُعاد، والشاشةُ إن
   لم تعد تُرى انتقل إلى أولى شاشاته، والإنصاتُ والسحبُ يُعادان بنطاقه الجديد. */
function roleWatch(v){
  var nr = isBossHere() ? 'admin' : (ROLES[v.role] ? v.role : 'tech');
  if (nr === ROLE) return;
  var was = (ROLES[ROLE] || {}).n || ROLE;
  ROLE = nr; STATE.meta.role = nr;
  if (v.name) STATE.meta.name = v.name;
  CORE.saveSoon();
  logEvent('تغيّر الدور — من ' + was + ' إلى ' + ((ROLES[nr] || {}).n || nr));
  toast(t('تغيّرت صلاحيتُك إلى') + ' «' + t((ROLES[nr] || {}).n || nr) + '» — ' + t('طُبِّقت الآن'));
  try { liveSmallStop(); } catch (e){ LS_ERR = e; }
  STATE.meta.pullAt = {};
  liveSmall(); presenceBeat(true); SYNC.pullAsk = true; syncCycle();
  /* شاشةٌ (أو شريحةٌ) لم تعد تُرى: نُقلَ إلى أوّلِ ما يراه دورُه الجديد */
  if (PARENT[CUR] && PARENT[CUR] !== CUR && !seesPage(CUR)) CUR = PARENT[CUR];
  if (!seesPage(CUR)) CUR = (ROLES[nr].nav || ['over']).filter(seesPage)[0] || 'acct';
  if (TABS[CUR]) PTAB[CUR] = tabCur(CUR);
  render(1); syncBadge();
}
var VIS_LAST = 0;
/* على الهاتف تبدأ مطويّةً — الشاشةُ للخريطة؛ ومن فتحها تبقى له */
var LEGEND_ON = (function(){ var v = lsGet('nsk14.legend'); if (v === '0') return false; if (v === '1') return true;
  return !(typeof window !== 'undefined' && window.innerWidth < 640); })();
var VER_CHASE = 0;
function verChase(cloud){
  STATE.appVerCloud = cloud;
  if (verNum(cloud) <= verNum(appVer())){ clearInterval(VER_CHASE); VER_CHASE = 0; return; }
  var b = document.querySelector('.ver-tag'); if (b) b.classList.add('upd');
  swPoll();
  if (!VER_CHASE) VER_CHASE = setInterval(function(){
    if (verNum(STATE.appVerCloud || '') <= verNum(appVer())){ clearInterval(VER_CHASE); VER_CHASE = 0; return; }
    swPoll();
  }, 60000);
}
function swLater(){
  swCancel();
  /* «لاحقًا» ليست «أبدًا»: يُعاد العرضُ بعد ثلاث دقائق ما دام الجديدُ منتظرًا */
  setTimeout(function(){ if (SW_STATE.waiting && !SW_RELOADED) swApply(); }, 180000);
  toast(t('أُجّل — يُطبَّق عند الفتح القادم'));
}

/* المتصفّحُ لا يسأل عن عاملٍ جديدٍ إلا نادرًا — فيُسأل كلَّ ربع ساعةٍ وعند
   العودة إلى التطبيق، فالميدانُ يفتحه ويغلقه طولَ اليوم ولا يُعيد تحميله. */
function swPoll(){
  if (!SW_STATE.reg || !SW_STATE.reg.update) return;
  try { SW_STATE.reg.update(); } catch (e){}
}
setInterval(swPoll, 300000);
/* الشحناتُ تُراجَع كلَّ ساعة: ما تأخّر يُنبَّه عليه مرةً في اليوم */
setInterval(function(){ try { shipWatch(); } catch (e){} }, 3600000);
document.addEventListener('visibilitychange', function(){
  if (!document.hidden) swPoll();
}, { passive:true });
window.addEventListener('focus', swPoll, { passive:true });
if (navigator.serviceWorker){
  /* ═══ أوّلُ تثبيتٍ ليس تحديثًا (V17.5) ═══
     عند أوّل تثبيتٍ للعامل — جهازٌ جديدٌ أو متصفّحٌ بلا ذاكرة — يقع
     controllerchange أيضًا (من لا شيءٍ إلى عامل)، فكان يُقرأ «نسخةٌ جديدةٌ
     نزلت» ويُعدُّ لإعادة تحميلٍ لا معنى لها: لا نسخةَ قديمةً معروضةً أصلًا.
     فيُميَّز: إن لم يكن ثمّةَ عاملٌ قبلَه فهو تثبيتٌ أوّل ولا تحديث. وهذا هو
     ما أسقط اختبارَ المتصفّح الحقيقيِّ ثلاثَ مرات: إعادةُ تحميلٍ في منتصفه. */
  var SW_HAD = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function(){
    if (!SW_HAD){ SW_HAD = true; return; }
    /* عاملٌ جديدٌ تولّى مكانَ قديم — الشيفرةُ المعروضةُ صارت قديمة */
    SW_STATE.waiting = true;
    swApply();
  });
}

/* فحصُ التحديثات: يسأل عاملَ الخدمة أن يعيد جلبَ نفسِه، ويقارن رقمَ الكاش
   في `sw.js` بالمحمَّل. فالمستخدمُ لا يُترَك يخمّن أعنده أحدثُ نسخةٍ أم لا،
   ولا يُنصَح بمسح بيانات الموقع — فذلك يمحو ما لم يُرفَع بعد. */
function verCheck(){
  toast(t('يُفحَص التحديث…'));
  var here = (String(document.title).match(/V\d+\.\d+/) || [''])[0];
  fetch('sw.js?ts=' + Date.now(), { cache:'reload' })
    .then(function(r){ return r.ok ? r.text() : ''; })
    .then(function(txt){
      var m = /nusuk-survey-v(\d+\.\d+)/.exec(txt || '');
      var there = m ? ('V' + m[1]) : '';
      var mine = (typeof APP_VER === 'string' && APP_VER) || here || '';
      if (SW_STATE.reg && SW_STATE.reg.update) { try { SW_STATE.reg.update(); } catch (e){} }
      if (there && mine && there !== mine){
        var b = document.querySelector('.ver-tag');
        if (b) b.classList.add('upd');
        toast(there + ' ' + t('جاهزةٌ — أغلق التطبيق وافتحه'));
      } else if (SW_STATE.waiting){
        toast(t('نسخةٌ جديدةٌ جاهزة — أغلق التطبيق وافتحه'));
      } else {
        toast(t('أنت على أحدث نسخة'));
      }
    })
    .catch(function(){ toast(t('تعذّر الفحص — لا شبكة')); });
}

function quotaEstimate(){
  var users = cfgGet('users') || 150;
  var perDay = { survey:20, install:8, syncs:8 };
  var writes = users * (perDay.survey * 3 + perDay.install * 5 + 6 /* أحداثٌ وطوابع */);
  /* القراءةُ تُحسب من مسار الشيفرة لا من التمنّي: سحبٌ كاملٌ أوّلَ اليوم
     مقصورٌ على ما يخصُّ المستخدم، ثم فوارقُ ما تغيّر في بقية المزامنات. */
  var docs   = Object.keys(STATE.recs).length + Object.keys(STATE.inss).length
             + Object.keys(STATE.tasks).length;
  var firstPull = Math.max(60, Math.round(docs / Math.max(1, users)));  /* حصةُ الفرد */
  var delta     = Math.round(users * 0.6);        /* ما يكتبه الآخرون في الفترة */
  var reads  = users * (firstPull + (perDay.syncs - 1) * delta);
  var photos = users * (perDay.survey * 2 + perDay.install * 2);
  return {
    users:users, writes:writes, reads:reads, photos:photos,
    writeCap:20000, readCap:50000,
    writeOver: writes > 20000, readOver: reads > 50000,
    storeDay: Math.round(photos * 180 / 1024)   /* ميجا يوميًّا */
  };
}

function swClear(){
  if (SW_STATE.reg && SW_STATE.reg.active) SW_STATE.reg.active.postMessage('clear');
  if (typeof caches !== 'undefined') caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); });
  toast(t('أُفرغ الكاش'));
}

/* حجمُ ما خُزّن — يُعرَض في عمر البيانات */
/* ═══ الخروج ═══
   كان الزرُّ بلا معالجٍ أصلًا: يضغطه المستخدمُ فيبتلعه حارسُ الأزرار الميتة
   ويقول له نصَّه «تسجيل الخروج» — ويبقى داخلًا.

   والخروجُ لا يمسُّ ما لم يُرفَع: طابورُ المزامنة والصورُ المعلَّقةُ تبقى على
   الجهاز، ويُحذَّر منها قبل الخروج — فمن خرج وفي طابوره عملُ يومٍ ثم دخل
   بحسابٍ آخر لم يعد يجده. */
function signOut(){
  var pend = (CORE && CORE.pending) ? CORE.pending() : 0;
  var pics = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q.length : 0)
           + (typeof PHOTO_FAIL !== 'undefined' ? PHOTO_FAIL.length : 0);
  if (pend || pics){
    var msg = t('لم يُرفَع بعد') + ': '
      + (pend ? nm(pend) + ' ' + t('سجلًّا') : '')
      + (pend && pics ? ' \u00b7 ' : '')
      + (pics ? nm(pics) + ' ' + t('صورة') : '')
      + ' — ' + t('اخرج على أي حال؟');
    if (typeof confirm === 'function' && !confirm(msg)) return;
  }
  logEvent('تسجيل خروج — ' + (STATE.meta.name || ''));
  try { if (typeof liveStop === 'function') liveStop(); } catch (e){}
  try { if (FB && FB.auth && FB.auth.signOut) FB.auth.signOut(); } catch (e){}
  /* الجلسةُ وحدها تُمسَح — والبياناتُ المحليةُ تبقى لصاحبها حين يعود،
     ولا يُنصَح بمسح بيانات الموقع أبدًا. */
  try { localStorage.removeItem('nsk14.session'); } catch (e){}
  STATE.meta.uid = ''; STATE.meta.online = false;
  toast(t('خرجت — بياناتُك المحليةُ محفوظة'));
  /* عنصرُ الدخول يُحذَف من الهيكل عند الدخول، فلا يُعاد ببنائه بل بإعادة
     التحميل: أنظفُ وأضمن. */
  setTimeout(function(){ try { location.reload(); } catch (e){} }, 700);
}

/* ═══ التثبيت على الشاشة الرئيسية ═══ */
var INSTALL_EVT = null;

function pwaWatch(){
  if (typeof window === 'undefined') return;
  try { if ((pwaIOS() || pwaAndroid()) && !pwaStandalone()){ var pb = document.getElementById('pwaBtn'); if (pb) pb.hidden = false; } } catch (e){ LS_ERR = e; }   /* (V19.6، وأندرويد V19.8) */
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    INSTALL_EVT = e;
    var b = document.getElementById('pwaBtn');
    if (b) b.hidden = false;
    try { if (iosNudgeDue()) render(1); } catch (e2){ LS_ERR = e2; }   /* حثُّ أندرويد (V19.7) */
  });
  window.addEventListener('appinstalled', function(){
    INSTALL_EVT = null;
    var b = document.getElementById('pwaBtn');
    if (b) b.hidden = true;
    toast(t('ثُبِّت التطبيق'));
  });
}

function pwaStandalone(){
  try{
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        || window.navigator.standalone === true;
  }catch(e){ return false; }
}
function pwaIOS(){
  try{
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua)
        || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);   /* آيباد يقول Mac */
  }catch(e){ return false; }
}

/* (V19.8) أندرويد كآيفون: خطواتٌ ظاهرةٌ ولو لم يعرض المتصفّحُ حدثَ التثبيت (سامسونج،
   ومتصفّحُ واتساب، وكروم قبل أن يرضى عن الموقع) */
function pwaAndroid(){ try { return /Android/i.test(navigator.userAgent || ''); } catch (e){ return false; } }
function pwaInstall(){
  if (pwaStandalone()){ toast(t('التطبيقُ مثبَّتٌ سلفًا — أنت تعمل عليه الآن')); return; }
  if (INSTALL_EVT){ INSTALL_EVT.prompt(); INSTALL_EVT = null; return; }
  /* آيفونُ لا يُرسِل حدثَ التثبيت أبدًا — والتثبيتُ فيه متاحٌ بخطوتين.
     فقولُ «غير متاح» كذبٌ يمنع نصفَ الميدان من تثبيت التطبيق. */
  if (pwaIOS()){ POP_HELP = 'ios'; render(1); return; }
  if (pwaAndroid()){ lsSet('nsk14.iosNudge', '0'); render(1); return; }   /* خطواتُ أندرويد (V19.8) */
  toast(t('افتح قائمة المتصفّح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'));
}

/* ═══ حثُّ التثبيت على آيفون (V19.6) ═══
   التطبيقُ المفتوحُ من سفاري يفقد مخزنَه أسهلَ ويقطع آيفونُ اتصالَه به بعد الخلفية؛
   والمثبَّتُ على الشاشة الرئيسية يحفظ أثبت. ومن لا يعرف التقنية لا يبحث عن زرِّ
   التثبيت — فيُعرَض عليه بخطواتٍ مصوَّرةٍ بالكلمات بعد الدخول: «تم» يُخفيه شهرًا،
   و«ذكّرني غدًا» يومًا. لا يظهر على أندرويد ولا الحاسوب ولا في المثبَّت. */
/* (V19.7) وأندرويد كذلك: حين يعرض المتصفّحُ حدثَ التثبيت — ضغطةٌ واحدةٌ تثبّت */
function iosNudgeDue(){
  try { if (pwaStandalone() || !(pwaIOS() || pwaAndroid() || INSTALL_EVT)) return false; } catch (e){ return false; }
  if (typeof ROLE !== 'string' || !ROLE || (typeof KIOSK_ON !== 'undefined' && KIOSK_ON)) return false;   /* بعد الدخول فقط */
  return Date.now() > (+lsGet('nsk14.iosNudge') || 0);
}
function iosNudgeHtml(){
  if (!pwaIOS()){   /* أندرويد (V19.8): الزرُّ حين يعرضه المتصفّح، والخطواتُ دائمًا — كآيفون */
    var st2 = function(n, txt){ return '<div style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><b style="flex:0 0 32px;height:32px;border-radius:50%;background:var(--brand);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:17px">' + n + '</b><span style="font-size:16px;line-height:1.7">' + txt + '</span></div>'; };
    return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);z-index:97">'
      + '<div class="pop" style="width:min(520px,100vw);border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">'
      + '<div class="pop-head"><div><h3 style="margin:0;font-size:19px">\u{1F4F2} ' + esc(t('ثبّت التطبيق على جهازك — مرةً واحدة')) + '</h3></div>'
      + btn('\u2715', 'btn-quiet btn-sm', ' data-iosnudge="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
      + '<div class="pop-body" style="padding:14px 18px 8px">'
      + '<p class="hint" style="margin:0 0 6px;font-size:14px">' + esc(t('هكذا يحفظ الجهازُ عملَك فلا يضيع، ويفتح أسرع.')) + '</p>'
      + (INSTALL_EVT ? '<div class="actions" style="margin:6px 0 4px">' + btn('\u2B07 ' + t('ثبّت الآن'), 'btn-primary', ' data-iosnudge="install"') + '</div><p class="hint" style="margin:4px 0 0;font-size:13px">' + esc(t('أو يدويًّا:')) + '</p>' : '')
      + st2('١', esc(t('افتح التطبيقَ في متصفّح Chrome — إن فتحتَه من واتساب: اضغط ⋮ ثم «فتح في Chrome».')))
      + st2('٢', esc(t('اضغط زرَّ القائمة')) + ' <b style="font-size:20px">\u22EE</b> ' + esc(t('أعلى الشاشة.')))
      + st2('٣', esc(t('اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» ثم «تثبيت».')))
      + st2('٤', esc(t('افتح التطبيقَ من الأيقونة الجديدة دائمًا.')))
      + '<p class="hint" style="margin:6px 0 0;font-size:13px">' + esc(t('في متصفّح سامسونج: القائمة ≡ ثم «إضافة صفحة إلى» ثم «الشاشة الرئيسية».')) + '</p>'
      + '<div class="actions" style="margin-top:12px">' + btn(t('تم'), 'btn-primary', ' data-iosnudge="done"') + btn(t('ذكّرني غدًا'), 'btn-quiet', ' data-iosnudge="later"') + '</div>'
      + '</div></div></div>';
  }
  var step = function(n, txt){ return '<div style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><b style="flex:0 0 32px;height:32px;border-radius:50%;background:var(--brand);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:17px">' + n + '</b><span style="font-size:16px;line-height:1.7">' + txt + '</span></div>'; };
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);z-index:97">'
    + '<div class="pop" style="width:min(520px,100vw);border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)">'
    + '<div class="pop-head"><div><h3 style="margin:0;font-size:19px">\u{1F4F2} ' + esc(t('ثبّت التطبيق على جهازك — مرةً واحدة')) + '</h3></div>'
    + btn('\u2715', 'btn-quiet btn-sm', ' data-iosnudge="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div class="pop-body" style="padding:14px 18px 8px">'
    + '<p class="hint" style="margin:0 0 6px;font-size:14px">' + esc(t('هكذا يحفظ الجهازُ عملَك فلا يضيع، ويفتح أسرع.')) + '</p>'
    + step('١', esc(t('اضغط زرَّ المشاركة')) + ' <b style="font-size:20px">\u2B06\uFE0E</b> ' + esc(t('أسفلَ الشاشة.')))
    + step('٢', esc(t('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».')))
    + step('٣', esc(t('افتح التطبيقَ من الأيقونة الجديدة دائمًا.')))
    + '<p class="hint" style="margin:6px 0 0;font-size:13px">' + esc(t('إن فتحتَ الرابطَ من واتساب: اضغط ⋯ ثم «فتح في Safari» أولًا.')) + '</p>'
    + '<div class="actions" style="margin-top:12px">' + btn(t('تم'), 'btn-primary', ' data-iosnudge="done"') + btn(t('ذكّرني غدًا'), 'btn-quiet', ' data-iosnudge="later"') + '</div>'
    + '</div></div></div>';
}
/* شرحُ التثبيت على آيفون — خطوتان لا أكثر */
var POP_HELP = '';
function iosHelpCard(){
  if (POP_HELP !== 'ios') return '';
  return card('تثبيت التطبيق على آيفون',
    '<div class="pop-rows" style="margin:0">'
    + '<div><span class="k">١</span><span>'
    +   esc(t('افتح الصفحة في متصفّح Safari — لا يعمل التثبيت من متصفّحٍ آخر على آيفون.'))
    + '</span></div>'
    + '<div><span class="k">٢</span><span>'
    +   esc(t('اضغط زرَّ المشاركة (المربّع بسهمٍ لأعلى) أسفل الشاشة.'))
    + '</span></div>'
    + '<div><span class="k">٣</span><span>'
    +   esc(t('اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».'))
    + '</span></div>'
    + '</div>'
    + '<p class="hint">' + esc(t('بعدها يفتح التطبيقُ ملءَ الشاشة ويعمل بلا شبكة، وتصله الإشعارات.')) + '</p>',
    btn('فهمت','btn-quiet btn-sm',' data-poph="0"'));
}

/* العلامةُ مرةً واحدةً في الملف — يقرؤها البيانُ والدخولُ والتقارير */
var LOGO = document.querySelector('.brand-mark img') ? document.querySelector('.brand-mark img').src : '';

var MANIFEST = {
  name:'قارئات أفاقي', short_name:'أفاقي',
  start_url:'./', display:'standalone', orientation:'any',
  background_color:'#0A0D10', theme_color:'#185FA5', dir:'rtl', lang:'ar',
  /* الأيقونةُ ملفَّان حقيقيّان في المستودع بالعلامة نفسِها — والـSVG المؤقّتُ
     لا يصلح لآيفون (V16.99) */
  icons:[{ src:'icon-192.png', sizes:'192x192', type:'image/png', purpose:'any' },
         { src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'any' },
         { src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'maskable' }]
};

/* البيانُ ملفٌّ موصولٌ في الرأس — كان يُولَّد هنا `blob:` أيضًا فيزاحمه،
   وأيقونتُه SVG في بيانٍ مؤقّتٍ لا تصلح لآيفون. أُبقيت الدالةُ حارسةً:
   إن غاب الوسمُ من الرأس يومًا وصلته، ولا تُضيف ثانيًا إن وُجد. */
function manifestInject(){
  try{
    if (document.querySelector('link[rel="manifest"]')) return;
    var l = document.createElement('link');
    l.rel = 'manifest'; l.href = 'manifest.webmanifest';
    document.head.appendChild(l);
  }catch(e){}
}
/* ═══ صفحة الدخول — خلفية حية مبنية بالكود ═══
   ١٧٨٧ نقطة تُرسم على شبكة وتنوّر بالتدريج: المشروع يحكي نفسه
   بدل صورة مستعارة. خفيفة، وتحترم prefers-reduced-motion. */

var LOGIN_CSS = `
#login{position:fixed;inset:0;z-index:100;display:grid;place-items:center;
  background:#070A0D;overflow:hidden}
#loginCv{position:absolute;inset:0;width:100%;height:100%}
#login .veil{position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 40%,rgba(7,10,13,.15),rgba(7,10,13,.92) 72%)}
/* أثناء استئناف الجلسة لا يُعرَض النموذج — كان يومض ثم يختفي فيظنّ المستخدمُ أنه خرج */
#login.resuming .box{visibility:hidden}
#login .lg-note{position:relative;z-index:3;color:#fff;font-size:15px}
#login .box{position:relative;z-index:2;width:min(390px,92vw);
  background:rgba(15,20,25,.93);border:1px solid #232B33;border-radius:16px;
  padding:26px 24px;backdrop-filter:blur(10px);box-shadow:0 24px 70px rgba(0,0,0,.6)}
#login .lg{display:flex;align-items:center;gap:11px;margin-bottom:18px}
#login .lgm{width:64px;height:46px;border-radius:11px;background:#fff;
  display:grid;place-items:center;padding:5px 7px;flex:0 0 auto;overflow:hidden}
.lgm img{width:100%;height:auto;display:block}
#login h1{font-size:19px;color:#E8EBEE;line-height:1.3}
#login .sub{font-size:12.5px;color:#8A939D;margin-top:2px}
#login .cnt{font-size:12px;color:#5FA8E8;margin:0 0 16px;font-variant-numeric:tabular-nums}
#login label{display:block;font-size:12.5px;color:#9BA5AF;margin:0 0 5px}
#login input,#login select{width:100%;background:#0B1014;border:1px solid #2A333C;
  border-radius:9px;padding:11px 12px;color:#E8EBEE;font:inherit;min-height:44px;margin-bottom:13px}
#login input:focus,#login select:focus{outline:2px solid #185FA5;border-color:#185FA5}
#login .rem{display:flex;align-items:center;gap:9px;margin:2px 0 14px;
  font-size:13px;color:#C6CFD7;cursor:pointer;user-select:none}
#login .rem input{width:18px;height:18px;accent-color:#185FA5;cursor:pointer;margin:0}
#login .go{width:100%;background:#185FA5;color:#fff;border:0;border-radius:9px;
  padding:13px;font:inherit;font-weight:600;cursor:pointer;min-height:48px}
#login .go:active{transform:scale(.99)}
#login .note{font-size:11.5px;color:#6C757E;text-align:center;margin:14px 0 0;line-height:1.6}
#login .langs{display:flex;gap:6px;justify-content:center;margin:16px 0 0}
#login .langs button{background:transparent;border:1px solid #2A333C;color:#9BA5AF;
  border-radius:99px;padding:6px 14px;font:inherit;font-size:12px;cursor:pointer;min-height:34px}
#login .langs button.on{background:#185FA5;border-color:#185FA5;color:#fff}
`;

/* الاسمُ المحفوظُ من آخر دخولٍ — إن أذن صاحبُه */
function lgRemembered(){
  try { return localStorage.getItem('nsk14.user') || ''; } catch (e){ return ''; }
}

/* جلسةٌ محفوظةٌ تُفتَح بلا كلمة: Firebase يحفظ الجلسةَ في المتصفّح بطبعه،
   ونحن كنّا لا نسأل عنها فنطلب الكلمةَ في كلِّ فتحة — والفنيُّ في المشاعر
   يفتح التطبيقَ عشرين مرةً في اليوم.
   والكلمةُ لا تُخزَّن على الجهاز أبدًا: جهازُ الميدان يُفقَد ويُعار،
   والجلسةُ تُبطَل من لوحة Firebase أمّا الكلمةُ المخزَّنةُ فلا تُبطَل. */
function autoSignIn(){
  /* لا يُشتَرَط «تذكّرني»: جلسةُ Firebase قائمةٌ بعد إعادة التحميل سواءٌ حُفظ
     الاسمُ أم لا — وحفظُ الاسم زينةٌ لملء الحقل لا شرطٌ لبقاء الجلسة.
     وكان الشرطُ يُطلَب معه الدخولُ من جديدٍ بعد كلِّ تحديثٍ للصفحة. */
  return FB.init().then(function(ok){
    if (!ok || !FB.auth) return false;
    return new Promise(function(res){
      var done = false;
      var stop = setTimeout(function(){ if (!done){ done = true; res(false); } }, 6000);
      try {
        FB.auth.onAuthStateChanged(function(u){
          if (done) return;
          done = true; clearTimeout(stop);
          if (!u){ res(false); return; }
          STATE.meta.uid = u.uid;
          STATE.meta.online = true;
          DB.col('users').doc(u.uid).get().then(function(doc){
            FB.readCount = (FB.readCount || 0) + doc.size;
            var v = doc.exists ? (doc.data() || {}) : {};
            /* الوثيقةُ تُحفَظ في مكانها ليُرى وجودُها في بطاقة الهوية —
               ولئلّا يُقال «لم تُسحَب» عن موجودة. */
            MYDOC.at = Date.now(); MYDOC.has = !!doc.exists;
            if (doc.exists){ STATE.users = STATE.users || {}; STATE.users[u.uid] = Object.assign({}, v); }
            STATE.meta.name = v.name || lgRemembered();
            ROLE = isBossHere() ? 'admin' : (ROLES[v.role] ? v.role : 'tech');
            STATE.meta.role = ROLE;
            /* كلمةٌ مؤقتةٌ من الورقة: تُبدَّل قبل أيِّ عمل */
            if (v.mustChange) setTimeout(function(){ pwOpen(true); }, 600);
            res(true);
          }).catch(function(){ res(true); });
        });
      } catch (e){ done = true; clearTimeout(stop); res(false); }
    });
  }).catch(function(){ return false; });
}

function bootAuto(){
  var lg = document.getElementById('login');
  if (!lg) return;
  var note = document.createElement('div');
  note.className = 'hint lg-note';
  note.style.cssText = 'text-align:center;margin:12px 0 0';
  note.textContent = t('يُبحَث عن جلسةٍ مفتوحة…');
  /* من دخل من قبلُ على هذا الجهاز لا يرى النموذجَ يومض — يرى «يُستأنَف الدخول»
     ثم صفحتَه التي كان عليها. ومن لا جلسةَ له يرى النموذجَ كما كان. */
  var had = lsGet('nsk14.session') === '1';
  if (had){ lg.classList.add('resuming'); note.textContent = t('يُستأنَف الدخول…'); }
  try { lg.appendChild(note); } catch (e){}
  autoSignIn().then(function(ok){
    try { note.remove(); } catch (e){}
    if (!ok){ lg.classList.remove('resuming'); return; }
    /* يُظهَر الهيكلُ كما يفعل الدخولُ اليدويّ: `#app` يبدأ `display:none`،
       وكان يُخفى الدخولُ ولا يُظهَر الهيكل — فتبقى الصفحةُ فارغةً تمامًا،
       لا شاشةَ دخولٍ ولا تطبيق. */
    enterShell();
    /* كانتا تُنادَيان على CORE وهما على FB — فينفجر الوعدُ بعد الدخول التلقائيِّ
       ولا يُنصَت ولا يُسحَب ولا يُدفَع الطابورُ حتى يُضغَط بيد. */
    bootStage('pull');   /* (V34.2) */
    var first = FB.legacyDone() ? Promise.resolve(0) : FB.pullLegacy();
    first.then(function(){ return FB.pullStatic().catch(function(){ return 0; }); })
         .then(function(){ return pullDelta(); }).then(function(){ liveWatch(); liveSmall(); pulseWatch(); presenceBeat(true); return 0; })
         .then(function(){ statBump(); render(1); syncBadge(); })
         .catch(function(e){
           softErr('بدء الجلسة', e, 'دخلتَ — وتعذّر جلبُ البيانات، جرّب المزامنة');
           render(1);
         });
    logEvent('دخولٌ بجلسةٍ محفوظة');
  });
}


function loginPaint(){
  var el = document.getElementById('login');
  if (!el) return;
  el.innerHTML =
      '<canvas id="loginCv" aria-hidden="true"></canvas><div class="veil"></div>'
    + '<div class="box">'
    +   '<div class="lg"><div class="lgm"><img src="' + LOGO + '" alt="AFAQY" width="380" height="133"></div><div>'
    +     '<h1>'+esc(t('قارئات أفاقي'))+'</h1>'
    +     '<div class="sub">'+esc(t('نظام متابعة تركيب قارئات الحجاج'))+'</div></div></div>'
    +   '<p class="cnt" id="lgCount">'+nm(0)+' / '+nm(siteStats().total)+' '+esc(t('نقطة'))+' · '+esc(t('المشاعر المقدسة'))+'</p>'
    +   '<label for="lgU">'+esc(t('اسم المستخدم'))+'</label>'
    +   '<input id="lgU" dir="ltr" autocomplete="username" placeholder="m.safwat">'
    +   '<label for="lgP">'+esc(t('كلمة المرور'))+'</label>'
    +   '<input id="lgP" type="password" dir="ltr" autocomplete="current-password" placeholder="••••••••">'
    +   '<label class="rem" for="lgRem">'
    +     '<input type="checkbox" id="lgRem"' + (lgRemembered() ? ' checked' : '') + '>'
    +     '<span>' + esc(t('تذكّرني على هذا الجهاز')) + '</span></label>'
    +   '<button type="button" class="go" id="lgGo">'+esc(t('دخول'))+'</button>'
    /* ═══ التفعيلُ الذاتيّ ═══
       بمئةٍ وخمسين شخصًا لا يصحُّ أن يقف كلُّ حسابٍ على المكتب: يُسجّل
       المهندسُ الاسمَ والدورَ فحسب، ويفتح صاحبُه التطبيقَ فيضع كلمتَه هو
       ويدخل. فلا كلمةَ تُرسَل في محادثة، ولا يُنتظَر أحدٌ ليفعّل، ولا
       يُعاد الإنشاءُ حين تتعثّر الشبكةُ لحظة. */

    +   '<div class="langs" id="lgLangs">'
    +     ['ar','en','ur'].map(function(l){
            return '<button type="button" data-l="'+l+'" class="'+(LANG===l?'on':'')+'">'+I18N[l].name+'</button>';
          }).join('')
    +   '</div>'
    +   '<p class="note">'+esc(t('لا تسجيل ذاتي — الحسابات تُنشأ من المكتب'))+'</p>'
    + '</div>';

  function go(){
    var u = (document.getElementById('lgU') || {}).value || '';
    var p = (document.getElementById('lgP') || {}).value || '';
    var rm = document.getElementById('lgRem');
    /* يُحفَظ الاسمُ لا الكلمة. وكلمةُ المرور لا تُخزَّن على الجهاز أبدًا:
       جهازُ الميدان يُفقَد ويُعار، والاسمُ وحده لا يفتح شيئًا. */
    try {
      /* الاسمُ يُحفَظ ليُملأ الحقلُ في المرة القادمة. والكلمةُ لا تُحفَظ
         أبدًا — جهازُ الميدان يُفقَد ويُعار. */
      if (rm && rm.checked) localStorage.setItem('nsk14.user', u);
      else localStorage.removeItem('nsk14.user');
    } catch (e){}
    enterApp(u, p);
  }
  var lastU = lgRemembered();
  if (lastU){
    var uEl = document.getElementById('lgU');
    if (uEl) uEl.value = lastU;
    var pEl = document.getElementById('lgP');
    if (pEl) try { pEl.focus(); } catch (e){}
  }
  document.getElementById('lgGo').onclick = go;

  document.getElementById('lgP').onkeydown = function(e){ if (e.key === 'Enter') go(); };
  document.getElementById('lgLangs').onclick = function(e){
    var b = e.target.closest('[data-l]');
    if (b){ setLang(b.getAttribute('data-l')); }
  };
  loginBg();
}

function loginBg(){
  var cv = document.getElementById('loginCv');
  if (!cv) return;
  var ctx = null;
  try{ ctx = cv.getContext('2d'); }catch(e){}
  if (!ctx) { cv.style.display = 'none'; return; }   /* زينة تُهمَل لا تُسقط الصفحة */
  var pts = [], lastN = -1, TOT = siteStats().total;
  var slow = false;
  try{ slow = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
  /* (V32.9) الوحدة ١٠ — أوّلُ فتحٍ أسرع: الخلفيةُ كانت ترسم ١٬٩٠٠ نقطةٍ في كلِّ إطارٍ بلا توقّف وتكتب العدّادَ في الصفحة كلَّ إطار —
     نحوُ ثانيةٍ من المعالج على جوالٍ متوسطٍ قبل ظهور نموذج الدخول وأثناء الكتابة فيه. صارت: دورةً واحدةً ثم تقف على الصورة الكاملة،
     بعشرين إطارًا في الثانية، والعدّادُ يُكتب حين يتغيّر، وتبدأ بعد ظهور النموذج؛ والجهازُ الضعيفُ يرى الصورةَ الكاملةَ ثابتة. */
  /* (V33.9) بلاغُ المالك «كانت ديناميك في الفتحة وبقت ثابتة»: قاعدةُ «المعالجُ ≤ ٤ أنوية = صورةٌ ثابتة» كانت تُطفئ الحركةَ على الآيفون
     (يُبلّغ أربعةً أو أقل) — أُلغيت؛ ولا تُطفَأ إلا بإعداد «تقليل الحركة». والحركةُ مستمرةٌ ما دامت شاشةُ الدخول ظاهرة (وأثناء «يُستأنَف الدخول»)
     بعشرين إطارًا، وتقف وحدَها حين تختفي الشاشة — فلا تأكل المعالجَ بعد الدخول كما كان قبل V32.9. */

  function build(){
    var w = cv.width = cv.offsetWidth * (window.devicePixelRatio || 1);
    var h = cv.height = cv.offsetHeight * (window.devicePixelRatio || 1);
    pts = [];
    var cols = Math.max(24, Math.round(w / 26));
    var rows = Math.ceil(TOT / cols);
    var gx = w / (cols + 1), gy = Math.min(gx, h / (rows + 1));
    var oy = (h - gy * (rows - 1)) / 2;
    for (var i = 0; i < TOT; i++){
      var c = i % cols, r = Math.floor(i / cols);
      pts.push({
        x: gx * (c + 1) + (Math.sin(i * 12.9898) * gx * 0.18),
        y: oy + gy * r + (Math.cos(i * 78.233) * gy * 0.18),
        d: (i / TOT) + Math.abs(Math.sin(i * 4.1)) * 0.12
      });
    }
  }

  function draw(prog){
    var w = cv.width, h = cv.height, dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    var n = 0;
    for (var i = 0; i < pts.length; i++){
      var p = pts[i], on = p.d <= prog;
      if (on) n++;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (on ? 1.9 : 1.05) * dpr, 0, 6.2832);
      ctx.fillStyle = on ? 'rgba(55,138,221,.9)' : 'rgba(90,102,115,.24)';
      ctx.fill();
      if (on && i % 17 === 0){
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5 * dpr, 0, 6.2832);
        ctx.fillStyle = 'rgba(55,138,221,.10)';
        ctx.fill();
      }
    }
    if (n !== lastN){ lastN = n; var c = document.getElementById('lgCount');
      if (c) c.textContent = nm(n) + ' / ' + nm(TOT) + ' ' + t('نقطة') + ' \u00b7 ' + t('المشاعر المقدسة'); }
  }

  build();
  if (slow){ draw(1.2); return; }

  /* ═══ (V34.1) بلاغُ المالك: «A problem repeatedly occurred» على الآيفون بعد V33.9 ═══
     الحركةُ المستمرةُ كانت ترسم ١٬٩٠٠ نقطةٍ عشرين مرةً في الثانية على لوحةٍ بكثافة شاشة الآيفون (×٣) — وأثناء «يُستأنَف الدخول»
     نفسِه حين يحمّل التطبيقُ بياناته — فيختنق محرّكُ الصفحة ويُقتَل. والحركةُ الآن بلا رسمٍ متكرّر: الصورةُ تُرسَم مرةً واحدة،
     وفوقها وهجٌ يتحرّك بـCSS (تتولّاه بطاقةُ الرسوم لا المعالج). وبعد أيِّ إقلاعٍ مات فجأةً (BOOT_GUARD) لا وهجَ ولا حركة. */
  draw(1.2);
  var calm = slow || (typeof BOOT_GUARD === 'object' && BOOT_GUARD.crashes > 0);
  if (!calm && !document.getElementById('lgShine')){
    var sh = document.createElement('div'); sh.id = 'lgShine'; sh.setAttribute('aria-hidden', 'true');
    /* بعد الستار المعتِم وقبل بطاقة الدخول — ترتيبُ الصفحة يضعه فوق النقاط وتحت البطاقة */
    try { var veil = cv.parentNode.querySelector('.veil'); cv.parentNode.insertBefore(sh, (veil || cv).nextSibling); } catch (e){ LS_ERR = e; }
  }
  window.addEventListener('resize', function(){ build(); draw(1.2); }, { passive:true });
  cv.__stop = function(){ var e = document.getElementById('lgShine'); if (e) e.remove(); };
}

/* ═══ الميدان — الخريطة أولًا ═══ */

var FIELD_MODE = 'survey', FIELD_PREV = 'survey';
var EXP_OPEN = false;
var POP_SITE = '';
var CO_OPEN = false;
/* يبقى التلوينُ بعد إغلاق اللوح حتى يُطفأ صراحةً */
var CO_MODE = false;
var CO_Q = '', TK_Q = '', IT_Q = '', JB_Q = '';
var MAP_SAT = true;   /* (V25.1) القمرُ الصناعيُّ هو الأساس بقرار المالك — والشوارعُ بالزرّ نفسِه */
var MAP_FILT_OPEN = false;
var CO_SEL = [];
/* القائمةُ الموحّدة — تُبنى من بيانات المشروع نفسها لا تُكتَب بيد.
   كانت عشرةَ أسماءٍ مخترعةٍ بينما الشاشةُ تقول «مئةٌ واثنتان وستون شركة»،
   والميدانُ يختار من قائمةٍ لا تشبه ما في السجل. */

/* ═══ الاسمُ المركَّبُ يُفَكّ ═══
   إحدى وثلاثون قيمةً في القائمة تحمل أكثرَ من شركةٍ في نصٍّ واحدٍ مفصولةٍ
   بفاصلة — مخيّمٌ تخدمه عدةُ شركات، أُدخل اسمُها كما جاء في الملف. فتظهر
   في المنتقي سطرًا واحدًا طويلًا لا يُقرأ، ولا تُختار شركةٌ منها بمفردها،
   ولا تُحسَب لها نقاطُها.
     والفكُّ بالفاصلة وحدَها لا بكلِّ «شركة»: «شركة شخص واحد» و«شركة ذات
   مسؤولية محدودة» صيغتان قانونيتان تلحقان الاسمَ ولا تصنعان شركةً ثانيةً —
   ومن فكَّ عندهما صنع من الواحدة اثنتين. فما لا يبدأ بكلمةِ كيانٍ يُضَمُّ
   إلى ما قبله، وكذلك الصيغُ القانونية. */

/* ═══ لوحةُ الشركات ═══
   القائمةُ وحدَها لا تُجيب: كم شركةً عندنا؟ وكم منها يخدم أكثرَ من مخيّم؟
   وكم في القائمة ولا مخيّمَ له؟ وكم بقي من الأسماء المركَّبة؟ فتُقرأ الأرقامُ
   أوّلًا ثم تُفتَح القائمة. والعدُّ بعد فكِّ المركَّبات — فيُحسَب المخيّمُ
   المشتركُ لكلِّ شركةٍ تخدمه لا لسطرٍ يحمل أسماءها ملتصقة. */
function coDash(){
  var byCo = {}, multi = 0, totalSites = 0;
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    totalSites++;
    coSplit(x.co).forEach(function(one){
      (byCo[one] = byCo[one] || { n:0, zones:{} }).n++;
      if (x.zone) byCo[one].zones[x.zone] = 1;
    });
  });
  var served = Object.keys(byCo);
  served.forEach(function(c){ if (byCo[c].n > 1) multi++; });
  var idle = CO_LIST.filter(function(c){ return !byCo[c]; }).length;
  var top = served.slice().sort(function(a, b){ return byCo[b].n - byCo[a].n; }).slice(0, 8);
  return { byCo:byCo, served:served.length, multi:multi, idle:idle,
           cmp:Object.keys(coCompounds()).length, top:top, sites:totalSites };
}
/* ═══ مخيّماتُ الشركة مصنَّفةً ═══
   من حلقةٍ واحدةٍ بالتعريف نفسِه المستعمَل في «نظرة عامة»: تمَّ المسحُ = وصل
   وسجّل ولم يُردّ؛ المتعذّرُ = وصل ولم يستطع؛ تمَّ التركيبُ = حالةُ التركيب. */
var CO_BK = null;   /* (V26.2) كانت تُحسَب لكلِّ شركةٍ بحلقةٍ على المواقع كلِّها (٤٢ شركة × ١٬٨٠٠ موقع في الرسمة) — صارت حلقةً واحدةً تُصفَّر مع الرسمة */
function coBucketsAll(){
  if (CO_BK) return CO_BK;
  var M = {};
  (STATE.sites || []).forEach(function(x){
    var co = x.co; if (!co) return;
    var out = M[co] || (M[co] = { all:[], sv:[], stuck:[], ins:[] });
    out.all.push(x);
    var r = STATE.recs[x.id];
    if (svVisited(r)) out.sv.push(x);   /* (V32.6) */
    else if (r && r.review !== 'revisit') out.stuck.push(x);
    var i2 = STATE.inss[x.id];
    if ((i2 && i2.status === 'مُركّب') || x.fstat === 'مُركّب') out.ins.push(x);
  });
  CO_BK = M; return M;
}
function coBuckets(co){ return coBucketsAll()[co] || { all:[], sv:[], stuck:[], ins:[] }; }
var CO_POP = null;   /* { co, kind } */
var CO_POP_LBL = { all:'كلُّ المخيّمات', sv:'تمت الزيارة', stuck:'تحتاج زيارة أخرى تقنيًا', ins:'تمّ التركيب' };
function coPopRows(co, kind){
  var B = coBuckets(co), L = B[kind] || [];
  return L.map(function(x){
    var r = STATE.recs[x.id] || {}, i2 = STATE.inss[x.id] || {};
    var chal = (r.chals || []).filter(function(c){ return c !== 'لا توجد تحديات'; });
    return { x:x, r:r,
      why: kind === 'stuck' ? (r.reason || r.note || '—')
         : (chal.length ? chal.join(' \u00b7 ') : (r.note || '—')),
      who: r.by || '—', when: r.at ? dayKey(r.at) : '—',
      st: i2.status || x.fstat || (r.id ? svLabel(r) : 'لم يُزر') };
  });
}
function coPopHtml(){
  if (!CO_POP) return '';
  var co = CO_POP.co, kind = CO_POP.kind, L = coPopRows(co, kind);
  var rows = L.map(function(o){
    var x = o.x;
    return ['<strong>' + esc(siteKey(x) !== x.id ? siteKey(x) : (x.name || x.id)) + '</strong><br><span class="num hint">' + esc(x.id) + '</span>',
            esc(x.sign || '—'),
            esc(t(x.zone || '—')) + (x.sq ? ' \u00b7 ' + esc(x.sq) : ''),
            esc(o.why.slice(0, 90)),
            esc(o.who) + '<br><span class="num hint">' + esc(o.when) + '</span>',
            pill(o.st, o.st === 'مُركّب' ? 'ok' : (o.st === 'متعذّر' ? 'bad' : 'wrn')),
            /* `data-cogo` محجوزةٌ منذ V14 لزرَّي «عرض» و«مسح التحديد» في مرشِّح
               الشركات على الخريطة — فمعالجُ النافذة الجديد كان يخطف ضغطتَهما
               ويفتح شاشةَ الاعتماد. اسمٌ خاصٌّ بها: `data-comap`. */
            (x.lat && x.lng ? btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-comap="' + esc(x.id) + '"') : '')
            + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-copopsite="' + esc(x.id) + '"')];
  });
  return '<div id="coPopWrap" class="co-pop-wrap">'
    + '<div class="co-pop" role="dialog" aria-modal="true">'
    + '<div class="co-pop-head">'
    +   '<div><strong>' + esc(coName(co)) + '</strong>'
    +   '<div class="hint" style="margin:2px 0 0">' + esc(t(CO_POP_LBL[kind] || '')) + ' \u00b7 ' + nm(L.length) + ' ' + esc(t('مخيّم')) + '</div></div>'
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-copopxls="1"')
    +     btn('\u2715','btn-quiet btn-sm',' data-copopx="1" aria-label="' + esc(t('إغلاق')) + '"')
    +   '</div></div>'
    + '<div class="co-pop-body">'
    + (rows.length ? table(['المخيّم','الشاخص','الموقع', kind === 'stuck' ? 'سببُ التعذّر' : 'التحديات والملاحظات','مَن ومتى','الحالة',''], rows)
                   : '<p class="hint" style="padding:18px;text-align:center;margin:0">' + esc(t('لا مخيّماتٍ في هذه الخانة.')) + '</p>')
    + '</div></div></div>';
}
function coPopXls(){
  if (!CO_POP) return;
  var L = coPopRows(CO_POP.co, CO_POP.kind);
  var out = [['المخيّم','المعرّف','الشاخص','المشعر','المربع','التحديات/السبب','مَن','متى','الحالة','خط العرض','خط الطول']];
  L.forEach(function(o){ var x = o.x;
    out.push([x.name || '', x.id, x.sign || '', x.zone || '', x.sq || '', o.why, o.who, o.when, o.st, x.lat || '', x.lng || '']); });
  xlsSheets([[t(CO_POP_LBL[CO_POP.kind] || 'مخيّمات'), out]], 'أفاقي — ' + coName(CO_POP.co));
}
function coDashCard(){
  var D = coDash();
  return stats([['شركاتٌ في القائمة', N(CO_LIST.length), 'acc'],
                ['لها مخيّمات', N(D.served), D.served ? 'ok' : 'wrn'],
                ['على أكثرَ من مخيّم', N(D.multi), D.multi ? 'acc' : ''],
                ['في القائمة بلا مخيّم', N(D.idle), D.idle ? 'wrn' : 'ok'],
                ['أسماءٌ مركَّبةٌ لم تُوحَّد', N(D.cmp), D.cmp ? 'bad' : 'ok'],
                ['مواقعُ لها شركة', N(D.sites)]])
    + (D.top.length
      ? cardFlush('\u{1F3E2} ' + t('الأكثرُ مخيّمات'),
          table(['الشركة','مخيّماتها','مشاعرها'],
            D.top.map(function(c){
              var lb = coName(c);
              return [esc(lb.length > 44 ? lb.slice(0, 43) + '\u2026' : lb),
                      '<b class="num">' + nm(D.byCo[c].n) + '</b>',
                      esc(Object.keys(D.byCo[c].zones).map(function(z){ return t(z); }).join(' \u00b7 '))];
            })))
      : '');
}
var CO_CMP = null, CO_CMP_KEYS = [];
var CO_HEAD = /^(شرك[ةه]|مؤسس[ةه]|مكتب|مجموع[ةه]|مصنع|جمعي[ةه])\s/;
var CO_FORM = /^شرك[ةه]\s+(شخص\s+واحد|ذات\s+مسؤولي[ةه]\s+محدود[ةه]|مساهم[ةه]|تضامن|توصي[ةه]\s+بسيط[ةه])\s*$/;
function coSplit(v){
  var raw = String(v || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
  if (!raw) return [];
  var parts = raw.split(/\s*[،,؛;|]\s*/).map(function(x){ return x.trim(); }).filter(Boolean);
  var out = [];
  parts.forEach(function(x){
    /* صيغةٌ قانونيةٌ أو جزءٌ لا يبدأ بكيان: يعود إلى ما قبله */
    if (out.length && (CO_FORM.test(x) || !CO_HEAD.test(x))) out[out.length - 1] += '، ' + x;
    else out.push(x);
  });
  return out.length ? out : [raw];
}
/* شركاتُ نقطةٍ بعينها — واحدةٌ في الغالب، وقد تكون عدةً في المخيم المشترك */
function siteCos(x){ return coSplit(x && x.co); }
function coCompounds(){
  var m = {};
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    var pr = coSplit(x.co);
    if (pr.length < 2) return;
    if (!m[x.co]) m[x.co] = { parts:pr, n:0, ids:[] };
    m[x.co].n++;
    if (m[x.co].ids.length < 12) m[x.co].ids.push(x.id);
  });
  return m;
}
/* تُسنَد نقاطُ قيمةٍ مركَّبةٍ إلى واحدةٍ من أجزائها */
function coPick(raw, part){
  if (!may('settings')){ toast(t('توحيدُ الأسماء للمهندس وحده')); return 0; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.co !== raw) return;
    x.co = part; n++;
    CORE.set('sites', x.id, { co:part });
  });
  if (n){
    coFill(); statBump();
    logEvent('توحيد اسم مركَّب — ' + nm(n) + ' نقطة \u2190 ' + part);
    toast(nm(n) + ' ' + t('نقطةً صارت لـ') + ' ' + part);
    render(1);
  }
  return n;
}
var CO_LIST = [];
function coFill(){
  var seen = {}; CO_LIST.length = 0;
  /* والأسماءُ التي تحملها السجلاتُ نفسها: أحدَ عشرَ اسمًا في المواقع لم تكن
     في القائمتين، فكان الميدانُ يُمنَع من إعادة اختيار شركةٍ قائمةٍ في سجلّه. */
  var onRows = (SITES_RAW.g || []).concat(SITES_RAW.p || []).map(function(r){ return r[9]; });
  /* والشركاتُ المعتمدةُ من الطلبات — كانت تُضاف للقائمة لحظةَ الاعتماد ثم
     تُنسى عند إعادة التحميل، فتعود الشركةُ «غيرَ موجودة» بعد يوم. */
  var approved = Object.keys(STATE.coreqs || {}).filter(function(k){
    return STATE.coreqs[k] && STATE.coreqs[k].status === 'معتمد'; })
    .map(function(k){ return STATE.coreqs[k].name || k; });
  [].concat(SITES_RAW.co || [], SITES_RAW.dm || [], onRows, approved).forEach(function(c){
    /* القائمةُ أسماءٌ مفردة: القيمةُ المركَّبةُ تدخل مفكوكةً — ويبقى الأصلُ
       على النقطة حتى يُوحَّد من شاشة الشركات. */
    coSplit(c).forEach(function(one){
      if (one && !seen[one]){ seen[one] = 1; CO_LIST.push(one); }
    });
  });
  CO_LIST.sort(arCmp);
  return CO_LIST.length;
}
coFill();   /* بعد التعريف لا قبله — البياناتُ أعلى في الملف والقائمةُ هنا */

/* الزاوية الذهبية توزّع الأطياف فلا يتجاور لونان متشابهان مهما كثرت الشركات */
function coColor(name){
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  var idx = CO_LIST.indexOf(name);
  var seed = idx > -1 ? idx : h;
  return 'hsl(' + Math.round((seed * 137.508) % 360) + ',62%,58%)';
}

function coFiltHtml(){
  /* الرأسُ والذيلُ ثابتان والقائمةُ وحدَها تُمرَّر: كان اللوحُ كلُّه يُمرَّر،
     فيغيب زرُّ الإغلاق ويغيب «عرض» عمن نزل في مئةٍ واثنتين وستين شركةً — فيبحث
     عنهما بالتمرير صعودًا ونزولًا في كلِّ مرة. */
  var shown = CO_LIST.filter(function(c){ return coHit(c, CO_Q); });
  var allOn = shown.length > 0 && shown.every(function(c){ return CO_SEL.indexOf(c) > -1; });
  return '<div class="pop copop" id="coFilt">'
    + '<div class="pop-head">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
    +     '<h3 style="color:var(--ink);margin:0">' + esc(t('اختر الشركات')) + '</h3>'
    +     '<button type="button" class="btn btn-quiet btn-sm" data-co="0" aria-label="'
    +       esc(t('إغلاق')) + '">✕</button>'
    +   '</div>'
    +   '<input type="search" id="coQ" data-coq="1" value="' + esc(CO_Q) + '" placeholder="'
    +     esc(t('ابحث باسم الشركة')) + '" spellcheck="false" style="margin:11px 0 0">'
    + '</div>'

    + '<div class="pop-body" id="coL">'
    +   (shown.length
        ? shown.map(function(c){
            var on = CO_SEL.indexOf(c) > -1;
            return '<label class="coRow" data-c="' + esc(c) + '">'
              + '<input type="checkbox" class="coCk"' + (on ? ' checked' : '') + '>'
              + '<i style="background:' + coColor(c) + '"></i>'
              + '<span>' + esc(c) + '</span></label>';
          }).join('')
        : '<p class="hint" style="text-align:center;padding:20px 0;margin:0">'
          + esc(t('لا شركةَ بهذا الاسم.')) + '</p>')
    + '</div>'

    + '<div class="pop-foot">'
    +   '<div class="actions" style="margin:0">'
    +     btn(allOn ? 'أزِل تحديد الكل' : 'حدّد الكل', 'btn-secondary btn-sm',
              ' data-coall="' + (allOn ? '0' : '1') + '"')
    +     btn('عرض', 'btn-primary btn-sm', ' data-cogo="1"')
    +     btn('مسح التحديد', 'btn-quiet btn-sm', ' data-cogo="0"')
    +   '</div>'
    +   '<p class="hint" style="font-size:11.5px;margin:9px 0 0">'
    +     nm(shown.length) + ' ' + esc(t('من')) + ' ' + nm(CO_LIST.length) + ' '
    +     esc(t('شركة')) + (CO_SEL.length ? ' · ' + nm(CO_SEL.length) + ' ' + esc(t('محدَّدة')) : '')
    +     ' — ' + esc(t('لكل واحدة لونٌ ثابت فلا يتجاور لونان متشابهان.'))
    +   '</p>'
    + '</div></div>';
}
var MAP_SEL = {};

/* الأسطورةُ تتبع الطبقة: لكلٍّ حالاتُها، ولكلِّ نوعٍ شكلُه ولونُه */
function legendRows(){
  if (CO_OPEN || CO_MODE){
    /* لا معنى لأسطورة الحالات ولونُ النقطة لشركتها */
    var seen = {}, out = [];
    (typeof filtered === 'function' ? filtered() : STATE.sites).forEach(function(x){
      if (!x.co || seen[x.co]) return;
      seen[x.co] = 1;
      if (out.length < 12) out.push(x.co);
    });
    return '<div style="font-weight:700;margin:0 0 6px">' + esc(t('لون الشركات')) + '</div>'
      + out.map(function(c){
          return '<div><span class="dot" style="background:' + coColor(c) + '"></span>'
            + esc(c.length > 22 ? c.slice(0, 21) + '…' : c) + '</div>';
        }).join('')
      + (Object.keys(seen).length > out.length
          ? '<div class="hint" style="margin:6px 0 0">' + esc(t('و')) + ' '
            + nm(Object.keys(seen).length - out.length) + ' ' + esc(t('شركةً أخرى')) + '</div>'
          : '');
  }
  var L = (typeof LAYER === 'function') ? LAYER() : LAYERS.survey;
  var rows = [];
  /* ═══ الأسطورةُ تعدُّ ═══
     كانت تقول «معتمدة» ولا تقول كم — فيبقى السؤالُ الأوّلُ بلا جواب: «كم
     نقطةً في كلِّ حالة؟». صارت تعدُّ ما هو معروضٌ في الطبقة الحالية بعد
     الترشيح، فالرقمُ يوافق ما تراه العينُ لا ما في القاعدة كلِّها. */
  var CNT = {}, TOT = 0;
  (function(){
    var LST = (typeof layerFiltered === 'function') ? layerFiltered()
            : (typeof filtered === 'function' ? filtered() : STATE.sites);
    LST.forEach(function(x){
      var k;
      if (FIELD_MODE === 'survey') k = lifeOf(x);
      else if (FIELD_MODE === 'brief') k = briefStage(x.id);
      else if (FIELD_MODE === 'install') k = insDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      else k = disDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      CNT[k] = (CNT[k] || 0) + 1; TOT++;
    });
  })();
  if (FIELD_MODE === 'survey'){
    /* الأسطورةُ تُشتقُّ من دورة الحياة نفسِها — فلا تفترق عن الخريطة */
    rows = LIFE_ORDER.map(function(k){ return [LIFE[k].c, LIFE[k].n, k]; });
  } else if (FIELD_MODE === 'brief'){
    rows = BRIEF_STAGE_ORDER.map(function(k){ return [BRIEF_STAGE[k].c, BRIEF_STAGE[k].n, k]; });
  } else if (FIELD_MODE === 'install'){
    rows = [[LIFE.ready.c,'معتمدة — جاهزة للإسناد','wait'], [LIFE.sched.c,'مُسندة للتركيب','asn'], [L.c,'مُركّب','done']];
  } else {
    rows = [['#E8C34B','قابل للفك','wait'], ['#FF8C42','مجدول للفك','asn'], [L.c,'تم الفك','done']];
  }
  out = rows.map(function(r){   /* (V31.4) `out` مُعلَنٌ أعلى الدالة */
    var n = CNT[r[2]] || 0;
    /* الحالةُ الخاليةُ تخفت ولا تختفي — فيُعرَف أنها حالةٌ قائمةٌ لا شيءَ فيها */
    return '<div class="lg-row' + (n ? '' : ' lg-off') + '">'
      + '<i class="lg-dot" style="background:' + r[0] + '"></i>'
      + '<span class="lg-n">' + esc(t(r[1])) + '</span>'
      + '<b class="num lg-c">' + nm(n) + '</b></div>';
  }).join('')
  + '<div class="lg-row lg-tot"><span class="lg-n">' + esc(t('في هذا الترشيح')) + '</span>'
  + '<b class="num lg-c">' + nm(TOT) + '</b></div>';
  /* وفي طبقة التفاصيل: الإطارُ خبرٌ ثانٍ فوق لون المرحلة — يُقال في أسطورتها */
  if (FIELD_MODE === 'brief'){
    var BC = { 'تمام':0, 'تحدٍّ':0, 'ملاحظة':0 }, noB = 0;
    ((typeof layerFiltered === 'function') ? layerFiltered() : []).forEach(function(x){
      var b = briefOf(x.id);
      if (b && BC[b.st] !== undefined) BC[b.st]++; else noB++;
    });
    out += '<div class="lg-sep"></div>'
      + '<div style="font-weight:700;margin:0 0 4px">' + esc(t('إطارُ النقطة — التفاصيل المكتوبة')) + '</div>'
      + BRIEF_ST.map(function(k){
          return '<div class="lg-row' + (BC[k] ? '' : ' lg-off') + '">'
            + '<i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 2px ' + BRIEF_C[k] + '"></i>'
            + '<span class="lg-n">' + esc(t(k)) + '</span><b class="num lg-c">' + nm(BC[k]) + '</b></div>';
        }).join('')
      + '<div class="lg-row' + (noB ? '' : ' lg-off') + '"><i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 1px var(--line)"></i>'
      + '<span class="lg-n">' + esc(t('بلا تفاصيلَ بعد')) + '</span><b class="num lg-c">' + nm(noB) + '</b></div>';
  }
  /* الأشكالُ — تُذكَر مرةً في آخر الأسطورة، وتُشتقُّ من سجلِّ الأنواع (V17.60):
     كانت ثلاثةَ أسطرٍ مكتوبةٍ بيد، فلا يظهر فيها شكلُ نوعٍ أُضيف ولا شكلٌ غُيِّر. */
  out += '<div class="lg-sep"></div>' + legendShapes();
  return out;
}
/* أسطرُ الأشكال: المخيمُ بحدوده، ثم كلُّ شكلٍ بأنواعه — بالهندسة التي يُرسَم بها */
var SHAPE_ORDER = ['diamond','circle','square','triangle','star','drop'];
/* اسمُ النوع القصير: المفتاحُ العربيُّ نفسُه، وإلا اسمُه المعروض (LPR لا يُقرأ حرفًا) */
function typeShort(k){
  if (/[\u0600-\u06FF]/.test(k)) return t(k);
  var d = typesList()[k] || CAT_DEF[k] || {};
  return t(d.l || k);
}
function legendShapes(){
  var T = typesList(), by = {};
  Object.keys(T).forEach(function(k){
    if (k === 'مخيم') return;
    var sh = mapShapeOf(k);
    (by[sh] = by[sh] || []).push(k);
  });
  var order = Object.keys(by).sort(function(a, b){
    var ia = SHAPE_ORDER.indexOf(a), ib = SHAPE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return '<div class="lg-row"><i class="lg-sh sh-c"></i>' + esc(t('مخيم')) + '</div>'
    + order.map(function(sh){
        return '<div class="lg-row lg-shp sh-' + esc(sh) + '">' + shapeSvg(sh)
          + '<span>' + by[sh].map(function(k){ return esc(typeShort(k)); }).join(' \u00b7 ') + '</span></div>';
      }).join('');
}

/* واجهةُ الخريطة تُرسَم في #mapUI فوق الحاوية الثابتة —
   والحاويةُ نفسها لا يمسّها إعادةُ الرسم فلا تُدمَّر Leaflet. */
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
    + '<div class="map-fab">'
    +   (may('edit') ? btn('+ '+t('موقع غير مسجّل'),'btn-primary btn-sm',' data-newsite="1"') : '')
    +   ((may('newsite') || may('settings'))
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
    + (POP_OPEN ? popHtml() : '');
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
    var r = STATE.recs[k]; if (dayKey(r.at || r._at) === day && svVisited(r)) sv++; });
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
function svdChals(r){
  return chalKeys(r && r.chals);
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
  return ch.some(function(c){ return /^لا يوجد سطح تثبيت/.test(c) || /^العارضة الحديدية/.test(c); });
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
  var rv = svNeedsRevisit(o.r) ? [t('تحتاج زيارة أخرى تقنيًا')] : [];   /* (V33.6) السببُ يُقال لا «لا توجد تحديات» */
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

/* ═══ شاشةُ الوزارة — العرضُ الذي يُقرأ من آخر القاعة (V17.82) ═══
   الاجتماعُ مع الوزارة لا يُقرأ فيه جدول: يُقرأ رقمٌ كبيرٌ ونسبةٌ وشريطٌ لكلِّ
   مشعر، ثم نبضُ الميدان في يومٍ، ثم ما ينتظر قرارًا من الحاضرين أنفسِهم.
   الأرقامُ كلُّها من الدوالِّ التي تقرأ منها الشاشاتُ الأخرى (siteKeyStats
   وlifeOf وsvdRows) — فلا يخالف العرضُ ما في الجدول. وزرُّ «عرضٌ كامل» يُخفي
   القوائمَ ويملأ الشاشةَ ويجدّدها كلَّ دقيقة. */
/* ═══ «متى نخلّص؟» — التوقّعُ من وتيرة آخر أسبوعين (V17.83) ═══
   الرقمُ الذي تسأل عنه الوزارةُ بعد النسبة: متى؟ يُحسَب لكلِّ مشعرٍ من عدد ما
   مُسح فيه في آخر أربعةَ عشرَ يومًا — لا من تارجتٍ مكتوب — فيُقال «يكتمل نحو
   كذا» أخضرَ إن سبق الموعدَ وأحمرَ إن تأخّر، ولا يُقال شيءٌ إن لم يتحرّك
   المشعرُ أسبوعين. */
function zoneForecast(zone){
  var K = siteKeyStats(), o = K.zones[zone];
  if (!o || !o.n) return null;
  var now = Date.now(), from = now - 14 * 864e5, done14 = 0;
  (STATE.sites || []).forEach(function(x){
    if (taxOf(x).g !== zone) return;   /* (V30.0) بتصنيف المالك */
    var r = STATE.recs[x.id];
    if (svVisited(r) && +r.at >= from) done14++;   /* (V32.6) */
  });
  var left = o.n - o.sv;
  if (left <= 0) return { done:true, left:0 };
  if (!done14) return { stalled:true, left:left };
  var rate = done14 / 14, days = Math.ceil(left / rate), eta = now + days * 864e5;
  var due = cfgN(cfgGet('dueSurvey')) || 0;
  return { left:left, rate:rate, days:days, eta:eta, due:due, late:!!(due && eta > due) };
}
function forecastHtml(zone){
  var f = zoneForecast(zone);
  if (!f) return '';
  if (f.done) return '<span class="kk-eta ok">\u2714 ' + esc(t('اكتمل')) + '</span>';
  if (f.stalled) return '<span class="kk-eta mute">' + esc(t('لا وتيرةَ في أسبوعين')) + '</span>';
  return '<span class="kk-eta ' + (f.late ? 'bad' : 'ok') + '" title="' + esc(nm(Math.round(f.rate * 7)) + ' ' + t('في الأسبوع')) + '">'
    + esc(t('يكتمل نحو')) + ' ' + esc(dayKey(f.eta)) + (f.due ? ' \u00b7 ' + esc(t(f.late ? 'بعد الموعد' : 'قبل الموعد')) : '') + '</span>';
}
/* ═══ خريطةُ التقدّم بالنقاط (V17.93) ═══
   طلب صاحبُ المشروع أن تُرى النقاطُ لا المربعات: كلُّ نقطةٍ في المشعر دائرةٌ في
   موضعها الحقيقيِّ (إحداثياتُها) بلون حالتها — ألوانُ الخريطة نفسُها (LIFE) —
   فتُرى الفجواتُ في أماكنها، والضغطُ على نقطةٍ يفتحها. والمفتاحُ يعدُّ كلَّ
   حالةٍ فيُجمَع إلى نقاط المشعر. */
var KK_ZONE = 'منى';
/* ═══ نقاطٌ بعيدةٌ عن مشعرها لا تُصغّر الخريطة (V18.2) ═══
   نقطةٌ واحدةٌ بإحداثياتٍ خاطئةٍ على بُعد كيلومتراتٍ كانت تمدُّ الإطارَ فتنكمش
   ٩٤٦ نقطةً في زاوية. صار الإطارُ من الجسم الحقيقيِّ للمشعر: ما يبعد عن مركزه
   أكثرَ من ثلاثة أضعاف الربيع الثالث (أو ثلاثة كيلومترات على الأقل) يُعَدُّ
   بعيدًا، فلا يدخل الإطارَ ويُقال إنه بعيدٌ ليُصحَّح — لا يُخفى بصمت. */
function geoOutliers(P){
  if (P.length < 8) return { core:P, far:[] };
  var med = function(a){ a = a.slice().sort(function(x, y){ return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  var mla = med(P.map(function(x){ return +x.lat; })), mlo = med(P.map(function(x){ return +x.lng; }));
  var kx = Math.cos(mla * Math.PI / 180);
  var dist = function(x){ return Math.sqrt(Math.pow(((+x.lng) - mlo) * kx, 2) + Math.pow((+x.lat) - mla, 2)) * 111320; };
  var ds = P.map(dist).sort(function(a, b){ return a - b; }), q3 = ds[Math.floor(ds.length * 0.75)];
  var limit = Math.max(3000, q3 * 3);
  var core = [], far = [];
  P.forEach(function(x){ (dist(x) <= limit ? core : far).push(x); });
  return { core:core, far:far };
}
/* التكبيرُ والسحبُ على خريطة النقاط (V18.2): الإطارُ يُصغَّر حول نقطةٍ فتتباعد
   النقاطُ التي كانت تتلامس، ونصفُ القطر يصغر مع التكبير فلا تبقى كتلةً واحدة. */
var PM_VIEW = { zone:'', z:1, cx:0.5, cy:0.5, W:1000, H:600 };
function pmState(zone, W, H){
  if (PM_VIEW.zone !== zone){ PM_VIEW = { zone:zone, z:1, cx:0.5, cy:0.5, W:W, H:H }; }
  PM_VIEW.W = W; PM_VIEW.H = H; return PM_VIEW;
}
function pmViewBox(){
  var V = PM_VIEW, w = V.W / V.z, h = V.H / V.z;
  var x = Math.min(Math.max(V.cx * V.W - w / 2, 0), V.W - w), y = Math.min(Math.max(V.cy * V.H - h / 2, 0), V.H - h);
  return [x.toFixed(1), y.toFixed(1), w.toFixed(1), h.toFixed(1)].join(' ');
}
function pmApply(){
  var svg = document.querySelector('.kk-pts'); if (!svg) return;
  svg.setAttribute('viewBox', pmViewBox());
  var r = Math.max(1.2, 5 / Math.sqrt(PM_VIEW.z)).toFixed(2), sw = Math.max(0.2, 0.6 / PM_VIEW.z).toFixed(2);
  var cs = svg.querySelectorAll('circle'); for (var i = 0; i < cs.length; i++){ cs[i].setAttribute('r', r); cs[i].style.strokeWidth = sw; }
  var lab = document.getElementById('pmZoom'); if (lab) lab.textContent = '\u00d7' + nm(Math.round(PM_VIEW.z * 10) / 10);
}
function pmZoomAt(f, fx, fy){
  var V = PM_VIEW, z0 = V.z, z1 = Math.min(40, Math.max(1, z0 * f));
  if (fx != null){
    /* ما تحت الإصبع يثبت: نقطةُ العالم تحت (fx,fy) قبل التكبير تبقى تحتها بعده */
    var wx = V.cx - 0.5 / z0 + fx / z0, wy = V.cy - 0.5 / z0 + fy / z0;
    V.cx = wx - fx / z1 + 0.5 / z1; V.cy = wy - fy / z1 + 0.5 / z1;
  }
  V.z = z1; V.cx = Math.min(Math.max(V.cx, 0), 1); V.cy = Math.min(Math.max(V.cy, 0), 1);
  pmApply();
}
function pmReset(){ PM_VIEW.z = 1; PM_VIEW.cx = 0.5; PM_VIEW.cy = 0.5; pmApply(); }
var PM_DRAG = null, PM_PINCH = null;
function pmFrac(svg, ev){ var b = svg.getBoundingClientRect(); return { x:(ev.clientX - b.left) / (b.width || 1), y:(ev.clientY - b.top) / (b.height || 1) }; }
if (typeof document === 'object'){
  document.addEventListener('wheel', function(e){
    var svg = e.target && e.target.closest ? e.target.closest('.kk-pts') : null; if (!svg) return;
    e.preventDefault(); var f = pmFrac(svg, e); pmZoomAt(e.deltaY < 0 ? 1.25 : 0.8, f.x, f.y);
  }, { passive:false });
  document.addEventListener('pointerdown', function(e){
    var svg = e.target && e.target.closest ? e.target.closest('.kk-pts') : null; if (!svg) return;
    if (PM_DRAG && PM_DRAG.id !== e.pointerId){ PM_PINCH = { a:PM_DRAG, b:{ id:e.pointerId, x:e.clientX, y:e.clientY }, z:PM_VIEW.z }; return; }
    PM_DRAG = { id:e.pointerId, x:e.clientX, y:e.clientY, cx:PM_VIEW.cx, cy:PM_VIEW.cy, moved:false, svg:svg };
  }, { passive:true });
  document.addEventListener('pointermove', function(e){
    if (PM_PINCH){
      var A = PM_PINCH.a, B = PM_PINCH.b; if (e.pointerId === A.id){ A.x = e.clientX; A.y = e.clientY; } else if (e.pointerId === B.id){ B.x = e.clientX; B.y = e.clientY; } else return;
      if (!PM_PINCH.d0){ PM_PINCH.d0 = Math.hypot(A.x - B.x, A.y - B.y) || 1; return; }
      var d = Math.hypot(A.x - B.x, A.y - B.y); var z = Math.min(40, Math.max(1, PM_PINCH.z * d / PM_PINCH.d0)); PM_VIEW.z = z; pmApply(); return;
    }
    if (!PM_DRAG || e.pointerId !== PM_DRAG.id) return;
    var b = PM_DRAG.svg.getBoundingClientRect(), dx = (e.clientX - PM_DRAG.x) / (b.width || 1), dy = (e.clientY - PM_DRAG.y) / (b.height || 1);
    if (Math.abs(dx) + Math.abs(dy) > 0.01) PM_DRAG.moved = true;
    PM_VIEW.cx = Math.min(Math.max(PM_DRAG.cx - dx / PM_VIEW.z, 0), 1); PM_VIEW.cy = Math.min(Math.max(PM_DRAG.cy - dy / PM_VIEW.z, 0), 1); pmApply();
  }, { passive:true });
  var pmUp = function(e){ if (PM_PINCH && (e.pointerId === PM_PINCH.a.id || e.pointerId === PM_PINCH.b.id)){ PM_PINCH = null; PM_DRAG = null; return; } if (PM_DRAG && e.pointerId === PM_DRAG.id){ if (PM_DRAG.moved) PM_CLICK_SKIP = Date.now(); PM_DRAG = null; } };
  document.addEventListener('pointerup', pmUp, { passive:true }); document.addEventListener('pointercancel', pmUp, { passive:true });
}
/* ═══ القمرُ الصناعيُّ في شاشة الوزارة (V18.4) ═══
   طلب صاحبُ المشروع أن تُرى نقاطُ المشعر على صورة القمر الصناعي في شاشة الوزارة
   وأن يكون ذلك الافتراضيَّ: خريطةٌ ليفليت صغيرةٌ بطبقة Esri World Imagery (نفسُ
   الطبقة التي تستعملها الخريطةُ الرئيسة) ودوائرُ بألوان الحالة نفسِها، تُفتَح
   النقطةُ بالضغط، ويبقى إطارُها بين تجديدات الدقيقة. وخريطةُ النقاط المجرّدةُ
   تبقى خيارًا. وحيث لا ليفليت (بيئةُ الفحص) تُرسَم النقاطُ المجرّدة. */
var KK_VIEW = 'sat', KK_MAP = null, KK_MAPV = {}, KK_MAP_ZONE = '';
function kkSatHtml(zone){
  var all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone && +x.lat && +x.lng; });   /* (V30.0) */
  if (!all.length) return '<p class="hint">' + esc(t('لا نقاطَ بإحداثياتٍ في هذا المشعر.')) + '</p>';
  var G = geoOutliers(all), cnt = {};
  G.core.forEach(function(x){ var st = lifeOf(x); cnt[st] = (cnt[st] || 0) + 1; });
  var legend = LIFE_ORDER.filter(function(k){ return cnt[k]; }).map(function(k){
    return '<span class="kk-lg"><i style="background:' + LIFE[k].c + '"></i>' + esc(t(LIFE[k].n)) + ' <b class="num">' + nm(cnt[k]) + '</b></span>'; }).join('');
  var far = G.far.length ? '<p class="hint" style="margin:6px 0 0">\u26A0 ' + nm(G.far.length) + ' ' + esc(t('نقطةً بإحداثياتٍ بعيدةٍ عن المشعر لا تدخل الإطار')) + ': ' + G.far.slice(0, 4).map(function(x){ return bdi(x.id); }).join(' \u00b7 ') + (G.far.length > 4 ? ' \u2026' : '')
      + (typeof maySiteEdit === 'function' && maySiteEdit() ? ' ' + btn(t('تصحيح البيانات'), 'btn-quiet btn-sm', ' data-goto="dq"') : '') + '</p>' : '';
  return '<div id="kkSat" class="kk-sat" role="img" aria-label="' + esc(t('نقاطُ المشعر على القمر الصناعي') + ' \u2014 ' + t(zone)) + '"></div>'
    + '<div class="kk-legend2">' + legend + '<span class="hint" style="margin:0">' + esc(t('الإجمالي')) + ' <b class="num">' + nm(all.length) + '</b></span></div>' + far;
}
function kkSatInit(){
  var el = document.getElementById('kkSat'); if (!el) return false;
  if (typeof L === 'undefined' || !L.map){ el.innerHTML = '<p class="hint" style="padding:12px">' + esc(t('الخريطةُ تحتاج تحميلَ المكتبة — تظهر النقاطُ المجرّدةُ بدلًا منها')) + '</p>'; return false; }
  var zone = KK_ZONE, all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone && +x.lat && +x.lng; }), core = geoOutliers(all).core;
  if (KK_MAP){ try { KK_MAP.remove(); } catch (e){ LS_ERR = e; } KK_MAP = null; }
  var m = L.map(el, { zoomControl:true, attributionControl:true, preferCanvas:true });
  L.tileLayer(TILES.esri, { maxZoom:19, keepBuffer:1, updateWhenIdle:true, updateWhenZooming:false, attribution:'Esri, Maxar, Earthstar Geographics' }).addTo(m);   /* (V34.2) */
  /* على اللمس: خريطةٌ طويلةٌ داخل صفحةٍ تُمسك الإصبعَ فلا تُمرَّر الصفحة. يبدأ
     التحريكُ معطَّلًا وتُقرأ الصفحةُ بإصبعٍ واحد؛ ضغطةٌ على الخريطة تفعّله ويظهر
     زرُّ إيقافه — والتقريبُ بإصبعين يعمل دائمًا. */
  if (L.Browser && L.Browser.touch && m.dragging){
    m.dragging.disable();
    var lock = document.createElement('button'); lock.type = 'button'; lock.className = 'kk-lock';
    lock.textContent = t('اضغط لتحريك الخريطة');
    lock.addEventListener('click', function(){ m.dragging.enable(); lock.textContent = '\u2715 ' + t('إيقاف التحريك'); lock.classList.add('on'); lock.onclick = function(){ m.dragging.disable(); lock.textContent = t('اضغط لتحريك الخريطة'); lock.classList.remove('on'); lock.onclick = null; }; }, { once:true });
    el.appendChild(lock);
  }
  var MAP_CV_KK = L.canvas({ padding:0.3 });   /* لوحُ هذه الخريطة وحدَها — لا لوحَ الخريطة الرئيسة */
  core.forEach(function(x){
    var st = lifeOf(x), C = (LIFE[st] || LIFE.todo).c;
    L.circleMarker([+x.lat, +x.lng], { renderer:MAP_CV_KK, radius:5, color:'#fff', weight:1, fillColor:C, fillOpacity:0.95 })
      .on('click', function(){ DETAIL_ID = x.id; CUR = 'site'; render(); }).addTo(m);
  });
  var v = KK_MAPV[zone];
  if (v && v.z) m.setView([v.lat, v.lng], v.z);
  else if (core.length){ m.fitBounds(L.latLngBounds(core.map(function(x){ return [+x.lat, +x.lng]; })), { padding:[12, 12] }); }
  m.on('moveend', function(){ var c = m.getCenter(); KK_MAPV[zone] = { lat:c.lat, lng:c.lng, z:m.getZoom() }; });
  KK_MAP = m; KK_MAP_ZONE = zone;
  return true;
}
var PM_CLICK_SKIP = 0;
function pointMap(zone){
  var all = (STATE.sites || []).filter(function(x){ return taxOf(x).g === zone; });
  var P0 = all.filter(function(x){ return +x.lat && +x.lng; }), noCo = all.length - P0.length;
  if (!P0.length) return '<p class="hint">' + esc(t('لا نقاطَ بإحداثياتٍ في هذا المشعر.')) + '</p>';
  var G = geoOutliers(P0), P = G.core;
  var la0 = Infinity, la1 = -Infinity, lo0 = Infinity, lo1 = -Infinity;
  P.forEach(function(x){ var a = +x.lat, o = +x.lng; if (a < la0) la0 = a; if (a > la1) la1 = a; if (o < lo0) lo0 = o; if (o > lo1) lo1 = o; });
  var kx = Math.cos((la0 + la1) / 2 * Math.PI / 180), W = 1000;
  var spanX = Math.max(1e-6, (lo1 - lo0) * kx), spanY = Math.max(1e-6, la1 - la0);
  var H = Math.max(280, Math.min(720, Math.round(W * spanY / spanX))), pad = 14;
  var sc = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
  var offX = (W - spanX * sc) / 2, offY = (H - spanY * sc) / 2;
  var V = pmState(zone, W, H), r = Math.max(1.2, 5 / Math.sqrt(V.z)).toFixed(2);
  var cnt = {};
  var dots = P.map(function(x){
    var st = lifeOf(x), L = LIFE[st] || LIFE.todo; cnt[st] = (cnt[st] || 0) + 1;
    var cx = offX + ((+x.lng) - lo0) * kx * sc, cy = H - (offY + ((+x.lat) - la0) * sc);
    /* الوصفُ خاصيةٌ لا نصّ: ألفُ عنوانٍ نصّيٍّ كانت تُثقل الشاشةَ على قارئها (audit-fit) */
    return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r + '" fill="' + L.c + '" data-site="' + esc(x.id) + '" aria-label="' + esc(x.id) + '"></circle>';
  }).join('');
  var legend = LIFE_ORDER.filter(function(k){ return cnt[k]; }).map(function(k){
    return '<span class="kk-lg"><i style="background:' + LIFE[k].c + '"></i>' + esc(t(LIFE[k].n)) + ' <b class="num">' + nm(cnt[k]) + '</b></span>';
  }).join('');
  var far = G.far.length ? '<p class="hint" style="margin:6px 0 0">\u26A0 ' + nm(G.far.length) + ' ' + esc(t('نقطةً بإحداثياتٍ بعيدةٍ عن المشعر لا تدخل الإطار')) + ': ' + G.far.slice(0, 4).map(function(x){ return bdi(x.id); }).join(' \u00b7 ') + (G.far.length > 4 ? ' \u2026' : '')
      + (typeof maySiteEdit === 'function' && maySiteEdit() ? ' ' + btn(t('تصحيح البيانات'), 'btn-quiet btn-sm', ' data-goto="dq"') : '') + '</p>' : '';
  return '<div class="pm-tools"><button type="button" class="btn btn-quiet btn-sm" data-pmz="in" aria-label="' + esc(t('تكبير')) + '">\uFF0B</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-pmz="out" aria-label="' + esc(t('تصغير')) + '">\uFF0D</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-pmz="reset" aria-label="' + esc(t('إعادة الإطار')) + '">\u27F2</button>'
    + '<span class="hint num" id="pmZoom" style="margin:0">\u00d7' + nm(Math.round(V.z * 10) / 10) + '</span>'
    + '<span class="hint" style="margin:0">' + esc(t('اسحب للتحريك · قرّب بإصبعين أو بالعجلة · اضغط نقطةً لتفتحها')) + '</span></div>'
    + '<svg class="kk-pts" viewBox="' + pmViewBox() + '" role="img" aria-label="' + esc(t('خريطةُ التقدّم بالنقاط') + ' \u2014 ' + t(zone)) + '">' + dots + '</svg>'
    + '<div class="kk-legend2">' + legend
    + '<span class="hint" style="margin:0">' + esc(t('الإجمالي')) + ' <b class="num">' + nm(P0.length) + '</b>'
    + (noCo ? ' \u00b7 ' + esc(t('بلا إحداثيات')) + ' <b class="num">' + nm(noCo) + '</b>' : '') + '</span></div>' + far;
}
/* ═══ الأسبوعُ في جملة (V17.89) ═══
   الرقمُ يُقرأ، والجملةُ تُقال في الاجتماع. تُبنى من الأرقام نفسِها: ما مُسح
   في سبعة أيام، وأكبرُ مشعرٍ ومتى يكتمل مقارنًا بالموعد، وما ينتظر قرارَ
   الوزارة — بلا صفةٍ لا رقمَ خلفها. */
/* ═══ (V33.0) شاشةُ القاعة: النقاطُ بعوائق وبدونها — الإجماليُّ أوّلًا ثم كلُّ نوعٍ من المخيمات إلى الزايدي ═══ */
function kioskObsTally(){
  var T = { n:0, ok:0, ob:0, todo:0 }, by = {};
  (STATE.sites || []).forEach(function(x){ var ty = taxOf(x).t || '—', r = STATE.recs[x.id], o = by[ty] = by[ty] || { n:0, ok:0, ob:0, todo:0 };
    o.n++; T.n++;
    if (svClean(r)){ o.ok++; T.ok++; } else if (svVisited(r)){ o.ob++; T.ob++; } else { o.todo++; T.todo++; } });
  return { T:T, by:by };
}
function kioskObsHtml(){
  var K = kioskObsTally(), types = TAX_T.filter(function(ty){ return K.by[ty]; });
  /* رقمٌ كبيرٌ يُضغَط فيفتح قائمتَه (data-svlist) — الأخضرُ بدون عوائق والأحمرُ بعوائق */
  var num = function(v, color, lbl, key, big){ return '<div role="button" tabindex="0" data-svlist="' + esc(key) + '" title="' + esc(t('اضغط للقائمة والتصدير')) + '" style="flex:1;min-width:0;cursor:pointer;border-radius:12px;padding:4px 2px">'
      + '<div style="color:' + color + ';font-weight:800;font-size:' + (big ? '44px' : '30px') + ';line-height:1.05;font-variant-numeric:tabular-nums" aria-valuenow="' + v + '">' + nm(v) + '</div>'
      + '<div class="kk-sub" style="white-space:nowrap">' + esc(t(lbl)) + ' \u203A</div></div>'; };
  var card = function(title, o, okKey, obKey, big){ return '<div class="kk-ring kk-plain"' + (big ? ' style="grid-column:1/-1"' : '') + '><div class="kk-lab" style="margin:0 0 6px">' + title + '</div>'
      + '<div style="display:flex;gap:6px;justify-content:center;text-align:center">' + num(o.ok, 'var(--min-green)', 'بدون عوائق', okKey, big) + num(o.ob, 'var(--min-red)', 'بعوائق', obKey, big) + '</div>'
      + '<div class="kk-sub" style="margin-top:4px">' + (o.todo ? esc(t('لم تتم زيارتها')) + ' ' + nm(o.todo) + ' \u00b7 ' : '') + esc(t('من')) + ' ' + nm(o.n) + '</div></div>'; };
  return '<div class="kk-h" style="margin:14px 2px 8px">' + esc(t('النقاط بعوائق وبدونها')) + '</div>'
    + '<div class="kk-rings" id="kksec-4">'
    +   card(esc(t('الإجمالي')), K.T, 'clean', 'chal', true)
    +   types.map(function(ty){ var d = TAX_DEF[ty] || { l:ty, i:'\u25CF' }; return card(d.i + ' ' + esc(t(d.l)), K.by[ty], 'obok|' + ty, 'obbad|' + ty, false); }).join('')
    + '</div>';
}
function kioskStory(){
  var K = siteKeyStats(), now = Date.now(), wk = now - 7 * 864e5, n7 = 0, byZ = {};
  (STATE.sites || []).forEach(function(x){ var r = STATE.recs[x.id]; if (svVisited(r) && +r.at >= wk){ n7++; byZ[x.zone] = (byZ[x.zone] || 0) + 1; } });
  var zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; });
  var life = {}; (STATE.sites || []).forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var parts = [];
  if (n7){ var top = Object.keys(byZ).sort(function(a, b){ return byZ[b] - byZ[a]; })[0];
    parts.push(t('هذا الأسبوع تمت زيارة') + ' ' + nm(n7) + ' ' + t('نقطةً') + (top ? ' (' + nm(byZ[top]) + ' ' + t('منها في') + ' ' + t(top) + ')' : '')); }
  else parts.push(t('لم تُسجَّل زيارةٌ هذا الأسبوع'));
  var z0 = zones[0], f = z0 ? zoneForecast(z0) : null;
  if (f && f.eta){ var dd = f.due ? Math.round((f.due - f.eta) / 864e5) : 0;
    parts.push(t(z0) + ' ' + t('يكتمل نحو') + ' ' + dayKey(f.eta) + (f.due ? (dd >= 0 ? ' \u2014 ' + t('قبل الموعد بـ') + ' ' + nm(dd) + ' ' + t('يومًا') : ' \u2014 ' + t('بعد الموعد بـ') + ' ' + nm(-dd) + ' ' + t('يومًا')) : '')); }
  else if (f && f.stalled) parts.push(t(z0) + ' ' + t('بلا وتيرةٍ منذ أسبوعين'));
  /* (V33.0) قرارُ المالك: لا «تنتظر قرار الوزارة» ولا «متعذّرة» — ما زير ولم يُوصَل إليه «تحتاج زيارة أخرى تقنيًا» */
  /* (V33.5) طلبُ المالك: لا «تحتاج زيارة أخرى» في القاعة — هي داخل «بعوائق» في البطاقات */
  return parts.join(' \u00b7 ') + '.';
}
/* العدّاداتُ تتحرّك من الصفر إلى رقمها حين تُفتَح الشاشة — الرقمُ يُرى وهو يُبنى */
/* (V34.3) طلبُ المالك: «الحلقةُ ١٠٠٪ أحمر، ولما تعدّ حاجة يقلّ الأحمرُ ويتحوّل أخضرَ بنسبته» — كلُّ حلقةٍ تُرسَم حمراءَ كاملة ثم يزحف
   الأخضرُ إلى نسبتها (انتقالُ ‎.kk-arc‎ ١٫٢ ث على بطاقة الرسوم). تُستدعى بعد كلِّ رسمٍ فيه حلقات — في الملخّص والقاعة. */
function ringsGrow(){
  var arcs = document.querySelectorAll('.kk-arc[kkoff]'); if (!arcs.length) return;
  var prev = ringsGrow.prev = ringsGrow.prev || {}, grow = [];
  /* التحديثُ الدوريُّ (كلَّ دقيقةٍ في القاعة) لا يعيد الحركةَ لحلقةٍ لم يتغيّر رقمُها — يزحف الأخضرُ حين يُنجَز شيءٌ فقط */
  arcs.forEach(function(a){ var ring = a.closest('.kk-ring'), k = (ring && ring.getAttribute('data-svlist')) || '', off = a.getAttribute('kkoff');
    if (k && prev[k] === off){ a.style.transition = 'none'; a.style.strokeDashoffset = off; a.removeAttribute('kkoff'); }
    else { prev[k] = off; grow.push(a); } });
  if (!grow.length) return;
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ grow.forEach(function(a){ a.style.strokeDashoffset = a.getAttribute('kkoff'); a.removeAttribute('kkoff'); }); }); });
}
function kioskAnimate(){
  var els = document.querySelectorAll('.kk [aria-valuenow]');
  if (!els.length) return;
  var t0 = Date.now(), dur = 900;
  var tick = function(){
    var p = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    els.forEach(function(el){ var n = +el.getAttribute('aria-valuenow') || 0, sfx = /kk-pct/.test(el.getAttribute('class') || '') ? '٪' : ''; el.textContent = nm(Math.round(n * e)) + sfx; });
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
var KIOSK_ON = false, KIOSK_TIMER = null, KIOSK_CYCLE = null, KIOSK_STEP = 0;
/* وضعُ القاعة (V17.90): على تلفزيون غرفة العمليات لا يلمس أحدٌ الشاشة — فتتنقّل
   بنفسها بين أقسامها كلَّ خمسَ عشرةَ ثانية، وتقف عند أوّل لمسةٍ أو حركة. */
function kioskCycleTick(){
  var secs = document.querySelectorAll('.kk [id^="kksec-"]');
  if (!secs.length) return;
  KIOSK_STEP = (KIOSK_STEP + 1) % secs.length;
  try { secs[KIOSK_STEP].scrollIntoView({ behavior:'smooth', block:'start' }); } catch (e){ secs[KIOSK_STEP].scrollIntoView(); }
}
function kioskCycleStop(){ if (KIOSK_CYCLE){ clearInterval(KIOSK_CYCLE); KIOSK_CYCLE = null; } }
/* (V33.5) طلبُ المالك: أربعُ حلقاتٍ فقط — المسح والتركيب والتسليم والفك — الأخضرُ المنجزُ والأحمرُ المتبقي، وتفاعليةٌ كبطاقات «بعوائق
   وبدونها»: الحلقةُ تفتح قائمةَ المنجز، و«متبقٍّ» تحتها تفتح قائمةَ المتبقي. ولا مقامَ له (الفكُّ قبل التسليم) حلقةٌ رماديةٌ تقول متى تبدأ. */
function kioskRing(done, total, label, doneKey, remKey, idle){
  var r = 44, c = 2 * Math.PI * r, p = total ? Math.max(0, Math.min(100, done / total * 100)) : 0, rem = Math.max(0, total - done);
  var pr = Math.round(p); if (pr === 100 && rem) pr = 99; if (pr === 0 && done) pr = 1;   /* لا يُقال ١٠٠٪ وبقي شيء ولا ٠٪ وأُنجز شيء */
  /* (V34.4) بلاغُ المالك: «المسح عمّال بيقلب أحمر وأخضر» — كلُّ رسمٍ كان يبدأ الحلقةَ حمراءَ كاملةً ثلاثين جزءًا من الألف ثم يقفز —
     وصفحةُ الوزارة تُرسَم مع كلِّ وصول بيانات. صارت الحلقةُ التي رقمُها كما كان تُرسَم على نسبتها مباشرة، والحركةُ للتغيّر وحدَه.
     و«٩٩٪ أخضر والمتبقي ١٪ أحمر»: ١٢ من ١٬٩٤٥ = ٠٫٦٪ — شريطٌ أضيقُ من أن يُرى (وطرفُ القوس المستدير يغطّيه)؛ فالمتبقي يُرى
     أحمرَ بحدٍّ أدنى ٢٪ من الدائرة ما دام فيه شيء، وطرفُ القوس مستقيم. */
  var vis = rem ? Math.min(p, 98) : p, off = (c * (1 - vis / 100)).toFixed(1), same = ringsGrow.prev && ringsGrow.prev[doneKey] === off;
  return '<div class="kk-ring" role="button" tabindex="0" data-svlist="' + esc(doneKey) + '" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '">'
    + '<svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="' + r + '" class="kk-track"' + (total ? ' style="stroke:var(--min-red)"' : '') + '/>'
    +   '<circle cx="55" cy="55" r="' + r + '" class="kk-arc"' + (same ? '' : ' kkoff="' + off + '"') + ' style="stroke:var(--min-green);stroke-linecap:butt;stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (same ? off : c.toFixed(1)) + '"/>'   /* (V34.3) تبدأ حمراءَ كاملة ويزحف الأخضرُ إلى نسبته */
    +   '<text x="55" y="61" class="kk-pct" aria-valuenow="' + pr + '">' + nm(pr) + '٪</text></svg>'
    + '<div class="kk-lab">' + esc(t(label)) + ' \u203A</div>'
    + '<div class="kk-sub">' + (total ? nm(done) + ' ' + esc(t('من')) + ' ' + nm(total)
        + (rem ? ' \u00b7 <span role="button" tabindex="0" data-svlist="' + esc(remKey) + '" style="color:var(--min-red);font-weight:700;cursor:pointer;white-space:nowrap">' + esc(t('متبقي')) + ' ' + nm(rem) + ' \u203A</span>' : '')
        : esc(t(idle || 'لم يبدأ بعد'))) + '</div></div>';
}
function kioskToggle(){
  KIOSK_ON = !KIOSK_ON;
  document.body.classList.toggle('kiosk', KIOSK_ON);
  try {
    if (KIOSK_ON && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    else if (!KIOSK_ON && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
  } catch (e){}
  if (KIOSK_TIMER){ clearInterval(KIOSK_TIMER); KIOSK_TIMER = null; }
  kioskCycleStop(); KIOSK_STEP = 0;
  try { sunApply(); } catch (e){ LS_ERR = e; }   /* القاعةُ بلا وضع الشمس (V17.99) */
  if (KIOSK_ON){
    KIOSK_TIMER = setInterval(function(){ if (CUR === 'over' && tabCur('over') === 'kiosk') render(1); else kioskToggle(); }, 60000);
    KIOSK_CYCLE = setInterval(kioskCycleTick, 15000);
    var stop = function(){ kioskCycleStop(); };
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, stop, { once:true, passive:true }); });
  }
  render(1);
}
function kioskBody(){
  var K = siteKeyStats(), S = K.total, now = Date.now(), day = now - 864e5;
  var life = {}; (STATE.sites || []).forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var pcSv = S.n ? S.sv / S.n * 100 : 0, pcIns = S.n ? S.ins / S.n * 100 : 0;
  var minOk = (life.ready || 0) + (life.sched || 0) + (life.installed || 0) + (life.handed || 0);
  var pcMin = S.sv ? minOk / S.sv * 100 : 0;
  var steps = (STATE.steps || []).filter(function(x){ return +x.at >= day; });
  var kinds = {}, people = {};
  steps.forEach(function(x){ kinds[x.kind] = (kinds[x.kind] || 0) + 1; if (x.by) people[x.by] = 1; });
  var KN = { visit:'زيارة', ins:'تركيب', dis:'فكّ', newsite:'موقعٌ جديد', maint:'صيانة', deliver:'تسليم' };
  var byCh = {}; svdRows().forEach(function(o){ o.ch.forEach(function(c){ byCh[c] = (byCh[c] || 0) + 1; }); });
  var chTop = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; }).slice(0, 4);
  var zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; });
  var zoneMax = zones.length ? K.zones[zones[0]].n : 1;
  return svListPop() + '<div class="kk' + (KIOSK_ON ? ' on' : '') + '">'
    + '<div class="kk-head"><div><div class="kk-title">' + esc(t('قارئات أفاقي — حج ١٤٤٨هـ')) + '</div>'
    +   '<div class="kk-brand">' + esc(t('وزارةُ الحج والعمرة · مشروعُ قارئات أفاقي')) + '</div>'
    +   '<div class="kk-date">' + esc(fmtDT(now)) + ' \u00b7 <span class="kk-live"></span> ' + esc(t('يتجدّد كلَّ دقيقة')) + '</div></div>'
    +   btn(KIOSK_ON ? '\u2716 ' + t('خروج من العرض') : '\u{1F5A5} ' + t('عرضٌ كامل'), KIOSK_ON ? 'btn-quiet' : 'btn-primary', ' data-kiosk="1"' + (KIOSK_ON ? '' : ' title="' + esc(t('يملأ الشاشةَ ويتنقّل بين الأقسام بنفسه كلَّ خمسَ عشرةَ ثانية')) + '"')) + '</div>'
    + '<div class="kk-story">' + esc(kioskStory()) + '</div>'
    + '<div class="kk-rings" id="kksec-1">'   /* (V33.5) طلبُ المالك: المسح والتركيب والتسليم والفك — أربعٌ فقط */
    +   (function(){ var all = STATE.sites || [], n = all.length, sv = 0, ins = 0, hd = 0, ds = 0;
          all.forEach(function(x){ if (svVisited(STATE.recs[x.id])) sv++; if (insDone(x.id)) ins++; if (handDone(x.id)) hd++; if (disDone(x.id)) ds++; });
          return kioskRing(sv, n, 'المسح', 'sv', 'rem') + kioskRing(ins, n, 'التركيب', 'insd', 'insr') + kioskRing(hd, n, 'التسليم', 'hand', 'handr')
            + kioskRing(ds, n, 'الفك', 'disd', 'disr'); })()
    + '</div>'
    + kioskObsHtml()   /* (V33.3) طلبُ المالك: بطاقاتٌ فوق تحت الحلقات مباشرةً، وكلُّ رقمٍ يفتح قائمتَه بتصدير */
    + '<div class="kk-grid">'
    +   '<div class="kk-box" id="kksec-2"><div class="kk-h">' + esc(t('المشاعرُ — كم أُنجز وكم بقي')) + '</div>'
    +     zones.map(function(z){ var o = K.zones[z], p = o.n ? Math.round(o.sv / o.n * 100) : 0;
          return '<div class="kk-zone"><div class="kk-zl"><b>' + esc(t(z)) + '</b><span>' + nm(o.sv) + ' / ' + nm(o.n) + ' \u00b7 <b>' + nm(p) + '٪</b></span></div>'
            + '<div class="kk-bar" style="width:' + Math.max(12, Math.round(o.n / zoneMax * 100)) + '%"><i style="width:' + p + '%"></i></div>'
            + '<div class="kk-fc">' + forecastHtml(z) + '</div></div>'; }).join('')
    +   '</div>'
    +   '<div class="kk-box kk-wide" id="kksec-3"><div class="kk-h" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>' + esc(t(KK_VIEW === 'sat' ? 'المشعرُ على القمر الصناعي' : 'خريطةُ التقدّم بالنقاط')) + ' \u2014 ' + esc(t(KK_ZONE)) + '</span>'
    +     '<span>' + zones.map(function(z){ return '<button class="chip' + (KK_ZONE === z ? ' on' : '') + '" data-kkz="' + esc(z) + '">' + esc(t(z)) + '</button>'; }).join(' ')
    +       ' <button class="chip' + (KK_VIEW === 'sat' ? ' on' : '') + '" data-kkview="sat">\u{1F6F0} ' + esc(t('قمر صناعي')) + '</button>'
    +       '<button class="chip' + (KK_VIEW === 'pts' ? ' on' : '') + '" data-kkview="pts">\u25CF ' + esc(t('نقاط')) + '</button></span></div>'
    +     (KK_VIEW === 'sat' && typeof L !== 'undefined' && L.map ? kkSatHtml(KK_ZONE) : pointMap(KK_ZONE))
    +   '</div>'
    +   (function(){   /* (V30.5) فكرةُ المالك #٦: شاشةٌ حيّة — آخرُ ما حدث لحظةً بلحظة، وطزاجةُ البيانات، والتنبيهاتُ */
          var feed = (STATE.steps || []).slice().sort(function(a, b){ return (+b.at || 0) - (+a.at || 0); }).slice(0, 8);
          var A = alAll().filter(function(a){ return a.sites.length; }), alTot = A.reduce(function(x, y){ return x + y.sites.length; }, 0);
          var fresh = STATE.meta.lastSync ? agoTxt(STATE.meta.lastSync) : t('لم تُزامَن بعد');
          return '<div class="kk-box kk-wide" id="kksec-5"><div class="kk-h" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>\u{1F534} ' + esc(t('مباشر — آخر ما حدث في الميدان')) + '</span><span class="hint" style="margin:0">' + esc(t('البيانات')) + ': ' + esc(fresh) + (KIOSK_ON ? ' \u00b7 ' + esc(t('تُسحَب كلَّ دقيقتين في وضع القاعة')) : '') + '</span></div>'
            + (feed.length ? '<div class="kk-feed">' + feed.map(function(x){ return '<div class="kk-zl"><span><b class="num">' + esc(agoTxt(+x.at)) + '</b> \u00b7 ' + esc(t(KN[x.kind] || x.kind || '')) + (x.site ? ' <span class="num">' + esc(x.site) + '</span>' : '') + '</span><span>' + esc(dispName(x.by || '')) + '</span></div>'; }).join('') + '</div>' : '<p class="hint">' + esc(t('لا خطوةَ مرفوعةً بعد.')) + '</p>')
            + (alTot ? '<div class="kk-kinds" style="margin-top:8px">' + A.slice(0, 4).map(function(a){ return '<div class="kk-kind"><div class="kk-big" style="color:var(--min-red)" aria-valuenow="' + a.sites.length + '">' + nm(a.sites.length) + '</div><div class="kk-lab">' + esc(a.label) + '</div></div>'; }).join('') + '</div>' : '<p class="hint" style="margin:8px 0 0">\u2713 ' + esc(t('لا تنبيهاتٍ بقواعد النظام الآن')) + '</p>')
            + '</div>'; })()
    +   '<div class="kk-box"><div class="kk-h">' + esc(t('شغلُ الميدان — آخر أربعٍ وعشرين ساعة')) + '</div>'
    +     (steps.length
          ? '<div class="kk-kinds">' + Object.keys(kinds).map(function(k){ return '<div class="kk-kind"><div class="kk-big" aria-valuenow="' + kinds[k] + '">' + nm(kinds[k]) + '</div><div class="kk-lab">' + esc(t(KN[k] || k)) + '</div></div>'; }).join('')
            + '<div class="kk-kind"><div class="kk-big">' + nm(Object.keys(people).length) + '</div><div class="kk-lab">' + esc(t('شخصًا في الميدان')) + '</div></div></div>'
          : '<p class="hint">' + esc(t('لا خطوةَ مرفوعةً في آخر أربعٍ وعشرين ساعة.')) + '</p>')
    +   '</div>'
    +   '<div class="kk-box"><div class="kk-h">' + esc(t('التحدياتُ الأكثرُ تكرارًا')) + '</div>'
    +     (chTop.length ? chTop.map(function(c){ return '<div class="kk-zl"><span>' + esc(chalShow(c)) + '</span><b>' + nm(byCh[c]) + '</b></div>'; }).join('')
                       : '<p class="hint">' + esc(t('لا تحدّيَ مسجَّلًا بعد.')) + '</p>')
    +   '</div>'
    + '</div></div>';
}

/* ═══ متابعةُ الوزارة (V20.0) ═══
   العرضُ الأسبوعيُّ الذي كان يُعدُّ يدويًّا للاجتماعات صار صفحةً حيّةً بعناوينه نفسِها:
   حالةُ المهام، والتركيبات، والشركات، والمعوقات وجهاتُها، والتحدياتُ وآلياتُ معالجتها،
   وطلباتُ الوزارة، والمنحنى اليومي، وشاشةُ القاعة. سجلّا التحديات والطلبات وتصنيفُ
   الجهات ولقطاتُ الأسابيع في settings/mfu (يقرؤها كلُّ نشطٍ ويكتبها المكتب). */
var MFU = { at:0, v:null, cosAll:false, edit:'' };   /* (V32.0) وحدةُ المتابعة تملك حالتَها: cosAll/edit/parties/prn/ownDef/flt/f/src/sections */   /* الصفُّ المفتوحُ للتعديل (V21.5) */
MFU.parties = ['شركة الخدمة', 'كدانة', 'أفاقي'];
/* (V26.6) جهاتٌ أخرى يضيفها المكتب من صفحة التحديات والمعوقات (سؤالُ المالك: «لو في حد تاني أضيفه منين؟») — تُحفَظ في
   settings/mfu قسم party فتصل الأجهزةَ كلَّها، وتظهر في قوائم الجهات والبطاقات والتصدير. الثلاثُ الأصليةُ لا تُحذَف. */
/* (V26.8) قرارُ المالك: الجهاتُ كلُّها — الأصليةُ والمضافة — تُعدَّل أسماؤها وتُحذَف. المفتاحُ ثابتٌ (اسمُ الأصلية أو اسمُ
   المضافة عند إنشائها) وهو ما يُحفَظ في «own» والمعوقات، والاسمُ المعروضُ من سجل party {t} ويتغيّر؛ و{gone} يخفي
   الجهةَ (الأصليةَ أيضًا). لا تُحذَف آخرُ جهة، و«↺ الأصلية» يُعيد الثلاثَ كما كانت. */
function mfuPartyRaw(k){ return (mfuData().party || {})[k] || null; }
function mfuPartyLabel(k){ var r = mfuPartyRaw(k); return (r && r.t) ? String(r.t) : String(k); }
function mfuParties(){
  var out = MFU.parties.filter(function(k){ var r = mfuPartyRaw(k); return !(r && r.gone); });
  mfuList('party').forEach(function(x){ if (MFU.parties.indexOf(x.id) < 0 && out.indexOf(x.id) < 0) out.push(x.id); });
  return out;
}
MFU.prn = '';   /* الجهةُ المفتوحةُ لتعديل اسمها */
MFU.ownDef = { 'العارضة الحديدية ناقصة أو غير مكتملة':'كدانة', 'لا يوجد سطح تثبيت':'كدانة', 'المدخل غير واضح — لم يُستدل عليه':'أفاقي', 'تحتاج زيارة أخرى تقنيًا':'أفاقي' };
function mfuFetch(force){
  if (!force && (MFU.v || Date.now() - MFU.at < 600000)) return;
  if (!FB.ready || !FB.db){ MFU.v = MFU.v || STATE.mfu || {}; return; }
  MFU.at = Date.now();
  DB.col('settings').doc('mfu').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    MFU.v = (doc && doc.exists) ? doc.data() : {}; STATE.mfu = MFU.v; if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('mfu', e, ''); });
}
function mfuData(){ return MFU.v || STATE.mfu || {}; }
function mfuList(sec){
  var o = mfuData()[sec] || {};
  return Object.keys(o).map(function(k){ return Object.assign({ id:k }, o[k]); }).filter(function(x){ return x && !x.gone; }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function mfuPut(sec, id, entry){
  if (!may('settings')){ toast(t('سجلاتُ المتابعة للمهندس فمن فوقه')); return false; }
  MFU.v = MFU.v || STATE.mfu || {}; MFU.v[sec] = MFU.v[sec] || {}; MFU.v[sec][id] = entry; STATE.mfu = MFU.v;
  var w = {}; w[sec] = {}; w[sec][id] = entry; CORE.set('cfg', 'mfu', w);
  return true;
}
function mfuOwnerOf(cat){ var k = (mfuData().own || {})[cat] || MFU.ownDef[cat] || 'شركة الخدمة', P = mfuParties(); return P.indexOf(k) > -1 ? k : (P[0] || k); }   /* (V26.8) الجهةُ المحذوفةُ تسقط إلى أوّل جهةٍ قائمة */
/* العائقُ: نقطةٌ لم تُركَّب وفي مسحها تحدٍّ حقيقيّ، أو لم يُوصَل إليها */
function mfuObstacles(){
  /* (V33.7) بلاغُ المالك «صفحةُ متابعة الوزارة بطيئةٌ جدًّا»: كانت تُحسَب في الرسمة الواحدة ثلاثَ مرات (المؤشرات والشركات والقائمة) */
  if (DB.memo && DB.memo.obst) return DB.memo.obst;
  var out = [];
  (STATE.sites || []).forEach(function(x){
    var ins = STATE.inss[x.id]; if (ins && ins.status === 'مُركّب') return;
    var r = STATE.recs[x.id]; if (!r) return;
    var cats = chalKeys(r.chals || []).filter(function(c){ return c && c !== 'لا توجد تحديات'; });
    if (r.access && r.access !== 'تم الوصول') cats.push('تحتاج زيارة أخرى تقنيًا');
    if (cats.length) out.push({ x:x, cats:cats });
  });
  if (DB.memo) DB.memo.obst = out;
  return out;
}
/* (V29.1) قرارُ المالك: «إحنا حاليًا في المسح الميداني — صفحةٌ مخصوصةٌ للمسح في الباوربوينت: نظرةٌ عامةٌ بالأرقام والنسب،
   وبعدها التفاصيل: المشعر، النوع، اتعمل كام، لسه كام، وفيه كام تحدٍّ في النوع الفلاني للمشعر الفلاني». بتصنيف المالك (taxOf). */
function svStats(){
  var by = {}, zs = {}, O = { tot:0, sv:0, reach:0, unreach:0, chal:0 };
  (STATE.sites || []).forEach(function(x){
    var c = taxOf(x), r = STATE.recs[x.id], done = svVisited(r), un = !!(r && r.access && r.access !== 'تم الوصول');   /* (V32.6) */
    var ch = (r && svDone(r)) ? chalKeys(r.chals || []).filter(function(k){ return k && k !== 'لا توجد تحديات'; }) : [];
    var k = c.g + '|' + c.t, o = by[k] = by[k] || { g:c.g, t:c.t, n:0, sv:0, chal:0, un:0, cats:{} }, z = zs[c.g] = zs[c.g] || { g:c.g, n:0, sv:0, chal:0, un:0 };
    o.n++; z.n++; O.tot++;
    if (done){ o.sv++; z.sv++; O.sv++; }
    if (un){ o.un++; z.un++; O.unreach++; } else if (done) O.reach++;
    if (ch.length){ o.chal++; z.chal++; O.chal++; ch.forEach(function(k2){ o.cats[k2] = (o.cats[k2] || 0) + 1; }); }
  });
  var ord = function(a, b){ var ia = TAX_G.indexOf(a.g), ib = TAX_G.indexOf(b.g); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b.n - a.n; };
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  return { O:O, pct:pc(O.sv, O.tot),
    zones:Object.keys(zs).map(function(k){ return zs[k]; }).sort(ord).map(function(z){ return [z.g, z.n, z.sv, z.n - z.sv, pc(z.sv, z.n) + '٪', z.chal, z.un]; }),
    detail:Object.keys(by).map(function(k){ return by[k]; }).sort(ord).map(function(o){ var top = Object.keys(o.cats).sort(function(a, b){ return o.cats[b] - o.cats[a]; })[0] || '';
      return [o.g, o.t, o.n, o.sv, o.n - o.sv, pc(o.sv, o.n) + '٪', o.chal, top ? chalShow(top) + ' (' + o.cats[top] + ')' : '\u2014']; }) };   /* (V34.0) بمصطلح المالك — يصل الجداولَ والتقارير */
}
/* (V29.2) ملاحظةُ «تحديثات المنصة» #٣: «تأكيدُ نقاط الجمرات حسب المسح الميداني». النقطةُ مؤكَّدةٌ إذا وصلها المسحُ (تم الوصول)،
   وتُعرَض بالأدوار: كم نقطة، وكم أُكِّد، وكم تعذّر، وكم لم يُزر بعد، وكم فيه تحديات. */
function jmrConfirm(){
  var F = {}, tot = { n:0, ok:0, un:0, no:0, ch:0 };
  (STATE.sites || []).forEach(function(x){
    if (!isJmr(x)) return;
    var f = siteFloor(x), k = f == null ? 'بلا دور' : floorName(f), o = F[k] = F[k] || { k:k, i:f == null ? 9 : f, n:0, ok:0, un:0, no:0, ch:0 };
    var r = STATE.recs[x.id], done = svVisited(r), un = !!(r && r.access && r.access !== 'تم الوصول');   /* (V32.6) */
    o.n++; tot.n++;
    if (un){ o.un++; tot.un++; } else if (done){ o.ok++; tot.ok++; } else { o.no++; tot.no++; }
    if (done && chalKeys(r.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; })){ o.ch++; tot.ch++; }
  });
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var rows = Object.keys(F).map(function(k){ return F[k]; }).sort(function(a, b){ return a.i - b.i; }).map(function(o){ return [o.k, o.n, o.ok, o.un, o.no, o.ch, pc(o.ok, o.n) + '٪']; });
  if (rows.length) rows.push([t('الإجمالي'), tot.n, tot.ok, tot.un, tot.no, tot.ch, pc(tot.ok, tot.n) + '٪']);
  return { rows:rows, tot:tot };
}
function mfuInstalled(x){ var i = STATE.inss[x.id]; return !!(i && i.status === 'مُركّب'); }
function mfuLevel(p){ return p >= 75 ? ['ممتاز', 'ok'] : p >= 40 ? ['متوسط', 'wrn'] : ['ضعيف', 'bad']; }
function mfuCompanies(){
  if (DB.memo && DB.memo.cos) return DB.memo.cos;   /* (V33.7) مرةً في الرسمة */
  var obsIds = {}; mfuObstacles().forEach(function(o){ obsIds[o.x.id] = 1; });
  var by = {};
  (STATE.sites || []).forEach(function(x){
    if (x.type !== 'مخيم' || !x.co) return;
    var c = by[x.co] = by[x.co] || { co:x.co, n:0, ins:0, obs:0, sv:0, chal:0 };
    c.n++; if (mfuInstalled(x)) c.ins++; else if (obsIds[x.id]) c.obs++;
    var r1 = STATE.recs[x.id]; if (svVisited(r1)) c.sv++; if (r1 && svDone(r1) && chalKeys(r1.chals || []).some(function(k){ return k && k !== 'لا توجد تحديات'; })) c.chal++;   /* (V32.6) */   /* (V29.1) */
  });
  var res = Object.keys(by).map(function(k){ var c = by[k]; c.rem = c.n - c.ins - c.obs; c.pct = c.n ? Math.round(c.ins / c.n * 100) : 0; c.svp = c.n ? Math.round(c.sv / c.n * 100) : 0; return c; }).sort(function(a, b){ return b.pct - a.pct || b.n - a.n; });
  if (DB.memo) DB.memo.cos = res; return res;
}
function mfuKpis(){
  if (DB.memo && DB.memo.kpis) return DB.memo.kpis;   /* (V33.7) مرةً في الرسمة */
  var S = STATE.sites || [], tot = S.length, sv = 0, ins = 0, camp = 0, campIns = 0, cor = 0, corIns = 0;
  S.forEach(function(x){ var r = STATE.recs[x.id]; if (svVisited(r)) sv++; var i = mfuInstalled(x); if (i) ins++;   /* (V32.6) */
    if (x.type === 'مخيم'){ camp++; if (i) campIns++; } else if (x.type === 'ممر'){ cor++; if (i) corIns++; } });
  var C = mfuCompanies();
  var res = { tot:tot, sv:sv, ins:ins, camp:camp, campIns:campIns, cor:cor, corIns:corIns, obs:mfuObstacles().length,
           ex:C.filter(function(c){ return c.pct >= 75; }).length, md:C.filter(function(c){ return c.pct >= 40 && c.pct < 75; }).length, wk:C.filter(function(c){ return c.pct < 40; }).length,
           chal:mfuAllChal().filter(function(c){ return !mfuChalClosed(c); }).length, req:mfuList('req').filter(function(x){ return mfuReqView(x).st !== 'منجز'; }).length }; if (DB.memo) DB.memo.kpis = res; return res;
}
function mfuWeekKey(t){ var d = new Date(t || Date.now()); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); var y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return d.getUTCFullYear() + '-W' + ('0' + Math.ceil(((d - y) / 864e5 + 1) / 7)).slice(-2); }
/* لقطةُ الأسبوع: تُكتَب مرةً في الأسبوع حين يفتح المكتبُ الملخّص — ومنها المقارنة */
function mfuSnapMaybe(K){
  if (!may('settings') || !FB.ready || !FB.db) return;   /* على القاعدة الحقيقية فقط */
  var k = mfuWeekKey(), snap = mfuData().snap || {};
  if (snap[k]) return;
  mfuPut('snap', k, { sv:K.sv, ins:K.ins, campIns:K.campIns, corIns:K.corIns, obs:K.obs, at:Date.now() });
}
function mfuPrev(){
  var k = mfuWeekKey(), snap = mfuData().snap || {}, keys = Object.keys(snap).filter(function(x){ return x < k; }).sort();
  return keys.length ? snap[keys[keys.length - 1]] : null;
}
function mfuDelta(cur, prev, key, lowerIsBetter){
  if (!prev || prev[key] == null) return '';
  var d = cur - prev[key]; if (!d) return '<div class="hint" style="margin:2px 0 0">' + esc(t('كالأسبوع الماضي')) + '</div>';
  var good = lowerIsBetter ? d < 0 : d > 0;
  return '<div style="margin:2px 0 0;font-size:12px;font-weight:700;color:' + (good ? '#27AE60' : '#C0392B') + '">' + (d > 0 ? '\u25B2 +' : '\u25BC ') + nm(d) + ' ' + esc(t('عن الأسبوع الماضي')) + '</div>';
}
function mfuBar(p){ var c = p >= 75 ? '#27AE60' : p >= 40 ? '#E2B33C' : '#C0392B'; return '<div class="mfu-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%;background:' + c + '"></i><b>' + nm(p) + '\u066A</b></div>'; }
/* ═══ (V29.9) متابعةٌ ديناميكيةٌ بالتفكير من جهة الوزارة ═══
   ١) ملخّصٌ تنفيذيٌّ يُكتَب من الأرقام كلَّ مرة (لا يُكتَب بيد) ويُنسَخ بضغطة ويدخل التقارير.
   ٢) «ما ينتظر الوزارة»: تصاريحُ الدخول، ومنعُ الدخول، وما لم يوجد ميدانيًّا، والمخيماتُ بلا تخصيص، واعتمادُ الإعداد — كلٌّ بقائمته وتصديره.
   ٣) المعالمُ القادمة بمواعيدها وما بقي من أيام. */
function mfuBriefText(){
  var K = mfuKpis(), P = mfuPrev(), SV = svStats(), o = SV.O, C = mfuCompanies(), n = function(v){ return nm(v); };
  var d = function(k){ return P && P[k] != null ? (K[k] - P[k]) : null; }, dsv = d('sv'), dobs = d('obs');
  var L = [];
  L.push(t('حتى') + ' ' + hijriToday() + ' (' + dayKey() + '): ' + t('تمت زيارة') + ' ' + n(o.sv) + ' ' + t('من') + ' ' + n(o.tot) + ' ' + t('موقعًا') + ' (' + n(SV.pct) + '٪)' + (dsv != null ? '، ' + t('منها') + ' ' + n(Math.max(0, dsv)) + ' ' + t('هذا الأسبوع') : '') + '.');
  L.push(t('المتبقي') + ' ' + n(o.tot - o.sv) + ' ' + t('موقعًا') + (o.unreach ? '، ' + t('وتحتاج زيارةً أخرى تقنيًا') + ' ' + n(o.unreach) : '') + (o.chal ? '، ' + t('وفي') + ' ' + n(o.chal) + ' ' + t('موقعًا تحدياتٌ مسجّلة') : '') + '.');
  L.push(t('المعوقات القائمة') + ' ' + n(K.obs) + (dobs != null ? ' (' + (dobs > 0 ? '+' : '') + n(dobs) + ' ' + t('عن الأسبوع الماضي') + ')' : '') + '. ' + (K.ins ? t('التركيب') + ': ' + n(K.ins) + ' ' + t('نقطة') + '.' : t('التركيبُ لم يبدأ بعد، والشركاتُ') + ' ' + n(C.length) + ' ' + t('في مرحلة المسح') + '.'));
  /* (V33.0) قرارُ المالك: لا «ينتظر الوزارة» ولا تصاريحَ في الملخّص — ما زير ولم يُوصَل إليه «تحتاج زيارة أخرى تقنيًا» */
  var nRv = (STATE.sites || []).filter(function(x){ return svNeedsRevisit(STATE.recs[x.id]); }).length;
  if (nRv) L.push(n(nRv) + ' ' + t('نقطةً') + ' ' + t('تحتاج زيارة أخرى تقنيًا') + '.');
  if (wbsRows().length){ var PP = wbsProjectPct(); L.push(t('الخطة') + ': ' + t('المخطّط') + ' ' + n(PP.plan) + '٪ ' + t('والفعلي') + ' ' + n(PP.act) + '٪ (' + (PP.act - PP.plan >= 0 ? '+' : '') + n(PP.act - PP.plan) + '٪).'); }   /* (V30.2) */
  var al = alAll().filter(function(a){ return a.sites.length; }).map(function(a){ return n(a.sites.length) + ' ' + a.label; });   /* (V30.1) */
  if (al.length) L.push(t('تنبيهات') + ': ' + al.join('، ') + '.');
  return L.join('\n');
}
function mfuBriefCard(){
  var tx = mfuBriefText();
  return card('\u{1F4DD} ' + t('الملخّص التنفيذي'),   /* (V30.6) العنوانُ نصٌّ صِرف — كان الوسمُ يظهر حرفيًّا */
    '<p class="hint" style="margin:0 0 6px">' + esc(t('يُكتَب من الأرقام تلقائيًّا')) + '</p><p style="margin:0 0 8px;white-space:pre-line;line-height:1.7">' + esc(tx) + '</p>' + '<div class="actions" style="margin:0">' + btn(t('نسخ'), 'btn-quiet btn-sm', ' data-briefcopy="1"') + '</div>');
}
/* (V33.0) «ما ينتظر الوزارة» (mfuMinistryCard) حُذفت بقرار المالك: لا تصاريحَ ولا «متعذّر» في عرض الوزارة — السببُ الحقيقيُّ في سجلّ النقطة وسير العمل */
function mfuMilesCard(){
  var today = dayKey(), L = mileList().map(function(m){ var d = mileDateOf(m); return { n:m.n, d:d ? dayKey(d) : '', p:Math.round(mileDone(m) * 100), late:mileLate(m) }; });
  var up = L.filter(function(x){ return x.d && x.p < 100; }).sort(function(a, b){ return a.d < b.d ? -1 : 1; }).slice(0, 4);
  if (!up.length) return card('\u{1F3C1} ' + t('المعالم القادمة'), '<p class="hint" style="margin:0">' + esc(t('لا مواعيدَ للمعالم بعد — تُحدَّد من «التخطيط ← المعالم»')) + '</p>');
  return card('\u{1F3C1} ' + t('المعالم القادمة'), table(['المعلَم', 'الموعد', 'بقي', 'الإنجاز'], up.map(function(x){
    var days = Math.round((new Date(x.d) - new Date(today)) / 864e5);
    return ['<b>' + esc(x.n) + '</b>', '<span class="num">' + esc(x.d) + '</span>', x.late ? pill(t('متأخر') + ' ' + nm(-days) + ' ' + t('يوم'), 'bad') : '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>', mfuBar(x.p)]; })));
}
/* ═══ (V33.8) موجزُ الموسم — رأسُ صفحة الوزارة بطلب المالك: «ديزاين مميّز للوزارة» ═══
   أوّلُ ما يُرى: التاريخُ الهجريُّ والميلادي، وكم بقي لأقرب معلَم، وما جرى اليوم؛ ثم الحلقاتُ الأربعُ نفسُها التي في القاعة (المسح
   والتركيب والتسليم والفك — أخضرُ المنجز وأحمرُ المتبقي، وتفتح قوائمَها)؛ ثم مسارُ العمل الميداني: زياراتُ آخر أربعةَ عشرَ يومًا عمودًا عمودًا
   بوتيرة الأسبوع وتوقّعِ اكتمال أكبر مشعر؛ ثم أبرزُ ثلاثة تحديات. كلُّه من الأرقام نفسِها (لا رقمَ يُخترَع) ويُحسَب مرةً في الرسمة. */
function mfuHeroHtml(){
  var all = STATE.sites || [], n = all.length, sv = 0, ins = 0, hd = 0, ds = 0, now = Date.now(), today = dayKey(now);
  all.forEach(function(x){ if (svVisited(STATE.recs[x.id])) sv++; if (insDone(x.id)) ins++; if (handDone(x.id)) hd++; if (disDone(x.id)) ds++; });
  /* نبضُ ١٤ يومًا من السجلات مباشرةً — مرورٌ واحد */
  var days = [], byDay = {}; for (var i = 13; i >= 0; i--){ var k = dayKey(now - i * 864e5); days.push(k); byDay[k] = 0; }
  Object.keys(STATE.recs).forEach(function(id){ var r = STATE.recs[id]; if (!svVisited(r)) return; var k = dayKey(r.at || r._at); if (byDay[k] != null) byDay[k]++; });
  var vals = days.map(function(k){ return byDay[k]; }), mx = Math.max(1, Math.max.apply(null, vals)), wk = vals.slice(7).reduce(function(a, b){ return a + b; }, 0), prev = vals.slice(0, 7).reduce(function(a, b){ return a + b; }, 0);
  var W = 280, H = 56, bw = W / 14;
  var bars = vals.map(function(v, i){ var h = Math.max(2, Math.round(v / mx * (H - 14))); return '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h + '" rx="2" fill="' + (i === 13 ? 'var(--min-gold)' : 'var(--min-green)') + '" opacity="' + (i < 7 ? '.45' : '.9') + '"><title>' + esc(days[i]) + ': ' + nm(v) + '</title></rect>'; }).join('');
  var spark = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:56px;display:block" aria-label="' + esc(t('الزيارات الميدانية يومًا بيوم — آخر ١٤ يومًا')) + '">' + bars + '</svg>';
  var trend = prev ? Math.round((wk - prev) / prev * 100) : (wk ? 100 : 0);
  /* توقّعُ اكتمال أكبر مشعر */
  var K = siteKeyStats(), zones = Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }), z0 = zones[0], f = z0 ? zoneForecast(z0) : null, fc = '';
  if (f && f.eta) fc = t(z0) + ' ' + t('يكتمل نحو') + ' ' + dayKey(f.eta) + (f.due ? ' (' + (f.due >= f.eta ? t('قبل الموعد بـ') + ' ' + nm(Math.round((f.due - f.eta) / 864e5)) : t('بعد الموعد بـ') + ' ' + nm(Math.round((f.eta - f.due) / 864e5))) + ' ' + t('يومًا') + ')' : '');
  else if (f && f.stalled) fc = t(z0) + ' ' + t('بلا وتيرةٍ منذ أسبوعين');
  /* أقربُ معلَمٍ قادم */
  var next = null; try { (mileList() || []).forEach(function(m){ var d = mileDateOf(m); if (d && d >= now && (!next || d < next.d)) next = { d:d, n:m.n || m.name || m.t || '' }; }); } catch (e){ LS_ERR = e; }
  var dd = dayDone(today); dd.hand = 0;   /* (V34.3) التسليمُ اليوم من محضر التسليم في سجلّ التركيب */
  Object.keys(STATE.inss || {}).forEach(function(k){ var h = STATE.inss[k] && STATE.inss[k].hand; if (h && dayKey(h.at || h.ts || 0) === today) dd.hand++; });
  /* أبرزُ ثلاثة تحديات */
  var byCh = {}; svdRows().forEach(function(o){ o.ch.forEach(function(c){ byCh[c] = (byCh[c] || 0) + 1; }); });
  var top = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; }).slice(0, 3);
  return '<div class="mfu-hero">'
    + '<div class="mfu-hero-band"><div><div class="mfu-hero-t">' + esc(t('موجز الموسم')) + '</div><div class="hint" style="margin:0">' + esc(hijriToday()) + ' \u00b7 ' + esc(today) + '</div></div>'
    +   '<div class="mfu-hero-today"><span>' + esc(t('اليوم')) + '</span> <b>' + nm(dd.sv) + '</b> ' + esc(t('مسح')) + ' \u00b7 <b>' + nm(dd.ins) + '</b> ' + esc(t('تركيب')) + ' \u00b7 <b>' + nm(dd.hand) + '</b> ' + esc(t('تسليم')) + ' \u00b7 <b>' + nm(dd.dis) + '</b> ' + esc(t('فك'))   /* (V34.3) الأربعةُ يومًا بيوم */
    +     (next ? ' \u00b7 <span title="' + esc(next.n) + '">' + esc(t('أقرب معلَم')) + ' <b>' + nm(Math.max(0, Math.round((next.d - now) / 864e5))) + '</b> ' + esc(t('يومًا')) + '</span>' : '') + '</div></div>'
    + '<div class="kk kk-mini"><div class="kk-rings">'
    +   kioskRing(sv, n, 'المسح', 'sv', 'rem') + kioskRing(ins, n, 'التركيب', 'insd', 'insr') + kioskRing(hd, n, 'التسليم', 'hand', 'handr') + kioskRing(ds, n, 'الفك', 'disd', 'disr')
    + '</div></div>'
    + '<div class="mfu-hero-grid">'
    +   '<div class="card" style="margin:0"><div class="pid">' + esc(t('مسار العمل الميداني — آخر ١٤ يومًا')) + '</div>' + spark
    +     '<div class="hint" style="margin:6px 0 0">' + esc(t('هذا الأسبوع')) + ' <b>' + nm(wk) + '</b> ' + esc(t('زيارة')) + ' (' + (trend >= 0 ? '+' : '') + nm(trend) + '٪ ' + esc(t('عن الأسبوع الماضي')) + ')' + (fc ? ' \u00b7 ' + esc(fc) : '') + '</div></div>'
    +   '<div class="card" style="margin:0"><div class="pid">' + esc(t('أبرز التحديات')) + '</div>'
    +     (top.length ? top.map(function(c){ return '<div class="kk-zl"><span>' + esc(chalShow(c)) + '</span><b>' + nm(byCh[c]) + '</b></div>'; }).join('') : '<p class="hint" style="margin:0">' + esc(t('لا تحدّيَ مسجَّلًا بعد.')) + '</p>') + '</div>'
    + '</div></div>';
}
function mfuSummary(){
  /* (V32.5) طلبُ المالك: «أول حاجة في الملخّص من نسبة المسح» — البطاقاتُ أولًا وكلُّ بطاقةٍ تُضغَط فتفتح قائمتَها وتصديرَها؛
     وبطاقتا «النقاط بلا عوائق ولا تحديات» و«النقاط ذات التحديات» لكلِّ الأنواع؛ و«بانتظار قرار الوزارة» شيلت؛
     والملخّصُ التنفيذيُّ وما ينتظر الوزارة والتنبيهاتُ والمعالمُ والخطةُ تحت الصفحة. */
  var K = mfuKpis(), P = mfuPrev(); mfuSnapMaybe(K);
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var box = function(key, lbl, val, sub, dl, color){ return '<div class="mfu-kpi" data-svlist="' + esc(key) + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"><div class="mfu-kpi-l">' + esc(t(lbl)) + ' \u203A</div><div class="mfu-kpi-v"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</div>' + (sub ? '<div class="hint" style="margin:2px 0 0">' + sub + '</div>' : '') + (dl || '') + '</div>'; };
  var nClean = svListCount('clean'), nChal = svListCount('chal');   /* (V33.7) عدٌّ لا بناءُ صفوف */
  return svListPop() + mfuHeroHtml()   /* (V33.8) موجزُ الموسم أوّلًا */
    + '<div class="mfu-kpis">'
    + box('sv', 'نسبة المسح', nm(pc(K.sv, K.tot)) + '\u066A', esc(t('تمت الزيارة')) + ' ' + nm(K.sv) + ' ' + esc(t('من')) + ' ' + nm(K.tot), mfuDelta(K.sv, P, 'sv'))
    + box('clean', 'نقاط بلا عوائق', nm(nClean), esc(t('تمت الزيارة وتم الوصول بلا تحديات — كلُّ الأنواع')), '', '#27AE60')
    + box('chal', 'نقاط بعوائق', nm(nChal), esc(t('تمت الزيارة وفيها تحدٍّ أو تحتاج زيارة أخرى تقنيًا')), '', '#C0392B')
    + box('obs', 'المعوقات القائمة', nm(K.obs), esc(t('تحدياتٌ أو تعذّرُ وصولٍ على نقاطٍ لم تُركَّب')), mfuDelta(K.obs, P, 'obs', true))
    + box('campok', 'مخيمات بلا عائق', nm(svListCount('campok')), esc(t('تمت الزيارة وتم الوصول بلا تحديات')), '', '#27AE60')
    + box('campins', 'تركيب المخيمات', nm(pc(K.campIns, K.camp)) + '\u066A', nm(K.campIns) + ' ' + esc(t('من')) + ' ' + nm(K.camp), mfuDelta(K.campIns, P, 'campIns'))
    + box('corins', 'تركيب الممرات', nm(pc(K.corIns, K.cor)) + '\u066A', nm(K.corIns) + ' ' + esc(t('من')) + ' ' + nm(K.cor), mfuDelta(K.corIns, P, 'corIns'))
    + (K.ins ? box('cos', 'شركات الخدمة', '<span style="color:#27AE60">' + nm(K.ex) + '</span> \u00b7 <span style="color:#E2B33C">' + nm(K.md) + '</span> \u00b7 <span style="color:#C0392B">' + nm(K.wk) + '</span>', esc(t('ممتاز · متوسط · ضعيف')), '')
             : box('cos', 'شركات الخدمة', nm(mfuCompanies().length), esc(t('مرحلة المسح — لم يبدأ التواصل والتركيب')), ''))
    + box('chalo', 'تحدياتٌ مفتوحة', nm(K.chal), esc(t('مسجّلةٌ في المتابعة')), '') + box('req', 'طلباتٌ قيد المتابعة', nm(K.req), '', '')
    + '</div>' + (P ? '' : '<p class="hint">' + esc(t('المقارنةُ بالأسبوع الماضي تبدأ من الأسبوع القادم — تُحفَظ لقطةُ هذا الأسبوع الآن.')) + '</p>')
    + mfuBlocksCard() + mfuOwnersCard() + mfuWeeksCard() + mfuTimelineCard()
    + mfuBriefCard() + alCard() + mfuMilesCard() + wbsPlanCard();   /* (V33.0) «ما ينتظر الوزارة» شيلت: لا تصاريحَ في العرض */
}
function mfuWeekRows(){
  return wtRows().slice().sort(function(a, b){ var o = { 'متوقف':0, 'جاري العمل':1, 'قيد الانتظار':2, 'مكتمل':3 }; return (o[a.st] - o[b.st]) || String(a.due || '9').localeCompare(String(b.due || '9')); }).map(function(r){
    var last = (Array.isArray(r.log) ? r.log : []).filter(function(e){ return e && e.note; })[0];
    return { r:r, upd:(last && last.note) || r.upd || '', late:wtLate(r) };
  });
}
function mfuTasks(){
  var W = mfuWeekRows(), L = mileList();
  var stp = function(r, late){ return pill(t(r.st), r.st === 'مكتمل' ? 'ok' : r.st === 'متوقف' || late ? 'bad' : r.st === 'جاري العمل' ? 'wrn' : ''); };
  return (W.length ? cardFlush(t('حالة أبرز المهام') + ' \u2014 ' + nm(W.length), table(['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث'], W.map(function(x){
      var r = x.r;
      return ['<b>' + esc(r.n) + '</b>' + (r.chal ? '<div class="hint" style="margin:2px 0 0;color:' + (r.st === 'مكتمل' ? '#27AE60' : '#C0392B') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('تم حلُّ التحدي')) : '\u26A0 ' + esc(t('معالجةُ تحدٍّ'))) + '</div>' : ''),
              esc(r.track || '\u2014'), esc(r.who || '\u2014'), stp(r, x.late) + (x.late ? ' ' + pill(t('متأخرة'), 'bad') : ''), esc(r.due || '\u2014'), esc(String(x.upd).slice(0, 90))];
    }))) : '<p class="hint">' + esc(t('لا مهامَّ أسبوعيةٌ بعد — تُضاف من «المهام الأسبوعية».')) + '</p>')
    + cardFlush(t('المعالم'), table(['المعلم', 'الموعد', 'الإنجاز', 'الحالة'], L.map(function(m){
        var p = Math.round(mileDone(m) * 100), late = mileLate(m), d = mileDateOf(m);
        var st = p >= 100 ? ['مكتمل', 'ok'] : late ? ['متأخر', 'bad'] : p > 0 ? ['جارٍ', 'wrn'] : ['لم يبدأ', ''];
        return ['<b>' + esc(t(m.n)) + '</b>', d ? esc(fmtDate(d)) : '\u2014', mfuBar(p), pill(t(st[0]), st[1])];
      })));
}
function mfuInst(){
  var Z = {};
  (STATE.sites || []).forEach(function(x){ var k = x.zone + '|' + x.type; var o = Z[k] = Z[k] || { z:x.zone, ty:x.type, n:0, i:0 }; o.n++; if (mfuInstalled(x)) o.i++; });
  var rows = Object.keys(Z).map(function(k){ return Z[k]; }).sort(function(a, b){ return a.z < b.z ? -1 : a.z > b.z ? 1 : b.n - a.n; });
  return cardFlush(t('حالة التركيبات'), table(['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة'], rows.map(function(o){
    var p = o.n ? Math.round(o.i / o.n * 100) : 0, d = CAT_DEF[o.ty] || { l:o.ty, i:'' };
    return [esc(t(o.z)), (d.i || '') + ' ' + esc(t(d.l)), N(o.n), N(o.i), mfuBar(p)];
  })));
}
/* ═══ (V29.6) قرارُ المالك: «كارتٌ بالمخيمات اللي ما فيهاش تحديات، وأيُّ كارتٍ أضغطه يطلعلي قائمة أقدر أعملها تصدير — وكارتٌ
   للنقاط اللي ما فيهاش صور، بالنوع والمشعر، عشان أوجّه الشباب يزوّدوا الصور» ═══ */
var SV_POP = '';
function mfuObsMap(){   /* (V32.5) معرّفُ النقطة ← فئاتُ معوّقاتها — مرةً في الثانية بإصدار الإحصاء نفسِه (لا مرورَ على النقاط لكلِّ صف) */
  var c = mfuObsMap.c; if (c && c.v === STAT_VER && Date.now() - c.at < 1000) return c.m;
  var m = {}; mfuObstacles().forEach(function(e){ m[e.x.id] = e.cats; }); mfuObsMap.c = { v:STAT_VER, at:Date.now(), m:m }; return m;
}
function svHasChal(r){ return chalKeys((r && r.chals) || []).some(function(k){ return k && k !== 'لا توجد تحديات'; }); }
function svPhotoState(x, r){ var n = photosOf(x.id).length; if (n) return ''; return (r && Array.isArray(r.photos) && r.photos.length) ? 'التُقطت ولم تُرفع من الجهاز' : 'لم تُلتقط صور'; }
var SV_LISTS = {
  sv:      ['تمت الزيارة',            function(x, r){ return svVisited(r); }],   /* (V32.6) بأيِّ نتيجة — (V32.7) بمصطلح المالك */
  rem:     ['المتبقي — لم تتم زيارتها', function(x, r){ return !svVisited(r); }],
  clean:   ['نقاط بلا عوائق', function(x, r){ return svClean(r); }],   /* (V32.5) كلُّ الأنواع — (V33.0) بالتعريف الواحد */
  obs:     ['نقاط عليها معوّقات',        function(x, r){ return !!mfuObsMap()[x.id]; }],
  campins: ['المخيمات وحالةُ تركيبها',    function(x, r){ return x.type === 'مخيم'; }],
  corins:  ['الممرات وحالةُ تركيبها',     function(x, r){ return x.type === 'ممر'; }],
  chal:    ['نقاط بعوائق', function(x, r){ return svObstacle(r); }],   /* (V33.0) تمت الزيارة وفيها تحدٍّ أو تحتاج زيارة أخرى تقنيًا */
  unreach: ['تعذّر الوصول',            function(x, r){ return !!(r && r.access && r.access !== 'تم الوصول'); }],
  campok:  ['مخيمات بلا تحديات', function(x, r){ return taxOf(x).t === 'مخيمات' && svClean(r); }],   /* (V33.4) بالتعريف الواحد — والزيارةُ بقرار المهندس بلا تحدٍّ بلا عائق */
  nophoto: ['زيارات بلا صور',          function(x, r){ return !!(r && svDone(r)) && !recIsQuick(r) && !!svPhotoState(x, r); }],   /* (V33.5) الزيارةُ بقرار المهندس بلا نموذجٍ ولا صورٍ أصلًا — ليست «بلا صور» */
  insd:    ['تم التركيب',               function(x, r){ return insDone(x.id); }],   /* (V33.5) حلقاتُ القاعة الأربع */
  insr:    ['المتبقي — لم يُركَّب',      function(x, r){ return !insDone(x.id); }],
  hand:    ['تم التسليم',               function(x, r){ return handDone(x.id); }],
  handr:   ['المتبقي — لم يُسلَّم',      function(x, r){ return !handDone(x.id); }],
  disd:    ['تم الفك',                  function(x, r){ return disDone(x.id); }],
  disr:    ['المتبقي — لم يُفَك',         function(x, r){ return !disDone(x.id); }],   /* (V34.3) من الكلّ كالثلاثة */
  badphoto:['صور تحتاج إعادة',          function(x, r){ return photosOf(x.id).some(function(e){ return photoQualityFlags(e[1].q).length > 0; }); }],   /* (V30.6) photosOf يعيد [مفتاح، وثيقة] */
  /* (V29.9) ما ينتظر الوزارة — بالتفكير من جهتها: ما لا يتحرّك إلا بقرارها أو بملفٍّ منها */
  permit:  ['تحتاج تصريح دخول',          function(x, r){ return !!(r && r.access === 'يحتاج تصريح'); }],
  denied:  ['منع دخول — تنسيق',          function(x, r){ return !!(r && r.access === 'منع دخول'); }],
  missing: ['غير موجودة ميدانيًا — تصحيح السجل', function(x, r){ return !!(r && r.access === 'غير موجود'); }],
  noalloc: ['مخيمات بلا تخصيص',          function(x, r){ return taxOf(x).t === 'مخيمات' && (x.reason === 'عدم وجود تخصيص' || !String(x.co || '').trim()); }],
  minwait: ['بانتظار اعتماد الوزارة',     function(x, r){ return lifeOf(x) === 'minwait'; }]
};