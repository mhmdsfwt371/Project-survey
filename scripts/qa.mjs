/* ═══════════════════════════════════════════════════════════════════════════
   لجنةُ الفحص — تُشغَّل: node scripts/qa.mjs
   ───────────────────────────────────────────────────────────────────────────
   ألفٌ ومئةٌ وثمانيةٌ وتسعون فحصًا بُنيت لـV14 عاشت في /tmp وماتت مع الحاوية،
   فلم يبقَ منها حرف. فمن اليوم تعيش الفحوصُ في المستودع مع ما تفحصه.

   الفحصُ يفتح التطبيقَ في متصفّحٍ صوريّ، ويدخل مهندسًا، ثم يفتح كلَّ صفحةٍ
   في القائمة ويتحقق أنها ترسم محتوًى فعليًّا — لا أنها «معرَّفة» فحسب.
   والفرقُ جوهريّ: render يبتلع الصفحةَ المفقودةَ ويفتح «نظرة عامة» بدلها،
   فالتعريفُ وحده لا يثبت أن الشاشة تعمل.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch {
  console.error('✗ jsdom غير مثبَّت. ثبّته أولًا:  npm i jsdom');
  process.exit(2);
}

let pass = 0; const fails = [];
const check = (cond, name) => { if (cond) pass++; else fails.push(name); };

const html = readFileSync('index.html', 'utf8');

/* ── فحوصُ المصدر: لا تحتاج تشغيلًا ─────────────────────────────────────── */
{
  const a = html.indexOf('var NAV = ['), b = html.indexOf('\n];', a);
  const nav = html.slice(a, b);
  const ids = [...nav.matchAll(/id:'([A-Za-z0-9_]+)'/g)].map(m => m[1])
    .concat([...nav.matchAll(/\['([A-Za-z0-9_]+)','/g)].map(m => m[1]));
  check(ids.length > 80, 'القائمة تحمل بنودها');
  check(new Set(ids).size === ids.length, 'لا معرّفَ مكرّرًا في القائمة');

  /* V14 يربط بالتفويض لا بـonclick السطريّ. فمعالجٌ يترصّد خاصيةً لا يصدرها
     الهيكلُ أبدًا زرٌّ ميت: يُنقَر فلا يقع شيء، ولا يشكو المتصفّح.
     والخصائصُ المنطقيةُ تُكتب بلا «=» — فالبحثُ عن «data-x=» وحدها يكذب. */
  check(!/onclick=/.test(html), 'لا onclick سطريًّا — الربطُ كلُّه بالتفويض');
  const listened = new Set([...html.matchAll(/closest\('\[(data-[\w-]+)\]'\)/g)].map(m => m[1]));
  const emitted = new Set([...html.matchAll(/(data-[\w-]+)(?==|[\s"'\\])/g)].map(m => m[1]));
  const deaf = [...listened].filter(a => !emitted.has(a));
  check(listened.size > 20, `المعالجاتُ المفوَّضة موجودةٌ لتُفحص (${listened.size})`);
  check(deaf.length === 0, 'كلُّ معالجٍ مفوَّضٍ يجد ما يصدره' + (deaf.length ? ` — الأصمّ: ${deaf.join(' ')}` : ''));

  /* سلسلةٌ نصيةٌ مكسورةٌ بسطرٍ جديد: أشهرُ سببٍ لـInvalid token */
  const broken = html.split('\n').filter(l =>
    /h\s*\+?=\s*'[^']*$/.test(l) && !/^\s*(\/\/|\/\*)/.test(l)
    && !l.trim().endsWith('+') && !l.trim().endsWith('\\'));
  check(broken.length === 0, 'لا سلسلةَ نصيةٍ مفتوحةً عند نهاية سطر');
}

/* ── فحوصُ التشغيل ──────────────────────────────────────────────────────── */
const vc = new (require('jsdom').VirtualConsole)();
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) errsBoot.push(String(e.message)); });
const errsBoot = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
                              url: 'https://x.test/', virtualConsole: vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
/* المتصفّحُ الصوريُّ ينقصه ما في المتصفّحات الحقيقية: مرمِّزُ النصوص الذي
   يُبنى به ملفُّ KMZ، وروابطُ الكائنات التي يُنزَّل بها الملف. وغيابُها يُظهر
   عطلًا في التطبيق وليس فيه عطل — فتُسدّ قبل أن يُتَّهم بريء. */
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (w.URL && !w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}

const errs = [];
w.addEventListener('error', e => errs.push(String(e.message || e.error)));

const wait = ms => new Promise(r => setTimeout(r, ms));

await wait(500);

const go = d.getElementById('lgGo');
check(!!go, 'شاشةُ الدخول موجودة');
if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
await wait(400);

check(!!d.getElementById('content'), 'حاويةُ المحتوى ظهرت بعد الدخول');
check(!!d.getElementById('nav'), 'القائمةُ الجانبية ظهرت');

const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')]
  .map(a => a.getAttribute('data-p')))];
check(ids.length > 40, `القائمةُ تعرض بنودَها (${ids.length})`);

/* كلُّ صفحةٍ تُفتح وترسم محتوًى — والعنوانُ يطابق الصفحةَ المطلوبةَ لا بديلَها */
const FULL = new Set(['map']);          /* الخريطةُ حاويةٌ ثابتةٌ خارج #content */
let drew = 0, blank = [], swapped = [];
for (const id of ids) {
  try {
    w.CUR = id;
    w.render(1);
    const body = d.getElementById('content');
    const has = FULL.has(id) || (body && body.innerHTML.trim().length > 40);
    if (has) drew++; else blank.push(id);

    const want = (w.FIELD_PAGES && w.FIELD_PAGES[id]) || (w.PAGE && w.PAGE[id]);
    const crumb = d.getElementById('crumb');
    if (want && crumb && crumb.textContent.trim() !== String(w.t ? w.t(want.t) : want.t).trim())
      swapped.push(id);
  } catch (e) { blank.push(id + ' (' + String(e.message).slice(0, 40) + ')'); }
}
check(blank.length === 0, `كلُّ صفحةٍ ترسم محتوًى (${drew}/${ids.length})` + (blank.length ? ` — الفارغ: ${blank.slice(0, 5).join(' ')}` : ''));
check(swapped.length === 0, 'لا صفحةَ تُستبدَل بغيرها صامتةً' + (swapped.length ? ` — ${swapped.slice(0, 5).join(' ')}` : ''));

/* «ما هذه الصفحة؟» يجيب عن كلِّ شاشةٍ بلا استثناء */
if (typeof w.helpOf === 'function') {
  const noHelp = ids.filter(id => !w.helpOf(id));
  check(noHelp.length === 0, 'لكلِّ صفحةٍ جوابُ «ما هذه الصفحة؟»' + (noHelp.length ? ` — ${noHelp.join(' ')}` : ''));
} else fails.push('مولّدُ الشرح helpOf غير متاح');

/* ── دورةُ «تسجيل موقع جديد» كاملةً ─────────────────────────────────────────
   شاشةٌ تُنشئ سجلًّا في القاعدة، فلا يكفي أن ترسم: يجب أن يمنع ناقصُها الحفظ،
   وأن تكون قائمةُ الشركات هي قائمةُ المشروع لا أسماءً مكتوبةً بيد. */
{
  const T = [];
  const realToast = w.toast;
  w.toast = m => T.push(String(m));
  const clk = sel => { const el = d.querySelector(sel); if (el) el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return !!el; };
  const last = () => T[T.length - 1] || '';

  check(Array.isArray(w.CO_LIST) && w.CO_LIST.length > 100,
    `القائمةُ الموحّدة من بيانات المشروع (${(w.CO_LIST||[]).length} شركة)`);

  w.CUR = 'newsite'; w.render(1);
  const C = d.getElementById('content');
  check(C.querySelectorAll('[data-nsphoto]').length === 5, 'خمسُ خاناتِ صورٍ في نموذج الموقع الجديد');
  check(C.querySelectorAll('.req').length >= 5, 'الحقولُ الإلزاميةُ موسومةٌ بنجمة');

  T.length = 0; clk('[data-nssave]');
  check(/موضعك/.test(last()), 'الحفظُ بلا موضعٍ ممنوع');
  w.NEWSITE.lat = 21.53; w.NEWSITE.lng = 39.18;
  T.length = 0; clk('[data-nssave]');
  check(/المربع/.test(last()), 'الحفظُ بلا مربعٍ ممنوع');
  w.NEWSITE.sq = '7-14'; w.NEWSITE.sign = 'abc';
  T.length = 0; clk('[data-nssave]');
  check(/الصيغة/.test(last()), 'صيغةُ الشاخص مفحوصة');
  w.NEWSITE.sign = '57/2'; w.NEWSITE.co = 'شركةٌ لا وجودَ لها';
  T.length = 0; clk('[data-nssave]');
  check(/الموحّدة/.test(last()), 'شركةٌ خارج القائمة مرفوضة');

  w.NEWSITE.co = w.CO_LIST[0];
  T.length = 0; clk('[data-nssave]');
  check(/صورة/.test(last()), 'صورةُ الشاخص إلزامية');

  w.render(1);
  check(clk('[data-nsco]') && w.NS_CO_OPEN === true, 'منتقي الشركات يفتح');
  check(d.querySelectorAll('[data-nscopick]').length === w.CO_LIST.length, 'المنتقي يعرض القائمة كاملة');
  clk('[data-nscopick]');
  check(w.NS_CO_OPEN === false && w.CO_LIST.indexOf(w.NEWSITE.co) > -1, 'الاختيارُ يغلق اللوحَ ويثبّت الشركة');

  w.NEWSITE.photos[0] = { size: 40000, d:'x' };
  const before = w.STATE.sites.length;
  T.length = 0; clk('[data-nssave]');
  const rec = w.STATE.sites[w.STATE.sites.length - 1];
  check(w.STATE.sites.length === before + 1, 'الحفظُ الكاملُ يُنشئ السجل');
  check(rec && rec.approved === false && rec.isNew === true, 'السجلُّ يُوسَم جديدًا بانتظار الاعتماد');
  check(w.CUR === 'svForm', 'يُفتَح نموذجُ المسح على الموقع الجديد');

  w.toast = realToast;
}

check(errs.length === 0 && errsBoot.length === 0, 'لا خطأَ تشغيلٍ أثناء فتح الشاشات' + (errs.length ? ` — ${errs[0].slice(0, 70)}` : ''));

/* ── الحصاد ────────────────────────────────────────────────────────────── */
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) { fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('لجنةُ الفحص خضراء ✅');
process.exit(0);
