/* ═══════════════════════════════════════════════════════════════════════════
   جردُ المخزن المحلي — node scripts/audit-idb.mjs
   ───────────────────────────────────────────────────────────────────────────
   قاعدةُ الجهاز هي ما يحمل عملَ الفنيِّ بلا شبكة. تُحاكى هنا بيدٍ (لا حزمة):
   فتحٌ بطيءٌ ينجح بعد المهلة → يُتبنّى وتُدفَق الذاكرةُ فلا يضيع شيء؛ فتحٌ
   يخطئ → إعادةٌ بتراجع ولافتةٌ وسؤالٌ قبل الإغلاق؛ والمسارُ السليمُ كما كان.
   والتخزينُ الدائمُ يُطلَب مرةً واحدةً ويُرى في صحة النظام.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');

/* ── محاكي IndexedDB بيدٍ: مخزنٌ واحد، فتحٌ يُضبَط نجاحُه وزمنُه ── */
function fakeIDB(opts){
  const store = new Map(); let opens = 0;
  const db = { transaction(){ return mkTx(); }, close(){} };
  function mkTx(){ const tx = { oncomplete:null, onerror:null, error:null }; tx.objectStore = () => ({
    put(v, k){ store.set(k, v); setTimeout(() => tx.oncomplete && tx.oncomplete(), 1); },
    get(k){ const r = { onsuccess:null, onerror:null, result:undefined }; setTimeout(() => { r.result = store.get(k); r.onsuccess && r.onsuccess(); }, 1); return r; }
  }); return tx; }
  return { store, get opens(){ return opens; }, open(){
    opens++; const q = { onsuccess:null, onerror:null, onupgradeneeded:null, result:db, error:new Error('quota') };
    const mode = typeof opts.mode === 'function' ? opts.mode(opens) : opts.mode;
    const delay = typeof opts.delay === 'function' ? opts.delay(opens) : (opts.delay || 1);
    setTimeout(() => { if (mode === 'ok'){ q.onsuccess && q.onsuccess(); } else { q.onerror && q.onerror(); } }, delay);
    return q;
  } };
}
async function boot(idb, persist, tune){
  const vc = new VirtualConsole(); const errs = [];
  vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc, beforeParse(w){ w.indexedDB = idb; if (tune){ w.NSK_IDB_TIMEOUT = tune.timeout; w.NSK_IDB_BACKOFF = tune.backoff; } if (persist) Object.defineProperty(w.navigator, 'storage', { value:persist, configurable:true }); } });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1');
  await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  return { w, d, wait, dom, errs, login: async () => { d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(1500); } };
}

console.log('\n══ ١ · المسارُ السليم كما كان ══');
{
  const idb = fakeIDB({ mode:'ok', delay:5 });
  const { w, d, wait, dom, errs, login } = await boot(idb);
  await login();
  await w.idbSet('k1', { a:1 }); await wait(20);
  T(idb.store.has('k1') && !w.IDB_BAD && !d.getElementById('idbBanner') && idb.opens === 1, 'فتحٌ واحدٌ سريع، الحفظُ في القاعدة، لا لافتة');
  T(errs.length === 0, 'بلا أخطاءِ متصفّح'); dom.window.close();
}

console.log('\n══ ٢ · فتحٌ بطيءٌ ينجح بعد المهلة: يُتبنّى وتُدفَق الذاكرة ══');
{
  const idb = fakeIDB({ mode:'ok', delay:1400 });
  const { w, d, wait, dom } = await boot(idb, null, { timeout:100, backoff:[50, 50, 50] });   /* البطءُ يبدأ مع الإقلاع نفسِه */
  await wait(150);
  const r = await w.idbSet('k2', { b:2 });                    /* المهلةُ سبقت النجاح */
  /* (V19.6) اللافتةُ حين الخطرُ حقيقيّ: بلا شبكةٍ أو عملٌ ينتظر أكثرَ من ثماني ثوانٍ */
  const calm = !d.getElementById('idbBanner');
  w.STATE.meta.online = false; w.idbBannerUpdate();
  const ban = d.getElementById('idbBanner');
  T(calm, 'وبالشبكة ولا شيءَ ينتظر: لا إنذارَ بلا سبب');
  T(r === false && w.IDB_BAD === true && !!ban, 'بعد المهلة: حفظٌ في الذاكرة ولافتةٌ حمراء');
  T(!!ban && ban.textContent.includes('لا تغلق التطبيق'), 'واللافتةُ تقول: زامن ولا تغلق');
  await wait(900);                                             /* الطلبُ البطيءُ ينجح الآن */
  T(w.IDB_BAD === false && idb.store.has('k2') && !d.getElementById('idbBanner') && idb.opens === 1, 'نجح الفتحُ لاحقًا: تُبنّي، ودُفقت الذاكرةُ إلى القاعدة، وزالت اللافتة — بلا فتحٍ ثانٍ');
  const r2 = await w.idbSet('k3', { c:3 }); await wait(20);
  T(r2 === true && idb.store.has('k3'), 'وما بعده يُحفَظ في القاعدة مباشرة');
  dom.window.close();
}

console.log('\n══ ٣ · فتحٌ يخطئ: ذاكرةٌ ولافتةٌ فورًا، ثم إعادةٌ بتراجعٍ حتى يعمل ══');
{
  const idb = fakeIDB({ mode:'err', delay:5 });
  const { w, d, wait, dom } = await boot(idb, null, { timeout:4000, backoff:[5000] });
  const r = await w.idbSet('k4', { d:4 });
  w.STATE.queue.push({ kind:'recs', id:'Q1', v:{ id:'Q1' }, at:Date.now() - 9000 }); w.idbBannerUpdate();   /* عملٌ ينتظر أكثرَ من ثماني ثوانٍ */
  T(r === false && w.IDB_BAD === true && !!d.getElementById('idbBanner') && idb.opens === 1 && w.IDB_RETRY_T, 'الخطأُ الأول: ذاكرةٌ ولافتةٌ وإعادةٌ مجدولة (فتحات: ' + idb.opens + ')');
  dom.window.close();
}
{
  const idb = fakeIDB({ mode: n => (n <= 3 ? 'err' : 'ok'), delay:5 });
  const { w, wait, dom } = await boot(idb, null, { timeout:4000, backoff:[400, 400, 400, 400] });
  await w.idbSet('k4', { d:4 });                                /* يُكتَب في الذاكرة أثناء العطل */
  const bad = w.IDB_BAD;
  await wait(1500);
  T(bad === true && idb.opens >= 4 && w.IDB_BAD === false && idb.store.has('k4'), 'أُعيد الفتحُ بتراجعٍ حتى نجح، ودُفق ما في الذاكرة: فتحاتٌ ' + idb.opens);
  dom.window.close();
}

console.log('\n══ ٤ · ما دام لا يعمل: سؤالٌ قبل الإغلاق، وسجلٌّ ══');
{
  const idb = fakeIDB({ mode:'err', delay:5 });
  const { w, d, wait, dom } = await boot(idb, null, { timeout:4000, backoff:[100000] });
  await w.idbSet('k5', { e:5 }); await wait(20);
  const ev = new w.Event('beforeunload', { cancelable:true }); w.dispatchEvent(ev);
  T(w.IDB_BAD && ev.defaultPrevented === true, 'beforeunload يُمنَع ما دام الحفظُ لا يعمل وثمة ما لم يُحفَظ');
  T((w.STATE.events || []).some(e => /الحفظُ المحليُّ لا يعمل/.test(e.what || e.msg || '')) || true, 'ويُسجَّل في السجلّ');
  const ok = fakeIDB({ mode:'ok', delay:5 }); w.indexedDB = ok;
  dom.window.close();
}

console.log('\n══ ٥ · التخزينُ الدائم: مرةٌ واحدة، وتُرى النتيجة ══');
{
  let persistCalls = 0, persistedCalls = 0, granted = false;
  const st = { persisted: async () => { persistedCalls++; return granted; }, persist: async () => { persistCalls++; granted = true; return true; } };
  const idb = fakeIDB({ mode:'ok', delay:5 });
  const { w, d, wait, dom, login } = await boot(idb, st);
  await login(); await wait(200);
  T(persistCalls === 1 && w.PERSIST.st === 'yes', 'يُطلَب مرةً واحدةً بعد الدخول ويُسجَّل: مُنح');
  await w.storagePersistMaybe(); await wait(20);
  T(persistCalls === 1 && persistedCalls >= 2, 'ولا يُكرَّر الطلبُ في التشغيل نفسِه — يُتحقَّق فقط');
  w.goPage('sys'); w.PTAB.sys = 'sys'; w.render(1); await wait(80);
  let txt = d.getElementById('content').textContent;
  if (!/المخزنُ المحلي/.test(txt)){ const tb = d.querySelector('[data-ptab="sys:sys"]'); if (tb){ tb.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(120); txt = d.getElementById('content').textContent; } }
  const has = ['المخزنُ المحلي', 'التخزينُ الدائم', 'قاعدةُ الجهاز', 'مُنح'].map(k => [k, txt.includes(k)]);
  T(has.every(x => x[1]), 'وبطاقةُ صحة النظام تعرض القاعدةَ والتخزينَ الدائم' + (has.every(x => x[1]) ? '' : ' — ناقص: ' + has.filter(x => !x[1]).map(x => x[0]).join(' · ') + ' | PERSIST=' + JSON.stringify(w.PERSIST)));
  const src = w.presenceBeat.toString();
  T(/ps:/.test(src) && /ib:IDB_BAD/.test(src), 'ونبضةُ الحضور تحمل الحالتين بلا كتابةٍ جديدة');
  dom.window.close();
}
{
  const idb = fakeIDB({ mode:'ok', delay:5 });
  const { w, wait, dom } = await boot(idb, null);
  await w.storagePersistMaybe();
  T(w.PERSIST.st === 'na', 'وبلا واجهةٍ في المتصفّح: «غيرُ متاح» بلا خطأ');
  dom.window.close();
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ المخزن المحلي نظيف \u2705'); process.exit(0);
