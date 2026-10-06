/* قياسٌ للقراءة فقط: تفصيلُ أخطاء الميدان في ١٤ يومًا — الخطأُ البرمجيُّ، وتعطّلُ الحفظ المحلي، والتوقّفُ في الإقلاع، وتجاوزُ سقف القراءات */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const since = Date.now() - 14 * 864e5, ev = await db.collection('events').where('ts', '>=', since).limit(20000).get();
const KINDS = ['خطأ برمجي', 'الحفظُ المحليُّ لا يعمل', 'توقّفٌ مفاجئٌ في الإقلاع السابق', 'جهازٌ تجاوز سقفَ القراءات'];
const day = ts => new Date(+ts + 3 * 3600e3).toISOString().slice(0, 10);
const out = {}; KINDS.forEach(k => out[k] = { n:0, byMsg:{}, byDay:{}, devs:{}, byWho:{} });
ev.forEach(d => { const x = d.data() || {}, w = String(x.what || ''); const k = KINDS.find(k => w.startsWith(k)); if (!k) return;
  const o = out[k]; o.n++; const msg = w.slice(k.length).replace(/^\s*[—·:-]\s*/, '').replace(/NSK-[\w-]+/g, '‹نقطة›').replace(/\d{3,}/g, '#').slice(0, 150);
  const m = o.byMsg[msg] = o.byMsg[msg] || { n:0, last:0, devs:{} }; m.n++; m.last = Math.max(m.last, +x.ts || 0); m.devs[x.dev || '?'] = 1;
  o.byDay[day(x.ts)] = (o.byDay[day(x.ts)] || 0) + 1; o.devs[x.dev || '?'] = (o.devs[x.dev || '?'] || 0) + 1; o.byWho[x.by || '?'] = (o.byWho[x.by || '?'] || 0) + 1; });
const res = {};
KINDS.forEach(k => { const o = out[k];
  res[k] = { n:o.n, devices:Object.keys(o.devs).length, byDay:Object.entries(o.byDay).sort(), topWho:Object.entries(o.byWho).sort((a, b) => b[1] - a[1]).slice(0, 6),
    top:Object.entries(o.byMsg).sort((a, b) => b[1].n - a[1].n).slice(0, 14).map(([m, v]) => ({ msg:m, n:v.n, devs:Object.keys(v.devs).length, last:new Date(v.last + 3 * 3600e3).toISOString().slice(0, 16) })) }; });
/* إصدارُ الجهاز من نبضته الأخيرة — هل الخطأُ على النسخ الحديثة؟ */
const pres = await db.collection('presence').get(), verOf = {}; pres.forEach(d => { const x = d.data() || {}; if (x.dev) verOf[x.dev] = x.ver || ''; });
KINDS.forEach(k => { res[k].devVersions = Object.entries(out[k].devs).map(([dv, n]) => [verOf[dv] || '؟', n]).reduce((m, [v, n]) => (m[v] = (m[v] || 0) + n, m), {}); });
writeFileSync('/tmp/exp/field-errors.json', JSON.stringify({ at:new Date().toISOString(), events:ev.size, res }));
console.log('done', ev.size);
