/* ═══════════════════════════════════════════════════════════════════════════
   نبضُ المشروع — node scripts/pulse.mjs
   ───────────────────────────────────────────────────────────────────────────
   التقريرُ الكاملُ يُولَّد كلَّ ثلاثة أيامٍ ويُقرأ في المستودع، والشاشاتُ تعرض
   كلَّ شيءٍ لمن يفتحها. وما ينقص بينهما: سطرٌ قصيرٌ كلَّ صباحٍ يقول **ما ينتظر
   يدًا اليوم** — زيارةٌ تنتظر اعتمادًا منذ أيام، موقعٌ جديدٌ لم يُعتمَد، مهمةٌ
   أُسندت ولم تتحرّك، بلاغٌ لم يُقرأ. فما لا يُرى لا يُعالَج، ومن ينتظر قرارًا
   لا يذكّر بنفسه.

   المصدرُ وثائقُ القاعدة كما هي — لا حسابَ ثانيًا لدورة الحياة: الشاشاتُ هي
   مرجعُ الحالة، وهذا يقول «هنا شيءٌ توقّف، افتحه».
     FIREBASE_SERVICE_ACCOUNT — حسابُ الخدمة (كما في النسخة والتقرير)
     PULSE_SRC   — بديلٌ للاختبار: ملفُّ JSON بالمجموعات نفسِها
     PULSE_OUT   — أين يُكتَب النصُّ (يرسله البريدُ بعده)
     PULSE_STALE — كم يومًا يُعدُّ انتظارًا (٣ افتراضًا)
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const DAY = 864e5;
const STALE = +(process.env.PULSE_STALE || 3);
const now = Date.now();
const nm = n => Number(n || 0).toLocaleString('ar-EG');
const days = ts => Math.floor((now - (+ts || now)) / DAY);
const col = (db, k) => (db && db[k] && typeof db[k] === 'object') ? Object.values(db[k]) : [];

/* ── المصدر: القاعدةُ أو ملفٌّ للاختبار ─────────────────────────────────── */
async function load(){
  if (process.env.PULSE_SRC) return JSON.parse(readFileSync(process.env.PULSE_SRC, 'utf8'));
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa){ console.log('::notice title=لا نبض::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  let admin;
  try { admin = require('firebase-admin'); }
  catch { console.log('::warning::firebase-admin غير مثبَّت — لا نبضَ اليوم'); process.exit(0); }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
  const fs = admin.firestore();
  const out = {};
  for (const name of ['recs', 'tasks', 'newsites', 'bugs', 'steps']){
    const snap = await fs.collection(name).limit(6000).get();
    const m = {}; snap.forEach(d => { m[d.id] = d.data(); });
    out[name] = m;
  }
  return out;
}
const db = await load();

const recs = col(db, 'recs'), tasks = col(db, 'tasks'), news = col(db, 'newsites'),
      bugs = col(db, 'bugs'), steps = col(db, 'steps');

/* ── ١ · أمسِ في الميدان — من الخطوات المرفوعة ─────────────────────────── */
const KIND = { visit:'زيارة', ins:'تركيب', dis:'فكّ', newsite:'موقعٌ جديد', maint:'صيانة', deliver:'تسليم' };
const since = now - DAY;
const dayS = steps.filter(s => +s.at >= since);
const byKind = {};
dayS.forEach(s => { byKind[s.kind] = (byKind[s.kind] || 0) + 1; });
const people = [...new Set(dayS.map(s => s.by).filter(Boolean))];

/* ── ٢ · ما ينتظر قرارًا ───────────────────────────────────────────────── */
const pend    = recs.filter(r => r && r.review === 'pending');
const pendOld = pend.filter(r => days(r.at) >= STALE);
const revisit = recs.filter(r => r && r.review === 'revisit');
const newWait = news.filter(x => x && x.isNew && !x.approved);
const bugNew  = bugs.filter(b => b && (b.status === 'جديد' || !b.status));

/* ── ٣ · ما أُسنِد ولم يتحرّك ──────────────────────────────────────────── */
const DONE = ['معتمد', 'منجز', 'مغلق', 'ملغى'];
const openT = tasks.filter(t => t && !DONE.includes(String(t.status || '')) && !t.doneAt);
const stuckT = openT.filter(t => days(t.at) >= 5);
const byTask = {};
stuckT.forEach(t => { byTask[t.kind] = (byTask[t.kind] || 0) + 1; });

/* ── النصّ ─────────────────────────────────────────────────────────────── */
const oldest = a => a.length ? Math.max(...a.map(x => days(x.at))) : 0;
const L = [];
L.push('# نبضُ نُسُك — ' + new Date(now).toISOString().slice(0, 10));
L.push('');
L.push('## أمسِ في الميدان');
const act = Object.keys(byKind).map(k => `${KIND[k] || k}: **${nm(byKind[k])}**`).join(' · ');
L.push(act ? act + `  — ${nm(people.length)} شخصًا` : 'لا خطوةَ مرفوعةً في آخر أربعٍ وعشرين ساعة.');
L.push('');
L.push('## ما ينتظر قرارًا');
const wait = [];
if (pend.length)    wait.push(`- زياراتٌ تنتظر الاعتمادَ التقني: **${nm(pend.length)}**` + (pendOld.length ? ` — منها **${nm(pendOld.length)}** مضى عليها ${nm(STALE)} أيامٍ فأكثر (أقدمُها ${nm(oldest(pendOld))} يومًا)` : ''));
if (revisit.length) wait.push(`- زياراتٌ رُدَّت وتحتاج زيارةً أخرى: **${nm(revisit.length)}**`);
if (newWait.length) wait.push(`- مواقعُ جديدةٌ بانتظار الاعتماد: **${nm(newWait.length)}** (أقدمُها ${nm(oldest(newWait))} يومًا)`);
if (bugNew.length)  wait.push(`- بلاغاتٌ لم تُقرأ: **${nm(bugNew.length)}**`);
L.push(wait.length ? wait.join('\n') : 'لا شيءَ ينتظر — كلُّ ما وصل عُولج.');
L.push('');
L.push('## ما أُسنِد ولم يتحرّك');
const st = Object.keys(byTask).map(k => `${KIND[k] || k}: **${nm(byTask[k])}**`).join(' · ');
L.push(stuckT.length ? `مهامُّ مفتوحةٌ منذ خمسة أيامٍ فأكثر — ${st}` : 'لا مهمّةَ راكدةً فوق خمسة أيام.');
L.push('');
L.push(`_المفتوحُ كلُّه: ${nm(openT.length)} مهمّة · الزياراتُ المسجَّلة: ${nm(recs.length)}_`);
L.push('');
L.push('القرارُ والتفصيلُ في التطبيق: «متابعة العمل الميداني» للزيارات، و«الطلبات والتوزيع» للإسناد، و«تصحيح البيانات» لما ينقص في السجل.');

const text = L.join('\n');
console.log(text);
if (process.env.PULSE_OUT) writeFileSync(process.env.PULSE_OUT, text);
if (process.env.GITHUB_STEP_SUMMARY) { try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n'); } catch {} }

/* رقمٌ واحدٌ يقول أيُرسَل البريدُ أم لا: لا شيءَ ينتظر ⇦ لا رسالةَ صباحية،
   فالرسالةُ التي تقول «تمام» كلَّ يومٍ تُعلِّم صاحبَها ألا يفتحها */
const needHand = pendOld.length + revisit.length + newWait.length + bugNew.length + stuckT.length;
if (process.env.GITHUB_OUTPUT){
  try { appendFileSync(process.env.GITHUB_OUTPUT, `hand=${needHand}\n`); } catch {}
}
console.log('\nيحتاج يدًا: ' + needHand);
process.exit(0);
