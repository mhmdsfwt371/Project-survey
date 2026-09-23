/* ═══════════════════════════════════════════════════════════════════════════
   كتابةُ النبض والتقرير في القاعدة — node scripts/sysreport-write.mjs <pulse|report> <ملف>
   ───────────────────────────────────────────────────────────────────────────
   كانا يُنشَران بلاغَين عامَّين في مستودعٍ عامّ: أرقامُ الاستهلاك وأسماءُ الأجهزة
   وما ينتظر قرارًا — يقرؤها من لا شأنَ له. صارا يُكتَبان في settings/sysreport
   (القاعدةُ تقرؤهما للمكتب وحدَه) ويعرضهما التطبيقُ في صحة النظام. بلا مفتاحِ
   خدمةٍ يُقال ذلك ولا يُفشَل السير.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
const kind = process.argv[2], file = process.argv[3];
if (!['pulse', 'report'].includes(kind) || !file){ console.log('::notice::sysreport-write: نوعٌ أو ملفٌّ ناقص'); process.exit(0); }
let text = '';
try { text = readFileSync(file, 'utf8'); } catch { console.log('::notice::لا نصَّ لـ' + kind); process.exit(0); }
if (!text.trim()){ console.log('::notice::' + kind + ' فارغ'); process.exit(0); }
const SA = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!SA){ console.log('::notice::بلا مفتاحِ خدمة — لا يُكتَب ' + kind + ' في القاعدة'); process.exit(0); }
try {
  const admin = (await import('firebase-admin')).default;
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
  await admin.firestore().collection('settings').doc('sysreport').set({ [kind]: { at: Date.now(), text: text.slice(0, 60000), run: process.env.GITHUB_RUN_NUMBER || '' } }, { merge: true });
  console.log('✓ كُتب ' + kind + ' في settings/sysreport (' + text.length + ' حرفًا)');
} catch (e){ console.log('::warning title=sysreport::' + String(e.message).slice(0, 160)); }
process.exit(0);
