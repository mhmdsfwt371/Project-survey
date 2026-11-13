/* ═══════════════════════════════════════════════════════════════════════════
   QA pass of V47.1 — node scripts/audit-qa472.mjs
   ───────────────────────────────────────────────────────────────────────────
   What the full-system review found, held so it cannot come back: «copied» is said only after the clipboard
   accepted the text; a burst of failed pulls is one notice; the page-Excel arrow shows only where there is
   something to export; the assistant answers the technical-visit and late-visit questions from the lifecycle;
   the technician has directives of his own; no developer path reaches a user message.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = (await appHtml());
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const said = []; w.toast = s => { said.push(String(s)); };
const setClip = v => Object.defineProperty(w.navigator, 'clipboard', { value:v, configurable:true });

console.log('\n══ ١ · النسخ يقول «نُسخ» بعد أن يُنسخ فعلًا ══');
setClip({ writeText:() => Promise.resolve() }); said.length = 0; w.nskCopy('abc', 'OK-1'); await wait(30);
T(said.length === 1 && said[0] === 'OK-1', 'الحافظة قبلت النص: رسالة النجاح');
d.execCommand = () => false;
setClip({ writeText:() => Promise.reject(new Error('denied')) }); said.length = 0; w.nskCopy('abc', 'OK-2'); await wait(30);
T(said.length === 1 && said[0] !== 'OK-2', 'الحافظة رفضت: لا يقال «نُسخ» — ' + said[0]);
let fb = 0; said.length = 0; w.nskCopy('abc', 'OK-3', () => { fb++; }); await wait(30);
T(fb === 1 && !said.length, 'ومن له بديل (عرض النص نفسه) ينادى بديله');
setClip(undefined); d.execCommand = () => true; said.length = 0; w.nskCopy('abc', 'OK-4'); await wait(30);
T(said[0] === 'OK-4', 'جهاز قديم بلا الحافظة الحديثة: المسار البديل ينسخ');
const src = readFileSync('index.html', 'utf8') + readFileSync('app-office.js', 'utf8');
T(!/clipboard\.writeText\([^)]*\);\s*toast\(/.test(src), 'لا موضع ينسخ ثم يقول «نُسخ» دون انتظار النتيجة');

console.log('\n══ ٢ · فشل السحب دفعة واحدة = إشعار واحد ══');
Object.keys(w.SOFT_SAID).forEach(k => delete w.SOFT_SAID[k]); said.length = 0;
for (let i = 0; i < 8; i++) w.softErr('سحب تجربة ' + i, { code:'unavailable' }, 'تعذّر سحبُ الفرق — قد تظهر بذورها الأصلية فقط');
await wait(1800);
T(said.length === 1, 'ثمانية أعطال سحب متتالية: إشعار واحد (' + said.length + ')');
said.length = 0; w.softErr('سحب منفرد', { code:'unavailable' }, 'تعذّر سحبُ الكتالوج — قد تظهر أصنافه الأصلية فقط'); await wait(1800);
T(said.length === 1 && said[0] === w.t('تعذّر سحبُ الكتالوج — قد تظهر أصنافه الأصلية فقط'), 'وعطل واحد يبقى بنصه الدقيق');
said.length = 0; w.softErr('رفع تجربة', { code:'x' }, 'تعذّر تحميلُ مكتبة إكسل');
T(said.length === 1, 'وما ليس سحبا يقال في لحظته');

console.log('\n══ ٣ · سهم إكسل الصفحة حيث يوجد ما يصدَّر ══');
const has = p => { w.goPage(p); w.render(1); return !!d.querySelector('#content [data-xlspage]'); };
const pages = Object.keys(w.PAGE).filter(p => { try { return !w.PAGE[p].full && w.seesPage(p); } catch (e){ return false; } });
let wrong = [];
pages.forEach(p => { try { const b = has(p); const any = !!d.querySelector('#content .list > *') || [...d.querySelectorAll('#content table')].some(tb => tb.querySelectorAll('tr').length > 1); if (b && !any) wrong.push(p); } catch (e){ /* a page that needs the chunk's data is not this audit's subject */ } });
T(pages.length > 10 && !wrong.length, 'لا صفحة تعرض السهم بلا جدول ولا قائمة (' + pages.length + ' صفحة)' + (wrong.length ? ' — ' + wrong.join('، ') : ''));
T(pages.some(p => has(p)), 'والسهم باق حيث توجد جداول');

console.log('\n══ ٤ · المساعد يجيب من دورة النقطة ══');
const A = q => w.aqAnswer(q) || '';
const a1 = A('نقاط تحتاج زيارة تقنية'), a2 = A('مين متأخر في الزيارات؟'), a3 = A('المهام المتأخرة');
T(a1.indexOf(w.t('نقاط تحتاج زيارة أخرى')) > -1 && a1.indexOf(w.t('مُركّبة')) < 0, '«نقاط تحتاج زيارة تقنية» ← بطاقتها لا التقدم العام');
T(a2.indexOf(w.t('الزيارات المتأخرة')) > -1 && a2.indexOf(w.t('المهام الأسبوعية')) < 0, '«مين متأخر في الزيارات؟» ← الزيارات لا المهام');
T(a3.indexOf(w.t('المهام الأسبوعية')) > -1, 'و«المهام المتأخرة» تبقى بطاقة المهام');
const tech = w.STATE.sites.filter(x => w.lifeOf(x) === 'tech').length, stuck = w.STATE.sites.filter(x => w.lifeOf(x) === 'stuck').length;
T(a1.indexOf('>' + w.nm(tech) + '<') > -1 && a1.indexOf('>' + w.nm(stuck) + '<') > -1, 'والعدد هو عدد الخريطة نفسه (lifeOf): ' + tech + ' · ' + stuck);
w.ROLE = 'viewer'; const a4 = A('مين متأخر في الزيارات؟') + A('نقاط تحتاج زيارة تقنية'); w.ROLE = 'engineer';
T(a4.indexOf(w.t('أعادها المهندس لزيارة أخرى')) < 0 && !/متعذّر|تصريح/.test(a4), 'والوزارة ترى الأعداد وحدها — بلا أسماء ولا «أعادها» ولا «متعذّر»');

console.log('\n══ ٥ · للفني توجيهاته ══');
const me = w.STATE.meta.name, s0 = w.STATE.sites.filter(x => w.lifeOf(x) === 'todo')[0];
w.STATE.tasks['qa472'] = { id:'qa472', site:s0.id, kind:'visit', to:me, status:'مُسند', at:Date.now() }; if (typeof w.statBump === 'function') w.statBump(); w.TK_IX = null;
w.ROLE = 'tech'; const b1 = w.brainBriefHtml(); w.ROLE = 'engineer';
T(b1.indexOf(w.t('نقاط مسندة إليك تنتظر الزيارة')) > -1, 'نقطة مسندة إليه تظهر توجيها باسمها');
delete w.STATE.tasks['qa472']; if (typeof w.statBump === 'function') w.statBump();

console.log('\n══ ٦ · لا مسار للمطور في رسالة للمستخدم، والتقسيم من عائلة واحدة ══');
T(!/انظر docs\//.test(src), 'لا «انظر docs/…» في نص يراه المستخدم');
T(w.PV.BENTO_C.indexOf('#7FB2E5') < 0, 'اللون الرابع في التقسيم ليس الأزرق');
T(/QA pass of every page in both skins/.test(readFileSync('src/00-shell/00-head.html', 'utf8')), 'رقعة التباين ومساحات اللمس في التنسيق');

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصا'));
process.exit(fails.length ? 1 : 0);
