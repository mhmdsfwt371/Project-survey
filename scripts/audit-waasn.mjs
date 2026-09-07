/* ═══════════════════════════════════════════════════════════════════════════
   جردُ واتساب الإسناد — node scripts/audit-waasn.mjs
   ───────────────────────────────────────────────────────────────────────────
   الإشعارُ داخلَ التطبيق لا يراه من لم يفتحه — فإسنادُ التاسعة يُرى في
   الحادية عشرة. والمتصفّحُ لا يُرسِل واتساب وحده: يفتح المحادثةَ والرسالةَ
   جاهزةً ويبقى الإرسالُ ضغطةً. فبعد كلِّ إسنادٍ زرٌّ واحدٌ يفتح واتساب
   الفنيِّ برسالةٍ فيها النقاطُ ونوعُ العمل ورابطُ التطبيق، ويُعلَّم الإسنادُ
   أنه أُبلغ. ومن لا جوالَ له يُقال بلا انفجار.
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
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
w.STATE.users={ U1:{name:'فني أ',role:'tech',active:true,ph:'0501234567'}, U2:{name:'فني ب',role:'tech',active:true} };
w.statBump();
const opened=[]; w.open=(u)=>{ opened.push(u); return {}; };
const S=w.STATE.sites, a=S[0], b=S[1];
/* ١ · الإسنادُ يحفظ آخرَ إسناد */
w.SEL={}; w.SEL[a.id]=1; w.SEL[b.id]=1; w.SEL_N=2; w.ASN_KIND='visit'; w.ASN_MODE='tech'; w.ASN_TO='فني أ';
const kE=d.getElementById('asnKind'); if(kE) kE.value='visit';
w.asnCommit();
T(w.WA_LAST && w.WA_LAST.to==='فني أ' && w.WA_LAST.ids.length===2, 'بعد الإسناد يُحفَظ آخرُ إسنادٍ ليُبلَّغ', w.WA_LAST&&w.WA_LAST.ids.join(','));
/* ٢ · البطاقةُ في سجل الإسنادات */
w.goPage('reqreg'); w.render(1);
const h=d.getElementById('content');
T(!!h.querySelector('[data-waasn]'), 'بطاقةُ «أبلغ فني أ» بزرِّ واتساب');
/* ٣ · النصُّ فيه النقاطُ والنوعُ والرابط */
const txt=w.waAsnText('فني أ','visit',[a.id,b.id],'2026-09-10');
T(txt.indexOf(a.id)>-1 && txt.indexOf(b.id)>-1 && /2026-09-10/.test(txt) && /github\.io/.test(txt), 'الرسالةُ فيها النقطتان والموعدُ والرابط');
/* ٤ · الضغطُ يفتح واتساب ويُعلِّم */
h.querySelector('[data-waasn]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
T(opened.length===1 && /wa\.me|whatsapp/.test(opened[0]) && /966501234567|0501234567/.test(opened[0]), 'يفتح واتساب برقم الفنيّ', (opened[0]||'').slice(0,60));
const tk=w.taskKindOf(a.id,'visit');
T(tk && tk.waAt, 'ويُعلَّم الإسنادُ أنه أُبلغ');
T(w.STATE.queue.some(q=>q.kind==='tasks'&&q.id===tk.id), 'ويُرفَع');
/* ٥ · زرٌّ لكلِّ إسنادٍ في السجل — والمُبلَّغُ بعلامة */
w.render(1);
const btns=[...d.querySelectorAll('#content [data-watask]')];
T(btns.length>=2, 'زرُّ واتساب لكلِّ إسنادٍ في السجل', btns.length+' أزرار');
T(btns.some(b=>b.textContent.indexOf('✓')>-1), 'والمُبلَّغُ معلَّمٌ ✓');
/* ٦ · من لا جوالَ له */
const toasts=[]; const old=w.toast; w.toast=m=>{ toasts.push(String(m)); return old&&old(m); };
const n0=opened.length;
T(w.waAsn('فني ب','visit',[a.id],'')===false && opened.length===n0 && toasts.some(m=>/لا جوالَ/.test(m)), 'من لا جوالَ له يُقال بلا فتح');
console.log(bad?'\nجردُ واتساب الإسناد فشل ✗ ('+bad+')':'\nالفنيُّ يُبلَّغ بضغطةٍ — والمُبلَّغُ معلَّم ✅');
process.exit(bad?1:0);
