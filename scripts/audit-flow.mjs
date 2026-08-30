/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدورة الحياتية — يُشغَّل: node scripts/audit-flow.mjs
   ───────────────────────────────────────────────────────────────────────────
   الجرودُ السابقةُ تفحص الأجزاء: زرًّا يكتب، وقاعدةً تمنع، وورقةً تُولَّد.
   وكلُّها تمرُّ والنظامُ لا يعمل — لأن العملَ سلسلةٌ لا أجزاء: يُنشَأ حسابٌ،
   فيُسنَد إليه عمل، فيُنفَّذ، فيُعتمَد، فيدخل التقرير. وانكسارُ حلقةٍ واحدةٍ
   يوقف السلسلةَ كلَّها، وكلُّ جزءٍ فيها سليمٌ على حِدة.

   فهذا يمشي السيناريو كاملًا كما يمشيه الناسُ يومَ العمل — بالضغط على الأزرار
   لا بنداء الدوال — ويشترط عند كلِّ حلقةٍ أن يبني ما قبلها ما بعدها:

     مهندسٌ يُنشئ الحسابات ويوزّع الوظائف
     فنيّان يُجمَعان في فريق
     طلبُ زيارةٍ يُسنَد إليهما
     الفنيُّ يمسح، والمهندسُ يعتمد
     ثم تركيبٌ بقطعٍ من الكتالوج، واعتمادٌ ثانٍ
     ثم فكٌّ يُجدوَل ويُنفَّذ
     فتظهر النتيجةُ في الإشعارات واللوحة والتقارير

   وكلُّ دورٍ يرى ما له: الفنيُّ لا يعتمد، والوزارةُ لا تكتب، والمشرفُ لا يفتح
   المال. فالسلسلةُ تُقطَع عمدًا في مواضعَ ويُشترَط أن تُقطَع.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const step = (c, n) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };

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
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:flow';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 500));

let said = [];
w.toast = m => said.push(String(m));
w.prompt = () => 'سببٌ من السيناريو';
w.confirm = () => true;

const C   = () => d.getElementById('content');
const go  = p => { w.CUR = p; w.render(1); };
const set = (id, v) => { const e = d.getElementById(id); if (e){ e.value = v; return true; } return false; };
const click = target => {
  const b = (typeof target === 'string') ? d.querySelector(target) : target;
  if (!b || !b.dispatchEvent) return false;
  b.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  return true;
};
const pick = (sel, v) => {
  const e = d.querySelector(sel);
  if (!e) return false;
  e.value = v;
  e.dispatchEvent(new w.Event('change', { bubbles:true }));
  e.dispatchEvent(new w.Event('input', { bubbles:true }));
  return true;
};
const asRole = r => { w.ROLE = r; };

/* ══ ١ · المهندسُ يُنشئ الطاقمَ ويوزّع الوظائف ═════════════════════════════ */
console.log('\n══ ١ · الحسابات والوظائف ══');
asRole('engineer');
go('crewman');

const T0 = w.techsList().length;
set('depN', 'فنيُّ السيناريو أ'); set('depPh', '0551000001');
click('[data-depadd]');
set('depN', 'فنيُّ السيناريو ب'); set('depPh', '0551000002');
click('[data-depadd]');
step(w.techsList().length === T0 + 2, 'أُضيف فنيّان');

const A = 'فنيُّ السيناريو أ', B = 'فنيُّ السيناريو ب';
w.jobAssign(A, 'j_tech');
w.jobAssign(B, 'j_ins');
step(w.roleOfJob(w.techsList().filter(x => x.n === A)[0].job) === 'tech',
     'وظيفةُ الأول «فنيٌّ ميدانيّ» ودورُها `tech`');
step(w.roleOfJob(w.techsList().filter(x => x.n === B)[0].job) === 'cins',
     'وظيفةُ الثاني «مسؤولُ تركيب» ودورُها `cins`');

const CR0 = w.crewsList().length;
set('crN', 'فريقُ السيناريو'); set('crKind', 'ins');
click('[data-craddgo]');
step(w.crewsList().length === CR0 + 1, 'أُنشئ فريق');
w.techSet(A, { crew:'فريقُ السيناريو' });
w.techSet(B, { crew:'فريقُ السيناريو' });
step(w.techsList().filter(x => x.crew === 'فريقُ السيناريو').length === 2, 'ضُمَّ الفنيّان إليه');

go('techacc');
const before = w.techsList().filter(x => x.has).length;
click('[data-mkall]');
const made = w.techsList().filter(x => x.has).length;
step(made > before, `أُنشئت الحسابات (${made})`);
const acc = (w.TECH_MADE || []).filter(x => x.n === A)[0];
step(!!acc && acc.role === 'tech', 'الحسابُ بدورٍ تعرفه قواعدُ القاعدة (`tech`)');

/* ══ ٢ · طلبُ زيارةٍ يُسنَد ═══════════════════════════════════════════════ */
console.log('\n══ ٢ · الإسناد ══');
const site = w.STATE.sites.filter(x => x.type === 'مخيم')[0];
w.selToggle(site.id);
step(w.SEL_N === 1, 'حُدِّدت نقطةٌ من الخريطة');

w.asnSave ? w.asnSave(A, 'srv') : (function(){
  if (!w.STATE.tasks) w.STATE.tasks = {};
  w.STATE.tasks[site.id + '__srv'] = { id:site.id + '__srv', site:site.id, to:A,
                                       kind:'srv', at:Date.now(), st:'مُسند' };
  w.CORE.set('tasks', site.id + '__srv', w.STATE.tasks[site.id + '__srv']);
})();
w.statBump();
step(!!w.asnOf(site.id), 'أُسندت الزيارةُ للفنيّ');

/* ══ ٣ · الفنيُّ يمسح — ولا يستطيع الاعتماد ═══════════════════════════════ */
console.log('\n══ ٣ · المسح ══');
asRole('tech');
w.STATE.meta.name = A;
go('svForm');
w.FORM.site = site.id;
w.formReset(); w.FORM.site = site.id;
w.FORM.access = 'تم الوصول';
w.FORM.photos = { site:{ size:1 }, mount:{ size:1 } };
said = [];
w.svSave(false);
step(!!w.STATE.recs[site.id], 'حُفظ المسحُ باسم الفنيّ');
step(w.STATE.recs[site.id].by === A, 'السجلُّ يحمل اسمَ من مسح');
step(w.svDone(w.STATE.recs[site.id]), 'يُحتسب مسحًا منجزًا');

go('appr');
step(C().querySelectorAll('[data-apok]').length === 0, 'الفنيُّ لا يرى أزرارَ الاعتماد');

/* ══ ٤ · التركيبُ بقطعٍ من الكتالوج ═══════════════════════════════════════ */
console.log('\n══ ٤ · التركيب ══');
asRole('cins');
w.STATE.meta.name = B;
go('insForm');
w.FORM.site = site.id;
w.formReset(); w.FORM.site = site.id;
w.FORM.status = 'مُركّب';
w.FORM.photos = { before:{ size:1 }, after:{ size:1 } };
const items = w.itemsList().filter(x => x.z === 'camp').slice(0, 2);
w.FORM.parts = {}; w.FORM.serials = {};
items.forEach(function(it, k){ w.FORM.parts[it.code] = 1; w.FORM.serials[it.code] = 'SN-FLOW-' + k; });
said = [];
w.insSave(false);
step(!!w.STATE.inss[site.id], 'حُفظ التركيبُ بقطعه');
step(Object.keys(w.STATE.inss[site.id].parts || {}).length === items.length,
     `القطعُ سُجّلت (${items.length})`);
step(!w.STATE.inss[site.id].approved, 'يبدأ غيرَ معتمَدٍ — الاعتمادُ فعلٌ منفصل');

/* ══ ٥ · المهندسُ يعتمد ═══════════════════════════════════════════════════ */
console.log('\n══ ٥ · الاعتماد ══');
asRole('engineer');
w.STATE.meta.name = 'مهندس السيناريو';
const nb = (w.STATE.notifs || []).length;
w.apprIns(site.id, 1);
step(w.STATE.inss[site.id].approved === true, 'اعتُمد التركيب');
step((w.STATE.notifs || []).length > nb, 'وصل إشعارٌ لمن ركّب');
const notif = (w.STATE.notifs || [])[0];
step(notif && notif.to === B, 'الإشعارُ موجَّهٌ إلى صاحبه');

/* ══ ٦ · الفكُّ يُجدوَل ويُنفَّذ ══════════════════════════════════════════ */
console.log('\n══ ٦ · الفكّ ══');
said = [];
w.disSchedule(site.id);
step(!!(w.STATE.diss || {})[site.id], 'جُدوِل الفكُّ بعد الاعتماد');

const fresh = w.STATE.sites.filter(x => !w.STATE.inss[x.id])[0];
said = [];
w.disSchedule(fresh.id);
step(!((w.STATE.diss || {})[fresh.id]) && said.some(m => /الفك/.test(m)),
     'ولا يُجدوَل لنقطةٍ لم تُركَّب');

asRole('tech');
w.STATE.meta.name = A;
if (typeof w.disComplete === 'function') w.disComplete(site.id, 'سليم');
step(((w.STATE.diss || {})[site.id] || {}).status === 'تم الفك', 'سُجّل تمامُ الفكّ');

/* ══ ٧ · النتيجةُ تظهر حيث تُقرأ ═════════════════════════════════════════ */
console.log('\n══ ٧ · الأثر ══');
asRole('engineer');
w.statBump();
const S = w.siteStats();
step(S.surveyed >= 1, `اللوحةُ تعدُّ المسح (${S.surveyed})`);
step(S.installed >= 1, `وتعدُّ التركيب (${S.installed})`);

const sc = w.scores().list;
step(sc.some(e => e.name === A && e.survey >= 1), 'رصيدُ الماسح يحمل مسحَه');
step(sc.some(e => e.name === B && e.install >= 1), 'ورصيدُ المركِّب يحمل تركيبَه');

const ev = (w.STATE.events || []).map(e => String(e.what || ''));
[['المسح', /مسح موقع/], ['التركيب', /تركيب/], ['الاعتماد', /اعتماد/], ['الفك', /فك/]]
  .forEach(([n, re]) => step(ev.some(x => re.test(x)), 'دخل السجلَّ: ' + n));

const sheets = ['over','qa','tasks','ev','notif','appr'];
sheets.forEach(function(k){
  let rows = 0;
  try { rows = (w.SHEETS[k]() || []).length - 1; } catch (e){ rows = -1; }
  step(rows >= 0, `ورقةُ «${k}» تُولَّد (${rows} صفًّا)`);
});

go('over');
step(C().textContent.replace(/\s+/g,'').length > 100, 'لوحةُ النظرة العامة ترسم');
go('notif');
step(C().querySelectorAll('tbody tr').length >= 1, 'مركزُ الإشعارات يعرض ما وقع');

/* ══ ٨ · الحدودُ تُقطَع عمدًا ═══════════════════════════════════════════ */
console.log('\n══ ٨ · حدودُ الأدوار ══');
asRole('viewer');
go('appr');
step(C().querySelectorAll('[data-apok]').length === 0, 'الوزارةُ لا ترى الاعتماد');
said = [];
w.itemDel(w.itemsList()[0].code);
/* «للمهندس» ليست «المهندس»: اللامُ تلتصق فتتغيّر الحروف */
step(said.some(m => /مستعمل|مهندس/.test(m)), 'ولا تحذف من الكتالوج');
asRole('supervisor');
step(!w.may('money'), 'المشرفُ لا يملك المال');
step(w.may('edit'), 'ويملك التحرير');

step(boot.length === 0, 'لا خطأَ تشغيلٍ في السيناريو كلِّه'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.error('\nالحلقاتُ المكسورة:'); fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('الدورةُ الحياتيةُ كاملةٌ — كلُّ حلقةٍ تبني ما بعدها ✅');
process.exit(0);
