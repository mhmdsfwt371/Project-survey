/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الزرِّ يصل — node scripts/audit-btn-lands.mjs
   ───────────────────────────────────────────────────────────────────────────
   زرٌّ يُعرَض على دورٍ ويفتح شاشةً ليست في قائمته لا يقول «ممنوع» — بل يُردُّ
   صاحبُه إلى أوّلِ شريحةٍ مرئيةٍ من الأمِّ. فالمشرفُ يضغط «موقع غير مسجّل»
   فيجد **نموذجَ المسح** أمامه، ولا رسالةَ ولا سبب — عطلٌ صامتٌ عاش حتى شكا
   منه مستخدِم (V16.80).
     فهنا لكلِّ دورٍ: يُبنى شريطُ الخريطة وبطاقةُ النقطة بعينه، ويُلتقَط كلُّ
   زرٍّ يفتح نموذجًا، ويُطلَب ما يطلبه الزرُّ بالرسم الحقيقيِّ (render) — ثم
   يُقاس أين وقف: إن وقف على غير ما طلب فالزرُّ لا يصل. القاعدةُ واحدة:
   **الزرُّ يُعرَض والشاشةُ تُرى — أو لا يُعرَض.**
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

/* الزرُّ ← الشاشةُ التي يفتحها، كما في معالج النقر نفسِه */
const BTN = [
  ['data-newsite', 'newsite', 'موقع غير مسجّل'],
  ['data-form',    'svForm',  'نموذج المسح'],
  ['data-insform', 'insForm', 'نموذج التركيب']
];

let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 140)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'),
  { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 900));
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 1500));

w.STATE.sites = [{ id:'T1', name:'نقطةُ فحص', zone:'منى', type:'ممر', lat:21.41, lng:39.89 }];
const ROLES = Object.keys(w.ROLES);
T(ROLES.length > 5, `الأدوارُ تُفحَص كلُّها: ${ROLES.length}`);

/* أين يقف الرسمُ حين يُطلَب هذا المعرِّف — بالرسم نفسِه لا بمحاكاةٍ له */
function lands(target){
  w.CUR = target; w.render(1);
  return w.TABS[w.CUR] ? w.tabCur(w.CUR) : w.CUR;
}

const offered = new Map();   /* زرّ → الأدوارُ التي يُعرَض عليها */
/* زرُّ التركيب لا يظهر إلا في وضع التركيب لنقطةٍ أُسندت — تُهيَّأ الحالُ
   ليُفحَص الزرُّ لا لتُفحَص شروطُ ظهوره (لها جردُها) */
w.FIELD_MODE = 'install';
w.taskKindOf = (id, k) => k === 'install';
for (const role of ROLES){
  w.ROLE = role;
  /* الشريطُ والبطاقةُ على الخريطة: من لا يرى الخريطةَ لا يبلغه زرُّها،
     فلا يُحاسَب على زرٍّ لا يصله — يُحاسَب من يراه */
  if (!w.seesPage('map')) continue;
  let html = '';
  try { html += w.mapUIHtml(); } catch (e){}
  try { w.POP_SITE = 'T1'; html += w.popHtml(); } catch (e){}
  for (const [attr, target, say] of BTN){
    if (html.indexOf(attr) < 0) continue;
    offered.set(attr, (offered.get(attr) || []).concat(role));
    const at = lands(target);
    T(at === target, `«${say}» يُعرَض على «${w.ROLES[role].n || role}» ويصل`
      + (at === target ? '' : ` — بل وقف على «${at}»`));
  }
}
for (const [attr, , say] of BTN)
  T((offered.get(attr) || []).length > 0, `«${say}» معروضٌ على دورٍ واحدٍ على الأقل (${(offered.get(attr) || []).length})`);

/* ولا شاشةَ نموذجٍ في قائمة دورٍ لا يملك التسجيل — الباب يُفتَح لمن يكتب */
const wrong = ROLES.filter(r => {
  const nav = w.ROLES[r].nav;
  return Array.isArray(nav) && nav.indexOf('newsite') > -1 && !(w.ROLES[r].can || {}).edit;
});
T(wrong.length === 0, 'ولا «موقع جديد» في قائمة دورٍ لا يُسجّل' + (wrong.length ? ': ' + wrong.join(' · ') : ''));
T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));

console.log(bad ? `\nجردُ الزرِّ يصل فشل ✗ (${bad})` : '\nكلُّ زرٍّ يُعرَض يصل إلى شاشته ✅');
process.exit(bad ? 1 : 0);
