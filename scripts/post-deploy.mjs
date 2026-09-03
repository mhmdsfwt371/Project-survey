/* ═══════════════════════════════════════════════════════════════════════════
   فحصُ ما بعد النشر — node scripts/post-deploy.mjs
   ───────────────────────────────────────────────────────────────────────────
   الحرّاسُ السبعةُ والعشرون تفحص ما في المستودع. وهذا يفحص ما وصل الناسَ
   فعلًا: يجلب الملفَّ من عنوان النشر، ويتحقّق أن النسخةَ التي وصلت هي
   التي دُفعت (لا نسخةً قديمةً علقت في مخبأ)، ثم يُقلع الملفَّ الحيَّ في
   متصفّحٍ صوريٍّ ويدخل ويفتح كلَّ شاشةٍ وشريحةٍ بكلِّ دور — فإن انكسر شيءٌ
   بين المستودع والهاتف قال أين.
   يعمل بعد كلِّ دفعةٍ، وكلَّ ستِّ ساعاتٍ حارسًا على الخدمة، وبطلب.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const PAGES = process.env.NSK_URL || 'https://mhmdsfwt371.github.io/-Project-survey/';
const RAW   = 'https://raw.githubusercontent.com/mhmdsfwt371/-Project-survey/main/';
const want  = (/const CACHE = 'nusuk-survey-(v[\d.]+)'/.exec(readFileSync('sw.js','utf8')) || [])[1];
if (!want){ console.log('✗ لا نسخةَ في sw.js المحلي'); process.exit(1); }
console.log('النسخةُ المتوقَّعة:', want);

let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const get = async (u) => {
  const r = await fetch(u, { headers:{ 'cache-control':'no-cache' } });
  if (!r.ok) throw new Error(u + ' → ' + r.status);
  return r.text();
};

/* ١ · انتظارُ النشر: الصفحاتُ تُبنى بعد الدفع بدقيقةٍ أو دقائق */
let live = '', base = PAGES, tries = 0;
const maxTries = +(process.env.NSK_TRIES || 18);
while (tries++ < maxTries){
  try {
    live = (/const CACHE = 'nusuk-survey-(v[\d.]+)'/.exec(await get(base + 'sw.js?t=' + Date.now())) || [])[1] || '';
    if (live === want) break;
    console.log('   محاولة ' + tries + ': الحيُّ ' + (live || '—') + ' والمتوقَّعُ ' + want + ' — انتظار…');
  } catch (e){
    console.log('   محاولة ' + tries + ': ' + String(e.message).slice(0, 80));
    if (tries === 3 && base === PAGES && process.env.NSK_FALLBACK_RAW === '1'){ base = RAW; console.log('   → المصدرُ الخام'); }
  }
  await new Promise(r => setTimeout(r, +(process.env.NSK_WAIT_MS || 20000)));
}
console.log('\n══ ١ · النسخةُ التي وصلت ══');
T(live === want, 'sw.js الحيُّ على النسخة المدفوعة (' + (live || '—') + ')');
if (live !== want){ console.log('\nفحصُ ما بعد النشر فشل ✗ — النشرُ لم يصل أو علق في المخبأ'); process.exit(1); }

const html = await get(base + 'index.html?t=' + Date.now());
T(html.indexOf('نسخة V' + want.slice(1)) > -1, 'index.html الحيُّ يحمل النسخةَ نفسَها في رأسه');
T(html.length > 500000, 'الملفُّ كاملٌ لا مقطوع (' + Math.round(html.length / 1024) + ' ك.ب)');

/* ٢ · الملفُّ الحيُّ يُقلع ويدخل ويرسم كلَّ شاشة */
console.log('\n══ ٢ · الإقلاعُ من الملف الحيّ ══');
const { JSDOM, VirtualConsole } = require('jsdom');
const errs = []; const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) errs.push(String(e.message).slice(0, 120)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:base, virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
w.fetch = () => Promise.reject(new Error('no network in smoke'));
await new Promise(r => setTimeout(r, 900));
T(!!d.getElementById('lgGo'), 'شاشةُ الدخول ظهرت');
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));
T(!!d.getElementById('content') && !!d.getElementById('nav'), 'الدخولُ يفتح المحتوى والقائمة');
T((w.STATE && w.STATE.sites || []).length > 1000, 'المواقعُ محمَّلة (' + ((w.STATE && w.STATE.sites || []).length) + ')');

const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a => a.getAttribute('data-p'))
  .flatMap(id => (w.TABS && w.TABS[id]) ? w.TABS[id].map(t => t[0]) : [id]))];
let drawn = 0, blank = [], thrown = [];
for (const role of ['engineer','supervisor','tech','viewer']){
  w.ROLE = role; if (w.STATE && w.STATE.meta) w.STATE.meta.role = role;
  for (const id of ids){
    if (!w.seesPage(w.PARENT && w.PARENT[id] || id)) continue;
    try { w.goPage(id); w.render(1); drawn++; }
    catch (e){ thrown.push(id + '@' + role + ': ' + String(e.message).slice(0, 60)); continue; }
    /* الخريطةُ لوحُ رسمٍ لا نصّ — تُقاس بوجود حاويتها لا بطول نصِّها */
    const len = id === 'map'
      ? (d.getElementById('mapBox') ? 999 : 0)
      : (d.getElementById('content').textContent || '').trim().length;
    if (len < 40) blank.push(id + '@' + role);
  }
}
T(drawn > 100, 'رُسمت الشاشاتُ والشرائحُ بكلِّ دور (' + drawn + ' رسمة)');
T(thrown.length === 0, 'لا شاشةَ تنفجر' + (thrown.length ? ' — ' + thrown.slice(0, 3).join(' | ') : ''));
T(blank.length === 0, 'لا شاشةَ فارغة' + (blank.length ? ' — ' + blank.slice(0, 4).join(' | ') : ''));
T(errs.length === 0, 'لا أخطاءَ متصفّحٍ في الإقلاع والرسم' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

/* ٣ · الملفّاتُ المصاحبة تصل */
console.log('\n══ ٣ · الملفّاتُ المصاحبة ══');
for (const f of ['manifest.json','season1447.json']){
  try { const t = await get(base + f + '?t=' + Date.now()); T(t.length > 50, f + ' يصل (' + Math.round(t.length / 1024) + ' ك.ب)'); }
  catch (e){ T(false, f + ' — ' + String(e.message).slice(0, 60)); }
}

console.log(bad ? '\nفحصُ ما بعد النشر فشل ✗ (' + bad + ')' : '\nما وصل الناسَ هو ما دُفع، ويُقلع ويرسم بكلِّ دور ✅');
process.exit(bad ? 1 : 0);
