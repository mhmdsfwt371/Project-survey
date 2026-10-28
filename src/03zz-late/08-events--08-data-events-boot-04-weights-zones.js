/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-04-weights-zones.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-04-weights-zones.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : zoneCode, mxDeclareGo
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function zoneCode(zone){
  if (PV.ZONE_CODE[zone]) return PV.ZONE_CODE[zone];
  var en = (D.en && D.en[zone]) || '';
  var a = String(en).replace(/[^A-Za-z]/g, '').toUpperCase();
  return a ? a.slice(0, 3) : 'NEW';
}

/* حذفُ صفٍّ = حذفُ مواقعه. لا يقع إلا بلا مواقع — والصفُّ لا يكون بلا مواقع
   أصلًا لأنه مشتقٌّ منها. فيُقال ذلك بدل زرٍّ لا يعمل. */
function mxDeclareGo(){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var zSel = g('mxdZ'), zone = zSel === '__new' ? g('mxdZn') : zSel;
  var tk = g('mxdT'), T = typesList();
  if (!zone){ toast(t('اكتب اسم المشعر')); return; }
  if (!T[tk]){ toast(t('اختر نوعًا')); return; }
  mxDeclare(zone, T[tk].l);
}
