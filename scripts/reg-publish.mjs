/* ═══════════════════════════════════════════════════════════════════════════
   نشرُ سجلِّ النقاط في القاعدة — node scripts/reg-publish.mjs (بعد كلِّ ترقيةٍ، في سير التغذية)
   ───────────────────────────────────────────────────────────────────────────
   (V38.88) السجلُّ في طريقه للخروج من ملفّ التطبيق المفتوح للزوار، وأوّلُ الطريق أن
   يكون منشورًا في القاعدة فيخزّنه كلُّ جهازٍ بعد الدخول للعمل بلا شبكة. لكن زرَّ
   النشر لم ينجح قطّ (القاعدةُ ترفض المصفوفاتِ المتداخلة) فلم يُنشَر ولم يخزّنه جهاز.
   فهذا ينشره من الملف — وهو مصدرُ الحقيقة ما دام فيه — نصًّا واحدًا مع بصمته،
   كلما تغيّرت البصمة. ولا يمحو شيئًا: النسخةُ المنشورةُ السابقةُ تُحفَظ في
   settings/registryPrev قبل الكتابة. وحين يخرج السجلُّ من الملف يسكت هذا.
   ═════════════════════════════════════════════════════════════════════════ */
import { countReads } from './lib/reads.mjs';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { regFromHtml, regVer } from './lib/registry.mjs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SA){ console.log('::notice::لا مفتاحَ — لا نشر'); process.exit(0); }
const F = regFromHtml(readFileSync('index.html', 'utf8'));
if (!F || !Array.isArray(F.g) || !(F.g.length + (F.p || []).length)){ console.log('لا سجلَّ في ملفّ التطبيق — النشرُ من التطبيق وحدَه'); process.exit(0); }
let admin; try { admin = createRequire(import.meta.url)('firebase-admin'); } catch { console.log('::notice::firebase-admin غيرُ مثبَّت — لا نشر'); process.exit(0); }
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
countReads(admin, 'registry');
const db = admin.firestore(), ref = db.collection('settings').doc('registry');
const rec = { z: F.z, t: F.t, w: F.w, co: F.co || [], dm: F.dm || [], g: F.g, p: F.p || [] };
const ver = regVer(rec), n = rec.g.length + rec.p.length;
const cur = await ref.get();
if (cur.exists && cur.data().ver === ver){ console.log(`✓ سجلُّ النقاط منشورٌ كما في الملف (${n} نقطة · ${ver})`); process.exit(0); }
if (cur.exists) await db.collection('settings').doc('registryPrev').set(Object.assign({}, cur.data(), { keptAt: Date.now() }));
await ref.set({ json: JSON.stringify(rec), ver, n, at: Date.now(), by: 'الخادم' });
console.log(`✓ نُشر سجلُّ النقاط في القاعدة: ${n} نقطة · ${ver}` + (cur.exists ? ' (السابقُ محفوظٌ في registryPrev)' : ''));
