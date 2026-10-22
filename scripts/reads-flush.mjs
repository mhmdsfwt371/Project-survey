/* ═══════════════════════════════════════════════════════════════════════════
   رفعُ عدّاد القراءات — node scripts/reads-flush.mjs (آخرَ كلِّ مهمّةٍ تقرأ القاعدة)
   ───────────────────────────────────────────────────────────────────────────
   (V38.84) ما عدّته المهمّةُ في ملفّها المؤقّت (lib/reads.mjs) يُضاف إلى
   settings/jobreads بزيادةٍ لا كتابةٍ فوقها — كتابةٌ واحدةٌ في آخر المهمّة،
   ولو دارت حلقتُها ستَّ ساعات. وما تعذّر لا يُفشِل المهمّة.
   ═════════════════════════════════════════════════════════════════════════ */
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { createRequire } from 'module';
import { READS_FILE } from './lib/reads.mjs';

if (!existsSync(READS_FILE)){ console.log('لا قراءاتَ معدودةً في هذه المهمّة'); process.exit(0); }
const SA = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SA){ console.log('::notice::لا مفتاحَ — العدّادُ لم يُرفَع'); process.exit(0); }
let admin; try { admin = createRequire(import.meta.url)('firebase-admin'); } catch { console.log('::notice::firebase-admin غيرُ مثبَّت — العدّادُ لم يُرفَع'); process.exit(0); }
try {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
  const m = JSON.parse(readFileSync(READS_FILE, 'utf8') || '{}'), inc = admin.firestore.FieldValue.increment, upd = {};
  Object.keys(m).forEach(job => { upd[job] = {}; Object.keys(m[job] || {}).forEach(day => { upd[job][day] = inc(+m[job][day] || 0); }); });
  await admin.firestore().collection('settings').doc('jobreads').set(upd, { merge: true });
  unlinkSync(READS_FILE);
  console.log('✓ عدّادُ القراءات: ' + Object.keys(m).map(j => j + ' ' + Object.values(m[j]).reduce((a, b) => a + b, 0)).join(' · '));
} catch (e){ console.log('::warning::تعذّر رفعُ عدّاد القراءات: ' + String(e && e.message || e).slice(0, 120)); }
