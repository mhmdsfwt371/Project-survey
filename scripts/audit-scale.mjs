/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الاتساع — يُشغَّل: node scripts/audit-scale.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجرودُ الستةُ السابقةُ تفحص جهازًا واحدًا في لحظةٍ واحدة. ومئةٌ وخمسون
   جهازًا تعمل ستةَ أشهرٍ مسألةٌ أخرى: ما يصحّ مرةً قد ينهار مضروبًا في مئة.

   ثلاثةُ أشياءَ تُسقط نظامًا كهذا وهو «سليم» في كلِّ فحصٍ آخر:
     · قراءةٌ لا تُقصَر — فيقرأ كلُّ جهازٍ كتاباتِ الباقين، فتكبر القراءةُ
       بمربّع العدد وتُغلَق القاعدةُ عند الحدّ اليومي.
     · معرّفٌ غيرُ فريد — فيمحو جهازٌ كتابةَ جهازٍ آخر ولا يُعلَم.
     · أثرٌ لا يُحفَظ — فلا يُعرَف بعد شهرٍ من فعل ماذا ومتى.

   وهذا الجردُ يفحص المسارَ نفسَه لا النيّة: يقرأ الشيفرةَ الفعليةَ للسحب
   والدفع، ويحسب الحصةَ من مسارها، ويجرّب الفرادةَ ألفَ مرة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const html = readFileSync('index.html','utf8');
const rules = (() => { try { return readFileSync('firestore.rules','utf8'); } catch { return ''; } })();

/* ══ ١ · مسارُ القراءة مقصور ═════════════════════════════════════════════ */
{
  const i = html.indexOf('pull: function');
  const seg = html.slice(i, i + 1800);
  check(i > 0, 'دالةُ السحب موجودة');
  check(/where\('_at',\s*'>'/.test(seg), 'السحبُ فارقيٌّ بـ_at — لا يُعاد قراءةُ ما لم يتغيّر');
  check(/where\('_by',\s*'=='/.test(seg), 'الميدانُ مقصورٌ على سجلاته — لا يقرأ كتاباتِ غيره');
  check(/collection\('stats'\)/.test(seg) && /limit\(30\)/.test(seg),
    'اللوحةُ تُقرأ من اللقطات لا من السجلات الخام');
  /* القراءةُ الكاملةُ مشروعةٌ مرةً واحدةً: أوّلَ مزامنةٍ لمن يملك الكلَّ.
     والمطلوبُ أن تكون مشروطةً صراحةً لا أن تقع افتراضًا — فالفرقُ بينهما
     أن الأولى تقع مرةً والثانيةَ ثماني مراتٍ في اليوم لكلِّ جهاز. */
  check(/if \(!since && !mine\)/.test(seg),
    'السحبُ الكاملُ مشروطٌ بأوّل مزامنةٍ ولمن يملك الكلَّ وحده');
  check(/FB\.readCount/.test(seg), 'القراءةُ تُعَدُّ فتُرى الحصةُ لا تُظَنّ');
}

/* ══ ٢ · لكلِّ نوعٍ مجموعتُه ═════════════════════════════════════════════ */
{
  const kinds = [...new Set([...html.matchAll(/CORE\.(?:set|dirty)\(\s*'(\w+)'/g)].map(m => m[1]))];
  const i = html.indexOf('var col = {');
  const map = html.slice(i, html.indexOf('}[it.kind]', i));
  check(kinds.length > 5, `أنواعُ الكتابة (${kinds.length})`);
  const unmapped = kinds.filter(k => !new RegExp('\\b' + k + '\\s*:').test(map));
  check(unmapped.length === 0, 'كلُّ نوعٍ له مجموعةٌ مسمّاة'
    + (unmapped.length ? ' — بلا مجموعة: ' + unmapped.join(' · ') : ''));
  check(/console\.warn\('نوعٌ بلا مجموعة/.test(html), 'النوعُ المجهولُ يُشكى لا يُبتلَع');
  check(/match \/misc\/\{id\} \{ allow read, write: if false/.test(rules),
    'مجموعةُ misc مقفولةٌ في القواعد');
}

/* ══ ٣ · القواعدُ تعرف كلَّ مجموعةٍ تُكتَب ═══════════════════════════════ */
{
  const cols = [...new Set([...html.matchAll(/(\w+):'(\w+)'/g)]
    .filter(m => /recs|inss|tasks|inventory|purchases|settings|users|events|dismantles|newsites|coreqs|accounts|photos|stats/.test(m[2]))
    .map(m => m[2]))];
  check(cols.length > 8, `المجموعاتُ المكتوبة (${cols.length})`);
  const naked = cols.filter(c => !new RegExp('match /' + c + '/').test(rules));
  check(naked.length === 0, 'كلُّ مجموعةٍ تُكتَب لها قاعدةُ وصول'
    + (naked.length ? ' — بلا قاعدة: ' + naked.join(' · ') : ''));
  check(/match \/events\/\{id\}[\s\S]{0,180}allow update, delete: if false/.test(rules),
    'سجلُّ الأحداث لا يُعدَّل ولا يُحذَف — أثرٌ يُعدَّل لا يصلح جوابًا');
}

/* ══ ٤ · التشغيل: الفرادةُ واللقطةُ والأثر ═══════════════════════════════ */
const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
{
  const u = require('util');
  if (!w.TextEncoder) w.TextEncoder = u.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = u.TextDecoder;
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await new Promise(r => setTimeout(r, 400));

check(typeof w.DEV_ID === 'string' && w.DEV_ID.length > 6, 'للجهاز معرّفٌ ثابت');
{
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(w.uid36());
  check(seen.size === 2000, `ألفانِ من المعرّفات بلا تكرار (${seen.size})`);
  check([...seen].every(x => x.indexOf(w.DEV_ID) === 0), 'كلُّ معرّفٍ يحمل جهازَه — فيُعرَف من كتب');
}

/* الأثرُ يُرفَع لا يبقى في الذاكرة */
{
  const before = w.CORE.pending();
  w.logEvent('اختبارُ الأثر');
  check(w.CORE.pending() > before, 'سجلُّ الأحداث يدخل طابورَ الرفع');
  const e = w.STATE.events[0];
  check(!!e && !!e.id && !!e.ts && !!e.day && e.dev === w.DEV_ID,
    'للحدث معرّفٌ وطابعُ وقتٍ ويومٌ وجهاز');
}

/* اللقطةُ اليومية والتاريخ */
{
  const doc = w.rollupToday(true);
  check(!!doc && doc.day === new Date().toISOString().slice(0,10), 'اللقطةُ تُكتَب بيومها');
  check(doc && typeof doc.total === 'number' && typeof doc.daySurvey === 'number',
    'اللقطةُ تحمل الإجماليَّ وأعمالَ اليوم');
  check(!!(w.STATE.stats || {})[doc.day], 'اللقطةُ محفوظةٌ في الحالة');
  check(typeof w.statsHistory === "function" && Array.isArray(w.statsHistory(30)),
    'التاريخُ يُقرأ من اللقطات');
}

/* ══ ٥ · الحصةُ تُحسَب من المسار لا من التمنّي ═══════════════════════════ */
{
  const q = w.quotaEstimate();
  check(q && q.reads > 0 && q.writes > 0, 'التقديرُ يُنتج أرقامًا');
  check(q.readCap === 50000 && q.writeCap === 20000, 'الحدودُ المعلنةُ هي حدودُ الخطة');
  /* التقديرُ يجب أن يعكس المسار: لو عاد إلى ثابتٍ صغيرٍ فهو تمنٍّ لا حساب */
  const src = html.slice(html.indexOf('function quotaEstimate'), html.indexOf('function quotaEstimate') + 900);
  check(/STATE\.recs|STATE\.inss/.test(src), 'التقديرُ يقرأ حجمَ البيانات الفعليّ');
  check(!/reads\s*=\s*users\s*\*\s*\d+\s*;/.test(src), 'التقديرُ ليس ضربًا في ثابتٍ متفائل');
}

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الاتساع نظيف ✅');
process.exit(0);
