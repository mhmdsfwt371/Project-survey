/* ═══ جردُ اللغة — لا حرفَ عربيٍّ يبقى حين تُختار الإنجليزية ═══
   الحارسُ القائم (check-version) يفحص نصوصَ `t('…')` وحدَها، وهي التي تمرُّ
   بالمترجم أصلًا. أما ما لا يمرُّ به فلا يراه أحد: الهيكلُ الثابتُ في HTML
   خارج `render()` — الشريطُ العلويُّ وخصائصُ الوصولية — بقي عربيًّا في كلِّ
   اللغات حتى اكتُشف بالعين. فبُني هذا.

   يفحص ثلاثةً:
   ١ — كلُّ نصٍّ عربيٍّ في الهيكل الثابت إمّا موسومٌ بـdata-i18n أو مُستثنًى
       بسببٍ مكتوب.
   ٢ — كلُّ وسمٍ تعريفيٍّ له مقابلٌ في القاموسين.
   ٣ — نصوصُ `<option>` لا تُترجَم: نصُّ الخيار هو القيمةُ المخزَّنة، وترجمتُه
       تكتب في القاعدة قيمةً لا يعرفها أحد. */

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const AR = /[\u0600-\u06FF]/;
let ok = 0, bad = 0;
const fail = [];
function check(cond, msg){ if (cond){ ok++; console.log('  ✓ ' + msg); }
                           else { bad++; fail.push(msg); console.log('  ✗ ' + msg); } }

const shell = src.slice(0, src.indexOf('<script'));

/* ما يبقى عربيًّا في كلِّ اللغات بقرارٍ لا بسهو — وكلُّ سطرٍ سببُه معه */
const KEEP_AR = {
  'قارئات نُسُك — حج ١٤٤٨هـ': 'اسمُ المشروع الرسميُّ — عَلَمٌ لا يُترجَم',
  'قارئات نُسُك':             'اسمُ المشروع',
  'حج ١٤٤٨هـ':                'اسمُ الموسم الرسمي',
  'محمد صفوت':                'اسمُ شخصٍ — لا يُترجَم',
  'العربية':                  'اسمُ اللغة يُكتَب بلغته في منتقي اللغات',
  'اردو':                     'اسمُ اللغة يُكتَب بلغته',
  'ع':                        'رمزُ العربية في زرِّ اللغة — يُبدَّل برمجيًّا',
  'اُر':                       'رمزُ الأردية في زرِّ اللغة'
};
const VER = /^نسخة V\d+\.\d+$/;   /* «نسخة V14.96» — الرقمُ يُختَم آليًّا */

console.log('\n══ ١ · الهيكلُ الثابتُ موسومٌ أو مُستثنًى بسبب ══');
const texts = [...shell.matchAll(/>([^<>{}]*[\u0600-\u06FF][^<>{}]*)</g)]
  .map(m => m[1].trim()).filter(Boolean);
const bareText = [...new Set(texts)].filter(x => !KEEP_AR[x] && !VER.test(x));
check(bareText.length === 0,
  bareText.length ? `نصوصٌ عربيةٌ في الهيكل بلا وسمٍ ولا استثناء (${bareText.length}): ${bareText.join(' · ')}`
                  : `نصوصُ الهيكل كلُّها موسومةٌ أو مُستثناةٌ بسبب (${Object.keys(KEEP_AR).length} استثناء)`);

const attrs = [...shell.matchAll(/(title|placeholder|aria-label)="([^"]*[\u0600-\u06FF][^"]*)"/g)];
const unmarked = attrs.filter(a => {
  /* العنصرُ الحاملُ للخاصية: يُقتطَع ما حولها ليُفتَّش فيه عن وسمها */
  const i = shell.lastIndexOf('<', a.index);
  const j = shell.indexOf('>', a.index);
  const el = shell.slice(i, j + 1);
  const key = a[1] === 'aria-label' ? 'data-i18n-aria'
            : a[1] === 'title'      ? 'data-i18n-title' : 'data-i18n-ph';
  return !el.includes(key);
});
check(unmarked.length === 0,
  unmarked.length ? `خصائصُ وصوليةٍ عربيةٌ بلا وسم (${unmarked.length}): ${unmarked.map(a => a[1] + '=' + a[2]).join(' · ')}`
                  : `كلُّ خصائص الهيكل العربية موسومة (${attrs.length} خاصية)`);

console.log('\n══ ٢ · كلُّ وسمٍ له مقابلٌ في القاموسين ══');
const KEYS = /'((?:[^'\\]|\\.)*)'\s*:\s*'/g;
function dict(name){
  const i = src.indexOf('var ' + name + ' = {');
  if (i < 0) return [new Set(), new Set()];
  const seg = src.slice(i);
  const mu = /\n\s*ur\s*:\s*\{/.exec(seg);
  if (!mu) return [new Set(), new Set()];
  const end = /\n\}\n\};/.exec(seg.slice(mu.index));
  const grab = x => new Set([...x.matchAll(KEYS)].map(m => m[1]));
  return [grab(seg.slice(0, mu.index)),
          grab(seg.slice(mu.index, mu.index + (end ? end.index : seg.length)))];
}
const [e1, u1] = dict('D'), [e2, u2] = dict('D2');
const EN = new Set([...e1, ...e2]), UR = new Set([...u1, ...u2]);
const marks = [...new Set([...src.matchAll(/data-i18n(?:-title|-aria|-ph)?="([^"]+)"/g)].map(m => m[1]))];
const noEn = marks.filter(k => AR.test(k) && !EN.has(k));
const noUr = marks.filter(k => AR.test(k) && !UR.has(k));
check(noEn.length === 0 && noUr.length === 0,
  (noEn.length || noUr.length)
    ? `وسومٌ بلا ترجمة — en:${noEn.join('، ')} · ur:${noUr.join('، ')}`
    : `الوسومُ كلُّها مترجمة (${marks.length} وسمًا)`);

console.log('\n══ ٣ · نصُّ الخيار قيمةٌ مخزَّنة لا نصٌّ يُترجَم ══');
/* `'<option>' + esc(t(x))` يكتب في القاعدة قيمةً مترجمةً لا يعرفها الكود */
const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(src) || ['',''])[1];
/* الخيارُ بـ`value=` مستقلٍّ آمن: النصُّ للعرض والقيمةُ للتخزين. والخطرُ
   في الخيار بلا value — قيمتُه نصُّه، فترجمتُه تكتب في القاعدة قيمةً
   لا يعرفها الكودُ ولا القواعد. */
const badOpt = [...js.matchAll(/<option(?![^>]*value=)[^>]*>'\s*\+\s*esc\(\s*t\(/g)];
check(badOpt.length === 0,
  badOpt.length ? `خياراتٌ تُترجَم فتفسد القيمةَ المخزَّنة (${badOpt.length})`
                : 'لا خيارَ يُترجَم — القيمُ المخزَّنة سالمة');

console.log('\n══ ٤ · النصوصُ غير المباشرة — ما لا يراه فاحصُ t() ══');
/* الحارسُ القديم يفحص t('…') المباشرة وحدَها. وأكثرُ ما يُعرَض لا يُكتَب
   هكذا: card('عنوان',…) وtable(['رأس',…]) وstats([['بند',N(x)]])
   وPAGE.x = { t:'اسم', l:'وصف' } — كلُّها تمرُّ بـt() داخليًّا. فبقيت
   مئاتٌ بلا ترجمةٍ والحارسُ يقول «كاملة». يُقاس هنا العددُ ويُمنَع نموُّه. */
const LIT = String.raw`'((?:[^'\\]|\\.)*)'`;
const seen = new Set();
const push = a => a.forEach(x => { if (AR.test(x) && x.length > 1) seen.add(x); });
push([...src.matchAll(new RegExp(String.raw`\b(?:card|cardFlush|alertBox|btn|pill)\(\s*` + LIT, 'g'))].map(m => m[1]));
push([...src.matchAll(new RegExp(String.raw`\b(?:table|stats)\(\s*\[([^\]]*)\]`, 'g'))]
      .flatMap(m => [...m[1].matchAll(new RegExp(LIT, 'g'))].map(x => x[1])));
push([...src.matchAll(new RegExp(String.raw`\[\s*` + LIT + String.raw`\s*,\s*N\(`, 'g'))].map(m => m[1]));
push([...src.matchAll(new RegExp(String.raw`PAGE\.\w+ = \{ m:` + LIT + `, t:` + LIT, 'g'))].flatMap(m => [m[1], m[2]]));
push([...src.matchAll(new RegExp(String.raw`\bl:\s*` + LIT, 'g'))].map(m => m[1]));
push([...src.matchAll(new RegExp(String.raw`\['\w+',\s*` + LIT + String.raw`\]`, 'g'))].map(m => m[1]));
const gap = [...seen].filter(k => !EN.has(k));
/* سقفٌ يهبط ولا يرتفع: كلُّ إصدارٍ يُترجم دفعةً فيُخفَّض الرقمُ هنا */
const CAP = 559;
console.log(`  \u00b7 نصوصٌ غيرُ مباشرة: ${seen.size} · بلا ترجمة: ${gap.length} · السقف: ${CAP}`);
check(gap.length <= CAP,
  gap.length <= CAP ? `الفجوةُ غيرُ المباشرة تحت السقف (${gap.length}/${CAP}) — تُخفَّض دفعةً كلَّ إصدار`
                    : `الفجوةُ كبرت: ${gap.length} والسقفُ ${CAP} — ترجم قبل الدفع`);


console.log(`\nنجح ${ok} · فشل ${bad}`);
if (bad){ console.log('\nجردُ اللغة فشل ✗'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('جردُ اللغة نظيف — لا حرفَ عربيٍّ يبقى بلا قرار ✅');
