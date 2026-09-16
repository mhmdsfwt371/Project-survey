/* ═══════════════════════════════════════════════════════════════════════════
   جسرُ البلاغات — node scripts/bugs-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   البلاغُ يُكتَب في التطبيق من الميدان، ويُرفَع إلى القاعدة. وهذا السكربتُ
   يفتحه **بلاغًا في مستودع المشروع** ثم يكتب رقمَه في وثيقته — فيصل إلى من
   يُصلح بلا أن يبعثه أحد، ويبقى مقروءًا من أيِّ مكانٍ بلا دخولٍ إلى القاعدة.
   يعمل مع سير الخادم كلَّ عشر دقائق. ومن أُغلق بلاغُه في المستودع أُغلق في
   التطبيق في الدورة التالية — فالحالةُ واحدةٌ في الموضعين لا اثنتان.
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

/* نصُّ البلاغ: ما كتبه المبلِّغُ أوّلًا، ثم ما أُرفق تلقائيًّا — فيُقرأ بلا سؤال */
function body(b){
  const c = b.ctx || {};
  return [
    b.txt || '',
    b.want ? '\n**المتوقَّع:** ' + b.want : '',
    '\n---',
    '| | |', '|---|---|',
    `| المبلِّغ | ${b.by || '—'} |`,
    `| النوع | ${b.kind || '—'} |`,
    `| النسخة | \`${c.v || '—'}\` |`,
    `| الشاشة | ${c.page || '—'}${c.tab ? ' / ' + c.tab : ''} |`,
    `| الدور | ${c.role || '—'} |`,
    `| اللغة | ${c.lang || '—'} |`,
    `| الشبكة | ${c.online ? 'متصل' : 'غير متصل'} |`,
    `| الشاشة/الجهاز | ${c.scr || '—'} · ${(c.ua || '—').slice(0, 120)} |`,
    c.err ? `| آخرُ خطأٍ في الجلسة | \`${c.err}\` |` : '',
    `| وقتُ البلاغ | ${new Date(b.at || Date.now()).toISOString()} |`,
    '', `<!-- bug:${b.id} -->`
  ].filter(Boolean).join('\n');
}

let opened = 0, closed = 0;
const snap = await db.collection('bugs').orderBy('at', 'desc').limit(200).get();

/* ١ · ما لم يُفتَح بعدُ — يُفتَح */
for (const d of snap.docs){
  const b = { id: d.id, ...d.data() };
  if (b.gh) continue;
  /* ═══ لا يُفتَح إلا ما قُبل (V17.43) ═══
     كان كلُّ بلاغٍ يُفتَح فورَ وصوله فيبدأ العملُ قبل قرار صاحبه. صار
     المديرُ يقرّر في التطبيق: «مقبول» يُفتَح هنا ليُعمَل به، و«مرفوض» يبقى
     في القاعدة بسببه ولا يُفتَح، و«جديد» ينتظر القرار. */
  if (b.status !== 'مقبول') continue;
  const title = `[${b.kind || 'بلاغ'}] ${String(b.txt || '').replace(/\s+/g, ' ').slice(0, 70)}`;
    const okBy = b.decBy ? `\n\n> قَبِله **${b.decBy}** — ${new Date(b.decAt || Date.now()).toISOString()}` : '';
  try {
    const issue = await gh(`repos/${REPO}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body: body(b) + okBy, labels: ['بلاغ', b.kind || 'عطل', 'مقبول'] })
    });
    await d.ref.update({ gh: issue.number, status: 'قيد التنفيذ', ghAt: Date.now() });
    opened++;
    console.log(`فُتح #${issue.number} — ${title}`);
  } catch (e){ console.log('تعذّر فتحُ بلاغ: ' + e.message); }
}

/* ٢ · ما أُغلق في المستودع — يُغلق في التطبيق، فالحالةُ واحدة */
for (const d of snap.docs){
  const b = { id: d.id, ...d.data() };
  if (!b.gh || b.status === 'مغلق') continue;
  try {
    const issue = await gh(`repos/${REPO}/issues/${b.gh}`);
    if (issue.state === 'closed'){
      await d.ref.update({ status: 'مغلق', closedAt: Date.parse(issue.closed_at || '') || Date.now() });
      closed++;
    }
  } catch (e){ /* بلاغٌ حُذف أو لا يُقرأ — يُترَك كما هو */ }
}

/* ختمُ آخر تشغيلٍ (V17.39): تقرؤه شاشةُ الاستهلاك فيُعرَف إن وقف الجسرُ قبل أن يضيع بلاغ */
try { await db.collection('settings').doc('bridge').set({ at: Date.now(), bugs: snap.size, opened, closed, run: process.env.GITHUB_RUN_NUMBER || '' }, { merge: true }); }
catch (e){ console.log('تعذّر ختمُ التشغيل: ' + e.message); }
const pend = snap.docs.filter(d => ((d.data() || {}).status || 'جديد') === 'جديد').length;
const nope = snap.docs.filter(d => (d.data() || {}).status === 'مرفوض').length;
console.log(`البلاغات: ${snap.size} في القاعدة · فُتح ${opened} · أُغلق ${closed} · ينتظر قرارَ المدير ${pend} · مردودٌ ${nope}`);
if (pend) console.log(`::notice title=بلاغات::${pend} بلاغًا ينتظر قرارَ المدير في التطبيق`);
if (opened) console.log(`::notice title=بلاغات::فُتح ${opened} بلاغًا جديدًا من التطبيق`);
