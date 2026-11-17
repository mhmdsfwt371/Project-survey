/* ═══════════════════════════════════════════════════════════════════════════
   The assistant and «where the point sits» — node scripts/audit-aq-loc.mjs   (V47.3)
   ───────────────────────────────────────────────────────────────────────────
   «ايه النقاط اللى فيها تركيب نفق او كوبرى ؟» was answered with the general progress card: a leading question word
   kept it from being read as a list, «كوبري» without «تحت» was an unknown word, «تركيب» was read as the installation
   state — and the guide index had no word that leads to the «حسب الموقع» section of the challenges tab.
   Held here: the question in every common form, each «موقع النقطة» option, the count against the dashboard's own
   tags, and the tie that matters most — every option the dashboard shows has its words in the guide index, so a new
   option without them falls here before it ships.
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
const P = q => w.aqRepParse(q), loc = p => p.conds.filter(c => c.k === 'loc').map(c => c.label).join(' + ');

console.log('\n══ ١ · السؤال كما كُتب ══');
const Q = 'ايه النقاط اللى فيها تركيب نفق او كوبرى ؟', p0 = P(Q);
T(p0.isRep, 'يُقرأ طلبَ قائمة لا سؤالًا عن التقدّم');
T(/تحت كوبري/.test(loc(p0)) && /نفق/.test(loc(p0)), 'شرطُ الموقع: كوبري ونفق معًا — ' + loc(p0));
T(!p0.unknown.length, 'لا كلمةَ غيرُ مفهومة' + (p0.unknown.length ? ' — ' + p0.unknown.join('،') : ''));
T(!p0.conds.some(c => /ركب|تركيب/.test(c.label)), '«تركيب نفق» مكانُ النقطة لا حالةُ التركيب');
T((w.aqAnswer(Q) || '').indexOf('data-aqgo="page|mobs"') > -1, 'والجوابُ يقود إلى لوحة «حسب الموقع»');

console.log('\n══ ٢ · كلُّ خيارٍ من «موقع النقطة» بكلِّ صيغةِ سؤال ══');
const cats = w.obsLocCats().filter(c => c[0] !== 'tgen');
const leads = ['النقاط اللي', 'ايه النقاط اللي', 'فين النقاط اللي', 'مين النقاط اللي', 'ما هي النقاط التي'];
let bad = [];
cats.forEach(c => leads.forEach(l => { const q = l + ' ' + c[2], p = P(q); if (!p.isRep || loc(p).indexOf(c[2]) < 0 || p.unknown.length) bad.push(q + ' → ' + (loc(p) || '∅') + (p.unknown.length ? ' ؟' + p.unknown.join('،') : '')); }));
T(!bad.length, cats.length + ' خيارات × ' + leads.length + ' صيغ' + (bad.length ? ' — ' + bad.slice(0, 4).join(' | ') : ''));
['النقاط اللي تحت كوبري', 'النقاط اللي في الكباري', 'النقاط اللي عند كوبري'].forEach(q => T(/تحت كوبري/.test(loc(P(q))), '«' + q + '» ← تحت كوبري'));

console.log('\n══ ٣ · العددُ هو عددُ اللوحة ══');
const pts = w.STATE.sites.filter(x => w.locApplies(x)).slice(0, 3);
const save = pts.map(x => w.STATE.recs[x.id]);
pts[0] && (w.STATE.recs[pts[0].id] = { loc:['تحت كوبري'], by:'qa', at:Date.now() });
pts[1] && (w.STATE.recs[pts[1].id] = { loc:['مخرج نفق'], by:'qa', at:Date.now() });
pts[2] && (w.STATE.recs[pts[2].id] = { loc:['لوحة استرشادية'], by:'qa', at:Date.now() });
if (typeof w.statBump === 'function') w.statBump();
const rows = w.aqRepData(Q).rows.map(x => x.id).sort();
const dash = w.STATE.sites.filter(x => { const g = w.obsLocTags(x); return g && (g.bridge || g.tin || g.tout || g.tgen); }).map(x => x.id).sort();
T(rows.length >= 2 && rows.join() === dash.join(), 'نقاطُ الجواب = نقاطُ اللوحة (' + rows.length + ')');
T(rows.indexOf(pts[2].id) < 0, 'ونقطةُ «لوحة استرشادية» خارجَه');
pts.forEach((x, i) => { if (save[i]) w.STATE.recs[x.id] = save[i]; else delete w.STATE.recs[x.id]; });

console.log('\n══ ٤ · الجذر: كلُّ خيارٍ في اللوحة له كلماتُه في فهرس المساعد ══');
const kw = (w.PV.HELP_KEYWORDS.mobs || []).map(w.aqNorm);
const miss = cats.filter(c => !kw.some(k => k === w.aqNorm(c[2]) || w.aqNorm(c[2]).indexOf(k) > -1));
T(!miss.length, 'فهرسُ شريحة «التحديات والمعوقات» يحمل كلَّ خيارات «موقع النقطة»' + (miss.length ? ' — ناقص: ' + miss.map(c => c[2]).join('، ') : ''));
T(['نفق', 'كوبري', 'موقع النقطه'].every(k => kw.indexOf(k) > -1), 'وكلماتِ السؤال العامة: نفق · كوبري · موقع النقطة');

console.log('\n══ ٥ · لا رجوعَ لما قبله ══');
T((w.aqAnswer('مين متأخر في الزيارات؟') || '').indexOf(w.t('الزيارات المتأخرة')) > -1, '«مين متأخر في الزيارات؟» تبقى بطاقةَ الزيارات');
T((w.aqAnswer('المهام المتأخرة') || '').indexOf(w.t('المهام الأسبوعية')) > -1, '«المهام المتأخرة» تبقى بطاقةَ المهام');
T(!P('كم نقطة اتركبت').isRep, '«كم نقطة اتركبت» يبقى سؤالَ عدد');

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصا'));
process.exit(fails.length ? 1 : 0);
