/* (V28.6) قرارُ المالك: النقاطُ الثلاثُ التي أضافها المشرفُ في عرفات اليوم (لأن مخيمَ السجلّ «يختفي عند التقريب» — حدودُه مرسومةٌ
   بعيدًا عن علامته) تُدمَج زياراتُها وصورُها في مخيمات السجلّ نفسِها باسم من زارها، وتُرفَع النقاطُ المضافة. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const MAP = [['NSK-ARF-CMP-N001', 'NSK-ARF-CMP-0712'], ['NSK-ARF-CMP-N002', 'NSK-ARF-CMP-0713'], ['NSK-ARF-CMP-N003', 'NSK-ARF-CMP-0711']];
const full = v => !!v && ['access', 'mount', 'photos', 'chals', 'power'].some(k => v[k] != null && v[k] !== '' && !(Array.isArray(v[k]) && !v[k].length));
const out = []; const now = Date.now();
for (const [nid, rid] of MAP){
  const row = { from: nid, to: rid };
  const nRec = (await db.collection('recs').doc(nid).get()).data() || null;
  const rRec = (await db.collection('recs').doc(rid).get()).data() || null;
  row.hadRegRec = !!rRec && rRec.deleted !== true; row.regRecAt = rRec ? rRec.at : null;
  if (!nRec){ row.skip = 'لا زيارة على النقطة المضافة'; out.push(row); continue; }
  if (rRec && rRec.deleted !== true && full(rRec) && (+rRec.at || 0) > (+nRec.at || 0)){ row.skip = 'لمخيم السجلّ زيارةٌ أحدث — لا يُكتَب فوقها'; out.push(row); continue; }
  const merged = Object.assign({}, nRec, { id: rid, src: 'merged', mergedFrom: nid, deleted: false, quick: 0, _at: now, _by: 'merge-V28.6' });
  await db.collection('recs').doc(rid).set(merged);
  /* الصورُ تنتقل بحقل الموقع — الملفُّ نفسُه على الدرايف كما هو */
  const ph = await db.collection('photos').where('site', '==', nid).get(); row.photos = ph.size;
  for (const d of ph.docs) await d.ref.update({ site: rid, movedFrom: nid, _at: now });
  await db.collection('newsites').doc(nid).set({ id: nid, deleted: true, mergedInto: rid, at: now, by: 'دمج — قرار المالك', _at: now }, { merge: true });
  await db.collection('recs').doc(nid).set({ id: nid, deleted: true, mergedInto: rid, at: now, by: 'دمج — قرار المالك', _at: now }, { merge: true });
  const ev = { id: 'mg' + now.toString(36) + nid.slice(-1), ts: now, at: '', day: new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what: 'دمج نقطة مضافة في مخيم السجلّ — ' + nid + ' ← ' + rid + ' · زيارة ' + (nRec.by || ''), by: 'mohamed safwat', site: rid, dev: 'merge-V28.6', _at: now };
  await db.collection('events').doc(ev.id).set(ev);
  row.merged = true; row.by = nRec.by; row.at = new Date(+nRec.at).toISOString(); row.access = nRec.access; out.push(row);
}
writeFileSync('/tmp/exp/merge-new3.json', JSON.stringify({ at: new Date().toISOString(), rows: out }));
console.log('merged', out.filter(r => r.merged).length, '| skipped', out.filter(r => r.skip).length, '| photos moved', out.reduce((a, r) => a + (r.photos || 0), 0));
