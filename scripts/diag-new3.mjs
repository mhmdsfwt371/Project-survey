/* النقاطُ المضافةُ في عرفات خلال يومين: بياناتُها وزياراتُها وصورُها وأحداثُها — قراءةٌ فقط (لا يُطبَع إلا أعداد) */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const since = Date.now() - 2.5 * 864e5;
const ns = (await db.collection('newsites').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }))
  .filter(x => !x.v.deleted && !x.v.hidden && (+x.v.at || +x.v._at || 0) >= since);
const out = [];
for (const n of ns){
  const rec = await db.collection('recs').doc(n.id).get();
  const ph = (await db.collection('photos').where('site', '==', n.id).get()).docs.map(d => { const v = d.data() || {}; return { id: d.id, kind: v.kind, by: v.by, at: v.at, keys: Object.keys(v).filter(k => k !== 'data' && k !== 'b64').slice(0, 12) }; });
  const ph2 = ph.length ? ph : (await db.collection('photos').get()).docs.filter(d => d.id.indexOf(n.id) === 0).map(d => { const v = d.data() || {}; return { id: d.id, kind: v.kind, by: v.by, at: v.at, keys: Object.keys(v).filter(k => k !== 'data' && k !== 'b64').slice(0, 12) }; });
  const ev = (await db.collection('events').where('site', '==', n.id).get()).docs.map(d => d.data() || {}).map(e => ({ ts: e.ts, what: String(e.what || '').slice(0, 140), by: e.by }));
  const tsk = (await db.collection('tasks').where('site', '==', n.id).get()).docs.map(d => ({ id: d.id, v: d.data() }));
  out.push({ id: n.id, site: n.v, rec: rec.exists ? rec.data() : null, photos: ph2, events: ev, tasks: tsk });
}
writeFileSync('/tmp/exp/new3.json', JSON.stringify({ at: new Date().toISOString(), count: out.length, items: out }));
console.log('new sites in 2.5 days', out.length, '| with rec', out.filter(x => x.rec).length);
