/* ═══════════════════════════════════════════════════════════════════════════
   جردُ بصمة الختم — node scripts/audit-seal.mjs
   ───────────────────────────────────────────────────────────────────────────
   الختمُ هو ما يمنع دفعَ شجرةٍ لم تُفحَص؛ فإن أهملت البصمةُ ملفًّا يقرؤه جردٌ
   مرّت شجرةٌ حمراء، وإن حسبت ملفًّا لا يقرؤه أحدٌ أُعيد الحارسُ بلا سبب.
   يُقام مستودعٌ مؤقّتٌ ويُختبَر الحدُّ من الجهتين: النسخُ الاحتياطيةُ لا
   تبدّل البصمة، وأيُّ ملفٍّ آخرَ يبدّلها، وبصمةُ الالتزام تساوي بصمةَ الشجرة
   حين يُلتزَم كلُّ شيء.
   ═════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { sealHash, SEAL_SKIP } from './seal.mjs';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

const R = mkdtempSync(join(tmpdir(), 'nsk-seal-'));
const sh = c => execSync(c, { cwd:R, encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'] });
sh('git init -q'); sh('git config user.email a@b.c'); sh('git config user.name t');
writeFileSync(join(R, 'index.html'), 'a'); mkdirSync(join(R, 'backups/latest'), { recursive:true });
writeFileSync(join(R, 'backups/latest/backup.enc'), 'x1'); writeFileSync(join(R, 'backups/latest/_meta.json'), '{"n":1}');
sh('git add -A && git commit -q -m one');

const h0 = sealHash('HEAD', R), w0 = sealHash('', R);
T(h0 === w0 && /^[0-9a-f]{40}$/.test(h0), 'بصمةُ الالتزام تساوي بصمةَ الشجرة حين لا فرق');
writeFileSync(join(R, 'backups/latest/backup.enc'), 'x2'); writeFileSync(join(R, 'backups/latest/_meta.json'), '{"n":2}');
T(sealHash('', R) === h0, 'تبدّلُ النسخة الاحتياطية لا يبدّل البصمة');
sh('git add -A && git commit -q -m backup');
T(sealHash('HEAD', R) === h0, 'ولا التزامُها — فلا يُعاد الحارسُ لأجلها');
writeFileSync(join(R, 'index.html'), 'b');
T(sealHash('', R) !== h0, 'وأيُّ ملفٍّ يقرؤه جردٌ يبدّلها');
writeFileSync(join(R, 'new.mjs'), 'c');
const w2 = sealHash('', R);
sh('git add -A && git commit -q -m two');
T(sealHash('HEAD', R) === w2, 'وغيرُ المتعقَّب يدخل البصمةَ كما سيُلتزَم');
T(SEAL_SKIP.length === 1 && SEAL_SKIP[0] === 'backups', 'والمستثنى هو backups/ وحدَه');

const cv = readFileSync('scripts/check-version.mjs', 'utf8'), hk = readFileSync('.githooks/pre-push', 'utf8');
T(/sealHash\(''\)/.test(cv) && /from '\.\/seal\.mjs'/.test(cv), 'والحارسُ يختم بها');
T(/node scripts\/seal\.mjs HEAD/.test(hk), 'والخطّافُ يقارن بها');
T(!/rm -rf|--hard/.test(readFileSync('scripts/seal.mjs', 'utf8')), 'ولا تمسُّ البصمةُ الشجرةَ الحقيقية');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ بصمة الختم نظيف \u2705');
