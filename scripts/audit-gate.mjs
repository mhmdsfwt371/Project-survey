/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سلسلة الشروط — node scripts/audit-gate.mjs
   ───────────────────────────────────────────────────────────────────────────
   الرفضُ كان جملةً واحدةً: «لا حلَّ معتمدًا» أو «لا يجوز». والجملةُ صحيحةٌ
   ولا تكفي: من يسمعها لا يعرف أينَ هو من السلسلة، ولا ما الخطوةُ التي
   تسبقها، ولا كم بقي حتى يصل. فصارت لكلِّ نوعٍ سلسلتُه معروضةً كاملةً — ما
   تمَّ بعلامته، وأوّلُ ما ينقص بسببه وزرِّ الذهاب إليه، وما بعده رماديًّا —
   في لوح الإسناد قبل الضغط، وفي رسالة الرفض بعده، **بالنصِّ نفسِه**.
   وكان الفحصُ للتركيب وحده: الفكُّ والصيانةُ يمرّان بلا شرطٍ في المسار
   الفردي. صار الفحصُ بالسلسلة نفسِها لكلِّ نوعٍ وفي المسارين.
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
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
const S=w.STATE.sites, it=w.itemsList()[0], x=S[0];
/* ١ · الزيارةُ بلا شرط */
T(w.gateChain('visit',x).length===0 && !w.gateFirst('visit',x), 'الزيارةُ بلا شرطٍ — تُسنَد مباشرةً');
/* ٢ · السلسلةُ تطول مع النوع */
T(w.gateChain('install',x).length===3 && w.gateChain('maint',x).length===5 && w.gateChain('dis',x).length===6,
  'السلسلةُ تطول: تركيبٌ ٣ · صيانةٌ ٥ · فكٌّ ٦');
/* ٣ · أوّلُ ما ينقص هو الأوّلُ في السلسلة */
let g=w.gateFirst('dis',x);
T(g && g.t==='زيارةُ مسحٍ محفوظة', 'أوّلُ ما ينقص للفكّ: الزيارة', g&&g.t);
/* ٤ · كلَّما أُنجزت خطوةٌ تقدَّم المؤشِّر */
w.STATE.recs[x.id]={id:x.id,access:'تم الوصول',review:'pending',at:Date.now(),by:'ف',photos:[]}; w.statBump();
T(w.gateFirst('dis',x).t==='اعتمادُ الزيارة', 'بعد الزيارة: الاعتماد');
w.svApprove(x.id);
T(w.gateFirst('dis',x).t==='حلٌّ معتمدٌ بالقطع', 'وبعده: الحل');
w.solutionSave(x.id,{[it.code]:1}); (w.solutionAppr||function(){})(x.id,true);
T(w.gateFirst('dis',x).t==='تركيبٌ مسجَّل', 'وبعده: التركيب');
w.STATE.inss[x.id]=Object.assign({},w.STATE.inss[x.id],{status:'مُركّب',by:'ف',parts:{[it.code]:1},serials:{},at:Date.now()});
w.statBump();
T(w.gateFirst('dis',x).t==='اعتمادُ التركيب', 'وبعده: اعتماد التركيب');
w.STATE.inss[x.id].approved=true; w.statBump();
T(w.gateFirst('dis',x).t==='تسليمٌ بمحضر', 'وبعده: التسليم');
w.handSave(x.id,'الوزارة','');
T(!w.gateFirst('dis',x), 'وبعد التسليم: الطريقُ مفتوحٌ للفك');
/* ٥ · إسنادٌ مفتوحٌ من النوع نفسِه يُغلِق */
w.STATE.tasks['TK-dis-'+x.id]={id:'TK-dis-'+x.id,no:'UR-9',site:x.id,kind:'dis',to:'فريق',status:'مطلوب',at:Date.now()};
w.statBump();
g=w.gateFirst('dis',x);
T(g && /مُسنَدًا/.test(g.t), 'وإسنادٌ مفتوحٌ من نوعه يُغلِق الطريق', g&&g.why);
delete w.STATE.tasks['TK-dis-'+x.id]; w.statBump();
/* ٦ · البطاقةُ تُرسَم في اللوح لنقطةٍ واحدة */
const y=S[1];
w.SEL={}; w.SEL[y.id]=1; w.SEL_N=1; w.ASN_KIND='dis'; w.ASN_OPEN=true; w.CUR='map'; w.render(1);
const h=d.getElementById('content').textContent+(d.body.textContent||'');
T(h.indexOf('ما يسبق هذه الخطوة')>-1, 'بطاقةُ السلسلة في لوح الإسناد');
T(h.indexOf('ابدأ هنا')>-1, 'وفيها «ابدأ هنا» على أوّل ناقص');
/* ٧ · الرفضُ يقول الخطوةَ لا «لا يجوز» */
const toasts=[]; const old=w.toast; w.toast=m=>{ toasts.push(String(m)); return old&&old(m); };
w.ASN_MODE='tech'; w.STATE.users={U1:{name:'فني أ',role:'tech',active:true,at:1}};
w.ASN_TO='فني أ'; w.statBush=0;
const kE=d.getElementById('asnKind'); if(kE) kE.value='dis';
const tE=d.getElementById('asnTo'); if(tE) tE.value='فني أ';
w.asnCommit();
T(toasts.some(m=>/قبل هذه الخطوة/.test(m)), 'ورسالةُ الرفض تسمّي الخطوةَ الناقصة', toasts.filter(m=>/قبل/.test(m))[0]||toasts.join(' | ').slice(0,80));
console.log(bad?'\nجردُ سلسلة الشروط فشل ✗ ('+bad+')':'\nالطريقُ يُرى قبل الرفض لا بعده ✅');
process.exit(bad?1:0);
