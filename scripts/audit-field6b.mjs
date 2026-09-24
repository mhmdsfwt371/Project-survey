/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ميزات الميدان ٦ب — node scripts/audit-field6b.mjs
   ───────────────────────────────────────────────────────────────────────────
   وضعُ الشمس: نسبُ التباين تُحسَب من رموز الجذر نفسِها (النصُّ ≥ ٧:١ والعناصرُ
   ≥ ٤٫٥:١)، والخطُّ +١٥–٢٠٪، ولا يمسُّ ألوانَ الوزارة ولا القاعة. إبقاءُ الشاشة:
   بمحاكي wakeLock — طلبٌ وإطلاقٌ وإعادةٌ وصمتٌ بلا واجهة. المسحُ بالكاميرا:
   بمحاكي BarcodeDetector — الزرُّ لا يظهر بلا دعم، والملءُ والتحذيرُ بالتكرار.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');

console.log('\n══ ١ · وضعُ الشمس: التباينُ من الرموز ══');
const sun = /html\[data-sun="1"\]\{([\s\S]*?)\}/.exec(html)[1];
const tok = {}; for (const m of sun.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] = m[2];
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const pairs = [['ink', 'bg', 7], ['ink', 'surface', 7], ['ink-soft', 'surface', 4.5], ['ink-mute', 'surface', 4.5], ['brand-ink', 'brand', 4.5], ['brand', 'surface', 4.5], ['danger', 'danger-bg', 4.5], ['ok', 'ok-bg', 4.5], ['warn', 'warn-bg', 4.5], ['info', 'info-bg', 4.5], ['sidebar-ink', 'sidebar', 7]];
pairs.forEach(([f, b, min]) => { const r = tok[f] && tok[b] ? cr(tok[f], tok[b]) : 0; T(r >= min, f + ' على ' + b + ': ' + r.toFixed(1) + ':1 ≥ ' + min); });
const fs = /--sun-fs:\s*([\d.]+)px/.exec(sun); const base = /body\{[^}]*font:(\d+)px/.exec(html);
const pct = fs && base ? (parseFloat(fs[1]) / parseInt(base[1], 10) - 1) * 100 : 0;
T(pct >= 15 && pct <= 20, 'والخطُّ +' + pct.toFixed(0) + '٪ (١٥–٢٠)');
T(!/--min-/.test(sun) && /html\[data-sun="1"\] \.btn-primary[^{]*\{min-height:48px/.test(html), 'ولا يمسُّ ألوانَ الوزارة، وأزرارُ الفعل ≥ ٤٨ بكسل');
T(/try \{ sunApply\(\); \} catch \(e\)\{ LS_ERR = e; \}\s*\/\* القاعةُ بلا وضع الشمس/.test(html) && /var on = SUN_ON && !\(typeof KIOSK_ON !== 'undefined' && KIOSK_ON\)/.test(html), 'وشاشةُ القاعة تُطفئه');

async function boot(opts){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(w){
    if (opts.wake){ w.__wake = []; Object.defineProperty(w.navigator, 'wakeLock', { value:{ request: async () => { const l = { released:false, release: async () => { l.released = true; } }; w.__wake.push(l); return l; } }, configurable:true }); }
    if (opts.scan){ w.BarcodeDetector = class { constructor(o){ this.o = o; } static async getSupportedFormats(){ return ['qr_code', 'code_128']; } async detect(){ return [{ rawValue:'SN-ABC-123' }]; } };
      Object.defineProperty(w.navigator, 'mediaDevices', { value:{ getUserMedia: async () => ({ getTracks: () => [{ stop(){ w.__stopped = true; } }] }) }, configurable:true }); }
  } });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  w.HTMLMediaElement.prototype.play = () => Promise.resolve();
  w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1500); w.toast = () => {}; return { w, d, wait, dom };
}

console.log('\n══ ٢ · وضعُ الشمس يعمل ويبقى ══');
{
  const { w, d, wait, dom } = await boot({});
  T(!!d.getElementById('sunTop') && !d.documentElement.hasAttribute('data-sun'), 'زرٌّ في الرأس، والوضعُ مطفأٌ افتراضًا');
  d.getElementById('sunTop').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(50);
  T(d.documentElement.getAttribute('data-sun') === '1' && w.localStorage.getItem('nsk14.sun') === '1', 'ضغطةٌ تشغّله ويُحفَظ للجهاز');
  w.KIOSK_ON = true; w.sunApply(); T(!d.documentElement.hasAttribute('data-sun'), 'وفي القاعة يُطفَأ'); w.KIOSK_ON = false; w.sunApply();
  dom.window.close();
}

console.log('\n══ ٣ · إبقاءُ الشاشة ══');
{
  const { w, d, wait, dom } = await boot({ wake:true });
  w.goPage('svForm'); w.render(1); await wait(60);
  T(w.__wake.length === 1 && w.WAKE.lock && !w.WAKE.lock.released, 'فتحُ نموذج المسح يطلب القفل');
  w.goPage('sites'); w.render(1); await wait(60);
  T(w.__wake[0].released === true && !w.WAKE.lock, 'وإغلاقُه يطلقه');
  w.FORM.site = w.STATE.sites[0].id; w.goPage('forms'); w.PTAB.forms = 'insForm'; w.render(1); await wait(60);
  Object.defineProperty(d, 'hidden', { value:true, configurable:true }); d.dispatchEvent(new w.Event('visibilitychange')); await wait(30);
  T(w.__wake[1].released === true, 'وإخفاءُ الصفحة يطلقه');
  Object.defineProperty(d, 'hidden', { value:false, configurable:true }); d.dispatchEvent(new w.Event('visibilitychange')); await wait(30);
  T(w.__wake.length === 3 && !w.__wake[2].released, 'والعودةُ تعيده' + (w.__wake.length === 3 ? '' : ' — طلبات: ' + w.__wake.length + ' hidden=' + d.hidden + ' CUR=' + w.CUR + ' wanted=' + w.wakeWanted()));
  dom.window.close();
  const { w: w2, dom: dom2, wait: wt2 } = await boot({});
  w2.goPage('svForm'); w2.render(1); await wt2(60);
  T(!w2.WAKE.lock && !w2.LS_ERR, 'وبلا واجهةٍ: صمتٌ بلا خطأ'); dom2.window.close();
}

console.log('\n══ ٤ · المسحُ بالكاميرا ══');
{
  const { w, d, wait, dom } = await boot({});
  const x = w.STATE.sites.find(s => s.type === 'مخيم'); w.FORM.site = x.id; w.goPage('forms'); w.PTAB.forms = 'insForm'; w.render(1); await wait(200);
  T(!d.querySelector('[data-scan]'), 'بلا BarcodeDetector لا زرَّ مسح — والكتابةُ اليدويةُ باقية');
  dom.window.close();
  const { w: w3, d: d3, wait: wt3, dom: dom3 } = await boot({ scan:true });
  const x3 = w3.STATE.sites.find(s => s.type === 'مخيم'); w3.FORM.site = x3.id; w3.goPage('forms'); w3.PTAB.forms = 'insForm'; w3.render(1); await wt3(300); w3.render(1); await wt3(100);
  const sb = d3.querySelector('[data-scan]');
  T(!!sb, 'ومع الدعم يظهر الزرُّ بجوار الحقل');
  const key = sb.getAttribute('data-scan');
  w3.STATE.inss['NSK-X-1'] = { id:'NSK-X-1', status:'مُركّب', serials:{ [key]:'SN-ABC-123' } };
  let said = []; w3.toast = s => said.push(s);
  sb.dispatchEvent(new w3.MouseEvent('click', { bubbles:true })); await wt3(700);
  T(w3.FORM.serials[key] === 'SN-ABC-123' && !w3.SCAN.on && w3.__stopped === true, 'المسحُ يملأ الحقلَ ويُغلق التيّار');
  T(said.some(s => /نقطةٍ أخرى/.test(s) && /NSK-X-1/.test(s)), 'ويُنبَّه أن الرقمَ مسجَّلٌ على نقطةٍ أخرى — ولا يُمنَع');
  T(/it\.sn/.test(html) && /new RegExp\(it\.sn\)/.test(html), 'والصيغةُ تُفحَص إن عرّفها الكتالوج');
  dom3.window.close();
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ ميزات الميدان ٦ب نظيف \u2705'); process.exit(0);
