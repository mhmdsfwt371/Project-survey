/* ═══════════════════════════════════════════════════════════════════════════
   جردُ محضر الاستلام الرسمي — node scripts/audit-hodoc.mjs
   ───────────────────────────────────────────────────────────────────────────
   المحضرُ الذي يُسلَّم للوزارة نموذجٌ لها لا لنا: ترويسةُ المملكة والوزارة
   والوكالة، ثم المشروعُ والمقاولُ والاستشاري، ثم الأعمالُ بمكانها ورقمها،
   ثم البنودُ بأعدادها وسيرياتها — من سجل التركيب لا من الذاكرة — ثم التعهدُ
   وجدولُ الاعتماد. ولكلِّ نوعٍ نموذجُه: المخيّمُ يُقدَّم لشركته والباقي
   للوزارة، ولكلٍّ عنوانُه وحقلُ موضعه وتعهُّدُه. وأسماءُ المعتمِدين تُضبَط
   مرةً فتُطبَع في كلِّ محضر — كانت تُملأ باليد أو تُترَك فارغةً فيُرَدّ.
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
const S=w.STATE.sites, it=w.itemsList()[0], it2=w.itemsList()[1];
/* نموذجٌ لكلِّ نوع */
const types=['مخيم','ممر','محطة','جسر','بوابة','كاميرا','مبنى'];
T(types.every(k=>w.HO_TPL[k]), 'نموذجٌ لكلِّ نوع', Object.keys(w.HO_TPL).join(' · '));
T(w.HO_TPL['مخيم'].to==='شركة تقديم الخدمة' && w.HO_TPL['ممر'].to==='وزارة الحج والعمرة',
  'المخيّمُ يُقدَّم لشركته والممرُّ للوزارة');
/* محضرٌ حقيقيّ */
const cam=S.filter(x=>x.type==='مخيم')[0];
w.STATE.inss[cam.id]={id:cam.id,status:'مُركّب',approved:true,at:Date.now(),by:'فريق',
  parts:{[it.code]:1,[it2.code]:4}, serials:{[it.code]:'EM82V102604001468'}, qaBy:'مهندس'};
w.statBump(); w.handSave(cam.id,'م. مجدي — الوزارة','بجوار الصندوق مصدر كهرباء');
const html=w.handDocSite(cam.id);
T(html.indexOf('المملكة العربية السعودية')>-1 && html.indexOf('وزارة الحج والعمرة')>-1, 'الترويسةُ الرسمية');
T(html.indexOf('محضر استلام عهدة')>-1, 'وعنوانُ نموذج المخيّم');
T(html.indexOf('آفاقي')>-1 && html.indexOf('شركة علم')>-1, 'والمقاولُ والاستشاري');
T(html.indexOf('EM82V102604001468')>-1, 'والسيريالُ من التركيب لا باليد');
T(html.indexOf('تتعهد الشركة')>-1, 'والتعهُّدُ باسم الشركة');
T(html.indexOf('الاعتماد')>-1 && html.indexOf('مدير البرنامج')>-1, 'وجدولُ الاعتماد بصفاته');
/* الممرّ يختلف */
const cor=S.filter(x=>x.type==='ممر')[0];
if (cor){
  w.STATE.inss[cor.id]={id:cor.id,status:'مُركّب',approved:true,at:Date.now(),by:'ف',parts:{[it.code]:1},serials:{}};
  w.statBump(); w.handSave(cor.id,'الوزارة','');
  const h2=w.handDocSite(cor.id);
  T(h2.indexOf('محضر استلام الممرات')>-1, 'ونموذجُ الممرِّ بعنوانه');
}
/* الضبطُ يُطبَع */
w.hoSetParty('contractor','شركة آفاقي للتقنية');
w.hoSetSigner(0,'n','م. مجدي سرور');
const h3=w.handDocSite(cam.id);
T(h3.indexOf('شركة آفاقي للتقنية')>-1 && h3.indexOf('م. مجدي سرور')>-1, 'وما يُضبَط يُطبَع في المحضر');
T(w.STATE.queue.some(q=>q.kind==='cfg'&&q.id==='hoSigners'), 'ويُرفَع');
/* التصدير */
w.HO_DOC=cam.id;
const rows=w.XLS ? null : null;
const ex=(w.EXPORTS||w.XLS_FNS||{}).hodoc;
w.goPage('hand'); w.render(1);
T(!!d.querySelector('#content [data-xls="hodoc"]'), 'زرُّ إكسل على المحضر');
T(!!d.querySelector('#content [data-print]'), 'وزرُّ PDF');
/* بطاقةُ الضبط */
w.goPage('consts'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('ترويسةُ محضر الاستلام')>-1, 'بطاقةُ الضبط في الثوابت');
T(!!d.querySelector('#content [data-hosn="0"]'), 'وحقولُ المعتمِدين');
/* الحماية */
w.ROLE='tech'; w.STATE.meta.role='tech';
w.hoSetParty('contractor','س');
T(w.hoParty('contractor')==='شركة آفاقي للتقنية', 'الفنيُّ لا يضبط الترويسة');
console.log(bad?'\nجردُ المحضر فشل ✗ ('+bad+')':'\nلكلِّ نوعٍ محضرُه الرسميُّ بأطرافه وتوقيعاته ✅');
process.exit(bad?1:0);
