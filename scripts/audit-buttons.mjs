/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الأزرار — node scripts/audit-buttons.mjs
   ───────────────────────────────────────────────────────────────────────────
   لا زرَّ يُرسَم بلا معالج: تُجمَع كلُّ خاصيةٍ `data-*` تُرسَم فعلًا في أيِّ
   شاشةٍ بأيِّ دور، وتُقابَل بما تربطه معالجاتُ النقر والتغيير والإدخال —
   فما رُسم ولم يُربَط زرٌّ ميتٌ يُضغَط فلا يقع شيءٌ ولا يشكو أحد. وأمسك
   هذا الجردُ يومَ كُتب حقلَي «من كانت معه سيارةٌ في يومٍ بعينه»: يُرسَمان
   ويُقرآن في الجدول ولا شيءَ يكتبهما.
   ويتحقّق أن كلَّ زرِّ انتقالٍ (`data-p`) يبلغ شاشةً موجودةً في مكانها من
   الدورة، فلا يقفز زرٌّ إلى معرِّفٍ حُذف أو أُعيدت تسميتُه.
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
const src = readFileSync('index.html','utf8');
/* الخصائصُ المربوطة: من نصِّ معالجَي النقر والتغيير */
const click = (/function onDocClick\(e\)\{[\s\S]*?\n\}/.exec(src)||[''])[0];
const chg = src.slice(src.indexOf("document.addEventListener('change'"), src.indexOf("document.addEventListener('change'")+9000);
const inp = src.slice(src.indexOf("document.addEventListener('input'"), src.indexOf("document.addEventListener('input'")+16000);
const bound = new Set([...(click+chg+inp).matchAll(/data-[\w-]+/g)].map(m=>m[0]));
/* كلُّ خاصيةٍ تُرسَم فعلًا في أيِّ شاشةٍ بأيِّ دور */
const seen = new Map();
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a=>a.getAttribute('data-p'))
  .flatMap(id => (w.TABS&&w.TABS[id]) ? w.TABS[id].map(t=>t[0]) : [id]))];
const pages = new Set([...(src.match(/^PAGE\.(\w+) = \{/gm)||[]).map(m=>m.slice(5,-4).trim()),
                       ...[...src.matchAll(/^  (\w+):\s*\{ m:'/gm)].map(m=>m[1]),
                       ...Object.keys(w.TABS||{}).flatMap(k=>w.TABS[k].map(t=>t[0]))]);
const badP = new Set();
for (const role of ['engineer','supervisor','tech','viewer','admin','store','buyer','acct']){
  w.ROLE = role; if (w.STATE.meta) w.STATE.meta.role = role;
  for (const id of ids){
    if (!w.seesPage((w.PARENT&&w.PARENT[id])||id)) continue;
    try { w.goPage(id); w.render(1); } catch(e){ continue; }
    d.querySelectorAll('#content [class], #content button, #content a, #content input, #content select').forEach(el=>{
      for (const a of el.attributes){
        if (!/^data-/.test(a.name)) continue;
        if (!seen.has(a.name)) seen.set(a.name, id+'@'+role);
        if (a.name === 'data-p' && a.value && !pages.has(a.value)) badP.add(a.value+' ('+id+')');
      }
    });
  }
}
const PASSIVE = new Set(['data-i18n','data-i18n-aria','data-i18n-title','data-open','data-g','data-lang','data-theme','data-c','data-k','data-v','data-id','data-site']);
const dead = [...seen.keys()].filter(a => !bound.has(a) && !PASSIVE.has(a));
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
T(bound.size >= 150, 'الخصائصُ المربوطةُ في المعالجات: '+bound.size);
T(seen.size >= 100, 'الخصائصُ المرسومةُ في الشاشات: '+seen.size);
T(dead.length === 0, 'لا خاصيةَ تُرسَم بلا معالج' + (dead.length ? ' — ' + dead.map(a=>a+' في '+seen.get(a)).slice(0,6).join(' | ') : ''));
T(badP.size === 0, 'كلُّ زرِّ انتقالٍ يبلغ شاشةً موجودة' + (badP.size ? ' — ' + [...badP].slice(0,5).join(' | ') : ''));
console.log(bad?'\nجردُ الأزرار فشل ✗ ('+bad+')':'\nكلُّ زرٍّ موصولٌ ويبلغ مكانَه من الدورة ✅');
process.exit(bad?1:0);
