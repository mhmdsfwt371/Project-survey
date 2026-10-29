/* (V43.6) one-time, on the owner's word: save the Google Maps browser key he gave as settings/gmaps — the same document and
   field the app's «ثوابت النظام» card writes — so every device shows Google's map. The key is a browser key (public by design,
   restricted on Google's side to this site); it is still never echoed to the log. */
import admin from 'firebase-admin';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '', key = String(process.env.GMAPS_KEY || '').trim();
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
if (!/^AIza[0-9A-Za-z_-]{30,}$/.test(key)){ console.log('::error::المفتاح ليس بصيغة مفتاح جوجل'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore(), now = Date.now();
await db.collection('settings').doc('gmaps').set({ key, _by:'owner-review', _at:now }, { merge:true });
await db.collection('settings').doc('pulse').set({ settings:now, at:now, _at:now, _by:'owner-review' }, { merge:true });
const back = (await db.collection('settings').doc('gmaps').get()).data() || {};
console.log('حُفظ مفتاحُ خرائط جوجل: طوله ' + String(back.key || '').length + ' · آخره …' + String(back.key || '').slice(-4) + ' · والنبضةُ أُرسلت');
process.exit(0);
