/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الأدوار المخصَّصة والقدرات النافذة والميدان المُسنَد — node scripts/audit-crole.mjs
   ───────────────────────────────────────────────────────────────────────────
   طُلب: من شاشة الأدوار يُضاف دورٌ ويُحذَف إن خلا، وكلُّ تبديلٍ ينفذ في القاعدة
   فورًا؛ والفنيُّ والمشرفُ يُسنَد إليهما المسحُ ويريان قائمةً بما أُسند
   إليهما، والفنيُّ خريطتَه بالمُسنَد والمشرفُ الخريطةَ كلَّها.
   فهذا يقرأ القاعدةَ (الأدوارُ المخصَّصةُ تُعامَل بأساسها ورتبتها وخانتها)
   ويشغّل الشاشةَ: يضيف دورًا فيظهر في منتقيات الحسابات وبرتبته، ويمنع حذفَه
   وعليه حساب، ويحذفه إن خلا؛ ويبدّل قدرةً فيجد وثيقةَ المصفوفة في الطابور؛
   ويدخل فنيًّا فيرى المُسنَدَ وحده، ومشرفًا فيرى الكلَّ بمفتاح.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
const rules = readFileSync('firestore.rules', 'utf8').replace(/\/\/[^\n]*/g, '');
const prov = readFileSync('scripts/provision.mjs', 'utf8');
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ═══ ساكن ═══ */
T(/function knownRole\(r\)/.test(rules) && /function docRole\(\)/.test(rules) && /customRole\(docRole\(\)\)\.get\('base', 'none'\)/.test(rules), 'القاعدة: الدورُ المخصَّصُ يُعامَل بأساسه');
T(/customRole\(docRole\(\)\)\.get\('rank', rnk\(role\(\)\)\)/.test(rules), 'وبرتبته المكتوبة');
T(/\.get\(col, \{\}\)\.get\(docRole\(\), \{\}\)/.test(rules), 'وخانتُه في المصفوفة بمفتاحه لا بأساسه');
T(/match \/settings\/roles\s*\{ allow read: if ok\(\); allow write: if ok\(\) && myRank\(\) >= 90; \}/.test(rules), 'ووثيقةُ الأدوار يكتبها المهندسُ فما فوق');
T(/settings'\)\.doc\('roles'\)\.get\(\)/.test(prov) && /KNOWN\.add\(k\)/.test(prov), 'الخادمُ يقبل الدورَ المخصَّصَ في المسار المباشر');
T(/function rolesApply\(\)/.test(js) && /function roleAdd\(/.test(js) && /function roleDel\(/.test(js), 'الشاشة: تسجيلٌ وإضافةٌ وحذف');
T(/pmSetDirect\(pk2\[0\], pk2\[1\], p2\[0\]/.test(js), 'تبديلُ القدرة يكتب خانةَ القاعدة');
T(/isCrewRole\(ROLE\)\) \? mineFiltered\(\)/.test(js) && /mineOnly \? mineFiltered\(\) : filtered\(\)/.test(js), 'الخريطةُ والقائمةُ للطاقم بالمُسنَد');
T(/effRole\(ROLE\) === 'supervisor' && !SITES_ALL/.test(js), 'والمشرفُ قائمتُه مُسنَدةٌ بمفتاحٍ يفتح الكلّ');

/* ═══ تشغيل ═══ */
async function boot(role, name){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:role, name:name });
  w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
  w.STATE.meta.uid = 'u-' + role; w.confirm = () => true;
  d.getElementById('lgU').value = role + '.a'; d.getElementById('lgP').value = 'rightpass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(2000);
  w.STATE.meta.name = name;
  return { w, d };
}
{ /* مديرُ المشروع: يضيف دورًا ويحذفه، ويبدّل قدرةً فتنفذ */
  const { w, d } = await boot('admin', 'مدير');
  T(w.ROLE === 'admin' && w.may('roles'), 'دخل مديرَ مشروع');
  w.CFG.roles = { r:{ c_x:{ n:'مندوب اختبار', base:'viewer', rank:20 } } }; w.rolesApply();
  T(w.ROLES.c_x && w.ROLES.c_x.custom && w.ROLES.c_x.base === 'viewer' && w.rankOf('c_x') === 20 && String(w.ROLES.c_x.nav) === String(w.ROLES.viewer.nav), 'دورٌ من الوثيقة يُسجَّل بأساسه ورتبته وشاشاته');
  w.STATE.queue = [];
  d.querySelector('.nav a[data-p="users"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  w.PTAB.users = 'roles'; w.render(1);
  let c = d.getElementById('content');
  T(!!d.getElementById('nrName') && !!c.querySelector('[data-roleadd]'), 'نموذجُ «دور جديد» ظاهر');
  d.getElementById('nrName').value = 'قائد فرقة'; d.getElementById('nrBase').value = 'supervisor'; d.getElementById('nrRank').value = '60';
  c.querySelector('[data-roleadd]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const nk = Object.keys(w.ROLES).find(k => w.ROLES[k].n === 'قائد فرقة');
  T(!!nk && w.ROLES[nk].custom && w.rankOf(nk) === 60 && w.ROLES[nk].can.edit === 1 && !w.ROLES[nk].can.approve, 'يُضاف بأساسه (مشرف) ورتبته ٦٠ ويرث قدراتِه', nk);
  const qr = w.STATE.queue.find(q => q.kind === 'cfg' && q.id === 'roles');
  T(!!qr && qr.v && qr.v.r && qr.v.r[nk] && qr.v.r[nk].base === 'supervisor' && qr.v.r[nk].rank === 60, 'ووثيقةُ settings/roles في الطابور بالشكل الذي تقرؤه القاعدة');
  w.PTAB.users = 'users'; w.render(1); c = d.getElementById('content');
  T([...c.querySelectorAll('select option')].some(o => o.textContent === 'قائد فرقة'), 'ويظهر في منتقي الدور عند إنشاء حساب');
  /* لا يُحذَف وعليه حساب */
  w.STATE.users['u-lead'] = { name:'ليث', user:'l.a', role:nk, active:true };
  w.PTAB.users = 'roles'; w.render(1); c = d.getElementById('content');
  T(!c.querySelector('[data-roledel="' + nk + '"]') && /عليه حسابات/.test(c.textContent), 'لا زرَّ حذفٍ لدورٍ عليه حساب');
  T(w.roleDel(nk) === false && !!w.ROLES[nk], 'ولا يُحذَف ولو نُودي');
  delete w.STATE.users['u-lead']; w.render(1); c = d.getElementById('content');
  const dl = c.querySelector('[data-roledel="' + nk + '"]');
  T(!!dl, 'وبعد خلوّه يظهر زرُّ الحذف');
  w.STATE.queue = [];
  dl.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(!w.ROLES[nk] && w.STATE.queue.some(q => q.kind === 'cfg' && q.id === 'roles' && !(q.v.r || {})[nk]), 'ويُحذَف ويُكتَب في الوثيقة');
  T(!w.roleDel('tech') && !!w.ROLES.tech, 'والأساسيُّ لا يُحذَف');
  /* تبديلُ قدرةٍ لها خانة → المصفوفة */
  w.STATE.queue = []; w.render(1); c = d.getElementById('content');
  const cap = c.querySelector('[data-capt="buyer|money"]');
  T(!!cap, 'خليةُ «المال» للمشتريات في جدول القدرات');
  const before = !!w.ROLES.buyer.can.money;
  cap.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const qp = w.STATE.queue.find(q => q.kind === 'cfg' && q.id === 'perms');
  T(!!qp && qp.v.m.purchases.buyer.r === !before, 'تبديلُها يكتب settings/perms: purchases.buyer.r = ' + !before);
  T(w.STATE.queue.some(q => q.kind === 'cfg' && q.id === 'roleCaps'), 'وroleCaps معها');
  d.getElementById('content').querySelector('[data-capt="buyer|money"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.CFG.perms.m.purchases.buyer.r === before, 'والتبديلُ الثاني يعيدها');
}
{ /* الفنيُّ: قائمةٌ وخريطةٌ بالمُسنَد وحده */
  const { w, d } = await boot('tech', 'فني أ');
  w.STATE.tasks = { 'TK-visit-A':{ id:'TK-visit-A', site:w.STATE.sites[0].id, kind:'visit', to:'فني أ', assignedTo:'فني أ', status:'مطلوب' } };
  w.CUR = 'sites'; w.render(1);
  const c = d.getElementById('content');
  T(/المُسنَد إليّ/.test(c.textContent) && w.mineFiltered().length === 1, 'الفنيُّ: القائمةُ بالمُسنَد وحده', w.mineFiltered().length + ' موقع');
  T(!c.querySelector('[data-sitesall]'), 'وبلا مفتاح «كل المواقع»');
  T(w.layerFiltered().length <= 1, 'وخريطتُه بالمُسنَد وحده', w.layerFiltered().length + '');
  T(w.isFieldRole('tech') && w.isFieldRole('supervisor') && !w.isFieldRole('buyer'), 'ويُسنَد المسحُ للفنيِّ والمشرف لا للمشتريات');
}
{ /* المشرف: القائمةُ مُسنَدةٌ بمفتاحٍ يفتح الكلَّ، والخريطةُ كلُّها */
  const { w, d } = await boot('supervisor', 'مشرف أ');
  w.STATE.tasks = { 'TK-visit-B':{ id:'TK-visit-B', site:w.STATE.sites[1].id, kind:'visit', to:'مشرف أ', assignedTo:'مشرف أ', status:'مطلوب' } };
  w.CUR = 'sites'; w.render(1);
  let c = d.getElementById('content');
  const sw = c.querySelector('[data-sitesall="1"]');
  T(!!sw && /المُسنَد إليّ/.test(c.textContent), 'المشرف: القائمةُ مُسنَدةٌ ومفتاحُ «كل المواقع» ظاهر');
  sw.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.SITES_ALL === true, 'وبضغطته تُفتَح كلُّ المواقع');
  T(w.layerFiltered().length > 100, 'وخريطتُه كلُّها', w.layerFiltered().length + '');
}
console.log(bad ? '\nجردُ الأدوار المخصَّصة فشل ✗ (' + bad + ')' : '\nالدورُ يُضاف ويُحذَف وينفذ، والميدانُ يرى المُسنَد ✅');
process.exit(bad ? 1 : 0);
