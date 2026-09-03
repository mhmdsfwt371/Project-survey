/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سلامة البيانات — يُشغَّل: node scripts/audit-data.mjs
   ───────────────────────────────────────────────────────────────────────────
   دفترُ المطابقة يقيس ما يُقرأ على الشاشة. وقد كشفت V14.05 أن أخطرَ ما فات
   ليس زرًّا غائبًا بل عمودًا مقروءًا بمسطرةٍ خاطئة: ألفٌ وثلاثمئةٍ واثنان
   وتسعون مخيمًا حالتُهم «منطقة عرفات» بدل «لم يبدأ» — والشاشةُ لا تشكو، بل
   تعرض الرقمَ الخاطئَ بثقة.

   فهذا الجردُ يعيد بناءَ ما يجب أن يكون من `SITES_RAW` مباشرةً، ويقيس عليه
   ما بناه التطبيقُ فعلًا. الرقمُ الخاطئ في لوحة الوزارة أسوأ من زرٍّ مفقود.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (cond, name) => { if (cond) pass++; else fails.push(name); };
const eq = (a, b, name) => check(a === b, `${name} — المتوقَّع ${b} والموجود ${a}`);

const html = readFileSync('index.html', 'utf8');

/* ── صنفٌ يُستعمَل ولا وجودَ له في التنسيق ────────────────────────────────
   `btn-light` كان يُوسَم به زرُّ «موقعي» على الخريطة ولا تعريفَ له. فيخرج
   الزرُّ بلا خلفيةٍ ولا لونٍ محدَّد، فيرث لونَ ما تحته: أبيضَ على أبيضَ في
   الشكل الفاتح، ورماديًّا باهتًا في الداكن. والزرُّ الذي لا يُرى زرٌّ غيرُ
   موجود — ولا يشكو أحد، لأن الشيفرةَ سليمةٌ والصنفَ مكتوب.

   يُفحَص كلُّ صنفٍ يُمرَّر إلى `btn()` وكلُّ صنفٍ في `class="..."` من عائلةٍ
   معروفةٍ أن له قاعدةً في التنسيق. */
{
  /* الصنفُ قد يُقيَّد بخاصيةٍ أو بسليلٍ —  — فلا
     يكفي أن يليَه فاصلةٌ أو قوس. */
  const styled = new Set([...html.matchAll(/\.([a-z][\w-]*)(?=[\s,:{\[.>~+])/g)].map(m => m[1]));
  const FAMILIES = /^(btn|pill|chip|map|card|field|lg|lb|tb|nav)-/;
  const used = new Set();
  for (const m of html.matchAll(/btn\(\s*[^,]+,\s*'([^']+)'/g))
    String(m[1]).split(/\s+/).forEach(c => { if (c) used.add(c); });
  /* السلاسلُ المركّبةُ تُخرج شظايا كـ`map-chip'+(MAP_SAT?` — تُستبعَد */
  for (const m of html.matchAll(/class="([^"]{0,160})"/g))
    String(m[1]).split(/\s+/).forEach(c => {
      if (FAMILIES.test(c) && /^[a-z][\w-]*$/.test(c)) used.add(c);
    });
  const ghost = [...used].filter(c => FAMILIES.test(c) && !styled.has(c));
  check(used.size > 20, `أصنافُ العرض مقروءة (${used.size})`);
  check(ghost.length === 0, 'كلُّ صنفٍ يُستعمَل له قاعدةٌ في التنسيق'
    + (ghost.length ? ' — بلا تعريف: ' + ghost.join(' · ') : ''));
}

/* ── شاشةٌ تقرأ بيانةً مزروعةً ولها مصدرٌ حيّ ──────────────────────────────
   `DATA` بذرةٌ ثابتة: أرقامٌ ونصوصٌ كُتبت يومَ بُني الشكلُ ليُرى. وشاشةٌ تقرؤها
   تبدو صحيحةً — بل تكون صحيحةً يومَ كُتبت — ثم تتجمّد: يُسجَّل موقعٌ فلا يزيد
   عددُها، ويُنشَأ فنيٌّ فلا يظهر، وتُسجَّل حركةُ مخزونٍ فلا تُحسَب. ولا شيءَ
   يشكو، لأن الرقمَ معروضٌ وواثقٌ وخاطئ.

   فالمفاتيحُ التي لها مصدرٌ حيٌّ ممنوعةٌ من أجسام الشاشات. وما بقي بذرةً
   خالصةً — كتالوجٌ يُزرَع منه ثم يُحرَّر — يُعلَن هنا صراحةً. */
{
  /* لم يبقَ في أجسام الشاشات مفتاحٌ واحد. والبذرةُ تُقرأ في مكانٍ واحدٍ فقط:
     دالةٌ تنقلها إلى الحالة أولَ مرةٍ ثم لا تعود إليها. فالقائمةُ ضاقت إلى
     ما يُزرَع منه لا ما يُعرَض. */
  const SEED_ONLY = new Set([]);
  /* التعبيرُ الواحدُ لا يمسك أجسامًا متداخلةَ الأقواس — تُقتطع بموازنةٍ */
  const names = [...new Set([...html.matchAll(/^\s*PAGE\.(\w+)\s*=/gm)].map(m => m[1]))];
  const bodyOf = n => {
    const i = html.search(new RegExp('PAGE\\.' + n + '\\s*=\\s*\\{'));
    if (i < 0) return '';
    const st = html.indexOf('body:', i);
    if (st < 0) return '';
    let d = 0;
    for (let x = html.indexOf('{', st); x < html.length; x++){
      if (html[x] === '{') d++;
      else if (html[x] === '}'){ d--; if (!d) return html.slice(st, x + 1); }
    }
    return '';
  };
  /* كان الشرطُ «أكثرُ من أربعين شاشة» — رقمٌ يصلح يومَ كُتب ثم يكذب: الدمجُ
     يُنقص الشاشاتِ عمدًا فيسقط الجردُ على نجاح. الشرطُ الصحيح: كلُّ شاشةٍ
     معرَّفةٍ يُقرأ جسمُها — فما لا يُقرأ لا يُفحَص وهو المقصود. */
  const unread = names.filter(n => !bodyOf(n));
  check(names.length > 0 && unread.length === 0,
    `أجسامُ الشاشات مقروءة (${names.length})` + (unread.length ? ' — تعذّر: ' + unread.join('، ') : ''));
  const bad = [];
  names.forEach(n => {
    [...bodyOf(n).matchAll(/DATA\.(\w+)/g)].forEach(k => {
      if (!SEED_ONLY.has(k[1])) bad.push(n + ' · DATA.' + k[1]);
    });
  });
  check(bad.length === 0, 'لا شاشةَ تقرأ بيانةً مزروعةً لها مصدرٌ حيّ'
    + (bad.length ? ` (${bad.length}): ` + [...new Set(bad)].join(' · ') : ''));
}

/* ── الأعطالُ الحسّاسةُ لا تُبتلَع ────────────────────────────────────────
   `catch` فارغةٌ في فحص توفُّرٍ مشروعة: تخزينٌ يُمنَع في وضعٍ خاص، ورسمٌ على
   لوحةٍ لا يدعمها المتصفّح. لكنها في مسار البيانات تعني أن السحبَ يسقط ولا
   يُعلَم، فيفتح المكتبُ الشاشةَ فارغةً ويظنّ أن الميدانَ لم يعمل.

   فيُشترَط أن تمرَّ مساراتُ البيانات السبعةُ على `softErr` — تُسجَّل محليًّا
   وتُقال مرةً واحدةً لمن يستطيع التصرّف. */
{
  const NEEDED = ['سحب المستخدمين','سحب اللقطات','سحب \' + c','الاستماع الحيّ',
                  'تحديد الموقع','قراءة البيانات المحلية'];
  check(/function softErr\(/.test(html), 'سجلُّ الأعطال الصامتة موجود');
  check(/function softErrCard\(/.test(html), 'السجلُّ يُعرَض في شاشة المزامنة');
  const missing = NEEDED.filter(k => html.indexOf(k) < 0);
  check(missing.length === 0, 'مساراتُ البيانات تُسجّل أعطالَها'
    + (missing.length ? ' — بلا تسجيل: ' + missing.join(' · ') : ''));
  const calls = (html.match(/softErr\(/g) || []).length;
  check(calls >= 8, `مواضعُ التسجيل (${calls})`);
}

/* ── كلُّ مسارٍ يُدخِل التطبيقَ يُظهر هيكلَه ────────────────────────────────
   `#app` يبدأ `display:none`. فمن أخفى شاشةَ الدخول ولم يُظهر الهيكلَ ترك
   صفحةً فارغةً تمامًا: لا شاشةَ دخولٍ ولا تطبيق. ووقع هذا في `bootAuto`.

   والجرودُ كلُّها تتخطّى شاشةَ الدخول وتفحص ما بعدها — فلا واحدَ منها يرى
   هذا. فيُفحَص نصًّا: كلُّ دالةٍ تُخفي `login` يجب أن تُظهر `app`. */
{
  const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];
  const bodyOf = n => {
    const i = js.indexOf('function ' + n + '(');
    if (i < 0) return '';
    let d = 0;
    for (let x = js.indexOf('{', i); x < js.length; x++){
      if (js[x] === '{') d++;
      else if (js[x] === '}'){ d--; if (!d) return js.slice(i, x + 1); }
    }
    return '';
  };
  const names = [...js.matchAll(/^function\s+(\w+)\s*\(/gm)].map(m => m[1]);
  const bad = names.filter(n => {
    const b = bodyOf(n);
    /* يُخفي شاشةَ الدخول */
    if (!/login['"]\)[\s\S]{0,120}(display\s*=\s*['"]none|\.remove\(\))/.test(b)) return false;
    /* ويجب أن يُظهر الهيكلَ — مباشرةً أو بنداء `enterShell` */
    return !/enterShell\(\)|app['"]\)\.style\.display\s*=\s*['"]{2}/.test(b);
  });
  check(bad.length === 0, 'كلُّ مسارٍ يُخفي شاشةَ الدخول يُظهر الهيكل'
    + (bad.length ? ' — ' + bad.join(' · ') : ''));

  /* ولا `.then` بلا `.catch` في مسار الدخول: رفضٌ واحدٌ يعني شاشةً بيضاء */
  const ent = bodyOf('enterApp');
  check(!ent || /\.catch\(/.test(ent),
    'مسارُ الدخول محميٌّ برفضٍ يُلتقَط');
}

/* ── لا رقمَ محفورٌ في نصٍّ يُعرَض ──────────────────────────────────────
   «تهيئة المخيم ٢٣ نقطة والممر ٢١» و«١٦٢ شركة» و«١٧٨٧ نقطة»: أرقامٌ كُتبت في
   نصوصِ شرحٍ يومَ كانت صحيحة. ثم تتغيّر المواقعُ وتتغيّر الشركاتُ ويبقى النصُّ
   يقول ما كان — وهو أخطرُ من رقمٍ غائبٍ لأنه يُقرأ ولا يُشَكُّ فيه.

   والاستثناءُ سنةُ الموسم — ١٤٤٧ و١٤٤٨ — فهي اسمٌ لا عدّ. */
{
  const js2 = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];
  const YEARS = /^(١٤٤[0-9]|٢٠[٠-٩]{2}|٠١٢٣٤٥٦٧٨٩)$/;
  const bad = [];
  [...js2.matchAll(/'((?:[^'\\]|\\.){0,140})'/g)].forEach(m => {
    const txt = m[1];
    if (!/[\u0600-\u06FF]/.test(txt)) return;         /* ليس نصًّا عربيًّا */
    const nums = txt.match(/[٠-٩]{2,}/g);
    if (!nums) return;
    if (nums.every(n => YEARS.test(n))) return;        /* سنةُ الموسم */
    /* مفتاحُ قاموسٍ يُترجَم إليه — يُفحَص الأصلُ لا الترجمة */
    if (/':'/.test(js2.slice(m.index + m[0].length, m.index + m[0].length + 3))) {
      bad.push(txt.slice(0, 46));
    } else if (/esc\(t\('$/.test(js2.slice(Math.max(0, m.index - 8), m.index))) {
      bad.push(txt.slice(0, 46));
    }
  });
  check(bad.length === 0, 'لا رقمَ محفورٌ في نصٍّ يُعرَض'
    + (bad.length ? ' — ' + [...new Set(bad)].slice(0, 3).join(' · ') : ''));
}

/* ── ما تستعمله الجرودُ ليس ميتًا ولو لم يُنادَ في الملف ─────────────────
   حُذفت عشرُ دوالٍّ «ميتة» بمقياسٍ قرأ `index.html` وحدَه — وواحدةٌ منها
   `quotaEstimate` تستدعيها الجرودُ من ملفٍ آخر، فسقط جردُ الاتساع.

   والدرسُ أن حدودَ المقياس ليست حدودَ النظام: من قاس ملفًّا وحكم على مشروعٍ
   حكم بما لم يره. فيُقاس الاستعمالُ في الملفِّ وفي الجرود معًا. */
{
  const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];
  let aud = '';
  try {
    aud = readdirSync('scripts').filter(f => f.endsWith('.mjs'))
      .map(f => readFileSync('scripts/' + f, 'utf8')).join('\n');
  } catch (e){}
  const names = [...js.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
  const dead = names.filter(n => {
    const inApp = (js.match(new RegExp('\\b' + n + '\\b', 'g')) || []).length;
    const inAud = aud.indexOf('w.' + n) > -1 || aud.indexOf("'" + n + "'") > -1;
    return inApp < 2 && !inAud;
  });
  check(dead.length === 0, 'لا دالةَ معرَّفةٌ ولا تُستدعى في التطبيق ولا في الجرود'
    + (dead.length ? ' — ' + dead.join(' · ') : ''));
}

/* ── لا متغيّرَ يُستعمَل بلا تعريفٍ ولا احتياطيّ ─────────────────────────
   في CSS القيمةُ الغائبةُ ليست خطأً: تُترَك الخاصيةُ كأنها لم تُكتَب. فلا
   رسالةَ ولا تحذير — تبقى قائمةُ اللغة بلا خلفيةٍ فيُقرأ ما تحتها، ويرث
   رقمُ النسخة لونَ ما فوقه، ولا يظهر حدُّ الصفِّ المتأخّر.

   وهو أخفى من خطأٍ في الشيفرة: الشيفرةُ تنفجر فتُرى، والنمطُ يسكت. */
{
  const defined = new Set([...html.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
  const naked = [...new Set(
    [...html.matchAll(/var\(--([\w-]+)\s*([,)])/g)]
      .filter(m => m[2] === ')' && !defined.has(m[1]))
      .map(m => m[1])
  )];
  check(naked.length === 0, 'كلُّ متغيّرِ نمطٍ معرَّفٌ أو له احتياطيّ'
    + (naked.length ? ' — بلا شيء: ' + naked.join(' · ') : ''));
}

/* ── كلُّ لوحٍ له رأسٌ فيه إغلاقٌ وجسمٌ يُمرَّر ─────────────────────────────
   اللوحُ الذي يُمرَّر كلُّه يُغيّب زرَّ إغلاقه: من نزل في قائمةٍ طويلةٍ لم يجد
   كيف يخرج، فيضغط خارجَه فلا ينغلق، أو يعيد تحميلَ الصفحة. واللوحُ بلا زرِّ
   إغلاقٍ أصلًا سجنٌ صغير.

   والقاعدةُ تُفحَص لا تُوصى: كلُّ دالةٍ تُنشئ `class="pop"` يجب أن تُنشئ معها
   رأسًا وجسمًا وزرَّ إغلاقٍ في الرأس. */
{
  const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];
  const fns = [...js.matchAll(/function\s+(\w+)\s*\(/g)].map(m => m[1]);
  const bodyOf = n => {
    const i = js.indexOf('function ' + n + '(');
    if (i < 0) return '';
    let d = 0;
    for (let x = js.indexOf('{', i); x < js.length; x++){
      if (js[x] === '{') d++;
      else if (js[x] === '}'){ d--; if (!d) return js.slice(i, x + 1); }
    }
    return '';
  };
  const bad = [];
  fns.forEach(n => {
    const b = bodyOf(n);
    if (!/class="pop[ "]/.test(b)) return;            /* ليست منشئةَ لوح */
    const miss = [];
    if (!/class="pop-head"/.test(b)) miss.push('رأس');
    if (!/class="pop-body"/.test(b)) miss.push('جسم');
    /* الإغلاقُ يُعرَف بأثره لا باسمه: خاصيةٌ تُصفَّر أو صنفُ الإغلاق —
       فأسماءُ الخصائص تختلف بين لوحٍ وآخر، والقاعدةُ واحدة. */
    if (!/data-[\w-]+="0"|pop-x/.test(b)) miss.push('إغلاق');
    if (miss.length) bad.push(n + ' (' + miss.join('، ') + ')');
  });
  check(bad.length === 0, 'كلُّ لوحٍ له رأسٌ وجسمٌ يُمرَّر وزرُّ إغلاق'
    + (bad.length ? ' — ' + bad.join(' · ') : ''));
}

/* ── مصطلحٌ واحدٌ لمعنًى واحد ─────────────────────────────────────────────
   الترجمةُ ليست نقلَ كلمةٍ بكلمة، بل عقدٌ مع القارئ: إن قرأ `signpost` مرةً
   و`sign` أخرى ظنَّهما شيئين، وبحث عن الثاني فلم يجده. والمصطلحُ المتذبذبُ
   في وثيقةٍ تُعرَض على جهةٍ رسميةٍ يُقرأ إهمالًا لا اختصارًا.

   وهذه المصطلحاتُ الجوهريةُ لا تحتمل مرادفًا: ما بُني عليه العملُ يُسمّى
   باسمٍ واحدٍ في اللغات الثلاث. */
{
  const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];
  const pairs = (v, L) => {
    const i = js.indexOf('var ' + v + ' = {');
    if (i < 0) return [];
    const seg = js.slice(i, js.indexOf('\n};', i));
    const st = seg.search(new RegExp('\\n' + L + ':\\s*\\{'));
    if (st < 0) return [];
    const e = L === 'en' ? (seg.search(/\nur:\s*\{/) + 1 || seg.length) : seg.length;
    return [...seg.slice(st, e).matchAll(/'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)]
      .map(m => [m[1], m[2]]);
  };
  const en = [...pairs('D','en'), ...pairs('D2','en')];
  const ur = [...pairs('D','ur'), ...pairs('D2','ur')];

  /* [عربي, ممنوعٌ في الإنجليزية, لماذا] */
  const ONE = [
    ['شاخص', /\bsign\b(?!post)/i,  'signpost'],
    ['مربع', /\bsquare/i,           'block']
  ];
  ONE.forEach(([ar, bad, want]) => {
    const off = en.filter(([k, v]) => k.includes(ar) && bad.test(v));
    check(off.length === 0, `«${ar}» يُترجَم «${want}» وحدَها`
      + (off.length ? ` — خالف ${off.length}: ` + off[0][1].slice(0,40) : ''));
  });

  const urBad = ur.filter(([k, v]) => /جدا کرنا/.test(v));
  check(urBad.length === 0, '«الفك» في الأردو «ہٹانا» وحدَها'
    + (urBad.length ? ` — خالف ${urBad.length}` : ''));
}

/* ── لا تعريفَ يُكتَب مرتين ───────────────────────────────────────────────
   في جافاسكربت التعريفُ الثاني يغلب الأولَ صامتًا: لا خطأ، ولا تحذير. فتبقى
   الأولى شيفرةً ميتةً — وهذا أهونُ ما فيه. وأخطرُه أن يحمل الاسمُ معنيين:
   `techList` كانت تُعيد أسماءَ الفنيين في موضع، وكائناتِهم في موضعٍ آخر —
   والثانيةُ غلبت، فثلاثةُ نداءاتٍ تنتظر أسماءً أخذت كائناتٍ ورسمت
   «[object Object]» في قائمةٍ يختار منها المشرف.

   وكذلك مفتاحُ القاموس: يُترجَم مرتين بترجمتين، فالمعروضُ تابعٌ للترتيب لا
   للقصد. ومن راجع الملفَّ قرأ الأولى ورأى الثانية. */
{
  const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['',''])[1];

  const fns = {};
  [...js.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/gm)]
    .forEach(m => { fns[m[1]] = (fns[m[1]] || 0) + 1; });
  /* `row` وأمثالُها مساعداتٌ محليةٌ داخل دوالَّ أخرى — تُستثنى بالإزاحة */
  const dupFn = Object.keys(fns).filter(k => fns[k] > 1 &&
    (js.match(new RegExp('^function\\s+' + k + '\\s*\\(', 'gm')) || []).length > 1);
  check(dupFn.length === 0, 'لا دالةَ عامةً معرَّفةٌ مرتين'
    + (dupFn.length ? ' — ' + dupFn.join(' · ') : ''));

  const pgs = {};
  [...js.matchAll(/PAGE\.(\w+)\s*=\s*\{/g)].forEach(m => { pgs[m[1]] = (pgs[m[1]] || 0) + 1; });
  const dupPg = Object.keys(pgs).filter(k => pgs[k] > 1);
  check(dupPg.length === 0, 'لا شاشةَ معرَّفةٌ مرتين'
    + (dupPg.length ? ' — ' + dupPg.join(' · ') : ''));

  ['D','D2'].forEach(v => {
    const i = js.indexOf('var ' + v + ' = {');
    if (i < 0) return;
    const seg = js.slice(i, js.indexOf('\n};', i));
    ['en','ur'].forEach(L => {
      const st = seg.search(new RegExp('\\n' + L + ':\\s*\\{'));
      if (st < 0) return;
      const e = L === 'en' ? (seg.search(/\nur:\s*\{/) + 1 || seg.length) : seg.length;
      const keys = {};
      [...seg.slice(st, e).matchAll(/'((?:[^'\\]|\\.)*)'\s*:\s*'/g)]
        .forEach(m => { keys[m[1]] = (keys[m[1]] || 0) + 1; });
      const dup = Object.keys(keys).filter(k => keys[k] > 1);
      check(dup.length === 0, `لا مفتاحَ مكرَّرٌ في ${v}.${L}`
        + (dup.length ? ` (${dup.length}) — ` + dup.slice(0,3).join(' · ') : ''));
    });
  });
}

/* ── لا رسالةَ تُكذّب فعلَها ────────────────────────────────────────────────
   «في المعاينة: لا فعل حقيقي» كانت تُذيَّل بها كلُّ رسالةٍ في التطبيق من زمن
   العرض. أُزيلت في V14.26 ثم عادت — ومن كُذب عليه مرةً لم يصدّق ما بعدها. */
{
  check(!/textContent\s*=\s*label\s*\+/.test(html),
    'رسالةُ التطبيق لا تُذيَّل بشيءٍ — ولا تقول إن الفعلَ لم يقع');
  check(!/في المعاينة: لا فعل حقيقي'\s*\)\s*;/.test(html.replace(/'في المعاينة: لا فعل حقيقي':'[^']*',?/g,'')),
    'لا نداءَ لعبارة المعاينة خارج القاموس');
}

/* ── الملفاتُ الخارجيةُ التي يطلبها التطبيقُ موجودةٌ حيث يطلبها ─────────────
   `poly.json` كان في مجلَّد `v14/` والتطبيقُ يطلبه من الجذر بمسارٍ نسبيّ،
   فيفشل الطلبُ ويُبتلَع في `catch` — فلا تُرسَم حدودُ ألفٍ وثلاثمئةٍ واثنين
   وتسعين مخيمًا على الخريطة ولا يقول أحدٌ شيئًا. والطلبُ الصامتُ الفاشلُ لا
   يُكتشَف إلا بالعين، وقد لا يُكتشَف. */
{
  const asked = [...new Set([...html.matchAll(/fetch\('([^':/][^']*\.(?:json|csv|txt))'/g)].map(m => m[1]))];
  check(asked.length > 0, `ملفاتٌ خارجيةٌ يطلبها التطبيق (${asked.length})`);
  const gone = asked.filter(f => !existsSync(f));
  check(gone.length === 0, 'كلُّ ملفٍّ يطلبه التطبيقُ موجودٌ في الجذر'
    + (gone.length ? ' — مفقود: ' + gone.join(' · ') : ''));
  /* وحجمُه معقول: ملفٌّ فارغٌ يمرُّ الفحصَ ولا يحمل شيئًا */
  const empty = asked.filter(f => existsSync(f) && statSync(f).size < 200);
  check(empty.length === 0, 'لا ملفَّ خارجيٍّ فارغ'
    + (empty.length ? ' — فارغ: ' + empty.join(' · ') : ''));
}
const { VirtualConsole } = require('jsdom');
const vc = new VirtualConsole();
const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window;
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


await new Promise(r => setTimeout(r, 900));
check(boot.length === 0, 'لا خطأَ عند الإقلاع' + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

const RAW = w.SITES_RAW, S = w.STATE.sites;
check(!!RAW && Array.isArray(S), 'البياناتُ محمّلة');

/* ── المرجعُ: يُبنى من الخام لا من التطبيق ───────────────────────────────── */
const camps = RAW.g, pts = RAW.p;
eq(S.length, camps.length + pts.length, 'عدد المواقع');
eq(new Set(S.map(x => x.id)).size, S.length, 'لا معرّفَ مكرّرًا');

/* المخيمُ: 10 بادئة الشبكة · 11 المنطقة · 12 التصنيف — ولا حالةَ في الخام
   والنقطة: 10 المنطقة · 11 الحالة · 12 التصنيف */
const IPRE = /^\d{1,3}(\.\d{1,3}){2}$/;
let badRegion = 0, badNet = 0, badFstat = 0, badInout = 0, badZone = 0, badType = 0;
/* المشعرُ يُدمَج بقرار: نمرةُ في عرفات، والجمراتُ ومنشآتُ التسكين في منى.
   فالمرجعُ قاعدةُ الدمج نفسها لا العمودُ الخام. */
const zoneOf = r => w.zoneOf(RAW.z[r[2]] || '', r[1] || '');
const typeOf = i => RAW.t[i];

camps.forEach(r => {
  const s = S.find(x => x.id === r[0]);
  if (!s) return;
  if (s.region !== (r[11] || '')) badRegion++;
  if ((s.net || '') !== (r[10] || '')) badNet++;
  if (s.fstat !== 'لم يبدأ') badFstat++;
  if (s.inout !== (r[12] || '')) badInout++;
  if (s.zone !== zoneOf(r)) badZone++;
  if (s.type !== typeOf(r[3])) badType++;
});
pts.forEach(r => {
  const s = S.find(x => x.id === r[0]);
  if (!s) return;
  if (s.region !== (r[10] || '')) badRegion++;
  if (s.fstat !== (r[11] || 'لم يبدأ')) badFstat++;
  if (s.inout !== (r[12] || '')) badInout++;
  if (s.zone !== zoneOf(r)) badZone++;
  if (s.type !== typeOf(r[3])) badType++;
});
eq(badZone, 0, 'المشعر مقروءٌ صحيحًا');
eq(badType, 0, 'النوع مقروءٌ صحيحًا');
eq(badRegion, 0, 'المنطقة مقروءةٌ صحيحًا');
eq(badNet, 0, 'بادئةُ الشبكة مقروءةٌ صحيحًا');
eq(badFstat, 0, 'الحالةُ الميدانية مقروءةٌ صحيحًا');
eq(badInout, 0, 'تصنيفُ الحجاج مقروءٌ صحيحًا');

/* لا منطقةَ تحمل عنوانَ شبكة، ولا حالةَ تحمل اسمَ منطقة */
eq(S.filter(x => IPRE.test(x.region || '')).length, 0, 'لا منطقةَ هي عنوانُ شبكة');
eq(S.filter(x => /^منطقة /.test(x.fstat || '')).length, 0, 'لا حالةَ هي اسمُ منطقة');

/* الحالاتُ من قائمةٍ معلومةٍ لا نصٍّ حر */
const FSTAT = new Set(['لم يبدأ','مُركّب','قيد التنفيذ','مُعاد','مُسِح','مفكوك']);
const oddF = [...new Set(S.map(x => x.fstat))].filter(x => !FSTAT.has(x));
check(oddF.length === 0, 'الحالاتُ كلُّها معلومة' + (oddF.length ? ' — الغريب: ' + oddF.join(' · ') : ''));

/* الإحداثياتُ داخل المشاعر — نقطةٌ خارجها تُرسَم في البحر */
const out = S.filter(x => !(x.lat > 21.2 && x.lat < 21.6 && x.lng > 39.7 && x.lng < 40.2));
eq(out.length, 0, 'كلُّ الإحداثيات داخل نطاق المشاعر');

/* الشركاتُ من القائمة الموحّدة — لا اسمَ حرٍّ يصنع شركتين من واحدة */
const CO = new Set(w.CO_LIST);
const oddCo = [...new Set(S.map(x => x.co).filter(Boolean))].filter(c => !CO.has(c));
check(oddCo.length === 0, 'كلُّ شركات المواقع في القائمة الموحّدة'
  + (oddCo.length ? ` — خارجها ${oddCo.length}: ` + oddCo.slice(0,3).join(' · ') : ''));

/* العناوينُ تُشتقّ فعلًا ممّا قُرئ */
const withNet = S.filter(x => x.net);
check(withNet.length > 300, `مواقعُ لها بادئةُ شبكة (${withNet.length})`);
check(withNet.every(x => IPRE.test(x.net)), 'كلُّ البادئات بصيغةٍ سليمة');
check(w.ipsOf(withNet[0].net) !== '—', 'العناوينُ تُشتقّ من البادئة');

/* ── الأرقامُ التي تراها الوزارة ───────────────────────────────────────── */
const byZone = {}, byType = {};
S.forEach(x => { byZone[x.zone] = (byZone[x.zone]||0)+1; byType[x.type] = (byType[x.type]||0)+1; });
const rawZone = {}, rawType = {};
[...camps, ...pts].forEach(r => {
  rawZone[zoneOf(r)] = (rawZone[zoneOf(r)]||0)+1;
  rawType[typeOf(r[3])] = (rawType[typeOf(r[3])]||0)+1;
});
check(JSON.stringify(byZone) === JSON.stringify(rawZone), 'توزيعُ المشاعر يطابق الخام');
check(JSON.stringify(byType) === JSON.stringify(rawType), 'توزيعُ الأنواع يطابق الخام');

/* الإحصاءُ المعروضُ على اللوحة يُبنى من نفس المصدر */
if (typeof w.siteStats === 'function'){
  const st = w.siteStats();
  eq(st.total != null ? st.total : S.length, S.length, 'إجماليُّ اللوحة يطابق العدد');
}

/* ── الحصاد ─────────────────────────────────────────────────────────────── */
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ البيانات نظيف ✅');
process.exit(0);
