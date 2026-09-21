/* ═══════════════════════════════════════════════════════════════════════════
   تقريرُ الوزارة — node scripts/ministry-report.mjs
   ───────────────────────────────────────────────────────────────────────────
   لا حقيقةَ ثانية: يُحمَّل التطبيقُ نفسُه في متصفّحٍ صوري، وتُحقَن فيه بياناتُ
   القاعدة كما يسحبها الهاتف، ثم تُرسَم «شاشةُ الوزارة» بدوالِّها هي —
   فالتقريرُ والشاشةُ رقمٌ واحد. يخرج منه:
     • ملفُّ HTML كاملٌ مستقلٌّ (بالتنسيق نفسِه) يُطبَع PDF في السحابة ويُرسَل بالبريد.
     • لقطةُ أرقامٍ JSON للصفحة المشتركة (لا أسماءَ ولا معرِّفات — أرقامٌ فقط).
     FIREBASE_SERVICE_ACCOUNT — القاعدة؛ أو MINISTRY_SRC ملفُ JSON للاختبار
     MINISTRY_OUT (افتراضًا /tmp/ministry) — مجلدُ المخرجات: report.html · snapshot.json
     MINISTRY_SECRET — إن وُجد: رمزُ اليوم = أوّلُ ستةِ أحرفٍ من sha256(secret|YYYY-MM-DD)،
                       ويُكتَب في اللقطة sha256(الرمز) لا الرمزُ نفسُه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

const OUT = process.env.MINISTRY_OUT || '/tmp/ministry';
mkdirSync(OUT, { recursive:true });
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── البيانات ─────────────────────────────────────────────────────────── */
async function loadData(){
  if (process.env.MINISTRY_SRC) return JSON.parse(readFileSync(process.env.MINISTRY_SRC, 'utf8'));
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa){ console.log('::notice::لا حسابَ خدمة — التقريرُ من الحالة المدمجة وحدَها'); return {}; }
  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
  const fs = admin.firestore(), out = {};
  for (const name of ['recs', 'inss', 'tasks', 'newsites', 'steps']){
    const m = {}; (await fs.collection(name).limit(6000).get()).forEach(d => { m[d.id] = d.data(); }); out[name] = m;
  }
  const p = await fs.collection('settings').doc('points').get(); out.points = p.exists ? p.data() : {};
  return out;
}
const data = await loadData();

/* ── التطبيقُ نفسُه في متصفّحٍ صوري ────────────────────────────────────── */
const html = readFileSync('index.html', 'utf8');
const vc = new VirtualConsole();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'تقرير' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);

/* الحقنُ كما يسحب الهاتف: الوثيقةُ بمعرِّفها في مجموعتها */
const put = (k, m) => { if (!m) return; if (!w.STATE[k]) w.STATE[k] = {}; Object.keys(m).forEach(id => { w.STATE[k][id] = m[id]; }); };
put('recs', data.recs); put('inss', data.inss); put('tasks', data.tasks);
if (data.newsites) Object.keys(data.newsites).forEach(id => { if (!w.siteFind(id)) w.STATE.sites.push(data.newsites[id]); });
if (data.steps) w.STATE.steps = Object.values(data.steps);
if (data.points) Object.keys(data.points).forEach(k => { if (k in w.CFG) w.CFG[k] = data.points[k]; });
w.TK_IX = null; w.STAT_CACHE = null; w.SITE_IX = null;

/* ── اللقطةُ: أرقامٌ فقط ──────────────────────────────────────────────── */
const K = w.siteKeyStats(), S = K.total, now = Date.now();
const life = {}; w.STATE.sites.forEach(x => { const l = w.lifeOf(x); life[l] = (life[l] || 0) + 1; });
const zones = {};
Object.keys(K.zones).forEach(z => { const o = K.zones[z], f = w.zoneForecast(z) || {}; zones[z] = { n:o.n, sv:o.sv, ins:o.ins, stuck:o.stuck, eta: f.eta || 0, late: !!f.late, stalled: !!f.stalled }; });
const day = now - 864e5, kinds = {}; const people = new Set();
(w.STATE.steps || []).forEach(s => { if (+s.at >= day){ kinds[s.kind] = (kinds[s.kind] || 0) + 1; if (s.by) people.add(s.by); } });
const byCh = {}; w.svdRows().forEach(o => o.ch.forEach(c => { byCh[c] = (byCh[c] || 0) + 1; }));
const snapshot = {
  at: now, version: (/class="ver-tag"[\s\S]{0,240}?>نسخة\s*(V[\d.]+)</.exec(html) || [])[1] || '',
  total: S.n, surveyed: S.sv, installed: S.ins, noRec: S.noRec, stuck: S.stuck,
  minOk: (life.ready || 0) + (life.sched || 0) + (life.installed || 0) + (life.handed || 0),
  minwait: life.minwait || 0, visited: life.visited || 0, ready: life.ready || 0,
  zones, day: { kinds, people: people.size },
  challenges: Object.keys(byCh).sort((a, b) => byCh[b] - byCh[a]).slice(0, 5).map(c => [c, byCh[c]]),
  chain: w.chainRows().map(r => [r.n, r.done]),
  story: w.kioskStory()
};
if (process.env.MINISTRY_SECRET){
  const dayKey = new Date(now).toISOString().slice(0, 10);
  const code = createHash('sha256').update(process.env.MINISTRY_SECRET + '|' + dayKey).digest('hex').slice(0, 6).toUpperCase();
  snapshot.gate = createHash('sha256').update(code).digest('hex');
  writeFileSync(OUT + '/code.txt', code);
}
writeFileSync(OUT + '/snapshot.json', JSON.stringify(snapshot));

/* ── الغلافُ ورمزُ الوصول (V17.90) ──────────────────────────────────────────
   صفحةُ غلافٍ بالهوية: العنوانُ والتاريخُ والأسبوعُ في جملة، ورمزُ QR يفتح
   الصفحةَ المشتركةَ من الهاتف. الرمزُ يُولَّد محليًّا (مكتبةُ qrcode إن وُجدت)
   ويُضمَّن صورةً في الملف — لا يعتمد على خدمةٍ خارجية. */
let qrData = '';
try {
  const QR = require('qrcode');
  qrData = await QR.toDataURL('https://mhmdsfwt371.github.io/Project-survey/docs/ministry/', { margin:1, width:220, color:{ dark:'#0B6E4F', light:'#ffffff' } });
} catch { qrData = ''; }
const coverHtml = `<section class="cover">
  <div class="cover-brand">وزارة الحج والعمرة · مشروع قارئات أفاقي</div>
  <h1>تقرير المتابعة الأسبوعي</h1>
  <div class="cover-sub">حج ١٤٤٨هـ — ${new Date(now).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' })}</div>
  <div class="cover-story">${w.esc(w.kioskStory())}</div>
  ${qrData ? '<div class="cover-qr"><img src="' + qrData + '" alt=""><div>الصفحة المشتركة — تُفتح من الهاتف برمز اليوم</div></div>' : ''}
  <div class="cover-foot">تقرير آلي من نظام قارئات أفاقي — الأرقام من سجلات الميدان لحظة التوليد، ولا يد بشرية فيها.</div>
</section>`;

/* ── التقريرُ: شاشةُ الوزارة بدوالِّها وتنسيقها ─────────────────────────── */
w.KK_ZONE = 'منى';
const body = w.kioskBody();
const css = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
const rules = (css.match(/:root\{[^}]*\}/) || [''])[0] + '\n'
  + (css.match(/:root\{--min-[^}]*\}/) || [''])[0] + '\n'
  + (css.match(/\.kk[^{]*\{[^}]*\}|@keyframes kkPulse\{[^}]*\}\}?|\.chip[^{]*\{[^}]*\}|\.btn[^{]*\{[^}]*\}|\.hint\{[^}]*\}|\.num\{[^}]*\}/g) || []).join('\n');
const report = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الوزارة — قارئات أفاقي</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
${rules}
body{margin:0;background:#fff;color:var(--ink,#14181d);font-family:system-ui,"Segoe UI",Tahoma,sans-serif;padding:18px}
.btn,[data-kiosk],.chip{display:none!important}
.rep-foot{margin-top:18px;color:#5b6673;font-size:12px;border-top:1px solid #e2e6ea;padding-top:8px}
.cover{min-height:92vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:14px;padding:24px;border:6px solid var(--min-green,#0B6E4F);border-radius:18px;margin-bottom:24px}
.cover-brand{color:var(--min-gold,#C9A227);font-weight:700;letter-spacing:.3px}
.cover h1{font-size:34px;margin:0;color:var(--min-green,#0B6E4F)}
.cover-sub{font-size:16px;color:#5b6673}
.cover-story{max-width:640px;font-size:17px;line-height:1.9;font-weight:600;background:linear-gradient(135deg,rgba(11,110,79,.10),rgba(201,162,39,.12));border-radius:14px;padding:12px 18px}
.cover-qr img{width:170px;height:170px}.cover-qr div{font-size:12px;color:#5b6673;margin-top:4px}
.cover-foot{font-size:11.5px;color:#5b6673;margin-top:10px}
@media print{body{padding:8mm}.kk-box,.kk-ring{break-inside:avoid}.cover{break-after:page;min-height:auto;padding:40px 24px}}
</style></head><body>${coverHtml}${body}
<div class="rep-foot">تقريرٌ آليٌّ من نظام قارئات أفاقي — النسخة ${snapshot.version} — ${new Date(now).toLocaleString('ar-EG')} — الأرقامُ من سجلات الميدان لحظةَ التوليد.</div>
</body></html>`;
writeFileSync(OUT + '/report.html', report);
console.log((qrData ? '✓ رمزُ QR مضمَّن' : '::notice::qrcode غير مثبَّتة — غلافٌ بلا رمز'));
console.log(`✓ التقرير: ${OUT}/report.html (${Math.round(report.length / 1024)} ك.ب) · اللقطة: ${OUT}/snapshot.json · المسح ${S.sv}/${S.n} · التركيب ${S.ins}`);
process.exit(0);
