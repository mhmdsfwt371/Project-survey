/* ═══════════════════════════════════════════════════════════════════════════
   جردُ اتساق الأرقام — node scripts/audit-reconcile.mjs
   ───────────────────────────────────────────────────────────────────────────
   الوزارةُ تقرأ الملخّصَ ثم تفتح شاشةَ المسح ثم سلسلةَ المراحل، ورقمُ «المسح»
   واحدٌ في الثلاث أو لا ثقةَ في شيء. الشاشاتُ تحسب من دوالَّ مختلفةٍ — دورةُ
   الحياة، وإحصاءُ المواقع، وسلسلةُ المراحل، وقائمةُ الراكد — فيُقام هنا سجلٌّ
   معلومُ الجواب فيه كلُّ حالةٍ حدّية (متعذّرٌ رُدّ، ومُركَّبٌ لم يُدقَّق، ومُسنَدٌ
   لم يُزر) وتُقرأ الأرقامُ كما تُعرَض في كلِّ شاشة، ويُطالَب كلُّ رقمٍ بأن
   يساوي نظيرَه.
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
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
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

/* ── سجلٌّ معلومُ الجواب ─────────────────────────────────────────────────── */
const S = w.STATE.sites, now = Date.now(), TOTAL = S.length;
const N_REC = 400, N_STUCK = 10, N_REV = 5, N_APPR = 150, N_SOL = 60, N_SOLOK = 50, N_INS = 40, N_QA = 20, N_ASN = 30;
for (let i = 0; i < N_REC; i++){
  const x = S[i], r = { id:x.id, at: now - i * 36e5, by:'أحمد', access:'تم الوصول', chals:['لا توجد تحديات'], tents:'12',
    review: i < N_APPR ? 'approved' : 'pending' };
  if (i >= N_REC - N_STUCK){ r.access = 'لم يُصل'; r.reason = 'مغلق'; r.review = ''; }     /* عشرةٌ لم يصل إليها الميدان */
  else if (i >= N_REC - N_STUCK - N_REV) r.review = 'revisit';                             /* وخمسٌ وصل إليها ورُدَّت */
  w.STATE.recs[x.id] = r;
}
for (let i = 0; i < N_SOL; i++) w.STATE.inss[S[i].id] = { id:S[i].id, solution:{ status: i < N_SOLOK ? 'معتمد' : 'مقترح', items:{ 'RDR-01':1 } } };
for (let i = 0; i < N_INS; i++){ Object.assign(w.STATE.inss[S[i].id], { status:'مُركّب', at:now, by:'فني' }); if (i < N_QA) w.STATE.inss[S[i].id].approved = true; }
for (let i = N_REC; i < N_REC + N_ASN; i++) w.STATE.tasks['TK' + i] = { id:'TK' + i, site:S[i].id, kind:'visit', to:'فني', status:'مطلوب', at:now };
w.TK_IX = null;
const SURVEYED = N_REC - N_STUCK - N_REV, NOT_VISITED = TOTAL - N_REC, PENDING = SURVEYED - N_APPR;

/* ── قراءةُ الأرقام كما تُعرَض ───────────────────────────────────────────── */
const ar = s => String(s).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٬,]/g, '');
const txt = () => d.getElementById('content').innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const after = (t, label) => { const m = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*([٠-٩0-9٬,]+)').exec(t); return m ? +ar(m[1]) : NaN; };
/* الرقمُ الذي بعد «إجمالي المواقع» — لا الذي في بطاقات المشاعر قبله */
const kpi = (t, label) => { const i = t.indexOf('إجمالي المواقع'); return after(i < 0 ? t : t.slice(i), label); };
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return txt(); };

console.log('\n══ ١ · دورةُ الحياة تقسّم المواقعَ كلَّها ولا تُعَدُّ نقطةٌ مرتين ══');
const life = {}; S.forEach(x => { const k = w.lifeOf(x); life[k] = (life[k] || 0) + 1; });
T(Object.values(life).reduce((a, b) => a + b, 0) === TOTAL, 'مجموعُ الحالات = المواقعُ كلُّها: ' + TOTAL);
T(life.stuck === N_STUCK && life.revisit === N_REV, 'المتعذّرُ من لم يصل، والمردودُ من وصلَ ورُدّ — لا يختلطان: ' + life.stuck + ' / ' + life.revisit);
T(life.installed === N_INS, 'المُركَّبُ يُعَدُّ مُركَّبًا دُقِّق أو لم يُدقَّق: ' + life.installed);
T(life.assigned === N_ASN && life.todo === TOTAL - N_REC - N_ASN, 'والمُسنَدُ الذي لم يُزر ليس «لم تُزر»');

console.log('\n══ ٢ · الملخّصُ التنفيذي = شاشةُ المسح = سلسلةُ المراحل = تفاصيلُ المسح ══');
const over = await open('over', 'over');
const sv = await open('survey', 'survey');
const chain = w.chainRows(); const ch = k => (chain.filter(r => r.k === k)[0] || {}).done;
const svd = await open('over', 'svdash');
T(kpi(over, 'إجمالي المواقع') === TOTAL && after(sv, 'الكل') === N_REC, 'الإجماليُّ هو الإجمالي — والسجلُّ يعدُّ سجلاتِه: ' + TOTAL + ' / ' + N_REC);
T(kpi(over, 'تم المسح') === SURVEYED && after(sv, 'مُسح') === SURVEYED && ch('sv') === SURVEYED && after(svd, 'نقاطٌ مُسحت') === SURVEYED,
  'المسحُ رقمٌ واحدٌ في أربع شاشات: ' + SURVEYED);
T(kpi(over, 'متعذّر') === N_STUCK && after(sv, 'متعذّر') === N_STUCK, 'والمتعذّرُ رقمٌ واحدٌ في الملخّص وشاشة المسح: ' + N_STUCK);
T(after(sv, 'تحتاج زيارة أخرى') === N_REV, 'والمردودُ يُعَدُّ وحدَه في شاشة المسح: ' + N_REV);
T(kpi(over, 'مُركّب') === N_INS && ch('ins') === N_INS, 'والمُركَّبُ رقمٌ واحدٌ في الملخّص والسلسلة: ' + N_INS);
T(kpi(over, 'لم يُزر') === NOT_VISITED && after(sv, 'لم يُزر') === NOT_VISITED, 'و«لم يُزر» = المواقعُ − السجلات: ' + NOT_VISITED);
T(ch('ok') === N_QA, 'والاعتمادُ بعد التدقيق = ما دُقِّق: ' + N_QA);
T(after(over, 'تقدّم المسح من إجمالي المواقع') === SURVEYED, 'وتقدّمُ المسح من الرقم نفسِه');

console.log('\n══ ٣ · القرارات والراكد والتنفيذي ══');
const nowT = await open('over', 'now');
T(after(nowT, 'زياراتٌ تنتظر اعتمادك') === PENDING, 'زياراتٌ تنتظر الاعتماد = المعلَّقُ الواصل: ' + PENDING);
T(after(nowT, 'حلولٌ مقترحةٌ تنتظر اعتمادك') === N_SOL - N_SOLOK && after(nowT, 'تركيباتٌ تنتظر التدقيق') === N_INS - N_QA, 'والحلولُ والتدقيقُ من سجلاتها');
const idle = await open('survey', 'idle');
T(after(idle, 'الكل') === SURVEYED + N_REV - N_INS, 'الراكدُ = ما وصل إليه الميدانُ ولم يُركَّب — والمُركَّبُ غيرُ المدقَّق ليس راكدًا: ' + (SURVEYED + N_REV - N_INS));
const stuckT = await open('survey', 'stuck');
T(after(stuckT, 'الكل') === N_STUCK, 'وشاشةُ المتعذّر تعدُّ المتعذّرَ نفسَه: ' + N_STUCK);
const ex = await open('exec', 'exec');
T(after(ex, 'الإنجاز') === Math.round(SURVEYED / TOTAL * 100) && after(ex, 'أُنجز مسحًا') === SURVEYED && after(ex, 'أُنجز تركيبًا') === N_INS,
  'والتقريرُ التنفيذيُّ من الأرقام نفسِها: ' + Math.round(SURVEYED / TOTAL * 100) + '٪');

console.log('\n══ ٥ · المسحُ بالمشعر: النسبةُ والمتبقّي لكلِّ مشعرٍ وحدَه، والكلُّ بلا اختيار (V17.78) ══');
{
  const K = w.siteKeyStats(), Z = K.zones;
  T(Object.values(Z).reduce((a, o) => a + o.n, 0) === TOTAL && Object.values(Z).reduce((a, o) => a + o.sv, 0) === SURVEYED && Object.values(Z).reduce((a, o) => a + o.stuck, 0) === N_STUCK,
    'مجموعُ المشاعر = الكلُّ في المواقع والمسح والمتعذّر');
  const arafat = Z['عرفات'];
  T(arafat && arafat.sv === SURVEYED && arafat.stuck === N_STUCK, 'وما مُسح كلُّه في عرفات يُقرأ على عرفات وحدَها: ' + arafat.sv);
  const all = await open('over', 'over');
  T(all.indexOf('كلُّ المشاعر') > -1 && kpi(all, 'إجمالي المواقع') === TOTAL && kpi(all, 'متبقٍّ') === TOTAL - SURVEYED,
    'بلا اختيارٍ: الأرقامُ للكلّ والمتبقّي = الكلُّ − المسح: ' + (TOTAL - SURVEYED));
  const cards = (all.match(/٪/g) || []).length;
  T(cards >= Object.keys(Z).length + 1, 'وبطاقةٌ بنسبتها لكلِّ مشعرٍ وواحدةٌ للكلّ');
  d.querySelector('[data-ovz="عرفات"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150);
  const ar1 = txt();
  T(w.OVER_ZONE === 'عرفات' && kpi(ar1, 'إجمالي المواقع') === arafat.n && kpi(ar1, 'تم المسح') === arafat.sv && kpi(ar1, 'متبقٍّ') === arafat.n - arafat.sv,
    'واختيارُ عرفات يقرأ أرقامَها وحدَها: ' + arafat.sv + ' من ' + arafat.n);
  T(after(ar1, 'أُنجز') === Math.round(arafat.sv / arafat.n * 100) && after(ar1, 'وبقي') === 100 - Math.round(arafat.sv / arafat.n * 100),
    'ونسبةُ الإنجاز والمتبقّي بالمئة من المشعر نفسِه');
  d.querySelector('[data-ovz="منى"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150);
  const mina = Z['منى'];
  T(w.OVER_ZONE === 'منى' && kpi(txt(), 'تم المسح') === mina.sv && kpi(txt(), 'متبقٍّ') === mina.n - mina.sv, 'ومنى بأرقامها: ' + mina.sv + ' من ' + mina.n);
  d.querySelector('[data-ovz="منى"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150);
  T(w.OVER_ZONE === '' && kpi(txt(), 'إجمالي المواقع') === TOTAL, 'وضغطةٌ ثانيةٌ تعود إلى الكلّ');
}

console.log('\n══ ٤ · التوزيعُ يُجمَع إلى الكلّ ══');
const reg = await open('over', 'reg');
const rows = [...reg.matchAll(/([٠-٩0-9٬,]+)\s+([٠-٩0-9]+)٪/g)].map(m => [+ar(m[1]), +ar(m[2])]);
const body = rows.filter(r => r[0] !== TOTAL);
T(body.length >= 8 && body.reduce((a, r) => a + r[0], 0) === TOTAL, 'أسطرُ التوزيع تُجمَع إلى الإجمالي: ' + body.reduce((a, r) => a + r[0], 0));
const pct = body.reduce((a, r) => a + r[1], 0);
T(pct >= 98 && pct <= 102, 'والنسبُ تُجمَع إلى مئة (تقريبَ التدوير): ' + pct);
const st = w.siteStats();
T(Object.values(st.byKey).reduce((a, b) => a + b, 0) === TOTAL && Object.values(st.byCo).reduce((a, b) => a + b, 0) <= TOTAL,
  'وإحصاءُ المواقع بالمشعر والنوع يُجمَع إلى الكلّ، وبالشركة لا يتجاوزه');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs[0] : ''));
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ اتساق الأرقام نظيف \u2705');
try { dom.window.close(); } catch {}
process.exit(0);
