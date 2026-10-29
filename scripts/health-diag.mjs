/* (V43.3) one-time read-only health read of production data for the owner's review «من ٣٥ لحد دلوقتي»: who is on which app
   version, open field bug reports, error events of the last week, the sync queue, and collection sizes. Writes nothing. */
import admin from 'firebase-admin';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore(), now = Date.now(), DAY = 86400000, iso = t => t ? new Date(t).toISOString().slice(0, 16) : '';
/* ١ · الحضور: كل مستخدم بإصداره وآخر ظهور */
const pres = (await db.collection('presence').get()).docs.map(d => d.data());
const byVer = {}; pres.forEach(p => { const v = String(p.ver || '?'); byVer[v] = (byVer[v] || 0) + 1; });
const recent = pres.filter(p => now - (+p.at || 0) < 2 * DAY).sort((a, b) => (+b.at || 0) - (+a.at || 0));
console.log('الحضور: ' + pres.length + ' مستخدمًا · آخر ٤٨ ساعة ' + recent.length);
console.log('بالإصدار: ' + JSON.stringify(byVer));
recent.slice(0, 25).forEach(p => console.log('  ' + (p.name || '?') + ' · ' + (p.role || '') + ' · ' + (p.ver || '?') + ' · ' + iso(+p.at) + (p.pf && p.pf.model ? ' · ' + p.pf.model : '')));
/* ٢ · بلاغات الميدان المفتوحة */
const bugs = (await db.collection('bugs').get()).docs.map(d => Object.assign({ id:d.id }, d.data()));
const open = bugs.filter(b => !b.deleted && !/مغلق|تم|closed|done/i.test(String(b.status || '')));
console.log('البلاغات: ' + bugs.length + ' · المفتوحة ' + open.length);
open.sort((a, b) => (+b.at || 0) - (+a.at || 0)).slice(0, 15).forEach(b => console.log('  ' + iso(+b.at) + ' · ' + (b.by || b.name || '') + ' · ' + String(b.title || b.text || b.desc || b.msg || b.t || JSON.stringify(Object.keys(b))).slice(0, 110) + ' · ' + (b.status || '')));
/* ٣ · أحداث الأسبوع: أخطاء وتعذّر */
let ev = [];
try { ev = (await db.collection('events').where('ts', '>', now - 7 * DAY).get()).docs.map(d => d.data()); } catch (e){ ev = (await db.collection('events').orderBy('ts', 'desc').limit(3000).get()).docs.map(d => d.data()).filter(x => now - (+x.ts || 0) < 7 * DAY); }
const bad = ev.filter(x => /خطأ|تعذّر|تعذر|فشل|error/i.test(String(x.what || '')));
console.log('أحداث آخر ٧ أيام: ' + ev.length + ' · فيها كلمة خطأ/تعذّر/فشل: ' + bad.length);
const grp = {}; bad.forEach(x => { const k = String(x.what || '').replace(/[0-9٠-٩]+/g, '#').slice(0, 70); grp[k] = (grp[k] || 0) + 1; });
const byWhat = {}; ev.forEach(x => { const k = String(x.what || '').split(' — ')[0].replace(/[0-9٠-٩]+/g, '#').slice(0, 40); byWhat[k] = (byWhat[k] || 0) + 1; }); console.log('أكثر الأحداث: ' + JSON.stringify(Object.keys(byWhat).sort((a, b) => byWhat[b] - byWhat[a]).slice(0, 12).map(k => [k, byWhat[k]])));
Object.keys(grp).sort((a, b) => grp[b] - grp[a]).slice(0, 12).forEach(k => console.log('  ' + grp[k] + ' × ' + k));
/* ٤ · أحجام المجموعات وطابور المزامنة */
for (const c of ['sites', 'recs', 'inss', 'photos', 'tasks', 'newsites', 'coreqs', 'pending', 'events']){
  try { const n = (await db.collection(c).count().get()).data().count; console.log('  ' + c + ': ' + n); } catch (e){ console.log('  ' + c + ': ? ' + String(e.message || e).slice(0, 60)); }
}
try { const pend = (await db.collection('pending').limit(50).get()).docs.map(d => d.data()); if (pend.length) console.log('pending (أول ٥٠): ' + JSON.stringify(pend.slice(0, 5).map(p => ({ k:p.kind || p.k, at:iso(+p.at) })))); } catch (e){ console.log('pending: ?'); }
process.exit(0);
