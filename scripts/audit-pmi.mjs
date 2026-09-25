/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مطابقة المنهجية وسجلات الإدارة — node scripts/audit-pmi.mjs
   ───────────────────────────────────────────────────────────────────────────
   ٢٣ بندًا (٦ مبادئ و٧ مجالات، ٤ للرشيق، ٦ للذكاء الاصطناعي) تُحسَب حالتُها من
   البيانات: ينتقل البندُ من «ناقص» إلى «مطبّق» حين يوجد دليلُه الحديث. والسجلاتُ
   (الدروس والمراجعات وأصحاب المصلحة) تُكتَب في settings/pmo بتاريخها، والحذفُ شاهد،
   وللمكتب والإدارة العليا وحدَهم — وإكسلُ المصفوفة.
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
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return d.getElementById('content'); };
const byCode = () => { const o = {}; w.pmiRows().forEach(r => { o[r.code] = r; }); return o; };

console.log('\n══ ١ · البنودُ كاملةٌ بمراجعها ══');
const R0 = w.pmiRows();
T(R0.length === 23 && R0.filter(r => r.fw === 'pmbok').length === 13 && R0.filter(r => r.fw === 'acp').length === 4 && R0.filter(r => r.fw === 'ai').length === 6, '٢٣ بندًا: ١٣ من دليل المعرفة و٤ للرشيق و٦ للذكاء الاصطناعي');
T(R0.every(r => ['ok', 'part', 'gap', 'na'].includes(r.st) && r.title && r.ev), 'ولكلِّ بندٍ حالةٌ ودليلٌ مكتوب');
const b0 = byCode();
T(b0.D5.st === 'gap' && b0.A2.st === 'gap' && b0.A4.st === 'gap' && b0.C4.st === 'na', 'بلا سجلات: أصحابُ المصلحة والدروسُ والمراجعاتُ «ناقص»، والنموذجُ «لا ينطبق»');

console.log('\n══ ٢ · السجلاتُ تُكتَب بتاريخها وتنقل البنودَ إلى «مطبّق» ══');
const L = await open('exec', 'lessons');
T(/درسٌ مستفادٌ جديد/.test(L.textContent) && /مراجعةٌ دورية/.test(L.textContent), 'شريحةُ الدروس والمراجعات بنموذجيها');
d.getElementById('lsT').value = 'تأخّر القطع من المورّد'; d.getElementById('lsC').value = 'طلبٌ متأخّر'; d.getElementById('lsA').value = 'طلبٌ مبكّر'; d.getElementById('lsO').value = 'المهندس';
d.querySelector('[data-lessonadd]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const wl = wrote.find(r => r[0] === 'cfg' && r[1] === 'pmo' && r[2].lessons);
T(!!wl && Object.values(wl[2].lessons)[0].t === 'تأخّر القطع من المورّد' && Object.values(wl[2].lessons)[0].at > 0, 'الدرسُ يُكتَب في settings/pmo بتاريخه — دمجًا لا استبدالًا');
d.getElementById('rtP').value = 'أسبوع ٢١–٢٧'; d.getElementById('rtG').value = 'الوتيرة'; d.querySelector('[data-retroadd]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(60);
const S = await open('exec', 'stake');
for (const [n, c, dd] of [['وزارة الحج والعمرة', 'داعم', 'قائد'], ['شركات الطوافة', 'محايد', 'داعم'], ['أفاقي — الإدارة', 'داعم', 'داعم']]){
  d.getElementById('shN').value = n; d.getElementById('shC').value = c; d.getElementById('shD').value = dd;
  d.querySelector('[data-stakeadd]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(40);
}
const b1 = byCode();
T(b1.A2.st === 'ok' && b1.A4.st === 'ok' && b1.D5.st === 'ok', 'درسٌ ومراجعةٌ وثلاثةُ أصحاب مصلحة: البنودُ الثلاثةُ «مطبّق»');
await open('exec', 'stake');
T(/دون المطلوب/.test(d.getElementById('content').textContent) && d.querySelectorAll('[data-stakecur]').length === 3, 'السجلُّ يعدُّ من هم دون المطلوب، والحاليُّ يُغيَّر من الجدول');
const sc = d.querySelector('[data-stakecur]'); sc.value = 'قائد'; sc.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(40);
T(w.pmoList('stake').some(x => x.cur === 'قائد'), 'وتغييرُ الانخراط يُحفَظ ويؤرّخ المراجعة');
const del = d.querySelector('[data-pmodel^="stake|"]'); const delId = del.getAttribute('data-pmodel').split('|')[1];
del.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(40);
T(wrote.some(r => r[1] === 'pmo' && r[2].stake && r[2].stake[delId] && r[2].stake[delId].gone === true) && w.pmoList('stake').length === 2, 'والحذفُ شاهدٌ لا محو');

console.log('\n══ ٣ · المالية والمخاطر من البيانات ══');
const fin = byCode().D4;
T(['gap', 'part', 'ok'].includes(fin.st) && /سقف|خط|سعر|مؤشّرا/.test(fin.note), 'المالية تُقرأ من بنود الجاهزية: ' + fin.st + ' — ' + fin.note);
w.riskSet(w.risksList()[0].id, { st:'مفتوح' });
T(byCode().D7.st === 'ok' && w.risksList()[0].at > 0, 'مراجعةُ خطرٍ تؤرّخه فيصير بندُ المخاطر «مطبّق»');

console.log('\n══ ٤ · الشاشةُ والصلاحيةُ والإكسل ══');
const P = await open('exec', 'pmi');
T(/نسبةُ المطابقة/.test(P.textContent) && /دليل المعرفة \(الإصدار الثامن\)/.test(P.textContent) && /المنهج الرشيق/.test(P.textContent) && /الذكاء الاصطناعي/.test(P.textContent), 'الشاشةُ بنسبتها وأقسامها الثلاثة');
T(P.querySelectorAll('[data-goto]').length >= 15, 'ولكلِّ بندٍ طريقٌ إلى دليله');
const sheet = w.SHEETS.pmi();
T(sheet.length === 24 && sheet[0][0] === 'الإطار' && sheet.slice(1).every(r => r[5]), 'إكسلُ المصفوفة: ٢٣ صفًّا بحالاتها');
w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer'; w.render(1); await wait(60);
T(!w.tabsOf('exec').some(tb => ['pmi', 'lessons', 'stake'].includes(tb[0])), 'والوزارةُ لا ترى السجلاتِ الداخلية');
w.ROLE = 'exec'; w.STATE.meta.role = 'exec';
T(['pmi', 'lessons', 'stake'].every(id => w.tabsOf('exec').some(tb => tb[0] === id)), 'والإدارةُ العليا تراها');
T(w.pmoPut('lessons', 'X', { t:'x' }) === false, 'ولا تكتب فيها (للمكتب)');
const rules = readFileSync('firestore.rules', 'utf8');
T(/match \/settings\/pmo \{ allow read: if mgr\(\) \|\| \(ok\(\) && role\(\) == 'exec'\); allow write: if pm\('settings', 'w', mgr\(\)\); \}/.test(rules) && /id != 'pmo';/.test(rules), 'والقاعدةُ تحرس الوثيقةَ بالقسمة نفسِها');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ مطابقة المنهجية نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
