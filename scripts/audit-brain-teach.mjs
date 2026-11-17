/* ═══════════════════════════════════════════════════════════════════════════
   The office teaches the brain — node scripts/audit-brain-teach.mjs   (V47.7)
   ───────────────────────────────────────────────────────────────────────────
   Phase 4 of the brain plan: a question the brain could not answer shows the engineer a box — the words that mark
   it, and where its answer is (one of the brain's answers or any page). Saved once in CFG.lists.aqTeach, synced to
   every device, read first by the router. Held here: the box shows only for the office; a lesson answers the
   question in other words too; a lesson to a page the role cannot open is not used; a lesson can be removed; the
   team's question log carries a «علّمه» button that opens the brain on that question.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const ask = q => { w.eval('ASSIST_Q = ' + JSON.stringify(q)); w.PV.AQ_CTX = null; return w.assistResHtml(); };
const click = (attr, val) => { const b = d.createElement('button'); b.setAttribute(attr, val); d.body.appendChild(b); b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); b.remove(); };
const mount = h => { let r = d.getElementById('assistRes'); if (!r){ r = d.createElement('div'); r.id = 'assistRes'; d.body.appendChild(r); } r.innerHTML = h; };
w.CFG.lists = w.CFG.lists || {}; w.CFG.lists.aqTeach = [];

console.log('\n══ ١ · سؤالٌ بلا جواب: صندوقُ التعليم للمكتب ══');
const Q = 'فين الكرتونة الزرقا؟';
T(w.aqAnswer(Q) === '', 'المساعدُ لا يعرف «' + Q + '» بعد');
const h0 = ask(Q);
T(h0.indexOf('id="aqTeachBox"') > -1 && h0.indexOf('value="page:invb"') > -1 && h0.indexOf('value="intent:stock"') > -1, 'للمهندس صندوقُ «علّم المساعد» بأجوبة المساعد وصفحاتِ المنصة');

console.log('\n══ ٢ · الدرسُ يُحفَظ للفريق ويجيب بكلماتٍ أخرى ══');
mount(h0);
d.getElementById('aqTeachP').value = 'الكرتونة الزرقا'; d.getElementById('aqTeachTo').value = 'page:invb';
click('data-aqteach', '1');
const L = (w.CFG.lists.aqTeach || []).map(s => JSON.parse(s));
T(L.length === 1 && L[0].p === w.aqNorm('الكرتونة الزرقا') && L[0].to === 'page:invb' && 'by' in L[0] && L[0].at, 'حُفظ في الإعدادات المشتركة بالكلمات المطبَّعة ومن علّمه');
T(w.PV._cfgTouched && w.PV._cfgTouched.lists, 'ويُرفع للسحابة مع «القوائم» — يصل كلَّ جهاز');
const a1 = w.aqAnswer('يا جماعة الكرتونة الزرقا فين؟');
T(a1.indexOf('page|invb') > -1 && w.PV.AQ_LAST === 'taught', 'سؤالٌ آخرُ فيه الكلماتُ نفسُها يُجاب بالصفحة التي عُلِّمها');
mount(ask('وين المكنة الصفرا'));
d.getElementById('aqTeachP').value = 'المكنة الصفرا'; d.getElementById('aqTeachTo').value = 'intent:stock';
click('data-aqteach', '1');
w.aqRoute('المكنة الصفرا فاضل منها كام');
T(w.PV.AQ_R.list.join() === 'stock', 'ودرسٌ إلى جوابٍ من أجوبة المساعد: «المكنة الصفرا» ← المخزن');
T(ask('سؤال ليس له جواب أبدا').indexOf(w.t('ما تعلّمه المساعد')) > -1, 'قائمةُ ما تعلّمه تظهر في الصندوق');

console.log('\n══ ٣ · حدودُ الدرس ══');
const r0 = w.ROLE; w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
T(ask(Q).indexOf('id="aqTeachBox"') < 0, 'حسابُ الوزارة لا يرى صندوقَ التعليم');
T(!w.seesPage('invb') && w.aqAnswer('فين الكرتونة الزرقا') === '', 'ودرسٌ إلى صفحةٍ لا يملكها الدورُ («الأرصدة») لا يُستعمل له');
w.ROLE = r0; w.STATE.meta.role = r0;
const before = w.CFG.lists.aqTeach.length; d.getElementById('aqTeachP') && (d.getElementById('aqTeachP').value = 'ف'); click('data-aqteach', '1');
T(w.CFG.lists.aqTeach.length === before, 'كلماتٌ أقلُّ من ثلاثة أحرف لا تُحفظ درسًا');

console.log('\n══ ٤ · الدرسُ يُحذف ══');
click('data-aqteachdel', w.aqNorm('الكرتونة الزرقا'));
T(w.aqAnswer(Q) === '' && w.CFG.lists.aqTeach.length === 1, 'بعد الحذف يعود السؤالُ بلا جواب، والدرسُ الآخر باقٍ');

console.log('\n══ ٥ · من سجلّ أسئلة الفريق: «علّمه» يفتح المساعدَ على السؤال ══');
w.PV.AQ = { rows:[{ q:Q, n:3, who:2, no:1 }] };
const card = typeof w.assistQCard === 'function' ? w.assistQCard() : '';
T(card.indexOf('data-aqteachq=') > -1, 'كلُّ سؤالٍ في السجلّ معه زرُّ «علّمه»');
w.eval('ASSIST_OPEN = false'); click('data-aqteachq', Q);
T(w.eval('ASSIST_OPEN') === true && w.eval('ASSIST_Q') === Q, 'الضغطُ يفتح المساعدَ على السؤال نفسِه — حيث صندوقُ التعليم');
w.eval('ASSIST_OPEN = false; ASSIST_Q = ""');

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصًا'));
process.exit(fails.length ? 1 : 0);
