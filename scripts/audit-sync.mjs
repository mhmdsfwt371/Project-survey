/* ═══════════════════════════════════════════════════════════════════════════
   جردُ عدّاد المزامنة والسجلات وطلبات الإنشاء — node scripts/audit-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   ثلاثُ صورٍ من الميدان: «السجلات» لا تُفتَح — العنوانُ يتبدّل والمحتوى يبقى
   على الصفحة السابقة، لأن وقتَ الحدث نصٌّ عربيٌّ حُوِّل تاريخًا فانفجر الرسم.
   والعدّادُ بجوار «آخر مزامنة» واقف — لم يكن عدّادًا أصلًا بل وقتًا محفورًا.
   وطلباتُ الإنشاء تبقى «تمّ» بعد حذف أصحابها. فهذا يمسك الثلاثة: يسجّل حدثًا
   حقيقيًّا ويفتح السجلات، ويرى العدَّ يتحرّك ويُزامِن عند الصفر ويُعاد، ويحذف
   حسابًا فيذهب طلبُه معه ويمسح المنتهيةَ بزرّها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ═══ ساكن ═══ */
T(!/new Date\(e\.at \|\| Date\.now\(\)\)\.toISOString/.test(js), 'وقتُ الحدث لا يُحوَّل تاريخًا من نصٍّ');
T(/id="syncCd"/.test(js) && /SYNC_CYCLE = 60/.test(js), 'عدّادُ دقيقةٍ في الرأس');
T(!/setInterval\(function\(\)\{\s*\n\s*if \(STATE\.meta\.online && FB\.ready\) FB\.pull\(0\)/.test(js), 'لا سحبَ دوريًّا ثانيًا موازيًا للعدّاد');
T(/function provClear/.test(js) && /data-provclear/.test(js), 'زرُّ مسح الطلبات المنتهية موصول');
T(!/\['المسح','٠','acc'\]/.test(js), 'أرقامُ «الأدوات» لا تُكتَب أصفارًا');

/* ═══ تشغيل ═══ */
const vc = new VirtualConsole();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await wait(900);
let pulls = 0, flushes = 0;
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس الجرد' });
w.FB.legacyDone = () => true; w.pullDelta = () => { pulls++; return Promise.resolve(0); };
w.liveWatch = () => {}; w.liveSmall = () => {};
w.STATE.meta.uid = 'u-eng';
d.getElementById('lgU').value = 'eng.a'; d.getElementById('lgP').value = 'rightpass12';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(2200);
T(w.ROLE === 'engineer', 'دخل مهندسًا', w.ROLE);

/* ١ · السجلات بحدثٍ حقيقيّ */
w.logEvent('حدثُ الجرد الحقيقيّ');
w.CUR = 'tools'; w.render(1);
d.querySelector('.nav a[data-p="recs"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(50);
let c = d.getElementById('content');
T(w.CUR === 'recs' && /حدثُ الجرد الحقيقيّ/.test(c.textContent) && (d.querySelector('#content h1') || {}).textContent === 'السجلات',
  'السجلاتُ تُفتَح بحدثٍ وقتُه نصّ — لا تبقى على الصفحة السابقة', (d.querySelector('#content h1') || {}).textContent);
const at0 = (w.STATE.events[0] || {}).at;
T(typeof at0 === 'string' && c.textContent.indexOf(at0) > -1, 'ووقتُه يُعرَض كما سُجِّل', String(at0));

/* ٢ · الأدوات: الأرقامُ من الحالة */
w.STATE.queue.push({ kind:'recs', id:'Q1', v:{ id:'Q1' }, at:Date.now() });
w.CUR = 'tools'; w.render(1); c = d.getElementById('content');
const pend = w.CORE.pending();
T(pend >= 1 && new RegExp('غير مزامن[\\s\\S]{0,80}' + w.nm(pend)).test(c.textContent), '«غير مزامن» يُعَدُّ من الطابور', String(pend));

/* ٣ · العدّادُ في الرأس يتحرّك ويُزامِن عند الصفر */
w.STATE.meta.online = true; w.FB.ready = true; w.FB.db = w.FB.db || {};
w.FB.pull = () => Promise.resolve(0);
const realFlush = w.CORE.flush;
w.CORE.flush = () => { flushes++; return Promise.resolve(0); };
/* V16.44: العدّادُ يعدُّ إلى السحب التالي — يُضبَط موعدُ آخر سحبٍ ليكون له ما يعدُّه */
w.PULL_LAST = Date.now();
w.liveTick();
w.syncBadge();
const cd = d.getElementById('syncCd');
T(!!cd, 'عدّادٌ بجوار «آخر مزامنة»');
const v1 = cd && cd.textContent; await wait(1300);
T(cd && cd.textContent !== v1, 'ويتحرّك كلَّ ثانية', v1 + ' → ' + (cd && cd.textContent));
w.SYNC_LEFT = 1; w.PULL_LAST = 0; const p0 = pulls, f0 = flushes; await wait(1400);
T(pulls === p0 + 1 && flushes === f0 + 1, 'عند الصفر: دفعٌ وسحبٌ مرةً واحدة', 'pulls +' + (pulls - p0) + ' flushes +' + (flushes - f0));
T(w.SYNC_LEFT >= w.SYNC_CYCLE - 2, 'ثم يُعاد العدُّ من دقيقة', String(w.SYNC_LEFT));
w.SYNC_LEFT = 42; d.querySelector('[data-pull]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
T(w.SYNC_LEFT === w.SYNC_CYCLE, 'والمزامنةُ اليدويةُ تُعيده أيضًا', String(w.SYNC_LEFT));
w.liveTickStop();

/* ٤ · طلبُ الإنشاء يذهب مع حذف صاحبه — والمنتهيةُ تُمسَح بزرّ */
w.STATE.users = { 'uid-a':{ name:'أحمد', user:'M.Ahmed', role:'tech', active:true },
                  'uid-b':{ name:'باسم', user:'b.basem', role:'tech', active:true },
                  'u-eng':{ name:'مهندس الجرد', user:'eng.a', role:'engineer', active:true } };
w.STATE.provision = { 'm.ahmed':{ user:'m.ahmed', name:'أحمد', role:'tech', status:'done', pass:'x' },
                      'b.basem':{ user:'b.basem', name:'باسم', role:'tech', status:'done' },
                      'c.gone':{ user:'c.gone', name:'ذهب', role:'tech', status:'done' } };
w.confirm = () => true;
w.usrDel('uid-a');
T(!w.STATE.provision['m.ahmed'] && !!w.STATE.provision['b.basem'], 'حذفُ الحساب يمحو طلبَه (بلا حساسيةٍ لحالة الحروف) ويُبقي غيرَه');
T(!!Object.keys(w.STATE.provision).find(k => /^del-/.test(k)), 'ويكتب طلبَ حذفِ حسابِ الدخول للخادم');
w.CUR = 'users'; w.render(1); c = d.getElementById('content');
T(/حسابُه حُذف/.test(c.textContent), 'ومن لا حسابَ له يُعلَّم في القائمة');
const clr = c.querySelector('[data-provclear]');
T(!!clr, 'زرُّ «امسح المنتهية» ظاهرٌ للمهندس');
if (clr) clr.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
T(!Object.keys(w.STATE.provision).some(k => (w.STATE.provision[k] || {}).status === 'done'), 'وبضغطته تُمسَح المنتهية', Object.keys(w.STATE.provision).join(','));

/* ٥ · وثيقةٌ بمعرِّفٍ فارغٍ لا توقف الطابور — ولا تدخله أصلًا */
T(/validId: function\(id\)/.test(js) && /Promise\.resolve\(\)\.then\(function\(\)\{ return FB\.putOne\(it\); \}\)/.test(js), 'المعرِّفُ يُفحَص والانفجارُ المتزامنُ يُحوَّل رفضًا لوثيقته');
w.STATE.queue = []; w.STATE.poison = [];
w.CORE.dirty('provision', '', null);
T(w.STATE.queue.length === 0 && (w.SOFT_ERRS || []).some(e => /معرِّفٌ فارغ/.test(String(e.msg || e.err || ''))), 'معرِّفٌ فارغٌ لا يدخل الطابور ويُقال', w.STATE.queue.length + ' في الطابور');
w.STATE.queue = [{ kind:'provision', id:'', v:null, at:1 }, { kind:'presence', id:'u-eng', v:{ ver:'x' }, at:2 }];
w.STATE.meta.online = true; w.FB.ready = true; w.FB.db = w.FB.db || {};
w.FB.init = () => Promise.resolve(true);
w.FB.push = () => Promise.reject(new Error('PERMISSION_DENIED'));
w.FB.putOne = it => { if (!it.id) throw new Error('Function CollectionReference.doc() cannot be called with an empty path.'); return Promise.resolve(); };
w.CORE._busy = false; w.CORE.flush = realFlush;
/* V16.42: الرفعُ محجوبٌ حتى يُقرأ العهدُ — وقاعدةُ الجرد صوريةٌ لا تُتِمُّ القراءة.
   وهذا الاختبارُ يقيس عزلَ الوثيقة المعطوبة لا حجبَ العهد (وله جردُه في audit-wipe). */
w.EPOCH_PENDING = false;
const sent = await w.CORE.flush();
T(sent === 1 && !w.STATE.queue.some(q => q.kind === 'presence' || !w.CORE.validId(q.id)), 'الوثيقةُ الصالحةُ تُرفَع رغم جارتها الفارغة', 'sent=' + sent + ' بقي=' + w.STATE.queue.map(q => q.kind).join(','));
T(w.STATE.poison.some(p => p.kind === 'provision' && p.id === '' && /معرِّف/.test(p.err)), 'والفارغةُ تُعزَل باسم سببها');
/* provList يحفظ المفتاح */
w.STATE.provision = { 'del-u1':{ action:'delete', uid:'u1', user:'', status:'done', at:1 }, 'm.ok':{ user:'M.OK', status:'done', at:2 } };
const L = w.provList();
T(L.every(r => r.key) && L.find(r => r.key === 'del-u1').user === 'del-u1' && L.find(r => r.key === 'm.ok').user === 'M.OK', 'provList يحمل المفتاحَ ولا يكتب الحقلُ فوقه');
w.STATE.queue = []; w.provClear();
T(w.STATE.queue.every(q => w.CORE.validId(q.id)) && w.STATE.queue.some(q => q.id === 'del-u1') && w.STATE.queue.some(q => q.id === 'm.ok'), 'ومسحُ المنتهية يحذف بالمفتاح لا بالحقل', w.STATE.queue.map(q => q.id).join(','));

console.log(bad ? '\nجردُ المزامنة والسجلات فشل ✗ (' + bad + ')' : '\nالسجلاتُ تُفتَح والعدّادُ يعدّ ويُزامِن والطلباتُ تذهب مع أصحابها ✅');
process.exit(bad ? 1 : 0);
