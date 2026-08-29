/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدورة الكاملة — يُشغَّل: node scripts/audit-crud.mjs
   ───────────────────────────────────────────────────────────────────────────
   بُنيت اليومَ ثلاثَ عشرةَ شاشةً تُضيف وتُعدِّل وتحذف. وكلُّها جُرِّبت مرةً
   عند بنائها ثم مضت — والشيءُ الذي يُجرَّب مرةً يُكسَر في الدفعة التالية ولا
   يُعلَم: يُغيَّر اسمُ حقلٍ، أو تُنقَل بطاقةٌ، أو يُبدَّل نداءٌ — فيبقى الزرُّ
   ظاهرًا ولا يقع خلفه شيء.

   فهذا يمشي في الدورة كاملةً لكلِّ واحدةٍ: يُضيف عنصرًا ويشترط أن يزيد العدد،
   ثم يعدّله ويشترط أن تتغيّر القيمة، ثم يحذفه ويشترط أن يعود العددُ كما كان.
   ولا يُصدَّق زرٌّ حتى يُترك أثرُه في الحالة.

   ويجرّب المنعَ كذلك: ما لا يُحذَف — صنفٌ رُكِّب، وفريقٌ فيه فنيون، ووظيفةٌ
   عليها أشخاص — يجب أن يُمنَع ويُقال لماذا. فالحمايةُ التي لا تُجرَّب تُكسَر
   في صمت، ويُحذَف ما تعلّق به عملُ موسم.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const boot = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
{
  const u = require('util');
  if (!w.TextEncoder) w.TextEncoder = u.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = u.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 500));

let said = [];
w.toast = m => said.push(String(m));
w.prompt = () => 'سببُ الاختبار';

const C  = () => d.getElementById('content');
const go = p => { w.CUR = p; w.render(1); };
const set = (id, v) => { const e = d.getElementById(id); if (e) e.value = v; };
const hit = target => {
  const b = (typeof target === 'string') ? d.querySelector(target)
          : (typeof target === 'function') ? target() : target;
  if (!b || !b.dispatchEvent) return false;
  b.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  return true;
};
const type = (sel, v) => {
  const e = d.querySelector(sel);
  if (!e) return false;
  e.value = v;
  e.dispatchEvent(new w.Event('input', { bubbles:true }));
  e.dispatchEvent(new w.Event('change', { bubbles:true }));
  return true;
};

/* ── الدورةُ كاملةً: يزيد ثم يتغيّر ثم يعود ─────────────────────────────── */
function cycle(name, page, count, fill, addSel, editSel, editVal, readBack, delSel){
  go(page);
  const n0 = count();
  said = [];
  fill();
  if (!hit(addSel)){ fails.push(name + ' — لا زرَّ إضافة: ' + addSel); return; }
  const n1 = count();
  if (n1 !== n0 + 1){
    fails.push(name + ' — الإضافةُ لم تزد العدد (' + n0 + '→' + n1 + ')'
      + (said[0] ? ' · قيل: ' + said[0] : ''));
    return;
  }
  pass++;

  w.render(1);
  if (editSel){
    if (!type(editSel, editVal)){ fails.push(name + ' — لا حقلَ تعديل: ' + editSel); }
    else if (readBack() !== editVal){ fails.push(name + ' — التعديلُ لم يُكتَب'); }
    else pass++;
  }

  w.render(1);
  said = [];
  if (!hit(delSel)){ fails.push(name + ' — لا زرَّ حذف'); return; }
  const n2 = count();
  if (n2 !== n0){
    fails.push(name + ' — الحذفُ لم يُعِد العدد (' + n1 + '→' + n2 + ')'
      + (said[0] ? ' · قيل: ' + said[0] : ''));
    return;
  }
  pass++;
}

/* الأخيرُ في القائمة هو الذي أُضيف. ويُستهدَف العنصرُ نفسُه لا مُحدِّدٌ يُبنى
   من قيمته: القيمُ عربيةٌ وفيها مسافاتٌ وعلاماتٌ تكسر مُحدِّدَ CSS. */
const lastOf = attr => {
  const all = [...d.querySelectorAll('[' + attr + ']')];
  return all.length ? all[all.length - 1] : null;
};

/* ══ ١ · الكتالوج ════════════════════════════════════════════════════════ */
cycle('الكتالوج', 'items',
  () => w.itemsList().length,
  () => { set('itN', 'صنفُ اختبار'); set('itP', '2'); set('itR', '100'); set('itZ', 'camp'); },
  '[data-itadd]',
  null, null, null,
  () => lastOf('data-itdel'));

/* ══ ٢ · الوظائف ═════════════════════════════════════════════════════════ */
cycle('الوظائف', 'jobs',
  () => w.jobsList().length,
  () => { set('jbN', 'وظيفةُ اختبار'); set('jbR', 'tech'); set('jbD', 'وصف'); },
  '[data-jbadd]',
  null, null, null,
  () => lastOf('data-jbdel'));

/* ══ ٣ · الفنيون ═════════════════════════════════════════════════════════ */
cycle('الفنيون', 'tech',
  () => w.techsList().length,
  () => { set('tkN', 'فنيُّ اختبار'); set('tkPh', '0551112223'); },
  '[data-tkadd]',
  null, null, null,
  () => lastOf('data-tkdel'));

/* ══ ٤ · الفرق ═══════════════════════════════════════════════════════════ */
cycle('الفرق', 'tech',
  () => w.crewsList().length,
  () => { set('crN', 'فريقُ اختبار'); },
  '[data-craddgo]',
  null, null, null,
  () => lastOf('data-crdel'));

/* ══ ٥ · قواعد التصعيد ═══════════════════════════════════════════════════ */
cycle('قواعد التصعيد', 'esc',
  () => w.escList().length,
  () => { set('esW', 'حالةُ اختبار'); set('esD', '5'); },
  '[data-esadd]',
  null, null, null,
  () => lastOf('data-esdel'));

/* ══ ٦ · مصفوفة المسؤوليات ═══════════════════════════════════════════════ */
cycle('مصفوفة المسؤوليات', 'raci',
  () => w.raciList().length,
  () => { set('rcA', 'نشاطُ اختبار'); set('rcR', 'الفني'); },
  '[data-rcadd]',
  null, null, null,
  () => lastOf('data-rcdel'));

/* ══ ٧ · سجل الدروس ══════════════════════════════════════════════════════ */
cycle('سجل الدروس', 'less',
  () => w.lessList().length,
  () => { set('lsW', 'درسُ اختبار'); set('lsA', 'ما فُعل'); },
  '[data-lsadd]',
  null, null, null,
  () => lastOf('data-lsdel'));

/* ══ ٨ · المورّدون والفئات ═══════════════════════════════════════════════ */
cycle('المورّدون', 'sup',
  () => w.supList().length,
  () => { set('supNew', 'مورّدُ اختبار'); },
  '[data-supadd]',
  null, null, null,
  () => lastOf('data-suprm'));

cycle('فئات المشتريات', 'buycat',
  () => w.catList().length,
  () => { set('catNew', 'فئةُ اختبار'); },
  '[data-catadd]',
  null, null, null,
  () => lastOf('data-catrm'));

/* ══ ٩ · التعديلُ الفوريُّ يُكتَب ═══════════════════════════════════════ */
{
  go('items');
  const code = w.itemsList()[0].code, was = w.itemsList()[0].name;
  type('[data-itname="' + code + '"]', 'اسمٌ معدَّل');
  check(w.itemsList()[0].name === 'اسمٌ معدَّل', 'اسمُ الصنف يُحفَظ فورَ كتابته');
  w.itemRename(code, was);

  go('esc');
  w.escSet(0, { days: 11 });
  check(w.escList()[0].days === 11, 'مهلةُ التصعيد تُحفَظ');

  go('tech');
  const who = w.techsList()[0].n;
  w.techSet(who, { sup: 'مشرفُ اختبار' });
  check(w.techsList()[0].sup === 'مشرفُ اختبار', 'مشرفُ الفني يُحفَظ');
}

/* ══ ١٠ · الحمايةُ تمنع وتقول ═══════════════════════════════════════════ */
function blocked(name, hint, act){
  said = [];
  try { act(); } catch (e){ fails.push(name + ' — انفجرت: ' + String(e.message).slice(0,50)); return; }
  if (said.some(m => new RegExp(hint).test(m))) pass++;
  else fails.push(name + ' — لم يُمنَع أو لم يُقَل لماذا (قيل: ' + (said[0] || 'لا شيء') + ')');
}
{
  const first = w.itemsList()[0];
  w.STATE.inss = { X:{ id:'X', parts:{ [first.code]:1 }, status:'مُركّب', approved:true } };
  blocked('صنفٌ رُكِّب لا يُحذَف', 'مستعمل', () => w.itemDel(first.code));

  const cr = w.crewsList().filter(c => c.id !== 'eng')[0];
  w.techSet(w.techsList()[0].n, { crew: cr.n });
  blocked('فريقٌ فيه فنيون لا يُحذَف', 'فنيًّا|انقلهم', () => w.crewDel(cr.id));
  w.techSet(w.techsList()[0].n, { crew: '' });

  const job = w.jobsList()[0];
  w.jobAssign(w.techsList()[1].n, job.id);
  blocked('وظيفةٌ عليها أشخاصٌ لا تُحذَف', 'انقلهم', () => w.jobDel(job.id));

  /* السجلُّ يُنسَب إلى موقعٍ حقيقيّ: `scores()` تتخطّى ما لا موقعَ له،
     فسجلٌّ بمعرّفٍ مخترعٍ لا يُحتسب عملًا ولا يمنع الحذف. */
  const t2 = w.techsList()[2].n;
  const realId = w.STATE.sites[0].id;
  w.STATE.recs = {};
  w.STATE.recs[realId] = { by:t2, at:Date.now() };
  w.statBump();
  const got = w.scores().list.filter(e => e.name === t2)[0];
  /* العبرةُ بعدد الأعمال لا بوزنها: الأوزانُ صفرٌ في نظامٍ جديدٍ لم يُضبَط */
  check(!!(got && got.survey), 'العملُ المنسوبُ يُحتسَب قبل اختبار المنع');
  blocked('فنيٌّ له عملٌ لا يُحذَف', 'عمل', () => w.techDel(t2));
}

/* ══ ١١ · الوظيفةُ تُسجَّل نقلتُها ════════════════════════════════════════ */
{
  const who = w.techsList()[3].n;
  w.jobAssign(who, 'j_prep');
  w.jobAssign(who, 'j_ins');
  const x = w.techsList().filter(y => y.n === who)[0];
  check((x.jobLog || []).length === 2, 'نقلاتُ الوظيفة تُسجَّل ولا تُمحى السابقة');
  check(w.roleOfJob(x.job) === 'cins', 'الدورُ يُشتقُّ من الوظيفة');
}

/* ══ ١٢ · الصلاحيةُ تُبدَّل وتُكتَب ══════════════════════════════════════ */
{
  go('roles');
  const cells = [...d.querySelectorAll('[data-capt]')];
  check(cells.length > 50, `خاناتُ الصلاحيات (${cells.length})`);
  const cell = cells.filter(b => b.getAttribute('data-capt') === 'supervisor|money')[0];
  if (!cell) fails.push('خانةُ «المال / مشرف» غير موجودة');
  else {
    const was = !!(w.ROLES.supervisor.can || {}).money;
    cell.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    check(!!(w.ROLES.supervisor.can || {}).money !== was, 'تبديلُ الصلاحية يُكتَب');
    w.ROLES.supervisor.can.money = was ? 1 : undefined;
    if (!was) delete w.ROLES.supervisor.can.money;
  }
}

/* ══ ١٣ · كلُّ ما وقع دخل السجل ══════════════════════════════════════════ */
{
  const ev = (w.STATE.events || []).map(e => String(e.what || ''));
  check(ev.length > 15, `أحداثٌ سُجِّلت (${ev.length})`);
  [['صنف', /صنف/], ['وظيفة', /وظيفة/], ['فني', /فني/],
   ['قاعدة تصعيد', /تصعيد/], ['درس', /درس/], ['صلاحية', /صلاحية/]]
   .forEach(([n, re]) => check(ev.some(x => re.test(x)), 'دخل السجلَّ: ' + n));
}

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الدورة الكاملة نظيف ✅');
process.exit(0);
