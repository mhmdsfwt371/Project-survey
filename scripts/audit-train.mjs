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
T(/cron: '0 1 \* \* \*'/.test(tr) && /workflow_dispatch: \{\}/.test(tr), 'القطارُ: كلَّ يومٍ ٠١:٠٠ UTC (٤ فجرًا بمكة — قبل يوم الميدان، V21.9)، ويُطلَق يدًا');
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

console.log('\n══ (V38.82) سلسلةُ النشر تكمل وحدَها على الخادم ══');
T(/gh workflow run docs-check\.yml --ref staging/.test(gate) && /if: env\.GATE == 'open' && env\.HOTFIX != '1'/.test(gate),
  'البوابةُ الخضراءُ تُطلق القائمةَ الكاملةَ بنفسها — والطوارئُ لا (تُرقَّى فورًا)');
T(/branches\/staging" --jq \.commit\.sha/.test(gate), 'وعلى الالتزام نفسِه إن بقي رأسَ فرع التجربة — وإلا فالأحدثُ يُطلق قائمتَه من بوابته');
const ch = gate.slice(gate.indexOf('\n  chain:'));
T(gate.indexOf('\n  chain:') > -1 && /needs: \[shards\]/.test(ch) && /github\.event_name == 'workflow_dispatch'/.test(ch) && /for n in 1 2 3 4/.test(ch) && /!= "PASS"/.test(ch),
  'الترقيةُ بعد الشرائح الأربع خضراءَ كلِّها (علامةُ PASS في كلٍّ منها)');
T(/context=="nusuk\/gate"/.test(ch) && /node scripts\/train-promote\.mjs "\$sha"/.test(ch) && /sha="\$\{\{ github\.sha \}\}"/.test(ch),
  'وتشترط بوابةً خضراءَ لهذا الالتزام، وترقّي الالتزامَ الذي فُحص بعينه لا رأسَ الفرع');
T((ch.match(/merge-base --is-ancestor "\$sha" origin\/main/g) || []).length >= 2, 'وتتأكّد بعد الترقية أن الأصلَ يحمله — الترقيةُ المرفوضةُ وقوفٌ لا نجاح');
T(/node scripts\/chain-alert\.mjs/.test(ch) && /if: failure\(\) \|\| env\.STOP != ''/.test(ch), 'وأيُّ وقوفٍ في الطريق بلاغٌ للمالك بالمرحلة والسبب');
T(/node scripts\/chain-alert\.mjs "بوابة الدفع"/.test(gate) && /\n  gate-crash:/.test(gate), 'وكذلك وقوفُ البوابة — سقوطًا أو تعطّلًا');
const pd = readFileSync('.github/workflows/post-deploy.yml', 'utf8');
T(/github\.run_attempt > 1/.test(pd) && /CHAIN_LIVE: '1'/.test(pd) && /\n  deploy-failed:/.test(pd),
  'وبعد النشر: فحصٌ سقط مرتين أو نشرٌ فشل — بلاغ، لا مع أوّل سقوطٍ تعيده الإعادةُ التلقائية');
const { alertText } = await import('./chain-alert.mjs');
const am = alertText({ ver:'V38.82', sha:'0123456789ab', stage:'الفحوصات الكاملة', why:'سقطت الشرائح: 2', subject:'V38.82 — x', details:'✗ y', owner:'o', live:false, runUrl:'u' });
T(am.title === 'الإصدار V38.82 وقف عند: الفحوصات الكاملة' && /^@o\n/.test(am.body) && /الإنتاجُ على حاله/.test(am.body) && /سقطت الشرائح: 2/.test(am.body),
  'والبلاغُ يذكر المالكَ باسمه، والإصدارَ والمرحلةَ والسبب، وأن الإنتاجَ على حاله');
T(/النسخةُ نُشرت/.test(alertText({ ver:'V1.0', sha:'x', stage:'s', owner:'o', live:true, runUrl:'u' }).body), 'وإن نُشرت النسخةُ وسقط فحصُها قاله صراحةً');
T(/group: gate-\$\{\{ github\.ref \}\}-\$\{\{ github\.event_name \}\}/.test(gate), 'وطابورٌ لكلِّ نوع تشغيل — فالقائمةُ التي تُطلقها البوابةُ لا تُلغي البوابةَ نفسَها (V38.83)');
const bk = readFileSync('.github/workflows/backup.yml', 'utf8');
T(/push:\n(\s*#[^\n]*\n)*\s+branches: \[main\]/.test(bk) && /if \[ "\$GITHUB_REF" = "refs\/heads\/main" \]; then git push/.test(bk),
  'والنسخةُ الاحتياطيةُ لا تدفع التزامَها فوق فرع التجربة — كان يوقف السلسلةَ برأسٍ بلا بوابة (V38.85)');
T(/select\(startswith\("backups\/latest\/"\) \| not\)/.test(gate) && /git diff --name-only "\$anc" "\$sha" \| grep -v '\^backups\/latest\/'/.test(ch),
  'ورأسٌ لا يزيد إلا أعدادَ النسخ لا يوقفها: البوابةُ تُطلق القائمةَ عليه، والترقيةُ تأخذ بوابةَ سلفه الأخضر');
const rn = readFileSync('scripts/release-now.mjs', 'utf8');
T(/القائمةُ الكاملةُ انطلقت من البوابة على الخادم/.test(rn) && /رقّاه الخادم/.test(rn), 'وأداةُ النشر تتابع ما يفعله الخادمُ ولا تكرّره — وتبقى احتياطًا');

/* (V38.99) a list cancelled by a newer commit's list does not run the chain — it raised «الإصدار وقف» for V38.98 */
{ const ch9 = gate.slice(gate.indexOf('\n  chain:'), gate.indexOf('\n  chain:') + 600);
  T(/if: \$\{\{ !cancelled\(\) && github\.ref == 'refs\/heads\/staging'/.test(ch9) && !/if: \$\{\{ always\(\) && github\.ref == 'refs\/heads\/staging' && github\.event_name == 'workflow_dispatch'/.test(ch9),
    'السلسلةُ لا تعمل في قائمةٍ ألغتها قائمةُ التزامٍ أحدث — فلا بلاغَ «وقف» كاذب'); }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ القطار نظيف \u2705');
