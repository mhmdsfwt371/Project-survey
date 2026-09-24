/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خريطة النقاط — node scripts/audit-pointmap.mjs
   ───────────────────────────────────────────────────────────────────────────
   نقطةٌ بإحداثياتٍ خاطئةٍ لا تُصغّر المشعرَ إلى زاوية: تُستثنى من الإطار وتُقال.
   والتكبيرُ بالأزرار والعجلة يغيّر الإطارَ ويصغّر نصفَ القطر فتتباعد النقاط،
   والسحبُ يحرّك، والضغطُ بعد سحبٍ لا يفتح نقطة، والإطارُ يُعاد.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return d.getElementById('content'); };

console.log('\n══ ١ · النقطةُ البعيدةُ لا تُصغّر المشعر ══');
const mina = w.STATE.sites.filter(x => x.zone === 'منى' && +x.lat && +x.lng);
const spanBefore = (() => { const la = mina.map(x => +x.lat), lo = mina.map(x => +x.lng); return [Math.max(...la) - Math.min(...la), Math.max(...lo) - Math.min(...lo)]; })();
w.STATE.sites.push({ id:'NSK-MIN-CMP-9999', name:'نقطةٌ ضالّة', zone:'منى', type:'مخيم', lat:21.6, lng:39.6 });   /* ~٤٠ كم بعيدًا */
w.SITE_IX = null; w.statBump();
const G = w.geoOutliers(w.STATE.sites.filter(x => x.zone === 'منى' && +x.lat && +x.lng));
T(G.far.length === 1 && G.far[0].id === 'NSK-MIN-CMP-9999' && G.core.length === mina.length, 'النقطةُ على بُعد كيلومترات تُعَدُّ بعيدةً وحدَها: ' + G.far.length + ' من ' + (mina.length + 1));
await open('over', 'kiosk'); await wait(1300);
const svg = d.querySelector('.kk-pts');
T(!!svg && svg.querySelectorAll('circle').length === mina.length, 'ولا تُرسَم فيبقى الإطارُ على جسم المشعر: ' + svg.querySelectorAll('circle').length + ' دائرة');
const xs = [...svg.querySelectorAll('circle')].map(c => +c.getAttribute('cx')), ys = [...svg.querySelectorAll('circle')].map(c => +c.getAttribute('cy'));
T((Math.max(...xs) - Math.min(...xs)) > 900 || (Math.max(...ys) - Math.min(...ys)) > 250, 'والنقاطُ تملأ الإطارَ لا زاويةً منه: عرض ' + Math.round(Math.max(...xs) - Math.min(...xs)) + ' من ١٠٠٠');
const c = d.getElementById('content').textContent;
T(/بعيدةٍ عن المشعر/.test(c) && /NSK-MIN-CMP-9999/.test(c) && !!d.querySelector('[data-goto="dq"]'), 'وتُقال بمعرِّفها وزرِّ تصحيح البيانات');

console.log('\n══ ٢ · التكبيرُ والسحبُ ══');
const vb0 = svg.getAttribute('viewBox'), r0 = +svg.querySelector('circle').getAttribute('r');
d.querySelector('[data-pmz="in"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(50);
const svg2 = d.querySelector('.kk-pts'), vb1 = svg2.getAttribute('viewBox'), r1 = +svg2.querySelector('circle').getAttribute('r');
T(vb1 !== vb0 && +vb1.split(' ')[2] < +vb0.split(' ')[2] && r1 < r0, 'زرُّ التكبير يصغّر الإطارَ ونصفَ القطر: ' + vb0.split(' ')[2] + '→' + vb1.split(' ')[2] + ' · r ' + r0 + '→' + r1);
T(d.getElementById('pmZoom').textContent.includes('١٫٦') || d.getElementById('pmZoom').textContent.includes('1.6'), 'ويُقال مقدارُ التكبير');
w.pmZoomAt(2, 0.9, 0.9);
T(w.PM_VIEW.cx > 0.5 && w.PM_VIEW.cy > 0.5, 'والتكبيرُ حول نقطةٍ يثبتها تحت الإصبع (المركزُ يتحرك نحوها)');
const Ev = w.PointerEvent || w.MouseEvent;
const mk = (type, x, y, id) => { const e = new Ev(type, { bubbles:true, clientX:x, clientY:y }); try { Object.defineProperty(e, 'pointerId', { value:id }); } catch {} return e; };
svg2.getBoundingClientRect = () => ({ left:0, top:0, width:1000, height:600 });
const cx0 = w.PM_VIEW.cx;
svg2.dispatchEvent(mk('pointerdown', 500, 300, 1)); d.dispatchEvent(mk('pointermove', 400, 300, 1)); d.dispatchEvent(mk('pointerup', 400, 300, 1)); await wait(20);
T(w.PM_VIEW.cx > cx0, 'والسحبُ يحرّك الإطار');
const before = w.CUR; svg2.querySelector('circle').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
T(w.CUR === before, 'والضغطُ فورَ السحب لا يفتح نقطة');
d.querySelector('[data-pmz="reset"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
T(w.PM_VIEW.z === 1 && w.PM_VIEW.cx === 0.5, 'وإعادةُ الإطار تعيده');
svg2.dispatchEvent(new w.WheelEvent('wheel', { bubbles:true, cancelable:true, deltaY:-100, clientX:500, clientY:300 })); await wait(20);
T(w.PM_VIEW.z > 1, 'والعجلةُ تكبّر');
console.log('\n══ ٣ · وتصحيحُ البيانات يحصرها ══');
T(w.dqFar().length === 1 && w.dqFar()[0].id === 'NSK-MIN-CMP-9999', 'dqFar تحصر النقطةَ البعيدةَ لكلِّ مشعر');
w.goPage('dq'); w.render(1); await wait(150);
const dq = d.getElementById('content');
T(/نقاطٌ بعيدةٌ عن مشعرها/.test(dq.textContent) && !!dq.querySelector('[data-site="NSK-MIN-CMP-9999"]'), 'وبطاقةٌ في تصحيح البيانات تفتحها لتُصحَّح');
w.STATE.sites.pop(); w.SITE_IX = null; w.statBump();

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ خريطة النقاط نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
