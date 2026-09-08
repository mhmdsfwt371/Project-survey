/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الحساب المكرَّر وإعادة إصدار الكلمة — node scripts/audit-dupe.mjs
   ───────────────────────────────────────────────────────────────────────────
   صورةٌ من الميدان: «خالد بندر سعيد» مرتين بالاسم نفسِه — لأن تعديلَ الصفِّ
   المؤقت (ريثما يُنشئه الخادم) كان يكتب وثيقةً في القاعدة باسم المستخدم فتبقى
   بجوار وثيقة المعرِّف. وطُلب: كيف تُغيَّر كلمةُ من نسي كلمتَه؟ فهذا يُثبت:
   تعديلُ المؤقت يذهب إلى الطلب لا إلى وثيقة؛ عند «تمّ» تُمحى الوثيقةُ الشاردة؛
   المكرَّرُ يُكشَف ويُدمَج فتبقى وثيقةُ المعرِّف؛ و«كلمة جديدة» تكتب طلبَ
   إعادة إصدارٍ بكلمةٍ من عشرة أحرف؛ والطاقمُ لا يرى زرَّ الإسناد.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
const prov = readFileSync('scripts/provision.mjs', 'utf8');
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

T(/function uidLike\(k\)/.test(js) && /u\.provisioning && !uidLike\(uid\)/.test(js), 'تعديلُ المؤقت لا يكتب وثيقةً باسم المستخدم');
T(/wasCloud && may\('users'\)\) CORE\.rm\('users', id\)/.test(js), 'وعند «تمّ» تُمحى الوثيقةُ الشاردة من القاعدة');
T(/function usrDupes\(\)/.test(js) && /function usrMerge\(/.test(js) && /data-usrmerge/.test(js), 'المكرَّرُ يُكشَف ويُدمَج');
T(/function usrPwReset\(/.test(js) && /reissue:true/.test(js) && /data-usrpw/.test(js), 'زرُّ كلمةٍ جديدة يكتب طلبَ إعادة إصدار');
T(/auth\.updateUser\(u\.uid, \{ password: pass/.test(prov) && /mustChange: true/.test(prov), 'والخادمُ يضبط الكلمةَ ويفرض تبديلَها أوّلَ دخول');
/* V16.40: الإسنادُ للمشرف فما فوق — لا للطاقم ولا للوزارة */
T(/rankOf\(ROLE\) >= rankOf\('supervisor'\) && !isCrewRole\(ROLE\) \? '<button type=\"button\" class=\"map-chip acc\" data-apick=\"1\">'/.test(js), 'زرُّ الإسناد للمشرف فما فوق — لا للطاقم ولا للوزارة');

async function boot(role, name){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
  w.STATE.meta.uid = 'u-' + role; w.confirm = () => true;
  d.getElementById('lgU').value = role + '.a'; d.getElementById('lgP').value = 'rightpass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(1800);
  w.STATE.meta.name = name;
  return { w, d };
}
{ const { w, d } = await boot('engineer', 'مهندس');
  /* ١ · تعديلُ الصفِّ المؤقت */
  w.STATE.users = { 'k.bandar':{ name:'خالد', user:'k.bandar', role:'cprep', active:true, provisioning:true, at:1 } };
  w.STATE.provision = { 'k.bandar':{ user:'k.bandar', name:'خالد', role:'cprep', pass:'x', status:'pending' } };
  w.STATE.queue = [];
  w.usrSet('k.bandar', { role:'supervisor' });
  T(!w.STATE.queue.some(q => q.kind === 'users'), 'تعديلُ المؤقت لا يقيّد وثيقةَ users باسم المستخدم');
  const pq = w.STATE.queue.find(q => q.kind === 'provision' && q.id === 'k.bandar');
  T(!!pq && pq.v.role === 'supervisor' && pq.v.roleExplicit === true, 'بل يعدّل طلبَ الإنشاء بالدور الجديد صراحةً');
  /* ٢ · المكرَّرُ في القاعدة: وثيقةٌ باسم المستخدم ووثيقةٌ بالمعرِّف */
  w.STATE.users = { 'k.bandar':{ name:'خالد بندر', user:'k.bandar', role:'supervisor', active:true, at:2, sup:'mohamed shokry' },
                    'AbCdEfGhIjKlMnOpQrStUvWx':{ name:'خالد بندر', user:'K.Bandar', role:'cprep', active:true, at:1 } };
  const dup = w.usrDupes();
  T(Object.keys(dup).length === 1 && dup['k.bandar'].length === 2, 'يُكشَف المكرَّرُ بلا حساسيةٍ لحالة الحروف');
  d.querySelector('.nav a[data-p="users"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  w.PTAB.users = 'users'; w.render(1);
  let c = d.getElementById('content');
  T(c.querySelectorAll('[data-usrmerge]').length === 2 && /مكرَّر/.test(c.textContent), 'ويُعلَّم في القائمة بزرِّ دمج');
  w.STATE.queue = [];
  c.querySelector('[data-usrmerge]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(!!w.STATE.users.AbCdEfGhIjKlMnOpQrStUvWx && !w.STATE.users['k.bandar'], 'الدمجُ يُبقي وثيقةَ المعرِّف ويمحو التي باسم المستخدم');
  T(w.STATE.users.AbCdEfGhIjKlMnOpQrStUvWx.sup === 'mohamed shokry', 'وينقل ما نقص (المدير) إلى الباقية');
  T(w.STATE.queue.some(q => q.kind === 'users' && q.id === 'k.bandar' && q.v === null) && w.STATE.queue.some(q => q.kind === 'users' && q.id === 'AbCdEfGhIjKlMnOpQrStUvWx' && q.v), 'ويقيّد حذفَ الشاردة وحفظَ الباقية للسحابة');
  /* ٣ · كلمةٌ جديدة */
  w.STATE.queue = []; w.render(1); c = d.getElementById('content');
  const pwb = c.querySelector('[data-usrpw="AbCdEfGhIjKlMnOpQrStUvWx"]');
  T(!!pwb, 'زرُّ «كلمة جديدة» على الحساب الحقيقي');
  pwb.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const rq = w.STATE.queue.find(q => q.kind === 'provision' && q.id === 'K.Bandar');
  T(!!rq && rq.v.reissue === true && rq.v.status === 'pending' && rq.v.roleExplicit === false && /^[A-Za-z0-9]{10}$/.test(rq.v.pass), 'يكتب طلبَ إعادة إصدارٍ بكلمةٍ من عشرة أحرف بلا تبديل الدور', JSON.stringify(rq && rq.v).slice(0, 100));
  T(!c.querySelector('[data-usrpw="u-engineer"]'), 'ولا زرَّ على حسابه هو');
  /* ٤ · «تمّ» من الخادم يمحو الشاردة */
  w.STATE.users = { 'z.zed':{ name:'زياد', user:'z.zed', role:'tech', active:true, at:1 } };  /* شاردةٌ في القاعدة (بلا provisioning) */
  w.STATE.queue = [];
  w.FB.ready = true; w.FB.db = { collection(){ return { where(){ return this; }, limit(){ return this; }, onSnapshot(){ return () => {}; } }; } };
}
{ /* الطاقم: لا زرَّ إسناد */
  const { w, d } = await boot('tech', 'فني');
  w.CUR = 'map'; w.render(1);
  T(!d.querySelector('[data-apick="1"]'), 'الفنيُّ لا يرى زرَّ الإسناد على الخريطة');
}
{ const { w, d } = await boot('supervisor', 'مشرف');
  w.CUR = 'map'; w.render(1);
  T(!!d.querySelector('[data-apick="1"]'), 'والمشرفُ يراه فيُسنِد لفنيّيه');
}
console.log(bad ? '\nجردُ الحساب المكرَّر فشل ✗ (' + bad + ')' : '\nلا حسابَ يظهر مرتين، والكلمةُ تُعاد من الشاشة ✅');
process.exit(bad ? 1 : 0);
