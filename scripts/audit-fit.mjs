/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ملاءمة الشاشات للأدوار — node scripts/audit-fit.mjs
   ───────────────────────────────────────────────────────────────────────────
   ما يصلح لمكتبٍ بشاشةٍ عريضةٍ لا يصلح لهاتفٍ في الشمس. فيُقاس لكلِّ دورٍ ما
   يُعرَض عليه: جدولٌ بأكثرَ من ستةِ أعمدةٍ يُقرأ بالتمرير الأفقيِّ ولا يُقرأ،
   ونصٌّ يتجاوز تسعةَ آلافِ حرفٍ لا يُقرَأ أصلًا. والنماذجُ الميدانيةُ مستثناةٌ
   بأسمائها: هي إدخالُ بياناتٍ بطبعها، وقد قُسمت أساسيًّا وتفصيليًّا (SV_MORE).
   والإعداداتُ للمدير وحدَه على مكتبه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
/* لكلِّ دورٍ: أيُّ شاشةٍ ثقيلةٌ عليه — جداولُ عريضةٌ أو حقولٌ كثيرةٌ أو نصٌّ طويل */
const roles = ['tech','cprep','cins','supervisor','engineer','admin','viewer','store','buyer','acct','driver','helper'];
const rep = {};
for (const role of roles){
  w.ROLE = role; if (w.STATE.meta) w.STATE.meta.role = role;
  const nav = w.ROLES[role].nav;
  /* الشرائحُ تُفَكّ: قياسُ الأمِّ وحدَها يُخفي شريحةً ثقيلةً داخلها — وهكذا
     فات جدولُ طلبات الورشة بتسعة أعمدةٍ حتى شُكي منه. */
  const top = nav === '*' ? [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a=>a.getAttribute('data-p')))] : nav;
  const ids = [...new Set(top.flatMap(id => (w.TABS && w.TABS[id]) ? w.TABS[id].map(t=>t[0]) : [id]))];
  const heavy = [];
  for (const id of ids){
    try { w.goPage(id); w.render(1); } catch(e){ heavy.push(id+' رمت'); continue; }
    const C = d.getElementById('content');
    const cols = Math.max(0, ...[...C.querySelectorAll('table tr')].map(r=>r.children.length));
    const inputs = C.querySelectorAll('input,select,textarea').length;
    const len = (C.textContent||'').trim().length;
    if (cols >= 7 || inputs >= 14 || len > 9000) heavy.push(id+'{عمود:'+cols+' حقل:'+inputs+' حرف:'+len+'}');
  }
  rep[role] = { n: ids.length, heavy };
}
/* مستثنياتٌ بأسمائها لا صمتًا */
const FORMS = ['svForm','insForm','forms','disp2','newsite'];   /* إدخالُ بياناتٍ بطبعه */
/* شاشاتُ المكتب: جداولُها عريضةٌ بطبعها ويفتحها المهندسُ والمديرُ على شاشةٍ
   عريضة — دفترُ العناوين، ودفترُ جوالات الشركات، والمعالمُ بأوزانها،
   وسجلُّ المخاطر بمصفوفته. وما يخصُّ الميدانَ والوزارةَ محروسٌ كما هو. */
const DESK  = ['pts','items','users','consts','org','sys','exp',
               'ips','conote','miles','risks','evm','chg','plan','budm','ipc','buys',
               'roles','assignRole','jobs','names','vehkind','sup','buycat','probe','drive',
               'crewplan','visits','prep','asm','install','disp','wday','stock','mine','cover','raci','esc'];
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
for (const r of roles){
  const real = rep[r].heavy.filter(h => {
    const id = h.split('{')[0].split(' ')[0];
    if (FORMS.indexOf(id) > -1) return false;
    if (DESK.indexOf(id) > -1 && (r === 'admin' || r === 'engineer')) return false;
    return true;
  });
  T(real.length === 0, r.padEnd(11) + ' — ' + rep[r].n + ' شاشة' + (real.length ? ' · ثقيلة: ' + real.slice(0, 4).join(' · ') : ''));
}
console.log(bad ? '\nجردُ الملاءمة فشل ✗ (' + bad + ')' : '\nما يُعرَض على كلِّ دورٍ يُقرأ على شاشته ✅');
process.exit(bad ? 1 : 0);
