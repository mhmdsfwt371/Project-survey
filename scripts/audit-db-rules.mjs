/* ═══════════════════════════════════════════════════════════════════════════
   جردُ قواعد القاعدة — يُشغَّل: node scripts/audit-db-rules.mjs
   ───────────────────────────────────────────────────────────────────────────
   الواجهةُ تُفتَح والقاعدةُ لا تُفتَح: من عرف اسمَ الخاصية أنشأ الزرَّ بيده،
   فالحجبُ الحقيقيُّ في القواعد. ولذلك تُكتَب القواعدُ مرةً وتُنسى — وتبقى
   تحرس نظامًا لم يعد قائمًا.

   وقد بقيت هنا تعرف ثلاثةَ أدوارٍ بينما صار التطبيقُ سبعة. فالفنيُّ والتهيئةُ
   والتجميعُ والتركيب — وهي التي تنتج العملَ كلَّه — كانت القاعدةُ ترفض كلَّ
   ما تكتبه. والتطبيقُ يقول «حُفظ» لأن الحفظَ محليٌّ أولًا، ثم يقف الطابورُ
   عند الرفع ولا يصل المكتبَ شيء. مئةٌ وخمسون فنيًّا يعملون يومًا كاملًا في
   الشمس ولا تصل بيانةٌ واحدة.

   فهذا الجردُ لا يقرأ القواعدَ وحدها: يقيسها على التطبيق.
     · كلُّ دورٍ في التطبيق معروفٌ عند القواعد
     · كلُّ من يكتب في التطبيق يستطيع الكتابة في القاعدة
     · كلُّ مجموعةٍ يكتب فيها التطبيقُ لها قاعدةٌ خاصةٌ بها
     · ما تحجبه الواجهةُ عن الوزارة تحجبه القواعد
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

check(existsSync('firestore.rules'), 'ملفُّ القواعد موجود');
const R = readFileSync('firestore.rules', 'utf8');
const A = readFileSync('index.html', 'utf8');

/* ── ١ · سلامةٌ بنيويةٌ لا تحتاج محرّكًا ────────────────────────────────── */
{
  let depth = 0, over = 0;
  for (const c of R){ if (c === '{') depth++; else if (c === '}'){ depth--; if (depth < 0) over++; } }
  check(depth === 0 && over === 0, `الأقواسُ متوازنة (العمق ${depth})`);
  check(/rules_version\s*=\s*'2'/.test(R), 'إصدارُ القواعد الثاني');
  const matches = (R.match(/match \//g) || []).length;
  check(matches > 20, `كتلُ المطابقة (${matches})`);
  check(!/if\s+true/.test(R), 'لا قاعدةَ مفتوحةٌ بلا شرط');
  check(!/allow\s+[a-z, ]+;/.test(R), 'لا `allow` بلا `if`');
  /* مصيدةُ التاريخ: قواعدُ البدء تسمح للجميع حتى يومٍ معيّن ثم تُغلق كلَّ شيء */
  check(!/request\.time\s*<\s*timestamp/.test(R), 'لا قاعدةَ تجريبيةٌ تنتهي بتاريخ');
}

/* ── ٢ · الأدوار: ما يعرفه التطبيقُ تعرفه القاعدة ──────────────────────── */
const appRoles = (() => {
  const i = A.indexOf('var ROLES = {');
  const seg = A.slice(i, A.indexOf('\n};', i));
  return [...seg.matchAll(/^\s{2}(\w+):\s*\{/gm)].map(m => m[1]);
})();
check(appRoles.length >= 5, `أدوارُ التطبيق (${appRoles.length}): ${appRoles.join(' · ')}`);

const ruleRoles = new Set([...R.matchAll(/'([a-z]+)'/g)].map(m => m[1]));
const unknown = appRoles.filter(r => !ruleRoles.has(r));
check(unknown.length === 0, 'كلُّ دورٍ في التطبيق معروفٌ عند القواعد'
  + (unknown.length ? ' — مجهولٌ عندها: ' + unknown.join(' · ') : ''));

/* من يملك `edit` في التطبيق يجب أن يكون داخل `canW` في القواعد */
const rolesSeg = A.slice(A.indexOf('var ROLES = {'), A.indexOf('\n};', A.indexOf('var ROLES = {')));
const writers = appRoles.filter(r => {
  const i = rolesSeg.indexOf('\n  ' + r + ':{');
  if (i < 0) return false;
  const seg = rolesSeg.slice(i, i + 1200);
  const can = /can:\s*\{([\s\S]*?)\}/.exec(seg);   /* تمتدُّ سطرين فأكثر */
  return !!can && /edit:\s*1/.test(can[1]);
});
const canW = (/function canW\(\)[^\n]*/.exec(R) || [''])[0]
  + '\n' + (/function field\(\)[^\n]*/.exec(R) || [''])[0];
const blocked = writers.filter(r => !canW.includes("'" + r + "'"));
check(writers.length > 3, `الأدوارُ الكاتبةُ في التطبيق (${writers.length})`);
check(blocked.length === 0, 'كلُّ من يكتب في التطبيق يستطيع الكتابة في القاعدة'
  + (blocked.length ? ' — تمنعه القواعد: ' + blocked.join(' · ') : ''));

/* والوزارةُ لا تكتب شيئًا */
check(!canW.includes("'viewer'"), 'الوزارةُ خارج صلاحية الكتابة');

/* ── ٣ · المجموعات: ما يكتب فيه التطبيقُ له قاعدةٌ خاصة ────────────────── */
{
  const used = [...new Set([...A.matchAll(/CORE\.set\(\s*'([a-zA-Z0-9_]+)'/g)].map(m => m[1]))];
  check(used.length > 5, `مجموعاتٌ يكتب فيها التطبيق (${used.length})`);
  /* أسماءُ المجموعات في التطبيق قد تختلف عن مسارات القواعد — تُعلَن الترجمةُ
     صراحةً، فالمسكوتُ عنه يسقط في مجموعةٍ عامةٍ لا قاعدةَ لها. */
  const MAP = { props:'props', diss:'dismantles', inv:'inventory', buys:'purchases',
                moves:'inventory', cfg:'settings', workReqs:'workreqs' };
  const missing = used.filter(c => {
    const path = MAP[c] || c;
    return !new RegExp('match /' + path + '/').test(R);
  });
  check(missing.length === 0, 'كلُّ مجموعةٍ يكتب فيها التطبيقُ لها قاعدة'
    + (missing.length ? ' — بلا قاعدة: ' + missing.join(' · ') : ''));
  /* ولا شيءَ يسقط في مجموعةٍ مفتوحة */
  check(/match \/misc\/\{id\} \{ allow read, write: if false/.test(R),
    'المجموعةُ العامةُ مغلقةٌ فلا يسقط فيها شيءٌ صامتًا');
}

/* ── ٤ · الهواتفُ محجوبةٌ في القاعدة لا في الواجهة وحدها ──────────────── */
{
  const tel = /match \/settings\/(contacts|cotel)\s*\{[^}]*\}/g;
  const blocks = R.match(tel) || [];
  check(blocks.length === 2, `مساراتُ الهواتف معرَّفة (${blocks.length}/2)`);
  check(blocks.every(b => /allow read:\s*if canW\(\)/.test(b)),
    'الهواتفُ تُقرأ بصلاحية الكتابة — فالوزارةُ خارجها');
  check(blocks.every(b => /allow write:\s*if mgr\(\)/.test(b)),
    'الهواتفُ لا يكتبها إلا المهندس');
}

/* ── ٥ · النشر: قاعدةٌ في المستودع لا تحرس شيئًا حتى تُنشَر ───────────── */
{
  const wf = existsSync('.github/workflows/deploy-rules.yml')
    ? readFileSync('.github/workflows/deploy-rules.yml', 'utf8') : '';
  check(!!wf, 'سيرُ عمل النشر موجود');
  check(/firestore:rules/.test(wf), 'ينشر القواعدَ فعلًا');
  check(/paths:/.test(wf) && /firestore\.rules/.test(wf), 'يعمل عند تغيّر القواعد');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ قواعد القاعدة نظيف ✅');
