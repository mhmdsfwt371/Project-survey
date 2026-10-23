/* (V38.90) moved by scripts/split-late.mjs from src/08-events/08-data-events-boot-04-weights-zones.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function zoneCode(zone){
  if (ZONE_CODE[zone]) return ZONE_CODE[zone];
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
