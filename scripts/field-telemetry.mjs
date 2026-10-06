/* قياسٌ للقراءة فقط: مقاييسُ السرعة الحقيقيةُ من أجهزة الميدان (presence.pf) وأكثرُ الأفعال تكرارًا في سجلّ الأحداث — لا كتابة */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const p75 = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(s.length * 0.75) - 1))]; };
const model = ua => { ua = String(ua || ''); const m = ua.match(/;\s*([^;)]+?)\s+Build\//) || ua.match(/\(([^;)]+);/); return (/iPhone/.test(ua) ? 'iPhone' : m ? m[1] : 'غير معروف').slice(0, 40); };
const pres = await db.collection('presence').get(), users = await db.collection('users').get(), roleOf = {};
users.forEach(d => { const x = d.data() || {}; roleOf[d.id] = x.role || ''; });
const devs = [];
pres.forEach(d => { const x = d.data() || {}; const pf = x.pf; if (!pf || typeof pf !== 'object') return;
  devs.push({ role:roleOf[d.id] || '', model:model(x.ua), ver:x.ver || '', day:pf.day || '', open:pf.open, lcp:pf.lcp && pf.lcp.p75, inp:pf.inp && pf.inp.p75, inpMax:pf.inp && pf.inp.max, cls:pf.cls, lt:pf.lt,
    pages:Object.fromEntries(Object.entries(pf.pages || {}).map(([k, v]) => [k, v && v.p75])) }); });
const recent = devs.filter(x => x.day >= new Date(Date.now() - 14 * 864e5 + 3 * 3600e3).toISOString().slice(0, 10));
const agg = L => ({ devices:L.length, openP75:p75(L.map(x => x.open).filter(Number.isFinite)), lcpP75:p75(L.map(x => x.lcp).filter(Number.isFinite)), inpP75:p75(L.map(x => x.inp).filter(Number.isFinite)), clsP75:p75(L.map(x => x.cls).filter(Number.isFinite)), longTasksP75:p75(L.map(x => x.lt).filter(Number.isFinite)) });
const pageP = {}; recent.forEach(x => Object.entries(x.pages).forEach(([k, v]) => { if (Number.isFinite(v)) (pageP[k] = pageP[k] || []).push(v); }));
const pages = Object.entries(pageP).map(([k, a]) => [k, p75(a), a.length]).sort((a, b) => b[1] - a[1]);
const field = recent.filter(x => /tech|supervisor|helper|cins|cprep|casm|driver/.test(x.role));
/* أكثرُ الأفعال في ١٤ يومًا — بالجزء قبل « — » من نصّ الحدث */
const since = Date.now() - 14 * 864e5, ev = await db.collection('events').where('ts', '>=', since).limit(20000).get();
const act = {}, actField = {};
ev.forEach(d => { const x = d.data() || {}; const k = String(x.what || '').split(' — ')[0].split(' · ')[0].replace(/NSK-[\w-]+/g, '').trim().slice(0, 60); if (!k) return; act[k] = (act[k] || 0) + 1; });
const out = { at:new Date().toISOString(), all:agg(recent), field:agg(field), byRole:Object.fromEntries([...new Set(recent.map(x => x.role))].map(r => [r || '—', agg(recent.filter(x => x.role === r))])),
  pages:pages.slice(0, 20), slowest:recent.filter(x => Number.isFinite(x.inp)).sort((a, b) => b.inp - a.inp).slice(0, 8).map(x => ({ role:x.role, model:x.model, ver:x.ver, inp:x.inp, open:x.open, lcp:x.lcp })),
  models:Object.entries(recent.reduce((m, x) => (m[x.model] = (m[x.model] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 12),
  events14d:ev.size, topActions:Object.entries(act).sort((a, b) => b[1] - a[1]).slice(0, 25) };
writeFileSync('/tmp/exp/field-telemetry.json', JSON.stringify(out));
console.log('devices', devs.length, 'recent', recent.length, 'events', ev.size);
