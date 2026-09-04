/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الجاهز للإسناد — node scripts/audit-asnq.mjs
   ───────────────────────────────────────────────────────────────────────────
   سُئل: «أين طلبُ التركيب وطلبُ الفكّ؟ أمِن الخريطة فقط؟». وكان الجوابُ نعم
   عمليًّا: تُفتَح الخريطةُ وتُبدَّل الطبقةُ وتُحدَّد النقاطُ ثم يُفتَح اللوح —
   فمن أراد إسنادَ فكِّ ما سُلِّم لم يعرف كم هو ولا أين يبدأ. صار في «توزيع
   الفرق» صفٌّ لكلِّ نوع بشرطه وعدده وزرٍّ يحدّد الجاهزَ ويفتح اللوحَ عليه.
   ويتحقّق هذا الجردُ من الشروط نفسِها: التركيبُ لا يُسنَد إلا بحلٍّ معتمد،
   والفكُّ لا يُسنَد إلا لما سُلِّم بمحضر، والصيانةُ لما رُكِّب واعتُمد.
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
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
const S=w.STATE.sites, it=w.itemsList()[0];
/* أ · جاهزٌ للتركيب: زيارةٌ معتمدةٌ وحلٌّ معتمد */
const a=S[0];
w.STATE.recs[a.id]={id:a.id,access:'تم الوصول',review:'approved',at:Date.now(),by:'مشرف',photos:[]};
w.STATE.inss[a.id]={id:a.id,solution:{status:'معتمد',items:{[it.code]:1}},at:Date.now()};
/* ب · جاهزٌ للفكّ: مُركّبةٌ ومعتمدةٌ ومُسلَّمة */
const b=S[1];
w.STATE.inss[b.id]={id:b.id,status:'مُركّب',approved:true,at:Date.now(),by:'فريق',parts:{[it.code]:1},serials:{}};
w.statBump(); w.handSave(b.id,'م. أحمد','');
T(w.asnReadyList('install').some(x=>x.id===a.id), 'التركيبُ: النقطةُ ذاتُ الحلِّ المعتمد جاهزة');
T(w.asnReadyList('dis').some(x=>x.id===b.id), 'الفكُّ: المُسلَّمةُ بمحضرٍ جاهزة');
T(!w.asnReadyList('dis').some(x=>x.id===a.id), 'وما لم يُسلَّم ليس جاهزًا للفك');
T(w.asnReadyList('maint').some(x=>x.id===b.id), 'الصيانةُ: المُركّبةُ المعتمدة جاهزة');
T(w.asnReadyList('visit').length>1000, 'الزيارةُ: ما لم يُزر ('+w.asnReadyList('visit').length+')');
/* الشاشة */
w.goPage('assign'); w.render(1);
const h=d.getElementById('content');
T((h.textContent||'').indexOf('جاهزٌ للإسناد')>-1, 'بطاقةُ «جاهزٌ للإسناد» في توزيع الفرق');
T(d.querySelectorAll('[data-asnq]').length>=3, 'زرُّ إسنادٍ لكلِّ نوعٍ له جاهز ('+d.querySelectorAll('[data-asnq]').length+')');
/* الزرُّ يحدّد ويفتح اللوح */
click('[data-asnq="dis"]');
T(w.SEL_N===1 && w.SEL[b.id], 'زرُّ الفكِّ حدّد النقطةَ الجاهزةَ وحدَها');
T(w.ASN_KIND==='dis' && w.ASN_OPEN===true && w.CUR==='map', 'وفتح لوحَ الإسناد على الفكِّ في الخريطة');
T(w.FIELD_MODE==='dis', 'وبدّل الطبقةَ إلى الفكّ');
T(w.ASN_MODE==='team', 'والفكُّ يُسنَد لفريقٍ لا لفرد');
/* الإنشاءُ فعلًا */
/* اللوحُ مفتوحٌ الآن فالزرُّ ليس في الصفحة — يُغلَق ثم يُعاد إلى التوزيع */
w.ASN_OPEN=false; w.goPage('assign'); w.render(1);
click('[data-asnq="install"]');
T(w.SEL_N===1 && w.SEL[a.id] && w.ASN_KIND==='install', 'وزرُّ التركيب يحدّد نقطتَه');
/* الحماية */
w.ROLE='tech'; w.STATE.meta.role='tech'; w.selClear();
w.asnQuick('install'); T(w.SEL_N===0, 'الفنيُّ لا يُنشئ طلبًا');
console.log(bad?'\nجردُ الجاهز للإسناد فشل ✗ ('+bad+')':'\nلكلِّ نوعِ طلبٍ بابُه من التوزيع ✅');
process.exit(bad?1:0);
