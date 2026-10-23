/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-17-from-ext-camps-03-nusuk-card-system.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-17-from-ext-camps-03-nusuk-card-system.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : pilotSites, pilotNet
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ (V37.80) كارتُ «التجارب والديمو» في متابعة الوزارة ═══
   طلبُ المالك: كارتٌ بجوار المسح والزيارة، يُضغط فتظهر نقاطُ التجربة بحالة تركيبها واتصالها
   (أونلاين/أوفلاين) وبيانات نظام البطاقات. الاتصالُ من نبضات أداة الفحص (hb) ثم فحص المتصفح،
   وبياناتُ البطاقات من بثّ القرّاء برقم القارئ المسجَّل في التركيب. */
function pilotSites(){ return (STATE.sites || []).filter(function(x){ return x && x.pilot; }); }

function pilotNet(x){
  var HB = STATE.hb || {}, up = 0, n = 0, at = 0;
  Object.keys(HB).forEach(function(k){
    var h = HB[k]; if (!h || h.site !== x.id || !h.st) return;
    n++; if (h.st === 'up') up++;
    var ts = Date.parse(h.ts || '') || +h.ts || 0; if (ts > at) at = ts;
  });
  if (n) return { st: up === n ? 'متصل' : up ? 'متصل جزئيًّا' : 'غير متصل', at:at, src:'أداة الفحص', up:up, n:n };
  var me = HB[x.id];
  if (me && typeof me.alive === 'boolean') return { st: me.alive ? 'متصل' : 'غير متصل', at:+me.at || 0, src:'فحص المتصفح', up:me.alive ? 1 : 0, n:1 };
  var nk = pilotNusuk(x);
  if (nk.at) return { st: Date.now() - nk.at < 30 * 60000 ? 'متصل' : 'غير متصل', at:nk.at, src:'نظام البطاقات', up:0, n:0 };
  return { st:'لا إشارة', at:0, src:'', up:0, n:0 };
}
