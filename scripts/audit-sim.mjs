/* ═══════════════════════════════════════════════════════════════════════════
   جردُ محاكي الأوزان والتارجت — node scripts/audit-sim.mjs
   ───────────────────────────────────────────────────────────────────────────
   الأوزانُ المقترحةُ تُحسَب على ما سُجّل فعلًا بلا كتابة، والإسقاطُ الشهريُّ
   والحكمُ «يعدّيه؟» صحيحان، و«اعتمد» يكتب الوزنَ لكلِّ مشعرٍ حيٍّ والتارجتَ،
   و«ألغِ الإضافي» يجعل المعاملَ ١ — وللمدير وحدَه.
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id]); };
const now = Date.now();
const camps = w.STATE.sites.filter(x => x.zone === 'منى' && x.type === 'مخيم' && !x.hidden).slice(0, 20), cors = w.STATE.sites.filter(x => x.zone === 'منى' && x.type === 'ممر' && !x.hidden).slice(0, 5);
camps.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: now - (i % 2) * 864e5 - i * 6e5, by:'أحمد', access:'تم الوصول' }; });
cors.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at: now - 864e5 - i * 6e5, by:'أحمد', access:'تم الوصول' }; });
w.statBump();

console.log('\n══ ١ · الحسابُ على ما سُجّل بلا كتابة ══');
w.goPage('perf'); w.render(1); await wait(200);
const setIn = async (sel, v) => { const el = d.querySelector(sel); el.value = String(v); el.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(80); };
await setIn('[data-simw="مخيمات"]', 2); await setIn('[data-simw="ممرات"]', 3); await setIn('[data-simt="target"]', 5000); await setIn('[data-simt="days"]', 26);
const r = w.simRows().find(x => x.name === 'أحمد');
T(r && r.pts === 20 * 2 + 5 * 3 && r.days === 2, 'النقاطُ بالأوزان المقترحة: ٢٠ مخيمًا × ٢ + ٥ ممرات × ٣ = ' + (r && r.pts) + ' في يومين');
T(r && r.perDay === 27.5 && r.month === Math.round(27.5 * 26) && r.pct === 14 && r.over === false, 'وإسقاطُ الشهر ٧١٥ = ١٤٪ من ٥٠٠٠ — لا يعدّيه');
T(wrote.length === 0 && w.cfgGet('w', 'منى|مخيمات') !== 2, 'ولم يُكتَب شيءٌ بعد');
await setIn('[data-simt="target"]', 600);
const r2 = w.simRows().find(x => x.name === 'أحمد');
T(r2.over === true && r2.pct === 119 && /نعم/.test(d.getElementById('content').textContent), 'وبتارجت ٦٠٠ يعدّيه: ١١٩٪ — ويُقال «نعم»');
T(/سقفُ اليوم عند هذا التارجت/.test(d.getElementById('content').textContent) && d.getElementById('content').textContent.includes('٢٠'), 'وسقفُ اليوم يُقال: ٦٠٠ ÷ ٣٠ = ٢٠');

console.log('\n══ ٢ · الاعتمادُ والإضافي ══');
await setIn('[data-simt="target"]', 5000);
d.querySelector('[data-simapply]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(100);
const zs = w.zonesLive();
T(zs.every(z => w.cfgGet('w', z + '|مخيمات') === 2 && w.cfgGet('w', z + '|ممرات') === 3), 'اعتمد: الوزنُ كُتب لكلِّ مشعرٍ حيّ (' + zs.length + ')');
T(w.cfgGet('tgtSurvey') === 5000, 'والتارجتُ الشهري ٥٠٠٠');
d.querySelector('[data-simot]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
T(w.cfgGet('otRate') === 1, 'وألغِ الإضافي: المعاملُ ١');
/* المهندسُ يملك الإعدادات فيضبط؛ المشرفُ لا يرى المحاكيَ أصلًا */
w.ROLE = 'supervisor'; w.STATE.meta.role = 'supervisor'; w.render(1); await wait(100);
T(!d.querySelector('[data-simapply]') && !d.querySelector('[data-simot]'), 'والمشرفُ لا يرى المحاكي');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ المحاكي نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
