/* ═══════════════════════════════════════════════════════════════════════════
   جردُ المزامنة على الهاتف — node scripts/audit-syncm.mjs
   ───────────────────────────────────────────────────────────────────────────
   شريطُ المزامنة (الوقتُ والجرسُ وزرُّ المزامنة) يختفي تحت ٥٦٠ بكسل، ولافتةُ
   «الحفظُ المحليُّ لا يعمل» تقول «زامن الآن». يُفحَص: زرٌّ للهاتف ظاهرٌ هناك
   ومخفيٌّ على الحاسوب، وشارتُه عددُ ما ينتظر الرفع، وفي اللافتة نفسِها زرُّ
   المزامنة بالعدد، والضغطُ يدفع الطابورَ ويسحب ويحدّث العددَ بلا إعادة رسم.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
console.log('\n══ ١ · الزرُّ في الرأس ══');
T(/<button type="button" class="tb-btn tb-sync-m" id="syncM" data-pull="1"/.test(html), 'زرُّ مزامنةٍ في رأس الشاشة يستدعي المزامنةَ نفسَها (data-pull)');
T(/\.tb-sync-m\{display:none;position:relative\}/.test(html) && /@media\(max-width:560px\)\{ \.tb-sync-m\{display:inline-flex\} \}/.test(html) && /@media\(max-width:560px\)\{ \.topbar-meta\{display:none\}/.test(html), 'ويظهر حيث يختفي شريطُ المزامنة (تحت ٥٦٠ بكسل) — ومخفيٌّ على الحاسوب');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'tech', name:'فني' }); w.FB.legacyDone = () => true; w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
let pulls = 0; w.pullDelta = () => { pulls++; return Promise.resolve(0); };
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {};
console.log('\n══ ٢ · الشارةُ عددُ ما ينتظر ══');
let pend = 3, flushes = 0; w.CORE.pending = () => pend; w.CORE.flush = () => { flushes++; pend = 0; };
w.syncBadge();
T(d.getElementById('syncMN').hidden === false && /٣|3/.test(d.getElementById('syncMN').textContent), 'ثلاثةٌ بانتظار الرفع: الشارةُ تقول ٣');
console.log('\n══ ٣ · اللافتةُ فيها الزر ══');
pend = 3; w.IDB_BAD = true; w.render(1); await wait(60);
const ib = d.getElementById('idbBanner');
T(!!ib && !!ib.querySelector('[data-pull]') && /زامن الآن/.test(ib.textContent) && /٣|3/.test(ib.textContent), 'لافتةُ الحفظ المحلي فيها «زامن الآن» بالعدد');
ib.querySelector('[data-pull]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(flushes === 1 && pulls >= 1, 'والضغطُ يدفع الطابورَ ويسحب');
w.syncBadge();
T(d.getElementById('syncMN').hidden === true && d.getElementById('idbBannerN').textContent === '', 'وبعد الرفع تختفي الشارةُ ويخلو العدد');
d.getElementById('syncM').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
T(flushes === 2, 'وزرُّ الرأس يفعل الشيءَ نفسَه');
w.IDB_BAD = false; w.render(1); await wait(40);
T(!d.getElementById('idbBanner'), 'وحين يعود الحفظُ المحليُّ تزول اللافتة');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ المزامنة على الهاتف نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
