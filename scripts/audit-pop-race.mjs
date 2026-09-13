/* ═══════════════════════════════════════════════════════════════════════════
   جردُ نافذة النقطة — node scripts/audit-pop-race.mjs
   ───────────────────────────────────────────────────────────────────────────
   نقرةُ النقطة تفتح النافذةَ، ثم يصل الحدثُ نفسُه إلى معالج المستند الذي
   يُغلق كلَّ لوحٍ نُقر خارجه. وكان الفصلُ بينهما بمهلةٍ زمنيةٍ (ثلاثُ مئةِ
   جزءٍ من الثانية) — فإن أبطأ الرسمُ تجاوزها، ووصل الحدثُ بعدها، فأُغلقت
   النافذةُ قبل أن تُرى: مخيمٌ بمضلّعه عند التقريب، أو قائمةٌ طويلةٌ يُعاد
   بناؤها، أو جهازٌ بطيء (V16.86).
     يُثبَت هنا بالمحاكاة: الحدثُ الذي فتح النافذةَ لا يُغلقها **مهما بطؤ
   الرسم** — يُعرَف بعينه لا بوقته؛ وأن نقرةً أخرى بعدها تُغلقها كما يجب.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 140)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'م. فحص' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

T(typeof w.popOpenAt === 'function', 'فتحُ النافذة في موضعٍ واحدٍ (popOpenAt) — للخريطة المسطّحة والثلاثيّ');
const src = readFileSync('index.html', 'utf8');
T(/POP_EV && POP_EV === e/.test(src), 'ومعالجُ المستند يقارن الحدثَ بعينه');

w.STATE.sites = [{ id:'C1', name:'مخيمُ فحص', zone:'منى', type:'مخيم', lat:21.41, lng:39.89 }];
w.goPage('map'); w.render(1); await wait(200);

/* نقرةٌ حقيقيةٌ على جسم الخريطة: تُعلَّم كما تفعل نقرةُ العلامة، ثم تُطلَق
   إلى المستند بعد «رسمٍ بطيء» يتجاوز المهلة القديمة بكثير */
const target = d.getElementById('mapBox') || d.body;
const ev = new w.MouseEvent('click', { bubbles:true });
w.popOpenAt('C1', { originalEvent:ev });
T(w.POP_OPEN === true && w.POP_SITE === 'C1', 'النقرةُ تفتح نافذةَ النقطة');
w.POP_JUST = Date.now() - 5000;            /* كأنَّ الرسمَ استغرق خمسَ ثوانٍ */
target.dispatchEvent(ev);
await wait(120);
T(w.POP_OPEN === true, 'ويصل الحدثُ نفسُه بعد رسمٍ بطيءٍ (٥ ثوانٍ) — فلا يُغلقها');

/* نقرةٌ تاليةٌ على الخريطة تُغلقها — وإلا لم تُغلَق أبدًا */
const ev2 = new w.MouseEvent('click', { bubbles:true });
w.POP_JUST = Date.now() - 5000;
target.dispatchEvent(ev2);
await wait(120);
T(w.POP_OPEN === false, 'والنقرةُ التاليةُ خارجها تُغلقها كما يجب');

/* والمهلةُ تبقى احتياطًا لمن لا حدثَ أصليَّ له */
w.popOpenAt('C1', null);
T(w.POP_OPEN === true && w.POP_EV === null, 'وفتحٌ بلا حدثٍ أصليٍّ يعتمد المهلةَ كما كان');
d.getElementById('mapBox').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(80);
T(w.POP_OPEN === true, 'فلا تُغلَق داخل المهلة');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ نافذة النقطة فشل ✗ (${bad})` : '\nالحدثُ الذي يفتح النافذةَ لا يُغلقها ✅');
process.exit(bad ? 1 : 0);
