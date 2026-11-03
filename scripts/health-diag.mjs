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
open.sort((a, b) => (+b.at || 0) - (+a.at || 0)).slice(0, 15).forEach(b => console.log('  ' + iso(+b.at) + ' · ' + (b.by || b.name || '') + ' · ' + String(b.txt || b.title || b.text || '').slice(0, 160) + ' · ' + String(b.want || '').slice(0, 80) + ' · ' + String(b.decWhy || '').slice(0, 80) + ' · ' + (b.status || '')));
/* ٣ · أحداث الأسبوع: أخطاء وتعذّر */
let ev = [];
try { ev = (await db.collection('events').where('ts', '>', now - 7 * DAY).get()).docs.map(d => d.data()); } catch (e){ ev = (await db.collection('events').orderBy('ts', 'desc').limit(3000).get()).docs.map(d => d.data()).filter(x => now - (+x.ts || 0) < 7 * DAY); }
const bad = ev.filter(x => /خطأ|تعذّر|تعذر|فشل|error/i.test(String(x.what || '')));
console.log('أحداث آخر ٧ أيام: ' + ev.length + ' · فيها كلمة خطأ/تعذّر/فشل: ' + bad.length);
const grp = {}; bad.forEach(x => { const k = String(x.what || '').replace(/[0-9٠-٩]+/g, '#').slice(0, 160); grp[k] = (grp[k] || 0) + 1; });
const bf = {}; ev.filter(x => /عطلٌ في متصفّح الجهاز|تجاوز سقفَ/.test(String(x.what || ''))).forEach(x => { const k = String(x.what || '').replace(/[0-9٠-٩]+/g, '#').slice(0, 140) + ' ‹' + (x.by || '') + '›'; bf[k] = (bf[k] || 0) + 1; }); console.log('أعطال المتصفح: ' + JSON.stringify(Object.keys(bf).sort((a, b) => bf[b] - bf[a]).slice(0, 10).map(k => [bf[k], k])));
const byWhat = {}; ev.forEach(x => { const k = String(x.what || '').split(' — ')[0].replace(/[0-9٠-٩]+/g, '#').slice(0, 40); byWhat[k] = (byWhat[k] || 0) + 1; }); console.log('أكثر الأحداث: ' + JSON.stringify(Object.keys(byWhat).sort((a, b) => byWhat[b] - byWhat[a]).slice(0, 12).map(k => [k, byWhat[k]])));
Object.keys(grp).sort((a, b) => grp[b] - grp[a]).slice(0, 12).forEach(k => console.log('  ' + grp[k] + ' × ' + k));
/* ٤ · أحجام المجموعات وطابور المزامنة */
for (const c of ['sites', 'recs', 'inss', 'photos', 'tasks', 'newsites', 'coreqs', 'pending', 'events']){
  try { const n = (await db.collection(c).count().get()).data().count; console.log('  ' + c + ': ' + n); } catch (e){ console.log('  ' + c + ': ? ' + String(e.message || e).slice(0, 60)); }
}
try { const pend = (await db.collection('pending').limit(50).get()).docs.map(d => d.data()); if (pend.length) console.log('pending (أول ٥٠): ' + JSON.stringify(pend.slice(0, 5).map(p => ({ k:p.kind || p.k, at:iso(+p.at) })))); } catch (e){ console.log('pending: ?'); }
/* (V43.6) a focused look: events of the last three hours matching Q (a regex), with who, when and the device */
const Q = String(process.env.Q || '');
if (Q){ const re = new RegExp(Q, 'i'); ev.filter(x => now - (+x.ts || 0) < 3 * 3600000 && re.test(String(x.what || ''))).sort((a, b) => (+a.ts || 0) - (+b.ts || 0)).slice(-40).forEach(x => console.log('Q · ' + iso(+x.ts) + ' · ' + (x.by || '') + ' · ' + String(x.what || '').slice(0, 220))); }
/* (V43.6) points outside the Makkah area (a stray coordinate makes «fit to points» zoom out to half the region) */
if (process.env.OUT){
  const box = (la, ln) => la > 20.8 && la < 22.2 && ln > 39.4 && ln < 40.5;
  for (const c of ['newsites', 'sites']){
    const D = (await db.collection(c).get()).docs; let n = 0;
    D.forEach(d => { const v = d.data() || {}, la = +v.lat, ln = +v.lng; if ((la || ln) && !box(la, ln)){ n++; if (n <= 15) console.log('OUT · ' + c + ' · ' + d.id + ' · ' + (v.name || '') + ' · ' + la + ',' + ln + ' · ' + (v.by || v._by || '') + ' · ' + (v.hidden ? 'مخفي' : '') + (v.deleted ? 'محذوف' : '')); } });
    console.log('OUT · ' + c + ': ' + n + ' خارج مكة من ' + D.length);
  }
}
/* (V43.13) recent manual additions: new sites and site overrides of the last 48 hours, with who wrote them */
if (process.env.NEW){
  const since = now - 2 * DAY;
  for (const c of ['newsites', 'sites']){
    let D = [];
    try { D = (await db.collection(c).where('_at', '>', since).get()).docs; } catch (e){ console.log('NEW · ' + c + ': ? ' + String(e.message || e).slice(0, 80)); continue; }
    console.log('NEW · ' + c + ': ' + D.length + ' في ٤٨ ساعة');
    D.slice(0, 25).forEach(d => { const v = d.data() || {}; console.log('NEW · ' + c + ' · ' + d.id + ' · ' + String(v.name || '').slice(0, 30) + ' · ' + (v.type || '') + ' · ' + (v.zone || '') + ' · by=' + (v.by || '') + ' · _by=' + String(v._by || '').slice(0, 8) + ' · ' + iso(+v._at || +v.at) + ' · approved=' + v.approved + ' · origin=' + (v.origin || '') + ' · lat=' + v.lat + ' lng=' + v.lng + ' · keys=' + Object.keys(v).filter(k => !/^_/.test(k)).slice(0, 14).join(',') + (v.deleted ? ' · محذوف' : '') + (v.hidden ? ' · مخفي' : '')); });
  }
}
/* (V43.16) the AFAQY PRO bridge — always printed: the bridge's own status line and the age of the live sensor feed it writes.
   No credential is read (integ/* stays untouched); only settings/integStatus and iotlive/_all's header fields. */
try {
  const st = ((await db.collection('settings').doc('integStatus').get()).data() || {}).pro || {};
  const lv = (await db.collection('iotlive').doc('_all').get()).data() || {};
  const ago = t => t ? Math.round((now - t) / 60000) + ' د' : '—';
  console.log('PRO · الحالة: ' + (st.state || '—') + ' · آخر تشغيل ' + ago(st.at) + ' (' + (st.why || '') + ') · مخطّط ' + (st.planned ?? '—') + ' · بسيريال ' + (st.withImei ?? '—') + ' · وُجد ' + (st.found ?? '—') + ' · طابق ' + (st.matched ?? '—') + (st.err ? ' · خطأ: ' + st.err + (st.httpStatus ? ' (' + st.httpStatus + ')' : '') : '') + (st.tokExp ? ' · الجلسة حتى ' + iso(st.tokExp) : ''));
  console.log('PRO · التغذية الحيّة: آخر كتابة ' + ago(lv.at) + ' · وحدات مطابقة ' + (lv.n ?? '—') + ' من ' + (lv.total ?? '—') + ' · المصدر ' + (lv.src || '—'));
} catch (e){ console.log('PRO · ? ' + String(e.message || e).slice(0, 100)); }
/* (V43.19) the owner's question: per holy site, how many camps the survey set «ترددي» and how many tafweej gates were counted —
   read from the survey records only (recs: ctype / tbar, zone), the field-stamped ones (ctypeBy) listed apart. */
try {
  const qs = await db.collection('recs').where('ctype', '==', 'ترددي').get();
  const Z = {};
  qs.forEach(doc => { const r = doc.data() || {}; if (r.deleted) return; const z = ({ MIN:'منى', ARF:'عرفات', MUZ:'المزدلفة', JAM:'الجمرات' })[(doc.id.split('-')[1] || '')] || (r.zone || doc.id.slice(0, 8));   /* the record has no zone; the id's second segment names the holy site */ const o = Z[z] = Z[z] || { n:0, nField:0, bars:0, barsField:0, noCount:0 };
    o.n++; const tb = +r.tbar || 0; o.bars += tb; if (!tb) o.noCount++; if (r.ctypeBy){ o.nField++; o.barsField += (r.tbarBy ? tb : 0); } });
  const by = {}, U = {}; (await db.collection('users').get()).forEach(d => { const u = d.data() || {}; if (u.name) U[u.name] = u.role || ''; });
  qs.forEach(doc => { const r = doc.data() || {}; if (r.deleted) return; const k = (r.by || '—') + ' [' + (U[r.by] || '?') + ']' + (r.ctypeBy ? ' ✓ختم' : ''); by[k] = (by[k] || 0) + 1; });
  console.log('TARD · من سجّلها: ' + Object.keys(by).map(k => k + ' = ' + by[k]).join(' · '));
  console.log('TARD · مخيمات «ترددي» في سجلات المسح: ' + Object.keys(Z).map(z => z + ' = ' + Z[z].n + ' مخيم (' + Z[z].nField + ' بختم الميدان) · بوابات ' + Z[z].bars + ' (' + Z[z].barsField + ' بختم الميدان) · بلا عدد ' + Z[z].noCount).join(' | '));
} catch (e){ console.log('TARD · ? ' + String(e.message || e).slice(0, 120)); }
/* (V44.0) the shapes of the audit-log events in the last 14 days — to build the activity report's classifier on real texts.
   Grouped by the text up to its first « — » (the action), with a count, the share carrying a site id, who wrote them and an example. */
if (process.env.EV){
  try {
    const since = Date.now() - 14 * 864e5;
    const sn = await db.collection('events').where('ts', '>=', since).get();
    const G = {}, W = {};
    sn.forEach(d => { const e = d.data() || {}; const w = String(e.what || ''); const k = (w.split(/\s[\u2014\u2013-]\s/)[0] || w).replace(/[0-9\u0660-\u0669]+/g, '#').slice(0, 48);
      const g = G[k] = G[k] || { n:0, site:0, ex:'' , by:{} }; g.n++; if (e.site) g.site++; if (!g.ex) g.ex = w.slice(0, 110); const b = e.by || '?'; g.by[b] = (g.by[b] || 0) + 1; });
    const L = Object.keys(G).sort((a, b) => G[b].n - G[a].n);
    console.log('EV · أحداث ١٤ يومًا: ' + sn.size + ' · أشكال: ' + L.length);
    L.slice(0, 90).forEach(k => console.log('EVK · ' + G[k].n + ' · site ' + G[k].site + ' · ' + k + ' · مثال: ' + G[k].ex));
    const people = {}; sn.forEach(d => { const e = d.data() || {}; people[e.by || '?'] = (people[e.by || '?'] || 0) + 1; });
    console.log('EVP · ' + Object.keys(people).sort((a, b) => people[b] - people[a]).slice(0, 25).map(k => k + '=' + people[k]).join(' | '));
  } catch (e){ console.log('EV · ? ' + String(e.message || e).slice(0, 160)); }
}
process.exit(0);
