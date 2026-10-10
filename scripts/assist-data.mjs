/* قراءةٌ فقط — ما تقوله البياناتُ عن حاجة الناس للمساعد: البلاغاتُ كلُّها، وأنواعُ الأحداث وأكثرُ الأخطاء تكرارًا (آخرُ ٣٠ يومًا)،
   وأكثرُ كلمات ملاحظات الميدان، وما بحث عنه الناسُ في المساعد إن سُجّل */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true }); const out = {}; const T = ts => ts ? new Date(+ts + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '';
const bugs = await db.collection('bugs').get(); out.bugs = [];
bugs.forEach(d => { const x = d.data() || {}; out.bugs.push({ at:T(x.at), kind:x.kind || '', by:x.by || '', st:x.status || '', txt:String(x.txt || '').slice(0, 220), want:String(x.want || '').slice(0, 120), page:(x.ctx && x.ctx.page) || '' }); });
out.bugs.sort((a, b) => a.at < b.at ? 1 : -1);
const since = Date.now() - 30 * 864e5; const ev = await db.collection('events').where('_at', '>', since).get();
const kinds = {}, errs = {}, help = {}, pages = {};
ev.forEach(d => { const x = d.data() || {}; const w = String(x.what || x.t || ''); const k = w.split(' — ')[0].split(':')[0].trim().slice(0, 50); kinds[k] = (kinds[k] || 0) + 1;
  if (/تعذّر|تعذر|فشل|خطأ|سقط|رُفض|رفض|معزول/.test(w)) { const e = w.replace(/NSK-[A-Z]+-[A-Z]+-\d+/g, 'NSK').replace(/\d+/g, '#').slice(0, 90); errs[e] = (errs[e] || 0) + 1; }
  if (/مساعد|بحث|سؤال/.test(w)) help[w.slice(0, 90)] = (help[w.slice(0, 90)] || 0) + 1; });
const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
out.events30 = ev.size; out.kinds = top(kinds, 40); out.errors = top(errs, 30); out.helpEv = top(help, 15);
const recs = await db.collection('recs').get(); const words = {}; let notes = 0;
const STOP = new Set('في من على عن الى إلى او أو و ما لا مع هذا هذه تم يوجد عند بين كل غير اللي ده دي فيه فيها لم لن قد ثم انه أنه هو هي'.split(' '));
recs.forEach(d => { const x = d.data() || {}; const s = [x.note, x.chal_note, x.why_note].filter(Boolean).join(' '); if (!s) return; notes++; s.replace(/[^\u0600-\u06FF\s]/g, ' ').split(/\s+/).forEach(w => { w = w.replace(/^ال/, ''); if (w.length < 3 || STOP.has(w)) return; words[w] = (words[w] || 0) + 1; }); });
out.notes = notes; out.noteWords = top(words, 50);
const nf = await db.collection('notifs').get().catch(() => null); if (nf){ const nk = {}; nf.forEach(d => { const x = d.data() || {}; const k = String(x.kind || '').slice(0, 40); nk[k] = (nk[k] || 0) + 1; }); out.notifKinds = top(nk, 20); }
writeFileSync('/tmp/exp/assist-data.json', JSON.stringify(out)); console.log('ok', out.bugs.length, out.events30);
