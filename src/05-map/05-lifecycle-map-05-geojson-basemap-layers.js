/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-05-geojson-basemap-layers.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : GeoJSON export, offline Makkah basemap, device map for outages, ministry buildings and tafweej places layers, Mina sensor planning and camp-boundary editing.
   DEFINES : basemapWarm, basemapManifest, basemapHave, basemapAuto, basemapWant, basemapStale, poiPaint, mayIot
   GLOBALS : BASEMAP, BASEMAP_CACHE, BASEMAP_JS, POIL, POIL_C, IOT, IOT_C
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */


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
PV.POIL_C = { ministry:'#8E44AD', tafweej:'#E67E22' };

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
      L.circleMarker([+p.lat, +p.lng], { renderer:MAP_CV || undefined, radius:7, color:'#fff', weight:2, fillColor:PV.POIL_C[k], fillOpacity:.95, bubblingMouseEvents:false })
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


/* ═══ تعديلُ الحساسات من الميدان (V25.8) ═══
   قرارُ المالك: المهندسُ فما فوق والمشرفُ (هو من يمسح الموقع) — يعدّلون خطّةَ المخيم: نقلُ حساسٍ أو
   الجيت واي، وزيادةٌ ونقص. الحفظُ تعديلٌ فوق الطبقة المبدئية في وثيقة الموقع (siteOv.iot) فيصل الأجهزةَ
   كلَّها كسائر تعديلات المواقع ولا يحتاج مجموعةً ولا قاعدةً جديدة، ويُسجَّل في الأحداث. ولا جيت واي ثانٍ:
   إن بعُد حساسٌ عن ١٥٠ م نُبِّه وأُشير إلى مركز الحساسات. */
function mayIot(){ var b = (typeof effRole === 'function') ? effRole(ROLE) : ROLE; return b === 'engineer' || b === 'admin' || b === 'supervisor'; }


