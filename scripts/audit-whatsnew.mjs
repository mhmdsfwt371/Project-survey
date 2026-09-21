/* ═══════════════════════════════════════════════════════════════════════════
   جردُ «ما الجديد» — node scripts/audit-whatsnew.mjs
   ───────────────────────────────────────────────────────────────────────────
   الرسالةُ تُقرأ مرةً وتُصدَّق؛ فإن ظهرت في كلِّ فتحٍ ضَجِر منها الميدانُ، وإن
   لم تظهر بعد تحديثٍ لم يعرف أحدٌ ما تبدّل، وإن نُشرت نسخةٌ بلا سطورها
   خرجت رسالةُ نسخةٍ قديمة. يُختبَر: أوّلُ تثبيتٍ صامت، وبعد التحديث مرةٌ واحدة،
   ولآخر نسخةٍ وحدَها، والنسخةُ الحاليةُ لها سطورُها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const html = readFileSync('index.html', 'utf8');
const ver = (/class="ver-tag"[\s\S]{0,240}?>نسخة\s*(V[\d.]+)</.exec(html) || [])[1];

const boot = async (seenVer) => {
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  if (seenVer !== undefined) w.localStorage.setItem('nsk14.seenVer', seenVer);
  w.localStorage.setItem('nsk14.tour.x', '1');   /* الجولةُ رُئيت — لا تزاحم */
  await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
  w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1600);
  return { w, d, wait, dom };
};

console.log('\n══ ١ · النسخةُ الحاليةُ لها سطورُها ══');
T(!!ver, 'نسخةُ الرأس: ' + ver);
const m = /var RELEASE_NOTES = \[([\s\S]*?)\n\];/.exec(html);
T(!!m && m[1].includes("v:'" + ver + "'"), 'وفي RELEASE_NOTES مدخلٌ بالنسخة نفسِها — لا تُنشَر نسخةٌ بلا مدخلها (ومدخلُ البنية بلا سطور)');

console.log('\n══ ٢ · أوّلُ تثبيتٍ صامت ══');
{
  const { w, d, dom } = await boot(undefined);
  T(!d.getElementById('wnWrap') && w.localStorage.getItem('nsk14.seenVer') === ver, 'لا رسالةَ عند أوّل تثبيت — وتُسجَّل النسخة');
  dom.window.close();
}

console.log('\n══ ٣ · بعد التحديث مرةٌ واحدة ══');
{
  const { w, d, wait, dom } = await boot('V17.80');
  const wrap = d.getElementById('wnWrap');
  T(!!wrap && wrap.innerHTML.includes('ما الجديد في هذا التحديث') && wrap.innerHTML.includes(ver), 'تظهر الرسالةُ بعد تحديثٍ من نسخةٍ أقدم — بعنوان آخر نسخة وسطورِ آخر نسخةٍ لها سطور');
  T(wrap && !/<li >\s*<\/li>/.test(wrap.innerHTML) && (wrap.innerHTML.match(/<li /g) || []).length >= 1, 'وليست فارغة');
  T(wrap && (wrap.innerHTML.match(/<li /g) || []).length >= 1 && !wrap.innerHTML.includes('V17.80'), 'وبسطور آخر نسخةٍ لا القديمة');
  d.querySelector('[data-wnx]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(100);
  T(!d.getElementById('wnWrap') && w.localStorage.getItem('nsk14.seenVer') === ver, 'وبعد الإغلاق تُسجَّل النسخةُ ولا تعود');
  T(w.whatsNewMaybe() === false, 'وفتحٌ ثانٍ لا يُعيدها');
  dom.window.close();
}

console.log('\n══ ٤ · نسخةُ بنيةٍ بلا سطورٍ لا تُزعج، والنسخةُ نفسُها لا تُعيد ══');
{
  /* من رأى سطورَ آخرِ نسخةٍ لها سطورٌ ثم وصلته نسخةُ بنيةٍ بلا سطور: لا رسالة */
  const lastNoted = (m[1].match(/v:'(V[\d.]+)'[^\n]*notes:\[\s*'/g) || []).map(x => /v:'(V[\d.]+)'/.exec(x)[1])[0];
  if (lastNoted && lastNoted !== ver){
    const { d, w, dom } = await boot(lastNoted);
    T(!d.getElementById('wnWrap') && w.localStorage.getItem('nsk14.seenVer') === ver, 'نسخةُ بنيةٍ بلا سطورٍ بعد نسخةٍ رُئيت سطورُها: لا رسالة، وتُسجَّل');
    dom.window.close();
  }
}
{
  const { d, dom } = await boot(ver);
  T(!d.getElementById('wnWrap'), 'من رآها على هذه النسخة لا يراها ثانية');
  dom.window.close();
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ «ما الجديد» نظيف \u2705'); process.exit(0);
