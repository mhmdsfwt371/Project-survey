/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدخول — node scripts/audit-login.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان الهيكلُ يظهر أوّلًا ثم يُحاوَل الدخول، والدورُ الافتراضيُّ مهندسًا —
   فمن فتح الرابطَ وضغط «دخول» بحقلين فارغين دخل مهندسًا كاملَ الصلاحية بلا
   اسمٍ ولا كلمة. وهذا ما وقع حين أُرسل الرابطُ لغيرِ أهله. صار الهيكلُ لا
   يظهر إلا بعد أن تُثبِت المصادقةُ الهوية؛ وكلمةٌ خاطئةٌ تُبقي على شاشة
   الدخول؛ وبلا شبكةٍ لا يُفتَح إلا لمن دخل من قبل على هذا الجهاز. ومعه
   إصلاحُ انفجارٍ بعد الدخول التلقائيِّ كان يُعطّل الإنصاتَ والدفعَ الآليّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
async function fresh(){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 900));
  return { w, d };
}
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const inApp=(d)=>!d.getElementById('login') && d.getElementById('app').style.display!=='none';
/* ١ · حقلان فارغان — لا دخول */
{ const {w,d}=await fresh();
  T(!!d.getElementById('login') && w.ROLE!=='engineer', 'قبل الدخول: شاشةُ الدخول والدورُ ليس مهندسًا', 'ROLE='+w.ROLE);
  const toasts=[]; w.toast=m=>toasts.push(String(m));
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(200);
  T(!inApp(d) && toasts.some(m=>/اكتب اسمَ المستخدم/.test(m)), 'حقلان فارغان: لا دخولَ ويُقال', toasts.join(' | ').slice(0,60)); }
/* ٢ · كلمةٌ خاطئة — يبقى على الدخول */
{ const {w,d}=await fresh();
  w.FB.signIn=()=>Promise.resolve({ ok:false, err:'auth/wrong-password' });
  const toasts=[]; w.toast=m=>toasts.push(String(m));
  d.getElementById('lgU').value='m.x'; d.getElementById('lgP').value='wrongpass1';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(200);
  T(!inApp(d) && toasts.some(m=>/تعذّر الدخول/.test(m)), 'كلمةٌ خاطئة: يبقى على شاشة الدخول ويُقال');
  T(!d.getElementById('lgGo').disabled, 'والزرُّ يعود متاحًا للمحاولة'); }
/* ٣ · بلا شبكةٍ وبلا جلسةٍ محفوظة — لا دخول */
{ const {w,d}=await fresh();
  w.FB.signIn=()=>Promise.resolve({ ok:false, err:'offline' }); w.FB.auth={ currentUser:null };
  const toasts=[]; w.toast=m=>toasts.push(String(m));
  d.getElementById('lgU').value='m.x'; d.getElementById('lgP').value='somepass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(200);
  T(!inApp(d) && toasts.some(m=>/الدخولُ الأوّلُ يحتاج شبكة/.test(m)), 'بلا شبكةٍ وبلا جلسة: لا دخول'); }
/* ٤ · بلا شبكةٍ وجلسةٌ محفوظةٌ للاسم نفسِه — يدخل */
{ const {w,d}=await fresh();
  w.FB.signIn=()=>Promise.resolve({ ok:false, err:'offline' }); w.FB.auth={ currentUser:{ email:'m.x@nusuk.local' } };
  w.FB.legacyDone=()=>true; w.pullDelta=()=>Promise.resolve(0);
  d.getElementById('lgU').value='m.x'; d.getElementById('lgP').value='somepass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(300);
  T(inApp(d), 'بلا شبكةٍ وبجلسةٍ محفوظةٍ للاسم نفسِه: يدخل'); }
/* ٥ · جلسةٌ محفوظةٌ لاسمٍ آخر — لا */
{ const {w,d}=await fresh();
  w.FB.signIn=()=>Promise.resolve({ ok:false, err:'offline' }); w.FB.auth={ currentUser:{ email:'someone.else@nusuk.local' } };
  d.getElementById('lgU').value='m.x'; d.getElementById('lgP').value='somepass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(200);
  T(!inApp(d), 'وجلسةٌ لاسمٍ آخر لا تفتح لغيره'); }
/* ٦ · الدخولُ الصحيح — يدخل بدوره ويُنصِت */
{ const {w,d}=await fresh();
  w.FB.signIn=()=>Promise.resolve({ ok:true, role:'supervisor', name:'مشرف' });
  w.FB.legacyDone=()=>true; w.pullDelta=()=>Promise.resolve(0);
  let listened=0; w.liveWatch=()=>{ listened++; }; w.liveSmall=()=>{ listened++; };
  d.getElementById('lgU').value='sup.a'; d.getElementById('lgP').value='rightpass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(2600);
  T(inApp(d) && w.ROLE==='supervisor', 'الدخولُ الصحيح: يدخل بدوره', 'ROLE='+w.ROLE);
  T(listened>=2, 'ويبدأ الإنصاتُ بعده', listened+' نداء'); }
/* ٧ · لا نداءَ على CORE لدالتَي FB */
T(!/CORE\.legacyDone|CORE\.pullLegacy/.test(html), 'الدالتان تُنادَيان على FB لا CORE — لا انفجارَ بعد الدخول التلقائيّ');
/* ٨ · زرُّ الدفع في نافذة الطابور على الخريطة */
{ const {w,d}=await fresh();
  const lg=d.getElementById('lgGo'); w.FB.signIn=()=>Promise.resolve({ok:true,role:'engineer',name:'م'}); w.FB.legacyDone=()=>true; w.pullDelta=()=>Promise.resolve(0);
  d.getElementById('lgU').value='e'; d.getElementById('lgP').value='rightpass12'; lg.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(2600);
  w.STATE.meta.online=true; w.STATE.queue=[{kind:'stats',id:'x',v:{n:1}}]; w.QUEUE_OPEN=true; w.CUR='map'; w.render(1);
  const has=!!d.querySelector('[data-pushnow]');
  T(has, 'نافذةُ «بانتظار الرفع» فيها «↑ ادفع الآن»'); }
console.log(bad?'\nجردُ الدخول فشل ✗ ('+bad+')':'\nلا دخولَ بلا هويةٍ مُثبَتة ✅');
process.exit(bad?1:0);
