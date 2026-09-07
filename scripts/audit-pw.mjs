/* ═══════════════════════════════════════════════════════════════════════════
   جردُ كلمة المرور — node scripts/audit-pw.mjs
   ───────────────────────────────────────────────────────────────────────────
   ورقةُ الدخول تُطبَع وتُوزَّع، والخادمُ يكتب أن الكلمةَ مؤقتة — ولم يكن في
   التطبيق مكانٌ لتبديلها: فتبقى الكلمةُ المطبوعةُ هي الكلمةَ طولَ الموسم.
   صارت نافذةٌ تُفرَض عند الدخول إن كانت مؤقتةً (لا تُغلَق حتى تُبدَّل) وتُفتَح
   من القائمة متى شاء صاحبُها؛ والقديمةُ تُطلَب لتُثبَت الهويةُ إلا في
   الدخول الأوّل. وبعد التبديل يُرفَع «لم تعد مؤقتة».
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 900));
/* الدخولُ في الجرد كما يدخل مهندسٌ حقيقيٌّ: كان يُضغَط «دخول» بحقلين فارغين
   فيُفتَح الهيكلُ — وذلك الثغرةُ التي سُدَّت (V15.94)، فصار الجردُ يُثبِت هويةً. */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
w.ROLE='tech'; w.STATE.meta.role='tech'; w.STATE.meta.name='فني'; w.STATE.meta.uid='U1'; w.STATE.meta.online=true;
w.STATE.users={ U1:{ name:'فني', role:'tech', active:true, mustChange:true } };
/* مصادقةٌ صورية */
let setPw='', reauth=0;
w.FB.auth={ currentUser:{ email:'f@nusuk.local', updatePassword:(p)=>{ setPw=p; return Promise.resolve(); },
  reauthenticateWithCredential:()=>{ reauth++; return Promise.resolve(); } } };
w.firebase = w.firebase || {}; w.firebase.auth = w.firebase.auth || {}; w.firebase.auth.EmailAuthProvider = { credential:(e,p)=>({e,p}) };
/* ١ · زرٌّ في القائمة */
T(!!d.getElementById('pwBtn'), 'زرُّ تغيير الكلمة في القائمة الجانبية');
/* ٢ · تُفرَض عند مؤقتة */
T(w.pwNeeded(), 'الكلمةُ المؤقتة تُعرَف من الوثيقة');
w.pwOpen(true); w.render(1);
const pop=d.querySelector('[data-pwgo]');
T(!!pop, 'النافذةُ تُرسَم');
T(!d.querySelector('[data-pwx]'), 'ومفروضةٌ: لا زرَّ إغلاق');
T(!d.getElementById('pw0'), 'ولا تطلب الكلمةَ القديمة في الدخول الأوّل');
/* ٣ · الفحوص */
const set=(id,v)=>{ const e=d.getElementById(id); if(e) e.value=v; };
const toasts=[]; const old=w.toast; w.toast=m=>{ toasts.push(String(m)); return old&&old(m); };
set('pw1','short'); set('pw2','short'); w.pwSave(); await wait(50);
T(toasts.some(m=>/عشرةُ أحرف/.test(m)) && !setPw, 'القصيرةُ تُرفَض');
toasts.length=0; set('pw1','LongEnough12'); set('pw2','Different12'); w.pwSave(); await wait(50);
T(toasts.some(m=>/غير متطابقتين/.test(m)) && !setPw, 'وغيرُ المتطابقتين');
/* ٤ · التبديل */
set('pw1','LongEnough12'); set('pw2','LongEnough12'); w.pwSave(); await wait(100);
T(setPw==='LongEnough12', 'تُبدَّل في المصادقة');
T(reauth===0, 'بلا إعادة إثباتٍ في الدخول الأوّل');
T(w.STATE.users.U1.mustChange===false, 'وتُرفَع «لم تعد مؤقتة»');
T(w.STATE.queue.some(q=>q.kind==='users'&&q.id==='U1'), 'ويُرفَع للقاعدة');
T(!w.PW, 'وتُغلَق النافذة');
/* ٥ · من القائمة: تطلب القديمة وتُثبِت */
w.pwOpen(false); w.render(1);
T(!!d.getElementById('pw0') && !!d.querySelector('[data-pwx]'), 'من القائمة: تطلب القديمةَ ولها إغلاق');
set('pw0','LongEnough12'); set('pw1','NewerPass345'); set('pw2','NewerPass345'); w.pwSave(); await wait(100);
T(reauth===1 && setPw==='NewerPass345', 'وتُثبِت الهويةَ بالقديمة ثم تُبدِّل');
console.log(bad?'\nجردُ كلمة المرور فشل ✗ ('+bad+')':'\nالكلمةُ المؤقتةُ تُبدَّل أوّلَ دخولٍ — ومتى شاء صاحبُها ✅');
process.exit(bad?1:0);
