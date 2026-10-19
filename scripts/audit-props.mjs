/* ═══ جردُ مقترحات الوزارة (V37.69) — قرارُ المالك «مقترحة أفضل»: ما تضيفه الوزارةُ لا يدخل السجلَّ ولا العدَّ ولا التقريرَ حتى يعتمده المهندس، ويدخلها كلَّها فورَ الاعتماد ═══ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
import { readFileSync } from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { JSDOM, VirtualConsole } = require('jsdom');
const html = (await appHtml()); const vc = new VirtualConsole();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
{ const nodeUtil = require('util'); if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder; if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder; if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); if (!w.scrollTo) w.scrollTo = () => {}; }
await new Promise(r => setTimeout(r, 800));
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const go = d.getElementById('lgGo'); if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await new Promise(r => setTimeout(r, 500));
let fails = 0; const T = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails++; };
w.CORE.set = () => {}; w.CORE.dirty = () => {}; w.logEvent = () => {}; w.toast = () => {}; w.render = () => {}; w.statBump();
/* ١ · الوزارةُ تحفظ: المقترحةُ في STATE.props لا STATE.sites، والعدُّ لا يتحرّك */
w.ROLE = 'viewer'; const n0 = w.STATE.sites.length, t0 = w.siteStats().total, e0 = (typeof w.execRows === 'function' ? w.execRows().tot.all : -1);
const CO = (w.STATE.sites.find(x => x.type === 'مخيم' && x.co) || {}).co || '';
w.NEWSITE = { lat:21.413, lng:39.885, zone:'منى', type:'مخيم', sq:'7', sign:'57/2', co:CO, photos:{}, chals:[] };
w.nsSave(); const P = w.propList();
T(P.length === 1 && P[0].origin === 'ministry' && P[0].approved === false, 'مقترحةُ الوزارة تُمسَك جانبًا بمصدرها وغيرَ معتمدة');
T(w.STATE.sites.length === n0, 'ولا تدخل السجلَّ قبل الاعتماد');
w.statBump(); T(w.siteStats().total === t0, 'ولا تتحرّك إحصاءاتُ النقاط');
if (e0 >= 0) T(w.execRows().tot.all === e0, 'ولا التقريرُ التنفيذي');
T(!!w.propChip() && /\u{1F3DB}/u.test(w.propChip()), 'وشريحةُ «مقترحات الوزارة» تظهر بعددها');
w.PROP_POP = P[0].id; T(/بانتظار اعتماد المهندس/.test(w.propPopHtml()) && !/data-propok/.test(w.propPopHtml()), 'ونافذتُها للوزارة: «بانتظار اعتماد المهندس» بلا زرِّ اعتماد');
/* ٢ · المهندسُ يعتمد: تدخل السجلَّ والعدَّ والتقرير */
w.ROLE = 'engineer'; const id = P[0].id; w.visitAsnOpen = () => true;
T(/data-propok/.test(w.propPopHtml()) && /data-propno/.test(w.propPopHtml()), 'نافذةُ المهندس فيها الاعتمادُ والرفض');
T(w.propApprove(id) === true, 'الاعتمادُ يتمّ');
T(w.propList().length === 0 && !!w.siteFind(id) && w.siteFind(id).approved === true, 'فتخرج من المقترحات وتدخل السجلَّ معتمدة');
w.statBump(); T(w.siteStats().total === t0 + 1, 'ويزيد عدُّ النقاط واحدًا');
if (e0 >= 0) T(w.execRows().tot.all === e0 + 1, 'ويزيد التقريرُ التنفيذيُّ واحدًا');
/* ٣ · الرفضُ يُخرجها بلا أثرٍ في العدّ */
w.ROLE = 'viewer'; w.NEWSITE = { lat:21.414, lng:39.886, zone:'منى', type:'مخيم', sq:'8', sign:'58/2', co:CO, photos:{}, chals:[] }; w.nsSave(); const id2 = (w.propList()[0] || {}).id;
T(!!id2, 'مقترحةٌ ثانيةٌ تُحفَظ جانبًا كذلك');
w.ROLE = 'engineer'; T(w.propReject(id2) === true && w.propList().length === 0 && !w.siteFind(id2), 'الرفضُ يُخرج المقترحةَ ولا تدخل السجل');
w.statBump(); T(w.siteStats().total === t0 + 1, 'والعدُّ كما كان بعد الاعتماد الأوّل');
console.log(fails ? `جردُ مقترحات الوزارة فشل ✗ (${fails})` : 'جردُ مقترحات الوزارة ✓'); process.exit(fails ? 1 : 0);
