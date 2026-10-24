/* ============================================================================
   FILE    : src/03z-shared/03z-shared-23-from-ministry-alerts-10-season-start-invites.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-10-season-start-invites.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : seedPlan, seedCard, readyRows, readyCard, BULK_TXT, passGen, normAr, ROLE_ALIAS, roleGuess, jobGuess, bulkParse, bulkCard, provList, PROV_CANCEL … (+5 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
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
  var day = 86400000;
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
    { ok:!!cfgGet('budgetAlert'),   t:'تنبيهُ الميزانية مضبوط', why:t('بلا تنبيهٍ في جوجل كلاود لا يُعلَم بتجاوز الحصة المجانية إلا في الفاتورة — يُضبَط مرةً ويُؤشَّر هنا'), p:'consts' }
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

/* المفتاحُ محفوظٌ في `key`: كان الحقلُ `user` في الوثيقة يكتب فوق المفتاح —
   فطلبُ حذفِ حسابٍ بلا اسمِ مستخدمٍ (`user:''`) صار بمفتاحٍ فارغ، وأمرُ
   حذفِه دخل الطابورَ بمعرِّفٍ فارغٍ ينفجر عند بناء المرجع فيُسقِط الدفعةَ
   كلَّها كلَّ دقيقةٍ بلا صوت — سبعُ وثائقَ بانتظار الرفع نصفَ ساعة. */
function provList(){
  var P = STATE.provision || {};
  return Object.keys(P).map(function(k){ return Object.assign({ user:k }, P[k] || {}, { key:k, user:(P[k] || {}).user || k }); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}

/* ═══ الطلباتُ حين تكذب الشاشة ═══
   ظهر على هاتف المدير طلبان «يُنشَأ» لحسابين قائمين منذ الصباح، ولا طلبَ
   للحساب الذي يريده فعلًا — والخادمُ يقول: لا طلبَ منتظرًا. الجهازُ يحمل
   نسخةً محليةً من الطلبات قد تفترق عن القاعدة (كُتبت ولم تُرفَع، أو رُفعت
   وعُدِّلت هناك ولم يصل التعديل). فصار للمكتب ثلاثةُ أزرارٍ تقول الحقيقة:
   يجلب الطلباتِ من القاعدة كما هي، ويلغي المعلّقَ كلَّه، ويرى طابورَ الجهاز
   ويدفعه. ومن الصفِّ المؤقت في الحسابات يُعاد الطلبُ بكلمةٍ جديدة. */
var PROV_CANCEL = 0;

var BOARD_ROLE = '';

/* مرشِّحُ الدور في لوحة الفريق */
function provQueued(){
  return (STATE.queue || []).filter(function(q){ return q && q.kind === 'provision'; }).length
       + (STATE.poison || []).filter(function(q){ return q && q.kind === 'provision'; }).length;
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
var PW = null;
