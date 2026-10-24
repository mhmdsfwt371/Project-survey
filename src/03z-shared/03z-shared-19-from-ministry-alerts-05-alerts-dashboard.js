/* ============================================================================
   FILE    : src/03z-shared/03z-shared-19-from-ministry-alerts-05-alerts-dashboard.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-05-alerts-dashboard.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ageDays, svPrimWhyAny, mfuObstaclesF
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V30.1) التنبيهاتُ بقواعدَ تُضبَط من الإعدادات ═══
   كلُّ قاعدةٍ: مفتاحُ الأيام في CFG، وشرطٌ على النقطة وسجلِّها، ونصٌّ يُقرأ. ما تجاوز أيامَ القاعدة يُعَدّ تنبيهًا ويُفتَح قائمةً ويُصدَّر. */
var AL_RULES = [
  ['al_obs',     'alObsDays',     'معوّق مفتوح منذ أكثر من',  function(x, r, d){ return !!(r && svDone(r) && svHasChal(r)) && !(STATE.inss[x.id] && STATE.inss[x.id].status === 'مُركّب') && ageDays(r.at) > d; }],
  ['al_permit',  'alPermitDays',  'تصريح دخول معلّق منذ أكثر من', function(x, r, d){ return !!(r && r.access === 'يحتاج تصريح') && ageDays(r.at) > d; }],
  ['al_revisit', 'alRevisitDays', 'أُعيدت للزيارة ولم تُزَر منذ أكثر من', function(x, r, d){ return !!(r && r.review === 'revisit') && ageDays(r.revAt || r.at) > d; }],
  ['al_nophoto', 'alNoPhotoDays', 'ممسوحة بلا صور منذ أكثر من', function(x, r, d){ return !!(r && svDone(r)) && !recIsQuick(r) && !!svPhotoState(x, r) && ageDays(r.at) > d; }],   /* (V33.5) لا الزيارةُ بقرار المهندس */
  ['al_assign',  'alAssignDays',  'مُسندة ولم تُزَر منذ أكثر من', function(x, r, d){ if (r) return false; var tk = taskKindOf(x.id, 'visit'); return !!(tk && tk.at && tk.status !== 'منجز' && ageDays(tk.at) > d); }],
  ['al_stale',   'alStaleDays',   'تحتاج زيارة أخرى ولم تُعَد منذ أكثر من', function(x, r, d){ return !!(r && r.access && r.access !== 'تم الوصول') && ageDays(r.at) > d; }]
];

function ageDays(ts){ return ts ? Math.floor((Date.now() - (+ts || 0)) / 864e5) : 0; }


var SV_PHO = '';

/* (V37.6) النقطةُ المفتوحةُ صورُها فوق القائمة */
var SV_SHOW = 80;

/* ═══ (V37.16) طلبُ المالك: «البوب أب اللي بتتفتح من صفحة الوزارة لكلِّ كارت (الزيارة والمسح والتركيب والتسليم والفك) — مش عاوزها
   ليست، عاوزها داشبورد توضّح البيانات، ولما أحتاج تفاصيل أعمل إكسل». اللوحةُ تُبنى من صفوف القائمة نفسِها فلا يختلف رقم. ═══ */
var SV_VIEW = 'dash';


/* ═══ (V37.45) لوحةُ الوزارة المعتمدة — تجيب عن أسئلة الاجتماع لا تعرض عددًا فقط ═══
   خلاصةٌ مكتوبةٌ تُولَّد من الأرقام، ومقارنةُ الأسبوع بالذي قبله، وعمرُ أقدم بندٍ مفتوح، والنسبةُ من نقاط المشعر نفسه،
   وأين هي على الخريطة، والتراكمُ في ٣٠ يومًا، وتصفيةٌ بالمشعر داخل النافذة، وطباعةٌ، وسطرُ المصدر. كلُّه من الوثائق على الجهاز. */
var SV_ZF = '';


var SV_WHY = [   /* «ليه مش جاهزة؟» — كلمةٌ واحدةٌ وأيقونة */
  { ks:['mount'], e:'\u{1F3D7}', n:'يحتاج هيكل' }, { ks:['entry', 'multi'], e:'\u{1F6AA}', n:'المدخل' }, { ks:['beam', 'wide'], e:'\u{1F4CF}', n:'العارضة' },
  { ks:['block', 'legacy'], e:'\u{1F6A7}', n:'عائق' }, { ks:['height'], e:'\u2B06\uFE0F', n:'ارتفاع' }, { ks:['review'], e:'\u2753', n:'قيد المراجعة' }
];

/* (V37.59) بلاغُ المالك: «الداتا دخلت في بعضها» — النقطةُ ذاتُ التحديين كانت تُعَدّ في مربعين، و«هيكل + عائق» تذهب أحمرَ فيختلف «يحتاج هيكل» بين شاشتين.
   الآن لكلِّ نقطةٍ سببٌ رئيسٌ واحدٌ بالأولوية (عائق ← هيكل ← المدخل ← العارضة ← ارتفاع ← قيد المراجعة)، واللونُ منه: العائقُ أحمر وما سواه برتقالي. */
var SV_WHY_ORDER = [3, 0, 1, 2, 4, 5];

/* (V38.76) the primary reason of a point's challenges whatever its review state — the obstacles tab counts a returned visit's
   challenges too (the single definition); svPrimWhy keeps its gate for the installation workflow */
function svPrimWhyAny(rec){
  if (!rec || rec.deleted) return -1; var cc = chalCats(rec); if (!cc.length) return -1;
  for (var q = 0; q < SV_WHY_ORDER.length; q++){ var w = SV_WHY[SV_WHY_ORDER[q]]; if (w.ks.some(function(k){ return cc.indexOf(k) > -1; })) return SV_WHY_ORDER[q]; }
  return 5;
}


var SV_STACK = [];

/* (V37.59) الشاشاتُ السابقةُ داخل النافذة — للرجوع */
var SV_SUB = '';


/* (V37.63) طلبُ المالك: النافذةُ تقول ما فتحتَه — «مخيمات الشركات الجاهزة — ٦٨ مخيم في ٢٤ شركة» لا «تمت الزيارة — ٦٨» */
var SV_COB_T = { ready:'مخيمات الشركات الجاهزة', prep:'مخيمات الشركات اللي فيها تجهيز', coord:'مخيمات الشركات المحتاجة تنسيق', todo:'مخيمات الشركات اللي لسه' };


function mfuObstaclesF(){ var O = mfuObstacles(); if (!MFU.flt.z && !MFU.flt.t) return O; return O.filter(function(o){ var tx = taxOf(o.x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); }); }
