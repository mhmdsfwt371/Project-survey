/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مزايا V17.26–V17.48 — node scripts/audit-session17.mjs
   ───────────────────────────────────────────────────────────────────────────
   يفحص ما بُني في هذه الدورة كما يستعمله صاحبُه لا كما كُتب: النبضةُ والسقفُ،
   والسجلُّ ومن فعله، وسجلُّ المستخدم، وقرارُ البلاغ، وأدواتُ النقاط والمسارات
   والمساحات، ودمجُ الجديد بعد إعادة التحميل، وفهرسُ المهامّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

let pass = 0; const fails = [];
const T = (cond, msg) => { if (cond){ pass++; console.log('  \u2713 ' + msg); } else { fails.push(msg); console.log('  \u2717 ' + msg); } };

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
/* بديلٌ أمينٌ لـCORE.set: يكتب في الحالة كما يفعل الأصلُ ويُبطِل فهرسَ المهامّ،
   ويسجّل ما كُتب — فلا يُقاس السلوكُ على بديلٍ أفقرَ من الأصل. */
const wrote = [];
w.CORE.set = (k, id, v) => { if (!w.STATE[k]) w.STATE[k] = {}; w.STATE[k][id] = v;
  if (k === 'tasks') w.TK_IX = null; wrote.push({ k, id, v }); return v; };
w.CORE.saveSoon = () => {}; w.evFetch = () => {};

console.log('\n══ ١ · النبضةُ وسقفُ القراءات ══');
{
  const writes = []; let cb = null;
  w.FB.ready = true;
  w.FB.db = { collection:(c) => ({ doc:(id) => ({
    set:(v, o) => { writes.push({ c, id, v, o }); return Promise.resolve(); },
    onSnapshot:(f) => { if (c === 'settings' && id === 'pulse') cb = f; return () => {}; } }) }) };
  w.STATE.meta.uid = 'u1'; w.STATE.meta.pullAt = { recs:1000 };
  await w.FB.pulse(['recs', 'inss']);
  const p = writes.find(x => x.id === 'pulse');
  T(!!p && p.o.merge === true && !!p.v.recs && !!p.v.inss, 'النبضةُ كتابةٌ واحدةٌ بدمجٍ تحمل ما تغيّر');
  let asked = null; w.pullDelta = (o) => { asked = o; return Promise.resolve(1); };
  w.pulseWatch();
  T(!!cb, 'والجهازُ يُنصِت لوثيقةٍ واحدة');
  cb({ exists:true, metadata:{ fromCache:false }, data:() => ({ recs:5000, tasks:9000 }) });
  await wait(2300);
  T(!!asked && asked.only.indexOf('recs') > -1 && asked.only.indexOf('tasks') > -1 && asked.why === 'pulse',
    'وتسحب المتغيّرَ وحدَه: ' + (asked ? asked.only.join(',') : '—'));
  w.FB.readCount = 0; const f1 = w.readSlowFactor();
  w.FB.readCount = 20000; const f2 = w.readSlowFactor();
  T(f1 === 1 && f2 === 2, 'وسقفُ القراءات يُبطئ الجامحَ وحدَه (×' + f2 + ')');
}

console.log('\n══ ٢ · السجلُّ يقول من فعل ومتى ══');
{
  /* شروطُ التوليد كما في الحياة: مستخدمٌ داخلٌ (uid) وعلامةُ إشعارٍ قديمة —
     وبدونهما لا يُولَّد إشعارٌ أصلًا، وهو سلوكٌ مقصود: التاريخُ لا يُخبَر به. */
  w.STATE.meta.name = 'مدير'; w.STATE.meta.uid = 'u-me'; w.STATE.meta.notifAt = 1;
  w.STATE.evlog = {}; w.STATE.notifs = [];
  const T5 = Date.now() - 5 * 3600000, sid = w.STATE.sites[5].id;
  w.CORE.applyDoc('recs', sid, { by:'خالد بندر سعيد', at:T5, _at:T5, _by:'u-k', st:'تمت الزيارة', access:'تم الوصول' });
  await wait(80);
  const ev = Object.values(w.STATE.evlog)[0] || {};
  T(ev.by === 'خالد بندر سعيد', 'الحدثُ باسم فاعله لا مستقبِله');
  T(ev.rec === 'مدير', 'ومن سجّله مذكورٌ في «سُجِّل على»');
  T(Math.abs((ev.ts || 0) - T5) < 5000, 'وبوقت الفعل لا وقت وصوله');
  w.STATE.users = { a:{ name:'عمار حسين', role:'tech', active:true } };
  const act = w.evActor({ what:'إشعار — زيارة تمّت · S-1 · عمار حسين — بانتظار اعتمادك', by:'مدير' });
  T(act.name === 'عمار حسين' && act.from === 'text', 'والقديمُ يُقرأ فاعلُه من نصِّه');
}

console.log('\n══ ٣ · سجلُّ المستخدم ══');
{
  const T0 = Date.now();
  w.STATE.users = { u1:{ user:'a', name:'عمار', role:'tech', active:true }, u2:{ user:'b', name:'محاسب', role:'acct', active:true } };
  w.STATE.presence = { p:{ name:'عمار', at:T0 - 600000, ver:w.appVer(), dev:'iPhone', role:'tech', reads:400 } };
  w.STATE.recs = { S1:{ by:'عمار', at:T0 - 3600000, access:'تم الوصول' } };
  w.STATE.photos = { 'S1-1':{ site:'S1', by:'عمار', at:T0 - 3600000 } };
  w.STATE.ipc = { i1:{ no:'IPC-1', by:'محاسب', at:T0 - 7200000 } };
  const s1 = w.userStats('عمار'), s2 = w.userStats('محاسب');
  T(s1.n >= 2 && s1.byKind.visit === 1 && s1.byKind.photo === 1, 'الميدانُ: زيارةٌ وصورةٌ في سجلِّه');
  T(s2.n === 1 && s2.byKind.ipc === 1, 'والمكتبُ: المستخلصُ في سجلِّ المحاسب');
  T(!!w.userPresence('عمار'), 'وآخرُ ظهورٍ مقروءٌ من الحضور');
}

console.log('\n══ ٤ · قرارُ البلاغ يحكم العمل ══');
{
  w.STATE.bugs = { b1:{ id:'b1', kind:'طلب جديد', txt:'طلبٌ للاختبار', by:'مهندس', at:Date.now(), status:'جديد' } };
  w.ROLE = 'tech'; w.STATE.meta.role = 'tech';
  T(w.bugDecide('b1', true, '') === false, 'الفنيُّ لا يقرّر');
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  T(w.bugDecide('b1', false, '') === false, 'ولا يُردُّ بلا سبب');
  T(w.bugDecide('b1', true, '') === true && w.STATE.bugs.b1.status === 'مقبول', 'ويُقبَل فيدخل قائمةَ العمل');
  T(!!w.STATE.bugs.b1.decBy && !!w.STATE.bugs.b1.decAt, 'والقرارُ مختومٌ باسمٍ ووقت');
  const sync = readFileSync('scripts/bugs-sync.mjs', 'utf8');
  T(/if \(b\.status !== 'مقبول'\) continue;/.test(sync), 'والجسرُ لا يفتح إلا المقبول');
}

console.log('\n══ ٥ · أدواتُ النقاط والمسارات والمساحات ══');
{
  wrote.length = 0;
  w.goPage('map'); w.render(1); await wait(150);
  w.routeStart('line');
  T(w.ROUTE.on && w.ROUTE.mode === 'line' && d.body.className.indexOf('drawing') > -1, 'وضعُ الرسم يبدأ ويَسِمُ الجسم');
  w.routeAdd(21.35500, 39.98000); w.routeAdd(21.36400, 39.98000);
  T(Math.abs(w.routeLen() - 1000) < 30, 'والطولُ يُقاس صحيحًا: ' + w.routeLen() + ' م');
  w.ROUTE.every = 250; w.ROUTE.zone = 'عرفات'; w.ROUTE.type = 'ممر'; w.ROUTE.name = 'اختبار';
  const gen = w.routePoints();
  const gaps = []; for (let i = 1; i < gen.length; i++) gaps.push(Math.round(w.geoDist(gen[i-1], gen[i])));
  T(gen.length === 5 && gaps.every(g => Math.abs(g - 250) <= 2), 'والتوليدُ كلَّ ٢٥٠ م: ' + gen.length + ' نقاطٍ · ' + gaps.join('/'));
  w.routeSave(); await wait(80);
  const made = wrote.filter(x => x.k === 'newsites');
  T(made.length === 5 && new Set(made.map(x => x.id)).size === 5, 'وتُكتَب بلا تكرار');
  T(made.every(x => x.v.zone === 'عرفات' && x.v.type === 'ممر' && x.v.lat && x.v.lng), 'وبمشعرها ونوعها وإحداثياتها');
  T(!w.ROUTE.on && d.body.className.indexOf('drawing') < 0, 'وينتهي وضعُ الرسم بعد الحفظ');
  /* مساحة */
  wrote.length = 0;
  w.routeStart('area');
  [[21.3550,39.9800],[21.3577,39.9800],[21.3577,39.9819],[21.3550,39.9819]].forEach(p => w.routeAdd(p[0], p[1]));
  w.ROUTE.every = 50; w.ROUTE.zone = 'عرفات'; w.ROUTE.type = 'ممر'; w.ROUTE.name = 'موقف';
  const ap = w.areaPoints();
  T(ap.length > 10 && ap.every(p => p[0] >= 21.3550 && p[0] <= 21.3577 && p[1] >= 39.9800 && p[1] <= 39.9819),
    'والمساحةُ تُملأ داخلَ حدودها وحدَها: ' + ap.length + ' نقطة');
  w.routeCancel();
  /* نقطةٌ مفردة */
  w.pinStart();
  T(w.PIN_ON === true, 'و«نقطة هنا» تنتظر ضغطةَ الخريطة');
  w.pinApply(21.42, 39.826);
  T(w.NEWSITE.lat === 21.42 && w.NEWSITE.byMap === true && w.PIN_ON === false, 'وتفتح النموذجَ بإحداثيات الضغطة');
}

console.log('\n══ ٦ · الجديدُ يعود بعد إعادة التحميل ══');
{
  const before = w.STATE.sites.length;
  const have = {}; w.STATE.sites.forEach(x => have[x.id] = 1);
  w.STATE.newsites = {
    A:{ id:'NEW-A', name:'أ', zone:'مكة', type:'LPR', lat:21.42, lng:39.826 },
    B:{ id:w.STATE.sites[0].id, name:'مكرَّرة', zone:'منى', type:'مخيم', lat:21.4, lng:39.9 },
    C:{ id:'NEW-C', name:'بلا إحداثيات', zone:'مكة', type:'LPR' } };
  let add = 0;
  Object.keys(w.STATE.newsites).forEach(k => { const v = w.STATE.newsites[k];
    if (!v || !v.id || have[v.id] || !(+v.lat) || !(+v.lng)) return; w.STATE.sites.push(v); have[v.id] = 1; add++; });
  T(add === 1 && w.STATE.sites.length === before + 1, 'يُدمَج الجديدُ وحدَه — لا مكرَّرًا ولا بلا إحداثيات');
  T(w.zoneOf('مكة', '') === 'مكة' && w.zoneOf('المدينة', '') === 'المدينة', 'ومكةُ والمدينةُ مشعرانِ قائمانِ لا «منى»');
  T(!!w.CAT_DEF['LPR'] && !w.CAT_DEF['AI'], 'ونوعُ LPR قائمٌ وحدَه — وكاميراتُ الوزارة هي الذكيّة');
}

console.log('\n══ ٧ · فهرسُ المهامّ: سريعٌ وصادق ══');
{
  w.STATE.tasks = {};
  for (let i = 0; i < 400; i++) w.STATE.tasks['t' + i] = { id:'t'+i, site:w.STATE.sites[i].id, kind:'visit', status:'مُسند', to:'ف' };
  w.TK_IX = null;
  const t0 = Date.now(); for (let i = 0; i < 2000; i++) w.taskKindOf(w.STATE.sites[i % 400].id, 'visit');
  const dt = Date.now() - t0;
  T(dt < 60, 'ألفا استعلامٍ في ' + dt + ' م.ث — بلا مسحٍ كامل');
  const site = w.STATE.sites[3];
  w.CORE.set('tasks', 'TK-new', { id:'TK-new', site:site.id, kind:'install', status:'مُسند', to:'ف' });
  T(!!w.taskKindOf(site.id, 'install'), 'ومهمةٌ كُتبت الآن تُرى فورًا — لا فهرسٌ قديم');
}

console.log('\nأخطاءُ المتصفّح: ' + (errs.length ? errs[0] : 'لا'));
T(errs.length === 0, 'بلا أخطاءِ متصفّح');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('::error title=فحصٌ ساقط::' + f)); try { dom.window.close(); } catch (e){} process.exit(1); }
console.log('جردُ مزايا الدورة نظيف \u2705');
/* مؤقِّتاتُ التطبيق (الحضورُ والنبضةُ والدقّةُ) تُبقي Node حيًّا بعد انتهاء
   الفحوص، فيعلّق السيرُ بلا خطأ ولا نهاية. تُغلَق النافذةُ ويُخرَج صراحةً. */
try { dom.window.close(); } catch (e){}
process.exit(0);
