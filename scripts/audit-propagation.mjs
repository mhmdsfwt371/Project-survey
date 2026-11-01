/* ═══ جردُ الوصول — «أيُّ حاجة بتتضاف لازم تسمع في أماكنها» (V43.11) ═══
   طلبُ المالك: كلُّ ما يُضاف يدويًّا (فاتورة، قطعةُ مستودع، شركة، موقع، طلب…) يصل الأجهزةَ الأخرى ويظهر في شاشاته ويُحسَب.
   جزءان: (١) ساكنٌ — لكلِّ نوعِ سجلٍّ يكتبه التطبيقُ مسارُ قراءةٍ معروف (سحبٌ تفاضلي، تغذيةٌ مسجَّلة، وثيقةُ ثوابت،
   إنصاتٌ حيّ، أو استعلامٌ عند الطلب موثَّق). (٢) حيٌّ — سجلٌّ واحدٌ من كلِّ نوعٍ يُدخَل كما يدخله التطبيقُ (في الحالة)
   فتتغيّر شاشةٌ واحدةٌ على الأقلّ من شاشات المدير. نوعٌ لا يظهر في أيِّ شاشة = مكتوبٌ ولا يُسمَع. */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole; try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch { console.error('✗ jsdom غير مثبَّت'); process.exit(2); }
let pass = 0; const fails = [];
const T = (ok, msg) => { if (ok) pass++; else fails.push(msg); console.log((ok ? '  ✓ ' : '  ✗ ') + msg); };

/* ── ١ · ساكن: مسارُ قراءةٍ لكلِّ نوع ─────────────────────────────────── */
console.log('══ ١ · لكلِّ نوعِ سجلٍّ مسارُ قراءةٍ إلى الأجهزة الأخرى ══');
const core = readFileSync(new URL('../src/01-core/01-core-registry-05-sync-scale.js', import.meta.url), 'utf8');
const gate = readFileSync(new URL('../src/01-core/01-core-registry-06-data-gate-live.js', import.meta.url), 'utf8');
const pw = readFileSync(new URL('../src/03z-shared/03z-shared-14-from-tasks-office-14-pull-scope-listen-map.js', import.meta.url), 'utf8');
const defs = readFileSync(new URL('../src/02-catalog/02-definitions-08-definitions.js', import.meta.url), 'utf8');
const m0 = core.indexOf("recs:'recs'"); const kinds = [...core.slice(m0, core.indexOf('}', m0)).matchAll(/([a-zA-Z]+):'([a-zA-Z]+)'/g)].map(m => [m[1], m[2]]);
const feeds = new Set([...core.matchAll(/FB\.feed\('([a-zA-Z]+)'/g)].map(m => m[1]));
const delta = new Set([...(pw.match(/var ALL_WORK = \[([^\]]*)\]/) || ['', ''])[1].matchAll(/'([a-zA-Z]+)'/g)].map(m => m[1]));
const live = new Set([...gate.matchAll(/watch\('([a-zA-Z]+)'/g)].map(m => m[1]));
/* مسارٌ عند الطلب أو خادمٌ وحدَه — موثَّقٌ هنا بسببه؛ أيُّ نوعٍ جديدٍ يحتاج أحدَ المسارات أعلاه */
const ONDEMAND = { photos:'تُقرأ بالاستعلام لكلِّ نقطة عند فتحها (definitions: where site ==)', photoblobs:'تُقرأ مع صورتها عند الطلب', events:'المكتبُ يسحبها تفاضليًّا (pullScope: events)', stats:'لقطاتٌ يومية يكتبها الخادمُ ويقرؤها المكتبُ والوزارة عند الفتح', provision:'طلباتُ إنشاء الحسابات — يقرؤها الخادمُ (provision.yml) والمديرُ حيًّا', ghcfg:'مفتاحُ السيور — يُلصَق ويُقرأ عند الفتح للمدير', presence:'نبضُ الحضور — صحةُ النظام تقرؤه عند الفتح', sites:'FB.pullFeeds — عند الفتح وبالنبضة', newsites:'FB.pullFeeds — عند الفتح وبالنبضة', coreqs:'FB.pullFeeds — عند الفتح وبالنبضة', settings:'FB.sdoc لكلِّ وثيقة + إنصاتٌ حيّ', accounts:'سجلُّ إنشاء الحسابات — يكتبه التطبيقُ لخادم الإنشاء (provision.yml)؛ الحسابُ نفسُه يظهر للجميع عبر users (حيّ)' };
let missing = [];
for (const [kind, col] of kinds){
  const how = [delta.has(col) && 'delta', feeds.has(col) && 'feed', live.has(col) && 'live', ONDEMAND[col] && 'ondemand'].filter(Boolean);
  if (!how.length) missing.push(kind + '→' + col);
}
T(missing.length === 0, kinds.length + ' نوعًا يكتبها التطبيق — ولكلٍّ مسارُ قراءةٍ (تفاضلي/تغذية/حيّ/عند الطلب)' + (missing.length ? ' — بلا مسار: ' + missing.join(' · ') : ''));
T(/DB\.col\('photos'\)\.where\('site', '==', siteId\)/.test(defs), 'الصورُ تُقرأ لكلِّ نقطةٍ عند فتحها — ما يرفعه جهازٌ يراه الآخرون عند فتح النقطة');

/* ── ٢ · حيّ: سجلٌّ واحدٌ من كلِّ نوعٍ يغيّر شاشةً ────────────────────────── */
console.log('\n══ ٢ · سجلٌّ من كلِّ نوعٍ يظهر في شاشةٍ على الأقلّ ══');
const html = await appHtml();
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
{ const nodeUtil = require('util'); if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder; if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder; if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit'; if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network')); if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); if (!w.scrollTo) w.scrollTo = () => {}; }
await new Promise(r => setTimeout(r, 800));
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'adm.test'; if (pE) pE.value = 'TestPass1234'; }
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 600));
w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; try { if (typeof w.tourEnd === 'function') w.tourEnd(false); } catch {}
const allPages = w.pageIds ? w.pageIds() : Object.keys(w.PAGE);
const pageOf = id => (w.PARENT && w.PARENT[id]) || id;
const snap = () => { const out = {}; for (const id of allPages){ if (!w.PAGE[pageOf(id)]) continue; w.CUR = id; try { w.render(1); out[id] = (d.getElementById('content') || {}).innerHTML || ''; } catch (e){ out[id] = 'ERR ' + e.message; } } return out; };
const site = (w.STATE.sites || []).find(x => x && x.type === 'مخيم' && x.zone === 'منى') || (w.STATE.sites || [])[0];
const sid = site ? site.id : 'S-1', now = Date.now(), me = w.STATE.meta.name || 'مدير';
/* عيّناتٌ بالحدّ الأدنى الذي يحسبه التطبيق — كلُّ واحدةٍ كما يكتبها التطبيقُ لا أكثر */
const SAMPLES = {
  moves:   () => { w.STATE.moves = w.STATE.moves || []; w.STATE.moves.push({ id:'pp-mv', kind:'in', item:'قارئ RFID', qty:7, at:now, by:me, note:'جردُ الوصول' }); },
  buys:    () => { w.STATE.buys = w.STATE.buys || {}; w.STATE.buys['pp-buy'] = { id:'pp-buy', item:'كابل شبكة', qty:3, cost:450, at:now, by:me, st:'جديد' }; },
  workReqs:() => { w.STATE.workReqs = w.STATE.workReqs || {}; w.STATE.workReqs['pp-wr'] = { id:'pp-wr', site:sid, what:'هيكل', at:now, by:me, st:'جديد' }; },
  fixreqs: () => { w.STATE.fixreqs = w.STATE.fixreqs || {}; w.STATE.fixreqs['pp-fx'] = { id:'pp-fx', site:sid, field:'co', want:'شركة التجربة', why:'جردُ الوصول', at:now, by:me, status:'جديد' }; },
  bugs:    () => { w.STATE.bugs = w.STATE.bugs || {}; w.STATE.bugs['pp-bug'] = { id:'pp-bug', txt:'بلاغُ جردِ الوصول', at:now, by:me, uid:'u', status:'جديد' }; },
  vehicles:() => { w.STATE.vehicles = w.STATE.vehicles || {}; w.STATE.vehicles['pp-veh'] = { id:'pp-veh', plate:'أ ب ج ١٢٣٤', kind:'بكب', at:now, by:me }; },
  ships:   () => { w.STATE.ships = w.STATE.ships || {}; w.STATE.ships['pp-sh'] = { id:'pp-sh', what:'شحنةُ جرد', qty:5, at:now, by:me, st:'في الطريق' }; },
  changes: () => { w.STATE.changes = w.STATE.changes || []; w.STATE.changes.push({ id:'pp-cr', title:'طلبُ تغييرٍ تجريبي', at:now, by:me, st:'مفتوح' }); },
  ncr:     () => { w.STATE.ncr = w.STATE.ncr || {}; w.STATE.ncr['pp-ncr'] = { id:'pp-ncr', site:sid, what:'عدمُ مطابقةٍ تجريبي', at:now, by:me, st:'مفتوح' }; },
  hse:     () => { w.HSE.incidents.unshift({ kind:'ملاحظة', what:'سلامةٌ تجريبية', where:sid, at:now, by:me, lost:0 }); if (typeof w.hseRecount === 'function') w.hseRecount(); },
  ipc:     () => { w.IPCS.push({ n:99, amount:1000, at:now, by:me, st:'مقدَّم', note:'مستخلصُ جرد' }); },
  bonus:   () => { w.STATE.bonus = w.STATE.bonus || {}; w.STATE.bonus['pp-bn'] = { id:'pp-bn', who:me, pts:5, why:'جردُ الوصول', at:now, by:me }; },
  coreqs:  () => { w.STATE.coreqs = w.STATE.coreqs || {}; w.STATE.coreqs['شركة جرد الوصول'] = { name:'شركة جرد الوصول', status:'معتمد', by:me, at:now }; if (typeof w.coFill === 'function') w.coFill(); },
  newsites:() => { w.STATE.sites.push({ id:'PP-NEW-1', name:'نقطةُ جرد الوصول', type:'مخيم', zone:'منى', lat:21.41, lng:39.89, isNew:true, origin:'office', by:me, at:now, approved:true }); },
  steps:   () => { w.STATE.steps = w.STATE.steps || []; w.STATE.steps.unshift({ id:'pp-st', kind:'survey', site:sid, at:now, by:me, txt:'خطوةُ جرد' }); },
  recs:    () => { w.STATE.recs = w.STATE.recs || {}; w.STATE.recs['PP-R'] = { id:'PP-R', site:'PP-NEW-1', access:'تم الوصول', at:now, by:me, rooms:3 }; },
  msgs:    () => { w.STATE.msgs = w.STATE.msgs || {}; w.STATE.msgs['pp-m'] = { id:'pp-m', text:'رسالةُ جرد', at:now, by:me, uid:'u' }; }
};
/* الشاشاتُ التي تتغيّر مع الوقت وحدَه (ساعة، عدّاد) تُستبعد — رسمتان بلا تغييرٍ تكشفانها */
const b1 = snap(), b2 = snap(); const flaky = new Set(Object.keys(b1).filter(p => b1[p] !== b2[p]));
console.log('  (شاشاتٌ تتغيّر مع الوقت فتُستبعد: ' + [...flaky].join(' · ') + ')');
const before = b2;
const report = [];
for (const k of Object.keys(SAMPLES)){
  try { SAMPLES[k](); } catch (e){ report.push(k + ' (تعذّر الإدخال: ' + e.message + ')'); continue; }
  const after = snap(); const changed = Object.keys(after).filter(p => !flaky.has(p) && after[p] !== before[p] && !/^ERR/.test(after[p]));
  Object.assign(before, after);
  T(changed.length > 0, k + ' — يظهر في ' + changed.length + ' شاشة: ' + changed.slice(0, 4).join(' · ') + (changed.length > 4 ? ' …' : ''));
}
/* ── ٣ · بعد إعادة الفتح: ما يُقرأ بمؤشِّر «منذ» ولا يُحفَظ على الجهاز يُقرأ كاملًا عند الإقلاع (V43.13) ── */
console.log('\n══ ٣ · بعد إعادة الفتح لا يختفي ما أُضيف قبلها ══');
{
  const calls = {}; const docs = {
    newsites:[{ id:'PP-OLD-1', data:() => ({ id:'PP-OLD-1', name:'مخيمٌ أُضيف قبل إعادة الفتح', type:'مخيم', zone:'عرفات', lat:21.357, lng:39.978, origin:'field', approved:false, _at:1000 }) }],
    coreqs:[{ id:'شركة قبل إعادة الفتح', data:() => ({ name:'شركة قبل إعادة الفتح', status:'معتمد', _at:1000 }) }], sites:[] };
  const col0 = w.DB.col, R0 = w.FB.ready, D0 = w.FB.db;
  w.DB.col = name => { const q = { w:[], where(f){ this.w.push(f); return this; }, limit(){ return this; }, orderBy(){ return this; }, get(){ calls[name] = this.w.slice(); const L = docs[name] || []; return Promise.resolve({ size:L.length, forEach:f => L.forEach(f), docs:L }); } }; return q; };
  w.FB.ready = true; w.FB.db = w.FB.db || {}; w.STATE.meta.pullAt = Object.assign({}, w.STATE.meta.pullAt || {}, { newsites:Date.now(), coreqs:Date.now(), sites:Date.now() });
  w.STATE.newsites = {}; w.STATE.sites = w.STATE.sites.filter(x => x.id !== 'PP-OLD-1');
  await w.FB.pullFeeds({ boot:true });
  w.DB.col = col0; w.FB.ready = R0; w.FB.db = D0;
  T(calls.newsites && calls.newsites.indexOf('_at') < 0 && calls.coreqs && calls.coreqs.indexOf('_at') < 0, 'عند الإقلاع تُقرأ المواقعُ الجديدةُ والشركاتُ المضافة كاملةً — مؤشِّرُ «منذ» كان يُخفي كلَّ ما قبله بعد إعادة الفتح');
  T(!!w.STATE.sites.find(x => x.id === 'PP-OLD-1') && (w.CO_LIST || []).indexOf('شركة قبل إعادة الفتح') > -1, 'ومخيمٌ أضافه مشرفٌ قبل إعادة الفتح يعود إلى الخريطة، والشركةُ إلى القائمة');
}
const errs = Object.keys(before).filter(p => /^ERR/.test(before[p]));
T(errs.length === 0, 'كلُّ الشاشات تُرسَم للمدير بلا خطأ' + (errs.length ? ' — ' + errs.join(' · ') : ''));
console.log(`\nنجح ${pass} · فشل ${fails.length}`); console.log(fails.length ? 'جردُ الوصول فشل ✗' : 'جردُ الوصول نجح ✓');
process.exit(fails.length ? 1 : 0);
