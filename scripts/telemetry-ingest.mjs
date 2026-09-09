/* ═══════════════════════════════════════════════════════════════════════════
   التليمتري — من الأجهزة إلى التوأم الرقمي · node scripts/telemetry-ingest.mjs
   ───────────────────────────────────────────────────────────────────────────
   القارئُ في الميدان يقول عن نفسه: متى نبض آخرَ مرة، وجهدَ بطاريته، وشحنَ
   لوحه، وكم قرأ في الساعة، وقوةَ إشارته. وهذا الملفُّ يجلب ذلك من مصدرٍ
   واحدٍ (رابطٌ يعيد JSON — من راوتر Milesight، أو من وسيط MQTT عبر جسرٍ
   صغير، أو من أيِّ خادم) ويكتبه **لقطةً واحدة** في `settings/twin`:
   وثيقةٌ بمفتاحٍ لكلِّ نقطة. لا وثيقةٌ لكلِّ نقطة — ألفٌ وثمانمئةُ قراءةٍ كلَّ
   عشر دقائقَ تُفلس الحصةَ في يوم؛ والوثيقةُ الواحدةُ قراءةٌ واحدةٌ لكلِّ
   جهازٍ حين تتغيّر.

   عقدُ المصدر (TELEMETRY_URL يعيد مصفوفةً):
     [{ "site": "NSK-MIN-RDR-0012", "ts": 1788950000000,
        "vb": 12.6, "sl": 88, "rd": 340, "rs": -67 }]
   site وts إلزاميان، والباقي اختياريّ. ويُقبَل أيضًا كائنٌ بمفتاح site،
   وأسماءٌ بديلةٌ شائعة (battery/vbat، solar، reads، rssi، lastSeen).
   وإن غاب TELEMETRY_URL خرج الملفُّ بهدوءٍ — التوأمُ يعمل بطبقتيه الأُوليين
   حتى يُوصَل المصدر.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const URL = (process.env.TELEMETRY_URL || '').trim();
const TOKEN = (process.env.TELEMETRY_TOKEN || '').trim();
if (!URL){ console.log('::notice title=twin::TELEMETRY_URL غيرُ مضبوط — التوأمُ بطبقتيه الأُوليين حتى يُوصَل المصدر'); process.exit(0); }
if (!SA){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غيرُ مضبوط'); process.exit(0); }

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();

const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
const pick = (o, keys) => { for (const k of keys) if (o[k] != null && o[k] !== '') return o[k]; return null; };
/* الزمنُ قد يجيء بالثواني أو بالمللي أو نصًّا — يُوحَّد إلى مللي */
const ms = v => { if (v == null) return null; if (typeof v === 'string' && isNaN(+v)){ const t = Date.parse(v); return isNaN(t) ? null : t; }
                  const n = +v; if (!n) return null; return n < 1e11 ? n * 1000 : n; };

let rows;
try {
  const res = await fetch(URL, { headers: TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {} });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const body = await res.json();
  rows = Array.isArray(body) ? body : (Array.isArray(body.data) ? body.data
       : Object.keys(body).map(k => ({ site: k, ...(body[k] || {}) })));
} catch (e){
  console.log('::warning title=twin::تعذّر جلبُ التليمتري — ' + String(e && e.message || e).slice(0, 120));
  process.exit(0);
}

/* كلُّ سطرٍ فيه معرِّفٌ وزمنٌ يُقبَل — والتطبيقُ يُطابقه بنقاطه عند العرض */
const d = {}, at = Date.now();
let ok = 0, skip = 0;
for (const r of rows){
  if (!r || typeof r !== 'object') continue;
  const site = String(pick(r, ['site', 'id', 'point', 'reader']) || '').trim();
  const ts = ms(pick(r, ['ts', 'lastSeen', 'last_seen', 'time', 'at']));
  if (!site || !ts){ skip++; continue; }
  const e = { ts };
  const vb = num(pick(r, ['vb', 'vbat', 'battery', 'batt']));   if (vb != null) e.vb = Math.round(vb * 100) / 100;
  const sl = num(pick(r, ['sl', 'solar', 'pv']));                if (sl != null) e.sl = Math.round(sl);
  const rd = num(pick(r, ['rd', 'reads', 'reads_h', 'tags']));    if (rd != null) e.rd = Math.round(rd);
  const rs = num(pick(r, ['rs', 'rssi', 'signal']));              if (rs != null) e.rs = Math.round(rs);
  const on = pick(r, ['on', 'online']);                           if (on != null) e.on = !!on;
  d[site] = e; ok++;
}

/* الحجمُ: وثيقةٌ واحدةٌ محدودةٌ بميغابايت — ألفٌ وثمانمئةُ مفتاحٍ بخمسة
   حقولٍ نحو مئةِ كيلوبايت، بعيدةٌ عن الحدّ؛ ويُحرَس على كلِّ حال. */
const size = Buffer.byteLength(JSON.stringify(d));
if (size > 900000){ console.log('::error title=twin::لقطةُ التليمتري تجاوزت الحدَّ (' + Math.round(size / 1024) + ' KB) — تُقسَّم قبل الكتابة'); process.exit(1); }

await db.collection('settings').doc('twin').set({ d, at, src: new URL(URL).host, n: ok, size }, { merge: false });
console.log(`::notice title=twin::لقطةٌ كُتبت — ${ok} جهازًا · ${skip} سطرًا بلا معرِّف أو زمن · ${Math.round(size / 1024)} KB`);
