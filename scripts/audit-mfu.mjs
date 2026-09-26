/* ═══════════════════════════════════════════════════════════════════════════
   جردُ متابعة الوزارة — node scripts/audit-mfu.mjs
   ───────────────────────────────────────────────────────────────────────────
   الصفحةُ بعناوين العرض الأسبوعي، وشاشةُ القاعة انتقلت إليها، والوزارةُ والإدارةُ
   العليا تريانها. المعوقاتُ بفئاتها وجهاتها (والجهةُ تُضبَط)، والشركاتُ بمستوياتها
   والأضعفُ أوّلًا، والسجلّان يُكتَبان في settings/mfu للمكتب وحدَه، والمقارنةُ بلقطة
   الأسبوع الماضي، والمنحنى اليوميّ.
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
const open = async tab => { w.goPage('mfu'); w.render(1); await wait(40); const b = d.querySelector('[data-ptab="mfu:' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120); } return d.getElementById('content'); };

console.log('\n══ ١ · الصفحةُ وعناوينُها ══');
const tabs = w.TABS.mfu.map(x => x[0]);
T(['mfu','mtasks','minst','mcos','mobs','mchal','mreq','mdaily','kiosk'].every(x => tabs.includes(x)), 'عناوينُ العرض الأسبوعي كلُّها: ' + tabs.length);
T(!w.TABS.over.some(x => x[0] === 'kiosk') && w.PARENT.kiosk === 'mfu', 'وشاشةُ القاعة انتقلت إلى متابعة الوزارة');
for (const r of ['viewer', 'exec']){ w.ROLE = r; w.STATE.meta.role = r; }
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
T(w.seesPage('mfu') && ['mcos','mobs','mchal','mreq','kiosk'].every(id => w.tabsOf('mfu').some(tb => tb[0] === id)), 'والوزارةُ تراها بتبويباتها');
T(w.mfuPut('chal', 'X', { t:'x' }) === false, 'ولا تكتب فيها');
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';

console.log('\n══ ٢ · المعوقاتُ وجهاتُها ══');
const camps = w.STATE.sites.filter(x => x.type === 'مخيم' && x.co).slice(0, 6), now = Date.now();
camps.forEach((x, i) => { w.STATE.recs[x.id] = { id:x.id, at:now, by:'أحمد', access: i === 5 ? 'لم يُصل' : 'تم الوصول', chals: i === 0 ? ['العارضة الحديدية ناقصة أو غير مكتملة'] : i === 1 ? ['المدخل غير واضح — لم يُستدل عليه'] : i === 2 ? ['عائق إنشائي'] : [] }; });
w.STATE.inss[camps[3].id] = { id:camps[3].id, status:'مُركّب', at:now, by:'سالم' };
const O = w.mfuObstacles();
T(O.length === 4 && O.some(o => o.cats.includes('تعذّر الوصول')), 'أربعةُ معوقات: ثلاثةُ تحدياتٍ وتعذّرُ وصول — والمركَّبُ ليس عائقًا');
T(w.mfuOwnerOf('العارضة الحديدية ناقصة أو غير مكتملة') === 'كدانة' && w.mfuOwnerOf('المدخل غير واضح — لم يُستدل عليه') === 'أفاقي' && w.mfuOwnerOf('عائق إنشائي') === 'شركة الخدمة', 'الجهاتُ الافتراضية: كدانة وأفاقي وشركة الخدمة');
const ob = await open('mobs');
T(/إجمالي المعوقات/.test(ob.textContent) && ob.querySelectorAll('[data-mfuown]').length >= 3, 'بيانُ المعوقات بفئاته والجهةُ تُضبَط من الجدول');
const sel = ob.querySelector('[data-mfuown]'); const cat = sel.getAttribute('data-mfuown'); sel.value = 'كدانة'; sel.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuOwnerOf(cat) === 'كدانة' && wrote.some(r => r[1] === 'mfu' && r[2].own && r[2].own[cat] === 'كدانة'), 'وتغييرُ الجهة يُحفَظ في settings/mfu');

console.log('\n══ ٣ · الشركات ══');
const C = w.mfuCompanies();
T(C.length > 0 && C.every(c => c.n >= c.ins + c.obs && c.pct >= 0 && c.pct <= 100), 'لكلِّ شركةٍ مستهدفٌ وما رُكّب وعوائقُ ومتبقٍّ ونسبة');
T(w.mfuLevel(80)[0] === 'ممتاز' && w.mfuLevel(50)[0] === 'متوسط' && w.mfuLevel(10)[0] === 'ضعيف', 'والمستوى: ممتاز ٧٥+ · متوسط ٤٠–٧٤ · ضعيف أقل من ٤٠');
const co = await open('mcos');
T(co.querySelectorAll('.mfu-co').length === Math.min(12, C.length) && !!co.querySelector('[data-mfucosall]'), 'الأضعفُ أوّلًا في اثنتي عشرة بطاقة، و«اعرض الكل»');
co.querySelector('[data-mfucosall]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(d.querySelectorAll('.mfu-co').length === C.length, 'واعرض الكلَّ يعرض ' + C.length);

console.log('\n══ ٤ · السجلّان ══');
await open('mchal');
d.getElementById('mcT').value = 'تأخّر الشحنات'; d.getElementById('mcM').value = 'إعادة الجدولة مع المصنع'; d.getElementById('mcO').value = 'المشتريات';
d.querySelector('[data-mfuchal]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const wc = wrote.find(r => r[1] === 'mfu' && r[2].chal);
T(!!wc && Object.values(wc[2].chal)[0].m === 'إعادة الجدولة مع المصنع' && Object.values(wc[2].chal)[0].st === 'مفتوح', 'التحدي بآلية معالجته يُكتَب مفتوحًا');
const st = d.querySelector('[data-mfuchalst]'); st.value = 'مغلق'; st.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuList('chal')[0].st === 'مغلق', 'وحالتُه تتغيّر من الجدول');
await open('mreq');
d.getElementById('mrT').value = 'تركيب إضاءةٍ إرشادية على أبواب المخيمات'; d.getElementById('mrU').value = 'رُكّبت على ١٠٠ مخيم';
d.querySelector('[data-mfureq]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const up = d.querySelector('[data-mfurequ]'); up.value = 'رُكّبت على ١٥٠ مخيم'; up.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.mfuList('req')[0].u === 'رُكّبت على ١٥٠ مخيم', 'وطلبُ الوزارة تُحدَّث إفادتُه من مكانها');
d.querySelector('[data-mfudel^="req|"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(40);
T(w.mfuList('req').length === 0, 'والحذفُ شاهدٌ لا محو');

console.log('\n══ ٥ · الملخّصُ والمقارنةُ والمنحنى ══');
const K = w.mfuKpis();
w.STATE.mfu = w.MFU.v = Object.assign(w.MFU.v || {}, { snap:{ '2000-W01':{ sv:K.sv - 3, ins:K.ins, campIns:K.campIns - 1, corIns:K.corIns, obs:K.obs + 2 } } });
const sm = await open('mfu');
T(/▲ \+[٣3]/.test(sm.textContent) && /▼/.test(sm.textContent) && /عن الأسبوع الماضي/.test(sm.textContent), 'الملخّصُ يقارن بلقطة الأسبوع الماضي: المسحُ ▲ +٣ والمعوقاتُ ▼');
const dl = await open('mdaily');
T(!!dl.querySelector('polyline') && /ملخص التركيبات اليومي/.test(dl.textContent), 'والمنحنى اليوميّ للتركيب والمسح');
const mt = await open('mtasks');
T(/حالة أبرز المهام/.test(mt.textContent) && mt.querySelectorAll('.mfu-bar').length === w.mileList().length, 'وحالةُ أبرز المهام من المعالم بشريط إنجاز');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ متابعة الوزارة نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
