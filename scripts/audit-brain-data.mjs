/* ═══════════════════════════════════════════════════════════════════════════
   The brain's data answers and its reach — node scripts/audit-brain-data.mjs   (V47.5)
   ───────────────────────────────────────────────────────────────────────────
   Phase 2 of the brain plan. Phase 1 sent sensors, shipments, vehicles, the pace, people's work, yesterday, the
   EXPO, versions, companies and the backup to their page; now each answers with its numbers. Held here on data
   with a known answer: each card's numbers equal the source the page draws, the Ministry reads no names, a place
   named in the registry («نمرة») scopes the count, and — the root of «the brain does not know this page» —
   every page and tab, asked for by its title, is reached.
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
const day = 864e5, now = Date.now(), iso = ms => new Date(ms).toISOString().slice(0, 10);
const bump = () => { if (typeof w.statBump === 'function') w.statBump(); w.PV.SCORE_CACHE = null; };
const S = w.STATE.sites;

console.log('\n══ ١ · الشحنات: المتأخرُ هو ما يعدّه shipLate ══');
w.STATE.ships = { s1:{ id:'s1', item:'هوائي القارئ', sup:'مورد أ', eta:iso(now - 5 * day), at:now }, s2:{ id:'s2', item:'راوتر صناعي', eta:iso(now + 9 * day), at:now }, s3:{ id:'s3', item:'بطارية', eta:iso(now - 9 * day), got:1, at:now } };
const sh = txt(A('ايه الشحنات المتأخرة'));
T(sh.indexOf('متأخرة عن موعدها ' + w.nm(1)) > -1 && sh.indexOf('هوائي القارئ') > -1 && sh.indexOf('راوتر صناعي') < 0, 'شحنةٌ واحدةٌ متأخرة باسمها، والمستلَمةُ والقادمةُ ليستا منها');
T(sh.indexOf('الشحنات ' + w.nm(3)) > -1 && sh.indexOf('وصلت ' + w.nm(1)) > -1, 'الأعدادُ: ٣ شحنات · وصلت ١');

console.log('\n══ ٢ · السيارات: من معه السيارةُ برقمها — والوزارةُ بلا اسم ══');
w.STATE.vehicles = { v1:{ id:'v1', plate:'4821 ابح', kind:'هايلكس' }, v2:{ id:'v2', plate:'7310 دهر', kind:'باص' } };
w.STATE.vehAsn = { a1:{ id:'a1', veh:'v1', to:'سالم القحطاني', at:now - 2 * day } };
const vh = txt(A('مين ماسك عربية رقم 4821'));
T(vh.indexOf('سالم القحطاني') > -1 && vh.indexOf('4821') > -1, 'السيارة ٤٨٢١ مع سالم القحطاني');
T(txt(A('العربيات فين')).indexOf('مُسندة ' + w.nm(1)) > -1 && txt(A('العربيات فين')).indexOf('متاحة ' + w.nm(1)) > -1, 'وبلا رقم: ٢ سيارة · مُسندة ١ · متاحة ١');

console.log('\n══ ٣ · من عمل أكثر، وأمس ══');
const ids = S.slice(0, 5).map(x => x.id), keep = ids.map(id => w.STATE.recs[id]), keepI = ids.map(id => w.STATE.inss[id]);
/* (V47.9) the app counts days on the Mecca clock (dayKey: UTC+3), so «yesterday at noon» and «earlier today» are built on that clock —
   on the machine's clock the two disagreed from 21:00 to 24:00 UTC, and the cloud gate fell on V47.8 at 21:10 */
const yNoon = Date.parse(w.dayKey(now - 864e5) + 'T09:00:00Z');   /* 12:00 in Mecca, yesterday */
const tEarly = Math.max(Date.parse(w.dayKey(now) + 'T00:01:00+03:00'), now - 3600e3);   /* earlier today, in Mecca */
ids.slice(0, 3).forEach((id, i) => { w.STATE.recs[id] = { by:'سعيد', at:i === 0 ? yNoon : tEarly, access:'تم الوصول', chals:['لا توجد تحديات'] }; });
w.STATE.inss[ids[3]] = { by:'خالد', at:yNoon, status:'مُركّب', approved:true };
bump();
const pf = txt(A('مين اكتر مشرف شغال الاسبوع ده'));
T(w.svVisited(w.STATE.recs[ids[0]]) && pf.indexOf('سعيد ' + w.nm(3)) > -1 && pf.indexOf('خالد ' + w.nm(1)) > -1, 'آخر ٧ أيام: سعيد ٣ زيارات · خالد تركيبٌ واحد');
const yd = txt(A('ايه اللي اتعمل امبارح'));
T(yd.indexOf('زيارات المسح ' + w.nm(1)) > -1 && yd.indexOf('تركيبات ' + w.nm(1)) > -1 && yd.indexOf('منها معتمدة ' + w.nm(1)) > -1, 'أمس: زيارةٌ وتركيبٌ معتمد — لا ما وقع اليوم');
const r0 = w.ROLE; w.ROLE = 'viewer';
T(txt(A('ايه اللي اتعمل امبارح')).indexOf('سعيد') < 0, 'والوزارةُ ترى أعدادَ أمس بلا أسماء');
w.aqRoute('مين اكتر مشرف شغال الاسبوع ده');
T(w.PV.AQ_R.list.indexOf('perf') < 0, 'ولا تُقاد إلى أداء الأشخاص — صفحةٌ لا تملكها');
w.ROLE = r0;
ids.forEach((id, i) => { if (keep[i]) w.STATE.recs[id] = keep[i]; else delete w.STATE.recs[id]; if (keepI[i]) w.STATE.inss[id] = keepI[i]; else delete w.STATE.inss[id]; }); bump();

console.log('\n══ ٤ · الوتيرة: ما تقوله zoneForecast لكلِّ مشعر ══');
const pc = A('امتى هنخلص المسح في منى'), fm = w.zoneForecast('منى');
T(pc.indexOf('منى') > -1 && (fm.stalled ? pc.indexOf(w.t('لا وتيرةَ في أسبوعين')) > -1 : fm.done ? pc.indexOf(w.t('اكتمل')) > -1 : pc.indexOf(w.dayKey(fm.eta)) > -1), 'وتيرةُ منى من zoneForecast نفسِها');
T(A('امتى هنخلص المسح في منى').indexOf('عرفات') < 0, 'والسؤالُ عن منى لا يعرض عرفات');

console.log('\n══ ٥ · مكانٌ من السجلّ نفسِه: «نمرة» ══');
const nam = S.filter(x => w.aqNorm(x.name || '').indexOf('نمره') > -1).length;
const nt = txt(A('كام نقطة في نمرة'));
T(nam > 0 && new RegExp('النقاط ' + w.nm(nam).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' ').test(nt + ' '), 'كام نقطة في نمرة = ' + nam + ' — نقاطُ السجلّ التي في اسمها نمرة');
T(nt.indexOf('نمرة') > -1, 'ويُكتب المكانُ كما كُتب في السؤال');
T(!w.aqPlace(' كام نقطه اتركبت في مني '), 'ولا تُحسب كلمةُ السؤال العادية مكانًا');

console.log('\n══ ٦ · النسخة والشركات والنسخ الاحتياطي والحساسات ══');
T(A('ايه آخر نسخة').indexOf(w.appVer()) > -1, 'النسخةُ الحالية ' + w.appVer());
const co = w.mfuCompanies() || [];
T(txt(A('شركات الخدمة')).indexOf(w.t('شركات الخدمة')) > -1 && (co.length ? txt(A('شركات الخدمة')).indexOf(co.slice().sort((a, b) => b.n - a.n)[0].co) > -1 : true), 'شركاتُ الخدمة من mfuCompanies' + (co.length ? ' — أكبرُها ' + co.slice().sort((a, b) => b.n - a.n)[0].co : ''));
T(A('فين النسخ الاحتياطي').indexOf('page|retain') > -1, 'النسخُ الاحتياطيُّ: حالتُه ورابطُ «عمر البيانات»');
T(A('كام حساس في عرفات').indexOf('page|iotdash') > -1, 'الحساساتُ: أعدادُها أو صفحتُها — لا بطاقةٌ أخرى');

console.log('\n══ ٧ · الجذر: كلُّ صفحةٍ وشريحةٍ يُوصَل إليها باسمها ══');
w.ROLE = 'engineer';
const seen = {}, miss = [];
w.pageIds().forEach(id => {
  if (seen[id]) return; seen[id] = 1;
  const m = w.pageMeta(id); if (!m || !m.t || !w.seesPage(id) || /^(site|svForm|insForm|disp2|newsite|hand|maintForm|ips)$/.test(id)) return;
  w.eval('ASSIST_Q = ' + JSON.stringify('فين ' + m.t));
  const h = w.assistResHtml();
  if (h.indexOf('data-p="' + id + '"') < 0 && h.indexOf('page|' + id + '"') < 0 && h.indexOf("page|" + id + '|') < 0) miss.push(id + ' «' + m.t + '»');
});
w.eval('ASSIST_Q = ""');
T(!miss.length, 'كلُّ صفحةٍ وشريحةٍ يراها المهندس: «فين <اسمها>» يقود إليها' + (miss.length ? ' — لا يقود (' + miss.length + '): ' + miss.join('، ') : ''));
const both = A('التحديات في عرفات وسجل المخاطر');
T(both.indexOf('page|risks') > -1 && both.indexOf(w.t('التحديات والمعوقات')) > -1, 'سؤالٌ يجمع جوابًا واسمَ صفحة: الجوابُ ورابطُ الصفحة معًا');

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' ساقط' : '✓ ' + pass + ' فحصًا'));
process.exit(fails.length ? 1 : 0);
