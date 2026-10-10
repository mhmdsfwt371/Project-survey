/* ═══ حدُّ السرعة في البوابة (V37.24 — المرحلةُ ١) ═══
   «نحط حدود سرعة ونقيسها، والبوابة ترفض أي نسخة تكسرها». يُحمَّل التطبيقُ بحجم الميدان الحقيقيِّ (١٬٩٥١ زيارةً بملاحظاتها، و٣٬٧٠٠ وثيقةَ صورة
   لدور المكتب) ويُقاس: رسمُ صفحة المتابعة، وفتحُ قائمةٍ منها، ورسمُ الخريطة. السقوفُ لمشغّل البوابة (أبطأُ من جهاز المكتب) — ما يتجاوزها يُرفَض. */
import { createServer } from 'http'; import { existsSync, statSync, createReadStream } from 'fs'; import { join, extname } from 'path'; import { createRequire } from 'module';
const req = createRequire(import.meta.url);
let chromium; try { ({ chromium } = await import('playwright')); } catch (e){ ({ chromium } = req('/home/claude/shot/pw-shim.cjs')); }
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json' };
const srv = createServer((rq, res) => { const p = join(process.cwd(), decodeURIComponent(rq.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if (!existsSync(p) || statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); createReadStream(p).pipe(res); });
await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const LIMIT = { mfu:900, list:500, map:2500 };   /* م.ث على مشغّل البوابة */
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport:{ width:1300, height:900 }, locale:'ar', serviceWorkers:'block' });
await ctx.route(/tile\.openstreetmap|arcgisonline|carto|openfreemap|gstatic|googleapis|firebase|drive\.google/, r => r.abort());
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil:'domcontentloaded' }); await page.waitForSelector('#lgGo', { timeout: 60000 });
await page.evaluate(() => { noTashkeel.force = true; FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); FB.legacyDone = () => true; window.pullDelta = () => Promise.resolve(0); window.liveWatch = () => {}; window.liveSmall = () => {}; document.getElementById('lgU').value = 'a'; document.getElementById('lgP').value = 'TestPass1234'; });
await page.click('#lgGo'); await page.waitForSelector('#nav', { timeout: 60000 });
const r = await page.evaluate(async () => { try { tourEnd(false); } catch (e){} const wait = ms => new Promise(r => setTimeout(r, ms)); const now = Date.now();
  const S = STATE.sites; const CH = ['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا', 'العارضة ناقصة أو عليها ديكور أو لافتات', 'مداخل متعددة أو مدخل مشترك', 'لا توجد تحديات'];
  S.forEach((x, i) => { if (i % 40 === 7) STATE.recs[x.id] = { id:x.id, by:'فني ' + (i % 5), at:now - (i % 14) * 864e5, access:'غير موجود', why:'missing', note:'' };
    else STATE.recs[x.id] = { id:x.id, by:'فني ' + (i % 5), at:now - (i % 14) * 864e5, access:'تم الوصول', chals:[CH[i % 4]], note:i % 9 ? 'ملاحظة ميدانية عن المدخل والعارضة ' + i : '', photos:['site', 'mount'], review:i % 3 ? 'pending' : 'approved' }; });
  STATE.photos = {}; let k = 0; S.forEach((x, i) => { for (let j = 0; j < (i % 2 ? 2 : 1); j++) STATE.photos[x.id + '-' + (++k)] = { site:x.id, kind:'site', driveId:'d', link:'#', at:now - j }; });
  STATE.meta.phFull = now; statBump();
  const med = a => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];
  const T = async (fn, n) => { const L = []; for (let i = 0; i < n; i++){ const t0 = performance.now(); await fn(); L.push(performance.now() - t0); await wait(30); } return Math.round(med(L)); };
  goPage('mfu'); PTAB.mfu = 'mfu'; render(1); await wait(100);
  const mfu = await T(() => render(1), 4);
  const list = await T(async () => { document.querySelector('[data-svlist="sv"]').click(); await wait(0); const c = document.querySelector('[data-svpopclose]'); c && c.click(); }, 3);
  goPage('map'); render(1); await wait(200); const map = await T(() => render(1), 3);
  return { sites:S.length, recs:Object.keys(STATE.recs).length, photos:Object.keys(STATE.photos).length, mfu, list, map }; });
await browser.close(); srv.close();
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
console.log(`حجمُ الميدان: ${r.sites} نقطة · ${r.recs} زيارة · ${r.photos} صورة`);
T(r.mfu <= LIMIT.mfu, `رسمُ صفحة المتابعة ≤ ${LIMIT.mfu} م.ث`, r.mfu + ' م.ث');
T(r.list <= LIMIT.list, `فتحُ قائمةٍ منها ≤ ${LIMIT.list} م.ث`, r.list + ' م.ث');
T(r.map <= LIMIT.map, `رسمُ صفحة الخريطة ≤ ${LIMIT.map} م.ث`, r.map + ' م.ث');
T(errs.length === 0, 'بلا أخطاءٍ في الصفحة', errs.slice(0, 2).join(' | '));
console.log(bad ? `\nحدُّ السرعة فشل ✗ (${bad})` : '\nالسرعةُ داخل الحدود ✅'); if (bad) process.exit(1);
