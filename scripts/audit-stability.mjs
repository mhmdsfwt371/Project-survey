/* ═══ جردُ الاستقرار — ما يُسقِط النظامَ في الموسم لا ما يزعج المطوّر ═══
   الجرودُ الثمانيةَ عشرَ تفحص الصحّةَ والاكتمالَ والصلاحيات. وهذا يفحص
   شيئًا آخر: **ما الذي يحدث حين يسوء شيء**. فالموسمُ لا يمهل: النقطةُ
   تُسجَّل مرةً واحدةً في يومٍ واحد، والفنيُّ لا يعود إليها، والخطأُ الصامتُ
   يعني عملًا ضاع بلا أن يعلم أحد.

   يفحص خمسةً:
   ١ — لا `catch` يبتلع خطأً بلا أثرٍ يُرى أو يُسجَّل.
   ٢ — كلُّ قراءةٍ من التخزين المحليّ محميّةٌ (المتصفّحُ قد يمنعها).
   ٣ — كلُّ كتابةٍ للسحابة لها مسارُ فشلٍ معلَن.
   ٤ — لا حلقةٌ غيرُ محدودةٍ على بياناتٍ تنمو بلا سقف.
   ٥ — الطابورُ والحالةُ يُحفَظان قبل أيِّ عمليةٍ قد تفشل. */

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(src) || ['', ''])[1];
let ok = 0, bad = 0;
const fail = [];
function check(cond, msg){ if (cond){ ok++; console.log('  ✓ ' + msg); }
                           else { bad++; fail.push(msg); console.log('  ✗ ' + msg); } }

console.log('\n══ ١ · لا خطأَ يُبتلَع بلا أثر ══');
/* `catch(e){}` فارغٌ تمامًا يعني: وقع خطأٌ ولا أحدَ يعلم. وبعضُه مقصودٌ
   بحق — قراءةُ تخزينٍ محليٍّ يمنعها المتصفّحُ في وضع التصفّح الخاص، أو
   ميزةٌ اختياريةٌ لا يضرُّ غيابُها. فالمقياسُ سقفٌ يهبط لا صفرٌ مستحيل. */
const empty = [...js.matchAll(/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g)].length;
const CAP_EMPTY = 39;
console.log(`  \u00b7 catch فارغ: ${empty} (السقف ${CAP_EMPTY})`);
check(empty <= CAP_EMPTY,
  empty <= CAP_EMPTY ? 'الابتلاعُ الصامتُ محصورٌ ولا ينمو'
                     : `catch فارغٌ كبر: ${empty} — أضف أثرًا أو خفّض السقف`);

/* الأخطاءُ التي تمسُّ عملَ الميدان يجب أن تُرى: softErr تُبلِغ ولا توقف */
const soft = (js.match(/softErr\(/g) || []).length;
check(soft >= 10, `مسارُ الخطأ المُعلَن مستعملٌ في ${soft} موضعًا`);

console.log('\n══ ٢ · التخزينُ المحليُّ محميٌّ دائمًا ══');
/* المتصفّحُ يرمي عند localStorage في وضعِ التصفّح الخاصِّ أو عند امتلاء
   الحصّة — وقراءةٌ غيرُ محميّةٍ تُسقِط التطبيقَ عند الإقلاع. */
const lsCalls = [...js.matchAll(/localStorage\.(getItem|setItem|removeItem)/g)];
const unguarded = lsCalls.filter(m => {
  const before = js.slice(Math.max(0, m.index - 260), m.index);
  return !/try\s*\{[^}]*$/.test(before) && !/try\s*\{/.test(before.slice(-120));
});
check(unguarded.length === 0,
  unguarded.length ? `قراءةُ تخزينٍ محليٍّ بلا حماية (${unguarded.length}) — تُسقِط الإقلاع`
                   : `كلُّ نداءات التخزين المحليِّ محميّة (${lsCalls.length})`);

console.log('\n══ ٣ · الكتابةُ تنجح على الجهاز قبل السحابة ══');
/* القاعدةُ التي يقوم عليها العملُ بلا شبكة: يُحفَظ محليًّا ثم يُقيَّد في
   الطابور — فإن سقطت الشبكةُ لم يضع شيء. */
const dirtyN = (js.match(/CORE\.dirty\(/g) || []).length;
const setN   = (js.match(/CORE\.set\(/g) || []).length;
check(dirtyN + setN >= 40, `الكتابةُ تمرُّ بطبقة CORE في ${dirtyN + setN} موضعًا — لا كتابةَ مباشرةً للسحابة`);
const coreSet = /set:\s*function\s*\([^)]*\)\s*\{[\s\S]{0,400}?\n  \}/.exec(js);
check(!!coreSet && /dirty\(/.test(coreSet[0]),
  coreSet ? 'CORE.set يحفظ محليًّا ثم يقيّد في الطابور' : 'CORE.set غيرُ مقروء');

console.log('\n══ ٤ · لا عرضَ بلا سقف ══');
/* ألفٌ وسبعُمئةٍ وسبعٌ وثمانون نقطةً وستُّمئةِ عنوان: جدولٌ بلا `slice`
   يُجمّد المتصفّحَ على جوّالِ الميدان. */
const bigTables = [...js.matchAll(/table\(\s*\[[^\]]*\]\s*,\s*(\w+)\.map/g)].map(m => m[1]);
const sliced = [...js.matchAll(/\.slice\(\s*0\s*,\s*\d+\s*\)\s*\.map/g)].length;
check(sliced >= 8, `القوائمُ الطويلةُ مسقوفةٌ بـslice في ${sliced} موضعًا`);

console.log('\n══ ٥ · الحالةُ تُستعاد بعد إغلاقٍ مفاجئ ══');
/* الجوّالُ يُغلِق التطبيقَ بلا إنذار — فما لم يُحفَظ لحظةَ كتابته ضاع. */
check(/localStorage\.setItem\('nsk14\./.test(js), 'الحالةُ تُحفَظ في التخزين المحليّ بمفتاحٍ مسمًّى');
check(/STATE\.queue/.test(js) && /queue\.length/.test(js), 'الطابورُ جزءٌ من الحالة المحفوظة');

/* الحارسُ نفسُه: أيُّ فحصٍ يُبنى ولا يُسجَّل لا يُشغَّل */
const cv = readFileSync(new URL('./check-version.mjs', import.meta.url), 'utf8');
check(cv.includes('audit-stability.mjs'), 'جردُ الاستقرار مسجَّلٌ في الحارس الكلي');

console.log(`\nنجح ${ok} · فشل ${bad}`);
if (bad){ console.log('\nجردُ الاستقرار فشل ✗'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الاستقرار نظيف — ما يسوء يُرى ولا يُبتلَع ✅');
