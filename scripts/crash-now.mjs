/* قراءةٌ فقط: أحداثُ آخر ٦ ساعات — التوقّفُ المفاجئ والأعطالُ ومراحلُها، ونبضاتُ أجهزة المالك */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const since = Date.now() - 10 * 3600e3, ev = await db.collection('events').where('ts', '>=', since).limit(5000).get();
const rows = []; ev.forEach(d => { const x = d.data() || {}; const w = String(x.what || ''); if (/توقّف|عطل|خطأ|الحفظ|تحطّم|Indexed|crash/i.test(w)) rows.push({ t:new Date(+x.ts + 3 * 3600e3).toISOString().slice(11, 19), by:x.by, dev:String(x.dev || '').slice(0, 8), what:w.slice(0, 230) }); });
rows.sort((a, b) => a.t < b.t ? 1 : -1);
const pres = await db.collection('presence').get(), mine = [];
pres.forEach(d => { const x = d.data() || {}; if (/mohamed|safwat|محمد/i.test(String(x.name || ''))) mine.push({ name:x.name, ver:x.ver, at:x.at ? new Date(+x.at + 3 * 3600e3).toISOString().slice(0, 19) : '', ua:String(x.ua || '').slice(0, 90), ib:x.ib, err:x.err, q:x.q, box:x.box || x.bx || null }); });
writeFileSync('/tmp/exp/crash-now.json', JSON.stringify({ at:new Date().toISOString(), n:rows.length, rows:rows.slice(0, 40), owner:mine }));
console.log('ok', rows.length);
