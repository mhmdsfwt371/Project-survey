/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-06-teams-accounts-perms.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Teams and shares, crews and rates, the permissions module (UI + Firebase rules mirror) and role/team assignment to users.
   DEFINES : teamOf, teamShare, teamPoints, crewStat, crewOf, crewSet, crewNewCard, crewNeed, roleName, assignRows
   GLOBALS : TEAM_ROLE, TEAMS, CTEAM_CUR, WO_KINDS, CREWS, CREW_CUR, PERIODS, CREW_REPORTS, CREW_VIEW, TECHS … (+4 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الفرق ونسبُ الأنصبة ═══
   المجموعةُ تنجز معًا، والنقاطُ تُقسَّم بنسبٍ تُكتب لكلِّ عضو:
   قائدُ الفريق أكبرُ نصيبًا من الفني، والفنيُّ من المساعد. */

var TEAM_ROLE = {
  lead:   { n:'قائد الفريق', i:'\u2605', def:35 },
  tech:   { n:'فني',         i:'\u25CF', def:25 },
  helper: { n:'مساعد',       i:'\u25CB', def:15 }
};

/* فرقُ الأنصبة تُنشأ من الشاشة — ولا بذرةَ فيها: كانت أسماءً مخترعةً
   «خالد» و«أحمد» و«سالم» و«ماجد» في «فريق مخيمات ١»، وهي عرضٌ يبقى بعد
   التسليم فيُقرأ حقيقة. */
var TEAMS = [];

var CTEAM_CUR = 'T1';

function teamOf(id){
  /* (V38.69) the first team is the default view only — an id that is not found is not quietly another team */
  var hit = TEAMS.filter(function(x){ return x.id === id; })[0]; if (hit) return hit; return id ? null : (TEAMS[0] || null);
}
function teamShare(tm){ return tm.members.reduce(function(a,m){ return a + cfgN(m.share); }, 0); }

/* نقاطُ الفريق: مجموعُ ما أنجزه أعضاؤه — ثم تُقسَّم بالنسب */
function teamPoints(tm){
  var n = 0;
  tm.members.forEach(function(m){ n += scoreOf(m.name).total; });
  return Math.round(n * 100) / 100;
}


/* ═══ فرق العمل — أربعةٌ لكلٍّ نوعُ مهمته وتقاريره ═══
   WO_KINDS في العامل أربعة: زيارة · تهيئة · تجميع · تركيب.
   الفريق دورٌ مخصَّصٌ يرث «مشرف» ويُقيَّد بنوعٍ واحد — فلا يرى إلا شغله. */

/* أنواعُ الفرق: كانت أربعةً ميدانيةً فقط — والمشروعُ فيه مستودعٌ ومشترياتٌ
   وفكٌّ ونقل، ولا فريقَ لهم فلا يُتابَعون ولا تُسنَد إليهم سيارة. */
var WO_KINDS = {
  visit:   { n:'زيارة',   i:'\u{1F50D}', c:'#E8C34B', tgt:'survey' },
  prep:    { n:'تهيئة',   i:'\u{1F6E0}', c:'#8FD3E8', tgt:'prep' },
  asm:     { n:'تجميع',   i:'\u{1F9F0}', c:'#C77DFF', tgt:'asm' },
  install: { n:'تركيب',   i:'\u{1F527}', c:'#3AD6A0', tgt:'ins' },
  dis:     { n:'فك',      i:'\u{1F9E9}', c:'#F2994A', tgt:'dis' },
  /* الصيانةُ حلقةٌ كانت ناقصةً بين التركيب والفكّ: ما رُكِّب يُخدَم في أثناء
     الموسم — يُسنَد كما يُسنَد التركيب، وله ترقيمُه (MR) ولونُه في الدورة. */
  maint:   { n:'صيانة',   i:'\u{1F6E1}', c:'#F5D547', tgt:'ins' },
  store:   { n:'مستودع',  i:'\u{1F4E6}', c:'#7DA9E8', tgt:'' },
  buy:     { n:'مشتريات', i:'\u{1F4B3}', c:'#E88FBF', tgt:'' },
  drive:   { n:'نقل',     i:'\u{1F69A}', c:'#9AA7B2', tgt:'' }
};
/* (V39.12) a task written with kind «survey» (an older name of the visit) read its kind raw in the tables — «survey» on an
   Arabic screen. It is the visit; the alias is hidden from Object.keys so no picker grows a second «زيارة». */
Object.defineProperty(WO_KINDS, 'survey', { value:WO_KINDS.visit, enumerable:false });

var CREWS = [
  { id:'eng',   n:'المهندسون',     base:'engineer',   kind:'*',
    d:'يديرون المشروع ويعتمدون ما يرفعه الفرق.',
    members:[] },
  { id:'cprep', n:'فريق التهيئة',  base:'supervisor', kind:'prep',
    d:'ضبط الجهاز وعنوانه ونظامه وفحصه قبل النزول.',
    members:[] },
  { id:'casm',  n:'فريق التجميع',  base:'supervisor', kind:'asm',
    d:'تركيب ما يدخل البوكس وتوصيله قبل النزول.',
    members:[] },
  { id:'cins',  n:'فريق التركيب',  base:'supervisor', kind:'install',
    d:'تركيب النقطة في موقعها وتوثيقها.',
    members:[] }
];

/* أرقام تمثيلية لكل فريق عبر الدورات الثلاث */
/* إحصاءُ أيِّ فريقٍ يُشتَقُّ من نوع مهمّته ومن أرصدة أعضائه: كان جدولًا
   بأربعة مفاتيحَ ثابتة، فأيُّ فريقٍ يُنشَأ لا يجد مفتاحَه فتسقط شاشةُ
   المتابعة كلُّها — ومن أنشأ فريقًا وجد شاشةً بيضاء. */
function crewStat(c){
  var K2 = T(), tgt = 0;
  if (c && c.kind === 'prep') tgt = K2.prep;
  else if (c && c.kind === 'asm') tgt = K2.asm;
  else if (c && c.kind === 'ins') tgt = K2.ins;
  else if (c && c.kind === 'dis') tgt = K2.dis || 0;
  var name = c ? c.n : '';
  var mine = scores().list.filter(function(e){
    return techsList().some(function(x){ return x.n === e.name && x.crew === name; });
  });
  var sum = function(f){ return mine.reduce(function(a, e){ return a + (e[f] || 0); }, 0); };
  return { day:0, week:0, month:Math.round(sum('total')), tgtM:tgt,
           open:0, done:sum('survey') + sum('install') + sum('dis') };
}

function crewOf(id){
  var L = crewsList();
  var hit = L.filter(function(c){ return c.id === id; })[0]; if (hit) return hit; return id ? null : L[0];   /* (V38.69) as teamOf */
}

/* ── متابعة الفرق — لوحة المهندس ─────────────────── */
function crewSet(name, patch){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var c = crewsList().filter(function(x){ return x.n === name; })[0];
  if (!c) return;
  var oldName = c.n;
  Object.keys(patch).forEach(function(k){ c[k] = patch[k]; });
  /* تغييرُ الاسم ينقل من كان فيه: الفنيُّ يحمل اسمَ فريقه لا معرّفَه،
     فلو بقي الاسمُ القديمُ في سجله صار في فريقٍ لا وجودَ له. */
  if (patch.n && patch.n !== oldName){
    techsList().forEach(function(x){ if (x.crew === oldName) techSet(x.n, { crew:patch.n }); });
    TEAMS.forEach(function(tm){
      if (tm.crew === oldName){ tm.crew = patch.n; CORE.dirty('teams', tm.id, tm); }
    });
  }
  CORE.set('cfg', 'crews', crewsList());
  statBump();
}

var CREW_CUR = '';


function crewNewCard(){
  return card('إضافة فريق',
      '<div class="grid cols-3">'
      + '<div class="field"><label>' + esc(t('اسم الفريق')) + ' <span class="req">*</span></label>'
      +   '<input id="crN" dir="auto" placeholder="' + esc(t('فريق المستودع')) + '"></div>'
      + '<div class="field"><label>' + esc(t('نوع العمل')) + '</label>'
      +   '<select id="crKind">'
      +   Object.keys(WO_KINDS).map(function(k){
            return '<option value="' + esc(k) + '">' + esc(t(WO_KINDS[k].n)) + '</option>';
          }).join('') + '</select></div>'
      + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
      +   '<input id="crD" dir="auto"></div>'
      + '</div>',
      btn('➕ إضافة فريق','btn-primary btn-sm',' data-craddgo="1"'));
}


/* ── التقارير الدورية ───────────────────────────── */
var PERIODS = [
  ['day',   'يومي',    'نهاية كل يوم عمل',      '١٧:٠٠'],
  ['week',  'أسبوعي',  'صباح أول يوم في الأسبوع','٠٧:٠٠'],
  ['month', 'شهري',    'أول يوم في الشهر',       '٠٧:٠٠']
];

var CREW_REPORTS = [
  ['نقاط اليوم لكل منفِّذ',      'day',   'كل الفرق', 'ما أنجزه كلُّ فردٍ اليوم بنوع مهمته'],
  ['المفتوح والمتأخر',           'day',   'كل الفرق', 'المهام التي لم تُقفل ومَن عندها'],
  ['الفريق مقابل تارجته',        'week',  'كل الفرق', 'الأسبوعي مقابل ما أُنجز فعلًا'],
  ['الورشة — تهيئةً وتجميعًا',   'week',  'التهيئة والتجميع', 'ما خرج من الورشة جاهزًا للنزول'],
  ['التركيب في الميدان',         'week',  'التركيب',  'ما رُكّب وما تعذّر وما ينتظر التدقيق'],
  ['المسح الميداني',             'week',  'الزيارة',  'ما مُسح وما بقي وتحدياته'],
  ['أداء الفرق الشهري',          'month', 'كل الفرق', 'الشهر كاملًا مقابل التارجت مع الاتجاه'],
  ['العُهدة والمستهلك',          'month', 'كل الفرق', 'ما في يد كل فريق وما استهلكه'],
  ['الملخص التنفيذي',            'month', 'المهندسون','المشروع كله في صفحة'],
];


/* ── شغل الفريق — ما يراه عضوه ──────────────────── */
;

var CREW_VIEW = 'cprep';

/* ═══ حسابات الفنيين — إنشاءٌ جماعيٌّ وفرديّ ═══
   الفني يعمل تحت مشرفه: يرى المُسند إليه وينفّذه ولا يعتمد شيئًا.
   ويُولَّد له اسم مستخدمٍ من اسمه وكلمةُ مرورٍ يبدّلها أول دخول. */

/* طاقمُ موسم ١٤٤٧ كما استُخرج من أوراق التنفيذ اليومية في النظام القديم —
   اثنان وأربعون فنيًّا. وكانت هنا ستةُ أسماءٍ مخترعةٍ للعرض بأرقامٍ وهمية،
   فمن وزّع العملَ عليها وزّعه على من لا وجودَ له. الهاتفُ والفريقُ والمشرفُ
   تُملأ من شاشة الفنيين — ولا تُخترَع هنا. */
/* بذرةُ الفنيين حُذفت في V15.35 — المصدرُ الواحدُ للأشخاص هو الحسابات:
   من يُضاف في «المستخدمون والأدوار ← الحسابات» بوظيفته يظهر في دورة وظيفته
   تلقائيًّا. لا مكانَ ثانيًا تُضاف فيه أسماء. */
var TECHS = [];


/* ═══ الطواقم والمعدلات — من الواقع الميداني ═══
   التركيب: المخيم أربعةٌ (مشرف + ثلاثة) بمعدل مخيمين يوميًّا،
            والممر خمسةٌ (مشرف + أربعة) ومعدّتان بمعدل نقطةٍ واحدةٍ يوميًّا.
   الزيارة: عشرون مخيمًا أو عشر نقاط ممرٍّ يوميًّا.
   وتارجت التركيب يُحسب على قطع النقطة لا على عددها. */

var CREW_SPEC = [
  { k:'ins_camp', n:'فريق تركيب — مخيمات', kind:'install', zone:'camp',
    sup:1, tech:3, gear:0, rate:2,
    d:'مشرفٌ وثلاثة فنيين — مخيمان في اليوم.' },
  { k:'ins_cor',  n:'فريق تركيب — ممرات',  kind:'install', zone:'cor',
    sup:1, tech:4, gear:2, rate:1,
    d:'مشرفٌ وأربعة فنيين ومعدّتان — نقطةُ ممرٍّ واحدةٌ في اليوم.' },
  { k:'srv_camp', n:'فريق مسح — مخيمات',   kind:'visit',   zone:'camp',
    sup:1, tech:1, gear:0, rate:20,
    d:'عشرون مخيمًا في اليوم.' },
  { k:'srv_cor',  n:'فريق مسح — ممرات',    kind:'visit',   zone:'cor',
    sup:1, tech:1, gear:0, rate:10,
    d:'عشر نقاط ممرٍّ في اليوم.' }
];

PV.UNITS = { camp:1392, cor:190 };

function crewNeed(spec, months){
  var days = cfgGet('days') * months;
  var units = PV.UNITS[spec.zone] || 0;
  var rate = crewVal(spec.k,'Rate') || spec.rate;
  var crewDays = rate ? (units / rate) : 0;
  var crews = days ? Math.ceil(crewDays / days) : 0;
  var sup = crewVal(spec.k,'Sup'), tec = crewVal(spec.k,'Tech'), ger = crewVal(spec.k,'Gear');
  if (!sup && !tec) { sup = spec.sup; tec = spec.tech; ger = spec.gear; }
  return { units:units, crewDays:Math.round(crewDays), crews:crews,
           people:crews * (sup + tec), gear:crews * ger, sup:sup, tech:tec, rate:rate };
}

var PLAN_MONTHS = 4;


/* ═══ موديول الصلاحيات — واجهةً وقواعدَ Firebase ═══ */

var PERMS = [
  ['read_all',     'قراءة كل النقاط',        ['engineer','viewer']],
  ['read_own',     'قراءة المُسند إليه',      ['engineer','supervisor','tech','cprep','casm','cins']],
  ['write_survey', 'تسجيل المسح',            ['engineer','supervisor','tech','cins']],
  ['write_prep',   'تنفيذ التهيئة',          ['engineer','cprep']],
  ['write_asm',    'تنفيذ التجميع',          ['engineer','casm']],
  ['write_install','تنفيذ التركيب',          ['engineer','tech','cins']],
  ['approve',      'اعتماد ما رُفع',          ['engineer']],
  ['assign',       'إسناد المهام',            ['engineer','supervisor']],
  ['inventory',    'المخزون والعُهدة',        ['engineer']],
  ['money',        'المال والمشتريات',        ['engineer']],
  ['settings',     'الإعدادات والتارجت',      ['engineer']],
  ['users',        'إدارة الحسابات والأدوار', ['engineer']],
  ['phones',       'أرقام هواتف فريقه',       ['engineer','supervisor','tech','cprep','casm','cins']],
  ['export_all',   'التصدير الكامل',          ['engineer']],
  ['export_rep',   'تصدير التقارير',          ['engineer','viewer']]
];

var /* بترتيب السلطة: من يملك كلَّ شيءٍ إلى من ينقل ولا يكتب */
ROLE_ORDER = ['admin','engineer','buyer','store','acct','cprep','casm',
              'supervisor','cins','tech','helper','driver','viewer'];

function roleName(k){
  return { engineer:'مهندس', supervisor:'مشرف', tech:'فني', cprep:'تهيئة',
           casm:'تجميع', cins:'تركيب', viewer:'وزارة' }[k] || k;
}

/* ═══ إسناد الدور والفريق للمستخدم ═══ */

/* إسنادُ الأدوار يُشتقُّ من سجل الفنيين الحقيقيّ لا من بذرةٍ: كانت خمسةَ
   أسماءٍ مخترعةٍ «خالد» و«أحمد» و«سالم» و«ماجد» و«ياسر» في «فريق مخيمات ١»
   — تُعرَض فيُظنُّ أن هؤلاء في المشروع. */
function assignRows(){
  var out = [['محمد صفوت', 'm.safwat', 'admin', '—', '—']];
  /* شاشةُ الأدوار تعرض الحساباتِ كلَّها — لا الميدانيّين وحدهم */
  techsList(1).forEach(function(x){
    var job = jobsList().filter(function(j){ return j.id === x.job; })[0];
    out.push([x.n, x.u || '—', (job ? job.role : 'tech'),
              x.sup || '—', x.crew || '—', x.dept ? deptName(x.dept) : '—']);
  });
  return out;
}


PAGE.users = { m:'الإعدادات', t:'المستخدمون والأدوار',
  l:'الحساباتُ ووظائفُها وأدوارُها — من هو وما يعمل وما يستطيع.',
  body:function(){
    var head = tabHead('users'), cur = tabCur('users');
    if (cur === 'users') return head + pwFlowHtml() + (may('users') ? phonesCard() : '') + bulkCard() + provCard() + (may('users') ? pendCard() : '') + (function(){
    /* الشريحةُ تعدُّ ما أراه لا ما في القاعدة: كانت تقول «وزارة ٥» ثم تقول
       القائمةُ «لا مستخدمَ يطابق» — رقمٌ يَعِدُ بصفوفٍ لا تُعرَض (V17.6). */
    var byRole = {}, total = 0;
    Object.keys(STATE.users || {}).forEach(function(uid){
      var u = STATE.users[uid] || {};
      if (!canSeeUser(u)) return;
      total++;
      var r = u.role || '';
      if (r) byRole[r] = (byRole[r] || 0) + 1;
    });

    return '<p class="lede" style="margin:0 0 16px">'
      + esc(t('أنشئ الحساب وحدّد دوره، وصفّه بالنوع من الشرائح، وابحث بالاسم في القائمة أسفله — والتغييرُ يُزامَن فورًا.'))
      + '</p>'

      + stats([['كل الحسابات', N(total), 'acc']]
              .concat(Object.keys(ROLES).filter(function(k){ return byRole[k]; }).map(function(k){
                return [t(ROLES[k].n), N(byRole[k])];
              })))

      + '<div class="chips">'
      + '<button type="button" class="chip' + (!USR.role ? ' on' : '') + '" data-usrrolef="">'
      +   esc(t('الكل')) + ' <span class="num">' + nm(total) + '</span></button>'
      + Object.keys(ROLES).filter(function(k){ return byRole[k]; }).map(function(k){
          return '<button type="button" class="chip' + (USR.role===k?' on':'') + '" data-usrrolef="' + esc(k) + '">'
            + esc(t(ROLES[k].n)) + ' <span class="num">' + nm(byRole[k]) + '</span></button>';
        }).join('')
      + '</div>'

      /* بطاقةُ الإنشاء لمن يُنشئ — والوزارةُ تقرأ الجدولَ ولا تُضيف */
      + ((CFG.gh && CFG.gh.bad && may('roles')) ? alertBox('warn', t('مفتاحُ تشغيل الحسابات مرفوضٌ من GitHub (منتهٍ أو بلا صلاحية). الطلباتُ تُحفَظ وتُنفَّذ مع دورة الخادم، لكنها قد تتأخر ساعات. جدِّد المفتاح من ثوابت النظام ← مفتاح التشغيل: مفتاحٌ دقيقُ الصلاحيات على هذا المستودع بصلاحية تشغيل السيور.')) : '')   /* (V30.7) */
      + (canProvision() ? card('إنشاء حساب',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('اسم المستخدم')) + ' <span class="req">*</span></label>'
          +   '<input id="uU" dir="ltr" placeholder="m.safwat" maxlength="80"></div>'
          + '<div class="field"><label>' + esc(t('الاسم الكامل')) + ' <span class="req">*</span></label>'
          +   '<input id="uN" dir="auto" maxlength="160"></div>'
          + '<div class="field"><label>' + esc(t('الوظيفة')) + '</label>'
          +   '<select id="uJ"><option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
          +   jobsList().map(function(j){ return '<option value="' + esc(j.id) + '">' + esc(t(j.n)) + '</option>'; }).join('')
          +   '</select></div>'
          + '<div class="field"><label>' + esc(t('القسم')) + '</label>'
          +   '<select id="uD">' + deptOptions('') + '</select></div>'
          + '<div class="field"><label>' + esc(t('مديره')) + '</label>'
          +   '<select id="uS">' + mgrOptions('tech', '', '') + '</select>'
          +   '<p class="hint" style="margin:6px 0 0">'
          +     esc(t('يُعرَض من مرتبتُه أعلى أو مساوية: الفنيُّ مديرُه مشرفُه، والمشرفُ مديرُه المهندس، والمهندسُ مديرُه مهندسٌ أو مديرُ المشروع — والوزارةُ مديرُها من المهندس فصاعدًا.')) + '</p></div>'
          + '<div class="field"><label>' + esc(t('كلمة المرور')) + ' <span class="req">*</span></label>'
          +   '<input id="uP" type="password" dir="ltr" minlength="10"></div>'
          + '<div class="field"><label>' + esc(t('البريد')) + '</label>'
          +   '<input id="uE" dir="ltr" type="email" placeholder="name@afaqy.com"></div>'
          + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
          +   '<select id="uR">'
          +   rolesICanMake().map(function(k){
                return '<option value="' + esc(k) + '"' + (k === 'tech' ? ' selected' : '') + '>'
                  + esc(t(ROLES[k].n)) + '</option>';
              }).join('') + '</select></div>'
          + '</div>'
          + '<p class="hint" style="margin:11px 0 0">'
          + esc(t('اسمُ المستخدم بلا مسافات — ويُكمَّل بنطاق المشروع تلقائيًّا. وكلمةُ المرور عشرةُ أحرفٍ فأكثر، ويبدّلها صاحبُها أولَ دخول.'))
          + '</p>',
          btn('إنشاء الحساب','btn-primary btn-sm',' data-usradd="1"')) : '')

      + usersCard();
  })();
    if (cur === 'roles') return head + (function(){
    /* السؤالُ يتكرّر: ما الفرقُ بين الوظيفة والدور؟ فصار مكتوبًا في أول
       الشاشة لا في ذاكرة من شرحه مرة. */
    var _INTRO = card('الوظيفة والدور — فرقٌ لا يُخلَط',
        table(['','الوظيفة','الدور'], [
          ['ما هي','ما يعمله الشخصُ في الميدان','ما يستطيعه في النظام'],
          ['مثال','مسؤول مستودع · مشرف ميدان','كلاهما دورُه «مشرف»'],
          ['أين تُضبَط','الإعدادات ← الوظائف','هذه الشاشة'],
          ['من أين تأتي','تُكتَب في سجل الموظف','يُشتقُّ من وظيفته'],
          ['ماذا تُغيّر','من يستلم العهدةَ ومن ينزل المشاعر','ما يراه من شاشاتٍ وما يكتبه']
        ])
        + '<p class="hint">' + esc(t('الوظيفةُ تتغيّر في أثناء الموسم فيتغيّر الدورُ معها — والنقلةُ تُسجَّل ولا تُمحى. ودليلُ كلِّ دورٍ في «المساعدة ← دليل الاستخدام» يقول ما يراه صاحبُه بالضبط.')) + '</p>');
    /* كان جدولًا محفورًا بأربعة أدوارٍ و«✓» مكتوبةٍ بيد — والأدوارُ سبعةٌ
       والقدراتُ تُقرأ من `ROLES`. فمن قرأ الجدولَ ظنَّ أن المشرفَ لا يرى
       الهواتفَ وهو يراها، وأن الفنيَّ لا يركّب وهو يركّب.
       صار يُبنى من مصدر الحقيقة نفسِه، ويُبدَّل فيه فيُكتَب. */
    var CAPS = [['edit','تحرير البيانات'], ['approve','الاعتمادات'], ['settings','الإعدادات'],
                ['money','المال والمشتريات'], ['inventory','المخزون والعُهدة'], ['workshop','الورشة'],
                ['exportAll','التصدير الكامل'], ['importAll','الاستيراد'],
                ['users','إدارة المستخدمين'], ['phones','أرقام الهواتف'], ['delete','الحذف والتصفير']];
    var RS = Object.keys(ROLES);
    return _INTRO + cardFlush(t('القدرات') + ' — ' + nm(RS.length) + ' ' + t('أدوار'),
        table([''].concat(RS.map(function(k){ return t(ROLES[k].n); })),
          CAPS.map(function(c){
            return ['<strong>' + esc(t(c[1])) + '</strong>' + (PM_CAP[c[0]] ? ' <span class="hint" style="margin:0" title="' + esc(t('تنفذ في قاعدة البيانات فورًا')) + '">\u{1F510}</span>' : '')].concat(
              RS.map(function(k){
                var on = !!((ROLES[k].can || {})[c[0]]);
                return may('users')
                  ? '<button type="button" class="pill ' + (on ? 'ok' : 'off')
                    + '" style="border:0;cursor:pointer" data-capt="' + esc(k + '|' + c[0]) + '">'
                    + (on ? '✓' : '—') + '</button>'
                  : pill(on ? '✓' : '—', on ? 'ok' : 'off');
              }));
          })),
        (may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="roles"') : '')
        + '<p class="hint" style="margin:9px 0 0">'
        + esc(t(may('users')
            ? 'اضغط الخانةَ لتبديلها — والتبديلُ يُكتَب فورًا ويدخل سجلَّ الأحداث.'
            : 'العرضُ فقط — التبديلُ للمهندس.'))
        + '</p>')

      + card(t('الأدوار') + ' — ' + nm(RS.length),
          table(['الدور','من هو','الأساس','الرتبة','حسابات',''],
            RS.map(function(k){
              var cu = ROLES[k].custom, nU = roleUsers(k);
              return [pill(t(ROLES[k].n), cu ? 'wrn' : 'acc'), esc(t(ROLES[k].d || '—')),
                      cu ? esc(t((ROLES[ROLES[k].base] || {}).n || ROLES[k].base)) : '<span class="hint" style="margin:0">' + esc(t('أساسي')) + '</span>',
                      '<span class="num">' + nm(rankOf(k)) + '</span>', N(nU),
                      cu && may('roles')
                        ? (nU ? '<span class="hint" style="margin:0">' + esc(t('عليه حسابات')) + '</span>'
                              : btn('\u{1F5D1} ' + t('حذف'),'btn-danger btn-sm',' data-roledel="' + esc(k) + '"'))
                        : ''];
            })))
      + (may('roles')
        ? card('\u2795 ' + t('دور جديد'),
            '<div class="grid cols-3">'
            + '<div class="field" style="margin:0"><label>' + esc(t('اسم الدور')) + '</label><input id="nrName" dir="auto" placeholder="' + esc(t('مندوب شركة الخدمة')) + '"></div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('يرث')) + '</label><select id="nrBase">'
            +   BASE_ROLES.map(function(k){ return '<option value="' + esc(k) + '"' + (k === 'tech' ? ' selected' : '') + '>' + esc(t(ROLES[k].n)) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('الرتبة')) + '</label><input id="nrRank" type="number" inputmode="numeric" placeholder="' + esc(t('فارغةٌ = رتبةُ الأساس')) + '"></div>'
            + '</div>'
            + '<p class="hint">' + esc(t('يرث شاشاتِ أساسه وقدراتِه — ثم تُعدَّل قدراتُه أعلاه وخانتُه في «صلاحيات القاعدة» بمفتاحه. الرتبةُ تحكم من يرى من ومن يُنشئ من. وتنفذ في القاعدة فورًا.')) + '</p>',
            btn('\u2795 ' + t('أضف الدور'),'btn-primary btn-sm',' data-roleadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('الأدوارُ الأساسيةُ لا تُحذَف: أسماؤها مكتوبةٌ في قواعد القاعدة. والمخصَّصُ يُحذَف إن لم يبقَ عليه حساب.')) + '</p>';
  })();
    if (cur === 'perms') return head + (function(){
    if (may('perms')) pmRefresh(false);
    return pmCard();
  })();
    if (cur === 'jobs') return head + (function(){
    var L = jobsList();
    var roleOpts = function(cur){
      return Object.keys(ROLES).map(function(k){
        return '<option value="' + esc(k) + '"' + (cur === k ? ' selected' : '') + '>'
          + esc(t(ROLES[k].n)) + '</option>';
      }).join('');
    };
    return card('\u2753 ' + t('الفرق بين الوظيفة والدور والقسم'),
        table(['المفهوم','ما هو','من يضبطه','مثال'], [
          ['<strong>' + esc(t('الوظيفة')) + '</strong>',
           esc(t('ما يعمله الشخصُ في الواقع — مسمّاه الميداني')),
           esc(t('تُعرَّف هنا، وتُسنَد لكل حسابٍ من «الحسابات»')),
           esc(t('«فنيُّ تركيب» · «مسؤول مستودع» · «مشرف ميدان»'))],
          ['<strong>' + esc(t('الدور')) + '</strong>',
           esc(t('ما يستطيعه في النظام — أيُّ شاشةٍ يفتح وأيُّ زرٍّ يعمل')),
           esc(t('يُشتقُّ من الوظيفة تلقائيًّا، ويُغيَّر يدويًّا عند الحاجة')),
           esc(t('«فني» يرى مهامَّه · «مهندس» يعتمد الزيارات'))],
          ['<strong>' + esc(t('القسم')) + '</strong>',
           esc(t('أين يجلس في هيكل الشركة — للتقارير والمساءلة')),
           esc(t('يُختار من أقسام الشركة في «الحسابات»')),
           esc(t('«العمليات الميدانية» · «المالية» · «الجودة»'))],
          ['<strong>' + esc(t('المدير')) + '</strong>',
           esc(t('من يُساءل عن عمله — حسابٌ مرتبتُه أعلى')),
           esc(t('يُختار من «الحسابات»، ولا يُقبَل من مرتبتُه أدنى')),
           esc(t('الفنيُّ ← مشرفُه ← المهندس ← مديرُ المشروع'))]])
        + '<p class="hint" style="margin:10px 0 0">'
        + esc(t('الوظيفتان قد تشتركان في دورٍ واحد: مسؤولُ المستودع ومشرفُ الميدان كلاهما دورُه «مشرف» — ووظيفتاهما مختلفتان، وبهما يُعرَف من يستلم العهدةَ ومن ينزل المشاعر.')) + '</p>')
      + '<p class="lede" style="margin:0 0 16px">' + esc(t('الوظيفةُ ما يعمله الشخصُ، والدورُ ما يستطيعه في النظام. ومسؤولُ المستودع ومشرفُ الميدان كلاهما دورُه «مشرف» — ووظيفتاهما مختلفتان، وبها يُعرَف من يستلم العهدةَ ومن ينزل المشاعر. والوظيفةُ تتغيّر في أثناء الموسم، والنقلةُ تُسجَّل ولا تُمحى.')) + '</p>'

      + cardFlush(t('الوظائف') + ' — ' + nm(L.length),
          table(['الوظيفة','الدور','ماذا تعمل','عليها',''],
            L.map(function(j){
              var u = jobUsed(j.id);
              return ['<input value="' + esc(j.n) + '" data-jbn="' + esc(j.id) + '" dir="auto">',
                      '<select data-jbr="' + esc(j.id) + '">' + roleOpts(j.role) + '</select>',
                      '<input value="' + esc(j.d || '') + '" data-jbd="' + esc(j.id) + '" dir="auto">',
                      u ? pill(nm(u), 'acc') : N(0),
                      u ? '<span class="hint" style="margin:0">' + esc(t('مستعملة')) + '</span>'
                        : btn('حذف','btn-quiet btn-sm',' data-jbdel="' + esc(j.id) + '"')];
            })))

      + (may('users')
        ? card('إضافة وظيفة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('اسم الوظيفة')) + ' <span class="req">*</span></label>'
            +   '<input id="jbN" dir="auto" placeholder="' + esc(t('مسؤول سلامة')) + '"></div>'
            + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
            +   '<select id="jbR">' + roleOpts('tech') + '</select></div>'
            + '<div class="field"><label>' + esc(t('ماذا تعمل')) + '</label>'
            +   '<input id="jbD" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة وظيفة','btn-primary btn-sm',' data-jbadd="1"'))
        : '')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="jbQ" data-jbq="1" value="' + esc(JB_Q) + '" placeholder="'
      +     esc(t('ابحث باسم الشخص')) + '" dir="auto">'
      + '</form>'
      + cardFlush('من على كل وظيفة',
          table(['الشخص','الوظيفة','الدور المشتقّ','القسم','مديره','آخر نقلة'],
            techsList(1).filter(function(x){ return !JB_Q || x.n.indexOf(JB_Q) > -1; })
              .map(function(x){
              var j = x.job ? jobOf(x.job) : null;
              var last = (x.jobLog || []).slice(-1)[0];
              return [esc(x.n),
                      '<select data-tkjob="' + esc(x.n) + '">'
                      + '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                      + L.map(function(y){
                          return '<option value="' + esc(y.id) + '"' + (x.job === y.id ? ' selected' : '')
                            + '>' + esc(y.n) + '</option>';
                        }).join('') + '</select>',
                      j ? pill(t((ROLES[j.role] || {}).n || j.role), 'off') : '—',
                      x.dept ? esc(deptName(x.dept)) : '—',
                      x.sup ? esc(x.sup) : '—',
                      last ? '<span class="num">' + esc(dayKey(last.at)) + '</span>' : '—'];
            })))

      + '<p class="hint">' + esc(t('الوظيفةُ التي عليها أشخاصٌ لا تُحذَف — انقلهم أولًا. وكلُّ نقلةٍ تدخل سجلَّ الأحداث وتصل صاحبَها إشعارًا.')) + '</p>';
  })();
    return head + (function(){
    var T = techsList(), C = crewsList();
    return card('إسناد',
        '<div class="grid cols-2">'
        + '<div class="field"><label>' + esc(t('المستخدم')) + '</label>'
        +   '<select id="asnU">'
        +   T.map(function(x){ return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>'; }).join('')
        +   '</select></div>'
        + '<div class="field"><label>' + esc(t('الوظيفة')) + '</label>'
        +   '<select id="asnJob">'
        +   jobsList().map(function(j){ return '<option value="' + esc(j.id) + '">' + esc(t(j.n)) + '</option>'; }).join('')
        +   '</select></div>'
        + '<div class="field"><label>' + esc(t('الفريق')) + '</label>'
        +   '<select id="asnCrew"><option value="">—</option>'
        +   C.map(function(c){ return '<option value="' + esc(c.n) + '">' + esc(c.n) + '</option>'; }).join('')
        +   '</select></div>'
        + '</div>',
        btn('إسناد','btn-primary btn-sm',' data-asnrole="1"'))

      + cardFlush(t('المسنَدون') + ' — ' + nm(T.length),
          table(['المستخدم','الوظيفة','الدور','الفريق'],
            T.map(function(x){
              var job = jobsList().filter(function(j){ return j.id === x.job; })[0];
              var role = job ? job.role : 'tech';
              return ['<strong>' + esc(x.n) + '</strong>'
                        + (x.u ? '<br><span class="hint" dir="ltr" style="margin:0">' + esc(x.u) + '</span>' : ''),
                      job ? esc(t(job.n)) : '<span class="hint" style="margin:0">—</span>',
                      pill(esc(t(roleName(role))), role === 'engineer' ? 'ok' : (role === 'viewer' ? 'info' : 'acc')),
                      x.crew ? esc(x.crew) : '<span class="hint" style="margin:0">—</span>'];
            })))

      + '<p class="hint">' + esc(t('الدورُ يُشتَقُّ من الوظيفة المسنَدة — لا يُكتَب مباشرةً. وتغييرُ الوظيفة يبدّل الصلاحياتِ فورًا؛ إسنادُ فريقٍ لا ينشئه، ينشأ من «إدارة الفرق».')) + '</p>';
  })();
  }};

/* ═══ فريق المشرف — من معه ═══ */

;

