/* قياسٌ للقراءة فقط: قراءاتُ كلِّ جهازٍ اليومَ (rd) والسحباتُ الباردة (cp) وفتحُ الصفحات (pg) من نبضة الحضور — لا كتابة */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10), yday = new Date(Date.now() + 3 * 3600e3 - 864e5).toISOString().slice(0, 10);
const pres = await db.collection('presence').get(), rows = [], pgAll = {}, pgField = {};
pres.forEach(d => { const x = d.data() || {}; const ua = String(x.ua || ''); const model = /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : 'other';
  rows.push({ role:x.role || '', name:String(x.name || '').split(' ')[0], day:x.day || '', rd:+x.rd || 0, cp:+x.cp || 0, up:+x.up || 0, ver:x.ver || '', model, ib:x.ib || 0, err:x.err || 0, q:x.q || 0 });
  if (x.day >= yday && x.pg && typeof x.pg === 'object') Object.entries(x.pg).forEach(([k, v]) => { pgAll[k] = (pgAll[k] || 0) + (+v || 0); if (/tech|supervisor|helper|cins|cprep|casm|driver/.test(x.role || '')) pgField[k] = (pgField[k] || 0) + (+v || 0); }); });
const recent = rows.filter(r => r.day >= yday);
const sum = recent.filter(r => r.day === today).reduce((a, r) => a + r.rd, 0);
const vers = rows.reduce((m, r) => (m[r.ver || '؟'] = (m[r.ver || '؟'] || 0) + 1, m), {});
writeFileSync('/tmp/exp/field-reads.json', JSON.stringify({ at:new Date().toISOString(), today, versions:vers, lastBeat:rows.map(r => [r.name, r.ver, r.day]).slice(0, 30), devicesToday:recent.filter(r => r.day === today).length, sumReadsToday:sum,
  top:recent.sort((a, b) => b.rd - a.rd).slice(0, 15), byRole:Object.entries(recent.reduce((m, r) => (m[r.role] = m[r.role] || { n:0, rd:0, cp:0 }, m[r.role].n++, m[r.role].rd += r.rd, m[r.role].cp += r.cp, m), {})),
  pagesAll:Object.entries(pgAll).sort((a, b) => b[1] - a[1]).slice(0, 15), pagesField:Object.entries(pgField).sort((a, b) => b[1] - a[1]).slice(0, 15) }));
console.log('ok', recent.length, sum);
