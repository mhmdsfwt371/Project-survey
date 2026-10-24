/* ============================================================================
   FILE    : src/03z-shared/03z-shared-33-from-approvals-reports-08-shipments-vehicles.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-08-shipments-vehicles.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : shipList, shipSave, shipLate, shipWatch, todayISO, msDay, vehKinds, vehKindName, vehList, vehOf, vehAsnList, vehAsnOf … (+3 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
var SHIP_Q = '';

function shipList(){
  var S = STATE.ships || {};
  return Object.keys(S).map(function(k){ return S[k]; }).filter(Boolean)
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}

function shipSave(x){ STATE.ships = STATE.ships || {}; STATE.ships[x.id] = x; CORE.set('ships', x.id, x); statBump(); }

function shipLate(x){
  if (x.got || !x.eta) return 0;
  var d = Math.floor((Date.now() - new Date(x.eta + 'T12:00:00').getTime()) / 86400000);
  return d > 0 ? d : 0;
}

/* ما تأخّر يُنبَّه عليه مرةً في اليوم */
function shipWatch(){
  shipList().forEach(function(x){
    var late = shipLate(x);
    if (!late) return;
    if (x.warned === todayISO()) return;
    x.warned = todayISO();
    shipSave(x);
    notifPush('توريد', 'شحنةٌ متأخرة: ' + x.ref + ' — ' + nm(late) + ' يومًا بعد الموعد المتوقَّع',
              { lv:'عاجل' });
  });
}

/* أسماءُ الأعمال التي تُسنَد — تُقرأ في السيارات والمهامّ معًا */
var ASN_LABEL = { srv:'زيارة', ins:'تركيب', dis:'فك', buy:'مشتريات', prep:'تهيئة', asm:'تجميع' };

function todayISO(){ return dayKey(); }

function msDay(ms){ return ms ? dayKey(+ms) : '—'; }

/* ═══ السياراتُ: عهدةٌ متحرّكةٌ لها سجلٌّ كسجلّ الأجهزة ═══════════════════
   الفريقُ الميدانيُّ لا يعمل بلا سيارتين: واحدةٌ تحمل العدّةَ وأخرى ينتقل
   بها الناس. وكان التوزيعُ يُحسَب بعدد الفنيين وحدَهم — فيُسنَد إلى فريقٍ
   عملُ يومٍ كاملٍ وسيارتُه في الورشة، فلا يصل ولا يُعرَف لماذا تأخّر.

   فالسيارةُ مسنَدةٌ كالفنيّ: لها نوعٌ ولوحةٌ ورخصةٌ تنتهي، وتُسنَد إلى شخصٍ
   أو فريقٍ لنشاطٍ بعينه، وتُحسَب تكلفتُها في مصروف المشروع من يوم تشغيلها. */

var VEH_KINDS_SEED = [
  { id:'pickup', n:'بيك أب — للعدّة', d:'تحمل العدّةَ والقطعَ إلى الموقع', cap:2 },
  { id:'sedan',  n:'سيدان — للتنقّل', d:'ينتقل بها الفريقُ بين النقاط',   cap:4 },
  { id:'van',    n:'فان',             d:'فريقٌ كاملٌ وعدّتُه معًا',        cap:7 },
  { id:'truck',  n:'شاحنة',           d:'نقلُ توريدٍ ثقيلٍ إلى المستودع',  cap:2 }
];

var VEH_Q = '', VEH_EDIT = '';

function vehKinds(){
  if (!Array.isArray(STATE.vehKinds) || !STATE.vehKinds.length)
    STATE.vehKinds = VEH_KINDS_SEED.map(function(k){ return Object.assign({}, k); });
  return STATE.vehKinds;
}

function vehKindName(id){
  var k = vehKinds().filter(function(x){ return x.id === id; })[0];
  return (k && k.n) || id || '—';
}

function vehList(){
  var V = STATE.vehicles || {};
  return Object.keys(V).map(function(k){ return V[k]; }).filter(Boolean)
    .sort(function(a, b){ return arCmp(a.plate || '', b.plate || ''); });
}

function vehOf(id){ return (STATE.vehicles || {})[id] || null; }

/* الإسناد: سيارةٌ لشخصٍ أو فريقٍ لنشاطٍ بعينه. والسيارةُ المسنَدةُ لا تُسنَد
   ثانيةً في الوقت نفسِه — وإلا وقف فريقٌ ينتظر ما أُخذ منه. */
function vehAsnList(){
  var A = STATE.vehAsn || {};
  return Object.keys(A).map(function(k){ return A[k]; })
    .filter(function(x){ return x && !x.end; });
}

function vehAsnOf(vid){
  return vehAsnList().filter(function(a){ return a.veh === vid; })[0] || null;
}

function vehSave(v){
  if (!STATE.vehicles) STATE.vehicles = {};
  STATE.vehicles[v.id] = v;
  CORE.set('vehicles', v.id, v);
  statBump();
}

/* ═══ سجلُّ عهدة السيارات ═══════════════════════════════════════════════════
   الإسنادُ الجاري يُعرَف: من معه أيُّ سيارةٍ الآن. لكنَّ المخالفةَ تأتي بعد
   شهرٍ بتاريخِ يومٍ مضى — «هذه اللوحةُ في الثاني عشر من الشهر». ومن أنهى
   إسنادَه يومَها لم يعد في القائمة، فيُسأل من معه السيارةُ اليومَ عن يومٍ لم
   يكن فيها.

   فيُقرأ السجلُّ كلُّه — الجاري والمنتهي — ويُسأل بتاريخ: من كانت معه هذه
   السيارةُ في ذلك اليوم؟ */

function vehAsnAll(){
  var A = STATE.vehAsn || {};
  return Object.keys(A).map(function(k){ return A[k]; }).filter(Boolean);
}

/* ملاءمةُ النوع للعمل: العدّةُ تحتاج بيك أب، والتنقّلُ سيدان، والتوريدُ شاحنة.
   والفريقُ الذي معه سيدانٌ وحدَه لا يحمل عدّتَه — فيقف في الموقع بلا قطع. */
var VEH_FIT = {
  ins:  ['pickup','van','truck'],
  dis:  ['pickup','van','truck'],
  prep: ['pickup','van'],
  asm:  ['pickup','van'],
  srv:  ['sedan','van','pickup'],
  buy:  ['pickup','truck','sedan','van']
};

function vehFits(kindVeh, kindWork){
  var ok = VEH_FIT[kindWork];
  return !ok || ok.indexOf(kindVeh) > -1;
}

var VLOG_D = '', VLOG_Q = '';
