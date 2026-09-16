/* ═══════════════════════════════════════════════════════════════════════════
   جردُ القراءات — node scripts/audit-reads.mjs
   ───────────────────────────────────────────────────────────────────────────
   كلُّ وثيقةٍ تُقرأ من القاعدة تُحسَب على المشروع مالًا ووقتًا، والفاتورةُ لا
   تأتي إلا آخرَ الشهر — فلا يُكتشَف التسرّبُ إلا متأخرًا. فهنا حوكمةٌ في
   الشيفرة لا في الفاتورة (V17.8):
     ١ · لا قراءةَ مجموعةٍ بلا سقف: كلُّ `collection(x).get()` إمّا على وثيقةٍ
         بعينها (`.doc(...)`) وإمّا بسقفٍ `.limit(n)` — فلا مجموعةَ تُسحَب
         كاملةً لأنها اليومَ صغيرة.
     ٢ · ولا استماعٍ حيٍّ على مجموعةٍ بلا سقفٍ أو مرشِّح: المستمعُ يقرأ عند
         كلِّ تغيّرٍ، فمجموعةٌ بلا حدٍّ تُقرأ مرارًا بلا أن يطلبها أحد.
     ٣ · وسقوفُ السحب الباردِ معلومةٌ ومعقولة — فلا سقفَ بعشرات الآلاف يُسمّى
         سقفًا وهو لا يقطع.
     ٤ · وما يُقرأ يُحصى: كلُّ مسارِ قراءةٍ يزيد عدّادَ القراءات، فيُرى ما
         يكلّف في شاشة المزامنة قبل أن يُرى في الفاتورة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n);
  if (!c){ bad++; console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const html = readFileSync('index.html', 'utf8');
const js = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];

/* ١ · قراءةُ المجموعات */
const gets = [...js.matchAll(/collection\('(\w+)'\)([\s\S]{0,260}?)\.get\(/g)];
const unbounded = gets.filter(m => !/\.doc\(/.test(m[2]) && !/\.limit\(\d+\)/.test(m[2]));
T(unbounded.length === 0,
  `كلُّ قراءةِ مجموعةٍ بوثيقةٍ بعينها أو بسقف (${gets.length} قراءة)`
  + (unbounded.length ? ' — بلا سقف: ' + [...new Set(unbounded.map(m => m[1]))].join(' · ') : ''));

/* ٢ · الاستماعُ الحيّ */
const subs = [...js.matchAll(/collection\('(\w+)'\)([\s\S]{0,260}?)\.onSnapshot\(/g)];
const openSubs = subs.filter(m => !/\.doc\(/.test(m[2]) && !/\.limit\(\d+\)/.test(m[2]) && !/\.where\(/.test(m[2]));
T(openSubs.length === 0,
  `وكلُّ استماعٍ حيٍّ محدودٌ بوثيقةٍ أو مرشِّحٍ أو سقف (${subs.length} مستمعًا)`
  + (openSubs.length ? ' — مفتوح: ' + [...new Set(openSubs.map(m => m[1]))].join(' · ') : ''));

/* ٣ · السقوفُ معقولة */
const caps = [...js.matchAll(/\.limit\((\d+)\)/g)].map(m => +m[1]);
const huge = caps.filter(n => n > 6000);
T(huge.length === 0, `وأعلى سقفٍ ${Math.max(...caps)} وثيقة — لا سقفَ صوريّ` + (huge.length ? ' — ' + huge.join(',') : ''));

/* ٤ · ما يُقرأ يُحصى */
const counted = (js.match(/FB\.readCount = \(FB\.readCount \|\| 0\) \+/g) || []).length;
T(counted >= gets.length - 4, `وعدّادُ القراءات يُحصي مساراتِ القراءة (${counted} موضعًا)`);
T(/readDelta\(/.test(js) && /where\('_at', '>', since\)/.test(js),
  'وسجلَّا الصور والصيانة يُسحبان فارقيًّا لا كاملَين في كلِّ إقلاع');

/* ٥ · ما يُعرَض للمستخدم */
T(/قراءاتُ هذه الجلسة|قراءات الجلسة/.test(js), 'وعددُ القراءات معروضٌ في شاشة المزامنة — يُرى ما يكلّف');

/* ═══ ٦ · النبضةُ بدل الاستطلاع (V17.26) ═══
   طزاجةٌ في ثوانٍ بلا استطلاعٍ كلَّ دقيقة: كتابةٌ واحدةٌ بعد كلِّ دفعةٍ
   ناجحة، ومستمعٌ على وثيقةٍ واحدة، وسحبٌ موجَّهٌ لما تغيّر وحدَه. */
T(/pulse: function\(kinds\)/.test(js) && /FB\.pulse\(Object\.keys\(kinds\)\)/.test(js),
  'كلُّ دفعةٍ ناجحةٍ تُنبِض بما تغيّر — كتابةٌ واحدة');
T(/collection\('settings'\)\.doc\('pulse'\)\.onSnapshot/.test(js), 'والأجهزةُ تُنصِت لوثيقةٍ واحدةٍ لا تكلّف وهي ساكنة');
T(/pullDelta\(\{ only:stale, why:'pulse' \}\)/.test(js), 'وتسحب المتغيّرَ وحدَه لا النطاقَ كلَّه');
T(!/every:60000\b/.test(js), 'ولا استطلاعَ كلَّ دقيقة — الطزاجةُ من النبضة والكلفةُ من التغيير');
/* ═══ ٧ · سقفُ القراءات لكلِّ جهاز ═══ */
T(/READ_CAP_WARN = 3000, READ_CAP_SLOW = 6000/.test(js) && /readSlowFactor\(\)/.test(js),
  'وجهازٌ يتجاوز سقفَه يُنبَّه ثم يُبطَّأ سحبُه الدوريّ');
/* ═══ ٨ · كلُّ مجموعةٍ في الشيفرة موثَّقةٌ بمرحلتها في سير العمل ═══ */
{
  const sch = JSON.parse(readFileSync('docs/api-schema.json', 'utf8'));
  const documented = Object.keys((sch.firestore || {}).collections || {});
  const m = /colOf: function\(kind\)\{\s*return \{([\s\S]*?)\}\[kind\]/.exec(js);
  const inCode = [...new Set([...(m ? m[1] : '').matchAll(/:'(\w+)'/g)].map(x => x[1]))];
  const missing = inCode.filter(c => documented.indexOf(c) < 0);
  T(missing.length === 0, `وكلُّ مجموعةٍ في الشيفرة موثَّقةٌ بمرحلتها (${inCode.length})` + (missing.length ? ' — بلا توثيق: ' + missing.join(' · ') : ''));
  T(documented.every(c => (sch.firestore.collections[c] || {}).stage), 'ولكلِّ مجموعةٍ مرحلةٌ مسمّاة');
}

/* ═══ ٩ · السجلُّ يقول من فعل ومتى (V17.26) ═══ */
T(/function logEvent\(what, site, who, when\)/.test(js) && /if \(who && who !== mine\) e\.rec = mine;/.test(js),
  'والحدثُ يحمل فاعلَه ووقتَ فعله — وصاحبُ الجهاز في «سُجِّل على»');
T(/by:opt\.actor \|\| STATE\.meta\.name/.test(js) && /at:\+opt\.at \|\| Date\.now\(\)/.test(js),
  'والإشعارُ كذلك — لا تُختَم إشعاراتُ اليوم كلِّها بلحظة فتح التطبيق');
T((js.match(/actor:\(v\.by \|\| v\._byName \|\| who\), at:at/g) || []).length >= 10,
  'وكلُّ إشعارِ وصولٍ يمرّر فاعلَ الوثيقة ووقتَها');

/* ═══ ١٠ · السجلُّ يُقرأ من القاعدة لا من ذاكرة الجلسة (V17.27) ═══ */
T(/collection\('events'\)\.orderBy\('ts', 'desc'\)\.limit\(500\)/.test(js) && /EV_FETCHED/.test(js),
  'وسجلُّ الأحداث يُجلَب من القاعدة بسقفِ خمسمئة');
T(/if \(evAll\(\)\.length < 50\) evFetch\(false\);/.test(js) && /data-evfetch/.test(js),
  'مرةً عند فتح الشاشة إن قلَّ ما بيدها — وبزرٍّ متى شئت');

console.log(bad ? `\nجردُ القراءات فشل ✗ (${bad})` : '\nلا مجموعةَ تُقرأ بلا سقف، وما يُقرأ يُحصى ✅');
process.exit(bad ? 1 : 0);
