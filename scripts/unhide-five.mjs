/* قرارُ المالك: «متخبّيش نقط — لو عاوز أمسح همسح من النظام». تُعاد الخمسُ التي أخفيتُها: مساراتُ الجموم الثلاث، ونقطتا التفويج المؤقتتان. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const FV = admin.firestore.FieldValue, now = Date.now(), out = [];
for (const id of ['NSK-HJM-LPR-N003', 'NSK-HJM-LPR-N004', 'NSK-HJM-LPR-N005', 'NSK-TFW-LPR-N001', 'NSK-TFW-LPR-N002']){
  const ref = db.collection('newsites').doc(id), d = await ref.get(); if (!d.exists){ out.push({ id, skip:'لا وثيقة' }); continue; }
  const patch = { hidden:false, hiddenBy:FV.delete(), hiddenWhy:FV.delete(), _at:now, _by:'unhide-V29.7' };
  if (/^NSK-HJM/.test(id)) patch.why = 'لم يظهر مسارُ فحصٍ في صورة القمر الصناعي — للمراجعة من المالك';
  await ref.set(patch, { merge:true });
  const ov = db.collection('sites').doc(id), o = await ov.get(); if (o.exists && o.data().hidden) await ov.set({ hidden:false, _at:now }, { merge:true });
  out.push({ id, name:d.data().name || '', visible:true });
}
const eid = 'uh' + now.toString(36);
await db.collection('events').doc(eid).set({ id:eid, ts:now, at:'', day:new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what:'إظهار ٥ نقاط تفويج كانت مخفية — قرار المالك: لا إخفاء، والحذف بيده من النظام', by:'mohamed safwat', site:'', dev:'unhide-V29.7', _at:now });
writeFileSync('/tmp/exp/unhide-five.json', JSON.stringify({ at:new Date().toISOString(), rows:out }));
console.log('visible', out.filter(o => o.visible).length);
