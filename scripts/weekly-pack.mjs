/* ═══════════════════════════════════════════════════════════════════════════
   التحديثُ الأسبوعيُّ يُولَّد في السحابة من التطبيق نفسِه — node scripts/weekly-pack.mjs
   ───────────────────────────────────────────────────────────────────────────
   فكرةُ المالك (V30.0): «التقرير الأسبوعي يتبعت لوحده كل أحد الصبح — باوربوينت وبي دي إف على البريد والدرايف».
   لا حقيقةَ ثانية: يُحمَّل التطبيقُ في متصفّحٍ صوري، وتُحقَن فيه بياناتُ القاعدة كما يسحبها الهاتف، ثم تُستدعى
   دوالُّ التصدير نفسُها: mfuPptx (القالبُ الموحَّد) وmfuPrintHtml (PDF بالقالب الموحَّد والخطِّ المرفوع)، ويُفحَص
   الملفُّ بفحص التطبيق (mfuReportCheck/pptxCheck) قبل أن يخرج.
     FIREBASE_SERVICE_ACCOUNT — القاعدة؛ WEEKLY_TEST=1 — بلا قاعدة (دخانٌ محليّ)
     WEEKLY_OUT (افتراضًا /tmp/ministry) — weekly.pptx · weekly.html · brief.txt · weekly.json
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const OUT = process.env.WEEKLY_OUT || '/tmp/ministry'; mkdirSync(OUT, { recursive:true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const TEST = process.env.WEEKLY_TEST === '1';

/* ── القاعدة ── */
let data = { recs:[], inss:[], newsites:[], sites:[], tasks:[], photos:[], settings:{} };
if (!TEST){
  const admin = (await import('firebase-admin')).default;
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential:admin.credential.cert(sa) }); const db = admin.firestore();
  const get = async c => { try { return (await db.collection(c).get()).docs.map(d => ({ id:d.id, v:d.data() || {} })); } catch (e){ return []; } };
  const [recs, inss, newsites, sites, tasks, photos, settings] = await Promise.all(['recs', 'inss', 'newsites', 'sites', 'tasks', 'photos', 'settings'].map(get));
  data = { recs, inss, newsites, sites, tasks, photos, settings:Object.fromEntries(settings.map(d => [d.id, d.v])) };
}

/* ── التطبيقُ في المحاكاة ── */
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'التقرير الأسبوعي' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; w.CORE.set = () => true; w.logEvent = () => {};
const S = w.STATE;
if (!TEST){
  S.siteOv = {}; data.sites.forEach(x => { S.siteOv[x.id] = x.v; }); w.loadSites();
  const have = {}; S.sites.forEach(x => { have[x.id] = 1; });
  data.newsites.forEach(({ v }) => { if (v && v.id && have[v.id]){ const ex = w.siteFind(v.id); if (ex){ if (v.hidden || v.deleted){ S.sites = S.sites.filter(x => x.id !== v.id); return; } if (+v.lat && +v.lng){ ex.lat = +v.lat; ex.lng = +v.lng; } if (v.name) ex.name = v.name; } return; }
    if (!v || !v.id || v.hidden || v.deleted || have[v.id] || !(+v.lat) || !(+v.lng)) return; const ovn = S.siteOv[v.id]; S.sites.push(ovn ? Object.assign({}, v, ovn) : v); have[v.id] = 1; });
  w.SITE_IX = null; w.SITE_TOK = null;
  S.recs = {}; data.recs.forEach(({ id, v }) => { if (v.deleted !== true) S.recs[id] = v; });
  S.inss = {}; data.inss.forEach(({ id, v }) => { if (v.deleted !== true) S.inss[id] = v; });
  S.tasks = {}; data.tasks.forEach(({ id, v }) => { if (v.deleted !== true) S.tasks[id] = v; });
  S.photos = {}; data.photos.forEach(({ id, v }) => { const o = Object.assign({}, v); delete o.data; S.photos[id] = o; });
  const st = data.settings;
  Object.keys(st).forEach(k => { if (!(k in w.CFG) || typeof w.CFG[k] !== 'object') w.CFG[k] = st[k]; });   /* الإعداداتُ كما تُسحَب */
  if (st.mfu){ w.MFU.v = st.mfu; S.mfu = st.mfu; }
  if (st.wtask && Array.isArray(st.wtask.rows)) S.wtask = { rows:st.wtask.rows, at:st.wtask.at, by:st.wtask.by, meetAt:st.wtask.meetAt || 0, meetBy:st.wtask.meetBy || '' };
  if (st.miles){ const arr = w.arrFromDoc ? w.arrFromDoc(st.miles) : []; if (arr.length) S.mileDates = arr; }
  if (st.fonts) w.CFG.fonts = st.fonts;
}

/* ── التصديرُ بدوالِّ التطبيق ── */
const R = w.mfuReport(); const issues = w.mfuReportCheck(R);
if (issues.length){ console.log('::error title=weekly::فحصُ الملف رفض التقرير: ' + issues.slice(0, 5).join(' | ')); process.exit(2); }
writeFileSync(OUT + '/brief.txt', w.mfuBriefText());
w.PPTX_TPL = new Uint8Array(readFileSync('templates/ministry-unified.pptx'));
let got = null; w.Blob = class { constructor(parts, o){ this.parts = parts; this.type = (o || {}).type || ''; } }; w.dl = (b, name) => { got = { b, name }; return true; };
w.expGate = (k, iss) => { if (iss && iss.length){ console.log('::error title=weekly::' + k + ': ' + iss.slice(0, 5).join(' | ')); return false; } return true; };
const ok = await w.mfuPptx();
if (!ok || !got || !got.b.parts[0]){ console.log('::error title=weekly::لم يخرج الباوربوينت'); process.exit(2); }
const base = String(got.name || 'التحديث-الأسبوعي').replace(/\.pptx$/i, '').replace(/[\/\\:*?"<>|]/g, '-');
writeFileSync(OUT + '/weekly.pptx', Buffer.from(got.b.parts[0])); writeFileSync(OUT + '/' + base + '.pptx', Buffer.from(got.b.parts[0]));
const html = w.mfuPrintHtml(R, w.CFG.fonts || null);
writeFileSync(OUT + '/weekly.html', html); writeFileSync(OUT + '/base.txt', base);
writeFileSync(OUT + '/weekly.json', JSON.stringify({ at:new Date().toISOString(), hijri:R.hijri, greg:R.greg, sites:S.sites.length, kpis:R.kpis, brief:R.brief, pptxBytes:got.b.parts[0].length, pptxName:got.name, fonts:!!(w.CFG.fonts && w.CFG.fonts.r) }));
console.log('weekly: pptx', got.b.parts[0].length, 'bytes | html', html.length, '| fonts', !!(w.CFG.fonts && w.CFG.fonts.r), '| sites', S.sites.length);
process.exit(0);
