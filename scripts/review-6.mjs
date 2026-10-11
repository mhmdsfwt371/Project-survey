/* قراءةٌ فقط — مراجعةُ البنود الستة بالأرقام: اتجاهُ أخطاء مخزن الجهاز والوقوع يومًا بيوم (البند ١)، وتوزيعُ النسخ على الأجهزة النشطة (٢)،
   ومن عنده قياسُ سرعةٍ لكلِّ صفحة (٤)، وأسئلةُ المساعد الواصلة (٦)، وآخرُ تحديثٍ أسبوعيٍّ مصدَّر إن سُجّل (٥) */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true }); const out = {}; const day = ts => new Date(+ts + 3 * 3600e3).toISOString().slice(5, 10);
const since = Date.now() - 8 * 864e5; const ev = await db.collection('events').where('_at', '>', since).get();
const D = {}; const K = { idb:/Indexed Database|IndexedDB|قاعدة الجهاز|IDB/i, saveOff:/الحفظ المحلي لا يعمل/, crash:/توقف مفاجئ|توقّف مفاجئ/, upd:/Failed to update a ServiceWorker|sw\.js load failed/, ask:/^سؤال المساعد/, export:/تصدير التحديث|تصدير — /, reset:/إعادة ضبط|appReset/ };
ev.forEach(d => { const x = d.data() || {}; const w = String(x.what || ''); const k = day(x.ts || x._at); D[k] = D[k] || { total:0 }; D[k].total++; Object.keys(K).forEach(n => { if (K[n].test(w)) D[k][n] = (D[k][n] || 0) + 1; }); });
out.days = Object.keys(D).sort().map(k => Object.assign({ day:k }, D[k]));
const asks = []; ev.forEach(d => { const x = d.data() || {}; const w = String(x.what || ''); if (K.ask.test(w)) asks.push({ at:day(x.ts), by:x.by, q:w.slice(0, 100) }); }); out.asks = asks.slice(-20);
const pr = await db.collection('presence').get(); const now = Date.now(); const vers = {}; let withSpeed = 0, active = 0, stuck = [];
pr.forEach(d => { const x = d.data() || {}; if (now - (+x.at || 0) > 3 * 864e5) return; active++; vers[x.ver || '?'] = (vers[x.ver || '?'] || 0) + 1; if (x.pf && x.pf.pages && Object.keys(x.pf.pages).length) withSpeed++; if (+x.q > 0 || +x.pq > 0 || +x.ib) stuck.push({ name:x.name, ver:x.ver, q:x.q, pq:x.pq, ib:x.ib, at:day(x.at) }); });
out.active = active; out.versions = vers; out.withSpeed = withSpeed; out.stuck = stuck;
const bugs = await db.collection('bugs').where('at', '>', since).get(); out.bugs7 = bugs.size; const vb = []; bugs.forEach(d => { const x = d.data() || {}; vb.push({ by:x.by, via:!!x.viaAssist, txt:String(x.txt || '').slice(0, 80) }); }); out.bugsList = vb;
writeFileSync('/tmp/exp/review-6.json', JSON.stringify(out)); console.log('ok', ev.size, active);
