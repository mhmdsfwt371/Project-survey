/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التحكّم في الإشعارات — node scripts/audit-npop.mjs
   ───────────────────────────────────────────────────────────────────────────
   لكلِّ بطاقةٍ عائمةٍ ✕ يغلقها بلا انتقال، والدفعةُ بطاقةٌ واحدةٌ بالعدد، و«كتم ساعة»
   يوقف البطاقاتِ وإشعاراتِ الجهاز، وفي «حسابي» إيقافُ كلٍّ منهما وكتمٌ حتى الغد —
   والجرسُ يعدّ كلَّ شيءٍ دائمًا.
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
await wait(1500); w.toast = () => {};
let sys = 0; w.notifCan = () => true; w.SW_STATE = { reg:{ showNotification(){ sys++; } } };
const pops = () => d.querySelectorAll('#notifPop .notif-pop');

console.log('\n══ ١ · ✕ على كلِّ بطاقة ══');
w.goPage('mfu'); w.render(1); await wait(40);
w.notifPush('زيارة تمّت', 'NSK-MIN-CAM-0014 — بانتظار اعتمادك', { lv:'مهم' });
T(pops().length === 1 && !!pops()[0].querySelector('[data-npopx]'), 'البطاقةُ العائمةُ عليها ✕');
pops()[0].querySelector('[data-npopx]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
T(pops().length === 0 && w.CUR === 'mfu', 'و✕ يغلقها بلا انتقالٍ عن الصفحة');
await wait(3200);

console.log('\n══ ٢ · الدفعةُ بطاقةٌ واحدة ══');
const bell0 = w.notifStore().length;
for (let i = 0; i < 7; i++) w.notifPush('زيارة تمّت', 'NSK-ARF-COR-00' + i + ' — بانتظار اعتمادك', { lv:'عادي' });
T(pops().length === 1 && /٧|7/.test(pops()[0].textContent) && /إشعاراتٍ جديدة/.test(pops()[0].textContent), 'سبعةُ إشعاراتٍ دفعةً: بطاقةٌ واحدةٌ بالعدد لا كومةٌ تغطّي الشاشة');
T(pops()[0].getAttribute('data-p') === 'notif', 'وضغطُها يفتح صفحةَ الإشعارات');
T(w.notifStore().length === bell0 + 7, 'والجرسُ عدّ السبعةَ كلَّها');
await wait(3200);

console.log('\n══ ٣ · كتمُ ساعة ══');
w.notifPush('زيارة تمّت', 'X', { lv:'مهم' }); await wait(20);
const mt = d.querySelector('#notifPop [data-nmute]'); T(!!mt, 'و«كتم ساعة» على البطاقة');
mt.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(20);
sys = 0; w.notifPush('زيارة تمّت', 'Y', { lv:'عاجل' });
T(pops().length === 0 && sys === 0 && +w.localStorage.getItem('nsk14.nmute') > Date.now() + 3500000, 'بعد الكتم: لا بطاقةَ ولا إشعارَ جهازٍ ساعةً كاملة');

console.log('\n══ ٤ · الإعدادات في «حسابي» ══');
w.localStorage.setItem('nsk14.nmute', '0');
w.goPage('acct'); w.render(1); await wait(80);
const card = d.getElementById('content').textContent;
T(/الإشعارات على هذا الجهاز/.test(card) && /متابعة المشروع/.test(card) && /السماح بالإشعارات/.test(card), 'بطاقةُ الإشعارات في حسابي — ومعها طريقُ الإيقاف من إعدادات الآيفون والأندرويد');
d.querySelector('[data-nset="npop"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
w.notifPush('زيارة تمّت', 'Z', { lv:'مهم' });
T(w.localStorage.getItem('nsk14.npop') === '0' && pops().length === 0, 'إيقافُ النوافذ المنبثقة يوقفها');
sys = 0; w.notifPush('زيارة تمّت', 'Z2', { lv:'مهم' });
T(sys === 1, 'وإشعاراتُ الجهاز مستقلّةٌ عنها');
d.querySelector('[data-nset="nsys"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
sys = 0; w.notifPush('زيارة تمّت', 'Z3', { lv:'عاجل' });
T(w.localStorage.getItem('nsk14.nsys') === '0' && sys === 0, 'وإيقافُ إشعارات الجهاز يوقفها');
d.querySelector('[data-nset="tomorrow"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
T(+w.localStorage.getItem('nsk14.nmute') > Date.now() && !!d.querySelector('[data-nset="unmute"]'), '«كتمٌ حتى الغد» يُكتَم، ويظهر «ألغِ الكتم»');
d.querySelector('[data-nset="unmute"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(30);
T(+w.localStorage.getItem('nsk14.nmute') === 0, 'و«ألغِ الكتم» يعيدها');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ التحكّم في الإشعارات نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
