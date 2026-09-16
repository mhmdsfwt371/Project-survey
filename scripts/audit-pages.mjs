/* ═══ جردُ الصفحات — كلُّ شاشةٍ تقرأ مصدرًا حيًّا وتُبلَغ من القائمة ═══
   بُني بعد أن تكرّرت العلّةُ نفسُها سبعَ مرّات في إصدارات متتالية: شاشةٌ
   تُعرَض بأصفارٍ مكتوبةٍ بيد أو صفٍّ وهميٍّ («أحمد ٠ ٠ ٠»، «فريق ١ ×٣
   راوتر») بينما بياناتُها الحقيقيةُ موجودةٌ ولا تُقرأ. myteam ثم wday ثم
   survey وstuck وpipe وdis ثم chal وchalm ثم stock وmine — كلُّها اكتُشفت
   بالعين لا بحارس. فصار لها حارس.

   يفحص لكلِّ صفحة:
   ١ — أنها تمسّ مصدرَ بياناتٍ حيًّا (STATE أو دالةَ اشتقاق) لا ثوابتَ فقط.
   ٢ — أنها مُبلَغةٌ من القائمة الجانبية أو مقصودةُ العزل بتصريح.

   والاستثناءاتُ تُكتَب بأسمائها وسببِها — لا تُبتلَع صمتًا. */

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let ok = 0, bad = 0;
const fail = [];
function check(cond, msg){ if (cond){ ok++; console.log('  ✓ ' + msg); }
                           else { bad++; fail.push(msg); console.log('  ✗ ' + msg); } }

/* ── شاشاتٌ ثابتةٌ بطبيعتها: تشرح ثوابتَ النظام أو تعرض نصًّا مرجعيًّا،
      ولا مصدرَ حيًّا لها أصلًا. كلُّ اسمٍ هنا قرارٌ مكتوبٌ لا سهو. ── */
const STATIC_OK = {
  roles:     'مصفوفةُ الصلاحيات — تُقرأ من ROLES وهي ثابتُ النظام',
  layers:    'شرحُ طبقات الإسناد — يُقرأ من LAYERS الثابتة',
  miles:     'المعالمُ التعاقدية — جدولٌ مرجعيٌّ من العقد',
  repcenter: 'مركزُ التقارير — فهرسُ التقارير لا بياناتُها'
  /* V15.29: sys وvers وcover وprep وasm وfleetLog صارت شرائحَ في صفحاتٍ
     مدموجةٍ تقرأ حيًّا؛ وchain تقرأ chainRows() فأُضيفت إلى LIVE؛ وsetup
     صارت تقرأ CFG فعلًا بعد أن كانت تواريخَ مكتوبةً بيد */
};
/* ── صفحاتٌ خارج القائمة بقصد: تُفتَح من زرٍّ أو رابطٍ لا من بندٍ ── */
const OFF_NAV_OK = {
  site: 'بطاقةُ الموقع — تُفتَح بالنقر على نقطةٍ في الخريطة أو القائمة',
  map:  'الخريطةُ — تُبلَغ من شريط الميدان السفلي ومن قوائم الأدوار، لا من القائمة الجانبية'
};

/* مصادرُ البيانات الحيّة: STATE أو دالةُ اشتقاقٍ تقرؤها */
const LIVE = new RegExp([
  'STATE\\.', 'scores\\(', 'siteStats\\(', 'siteFind\\(', 'cfgGet\\(', 'cfgN\\(',
  '\\bT\\(\\)', '[A-Za-z]List\\(\\)', 'itemsList', 'techsList', 'crewsList', 'jobsList',
  'usersList', 'movesList', 'buysList', 'chalSites', 'stuckList', 'surveyList',
  /* قارئاتُ الدفاتر الجديدة: التجاربُ تقرأ صفوفَها ووثيقتَها كما تقرأ غيرُها
     قوائمَها — والقائمةُ هنا سجلُّ القُرّاء المعروفين، فمن أضاف قارئًا أضافه */
  'trialRows\\(', 'trialsDoc\\(',
  'workReqList', 'bonusList', 'rollupBy', 'evRows', 'asnOf', 'solutionOf',
  'stockBalance', 'custodyByWho', 'scoreOf', 'stageList', 'vehList', 'vehOfWho', 'chainRows\\(',
  'CHANGES', 'NCRS', 'IPCS', 'HSE\\.', 'BASE', 'REQSEQ', 'POLY', 'S47'
].join('|'));

/* استخراجُ جسم كلِّ صفحة — من مصدرَي الصفحات معًا: PAGE وFIELD_PAGES.
   قراءةُ أحدهما وحدَه تجعل شاشاتِ الميدان الثلاث تبدو بنودًا بلا صفحة. */
const marks = [];
const re = /PAGE\.(\w+)\s*=\s*\{/g;
let m;
while ((m = re.exec(src))) marks.push({ id: m[1], at: m.index });
const fpBlock = (/var FIELD_PAGES = \{[\s\S]*?\n\};/.exec(src) || [''])[0];
[...fpBlock.matchAll(/^\s{2}(\w+):\s*\{/gm)].forEach(x => {
  marks.push({ id: x[1], at: src.indexOf(fpBlock) + x.index, field: true });
});
marks.filter(p => !p.field).forEach((p, i, a) => {
  p.body = src.slice(p.at, i + 1 < a.length ? a[i + 1].at : p.at + 9000);
});
/* شاشاتُ الميدان أجسامُها دوالٌّ مسمّاةٌ خارج الكائن — يُقرأ جسمُ الدالة */
marks.filter(p => p.field).forEach(p => {
  const fn = (new RegExp('body:(\\w+)').exec(
    (new RegExp('  ' + p.id + ':\\s*\\{[^}]*\\}').exec(fpBlock) || [''])[0]) || [])[1];
  const f = fn && (new RegExp('function ' + fn + '\\([\\s\\S]{0,4000}').exec(src) || [])[0];
  p.body = f || '';
});

console.log('\n══ ١ · كلُّ شاشةٍ تقرأ مصدرًا حيًّا ══');
const deadPages = marks.filter(p => !p.field && !LIVE.test(p.body) && !STATIC_OK[p.id]);
check(deadPages.length === 0,
  deadPages.length
    ? `شاشاتٌ بلا مصدرِ بياناتٍ حي (${deadPages.length}): ${deadPages.map(p => p.id).join('، ')}`
    : `الشاشاتُ كلُّها تقرأ مصدرًا حيًّا (${marks.length - Object.keys(STATIC_OK).length} حيّة · ${Object.keys(STATIC_OK).length} ثابتةٌ بتصريح)`);

/* استثناءٌ صار لاغيًا: صفحةٌ في القائمة الثابتة وقد صارت تقرأ فعلًا */
const staleStatic = Object.keys(STATIC_OK)
  .filter(id => { const p = marks.find(x => x.id === id); return p && LIVE.test(p.body); });
check(staleStatic.length === 0,
  staleStatic.length
    ? `استثناءاتٌ لم تعد لازمة — احذفها من STATIC_OK (${staleStatic.length}): ${staleStatic.join('، ')}`
    : 'لا استثناءَ ثابتٍ صار لاغيًا');

console.log('\n══ ٢ · كلُّ شاشةٍ مُبلَغةٌ من القائمة ══');
/* القائمةُ تُقرأ من مصفوفة NAV وحدَها: التقاطُ كلِّ زوجٍ `['a','b']` في
   الملف يبتلع الوظائفَ والصلاحياتِ وأعمدةَ الجداول، فيصير الفحصُ ضجيجًا. */
const navBlock = (/var NAV = \[[\s\S]*?\n\];/.exec(src) || [''])[0];
const navIds = new Set([...navBlock.matchAll(/\['(\w+)',/g)].map(x => x[1]));
const orphans = marks.filter(p => !navIds.has(p.id) && !OFF_NAV_OK[p.id]);
check(orphans.length === 0,
  orphans.length
    ? `شاشاتٌ لا يبلغها بندٌ في القائمة (${orphans.length}): ${orphans.map(p => p.id).join('، ')}`
    : `كلُّ شاشةٍ يبلغها بندٌ أو استُثنيت بتصريح (${Object.keys(OFF_NAV_OK).length} مستثناة)`);

/* بندٌ في القائمة بلا صفحةٍ خلفه — يُفتَح فيقع فراغ */
const ghostNav = [...navIds].filter(id => !marks.find(p => p.id === id));
check(ghostNav.length === 0,
  ghostNav.length ? `بنودٌ في القائمة بلا صفحة (${ghostNav.length}): ${ghostNav.join('، ')}`
                  : 'لا بندَ في القائمة بلا صفحةٍ خلفه');

console.log('\n══ ٣ · الصفحاتُ المدموجة — كلُّ شريحةٍ بمعرِّفها القديم ══');
/* V15.29: شاشاتٌ جُمعت في صفحةٍ بشرائح. كلُّ شريحةٍ تحتفظ بمعرِّفها القديم في
   قوائم الأدوار والروابط، فلا يجوز أن يبقى لها تعريفُ صفحةٍ مستقلٌّ (فتُرسَم
   مرتين)، ولا أن تُبلَغ من القائمة الجانبية (فتظهر مرتين)، ولا أن يبقى في
   قوائم الأدوار معرِّفٌ لا يصل إلى شيء. */
const tabsBlock = (/var TABS = \{[\s\S]*?\n\};/.exec(src) || [''])[0];
let TABS = {};
try { TABS = new Function(tabsBlock + ' return TABS;')(); } catch (e){ TABS = null; }
check(!!TABS && Object.keys(TABS).length > 0, 'سجلُّ الشرائح TABS يُقرأ' + (TABS ? ` (${Object.keys(TABS).length} صفحاتٍ مدموجة)` : ''));
if (TABS){
  const kids = [], dupKid = [], noParent = [], kidPage = [], kidNav = [];
  Object.keys(TABS).forEach(pid => {
    if (!marks.find(p => p.id === pid)) noParent.push(pid);
    TABS[pid].forEach(tb => {
      const id = tb[0];
      if (kids.indexOf(id) > -1) dupKid.push(id); else kids.push(id);
      if (id !== pid && marks.find(p => p.id === id)) kidPage.push(id);
      if (id !== pid && navIds.has(id)) kidNav.push(id);
    });
  });
  check(noParent.length === 0, noParent.length ? `أمٌّ بلا صفحة: ${noParent.join('، ')}` : 'كلُّ أمٍّ لها صفحةٌ ترسم شرائحَها');
  check(dupKid.length === 0, dupKid.length ? `شريحةٌ في أمَّين: ${dupKid.join('، ')}` : 'لا شريحةَ في أمَّين');
  check(kidPage.length === 0, kidPage.length ? `شريحةٌ ما زالت صفحةً مستقلّة: ${kidPage.join('، ')}` : `لا شريحةَ تُرسَم مرتين (${kids.length} شريحة)`);
  check(kidNav.length === 0, kidNav.length ? `شريحةٌ ما زالت بندًا في القائمة: ${kidNav.join('، ')}` : 'لا شريحةَ تظهر في القائمة بجوار أمِّها');
  /* قوائمُ الأدوار: كلُّ معرِّفٍ فيها يصل — صفحةً أو شريحةً أو شاشةَ ميدان */
  const rolesBlock = (/var ROLES = \{[\s\S]*?\n\};/.exec(src) || [''])[0];
  const roleIds = new Set([...rolesBlock.matchAll(/nav:\[([^\]]*)\]/g)]
    .flatMap(m => [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1])));
  const reach = new Set(marks.map(p => p.id).concat(kids));
  const lost = [...roleIds].filter(id => !reach.has(id));
  check(lost.length === 0, lost.length ? `معرِّفٌ في قوائم الأدوار لا يصل إلى شيء: ${lost.join('، ')}` : `كلُّ معرِّفٍ في قوائم الأدوار يصل (${roleIds.size})`);
}

console.log('\n══ ٤ · لا وعدَ معطَّلٍ بحجّةٍ صارت باطلة ══');
/* زرٌّ معطَّلٌ بعبارة «غيرُ مبنيٍّ بعد» بينما بناؤه تمّ — كان في mine وwos */
const excuses = [...src.matchAll(/title="([^"]*غيرُ مبنيٍّ بعد[^"]*)"/g)].map(x => x[1]);
console.log(`  \u00b7 أزرارٌ معطَّلةٌ بحجّة «غير مبني بعد»: ${excuses.length}`);
excuses.forEach(e => console.log('    — ' + e.slice(0, 70)));
check(excuses.length <= 2,
  `الحجّاتُ المعلَنةُ محصورة (${excuses.length}) — كلُّ واحدةٍ تُراجَع عند بناء ما تنتظره`);

console.log(`\nنجح ${ok} · فشل ${bad}`);
if (bad){ console.log('\nجردُ الصفحات فشل ✗'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
/* ═══ بحثٌ في كلِّ شاشة (V17.23) ═══
   بعضُ الشاشات لها بحثُها وأكثرُها بلا بحث، فيُلجَأ إلى بحث المتصفّح — وهو
   يجد ولا يُخفي، ولا يعمل على ما طُوي. فصار لكلِّ صفحةٍ صندوقٌ في رأسها. */
{
  const raw = readFileSync('index.html', 'utf8');
  const jsx = /<script[^>]*>([\s\S]*?)<\/script>/.exec(raw)[1];
  check(/id="pgQ"/.test(jsx) && /function pageHead\(/.test(jsx) && jsx.indexOf('id="pgQ"') > jsx.indexOf('function pageHead('),
    'صندوقُ البحث في رأس الصفحة المشترك — فيَظهر في كلِّ شاشة');
  check(/e\.target\.id === 'pgQ'/.test(jsx) && /\} else pgFind\(PG_Q\);/.test(jsx),
    'والكتابةُ تُصفّي المعروضَ في اللحظة حين لا بحثَ للشاشة');
  check(/if \(typeof pgFind === 'function' && PG_Q && !pgBindOf\(\)\)/.test(jsx),
    'ويُعاد الترشيحُ بعد كلِّ رسمٍ فلا يعود المخفيّ');
  /* V17.33: الانتقالُ الموجَّهُ إلى نقطةٍ يستثني نفسَه بـPG_KEEP — والقاعدةُ
     المحروسةُ أن تبديلَ الصفحة يمسح البحثَ، لا صيغةُ الشرط حرفًا. */
  check(/if \(wasCur !== CUR[^)]*\)\{[\s\S]{0,200}PG_Q = '';/.test(jsx), 'ويُمسَح عند تبديل الصفحة — بحثُ صفحةٍ لا يتبع غيرَها');
  check(/PG_KEEP = false;/.test(jsx), 'والاستثناءُ الموجَّهُ يدوم انتقالًا واحدًا لا أكثر');
  check(/e\.key === 'f' \|\| e\.key === 'F'/.test(jsx), 'وCtrl\u200F+F يفتحه بدل بحث المتصفّح');
  /* ═══ وحيث للشاشة بحثُها، يقوده الصندوقُ لا يزاحمه (V17.24) ═══ */
  const bindBlock = /var PG_BIND = \{([\s\S]*?)\n\};/.exec(jsx);
  const bound = bindBlock ? [...bindBlock[1].matchAll(/(\w+):\s*function/g)].map(m => m[1]) : [];
  check(bound.length >= 15, `وصندوقُ الرأس يقود بحثَ الشاشة الحقيقيَّ حيث وُجد (${bound.length} شاشة)`);
  ['svappr','minappr','survey','wbs','wtask','users','ev','sites','co'].forEach(p => {
    if (bound.indexOf(p) < 0) check(false, 'شاشةٌ لها بحثُها ولم تُربَط: ' + p);
  });
  check(/PG_LAST_BIND\(''\)/.test(jsx), 'ويُمسَح بحثُ الشاشة عند مغادرتها — فلا تعود مُرشَّحةً بلا علم');
  /* ═══ البؤرةُ تبقى في الحقل عبر إعادة الرسم (V17.38) ═══ */
  check(/function focusGrab\(\)/.test(jsx) && /function focusBack\(g\)/.test(jsx) && /focusBack\(FOCUS_G\);/.test(jsx),
    'والبؤرةُ وموضعُ المؤشِّر يُلتقَطان قبل الرسم ويُعادان بعده — فيُكتَب حرفٌ بعد حرفٍ بلا ضغطِ الحقل');
  check(/var FOCUS_G = focusGrab\(\);/.test(jsx), 'ويُلتقَطان في أوّل الرسم لا بعد بناء الشاشة');
  /* ═══ لوحُ الرسم لا يبتلع الشاشة ولا يُخفي الخريطة (V17.48) ═══ */
  check(/\.map-route-box \.grid\.cols-2\{grid-template-columns:1fr 1fr!important/.test(raw),
    'ولوحُ الرسم يبقى عمودين على الهاتف — لا أربعةَ صفوفٍ تبتلع الشاشة');
  check(/\.map-route-box\{[^}]*max-height:34vh/.test(raw), 'وسقفُه ثلثُ الشاشة بتمريرٍ داخليّ');
  check(/body\.drawing \.map-fab[\s\S]{0,60}display:none!important/.test(raw),
    'والأزرارُ العائمةُ تختفي أثناء الرسم فلا تحجب موضعَ الضغط');
  check(/function drawFlag\(\)/.test(jsx) && (jsx.match(/drawFlag\(\);/g) || []).length >= 4,
    'وعلامةُ الرسم تُرفَع وتُنزَل مع بدء الرسم وانتهائه');
  check(/L\.polyline\(pts, \{ color:'#FF8C42'/.test(jsx) && /L\.polygon\(pts, \{ color:'#FF8C42'/.test(jsx),
    'وما يُرسَم يُرى: خطُّ المسار ومضلَّعُ المساحة على الخريطة');
  check(/gen\.slice\(0, 600\)\.forEach/.test(jsx), 'ونقاطُ التوليد تُعرَض قبل الحفظ');
  check(/PG_Q \? 5000 :/.test(jsx), 'وسقفُ الصفوف يرتفع أثناء البحث فلا يختبئ المطلوبُ خلفه');
}

console.log('جردُ الصفحات نظيف — لا شاشةَ ميتةٌ ولا معزولة ✅');
