/* قراءةٌ فقط — يطبّق قواعد التصنيف (نسخةُ ملف التعريفات) على السجلات الحقيقية: كم صُنّف، وما بقي للمراجعة بنصّه */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, readFileSync } from 'fs'; import vm from 'vm';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const ctx = { console, t:s => s };
ctx.svReached = r => !!r && !r.deleted && (!r.access || r.access === 'تم الوصول');
ctx.svStuck = r => !!r && !r.deleted && !ctx.svReached(r);
vm.createContext(ctx); vm.runInContext(readFileSync('scripts/defs-snapshot.js', 'utf8').replace(/^function svReached[\s\S]*?\n\}/m, ''), ctx);
const recs = await db.collection('recs').get(); const why = {}, cc = {}, whyNull = [], ccReview = {}; let stuck = 0, withChal = 0;
recs.forEach(d => { const r = d.data() || {}; if (r.deleted) return;
  if (ctx.svStuck(r)){ stuck++; const w = ctx.visitWhy(r); why[w || 'null'] = (why[w || 'null'] || 0) + 1; if (!w) whyNull.push(d.id + ' | ' + (r.access || '') + ' | ' + String(r.note || '').slice(0, 80)); }
  const c = ctx.chalCats(r); if (c.length) withChal++;
  c.forEach(k => { cc[k] = (cc[k] || 0) + 1; if (k === 'review'){ const tx = String(r.chal_note || r.chalNote || r.note || '').slice(0, 90); ccReview[tx] = (ccReview[tx] || 0) + 1; } });
});
writeFileSync('/tmp/exp/cat-check.json', JSON.stringify({ stuck, why, whyNull, withChal, cc, ccReview:Object.entries(ccReview).sort((a, b) => b[1] - a[1]) }));
console.log('ok', stuck, JSON.stringify(why), JSON.stringify(cc));
