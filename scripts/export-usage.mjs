/* استعمالُ النظام — أيُّ صفحةٍ تُفتح أكثر وأيُّ ميزةٍ تُستعمل — إلى درايف المالك (أعدادٌ فقط، لا أسماء) */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const now = Date.now(), DAY = 864e5, mk = ms => new Date(ms + 10800000).toISOString().slice(0, 10);
const usageDoc = await db.collection('settings').doc('usage').get(); const days = (usageDoc.exists && usageDoc.data().days) || {};
const d7 = mk(now - 7 * DAY), d30 = mk(now - 30 * DAY);
const sum = (from) => { const m = {}; Object.keys(days).filter(d => d >= from).forEach(d => { Object.keys(days[d] || {}).forEach(p => { m[p] = (m[p] || 0) + (+days[d][p] || 0); }); }); return m; };
const pages7 = sum(d7), pages30 = sum(d30), pagesAll = sum('0000');
const pres = (await db.collection('presence').limit(5000).get()).docs.map(d => d.data() || {});
const roles = {}, vers = {}, roleDay = {}, rolePage = {};
pres.forEach(p => { const r = p.role || '?'; roles[r] = (roles[r] || 0) + 1; vers[p.ver || '?'] = (vers[p.ver || '?'] || 0) + 1; if (p.day && p.day >= d7) roleDay[r] = (roleDay[r] || 0) + 1;
  if (p.pg && typeof p.pg === 'object'){ const m = rolePage[r] = rolePage[r] || {}; Object.keys(p.pg).forEach(k => { m[k] = (m[k] || 0) + (+p.pg[k] || 0); }); } });
let ev = []; try { ev = (await db.collection('events').where('ts', '>=', now - 30 * DAY).limit(8000).get()).docs.map(d => d.data() || {}); } catch (e){ try { ev = (await db.collection('events').limit(8000).get()).docs.map(d => d.data() || {}).filter(x => (+x.ts || 0) >= now - 30 * DAY); } catch (e2){ ev = []; } }
const kinds = {}; ev.forEach(e => { const k = String(e.what || '').split(/ — | · |: |\(/)[0].trim().slice(0, 40) || '?'; kinds[k] = (kinds[k] || 0) + 1; });
const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
const out = { at: new Date(now).toISOString(), daysKept: Object.keys(days).length, pages7: top(pages7, 40), pages30: top(pages30, 40), pagesAll: top(pagesAll, 60), devices: { total: pres.length, byRole: roles, activeRole7: roleDay, byVersion: top(vers, 12) }, rolePages: Object.fromEntries(Object.entries(rolePage).map(([r, m]) => [r, top(m, 12)])), events30: { total: ev.length, top: top(kinds, 60) } };
mkdirSync('/tmp/exp', { recursive: true }); writeFileSync('/tmp/exp/usage.json', JSON.stringify(out));
console.log('اكتمل استخراجُ الاستعمال — الأعدادُ في الملف المرفوع إلى الدرايف وحدَه');
