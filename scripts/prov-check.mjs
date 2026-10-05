/* طلباتُ إنشاء الحسابات: ما المعلّقُ ولماذا — قراءةٌ فقط (بلا كلمات مرور) */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const docs = (await db.collection('provision').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }));
const rows = docs.map(({ id, v }) => ({ id: id.slice(0, 30), user: v.user || v.username || '', name: v.name || '', role: v.role || '', st: v.st || v.status || '', why: String(v.why || v.err || v.error || '').slice(0, 120), at: v.at ? new Date(+v.at).toISOString().slice(0, 16) : '', by: v.by || '' })).sort((a, b) => (b.at > a.at ? 1 : -1));
writeFileSync('/tmp/exp/prov-check.json', JSON.stringify({ at: new Date().toISOString(), total: docs.length, open: rows.filter(r => !/done|تم/.test(r.st)).length, rows: rows.slice(0, 25) }));
console.log('provision', docs.length);
