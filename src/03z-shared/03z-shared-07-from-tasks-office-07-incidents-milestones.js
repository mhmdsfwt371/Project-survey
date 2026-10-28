/* ============================================================================
   FILE    : src/03z-shared/03z-shared-07-from-tasks-office-07-incidents-milestones.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-07-incidents-milestones.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : hseRecount, mileDates, mileOv, mileList, mileDateOf, mileDone
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ الحادثُ يُصحَّح ويُحذَف ═══
   كان الحادثُ يُسجَّل ولا يُمَسّ: من كتب «يومين مفقودين» وتبيّن أنها ثلاثةٌ
   لم يجد أين يصحّح، ومن سجّل حادثًا بالخطأ أبقاه في سجلٍّ يُعرَض على
   الوزارة. والأيامُ المفقودةُ تدخل مؤشِّراتِ السلامة — فخطأٌ فيها خطأٌ في
   الرقم المعلَن. صار يُعدَّل ويُحذَف، ويُعاد حسابُ المجموع من السجل نفسِه
   لا من عدّادٍ يُزاد ويُنسى. */
function hseRecount(){
  HSE.lost = HSE.incidents.reduce(function(a, x){ return a + cfgN(x.lost); }, 0);
}

/* ── عدم المطابقة NCR ── */
var NCRS = [];

/* ── المستخلصات IPC ── */
var IPCS = [];

/* ── المعالم والتسليم ── */
var MILES = [
  { id:'M1', n:'اعتماد النطاق وخط الأساس', d:'', w:5,  dep:'' },
  { id:'M2', n:'إتمام مسح عرفات',          d:'', w:20, dep:'M1' },
  { id:'M3', n:'إتمام مسح منى',            d:'', w:25, dep:'M1' },
  { id:'M4', n:'إتمام التهيئة والتجميع',    d:'', w:10, dep:'M2' },
  { id:'M5', n:'إتمام تركيب عرفات',        d:'', w:15, dep:'M4' },
  { id:'M6', n:'إتمام تركيب منى',          d:'', w:20, dep:'M4' },
  { id:'M7', n:'التشغيل التجريبي',         d:'', w:3,  dep:'M6' },
  { id:'M8', n:'التسليم الابتدائي',        d:'', w:2,  dep:'M7' }
];

/* ═══ تواريخُ المعالم ═══
   كانت المعالمُ بلا تواريخَ — وزنٌ وتبعيةٌ ونسبةُ إنجازٍ ولا موعدَ يُقاس
   عليه التأخّر. صار لكلِّ معلَمٍ موعدٌ مستهدَف: يُشتقُّ آليًّا من موعدَي
   انتهاء المسح والتركيب بتوزيع الأوزان على المسار، ويُضبَط باليد ويُحفَظ
   في settings/miles — واليدُ تغلب الاشتقاق. ومنه يُعرَف المتأخّرُ: موعدٌ
   مضى والإنجازُ دون التمام. */
function mileDates(){
  if (!Array.isArray(STATE.mileDates)) STATE.mileDates = [];
  return STATE.mileDates;
}

/* ═══ المعالمُ تُدار لا تُقرأ فقط ═══
   كانت ثمانيةً مكتوبةً في الشيفرة لا تُزاد ولا تُعدَّل ولا تُحذَف — والموعدُ
   وحدَه باليد. صار السجلُّ نفسُه (settings/miles) يحمل لكلِّ معلَمٍ ما عُدِّل:
   اسمًا ووزنًا وتبعيةً وإنجازًا يدويًّا، وإخفاءً لمن أُلغي، ومعالمَ جديدةً
   بمعرِّفاتٍ خاصة. والمضمَّنةُ تبقى أساسًا يُحسَب إنجازُها من الميدان. */
function mileOv(id){ return mileDates().filter(function(x){ return x.id === id; })[0] || {}; }

function mileList(){
  var out = [];
  MILES.forEach(function(m){
    var o = mileOv(m.id); if (o.hidden) return;
    out.push({ id:m.id, n:o.n || m.n, w:(o.w != null ? +o.w : m.w), dep:(o.dep != null ? o.dep : m.dep), builtin:true });
  });
  mileDates().forEach(function(o){ if (o.custom && !o.hidden) out.push({ id:o.id, n:o.n || o.id, w:+o.w || 0, dep:o.dep || '', custom:true }); });
  return out;
}

function mileDateOf(m){
  var manual = mileDates().filter(function(x){ return x.id === m.id; })[0];
  if (manual && manual.d) return manual.d;
  var dS = cfgGet('dueSurvey'), dI = cfgGet('dueInstall');
  if (!dS && !dI) return '';
  /* المسحُ وما قبله يقيس على موعد المسح، والباقي على موعد التركيب */
  var isSv = /مسح|النطاق/.test(m.n);
  var end = isSv ? (dS || dI) : (dI || dS);
  var start = BASE ? BASE.at : (end - (cfgGet('phase') || 4) * 30 * 86400000);
  var chain = MILES.filter(function(x){ return isSv ? /مسح|النطاق/.test(x.n) : !/مسح|النطاق/.test(x.n); });
  var tot = chain.reduce(function(a, x){ return a + x.w; }, 0) || 1, cum = 0;
  for (var i = 0; i < chain.length; i++){ cum += chain[i].w; if (chain[i].id === m.id) break; }
  var s0 = isSv ? start : ((dS && dS < end) ? dS : start);
  return dayKey(s0 + (end - s0) * (cum / tot));
}


function mileDone(m){
  /* إنجازٌ يدويٌّ كُتب من المكتب يغلب الاشتقاق — وللمعالم الجديدة لا مصدرَ غيرُه */
  var o = mileOv(m.id);
  if (o.prog != null && o.prog !== '') return Math.max(0, Math.min(1, (+o.prog || 0) / 100));
  if (m.custom || o.custom) return 0;
  var byZone = function(z, type){
    var tot = 0, done = 0;
    STATE.sites.forEach(function(x){
      if (x.zone !== z) return;
      tot++;
      if (type === 'survey' ? STATE.recs[x.id] : insDone(x.id)) done++;
    });
    return tot ? done / tot : 0;
  };
  switch (m.id){
    case 'M1': return BASE ? 1 : 0;
    case 'M2': return byZone('عرفات','survey');
    case 'M3': return byZone('منى','survey');
    case 'M4': return 0;
    case 'M5': return byZone('عرفات','install');
    case 'M6': return byZone('منى','install');
    case 'M7': case 'M8': return 0;
  }
  return 0;
}

/* ── RACI ── */
var RACI_ACTS = [
  ['اعتماد النطاق',            'مدير المشروع','الوزارة','المهندس','الجميع'],
  ['المسح الميداني',           'الفني','المشرف','—','المهندس'],
  ['اعتماد المسح',             'المهندس','مدير المشروع','—','المشرف'],
  ['شراء القطع',               'المشتريات','مدير المشروع','المالية','المخازن'],
  ['التهيئة والتجميع',         'فني الورشة','المهندس','—','العمليات'],
  ['التركيب',                  'فني التركيب','المشرف','المهندس','العمليات'],
  ['التدقيق والاعتماد',        'المهندس','مدير المشروع','الجودة','الفني'],
  ['بلاغ عدم المطابقة',        'الجودة','المهندس','—','المنفِّذ'],
  ['المستخلص',                 'المالية','مدير المشروع','الوزارة','الإدارة العليا'],
  ['التسليم الابتدائي',        'مدير المشروع','الوزارة','الهندسة والجودة','الجميع'],
  ['الفك وإرجاع العُهدة',      'فني الفك','المشرف','المخازن','المهندس']
];

/* ── سجل الدروس ── */
PV.LESSONS = [
  { p:'التخطيط', w:'قسمةُ التارجت على الأيام تُظهر الحاجةَ للفرق مبكرًا',
    a:'حُسبت الطواقمُ قبل بدء الموسم لا بعده' },
  { p:'التنفيذ', w:'الصورُ الخامُ تخنق الشبكةَ في المشاعر',
    a:'ضُغطت على الجهاز قبل الرفع' },
  { p:'التنفيذ', w:'الشبكةُ تنقطع فيضيع عملُ الفني',
    a:'حفظٌ محليٌّ أولًا وطابورُ رفعٍ يُستأنف' },
  { p:'الجودة', w:'احتسابُ النقاط قبل التدقيق يُغري بالتسرّع',
    a:'لا نقاطَ إلا بعد اعتماد المهندس' },
  { p:'التواصل', w:'الوصولُ للمخيمات يتعطّل بلا إشعارٍ مسبق',
    a:'رسالةٌ جاهزةٌ للشركة قبل الموعد' }
];
