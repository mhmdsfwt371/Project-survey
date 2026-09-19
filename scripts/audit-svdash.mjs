/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تفاصيل المسح — node scripts/audit-svdash.mjs
   ───────────────────────────────────────────────────────────────────────────
   اللوحةُ تُقرأ في اجتماعٍ ويُبنى عليها شراءُ حديدٍ وجدولةُ تركيب: «ثمانون
   مخيمًا بلا تحدٍّ» تعني إسنادَ ثمانين غدًا، و«اثنا عشرَ يحتاج هيكلًا» تعني
   أمرَ شراء. فإن عدَّت ما لم يُزَر، أو عدَّت «لا توجد تحديات» تحدّيًا، أو ضاع
   سطرٌ من قائمتها، بُني القرارُ على رقمٍ كاذب. فتُشغَّل هنا على بياناتٍ معلومةِ
   الجواب: العددُ، والقائمةُ، والتصديرُ، والطيرانُ إلى النقطة على الخريطة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); }
  else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);

/* ── بياناتٌ معلومةُ الجواب: ثلاثةُ مخيماتٍ وممرٌّ ونقطةٌ لم تُزر ─────────── */
const camps = w.STATE.sites.filter(x => x.type === 'مخيم').slice(0, 4);
const cor   = w.STATE.sites.filter(x => x.type === 'ممر')[0];
const rec = (id, o) => { w.STATE.recs[id] = Object.assign({ id, at:Date.now(), by:'أحمد', access:'تم الوصول' }, o); };
rec(camps[0].id, { chals:['لا توجد تحديات'], tents:'40' });                       /* نظيفٌ · ٤٠ */
rec(camps[1].id, { chals:['العارضة الحديدية ناقصة أو غير مكتملة'], tents:'25' }); /* عارضة · ٢٥ */
rec(camps[2].id, { chals:['لا يوجد سطح تثبيت — يحتاج هيكلًا جديدًا', 'ارتفاع صعب الوصول'], tents:'10' });
if (cor) rec(cor.id, { chals:[] });                                              /* ممرٌّ نظيف */
const unseen = camps[3];                                                          /* لم تُزر */

console.log('\n══ ١ · ما لم يُزَر لا يُعَدّ، و«لا توجد تحديات» ليست تحدّيًا ══');
{
  const R = w.svdRows();
  const ids = R.map(o => o.x.id);
  T(ids.length === (cor ? 4 : 3) && ids.indexOf(unseen.id) < 0, 'يُعَدُّ ما سُجِّلت زيارتُه وحدَه: ' + ids.length);
  T(R.filter(o => !o.ch.length).length === (cor ? 2 : 1), 'و«لا توجد تحديات» تُقرأ نظافةً لا تحدّيًا');
  T(R.filter(o => o.ch.length).length === 2, 'وذو التحدي يُفرَز: ٢');
  T(R.filter(o => o.metal).length === 2, 'والهيكلُ والعارضةُ يُجمَعان في بابٍ واحد: ٢');
  T(R.filter(o => o.camp).reduce((a, o) => a + o.rooms, 0) === 75, 'والغرفُ تُجمَع من عدِّ الميدان: ٧٥');
  T(w.svdRows().filter(o => o.x.id === camps[2].id)[0].ch.length === 2, 'والنقطةُ تحمل تحدّيَيها معًا');
}

console.log('\n══ ٢ · الشاشةُ تعرض البطاقات وتفتح قائمتَها ══');
{
  w.goPage('over'); w.render(1); await wait(300);
  const tab = () => d.querySelector('[data-ptab="over:svdash"]');
  T(!!tab(), 'الشريحةُ في شريط «نظرة عامة»');
  tab().dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(250);
  let h = d.getElementById('content').innerHTML;
  T((h.match(/data-svd="/g) || []).length === 6, 'ستُّ بطاقاتٍ لكلِّ سؤالٍ رقمُه');
  T(h.indexOf('data-fly="') < 0, 'ولا قائمةَ قبل أن تُفتَح بطاقة');
  d.querySelector('[data-svd="metal"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(250);
  h = d.getElementById('content').innerHTML;
  T(w.SVD_PICK === 'metal' && (h.match(/data-fly="/g) || []).length === 2, 'والضغطُ يفتح قائمتَها: ٢ سطرًا');
  T(h.indexOf('data-fly="' + camps[1].id + '"') > -1 && h.indexOf('data-fly="' + camps[2].id + '"') > -1,
    'وفيها النقطتان اللتان تحتاجان حديدًا');
  T(h.indexOf('data-svdxls') > -1, 'ومعها زرُّ التصدير');
  d.querySelector('[data-svd="metal"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(200);
  T(w.SVD_PICK === '' && d.getElementById('content').innerHTML.indexOf('data-fly="') < 0, 'وضغطةٌ ثانيةٌ تُغلقها');
}

console.log('\n══ ٣ · السطرُ يطير إلى نقطته، والتصديرُ يحمل تفصيلَها ══');
{
  w.SVD_PICK = 'clean';
  let sent = '';
  const realFly = w.mapFly; w.mapFly = id => { sent = id; };
  d.body.insertAdjacentHTML('beforeend', '<div id="flyTest">' + w.svdashBody() + '</div>');
  const b = d.querySelector('#flyTest [data-fly="' + camps[0].id + '"]');
  T(!!b, 'لكلِّ سطرٍ زرُّ الخريطة');
  b.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(700);
  T(w.CUR === 'map' && w.POP_SITE === camps[0].id && w.POP_OPEN === true, 'والضغطُ ينقل إلى الخريطة على النقطة نفسِها');
  T(sent === camps[0].id, 'ويطير إليها لا إلى وسط الخريطة');
  w.mapFly = realFly;
  d.getElementById('flyTest').remove();
  /* التصدير: يُلتقَط ما يُرسَل إلى مولّد الجداول */
  let sheet = null;
  const realXls = w.xlsSheets; w.xlsSheets = (secs) => { sheet = secs; };
  w.SVD_PICK = 'metal'; w.svdXls();
  w.xlsSheets = realXls;
  const rows = sheet && sheet[0] && sheet[0][1];
  T(!!rows && rows.length === 3, 'التصديرُ يحمل رأسًا وسطرين');
  T(!!rows && rows[0].indexOf('التحديات') > -1 && rows[0].indexOf('الغرف/الخيام') > -1 && rows[0].indexOf('خط العرض') > -1,
    'وفيه التحدياتُ والغرفُ والإحداثيات — تُفتَح خارج التطبيق كما هي');
  T(!!rows && rows.some(r => String(r[8]).indexOf('العارضة الحديدية') > -1), 'وسببُ كلِّ نقطةٍ بنصِّه لا برمز');
  w.SVD_PICK = '';
}

console.log('\n══ ٤ · الدورُ الذي لا يرى الشاشةَ لا يرى شريحتَها ══');
{
  const was = w.ROLE;
  w.ROLE = 'tech'; w.STATE.meta.role = 'tech';
  const vis = w.tabsOf('over').map(x => x[0]);
  T(vis.indexOf('svdash') < 0 || w.seesRaw('svdash'), 'الشريحةُ تتبع قواعدَ الرؤية نفسَها لا استثناءً');
  w.ROLE = was; w.STATE.meta.role = was;
}

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs[0] : ''));
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ تفاصيل المسح نظيف \u2705');
try { dom.window.close(); } catch {}
process.exit(0);
