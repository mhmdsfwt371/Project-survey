/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الأدوار — يُشغَّل: node scripts/audit-roles.mjs
   ───────────────────────────────────────────────────────────────────────────
   الصلاحيةُ المعلنةُ ليست صلاحيةً منفَّذة. يعلن `ROLES` إحدى عشرةَ قدرةً لكلِّ
   دور، ولا يُسأل عنها في الشيفرة إلا أربع. والباقي إعلانٌ بلا حارس.

   وأخطرُ ما في هذا أن الخرقَ لا يُرى: مراقبُ الوزارة يفتح شاشةً فيها رقمُ هاتفٍ
   ولا أحدَ يعلم — والحوكمةُ تقول إن الهواتفَ محجوبةٌ عنه حتى في قواعد القاعدة.

   فهذا الجردُ يلبس كلَّ دورٍ ويمشي في كلِّ شاشةٍ يراها:
     · لا يرى إلا ما أُذن له، والقفزُ إلى ممنوعٍ يُردّ
     · لا هاتفَ يظهر لمن مُنع من الهواتف
     · لا زرَّ فعلٍ يظهر لمن لا يملك فعلَه
     · وقواعدُ القاعدة تحجب ما تحجبه الواجهة
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

/* أفعالٌ لا يملكها إلا صاحبُ القدرة */
const GATED = {
  approve:   ['data-appr','data-rej','data-ncrok','data-ipcok','data-chgok','data-chgno'],
  settings:  ['data-cfg','data-baseset','data-role','data-depteamnew','data-mkone','data-mkall'],
  exportAll: ['data-expall','data-kmz','data-repgo','data-reppack'],
  importAll: ['data-tpl','data-imp','data-impgo'],
  users:     ['data-mkone','data-mkall','data-role','data-assignRole'],
  edit:      ['data-svsave','data-inssave','data-nssave','data-smark','data-fmark','data-asngo']
};
/* رقمُ جوّالٍ سعوديٍّ في أيِّ صورة */
const PHONE = /(?:\+?9665|05)\d{8}\b/;

const html = readFileSync('index.html','utf8');
const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);
/* المتصفّحُ الصوريُّ ينقصه ما في المتصفّحات الحقيقية: مرمِّزُ النصوص الذي
   يُبنى به ملفُّ KMZ، وروابطُ الكائنات التي يُنزَّل بها الملف. وغيابُها يُظهر
   عطلًا في التطبيق وليس فيه عطل — فتُسدّ قبل أن يُتَّهم بريء. */
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (w.URL && !w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}


await new Promise(r => setTimeout(r, 800));
const go = d.getElementById('lgGo');
if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));

const ROLES = w.ROLES;
check(!!ROLES, 'جدولُ الأدوار محمّل');
const names = Object.keys(ROLES);
check(names.length >= 4, `الأدوارُ معرَّفة (${names.length})`);

/* ── القدراتُ المعلنةُ يجب أن تُسأل في الشيفرة ─────────────────────────────── */
const declared = new Set();
names.forEach(r => Object.keys(ROLES[r].can || {}).forEach(k => declared.add(k)));
/* القدرةُ مسؤولٌ عنها إمّا بنداءٍ صريحٍ `may('x')` أو بربطِ شاشةٍ بها
   في `PAGE_CAP` — و`seesPage` تسأل عنها عندئذٍ لكلِّ شاشةٍ مرتبطة. */
const asked = new Set([...html.matchAll(/may\('(\w+)'\)/g)].map(m => m[1]));
Object.values(w.PAGE_CAP || {}).forEach(c => asked.add(c));
const dead = [...declared].filter(k => !asked.has(k));
check(dead.length === 0, 'كلُّ قدرةٍ معلنةٍ تُسأل في الشيفرة'
  + (dead.length ? ' — معلنةٌ بلا حارس: ' + dead.join(' · ') : ''));

/* ── التناقض: شاشةٌ يمنحها `nav` وتمنعها `can` ────────────────────────────
   الحجبُ الزائد لا يُرى كما يُرى التسريب: مراقبُ الوزارة يفتح فلا يجد الشاشة
   ولا يعرف أنها كانت له. فكلُّ ما مُنح صراحةً يجب أن يكون بالغًا. */
{
  const clash = [];
  names.forEach(rn => {
    const R = ROLES[rn];
    if (R.nav === '*') return;
    R.nav.forEach(id => {
      const cap = (w.PAGE_CAP || {})[id];
      if (cap && !(R.can || {})[cap]) clash.push(rn + ' · ' + id + ' (' + cap + ')');
    });
  });
  check(clash.length === 0, 'لا شاشةَ يمنحها nav وتمنعها can'
    + (clash.length ? ' — ' + clash.join(' | ') : ''));
}

/* ── الجولةُ: كلُّ دورٍ في كلِّ شاشةٍ يراها ────────────────────────────────── */
const leakPhone = [], leakAct = [], stuck = [];
const allPages = [...new Set(Object.keys(w.PAGE).concat(Object.keys(w.FIELD_PAGES || {})))];

for (const rn of names){
  w.ROLE = rn;
  const R = ROLES[rn];
  const can = k => !!(R.can || {})[k];
  const nav = R.nav === '*' ? allPages : R.nav;

  /* القفزُ إلى ممنوعٍ يُردّ إلى أولِ مأذون */
  if (R.nav !== '*'){
    const forbidden = allPages.find(p => R.nav.indexOf(p) < 0);
    if (forbidden){
      w.CUR = forbidden;
      try { w.render(1); } catch {}
      if (w.CUR === forbidden) stuck.push(rn + ' → ' + forbidden);
    }
  }

  for (const id of nav){
    if (!w.PAGE[id] && !(w.FIELD_PAGES || {})[id]) continue;
    w.CUR = id;
    let h = '';
    try { w.render(1); h = (d.getElementById('content') || {}).innerHTML || ''; } catch { continue; }

    if (!can('phones') && PHONE.test(h)) leakPhone.push(rn + ' · ' + id);

    Object.keys(GATED).forEach(cap => {
      if (can(cap)) return;
      GATED[cap].forEach(attr => {
        if (h.indexOf(attr) > -1) leakAct.push(rn + ' · ' + id + ' · ' + attr + ' (' + cap + ')');
      });
    });
  }
}
w.ROLE = 'engineer';

check(stuck.length === 0, 'القفزُ إلى شاشةٍ ممنوعةٍ يُردّ'
  + (stuck.length ? ' — عالق: ' + stuck.slice(0,3).join(' | ') : ''));
check(leakPhone.length === 0, 'لا هاتفَ يظهر لمن مُنع من الهواتف'
  + (leakPhone.length ? ` (${leakPhone.length}): ` + leakPhone.slice(0,4).join(' | ') : ''));
check(leakAct.length === 0, 'لا زرَّ فعلٍ يظهر لمن لا يملكه'
  + (leakAct.length ? ` (${leakAct.length}): ` + [...new Set(leakAct)].join(' | ') : ''));

/* ── قواعدُ القاعدة تحجب ما تحجبه الواجهة ──────────────────────────────── */
let rules = '';
try { rules = readFileSync('firestore.rules','utf8'); } catch {}
check(!!rules, 'ملفُّ القواعد موجود');
if (rules){
  check(/viewer|وزارة|ministry/i.test(rules), 'القواعدُ تعرف دورَ الوزارة');
  check(/phone|جوال|هاتف|tel\b/i.test(rules), 'القواعدُ تذكر الهواتف صراحةً');
}

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length} · أدوارٌ فُحصت ${names.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الأدوار نظيف ✅');
process.exit(0);
