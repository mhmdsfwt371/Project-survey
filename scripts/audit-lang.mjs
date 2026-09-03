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


console.log('\n══ ٥ · الأرديةُ تكافئ الإنجليزية ══');
/* الأرديةُ تُكتَب بالحرف العربيِّ نفسِه، فلا يميّزها فاحصُ الرندر: «برآمد»
   أرديةٌ صحيحةٌ يعُدُّها عربيًّا باقيًا. فالفحصُ الصحيحُ لها ليس الرندرَ بل
   التكافؤ: كلُّ مفتاحٍ له إنجليزيةٌ له أرديةٌ ولا استثناء — فمن بدّل إلى
   الأردية لا يرى شاشةً نصفُها لغةٌ ونصفُها أخرى. */
function side(name, L){
  const i = src.indexOf('var ' + name + ' = {');
  if (i < 0) return {};
  const g = src.slice(i, src.indexOf('\n};', i));
  const mu = /\nur:\s*\{/.exec(g);
  if (!mu) return {};
  const seg = L === 'en' ? g.slice(0, mu.index) : g.slice(mu.index);
  const o = {};
  [...seg.matchAll(/'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)].forEach(m => { o[m[1]] = m[2]; });
  return o;
}
const enD = Object.assign({}, side('D2','en'), side('D','en'));
const urD = Object.assign({}, side('D2','ur'), side('D','ur'));
const gapUr = Object.keys(enD).filter(k => !(k in urD));
const gapEn = Object.keys(urD).filter(k => !(k in enD));
console.log(`  \u00b7 en: ${Object.keys(enD).length} · ur: ${Object.keys(urD).length}`);
check(gapUr.length === 0 && gapEn.length === 0,
  (gapUr.length || gapEn.length)
    ? `القاموسان غيرُ متكافئين — بلا أردية: ${gapUr.length} · بلا إنجليزية: ${gapEn.length}`
    : `القاموسان متكافئان تمامًا (${Object.keys(enD).length} مفتاحًا لكلٍّ)`);

/* أرديةٌ هي العربيةُ حرفيًّا: بعضُها حقٌّ (٪ · م · مربع) وبعضُها سهوٌ */
const copied = Object.keys(urD).filter(k => urD[k] === k);
const CAP_COPIED = 11;
console.log(`  \u00b7 أرديةٌ تطابق العربيةَ حرفيًّا: ${copied.length} (السقف ${CAP_COPIED})`);
check(copied.length <= CAP_COPIED,
  copied.length <= CAP_COPIED
    ? 'المطابقُ حرفيًّا محصورٌ — وحداتٌ ورموزٌ لا تُترجَم'
    : `مطابقٌ حرفيًّا كبر: ${copied.join(' · ')}`);

console.log('\n══ ٦ · كلُّ دالةِ عرضٍ تمرِّر نصَّها بالمترجم ══');
/* بُني هذا بعد أن ظهر أن `table()` تترجم رؤوسَها ولا تترجم خلاياها،
   فبقيت أربعُمئةِ خليةٍ عربيةً وترجماتُ دفعاتٍ كاملةٍ بلا أثر. فالقاعدةُ
   الآن: كلُّ دالةٍ تبني HTML من نصٍّ تمرّره بـt() أو cellT() أو تُفوّض
   إلى دالةٍ تفعل — ومن أضاف دالةَ عرضٍ جديدةً نسيها، أمسكه هذا. */
const RENDERERS = {
  card:'title', cardFlush:'title', alertBox:'txt', btn:'label', pill:'txt',
  stat:'k + v', table:'head + cells', flow:'steps', meter:'label'
};
const DELEGATES = { stats:'stat', halves:'cardFlush + table' };
const unwired = [];
Object.keys(RENDERERS).forEach(f => {
  const m = new RegExp('^function ' + f + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}', 'm').exec(src);
  if (!m){ unwired.push(f + ' (مفقودة)'); return; }
  if (!/esc\(t\(|cellT\(|\bt\(/.test(m[0])) unwired.push(f);
});
Object.keys(DELEGATES).forEach(f => {
  const m = new RegExp('^function ' + f + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}', 'm').exec(src);
  if (!m){ unwired.push(f + ' (مفقودة)'); return; }
  const to = DELEGATES[f].split(' + ')[0];
  if (!new RegExp('\\b' + to + '\\(').test(m[0])) unwired.push(f + ' (لا تفوّض إلى ' + to + ')');
});
check(unwired.length === 0,
  unwired.length ? `دوالُّ عرضٍ لا تمرِّر نصَّها بالمترجم: ${unwired.join(' · ')}`
                 : `كلُّ دوالِّ العرض تمرِّر نصَّها (${Object.keys(RENDERERS).length} مباشرةً · ${Object.keys(DELEGATES).length} بالتفويض)`);

/* cellT: النصُّ الصرفُ يُترجَم وما فيه وسمٌ يُترك — القاعدةُ التي منعت
   كسرَ الأزرار والشارات حين صارت الخلايا تُترجَم */
const cell = /^function cellT\([\s\S]*?\n\}/m.exec(src);
check(!!cell && /indexOf\('<'\)/.test(cell[0]) && /\bt\(/.test(cell[0]),
  cell ? 'cellT تحمي ما فيه وسمٌ وتترجم النصَّ الصرف' : 'cellT مفقودة — الخلايا بلا مترجم');

console.log('\n══ ٧ · صياغةُ الترجمة — مراجعةُ كاتبٍ تقنيّ ══');
/* الترجمةُ الموجودةُ ليست ترجمةً صحيحة. فُحصت أربعَ مرّاتٍ بالعين فوُجد
   في كلِّ مرّةٍ نمطٌ يتكرّر: قوسا الجمع `(s)` في أربعةَ عشرَ نصًّا —
   وهي تُلحَق برقمٍ دائمًا («٥ camp(s)») فلا تُقرأ ولا تُنطَق؛ وفراغٌ
   طرفيٌّ يكسر التنسيقَ حين تُضَمُّ؛ وقيمةٌ تساوي مفتاحَها فلم تُترجَم. */
const KV = /'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
function enSide(name){
  const i = src.indexOf('var ' + name + ' = {');
  if (i < 0) return {};
  const g = src.slice(i, src.indexOf('\n};', i));
  const mu = /\nur:\s*\{/.exec(g);
  if (!mu) return {};
  const o = {};
  [...g.slice(0, mu.index).matchAll(KV)].forEach(m => { o[m[1]] = m[2]; });
  return o;
}
const EN2 = Object.assign({}, enSide('D2'), enSide('D'));
/* ما تبقى فيه عربيةٌ بحق: عبارةُ التأكيد تُطابَق حرفًا بحرفٍ قبل التصفير،
   وشرحُ النقحرة يضرب مثالًا باسمٍ عربيٍّ ليُبيّن كيف يُقرأ بالإنجليزية —
   فحذفُ المثال يُفرغ الشرحَ من معناه. */
const KEEP = /مسح نهائي|يُنقحَر/;
const plural = [], spaced = [], same = [], arIn = [];
Object.entries(EN2).forEach(([a, e]) => {
  if (/\(s\)/.test(e)) plural.push(a);
  if (e !== e.trim() && !/—\s*$/.test(e)) spaced.push(a);
  if (e === a) same.push(a);
  if (AR.test(e) && !KEEP.test(a)) arIn.push(a);
});
check(plural.length === 0,
  plural.length ? `قوسا الجمع «(s)» في ${plural.length}: ${plural.slice(0,3).join(' · ')}`
                : 'لا قوسَي جمعٍ — الجمعُ صريحٌ يُقرأ ويُنطَق');
check(arIn.length === 0,
  arIn.length ? `عربيةٌ داخل الترجمة الإنجليزية (${arIn.length}): ${arIn.slice(0,3).join(' · ')}`
              : 'لا عربيةَ متسرّبةٌ في الإنجليزية (عدا عبارة التأكيد بقرار)');
check(same.length === 0,
  same.length ? `قيمةٌ تساوي مفتاحَها — لم تُترجَم (${same.length}): ${same.slice(0,3).join(' · ')}`
              : 'لا قيمةَ تساوي مفتاحَها');
const CAP_SPACED = 2;
console.log(`  \u00b7 فراغٌ طرفيٌّ: ${spaced.length} (السقف ${CAP_SPACED} — لواحقُ تركيبٍ مقصودة)`);
check(spaced.length <= CAP_SPACED,
  spaced.length <= CAP_SPACED ? 'الفراغُ الطرفيُّ محصورٌ في لواحق التركيب'
                              : `فراغٌ طرفيٌّ كبر: ${spaced.join(' · ')}`);

console.log(`\nنجح ${ok} · فشل ${bad}`);
if (bad){ console.log('\nجردُ اللغة فشل ✗'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('جردُ اللغة نظيف — لا حرفَ عربيٍّ يبقى بلا قرار ✅');
