/* (V39.90) watchdog for the cloud job (functions/index.js · jobsTick). Runs in provision.yml every hour: reads
   settings/jobsStatus and settings/jobsLock; if no run finished in 20 minutes and none is running now, it says «stale»
   so the same workflow runs the accounts and photos itself — the work never stops if the function does. Prints the last
   run (time, ok, step seconds), never a secret; writes settings/jobsWatch for the card in the app. */
import admin from 'firebase-admin';
import { appendFileSync } from 'fs';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const out = v => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'stale=' + v + '\n'); };
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط — لا حراسة'); out(0); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore(), now = Date.now();
const [st, lk] = await Promise.all([db.collection('settings').doc('jobsStatus').get(), db.collection('settings').doc('jobsLock').get()]);
const d = st.exists ? st.data() : null, running = lk.exists && (lk.data().until || 0) > now;
const age = d && d.at ? Math.round((now - d.at) / 60000) : null;
const stale = !running && (age == null || age > 20);
console.log('آخر دورةٍ سحابية: ' + (age == null ? 'لا شيء بعد' : age + ' دقيقة') + (d ? ' · ' + (d.ok ? 'سليمة' : 'تعثّرت') + ' · ' + (d.steps || []).map(s => s.name + ' ' + Math.round((s.ms || 0) / 1000) + 'ث' + (s.code ? ' ✗' : '')).join(' · ') : '') + (running ? ' · تعمل الآن' : ''));
if (stale) console.log('::warning::الدالةُ السحابية متأخرة — يشغّل هذا السيرُ الحساباتِ والصورَ احتياطًا');
await db.collection('settings').doc('jobsWatch').set({ at: now, age, stale, running, ok: d ? !!d.ok : null, fallback: stale ? now : admin.firestore.FieldValue.delete() }, { merge: true });
out(stale ? 1 : 0);
process.exit(0);
