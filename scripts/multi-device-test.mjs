/* ═══ ثلاثةُ أجهزةٍ — ثلاثةُ أدوار (V43.15) ═══
   طلبُ المالك: «أيُّ حدٍّ بيحرّك أيَّ حاجة تظهر لي كأدمن، وأنا لما بعمل أيَّ حاجة تظهر لهم على الخريطة».
   الجردُ الصوريُّ (audit-propagation) يفحص جهازًا واحدًا بقاعدةٍ مزيّفة؛ وهذا يفتح كروميوم حقيقيًّا ثلاثَ مرات —
   المالكُ (admin) ومهندسٌ ومشرفٌ — على محاكي Firestore وAuth الرسميَّين بقواعد القاعدة نفسِها، فيكتب كلُّ دورٍ ما
   يكتبه في الميدان (موقعٌ جديد، تحريكُ حساس، تحريكُ نقطة، تعديلُ بيانات، حذفٌ نهائي…) ويُنتظَر أن يراه الآخرون
   بالنبضة نفسِها التي يراها بها الميدان — ثم يُعاد فتحُ التطبيق (V43.13) فيبقى ما وصل.
   التشغيل:
     npx firebase emulators:exec --only firestore,auth --project demo-nusuk "node scripts/multi-device-test.mjs"
   ═══ */
import { createServer } from 'http';
import { gzipSync } from 'zlib';
import { readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createRequire } from 'module';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW_MOD || 'playwright');

const FS = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const AU = (process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099');
const PROJECT = 'demo-nusuk';
const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json',
               '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const srv = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!existsSync(p) || statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; }
  const buf = readFileSync(p), ext = extname(p), txt = /^\.(html|js|json|css|svg|webmanifest)$/.test(ext);
  if (txt && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))){
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-encoding':'gzip', 'vary':'accept-encoding' });
    res.end(gzipSync(buf, { level:6 })); return;
  }
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' }); res.end(buf);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + srv.address().port + '/';
const OUT = 'test-artifacts'; if (!existsSync(OUT)) mkdirSync(OUT);

let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c){ bad++; console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const crash = (what, e) => { const m = String(e && e.stack || e && e.message || e).replace(/[\r\n]+/g, ' ⏎ ').slice(0, 700); console.log('::error title=استثناءٌ في ' + what + '::' + m); console.log('✗ ' + what + ': ' + m); process.exit(1); };
process.on('uncaughtException', e => crash('الاختبار', e));
process.on('unhandledRejection', e => crash('وعدٌ بلا التقاط', e));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── ١ · الحسابات في المحاكي: المالكُ ببريده المعروف للقواعد، ومهندسٌ ومشرف ── */
const ACC = { admin:{ user:'m.safwat', pass:'TestPass1234', role:'admin', name:'صفوت (المالك)' },
              eng:{ user:'shokri.t', pass:'TestPass1234', role:'engineer', name:'شكري (مهندس)' },
              sup:{ user:'khaled.t', pass:'TestPass1234', role:'supervisor', name:'خالد (مشرف)' },
              tech:{ user:'tech.t', pass:'TestPass1234', role:'tech', name:'فني التجربة' } };
async function authSignUp(a){
  const r = await fetch('http://' + AU + '/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo', { method:'POST', headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ email:a.user + '@nusuk.local', password:a.pass, returnSecureToken:true }) });
  const j = await r.json(); if (!j.localId) throw new Error('auth signUp ' + a.user + ': ' + JSON.stringify(j).slice(0, 200)); return j.localId;
}
const fsVal = v => typeof v === 'number' ? (Number.isInteger(v) ? { integerValue:String(v) } : { doubleValue:v }) : typeof v === 'boolean' ? { booleanValue:v } : { stringValue:String(v) };
async function fsSet(col, id, obj){
  const fields = {}; Object.keys(obj).forEach(k => { fields[k] = fsVal(obj[k]); });
  const r = await fetch('http://' + FS + '/v1/projects/' + PROJECT + '/databases/(default)/documents/' + col + '/' + encodeURIComponent(id), { method:'PATCH', headers:{ 'content-type':'application/json', authorization:'Bearer owner' }, body:JSON.stringify({ fields }) });
  if (!r.ok) throw new Error('fs set ' + col + '/' + id + ': ' + r.status + ' ' + (await r.text()).slice(0, 200));
}
async function fsGet(col, id){
  const r = await fetch('http://' + FS + '/v1/projects/' + PROJECT + '/databases/(default)/documents/' + col + '/' + encodeURIComponent(id), { headers:{ authorization:'Bearer owner' } });
  if (r.status === 404) return null; const j = await r.json(); return j.fields || null;
}
for (const k of Object.keys(ACC)){ const a = ACC[k]; a.uid = await authSignUp(a); await fsSet('users', a.uid, { name:a.name, user:a.user, role:a.role, at:Date.now(), by:'seed', _by:a.uid, _at:Date.now() }); }
console.log('  · حساباتُ المحاكي: ' + Object.keys(ACC).map(k => ACC[k].user + '=' + ACC[k].role).join(' · '));

/* ── ٢ · ثلاثةُ متصفّحات — كلُّ واحدٍ جهازٌ مستقلٌّ بتخزينه ── */
const browser = await chromium.launch();
/* يُحوَّل التطبيقُ إلى المحاكي قبل أن يُنشئ Firebase: يُلتقَط `window.firebase` عند تحميله ويُغلَّف initializeApp */
const HOOK = `(function(){
  var FSH = ${JSON.stringify(FS)}, AUH = ${JSON.stringify(AU)}, _fb;
  function wrap(fb){
    if (!fb || fb.__emu) return fb; fb.__emu = true;
    var orig = fb.initializeApp;
    fb.initializeApp = function(cfg, name){
      var c = Object.assign({}, cfg || {}, { projectId:'demo-nusuk', apiKey:'demo-key', authDomain:'127.0.0.1' });
      var app = orig.call(this, c, name);
      try { app.auth().useEmulator('http://' + AUH, { disableWarnings:true }); } catch (e){}
      try { app.firestore().useEmulator(FSH.split(':')[0], +FSH.split(':')[1]); } catch (e){}
      return app;
    };
    return fb;
  }
  Object.defineProperty(window, 'firebase', { configurable:true, get:function(){ return _fb; }, set:function(v){ _fb = wrap(v); } });
})();`;
async function device(key, tag){
  const a = ACC[key];
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale:'ar', hasTouch:true, isMobile:true, bypassCSP:true, serviceWorkers:'block' });
  await ctx.addInitScript(HOOK);
  /* لا شبكةَ خارجَ الجهاز: التطبيقُ والمحاكي على 127.0.0.1 وحدَهما — فلا بلاطَ خرائطَ ولا جيت هب */
  await ctx.route('**/*', r => { const u = r.request().url(); if (/^https?:\/\/127\.0\.0\.1[:\/]/.test(u)) return r.continue(); return r.abort(); });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error'){ const s = m.text(); if (!/net::ERR_FAILED|Failed to load resource|ERR_BLOCKED|google|gstatic/i.test(s)) errs.push(s); } });
  await page.goto(base + 'index.html', { waitUntil:'load' });
  await page.waitForFunction(() => !!document.getElementById('lgGo'), null, { timeout:30000 });
  await page.fill('#lgU', a.user); await page.fill('#lgP', a.pass); await page.click('#lgGo');
  await page.waitForFunction(() => window.STATE && STATE.meta && STATE.meta.uid && STATE.meta.role, null, { timeout:40000 });
  await page.waitForFunction(() => window.STATE && STATE.sites && STATE.sites.length > 100 && STATE.meta.lastSync, null, { timeout:40000 });
  await sleep(1500);
  const role = await page.evaluate(() => STATE.meta.role);
  T(role === a.role, tag + ': دخل بدوره «' + role + '»');
  return { key, tag, page, ctx, errs, a };
}
const D = {};
D.admin = await device('admin', 'المالك'); D.eng = await device('eng', 'المهندس'); D.sup = await device('sup', 'المشرف'); D.tech = await device('tech', 'الفني');
const ALL = [D.admin, D.eng, D.sup];   /* the office trio sees everything; the technician sees only his own work (pullScope) */
const EVERY = [D.admin, D.eng, D.sup, D.tech];
const others = me => ALL.filter(d => d !== me);
/* ينتظر حتى يرى الجهازُ ما كُتب (النبضةُ تُقرأ حيًّا فتُسحَب التغييرات بعد ثانيتين) */
async function seen(d, fn, arg, label, ms = 25000){
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < ms){ try { ok = await d.page.evaluate(fn, arg); } catch (e){ ok = false; } if (ok) break; await sleep(700); }
  T(ok, d.tag + ' يرى: ' + label + (ok ? ' (' + Math.round((Date.now() - t0) / 100) / 10 + ' ث)' : ' — لم يصل خلال ' + ms / 1000 + ' ث'));
  return ok;
}
async function restart(d){
  await d.page.reload({ waitUntil:'load' });
  await d.page.waitForFunction(() => window.STATE && STATE.meta && STATE.meta.uid && STATE.sites && STATE.sites.length > 100 && STATE.meta.lastSync, null, { timeout:40000 });
  await sleep(2500);
}
async function uploaded(d, label){   /* الطابورُ فارغٌ = وصل إلى القاعدة */
  const t0 = Date.now(); let n = 1;
  while (Date.now() - t0 < 20000){ n = await d.page.evaluate(() => (typeof SYNC !== 'undefined' && SYNC.queue && SYNC.queue.length) || 0); if (!n) break; await sleep(500); }
  T(!n, d.tag + ': رُفع ' + label + (n ? ' — بقي ' + n + ' في الطابور' : ''));
}
const near = (a, b, m = 2) => a && b && Math.abs(a[0] - b[0]) * 111000 < m && Math.abs(a[1] - b[1]) * 111000 < m;

/* ── ٣ · السيناريوهات ── */
console.log('\n══ ١ · المشرفُ يضيف مخيمًا من الميدان — يراه المالكُ والمهندس، ويبقى بعد إعادة الفتح (V43.13) ══');
const NEW = await D.sup.page.evaluate(() => {
  NEWSITE.zone = 'منى'; NEWSITE.type = 'مخيم'; NEWSITE.sq = '77'; NEWSITE.sign = '12/3';
  NEWSITE.lat = 21.4152; NEWSITE.lng = 39.8905;
  NEWSITE.co = ''; NEWSITE.coReq = ''; NEWSITE.reason = 'عدم وجود تخصيص'; NEWSITE.chals = ['لا توجد تحديات'];
  NEWSITE.photos = { 0:{ d:'data:image/png;base64,iVBORw0KGgo=' }, 1:{ d:'data:image/png;base64,iVBORw0KGgo=' } };
  window.confirm = () => true;
  const before = STATE.sites.length; nsSave();
  const x = STATE.sites[STATE.sites.length - 1];
  return STATE.sites.length === before + 1 ? { id:x.id, name:x.name, origin:x.origin, lat:x.lat, lng:x.lng } : null;
});
T(!!NEW, 'المشرف أضاف مخيمًا جديدًا' + (NEW ? ' ' + NEW.id + ' (' + NEW.origin + ')' : ''));
if (NEW){
  await uploaded(D.sup, 'المخيم الجديد');
  for (const d of others(D.sup)) await seen(d, id => !!siteFind(id) && !!(STATE.newsites || {})[id], NEW.id, 'المخيم الجديد ' + NEW.id + ' في السجل');
  await seen(D.admin, id => { const o = STATE.newsites[id]; return !!o && o.origin === 'field' && o.approved === false; }, NEW.id, 'أصلُه «الميدان» وغيرُ معتمَد — كما كُتب');
  await restart(D.admin);
  await seen(D.admin, id => !!siteFind(id), NEW.id, 'المخيم الجديد بعد إعادة فتح التطبيق', 8000);
  await restart(D.sup);
  await seen(D.sup, id => !!siteFind(id), NEW.id, 'مخيمُه بعد إعادة فتح تطبيقه (كان يختفي قبل V43.13)', 8000);
}

console.log('\n══ ٢ · المهندسُ يحرّك حساسًا — يراه المالكُ والمشرف ══');
const CAMP = 'NSK-MIN-CMP-0003';
const iotReady = d => d.page.waitForFunction(id => typeof iotOf === 'function' && !!iotOf(id), id = CAMP, { timeout:30000 }).catch(() => null);
for (const d of ALL) await d.page.evaluate(() => { if (typeof iotLoad === 'function') iotLoad(); });
for (const d of ALL){ const ok = await d.page.waitForFunction(id => typeof iotOf === 'function' && !!iotOf(id), CAMP, { timeout:30000 }).then(() => true).catch(() => false); T(ok, d.tag + ': خطةُ حساسات ' + CAMP + ' محمَّلة'); }
const MV = await D.eng.page.evaluate(id => {
  const c = iotOf(id); if (!c) return null;
  const S = mvdState(); S.id = id;
  const it = { k:'s', i:0, key:'s0', lab:iotSid(id, c, 0), at:c.sensors[0].slice() };
  const to = [c.sensors[0][0] + 0.00030, c.sensors[0][1] + 0.00030];
  const ok = mvdSet(it, to[0], to[1]);
  return ok ? { to:to, lab:it.lab } : null;
}, CAMP);
T(!!MV, 'المهندس حرّك ' + (MV ? MV.lab : 'الحساس') + ' ٣٠ م');
if (MV){
  await uploaded(D.eng, 'تحريك الحساس');
  for (const d of others(D.eng)) await seen(d, a => { const c = iotOf(a.id); return !!c && c.ov && Math.abs(c.sensors[0][0] - a.to[0]) < 1e-6 && Math.abs(c.sensors[0][1] - a.to[1]) < 1e-6; }, { id:CAMP, to:MV.to }, 'الحساس في مكانه الجديد');
}

console.log('\n══ ٣ · المشرفُ يحرّك الجيت واي — يراه المالك ══');
const GW = await D.sup.page.evaluate(id => {
  const c = iotOf(id); if (!c || !mayIot()) return null;
  const S = mvdState(); S.id = id;
  const it = { k:'g', i:0, key:'g0', lab:iotGid(id, c, 0), at:c.gw.slice() };
  const to = [c.gw[0] - 0.00020, c.gw[1] - 0.00020];
  return mvdSet(it, to[0], to[1]) ? { to:to } : null;
}, CAMP);
T(!!GW, 'المشرف حرّك الجيت واي (mayIot للمشرف)');
if (GW){
  await uploaded(D.sup, 'تحريك الجيت واي');
  for (const d of others(D.sup)) await seen(d, a => { const c = iotOf(a.id); return !!c && Math.abs(c.gw[0] - a.to[0]) < 1e-6; }, { id:CAMP, to:GW.to }, 'الجيت واي في مكانه الجديد');
  await seen(D.admin, a => { const c = iotOf(a.id); return !!c && Math.abs(c.sensors[0][0] - a.to[0]) < 1e-6; }, { id:CAMP, to:MV.to }, 'وتحريكُ المهندس للحساس لم يُمحَ بتحريك المشرف للجيت واي');
}

console.log('\n══ ٤ · المالكُ يحرّك نقطةً ويعدّل اسمَها — يراهما المهندسُ والمشرف ══');
const SITE = await D.admin.page.evaluate(() => { const x = STATE.sites.find(y => y.type === 'مخيم' && !y.isNew && +y.lat && !STATE.recs[y.id]); return x ? { id:x.id, lat:+x.lat, lng:+x.lng, name:x.name } : null; });
T(!!SITE, 'نقطةٌ مسجَّلة للتجربة: ' + (SITE && SITE.id));
if (SITE){
  const to = [SITE.lat + 0.00040, SITE.lng + 0.00040];
  await D.admin.page.evaluate(a => { MOVE_ID = a.id; moveApply(a.to[0], a.to[1]); }, { id:SITE.id, to });
  await D.admin.page.evaluate(a => { siteOvSet(a.id, { name:a.name, edBy:STATE.meta.name, edAt:Date.now() }); const x = siteFind(a.id); x.name = a.name; }, { id:SITE.id, name:SITE.name + ' — تجربة' });
  await uploaded(D.admin, 'تحريك النقطة وتعديل الاسم');
  for (const d of others(D.admin)){
    await seen(d, a => { const x = siteFind(a.id); return !!x && Math.abs(+x.lat - a.to[0]) < 1e-6 && Math.abs(+x.lng - a.to[1]) < 1e-6; }, { id:SITE.id, to }, 'النقطة ' + SITE.id + ' في مكانها الجديد');
    const okN = await seen(d, a => { const x = siteFind(a.id); return !!x && x.name === a.name; }, { id:SITE.id, name:SITE.name + ' — تجربة' }, 'والاسمُ المعدَّل');
    if (!okN){ console.log('    · الخادم: ' + JSON.stringify(await fsGet('sites', SITE.id)).slice(0, 600)); console.log('    · ' + d.tag + ' siteOv: ' + JSON.stringify(await d.page.evaluate(id => [STATE.siteOv[id], siteFind(id) && siteFind(id).name], SITE.id)).slice(0, 500)); console.log('    · المالك siteOv: ' + JSON.stringify(await D.admin.page.evaluate(id => [STATE.siteOv[id], STATE.queue.length], SITE.id)).slice(0, 500)); }
  }
  await restart(D.eng);
  await seen(D.eng, a => { const x = siteFind(a.id); return !!x && Math.abs(+x.lat - a.to[0]) < 1e-6 && x.name === a.name; }, { id:SITE.id, to, name:SITE.name + ' — تجربة' }, 'المكانُ والاسمُ بعد إعادة فتح التطبيق', 8000);
}

console.log('\n══ ٥ · المشرفُ يصحّح بيانات المخيم الجديد (المربع والشاخص) — يراها المالك ══');
if (NEW){
  const ok = await D.sup.page.evaluate(id => { if (!maySiteEditBasic()) return 'perm'; const x = siteFind(id); if (!x) return 'gone'; x.sq = '78'; siteOvSet(id, { sq:'78', edBy:STATE.meta.name, edAt:Date.now() }); x.sign = '12/4'; siteOvSet(id, { sign:'12/4', edBy:STATE.meta.name, edAt:Date.now() }); return STATE.queue.filter(q => q.kind === 'sites' && q.id === id).length === 1 && STATE.queue.some(q => q.kind === 'sites' && q.id === id && q.v.sq === '78' && q.v.sign === '12/4') ? 'ok' : 'queue:' + JSON.stringify(STATE.queue.filter(q => q.kind === 'sites').map(q => q.v)); }, NEW.id);
  T(ok === 'ok', 'المشرف عدّل المربع ثم الشاخص كتابتين متتاليتين — في الطابور كتابةٌ واحدةٌ تحمل الاثنين (' + ok + ')');
  await uploaded(D.sup, 'تعديل المربع والشاخص');
  await seen(D.admin, id => { const x = siteFind(id); return !!x && x.sq === '78' && x.sign === '12/4'; }, NEW.id, 'المربعَ 78 والشاخصَ 12/4 على المخيم الجديد');
}

console.log('\n══ ٦ · المالكُ يحذف المخيمَ المكرَّر نهائيًّا — يختفي عند المهندس والمشرف ══');
if (NEW){
  const del = await D.admin.page.evaluate(id => { SITE_DEL = id; const r = siteDeleteFinal(id); return { r:!!r, gone:!siteFind(id) }; }, NEW.id);
  T(del.r && del.gone, 'المالك حذف ' + NEW.id + ' نهائيًّا');
  await uploaded(D.admin, 'الحذف النهائي');
  for (const d of others(D.admin)) await seen(d, id => !siteFind(id), NEW.id, 'المخيم ' + NEW.id + ' اختفى');
  await restart(D.sup);
  await seen(D.sup, id => !siteFind(id) && !(STATE.newsites[id] && STATE.newsites[id].deleted !== true), NEW.id, 'ولا يعود بعد إعادة فتح تطبيق المشرف (الشاهد)', 8000);
}

console.log('\n══ ٧ · المشرفُ يسجّل زيارةً — تصل المالكَ والمهندس ══');
const VS = await D.sup.page.evaluate(() => {
  const x = STATE.sites.find(y => y.type === 'مخيم' && !y.isNew && !STATE.recs[y.id] && +y.lat); if (!x) return null;
  const rec = { site:x.id, status:'تمت الزيارة', by:STATE.meta.name || '', at:Date.now(), zone:x.zone, type:x.type, note:'زيارة تجربة', quick:0 };
  STATE.recs[x.id] = rec; CORE.set('recs', x.id, rec); return x.id;
});
T(!!VS, 'المشرف سجّل زيارةً على ' + VS);
if (VS){ await uploaded(D.sup, 'الزيارة'); for (const d of others(D.sup)) await seen(d, id => !!(STATE.recs || {})[id], VS, 'زيارةَ ' + VS); }

console.log('\n══ ٨ · المالكُ يُسنِد زيارةً للفني — تصله حيًّا، فيسجّلها، فتصل المكتبَ كلَّه ══');
const TK = await D.admin.page.evaluate(to => {
  const x = STATE.sites.find(y => y.type === 'مخيم' && !y.isNew && !STATE.recs[y.id] && +y.lat && !asnOf(y.id)); if (!x) return null;
  const tid = 'TK-survey-' + x.id;
  CORE.set('tasks', tid, { id:tid, no:reqNext('survey', 'tasks', tid), site:x.id, kind:'survey', to:to, assignedTo:to, status:'مطلوب', when:'', by:STATE.meta.name || '', at:Date.now() });
  return { tid:tid, site:x.id };
}, ACC.tech.name);
T(!!TK, 'المالك أسند زيارة ' + (TK && TK.site) + ' للفني');
if (TK){
  await uploaded(D.admin, 'الإسناد');
  await seen(D.tech, id => !!(STATE.tasks || {})[id], TK.tid, 'المهمةَ المسندةَ إليه (حيًّا)');
  await seen(D.eng, id => !!(STATE.tasks || {})[id], TK.tid, 'إسنادَ المالك للفني');
  const v = await D.tech.page.evaluate(id => { if (!may('edit')) return 'perm'; const rec = { site:id, status:'تمت الزيارة', by:STATE.meta.name || '', at:Date.now(), note:'زيارة الفني', quick:0 }; STATE.recs[id] = rec; CORE.set('recs', id, rec); return 'ok'; }, TK.site);
  T(v === 'ok', 'الفني سجّل الزيارة (' + v + ')');
  await uploaded(D.tech, 'زيارة الفني');
  for (const d of ALL) await seen(d, id => !!(STATE.recs || {})[id] && STATE.recs[id].note === 'زيارة الفني', TK.site, 'زيارةَ الفني على ' + TK.site);
}

console.log('\n══ ٩ · الفنيُّ لا يحرّك حساسًا — الصلاحيةُ للمشرف فما فوق ══');
{ const r = await D.tech.page.evaluate(id => { if (typeof iotLoad === 'function') iotLoad(); return new Promise(res => setTimeout(() => { const c = iotOf(id); if (!c) return res('noplan'); const S = mvdState(); S.id = id; res(mvdSet({ k:'s', i:1, key:'s1', lab:'x', at:c.sensors[1].slice() }, c.sensors[1][0] + 0.001, c.sensors[1][1]) ? 'moved' : 'refused'); }, 4000)); }, CAMP);
  T(r === 'refused', 'الفني حاول تحريك حساس فرُفض محليًّا (' + r + ')');
  await sleep(3000);
  await seen(D.admin, a => { const c = iotOf(a.id); return !!c && Math.abs(c.sensors[1][0] - a.orig) < 1e-6; }, { id:CAMP, orig:(await D.admin.page.evaluate(id => iotOf(id).sensors[1][0], CAMP)) }, 'الحساسُ الثاني في مكانه لم يتحرك', 3000);
}

console.log('\n══ ١٠ · المهندسُ يضيف شركة — تظهر في قائمة المشرف والمالك ══');
{ const CO = 'شركة التجربة للخدمات';
  const r = await D.eng.page.evaluate(n => coAddDirect(n) ? 'ok' : 'no', CO);
  T(r === 'ok', 'المهندس أضاف «' + CO + '»');
  await uploaded(D.eng, 'الشركة');
  for (const d of [D.sup, D.admin]) await seen(d, n => (STATE.coreqs || {})[n] && STATE.coreqs[n].status === 'معتمد' && (typeof loadCoList !== 'function' || true) && (CO_LIST.indexOf(n) > -1 || (typeof coListRefresh === 'function' && (coListRefresh(), CO_LIST.indexOf(n) > -1))), CO, 'الشركةَ في قائمة الشركات');
}

console.log('\n══ ١١ · المهندسُ يرسم حدودَ مخيم — يراها المالكُ والمشرف ══');
{ const r = await D.eng.page.evaluate(() => {
    const x = STATE.sites.find(y => y.type === 'مخيم' && !y.isNew && +y.lat && !y.poly && !STATE.inss[y.id]); if (!x) return null;
    const a = +x.lat, b = +x.lng, d = 0.00025;
    ROUTE.pts = [[a - d, b - d], [a - d, b + d], [a + d, b + d], [a + d, b - d]];
    const ok = areaCampSave(); ROUTE.pts = [];
    return ok === false ? null : { id:x.id };
  });
  T(!!r, 'المهندس رسم حدود ' + (r && r.id));
  if (r){ await uploaded(D.eng, 'الحدود'); for (const d of [D.admin, D.sup]) await seen(d, id => { const x = siteFind(id); return !!x && Array.isArray(x.poly) && x.poly.length === 8; }, r.id, 'حدودَ ' + r.id + ' (٤ رؤوس)'); }
}

console.log('\n══ ١٢ · المالكُ يُخفي نقطةً ثم يستعيدها — تختفي وتعود عند المهندس والمشرف ══');
{ const id = await D.admin.page.evaluate(() => { const x = STATE.sites.find(y => !y.isNew && !STATE.recs[y.id] && !STATE.inss[y.id] && +y.lat && y.type !== 'مخيم'); return x ? x.id : null; });
  T(!!id, 'نقطةٌ للإخفاء: ' + id);
  if (id){
    const h = await D.admin.page.evaluate(id => siteHide(id) !== false && !siteFind(id), id); T(h, 'المالك أخفى ' + id);
    await uploaded(D.admin, 'الإخفاء');
    for (const d of [D.eng, D.sup]) await seen(d, id => !siteFind(id), id, id + ' اختفت');
    const rs = await D.admin.page.evaluate(id => siteRestore(id) !== false && !!siteFind(id), id); T(rs, 'المالك استعاد ' + id);
    await uploaded(D.admin, 'الاستعادة');
    for (const d of [D.eng, D.sup]) await seen(d, id => !!siteFind(id), id, id + ' عادت');
  }
}

console.log('\n══ ١٣ · الفنيُّ يرى ما حرّكه المالكُ على الخريطة ══');
if (SITE) await seen(D.tech, a => { const x = siteFind(a.id); return !!x && Math.abs(+x.lat - a.lat) < 1e-6; }, { id:SITE.id, lat:SITE.lat + 0.00040 }, 'النقطة ' + SITE.id + ' في مكانها الجديد');
await seen(D.tech, a => { const c = iotOf(a.id); return !!c && Math.abs(c.sensors[0][0] - a.to[0]) < 1e-6; }, { id:CAMP, to:MV.to }, 'الحساس الذي حرّكه المهندس');

console.log('\n══ ١٤ · لا أخطاءَ في أيِّ جهاز ══');
for (const d of EVERY){ const e = d.errs.filter(s => !/ResizeObserver|favicon/.test(s)); T(e.length === 0, d.tag + ': بلا أخطاء جافاسكربت' + (e.length ? ' — ' + e.slice(0, 3).join(' | ').slice(0, 400) : '')); }
for (const d of EVERY){ try { await d.page.screenshot({ path:join(OUT, 'multi-' + d.key + '.png') }); } catch (e){} }
await browser.close(); srv.close();
console.log('\n' + (bad ? '✗ ' + bad + ' فحصًا ساقطًا' : '✓ أربعةُ أجهزةٍ — أربعةُ أدوار: كلُّ ما كتبه دورٌ رآه من يجب أن يراه'));
process.exit(bad ? 1 : 0);
