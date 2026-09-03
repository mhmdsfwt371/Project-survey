/* ═══════════════════════════════════════════════════════════════════════════
   جردُ اللمس وأرقام الأسطورة — node scripts/audit-touch.mjs
   ───────────────────────────────────────────────────────────────────────────
   الإصبعُ ليس مؤشِّرًا. أصغرُ هدفٍ يُصاب باطمئنانٍ أربعةٌ وأربعون بكسلًا،
   والنقطةُ غيرُ المخيم أصغرُ ما على الخريطة — فتُعطى هامشَ إصابةٍ في اللوح
   وإطارَ لمسٍ في الأيقونة، بلا تغيير منظر. ويُمنع التأخيرُ قبل النقرة
   والتكبيرُ بنقرتين وتكبيرُ iOS التلقائيُّ عند لمس حقل.
   والأسطورةُ تعدُّ: لكلِّ حالةٍ رقمُها ثم المجموع — والأرقامُ من المعروض
   بعد الترشيح لا من القاعدة كلِّها، فما يُقرأ يوافق ما يُرى.
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
w.ROLE='engineer'; w.FIELD_MODE='survey';
/* الأسطورةُ بأرقامها */
const s0=w.STATE.sites[0], s1=w.STATE.sites[1];
w.STATE.recs[s0.id]={id:s0.id,access:'تم الوصول',review:'approved',at:Date.now(),by:'x',photos:[]};
w.STATE.inss[s1.id]={id:s1.id,status:'مُركّب',approved:true,at:Date.now()};
w.statBump();
const lgh=w.legendRows();
T(/lg-c/.test(lgh) && /lg-tot/.test(lgh), 'الأسطورة فيها عمودُ أرقامٍ ومجموع');
const nums=[...lgh.matchAll(/lg-c">([^<]+)</g)].map(m=>m[1]);
T(nums.length===w.LIFE_ORDER.length+1, 'رقمٌ لكلِّ حالةٍ ثم المجموع ('+nums.length+')');
T(lgh.indexOf('lg-off')>-1, 'الحالاتُ الخاليةُ تخفت ولا تختفي');
const tot=w.layerFiltered().length;
T(nums[nums.length-1]===w.nm(tot), 'المجموعُ يوافق المعروضَ فعلًا ('+nums[nums.length-1]+')');
/* الحالتان المضبوطتان تُعدّان */
T(lgh.indexOf(w.LIFE.ready.c)>-1 && lgh.indexOf(w.LIFE.installed.c)>-1, 'حالتا «بانتظار الجدولة» و«مُركّبة» في الأسطورة');
/* طبقةُ التركيب لها أرقامُها */
w.FIELD_MODE='install';
const lgi=w.legendRows();
T([...lgi.matchAll(/lg-c">([^<]+)</g)].length===4, 'طبقةُ التركيب: ثلاثةُ أرقامٍ ومجموع');
w.FIELD_MODE='survey';
/* هامشُ اللمس */
T(html.indexOf('tolerance:12')>-1, 'لوحُ الرسم بهامش إصابةٍ اثني عشر بكسلًا');
T(/@media \(pointer:coarse\)/.test(html), 'قواعدُ الشاشات اللمسية موجودة');
const coarse=html.slice(html.indexOf('@media (pointer:coarse)'), html.indexOf('@media (pointer:coarse)')+520);
T(/\.btn, \.chip, \.map-chip\{ min-height:44px \}/.test(coarse), 'أهدافُ اللمس أربعةٌ وأربعون بكسلًا');
T(/font-size:16px/.test(coarse), 'حقولُ الإدخال ستةَ عشرَ — لا تكبيرَ تلقائيًّا في iOS');
T(html.indexOf('touch-action:manipulation')>-1, 'لا تأخيرَ ثلاثمئةِ جزءٍ ولا تكبيرَ بنقرتين');
T(/hit = Math\.max\(ds \+ 20, 44\)/.test(html), 'المعيّنُ (ممر · كاميرا) بإطار لمسٍ ٤٤ بكسلًا');
console.log(bad?'\nجردُ اللمس فشل ✗ ('+bad+')':'\nجردُ اللمس وأرقام الأسطورة نظيف ✅');
process.exit(bad?1:0);
