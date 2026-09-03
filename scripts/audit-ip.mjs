/* ═══════════════════════════════════════════════════════════════════════════
   جردُ العناوين والنافذة — node scripts/audit-ip.mjs
   ───────────────────────────────────────────────────────────────────────────
   نقطةٌ رُكِّبت في موسمٍ ماضٍ عنوانُها مكتوبٌ في جهازها فعلًا — فلا يُخترَع
   لها عنوانٌ يخالف الواقع: تُترَك ليقرأه الفنيُّ من الراوتر ويكتبه في
   «العنوان القائم» بنموذج المسح، فيُحفَظ على النقطة ويُرفَع. والتوليدُ
   للجديدة وحدَها، ولا يتكرّر. والتكرارُ الموروثُ في البيانات يُكشَف في
   الشاشة ولا يُصلَح صامتًا — اختيارُ من يبقى على عنوانه قرارُ مهندس.
   والنافذةُ على الهاتف لوحٌ سفليٌّ بعرض الشاشة، لا مربّعٌ يُوسَّط بحسابٍ
   يُخطئ حين تتّسع حاويتُه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
w.ROLE='engineer';
const reuse = w.STATE.sites.filter(x=>/إعادة تركيب|ترقية|تفعيل/.test(x.work||'') && !x.net);
const fresh = w.STATE.sites.filter(x=>!/إعادة تركيب|ترقية|تفعيل/.test(x.work||'') && !x.net);
T(reuse.length>0 && fresh.length>0, 'العينة: مُركّبةٌ سابقًا '+reuse.length+' · جديدة '+fresh.length);
const r0=reuse[0], f0=fresh[0];
const pre=w.STATE.sites.filter(x=>x.net).map(x=>x.net);
const pd={}; pre.forEach(n=>{pd[n]=(pd[n]||0)+1;});
console.log('   قبل التوليد: لها عنوان',pre.length,'· مكرّرة',Object.keys(pd).filter(k=>pd[k]>1).length);
T(w.ipPreset(r0)===true && w.ipPreset(f0)===false, 'التمييز صحيح: القديمةُ محجوزةٌ والجديدةُ تُولَّد');
w.ipFillMissing('','');
T(!r0.net, 'المُركّبةُ سابقًا لم يُخترَع لها عنوان');
T(!!f0.net && /^10\.\d+\.\d+\.\d+$/.test(f0.net), 'الجديدةُ نالت بادئتَها — '+f0.net);
const nets=w.STATE.sites.filter(x=>x.net).map(x=>x.net);
const dups={}; nets.forEach(n=>{dups[n]=(dups[n]||0)+1;});
const bad2=Object.keys(dups).filter(k=>dups[k]>1);
/* التكرارُ الموروثُ من البيانات يُكشَف ولا يُصلَح صامتًا — والمولَّدُ لا يتكرّر */
const gen=w.STATE.sites.filter(x=>x.net && /^10\.(10|20|30|40|50)\./.test(x.net)).map(x=>x.net);
const gd={}; gen.forEach(n=>{gd[n]=(gd[n]||0)+1;});
T(Object.keys(gd).filter(k=>gd[k]>1).length===0, 'لا بادئةَ مولَّدةً تتكرّر ('+gen.length+')');
w.goPage('ips'); w.render(1);
T(bad2.length===0 || (d.getElementById('content').textContent||'').indexOf('بادئةٌ واحدةٌ على أكثرَ من نقطة')>-1,
  'التكرارُ الموروثُ يُكشَف في الشاشة ('+bad2.length+')');
/* الفنيُّ يقرأ العنوانَ من الجهاز فيُحفَظ على النقطة */
w.FORM.site=r0.id; w.FORM.access='تم الوصول';
w.FORM.photos={ site:{data:'data:,a'}, mount:{data:'data:,b'} };
w.FORM.old_net='10.10.40.7';
w.svSave(0);
T(r0.net==='10.10.40.7', 'العنوانُ المقروءُ من الميدان كُتب على النقطة');
T(w.STATE.queue.some(q=>q.kind==='sites' && q.id===r0.id), 'ويُرفَع إلى السحابة');
T(w.SV_EXTRA_KEYS.indexOf('old_net')>-1 && w.STATE.recs[r0.id].old_net==='10.10.40.7', 'ويبقى في سجل الزيارة');
/* الشاشة */
w.goPage('ips'); w.render(1);
const h=d.getElementById('content').textContent;
T(h.indexOf('عنوانُها يُقرأ من الميدان')>-1, 'الشاشةُ تفصل «عنوانُها في الميدان» عن «بلا عنوان»');
/* اللوحُ السفلي */
T(/@media \(max-width:760px\)\{\s*\.pop\{/.test(html.replace(/\n\s*/g,'')) || html.indexOf('inset-block-end:0 !important')>-1, 'النافذةُ لوحٌ سفليٌّ على الهاتف');
T(html.indexOf('.pop::before')>-1, 'مقبضُ اللوح موجود');
console.log(bad?'\nجردُ العناوين فشل ✗ ('+bad+')':'\nجردُ العناوين والنافذة نظيف ✅');
process.exit(bad?1:0);
