/* ═══════════════════════════════════════════════════════════════════════════
   جردُ فكِّ الأسماء المركَّبة — node scripts/audit-cosplit.mjs
   ───────────────────────────────────────────────────────────────────────────
   إحدى وثلاثون قيمةً في قائمة الشركات تحمل عدةَ شركاتٍ في سطرٍ واحدٍ مفصولةٍ
   بفاصلة — مخيّمٌ تخدمه عدةُ شركات، أُدخل كما جاء في الملف. فتظهر سطرًا
   طويلًا لا يُقرأ، ولا تُختار شركةٌ منه بمفردها، ولا تُحسَب لها نقاطُها.
   والفكُّ بالفاصلة وحدَها لا بكلِّ «شركة»: «شركة شخص واحد» و«شركة ذات
   مسؤولية محدودة» صيغتان قانونيتان تلحقان الاسمَ ولا تصنعان شركةً ثانيةً —
   ومن فكَّ عندهما صنع من الواحدة اثنتين. وعلاماتُ اتجاه النص تُنزَع.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 900));
const S=w.coSplit;
let bad=0; const t=(a,b)=>{ const r=S(a); const ok=JSON.stringify(r)===JSON.stringify(b); if(!ok) bad++; console.log((ok?'  ✓ ':'  ✗ ')+a.slice(0,58)+' → '+r.length+(ok?'':' ✗ '+JSON.stringify(r))); };
t('شركة قريش المحدودة شركة شخص واحد', ['شركة قريش المحدودة شركة شخص واحد']);
t('شركة اضواء الايمان لخدمات الحجاج، شركة فجر المناسك المحدودة',
  ['شركة اضواء الايمان لخدمات الحجاج','شركة فجر المناسك المحدودة']);
t('شركة الظافرة لخدمة حجاج الداخل المحدودة شركة ذات مسؤولية محدودة، شركه الفردوس المتحده لخدمه حجاج الداخل المحدوده، شركة المعالي لخدمات حجاج الداخل المحدودة شركة شخص واحد',
  ['شركة الظافرة لخدمة حجاج الداخل المحدودة شركة ذات مسؤولية محدودة','شركه الفردوس المتحده لخدمه حجاج الداخل المحدوده','شركة المعالي لخدمات حجاج الداخل المحدودة شركة شخص واحد']);
t('شركة الرحلة المباركة المحدودة‬‏، ‫شركة الخباري المحدودة‬‏',
  ['شركة الرحلة المباركة المحدودة','شركة الخباري المحدودة']);
t('مؤسسة النور، شركة الفجر', ['مؤسسة النور','شركة الفجر']);
console.log('\nCO_LIST بعد الفكّ:', (w.CO_LIST||[]).length, '(كانت 162)');
if ((w.CO_LIST||[]).filter(x=>/[،,؛;|]/.test(x)).length) bad++;
console.log('باقٍ فيه فاصلة:', (w.CO_LIST||[]).filter(x=>/[،,؛;|]/.test(x)).length);
const cm=w.coCompounds(); console.log('قيمٌ مركّبةٌ على نقاط:', Object.keys(cm).length, '— أجزاؤها:', Object.values(cm).reduce((a,x)=>a+x.parts.length,0));
/* الشاشةُ والإسناد */
const d=w.document;
const lg=d.getElementById('lgGo'); if(lg) lg.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await new Promise(r=>setTimeout(r,300));
w.ROLE='admin'; w.STATE.meta.role='admin';
w.goPage('co'); w.render(1);
const C=d.getElementById('content');
console.log((C.textContent||'').indexOf('أسماءٌ مركَّبة')>-1 ? '  ✓ بطاقةُ الأسماء المركّبة تُعرَض' : '  ✗ لا بطاقة');
const b=C.querySelector('[data-copick]');
{ const _o=b; if(!_o) bad++; console.log(_o?'  ✓ أزرارُ الأجزاء ظاهرة':'  ✗ لا أزرار'); }
if (b){
  const raw=b.getAttribute('data-copick').split('\u0000')[0], part=b.getAttribute('data-copick').split('\u0000')[1];
  const n0=(w.STATE.sites||[]).filter(x=>x.co===raw).length;
  b.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const after=(w.STATE.sites||[]).filter(x=>x.co===raw).length;
  const now=(w.STATE.sites||[]).filter(x=>x.co===part).length;
  console.log((after===0 && now>=n0) ? '  ✓ الإسنادُ ينقل نقاطَ المركَّب إلى الجزء المختار ('+n0+' نقطة)' : '  ✗ لم يُنقل');
  console.log(Object.keys(w.coCompounds()).length===30 ? '  ✓ ونقصت المركّبةُ واحدةً (30)' : '  ✗ العدد '+Object.keys(w.coCompounds()).length);
}
/* الفنيُّ لا يوحّد */
w.ROLE='tech'; w.STATE.meta.role='tech';
const cm2=Object.keys(w.coCompounds())[0];
const before=(w.STATE.sites||[]).filter(x=>x.co===cm2).length;
w.coPick(cm2, 'شركة س');
console.log((w.STATE.sites||[]).filter(x=>x.co===cm2).length===before ? '  ✓ الفنيُّ لا يوحّد الأسماء' : '  ✗ وحّد!');

console.log(bad?'\nجردُ فكِّ الأسماء فشل ✗ ('+bad+')':'\nالأسماءُ المركَّبةُ تُفَكُّ ولا تُكسَر الصيغُ القانونية ✅');
process.exit(bad?1:0);
