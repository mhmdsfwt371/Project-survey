/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-06-people-functions.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : People and functions: who gets field work, unified department page, functions from which roles derive.
   DEFINES : isFieldRole, isCrewRole, techsList, techUid, techSet, techDel, crewsList, crewSave, crewAdd, crewDel, crewTechs, crewTeams, unassignedTechs, depTechAdd … (+21 more)
   GLOBALS : FIELD_ROLES, SITES_ALL, JOBS_SEED, LESS_SHOW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الفنيون والفرق: يُضافون ويُعدَّلون ويُحذَفون ═══════════════════════
   كان سجلُّ الفنيين قائمةَ عرضٍ: ستةُ أسماءٍ مخترعةٍ لا تُزاد ولا تُنقَص.
   ومن أراد فنيًّا جديدًا لم يجد أين يكتبه، ومن انصرف فنيٌّ لم يجد كيف
   يرفعه — فيبقى في التوزيع ويُسنَد إليه عملٌ لا يؤدّيه أحد. */

/* ═══ المصدرُ الواحدُ للأشخاص: الحسابات ═══
   كانت قائمةُ الفنيين قائمةً ثانيةً موازيةً للحسابات — تُزرَع في الشيفرة
   وتُضاف من شاشة الفرق وتُخزَّن في settings/techs — فالاسمُ الواحد يُكتَب في
   مكانين ويختلف فيهما، ومن حُذف من هنا بقي هناك. صارت القائمةُ تُشتقُّ من
   الحسابات: من له حسابٌ ظهر، ووظيفتُه تقرّر في أيِّ دورةٍ يظهر — الفنيُّ في
   دورة الفني وهكذا. ولا يُخزَّن شيءٌ باسم القائمة: التعديلُ يقع على وثيقة
   الحساب نفسِها. */
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
function techDel(name){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }
  /* من له عملٌ مسجَّلٌ لا يُحذَف: سجلاتُه تحمل اسمَه، وحذفُه يُيتِّمها */
  var work = scores().list.filter(function(e){ return e.name === name; })[0];
  var acts = work ? (work.survey + work.install + work.dis + work.prep + work.asm) : 0;
  if (acts){
    toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — لا يُحذَف'));
    return;
  }
  /* الحذفُ حذفُ حسابٍ — فالقائمةُ مشتقّةٌ منه */
  var uid = techUid(name);
  if (!uid) return;
  delete STATE.users[uid];
  CORE.dirty('users', uid, null);
  logEvent('حذف حساب — ' + name);
  toast(t('حُذف الحساب'));
  render(1);
}

/* الفرق: تُنشأ وتُحذَف، وأعضاؤها من سجل الفنيين لا من نصٍّ حرّ */
function crewsList(){
  if (!Array.isArray(STATE.crews) || !STATE.crews.length) STATE.crews = CREWS.slice();
  return STATE.crews;
}
function crewSave(){ CORE.set('cfg', 'crews', crewsList().slice()); }
function crewAdd(){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('crN');
  if (!n){ toast(t('اكتب اسم الفريق')); return; }
  if (crewsList().some(function(c){ return c.n === n; })){ toast(t('الاسمُ موجودٌ بالفعل')); return; }
  var id = 'cr' + Date.now().toString(36);
  crewsList().push({ id:id, n:n,
                     base:g('crRole') || 'supervisor', kind:g('crKind') || 'ins',
                     d:g('crD'), members:[] });
  crewSave();
  CREW_CUR = id;
  logEvent('فريق جديد — ' + n);
  toast(t('أُنشئ الفريق'));
  render(1);
}
function crewDel(id){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  /* يُقبَل المعرّفُ والاسمُ معًا: الشاشةُ تُرسل الاسمَ لأنه ما يراه
     المستخدمُ، والنداءُ القديمُ يُرسل المعرّف. */
  var L = crewsList(), i = -1, nm2 = '', id2 = '';
  L.forEach(function(c, k){ if (c.id === id || c.n === id){ i = k; nm2 = c.n; id2 = c.id; } });
  if (i < 0) return;
  var inIt = techsList().filter(function(x){ return x.crew === nm2; }).length;
  if (inIt){ toast(t('فيه') + ' ' + nm(inIt) + ' ' + t('موظفًا — انقلهم أولًا')); return; }
  var subs = TEAMS.filter(function(x){ return x.crew === nm2; }).length;
  if (subs){ toast(t('فيه') + ' ' + nm(subs) + ' ' + t('فرقًا فرعيةً — احذفها أولًا')); return; }
  L.splice(i, 1);
  crewSave();
  if (CREW_CUR === id2) CREW_CUR = L[0] ? L[0].id : '';
  logEvent('حذف فريق — ' + nm2);
  toast(t('حُذف الفريق'));
  render(1);
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

function depTechAdd(crewId){
  if (!may('users')){ toast(t('إدارةُ الموظفين للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('depN');
  if (!n){ toast(t('اكتب اسم الموظف')); return; }
  /* لا يُخلَق شخصٌ من هنا: الأسماءُ من الحسابات وحدَها — وهذه الشاشةُ
     تنسبه لفريقه فقط. من لا حسابَ له يُنشأ أولًا في «الحسابات». */
  var uid = techUid(n);
  if (!uid){
    toast(t('لا حسابَ بهذا الاسم — أنشئه أولًا من «المستخدمون والأدوار ← الحسابات» ثم انسبه هنا'));
    return;
  }
  var u = Object.assign({}, STATE.users[uid], { crew:crew.n });
  if (g('depPh'))  u.ph  = g('depPh');
  if (g('depSup')) u.sup = g('depSup');
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  logEvent('نُسب لفريق — ' + n + ' \u00b7 ' + crew.n);
  toast(t('نُسب للفريق'));
  render(1);
}

function depTeamNew(crewId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var id = 'CT' + Date.now().toString(36);
  var tm = { id:id, n:'فريق ' + nm(crewTeams(crew).length + 1), crew:crew.n, kind:crew.kind, members:[] };
  TEAMS.push(tm);
  CTEAM_CUR = id;
  CORE.dirty('teams', id, tm);
  render(1);
}
function depTeamAdd(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm){ toast(t('أنشئ فريقًا فرعيًّا أولًا')); return; }
  var n = (document.getElementById('depMemName') || {}).value;
  var r = (document.getElementById('depMemRole') || {}).value || 'tech';
  var sh = cfgN((document.getElementById('depMemShare') || {}).value);
  if (!n){ toast(t('لا موظفَ متاح')); return; }
  if (tm.members.some(function(m){ return m.name === n; })){ toast(t('هو في الفريق بالفعل')); return; }
  tm.members.push({ name:n, role:r, share:sh });
  CORE.dirty('teams', tm.id, tm);
  logEvent('إضافة ' + n + ' إلى ' + tm.n);
  toast(n + ' \u00b7 ' + t('أُضيف'));
  render(1);
}
function depTeamRm(i){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var m = tm.members[i];
  if (!m) return;
  tm.members.splice(i, 1);
  CORE.dirty('teams', tm.id, tm);
  logEvent('إخراج ' + m.name + ' من ' + tm.n);
  toast(m.name + ' \u00b7 ' + t('أُخرج'));
  render(1);
}
function depTeamEven(){
  var tm = teamOf(CTEAM_CUR), n = tm && tm.members.length;
  if (!tm || !n){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var base = Math.floor(100 / n), rest = 100 - base * n;
  tm.members.forEach(function(m, i){ m.share = base + (i < rest ? 1 : 0); });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالتساوي'));
  render(1);
}
function depTeamByRole(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var raw = tm.members.map(function(m){ return (TEAM_ROLE[m.role] || TEAM_ROLE.tech).def; });
  var sum = raw.reduce(function(a,b){ return a + b; }, 0);
  if (!sum){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var acc = 0;
  tm.members.forEach(function(m, i){
    var v = (i === tm.members.length - 1) ? (100 - acc) : Math.round(raw[i] / sum * 100);
    m.share = v; acc += v;
  });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالأدوار'));
  render(1);
}
function depTeamDel(teamId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var i = -1;
  TEAMS.forEach(function(x, k){ if (x.id === teamId) i = k; });
  if (i < 0) return;
  if (TEAMS[i].members.length){ toast(t('فيه أعضاء — أخرجهم أولًا')); return; }
  TEAMS.splice(i, 1);
  CORE.dirty('teams', teamId, null);
  if (CTEAM_CUR === teamId) CTEAM_CUR = '';
  toast(t('حُذف الفريق الفرعي'));
  render(1);
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
function roleOfJob(id){ var j = jobOf(id); return j ? j.role : ''; }
function jobUsed(id){
  var n = 0;
  techsList().forEach(function(x){ if (x.job === id) n++; });
  Object.keys(STATE.users || {}).forEach(function(k){ if ((STATE.users[k] || {}).job === id) n++; });
  return n;
}

function jobAdd(){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('jbN');
  if (!n){ toast(t('اكتب اسم الوظيفة')); return; }
  if (jobsList().some(function(j){ return j.n === n; })){ toast(t('موجودةٌ بالفعل')); return; }
  jobsList().push({ id:'j' + Date.now().toString(36), n:n, role:g('jbR') || 'tech', d:g('jbD') });
  jobSave();
  logEvent('وظيفة جديدة — ' + n);
  toast(t('أُضيفت الوظيفة'));
  render(1);
}
function jobSet(id, patch){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var j = jobOf(id); if (!j) return;
  Object.keys(patch).forEach(function(k){ j[k] = patch[k]; });
  jobSave();
}
function jobDel(id){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var u = jobUsed(id);
  if (u){ toast(t('عليها') + ' ' + nm(u) + ' ' + t('شخصًا — انقلهم أولًا')); return; }
  var L = jobsList(), i = -1, nm2 = '';
  L.forEach(function(j, k){ if (j.id === id){ i = k; nm2 = j.n; } });
  if (i < 0) return;
  L.splice(i, 1);
  jobSave();
  logEvent('حذف وظيفة — ' + nm2);
  toast(t('حُذفت'));
  render(1);
}

/* إسنادُ وظيفةٍ لشخص: تُسجَّل النقلةُ ولا تُمحى السابقة */
function jobAssign(who, jobId){
  var uid = techUid(who);
  if (!uid) return;
  var u = STATE.users[uid];
  var was = u.job ? (jobOf(u.job) || {}).n : '';
  if (u.job === jobId) return;
  u = Object.assign({}, u, { job:jobId,
    jobLog:(u.jobLog || []).concat([{ job:jobId, at:Date.now(), by:STATE.meta.name || '' }]) });
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  var now = (jobOf(jobId) || {}).n || '—';
  logEvent('وظيفة — ' + who + ': ' + (was || 'بلا وظيفة') + ' → ' + now);
  notifPush('وظيفة', who + ': ' + (was || 'بلا وظيفة') + ' → ' + now, { to:who, lv:'عادي' });
}

/* سجلُّ الدروس: كان قائمةَ عرضٍ ثابتةً تُقرأ ولا يُكتَب فيها — والدرسُ الذي
   لا يُكتَب يومَ وقع لا يُكتَب أبدًا، فيُكرَّر في الموسم القادم. */
/* (V27.1) كان سجلُّ الدروس السريع شريحةً في التنظيم والدروسُ الموثّقة شريحةً في التقارير التنفيذية — صفحةٌ واحدة */
var LESS_SHOW = false;   /* (V27.1) السجلُّ القديمُ يُطوى حتى يُطلَب — صفحةُ الدروس لا تثقل بمحتواه */
function lessLegacyBody(){ if (!LESS_SHOW) return '<p class="hint" style="margin:8px 0">' + esc(t('سجل الدروس السريع')) + ' — ' + nm(lessList().length) + ' ' + btn(t('اعرض'), 'btn-quiet btn-sm', ' data-lsshow="1"') + '</p>';
  return '<details class="mfu-add" open><summary>' + esc(t('سجل الدروس السريع')) + '</summary>' + (function(){
    var L = lessList();
    return cardFlush(t('الدروس') + ' — ' + nm(L.length),
        L.length
          ? table(['المرحلة','ما وقع','ما فُعل',''],
              L.map(function(l, i){
                return [pill(l.p,'acc'),
                        /* (V27.1) كانت الصفوفُ حقولًا تُحرَّر في مكانها — نصٌّ الآن (الصفحةُ المدمجة تثقل بعشرين حقلًا)، والتحريرُ بحذفٍ وإعادةِ تسجيل */
                        esc(l.w), esc(l.a || ''),
                        may('settings')
                          ? btn('حذف','btn-quiet btn-sm',' data-lsdel="' + i + '"') : ''];
              }))
          : '<p class="hint" style="padding:16px">' + esc(t('لا دروسَ مسجَّلةٌ بعد.')) + '</p>',
        btn('⬇ إكسل — الدروس','btn-secondary btn-sm',' data-xls="less"'))
      + (may('settings')
        ? card('سجّل درسًا',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('المرحلة')) + '</label><select id="lqP">'
            +   ['التخطيط','المسح','التهيئة','التجميع','التركيب','الفك','الإغلاق']
                 .map(function(p){ return '<option value="' + esc(p) + '">' + esc(t(p)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('ما وقع')) + ' <span class="req">*</span></label>'
            +   '<input id="lqW" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('ما فُعل')) + '</label>'
            +   '<input id="lqA" dir="auto"></div>'
            + '</div>',
            btn('➕ سجّل الدرس','btn-primary btn-sm',' data-lsadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('يُراجَع عند إغلاق المشروع ويُسلَّم مع وثائقه — فما كلّف مرةً لا يُكلِّف ثانية.')) + '</p>';
  })() + '</details>'; }
function lessList(){
  if (!Array.isArray(STATE.lessons) || !STATE.lessons.length) STATE.lessons = LESSONS.slice();
  return STATE.lessons;
}
function lessSave(){ CORE.set('cfg', 'lessons', lessList().slice()); }
function lessAdd(){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var w2 = g('lqW');
  if (!w2){ toast(t('اكتب ما وقع')); return; }
  lessList().push({ p:g('lqP') || 'المسح', w:w2, a:g('lqA') });
  lessSave(); logEvent('درس مستفاد — ' + w2.slice(0, 50));
  toast(t('سُجّل الدرس')); render(1);
}
function lessSet(i, patch){
  if (!may('settings')) return;
  var l = lessList()[i]; if (!l) return;
  Object.keys(patch).forEach(function(k){ l[k] = patch[k]; });
  lessSave();
}
function lessDel(i){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var L = lessList(); if (!L[i]) return;
  var w2 = L[i].w; L.splice(i, 1); lessSave();
  logEvent('حذف درس — ' + String(w2).slice(0, 40));
  toast(t('حُذف')); render(1);
}

