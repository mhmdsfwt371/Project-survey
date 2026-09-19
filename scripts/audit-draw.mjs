/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الإضافة والرسم (V17.57–V17.60) — node scripts/audit-draw.mjs
   ───────────────────────────────────────────────────────────────────────────
   يفحص ما طلبه صاحبُ المشروع كما يُستعمَل لا كما كُتب:
     ١ · نقطةُ المكتب: بلا صور، لا تُحتسَب زيارة، ويُفتَح بعدها الإسنادُ لتُجدوَل.
     ٢ · نقطةُ الميدان: الصورةُ إلزامية، والإضافةُ زيارةٌ بانتظار الاعتماد،
         ولا تُعتمَد قبل استكمال مسحها.
     ٣ · المسار: المسافةُ بيد الراسم من خمسة أمتار، والكتابةُ لا تهدم اللوح،
         والنقاطُ تُسحَب قبل الحفظ وتُحفَظ حيث وُضعت.
     ٤ · المساحة: المخيمُ بحدوده بلا نقاط، يُربَط بالمسجَّل ولا يُكرَّر.
     ٥ · الأنواع: الجيت واي نجمةٌ والحساسُ قطرة، والسجلُّ السحابيُّ يُطبَّع،
         والأسطورةُ تُشتقُّ منه.
     ٦ · القوائمُ بالاسم: «كاميرات قراءة اللوحات» لا المفتاح ولا الاسمُ القديم.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

let pass = 0; const fails = [];
const T = (cond, msg) => { if (cond){ pass++; console.log('  \u2713 ' + msg); } else { fails.push(msg); console.log('  \u2717 ' + msg); } };

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const raw = readFileSync('index.html', 'utf8');
const dom = new JSDOM(raw, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
/* بديلٌ أمينٌ لـCORE.set: يكتب في الحالة كما يفعل الأصلُ ويُبطِل فهرسَ المهامّ،
   ويسجّل ما كُتب — فيُقاس السلوكُ على ما يصل القاعدةَ فعلًا */
const wrote = [];
w.CORE.set = (k, id, v) => { if (!w.STATE[k]) w.STATE[k] = {}; w.STATE[k][id] = v;
  if (k === 'tasks') w.TK_IX = null; wrote.push({ k, id, v }); return v; };
w.CORE.saveSoon = () => {}; w.evFetch = () => {}; w.photoFlush = () => {};
const toasts = []; const realToast = w.toast;
w.toast = m => { toasts.push(String(m)); };
const lastToast = () => toasts[toasts.length - 1] || '';
const setRole = r => { w.ROLE = r; w.STATE.meta.role = r; };
const freshNS = (o) => { w.NEWSITE = Object.assign({ lat:0, lng:0, zone:'منى', type:'مخيم', sq:'', sign:'',
  co:'', coReq:'', tents:'', reason:'', why:'', note:'', photos:{} }, o || {}); };
const newest = () => w.STATE.sites[w.STATE.sites.length - 1];

console.log('\n══ ١ · نقطةُ المكتب: بلا صور، لا زيارة، ثم جدولة ══');
{
  setRole('engineer');
  T(w.nsOffice() === true, 'المهندسُ مكتبٌ في قاعدة الإضافة');
  freshNS({ lat:21.4201, lng:39.8801, zone:'منى', type:'جيت واي', byMap:true });
  const before = w.STATE.sites.length; wrote.length = 0; toasts.length = 0;
  w.CUR = 'newsite'; w.render(1); await wait(60);
  const form = d.getElementById('content').innerHTML;
  T(form.indexOf('احفظ وجدوِل زيارة') > -1 && form.indexOf('إرسال للاعتماد') < 0, 'النموذجُ يقول للمكتب «احفظ وجدوِل زيارة»');
  w.nsSave(); await wait(60);
  const s = newest();
  T(w.STATE.sites.length === before + 1 && !toasts.some(x => /صورة/.test(x)), 'تُحفَظ بلا صورةٍ واحدة');
  T(s && s.origin === 'office' && s.type === 'جيت واي' && /-GTW-N\d{3}$/.test(s.id), 'بأصلها ورمز نوعها: ' + (s && s.id));
  T(s && /^جيت واي - منى - N\d{3}$/.test(s.name), 'واسمُها بنوعها ومشعرها لا بخانتين فارغتين: ' + (s && s.name));
  T(!w.STATE.recs[s.id] && !wrote.some(x => x.k === 'recs'), 'ولا يُكتَب لها سجلُّ زيارة');
  T(w.lifeOf(s) === 'todo', 'فتبقى «لم تُزر»');
  T(w.CUR === 'map' && w.ASN_OPEN === true && w.selHas(s.id) && w.ASN_KIND === 'visit' && w.FIELD_MODE === 'survey',
    'ويُفتَح لوحُ الإسناد على الخريطة وهي محدَّدةٌ فيه');
  T(w.asnSheet().indexOf('data-sel="' + s.id + '"') > -1, 'واللوحُ يعرضها أوّلًا ولو كانت آخرَ السجل');
  w.ASN_OPEN = false; w.POP_SITE = s.id;
  T(w.popHtml().indexOf('data-visitasn="' + s.id + '"') > -1, 'ونافذتُها تقول «تحتاج جدولةَ زيارة» بزرّها');
  w.visitAsnOpen(s.id);
  T(w.ASN_OPEN === true && w.selHas(s.id), 'والزرُّ يفتح الإسنادَ عليها');
  w.CORE.set('tasks', 'TK-visit-' + s.id, { id:'TK-visit-' + s.id, site:s.id, kind:'visit', to:'فني', status:'مطلوب', at:Date.now() });
  T(w.lifeOf(s) === 'assigned' && w.popHtml().indexOf('data-visitasn') < 0, 'فإذا أُسندت صارت «زيارةٌ مُسندة» وغاب الزرّ');
  w.ASN_OPEN = false; w.selClear();
}

console.log('\n══ ٢ · نقطةُ الميدان: صورةٌ إلزامية والإضافةُ زيارة ══');
{
  setRole('supervisor');
  T(w.nsOffice() === false, 'المشرفُ ميدانٌ في قاعدة الإضافة');
  freshNS({ lat:21.4202, lng:39.8802, zone:'منى', type:'حساس حرارة ورطوبة' });
  const before = w.STATE.sites.length; wrote.length = 0; toasts.length = 0;
  w.nsSave();
  T(w.STATE.sites.length === before && /صورة/.test(lastToast()), 'بلا صورةٍ لا تُحفَظ');
  w.NEWSITE.photos[0] = { size:1024, d:'data:image/jpeg;base64,xx' };
  w.nsSave(); await wait(60);
  const s = newest(), r = w.STATE.recs[s.id];
  T(w.STATE.sites.length === before + 1 && s.origin === 'field' && /-THS-N\d{3}$/.test(s.id), 'وبصورتها تُحفَظ ميدانيّةً: ' + s.id);
  T(!!r && r.src === 'newsite' && r.review === 'pending' && r.access === 'تم الوصول' && r.phN === 1 && r.photos[0] === 'new_0',
    'ويُكتَب لها سجلُّ زيارةٍ بانتظار الاعتماد يحمل صورتَها');
  T(w.svDone(r) && w.lifeOf(s) === 'visited', 'فتُحتسَب زيارةً: «زيارةٌ تمّت — تنتظر الاعتماد»');
  T(w.CUR === 'svForm' || (w.CUR === 'forms' && w.PTAB && w.PTAB.forms === 'svForm'), 'ويُفتَح نموذجُ المسح لاستكمالها');
  w.render(1); await wait(60);
  T(d.getElementById('content').innerHTML.indexOf('سُجِّلت الزيارةُ بإضافة النقطة') > -1, 'والنموذجُ يسمّيها استكمالًا لا تصويبًا');
  setRole('engineer'); toasts.length = 0;
  T(w.svApprove(s.id) === false && /بياناتُ المسح/.test(lastToast()), 'والاعتمادُ يرفضها قبل استكمال المسح');
  r.mount = 'عمود';
  T(w.svApprove(s.id) === true && w.STATE.recs[s.id].review === 'approved', 'ويقبلها بعد الاستكمال');
}

console.log('\n══ ٣ · المسار: المسافةُ بيدك والنقاطُ تُسحَب ══');
{
  setRole('engineer');
  w.goPage('map'); w.render(1); await wait(100);
  w.routeStart('line');
  w.routeAdd(21.35500, 39.98000); w.routeAdd(21.36400, 39.98000);
  w.ROUTE.every = 40; w.ROUTE.zone = 'عرفات'; w.ROUTE.type = 'جيت واي'; w.ROUTE.name = 'مسارُ السحب';
  const g40 = w.routePoints();
  const gaps = []; for (let i = 1; i < g40.length; i++) gaps.push(Math.round(w.geoDist(g40[i-1], g40[i])));
  T(g40.length === 26 && gaps.every(x => Math.abs(x - 40) <= 2), 'كلَّ ٤٠ مترًا على ألف متر: ' + g40.length + ' نقطة');
  w.ROUTE.every = 3;
  const g5 = w.routePoints();
  T(Math.abs(w.geoDist(g5[0], g5[1]) - 5) < 1, 'وأدنى المسافة خمسةُ أمتار: ' + Math.round(w.geoDist(g5[0], g5[1])) + ' م');
  w.ROUTE.every = 40; w.render(1); await wait(60);
  const inp = d.querySelector('[data-rt="every"]');
  T(!!inp && inp.getAttribute('min') === '5' && inp.getAttribute('step') === '1', 'والحقلُ يقبل أيَّ مترٍ من خمسة');
  inp.value = '50';
  inp.dispatchEvent(new w.Event('input', { bubbles:true })); await wait(40);
  T(String(w.ROUTE.every) === '50' && d.contains(inp) && d.getElementById('rtN').textContent === w.nm(w.routePoints().length),
    'والكتابةُ لا تهدم الحقل: يبقى هو هو ويتبدّل العددُ في مكانه (' + d.getElementById('rtN').textContent + ')');
  w.ROUTE.every = 40; w.render(1);
  const src = String(w.mapPaint);
  T(/draggable:true/.test(src) && /dragend/.test(src) && /routeMovePt\(gi/.test(src) && /routeFreeze\(\)/.test(src),
    'والنقاطُ على الخريطة علاماتٌ تُسحَب، والسحبُ يثبّتها ثم يكتب موضعَها');
  w.routeFreeze();
  const moved = [21.35800, 39.98050];
  T(w.routeMovePt(2, moved[0], moved[1]) === true && w.ROUTE.gen[2][0] === moved[0] && w.ROUTE.moved === 1, 'تحريكُ النقطة الثالثة يُحفَظ في المجموعة المثبَّتة');
  toasts.length = 0; const nv = w.ROUTE.pts.length;
  w.routeAdd(21.37, 39.99);
  T(w.ROUTE.pts.length === nv && /مثبَّتة/.test(lastToast()), 'والضغطةُ بعد التحريك لا تضيف رأسًا بالخطأ');
  w.render(1); await wait(60);
  const inp2 = d.querySelector('[data-rt="every"]');
  T(!!d.querySelector('[data-rtregen]') && inp2 && inp2.disabled, 'واللوحُ يعرض «أعد التوليد» ويقفل المسافة');
  wrote.length = 0;
  w.routeSave(); await wait(80);
  const made = wrote.filter(x => x.k === 'newsites');
  const third = made.find(x => /-3$/.test(x.id));
  T(made.length === 26 && !!third && third.v.lat === moved[0] && third.v.lng === moved[1], 'والحفظُ يكتب النقطةَ حيث سُحبت');
  T(made.every(x => x.v.origin === 'office' && x.v.moved === 1 && /-GTW-/.test(x.id)), 'بأصل المكتب ورمز النوع');
  T(w.ASN_OPEN === true && w.SEL_N === 26, 'ثم يُفتَح الإسنادُ عليها كلِّها لتُجدوَل زيارتُها');
  w.ASN_OPEN = false; w.selClear();
  /* إعادةُ التوليد والتراجع */
  w.routeStart('line'); w.routeAdd(21.355, 39.98); w.routeAdd(21.357, 39.98);
  w.routeFreeze(); w.routeUndo();
  T(w.ROUTE.gen === null && w.ROUTE.pts.length === 2, 'التراجعُ بعد التثبيت يُعيد التوليدَ قبل أن يمسّ الرسم');
  w.routeFreeze(); w.routeRegen();
  T(w.ROUTE.gen === null && w.ROUTE.moved === 0, 'و«أعد التوليد» يرجع إلى المسافة');
  /* السقف */
  w.routeStart('line'); w.routeAdd(21.30, 39.90); w.routeAdd(21.40, 39.90); w.ROUTE.every = 5;
  T(w.routePoints().length === w.RT_CAP, 'والعددُ مسقوفٌ فلا يولِّد طريقٌ طويلٌ آلافًا: ' + w.routePoints().length);
  w.routeCancel();
}

console.log('\n══ ٤ · المساحة: المخيمُ بحدوده بلا نقاط ══');
{
  setRole('engineer');
  w.routeStart('area');
  T(w.ROUTE.type === 'مخيم', 'المساحةُ تبدأ مخيمًا');
  const sq = (la, ln, h) => [[la - h, ln - h], [la - h, ln + h], [la + h, ln + h], [la + h, ln - h]];
  /* موضعٌ خالٍ من المخيمات */
  let spot = null;
  for (const c of [[21.250, 39.700], [21.260, 39.720], [21.500, 39.600]]){
    w.ROUTE.pts = sq(c[0], c[1], 0.0004);
    if (!w.areaCampHits().length){ spot = c; break; }
  }
  T(!!spot, 'وُجد موضعٌ خالٍ للاختبار');
  w.ROUTE.sq = '7-14'; w.ROUTE.sign = '57/2'; w.ROUTE.zone = 'منى'; w.ROUTE.name = '';
  w.render(1); await wait(60);
  T(!!d.querySelector('[data-rt="sq"]') && !d.querySelector('[data-rt="every"]'), 'ولوحُها يسأل عن المربع والشاخص لا عن المسافة');
  wrote.length = 0;
  w.routeSave(); await wait(60);
  const ns = wrote.filter(x => x.k === 'newsites');
  const c1 = ns[0] && ns[0].v;
  T(ns.length === 1 && c1.type === 'مخيم' && c1.origin === 'office' && c1.src === 'area', 'تُحفَظ مخيمًا واحدًا لا شبكة');
  T(!!c1 && Array.isArray(c1.poly) && c1.poly.length === 8 && c1.poly.every(v => typeof v === 'number'),
    'وحدودُه أرقامٌ متتالية — القاعدةُ ترفض المصفوفاتِ المتداخلة');
  T(!!c1 && w.polyIn([c1.lat, c1.lng], w.polyOf(c1)) && c1.sq === '7-14' && c1.sign === '57/2', 'ومركزُه داخل حدوده بمربعه وشاخصه');
  const foot = w.campFoot(c1);
  T(!!foot && foot.length === 4 && foot[0][0] === c1.poly[1], 'وحدودُه تُقرأ للرسم [طول، عرض]');
  const f3 = w.m3Points().find(f => f.properties.id === c1.id);
  T(!!f3 && f3.properties.foot === 1, 'والثلاثيُّ يرفعه بحدوده');
  T(w.ASN_OPEN === true && w.selHas(c1.id), 'ثم تُجدوَل زيارتُه');
  w.ASN_OPEN = false; w.selClear();
  /* مخيمٌ مسجَّل */
  const reg = w.STATE.sites.filter(x => x.type === 'مخيم' && !x.isNew && +x.lat && +x.lng);
  let host = null;
  for (const x of reg.slice(0, 60)){
    w.ROUTE.pts = sq(+x.lat, +x.lng, 0.00004);
    if (w.areaCampHits().length === 1){ host = x; break; }
  }
  T(!!host, 'مخيمٌ مسجَّلٌ للاختبار: ' + (host && host.id));
  w.routeStart('area'); w.ROUTE.pts = sq(+host.lat, +host.lng, 0.00004); w.ROUTE.sq = ''; w.ROUTE.sign = '';
  w.render(1); await wait(40);
  T(d.getElementById('mapUI').innerHTML.indexOf(host.id) > -1, 'واللوحُ يسمّي المخيمَ الذي ستُربَط به الحدود');
  wrote.length = 0; const nBefore = w.STATE.sites.length;
  w.routeSave(); await wait(40);
  T(w.STATE.sites.length === nBefore && !wrote.some(x => x.k === 'newsites'), 'الحدودُ حول مخيمٍ مسجَّلٍ لا تُنشئ مكرَّرًا');
  T(wrote.some(x => x.k === 'sites' && x.id === host.id && Array.isArray(x.v.poly)) && Array.isArray(host.poly),
    'بل تُربَط به طبقةً فوق بيانات الوزارة');
  /* مخيمان */
  const two = reg.slice(0, 400);
  let pair = null;
  for (let i = 0; i < two.length && !pair; i++){
    for (let j = i + 1; j < two.length; j++){
      if (Math.abs(two[i].lat - two[j].lat) < 0.0006 && Math.abs(two[i].lng - two[j].lng) < 0.0006){ pair = [two[i], two[j]]; break; }
    }
  }
  if (pair){
    w.routeStart('area');
    const la = (+pair[0].lat + +pair[1].lat) / 2, ln = (+pair[0].lng + +pair[1].lng) / 2;
    w.ROUTE.pts = sq(la, ln, 0.0009);
    wrote.length = 0; toasts.length = 0;
    const r2 = w.areaCampSave();
    T(r2 === false && /مخيماتٍ/.test(lastToast()) && !wrote.length, 'وحدودٌ تضمُّ أكثرَ من مخيمٍ تُرفَض بسببها: ' + lastToast().slice(0, 40));
    w.routeCancel();
  } else T(false, 'لم يُوجَد مخيمان متجاوران للاختبار');
  /* غيرُ المخيم يبقى شبكة */
  w.routeStart('area');
  w.ROUTE.pts = sq(spot[0], spot[1] + 0.01, 0.0013); w.ROUTE.type = 'ممر'; w.ROUTE.every = 50;
  wrote.length = 0;
  w.routeSave(); await wait(60);
  T(wrote.filter(x => x.k === 'newsites').length > 10 && wrote.every(x => x.k !== 'newsites' || x.v.type === 'ممر'),
    'وغيرُ المخيم يبقى شبكةَ نقاط: ' + wrote.filter(x => x.k === 'newsites').length);
  w.ASN_OPEN = false; w.selClear();
}

console.log('\n══ ٥ · الأنواعُ والأشكال ══');
{
  T(w.CAT_DEF['جيت واي'] && w.CAT_DEF['جيت واي'].s === 'star' && w.CAT_DEF['حساس حرارة ورطوبة'] && w.CAT_DEF['حساس حرارة ورطوبة'].s === 'drop',
    'الجيت واي نجمةٌ والحساسُ قطرة');
  const others = Object.keys(w.CAT_DEF_BASE).filter(k => k !== 'جيت واي' && k !== 'حساس حرارة ورطوبة').map(k => w.mapShapeOf(k));
  T(others.indexOf('star') < 0 && others.indexOf('drop') < 0 && w.mapShapeOf('جيت واي') !== w.mapShapeOf('حساس حرارة ورطوبة'),
    'وشكلاهما لا يشاركهما فيه نوعٌ مدمَج');
  const fake = { latLngToContainerPoint:() => ({ x:100, y:100 }), containerPointToLatLng:(p) => p };
  const st = w.shapeRing(fake, 21, 39, 5, 'star'), dr = w.shapeRing(fake, 21, 39, 5, 'drop');
  T(st && st.length === 10 && dr && dr.length === 10 && w.shapeRing(fake, 21, 39, 5, 'circle') === null, 'والشكلان يُرسَمان رؤوسًا بإزاحة البكسل');
  const sq4 = w.shapeRing(fake, 21, 39, 5, 'square');
  T(sq4 && sq4[0][0] === 95 && sq4[2][1] === 105, 'والمربّعُ القديمُ بمقاسه نفسِه');
  /* سجلٌّ سحابيٌّ قديم */
  const keepTypes = w.STATE.types;
  wrote.length = 0;
  w.STATE.types = { 'مخيم':{ l:'مخيمات', i:'x', c:'#3ED598' }, 'LPR':{ l:'قراءة اللوحات', i:'x', c:'#FF6B6B' },
                    'مبنى':{ gone:true }, '_by':'u1', '_at':123 };
  const TL = w.typesList();
  T(!TL._by && !TL._at, 'ختمُ الكتابة لا يُقرأ نوعًا');
  T(!!TL['جيت واي'] && TL['جيت واي'].s === 'star' && !!TL['حساس حرارة ورطوبة'], 'والنوعان المدمَجان يُضافان لسجلٍّ سبقهما');
  T(TL.LPR.l === 'كاميرات قراءة اللوحات', 'والاسمُ الافتراضيُّ القديمُ يُستبدَل بجديده');
  T(!TL['مبنى'] && w.STATE.typesGone['مبنى'] === 1, 'وشاهدُ الحذف يمنع عودةَ المحذوف');
  w.typesSave();
  const wT = wrote.filter(x => x.k === 'cfg' && x.id === 'types').pop();
  T(!!wT && wT.v['مبنى'] && wT.v['مبنى'].gone === true && !wT.v._by, 'والحفظُ يكتب الشاهدَ لأن الكتابةَ دمج');
  w.STATE.types = { 'LPR':{ l:'لوحاتُ البوابة', i:'x', c:'#FF6B6B' } };
  T(w.typesList().LPR.l === 'لوحاتُ البوابة', 'والاسمُ الذي غيّره أحدٌ لا يُمَسّ');
  w.STATE.types = {};
  const T2 = w.typesList();
  const e1 = { tyK:'نوعُ تجربة', tyL:'تجربة', tyI:'', tyC:'#123456', tyS:'drop' };
  for (const k of Object.keys(e1)){ const el = d.createElement('input'); el.id = k; el.value = e1[k]; d.body.appendChild(el); }
  w.typeAdd();
  T(!!T2['نوعُ تجربة'] && w.typeShape('نوعُ تجربة') === 'drop', 'والنوعُ المضافُ يحمل شكلَه');
  w.typeDel('نوعُ تجربة');
  const wD = wrote.filter(x => x.k === 'cfg' && x.id === 'types').pop();
  T(!T2['نوعُ تجربة'] && wD.v['نوعُ تجربة'] && wD.v['نوعُ تجربة'].gone === true, 'وحذفُه يُكتَب شاهدًا');
  for (const k of Object.keys(e1)){ const el = d.getElementById(k); if (el) el.remove(); }
  /* الأسطورة */
  const lg = w.legendRows();
  T(lg.indexOf('lg-svg') > -1 && lg.indexOf('جيت واي') > -1 && lg.indexOf('حساس حرارة ورطوبة') > -1 && lg.indexOf('كاميرات قراءة اللوحات') > -1,
    'الأسطورةُ تُشتقُّ من السجل: فيها النوعان الجديدان وكاميراتُ قراءة اللوحات');
  T(raw.indexOf("t('ممر · كاميرا')") < 0 && (lg.match(/lg-shp/g) || []).length === new Set(Object.keys(w.typesList()).filter(k => k !== 'مخيم').map(k => w.mapShapeOf(k))).size,
    'سطرٌ لكلِّ شكلٍ مستعمَل — لا نصٌّ مكتوبٌ بيد');
  T(/class="lg-row lg-shp sh-star"[^]*?جيت واي/.test(lg) && /class="lg-row lg-shp sh-drop"[^]*?حساس حرارة ورطوبة/.test(lg), 'وكلُّ نوعٍ تحت شكله');
  /* شاشةُ الأنواع: الشكلُ واللونُ لكلِّ نوعٍ قائم */
  const box = d.createElement('div'); box.innerHTML = w.typesCard(); d.body.appendChild(box);
  const sel = box.querySelector('[data-tys="LPR"]');
  T(!!sel && !!box.querySelector('[data-tyc="LPR"]') && !box.querySelector('[data-tys="ممر"]'), 'شاشةُ الأنواع تعدّل الشكلَ واللونَ — والممرُّ معيّنٌ ثابت');
  sel.value = 'triangle';
  sel.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(30);
  T(w.typeShape('LPR') === 'triangle', 'واختيارُ الشكل يُحفَظ للنوع');
  box.remove();
  w.STATE.types = keepTypes && Object.keys(keepTypes).length ? keepTypes : {};
  w.TYPES_NORM = null; w.typesList();
}

console.log('\n══ ٦ · القوائمُ بالاسم والرموز والترجمة ══');
{
  setRole('supervisor');
  freshNS({ lat:21.42, lng:39.88 });
  w.CUR = 'newsite'; w.render(1); await wait(60);
  const opts = [...d.querySelectorAll('[data-ns="type"] option')].map(o => o.textContent.trim());
  T(opts.some(o => o.indexOf('كاميرات قراءة اللوحات') > -1) && !opts.some(o => o.replace(/^\S+\s+/, '') === 'قراءة اللوحات'),
    'قائمةُ نوع الموقع تقول «كاميرات قراءة اللوحات»');
  T(opts.some(o => o.indexOf('جيت واي') > -1) && opts.some(o => o.indexOf('حساسات الحرارة والرطوبة') > -1), 'وفيها الجيت واي والحساس');
  setRole('engineer');
  w.goPage('map'); w.render(1); await wait(60);
  w.routeStart('line'); w.render(1); await wait(40);
  const lpr = d.querySelector('[data-rt="type"] option[value="LPR"]');
  T(!!lpr && lpr.textContent === 'كاميرات قراءة اللوحات', 'وقائمةُ أنواع المسار بالاسم لا بالمفتاح');
  w.routeCancel();
  T(w.typeCode('جيت واي') === 'GTW' && w.typeCode('حساس حرارة ورطوبة') === 'THS' && w.typeCode('LPR') === 'LPR'
    && w.typeCode('نوعٌ جديد') === 'NEW' && w.typeCode('Kiosk-2') === 'KIOS', 'ورمزُ النوع من جدولٍ واحد');
  w.LANG = 'en';
  const en = ['جدوِل زيارة', 'احفظ وجدوِل زيارة', 'أعد التوليد', 'مساحةُ مخيم', 'كاميرات قراءة اللوحات', 'نجمة', 'قطرة', 'تحتاج جدولةَ زيارة'].map(k => w.t(k));
  w.LANG = 'ur';
  const ur = ['جدوِل زيارة', 'أعد التوليد', 'حساسات الحرارة والرطوبة'].map(k => w.t(k));
  w.LANG = 'ar';
  T(en.every(x => !/[\u0600-\u06FF]/.test(x)) && ur.every((x, i) => x !== ['جدوِل زيارة', 'أعد التوليد', 'حساسات الحرارة والرطوبة'][i]),
    'والنصوصُ الجديدةُ مترجمةٌ إنجليزيًّا وأرديًّا: ' + en.slice(0, 3).join(' · '));
}

console.log('\n══ ٧ · مشعرٌ جديدٌ ونوعٌ جديدٌ يظهران حيث تُضاف النقطة (V17.72) ══');
{
  setRole('engineer');
  const before = w.zoneOptions().slice();
  T(before.indexOf('منى') > -1 && before.indexOf('عرفات') > -1 && before.indexOf('مكة') > -1, 'القائمةُ الواحدةُ تحمل الأساسيةَ والمعروفة: ' + before.length);
  w.mxDeclare('جدة', 'مخيم');
  const after = w.zoneOptions();
  T(after.indexOf('جدة') > -1 && after.length === before.length + 1, 'مشعرٌ يُعلَن في مصفوفة الأوزان يظهر في القائمة');
  freshNS({ lat:21.5, lng:39.2, zone:'جدة', type:'مخيم' });
  w.CUR = 'newsite'; w.render(1); await wait(60);
  const zs = [...d.querySelectorAll('[data-ns="zone"] option')].map(o => o.value || o.textContent);
  T(zs.indexOf('جدة') > -1, 'وفي نموذج الموقع الجديد');
  w.goPage('map'); w.render(1); await wait(60); w.routeStart('line'); w.render(1); await wait(40);
  T(!!d.querySelector('[data-rt="zone"] option[value="جدة"]'), 'وفي لوح الرسم');
  w.routeCancel();
  T(w.zoneCode('منى') === 'MIN' && w.zoneCode('مكة') === 'MAK' && /^[A-Z]{3}$/.test(w.zoneCode('جدة')),
    'ورمزُ المعرِّف من دالةٍ واحدة — وللمجهول رمزٌ صالحٌ لا فراغ: ' + w.zoneCode('جدة'));
  freshNS({ lat:21.5, lng:39.2, zone:'جدة', type:'جيت واي' }); w.NEWSITE.photos[0] = { size:10, d:'data:image/jpeg;base64,xx' };
  const nB = w.STATE.sites.length; w.nsSave(); await wait(40);
  const made = newest();
  T(w.STATE.sites.length === nB + 1 && made.zone === 'جدة' && made.id.indexOf('NSK-' + w.zoneCode('جدة') + '-') === 0, 'وتُحفَظ النقطةُ في المشعر الجديد بمعرِّفٍ برمزه: ' + made.id);
  w.ASN_OPEN = false; w.selClear();
  /* نوعٌ جديدٌ من شاشة الأنواع يصل نموذجَ الإضافة والأسطورةَ والخريطة */
  const e1 = { tyK:'عدّاد بشري', tyL:'عدّادات بشرية', tyI:'', tyC:'#00AA88', tyS:'triangle' };
  for (const k of Object.keys(e1)){ const el = d.createElement('input'); el.id = k; el.value = e1[k]; d.body.appendChild(el); }
  w.typeAdd();
  for (const k of Object.keys(e1)){ const el = d.getElementById(k); if (el) el.remove(); }
  freshNS({ lat:21.42, lng:39.88 }); w.CUR = 'newsite'; w.render(1); await wait(60);
  T(!!d.querySelector('[data-ns="type"] option[value="عدّاد بشري"]'), 'النوعُ المضافُ في نموذج الموقع الجديد');
  T(w.legendRows().indexOf('عدّاد بشري') > -1 && w.mapShapeOf('عدّاد بشري') === 'triangle', 'وفي الأسطورة بشكله الذي يُرسَم به');
  w.typeDel('عدّاد بشري');
}

console.log('\n══ ٨ · التجربةُ عُدّةٌ في موضعٍ تنتهي بقرار (V17.73) ══');
{
  setRole('engineer');
  w.goPage('trials'); w.render(1); await wait(80);
  const g = id => d.getElementById(id);
  T(!!g('trGw') && !!g('trSn') && !!g('trWhere') && !!g('trOut') && !!g('trRep'), 'النموذجُ يسأل عن البوابة والحساس والموضع والنتيجة والتقرير');
  g('trN').value = 'تجربةُ اختبار'; g('trGw').value = 'Milesight'; g('trGwN').value = '1'; g('trSn').value = 'EM300'; g('trSnN').value = '4';
  g('trWhere').value = 'مقرُّ الوزارة'; g('trOut').value = 'ناجحة'; g('trRep').value = 'https://drive.google.com/x';
  const nT = w.trialRows().length; w.trialAdd(); await wait(60);
  const r = w.trialRows()[0];
  T(w.trialRows().length === nT + 1 && r.gw === 'Milesight' && r.snN === 4 && r.out === 'ناجحة' && r.where === 'مقرُّ الوزارة', 'وتُحفَظ التجربةُ بعُدّتها وموضعها ونتيجتها');
  const h = d.getElementById('content').innerHTML;
  T(h.indexOf('data-trph="' + r.id + '"') > -1 && h.indexOf('href="https://drive.google.com/x"') > -1, 'وبطاقتُها تحمل زرَّ الصورة ورابطَ التقرير');
  g('trN').value = 'بلا رابط'; g('trRep').value = 'drive.google.com/y';
  toasts.length = 0; w.trialAdd();
  T(/https/.test(lastToast()) && w.trialRows().length === nT + 1, 'ورابطٌ بلا https يُرفَض');
  const qn = w.PHOTO_Q.length;
  w.photoQueue('TRIAL-' + r.id, 'trial', 'data:image/jpeg;base64,xx');
  T(w.PHOTO_Q.length === qn + 1 && w.trialKitHtml(r, true).indexOf('\u{1F4F7} ' + w.nm(1)) > -1, 'وصورةُ التجربة تدخل طابورَ الرفع نفسَه وتُعَدُّ على البطاقة');
  w.PHOTO_Q.pop(); w.trialRows().shift();
}

w.toast = realToast;
console.log('\nأخطاءُ المتصفّح: ' + (errs.length ? errs[0] : 'لا'));
T(errs.length === 0, 'بلا أخطاءِ متصفّح');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('::error title=فحصٌ ساقط::' + f)); try { dom.window.close(); } catch (e){} process.exit(1); }
console.log('جردُ الإضافة والرسم نظيف \u2705');
try { dom.window.close(); } catch (e){}
process.exit(0);
