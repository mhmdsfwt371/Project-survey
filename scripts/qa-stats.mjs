/* قراءةٌ فقط — مراجعةُ فريق التطوير والجودة: أحجامُ المجموعات، وما ينقصه ختمُ الزمن (_at) فلا يصل الأجهزةَ بالسحب التزايدي،
   وعمرُ سجلّ الأحداث، وأيُّ تناقضٍ بين الزيارات والنقاط */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const out = { cols:{} }, now = Date.now();
for (const c of ['recs', 'inss', 'tasks', 'photos', 'events', 'steps', 'sites', 'newsites', 'users', 'presence', 'provision', 'moves', 'diss', 'maints']){
  try { const s = await db.collection(c).get(); let noAt = 0, tomb = 0, old30 = 0, newest = 0, sample = [];
    s.forEach(d => { const x = d.data() || {}; if (x._at == null){ noAt++; if (sample.length < 5) sample.push(d.id); } if (x.deleted) tomb++; const ts = +(x.ts || x.at || x._at || 0); if (ts && now - ts > 30 * 864e5) old30++; if (+x._at > newest) newest = +x._at; });
    out.cols[c] = { n:s.size, noAt, tomb, old30, sampleNoAt:sample }; } catch (e){ out.cols[c] = { err:e.message }; }
}
/* الصورُ بلا _at: من كتبها؟ */
try { const s = await db.collection('photos').get(); const by = {}; s.forEach(d => { const x = d.data() || {}; if (x._at == null){ const k = (x.status || '-') + '|' + (x.driveId ? 'drive' : 'nodrive') + '|' + (x.src || x.by || x._by || '?'); by[k] = (by[k] || 0) + 1; } }); out.photosNoAtBy = by; } catch (e){ out.photosNoAtBy = { err:e.message }; }
writeFileSync('/tmp/exp/qa-stats.json', JSON.stringify(out)); console.log('ok');
