/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ختم الهوية — node scripts/audit-uid.mjs
   ───────────────────────────────────────────────────────────────────────────
   كلُّ كتابةٍ من الجهاز تحمل هويةَ كاتبها (المعرِّف لا الاسم) في الحقل `_by`:
   الطابورُ يختمها في مسارَي الرفع (واحدةً ودفعة)، والكتاباتُ المباشرةُ القليلةُ
   تختمها بيدها. بذلك تستطيع القواعدُ لاحقًا أن تطالب بالختم وتُضيّق القراءةَ
   على «ما كتبه صاحبه» — والاسمُ لا يكون هويةً في قاعدةٍ جديدة.
   يُمسَح هنا كلُّ نداءِ كتابةٍ في التطبيق: set/update/add على مرجعٍ أو دفعة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const s = readFileSync('index.html', 'utf8');

/* كلُّ نداء كتابة: .set( / .update( / .add( بعد collection(...).doc(...) أو على ref أو في دفعة w.set(ref, ... */
const sites = [];
for (const m of s.matchAll(/(?:collection\([^)]*\)(?:\.doc\([^)]*\))?|\bref|\bw)\.(set|update|add)\(/g)){
  const i = m.index, win = s.slice(i, i + 520);
  const line = s.slice(0, i).split('\n').length;
  sites.push({ i, line, op:m[1], win });
}
T(sites.length >= 6, 'نداءاتُ الكتابة في التطبيق: ' + sites.length);
const unstamped = sites.filter(x => !/_by\s*:/.test(x.win) && !/\bdoc\b\s*[,)]/.test(x.win.slice(0, 60)));
/* ما يمرّر متغيّرًا اسمُه doc أو v: يُتحقَّق أن المتغيّرَ خُتم قبل النداء */
const viaVar = sites.filter(x => /\.(set|update|add)\(\s*(FB\.clean\s*\?\s*FB\.clean\(doc\)\s*:\s*doc|doc|v)\s*[,)]/.test(x.win.slice(0, 80)));
const varOk = viaVar.every(x => { const before = s.slice(Math.max(0, x.i - 900), x.i); return /_by\s*:/.test(before); });
T(varOk, 'وكلُّ كتابةٍ تمرّر متغيّرًا خُتم المتغيّرُ قبلها: ' + viaVar.length);
const direct = sites.filter(x => !viaVar.includes(x));
const bad = direct.filter(x => !/_by\s*:/.test(x.win));
T(!bad.length, 'وكلُّ كتابةٍ مباشرةٍ تحمل `_by` في جسمها' + (bad.length ? ' — بلا ختم: السطر ' + bad.map(x => x.line).join('، ') : ''));
T(/putOne: function\(it\)\{[\s\S]{0,300}_by:STATE\.meta\.uid/.test(s) && /w\.set\(ref, FB\.clean\(Object\.assign\(\{\}, it\.v, \{ _by:STATE\.meta\.uid/.test(s), 'والطابورُ يختم في مسارَيه: الواحدةِ والدفعة');
T(!/_by\s*:\s*STATE\.meta\.name/.test(s), 'ولا يُختَم الاسمُ مكانَ المعرِّف في أيِّ كتابة');
T(existsSync('docs/rules-matrix.md') && /\| recs \|/.test(readFileSync('docs/rules-matrix.md', 'utf8')), 'ومصفوفةُ القواعد مكتوبةٌ في docs/rules-matrix.md');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ ختم الهوية نظيف \u2705');
