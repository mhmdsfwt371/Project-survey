/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تسمية الصور — node scripts/audit-photos.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان اسمُ الصورة على الدرايف يحمل النوعَ والوقتَ بالثانية فلا يُقرأ، ولا
   تُعرَف صورةُ نقطةٍ من أختها إلا بفتحها. صار اسمَ النقطة ورقمًا يزيد:
   «-1» ثم «-2» ثم «-3» — فيُفرَز المجلدُ بالاسم فتتجاور صورُ النقطة
   الواحدة مرتَّبةً كما التُقطت. والرقمُ يُحسب مما رُفع فعلًا وما ينتظر في
   الطابور — لا من عدّادٍ في الذاكرة يبدأ من واحدٍ كلَّما أُغلق التطبيق.
   وأُصلح معه: مفتاحُ السجل كان `site_kind` فتكتب الصورةُ الثانيةُ فوق
   الأولى؛ و`STATE.photos` لم تكن مهيَّأةً ولا تُسحَب فيبدأ الترقيمُ من
   واحدٍ في كلِّ جهاز.
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
/* درايف صوريّ يسجّل الأسماء المرفوعة */
const up=[];
w.drvCfg=()=>({ tok:'x' });
w.drvUpload=(name,data)=>{ up.push(name); return Promise.resolve({ id:'F'+up.length, webViewLink:'https://d/'+name }); };
w.STATE.meta.online=true;
const S=w.STATE.sites, A=S[0].id, B=S[1].id;
/* ١ · أوّلُ صورةٍ للنقطة تأخذ الرقم واحد */
w.photoQueue(A,'site','data:,1'); await wait(200);
T(up[0]===A+'-1.jpg', 'أوّلُ صورةٍ باسم النقطة والرقم ١', up[0]);
/* ٢ · الثانيةُ والثالثةُ تزيدان */
w.photoQueue(A,'mount','data:,2'); await wait(300);
w.photoQueue(A,'after','data:,3'); await wait(300);
T(up[1]===A+'-2.jpg' && up[2]===A+'-3.jpg', 'ثم ٢ و٣ — ولو اختلف نوعُها', up.slice(1,3).join(' · '));
/* ٣ · نقطةٌ أخرى تبدأ من واحد */
w.photoQueue(B,'site','data:,4'); await wait(300);
T(up[3]===B+'-1.jpg', 'وكلُّ نقطةٍ ترقيمُها المستقلّ', up[3]);
/* ٤ · السجلُّ لا يكتب بعضُه فوق بعض */
const keys=Object.keys(w.STATE.photos).filter(k=>k.indexOf(A)===0);
T(keys.length===3, 'ثلاثُ وثائقَ للنقطة لا واحدة', keys.join(' · '));
T(w.STATE.photos[A+'-2'].kind==='mount' && w.STATE.photos[A+'-2'].name===A+'-2.jpg', 'ولكلٍّ نوعُها واسمُها');
/* ٥ · بعد إعادة التحميل يكمل الترقيم ولا يبدأ من واحد */
const saved=JSON.parse(JSON.stringify(w.STATE.photos));
w.PHOTO_Q.length=0; w.STATE.photos=saved;
T(w.photoNext(A)===4, 'وبعد إعادة التحميل يكمل من ٤ لا من ١', String(w.photoNext(A)));
/* ٦ · الطابورُ يُحسَب كذلك فلا يتكرّر رقم */
w.PHOTO_Q.push({site:A,kind:'x',data:'d',at:1,tries:0,seq:4});
T(w.photoNext(A)===5, 'وما ينتظر في الطابور يُحسَب أيضًا', String(w.photoNext(A)));
console.log(bad?'\nجردُ تسمية الصور فشل ✗ ('+bad+')':'\nالصورةُ باسم نقطتها ورقمِها ✅');
if (bad) process.exit(1);

/* ═══ الصورةُ تصعد للقاعدة بلا إعدادٍ — والخادمُ ينقلها ═══ */
{
  let b2=0; const T2=(c,n,x)=>{ if(!c) b2++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
  w.drvCfg=()=>false;                   /* لا معرِّفَ عميلٍ على هذا الهاتف */
  w.PHOTO_Q.length=0; w.STATE.queue=[]; w.STATE.meta.online=true; w.STATE.meta.name='فني';
  const site=w.STATE.sites[3].id;
  w.photoQueue(site,'before','data:image/jpeg;base64,AAAA'); await wait(200);
  const q=w.STATE.queue.filter(x=>x.kind==='photos');
  T2(q.length===1 && q[0].v.status==='pending' && q[0].v.data && q[0].v.name===site+'-1.jpg', 'بلا معرِّفِ عميلٍ تصعد الصورةُ للقاعدة بحالة «منتظرة»', q[0]&&q[0].v.name);
  T2(w.PHOTO_Q.length===0, 'ويخلو الطابورُ المحليّ');
  /* الكبيرةُ لا تُدفَع */
  w.photoQueue(site,'after','data:,'+'x'.repeat(950000)); await wait(200);
  T2(w.PHOTO_Q.length===1 && /سقف/.test(w.PHOTO_Q[0].why||''), 'والأكبرُ من سقف الوثيقة يبقى ويُقال سببُه');
  console.log(b2?'\nجردُ الصور فشل ✗ ('+b2+')':'\nالصورةُ تصعد بلا إعدادٍ والخادمُ ينقلها ✅');
  if (b2) process.exit(1);
}
process.exit(0);
