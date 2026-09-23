/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تقرير الوزارة — node scripts/audit-ministry.mjs
   ───────────────────────────────────────────────────────────────────────────
   التقريرُ يصل الوزارةَ بلا يدٍ بشرية، فإن قال رقمًا غيرَ الشاشة فلا حقيقةَ
   واحدة. يُشغَّل على بياناتٍ معلومةٍ ويُطالَب: اللقطةُ من دوالِّ التطبيق نفسِها،
   والتقريرُ يحمل الشاشةَ حرفًا، ورمزُ اليوم لا يُكتَب بل بصمتُه، والصفحةُ
   المشتركةُ تقرأ من فرع اللقطات لا من الأصل، والسيرُ يُعيد تثبيتَه ولا يمسُّ الأصل.
   ═════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { createHash, pbkdf2Sync, createDecipheriv } from 'crypto';
import { createRequire } from 'module';
import { tmpdir } from 'os';
import { join } from 'path';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

const dir = mkdtempSync(join(tmpdir(), 'nsk-min-')), now = Date.now();
const recs = {}; for (let i = 1; i <= 60; i++) recs['NSK-MIN-CMP-' + String(i).padStart(4, '0')] = { at: now - i * 36e5, by:'أحمد', access:'تم الوصول', chals: i % 5 ? ['لا توجد تحديات'] : ['ارتفاع صعب الوصول'], review: i <= 20 ? 'approved' : 'pending' };
recs['NSK-MIN-CMP-0061'] = { at: now - 5e6, by:'أحمد', access:'لم يُصل', reason:'مغلق' };
const src = join(dir, 'src.json');
writeFileSync(src, JSON.stringify({ recs, inss:{}, tasks:{}, newsites:{}, steps:{ a:{ kind:'visit', at: now - 36e5, by:'أحمد' }, b:{ kind:'ins', at: now - 72e5, by:'سالم' } }, points:{ dueSurvey: now + 30 * 864e5 } }));
const out = execFileSync('node', ['scripts/ministry-report.mjs'], { encoding:'utf8', env:{ ...process.env, MINISTRY_SRC:src, MINISTRY_OUT:dir, MINISTRY_SECRET:'sirr', FIREBASE_SERVICE_ACCOUNT:'' } });
/* (V17.94) المنشورُ مشفَّر — يُفَكُّ هنا بالرمز كما تفكُّه الصفحة */
const pub = JSON.parse(readFileSync(join(dir, 'snapshot.json'), 'utf8')), rep = readFileSync(join(dir, 'report.html'), 'utf8');
const code0 = readFileSync(join(dir, 'code.txt'), 'utf8').trim();
const openSnap = (p, c) => { if (!p.ct) return p; const key = pbkdf2Sync(c, 'nusuk-ministry-v1', p.iter, 32, 'sha256'), buf = Buffer.from(p.ct, 'base64');
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(p.iv, 'base64')); d.setAuthTag(buf.subarray(buf.length - 16));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(0, buf.length - 16)), d.final()]).toString('utf8')); };
const snap = openSnap(pub, code0);

console.log('\n══ ١ · اللقطةُ من دوالِّ التطبيق ══');
T(snap.total === 1787 && snap.surveyed === 60 && snap.stuck === 1 && snap.installed === 0, 'الأرقامُ الكبرى كما تحسبها الشاشات: ' + snap.surveyed + '/' + snap.total + ' · متعذّر ' + snap.stuck);
T(snap.zones['منى'] && snap.zones['منى'].sv === 60 && Object.values(snap.zones).reduce((a, z) => a + z.n, 0) === 1787, 'ومشاعرُها تُجمَع إلى الكلّ');
T(snap.zones['منى'].eta > now && snap.day.kinds.visit === 1 && snap.day.people === 2, 'والتوقّعُ ونبضُ اليوم فيها');
T(snap.visited === 40 && snap.minwait === 20 && snap.challenges[0][0] === 'ارتفاع صعب الوصول' && snap.challenges[0][1] === 12, 'وما ينتظر قرارًا والتحدياتُ من دورة الحياة نفسِها');
T(!JSON.stringify(snap).includes('NSK-') && !JSON.stringify(snap).includes('أحمد'), 'ولا معرِّفَ ولا اسمًا فيها — أرقامٌ فقط');

console.log('\n══ ٢ · الرمزُ لا يُكتَب بل بصمتُه ══');
const code = readFileSync(join(dir, 'code.txt'), 'utf8');
T(/^[0-9A-F]{6}$/.test(code) && snap.gate === createHash('sha256').update(code).digest('hex'), 'اللقطةُ تحمل بصمةَ الرمز لا الرمزَ: ' + code.replace(/./g, '•'));
T(!rep.includes(code) && !JSON.stringify(snap).includes(code), 'والرمزُ لا يظهر في التقرير ولا في اللقطة');

const page = readFileSync('docs/ministry/index.html', 'utf8'), wf = readFileSync('.github/workflows/ministry.yml', 'utf8');
console.log('\n══ ٣ · التقريرُ هو الشاشة ══');
T((rep.match(/kk-ring/g) || []).length >= 5 && rep.includes('المشاعرُ — كم أُنجز وكم بقي') && rep.includes('نبضُ الميدان'), 'التقريرُ يحمل حلقاتِ الشاشة وصناديقَها');
T(rep.includes(':root{') && rep.includes('.kk-ring') && rep.includes('dir="rtl"'), 'وتنسيقَها كاملًا مستقلًّا بالعربية');
T(/يكتمل نحو/.test(rep), 'والتوقّعَ');
T(rep.includes('class="cover"') && rep.includes('تقرير المتابعة الأسبوعي') && rep.includes('cover-story') && rep.includes('break-after:page'), 'وغلافًا بالهوية يحمل الأسبوعَ في جملة ثم تبدأ الصفحاتُ (V17.90)');
let hasQr = false; try { createRequire(import.meta.url)('qrcode'); hasQr = true; } catch {}
T(/qrcode@\^1/.test(readFileSync('.github/workflows/ministry.yml', 'utf8')) && rep.includes('class="cover-qr"') === hasQr && (hasQr || /qrcode غير مثبَّتة/.test(out)),
  'ورمزُ QR يُولَّد محليًّا ويُضمَّن حين تتوفّر مكتبتُه — وإلا يُقال إنه غاب (هنا: ' + (hasQr ? 'مضمَّن' : 'غائب') + ')');
T(typeof snap.story === 'string' && /هذا الأسبوع مُسح/.test(snap.story) && rep.includes('--min-green') && rep.includes('kk-story'), 'والأسبوعَ في جملةٍ في اللقطة والتقرير، والألوانَ من طقم الهوية');
T(page.includes('--min-green') && page.includes('s.story'), 'والصفحةُ المشتركةُ بالطقم نفسِه وتعرض الجملة');
/* (V17.94) اللقطةُ المنشورةُ مشفَّرة: لا رقمَ صريحًا، وتُفَكُّ بالرمز وحدَه */
{
  T(pub.enc === 'aes-256-gcm' && pub.ct && pub.iv && pub.gate && pub.total === undefined && pub.zones === undefined && !JSON.stringify(pub).includes('story'), 'اللقطةُ المنشورةُ مشفَّرة — لا رقمَ ولا جملةَ صريحةً فيها');
  T(snap.total === 1787 && Array.isArray(snap.chain) && typeof snap.story === 'string', 'وتُفَكُّ بمفتاحٍ مشتقٍّ من رمز اليوم إلى الأرقام نفسِها');
  const buf = Buffer.from(pub.ct, 'base64');
  let wrong = false; try { openSnap(pub, 'WRONG1'); } catch { wrong = true; }
  T(wrong, 'ورمزٌ خاطئٌ لا يفتحها');
  T(/PBKDF2/.test(page) && /AES-GCM/.test(page) && /nusuk-ministry-v1/.test(page) && /if \(!snap\.ct\) return snap;/.test(page), 'والصفحةُ تشتقُّ المفتاحَ من الرمز وتفكُّ في المتصفّح — وتقبل الصريحةَ في الفحص');
}

console.log('\n══ ٤ · الصفحةُ المشتركةُ والسير ══');

T(page.includes('raw.githubusercontent.com/mhmdsfwt371/Project-survey/ministry/snapshot.json') && page.includes('crypto.subtle'), 'الصفحةُ تقرأ فرعَ اللقطات وتقارن بصمةَ الرمز في المتصفّح');
T(!page.includes('firebase') && !page.includes('googleapis'), 'ولا تعرف القاعدةَ — أرقامٌ عامةٌ فقط');
T(/ministry:ministry/.test(wf) && !/push .*main/.test(wf), 'والسيرُ يدفع إلى فرع ministry وحدَه لا إلى الأصل');
T((wf.match(/for i in 1 2 3/g) || []).length >= 2 && /MAIL_ATTACH/.test(wf) && /ministry-pdf\.mjs/.test(wf), 'ويُعيد التثبيتَ ويرسل PDF مرفقًا');
T(/0 5 \* \* 6/.test(wf) && /20 \*\/6 \* \* \*/.test(wf), 'كلَّ ستِّ ساعاتٍ لقطة، وكلَّ سبتٍ تقرير');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تقرير الوزارة نظيف \u2705');
