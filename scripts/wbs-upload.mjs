/* (V30.2) فكرةُ المالك #٣: الخطةُ التفصيلية (الإصدار ٢٫١، ١٨٥ بندًا و١٨ موعدًا حاكمًا) تُرفَع إلى settings/wbs بالصيغة التي يقرؤها
   التطبيق — فتظهر في «متابعة الخطة التفصيلية» وتُقاس بنودُ المسح والتركيب من النظام تلقائيًّا. ما كُتب بيد من قبلُ يُحفَظ نسخةً. */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const W = JSON.parse(readFileSync('scripts/wbs-v2.json', 'utf8')); const now = Date.now();
const ref = db.collection('settings').doc('wbs'), old = await ref.get();
if (old.exists){ await db.collection('settings').doc('wbs_prev_' + now).set(old.data()); }
await ref.set({ rows: W.rows, keys: W.keys, at: now, by: 'mohamed safwat', src: 'الخطة التفصيلية ٢٫١ — V30.2' });
const eid = 'wb' + now.toString(36);
await db.collection('events').doc(eid).set({ id: eid, ts: now, at: '', day: new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what: 'رفعُ الخطة التفصيلية (الإصدار ٢٫١) — ' + W.rows.length + ' بندًا و' + W.keys.length + ' موعدًا حاكمًا · قرار المالك', by: 'mohamed safwat', site: '', dev: 'wbs-V30.2', _at: now });
writeFileSync('/tmp/exp/wbs-upload.json', JSON.stringify({ at: new Date().toISOString(), rows: W.rows.length, keys: W.keys.length, hadOld: old.exists, oldRows: old.exists ? (old.data().rows || []).length : 0 }));
console.log('wbs uploaded', W.rows.length, 'rows | old', old.exists ? (old.data().rows || []).length : 0);
