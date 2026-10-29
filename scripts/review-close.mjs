/* (V43.6) one-time, on the owner's word («اقفلها انت»): close the two open field reports of 18–19 Oct (both fixed since — V38.20 and
   V39.86) exactly as the app's «إغلاق» would, and say whether a Google Maps key is already saved (masked). Writes only the two
   bug documents named by text; nothing else. */
import admin from 'firebase-admin';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore(), now = Date.now();
/* ١ · مفتاح خرائط جوجل: في أيِّ وثيقة إعداداتٍ حقلُ gmaps؟ */
const S = await db.collection('settings').get(); let keyInfo = 'لا مفتاح محفوظ';
S.forEach(d => { const v = d.data() || {}; const g = v.gmaps || (v.cfg && v.cfg.gmaps) || null; if (g && typeof g.key === 'string' && g.key.trim()) keyInfo = 'موجود في settings/' + d.id + ' · طوله ' + g.key.trim().length + ' · آخره …' + g.key.trim().slice(-4); });
console.log('مفتاح خرائط جوجل: ' + keyInfo);
/* ٢ · إغلاقُ بلاغَي عمار */
const WANT = [
  { m:'تحديات اخرى اذكرها', fixed:'V38.20' },
  { m:'لايمكن رؤية الصور المضافة', fixed:'V39.86' }
];
const bugs = (await db.collection('bugs').get()).docs;
let n = 0;
for (const d of bugs){
  const b = d.data() || {}; if (b.status === 'مغلق') continue;
  const w = WANT.find(x => String(b.txt || '').indexOf(x.m) > -1); if (!w) continue;
  const by = 'محمد صفوت — عبر المراجعة';
  const log = [{ at:now, by, what:'أُنجز وأُغلق — صُلّح في ' + w.fixed + ' (مراجعة ٢٩ أكتوبر)' }].concat(Array.isArray(b.log) ? b.log : []).slice(0, 20);
  await d.ref.set({ status:'مغلق', closedAt:now, closedBy:by, closeAsk:true, log, _by:'review', _at:now }, { merge:true });
  console.log('أُغلق: ' + String(b.txt || '').slice(0, 80) + ' ← ' + w.fixed); n++;
}
console.log('مُغلَق الآن: ' + n);
process.exit(0);
