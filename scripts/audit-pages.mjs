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
  vers:      'سجلُّ الإصدارات — نصٌّ مرجعيٌّ لا بيانات تشغيل',
  cover:     'خريطةُ التغطية التنظيمية — تُقرأ من ORG الثابتة',
  miles:     'المعالمُ التعاقدية — جدولٌ مرجعيٌّ من العقد',
  repcenter: 'مركزُ التقارير — فهرسُ التقارير لا بياناتُها',
  sys:       'سلامةُ البيانات — يقرأ عبر دوالِّ فحصٍ لا STATE مباشرةً',
  chain:     'سلسلةُ التصعيد — تُقرأ من escRules في الإعدادات',
  setup:     'المواعيدُ والأزمنة — تُقرأ من CFG عبر cfgGet بأسماءٍ مركّبة',
  prep:      'نقاطُ التهيئة — تُولَّد عبر prepAsm() من الكتالوج',
  asm:       'نقاطُ التجميع — تُولَّد عبر prepAsm() من الكتالوج',
  fleetLog:  'سجلُّ السيارات — يُقرأ عبر دوالِّ الأسطول'
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
  'workReqList', 'bonusList', 'rollupBy', 'evRows', 'asnOf', 'solutionOf',
  'stockBalance', 'custodyByWho', 'scoreOf', 'stageList', 'vehList', 'vehOfWho',
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

console.log('\n══ ٣ · لا وعدَ معطَّلٍ بحجّةٍ صارت باطلة ══');
/* زرٌّ معطَّلٌ بعبارة «غيرُ مبنيٍّ بعد» بينما بناؤه تمّ — كان في mine وwos */
const excuses = [...src.matchAll(/title="([^"]*غيرُ مبنيٍّ بعد[^"]*)"/g)].map(x => x[1]);
console.log(`  \u00b7 أزرارٌ معطَّلةٌ بحجّة «غير مبني بعد»: ${excuses.length}`);
excuses.forEach(e => console.log('    — ' + e.slice(0, 70)));
check(excuses.length <= 2,
  `الحجّاتُ المعلَنةُ محصورة (${excuses.length}) — كلُّ واحدةٍ تُراجَع عند بناء ما تنتظره`);

console.log(`\nنجح ${ok} · فشل ${bad}`);
if (bad){ console.log('\nجردُ الصفحات فشل ✗'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الصفحات نظيف — لا شاشةَ ميتةٌ ولا معزولة ✅');
