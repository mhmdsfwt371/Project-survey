/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تحميل القاموس كما في المتصفّح — node scripts/audit-i18nload.mjs
   ───────────────────────────────────────────────────────────────────────────
   القاموسُ ملفٌّ يصل بعد الإقلاع (لا حقنًا): العربيةُ لا تطلبه أبدًا، وغيرُها ترى شاشةَ
   الدخول بلغتها بعد وصوله، ولا يُرسَم التطبيقُ خلف شاشة الدخول، وتعذُّرُ الشبكة لا يعلّق
   شيئًا، وتغييرُ اللغة من شاشة الدخول يعيدها بلغتها ويُبقي اسمَ المستخدم.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const dictFile = readdirSync('i18n').find(f => /^dict-[0-9a-f]{10}\.js$/.test(f));
const dictSrc = readFileSync('i18n/' + dictFile, 'utf8');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function boot(lang, opt){
  opt = opt || {};
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(),
    beforeParse(win){
      win.localStorage.setItem('nsk14.tour.x', '1'); if (lang) win.localStorage.setItem('nsk14.lang', lang);
      const orig = win.Node.prototype.appendChild; win.__loads = 0;
      win.Node.prototype.appendChild = function(el){
        if (el && el.tagName === 'SCRIPT' && /i18n\/dict-/.test(el.src || '')){
          win.__loads++;
          setTimeout(() => { if (opt.fail){ if (el.onerror) el.onerror(); return; } win.eval(dictSrc); if (el.onload) el.onload(); }, opt.delay || 300);
          return el;
        }
        return orig.call(this, el);
      };
    } });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  return { w, d, dom };
}
const goTxt = d => ((d.getElementById('lgGo') || {}).textContent || '').trim();

console.log('\n══ ١ · العربيةُ لا تطلب القاموس ══');
{ const { w, d, dom } = await boot('');
  await wait(900);
  T(goTxt(d) === 'دخول' && w.__loads === 0, 'شاشةُ الدخول فورًا بالعربية — ولا طلبَ لملف القاموس');
  dom.window.close(); }

console.log('\n══ ٢ · الإنجليزية: شاشةُ الدخول بلغتها بعد وصول القاموس ══');
{ const { w, d, dom } = await boot('en', { delay:400 });
  let renders = 0; await wait(150); const R0 = w.render; w.render = function(){ renders++; return R0.apply(this, arguments); };
  await wait(900);
  T(w.__loads === 1 && w.I18N_STATE === 2, 'طُلب القاموسُ مرةً واحدة ووصل');
  T(goTxt(d) && goTxt(d) !== 'دخول', 'وزرُّ الدخول بالإنجليزية: «' + goTxt(d) + '»');
  T(renders === 0, 'ولا يُرسَم التطبيقُ خلف شاشة الدخول');
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'Eng' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1400);
  T(!/[\u0600-\u06FF]/.test((d.getElementById('crumb') || {}).textContent || 'x') || /Map|Tasks|Survey/.test(d.getElementById('nav').textContent), 'وبعد الدخول التطبيقُ بالإنجليزية');
  dom.window.close(); }

console.log('\n══ ٣ · الشبكةُ تعذّرت: لا تعليق ══');
{ const { w, d, dom } = await boot('ur', { fail:true, delay:200 });
  await wait(900);
  T(w.I18N_STATE === 3 && goTxt(d) === 'دخول', 'تعذُّرُ القاموس يرسم شاشةَ الدخول بالعربية فورًا — لا انتظارَ بلا نهاية');
  dom.window.close(); }

console.log('\n══ ٤ · تغييرُ اللغة من شاشة الدخول ══');
{ const { w, d, dom } = await boot('', {});
  await wait(900);
  d.getElementById('lgU').value = 'ahmed.k';
  d.querySelector('#lgLangs [data-l="en"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(700);
  T(goTxt(d) !== 'دخول' && d.getElementById('lgU').value === 'ahmed.k', 'تُعاد شاشةُ الدخول بالإنجليزية ويبقى اسمُ المستخدم');
  dom.window.close(); }

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تحميل القاموس نظيف \u2705'); process.exit(0);
