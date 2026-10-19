/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-10-season-start-invites.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Season start values, invitations (single and bulk), creation requests, run-server-now, requests when the screen lies, and first-login password change.
   DEFINES : seedPlan, seedApply, seedCard, readyRows, readyCard, passGen, normAr, roleGuess, jobGuess, bulkParse, bulkApply, bulkCard, ghToken, ghSetToken … (+11 more)
   GLOBALS : BULK_TXT, ROLE_ALIAS, GH_REPO, GH_RAN, PROV_CANCEL, BOARD_ROLE, PW, SESS_PW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ بدءُ الموسم بقيمٍ مقترحة ═══
   المبدأُ في هذا النظام أن لا قيمةَ افتراضيةً صامتة: كلُّ وزنٍ وتارجتٍ
   يبدأ صفرًا ويُضبط بيد المهندس — لئلّا يُبنى تقريرٌ على رقمٍ لم يقصده أحد.
   لكنَّ الصفرَ لا يُعطي بدايةً: من يفتح النظامَ أوّلَ مرةٍ يجد أربعةَ عشرَ
   حقلًا خاليًا ولا يدري بأيِّها يبدأ ولا ما المعقول فيه.
     فصار زرٌّ واحدٌ يكتب **مقترحًا** مبنيًّا على البيانات نفسِها — عددُ
   النقاط الفعليُّ وأنواعُها ومواعيدُ الموسم — ويُسجَّل في السجل باسم من
   ضغطه، ويبقى كلُّ رقمٍ قابلًا للتغيير في شاشته. المقترحُ ليس افتراضًا:
   الأولُ فعلٌ صريحٌ يُرى ويُراجَع، والثاني قرارٌ يُتَّخَذ عن صاحبه. */
function seedPlan(){
  var byType = {}, n = 0;
  (STATE.sites || []).forEach(function(x){
    n++;
    var k = x.zone + '|' + catLabel(x);
    byType[k] = (byType[k] || 0) + 1;
  });
  /* وزنُ الزيارة بالجهد لا بالعدد: الممرُّ أبعدُ من المخيّم، والجمراتُ أشقّ */
  var W = { 'مخيمات':1, 'ممرات':2, 'منطقة الجمرات':3, 'منشأة الجمرات':3, 'محطات القطار':2,
            'مسجد نمرة':2, 'كاميرات الوزارة':1.5 };
  var wRows = Object.keys(byType).map(function(k){
    var cat = k.split('|')[1];
    return { k:k, n:byType[k], w:W[cat] || 1.5 };
  }).sort(function(a, b){ return b.n - a.n; });
  var day = 86400000, today = dayKey(Date.now());
  var dueS = Date.now() + 45 * day, dueI = Date.now() + 100 * day;
  var left = n - (siteStats().surveyed || 0);
  var wd = Math.max(1, Math.round(45 * 26 / 30));   /* أيامُ عملٍ في خمسةٍ وأربعين يومًا */
  return {
    n:n, wRows:wRows, dueS:dueS, dueI:dueI,
    tgtSurvey:Math.max(1, Math.ceil(left / wd)),
    vals:{ insCamp:5, insCor:8, disOk:2, disBad:1, days:26, warranty:12,
           minCamp:1, minCor:1, reservePct:10 }
  };
}
function seedApply(){
  if (!may('settings')){ toast(t('بدءُ الموسم للمهندس وحده')); return; }
  var P = seedPlan(), n = 0;
  P.wRows.forEach(function(r){ if (!cfgGet('w', r.k)){ cfgSet('w', r.k, r.w); n++; } });
  Object.keys(P.vals).forEach(function(k){
    if (!cfgGet(k)){ cfgSet(k, null, P.vals[k]); n++; }
  });
  if (!cfgGet('tgtSurvey')){ cfgSet('tgtSurvey', null, P.tgtSurvey); n++; }
  if (!cfgGet('dueSurvey')){ cfgSet('dueSurvey', null, P.dueS); n++; }
  if (!cfgGet('dueInstall')){ cfgSet('dueInstall', null, P.dueI); n++; }
  logEvent('بدء الموسم — كُتب مقترحٌ في ' + nm(n) + ' حقلًا');
  toast(nm(n) + ' ' + t('حقلًا كُتب بمقترحه — راجعه في شاشته'));
  statBump(); render(1);
  return n;
}
function seedCard(){
  var P = seedPlan();
  var empty = P.wRows.filter(function(r){ return !cfgGet('w', r.k); }).length
            + Object.keys(P.vals).filter(function(k){ return !cfgGet(k); }).length
            + (cfgGet('tgtSurvey') ? 0 : 1) + (cfgGet('dueSurvey') ? 0 : 1) + (cfgGet('dueInstall') ? 0 : 1);
  if (!empty) return '';
  return card('\u{1F331} ' + t('ابدأ الموسم بمقترح'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('أربعةَ عشرَ حقلًا تبدأ صفرًا — لا افتراضًا صامتًا بل قرارًا ينتظر صاحبَه. وهذا مقترحٌ مبنيٌّ على بياناتك: عددُ نقاطك وأنواعُها وأيامُ الموسم.'))
      + '</p>'
      + table(['ما يُكتَب','المقترح','على ماذا بُني'], [
          [esc(t('أوزانُ الزيارة')), nm(P.wRows.length) + ' ' + esc(t('صنفًا')),
           esc(t('الجهدُ لا العدد: الممرُّ ضعفُ المخيّم، والجمراتُ ثلاثةُ أضعافه'))],
          [esc(t('تارجتُ المسح اليوميّ')), '<b class="num">' + nm(P.tgtSurvey) + '</b>',
           esc(t('ما بقي من نقاطٍ على أيام العمل حتى موعد المسح'))],
          [esc(t('موعد انتهاء المسح')), '<span class="num">' + esc(dayKey(P.dueS)) + '</span>',
           esc(t('خمسةٌ وأربعون يومًا من اليوم — غيّره إن كان الموسمُ أقرب'))],
          [esc(t('موعد انتهاء التركيب')), '<span class="num">' + esc(dayKey(P.dueI)) + '</span>',
           esc(t('مئةُ يومٍ من اليوم'))],
          [esc(t('نقاطُ التركيب')), '<span class="num">' + nm(5) + ' / ' + nm(8) + '</span>',
           esc(t('مخيمٌ خمسٌ وممرٌّ ثمانٍ — الممرُّ أشقُّ تركيبًا'))],
          [esc(t('شهورُ الضمان')), '<span class="num">' + nm(12) + '</span>', esc(t('سنةٌ من تاريخ المحضر'))],
          [esc(t('نسبةُ الاحتياطي')), '<span class="num">' + nm(10) + '٪</span>', esc(t('المعتادُ في مشاريع التركيب'))],
          [esc(t('سقفُ الميزانية')), pill('يبقى لك', 'wrn'), esc(t('رقمٌ تعاقديٌّ لا يُقترَح — اكتبه في «الميزانية»'))]
        ])
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('لا يُكتَب إلا الحقلُ الفارغ — وما ضبطتَه بيدك لا يُمَسّ. وكلُّ رقمٍ يبقى قابلًا للتغيير في شاشته.')) + '</p>',
      btn('\u{1F331} ' + t('اكتب المقترح'),'btn-primary btn-sm',' data-seedgo="1"'));
}
function readyRows(){
  var wKeys = Object.keys(CFG.w || {}).length;
  var signed = hoSigners().some(function(g){ return g.n; });
  var cmp = Object.keys(coCompounds()).length;
  var bk = (BK_STATE.meta && BK_STATE.meta.ok) === true;
  return [
    { ok:wKeys > 0,                 t:'أوزانُ الزيارة',        why:t('بلا وزنٍ لا تُحتسَب نقطةٌ لأحدٍ — والأداءُ كلُّه صفر'), p:'pts' },
    { ok:!!cfgGet('insCamp') || !!cfgGet('insCor'), t:'نقاطُ التركيب', why:t('بلا نقاطٍ للتركيب لا يُقاس عملُ فرق التركيب'), p:'pts' },
    { ok:!!cfgGet('tgtSurvey'),     t:'تارجتُ المسح اليوميّ',  why:t('بلا تارجتٍ لا تُقاس الوتيرةُ ولا يُعرَف «هل نلحق؟»'), p:'setup' },
    { ok:!!cfgGet('dueSurvey') && !!cfgGet('dueInstall'), t:'موعدا المسح والتركيب', why:t('بلا موعدٍ لا يُعرَف متأخّرٌ من مُنجِز'), p:'setup' },
    /* سعرُ النقطة يدخل خطَّ الأساس نفسَه: BAC = مجموعُ النقاط × السعر.
       فبلا سعرٍ يُجمَّد خطُّ أساسٍ ميزانيتُه صفر، وتعود القيمةُ المكتسبةُ
       أصفارًا مهما أُنجز — وهو أخطرُ من غياب السقف لأنه يُسكِت المؤشِّراتِ
       كلَّها لا شاشةَ الميزانية وحدَها. */
    { ok:!!cfgGet('ph'),            t:'سعرُ النقطة',           why:t('بلا سعرٍ للنقطة تكون القيمةُ المكتسبة صفرًا مهما أُنجز — ولا يُجمَّد خطُّ أساسٍ له ميزانية'), p:'consts' },
    { ok:!!cfgGet('budCap'),        t:'سقفُ الميزانية',        why:t('بلا سقفٍ لا انحرافَ كلفةٍ ولا احتياطيَّ يُقاس'), p:'budget' },
    { ok:!!BASE,                    t:'خطُّ الأساس مجمَّد',     why:t('بلا خطِّ أساسٍ لا يُقارَن الواقعُ بشيء'), p:'miles' },
    { ok:mileList().some(function(m){ return mileDateOf(m); }), t:'مواعيدُ المعالم', why:t('بلا مواعيدَ لا يُعرَف معلَمٌ تأخّر'), p:'miles' },
    { ok:signed,                    t:'أسماءُ المعتمِدين',     why:t('محضرٌ بأسماءٍ فارغةٍ يُرَدُّ من الوزارة'), p:'consts' },
    /* الرقمُ يُركَّب مع نصٍّ مترجَم — لا يُصنَع سطرٌ عربيٌّ ثابتٌ بالجمع */
    { ok:cmp === 0,                 t:'توحيدُ الأسماء المركَّبة', why:nm(cmp) + ' ' + t('قيمةً تحمل عدةَ شركاتٍ — لا تُحسَب نقاطُها'), p:'co' },
    { ok:!!cfgGet('warranty'),      t:'شهورُ الضمان',          why:t('المحضرُ يذكر نهايةَ الضمان — وبلا مدةٍ لا نهاية'), p:'consts' },
    { ok:bk,                        t:'النسخةُ الاحتياطية',    why:t('السيرُ ينجح ولا يحفظ حتى تُضبَط أسرارُه'), p:'hb' },
    /* حارسُ التكلفة (V17.96): بلا تنبيهٍ للميزانية لا يُعلَم بفاتورةٍ إلا حين تصل */
    { ok:!!cfgGet('budgetAlert'),   t:'تنبيهُ الميزانية مضبوط', why:t('بلا تنبيهٍ في Google Cloud لا يُعلَم بتجاوز الحصة المجانية إلا في الفاتورة — يُضبَط مرةً ويُؤشَّر هنا'), p:'consts' }
  ];
}
function readyCard(){
  bkFetch(false);
  var R = readyRows(), miss = R.filter(function(r){ return !r.ok; });
  if (!miss.length) return card('\u2705 ' + t('جاهزيةُ الموسم'),
    '<p class="hint" style="text-align:center;margin:0">'
    + esc(t('كلُّ ما يُعطِّل الحسابَ مضبوط — النظامُ يقيس ويقارن ويُصدِر المحاضر.')) + '</p>');
  return cardFlush('\u26A0 ' + t('جاهزيةُ الموسم') + ' \u2014 ' + nm(miss.length) + ' ' + t('ينقص'),
      table(['ما ينقص','لماذا يهمّ',''],
        miss.map(function(r){
          return ['<strong>' + esc(t(r.t)) + '</strong>',
                  '<span class="hint" style="margin:0">' + esc(r.why) + '</span>',
                  seesPage(PARENT[r.p] || r.p)
                    ? btn('\u2190 ' + t('اضبطه'),'btn-quiet btn-sm',' data-p="' + esc(r.p) + '"') : '\u2014'];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('كلُّ سطرٍ هنا يُعطِّل حسابًا في صمت: الشاشةُ تعمل وتعرض صفرًا فيُظنُّ أن العملَ لم يبدأ. ويختفي السطرُ فورَ ضبطه.'))
      + '</p>');
}

/* ═══ الدعوةُ يفعّلها صاحبُها ═══
   الحسابُ يُسجَّل في «المدعوّون» باسمه ودوره — بلا كلمةِ مرور. ويفتح صاحبُه
   التطبيقَ ويضع كلمتَه هو، فيُنشَأ حسابُ دخوله وتُكتَب وثيقتُه بالدور الذي
   دُعي به، ثم تُمحى الدعوة. والقاعدةُ تحرس ذلك: لا يكتب أحدٌ لنفسه دورًا
   غيرَ الذي في دعوته، ولا يفعّل دعوةَ غيره. */

/* ═══ الدعوةُ الجماعية ═══
   بمئةٍ وخمسين شخصًا لا يُنشأ حسابٌ حسابًا: يُلصَق جدولُ الفريق كما هو من
   إكسل — اسمٌ واسمُ مستخدمٍ ودورٌ (والوظيفةُ والفريقُ إن وُجدا) — فتُكتَب
   الدعواتُ كلُّها في نداءٍ واحد، ويفعّل كلٌّ حسابَه بنفسه.
     ولا يُكتَب سطرٌ ناقصٌ ولا مكرَّرٌ ولا بدورٍ لا تعرفه القاعدة: يُعرَض ما
   سيُكتَب وما سيُترَك وسببُه قبل الكتابة — فلا يُفاجَأ أحدٌ بنصف فريقٍ ناقص. */
var BULK_TXT = '';
/* كلمةٌ عشوائيةٌ من عشرة أحرفٍ بلا حروفٍ تلتبس في الطباعة (0/O · 1/l/I) */
function passGen(){
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', out = '';
  var buf = new Uint32Array(10);
  (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(buf)
    : buf.forEach(function(_, i){ buf[i] = Math.floor(Math.random() * 1e9); });
  for (var i = 0; i < 10; i++) out += A[buf[i] % A.length];
  return out;
}
/* الدورُ يُفهَم كما يُكتَب لا كما يُخزَّن: «مطّلع» و«وزارة» و«viewer» دورٌ
   واحد، و«مهندس المشروع» مهندسٌ، والتشكيلُ والهمزةُ والتاءُ المربوطةُ لا
   تفرّق. كان المطابقُ حرفيًّا فتُترَك سطورٌ بسبب شدّةٍ أو مرادف. */
function normAr(x){
  return String(x || '').replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();
}
var ROLE_ALIAS = {
  viewer:['مطلع','وزاره','مراقب','مراقب وزاري','ministry','observer'],
  exec:['اداره عليا','الاداره العليا','تنفيذي','executive','senior'],
  admin:['مدير','مدير المشروع','pm','project manager'],
  engineer:['مهندس','مهندس المشروع','engineer'],
  supervisor:['مشرف','supervisor'], tech:['فني','فني تركيب','technician'],
  cprep:['تهيئه','فريق التهيئه','مسؤول تهيئه'], casm:['تجميع','فريق التجميع','مسؤول تجميع'],
  cins:['فريق التركيب','تركيب'], buyer:['مشتريات','purchasing'], store:['مستودع','مخزن','store'],
  acct:['محاسب','محاسبه','accountant'], helper:['مساعد','مساعد فني'], driver:['سائق','driver']
};
function roleGuess(x){
  var q = normAr(x);
  if (!q) return '';
  if (ROLES[x]) return x;
  var hit = '';
  Object.keys(ROLES).forEach(function(k){
    if (hit) return;
    if (normAr(ROLES[k].n) === q) hit = k;
  });
  if (hit) return hit;
  Object.keys(ROLE_ALIAS).forEach(function(k){
    if (hit) return;
    if (ROLE_ALIAS[k].some(function(a){ return normAr(a) === q; })) hit = k;
  });
  return hit;
}
function jobGuess(x){
  var q = normAr(x);
  if (!q) return '';
  var L = jobsList(), hit = '';
  L.forEach(function(j){ if (!hit && (j.id === x || normAr(j.n) === q)) hit = j.id; });
  if (!hit) L.forEach(function(j){ if (!hit && normAr(j.n).indexOf(q) > -1) hit = j.id; });
  return hit;
}
function bulkParse(txt){
  var seen = {}, out = [];
  String(txt || '').split(/\r?\n/).forEach(function(line, i){
    var raw = line.trim();
    if (!raw) return;
    var c = raw.split(/\t|,|;|\|/).map(function(x){ return x.trim(); }).filter(function(x, k){ return k < 5; });
    /* الأعمدةُ: الاسم · المستخدم · الدور · الوظيفة · الفريق · كلمةُ المرور · البريد
       — والكلمةُ إن لم تُلصَق تُولَّد هنا فتُطبَع في ورقة الدخول */
    var c7 = raw.split(/\t|,|;|\|/).map(function(x){ return x.trim(); });
    var name = c[0] || '', user = (c[1] || '').replace(/\s+/g, ''), rl = c[2] || '', jb = c[3] || '', cr = c[4] || '';
    var pw = c7[5] || '', em = c7[6] || '';
    var row = { n:i + 1, name:name, user:user, role:roleGuess(rl), job:jobGuess(jb), crew:cr,
                pass:pw || passGen(), email:em };
    if (!name || !user) row.why = 'الاسمُ واسمُ المستخدم إلزاميان';
    else if (!/^[A-Za-z0-9._-]{3,}$/.test(user)) row.why = 'اسمُ المستخدم حروفٌ لاتينيةٌ وأرقامٌ ونقطة';
    else if (!row.role) row.why = 'دورٌ غيرُ معروف: ' + (rl || '—');
    else if (!canMakeRole(row.role)) row.why = 'أعلى من دورك — لا يُنشئه إلا من فوقك';
    else if (seen[user]) row.why = 'مكرَّرٌ في اللصق';
    else if (pw && pw.length < 10) row.why = 'كلمةُ المرور أقلُّ من عشرة أحرف';
    else if ((STATE.provision || {})[user] && (STATE.provision[user].status === 'pending')) row.why = 'له طلبٌ قائم';
    /* من له حسابٌ لا يُرفَض: طلبُه إعادةُ إصدارٍ — الخادمُ يضبط كلمتَه
       الجديدةَ فيدخل من نسي. ويُعلَّم كذلك ليُعرَف في الفحص. */
    else if (Object.keys(STATE.users || {}).some(function(k){
      var uu = STATE.users[k] || {}; return uu.user === user && !uu.provisioning; }))
      row.reissue = true;
    if (!row.why) seen[user] = 1;
    out.push(row);
  });
  return out;
}
function bulkApply(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var rows = bulkParse(BULK_TXT).filter(function(r){ return !r.why; });
  if (!rows.length){ toast(t('لا سطرَ صالحٌ للكتابة')); return; }
  STATE.provision = STATE.provision || {};
  rows.forEach(function(r){
    var v = { name:r.name, user:r.user, role:r.role, pass:r.pass, status:'pending',
              at:Date.now(), by:STATE.meta.name || '' };
    if (r.job)   v.job   = r.job;
    if (r.crew)  v.crew  = r.crew;
    if (r.email) v.email = r.email;
    if (r.reissue) v.reissue = true;
    STATE.provision[r.user] = v;
    /* الحسابُ القائمُ لا يُكرَّر صفًّا «يُنشَأ» — الطلبُ يضبط كلمتَه فقط */
    if (!r.reissue)
      STATE.users[r.user] = { name:r.name, user:r.user, role:r.role, active:true, at:Date.now(), provisioning:true };
    CORE.set('provision', r.user, v);
  });
  provKick();
  logEvent('طلبُ حساباتٍ جماعيّ — ' + nm(rows.length) + ' حسابًا');
  toast(nm(rows.length) + ' ' + t('طلبًا كُتب — يُنشئها الخادمُ خلال دقائق، ثم صدِّر ورقةَ الدخول'));
  BULK_TXT = ''; statBump(); render(1);
}
function bulkCard(){
  if (!canProvision()) return '';
  var rows = BULK_TXT ? bulkParse(BULK_TXT) : [];
  var okN = rows.filter(function(r){ return !r.why; }).length;
  return card('\u{1F465} ' + t('دعوةٌ جماعية — الصق قائمةَ الفريق'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('سطرٌ لكلِّ شخص: الاسم · اسم المستخدم · الدور · الوظيفة · الفريق — مفصولةً بجدولةٍ أو فاصلة. انسخها من إكسل كما هي.'))
      + '</p>'
      + '<div class="field"><textarea id="bulkT" rows="6" dir="auto" '
      /* المثالُ يُركَّب من كلماتٍ مترجَمةٍ لا سطرًا واحدًا فيه جدولات:
         سطرٌ بالجدولات لا يُترجَم ويظهر عربيًّا في واجهةٍ إنجليزية. */
      +   'placeholder="' + esc([t('أحمد علي'), 'm.ahmed', t('فني'), t('فني تركيب'), t('فريق') + ' ١'].join('\t')) + '">'
      +   esc(BULK_TXT) + '</textarea></div>'
      + (rows.length
        ? table(['#','الاسم','المستخدم','الدور','الحال'],
            rows.slice(0, 60).map(function(r){
              return [N(r.n), esc(r.name || '—'),
                      '<span class="num" dir="ltr">' + esc(r.user || '—') + '</span>',
                      esc(r.role ? t((ROLES[r.role] || {}).n || r.role) : '—'),
                      r.why ? pill(r.why, 'off') : (r.reissue ? pill('إعادةُ إصدار كلمة','wrn') : pill('يُكتَب','ok'))];
            }))
        : '')
      + (rows.length
        ? '<p class="hint" style="margin:8px 0 0">' + nm(okN) + ' ' + esc(t('سيُكتَب')) + ' \u00b7 '
          + nm(rows.length - okN) + ' ' + esc(t('يُترَك — لكلٍّ سببُه أعلاه')) + '</p>'
        : ''),
      btn('\u{1F441} ' + t('افحص'),'btn-secondary btn-sm',' data-bulkchk="1"')
      + (okN ? btn('\u2709 ' + t('اكتب') + ' ' + nm(okN) + ' ' + t('دعوة'),'btn-primary btn-sm',' data-bulkgo="1"') : ''));
}

/* ═══ طلباتُ الإنشاء وورقةُ الدخول ═══
   المكتبُ يرى حالَ كلِّ طلب — يُنشَأ · تمّ · خطأ بسببه — ويُصدِر ورقةَ
   الدخول إكسل: الاسمُ والمستخدمُ والكلمةُ والدور، ورقةٌ لكلِّ فريق يوزّعها
   مشرفُه. ثم يمسح الكلماتِ من الطلبات بضغطة — فلا تبقى في القاعدة. */

/* ═══ شغّل الخادمَ الآن ═══
   جدولةُ GitHub «كلَّ عشر دقائق» ليست عشرًا: على مستودعٍ هادئٍ تتأخّر إلى
   ساعةٍ ونصف كما وقع — فيبقى الطلبُ «يُنشَأ — خلال دقائق» ساعةً. الطريقُ
   المضمونُ نداءُ التشغيل نفسِه، وهو يحتاج مفتاحًا بصلاحية تشغيل السيور
   وحدَها (Actions: write على هذا المستودع لا غير) — يضعه مديرُ المشروع
   مرةً في الإعدادات، ويبقى في وثيقةٍ لا يقرؤها إلا هو. وبلا مفتاحٍ يبقى
   رابطُ صفحة التشغيل اليدويّ. */
var GH_REPO = 'mhmdsfwt371/Project-survey';
function ghToken(){ return String((CFG.gh || {}).tok || ''); }
function ghSetToken(v){
  if (!may('roles')){ toast(t('مفتاحُ التشغيل لمدير المشروع وحده')); return; }
  var tk = String(v || '').trim();
  CFG.gh = Object.assign({}, CFG.gh || {}, { tok:tk, at:Date.now() });
  /* وثيقةٌ مستقلةٌ لا تُخلَط بالإعدادات العامّة التي يقرؤها الجميع */
  CORE.set('ghcfg', 'gh', { tok:tk, at:Date.now() });
  toast(tk ? t('حُفظ مفتاحُ التشغيل') : t('مُسح المفتاح'));
}
function ghRunNow(quiet){
  if (!may('provision')){ if (!quiet) toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return Promise.resolve(false); }
  var tk = ghToken();
  if (!tk){
    /* لا مفتاحَ على هذا الجهاز: لا يُرسَل أحدٌ إلى GitHub — يُقال له ما ينقص ومن يملكه */
    if (!quiet) toast(t('لا مفتاحَ تشغيلٍ على هذا الجهاز — يحفظه مديرُ المشروع في ثوابت النظام، ثم يعمل الزرُّ من هنا لكلِّ من يُنشئ الحسابات'));
    return Promise.resolve(false);
  }
  toast(t('يُطلَب تشغيلُ الخادم…'));
  return fetch('https://api.github.com/repos/' + GH_REPO + '/actions/workflows/provision.yml/dispatches', {
    method:'POST',
    headers:{ 'Authorization':'Bearer ' + tk, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json' },
    body:JSON.stringify({ ref:'main' })
  }).then(function(r){
    if (r.status === 204){
      GH_RAN = Date.now();
      logEvent('تشغيلُ خادم الحسابات يدويًّا');
      toast(t('انطلق الخادم — الحساباتُ خلال دقيقة، وتصلك «تمّ» هنا فورًا'));
      render(1); return true;
    }
    if (r.status === 401 || r.status === 403){   /* (V30.7) المفتاحُ منتهٍ: الطلبُ محفوظٌ ويُنفَّذ مع أقرب دورةٍ — ويُقال ذلك بوضوح، ويُعلَّم المفتاحُ ليراه المدير */
      CFG.gh = Object.assign({}, CFG.gh || {}, { bad:Date.now(), badCode:r.status });
      toast(t('الخادمُ لم يُشغَّل (مفتاحُ التشغيل منتهٍ). اضغط «أنشئه من هذا الجهاز الآن» بجوار الحساب في القائمة'));
      logEvent('مفتاحُ تشغيل الحسابات رُفض — ' + r.status);
      render(1); return false;
    }
    toast(t('رفض GitHub التشغيل') + ' \u2014 ' + r.status);
    return false;
  }).catch(function(e){ toast(t('تعذّر الاتصال بـ GitHub') + ' \u2014 ' + String(e && e.message || '').slice(0, 40)); return false; });
}
var GH_RAN = 0;
function ghCard(){
  if (!may('roles')) return '';
  var has = !!ghToken();
  return card('\u{1F511} ' + t('مفتاحُ تشغيل الخادم'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('جدولةُ GitHub تتأخّر إلى ساعةٍ على المستودعات الهادئة. بمفتاحٍ صلاحيتُه تشغيلُ السيور وحدَها يُشغَّل الخادمُ فورًا من زرِّ «شغّل الآن» في طلبات الإنشاء.'))
      + '</p>'
      + '<div class="field"><label>' + esc(t('المفتاح')) + (has ? ' ' + pill('محفوظ','ok') : '') + '</label>'
      +   '<input id="ghTok" type="password" dir="ltr" autocomplete="off" placeholder="github_pat_…"></div>'
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('GitHub ← Settings ← Developer settings ← Fine-grained tokens ← Generate: هذا المستودع فقط · Actions: Read and write · لا شيءَ آخر. يحفظه مديرُ المشروع ويعمل الزرُّ به لكلِّ من يُنشئ الحسابات.'))
      + '</p>',
      btn('\u{1F4BE} ' + t('احفظ'),'btn-primary btn-sm',' data-ghsave="1"')
      + (has ? btn('\u{1F5D1} ' + t('امسح'),'btn-quiet btn-sm',' data-ghclear="1"') : ''));
}
/* المفتاحُ محفوظٌ في `key`: كان الحقلُ `user` في الوثيقة يكتب فوق المفتاح —
   فطلبُ حذفِ حسابٍ بلا اسمِ مستخدمٍ (`user:''`) صار بمفتاحٍ فارغ، وأمرُ
   حذفِه دخل الطابورَ بمعرِّفٍ فارغٍ ينفجر عند بناء المرجع فيُسقِط الدفعةَ
   كلَّها كلَّ دقيقةٍ بلا صوت — سبعُ وثائقَ بانتظار الرفع نصفَ ساعة. */
function provList(){
  var P = STATE.provision || {};
  return Object.keys(P).map(function(k){ return Object.assign({ user:k }, P[k] || {}, { key:k, user:(P[k] || {}).user || k }); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function provWipe(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var n = 0;
  provList().forEach(function(r){
    if (r.status === 'done' && r.pass){
      var v = Object.assign({}, STATE.provision[r.key], { pass:'' });
      STATE.provision[r.key] = v; CORE.set('provision', r.key, v); n++;
    }
  });
  logEvent('مسحُ كلمات المرور من الطلبات — ' + nm(n));
  toast(nm(n) + ' ' + t('كلمةً مُسحت — الورقةُ المصدَّرةُ هي النسخةُ الوحيدة'));
  render(1);
}
/* المنتهيةُ (تمّ/خطأ) تُمسَح بضغطة — تاريخُ الإنشاء في سجل الأحداث لا هنا */
function provClear(){
  if (!may('users')){ toast(t('مسحُ الطلبات للمهندس فما فوق')); return; }
  var n = 0;
  provList().forEach(function(r){
    /* المنتهيةُ وحدَها — وطلبُ حذفِ الدخول يبقى حتى ينفّذه الخادم (status: done) */
    if (r.status === 'done' || r.status === 'error'){
      delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    }
  });
  logEvent('مسحُ طلبات الإنشاء المنتهية — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا مُسح'));
  render(1);
}
/* ═══ الطلباتُ حين تكذب الشاشة ═══
   ظهر على هاتف المدير طلبان «يُنشَأ» لحسابين قائمين منذ الصباح، ولا طلبَ
   للحساب الذي يريده فعلًا — والخادمُ يقول: لا طلبَ منتظرًا. الجهازُ يحمل
   نسخةً محليةً من الطلبات قد تفترق عن القاعدة (كُتبت ولم تُرفَع، أو رُفعت
   وعُدِّلت هناك ولم يصل التعديل). فصار للمكتب ثلاثةُ أزرارٍ تقول الحقيقة:
   يجلب الطلباتِ من القاعدة كما هي، ويلغي المعلّقَ كلَّه، ويرى طابورَ الجهاز
   ويدفعه. ومن الصفِّ المؤقت في الحسابات يُعاد الطلبُ بكلمةٍ جديدة. */
var PROV_CANCEL = 0;
var BOARD_ROLE = '';   /* مرشِّحُ الدور في لوحة الفريق */
function provQueued(){
  return (STATE.queue || []).filter(function(q){ return q && q.kind === 'provision'; }).length
       + (STATE.poison || []).filter(function(q){ return q && q.kind === 'provision'; }).length;
}
function provSync(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return Promise.resolve(false); }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return Promise.resolve(false); }
  toast(t('يُجلَب من القاعدة…'));
  return DB.col('provision').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    var cloud = {}; sn.forEach(function(d){ cloud[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    var local = STATE.provision || {}, dropped = 0;
    Object.keys(local).forEach(function(k){ if (!cloud[k]) dropped++; });
    STATE.provision = cloud;
    /* والحساباتُ كما في القاعدة: صفٌّ لحسابٍ حُذف بقي في الجهاز يزول، ودورٌ تغيّر يصل */
    return DB.col('users').limit(500).get().then(function(us){
      FB.readCount = (FB.readCount || 0) + us.size;
      var U = STATE.users || {}, keepTemp = {};
      Object.keys(U).forEach(function(k){ if (U[k] && U[k].provisioning && !uidLike(k)) keepTemp[k] = U[k]; });
      var fresh = {}; us.forEach(function(d){ fresh[d.id] = d.data(); });
      FB.readCount = (FB.readCount || 0) + us.size;
      STATE.users = Object.assign(fresh, keepTemp);
      return { sn:sn, cloud:cloud, dropped:dropped };
    });
  }).then(function(r){
    var sn = r.sn, cloud = r.cloud, dropped = r.dropped;
    /* صفٌّ مؤقتٌ في الحسابات بلا طلبٍ منتظرٍ في القاعدة: ميتٌ — يُزال */
    var U = STATE.users || {}, gone = 0;
    Object.keys(U).forEach(function(k){
      var u = U[k]; if (!u || !u.provisioning || uidLike(k)) return;
      var pr = cloud[k] || cloud[u.user || ''];
      if (!pr || pr.status !== 'pending'){ delete U[k]; gone++; }
    });
    CORE.saveSoon(); statBump(); render(1);
    toast(nm(sn.size) + ' ' + t('طلبًا من القاعدة') + ' \u00b7 ' + nm(dropped) + ' ' + t('محليًّا لم يكن هناك') + ' \u00b7 ' + nm(gone) + ' ' + t('صفًّا مؤقتًا أُزيل'));
    logEvent('جلبُ الطلبات من القاعدة — ' + nm(sn.size) + ' · أُسقط ' + nm(dropped) + ' · أُزيل ' + nm(gone));
    return true;
  }).catch(function(e){ softErr('جلب الطلبات', e, 'تعذّر الجلبُ من القاعدة'); return false; });
}
function provCancelAll(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return; }
  var n = 0, U = STATE.users || {};
  provList().forEach(function(r){
    if (r.status !== 'pending') return;
    delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    var un = String(r.user || r.key || '');
    if (un && U[un] && U[un].provisioning) delete U[un];
  });
  /* وما في الطابور من طلباتٍ لم تُرفَع يُسقَط معها — وإلا رُفعت بعد الإلغاء */
  if (STATE.queue) STATE.queue = STATE.queue.filter(function(q){ return !(q && q.kind === 'provision' && q.v && q.v.status === 'pending'); });
  PROV_CANCEL = 0; CORE.saveSoon(); statBump();
  logEvent('إلغاءُ الطلبات المعلّقة — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا أُلغي'));
  render(1);
}
/* من الصفِّ المؤقت: يُعاد الطلبُ بكلمةٍ جديدةٍ — لمن ضاع طلبُه بين الجهاز والقاعدة */
function provReask(uid){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا صفَّ مؤقتًا')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, pass:pass, role:u.role || 'tech', roleExplicit:true, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  ['job','sup','dept','email','crew'].forEach(function(k){ if (u[k]) req[k] = u[k]; });
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادةُ طلب إنشاء — ' + (u.name || u.user) + ' (' + u.user + ')');
  /* مباشرةً إلى القاعدة ثم الخادم — كما في «كلمة جديدة»؛ وكان يمرُّ بالطابور
     فيقف على شبكةٍ بطيئة ولا يعلم أحدٌ أين وقف */
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}
function provUserGone(r){
  var un = String(r.user || '').toLowerCase();
  if (!un || r.action === 'delete') return false;
  return !Object.keys(STATE.users || {}).some(function(k){
    var u = STATE.users[k] || {};
    return String(u.user || '').toLowerCase() === un || k.toLowerCase() === un;
  });
}
function provCard(){
  if (!canProvision()) return '';
  var L = provList().filter(function(r){ return r.action !== 'delete'; });
  if (!L.length) return '';
  var pend = L.filter(function(r){ return r.status === 'pending'; }).length;
  var done = L.filter(function(r){ return r.status === 'done'; }).length;
  var err  = L.filter(function(r){ return r.status === 'error'; }).length;
  var withPw = L.filter(function(r){ return r.status === 'done' && r.pass; }).length;
  return cardFlush('\u{1F5A5} ' + t('طلباتُ الإنشاء') + ' \u2014 ' + nm(L.length),
      stats([['يُنشَأ', N(pend), pend ? 'wrn' : ''], ['تمّ', N(done), 'ok'], ['خطأ', N(err), err ? 'bad' : '']])
      + table(['المستخدم','الاسم','الدور','الحال'],
          capList(L, 200).map(function(r){
            return ['<span class="num" dir="ltr">' + esc(r.user) + '</span>', esc(r.name || ''),
                    esc(t((ROLES[r.role] || {}).n || r.role)),
                    (r.status === 'done' ? pill('تمّ','ok')
                  : r.status === 'error' ? pill(r.why || 'خطأ','off')
                  : pill('يُنشَأ — خلال دقائق','wrn'))
                    + (provUserGone(r) ? ' ' + pill('حسابُه حُذف','off') : '')];
          }))
      + (function(){
          var q = provQueued();
          return q ? alertBox('warn', nm(q) + ' ' + t('طلبًا في طابور هذا الجهاز لم يصل القاعدةَ بعد — اضغط «ادفع الآن»')) : '';
        })()
      + '<div class="actions" style="margin-top:10px">'
      +   (pend ? btn('\u26A1 ' + t('شغّل الخادمَ الآن'),'btn-primary btn-sm',' data-ghrun="1"') : '')
      +   (provQueued() ? btn('\u2B06 ' + t('ادفع الآن'),'btn-secondary btn-sm',' data-pull="1"') : '')
      +   (may('users') ? btn('\u{1F504} ' + t('أعد الجلب من القاعدة'),'btn-quiet btn-sm',' data-provsync="1"') : '')
      +   (pend && may('users') ? (PROV_CANCEL ? btn('\u{1F5D1} ' + t('تأكيد إلغاء المعلّق') + ' (' + nm(pend) + ')','btn-danger btn-sm',' data-provcancelgo="1"')
                                             : btn('\u{1F5D1} ' + t('ألغِ المعلّق'),'btn-quiet btn-sm',' data-provcancel="1"')) : '')
      +   ((done || err) && may('users') ? btn('\u{1F9F9} ' + t('امسح المنتهية') + ' (' + nm(done + err) + ')','btn-quiet btn-sm',' data-provclear="1"') : '')
      +   (withPw ? btn('\u2B07 ' + t('إكسل — ورقةُ الدخول') + ' (' + nm(withPw) + ')','btn-primary btn-sm',' data-xls="provsheet"') : '')
      +   (withPw ? btn('\u{1F9F9} ' + t('امسح كلمات المرور بعد التوزيع'),'btn-quiet btn-sm',' data-provwipe="1"') : '')
      + '</div>'
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t(pend ? 'اضغط «شغّل الخادمَ الآن» فتُنشَأ خلال دقيقة — الجدولةُ وحدَها قد تتأخّر ساعة. ثم صدِّر الورقةَ ووزِّعها، وامسح الكلمات.'
                   : 'صدِّر الورقةَ ووزِّعها على المشرفين، ثم امسح الكلمات — الورقةُ تصير النسخةَ الوحيدة، وكلٌّ يبدّل كلمتَه أوّلَ دخول.'))
      + '</p>');
}

/* ═══ كلمةُ المرور: تُبدَّل أوّلَ دخولٍ ومتى شاء صاحبُها ═══
   ورقةُ الدخول تُطبَع وتُوزَّع، والخادمُ يكتب على الحساب أن كلمتَه مؤقتة —
   ولم يكن في التطبيق مكانٌ لتبديلها: فتبقى الكلمةُ المطبوعةُ على الورق هي
   الكلمةَ طولَ الموسم، ووعدُ «يبدّلها أوّلَ دخول» بلا تنفيذ. صارت نافذةٌ
   تُفرَض عند الدخول إن كانت الكلمةُ مؤقتة (لا تُغلَق حتى تُبدَّل)، وتُفتَح
   من القائمة متى شاء صاحبُها. والقديمةُ تُطلَب لتُثبَت الهوية — إلا في
   الدخول الأوّل فالمصادقةُ أثبتتها للتوّ. */
var PW = null;   /* { forced:true } عند الدخول الأوّل — أو {} من القائمة */
/* كلمةُ هذه الجلسة كما كُتبت في نموذج الدخول — في الذاكرة فقط: بها تُثبَت
   الهويةُ صامتةً إن طلبت المصادقةُ دخولًا حديثًا عند تبديل المؤقتة، فلا يُقال
   «ادخل من جديد» لمن دخل للتوّ. والجلسةُ المستعادةُ بلا كلمةٍ تسأل عنها. */
var SESS_PW = '';
