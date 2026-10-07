/* إصلاحٌ لمرةٍ واحدة — بأمر المالك («رجّعها لنصابها الصح»): استعادةُ ٢٦ نقطة تفويج حُذفت (أُخفيت) يوم ٧ أكتوبر ٢٠٢٦ بين ١٠:٤٠ و١٢:٤٢
   بزرّ «حذف النقطة». يمسّ حقولَ الإخفاء وحدها (merge) — بيانُ النقطة وزياراتُها وصورُها لم تُمَس أصلًا. ويُسجَّل حدثٌ واحد. ويُتحقَّق بعدُ بقراءة. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const DAY0 = Date.parse('2026-10-07T00:00:00+03:00'), DAY1 = Date.parse('2026-10-08T00:00:00+03:00');
const WHO = ['Sayed Lashen', 'مصطفى مجدي', 'mohamed shokry'];
const snap = await db.collection('sites').where('hidden', '==', true).get();
const pick = []; snap.forEach(d => { const x = d.data() || {}; const at = +(x.hidAt || 0); if (at >= DAY0 && at < DAY1 && WHO.indexOf(x.hidBy) > -1) pick.push({ id:d.id, by:x.hidBy, at }); });
const now = Date.now(), batch = db.batch();
pick.forEach(p => batch.set(db.collection('sites').doc(p.id), { hidden:false, hidBy:'', hidAt:0, restBy:'استعادة — قرار المالك (V36.8)', restAt:now, restFrom:p.by + ' ' + new Date(p.at + 3 * 3600e3).toISOString().slice(11, 16), _at:now }, { merge:true }));
if (pick.length){
  batch.set(db.collection('events').doc('EV-restore-' + now), { ts:now, by:'النظام — بأمر المالك', what:'استعادة ' + pick.length + ' نقطة تفويج حُذفت بالخطأ يوم ٧ أكتوبر (١٠:٤٠–١٢:٤٢) — ' + pick.map(p => p.id).join('، '), kind:'restore', _at:now });
  await batch.commit();
}
/* التحقّق: قراءةٌ ثانيةٌ لكلِّ نقطة */
const check = [];
for (const p of pick){ const d = await db.collection('sites').doc(p.id).get(); const x = d.data() || {}; check.push({ id:p.id, hidden:!!x.hidden, from:x.restFrom || '' }); }
const still = (await db.collection('sites').where('hidden', '==', true).get()).docs.map(d => ({ id:d.id, by:(d.data() || {}).hidBy || '' }));
writeFileSync('/tmp/exp/restore-oct7.json', JSON.stringify({ at:new Date(now + 3 * 3600e3).toISOString().slice(0, 16), restored:pick.length, check, stillHidden:still }));
console.log('restored', pick.length, 'still hidden', still.length);
