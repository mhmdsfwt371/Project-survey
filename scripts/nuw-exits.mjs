/* (V32.2) قرارُ المالك: النورية ٩ مساراتٍ تقابلها ٩ كاميرات خروج — كانت ٦ (ExitAir1–6). تُضاف ExitAir7–9 على امتداد صفِّ الستّ وبمسافته نفسِها
   من آخرها (المواضعُ الفعليةُ بعد تحريك المالك). وقراءةٌ لتجاوزات مواضع نقاط الزايدي (sites) للتحقق من سبب «التحريك لم يُحفَظ». */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const now = Date.now(), out = { added:[], zydOv:[], zydNs:[] };
const E1 = [21.576433955645996, 39.75761443376542], E6 = [21.576271828604664, 39.757383763950514];   /* ExitAir1 وExitAir6 بعد التحريك */
const step = [(E6[0] - E1[0]) / 5, (E6[1] - E1[1]) / 5];
const tpl = (await db.collection('newsites').doc('NSK-NEW-LPR-N007').get()).data() || {};
for (let k = 1; k <= 3; k++){
  const id = 'NSK-NEW-LPR-N0' + (31 + k), n = 6 + k, ar = '٠١٢٣٤٥٦٧٨٩'[n];
  const ex = await db.collection('newsites').doc(id).get(); if (ex.exists){ out.added.push({ id, skip:'موجود' }); continue; }
  const lat = +(E6[0] + step[0] * k).toFixed(9), lng = +(E6[1] + step[1] * k).toFixed(9);
  const doc = Object.assign({}, tpl, { id, name:'كاميرا وزارة LPR — النوارية — ExitAir' + n + ' (خروج ' + ar + ')', lat, lng, isNew:true, approved:true, approvedBy:'mohamed safwat', origin:'office', by:'mohamed safwat', at:now, _at:now, _by:'nuw-V32.2', why:'قرار المالك: ٩ مسارات تقابلها ٩ كاميرات خروج — أُضيفت على امتداد صفِّ الستّ', hidden:false });
  delete doc.deleted; await db.collection('newsites').doc(id).set(doc); out.added.push({ id, name:doc.name, lat, lng });
}
const eid = 'nw' + now.toString(36);
await db.collection('events').doc(eid).set({ id:eid, ts:now, at:'', day:new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what:'النورية — أُضيفت ExitAir7–9 (٩ مسارات ↔ ٩ كاميرات خروج) · قرار المالك', by:'mohamed safwat', site:'', dev:'nuw-V32.2', _at:now });
const ov = await db.collection('sites').get(); ov.docs.filter(d => /^NSK-ZYD-|^NSK-NEW-LPR-N0[123]/.test(d.id)).forEach(d => { const v = d.data(); out.zydOv.push({ id:d.id, lat:v.lat || null, lng:v.lng || null, keys:Object.keys(v).slice(0, 12) }); });
const nz = await db.collection('newsites').get(); nz.docs.filter(d => /^NSK-ZYD-/.test(d.id)).forEach(d => { const v = d.data(); out.zydNs.push({ id:d.id, lat:v.lat, lng:v.lng, _by:v._by || '', _at:v._at || 0, hidden:!!v.hidden }); });
writeFileSync('/tmp/exp/nuw-exits.json', JSON.stringify(out));
console.log('added', out.added.filter(a => a.lat).length, '| zyd overrides', out.zydOv.length);
