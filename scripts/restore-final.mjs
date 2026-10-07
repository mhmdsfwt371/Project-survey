/* إصلاحٌ لمرةٍ واحدة بأمر المالك — بعد نشر قاعدة الحماية: كلُّ ما أُخفي اليوم (٧ أكتوبر) بيد غير صاحب المشروع يُعاد، مزارًا كان أو لا. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const DAY0 = Date.parse('2026-10-07T00:00:00+03:00'), now = Date.now();
const snap = await db.collection('sites').where('hidden', '==', true).get(); const pick = [];
snap.forEach(d => { const x = d.data() || {}; if (+(x.hidAt || 0) >= DAY0 && x.hidBy !== 'mohamed safwat') pick.push({ id:d.id, by:x.hidBy || '' }); });
const b = db.batch();
pick.forEach(p => b.set(db.collection('sites').doc(p.id), { hidden:false, hidBy:'', hidAt:0, restBy:'استعادة نهائية — قرار المالك', restAt:now, restFrom:p.by, _at:now }, { merge:true }));
if (pick.length){ b.set(db.collection('events').doc('EV-restore4-' + now), { ts:now, by:'النظام — بأمر المالك', what:'استعادة نهائية بعد نشر قاعدة الحماية — ' + pick.map(p => p.id + ' (' + p.by + ')').join('، '), kind:'restore', _at:now }); await b.commit(); }
const still = (await db.collection('sites').where('hidden', '==', true).get()).docs.map(d => d.id + ' ' + ((d.data() || {}).hidBy || ''));
writeFileSync('/tmp/exp/restore-final.json', JSON.stringify({ at:new Date(now + 3 * 3600e3).toISOString().slice(0, 16), restored:pick, stillHidden:still }));
console.log('restored', pick.length, 'still', still.length);
