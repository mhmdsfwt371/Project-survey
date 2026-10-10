/* قراءةٌ فقط — تشخيصُ انهيار الصفحة على آيفون: كم تحمل وثائقُ الصور من بياناتٍ خام (base64)، وأحجامُ المجموعات بالبايت، وأخطاءُ الأجهزة ووقتُ رسمها */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true }); const out = {};
const T = ts => ts ? new Date(+ts + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '';
for (const c of ['photos', 'recs', 'sites', 'newsites', 'tasks', 'inss', 'steps', 'events']){
  const s = await db.collection(c).get(); let bytes = 0, withData = 0, dataBytes = 0, big = 0, newest1500 = 0;
  const arr = []; s.forEach(d => { const x = d.data() || {}; const j = JSON.stringify(x); bytes += j.length; if (typeof x.data === 'string' && x.data.length > 1000){ withData++; dataBytes += x.data.length; } if (j.length > 50000) big++; arr.push([+x._at || 0, j.length, typeof x.data === 'string' ? x.data.length : 0]); });
  if (c === 'photos'){ arr.sort((a, b) => b[0] - a[0]); newest1500 = arr.slice(0, 1500).reduce((a, x) => a + x[1], 0); }
  out[c] = { n:s.size, mb:+(bytes / 1048576).toFixed(1), withData, dataMb:+(dataBytes / 1048576).toFixed(1), big, newest1500Mb:c === 'photos' ? +(newest1500 / 1048576).toFixed(1) : undefined };
}
const pr = await db.collection('presence').get(); const dev = [];
pr.forEach(d => { const x = d.data() || {}; if (+(x.at || 0) > Date.now() - 10 * 864e5) dev.push({ name:x.name || '', ver:x.ver || '', at:T(x.at), ua:String(x.ua || '').slice(0, 60), err:x.err || 0, rms:x.rms || 0, pms:x.pms || 0, up:x.up || 0, reads:x.reads || 0, q:x.q || 0, pq:x.pq || 0, pz:x.pz || 0, persist:x.persist || '', idbBad:x.idbBad || x.idb || '' }); });
out.devices = dev.sort((a, b) => b.err - a.err);
writeFileSync('/tmp/exp/mem-stats.json', JSON.stringify(out)); console.log('ok');
