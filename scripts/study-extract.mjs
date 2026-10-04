/* أرقامُ المسح لتحديث دراسة منظومة القارئات — من سجلّ النظام وبتعريفات التطبيق نفسِه (يُحمَّل التطبيقُ في بيئة محاكاة
   وتُحقَن فيه بياناتُ القاعدة كما يسحبها الجهاز، ثم تُستدعى دوالُّه). قراءةٌ فقط. */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { JSDOM, VirtualConsole } = require('jsdom');
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const get = async c => { try { return (await db.collection(c).get()).docs.map(d => ({ id: d.id, v: d.data() || {} })); } catch (e){ return []; } };
const [recs, inss, newsites, siteOv, tasks, photos, srv] = await Promise.all(['recs', 'inss', 'newsites', 'sites', 'tasks', 'photos', 'srvorders'].map(get));
const mfuDoc = (await db.collection('settings').doc('mfu').get()).data() || {};
let visitEvents = null, visitEventsSince = null;
try { const ev = await db.collection('events').where('what', '>=', 'مسح موقع — ').where('what', '<', 'مسح موقع — \uf8ff').get(); visitEvents = ev.size; ev.docs.forEach(d => { const t = +(d.data().ts || 0); if (t && (!visitEventsSince || t < visitEventsSince)) visitEventsSince = t; }); } catch (e){ visitEvents = 'ERR ' + String(e).slice(0, 80); }
/* التطبيقُ في المحاكاة */
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'استخراج' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; w.CORE.set = () => true;
const S = w.STATE;
S.siteOv = {}; siteOv.forEach(x => { S.siteOv[x.id] = x.v; });
w.loadSites();
const have = {}; S.sites.forEach(x => { have[x.id] = 1; });
let addedNew = 0;
newsites.forEach(({ id, v }) => {
  if (v && v.id && have[v.id]){ const ex = w.siteFind(v.id); if (ex){ if (v.hidden || v.deleted){ S.sites = S.sites.filter(x => x.id !== v.id); return; } if (+v.lat && +v.lng){ ex.lat = +v.lat; ex.lng = +v.lng; } if (v.name) ex.name = v.name; } return; }
  if (!v || !v.id || v.hidden || v.deleted || have[v.id] || !(+v.lat) || !(+v.lng)) return;
  const ovn = S.siteOv[v.id]; const vv = ovn ? Object.assign({}, v, ovn) : v; S.sites.push(vv); have[v.id] = 1; addedNew++;
});
w.SITE_IX = null; w.SITE_TOK = null;
S.recs = {}; recs.forEach(({ id, v }) => { if (v.deleted !== true) S.recs[id] = v; });
S.inss = {}; inss.forEach(({ id, v }) => { if (v.deleted !== true) S.inss[id] = v; });
S.tasks = {}; tasks.forEach(({ id, v }) => { if (v.deleted !== true) S.tasks[id] = v; });
S.photos = {}; photos.forEach(({ id, v }) => { const o = Object.assign({}, v); delete o.data; S.photos[id] = o; });
const sites = S.sites, onSite = new Set(sites.map(x => x.id));
const R = id => S.recs[id];
const hasChal = r => w.chalKeys((r && r.chals) || []).some(k => k && k !== 'لا توجد تحديات');
const unreach = r => !!(r && r.access && r.access !== 'تم الوصول');
const obsIds = new Set(w.mfuObstacles().map(o => o.x.id));
const keyCount = re => sites.filter(x => { const r = R(x.id); return r && w.chalKeys(r.chals || []).some(k => re.test(k)); });
const textHit = re => sites.filter(x => { const r = R(x.id); if (!r) return false; const all = [].concat(r.chals || []).join(' | ') + ' | ' + String(r.chal_note || '') + ' | ' + String(r.note || ''); return re.test(all); });
const fmtH = ts => new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Riyadh' }).format(new Date(ts));
const fmtG = ts => new Intl.DateTimeFormat('ar-EG-u-nu-arab', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Riyadh' }).format(new Date(ts));
const lastRec = Math.max(0, ...recs.filter(x => x.v.deleted !== true).map(x => +x.v.at || 0));
const lastReg = Math.max(0, ...newsites.map(x => +(x.v._at || x.v.at || 0)), ...siteOv.map(x => +(x.v._at || x.v.edAt || 0)));
const out = { at: new Date().toISOString(), dates: { lastVisit: lastRec, lastVisitH: lastRec ? fmtH(lastRec) : '', lastVisitG: lastRec ? fmtG(lastRec) : '', lastRegistry: lastReg, lastRegistryH: lastReg ? fmtH(lastReg) : '', lastRegistryG: lastReg ? fmtG(lastReg) : '' } };
/* ثانيًا */
const withCoords = sites.filter(x => +x.lat && +x.lng);
const visited = sites.filter(x => R(x.id));
out.general = {
  sitesInSystem: sites.length, sitesWithCoords: withCoords.length, fromRegistry: sites.length - addedNew, addedInField: addedNew, hidden: (S.hiddenSites || []).length,
  visitedSites: visited.length, recsTotal: Object.keys(S.recs).length, recsOffRegistry: Object.keys(S.recs).filter(id => !onSite.has(id)).length,
  visitEvents, visitEventsSince: visitEventsSince ? fmtH(visitEventsSince) + ' (' + fmtG(visitEventsSince) + ')' : '',
  reachedDone: sites.filter(x => w.svDone(R(x.id))).length, revisit: sites.filter(x => R(x.id) && R(x.id).review === 'revisit').length,
  obstacleSites: obsIds.size,
  unreachable: sites.filter(x => unreach(R(x.id))).length,
  unreachableBy: sites.reduce((m, x) => { const r = R(x.id); if (unreach(r)) m[r.access] = (m[r.access] || 0) + 1; return m; }, {}),
  noSurface: keyCount(/^لا يوجد سطح تثبيت/).length, crossbar: keyCount(/^العارضة الحديدية ناقصة/).length,
  unclearEntry: keyCount(/^المدخل غير واضح/).length, sharedEntry: keyCount(/^المدخل مشترك/).length,
  closedText: textHit(/مغلق/).map(x => x.id).length, stairsText: textHit(/درج|سلم|سلالم/).map(x => x.id).length,
  stairs: textHit(/درج|سلم|سلالم/).map(x => ({ id:x.id, g:w.taxOf(x).g, t:w.taxOf(x).t, sq:x.sq || '', sign:x.sign || '', name:x.name || '' })),
  closed: textHit(/مغلق/).map(x => ({ id:x.id, g:w.taxOf(x).g, t:w.taxOf(x).t, sq:x.sq || '', sign:x.sign || '' })),
  chalCounts: (() => { const m = {}; sites.forEach(x => { const r = R(x.id); if (!r) return; w.chalKeys(r.chals || []).forEach(k => { m[k] = (m[k] || 0) + 1; }); }); return m; })()
};
/* ثالثًا: مخيمات منى */
const minaCamps = sites.filter(x => { const c = w.taxOf(x); return c.g === 'منى' && c.t === 'مخيمات'; });
const mc = { inRegistry: minaCamps.length, visited: minaCamps.filter(x => R(x.id)).length };
mc.openChal = minaCamps.filter(x => { const r = R(x.id); return r && hasChal(r) && !(S.inss[x.id] && S.inss[x.id].status === 'مُركّب'); }).length;
mc.unreach = minaCamps.filter(x => unreach(R(x.id))).length;
mc.both = minaCamps.filter(x => { const r = R(x.id); return r && hasChal(r) && unreach(r); }).length;
mc.obstacle = minaCamps.filter(x => obsIds.has(x.id)).length;
out.minaCamps = mc;
/* رابعًا: التوزيع بتصنيف النظام */
const dist = {};
sites.forEach(x => { const c = w.taxOf(x), k = c.g + ' · ' + c.t, o = dist[k] = dist[k] || { g:c.g, t:c.t, n:0, visited:0, obstacle:0, unreach:0 }; o.n++; if (R(x.id)) o.visited++; if (obsIds.has(x.id)) o.obstacle++; if (unreach(R(x.id))) o.unreach++; });
out.byType = Object.values(dist).map(o => Object.assign(o, { notVisited: o.n - o.visited }));
out.nameHits = { haram: sites.filter(x => /الحرم|المسجد الحرام/.test(String(x.name || ''))).map(x => x.id).slice(0, 20), tourism: sites.filter(x => /السياحة/.test(String(x.name || '') + ' ' + String(x.zone || ''))).map(x => x.id).slice(0, 20), rahma: sites.filter(x => /الرحمة/.test(String(x.name || ''))).map(x => ({ id:x.id, name:x.name })).slice(0, 30) };
/* خامسًا: منشأة الجمرات */
const jmr = sites.filter(x => w.isJmr(x));
out.jamarat = { points: jmr.length, cams: jmr.filter(x => x.type === 'كاميرا').length, readers: jmr.filter(x => x.type !== 'كاميرا').length,
  visited: jmr.filter(x => R(x.id)).length,
  rows: jmr.map(x => { const r = R(x.id) || {}; return { id:x.id, type:x.type, name:x.name, floor:w.siteFloor(x), gate:w.siteGate ? w.siteGate(x) : '', visited:!!R(x.id), access:r.access || '', corr_w:r.corr_w || '', len_m:r.len_m || '', wid_m:r.wid_m || '', n_ant:r.n_ant || '', n_rdr:r.n_rdr || '', n_cam:r.n_cam || '', jam_pos:r.jam_pos || '', note:String(r.note || '').slice(0, 120) }; }) };
/* سادسًا: طلبات المسح المفتوحة */
out.srvorders = srv.map(x => ({ id:x.id, st:x.v.st || x.v.status || '', title:x.v.title || x.v.name || '', by:x.v.by || '', due:x.v.due || x.v.target || '', n:(x.v.sites || x.v.ids || []).length, closed:!!(x.v.closed || x.v.closedAt) }));
out.visitTasksOpen = tasks.filter(x => x.v.kind === 'visit' && !x.v.deleted && x.v.status !== 'مكتمل' && x.v.status !== 'done' && !(R(x.v.site) && w.svDone(R(x.v.site)))).map(x => ({ site:x.v.site, by:x.v.by || '', to:x.v.to || x.v.who || '', due:x.v.due || '', st:x.v.status || '' })).slice(0, 80);
out.mfuReq = (mfuDoc.req || mfuDoc.reqs || []).map(q => ({ t:q.t || q.title || '', who:q.who || q.by || '', due:q.due || q.at || '', st:q.st || q.status || '' })).slice(0, 60);
out.mfuKeys = Object.keys(mfuDoc);
writeFileSync('/tmp/exp/study-extract.json', JSON.stringify(out));
console.log('sites', sites.length, '| visited', visited.length, '| obstacles', obsIds.size, '| jamarat', jmr.length);
process.exit(0);
