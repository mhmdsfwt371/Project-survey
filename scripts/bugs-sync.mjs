/* ═══════════════════════════════════════════════════════════════════════════
   جسرُ البلاغات — node scripts/bugs-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   البلاغُ يُكتَب في التطبيق من الميدان، ويُرفَع إلى القاعدة، ويُدار من التطبيق.
   كان يُفتَح بلاغًا عامًّا في المستودع؛ ومنذ V17.94 يبقى في القاعدة وحدَها
   (انظر أدناه). يعمل مع سير الخادم كلَّ عشر دقائق.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';

const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO  = process.env.GITHUB_REPOSITORY || 'mhmdsfwt371/Project-survey';
const SA    = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!SA){ console.log('بلا مفتاحِ خدمة — لا جسرَ للبلاغات'); process.exit(0); }
if (!TOKEN){ console.log('بلا مفتاحِ مستودع — لا تُفتَح بلاغات'); process.exit(0); }

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();

const gh = async (path, init = {}) => {
  const r = await fetch('https://api.github.com/' + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json',
               'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  if (!r.ok) throw new Error(path + ' → ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
};


/* ═══ (V17.94) لا بلاغَ عامًّا بعد اليوم ═══
   كان البلاغُ يُفتَح في مستودعٍ عامٍّ بنصِّه ومبلِّغه وجهازه وشاشته — يقرؤه من لا
   شأنَ له. صار يبقى في القاعدة ويُدار من التطبيق (صحة النظام ← البلاغات):
   المقبولُ يصير قيدَ التنفيذ هنا، وما طلب المديرُ إغلاقَه يُغلَق هنا. وما فُتح
   من قبل في المستودع يُغلَق مرةً واحدةً بتعليقٍ يقول أين صار. */
let opened = 0, closed = 0;
const snap = await db.collection('bugs').orderBy('at', 'desc').limit(200).get();

/* ١ · المقبولُ يصير قيدَ التنفيذ — بلا بلاغٍ عامّ */
for (const d of snap.docs){
  const b = { id: d.id, ...d.data() };
  if (b.status !== 'مقبول') continue;
  try { await d.ref.update({ status: 'قيد التنفيذ', ghAt: Date.now() }); opened++; }
  catch (e){ console.log('تعذّر تحديثُ بلاغ: ' + e.message); }
}

/* ٢ · ما طلب المديرُ إغلاقَه يُغلَق في القاعدة مباشرة */
for (const d of snap.docs){
  const b = { id: d.id, ...d.data() };
  if (!b.closeAsk) continue;
  try { await d.ref.update({ status: 'مغلق', closedAt: b.closedAt || Date.now(), closeAsk: false }); closed++; }
  catch (e){ console.log('تعذّر إغلاقُ بلاغ: ' + e.message); }
}

/* ٣ · إغلاقُ ما فُتح من قبل في المستودع — مرةً واحدة، ويُختَم في settings/bridge */
try {
  const brd = await db.collection('settings').doc('bridge').get();
  if (!(brd.exists && brd.data().issuesClosed)){
    let n = 0;
    for (const label of ['بلاغ', 'نبض', 'تقرير']){
      const list = await gh(`repos/${REPO}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`);
      for (const is of (Array.isArray(list) ? list : [])){
        if (is.pull_request) continue;
        try {
          await gh(`repos/${REPO}/issues/${is.number}/comments`, { method:'POST', body: JSON.stringify({ body: 'أُغلق: البلاغاتُ والنبضُ والتقاريرُ تُتابَع داخل التطبيق (صحة النظام) لا في المستودع العام — منذ V17.94.' }) });
          await gh(`repos/${REPO}/issues/${is.number}`, { method:'PATCH', body: JSON.stringify({ state:'closed', state_reason:'not_planned' }) });
          n++;
        } catch (e){ console.log('تعذّر إغلاقُ #' + is.number + ': ' + e.message); }
      }
    }
    await db.collection('settings').doc('bridge').set({ issuesClosed: true, issuesClosedAt: Date.now(), issuesClosedN: n }, { merge: true });
    console.log(`أُغلق ${n} بلاغًا عامًّا — مرةً واحدة`);
  }
} catch (e){ console.log('تعذّر إغلاقُ البلاغات العامة: ' + e.message); }

/* ختمُ آخر تشغيلٍ (V17.39): تقرؤه شاشةُ الاستهلاك فيُعرَف إن وقف الجسرُ قبل أن يضيع بلاغ */
try { await db.collection('settings').doc('bridge').set({ at: Date.now(), bugs: snap.size, opened, closed, run: process.env.GITHUB_RUN_NUMBER || '' }, { merge: true }); }
catch (e){ console.log('تعذّر ختمُ التشغيل: ' + e.message); }
const pend = snap.docs.filter(d => ((d.data() || {}).status || 'جديد') === 'جديد').length;
const nope = snap.docs.filter(d => (d.data() || {}).status === 'مرفوض').length;
console.log(`البلاغات: ${snap.size} في القاعدة · صار قيدَ التنفيذ ${opened} · أُغلق ${closed} · ينتظر قرارَ المدير ${pend} · مردودٌ ${nope}`);
if (pend) console.log(`::notice title=بلاغات::${pend} بلاغًا ينتظر قرارَ المدير في التطبيق`);
if (opened) console.log(`::notice title=بلاغات::${opened} بلاغًا مقبولًا صار قيدَ التنفيذ`);
