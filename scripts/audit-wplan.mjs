/* ═══════════════════════════════════════════════════════════════════════════
   جردُ خطة الأسبوع — node scripts/audit-wplan.mjs
   ───────────────────────────────────────────────────────────────────────────
   للمهندس وحدَه: يراها ويكتبها، ولا يراها المشرفُ ولا الوزارة. النقطةُ بعنوانها
   وتفاصيلها وخطواتها (قائمةُ تحقّق تُتمّ النقطةَ حين تكتمل) ومتطلباتها ونتيجتها،
   تُحفَظ في settings/pmo بأسبوعها، وتصير مهمةً أسبوعيةً، وتُرحَّل، وتُصدَّر.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };
const open = async () => { w.goPage('plan'); w.render(1); await wait(40); const b = d.querySelector('[data-ptab="plan:wplan"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120); } return d.getElementById('content'); };

console.log('\n══ ١ · للمهندس وحدَه ══');
T(w.tabsOf('plan').some(tb => tb[0] === 'wplan'), 'المهندسُ يرى «خطة الأسبوع» في التخطيط');
for (const r of ['supervisor', 'viewer']){ w.ROLE = r; w.STATE.meta.role = r; if (w.tabsOf('plan').some(tb => tb[0] === 'wplan') || w.wplanSees()) fails.push('يراها ' + r); }
T(!fails.length, 'ولا يراها المشرفُ ولا الوزارة');
w.ROLE = 'exec'; w.STATE.meta.role = 'exec';
T(w.wplanSees() && !w.wplanMay() && w.tabsOf('plan').some(tb => tb[0] === 'wplan'), 'والإدارةُ العليا تراها ولا تكتب فيها (V21.3)');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٢ · النقطةُ بتفاصيلها ══');
let c = await open();
T(/نقطةٌ جديدة في خطة الأسبوع/.test(c.textContent) && /هذا الأسبوع/.test(c.textContent) && /الأسبوع القادم/.test(c.textContent), 'نموذجُ النقطة وأسبوعان جاهزان');
d.getElementById('wpT').value = 'تركيب ممرات عرفات — المرحلة الأولى'; d.getElementById('wpP').value = 'عالية'; d.getElementById('wpN').value = 'البدء من الممرات الشرقية';
d.getElementById('wpS').value = 'حصر الممرات\nتجهيز العوارض\nالتركيب'; d.getElementById('wpR').value = '٤٠ عارضة · فريقان'; d.getElementById('wpG').value = '٦٠ ممرًّا مركَّبًا';
d.querySelector('[data-wpsave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const it = w.pmoList('wplan')[0];
T(!!it && it.wk === w.mfuWeekKey() && it.pri === 'عالية' && /حصر الممرات/.test(it.steps) && it.goal === '٦٠ ممرًّا مركَّبًا' && wrote.some(r => r[1] === 'pmo' && r[2].wplan), 'تُحفَظ في settings/pmo بأسبوعها وأولويتها وخطواتها ونتيجتها');
c = await open();
T(c.querySelectorAll('[data-wpstep]').length === 3 && /الاحتياجات والمتطلبات/.test(c.textContent) && /٦٠ ممرًّا مركَّبًا/.test(c.textContent), 'وتُعرَض بطاقةً بخطواتها الثلاث ومتطلباتها ونتيجتها');

console.log('\n══ ٣ · الخطواتُ قائمةُ تحقّق ══');
for (let i = 0; i < 3; i++){ const cb = d.querySelector('[data-wpstep="' + it.id + '|' + i + '"]'); cb.checked = true; cb.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40); }
T(w.pmoList('wplan')[0].st !== 'تم' && (w.pmoList('wplan')[0].sdone || []).filter(Boolean).length === 3 && w.WPLAN_ACT && w.WPLAN_ACT.kind === 'result', 'اكتمالُ الخطوات لا يُتمّ النقطةَ — يطلب النتيجةَ الفعلية (V21.3)');
c = await open(); d.getElementById('wpAct').value = 'رُكّب ٦٢ ممرًّا بلا عوائق'; d.querySelector('[data-wpact="' + it.id + '|result"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const dn = w.pmoList('wplan').find(x => x.id === it.id);
T(dn.st === 'تم' && dn.result === 'رُكّب ٦٢ ممرًّا بلا عوائق' && dn.hist[0].f === 'result', 'وتسجيلُ النتيجة يُتمّها بنتيجتها المكتوبة');

console.log('\n══ ٤ · مهمةٌ أسبوعيةٌ وترحيلٌ وتصدير ══');
d.getElementById('wpT').value = 'اجتماع مع كدانة'; d.getElementById('wpS').value = ''; d.querySelector('[data-wpsave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const it2 = w.pmoList('wplan').find(x => x.t === 'اجتماع مع كدانة');
c = await open(); d.querySelector('[data-wptask="' + it2.id + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const tk = w.wtRows().find(r => r.plan === 'P:' + it2.id);
T(!!tk && tk.track === 'خطة الأسبوع' && w.pmoList('wplan').find(x => x.id === it2.id).task == tk.id, '«＋ مهمة أسبوعية» تُنشئ مهمةً مربوطةً بالنقطة');
c = await open(); d.querySelector('[data-wpnext="' + it2.id + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
T(w.pmoList('wplan').find(x => x.id === it2.id).wk === w.wplanNextWeek(w.mfuWeekKey()), 'و«رحّل للأسبوع القادم» ينقلها');
const sheet = w.SHEETS.wplan();
T(sheet.length === 2 && sheet[1][1] === 'تركيب ممرات عرفات — المرحلة الأولى' && sheet[1][6] === '3/3' && sheet[1][9] === 'رُكّب ٦٢ ممرًّا بلا عوائق', 'وإكسلُ الأسبوع بنقاطه وخطواته ونتيجته');

console.log('\n══ ٥ · تحديثٌ وإغلاقٌ ببديل، وأسابيعُ سابقةٌ بلا إغلاق (V21.3) ══');
d.getElementById('wpT').value = 'تجربة عوارض بديلة'; d.getElementById('wpS').value = ''; d.querySelector('[data-wpsave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const it3 = w.pmoList('wplan').find(x => x.t === 'تجربة عوارض بديلة');
c = await open(); d.querySelector('[data-wpdo="' + it3.id + '|upd"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
d.getElementById('wpAct').value = 'جُرّبت عارضتان — ننتظر عيّنةً ثالثة'; d.querySelector('[data-wpact="' + it3.id + '|upd"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const u3 = w.pmoList('wplan').find(x => x.id === it3.id);
T(u3.st === 'بانتظار تجارب' && u3.hist[0].f === 'upd' && /عيّنةً ثالثة/.test(u3.hist[0].v), '«تحديث» يسجّل ما حدث ويجعلها «بانتظار تجارب»');
c = await open(); d.querySelector('[data-wpdo="' + it3.id + '|close"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
d.getElementById('wpAct').value = 'العوارضُ البديلةُ لا تناسب الأعمدة'; d.querySelector('[data-wpact="' + it3.id + '|close"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
const c3 = w.pmoList('wplan').find(x => x.id === it3.id);
T(c3.st === 'مغلق' && /لا تناسب/.test(c3.closeWhy) && !!d.getElementById('wpT') && /بدلًا من: تجربة عوارض بديلة/.test(d.getElementById('wpN').value), '«إغلاق» بسببه — ونموذجُ نقطةٍ جديدةٍ بدلها مُعبَّأ');
w.pmoPut('wplan', 'OLD1', { wk:'2026-W30', t:'نقطةٌ من أسبوعٍ فات', st:'جارٍ', at:Date.now() - 30 * 864e5 });
w.WPLAN_WK = ''; c = await open();
T(/من أسابيع سابقة بلا نتيجةٍ ولا إغلاق/.test(c.textContent) && /نقطةٌ من أسبوعٍ فات/.test(c.textContent) && !!c.querySelector('[data-wpdo="OLD1|result"]'), 'وما بقي من أسبوعٍ سابقٍ بلا نتيجةٍ ولا إغلاقٍ يظهر أوّلَ الأسبوع الحاليِّ بأزراره');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ خطة الأسبوع نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
