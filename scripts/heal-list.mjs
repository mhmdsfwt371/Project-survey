/* (V28.4) قرارُ المالك «رجّعهم»: الشواهدُ الثلاثةُ الباقية تُرفع (deleted:false) — ويُفحَص العزلُ (رفضُ القاعدة) للكتابات في ٢١ يومًا */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const IDS = ['NSK-JMR-PNT-0014', 'NSK-MIN-RDR-0059', 'NSK-MIN-RDR-0084'];
const healed = [];
for (const id of IDS){ const r = db.collection('recs').doc(id); const d = await r.get(); if (d.exists && d.data().deleted === true){ await r.update({ deleted: false, _at: Date.now(), healedAt: Date.now(), healedBy: 'V28.4 — قرارُ المالك' }); healed.push(id); } }
const left = (await db.collection('recs').where('deleted', '==', true).get()).size;
/* العزل: أحداثُ «وثيقةٌ عُزلت عن الرفع» في ٢١ يومًا — بالمجموعة والسبب والمستخدم واليوم */
const since = Date.now() - 21 * 864e5;
const evs = (await db.collection('events').where('ts', '>=', since).get()).docs.map(d => d.data() || {});
const Q = evs.filter(e => /^وثيقةٌ عُزلت عن الرفع/.test(String(e.what || '')));
const agg = {}, byUser = {}, byDay = {}, samples = [];
Q.forEach(e => { const w = String(e.what); const m = /— (\w+)\/([^ ]+) · (.*)$/.exec(w) || []; const kind = m[1] || '?', err = (m[3] || '?').slice(0, 60);
  const k = kind + ' · ' + err; agg[k] = (agg[k] || 0) + 1; byUser[e.by || '?'] = (byUser[e.by || '?'] || 0) + 1; byDay[e.day || '?'] = (byDay[e.day || '?'] || 0) + 1;
  if (samples.length < 40 && kind === 'recs') samples.push({ day: e.day, by: e.by, id: m[2], err }); });
/* هل وصلت مسوحُ الأيام الأخيرة؟ «مسح موقع» في الأحداث مقابل وثائق recs الحيّة لنفس النقاط */
const surv = evs.filter(e => /^مسح موقع — /.test(String(e.what || '')) && (+e.ts || 0) >= Date.now() - 3 * 864e5);
const ids = [...new Set(surv.map(e => e.site || String(e.what).split('— ').pop()))];
let live = 0, missing = []; for (const id of ids){ const d = await db.collection('recs').doc(id).get(); if (d.exists && d.data().deleted !== true) live++; else missing.push(id); }
const out = { at: new Date().toISOString(), healed, tombsLeft: left, quarantine21d: Q.length, byKindErr: agg, byUser, byDay, samplesRecs: samples, surveys3d: { events: surv.length, points: ids.length, live, missing } };
writeFileSync('/tmp/exp/heal-list.json', JSON.stringify(out));
console.log('healed', healed.length, '| tombs left', left, '| quarantine 21d', Q.length, '| surveyed points 3d', ids.length, 'live', live, 'missing', missing.length);
