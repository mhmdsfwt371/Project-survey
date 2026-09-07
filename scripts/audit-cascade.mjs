/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الرؤية من فوق — node scripts/audit-cascade.mjs
   ───────────────────────────────────────────────────────────────────────────
   «كلُّ دورٍ أكبر يرى شغلَ اللي تحته»: الإدارةُ العليا لم تكن ترى اعتمادَ
   المهندس، والمديرُ لم يرَ إسنادَ المهندس بعد مزامنتين. الجذران: نطاقُ السحب
   كان بالقدرات لا بالرتبة فسقط المشرفُ والإدارةُ العليا في «ما كتبتُه أنا»؛
   والمؤشِّرُ كان «آخر مزامنة» التي تقفز مع كلِّ نبضٍ فيضيع الفارق. فهذا يُثبت:
   النطاقَ بالرتبة، والمؤشِّرَ الخاصَّ بالسحب وتداخلَه وحفظَه، والإنصاتَ الحيَّ
   على العمل لمن فوق المشرف، ودورةً واحدةً من دقيقة تدفع كلَّ مرةٍ وتسحب في موعدها.
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
T(/function pullScope\(\)/.test(js) && /rankOf\(ROLE\) >= rankOf\('supervisor'\) \|\| r === 'exec' \|\| r === 'admin'/.test(js), 'نطاقُ السحب بالرتبة: المشرفُ فما فوق والإدارةُ العليا يرون الكلّ');
T(/var since = \(at\[c\] \|\| 0\) - 120000;/.test(js) && !/var since = STATE\.meta\.lastSync/.test(js), 'المؤشِّرُ خاصٌّ بالسحب بتداخل دقيقتين — لا «آخر مزامنة»');
T(/pullAt:STATE\.meta\.pullAt \|\| \{\}/.test(js) && /STATE\.meta\.pullAt = v\.pullAt/.test(js), 'ويُحفَظ ويُستعاد');
T(/PULL_COL = \{ recs:'recs', inss:'inss', tasks:'tasks', dismantles:'diss', maints:'maints'/.test(js), 'وكلُّ مجموعةٍ تصل مفتاحَها في الحالة');
T(/\['recs','inss','tasks','dismantles','maints'\]\.forEach\(function\(col\)\{[\s\S]{0,700}\['_at', '>', t0\]/.test(js), 'إنصاتٌ حيٌّ على العمل لمن فوق المشرف');
T(/var SYNC_CYCLE = 60/.test(js) && !/\}, 120000\);/.test(js), 'دورةٌ واحدةٌ من دقيقة — لا دورةَ ثانية');
T(/var due = PULL_ASK \|\| \(Date\.now\(\) - PULL_LAST >= pullScope\(\)\.every\)/.test(js), 'الدفعُ كلَّ دقيقةٍ والسحبُ في موعد النطاق');

/* ═══ تشغيل ═══ */
async function boot(role, name){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await wait(900);
  const real = { pullDelta:w.pullDelta, liveSmall:w.liveSmall };
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
  w.STATE.meta.uid = 'u-' + role;
  d.getElementById('lgU').value = role + '.a'; d.getElementById('lgP').value = 'rightpass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(1800);
  w.STATE.meta.name = name;
  w.__real = real;
  return { w, d };
}
/* قاعدةٌ صوريةٌ تسجّل الاستعلامَ وتردّ وثائقَ */
function fakeDb(w, docsByCol, log){
  return { collection(col){
    const q = { col, wheres:[], lim:0,
      where(f, op, v){ this.wheres.push([f, op, v]); return this; },
      limit(n){ this.lim = n; return this; },
      get(){ log.push({ col, wheres:this.wheres.slice(), lim:this.lim });
        const docs = (docsByCol[col] || []).map(x => ({ id:x.id, data:() => x }));
        return Promise.resolve({ size:docs.length, forEach:fn => docs.forEach(fn) }); },
      onSnapshot(fn){ log.push({ col, wheres:this.wheres.slice(), listen:true, fn }); return () => {}; },
      doc(){ return { get:() => Promise.resolve({ exists:false }) }; } };
    return q; } };
}
{ const { w, d } = await boot('exec', 'إدارة عليا');
  const sc = w.pullScope();
  T(sc.cols.join(',') === 'recs,inss,tasks,dismantles,maints' && sc.mine === false, 'الإدارةُ العليا تسحب العملَ كلَّه لا ما كتبته', sc.cols.join(','));
  /* المؤشِّرُ لا يقفز مع «آخر مزامنة» */
  const log = []; const T0 = Date.now() - 3600000;
  w.FB.ready = true; w.FB.db = fakeDb(w, { recs:[{ id:'R-new', _at:Date.now(), by:'فني', access:'تم الوصول', review:'pending' }],
    tasks:[{ id:'TK-visit-X', site:w.STATE.sites[0].id, kind:'visit', to:'فني', assignedTo:'u-t', status:'مطلوب', _at:Date.now() }],
    dismantles:[{ id:'D1', status:'مجدول' }] }, log);
  w.STATE.meta.lastSync = Date.now(); w.STATE.meta.pullAt = { recs:T0, inss:T0, tasks:T0 };
  w.pullDelta = w.__real.pullDelta; /* الحقيقية لا الصورية */
  const got = await w.pullDelta();
  const rq = log.find(x => x.col === 'recs');
  const atW = rq && rq.wheres.find(x => x[0] === '_at');
  T(!!atW && atW[1] === '>' && atW[2] === T0 - 120000, 'الفارقُ من مؤشِّر السحب ناقصَ دقيقتين لا من «آخر مزامنة»', atW && String(atW[2] - T0));
  T(!rq.wheres.some(x => x[0] === '_by'), 'وبلا قيدِ «ما كتبتُه أنا»');
  const dq = log.find(x => x.col === 'dismantles');
  T(!!dq && !dq.wheres.some(x => x[0] === '_at') && dq.lim >= 6000, 'والباردةُ بلا مؤشِّرٍ وبسقفٍ يسع ألفًا وسبعمئة', dq && String(dq.lim));
  T(got === 3 && !!w.STATE.recs['R-new'] && !!w.STATE.tasks['TK-visit-X'] && !!w.STATE.diss.D1, 'ما وصل يدخل مفاتيحَه في الحالة (الفكُّ في diss)', String(got));
  T(w.STATE.meta.pullAt.recs > T0 && w.STATE.meta.pullAt.dismantles > 0, 'ويتقدّم المؤشِّرُ بعد النجاح');
  /* الإنصاتُ الحيّ */
  log.length = 0; w.liveSmall = w.__real.liveSmall; w.liveSmall();
  const listens = log.filter(x => x.listen).map(x => x.col);
  T(['recs','inss','tasks','dismantles','maints'].every(c => listens.includes(c)), 'الإدارةُ العليا تُنصِت إلى العمل كلِّه', listens.join(','));
  const lr = log.find(x => x.listen && x.col === 'inss');
  T(lr.wheres.some(x => x[0] === '_at' && x[1] === '>'), 'بشرط ما تغيّر بعد بدء الجلسة');
  /* وثيقةٌ تصل بالإنصات تُرى في الشاشة */
  w.CUR = 'exec'; w.render(1);
  let rendered = 0; const origR = w.render; w.render = function(){ rendered++; return origR.apply(this, arguments); };
  lr.fn({ metadata:{ fromCache:false }, docChanges:() => [{ type:'added', doc:{ id:'IN-live', data:() => ({ id:'IN-live', status:'مُركّب', approved:true, _at:Date.now() }) } }] });
  T(!!w.STATE.inss['IN-live'] && rendered >= 1, 'تركيبٌ اعتمده المهندسُ يصل الإدارةَ العليا ويُعاد رسمُ الشاشة', 'rendered=' + rendered);
}
{ const { w } = await boot('supervisor', 'مشرف');
  const sc = w.pullScope();
  T(sc.mine === false && sc.cols.includes('tasks'), 'المشرفُ يرى زياراتِ فنيّيه وإسناداتِهم لا زياراتِه وحده');
}
{ const { w } = await boot('tech', 'فني');
  const sc = w.pullScope();
  T(sc.mine === true && !sc.cols.includes('tasks') && sc.every === 900000, 'الفنيُّ يسحب ما كتبه هو كلَّ ربع ساعة — ومهامُّه بالإنصات');
  const log = []; w.FB.ready = true; w.FB.db = fakeDb(w, {}, log); w.liveSmall = w.__real.liveSmall; w.liveSmall();
  T(!log.some(x => x.listen && x.col === 'recs'), 'ولا يُنصِت إلى زيارات غيره');
}
{ const { w } = await boot('viewer', 'وزارة');
  const sc = w.pullScope();
  T(sc.cols.join(',') === 'stats', 'الوزارةُ الأرقامَ وحدَها');
}
console.log(bad ? '\nجردُ الرؤية من فوق فشل ✗ (' + bad + ')' : '\nمن فوقُ يرى ما تحته — لحظةً بلحظة وبمؤشِّرٍ لا يقفز ✅');
process.exit(bad ? 1 : 0);
