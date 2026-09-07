/* ═══════════════════════════════════════════════════════════════════════════
   جردُ طريق اليوم — node scripts/audit-route.mjs
   ───────────────────────────────────────────────────────────────────────────
   كانت المهامُّ قائمةً بترتيب الإسناد، والفنيُّ في منى يمشي بينها كما جاءت.
   صار «طريقُ اليوم»: يُلتقَط موقعُه وتُرتَّب مهامُّه المفتوحةُ من الأقرب ثم
   كلُّ تاليةٍ أقربُ إلى سابقتها، وبجوار كلٍّ مسافتُها وزرُّ اتجاهاتٍ يفتح
   خرائطَ الجهاز — أبل على الآيفون وجوجل على غيره. ويُحرَس: الترتيبُ صحيح،
   والمُعتمَدُ لا يظهر، وغيرُ الميدان لا يرى البطاقة.
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
w.ROLE='tech'; w.STATE.meta.role='tech'; w.STATE.meta.name='فني أ'; w.STATE.meta.uid='UT1';
/* أربعُ نقاطٍ بمواقعَ معلومةٍ حول موقع الفنيّ */
const S=w.STATE.sites;
const P=[[21.4100,39.8700],[21.4130,39.8700],[21.4200,39.8700],[21.4500,39.8700]];
const ids=[];
for (let i=0;i<4;i++){ S[i].lat=P[i][0]; S[i].lng=P[i][1]; ids.push(S[i].id);
  w.STATE.tasks['TK-visit-'+S[i].id]={id:'TK-visit-'+S[i].id,no:'SR-'+i,site:S[i].id,kind:'visit',to:'فني أ',status:'مطلوب',at:Date.now()-i}; }
/* وواحدةٌ معتمدةٌ لا تظهر */
w.STATE.tasks['TK-visit-'+S[5].id]={id:'TK-visit-'+S[5].id,no:'SR-9',site:S[5].id,kind:'visit',to:'فني أ',status:'معتمد',at:Date.now()};
w.statBump();
/* ١ · بلا موقع: بترتيب الإسناد */
w.ROUTE_POS=null; w.goPage('mywork'); w.render(1);
const h0=d.getElementById('content');
T((h0.textContent||'').indexOf('طريقُ اليوم')>-1, 'بطاقةُ الطريق في «مهامي»');
T(h0.querySelectorAll('a[href*="maps"]').length===4, 'ولكلِّ نقطةٍ زرُّ اتجاهات — والمعتمَدةُ لا تظهر', h0.querySelectorAll('a[href*="maps"]').length+' أزرار');
T(!!h0.querySelector('[data-routego]'), 'وزرُّ «من موقعي»');
/* ٢ · من الموقع: الأقربُ أوّلًا */
w.navigator.geolocation={ getCurrentPosition:(ok)=>ok({coords:{latitude:21.4090,longitude:39.8700,accuracy:9}}) };
await w.routeLocate(); await wait(50);
const order=w.routeOrder(w.routeTasks(), w.ROUTE_POS).map(o=>o.site.id);
T(order.join()===ids.join(), 'تُرتَّب من الأقرب: 0.1 · 0.4 · 1.1 · 3.3 كم', order.map(x=>x.slice(-4)).join(' → '));
const ord=w.routeOrder(w.routeTasks(), w.ROUTE_POS);
T(ord[0].d<0.2 && ord[3].d>3, 'والمسافةُ لكلِّ خطوةٍ من سابقتها', ord.map(o=>Math.round(o.d*100)/100).join(' · '));
w.render(1);
const h1=d.getElementById('content').textContent;
T(h1.indexOf('من موقعك')>-1 && h1.indexOf('المجموع')>-1, 'والبطاقةُ تقول من موقعك والمجموع');
/* ٣ · رابطُ الخرائط بحسب الجهاز */
T(/google\.com\/maps/.test(w.mapsUrl(21.4,39.8,'x')), 'الرابطُ جوجل على غير الآيفون');
Object.defineProperty(w.navigator,'userAgent',{ value:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', configurable:true });
T(/maps\.apple\.com/.test(w.mapsUrl(21.4,39.8,'x')), 'وأبل على الآيفون');
/* ٤ · غيرُ الميدان لا يرى */
w.ROLE='acct'; w.STATE.meta.role='acct'; w.goPage('mywork'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('طريقُ اليوم')<0, 'المحاسبُ لا يرى طريقَ اليوم');
/* ٥ · بلا مهامَّ لا بطاقة */
w.ROLE='tech'; w.STATE.meta.role='tech'; w.STATE.meta.name='فني ب'; w.goPage('mywork'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('طريقُ اليوم')<0, 'ومن لا مهامَّ له لا بطاقةَ فارغة');
console.log(bad?'\nجردُ طريق اليوم فشل ✗ ('+bad+')':'\nالأقربُ أوّلًا — وزرُّ اتجاهاتٍ لكلِّ نقطة ✅');
process.exit(bad?1:0);
