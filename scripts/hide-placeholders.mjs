/* (V29.7) طلبُ المالك «النقاطُ الموجودة كلُّها حقيقية في الفلاتر»: نقطتا مراكز التفويج المؤقتتان (الزايدي عند ٢١٫٣٩٤، ٣٩٫٧١٦، وطريق الهجرة
   عند ٢٤٫٣٤ — قرب المدينة) أُضيفتا من المكتب بلا زيارة ولا موقعٍ حقيقيّ، فتظهر «الزايدي ١» ولا نقطةَ في مكانها. تُخفى (لا تُحذف) حتى تصل
   مخططاتُ الوزارة — والإخفاءُ يُرفَع من «المواقع المخفية». */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const now = Date.now(), out = [];
for (const id of ['NSK-TFW-LPR-N001', 'NSK-TFW-LPR-N002']){
  const ref = db.collection('newsites').doc(id), d = await ref.get(); if (!d.exists){ out.push({ id, skip: 'لا وثيقة' }); continue; }
  const v = d.data(); const rec = await db.collection('recs').doc(id).get();
  if (rec.exists && rec.data().deleted !== true){ out.push({ id, skip: 'عليها زيارة — لا تُخفى' }); continue; }
  await ref.set({ hidden: true, hiddenBy: 'قرار المالك — V29.7', hiddenWhy: 'نقطةٌ مؤقتةٌ بلا زيارة ولا موقعٍ حقيقيّ — تُستبدَل بنقاط المخطط', _at: now }, { merge: true });
  await db.collection('sites').doc(id).set({ hidden: true, _at: now }, { merge: true });
  const eid = 'hd' + now.toString(36) + id.slice(-1);
  await db.collection('events').doc(eid).set({ id: eid, ts: now, at: '', day: new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what: 'إخفاء نقطة مؤقتة — ' + id + ' · ' + (v.name || '') + ' · قرار المالك', by: 'mohamed safwat', site: id, dev: 'hide-V29.7', _at: now });
  out.push({ id, hidden: true, lat: v.lat, lng: v.lng });
}
writeFileSync('/tmp/exp/hide-placeholders.json', JSON.stringify({ at: new Date().toISOString(), rows: out }));
console.log('hidden', out.filter(r => r.hidden).length);
