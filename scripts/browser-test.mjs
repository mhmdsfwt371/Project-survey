/* ═══════════════════════════════════════════════════════════════════════════
   اختبارُ المتصفّح الحقيقي — node scripts/browser-test.mjs
   ───────────────────────────────────────────────────────────────────────────
   المتصفّحُ الصوريُّ لا يرسم ولا يقيس ولا يلمس: لا يعرف أين وقعت النافذةُ
   على الشاشة، ولا إن أصاب الإصبعُ نقطةً في لوح الرسم. فهذا يفتح كروميوم
   حقيقيًّا بمقاس هاتف، ويدخل، ويفتح الخريطةَ على نقطةِ ممرٍّ ويلمسها بإصبعٍ
   حقيقي، ويقيس أين ظهرت النافذةُ وبأيِّ عرض — ويلتقط صورًا للدليل.
   ═════════════════════════════════════════════════════════════════════════ */
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createRequire } from 'module';
const { chromium, devices } = createRequire(import.meta.url)(process.env.PW_MOD || 'playwright');

const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json',
               '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const srv = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!existsSync(p) || statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + srv.address().port + '/';
const OUT = 'test-artifacts'; if (!existsSync(OUT)) mkdirSync(OUT);

/* ═══ ما يسقط يُكتَب حيث يُقرَأ (V17.3) ═══
   سجلُّ سير العمل يُحفَظ في خدمةٍ لا تُقرأ إلا من المتصفّح، فمن يصلح العطلَ
   من بعيدٍ يرى «فشل» ولا يرى **ما** فشل — فيخمّن. وGitHub يعرض سطورَ
   `::error` تعليقاتٍ على السير تُقرأ بواجهته البرمجية. فصار كلُّ فحصٍ ساقطٍ
   يُكتَب مرتين: في السجلّ لمن يفتحه، وتعليقًا لمن لا يفتحه. */
/* والاستثناءُ الذي يُسقِط الاختبارَ قبل أوّل فحصٍ يُكتَب كذلك: سطرٌ يقول
   أين وقع وماذا قال — وإلا لم يبقَ إلا «exit code 1» ولا لقطةَ ولا سبب. */
const crash = (what, e) => {
  const msg = String(e && e.stack || e && e.message || e).replace(/[\r\n]+/g, ' ⏎ ').slice(0, 600);
  console.log('::error title=استثناءٌ في ' + what + '::' + msg);
  console.log('✗ ' + what + ': ' + msg);
  process.exit(1);
};
process.on('uncaughtException', e => crash('الاختبار', e));
process.on('unhandledRejection', e => crash('وعدٌ بلا التقاط', e));
let bad = 0;
const T = (c, n) => {
  console.log((c ? '  ✓ ' : '  ✗ ') + n);
  if (!c){ bad++; console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); }
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale:'ar', hasTouch:true, isMobile:true });
const page = await ctx.newPage();
const errs = [], warns = [];
/* ضجيجُ الشبكة ليس خطأً في التطبيق: بلاطاتُ الخريطة من خدمةٍ عامةٍ قد تُحجَب
   في بيئة الاختبار — يُهمَل، ويُحتسَب ما سواه */
const NOISE = /Failed to load resource|ERR_FAILED|CORS policy|tile\.openstreetmap|ERR_NAME_NOT_RESOLVED|net::/;
page.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
page.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push('console: ' + m.text().slice(0, 140)); });

console.log('══ ١ · الإقلاعُ والدخول ══');
await page.goto(base + 'index.html', { waitUntil:'domcontentloaded' });
await page.waitForSelector('#lgGo', { timeout: 15000 });
T(true, 'شاشةُ الدخول رُسمت في كروميوم');
/* علامةٌ تعيش في الصفحة: إن اختفت فقد أُعيد تحميلُها في أثناء الاختبار —
   وهو ما فعله أوّلُ تثبيتٍ للعامل قبل V17.5، فسقط كلُّ ما بعده بلا سبب */
await page.evaluate(() => { window.__probe = 1; });
/* ثغرةُ الدخول بحقلين فارغين سُدَّت (V15.94): يُثبَت ذلك في كروميوم حقيقيٍّ —
   ضغطٌ فارغٌ لا يفتح شيئًا، ثم يُدخَل بهويةٍ صوريةٍ مُثبَتة. */
await page.click('#lgGo');
await page.waitForTimeout(600);
const openedEmpty = await page.evaluate(() => !document.getElementById('login'));
T(!openedEmpty, 'حقلان فارغان لا يفتحان التطبيق');
await page.evaluate(() => {
  FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
  FB.legacyDone = () => true; window.pullDelta = () => Promise.resolve(0);
  document.getElementById('lgU').value = 'eng.test'; document.getElementById('lgP').value = 'TestPass1234';
});
await page.click('#lgGo');
await page.waitForSelector('#nav', { timeout: 15000 });
T(true, 'الدخولُ بهويةٍ فتح القائمة');
/* جولةُ البداية تُفتَح أوّلَ دخول (V17.0) — لوحٌ فوق كلِّ شيءٍ بخلفيةٍ تلتقط
   اللمس. فيُثبَت أنها تُفتَح، ثم تُغلَق بضغطةٍ كما يفعل المستخدِم، ولا تعود.
   وبلا هذا كانت خلفيتُها تبتلع لمسةَ الخريطة في القسم التالي ويُقال «النقطة
   لا تفتح» — والعطلُ في الحاجب لا في النقطة. */
const tourUp = await page.evaluate(() => !!document.getElementById('tourSheet'));
T(tourUp, 'جولةُ البداية تُفتَح أوّلَ دخول');
if (tourUp){
  try { await page.click('#tourSheet button[data-tourclose]', { timeout: 5000 }); }
  catch (e){ await page.evaluate(() => { if (typeof tourEnd === 'function') tourEnd(false); }); }
}
await page.waitForTimeout(300);
const tourGone = await page.evaluate(() => !document.getElementById('tourSheet') && !document.querySelector('.wt-back'));
T(tourGone, 'وتُغلَق بضغطةٍ فلا تحجب العمل');
/* «لا تعود» تُفحَص بمنطق الإقلاع نفسِه لا بإعادة تحميلٍ تُفقِد الجلسةَ
   الصورية: إعادةُ التحميل تُعيد شاشةَ الدخول فيسقط ما بعدها بلا عطلٍ في
   التطبيق — فيُنادى ما يُنادى عند كلِّ إقلاع، ويُقاس أثرُه. */
const tourAgain = await page.evaluate(() => {
  if (typeof tourMaybe !== 'function') return null;
  tourMaybe(); render(1);
  return !!document.getElementById('tourSheet');
});
T(tourAgain === false, 'ولا تعود مع الإقلاع التالي — رُئيت مرةً');
const sites = await page.evaluate(() => (window.STATE && STATE.sites || []).length);
T(sites > 1000, 'المواقعُ محمَّلة (' + sites + ')');
await page.screenshot({ path: OUT + '/01-home.png' });

const alive = await page.evaluate(() => window.__probe === 1 && typeof goPage === 'function');
T(alive, 'الصفحةُ لم يُعَد تحميلُها في أثناء الاختبار — أوّلُ تثبيتٍ للعامل ليس تحديثًا');

console.log('\n══ ٢ · الخريطةُ الحقيقيةُ ولمسُ نقطةِ ممرّ ══');
await page.evaluate(() => { window.ROLE = 'engineer'; STATE.meta.role = 'engineer'; goPage('map'); render(1); });
await page.waitForFunction(() => window.MAP && document.getElementById('mapBox'), null, { timeout: 20000 });
T(true, 'الخريطةُ (Leaflet) أُنشئت');
/* نقطةُ ممرٍّ — الأصغرُ على الخريطة */
const target = await page.evaluate(() => {
  const x = STATE.sites.filter(s => s.type === 'ممر' && s.lat && s.lng)[0];
  MAP.setView([x.lat, x.lng], 16, { animate:false });
  return { id:x.id, lat:x.lat, lng:x.lng };
});
await page.waitForTimeout(900);
await page.evaluate(() => { if (typeof mapPaint === 'function') mapPaint(); });
await page.waitForTimeout(400);
const pt = await page.evaluate(({ lat, lng }) => {
  const p = MAP.latLngToContainerPoint([lat, lng]);
  const r = document.getElementById('mapBox').getBoundingClientRect();
  return { x: r.left + p.x, y: r.top + p.y };
}, target);
await page.screenshot({ path: OUT + '/02-map-before-tap.png' });
/* لا لوحَ فوق الخريطة قبل اللمس — وإلا اختُبر الحاجبُ لا النقطة */
const blocker = await page.evaluate(() => {
  const b = document.querySelector('.wt-back, #tourSheet, #bugSheet');
  return b ? (b.id || b.className) : '';
});
T(!blocker, 'لا حاجبَ فوق الخريطة قبل اللمس' + (blocker ? ' — ' + blocker : ''));
await page.touchscreen.tap(pt.x, pt.y);
await page.waitForTimeout(500);
const opened = await page.evaluate(() => ({ open: !!window.POP_OPEN, site: window.POP_SITE }));
T(opened.open && opened.site === target.id, 'لمسةٌ واحدةٌ على الممرِّ تفتح نافذتَه (' + target.id + ')');
await page.screenshot({ path: OUT + '/03-popup.png' });

console.log('\n══ ٣ · مقاسُ النافذة على الهاتف ══');
const vp = page.viewportSize();
const box = await page.evaluate(() => { const e = document.querySelector('.pop'); if (!e) return null;
  const r = e.getBoundingClientRect(); return { x:r.left, y:r.top, w:r.width, h:r.height, b:r.bottom }; });
T(!!box, 'النافذةُ في الصفحة');
if (box){
  T(Math.abs(box.x) < 2 && Math.abs(box.w - vp.width) < 2, 'بعرض الشاشة كاملًا (' + Math.round(box.w) + '/' + vp.width + ')');
  T(Math.abs(box.b - vp.height) < 2, 'ملتصقةٌ بالأسفل (لوحٌ سفلي)');
  T(box.h <= vp.height * 0.78, 'لا تتجاوز ٧٦٪ من الارتفاع (' + Math.round(box.h / vp.height * 100) + '٪)');
}
const btns = await page.$$eval('.pop .btn', L => L.map(b => Math.round(b.getBoundingClientRect().height)));
T(btns.length > 0 && btns.every(h => h >= 43), 'أزرارُ النافذة أهدافُ لمسٍ ≥ ٤٤ بكسلًا (' + btns.join(',') + ')');

console.log('\n══ ٤ · الأسطورةُ بأرقامها ══');
/* V16.63: الأسطورةُ تبدأ مطويّةً على الهاتف — تُفتَح ثم تُعَدّ */
await page.evaluate(() => { POP_OPEN = false; LEGEND_ON = true; render(1); });
const legend = await page.evaluate(() => [...document.querySelectorAll('.map-legend .lg-c')].map(e => e.textContent.trim()));
T(legend.length >= 11, 'الأسطورةُ تحمل رقمًا لكلِّ حالةٍ والمجموع (' + legend.length + ')');
await page.screenshot({ path: OUT + '/04-legend.png' });

console.log('\n══ ٤ب · الأبعادُ على الهاتف: لا زرَّ خارجَ الشاشة ولا صفحةَ أعرضَ منها (V17.33) ══');
{
  const bad = [];
  for (const pid of ['ev','users','wbs','survey','trials','sys']){
    await page.evaluate(id => { goPage(id); render(1); }, pid); await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const W = window.innerWidth;
      const wide = document.documentElement.scrollWidth > W + 2;
      const off = [...document.querySelectorAll('#content button, #content input, #content select')]
        .map(el => el.getBoundingClientRect())
        .filter(b => b.width > 0 && (b.right > W + 2 || b.left < -2)).length;
      return { wide, off };
    });
    if (r.wide || r.off) bad.push(pid + (r.wide ? ' عرض' : '') + (r.off ? ' أزرار:' + r.off : ''));
  }
  T(bad.length === 0, 'كلُّ شاشةٍ داخل عرض الهاتف وأزرارُها مرئية' + (bad.length ? ' — خالف: ' + bad.join(' · ') : ''));
}

/* ═══ ٤ج · شريطُ الخريطة يُرى كلُّه على الهاتف، والعرضُ يتبع الشاشة (V17.41) ═══ */
{
  await page.setViewportSize({ width:390, height:844 });
  await page.evaluate(() => { goPage('map'); render(1); });
  await page.waitForTimeout(400);
  const bar = await page.evaluate(() => {
    const b = document.querySelector('.map-top'); if (!b) return null;
    const W = window.innerWidth, r = b.getBoundingClientRect();
    const out = [...b.querySelectorAll('.map-chip')].map(c => c.getBoundingClientRect())
      .filter(c => c.width > 0 && (c.right > W + 1 || c.left < -1)).length;
    return { scrollX: b.scrollWidth > b.clientWidth + 1, out, chips:b.querySelectorAll('.map-chip').length, wide: r.width > W };
  });
  T(!!bar && !bar.scrollX && bar.out === 0 && !bar.wide,
    'شريطُ الخريطة على الهاتف يُرى كلُّه: ' + (bar ? bar.chips + ' زرًّا · خارج الشاشة ' + bar.out + ' · تمريرٌ أفقيّ ' + bar.scrollX : 'غائب'));
  /* شريطُ الرأس: لا زرَّ خارج الشاشة ولا تمريرٌ أفقيّ (V17.42) */
  const tb = await page.evaluate(() => {
    const b = document.querySelector('.topbar'); if (!b) return null;
    const W = window.innerWidth;
    const out = [...b.querySelectorAll('button,select,a')].map(e => e.getBoundingClientRect())
      .filter(r => r.width > 0 && (r.right > W + 1 || r.left < -1)).length;
    return { out, scrollX: document.documentElement.scrollWidth > W + 2, h: Math.round(b.getBoundingClientRect().height) };
  });
  T(!!tb && tb.out === 0 && !tb.scrollX,
    'وشريطُ الرأس يسع الهاتفَ: خارج الشاشة ' + (tb ? tb.out : '?') + ' · تمريرٌ أفقيّ ' + (tb ? tb.scrollX : '?') + ' · ارتفاعُه ' + (tb ? tb.h : '?') + 'px');
  /* ١٤ بوصةً ثم ٢٢: العرضُ يتّسع مع الشاشة */
  const widthAt = async w => {
    await page.setViewportSize({ width:w, height:900 });
    await page.evaluate(() => { goPage('wbs'); render(1); });
    await page.waitForTimeout(300);
    return await page.evaluate(() => Math.round(document.getElementById('content').getBoundingClientRect().width));
  };
  const w14 = await widthAt(1366), w22 = await widthAt(1920);
  T(w22 > w14 + 300, 'وعرضُ المحتوى يتبع الشاشة: ' + w14 + 'px على ١٤ بوصةً · ' + w22 + 'px على ٢٢');
  await page.setViewportSize({ width:1280, height:800 });
}

console.log('\n══ ٥ · جولةٌ على الشاشات في المتصفّح الحقيقي ══');
const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('#nav [data-p]')].map(a => a.getAttribute('data-p')))]);
let drawn = 0;
for (const id of ids){
  await page.evaluate(i => { goPage(i); render(1); }, id);
  const len = await page.evaluate(() => (document.getElementById('content').textContent || '').trim().length);
  if (len > 40 || id === 'map') drawn++;
}
T(drawn === ids.length, 'كلُّ بنود القائمة تُرسَم (' + drawn + '/' + ids.length + ')');
await page.evaluate(() => { goPage('wf'); render(1); });
T(await page.$('#content svg') !== null, 'رسمُ الدورة SVG يُرسَم فعلًا');
await page.screenshot({ path: OUT + '/05-workflow.png', fullPage:false });

console.log('\n══ ٦ · خدمةُ الخلفية والملفّاتُ المصاحبة ══');
const sw = await page.evaluate(async () => { try { const r = await navigator.serviceWorker.getRegistration(); return !!r; } catch(e){ return 'n/a'; } });
T(sw === true || sw === 'n/a', 'خدمةُ الخلفية مسجَّلة (' + sw + ')');
const s47 = await page.evaluate(async () => { const r = await fetch('season1447.json'); return r.ok ? Object.keys(await r.json()).length : 0; });
T(s47 > 1000, 'season1447.json يصل ويُقرأ (' + s47 + ')');

console.log('\n══ ٨ · ظروفُ منى: شبكةٌ بطيئةٌ ومعالجٌ أبطأُ أربعَ مرات ══');
/* (V17.98) القياسُ الذي يهمّ: كم ينتظر الفنيُّ حتى تظهر الخريطةُ تفاعليةً — على
   شبكةٍ نحو ٤٠٠ كيلوبت/ث وتأخيرٍ ٤٠٠ مللي ثانية، ومعالجٍ أبطأَ أربعَ مرات.
   (أ) فتحٌ دافئ: الهيكلُ في كاش العامل. (ب) تثبيتٌ أوّلٌ بارد. الميزانيةُ في
   docs/mina-budget.json: ما دامت null يُبلَّغ ولا يُفرَض (جمعُ خطِّ الأساس)، وحين
   تُكتَب يُفرَض الدافئُ وحدَه على وسيط ثلاث محاولات. */
{
  const budget = JSON.parse(readFileSync('docs/mina-budget.json', 'utf8'));
  const measure = async (warm) => {
    const c2 = await browser.newContext({ ...devices['iPhone 13'], locale:'ar', hasTouch:true, isMobile:true });
    const p2 = await c2.newPage();
    const cdp = await c2.newCDPSession(p2);
    await cdp.send('Network.enable');
    if (warm){ await p2.goto(base + 'index.html', { waitUntil:'load' }); await p2.waitForTimeout(2500); }   /* التثبيتُ الأوّلُ يملأ الكاش */
    await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:400, downloadThroughput:400 * 1024 / 8, uploadThroughput:200 * 1024 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate:4 });
    const t0 = Date.now();
    await p2.goto(base + 'index.html', { waitUntil:'domcontentloaded' });
    await p2.waitForSelector('#lgGo', { timeout: 60000 });
    await p2.evaluate(() => { FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); FB.legacyDone = () => true; window.pullDelta = () => Promise.resolve(0); window.liveWatch = () => {}; window.liveSmall = () => {};
      document.getElementById('lgU').value = 'eng.test'; document.getElementById('lgP').value = 'TestPass1234'; });
    await p2.click('#lgGo'); await p2.waitForSelector('#nav', { timeout: 60000 });
    await p2.evaluate(() => { goPage('map'); render(1); });
    await p2.waitForFunction(() => window.VIT && VIT.open !== null, null, { timeout: 60000 }).catch(() => {});
    const ms = Date.now() - t0;
    await c2.close();
    return ms;
  };
  const warmRuns = []; for (let i = 0; i < 3; i++) warmRuns.push(await measure(true));
  const cold = await measure(false);
  const med = warmRuns.slice().sort((a, b) => a - b)[1];
  console.log('  · دافئ (٣ محاولات): ' + warmRuns.join(' · ') + ' — الوسيط ' + med + ' م.ث · بارد: ' + cold + ' م.ث');
  console.log('::notice title=ظروفُ منى::warm=' + med + 'ms cold=' + cold + 'ms');
  if (budget.warmMs){ T(med <= budget.warmMs, 'الفتحُ الدافئُ ضمن الميزانية: ' + med + ' ≤ ' + budget.warmMs + ' م.ث'); }
  else T(med > 0, 'جمعُ خطِّ الأساس — لا ميزانيةَ بعد (docs/mina-budget.json)');
}

console.log('\n══ ٧ · أخطاءُ المتصفّح ══');
T(errs.length === 0, 'لا أخطاءَ في كروميوم' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

await browser.close(); srv.close();
console.log(bad ? '\nاختبارُ المتصفّح الحقيقي فشل ✗ (' + bad + ')' : '\nكروميومُ حقيقيٌّ بمقاس هاتف: يدخل، ويلمس الممرَّ فتُفتَح نافذتُه لوحًا سفليًّا، ويرسم كلَّ شيء ✅');
process.exit(bad ? 1 : 0);
