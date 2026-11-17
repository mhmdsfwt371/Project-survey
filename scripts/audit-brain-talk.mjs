/* ═══════════════════════════════════════════════════════════════════════════
   The brain in conversation — node scripts/audit-brain-talk.mjs   (V47.6)
   ───────────────────────────────────────────────────────────────────────────
   Phase 3 of the brain plan: a follow-up continues the last question («وفي عرفات؟», «والممرات», «طب نمرة»),
   «صدّرهم» / «حدّدهم» act on the points the last answer was about, and every data card carries the points
   behind its numbers — a list with its Excel, and for the office a selection for bulk work. The Ministry gets
   the lists, never the selection. A question of its own is never bent into a follow-up.
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
const A = q => w.aqAnswer(q) || '', txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const S = w.STATE.sites, cnt = f => S.filter(f).length;
const num = (h, lbl) => { const m = new RegExp(lbl + '\\s+([\\u0660-\\u0669\\d٬,]+)').exec(txt(h)); return m ? m[1] : ''; };

console.log('\n══ ١ · المتابعة تكمل السؤالَ السابق ══');
w.PV.AQ_CTX = null;
const h1 = A('كام نقطة اتركبت في منى');
T(num(h1, 'النقاط') === w.nm(cnt(x => x.zone === 'منى')), 'السؤال الأول: نقاطُ منى ' + cnt(x => x.zone === 'منى'));
const h2 = A('وفي عرفات؟');
T(/فهمت/.test(txt(h2)) && num(h2, 'النقاط') === w.nm(cnt(x => x.zone === 'عرفات')), '«وفي عرفات؟» = السؤالُ نفسُه في عرفات (' + cnt(x => x.zone === 'عرفات') + ')، ويقول ما فهم');
const h3 = A('والممرات');
T(num(h3, 'النقاط') === w.nm(cnt(x => x.zone === 'عرفات' && x.type === 'ممر')), '«والممرات» = ممراتُ عرفات (' + cnt(x => x.zone === 'عرفات' && x.type === 'ممر') + ')');
const nam = cnt(x => w.aqNorm(x.name || '').indexOf('نمره') > -1);
w.PV.AQ_CTX = null; A('كام نقطة اتزارت في منى'); const h4 = A('طب نمرة');
T(num(h4, 'النقاط') === w.nm(nam), '«طب نمرة» بعد سؤالٍ عن منى = نقاطُ نمرة (' + nam + ') — المكانُ يحلّ محلَّ المشعر');

console.log('\n══ ٢ · سؤالٌ له معناه لا يُلوى متابعةً ══');
w.PV.AQ_CTX = null; A('كام نقطة اتركبت في منى');
const h5 = A('كام حساس في عرفات');
T(!/فهمت/.test(txt(h5)) && h5.indexOf('page|iotdash') > -1, '«كام حساس في عرفات» سؤالٌ جديد — الحساسات، لا التقدّم');
w.PV.AQ_CTX.at = Date.now() - 20 * 60000;
T(!/فهمت/.test(txt(A('وفي عرفات؟'))), 'وبعد ربع ساعة لا يُكمَل سؤالٌ قديم');
w.PV.AQ_CTX = null;
T(A('عرفات') === '', 'ومشعرٌ وحدَه بلا سؤالٍ سابق لا يُجاب بتخمين');

console.log('\n══ ٣ · «صدّرهم» و«حدّدهم» على نقاط الجواب السابق ══');
A('كام نقطة اتركبت في منى');
const ex = A('صدرهم'), mn = cnt(x => x.zone === 'منى');
T(/data-svlist=/.test(ex) && txt(ex).indexOf(w.nm(mn)) > -1 && !/data-aqsel=/.test(ex), '«صدّرهم» = قائمةُ نقاط منى (' + mn + ') بإكسلها');
const sl = A('حددهم');
T(/data-aqsel=/.test(sl), '«حدّدهم» = زرُّ تحديدها للعمل الجماعي');

console.log('\n══ ٤ · الجوابُ يحمل النقاطَ خلف أرقامه ══');
w.PV.AQ_CTX = null;
const pg = A('كام نقطة اتركبت في منى');
const todo = S.filter(x => x.zone === 'منى' && !w.svVisited(w.STATE.recs[x.id])).length;
T((pg.match(/data-svlist=/g) || []).length >= 2 && txt(pg).indexOf(w.t('لم تُزَر') + ' ' + w.nm(todo)) > -1, 'بطاقةُ التقدّم: قائمةُ الكل وقائمةُ «لم تُزَر» (' + todo + ')');
const key = (/data-aqsel="([^"]+)"/.exec(pg) || [])[1];
T(!!key, 'وللمكتب زرُّ تحديد «لم تُزَر» للإسناد');
if (key){
  const btn = d.createElement('button'); btn.setAttribute('data-aqsel', key); d.body.appendChild(btn);
  btn.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(50);
  T(w.selIds().length === todo && w.eval('CUR') === 'sel', 'الضغطُ يحدّدها (' + w.selIds().length + ') ويفتح «المحدَّد»');
  w.selClear(); btn.remove();
}
const ch = A('ايه أكتر تحدي في منى');
T(/data-svlist=|لا تحدياتِ/.test(ch), 'بطاقةُ التحديات تحمل نقاطَها حين توجد');

console.log('\n══ ٥ · الوزارة: القوائمُ نعم، والتحديدُ لا ══');
const r0 = w.ROLE; w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
const v = A('كام نقطة اتركبت في منى');
T(/data-svlist=/.test(v) && !/data-aqsel=/.test(v), 'حسابُ الوزارة يرى القوائمَ بإكسلها ولا يرى زرَّ التحديد');
T(!/data-aqsel=/.test(A('حددهم')), 'و«حدّدهم» لا يعطيه تحديدًا');
w.ROLE = r0; w.STATE.meta.role = r0;

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصًا'));
process.exit(fails.length ? 1 : 0);
