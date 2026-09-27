import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص */
/* ═══════════════════════════════════════════════════════════════════════════
   جردُ حارس الإقلاع — node scripts/audit-boot.mjs
   ───────────────────────────────────────────────────────────────────────────
   إقلاعٌ مات فجأةً (سفاري أسقط الصفحة) يُعرَف في الإقلاع التالي: لا تُستعاد الصفحةُ التي
   مات عندها، وبعد توقّفين يُفتَح على صفحةٍ خفيفة، ويُسجَّل المرحلةُ والصفحةُ في السجل.
   والإغلاقُ الطبيعيُّ والتحديثُ لا يُعَدّان توقّفًا. والتحديثُ يُخلي الثقيلَ قبل إعادة التحميل.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function boot(pre){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(),
    beforeParse(win){ win.localStorage.setItem('nsk14.tour.x', '1'); Object.keys(pre || {}).forEach(k => win.localStorage.setItem(k, pre[k])); } });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  await wait(800);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1400); w.toast = () => {};
  return { w, d, dom };
}
const logged = w => JSON.stringify(w.SOFT_ERRS || []) + JSON.stringify(w.STATE.evlog || {}) + JSON.stringify(w.STATE.events || []);
const page = JSON.stringify({ cur:'mfu', tab:'' });

console.log('\n══ ١ · إقلاعٌ عاديّ ══');
{ const { w, dom } = await boot({ 'nsk14.page':page });
  const b = JSON.parse(w.localStorage.getItem('nsk14.boot'));
  T(w.BOOT_GUARD.crashes === 0 && b.ok === false && b.stage === 'render', 'يُسجَّل الإقلاعُ ومرحلتُه، ولا توقّفَ سابق');
  T(w.CUR === 'mfu', 'وآخرُ صفحةٍ تُستعاد كالعادة');
  w.dispatchEvent(new w.Event('pagehide'));
  T(JSON.parse(w.localStorage.getItem('nsk14.boot')).ok === true, 'والإغلاقُ الطبيعيُّ يُعلِّمه سليمًا — فلا يُعَدّ توقّفًا');
  dom.window.close(); }

console.log('\n══ ٢ · إقلاعٌ بعد توقّفٍ مفاجئ ══');
{ const { w, dom } = await boot({ 'nsk14.page':page, 'nsk14.boot':JSON.stringify({ at:Date.now() - 8000, ok:false, n:0, stage:'map', page:'mfu' }) });
  T(w.BOOT_GUARD.crashes === 1, 'يُعرَف أن السابقَ مات فجأة');
  T(w.CUR !== 'mfu', 'ولا تُستعاد الصفحةُ التي مات عندها');
  T(/توقّفٌ مفاجئ/.test(logged(w)) && /map/.test(logged(w)), 'ويُسجَّل في صحة النظام بمرحلته (map) وصفحته');
  await wait(3300);
  T(/توقّفٌ مفاجئ/.test(JSON.stringify(w.STATE.evlog || {}) + JSON.stringify(w.STATE.events || []) + JSON.stringify(w.STATE.queue || [])), 'وفي سجلّ الأحداث الذي يصل المكتب');
  dom.window.close(); }

console.log('\n══ ٣ · توقّفان متتاليان ══');
{ const { w, dom } = await boot({ 'nsk14.page':page, 'nsk14.boot':JSON.stringify({ at:Date.now() - 5000, ok:false, n:1, stage:'shell' }) });
  T(w.BOOT_GUARD.crashes === 2 && w.CUR === 'mywork', 'بعد توقّفين يُفتَح على «مهامي» الخفيفة');
  dom.window.close(); }

console.log('\n══ ٤ · توقّفٌ قديمٌ لا يُحسَب ══');
{ const { w, dom } = await boot({ 'nsk14.page':page, 'nsk14.boot':JSON.stringify({ at:Date.now() - 10 * 60000, ok:false, n:0, stage:'map' }) });
  T(w.BOOT_GUARD.crashes === 0 && w.CUR === 'mfu', 'ما مضى عليه أكثرُ من دقيقتين ليس توقّفًا متكرّرًا');
  dom.window.close(); }

console.log('\n══ ٥ · التحديثُ يُخلي الثقيلَ ولا يُعَدّ توقّفًا ══');
{ const { w, d, dom } = await boot({});
  let reloaded = false; try { Object.defineProperty(w, 'location', { value:{ reload(){ reloaded = true; }, href:w.location.href }, configurable:true }); } catch {}
  w.swNow(); await wait(50);
  T(!d.getElementById('content').innerHTML && JSON.parse(w.localStorage.getItem('nsk14.boot')).ok === true, 'swNow: المحتوى يُفرَّغ والإقلاعُ يُعلَّم سليمًا قبل إعادة التحميل');
  dom.window.close(); }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ حارس الإقلاع نظيف \u2705'); process.exit(0);
