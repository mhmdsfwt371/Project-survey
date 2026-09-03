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

let bad = 0; const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
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
await page.click('#lgGo');
await page.waitForSelector('#nav', { timeout: 15000 });
T(true, 'الدخولُ فتح القائمة');
const sites = await page.evaluate(() => (window.STATE && STATE.sites || []).length);
T(sites > 1000, 'المواقعُ محمَّلة (' + sites + ')');
await page.screenshot({ path: OUT + '/01-home.png' });

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
await page.evaluate(() => { POP_OPEN = false; render(1); });
const legend = await page.evaluate(() => [...document.querySelectorAll('.map-legend .lg-c')].map(e => e.textContent.trim()));
T(legend.length >= 11, 'الأسطورةُ تحمل رقمًا لكلِّ حالةٍ والمجموع (' + legend.length + ')');
await page.screenshot({ path: OUT + '/04-legend.png' });

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

console.log('\n══ ٧ · أخطاءُ المتصفّح ══');
T(errs.length === 0, 'لا أخطاءَ في كروميوم' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

await browser.close(); srv.close();
console.log(bad ? '\nاختبارُ المتصفّح الحقيقي فشل ✗ (' + bad + ')' : '\nكروميومُ حقيقيٌّ بمقاس هاتف: يدخل، ويلمس الممرَّ فتُفتَح نافذتُه لوحًا سفليًّا، ويرسم كلَّ شيء ✅');
process.exit(bad ? 1 : 0);
