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
/* V16.11: الإدارةُ الكلَّ، ومن دونها إلى المشرف شجرتَه (tree:true)، والميدانُ ما كتبه —
   ومن له إنصاتٌ لا يسحب دوريًّا: السحبُ شبكةُ أمانٍ كلَّ ستِّ ساعات. */
T(/function pullScope\(\)/.test(js) && /r === 'exec' \|\| r === 'admin' \|\| isBossHere\(\) \|\| rankOf\(ROLE\) >= rankOf\('engineer'\)\) return \{ cols:ALL_WORK, mine:false, tree:false, every:21600000 \}/.test(js)
  && /rankOf\(ROLE\) >= rankOf\('supervisor'\)\) return \{ cols:ALL_WORK, mine:false, tree:false, every:21600000 \}/.test(js),
  'نطاقُ السحب: الإدارةُ والمهندسون والمشرفون الكلَّ، والوزارةُ الأرقامَ، والميدانُ ما كتبه');
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
  T(sc.mine === false && sc.tree === false && sc.cols.includes('tasks'),
    'المشرفُ يرى ما تمّ للجميع — لا فنيّيه وحدَهم (V16.35: قرارُ صاحب المشروع)');
  /* والشجرةُ تبقى للتكليف والمتابعة: underNames يحدّد من تحته في لوحة الفريق */
  w.STATE.users = { 'u-supervisor':{ name:'مشرف', role:'supervisor' }, 't1':{ name:'فني ١', role:'tech', sup:'مشرف' },
                    'x9':{ name:'فني غريب', role:'tech', sup:'مشرف آخر' } };
  T(w.underNames('مشرف').join(',') === 'فني ١', 'وشجرتُه تبقى للتكليف — فنيّه لا فنيُّ غيره', w.underNames('مشرف').join(','));
}
{ const { w } = await boot('tech', 'فني');
  /* V16.16: الإشعارُ يُولَد عند الوصول — الفنيُّ يُخبَر بإسنادٍ كتبه المكتب */
  w.STATE.meta.notifAt = 1; w.STATE.notifs = [];
  w.CORE.applyDoc('tasks', 'TK-n1', { id:'TK-n1', no:'SR-9', site:'S1', kind:'visit', to:'فني', assignedTo:'فني', status:'مطلوب', _at:Date.now(), _by:'u-office' });
  T(w.STATE.notifs.length === 1 && w.STATE.notifs[0].kind === 'إسناد', 'إسنادٌ يصل الفنيَّ إشعارًا حين تصل وثيقتُه', JSON.stringify(w.STATE.notifs[0] || {}).slice(0, 80));
  w.CORE.applyDoc('tasks', 'TK-n1', { id:'TK-n1', no:'SR-9', site:'S1', kind:'visit', to:'فني', assignedTo:'فني', status:'مطلوب', _at:Date.now(), _by:'u-office' });
  T(w.STATE.notifs.length === 1, 'ولا يُكرَّر الإشعارُ لوصول الوثيقة نفسِها');
  w.CORE.applyDoc('recs', 'S1', { id:'S1', by:'فني', access:'تم الوصول', review:'approved', reviewBy:'مهندس', _at:Date.now(), _by:'u-eng' });
  T(w.STATE.notifs.length === 2 && w.STATE.notifs[0].kind === 'اعتماد', 'واعتمادُ زيارته يصله إشعارًا', (w.STATE.notifs[0] || {}).kind);
  const sc = w.pullScope();
  T(sc.mine === true && !sc.cols.includes('tasks') && sc.every === 21600000, 'الفنيُّ يُنصِت إلى ما كتبه ومهامِّه — والسحبُ شبكةُ أمانٍ كلَّ ستِّ ساعات');
  const logF = []; w.FB.ready = true; w.FB.db = fakeDb(w, {}, logF); w.liveSmall = w.__real.liveSmall; w.liveSmall();
  const lf = logF.filter(x => x.listen && ['recs','inss','dismantles','maints'].includes(x.col));
  T(lf.length === 4 && lf.every(x => x.wheres.some(y => y[0] === '_by' && y[2] === 'u-tech') && x.wheres.some(y => y[0] === '_at')), 'أربعةُ إنصاتاتٍ على ما كتبه هو — بعد بدء الجلسة', String(lf.length));
  const log = []; w.FB.ready = true; w.FB.db = fakeDb(w, {}, log); w.liveSmall = w.__real.liveSmall; w.liveSmall();
  T(!log.some(x => x.listen && x.col === 'recs' && !x.wheres.some(y => y[0] === '_by' && y[2] === 'u-tech')), 'ولا يُنصِت إلى زيارات غيره — ما كتبه هو فقط');
}
{ const { w } = await boot('viewer', 'وزارة');
  const sc = w.pullScope();
  T(sc.cols.join(',') === 'stats', 'الوزارةُ الأرقامَ وحدَها');
}
{ const { w } = await boot('engineer', 'مهندس');
  w.STATE.meta.notifAt = 1; w.STATE.notifs = [];
  w.CORE.applyDoc('recs', 'S2', { id:'S2', by:'فني', access:'تم الوصول', review:'pending', at:Date.now(), _at:Date.now(), _by:'u-tech' });
  T(w.STATE.notifs.length === 1 && w.STATE.notifs[0].kind === 'زيارة تمّت', 'زيارةٌ حفظها الميدانُ تصل المهندسَ إشعارًا بانتظار اعتماده', (w.STATE.notifs[0] || {}).kind);
  w.STATE.meta.notifAt = 0; w.STATE.notifs = [];
  w.CORE.applyDoc('recs', 'S3', { id:'S3', by:'فني', access:'تم الوصول', review:'pending', at:1, _at:1, _by:'u-tech' });
  T(w.STATE.notifs.length === 0 && w.STATE.meta.notifAt > 0, 'وأوّلُ دخولٍ لا يُخبَر بالتاريخ — تُضبَط العلامةُ وحدَها');
}
console.log(bad ? '\nجردُ الرؤية من فوق فشل ✗ (' + bad + ')' : '\nمن فوقُ يرى ما تحته — لحظةً بلحظة وبمؤشِّرٍ لا يقفز ✅');
process.exit(bad ? 1 : 0);
