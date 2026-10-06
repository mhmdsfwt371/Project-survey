/* قراءةٌ فقط: سجلّاتُ زيارات محطات القطار (ومسجد نمرة للمقارنة) — حقلُ الوصول والمراجعة والتحديات ومصدرُ الزيارة */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const out = {};
for (const pre of ['NSK-TRN-', 'NSK-NMR-']){
  const sn = await db.collection('recs').where(admin.firestore.FieldPath.documentId(), '>=', pre).where(admin.firestore.FieldPath.documentId(), '<', pre + '\uf8ff').get();
  const agg = { n:sn.size, access:{}, review:{}, chals:{}, keys:{}, src:{}, sample:[] };
  sn.forEach(d => { const x = d.data() || {}; const a = x.access === undefined ? '(بلا حقل)' : String(x.access); agg.access[a] = (agg.access[a] || 0) + 1;
    const rv = x.review === undefined ? '(بلا)' : String(x.review); agg.review[rv] = (agg.review[rv] || 0) + 1;
    const ch = Array.isArray(x.chals) ? (x.chals.length ? x.chals.join('|') : '(فارغة)') : (x.chals === undefined ? '(بلا حقل)' : typeof x.chals); agg.chals[ch] = (agg.chals[ch] || 0) + 1;
    Object.keys(x).forEach(k => agg.keys[k] = (agg.keys[k] || 0) + 1);
    const s = x.quick ? 'quick' : x.engDecide ? 'engDecide' : x.decided ? 'decided' : x.by || '?'; agg.src[s] = (agg.src[s] || 0) + 1;
    if (agg.sample.length < 3) agg.sample.push({ id:d.id, access:x.access, review:x.review, chals:x.chals, chalNote:x.chalNote, quick:x.quick, by:x.by, keys:Object.keys(x).slice(0, 30) }); });
  out[pre] = agg;
}
writeFileSync('/tmp/exp/trn-recs.json', JSON.stringify(out));
console.log('ok', Object.keys(out).map(k => k + ':' + out[k].n).join(' '));
