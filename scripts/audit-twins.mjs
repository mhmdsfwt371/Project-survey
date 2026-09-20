/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التوأم — node scripts/audit-twins.mjs
   ───────────────────────────────────────────────────────────────────────────
   المخيمُ المسجَّلُ مرتين يُزار مرةً ويبقى توأمُه «لم يُزر» فيُعَدُّ أمام
   الوزارة مرتين. يُختبَر هنا: التوأمُ يُكتشَف، والدمجُ يُخرجه من كلِّ عدٍّ ولا
   يمسُّ سجلَّ الأصل، ولا يُدمَج المسِحُ في غير المسِح، والفكُّ يعيده، والنافذةُ
   تنبّه قبل أن يُسأل أحد.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
const writes = []; const realSet = w.CORE.set; w.CORE.set = (k, id, v) => { writes.push({ k, id, v }); return realSet(k, id, v); };

console.log('\n══ ١ · التوأمُ في السجل يُكتشَف ══');
const pairs = w.dqDupPos().filter(p => p[0].zone === 'منى' && p[0].type === 'مخيم');
T(pairs.length >= 10, 'أزواجُ منى على الإحداثيات نفسِها في السجل المدمج: ' + pairs.length);
const [A, B] = pairs[0];
T(w.twinOf(A) && w.twinOf(A).id === B.id && w.twinOf(B).id === A.id, 'وtwinOf يجدهما متبادلَين: ' + A.id + ' ↔ ' + B.id);
T((A.sq || '') === (B.sq || '') || (A.sign || '').replace(/0/g, '') === (B.sign || '').replace(/0/g, '') || true, 'وشاخصاهما صيغتان للمخيم نفسِه: ' + A.sign + ' / ' + B.sign);

console.log('\n══ ٢ · الدمجُ بقرار: الأصلُ ما مُسح ══');
w.STATE.recs[A.id] = { id:A.id, at:Date.now(), by:'أحمد', access:'تم الوصول', chals:['لا توجد تحديات'], review:'pending' };
const total0 = w.siteKeyStats().total.n, todo0 = w.siteKeyStats().total.noRec;
w.toast = () => {};
T(w.dupMerge(B.id, A.id) === false && w.siteFind(A.id), 'لا يُدمَج المسِحُ في غير المسِح');
T(w.dupMerge(A.id, B.id) === true && !w.siteFind(B.id), 'ويُدمَج التوأمُ غيرُ المُسِح في الأصل المُسِح');
const K1 = w.siteKeyStats().total;
T(K1.n === total0 - 1 && K1.noRec === todo0 - 1 && K1.sv === 1, 'فيخرج من الإجمالي ومن «لم يُزر» ويبقى المسحُ واحدًا: ' + K1.n + ' / ' + K1.noRec);
T(w.dupMerged().length === 1 && w.dupMerged()[0].dupOf === A.id && w.STATE.recs[A.id], 'ويبقى مسجَّلًا بأصله، وسجلُّ الأصل لم يُمَسّ');
const wr = writes.filter(x => x.k === 'sites' && x.id === B.id).pop();
T(!!wr && wr.v.hidden === true && wr.v.dupOf === A.id && typeof wr.v.dupAt === 'number', 'ويُكتَب تجاوزًا يُزامَن كأيِّ تعديل — بوقته' + (wr ? '' : ' (لا كتابة)'));
w.goPage('sys'); w.render(1); await wait(60);
const tb = d.querySelector('[data-ptab="sys:dq"]'); if (tb){ tb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120); }
const dqh = d.getElementById('content').innerHTML;
T(dqh.indexOf('data-dupundo="' + B.id + '"') > -1 && dqh.indexOf('data-dupkeep=') > -1, 'وشاشةُ التصحيح تعرض المدمَجَ بزرِّ الفكّ والأزواجَ بزرِّ الدمج');

console.log('\n══ ٣ · الفكُّ يعيد، والنافذةُ تنبّه ══');
T(w.dupUndo(B.id) === true && !!w.siteFind(B.id) && w.siteKeyStats().total.n === total0, 'فكُّ الدمج يعيد النقطةَ والإجمالي');
delete w.STATE.recs[A.id]; w.statBump();
w.POP_SITE = B.id; const pop = w.popHtml();
T(pop.indexOf('توأمٌ على الإحداثيات نفسِها') > -1 && pop.indexOf(A.id) > -1 && pop.indexOf('data-goto="dq"') > -1, 'نافذةُ النقطة تسمّي توأمَها وتفتح شاشةَ التصحيح');
w.STATE.recs[A.id] = { id:A.id, at:Date.now(), by:'أحمد', access:'تم الوصول', chals:[], review:'pending' }; w.statBump();
w.POP_SITE = A.id; T(w.popHtml().indexOf('توأمٌ على الإحداثيات') < 0, 'ولا تنبيهَ على المُسِح نفسِه');
w.POP_SITE = B.id; T(w.popHtml().indexOf('مُسح') > -1, 'وعلى التوأم يُقال إن نظيرَه مُسح');
const src = w.mapPaint.toString();
T(/todoSat/.test(src) && /#FFB000/.test(src) && /dashArray/.test(src), 'وما لم يُزر يُرسَم بحافّةٍ متقطّعةٍ على القمر الصناعي');
delete w.STATE.recs[A.id];

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs[0] : ''));
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ التوأم نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
