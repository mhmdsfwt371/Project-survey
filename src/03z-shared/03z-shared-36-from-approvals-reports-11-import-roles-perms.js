/* ============================================================================
   FILE    : src/03z-shared/03z-shared-36-from-approvals-reports-11-import-roles-perms.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-11-import-roles-perms.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : isBossHere, R, may, pmLocked, pmDefault, pmMatrix, pmOverride, pmGet, pmDirty, pmRefresh, pmCard, rankOf … (+12 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ الأدوار — من يرى ماذا ويفعل ماذا ═══
   الحجب بالبنية لا بالجافاسكربت وحده: بندٌ لا يُبنى أصلًا لمن لا يملكه. */

var ROLES = {
  /* ═══ الإدارةُ العليا فوق مديرِ المشروع ═══
     كان السلَّمُ ينتهي عند مديرِ المشروع: فلا مديرَ له، ولا يُسأل عن عمله
     أحدٌ داخل النظام — وهو في الواقع يرفع إلى إدارةٍ عليا في الشركة تسأل
     عن الربحية والمخاطر الكبرى والقرار. فأُضيفت مرتبةٌ فوقه بدورها:
     تقرأ الموقفَ التنفيذيَّ والمعالمَ والقيمةَ المكتسبةَ والمخاطر، ولا
     تعدّل ولا تعتمد ولا تضبط — فالإشرافُ لا يعني الإمساك بكلِّ مقبض.
     وبها صار مديرُ المشروع يُسنَد إلى مديرٍ كما يُسنَد غيرُه. */
  exec:{
    n:'الإدارة العليا', d:'الموقفُ التنفيذيُّ والمخاطرُ والقرار — قراءةً',
    guide:'دليل الإدارة العليا — الموقف والقرار',
    /* V16.25: الخريطةُ ولوحةُ الفريق — من فوقُ يرى ما تحته كلَّه، قراءةً */
    nav:['map','mywork','board','exec','mfu','mweek','msurv','minst','mcos','mobs','mreq','mdaily','kiosk','over','wbs','wtask','now','wplan','pace','miles','evm','budm','risks','chg','ncr','repcenter','exp','diary','pmi','lessons','stake','reg','guide','acct','notif'],
    can:{ provision:1, edit:0, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0 } },

  /* الأدمنُ فوق المهندس: يملك كلَّ شيءٍ ويُدير الأدوارَ نفسَها.
     والمهندسُ يرث منه ولا يملك تبديلَ الأدوار — فمن يضبط الصلاحياتِ لا
     يُصلح لأن يوسّع صلاحيةَ نفسِه بلا رقيب. */
  admin:{
    n:'مدير المشروع', d:'صلاحيةٌ كاملة — ويُدير الأدوارَ والحسابات',
    guide:'دليل المهندس — إدارة المشروع', nav:'*',
    can:{ propose:1, provision:1, edit:1, approve:1, settings:1, money:1, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:1, users:1, phones:1, roles:1, fleet:1, perms:1, minapprove:1 } },

  engineer:{
    n:'مهندس', d:'صلاحية كاملة — يدير الحسابات والاعتمادات',
    guide:'دليل المهندس — إدارة المشروع',
    nav:'*',   /* بما فيه بند «الإعدادات» الذي يفتح الشاشة الكاملة */
    can:{ propose:1, provision:1, edit:1, approve:1, settings:1, money:1, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:1, users:1, phones:1, perms:1 }
  },
  supervisor:{
    n:'مشرف', d:'الميدان ولوحة المتابعة — يسجّل الزيارةَ على أيِّ نقطة، ويعدّل بياناتِ النقطة الأساسية، ويردّ زيارةَ فريقه للتصحيح، ويُنشئ فنيّيه — والاعتمادُ والتصنيفُ للمهندس',   /* (V28.6) */
    guide:'دليل الفني والمشرف — العمل الميداني',
    /* V16.26: المشرفُ يرى الطلباتِ والتوزيع — طلباتِ زيارةِ فريقه وسجلَّ إسناداته
       وتوزيعَه؛ نطاقُ سحبه شجرتُه فلا يرى إلا ما يخصُّه */
    nav:['map','mywork','chat','sites','sel','svForm','insForm','newsite','co','recs','tools','iotdash','mine','over','wbs','wtask','now','pace','inst','reg','chalm','dis','users','req','reqreg','assign','guide','acct'],
    can:{ propose:1, provision:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  viewer:{
    n:'وزارة', d:'متابعةٌ وتصدير — لا تكتب حرفًا، والهواتف محجوبة حتى في القواعد',
    guide:'دليل الوزارة — المتابعة',
    /* V16.36: «الوتيرة» و«اليومي» و«التركيب» أرقامٌ تعرضها «نظرة عامة» و«مركز
       التقارير» نفسُها — فحُذفت من الوزارة لتبقى شاشاتُها ستًّا يُتابَع منها
       العمل: الخريطةُ ونظرةٌ عامةٌ والآنَ ومركزُ التقارير والمعالمُ والسجل. */
    /* V16.47: «المسح الميداني» ضمن متابعة العمل الميداني — تُتابَع كلُّ زيارةٍ
       ومن زارها ومتى، قراءةً؛ والأزرارُ لمن يملكها لا لها */
    /* V16.55: الوزارةُ ترى حساباتِ الوزارة وحدَها — قراءةً (can.users = 0) */
    /* V16.65: «المتعذّر والراكد» للوزارة قراءةً — بصوره وسببه وقرار المهندس */
    /* V16.66: اعتمادُ الوزارة لإعداد التركيب — فعلُها الوحيد في النظام */
    nav:['map','site','newsite','mfu','mweek','msurv','minst','mcos','mobs','mreq','mdaily','kiosk','over','wbs','wtask','now','repcenter','exp','diary','miles','reg','co','survey','minappr','stuck','chalm','dis','ncr','users','guide','acct'],
    /* minapprove: اعتمادُ إعداد التركيب — الفعلُ الوحيدُ الذي تكتبه الوزارة */
    can:{ propose:1, edit:0, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0, minapprove:1 }
  },
  /* الفني يرث «مشرف» ويعمل تحته: يرى المُسند إليه وينفّذه ولا يعتمد شيئًا */
  tech:{
    n:'فني', d:'ينفّذ ما يُسند إليه تحت مشرفه', base:'supervisor', kind:'*',
    guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','chat','sites','sel','svForm','insForm','newsite','recs','mine','guide','acct'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },

  /* الفرق أدوارٌ مخصَّصةٌ ترث «مشرف» ويقيّدها نوعُ مهمتها — لا دورٌ أساسيٌّ جديد */
  cprep:{
    n:'فريق التهيئة', d:'الورشة — تهيئةً وحدها', base:'supervisor', kind:'prep',
    guide:'دليل الورشة — التهيئة',
    nav:['mywork','sites','recs','mine','wos','wday','guide','acct'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:1,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  casm:{
    n:'فريق التجميع', d:'الورشة — تجميعًا وحده', base:'supervisor', kind:'asm',
    guide:'دليل الورشة — التجميع',
    nav:['mywork','sites','recs','mine','wos','wday','guide','acct'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:1,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  cins:{
    n:'فريق التركيب', d:'الميدان — تركيبًا وتوثيقًا', base:'supervisor', kind:'install',
    guide:'دليل الميدان — التركيب',
    nav:['map','mywork','chat','sites','sel','svForm','insForm','newsite','recs','mine','guide','acct'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },

  /* ثلاثةٌ مكتبية: كلٌّ يفتح بابَه ولا يفتح غيرَه */
  buyer:{
    n:'مشتريات', d:'يسجّل المشترياتِ ويتابع المورّدين — ولا يعتمد ولا يصرف عهدة',
    guide:'دليل المهندس — إدارة المشروع',
    nav:['buys','trials','ships','fleet','fleetAsn','fleetCost','over','guide','acct','notif'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:1, delete:0, users:0, phones:1, fleet:1 } },

  store:{
    n:'مستودع', d:'يستلم التوريدَ ويصرف العهدةَ ويستقبل المرتجَع',
    guide:'دليل الميدان — التركيب',
    nav:['invb','invmv','wos','stock','ships','fleet','over','guide','acct','notif'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:0, users:0, phones:1 } },

  acct:{
    n:'محاسب', d:'يقرأ المالَ ويصدّره — ولا يسجّل شراءً ولا يعتمده',
    guide:'دليل المهندس — إدارة المشروع',
    nav:['buys','trials','ipc','budget','budm','evm','exec','fleetCost','over','guide','acct','notif'],
    can:{ edit:0, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0 } },

  /* اثنان ميدانيان تحت المشرف */
  helper:{
    n:'مساعد فني', d:'يعمل مع الفنيّ ولا يُسنَد إليه وحدَه',
    base:'supervisor', kind:'*', guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','chat','sites','svForm','insForm','newsite','mine','guide','acct'],
    can:{ propose:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:0 } },

  driver:{
    n:'سائق', d:'ينقل الفريقَ والعُهدةَ — يرى مهامَّه وسيارتَه ولا يكتب سجلًّا',
    base:'supervisor', guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','myveh','mine','guide','acct'],
    can:{ edit:0, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:0 } }
};

/* الدورُ قبل الدخول أدنى الأدوار — لا مهندسٌ كاملُ الصلاحية: يُرفَع بعد أن
   تُثبِت المصادقةُ الهويةَ، فلا يرى من لم يدخل شيئًا لا يراه الفنيّ. */
var ROLE = 'tech';

/* ═══ صاحبُ المشروع لا يُحبَس ═══
   القاعدةُ تعرف بريدَ صاحب المشروع مديرًا مهما قالت وثيقتُه (`isBoss`). وكان
   التطبيقُ يقرأ الدورَ من الوثيقة وحدَها — فإن كتبت عليها إعادةُ إصدارٍ أو
   لصقةٌ دورًا أدنى صار مطّلعًا في شاشاته: لا إعداداتٍ ولا حساباتٍ ولا سبيلَ
   لإصلاح نفسِه. التطبيقُ يطابق القاعدةَ: بريدُ صاحب المشروع مديرٌ دائمًا. */
PV.BOSS_EMAILS = ['mohammed.safwat@afaqy.com', 'm.safwat@nusuk.local'];

function isBossHere(){
  try { var u = FB.auth && FB.auth.currentUser; return !!(u && PV.BOSS_EMAILS.indexOf(String(u.email || '').toLowerCase()) > -1); }
  catch (e){ return false; }
}

function R(){ return ROLES[ROLE] || ROLES.engineer; }

function may(k){ if (k === 'propose') return may('edit') || !!(R().can || {}).propose;   /* (V37.68) اقتراحُ نقطةٍ جديدة: من يسجّل، والوزارةُ بقدرتها الصريحة */
  /* «provision» تُشتقُّ من الرتبة: المشرفُ فما فوق — لا تُكتَب في كلِّ دور */
  if (k === 'provision') return rankOf(ROLE) >= rankOf('supervisor');
  /* ما لمصفوفة القاعدة قولٌ صريحٌ فيه يَغلب: فلا يظهر زرٌّ تردّه القاعدة */
  var pmk = PM_CAP[k];
  if (pmk){
    var ov = pmOverride(pmk[0], pmk[1], ROLE);
    if (ov !== null) return ov;
  }
  return !!R().can[k];
}

/* ═══ مصفوفةُ صلاحيات القاعدة ═══
   القاعدةُ ملفٌّ يُنشَر مع كلِّ دفعة — ومن أراد أن يفتح المشترياتِ لدور
   المشتريات انتظر إصدارًا. صارت القاعدةُ تقرأ وثيقةً واحدةً settings/perms
   مع كلِّ طلب: لكلِّ مجموعةٍ ولكلِّ دور {r,w,a,d} — القيمةُ الصريحةُ تحكم
   وnull يعني الافتراضيَّ المكتوبَ في القاعدة نفسِها. فما يُحفَظ هنا ينفذ في
   القاعدة في اللحظة نفسِها بلا نشر. والثوابتُ خارجها: الأثرُ لا يُحذَف،
   والهواتفُ لا تراها الوزارةُ ولا الإدارةُ العليا، وصاحبُ المشروع ببريده لا
   تحكمه — فلا يُقفَل على نفسه. والافتراضياتُ هنا مرآةُ القاعدة حرفًا بحرف
   ويحرسها جردٌ يقرأ الملفين. */
PV.PM_OPS = [['r','قراءة'], ['w','كتابة'], ['a','اعتماد'], ['d','حذف']];

var PM_COLS = [
  /* [المجموعة، الاسم، الافتراضيُّ لكلِّ عملية كما في القاعدة] */
  ['recs','زيارات المسح',              { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['inss','التركيبات',                  { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['tasks','المهام والإسنادات',         { r:'ok', w:'canW', d:'mgr' }],
  ['maints','زيارات الصيانة',           { r:'ok', w:'canW', d:'canW' }],
  ['steps','آخر ما تمّ',                { r:'ok', w:'canW' }],
  ['msgs','محادثة الميدان',             { r:'ok', w:'canW' }],   /* (V38.60) */
  ['dismantles','الفك',                 { r:'ok', w:'canW', d:'mgr' }],
  ['photos','الصور',                    { r:'ok', w:'canW', d:'mgr' }],
  ['newsites','المواقع المقترحة',       { r:'ok', w:'canW', d:'mgr' }],
  ['coreqs','طلبات الشركات',            { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['fixreqs','طلبات التصويب',           { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['colist','قائمة الشركات',            { r:'ok', w:'mgr' }],
  ['users','الحسابات',                  { w:'mgr', d:'mgr' }],
  ['settings','الإعدادات',              { w:'mgr' }],
  ['phones','هواتف المكتب والشركات',    { r:'canW', w:'mgr' }],
  ['events','سجل الأحداث',              { r:'ok', w:'canW' }],
  ['stats','اللقطات اليومية',           { r:'ok', w:'canW', d:'mgr' }],
  ['sites','عناوين الشبكة',             { r:'ok', w:'canW' }],
  ['hb','إشارات الأجهزة',                { r:'ok', w:'canW', d:'canW' }],
  ['hbev','انتقالات صحة الأجهزة',       { r:'ok', w:'canW' }],
  ['inventory','حركات المخزون',         { r:'ok', w:'canW', d:'mgr' }],
  ['purchases','المشتريات',             { r:'mgr', w:'mgr', d:'mgr' }],
  ['ships','الشحنات',                   { r:'ok', w:'canW', d:'mgr' }],
  ['workreqs','طلبات الورشة',           { r:'ok', w:'canW', d:'mgr' }],
  ['teams','الفرق',                     { r:'ok', w:'canW', d:'mgr' }],
  ['vehicles','السيارات',               { r:'ok', w:'canW', d:'canW' }],
  ['vehAsn','إسناد السيارات',           { r:'ok', w:'canW' }],
  ['bonus','نقاط الزيادة',              { r:'ok', w:'r90', d:'r90' }],
  ['baseline','خط الأساس',              { r:'ok', w:'mgr' }],
  ['changes','طلبات التغيير',           { r:'ok', w:'canW', a:'mgr' }],
  ['hse','السلامة والحوادث',            { r:'ok', w:'canW', d:'mgr' }],
  ['ncr','عدم المطابقة',                { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['ipc','المستخلصات',                  { r:'mgrOrViewer', w:'mgr' }],
  ['accounts','الحسابات المالية (قديم)', { r:'mgr', w:'mgr' }],
  ['props','مواقع مقترحة (قديم)',       { r:'ok', w:'canW', d:'mgr' }],
  ['srvorders','أوامر الخدمة (قديم)',   { r:'ok', w:'canW', d:'mgr' }]
];

/* القدراتُ التي تقابلها خليةٌ في المصفوفة: ما قالته المصفوفةُ صراحةً يَغلب ROLES */
var PM_CAP = { edit:['recs','w'], approve:['recs','a'], settings:['settings','w'], money:['purchases','r'],
               users:['users','w'], delete:['recs','d'], phones:['phones','r'],
               inventory:['inventory','w'], workshop:['workreqs','w'] };

/* الثوابتُ التي لا تُفتَح من المصفوفة — تُعرَض مقفولةً */
function pmLocked(col, op, role){
  return col === 'phones' && op === 'r' && (role === 'viewer' || role === 'exec');
}

function pmDefault(col, op, role){
  var spec = PM_COLS.filter(function(c){ return c[0] === col; })[0];
  var d = spec && spec[2][op];
  if (!d) return false;
  var mgr = role === 'engineer' || role === 'admin';
  var fieldR = ['tech','cprep','casm','cins','helper','driver'].indexOf(role) > -1;
  var canW = mgr || ['supervisor','buyer','store','acct'].indexOf(role) > -1 || fieldR;
  var vw = role === 'viewer' || role === 'exec';
  return d === 'ok' ? true : d === 'canW' ? canW : d === 'mgr' ? mgr
       : d === 'r90' ? rankOf(role) >= 90 : d === 'mgrOrViewer' ? (mgr || vw) : false;
}

PV.PM_DRAFT = null; PV.PM_ROLE = 'tech'; PV.PM_AT = 0;

function pmMatrix(){ return (PV.PM_DRAFT || (CFG.perms && CFG.perms.m) || {}); }

function pmOverride(col, op, role){
  var v = ((pmMatrix()[col] || {})[role] || {})[op];
  return (v === true || v === false) ? v : null;
}

function pmGet(col, op, role){
  if (pmLocked(col, op, role)) return false;
  var ov = pmOverride(col, op, role);
  return ov === null ? pmDefault(col, op, role) : ov;
}

function pmDirty(){ return !!PV.PM_DRAFT; }

function pmRefresh(force){
  if (!FB.ready || !FB.db) return Promise.resolve(false);
  if (!force && Date.now() - PV.PM_AT < 60000) return Promise.resolve(false);
  PV.PM_AT = Date.now();
  return DB.col('settings').doc('perms').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    if (doc && doc.exists) CFG.perms = doc.data();
    return true;
  }).catch(function(e){ softErr('سحب مصفوفة الصلاحيات', e, ''); return false; });
}

function pmCard(){
  var roles = Object.keys(ROLES);
  if (roles.indexOf(PV.PM_ROLE) < 0) PV.PM_ROLE = roles[0];
  var ovN = 0, M = pmMatrix();
  Object.keys(M).forEach(function(c){ Object.keys(M[c]).forEach(function(r){ Object.keys(M[c][r]).forEach(function(o){
    if (M[c][r][o] === true || M[c][r][o] === false) ovN++; }); }); });
  var cur = CFG.perms || {};
  return alertBox('info', 'ما تحفظه هنا تقرؤه قاعدةُ البيانات مع كلِّ طلبٍ فينفذ فورًا بلا نشر. الافتراضيُّ هو ما كانت عليه القاعدة، والمعدَّلُ يُعلَّم. والثوابتُ مقفولة: سجلُّ الأحداث لا يُحذَف، والهواتفُ لا تراها الوزارة، وصاحبُ المشروع لا يُقفَل على نفسه.')
    + stats([['خلايا معدَّلة', N(ovN), ovN ? 'wrn' : ''],
             ['نسخة المصفوفة', N(cur.v || 0)],
             ['آخر حفظ', cur.at ? '<span class="num">' + esc(agoTxt(cur.at)) + '</span>' : '—']])
    + '<div class="chips" role="tablist" style="margin:0 0 10px">' + roles.map(function(k){
        return '<button type="button" class="chip' + (k === PV.PM_ROLE ? ' on' : '') + '" role="tab" data-pmrole="' + esc(k) + '">'
          + esc(t(ROLES[k].n)) + '</button>';
      }).join('') + '</div>'
    + cardFlush(t('صلاحيات') + ' — ' + esc(t(ROLES[PV.PM_ROLE].n)),
        table(['المجموعة'].concat(PV.PM_OPS.map(function(o){ return o[1]; })),
          PM_COLS.map(function(c){
            return ['<strong title="' + esc(c[0]) + '">' + esc(t(c[1])) + '</strong>'].concat(   /* (V39.98) the technical key moved to the tooltip — Latin words in the Arabic screen were the complaint */
              PV.PM_OPS.map(function(o){
                if (!c[2][o[0]]) return '<span class="hint" style="margin:0">—</span>';
                var lock = pmLocked(c[0], o[0], PV.PM_ROLE), on = pmGet(c[0], o[0], PV.PM_ROLE), ov = pmOverride(c[0], o[0], PV.PM_ROLE);
                var cls = lock ? 'off' : on ? 'ok' : 'off';
                var mark = lock ? ' \u{1F512}' : (ov === null ? '' : ' *');
                return may('perms') && !lock
                  ? '<button type="button" class="pill ' + cls + '" style="border:0;cursor:pointer" data-pmk="' + esc(c[0] + '|' + o[0]) + '" title="'
                    + esc(t(ov === null ? 'افتراضيُّ القاعدة — اضغط لتقلبه' : 'معدَّل — اضغط لتعيده إلى الافتراضي')) + '">'
                    + (on ? '\u2713' : '\u2717') + mark + '</button>'
                  : pill((on ? '\u2713' : '\u2717') + mark, cls);
              }));
          })),
        (may('perms')
          ? btn('\u{1F4BE} ' + t('احفظ في القاعدة'), pmDirty() ? 'btn-primary btn-sm' : 'btn-secondary btn-sm', ' data-pmsave="1"')
            + btn('\u21BA ' + t('أعد هذا الدور إلى الافتراضي'),'btn-quiet btn-sm',' data-pmreset="1"')
            + btn('\u21BB ' + t('اقرأ من القاعدة'),'btn-quiet btn-sm',' data-pmrefresh="1"')
          : '')
        + '<p class="hint" style="margin:9px 0 0">' + esc(t('✓ مسموح · ✗ مرفوض · * معدَّلٌ عن الافتراضي · 🔒 ثابتٌ في القاعدة. «اعتماد» = كتابةُ approved/معتمد. الحذفُ الجماعيُّ (التصفير) يتبع خانةَ الحذف.')) + '</p>');
}

/* ═══ سلسلةُ الإدارة: مديرٌ لا مشرف ═══
   كان الحقلُ يُسمّى «مشرفه المباشر» ويُكتَب اسمًا حرًّا — فيُكتَب اسمُ من
   لا حسابَ له، ويُجعَل الفنيُّ مشرفًا على مشرفه، ولا شيءَ يمنع. صار
   «مديره»: حسابًا من النظام مرتبتُه أعلى. فالفنيُّ مديرُه مشرفُه،
   والمشرفُ مديرُه المهندس، والمهندسُ مديرُه مديرُ المشروع.
   والمرتبةُ تُقرأ من الدور — والدورُ يُشتقُّ من الوظيفة. */
var ROLE_RANK = { exec:110, admin:100, engineer:90, supervisor:70,
                  cprep:50, casm:50, cins:50,
                  tech:30, buyer:30, store:30, acct:30, helper:30, driver:30,
                  viewer:10 };

function rankOf(role){ return ROLE_RANK[role] != null ? ROLE_RANK[role] : 30; }

/* ═══ الأدوارُ المخصَّصة ═══
   كانت الأدوارُ أربعةَ عشرَ مكتوبةً في الشيفرة وفي القاعدة، ومن أراد «مندوبَ
   شركة» أو «قائدَ فرقة» انتظر إصدارًا. صار الدورُ يُضاف من شاشة الأدوار:
   اسمٌ وأساسٌ ورتبة — يرث شاشاتِ أساسه وقدراتِه، وتُعدَّل قدراتُه هنا وخانتُه
   في مصفوفة القاعدة بمفتاحه، والقاعدةُ تعامله بأساسه ورتبته (settings/roles)
   دون نشر. ويُحذَف إن لم يبقَ عليه حساب. والأساسيّةُ لا تُحذَف. */
PV.BASE_ROLES = ['exec','admin','engineer','supervisor','viewer','tech','cprep','casm','cins','buyer','store','acct','helper','driver'];

function effRole(r){ var x = ROLES[r]; return (x && x.custom && x.base) ? x.base : r; }

function rolesApply(){
  var R9 = (CFG.roles && CFG.roles.r) || {};
  /* ما زال مخصَّصًا وليس في الوثيقة: أُزيل */
  Object.keys(ROLES).forEach(function(k){ if (ROLES[k].custom && !R9[k]){ delete ROLES[k]; delete ROLE_RANK[k]; } });
  Object.keys(R9).forEach(function(k){
    var c = R9[k] || {}, b = ROLES[c.base] && !ROLES[c.base].custom ? ROLES[c.base] : ROLES.tech;
    if (PV.BASE_ROLES.indexOf(k) > -1) return;   /* لا يُكتَب فوق أساسيّ */
    ROLES[k] = { n:c.n || k, d:c.d || (t('يرث') + ' ' + t(b.n)), base:c.base || 'tech', custom:true,
                 kind:b.kind, guide:b.guide, nav:Array.isArray(b.nav) ? b.nav.slice() : b.nav,
                 can:Object.assign({}, b.can || {}) };
    ROLE_RANK[k] = (typeof c.rank === 'number') ? c.rank : rankOf(c.base || 'tech');
  });
  /* القدراتُ المخصَّصةُ فوق الجميع */
  var caps = CFG.roleCaps || {};
  Object.keys(caps).forEach(function(k){
    if (ROLES[k] && caps[k] && typeof caps[k] === 'object') ROLES[k].can = Object.assign({}, ROLES[k].can || {}, caps[k]);
  });
}

function roleUsers(k){
  return Object.keys(STATE.users || {}).filter(function(uid){ var u = STATE.users[uid]; return u && u.role === k; }).length;
}

/* ═══ الرتبةُ أعلى الاثنين ═══
   كان دورُ الوظيفة يغلب دورَ الحساب دائمًا. فمن دورُ حسابه «الإدارة العليا»
   ووظيفتُه «مدير المشروع» تُقرأ رتبتُه رتبةَ مديرِ المشروع — فلا يصلح مديرًا
   لمديرِ المشروع، ويُقال «لا حسابَ أعلى رتبةً بعد» وهو موجود.
     والوظيفةُ وصفُ عملٍ لا سقفُ صلاحية: من رُفع دورُه صراحةً لا تخفضه
   وظيفتُه القديمة. فتُقرأ الرتبةُ أعلى الاثنين. */
function roleOfUser(u){
  if (!u) return '';
  var byJob = '';
  if (u.job && typeof jobOf === 'function'){
    var j = jobOf(u.job);
    if (j && j.role) byJob = j.role;
  }
  var byAcc = u.role || '';
  if (!byJob) return byAcc;
  if (!byAcc) return byJob;
  return rankOf(byAcc) >= rankOf(byJob) ? byAcc : byJob;
}

/* ═══ من تحتَ فلان — الشجرةُ كلُّها لا الصفُّ الأوّل ═══
   الإدارةُ سلسلةٌ: شعراوي ← صفوت ← شكري ← لاشين ← المهندسون ← المشرفون ←
   الفنيّون ← المساعدون. ومن فوقُ يرى ما تحته إلى آخره، لا من يتبعه مباشرةً. */
function underNames(name){
  var U = STATE.users || {}, kids = {}, out = [], seen = {};
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || !u.name || u.active === false) return;
    (kids[u.sup || ''] = kids[u.sup || ''] || []).push(u.name);
  });
  var stack = [name || ''];
  while (stack.length){
    (kids[stack.pop()] || []).forEach(function(c){ if (!seen[c]){ seen[c] = 1; out.push(c); stack.push(c); } });
  }
  return out;
}

function mgrCandidates(role, exceptUid){
  var r = rankOf(role), U = STATE.users || {}, out = [];
  /* كان المديرُ من رتبةٍ أعلى حصرًا، فلم يُمكن أن يدير مهندسٌ مهندسًا — والسلسلةُ
     في الأرض أعمقُ من سلّم الأدوار (شكري ← لاشين ← المهندسون). فصار: الأعلى أو
     المساوي، ما لم يكن تحته أصلًا (فلا دورة). والوزارةُ مديرُها من المهندس فصاعدًا. */
  var eq = r === rankOf('engineer');           /* المساواةُ للمهندسين وحدَهم: مهندسٌ يدير مهندسًا — والباقي سلّم */
  var floor = effRole(role) === 'viewer' ? rankOf('engineer') : r;
  var me = exceptUid && U[exceptUid] ? U[exceptUid].name : '';
  var below = me ? underNames(me) : [];
  Object.keys(U).forEach(function(uid){
    var u = U[uid];
    if (!u || !u.name || u.active === false || uid === exceptUid) return;
    var ur = rankOf(roleOfUser(u));
    if (effRole(role) === 'viewer' ? ur < floor : (eq ? ur < r : ur <= r)) return;
    if (below.indexOf(u.name) > -1 || (me && u.name === me)) return;
    out.push({ uid:uid, n:u.name, role:roleOfUser(u) });
  });
  return out.sort(function(a, b){ return rankOf(b.role) - rankOf(a.role) || arCmp(a.n, b.n); });
}

function mgrOptions(role, cur, exceptUid){
  var L = mgrCandidates(role, exceptUid);
  return '<option value="">— ' + esc(t('بلا مدير')) + ' —</option>'
    + L.map(function(x){
        return '<option value="' + esc(x.n) + '"' + (cur === x.n ? ' selected' : '') + '>'
          + esc(x.n) + ' \u00b7 ' + esc(t((ROLES[x.role] || {}).n || x.role)) + '</option>';
      }).join('')
    + (L.length ? '' : '<option value="" disabled>' + esc(t('لا حسابَ مرتبتُه أعلى بعد')) + '</option>');
}

/* أقسامُ الشركة — القائمةُ نفسُها التي تعرضها «خريطة التغطية» */
function deptOptions(cur){
  return '<option value="">— ' + esc(t('بلا قسم')) + ' —</option>'
    + ORG.co.units.map(function(u){
        return '<option value="' + esc(u.id) + '"' + (cur === u.id ? ' selected' : '') + '>'
          + u.i + ' ' + esc(t(u.n)) + '</option>';
      }).join('');
}

function deptName(id){
  var u = ORG.co.units.filter(function(x){ return x.id === id; })[0];
  return u ? (u.i + ' ' + t(u.n)) : '';
}

function maySupEng(){ return mayBonus(); }

/* السجلّ: الأمُّ وشرائحُها — كلُّ شريحةٍ بمعرِّفها القديم واسمها القصير وأيقونتها ووصفها الأصلي */
var TABS = {
  /* (V38.67) the conversations, and their history for the project's management */
  chat:[
    ['chat','المحادثات','\u{1F4AC}','المهندسُ في المكتب والمنفِّذُ في الموقع يتكلّمان هنا — على نقطةٍ مجدولةٍ للتركيب أو مباشرةً، وكلُّ سطرٍ يبقى.'],
    ['chathist','سجل المحادثات','\u{1F5C2}','كلُّ سطرٍ كُتب — بفلترٍ بالنقطة والشخص والتاريخ والنوع والنص.','chatmgr']
  ],
  exp:[
    ['exp','التصدير والاستيراد','\u2B07','ما يخرج من النظام وما يدخل إليه.'],
    ['repcenter','مركز التقارير','\u{1F4D1}','قوائمُ التقارير ودورياتُها وحزمُها.']
  ],
  mywork:[
    ['mywork','مهامي','📋','ما أُسند إليك — وحالةُ كلِّ زيارةٍ منها.','self'],
    ['mine','جدولي','🗓','ما أُسند إليك — وترتيبك بلا أرقام زملائك.'],
    ['myscore','أدائي','🎯','نقاطُك وترتيبُك ومستحقُّك.','self'],
    ['myteam','فريقي','👥','من تحتك ونقاطُهم.','team'],
    ['board','لوحة الفريق','📊','من تحتك في شاشةٍ واحدة: ما أُسند لكلٍّ، وما أنجزه اليوم، وما ينتظر اعتمادك، وآخر ظهور.','team'],
    ['mycrew','شغل فريقي','🔧','ما على فريقك الميداني من عمل.','self']],
  fleet:[
    ['fleet','الأسطول','🚗','أسطولُ المشروع — لوحاتُه ورخصُه وتكلفتُه.'],
    ['fleetAsn','الإسناد','🔑','مَن يقود ماذا ولأيِّ عمل.'],
    ['fleetLog','سجل العُهدة','📒','من كانت معه أيُّ سيارةٍ وفي أيِّ يوم — للمخالفات والمساءلة.'],
    ['fleetCost','التكلفة','💰','ما تكلّفه السياراتُ شهريًّا ومنذ متى تعمل.'],
    ['myveh','سيارتي','🙋','ما أُسنِد إليك من مركبات.']],
  /* متابعةُ الوزارة (V20.0): عناوينُ العرض الأسبوعي الذي كان يُرسَل للاجتماعات */
  mfu:[
    ['mfu','الملخص','📋','الأرقامُ التي يُفتتح بها الاجتماع — ومقارنتُها بالأسبوع الماضي.'],
    ['msurv','المسح الميداني','🔍','نسبةُ المسح (ما تمت زيارتُه) وما تبقّى، والنقاطُ بعوائق وبدونها — بالمشعر والنوع، وتأكيدُ نقاط منشأة الجمرات بالأدوار.', '', 'hidden'],   /* (V29.2) */
    ['mweek','المهام الأسبوعية','🗓','مهامُّ الاجتماع كاملةً — تُحدَّث من هنا، وما يعالج تحدّيًا يُعرَف به.'],
    ['minst','حالة التركيبات','🔧','المخيماتُ والممراتُ وكلُّ نوعٍ بنسبة تركيبه في كلِّ مشعر.'],
    ['mcos','شركات الخدمة','🏢','لكلِّ شركةٍ مخيماتُها وما تمت زيارتُه منها والتحديات — وفي التركيب ما رُكّب ومستواه.'],   /* (V29.1) بحسب المرحلة */
    ['mobs','التحديات والمعوقات','🚧','كلُّ عائقٍ بفئته وجهته وآلية معالجته ومسؤوله وحالته — بفلتر المشعر والنوع.'],
    ['mreq','طلبات الوزارة','📨','ما طلبته الوزارةُ وآخرُ إفادةٍ فيه والدعمُ المطلوب.', '', 'hidden'],
    ['mdaily','ملخص العمل اليومي','📈','الزياراتُ والتركيبُ والفكُّ وما تحتاج زيارةً أخرى تقنيًا — يومًا بيوم.'],
    ['mcamps','المخيمات المركزية','🏕','حالةُ الإشغال الحيِّ لمخيمات منى من نظام البطاقات — مطابقةً برقم القارئ.'],   /* (V37.75) */
    ['kiosk','شاشةُ القاعة','🏛','عرضٌ كبيرٌ يُقرأ من آخر القاعة ويتجدّد وحدَه كلَّ دقيقة — وفيه النقاطُ بعوائق وبدونها للإجمالي ولكلِّ نوع.', '', 'hidden']],   /* (V37.49) المفتاحُ باقٍ للتوافق (الأدلةُ والمساعدُ والجرود) — والتبويبُ مخفيٌّ من الشريط: صار زرَّ «عرض القاعة» على الملخّص */
  over:[
    ['over','الصورة العامة','📊','الصورة التنفيذية لحظيًّا — تُحدَّث مع كل عملية ميدانية.'],
    ['now','أمس · الآن · غدًا','⏱','ما انتهى، وما يجري الآن ومن يفعله وأين، وما هو مجدولٌ لغد.'],
    ['reg','حسب المشعر والنوع','🗺','التوزيع الكامل بالنسب.'],
    ['pace','الوتيرة والهدف','⏱','المطلوب يوميًّا لبلوغ الموعد، وتاريخ الانتهاء المتوقع.'],
    ['inst','التركيب والجدولة','🔧','ما جُدول وما نُفّذ وما تعذّر — بحالته ونوعه.'],
    ['svdash','تفاصيلُ المسح','📐','ما حُصر فعلًا: الغرفُ والخيام، وما لا تحدّيَ فيه، وما فيه تحدٍّ، وما يحتاج هيكلًا — ولكلِّ رقمٍ قائمتُه، تُصدَّر، ويطير كلُّ سطرٍ إلى نقطته على الخريطة.'],
    ['tgates','بوابات التفويج','🚧','حصرُ بوابات تنظيم التفويج من المسح الميداني: كم بوابة، وفي أيِّ مخيم، وأين — ومن سجّلها؛ وكلُّ سطرٍ يطير إلى مخيمه على الخريطة.'],   /* (V42.8) */
    ['added','المضاف يدويًا','🆕','ما لم يكن في ملف العام الماضي: أضافه المكتب أو الميدان أو الوزارة — بمن أضافه ومتى وأين، وحالته.']],   /* (V42.8) */
  pts:[
    ['visits','الزيارات','🔍','وزن زيارة كل نوع وتارجت المسح.'],
    ['prep','التهيئة','⚙','نقاط تهيئة كل جهاز في الورشة.'],
    ['asm','التجميع','🧰','نقاط تجميع مكوّنات البوكس.'],
    ['install','التركيب','🔧','نقاط كل قطعة وتارجت التركيب.'],
    ['disp','الفك','📦','وزن الفك ومعاملا الحالة.']],
  inv:[
    ['invb','الأرصدة','📦','المخزن والعُهدة والتالف — مشتقّةً من دفتر الحركة لا مكتوبةً بإصبع.'],
    ['invmv','دفتر الحركة','📒','إلحاقيٌّ لا يُعدَّل — كل تصحيح حركةٌ جديدة تُوازنه.'],
    ['stock','عُهدة الأجهزة','👤','ما في يد كل منفِّذ الآن — من دفتر الحركة.'],
    ['ships','الشحنات والتوريد','🚛','ما شُحن ومتى يصل — وما تأخّر عن موعده.'],
    ['wos','الطلبات','📥','طلباتُ التهيئة والتجميع — رقمُها وحالتُها ومن نفَّذها ومتى.'],
    ['wday','نقاط اليوم','📆','ما نُفِّذ اليوم — تركيبًا حقيقيًّا؛ والتهيئةُ والتجميعُ حين يُبنى نظامُ طلباتهما.']],
  users:[
    ['users','الحسابات','👤','كل حساب ودوره في مكانٍ واحد — إنشاءً وبحثًا وتصفيةً بالنوع.'],
    ['assignRole','إسناد الأدوار','🔗','من في أيِّ وظيفةٍ وأيِّ فريق.'],
    ['roles','الأدوار والصلاحيات','🛡','الدورُ ما يستطيعه الشخصُ في النظام — لا ما يعمله في الميدان.'],
    ['jobs','الوظائف','💼','ما يعمله الشخصُ — ومنه يُشتقُّ دورُه وصلاحيتُه.'],
    ['perms','صلاحيات القاعدة','🔐','ما تقبله قاعدةُ البيانات لكلِّ دور — يُحفَظ هنا وينفذ في القاعدة فورًا.']],
  sys:[
    ['sys','سلامة البيانات','🩺','فحوص تكشف التناقض قبل أن يصير رقمًا في تقرير.'],
    ['bugs','البلاغات','🛠','ما أُبلغ عنه من التطبيق — وأين وصل في المستودع.'],
    ['sync','المزامنة والتعارض','🔄','ما يحدث حين يحرّر اثنان نقطةً واحدةً بلا شبكة.'],
    ['vers','نسخ الأجهزة','📱','نسخة التطبيق على كل جهاز — لاكتشاف من علِق على إصدار قديم.'],
    ['usage','الاستهلاك والأداء','📈','كلُّ جهاز: قراءاتُه وطوابيرُه وأعطالُه وزمنُ رسمه وسحبه — ومن سقط منها.'],
    ['dq','تصحيح البيانات','🧹','أربعةُ عيوبٍ في السجل — تُرى بعددها وتُصلَح دفعةً.'],
    ['integ','الربط','🔌','حساباتُ أفاقي برو ونظام البطاقات — تُحفظ هنا ويعمل الجسرُ وحده كلَّ ٥ دقائق، وزرُّ «حدّث الآن».'],   /* (V39.70) */
    ['retain','عمر البيانات','⏳','ما يبقى وما يُؤرشَف وما يُحذف — وحجم كلٍّ.'],
    ['wipe','تصفير البيانات','🗑','بدايةُ الموسم من صفر — تُمسَح السجلاتُ ويبقى التعريف.'],
    ['hb','صحة الأجهزة','💓','الإنذار المبكر لما رُكّب — يعمل من جهاز المكتب على شبكة الميدان.']],
  items:[
    ['items','القطع والأسعار','📋','كتالوج القطع وسعر كل قطعة.'],
    ['buycat','فئات المشتريات','🏷','تبويب مشتريات السوق المحلي.'],
    ['sup','المورّدون','🏪','قائمة موحّدة لمن نشتري منهم.'],
    ['consts','ثوابت النظام','🔢','أيام العمل وساعات اليوم.'],
    ['names','أسماء العرض','🏷','كيف تُكتَب أسماءُ الأشخاص والشركات بالإنجليزية — تصحيحٌ يُكتَب مرةً ويثبت.'],
    ['vehkind','أنواع السيارات','🚙','أنواعُ الأسطول وسعةُ كلٍّ — والعددُ يُشتقُّ مما أُضيف.']],
  org:[
    ['cover','خريطة التغطية','🗺','كلُّ قسمٍ في الشركة وكلُّ إدارةٍ عند العميل — وما يخصّه.'],
    ['raci','مصفوفة المسؤوليات','📋','من ينفّذ ومن يُساءل ومن يُستشار ومن يُبلَّغ.'],
    ['esc','التصعيد','🚨','ما تجاوز مهلتَه — ومن يُرفَع إليه.'],
    ['hse','السلامة والحوادث','🦺','ساعاتُ العمل الآمنة والحوادثُ والتصاريح — في موقعٍ يزدحم بالحجاج.']],
  forms:[
    ['svForm','المسح','🔍','البياناتُ المسجَّلة تُراجَع فقط ولا تُكتَب من جديد — اكتب ما لا نعرفه عن الموقع.'],
    ['insForm','التركيب','🔧','ما يُوثَّق عند إتمام التركيب — بصوره وسيرياته.'],
    ['disp2','الفك والعُهدة','📦','ما رُكِّب — يُجدوَل للفك وتُرجَع عُهدتُه بحالتها.'],
    ['newsite','موقع جديد','📍','ما لم يكن في القاعدة — يُسجَّل بموضعك ويُعتمَد لاحقًا.'],
    ['hand','التسليم والضمان','🤝','ما سُلِّم للعميل وما هو في الضمان.'],
    ['maintForm','الصيانة','🛡','عطلٌ يُسجَّل وإصلاحٌ يُوثَّق — فتُغلَق مهمةُ الصيانة.'],
    ['ips','عناوين الشبكة','🌐','بادئةُ كلِّ نقطةٍ وعناوينُ أجهزتها — تُستورَد وتُصدَّر.']],
  /* «الشركات» شاشةٌ بجسمها — تبقى تحت أمِّها، ويصلها الميدانُ بزرٍّ من
     «موقع جديد» فلا يخرج من النموذج ليضيف شركةً ثم يعود. */
  co:[
    ['co','حسب شركة الخدمة','🏢','لكلِّ شركةٍ مخيّماتُها — تُضاف وتُعدَّل وتُحذَف.'],
    ['conote','إشعار الشركات','📣','رسالةٌ جاهزةٌ لكل شركةٍ بموعد تركيبها — تُفتح في واتساب.']],
  sel:[
    ['sel','المحدَّد','☑','ما حدّدته من الخريطة — لعملٍ جماعي عليه.'],
    ['layers','الطبقات الثلاث','🗂','ما تُظهره كلُّ طبقةٍ وما تُسنده — ونقاطُها المحسوبة.']],
  /* الشرائحُ بترتيب دورة النقطة (V17.74): مسحٌ ← اعتمادٌ تقنيٌّ ← الحلُّ
     بأصنافه ← اعتمادُ الوزارة ← جاهزٌ للتركيب ← تدقيق ← عدمُ مطابقة — ثم ما
     خرج عن الدورة: الإفاداتُ والتحدياتُ والمتعذّرُ والراكد. كان «حلُّ التركيب»
     بعيدًا عن الاعتماد الذي يعتمد عليه، فمن اعتمد زيارةً لم يجد الخطوةَ التاليةَ
     بجواره. */
  survey:[
    ['survey','المسح الميداني','🔍','ما مُسح ومن مسحه ومتى — وإعادةُ تصنيف ما تعذّر منه لزيارةٍ ثانية.'],
    ['svappr','الاعتماد التقني','✅','ما زاره المشرفون ببياناته الجديدة — يعتمده المهندسُ تقنيًّا أو يردُّه لزيارةٍ أخرى، ثم يقترح حلَّه.'],
    ['solution','حل التركيب','🔧','الأجهزةُ المقترحة لكل نقطة — يعتمدها المهندس قبل أن تصير طلبَ تركيب.'],
    ['minappr','اعتماد الوزارة','🏛','ما اعتُمد تقنيًّا وينتظر اعتمادَ الوزارة لإعداد التركيب — تعتمده أو تُعيده بملاحظة.'],
    ['ready','جاهز للتركيب','🟠','ما اعتمدته الوزارةُ وحلُّه معتمدٌ ولم يُسنَد تركيبُه بعد — يُجدوَل من هنا.'],
    ['qa','التدقيق الهندسي','🔎','اعتماد التركيبات والسيريالات قبل الإقفال — ولا نقاطَ قبله.'],
    ['ncr','عدم المطابقة','🚫','ما خالف المواصفة — وإجراؤه التصحيحي حتى الإغلاق.'],
    ['chalm','التحديات والمعوقات','🚧','كلُّ معوقٍ بفلتر المشعر والنوع — واضغط التحدي ترى نقاطه. تُغلق تلقائيًّا عند التركيب.'],
    ['stuck','المتعذّر','\u26D4','ما لم يصل إليه الميدانُ — بسببه وقراره.'],
    ['idle','الراكد','\u23F8','زيارةٌ تمّت ولم يُركَّب موقعُها — بعمر الركود وسببه.']],
  req:[
    ['req','طلبات الزيارة','📨','إسناد زيارات المسح للفنيين واعتمادها.'],
    ['reqreg','سجل الإسنادات','🗂','كلُّ طلبٍ من كلِّ نوع — يُتابَع ويُعدَّل ويُحذَف.','self'],
    ['assign','توزيع الفرق','👥','ما أُسند وما بقي — لكل مشعرٍ ونوع.']],
  ev:[
    ['ev','سجل الأحداث','📜','كل تغيير بمن أجراه ومتى — خامًا أو مصنَّفًا بالحوكمة، من نفس السجل.'],
    ['notif','الإشعارات','🔔','ما يجب أن يعرفه أحدٌ الآن — وبأيِّ قناةٍ يصله.'],
    ['appr','الاعتمادات','✔','ما اقترحه المشرفون بانتظار قرارك.']],
  exec:[
    ['exec','اللوحة التنفيذية','🎯','ما يحتاجه القرار في شاشةٍ واحدة.'],
    ['diary','يوميات المشروع','📅','كلُّ يومٍ منذ أوّل يومِ عمل: كم مُسح ورُكّب وفُكّ واعتُمد، ومن عمل — والتراكميُّ إلى اليوم.'],
    ['pmi','مطابقة المنهجية','🎓','كلُّ بندٍ من دليل المعرفة والمنهج الرشيق ومنهج الذكاء الاصطناعي بدليله في النظام وحالته — تُحسَب من البيانات.'],
    ['lessons','الدروس والمراجعات','📝','الدروسُ المستفادةُ والمراجعاتُ الدورية: ما حدث، ولماذا، وما الإجراء، ومن يملكه.'],
    ['stake','أصحاب المصلحة','🤝','سجلُّ أصحاب المصلحة: التأثيرُ والاهتمام، والانخراطُ الحاليُّ والمطلوب، والخطة.'],
    ['budm','الملخّص المالي','💰','المنصرفُ من الميزانية بأبوابه — بلا مورّدين ولا فواتير.']],
  plan:[
    ['setup','المواعيد والأزمنة','📅','الموعد المستهدف وزمن التركيب لكل نوع.'],
    ['wplan','خطة الأسبوع','🗂','خطةُ المهندس للأسبوع: نقاطٌ بتفاصيلها وخطواتها ومتطلباتها ونتائجها — كلُّ نقطةٍ تُتمّ بنتيجة أو تُحدَّث أو تُغلَق. يراها المهندسون ومن فوقهم.'],
    ['miles','المعالم والتسليم','🏁','محطّاتُ المشروع وأوزانُها وما اعتمد عليه كلٌّ منها.'],
    ['evm','خط الأساس والقيمة','📈','أين نحن من المخطَّط — بلغةِ التقارير المعتمدة.'],
    ['risks','سجل المخاطر','⚠','ما قد يقع، واحتمالُه وأثرُه، ومن يملك الردَّ عليه.'],
    ['chg','ضبط التغيير','🔄','لا يُمسّ خطُّ الأساس إلا بطلبٍ يُوثَّق ويُقيَّم ويُعتمَد.'],
    ['crewplan','الطواقم والمعدلات','📊','كم فريقًا يلزم لبلوغ الموعد — محسوبًا من معدل كل نوع.'],
    ['pipe','سلامة خط الإنتاج','🛠','مسح ← جدولة ← تركيب — وأي تعارض بينها.']],
  perf:[
    ['perf','الأداء','🎯','أداءُ المشروع على خمسة مستويات: الترتيب العام، بالمرحلة، بالوظيفة، بالفريق، وللمشروع كله.'],
    ['crewman','الفرق','👥','كلُّ فريقٍ صفحتُه وحده: موظفوه وفرقُه الفرعية معًا.']],
  ipc:[
    ['ipc','المستخلصات','🧾','ما أُنجز واعتُمد — يُقدَّم للعميل ويُتابَع صرفُه.'],
    ['buys','دفتر المشتريات','🛒','مصروفات السوق المحلي بفواتيرها ومورّديها ومشاعرها.'],
    ['budget','الميزانية والاعتماد','📊','سقف الصرف وحدّ اعتماد المهندس.']],
  dis:[
    ['dis','الفك بعد الموسم','📦','جدولة الفك وإرجاع العُهدة بحالة كل صنف.'],
    ['chain','سلسلة المراحل','🔗','كلُّ عددٍ من الذي قبله — لا رقمَ ثابتًا قبل أوانه.']],
  guide:[
    ['guide','دليل الاستخدام','📘','دليلك أنت — بما تملكه من شاشات لا بما لا تملك.'],
    ['wf','دورة العمل','\u{1F5FA}','كلُّ دورةٍ خطوةً خطوة — من يفعل ماذا وأين، حتى الاعتماد.','self'],
    ['sop','دليل العمليات','📋','كلُّ دورةٍ في المشروع — من يبدأها ومن ينفّذها وأين وبأي قاعدة.']]
};

var PTAB = {};

/* الأمُّ → شريحتُها الحالية */
var PARENT = {};

/* ═══ شريحةٌ لم تكن صفحةً قطّ ═══
   «شغلي» كانت تُدير تبويبَها بآليةٍ ثانيةٍ خاصّةٍ بها (MYW_TAB) — رأسُ شرائحَ
   مرسومٌ بيدٍ ومعالجُ نقرٍ ثانٍ وحالةٌ ثالثة. وآليتان تفعلان الشيءَ نفسَه
   عبءٌ لا ميزة: ما يُصلَح في إحداهما يُنسى في الأخرى. فوُحِّدتا.
   لكنَّ «أدائي» و«فريقي» و«شغل فريقي» لم تكن صفحاتٍ يومًا، فليست في قوائم
   الأدوار ولا تملك صلاحيةً خاصّة — فرؤيتُها رؤيةُ أمِّها. ويُعلَن ذلك
   صراحةً في العنصر الخامس من صفِّ الشريحة، ومعه شرطٌ إن كان لها شرط. */
var TAB_SEE = {
  /* (V38.67) the chat history: the project's management (admin and above) */
  chatmgr: function(pid){ return seesRaw(pid) && rankOf(effRole(ROLE)) >= rankOf('admin'); },
  /* «مهامي» و«أدائي» لمن له مهامُّ ونقاط — لا للإدارة العليا التي ترى لا تعمل */
  self: function(pid){ return seesRaw(pid) && !(pid === 'mywork' && effRole(ROLE) === 'exec'); },
  /* «فريقي» لمن تحته أحدٌ فعلًا، أو لمشرفٍ ومهندس */
  team: function(pid){
    var r = ROLE || (STATE.meta && STATE.meta.role) || '';
    return seesRaw(pid) && (r === 'supervisor' || r === 'engineer' || r === 'admin' || r === 'exec'
      || techsList().filter(function(x){ return underNames(STATE.meta.name || '').indexOf(x.n) > -1; }).length > 0);
  }
};

/* ما يراه هذا الدورُ من شرائح الأم — بقواعد الرؤية نفسِها */
function tabsOf(pid){
  return (TABS[pid] || []).filter(function(tb){
    var f = tb[4] && TAB_SEE[tb[4]];
    return f ? f(pid) : seesRaw(tb[0]);
  });
}

/* الشريحةُ الحالية — وتُردُّ إلى أوّلِ مرئيّةٍ إن لم تكن مرئية */
function tabCur(pid){
  var vis = tabsOf(pid);
  if (!vis.some(function(tb){ return tb[0] === PTAB[pid]; })) PTAB[pid] = vis.length ? vis[0][0] : '';
  return PTAB[pid];
}
