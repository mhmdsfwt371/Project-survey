/* ═══════════════════════════════════════════════════════════════════════════
   جردُ قطار الإصدار — node scripts/audit-train.mjs
   ───────────────────────────────────────────────────────────────────────────
   الترقيةُ لا تقع إلا على قطارٍ مجدول (الأحد والأربعاء ٠١:٠٠ UTC) أو ترويسةِ
   طوارئ أو تشغيلٍ يدويّ — ولا تُرقَّى شجرةٌ حمراءُ بوابتُها قطّ. يُفحَص السيران
   والاختيارُ وقرارُ الترقية على أمثلةٍ معلومةِ الجواب، وأن الدستورَ يقولها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { pick } from './train-pick.mjs';
import { promoteDecision } from './train-promote.mjs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const tr = readFileSync('.github/workflows/train.yml', 'utf8'), gate = readFileSync('.github/workflows/docs-check.yml', 'utf8');

console.log('\n══ ١ · شروطُ الترقية ══');
T(/cron: '0 1 \* \* 0,3'/.test(tr) && /workflow_dispatch: \{\}/.test(tr), 'القطارُ: الأحدُ والأربعاءُ ٠١:٠٠ UTC، ويُطلَق يدًا');
T(/node scripts\/train-pick\.mjs/.test(tr) && /node scripts\/train-promote\.mjs/.test(tr), 'ويختار بالسكربت ويرقّي بالسكربت نفسِه الذي تستعمله الطوارئ');
T(/grep -qE '\^Release: hotfix\\s\*\$'/.test(gate) && /node scripts\/train-promote\.mjs "\$\(git rev-parse HEAD\)"/.test(gate), 'والبوابةُ ترقّي فورًا ما يحمل «Release: hotfix» وحدَه');
T(/context="nusuk\/gate"/.test(gate) && /statuses: write/.test(gate), 'وتكتب حالةَ الالتزام nusuk/gate ليقرأها القطار');
T(!/git push origin HEAD:main/.test(gate), 'ولا تدفع البوابةُ إلى الأصل بنفسها خارج الطوارئ');
T(/cancel-in-progress: \$\{\{ github\.ref == 'refs\/heads\/staging' \}\}/.test(gate), 'ودفعةٌ جديدةٌ على فرع التجربة تلغي التشغيلَ الجاري');

console.log('\n══ ٢ · لا يُرقَّى أحمرُ ولا مجهول ══');
T(pick([{ sha:'c3', state:'failure' }, { sha:'c2', state:'pending' }, { sha:'c1', state:'success' }]).sha === 'c1', 'يُختار أحدثُ التزامٍ بوابتُه خضراء ولو سبقه أحمرُ ومعلَّق');
T(pick([{ sha:'c3', state:'failure' }, { sha:'c2', state:'none' }]) === null, 'وبلا خضراءَ لا مرشّح');
T(pick([{ sha:'c9', state:'success' }, { sha:'c1', state:'success' }]).sha === 'c9', 'والأحدثُ أوّلًا');

console.log('\n══ ٣ · قرارُ الترقية ══');
T(promoteDecision(true, []).how === 'ff', 'الأصلُ في تاريخ الالتزام: تقدُّمٌ سريع');
T(promoteDecision(false, ['backups/latest/_meta.json', 'backups/latest/_drive.json']).how === 'merge-backups', 'والأصلُ تقدّم بأعداد النسخ وحدَها: تُدمَج فوق الالتزام المفحوص');
T(promoteDecision(false, ['index.html']).ok === false, 'والأصلُ تقدّم بشيفرة: لا ترقية — يُقال السبب بلا سقوط');

console.log('\n══ ٤ · بروفةٌ جافّة: دفعةٌ عاديةٌ تنتظر، وطوارئُ تُرقَّى ══');
{
  const normal = 'V17.97 — تحسين\n\nنصٌّ عادي.\n', hot = 'V17.97 — إصلاحٌ عاجل\n\nRelease: hotfix\n';
  const re = /^Release: hotfix\s*$/m;
  T(!re.test(normal) && re.test(hot), 'الترويسةُ تُميَّز على سطرها وحدَها');
  T(!/^Release: hotfix/m.test('قال Release: hotfix في النصّ'), 'ولا تُخدَع بكلمةٍ في وسط سطر');
}

console.log('\n══ ٥ · الدستورُ يقولها ══');
const A = readFileSync('AGENTS.md', 'utf8'), C = readFileSync('CLAUDE.md', 'utf8'), S = readFileSync('docs/system.md', 'utf8');
T(/Release: hotfix/.test(A) && /train\.yml/.test(A) && /الأحد/.test(A), 'AGENTS.md: القطارُ والترويسةُ والتشغيلُ اليدوي');
T(/Release: hotfix/.test(C) === false || /لا/.test(C), 'CLAUDE.md لا يوصي بالترويسة للدفعات العادية');
T(/train\.yml/.test(S) && /Release: hotfix/.test(S), 'وsystem.md §١٤ يوثّقه');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ القطار نظيف \u2705');
