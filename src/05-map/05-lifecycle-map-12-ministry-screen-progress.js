/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-12-ministry-screen-progress.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Ministry hall screen, completion forecast, progress map, far points, satellite in the ministry screen, week sentence and the hall view.
   DEFINES : zoneForecast, forecastHtml, geoOutliers, pmState, pmViewBox, pmApply, pmZoomAt, pmReset, pmFrac, kkSatHtml, kkSatInit, pointMap, kioskObsTally, kioskObsHtml … (+8 more)
   GLOBALS : KK_ZONE, PM_VIEW, PM_DRAG, KK_VIEW, PM_CLICK_SKIP, KIOSK_ON, KSC
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ شاشةُ الوزارة — العرضُ الذي يُقرأ من آخر القاعة (V17.82) ═══
   الاجتماعُ مع الوزارة لا يُقرأ فيه جدول: يُقرأ رقمٌ كبيرٌ ونسبةٌ وشريطٌ لكلِّ
   مشعر، ثم نبضُ الميدان في يومٍ، ثم ما ينتظر قرارًا من الحاضرين أنفسِهم.
   الأرقامُ كلُّها من الدوالِّ التي تقرأ منها الشاشاتُ الأخرى (siteKeyStats
   وlifeOf وsvdRows) — فلا يخالف العرضُ ما في الجدول. وزرُّ «عرضٌ كامل» يُخفي
   القوائمَ ويملأ الشاشةَ ويجدّدها كلَّ دقيقة. */


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


var PM_CLICK_SKIP = 0;

/* ═══ الأسبوعُ في جملة (V17.89) ═══
   الرقمُ يُقرأ، والجملةُ تُقال في الاجتماع. تُبنى من الأرقام نفسِها: ما مُسح
   في سبعة أيام، وأكبرُ مشعرٍ ومتى يكتمل مقارنًا بالموعد، وما ينتظر قرارَ
   الوزارة — بلا صفةٍ لا رقمَ خلفها. */


/* العدّاداتُ تتحرّك من الصفر إلى رقمها حين تُفتَح الشاشة — الرقمُ يُرى وهو يُبنى */


var KIOSK_ON = false, KIOSK_TIMER = null, KIOSK_CYCLE = null, KIOSK_STEP = 0;


var KSC = null;   

