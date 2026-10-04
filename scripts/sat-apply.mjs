/* (V29.7) مسودةُ صور القمر الصناعي لمواقع التفويج الثلاثة: تُنقَل كاميراتُ LPR إلى البوابات والمسارات الظاهرة في الصور، وتُخفى
   مساراتُ الجموم الثلاث (لا مساراتِ فحصٍ ظاهرةٌ هناك — موقفُ حافلاتٍ واحدٌ أمام المبنى). يؤكدها المالكُ من المنصة. */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const P = JSON.parse(readFileSync('scripts/sat-points.json', 'utf8')); const now = Date.now(), out = [];
const LBL = { ZYD:'الزايدي', HJM:'طريق الهجرة (الجموم)', HJD:'طريق الهجرة (المدينة)' };
for (const [id, [lbl, ll]] of Object.entries(P.move)){
  const ref = db.collection('newsites').doc(id), d = await ref.get(); if (!d.exists){ out.push({ id, skip:'لا وثيقة' }); continue; }
  const v = d.data(); if (v._at && v._by !== 'tafweej-V29.7' && v._by !== 'sat-V29.7'){ out.push({ id, skip:'عدّلها أحدٌ بعد الإضافة — تُترك' }); continue; }
  const site = LBL[id.split('-')[1]];
  await ref.set({ lat:ll[0], lng:ll[1], name:'كاميرا LPR — ' + site + ' — ' + lbl, gate:/^دخول/.test(lbl) ? 'مدخل' : (/^خروج/.test(lbl) ? 'مخرج' : ''),
    why:'مسودةٌ من صور القمر الصناعي — يؤكدها المالكُ من المنصة (تُحرَّك أو تُعدَّل أو تُخفى)', draft:'sat', movedFrom:[v.lat, v.lng], _at:now, _by:'sat-V29.7' }, { merge:true });
  out.push({ id, name:lbl, lat:ll[0], lng:ll[1] });
}
for (const id of P.hide){
  const ref = db.collection('newsites').doc(id), d = await ref.get(); if (!d.exists) continue;
  await ref.set({ hidden:true, hiddenBy:'مسودة القمر الصناعي — V29.7', hiddenWhy:'لا مساراتِ فحصٍ ظاهرةٌ في صورة القمر الصناعي — موقفُ حافلاتٍ واحدٌ أمام المبنى', _at:now, _by:'sat-V29.7' }, { merge:true });
  out.push({ id, hidden:true });
}
const eid = 'st' + now.toString(36);
await db.collection('events').doc(eid).set({ id:eid, ts:now, at:'', day:new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what:'مسودة مواضع كاميرات LPR لمواقع التفويج من صور القمر الصناعي — نُقلت ' + out.filter(o => o.lat).length + ' وأُخفيت ' + out.filter(o => o.hidden).length + ' · يؤكدها المالك', by:'mohamed safwat', site:'', dev:'sat-V29.7', _at:now });
writeFileSync('/tmp/exp/sat-apply.json', JSON.stringify({ at:new Date().toISOString(), moved:out.filter(o => o.lat).length, hidden:out.filter(o => o.hidden).length, skipped:out.filter(o => o.skip), rows:out }));
console.log('moved', out.filter(o => o.lat).length, 'hidden', out.filter(o => o.hidden).length);
