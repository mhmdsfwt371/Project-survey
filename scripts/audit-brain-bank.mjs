/* ═══════════════════════════════════════════════════════════════════════════
   The brain's question bank — node scripts/audit-brain-bank.mjs   (V47.4)
   ───────────────────────────────────────────────────────────────────────────
   Measured on 17 Nov 2026: 17 of 30 real questions answered right, 9 answered confidently wrong
   («كام حساس» → the progress card, «الشحنات المتأخرة» → the tasks card) — the first known word won.
   The router (aqRoute) now decides; this bank holds every module's questions in the team's own words, each
   with the answer it must reach. A change that sends one of them to the wrong card falls here.
   Expectations: an intent id (the card that answers) · 'rep' the report-by-words card · 'pt' a point card ·
   'ask' «تقصد ايه؟» chips · 'nav:<page>' no card, the guide's first place is <page>. «a|b» accepts either.
   The rule the bank exists for: no wrong card — when unsure, ask or point to the page.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

/* what the brain did with a question */
const ran = q => {
  w.PV.AQ_R = null;
  const h = w.aqAnswer(q) || '';
  const R = w.PV.AQ_R;
  if (/data-aqrep=|فهمت/.test(h) && !R) return { k:['rep'], h };
  if (/data-ovopen=|site\|NSK-/.test(h) && !R) return { k:['pt'], h };
  if (/data-ovopen=|site\|NSK-/.test(h)) return { k:['pt'].concat(R ? R.list : []), h };
  if (!h){ const top = (w.helpSearch(q, 12) || [])[0]; return { k:['nav:' + (top ? top.id : '∅')], h }; }
  if (R && R.win === 'ask') return { k:['ask'], h };
  return { k:R ? R.list.slice() : ['?'], h };
};
const B = [
  /* progress */
  ['كام نقطة اتركبت في منى', 'progress'], ['كام نقطة اتزارت النهارده', 'progress'], ['نسبة الانجاز كام', 'progress'],
  ['كام مخيم في عرفات', 'progress'], ['التقدم في المسح ايه', 'progress'], ['كم عدد النقاط المعتمدة', 'progress'],
  ['قد ايه اتركب في عرفات', 'progress'], ['كام ممر اتمسح', 'progress'], ['قطار المشاعر فيه كام بوابة', 'progress'],
  /* readers */
  ['كام قارئ شغال دلوقتي', 'reader'], ['القراء اللي مش بترسل', 'reader'], ['فيه قارئ مقطوع؟', 'reader'], ['حالة الاشارة في منى', 'reader'],
  /* stock — catalog names are enough */
  ['كام راوتر عندنا', 'stock'], ['رصيد الهوائيات', 'stock'], ['ايه الأصناف اللي قربت تخلص في المخزن', 'stock'], ['المخزن فيه كام بطارية', 'stock'],
  /* visits */
  ['نقاط تحتاج زيارة تقنية', 'techvis'], ['النقاط اللي محتاجة زيارة تانية', 'rep|techvis'],
  ['مين متأخر في الزيارات؟', 'latevis'], ['الزيارات المتأخرة', 'latevis'], ['مين متأخر في المسح', 'latevis'],
  /* pace — the page until a forecast answer is written */
  ['امتى هنخلص المسح', 'pace'], ['هنلحق ولا لا', 'pace'], ['توقع نهاية التركيب', 'pace'],
  /* weekly tasks */
  ['المهام المتأخرة', 'tasks'], ['مين اتأخر في المهام الأسبوعية', 'tasks'], ['كام مهمة مفتوحة', 'tasks'],
  /* challenges */
  ['ايه أكتر تحدي في الممرات', 'chal'], ['التحديات في عرفات', 'chal'], ['ايه المعوقات', 'chal'], ['اكتر عائق في المخيمات', 'chal'],
  /* tafweej approvals and gates */
  ['ايه النقاط المرفوضة من التفويج', 'taf|rep'], ['كام نقطة لسه مستنية اعتماد التفويج', 'taf'], ['التفويج اعتمد كام', 'taf'],
  ['كام بوابة تفويج في المخيمات الترددي', 'gates'], ['حصر بوابات التفويج', 'gates'], ['كام مخيم ترددي في منى', 'gates'],
  /* occupancy · readiness */
  ['ايه أعلى إشغال', 'occ'], ['المخيمات المليانة', 'occ'], ['فين الزحمة', 'occ'],
  ['ايه اللي ناقص عشان نبدأ تركيب', 'ready'], ['ايه المعلق', 'ready'], ['نعمل ايه دلوقتي', 'ready'],
  /* domains that lead to their page */
  ['كام حساس في عرفات', 'sensor'], ['حالة الجيت واي', 'sensor'], ['درجة الحرارة في المخيم', 'sensor'],
  ['ايه الشحنات المتأخرة', 'ship'], ['حالة التوريد', 'ship'],
  ['مين ماسك عربية رقم', 'veh'], ['عهدة السيارات', 'veh'],
  ['مين اكتر مشرف شغال الاسبوع ده', 'perf'], ['اداء الفرق', 'perf'], ['مين اشطر فني', 'perf'],
  ['ايه حالة الإكسبو', 'expo'], ['ايه اللي اتعمل امبارح', 'yday'], ['حصل ايه امس', 'yday'], ['ايه آخر نسخة', 'version'],
  ['شركات الخدمة', 'co'],
  /* reports by words and points */
  ['النقاط اللي تحت كوبري', 'rep'], ['اكسل للمخيمات في منى', 'rep'], ['ايه النقاط اللي اتركبت في منى', 'rep'], ['فين الكاميرات اللي واقفة', 'rep'],
  ['NSK-ARF-CMP-0511', 'pt'], ['المخيم 38/56', 'pt'],
  /* (V47.5) phase 2: data answers, places and pages by title */
  ['فين النسخ الاحتياطي', 'backup'], ['النسخة الاحتياطية اتاخدت النهارده؟', 'backup'], ['اخر تحديث امتى', 'version'],
  ['شركة ضيوف البيت عملت ايه', 'co'], ['كام جيتواي في منى', 'sensor'], ['الرطوبة في المخيمات', 'sensor'],
  ['انتاجية الطواقم', 'perf'], ['مين احسن فريق', 'perf'], ['عملنا ايه امبارح', 'yday'], ['ايه اللي حصل النهارده', 'yday'],
  ['الشحنة بتاعت الهوائيات وصلت؟', 'ship'], ['التوريد اتأخر', 'ship'], ['عربية 4821 مع مين', 'veh'],
  ['كام نقطة في نمرة', 'progress'], ['نسبة الانجاز في عرفات', 'progress'],
  ['فين سجل المخاطر', 'nav:risks'], ['فين دفتر الحركة', 'nav:invmv'], ['فين المحادثات', 'nav:chat'], ['فين التكلفة', 'nav:fleetCost'],
  ['فين الميزانية والاعتماد', 'nav:budget'], ['شاشة القاعة', 'nav:kiosk'],
  ['شغال؟', 'ask'], ['عندنا كام؟', 'ask'],
  /* only weak words: ask, never guess */
  ['مين متأخر', 'ask'], ['متأخر', 'ask'], ['كام', 'ask']
];
console.log('\n══ ١ · كلُّ سؤالٍ يصل جوابَه — ' + B.length + ' سؤالًا من كلِّ الموديولات ══');
let right = 0;
B.forEach(([q, ex]) => {
  const r = ran(q), ok = ex.split('|').some(e => r.k.indexOf(e) > -1);
  if (ok) right++;
  T(ok, '«' + q + '» ← المتوقَّع ' + ex + ' · وصل ' + r.k.join('+'));
});
console.log('  ' + right + ' / ' + B.length + ' صحيح');

console.log('\n══ ٢ · لا بطاقةَ خاطئة حين يتقاطع سؤالان ══');
const both = ran('ايه الشركات اللي مخيماتها اتزارت');
T(both.k.indexOf('co') > -1 && both.k.indexOf('progress') > -1, 'الشركات والزيارات معًا: البطاقة ومعها صفحةُ الشركات — ' + both.k.join('+'));
const gw = ran('ايه حالة الجيتواي في المخيم 38/56');
T(gw.k[0] === 'pt' && gw.h.indexOf('page|iotdash') > -1, 'الجيتواي في مخيمٍ بشاخصه: النقطة، ومعها صفحةُ الحساسات');
const ask = ran('مين متأخر').h;
T(/data-assistq=/.test(ask) && (ask.match(/data-assistq=/g) || []).length >= 2, '«مين متأخر» تعرض اختياراتٍ تُضغط (' + (ask.match(/data-assistq=/g) || []).length + ')');

console.log('\n══ ٣ · لا صفحةَ يقود إليها المساعدُ دورًا لا يملكها ══');
const role0 = w.ROLE; w.ROLE = 'viewer';
const leak = w.PV.AQ_INTENTS.filter(I => I.go).filter(I => {
  const id = I.go.split('|')[1]; if (w.seesPage(id)) return false;
  w.aqRoute('سؤال ' + (I.ask || I.lbl)); return w.PV.AQ_R.list.indexOf(I.id) > -1;
});
w.ROLE = role0;
T(!leak.length, 'حسابُ الوزارة لا يُقاد إلى صفحةٍ محجوبةٍ عنه' + (leak.length ? ' — ' + leak.map(I => I.id).join('، ') : ''));
T(w.PV.AQ_INTENTS.filter(I => I.go).every(I => w.pageMeta(I.go.split('|')[1])), 'كلُّ صفحةٍ يقود إليها المساعدُ موجودةٌ في الفهرس');

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصًا — ' + right + '/' + B.length + ' من البنك'));
process.exit(fails.length ? 1 : 0);
