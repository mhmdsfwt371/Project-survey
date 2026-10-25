/* ═══════════════════════════════════════════════════════════════════════════
   جسرُ أفاقي برو — الحساساتُ والجيت واي لكل نقطة   node scripts/afaqy-pro.mjs   (السحابة: .github/workflows/afaqy-pro.yml)
   ───────────────────────────────────────────────────────────────────────────
   (V39.47) قرارُ المالك: القارئُ والكاميرا من منصة نُسُك، والحساساتُ والجيت واي من أفاقي برو.
   · الدخول: POST {url}/auth/login بـ{data:{username,password}} — من مجموعة «AVL Integration documentation» الموثّقة.
   · الأجهزة: POST {url}/units/lists?token= بإسقاط [basic, last_update, sensors]، صفحاتٍ من ١٠٠٠.
   · الربط بالنقطة بالسيريال: كلُّ حساسٍ وجيت واي في خطة المخيم (sites/<id>.iot.sm|gm[i].serial) يُطابَق مع imei أو
     device_serial للوحدة في أفاقي برو، أو مع اسمها إن احتواه — فلا يُنقل من أفاقي برو إلا ما يخصّ نقاطنا.
   · المخرَج: iotlive/_all — وثيقةٌ واحدةٌ مضغوطة: units بالسيريال {site,k,i,u,nm,t,v} وcamps بشكل V39.20 {at, s:{<id>:{at,v}}, g:{…}}
     يقرؤها التطبيق عند الحاجة (قراءةٌ واحدة كلَّ ١٠ دقائق على الأكثر) — قاعدتُها قائمة منذ V39.20: يقرؤها الفعّال ولا يكتبها جهاز.
   · بلا أسرارٍ (AFAQY_PRO_USER/AFAQY_PRO_PASS) يخرج بهدوء: الجسرُ جاهزٌ وينتظر حسابَ التكامل.
   · قراءةٌ فقط من أفاقي برو — لا add ولا edit ولا delete. ولا تُطبَع كلمةُ مرورٍ ولا توكن ولا قيمةٌ في السجل:
     أوّلُ تشغيلٍ يكتب «شكل» الردود (أسماءَ الحقول فقط) في ملخّص السير لضبط قراءة القيم.
   ═══════════════════════════════════════════════════════════════════════════ */
import { appendFileSync } from 'fs';
const env = k => String(process.env[k] || '').trim();
const URL = (env('AFAQY_PRO_URL') || 'https://api.afaqy.sa').replace(/\/+$/, ''), USER = env('AFAQY_PRO_USER'), PASS = env('AFAQY_PRO_PASS'), SA = env('FIREBASE_SERVICE_ACCOUNT');
const out = []; const say = s => { out.push(s); console.log(s); };
const done = code => { if (process.env.GITHUB_STEP_SUMMARY){ try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n'); } catch {} } process.exit(code); };
if (!USER || !PASS || !SA){ console.log('::notice title=afaqy-pro::جسرُ أفاقي برو جاهز — ينتظر حسابَ التكامل (AFAQY_PRO_USER وAFAQY_PRO_PASS في أسرار المستودع)'); process.exit(0); }
const shape = o => o && typeof o === 'object' ? (Array.isArray(o) ? '[' + (o.length ? shape(o[0]) : '') + ']' : '{' + Object.keys(o).slice(0, 40).join(',') + '}') : typeof o;
async function call(path, data, token){
  const r = await fetch(URL + path + (token ? (path.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token) : ''), { method:'POST',
    headers:{ 'content-type':'application/json', accept:'application/json' }, body:JSON.stringify({ data }) });
  const j = await r.json().catch(() => ({})); return { ok:r.ok, status:r.status, j };
}
say('# جسرُ أفاقي برو — ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' (UTC)');
/* ١) الدخول */
const L = await call('/auth/login', { username:USER, password:PASS });
const tok = (L.j && (L.j.data && (L.j.data.token || L.j.data.access_token || L.j.data.accessToken))) || L.j.token || L.j.access_token || '';
if (!tok){ say('✗ الدخول لم يُرجع توكنًا (الحالة ' + L.status + ' · شكلُ الرد ' + shape(L.j) + ')'); done(1); }
say('✓ الدخول');
/* ٢) سيريالات أجهزتنا من خطط المخيمات */
const admin = (await import('firebase-admin')).default;
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) }); const db = admin.firestore();
const mine = {}; let planned = 0;
(await db.collection('sites').get()).forEach(d => { const c = (d.data() || {}).iot; if (!c) return;
  [['s', c.sm], ['g', c.gm]].forEach(([k, arr]) => (arr || []).forEach((m, i) => { planned++; const s = String((m && m.serial) || '').trim(); if (s) mine[s.toLowerCase()] = { site:d.id, k, i, id:(m && m.id) || '' }; })); });
say('· أجهزةُ الخطط: ' + planned + ' — منها بسيريالٍ مسجَّل ' + Object.keys(mine).length);
/* ٣) وحداتُ أفاقي برو */
const units = []; let first = null;
for (let off = 0; off < 50000; off += 1000){
  const R = await call('/units/lists', { offset:off, limit:1000, simplify:0, projection:['basic', 'last_update', 'sensors'] }, tok);
  if (!R.ok){ say('✗ قائمةُ الوحدات (الحالة ' + R.status + ' · شكلُ الرد ' + shape(R.j) + ')'); done(1); }
  const arr = Array.isArray(R.j.data) ? R.j.data : (R.j.data && (R.j.data.data || R.j.data.list)) || R.j.list || [];
  if (!first && arr.length) first = { reply:shape(R.j), unit:shape(arr[0]), last:shape(arr[0].last_update), prms:shape((arr[0].last_update || {}).prms), sensors:shape(arr[0].sensors) };
  units.push(...arr); if (arr.length < 1000) break;
}
say('· وحداتُ الحساب: ' + units.length);
/* ٤) المطابقةُ وقراءةُ القيم */
const ms = t => { const n = typeof t === 'number' ? t : Date.parse(t); return !n ? 0 : n < 1e12 ? n * 1000 : n; };
const keyOf = (s) => { const n = String(s.name || s.type || s.param || '').toLowerCase();
  return /temp|حرار/.test(n) ? 'temp' : /hum|رطوب/.test(n) ? 'hum' : /bat|volt|بطار/.test(n) ? 'bat' : /rssi|signal|إشار/.test(n) ? 'rssi' : n.slice(0, 16); };
const snap = {}; let matched = 0;
for (const u of units){
  const keys = [u.imei, u.device_serial, u.device_gateway].map(x => String(x || '').trim().toLowerCase()).filter(Boolean);
  let hit = keys.map(k => mine[k]).find(Boolean); const hk = hit ? keys.find(k => mine[k]) : '';
  let ser = hk; if (!hit){ const nm = String(u.name || '').toLowerCase(); ser = Object.keys(mine).find(s => s.length >= 6 && nm.includes(s)) || ''; hit = ser ? mine[ser] : null; }
  if (!hit) continue; matched++;
  const lu = u.last_update || {}, prms = lu.prms || {}, v = {};
  (Array.isArray(u.sensors) ? u.sensors : []).forEach(s => { const p = s && (s.param || s.parameter); if (p != null && prms[p] != null && Number.isFinite(+prms[p])) v[keyOf(s)] = +(+prms[p]).toFixed(2); });
  if (!Object.keys(v).length) ['temperature', 'temp', 'humidity', 'hum', 'battery', 'bat'].forEach(p => { if (prms[p] != null && Number.isFinite(+prms[p])) v[keyOf({ name:p })] = +(+prms[p]).toFixed(2); });
  snap[ser] = { site:hit.site, k:hit.k, i:hit.i, u:String(u._id || ''), nm:String(u.name || '').slice(0, 60), t:ms(lu.dtt || lu.dts), v };
}
/* the camps' shape the app designed in V39.20 (docs/live.md): iotLive[camp] = { at, s:{ <sensor id>:{ at, v } } } — and g for the gateways */
const camps = {};
for (const ser of Object.keys(snap)){ const r = snap[ser], C = camps[r.site] || (camps[r.site] = { at:0, s:{}, g:{} }); const key = r.id || ser;
  (r.k === 's' ? C.s : C.g)[key] = { at:r.t, v:r.v, serial:ser }; if (r.t > C.at) C.at = r.t; }
await db.collection('iotlive').doc('_all').set({ at:Date.now(), n:matched, total:units.length, planned, src:'afaqy-pro', units:snap, camps });
say('✓ المطابَق بنقاطنا: ' + matched + ' في ' + Object.keys(camps).length + ' مخيمًا — كُتب iotlive/_all');
if (first) say('\n<details><summary>شكلُ الردود (أسماءُ الحقول فقط — لضبط قراءة القيم)</summary>\n\n```\n' + JSON.stringify(first, null, 1).slice(0, 2500) + '\n```\n</details>');
done(0);
