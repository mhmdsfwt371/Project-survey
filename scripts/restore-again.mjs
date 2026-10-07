/* إصلاحٌ لمرةٍ واحدة بأمر المالك: كلُّ نقطةٍ لها زيارةٌ أُخفيت بعد الاستعادة (١٢:٥٨ يوم ٧ أكتوبر) على أجهزةٍ قديمةٍ بلا حماية V36.8 تُعاد. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const SINCE = Date.parse('2026-10-07T12:58:00+03:00'), now = Date.now();
const snap = await db.collection('sites').where('hidden', '==', true).get(); const pick = [];
for (const d of snap.docs){ const x = d.data() || {}; if (+(x.hidAt || 0) >= SINCE){ const r = await db.collection('recs').doc(d.id).get(), i = await db.collection('inss').doc(d.id).get(); if (r.exists || i.exists) pick.push({ id:d.id, by:x.hidBy || '' }); } }
const b = db.batch();
pick.forEach(p => b.set(db.collection('sites').doc(p.id), { hidden:false, hidBy:'', hidAt:0, restBy:'استعادة ثانية — قرار المالك (V36.8)', restAt:now, restFrom:p.by, _at:now }, { merge:true }));
if (pick.length){ b.set(db.collection('events').doc('EV-restore2-' + now), { ts:now, by:'النظام — بأمر المالك', what:'استعادة ثانية — ' + pick.map(p => p.id + ' (' + p.by + ')').join('، '), kind:'restore', _at:now }); await b.commit(); }
writeFileSync('/tmp/exp/restore-again.json', JSON.stringify({ at:new Date(now + 3 * 3600e3).toISOString().slice(0, 16), restored:pick }));
console.log('restored again', pick.length);
