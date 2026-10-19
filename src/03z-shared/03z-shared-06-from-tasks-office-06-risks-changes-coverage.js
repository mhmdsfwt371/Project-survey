/* ============================================================================
   FILE    : src/03z-shared/03z-shared-06-from-tasks-office-06-risks-changes-coverage.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-06-risks-changes-coverage.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : risksList, riskSave, RISKS, riskScore, riskLevel, CHANGES, ORG, HSE
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ سجلُّ المخاطر الحيّ ═══
   كان السجلُّ ستةَ مخاطرَ مكتوبةً في الشيفرة، تُعرَض ولا تُمَسّ: لا يُضاف
   خطرٌ ظهر في الميدان، ولا يُغلَق ما زال، ولا يتغيّر مالكٌ. وسجلُّ مخاطرَ لا
   يُحدَّث ليس سجلًّا — هو زينةُ اجتماع. صار يُحفَظ في settings/risks
   ويُضاف إليه ويُعدَّل ويُغلَق، والبذرةُ بدايتُه لا سقفُه.
     ومعه ما لا يكتبه أحد: مؤشراتُ خطرٍ تُحسَب من البيانات نفسِها كلَّ رسمة —
   الجدولُ يتأخّر، والكلفةُ تتجاوز، والوتيرةُ دون المطلوب، وزياراتٌ متعذّرة،
   وبلاغاتٌ جوهرية، ومردوداتٌ تتكرّر. فالخطرُ يُرى قبل أن يُكتَب. */
function risksList(){
  if (!Array.isArray(STATE.risks) || !STATE.risks.length)
    STATE.risks = RISKS.map(function(r){ return Object.assign({}, r); });
  return STATE.risks;
}

function riskSave(){ CORE.set('cfg', 'risks', risksList().slice()); }

var RISKS = [
  { id:'R1', t:'تأخّر توريد القطع عن الموعد', cat:'مشتريات', p:3, i:4,
    resp:'تخفيف', plan:'طلبٌ مبكّرٌ ومورّدٌ بديلٌ معتمد', own:'المهندس', st:'مفتوح' },
  { id:'R2', t:'تعذّر الوصول لمواقع داخل المخيمات', cat:'ميداني', p:4, i:3,
    resp:'تخفيف', plan:'إشعارُ الشركات قبل الموعد بأسبوع', own:'المشرف', st:'مفتوح' },
  { id:'R3', t:'انقطاع الكهرباء في نقاط الممرات', cat:'فني', p:3, i:4,
    resp:'تخفيف', plan:'منظومةُ طاقةٍ شمسيةٍ للنقاط المعزولة', own:'مهندس الكهرباء', st:'مفتوح' },
  { id:'R4', t:'نقص الفنيين عن التارجت الشهري', cat:'موارد', p:3, i:5,
    resp:'تخفيف', plan:'حسابُ الطواقم مسبقًا وتعاقدٌ احتياطي', own:'مدير المشروع', st:'مفتوح' },
  { id:'R5', t:'تجاوز الميزانية بارتفاع الأسعار', cat:'مالي', p:2, i:4,
    resp:'قبول', plan:'احتياطيٌّ عشرةٌ بالمئة من السقف', own:'مدير المشروع', st:'مفتوح' },
  { id:'R6', t:'رفض الوزارة لمواقعَ بعد التركيب', cat:'أطراف', p:2, i:5,
    resp:'تجنّب', plan:'اعتمادُ المواقع قبل التركيب لا بعده', own:'المهندس', st:'مفتوح' },
  { id:'R7', t:'ضياع بياناتٍ ميدانيةٍ قبل الرفع', cat:'تقني', p:2, i:5,
    resp:'تخفيف', plan:'حفظٌ محليٌّ وطابورُ رفعٍ ونسخٌ يومي', own:'المطوّر', st:'مغلق' },
  { id:'R8', t:'ازدحام الموسم يمنع الحركة', cat:'ميداني', p:4, i:4,
    resp:'تجنّب', plan:'إنهاءُ التركيب قبل بدء الموسم بشهر', own:'مدير المشروع', st:'مفتوح' }
];

function riskScore(r){ return r.p * r.i; }

function riskLevel(n){
  if (n >= 15) return { t:'حرج', c:'bad' };
  if (n >= 9)  return { t:'عالٍ', c:'wrn' };
  if (n >= 4)  return { t:'متوسط', c:'' };
  return { t:'منخفض', c:'ok' };
}

/* ── ضبط التغيير ── */
var CHANGES = [];

/* ═══ التغطية — من الشركة بأقسامها إلى العميل بإداراته ═══
   لكلِّ جهةٍ ما يخصّها: تراه كاملًا ولا ترى ما ليس لها. */

var ORG = {
  co: { n:'أفاقي — المنفِّذ', i:'\u{1F3E2}', units:[
    { id:'exec',  n:'الإدارة العليا',     i:'\u{1F3AF}', needs:'الربحية والمخاطر الكبرى والقرار', pages:['exec','evm','risks','perf'] },
    { id:'pmo',   n:'إدارة المشاريع',      i:'\u{1F4CA}', needs:'الجدول والكلفة والموارد',        pages:['evm','risks','chg','miles','pace'] },
    { id:'eng',   n:'الهندسة',            i:'\u{1F393}', needs:'التدقيق والاعتماد والمواصفات',    pages:['qa','ncr','sites','items'] },
    { id:'ops',   n:'العمليات الميدانية',  i:'\u{1F527}', needs:'الإسناد والتنفيذ والمتابعة',      pages:['map','req','assign','crewman'] },
    { id:'qaqc',  n:'الجودة',             i:'\u2713',    needs:'عدم المطابقة والإجراء التصحيحي',  pages:['ncr','qa','ev'] },
    { id:'hse',   n:'السلامة',            i:'\u26D1',    needs:'الحوادث والتصاريح والتوعية',      pages:['hse'] },
    { id:'hr',    n:'الموارد البشرية',     i:'\u{1F465}', needs:'الفرق والحضور والمستحقات',        pages:['crewman','perf','users'] },
    { id:'fin',   n:'المالية',            i:'\u{1F4B0}', needs:'المستخلصات والدفعات والتدفق',     pages:['ipc','budget','buys','budm'] },
    { id:'proc',  n:'المشتريات',          i:'\u{1F4E6}', needs:'الطلبات والمورّدون والالتزامات',   pages:['buys','sup','invb','wos'] },
    { id:'it',    n:'تقنية المعلومات',     i:'\u{1F5A5}', needs:'الشبكة وصحة الأجهزة والنسخ',      pages:['hb','probe','sys','retain'] }
  ]},
  cl: { n:'الوزارة — العميل', i:'\u{1F54B}', units:[
    { id:'cexec', n:'الإدارة العليا',      i:'\u{1F3AF}', needs:'التقدّم الكلي والمعالم',          pages:['over','miles','chain'] },
    { id:'cprj',  n:'إدارة المشاريع',       i:'\u{1F4C8}', needs:'الجدول والإنجاز بالمشعر',        pages:['repcenter','reg','pace','inst'] },
    { id:'cfin',  n:'الإدارة المالية',      i:'\u{1F4B3}', needs:'المستخلصات المعتمدة والصرف',      pages:['ipc','budm'] },
    { id:'ctec',  n:'الإدارة الفنية',       i:'\u2699',    needs:'المطابقة للمواصفة والفحص',        pages:['ncr','hb','sites'] },
    { id:'cops',  n:'إدارة التشغيل',        i:'\u{1F504}', needs:'التسليم والضمان والتشغيل',        pages:['hand','dis'] },
    { id:'caud',  n:'المراجعة الداخلية',    i:'\u{1F50E}', needs:'الأثر والسجلّات والتوثيق',        pages:['ev','perf'] }
  ]}
};

/* ── السلامة HSE ── */
var HSE = { hours:0, incidents:[], permits:[], lost:0 };
