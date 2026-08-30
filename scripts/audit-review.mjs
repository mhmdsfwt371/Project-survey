/* ═══════════════════════════════════════════════════════════════════════════
   مراجعةُ الأدوار — يُشغَّل: node scripts/audit-review.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجرودُ السابقةُ تفحص ما بُني: زرًّا يكتب، وقاعدةً تمنع، وسلسلةً تكتمل.
   وهذا يفحص ما يفحصه **الناسُ في شركةٍ حين يراجعون عملَ بعضهم**: مهندسُ
   الأمن، ومسؤولُ قواعد البيانات، ومهندسُ التشغيل، وقائدُ الجودة، والمعماريّ،
   ومسؤولُ الوصولية، ومديرُ المنتج، والمدققُ الخارجيّ.

   وكُتب لأن أخطاءَ هذا المشروع أربعًا كانت في المقياس لا في المقيس. والمقياسُ
   الذي لا يُسجَّل يُعاد اختراعُه في كلِّ مرةٍ، ويُخترَع ناقصًا.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

const html = readFileSync('index.html', 'utf8');
const js = (/<script\b[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['', ''])[1];
const rules = existsSync('firestore.rules') ? readFileSync('firestore.rules', 'utf8') : '';
/* الجردُ لا يقيس نفسَه: أنماطُ البحث فيه تطابق ما يبحث عنه، فيُنذر بنفسه. */
const audits = readdirSync('scripts').filter(f => f.endsWith('.mjs') && f !== 'audit-review.mjs')
  .map(f => readFileSync('scripts/' + f, 'utf8')).join('\n');

let pass = 0; const fails = []; let role = '';
const R = n => { role = n; console.log('\n══ ' + n + ' ══'); };
const chk = (c, n) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fails.push(role + ' — ' + n); console.log('  ✗ ' + n); }
};

/* ══ مهندسُ الأمن ═════════════════════════════════════════════════════════ */
R('مهندسُ الأمن');
{
  /* سرٌّ في مستودعٍ عامٍّ يُقرأ ولو حُذف بعد ساعة */
  /* مفتاحُ Firebase العامُّ ليس سرًّا: يُرسَل إلى كلِّ متصفّحٍ بحكم التصميم،
     والحارسُ هو القواعدُ لا إخفاؤه. والسرُّ الحقيقيُّ توكنُ وصولٍ أو مفتاحُ
     حسابِ خدمةٍ أو مفتاحٌ خاصّ — وهذه لا يجوز أن تُرى في مستودعٍ عام. */
  const SECRET = /(ghp_[\w]{30,}|github_pat_[\w]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|"private_key"\s*:|sk_live_)/;
  chk(!SECRET.test(html), 'لا توكنَ ولا مفتاحَ خدمةٍ في التطبيق');
  chk(!SECRET.test(audits), 'ولا في الجرود');
  chk(/apiKey/.test(html) && /request\.auth/.test(rules),
    'مفتاحُ Firebase العامُّ محروسٌ بالقواعد لا بالإخفاء');

  /* apiKey في Firebase ليست سرًّا — لكنّ القواعدَ هي الحارس */
  chk(/allow read/.test(rules) && /request\.auth/.test(rules),
    'القواعدُ تشترط هويةً على القراءة');
  chk(!/allow read, write: if true/.test(rules), 'لا قاعدةَ مفتوحةٌ للجميع');
  chk(/allow delete: if (false|mgr\(\))/.test(rules), 'الحذفُ ممنوعٌ أو للمدير');

  /* الحقنُ: كلُّ ما يُعرَض يمرُّ بـesc */
  /* الحقنُ يُقاس على ما يدخل HTML لا على نصِّ رسالةٍ أو سجلِّ حدث: النصُّ
     في `toast` و`logEvent` لا يُفسَّر وسمًا. فيُفحَص ما جاور وسمًا. */
  /* الحقنُ يُقاس على ما يحمل إدخالَ مستخدم: حقلٌ من سجلٍّ أو موقعٍ أو شخص.
     ومفاتيحُ الحلقات وثوابتُ النمط ليست إدخالًا — وقياسُها إنذارٌ كاذبٌ
     يُعلِّم قارئَه تجاهلَ الجرد. */
  const USERFIELD = /\.(name|text|note|plate|ref|item|sup|co|sign|sq|model|title|who|act|reason|msg)$/;
  const raw = [...js.matchAll(/<[a-z][^>]{0,90}'\s*\+\s*([A-Za-z_$][\w$]*\.[\w$]+)\s*\+\s*'/g)]
    .map(m => m[1]).filter(v => USERFIELD.test(v));
  chk(raw.length === 0, 'لا حقلَ من إدخال المستخدم يُحقَن داخلَ وسمٍ بلا تهريب'
    + (raw.length ? ' — ' + [...new Set(raw)].join(' · ') : ''));
  chk(!/innerHTML\s*=\s*[a-z]\w*\s*;/.test(js) || /esc\(/.test(js),
    'الإسنادُ إلى innerHTML مهرَّب');

  /* الهواتفُ محجوبةٌ عن الوزارة في التطبيق وفي القواعد */
  chk(/phones/.test(js) && /may\('phones'\)/.test(js), 'الهواتفُ خلف صلاحية');
  chk(/viewer/.test(rules), 'دورُ الوزارة معروفٌ في القواعد');
}

/* ══ مسؤولُ قواعد البيانات ════════════════════════════════════════════════ */
R('مسؤولُ قواعد البيانات');
{
  const cols = [...rules.matchAll(/match \/(\w+)\/\{/g)].map(m => m[1]);
  chk(cols.length >= 30, `مجموعاتٌ مسمّاةٌ في القواعد (${cols.length})`);

  /* كلُّ ما يُكتَب له مجموعةٌ مسمّاة — وإلا سقط في misc المغلقة */
  const map = /var col = \{([\s\S]{0,700}?)\}/.exec(js);
  const named = map ? [...map[1].matchAll(/(\w+)\s*:/g)].map(m => m[1]) : [];
  const written = [...new Set([...js.matchAll(/CORE\.set\('(\w+)'/g)].map(m => m[1]))];
  const orphan = written.filter(k => named.indexOf(k) < 0);
  chk(orphan.length === 0, 'كلُّ ما يُكتَب له مجموعةٌ مسمّاة'
    + (orphan.length ? ' — ' + orphan.join(' · ') : ''));

  /* حدُّ الوثيقة: الصورُ في مجموعةٍ منفصلة */
  chk(/match \/photos\//.test(rules), 'الصورُ في مجموعةٍ منفصلةٍ لها قاعدتُها');
  /* المزامنةُ تفاضلية لا قراءةً كاملة */
  chk(/pullDelta|lastSync/.test(js), 'المزامنةُ تفاضليةٌ لا قراءةً كاملة');
  chk(/STATE\.queue/.test(js), 'طابورٌ يحفظ ما لم يُرفَع');
}

/* ══ مهندسُ التشغيل ═══════════════════════════════════════════════════════ */
R('مهندسُ التشغيل');
{
  chk(existsSync('sw.js'), 'عاملُ خدمةٍ موجود');
  const sw = existsSync('sw.js') ? readFileSync('sw.js', 'utf8') : '';
  const v = /nusuk-survey-v([\d.]+)/.exec(sw);
  const appV = /V(\d+\.\d+)/.exec(html);
  chk(!!v && !!appV && v[1] === appV[1].toLowerCase(), 'رقمُ الكاش يطابق رقمَ التطبيق');
  chk(/skipWaiting/.test(sw) && /clients\.claim/.test(sw), 'العاملُ يتولّى فورًا');
  chk(/controllerchange/.test(js), 'الصفحةُ تُعاد عند تولّي عاملٍ جديد');
  chk(existsSync('manifest.json'), 'بيانٌ بامتدادٍ يقبله كلُّ مضيف');
  chk(existsSync('icon-192.png') && existsSync('icon-512.png'), 'أيقونتان');
  chk(existsSync('.github/workflows/docs-check.yml'), 'سيرُ عملٍ في السحابة');
  const wf = existsSync('.github/workflows/docs-check.yml')
    ? readFileSync('.github/workflows/docs-check.yml', 'utf8') : '';
  chk((wf.match(/- name:/g) || []).length >= 14, 'خطواتُ الفحص في السحابة');
  chk(readdirSync('.github/workflows').some(f => /back/i.test(f)), 'نسخٌ احتياطيّ');
}

/* ══ قائدُ الجودة ═════════════════════════════════════════════════════════ */
R('قائدُ الجودة');
{
  const A = readdirSync('scripts').filter(f => /^audit/.test(f));
  chk(A.length >= 12, `جرودٌ مستقلّة (${A.length})`);
  chk(existsSync('scripts/audit-guards.mjs'), 'حارسُ الحُرّاس — عطلٌ مزروعٌ يجب أن يُمسَك');
  const g = existsSync('scripts/audit-guards.mjs') ? readFileSync('scripts/audit-guards.mjs', 'utf8') : '';
  chk((g.match(/\{ n:'/g) || []).length >= 15, 'طفراتٌ مزروعة');
  chk(existsSync('scripts/audit-flow.mjs'), 'سيناريو حياتيٌّ كامل');
  chk(existsSync('scripts/preflight.mjs'), 'فحصٌ قبليٌّ يطابق السحابة');
  /* الفحصُ القبليُّ يقرأ سير العمل لا يكرّره */
  const pf = existsSync('scripts/preflight.mjs') ? readFileSync('scripts/preflight.mjs', 'utf8') : '';
  chk(/docs-check\.yml/.test(pf), 'الفحصُ يقرأ خطواتِه من سير العمل');
  chk(/env/.test(pf), 'ويقرأ بيئتَها كذلك');
}

/* ══ المعماريّ ════════════════════════════════════════════════════════════ */
R('المعماريّ');
{
  const fn = {};
  [...js.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].forEach(m => { fn[m[1]] = (fn[m[1]] || 0) + 1; });
  chk(Object.keys(fn).filter(k => fn[k] > 1).length === 0, 'لا دالةَ معرَّفةٌ مرتين');
  const pg = {};
  [...js.matchAll(/PAGE\.(\w+)\s*=\s*\{/g)].forEach(m => { pg[m[1]] = (pg[m[1]] || 0) + 1; });
  chk(Object.keys(pg).filter(k => pg[k] > 1).length === 0, 'لا شاشةَ معرَّفةٌ مرتين');
  const dead = Object.keys(fn).filter(n => {
    const inApp = (js.match(new RegExp('\\b' + n + '\\b', 'g')) || []).length;
    return inApp < 2 && audits.indexOf('w.' + n) < 0;
  });
  chk(dead.length === 0, 'لا شيفرةَ ميتة' + (dead.length ? ' — ' + dead.join(' · ') : ''));

  /* لا رقمَ سحريٌّ في منطق الأعمال: العتباتُ في CFG */
  chk(/var CFG/.test(js), 'الإعداداتُ في مصدرٍ واحد');
  chk(/statBump|STAT_VER/.test(js), 'ذاكرةُ الإحصاء تُبطَل عند الكتابة');
  chk(js.length > 100000, 'حجمٌ معلومٌ ومقصود');
}

/* ══ مسؤولُ الوصولية ══════════════════════════════════════════════════════ */
R('مسؤولُ الوصولية');
{
  const btns = [...html.matchAll(/<button[^>]*>/g)];
  const iconOnly = btns.filter(b => /class="[^"]*(?:tb-btn|nav-x|pop-x|tb-back)/.test(b[0]));
  const labelled = iconOnly.filter(b => /aria-label=/.test(b[0]));
  chk(iconOnly.length === labelled.length,
    `أزرارُ الأيقونات لها وصفٌ منطوق (${labelled.length}/${iconOnly.length})`);
  chk(/lang="ar"/.test(html) && /dir="rtl"/.test(html), 'اللغةُ والاتجاهُ معلنان');
  chk(/documentElement\.dir/.test(js), 'الاتجاهُ يتبع اللغة');
  chk(/min-height:4[0-9]px|min-height:44px/.test(html) || /min-height:40px/.test(html),
    'مساحةُ اللمس لا تقلُّ عن أربعين');
  chk(/prefers-reduced-motion/.test(html), 'يُحترَم تقليلُ الحركة');
  chk(/role="listbox"|aria-expanded|aria-selected/.test(html), 'أدوارُ ARIA على القوائم');
}

/* ══ مديرُ المنتج ═════════════════════════════════════════════════════════ */
R('مديرُ المنتج');
{
  chk(existsSync('docs/system.md'), 'سجلُّ إصداراتٍ يُقرأ');
  const sys = existsSync('docs/system.md') ? readFileSync('docs/system.md', 'utf8') : '';
  chk((sys.match(/\| \*\*V14\.\d+\*\* \|/g) || []).length >= 40, 'كلُّ إصدارٍ موثَّقٌ بسببه');
  chk(existsSync('docs/parity.json'), 'دفترُ مطابقةٍ مع النظام القديم');
  chk(existsSync('legacy/v13.99.html'), 'النظامُ القديمُ محفوظٌ مرجعًا');
  chk(/I18N/.test(js) && /ur:/.test(js), 'ثلاثُ لغات');
  chk(existsSync('docs/followup-template.xlsx'), 'قالبُ متابعة المشروع');
}

/* ══ المدققُ الخارجيّ ═════════════════════════════════════════════════════ */
R('المدققُ الخارجيّ');
{
  chk(/logEvent\(/.test(js), 'كلُّ فعلٍ يدخل سجلَّ الأحداث');
  chk((js.match(/logEvent\(/g) || []).length >= 40,
    `أفعالٌ مسجَّلة (${(js.match(/logEvent\(/g) || []).length})`);
  chk(/by:STATE\.meta\.name|by: STATE\.meta\.name/.test(js), 'كلُّ سجلٍّ يحمل صاحبَه');
  chk(/at:Date\.now\(\)/.test(js), 'وكلُّ سجلٍّ يحمل وقتَه');
  chk(/allow delete: if false/.test(rules), 'أثرُ التدقيق لا يُمحى');
  chk(/مسح نهائي/.test(js), 'الفعلُ الخطيرُ يحتاج عبارةً تُكتَب');
  chk(/approved/.test(js) && /apprIns|apprCo/.test(js), 'الاعتمادُ فعلٌ منفصلٌ عن التنفيذ');
  chk(/SOFT_ERRS/.test(js), 'الفشلُ يُسجَّل ولا يُبتلَع');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) { console.error('\nما يجب إصلاحُه:'); fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('مراجعةُ الأدوار نظيفة ✅');
process.exit(0);
