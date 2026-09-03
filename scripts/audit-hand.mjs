/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التسليم ومحاضره — node scripts/audit-hand.mjs
   ───────────────────────────────────────────────────────────────────────────
   «جاهزٌ للتسليم» يعدُّ ما رُكِّب واعتُمد ولم يُسلَّم بعد، و«سُلِّم» يعدُّ ما
   حُرِّر محضرُه — لا صفرًا مكتوبًا. والتسليمُ فعلٌ للمهندس وحده، بمحضرٍ يحمل
   رقمَه وتاريخَه ومن سلَّم ومن استلم، ومنه تبدأ مدةُ الضمان. ولا يُسلَّم ما
   لم يُعتمَد تركيبُه، ولا يُسلَّم مرتين، ولا يُسلَّم ما عليه بلاغٌ جوهريٌّ
   مفتوح. والفكُّ إرجاعُ ما سُلِّم: لا تدخل نقطةٌ طبقةَ الفكِّ قبل محضرها.
   ومحضران: لنقطةٍ بأجهزتها وسيرياتها، ولشركةٍ بكلِّ نقاطها وإجمالي أجهزتها —
   كلاهما بخانتَي توقيعٍ ويُطبَع.
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
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
const click=s2=>{const b=d.querySelector(s2); if(!b) return false; b.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); return true;};
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس التسليم';
const co = w.STATE.sites.filter(x=>x.co)[0].co;
const L = w.STATE.sites.filter(x=>x.co===co).slice(0,3);
const it = w.itemsList()[0];
L.forEach(x=>{ w.STATE.inss[x.id]={ id:x.id, status:'مُركّب', approved:true, at:Date.now(),
  by:'فريق التركيب', parts:{[it.code]:2}, serials:{[it.code]:'SN-'+x.id} }; });
w.statBump();
const a=L[0];
T(w.lifeOf(a)==='installed', 'قبل التسليم: «مُركّبة»');
T(w.LAYERS.dis.pass(a)===false, 'لا تدخل طبقةَ الفكِّ قبل التسليم');
T(w.handReady(a)===true, 'جاهزةٌ للتسليم');
/* التسليم من الشاشة */
w.goPage('hand'); w.render(1);
let h=d.getElementById('content');
T(!!h.querySelector('#hoSite') && !!h.querySelector('#hoTo'), 'نموذجُ التسليم معروض');
d.getElementById('hoSite').value=a.id; d.getElementById('hoTo').value='م. أحمد — الوزارة';
d.getElementById('hoNote').value='سُلِّم بحضور المشرف';
click('[data-hogo]');
const rec=w.handOf(a.id);
T(!!rec && /^HO-\d{4}$/.test(rec.no) && rec.to==='م. أحمد — الوزارة', 'المحضرُ حُرِّر برقمه — '+(rec&&rec.no));
T(w.lifeOf(a)==='handed' && w.mapColorOf(a)===w.LIFE.handed.c, 'الحالةُ «سُلِّمت للعميل» بلونها');
T(w.LAYERS.dis.pass(a)===true, 'وبعد التسليم تدخل طبقةَ الفك');
T(w.handSave(a.id,'x','')===false, 'لا تُسلَّم مرتين');
/* المحضران */
const ds=w.handDocSite(a.id);
T(ds.indexOf(rec.no)>-1 && ds.indexOf('SN-'+a.id)>-1 && ds.indexOf('محضر تسليم نقطة')>-1, 'محضرُ النقطة يحمل رقمه وسيرياته');
T(ds.indexOf('عن العميل')>-1, 'وفيه خانتا التوقيع');
const dc=w.handDocCo(co);
T(dc.indexOf('محضر تسليم شركة')>-1 && dc.indexOf(co)>-1, 'محضرُ الشركة باسمها');
T(dc.indexOf(L[1].id)>-1 && dc.indexOf(L[2].id)>-1, 'وفيه كلُّ نقاطها المُركّبة');
w.render(1); h=d.getElementById('content');
d.getElementById('hoDocCo').value=co; click('[data-hodoc="co"]');
T((d.getElementById('content').textContent||'').indexOf('محضر تسليم شركة')>-1, 'زرُّ محضر الشركة يعرضه');
T(!!d.querySelector('[data-print]'), 'زرُّ الطباعة يظهر مع المحضر');
/* الترقيم يتقدّم ويُرفَع */
w.handSave(L[1].id,'م. سالم','');
T(w.handOf(L[1].id).no==='HO-0002', 'الترقيمُ يتقدّم');
T(w.STATE.queue.some(q=>q.kind==='cfg'&&q.id==='handSeq'), 'وعدّادُ المحاضر يُرفَع');
/* الفنيّ لا يسلّم */
w.ROLE='tech'; w.STATE.meta.role='tech';
T(w.handSave(L[2].id,'x','')===false, 'الفنيُّ لا يُحرِّر محضرًا');
console.log(bad?'\nجردُ التسليم فشل ✗ ('+bad+')':'\nجردُ التسليم ومحاضره نظيف ✅');
process.exit(bad?1:0);
