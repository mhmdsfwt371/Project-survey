/* قراءةٌ فقط — نبضاتُ الأجهزة كاملةً (بلا أسرار): النسخة، والطابور ومكوّناته، والأخطاء، لفحص «٦٥ كتابة واقفة» وأجهزة النسخ القديمة */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const T = ts => ts ? new Date(+ts + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '';
const pr = await db.collection('presence').get(); const out = [];
pr.forEach(d => { const x = d.data() || {}; const c = {}; Object.keys(x).forEach(k => { if (/token|key|pass|secret/i.test(k)) return; const v = x[k]; c[k] = (typeof v === 'string' && v.length > 300) ? v.slice(0, 300) + '…' : v; }); c._id = d.id; c._at = T(x.at); out.push(c); });
out.sort((a, b) => (+b.at || 0) - (+a.at || 0));
writeFileSync('/tmp/exp/presence-full.json', JSON.stringify(out.slice(0, 40))); console.log('ok', out.length);
