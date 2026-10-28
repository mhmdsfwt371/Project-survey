/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-02-map-incremental.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Incremental map painting (never rebuilt from scratch), marker cache MK, faster first paint, flying to a point, locate, theme and satellite toggles.
   DEFINES : shapeMk, mapClickFn, mkPlace, mkDrain, mkSweep, mkCount, mapPaintLight, mapPaint, mapFlySoon, mapFly, mapTheme, mapSat
   GLOBALS : MK, ShapeMk, MK_PAD, MK_FIRST
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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
PV.ShapeMk = null;
function shapeMk(ll, opt, shape){
  if (!PV.ShapeMk && typeof L !== 'undefined' && L.CircleMarker){
    PV.ShapeMk = L.CircleMarker.extend({
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
  return PV.ShapeMk ? new PV.ShapeMk(ll, opt) : L.circleMarker(ll, L.extend({ renderer:MAP_CV }, opt));
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
  var ring = !picked ? briefRing(x.id) : '';   /* (V39.27) the mode's summary frames the point in every mode */
  var pos = mapPosOf(x), posK = pos[0].toFixed(6) + ',' + pos[1].toFixed(6), FT = null, kind, shp = 'circle';
  /* المخيمُ مضلّعٌ إن تقرّبت (POLY_Z) وإلا دائرة، والممرُّ والكاميرا معيّنان، وما عداهما شكلُ نوعه */
  if (x.type === 'مخيم' && z >= POLY_Z && (FT = campFoot(x))) kind = 'poly';
  /* (V37.66) بلاغُ المالك: «غيّرت حدود المخيم والرسمة الزرقا ما اتغيّرتش» — مفتاحُ الشكل كان موضعَ العلامة وحدَه، فإذا تبدّلت الحدودُ وبقي الموضع
     عُدِّل اللونُ فقط وبقي المضلّعُ القديم حتى إعادة التحميل. الآن بصمةُ الحدود جزءٌ من المفتاح: أيُّ تعديلٍ يُعيد رسمَ المضلّع فورًا. */
  if (kind === 'poly'){ var sg = 0; FT.forEach(function(q, qi){ sg += (q[0] * 1e6 % 9973) * (qi + 1) + (q[1] * 1e6 % 7919); }); posK += '|' + FT.length + ':' + Math.round(sg); }
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
PV.MK_FIRST = 400;
function mkDrain(gen, z, r, sun, TOUCH){
  requestAnimationFrame(function(){
    if (gen !== MK.gen || !MK.defer) return;   /* رسمةٌ أحدثُ بدأت: هذه الدفعةُ لم تعد مطلوبة */
    var chunk = MK.defer.splice(0, PV.MK_FIRST);
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
  if (IOT.on) iotPaint();
  if (covPaint.on) covPaint();   /* (V39.14) */
  if (heatPaint.on) heatPaint();   /* (V39.16) */   /* (V25.7) طبقةُ الحساسات تتبع الإطار */
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
  if (PV.MAP_POLY) PV.MAP_POLY.clearLayers();

  var b = MAP.getBounds(), keep = b.pad(MK_PAD);
  /* على الشاشات اللمسية تكبر النقطةُ قليلًا: البصرُ يقرأ الصغيرَ والإصبعُ لا يصيبه. */
  var TOUCH = (typeof L !== 'undefined' && L.Browser && L.Browser.touch) ? 1 : 0;
  var r = z >= 16 ? 7 : (z >= 14 ? 5 : (z >= 12 ? 3.5 : 2.5));
  if (TOUCH) r = Math.max(r + 1.5, 4.5);
  var sun = (typeof SUN_ON !== 'undefined' && SUN_ON && !(typeof KIOSK_ON !== 'undefined' && KIOSK_ON)) ? 1 : 0;
  if (sun) r = r * 1.4 + 1;   /* وضعُ الشمس: علاماتٌ أسمك (V17.99) */
  var inView = 0, want = {};

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
    want[x.id] = 1;
    if (MK.defer && !MK.by[x.id] && made >= PV.MK_FIRST){ MK.defer.push(x); continue; }   /* (V31.8) */
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
    if (typeof PV.TFD === 'object' && PV.TFD.on && MAP_TMP){   /* (V28.0) المسارُ المرسومُ قبل حفظه */
      PV.TFD.paths.forEach(function(pl){ L.polyline(pl, { renderer:MAP_CV, color: PV.TFD.d === 'go' ? '#F5C400' : '#D0021B', weight:6, opacity:0.95, dashArray: PV.TFD.d === 'back' ? '8 6' : null, interactive:false }).addTo(MAP_TMP); });
      (PV.TFD.pts || []).forEach(function(n, i){ L.circleMarker(n, { renderer:MAP_CV, radius:6, color:'#fff', weight:2, fillColor: PV.TFD.nodes[i] >= 0 ? '#FF8C42' : '#9B51E0', fillOpacity:1, interactive:false }).addTo(MAP_TMP); });   /* (V28.1) الحرّةُ بنفسجية */
    }
    if (PV.SPLIT) splitPaint();   /* (V37.67) معاينةُ التقسيم */ if (typeof propMarkers === 'function') propMarkers();   /* (V37.69) */ if (typeof ROUTE === 'object' && ROUTE.on && ROUTE.pts.length && MAP_TMP){
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
      var drag = !isArea && gen.length <= PV.RT_DRAG_MAX;
      gen.slice(0, drag ? PV.RT_DRAG_MAX : 600).forEach(function(g, gi){
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
  if (IOT.on) iotPaint();
  if (covPaint.on) covPaint();   /* (V39.14) */
  if (heatPaint.on) heatPaint();   /* (V39.16) */   /* (V25.7) */
  /* (V38.34) train gates are registry points now — painted like any point */
}

/* (V38.20) «فتح موقع النقطة على الخريطة لا يعمل للمشرف»: كان الطيرانُ بعد نصف ثانيةٍ ثابتة، والخريطةُ في أوّل فتحٍ
   (وهي حالُ المشرف غالبًا — لا يفتح الخريطةَ قبل البحث) تُبنى بعد أن تُحمَّل مكتبتُها؛ فيمرّ الموعدُ ولا خريطةَ فلا يطير،
   وتُفتَح على منظرها الافتراضيّ. صار ينتظر الخريطةَ حتى عشر ثوانٍ، والخريطةُ حين تُبنى تبدأ عند النقطة المطلوبة نفسِها */
function mapFlySoon(id){
  clearTimeout(mapFlySoon.t); mapFlySoon.id = id; var n = 0;
  (function go(){
    if ((typeof MAP !== 'undefined' && MAP) || (typeof MAP_3D !== 'undefined' && MAP_3D && typeof M3 !== 'undefined' && M3)){ mapFly(id); mapFlySoon.id = ''; return; }
    if (++n < 40){ mapFlySoon.t = setTimeout(go, 250); return; }
    mapFlySoon.id = ''; toast(t('تعذّر فتح الخريطة الآن — اضغط «على الخريطة» مرةً أخرى'));
  })();
}
function mapFly(id){
  var x = siteFind(id);
  if (x && MAP) MAP.setView([x.lat, x.lng], 18);
  if (x && MAP_3D && M3){ try { M3.flyTo({ center:[+x.lng, +x.lat], zoom:17, pitch:60, duration:900 }); } catch (e){ LS_ERR = e; } }
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

