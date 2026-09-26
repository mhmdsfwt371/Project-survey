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
const REAL_FLUSH = w.CORE.flush, REAL_PENDING = w.CORE.pending;
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
console.log('\n══ ٤ · التلقائيّ (V19.5) ══');
/* المزامنةُ التلقائية: كلُّ حفظٍ يُرفَع في لحظته (CORE.dirty → CORE.flush)، والدورةُ كلَّ دقيقةٍ
   تعيد ما فشل، والعودةُ إلى الشبكة ترفع — ويُضاف هنا: ما كُتب أثناء رفعٍ جارٍ، والخلفية، والطيّ */
const src = readFileSync('index.html', 'utf8');
const dirtyBody = src.slice(src.indexOf('  dirty: function(kind, id, v){'), src.indexOf('  dirty: function(kind, id, v){') + 4000);
T(/CORE\.saveSoon\(\);\s*CORE\.flush\(\);/.test(dirtyBody), 'كلُّ حفظٍ يُرفَع في لحظته — لا ينتظر دورة');
w.STATE.meta.online = true; w.FB.ready = true; await wait(2500);
let pushes = 0, gate = null; w.EPOCH_PENDING = false;
w.FB.init = () => Promise.resolve(true);
w.FB.push = batch => { pushes++; return new Promise(res => { gate = res; }); };
w.FB.pulse = () => {}; w.CORE.flush = REAL_FLUSH; w.CORE.pending = REAL_PENDING; w.CORE._busy = false;
w.STATE.queue.length = 0;
w.CORE.dirty('recs', 'NSK-T-1', { id:'NSK-T-1', at:Date.now() }); await wait(30);
T(pushes === 1, 'الحفظُ الأوّلُ يبدأ رفعًا');
w.CORE.dirty('recs', 'NSK-T-2', { id:'NSK-T-2', at:Date.now() }); await wait(30);
T(pushes === 1 && w.STATE.queue.length === 2, 'والثاني أثناءه يجد القفلَ فينتظر');
gate(); await wait(100);
T(w.STATE.queue.length === 1 && w.STATE.queue[0].id === 'NSK-T-2', 'انتهى الأوّل: رُفع وبقي الثاني');
await wait(1700);
T(pushes === 2, 'والثاني يُرفَع فورَ انتهاء الأوّل (ثانيةٌ ونصف) — لا بعد دقيقة');
gate(); await wait(100);
T(w.STATE.queue.length === 0, 'ولا شيءَ باقٍ');
let hideFlush = 0; const realFlush = w.CORE.flush; w.CORE.flush = () => { hideFlush++; return Promise.resolve(0); };
w.STATE.queue.push({ kind:'recs', id:'NSK-T-3', v:{ id:'NSK-T-3' }, at:Date.now() }); w.CORE.pending = () => w.STATE.queue.length;
T(w.syncOnHide() === true && hideFlush === 1, 'الذهابُ إلى الخلفية أو طيُّ الصفحة يرفع ما ينتظر فورًا');
w.STATE.queue.length = 0;
T(w.syncOnHide() === false && hideFlush === 1, 'ولا يرفع حين لا شيءَ ينتظر');
T(/window\.addEventListener\('pagehide', syncOnHide\)/.test(src) && /if \(document\.hidden\)\{ syncOnHide\(\); return; \}/.test(src), 'ومربوطٌ بطيِّ الصفحة وبالذهاب إلى الخلفية');
w.CORE.flush = realFlush;
console.log('\n══ ٥ · اللافتةُ تقول سببها، والاتصالُ الميّتُ يُعاد (V19.5) ══');
T(/آيفون/.test(w.idbWhyText('UnknownError: Connection to Indexed Database server lost. Refresh the page to try again')) && /ممتلئة/.test(w.idbWhyText('QuotaExceededError')) && /يمنع الحفظ/.test(w.idbWhyText('SecurityError')) && /تأخّر/.test(w.idbWhyText('idb-timeout')) && /غيرُ معروف/.test(w.idbWhyText('x')), 'كلُّ سببٍ بلغةٍ مفهومةٍ وما يُفعَل');
w.IDB_BAD = false; w.idbTellBad(true, 'UnknownError: Connection to Indexed Database server lost'); w.render(1); await wait(40);
const ib2 = d.getElementById('idbBanner');
T(!!ib2 && /آيفون/.test(ib2.textContent) && /يُرفَع تلقائيًّا/.test(ib2.textContent) && !!ib2.querySelector('[data-idbretry]'), 'اللافتةُ تقول السببَ وأن العملَ يُرفَع تلقائيًّا، وفيها «أعد المحاولة»');
let closed = 0, retried = 0; const realLater = w.idbRetryLater; w.idbRetryLater = () => { retried++; };
w._idb = { close(){ closed++; }, transaction(){ throw new Error('InvalidStateError: The database connection is closing.'); } };
w.indexedDB = w.indexedDB || {}; w.idbOpen = () => Promise.resolve(w._idb);
await w.idbSet('k1', { a:1 });
T(closed === 1 && w._idb === null && retried === 1 && w._mem && w._mem.get('k1'), 'الكتابةُ على اتصالٍ ميّت: يُغلَق ويُترَك ويُجدوَل فتحٌ جديد — والعملُ في الذاكرة حتى يُدفَق');
w.idbRetryLater = realLater;
w.IDB_BAD = false; w.render(1); await wait(40);
T(!d.getElementById('idbBanner'), 'وحين يعود الحفظُ المحليُّ تزول اللافتة');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ المزامنة على الهاتف نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
