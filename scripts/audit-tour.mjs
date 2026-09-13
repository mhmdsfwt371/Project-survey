/* ═══════════════════════════════════════════════════════════════════════════
   جردُ جولة البداية — node scripts/audit-tour.mjs
   ───────────────────────────────────────────────────────────────────────────
   من يفتح النظامَ أوّلَ مرةٍ لا يعرف من أين يبدأ (V17.0). يُثبَت هنا: الجولةُ
   تُفتَح بنفسها أوّلَ دخولٍ لكلِّ حسابٍ ولا تُعاد بعد إنهائها؛ وخطواتُها
   **شاشاتُ صاحب الحساب وحدَه** بترتيب يومه — لا شاشاتِ غيره ولا صفحاتٍ
   تُفتَح من غيرها؛ ولكلِّ خطوةٍ سطرٌ يقول ما تفعله الشاشة، وبندُها يُضاء في
   القائمة، وزرٌّ يأخذه إليها؛ ولكلِّ صفحةٍ في النظام سطرُ تعريفٍ يصلح خطوةً.
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'tech', name:'فنيُّ الميدان' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };

/* ١ · تُفتَح بنفسها أوّلَ دخول */
T(w.TOUR_OPEN === true && !!d.getElementById('tourSheet'), 'تُفتَح بنفسها أوّلَ دخولٍ لهذا الحساب');
T(!!d.querySelector('#tourSheet .actions [data-tourgo]'), 'ولكلِّ خطوةٍ زرٌّ يأخذه إلى الشاشة');

/* ٢ · خطواتُها شاشاتُه هو */
const steps = w.tourPages();
T(steps.length > 2 && steps.length <= 8, 'خطواتٌ معدودةٌ لا سردٌ طويل: ' + steps.length);
T(steps.every(id => w.seesRaw(id)), 'وكلُّها شاشاتٌ يراها صاحبُ الحساب');
T(!steps.some(id => ['site', 'sel', 'svappr', 'minappr'].indexOf(id) > -1), 'ولا صفحةً تُفتَح من غيرها');
T(steps[0] === 'map' || steps[0] === 'mywork', 'وتبدأ من حيث يبدأ يومُه: ' + steps[0]);
T(steps.every(id => (w.PAGE[id] || {}).l), 'ولكلِّ شاشةٍ سطرٌ يقول ما تفعله');
const allNoLede = Object.keys(w.PAGE).filter(k => !(w.PAGE[k] || {}).l);
T(allNoLede.length === 0, 'ولا صفحةَ في النظام بلا سطرِ تعريف' + (allNoLede.length ? ': ' + allNoLede.join(' · ') : ''));

/* ٣ · لكلِّ دورٍ جولتُه */
const byRole = {};
['tech', 'supervisor', 'viewer', 'admin', 'store', 'driver'].forEach(r => { w.ROLE = r; byRole[r] = w.tourPages(); });
T(Object.keys(byRole).every(r => byRole[r].length), 'لكلِّ دورٍ جولتُه: ' + Object.keys(byRole).map(r => r + ':' + byRole[r].length).join(' · '));
T(byRole.store.indexOf('map') < 0 && byRole.driver.length <= byRole.admin.length, 'ولا يُعرَض على أحدٍ ما ليس من شاشاته');
w.ROLE = 'tech';

/* ٤ · الإضاءةُ والتنقّل */
w.TOUR_I = 0; w.render(1); await wait(150);
const spot = d.querySelector('.tour-spot');
T(!!spot && spot.getAttribute('data-p') === w.tourPages()[0], 'بندُ الشاشة يُضاء في القائمة مع خطوتها');
click('[data-tournext]'); await wait(140);
T(w.TOUR_I === 1 && d.querySelector('.tour-spot').getAttribute('data-p') === w.tourPages()[1], 'و«التالي» ينقل الخطوةَ والإضاءةَ معًا');
click('[data-tourgo="' + w.tourPages()[1] + '"]'); await wait(140);
T(w.CUR === w.tourPages()[1], 'والزرُّ يفتح الشاشةَ فعلًا');

/* ٥ · لا تُعاد بعد إنهائها */
click('[data-tourstop]'); await wait(140);
T(w.TOUR_OPEN === false && !d.getElementById('tourSheet'), 'و«لا تعرضها ثانيةً» تطويها');
w.tourMaybe();
T(w.TOUR_OPEN === false, 'ولا تعود بعدها');
click('[data-tour]'); await wait(140);
T(w.TOUR_OPEN === true, 'وزرُّ 🎓 يفتحها متى شاء');
w.tourEnd(true);

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ جولة البداية فشل ✗ (${bad})` : '\nجولةُ البداية: شاشاتُك أنت، بترتيب يومك ✅');
process.exit(bad ? 1 : 0);
