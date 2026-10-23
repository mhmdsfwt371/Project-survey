/* ============================================================================
   FILE    : src/03z-shared/03z-shared-31-from-approvals-reports-06-people-functions.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-06-people-functions.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : FIELD_ROLES, isFieldRole, isCrewRole, SITES_ALL, techsList, techUid, techSet, crewsList, crewTechs, crewTeams, unassignedTechs, depTechAdd, JOBS_SEED, jobsList … (+7 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ من يُسنَد إليه عملٌ ميدانيّ ═══
   كانت القائمةُ كلَّ الحسابات: يظهر فيها المشترياتُ والمحاسبُ والمستودعُ
   ومديرُ المشروع — ويُسنَد إليهم مسحٌ لن يذهبوا إليه. والإسنادُ إلى من لا
   يعمل ميدانًا ليس خطأَ عرضٍ فقط: تُحسَب له نقاطٌ، ويُنتظَر منه إنجازٌ،
   وتظهر مهمتُه في «المتأخّر» بلا صاحب.
     فالميدانُ ثلاثةٌ لا غير: فنيٌّ ومشرفٌ ومهندس — ومعهم أطقمُ التركيب
   والتجميع والتهيئة لأن عملَهم ميدانيٌّ كذلك. ومن سواهم يبقى في حسابه
   ولا يُسنَد إليه. */
var FIELD_ROLES = { tech:1, supervisor:1, engineer:1, cins:1, casm:1, cprep:1 };

function isFieldRole(r){ return !!FIELD_ROLES[effRole(r)]; }

/* الطاقمُ المنفِّذ: يرى على الخريطة وفي القائمة ما أُسند إليه وحده —
   والمشرفُ يرى الخريطةَ كلَّها وقائمتَه مُسنَدةً مع مفتاحٍ يفتح الكلّ */
function isCrewRole(r){ return ['tech','cins','casm','cprep','helper','driver'].indexOf(effRole(r)) > -1; }

var SITES_ALL = false;

function techsList(all){
  var out = [];
  Object.keys(STATE.users || {}).forEach(function(uid){
    var u = STATE.users[uid];
    if (!u || !u.name || u.active === false) return;
    /* `all` لشاشات الإدارة التي تعرض الناسَ كلَّهم — لا للإسناد */
    if (!all && !isFieldRole(u.role)) return;
    out.push({ n:u.name, u:uid, ph:u.ph || '', job:u.job || '', sup:u.sup || '', dept:u.dept || '',
               crew:u.crew || '', jobLog:u.jobLog || [], has:u.has || 0 });
  });
  return out.sort(function(a, b){ return arCmp(a.n, b.n); });
}

function techUid(name){
  var U = STATE.users || {};
  for (var k in U) if (U[k] && U[k].name === name) return k;
  return '';
}

/* إضافةُ موظفٍ عامٍّ بلا فريقٍ لم تعد تُتاح من هنا: كل موظفٍ يُضاف من صفحة
   فريقه في «الفرق» (`depTechAdd`) فيُنسب لفريقٍ منذ لحظة ميلاده — لا يُترك
   بلا فريقٍ لينساه أحد. */
function techSet(name, patch){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }
  var uid = techUid(name);
  if (!uid){ toast(t('لا حسابَ بهذا الاسم — الأسماءُ تُضاف من الحسابات وحدَها')); return; }
  var u = Object.assign({}, STATE.users[uid], patch);
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
}

/* الفرق: تُنشأ وتُحذَف، وأعضاؤها من سجل الفنيين لا من نصٍّ حرّ */
function crewsList(){
  if (!Array.isArray(STATE.crews) || !STATE.crews.length) STATE.crews = CREWS.slice();
  return STATE.crews;
}

/* ═══ صفحةُ القسم الموحّدة ══════════════════════════════════════════════
   كانت ثلاث شاشاتٍ منفصلةً لمفهومٍ واحد: سجلُّ الفنيين (قائمةٌ مسطحةٌ لكل
   الموظفين)، وإدارةُ الفرق (اسمٌ ونوعٌ بلا أعضاء)، والفرقُ والأنصبةُ (تقسيمُ
   نقاطٍ من كل الفنيين بلا صلةٍ بفريقهم). فمن أراد يعرف من في فريق التركيب
   يفتح ثلاثَ شاشاتٍ ويقارن. صار لكل فريقٍ (قسمٍ) صفحتُه وحدها: موظفوه
   يُضافون فيها مباشرةً بلا اختيار فريقٍ من قائمة — والفرقُ الفرعيةُ
   (نسب الأنصبة) تُبنى من موظفيه هو لا من كل الفنيين. */

function crewTechs(crew){
  return techsList().filter(function(x){ return x.crew === crew.n; });
}

/* الفرقُ الفرعيةُ القديمةُ (قبل هذا الإصدار) لا تحمل حقل قسمٍ — تُستدَلُّ
   قسمُها من فريق أول عضوٍ فيها بدل أن تختفي من كل الصفحات. */
function crewTeams(crew){
  return TEAMS.filter(function(tm){
    if (tm.crew) return tm.crew === crew.n;
    var m0 = tm.members[0];
    var tx = m0 && techsList().filter(function(x){ return x.n === m0.name; })[0];
    return !!tx && tx.crew === crew.n;
  });
}

/* موظفون فريقهم فارغٌ أو يشير إلى فريقٍ محذوف — يظهرون هنا لا يختفون */
function unassignedTechs(){
  var names = crewsList().map(function(c){ return c.n; });
  return techsList().filter(function(x){ return !x.crew || names.indexOf(x.crew) < 0; });
}


/* ═══ الوظائف: ما يعمله الشخصُ، ومنه يُشتقُّ دورُه ═══════════════════════════
   كان الشخصُ يُعطى دورًا مباشرةً — «فني» أو «مشرف» — والدورُ صلاحيةٌ لا وظيفة.
   فمسؤولُ المستودع ومشرفُ الميدان كلاهما «مشرف»، ولا يُعرَف من الاثنين من
   يستلم العهدةَ ومن ينزل المشاعر.

   والوظيفةُ تتغيّر في أثناء الموسم: من كان في التهيئة ينتقل إلى التركيب.
   فتُسجَّل النقلةُ بتاريخها ولا تُمحى الأولى — وإلا ضاع من عمل ماذا ومتى. */

var JOBS_SEED = [
  /* الوظيفةُ ما يعمله الشخص، والدورُ ما تسمح به القاعدة. وهذه الوظائفُ
     الإحدى عشرةُ هي هيكلُ الفريق كما هو في الأرض — ولكلٍّ دورٌ من السبعة
     التي تعرفها قواعدُ القاعدة، فلا يُنشَأ دورٌ لا تعرفه فتُرفَض كتابتُه. */
  { id:'j_exec',  n:'الإدارة العليا', role:'exec',       d:'فوق مدير المشروع: تطّلع على كلِّ شيءٍ وتعتمد — ولا تدير الأدوار.' },
  { id:'j_admin', n:'مدير المشروع',  role:'admin',      d:'صلاحيةٌ كاملة — ويُدير الأدوارَ والحسابات.' },
  { id:'j_eng',   n:'مهندس المشروع', role:'engineer',   d:'يدير التنفيذَ ويعتمد ما يرفعه الميدان — يرث من المدير دون إدارة الأدوار.' },
  { id:'j_buy',   n:'مشتريات',       role:'supervisor', d:'يسجّل المشترياتِ ويتابع المورّدين والفئات.' },
  { id:'j_store', n:'مستودع',        role:'supervisor', d:'يستلم التوريدَ ويصرف العهدةَ ويستقبل المرتجَع.' },
  { id:'j_acc',   n:'محاسب',         role:'supervisor', d:'يتابع المستخلصاتِ والميزانيةَ وتكلفةَ التشغيل.' },
  { id:'j_prep',  n:'مسؤول تهيئة',   role:'cprep',      d:'يضبط الجهازَ وعنوانَه ونظامَه ويفحصه قبل النزول.' },
  { id:'j_asm',   n:'مسؤول تجميع',   role:'casm',       d:'يجمّع مكوّناتِ البوكس ويوصّلها قبل النزول.' },
  { id:'j_sup',   n:'مشرف',          role:'supervisor', d:'يوزّع العملَ على فرقه ويتابع تنفيذَه في المشاعر.' },
  { id:'j_ins',   n:'فني تركيب',     role:'cins',       d:'يركّب في الموقع ويوثّق بالصور.' },
  { id:'j_tech',  n:'مساعد فني',     role:'tech',       d:'يمسح النقاطَ ويحدّث حالتَها ويصوّر.' },
  /* V16.40: حساباتُ الوزارة تُسلَّم — وكانت بلا وظيفةٍ فيُختار لها ما يرفع دورَها؛
     الوظيفةُ «مراقب الوزارة» تشتقُّ الدورَ الصحيح: قراءةٌ بلا كتابة */
  { id:'j_view',  n:'مراقب الوزارة', role:'viewer',     d:'يتابع ويصدّر — ولا يكتب حرفًا، والهواتفُ محجوبةٌ عنه.' },
  { id:'j_drv',   n:'سائق',          role:'tech',       d:'ينقل الفريقَ والعدّةَ — وتُسنَد إليه سيارة.' },
  { id:'j_view',  n:'مراقب وزاري',   role:'viewer',     d:'يقرأ التقدّمَ ولا يكتب شيئًا.' }
];

function jobsList(){
  if (!Array.isArray(STATE.jobs) || !STATE.jobs.length) STATE.jobs = JOBS_SEED.slice();
  /* وظيفةٌ زِيدت في البذرة بعد أن حُفظت القائمةُ في القاعدة لا تظهر — فتُلحَق
     بموضعها (الإدارةُ العليا أوّلًا) دون أن تمسَّ ما عدّله المكتب */
  JOBS_SEED.forEach(function(j, i){
    if (!STATE.jobs.some(function(x){ return x.id === j.id; })) STATE.jobs.splice(Math.min(i, STATE.jobs.length), 0, Object.assign({}, j));
  });
  return STATE.jobs;
}

function jobSave(){ CORE.set('cfg', 'jobs', jobsList().slice()); }

function jobOf(id){ return jobsList().filter(function(j){ return j.id === id; })[0] || null; }

function jobUsed(id){
  var n = 0;
  techsList().forEach(function(x){ if (x.job === id) n++; });
  Object.keys(STATE.users || {}).forEach(function(k){ if ((STATE.users[k] || {}).job === id) n++; });
  return n;
}

/* (V27.1) كان سجلُّ الدروس السريع شريحةً في التنظيم والدروسُ الموثّقة شريحةً في التقارير التنفيذية — صفحةٌ واحدة */
var LESS_SHOW = false;


function lessList(){
  if (!Array.isArray(STATE.lessons) || !STATE.lessons.length) STATE.lessons = LESSONS.slice();
  return STATE.lessons;
}

function lessSave(){ CORE.set('cfg', 'lessons', lessList().slice()); }
