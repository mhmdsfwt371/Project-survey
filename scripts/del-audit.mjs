/* قراءةٌ فقط — تحقيقُ «اختفاء نقاط التفويج وبيانات المسح»: كلُّ إخفاءٍ وحذفٍ نهائيٍّ وحدثِ حذف، وحالُ النقاط المضافة وسجلّات المسح */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const T = ts => ts ? new Date(+ts + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '';
const out = {};
/* ١ · تجاوزاتُ النقاط: المخفية */
const ov = await db.collection('sites').get(); const hid = [];
ov.forEach(d => { const x = d.data() || {}; if (x.hidden) hid.push({ id:d.id, by:x.hidBy || '', at:T(x.hidAt || x._at) }); });
out.hidden = hid.sort((a, b) => a.at < b.at ? 1 : -1); out.ovTotal = ov.size;
/* ٢ · النقاطُ المضافة: كلُّها، والمحذوفةُ نهائيًّا، وتوزيعُها */
const ns = await db.collection('newsites').get(); const del = [], byPfx = {}, byType = {};
ns.forEach(d => { const x = d.data() || {}; const pfx = String(d.id).split('-').slice(0, 3).join('-');
  byPfx[pfx] = byPfx[pfx] || { all:0, deleted:0, hidden:0 }; byPfx[pfx].all++; if (x.deleted) byPfx[pfx].deleted++; if (x.hidden) byPfx[pfx].hidden++;
  const ty = (x.type || '') + '|' + (x.zone || ''); byType[ty] = (byType[ty] || 0) + 1;
  if (x.deleted) del.push({ id:d.id, by:x.by || '', at:T(x.at || x._at), name:String(x.name || '').slice(0, 50) }); });
out.newsites = ns.size; out.byPrefix = byPfx; out.byTypeZone = byType; out.deleted = del.sort((a, b) => a.at < b.at ? 1 : -1);
/* ٣ · سجلّاتُ المسح: العدد، والمحذوفُ منها بشاهد */
for (const c of ['recs', 'inss', 'diss', 'tasks']){ const s = await db.collection(c).get(); let dl = 0; const dlIds = []; s.forEach(d => { const x = d.data() || {}; if (x.deleted){ dl++; if (dlIds.length < 40) dlIds.push(d.id + ' ' + T(x.at || x._at) + ' ' + (x.by || '')); } }); out[c] = { total:s.size, tomb:dl, tombIds:dlIds }; }
/* ٤ · أحداثُ الحذف في آخر ٧ أيام */
const ev = await db.collection('events').where('ts', '>=', Date.now() - 7 * 864e5).limit(20000).get(); const evs = [];
ev.forEach(d => { const x = d.data() || {}; const w = String(x.what || ''); if (/حذف|إخفاء|أُخفيت|مخفي|حذفُ/.test(w)) evs.push({ t:T(x.ts), by:x.by, what:w.slice(0, 160) }); });
out.deleteEvents = evs.sort((a, b) => a.t < b.t ? 1 : -1).slice(0, 200);
/* ٥ · أجهزةُ اليوم ونسخُها — من لم يُحدِّث بعدُ (بلا حماية V36.8) */
const pr = await db.collection('presence').get(); const dev = [];
pr.forEach(d => { const x = d.data() || {}; if (+(x.at || 0) > Date.now() - 864e5) dev.push({ name:x.name || '', ver:x.ver || '', at:T(x.at) }); });
out.devicesToday = dev.sort((a, b) => a.name < b.name ? -1 : 1);
writeFileSync('/tmp/exp/del-audit.json', JSON.stringify(out));
console.log('ok hidden', hid.length, 'deleted newsites', del.length, 'events', evs.length);
