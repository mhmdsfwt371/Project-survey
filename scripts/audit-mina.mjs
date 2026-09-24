/* ═══════════════════════════════════════════════════════════════════════════
   جردُ اختبار «ظروف منى» — node scripts/audit-mina.mjs
   ───────────────────────────────────────────────────────────────────────────
   الاختبارُ في المتصفّح الحقيقي يخنق الشبكةَ والمعالجَ ويقيس الفتحَ الدافئَ
   والبارد. يُفحَص هنا: الملفُّ يحمل الخنقَ بأرقامه، ووسيطَ ثلاثٍ للدافئ، والميزانيةَ
   من docs/mina-budget.json (null = جمعُ خطِّ الأساس لا فرض)، والسيرُ يكتب القياسَ
   تعليقًا — ولا حزمةَ جديدة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const b = readFileSync('scripts/browser-test.mjs', 'utf8'), y = readFileSync('.github/workflows/real-tests.yml', 'utf8');
const bud = JSON.parse(readFileSync('docs/mina-budget.json', 'utf8'));
T(/Network\.emulateNetworkConditions', \{ offline:false, latency:400, downloadThroughput:400 \* 1024 \/ 8/.test(b) && /Emulation\.setCPUThrottlingRate', \{ rate:4 \}/.test(b), 'الخنق: ٤٠٠ كيلوبت/ث و٤٠٠ م.ث تأخيرًا ومعالجٌ ×٤');
T(/for \(let i = 0; i < 3; i\+\+\) warmRuns\.push\(await measure\(true\)\)/.test(b) && /sort\(\(a, b\) => a - b\)\[1\]/.test(b), 'والدافئُ وسيطُ ثلاث محاولات');
T(/measure\(false\)/.test(b) && /budget\.warmMs/.test(b) && /جمعُ خطِّ الأساس/.test(b), 'والباردُ يُبلَّغ، والميزانيةُ تُفرَض على الدافئ وحدَه حين تُكتَب');
T('warmMs' in bud && Array.isArray(bud.baseline) && (bud.warmMs === null || (typeof bud.warmMs === 'number' && bud.baseline.length >= 5)), 'وملفُّ الميزانية: null أو رقمٌ بعد خمسة تشغيلاتٍ على الأقل (' + bud.baseline.length + ')');
T(/دافئ \(٣ محاولات\)/.test(y) && /ظروفُ منى/.test(y), 'والسيرُ يكتب القياسَ تعليقًا على الالتزام في كلِّ تشغيل');
T(!/require\(['"](?!playwright)/.test(b.split('const { chromium')[1] || ''), 'ولا حزمةَ جديدةً في الاختبار');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ ظروف منى نظيف \u2705');
