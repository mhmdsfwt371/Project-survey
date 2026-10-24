/* ============================================================================
   FILE    : src/03z-shared/03z-shared-01-from-tasks-office-01-task-panel-map3d.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-01-task-panel-map3d.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : m3Height, m3Points, m3Cols, m3Count, m3Paint
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ الخريطةُ ثلاثيةً — زرٌّ واحدٌ على الخريطة نفسِها ═══
   كان العرضُ الثلاثيُّ صفحةً مستقلةً بمرشِّحاتها وألوانها — فتعرض غيرَ ما
   تعرضه الخريطة، ويُسأل «أيُّهما الصحيح؟». والصحيحُ واحد: الخريطةُ بطبقتها
   (المسح · التركيب · الفك) ومرشِّحاتها وشركاتها وحالاتها وألوانها. فصار
   الثلاثيُّ **وضعًا** للخريطة نفسِها: زرُّ «٣د» يرفع المشهدَ نفسَه بتضاريس
   المشاعر وأعمدةٍ بارتفاع التركيب المسجَّل — النقاطُ نفسُها بالألوان نفسِها
   والنقرةُ نفسُها تفتح البطاقةَ نفسَها — و«٢د» يعيده حيث كان.
   المحرّكُ لا يُحمَّل إلا عند أوّل ضغطة (ثمانمئة كيلوبايتٍ لا تُثقل الميدان
   الذي لا يطلبه)، ويبقى حيًّا بعدها؛ والقمرُ الصناعيُّ يتبعه من الزرِّ نفسِه. */
var MAP_3D = false, M3 = null, M3_READY = false, M3_LOADING = null, M3_ERR = '';

/* ارتفاعُ العمود: ما سجّله المسحُ، وإلا افتراضٌ بحسب النوع */
/* (V39.21) owner: «أقدر بالماوس أدخل جوّه المكان» — the camera walks into the camp: it stands at the gate (the point),
   two metres from the ground, looking along the camp (towards the boundary's centre), tilted to the engine's limit; a
   second call on the same camp turns it to look back at the gate's devices. The gateway and sensors inside show through
   the translucent tents, and the tooltip names each one under the mouse. */
function m3Enter(id){
  if (!MAP_3D || !M3) return false;
  var x = siteFind(id); if (!x || !(+x.lat && +x.lng)) return false;
  var ring = campFoot(x), cy = +x.lat, cx = +x.lng;
  if (ring && ring.length >= 3){ cy = 0; cx = 0; ring.forEach(function(q){ cx += +q[0]; cy += +q[1]; }); cx /= ring.length; cy /= ring.length; }
  var g0 = typeof iotGateOf === 'function' ? iotGateOf(id) : null, at = g0 ? { lat:g0[0], lng:g0[1] } : { lat:+x.lat, lng:+x.lng };   /* (V39.23) the real street entrance */
  var bearing = Math.atan2((cx - at.lng) * Math.cos(at.lat * Math.PI / 180), cy - at.lat) * 180 / Math.PI;
  if (m3Enter.last === id) bearing += 180;   /* turn around */
  m3Enter.last = id;
  try { M3.flyTo({ center:[at.lng, at.lat], zoom:20, pitch:80, bearing:bearing, duration:1600, essential:true }); } catch (e){ LS_ERR = e; return false; }
  return true;
}
/* (V39.18) the measures of a Mina tent module and its colours, in metres — a function, not a new global; the points layer
   needs the plinth height here, the tents module (office chunk) needs the rest */
function tentCfg(){ return { size:8, aisle:1.5, body:3.2, roof:4.4, fenceH:2.2, fenceW:0.3, max:400, fabric:'#F3F0E7', roofC:'#E4DFD1', fence:'#B4AD9E', plinth:0.5 }; }
/* (V39.15) owner: «طوابق منشأة الجمرات» — a point on a floor stands on that floor: 4.2 m per floor, from the name's «الدور …»
   (siteFloor), so the facility's cameras stack instead of piling on one spot. Ground and the unknown stay at 0. */
function m3Base(x){ var f = typeof siteFloor === 'function' ? siteFloor(x) : null; return f != null && f > 0 ? f * 4.2 : 0; }
function m3Height(x){
  var r = STATE.recs[x.id] || {}, h = +r.hgt || 0;
  if (h > 0) return Math.max(2, Math.min(25, h));
  return x.type === 'مخيم' ? 4 : (x.type === 'كاميرا' ? 8 : 6);
}

/* حدودُ المخيمات كما حسبها m3Points — يقرؤها m3Cols في الرسمة نفسِها بلا بحثٍ
   ثانٍ بالمعرِّف (الفهرسُ قد يكون أقدمَ من القائمة لحظةَ الرسم) */
var M3_FOOT = {};

function m3Points(){
  var LIST = (typeof layerFiltered === 'function') ? layerFiltered() : (STATE.sites || []);
  M3_FOOT = {};
  return LIST.filter(function(x){ return +x.lat && +x.lng; }).map(function(x){
    var picked = (typeof selHas === 'function') && selHas(x.id);
    /* المخيمُ بحدوده الحقيقية كما يُرسَم في المسطّح — لا نقطةً — إن كانت حدودُه محمَّلة */
    var ring = campFoot(x);   /* المرسومةُ في التطبيق أو poly.json (V17.59) */
    if (ring) M3_FOOT[x.id] = ring;
    var foot = ring ? 1 : 0;
    return { type:'Feature', geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] },
      properties:{ id:x.id, color:mapColorOf(x), h:(ring && typeof tentOn === 'function' && tentOn()) ? tentCfg().plinth : m3Height(x), base:m3Base(x), sel:picked ? 1 : 0,   /* (V39.18) under the tents the camp is a thin plinth in its colour */
        ring:picked ? '#ffffff' : ((FIELD_MODE === 'brief' && briefRing(x.id)) || '#0b1220'), foot:foot } };
  });
}

/* المخيمُ يُرفَع بحدوده المرسومة (poly.json — الحدودُ نفسُها التي يرسمها المسطّح
   عند التقريب)، وما سواه عمودٌ مضلّعٌ صغيرٌ حول نقطته — المحرّكُ لا يرفع نقطةً */
function m3Cols(P){
  return P.map(function(f){
    var p = f.properties, c = f.geometry.coordinates, lng = c[0], lat = c[1];
    var FR = p.foot ? M3_FOOT[p.id] : null;
    if (FR && FR.length >= 3){
      var R = FR.map(function(q){ return [+q[0], +q[1]]; });
      var a0 = R[0], aN = R[R.length - 1];
      if (a0[0] !== aN[0] || a0[1] !== aN[1]) R.push([a0[0], a0[1]]);
      return { type:'Feature', properties:p, geometry:{ type:'Polygon', coordinates:[R] } };
    }
    var d = 2.2, dy = d / 111320, dx = d / (111320 * Math.cos(lat * Math.PI / 180));
    return { type:'Feature', properties:p,
      geometry:{ type:'Polygon', coordinates:[[[lng - dx, lat - dy], [lng + dx, lat - dy], [lng + dx, lat + dy], [lng - dx, lat + dy], [lng - dx, lat - dy]]] } };
  });
}

function m3Count(P){
  var lb = document.getElementById('mapCount');
  if (!lb || !MAP_3D || !M3) return;
  try {
    var b = M3.getBounds(), inV = P.filter(function(f){ return b.contains(f.geometry.coordinates); }).length, out = P.length - inV;
    lb.textContent = nm(inV) + ' / ' + nm(P.length) + ' ' + t('في الإطار') + (out > 0 ? ' \u00b7 ' + nm(out) + ' ' + t('خارج الإطار') : '');
  } catch (e){ LS_ERR = e; }
}

function m3Paint(){
  if (!M3 || !M3.getSource) return;
  var P = m3Points();
  try {
    var s1 = M3.getSource('nsk');  if (s1) s1.setData({ type:'FeatureCollection', features:P });
    var s2 = M3.getSource('nskc'); if (s2) s2.setData({ type:'FeatureCollection', features:m3Cols(P) });
  } catch (e){ LS_ERR = e; }
  try { if (typeof m3IotPaint === 'function') m3IotPaint(); } catch (e2){ LS_ERR = e2; }   /* (V39.11) */
  try { if (typeof dtwPaint === 'function') dtwPaint(); } catch (e3){ LS_ERR = e3; }   /* (V39.13) */
  try { covPaint3d(); } catch (e4){ LS_ERR = e4; }   /* (V39.14) */
  try { heatPaint3d(); } catch (e5){ LS_ERR = e5; }   /* (V39.16) */
  try { if (typeof tentPaint === 'function') tentPaint(); } catch (e6){ LS_ERR = e6; }   /* (V39.18) */
  try { if (typeof phPinPaint === 'function') phPinPaint(); } catch (e7){ LS_ERR = e7; }   /* (V39.19) */
  try { if (typeof teMaybe === 'function') teMaybe(true); } catch (e8){ LS_ERR = e8; }   /* (V39.24) the models follow the data — and appear on entering 3D already close */
  m3Count(P);
}
