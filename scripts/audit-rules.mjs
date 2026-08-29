/* ═══════════════════════════════════════════════════════════════════════════
   جردُ القواعد — يُشغَّل: node scripts/audit-rules.mjs
   ───────────────────────────────────────────────────────────────────────────
   القواعدُ هي ما يمنع البياناتِ الخاطئةَ من الدخول. وهي أهدأُ ما يُفقَد عند
   إعادة البناء: الشاشةُ تُنقَل بشكلها فتبدو تامّة، والقاعدةُ التي كانت خلفها
   لا تُنقَل — فلا يشكو أحد. يُحفَظ السجلُّ ناقصًا، ويُفَكُّ ما لم يُركَّب،
   ويُصدَّر ملفٌّ فارغ.

   والقاعدةُ لا تُصدَّق مكتوبةً: تُجرَّب. يُحاوَل الفعلُ الممنوعُ فعلًا، ويُشترَط
   أمران معًا — أن يُقال لماذا مُنع، وألّا يُكتَب شيء. فقولٌ بلا منعٍ تزيين،
   ومنعٌ بلا قولٍ يجعل الفنيَّ يظنُّ الجهازَ عاطلًا.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(readFileSync('index.html','utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}
await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await new Promise(r => setTimeout(r, 400));

/* ── المرصد: ما قيل وما كُتب ─────────────────────────────────────────────── */
let said = [], writes = 0;
w.toast = m => said.push(String(m));
const oset = w.CORE.set;
w.CORE.set = function(){ writes++; try { return oset.apply(w.CORE, arguments); } catch {} };

/* يُجرَّب الممنوعُ: يُشترَط قولٌ ومنعٌ معًا */
function blocks(name, hint, act){
  said = []; writes = 0;
  try { act(); } catch (e){ fails.push(name + ' — انفجرت: ' + String(e.message).slice(0,50)); return; }
  const spoke = said.some(m => new RegExp(hint).test(m));
  if (!spoke)  { fails.push(name + ' — لم يُقَل لماذا مُنع (قيل: ' + (said[0] || 'لا شيء') + ')'); return; }
  if (writes)  { fails.push(name + ' — قال ومنع ثم كتب ' + writes + ' مرة'); return; }
  pass++;
}
/* والمسموحُ يمرّ: قاعدةٌ تمنع الصوابَ أسوأُ من قاعدةٍ لا تمنع الخطأ */
function allows(name, act){
  said = []; writes = 0;
  try { act(); } catch (e){ fails.push(name + ' — انفجرت: ' + String(e.message).slice(0,50)); return; }
  if (!writes){ fails.push(name + ' — مُنع وهو مسموح (قيل: ' + (said[0] || 'لا شيء') + ')'); return; }
  pass++;
}

const S = w.STATE;
const camp = S.sites.find(x => x.type === 'مخيم');
const cor  = S.sites.find(x => x.type === 'ممر');
check(!!camp && !!cor, 'وُجدت مواقعُ للتجربة');

/* ══ الميدان ══════════════════════════════════════════════════════════════ */
w.CUR = 'svForm'; w.FORM.site = cor.id; w.formReset(); w.FORM.site = cor.id;

blocks('المسح بلا صور', 'الصورتان|مطلوب', () => w.svSave());
blocks('تعذُّر الوصول بلا سبب', 'سبب', () => {
  w.FORM.access = 'منع دخول'; w.FORM.note = ''; w.svSave();
});
allows('تعذُّر الوصول بسبب مكتوب', () => {
  w.FORM.access = 'منع دخول'; w.FORM.note = 'البوابة مغلقة'; w.svSave();
});
check(w.siteStats().surveyed === 0 || !w.svDone(S.recs[cor.id]),
  'زيارةُ المنع لا تُحتسب مسحًا');

/* التركيب */
w.CUR = 'insForm'; w.FORM.site = camp.id; w.formReset(); w.FORM.site = camp.id;
blocks('التركيب بلا حالة', 'حالة', () => w.insSave(false));
w.FORM.status = 'مُركّب';
blocks('التركيب بلا صورتين', 'صورتا|قبل', () => w.insSave(false));
w.FORM.photos = { before:{size:1}, after:{size:1} };
blocks('التركيب بلا قطع', 'القطع', () => w.insSave(false));
const kk = Object.keys(w.CFG.itPts);
w.FORM.parts = kk.length ? { [kk[0]]:1, [kk[1] || kk[0]]:1 } : { ant:1, rdr:1 };
w.FORM.serials = { ant:'SN-1', rdr:'SN-1' };
blocks('رقمٌ تسلسليٌّ مكرّر', 'مكرّر', () => w.insSave(false));
w.FORM.serials = { ant:'SN-1', rdr:'SN-2' };
allows('التركيب المكتمل يُحفَظ', () => w.insSave(false));

/* الفكّ */
const fresh = S.sites.find(x => !S.inss[x.id]);
blocks('الفكُّ قبل اعتماد التركيب', 'الفك', () => w.disSchedule(fresh.id));
S.inss[fresh.id] = { id:fresh.id, status:'مُركّب', approved:true, parts:{}, at:Date.now() };
allows('الفكُّ بعد الاعتماد', () => w.disSchedule(fresh.id));

/* ══ الموقع المقترح ═══════════════════════════════════════════════════════ */
w.CUR = 'newsite'; w.render(1);
w.NEWSITE.lat = 21.53; w.NEWSITE.lng = 39.18;
blocks('موقعٌ جديدٌ بلا مربع', 'المربع', () => w.nsSave());
w.NEWSITE.sq = '7-14'; w.NEWSITE.sign = 'abc';
blocks('شاخصٌ بصيغةٍ خاطئة', 'الصيغة', () => w.nsSave());
w.NEWSITE.sign = '57/2'; w.NEWSITE.co = 'شركةٌ لا وجودَ لها';
blocks('شركةٌ خارج القائمة الموحّدة', 'الموحّدة', () => w.nsSave());
w.NEWSITE.co = w.CO_LIST[0];
blocks('موقعٌ جديدٌ بلا صورة الشاخص', 'صورة', () => w.nsSave());

/* طلبُ شركةٍ مكرّر */
w.NS_CO_OPEN = true; w.render(1);
const box = d.getElementById('nsCoNew');
if (box){
  box.value = 'شركةُ اختبارٍ للقواعد';
  allows('طلبُ شركةٍ جديد', () => w.nsCoRequest());
  w.NS_CO_OPEN = true; w.render(1);
  d.getElementById('nsCoNew').value = 'شركةُ اختبارٍ للقواعد';
  blocks('طلبُ شركةٍ مكرّر', 'سبق', () => w.nsCoRequest());
} else fails.push('حقلُ طلب الشركة غير موجود');

/* ══ التصدير ══════════════════════════════════════════════════════════════ */
w.NS_CO_OPEN = false;
w.CUR = 'exp'; w.EXP_OPEN = true; w.render(1);
d.querySelectorAll('.expCk').forEach(c => { c.checked = false; });
blocks('التصديرُ بلا قسمٍ مختار', 'قسم', () => {
  const go = d.querySelector('[data-expgo]');
  if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  else said.push('لا زرَّ تصدير');
});

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ القواعد نظيف ✅');
process.exit(0);
