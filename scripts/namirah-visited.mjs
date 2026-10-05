/* قرارُ المالك (٦ أكتوبر): مسجدُ نمرة — المداخلُ العشرُ زيرت، ولا يمكن التركيبُ عليها لعدم وجود تصاريح، فسيُركَّب في الممرات المؤدية إليها.
   تُكتَب زيارةٌ مكتبيةٌ لكلِّ نقطة: وُصل إليها، والتحدّي «أخرى» بوصفٍ صريح، والقرارُ في الملاحظة — فتظهر «مسحت بتحدٍّ» لا «لم تُزَر». ما كان له سجلٌّ حقيقيٌّ من الميدان لا يُمَسّ. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const now = Date.now(), out = [];
const WHY = 'لا يمكن التركيب على مداخل المسجد لعدم وجود تصاريح — سيُركَّب في الممرات المؤدية إليه (قرار المالك ٦ أكتوبر ٢٠٢٦)';
for (let i = 1; i <= 10; i++){
  const id = 'NSK-NMR-GTE-' + String(i).padStart(4, '0'), ref = db.collection('recs').doc(id), d = await ref.get();
  if (d.exists && d.data().by && d.data().by !== 'mohamed safwat' && d.data().deleted !== true){ out.push({ id, skip:'سجلٌّ من الميدان: ' + d.data().by }); continue; }
  const rec = { id, at:now, by:'mohamed safwat', access:'تم الوصول', mount:'', chals:['أخرى — اذكرها في وصف التحدي'], chalNote:WHY, note:WHY, obstacle:true, photos:[], origin:'office', dev:'office-decision', _at:now, _by:'namirah-V30.9' };
  await ref.set(rec, { merge:true }); out.push({ id, ok:true });
}
const eid = 'nm' + now.toString(36);
await db.collection('events').doc(eid).set({ id:eid, ts:now, at:'', day:new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what:'مسجد نمرة — المداخل العشر زيرت ولا تركيب عليها لعدم وجود تصاريح؛ التركيب في الممرات المؤدية إليها · قرار المالك', by:'mohamed safwat', site:'', dev:'namirah-V30.9', _at:now });
writeFileSync('/tmp/exp/namirah.json', JSON.stringify({ at:new Date().toISOString(), rows:out }));
console.log('namirah', out.filter(o => o.ok).length, 'written |', out.filter(o => o.skip).length, 'skipped');
