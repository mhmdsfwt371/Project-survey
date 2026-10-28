/* (V39.94) one-time: the first «view as user» session (28 Oct, ~10:02 Makkah) may have uploaded two event lines written
   under the viewed person's name («بدأ يومَه / أنهى يومَه — خالد بندر سعيد · خارج النطاق», two seconds apart). They are
   found by exact text, day and a five-minute window, listed, and deleted. Nothing else is touched. */
import admin from 'firebase-admin';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();
const from = Date.parse('2026-10-28T07:00:00Z'), to = Date.parse('2026-10-28T07:06:00Z');
const rx = /^(بدأ|أنهى) يومَه — خالد بندر سعيد · خارج النطاق$/;
const snap = await db.collection('events').where('day', '==', '2026-10-28').get();
const hit = snap.docs.filter(d => { const e = d.data(); return rx.test(String(e.what || '')) && +e.ts >= from && +e.ts <= to; });
console.log('أحداثُ اليوم: ' + snap.size + ' · المطابقة: ' + hit.length);
for (const d of hit){ const e = d.data(); console.log('  ✗ يُحذف ' + d.id + ' · ' + e.what + ' · ' + new Date(+e.ts).toISOString()); await d.ref.delete(); }
if (hit.length > 2) console.log('::warning::أكثر من سطرين طابقا — راجعهما');
process.exit(0);
