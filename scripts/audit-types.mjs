import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التصنيفات ونقل النقاط إليها — node scripts/audit-types.mjs
   ───────────────────────────────────────────────────────────────────────────
   المهندسُ يضيف تصنيفًا، وينقل إليه النقاطَ المحدَّدةَ على الخريطة من لوح الإسناد، ويحذف تصنيفًا
   عليه نقاطٌ بعد نقلها إلى غيره — والنقلُ تجاوزٌ في وثيقة النقطة، والزياراتُ لا تُمَسّ، وغيرُه لا ينقل.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8'); const wait = ms => new Promise(r => setTimeout(r, ms));
async function boot(role){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1'); await wait(800);
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1400); w.toast = () => {};
  return { w, d, dom };
}
const click = async (w, d, sel) => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(50); return true; };

console.log('\n══ ١ · إضافةُ تصنيفٍ ونقلُ المحدَّد إليه ══');
{ const { w, d, dom } = await boot('engineer');
  const wrote = []; const C0 = w.CORE.set; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); return C0.call(w.CORE, k, id, v); };
  w.goPage('sites'); w.render(1); await wait(60);
  T(!d.querySelector('#content [data-tyadd]') && !!d.querySelector('#content [data-typesopen="1"]'), 'في «المواقع» بطاقةُ التصنيفات مطويّة — لا تثقل الصفحة');
  await click(w, d, '#content [data-typesopen="1"]');
  T(!!d.querySelector('#content [data-tyadd]'), 'و«افتح» تعرضها كاملةً للمهندس');
  d.getElementById('tyK').value = 'كاميرات الجمرات'; d.getElementById('tyL').value = 'كاميرات الوزارة — الجمرات';
  await click(w, d, '#content [data-tyadd]');
  T(!!w.typesList()['كاميرات الجمرات'], 'أُضيف التصنيف');
  const ids = ['NSK-JMR-CAM-0001', 'NSK-JMR-CAM-0002', 'NSK-JMR-CAM-0003'];
  w.STATE.recs['NSK-JMR-CAM-0001'] = { id:'NSK-JMR-CAM-0001', at:Date.now(), access:'تم الوصول', review:'pending' };
  w.selClear(); ids.forEach(id => w.selToggle(id));
  w.goPage('map'); w.ASN_OPEN = true; w.render(1); await wait(60);
  const sel = d.getElementById('selType');
  T(!!sel && !!d.querySelector('[data-seltype]'), 'لوحُ الإسناد يعرض «انقل المحدَّد إلى تصنيف»');
  sel.value = 'كاميرات الجمرات'; await click(w, d, '[data-seltype]');
  T(ids.every(id => w.siteFind(id).type === 'كاميرات الجمرات') && ids.every(id => wrote.some(r => r[0] === 'sites' && r[1] === id && r[2].type === 'كاميرات الجمرات')), 'الثلاثُ نُقلت — تجاوزًا في وثيقة كلِّ نقطة');
  T(!!w.STATE.recs['NSK-JMR-CAM-0001'] && w.SEL_N === 0, 'والزيارةُ باقيةٌ على نقطتها، والتحديدُ فُرِّغ');

  console.log('\n══ ٢ · حذفُ تصنيفٍ عليه نقاطٌ بعد نقلها ══');
  w.goPage('sites'); w.TYPES_OPEN = true; w.render(1); await wait(60);
  const mv = d.getElementById('tyMv_كاميرات الجمرات');
  T(!!mv && !!d.querySelector('[data-tymove="كاميرات الجمرات"]'), 'المستعمَلُ يعرض «انقل نقاطه إلى…» و«انقل واحذف» بدل «مستعمل»');
  mv.value = 'كاميرا'; await click(w, d, '[data-tymove="كاميرات الجمرات"]');
  T(ids.every(id => w.siteFind(id).type === 'كاميرا') && !w.typesList()['كاميرات الجمرات'], 'نقاطُه عادت إلى «كاميرات الوزارة» وحُذف التصنيف');
  dom.window.close(); }

console.log('\n══ ٣ · غيرُ المهندس ══');
{ const { w, d, dom } = await boot('supervisor');
  w.selClear(); w.selToggle('NSK-JMR-CAM-0004'); const was = w.siteFind('NSK-JMR-CAM-0004').type;
  w.goPage('map'); w.ASN_OPEN = true; w.render(1); await wait(60);
  T(!d.getElementById('selType') && w.selSetType('كاميرا') === 0 && w.siteFind('NSK-JMR-CAM-0004').type === was, 'المشرفُ لا يرى النقلَ ولا يملكه');
  dom.window.close(); }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ التصنيفات ونقل النقاط نظيف \u2705'); process.exit(0);
