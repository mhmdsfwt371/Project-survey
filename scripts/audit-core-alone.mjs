/* ═══ جردُ الملفّ الخفيف — النواةُ وحدَها تكفي الميدان (V38.90) ═══
   ملفُّ الفنيّ (index.html) يُحمَّل أوّلًا، والجزءُ المكتبيُّ (app-office.js) بعد شاشة الدخول بثوانٍ. نُقل إلى الجزء
   المكتبيّ ما لا تبلغه النواةُ وحدَها (scripts/split-late.mjs)، فلا بدّ أن يبقى الحدُّ مضمونًا:
   ١ — ثابتًا: لا شيءَ تشغّله النواةُ وحدَها (أوامرُها في التحميل ومُهيِّئاتُ المتغيّرات وما تبلغه منهما) ينادي دالّةً
       في الجزء المكتبيّ — إلا معالجاتُ الضغط المفوَّضة، فضغطتُها تُعاد حين يصل الجزء.
   ٢ — حيًّا: النواةُ وحدَها تُقلع، وكلُّ شاشةٍ وشريحةٍ يراها الفنيُّ والمشرفُ تُرسَم بلا خطأ، وشاشاتُ المكتب ترسم
       بطاقةَ الانتظار لا خطأً؛ ثم يصل الجزءُ فترسم شاشاتُ المكتب كاملةً. */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import './lib/jsdom-dict.cjs';
import { srcFiles, isChunkFile, buildParts } from './lib/src.mjs';
import { reachability } from './split-late.mjs';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');

let pass = 0; const fails = [];
const T = (c, msg) => { if (c){ pass++; console.log('  \u2713 ' + msg); } else { fails.push(msg); console.log('  \u2717 ' + msg); console.log('::error title=فحصٌ ساقط::' + msg.replace(/[\r\n]+/g, ' ').slice(0, 300)); } };

console.log('\n══ ١ · ثابتًا: النواةُ لا تنادي الجزءَ المكتبيّ ══');
const all = srcFiles('src').filter(f => f.endsWith('.js'));
const coreT = {}, chunkFns = new Map();
for (const f of all){
  const s = readFileSync('src/' + f, 'utf8');
  if (isChunkFile(f)){ for (const m of s.matchAll(/^function ([A-Za-z_$][\w$]*)\s*\(/gm)) chunkFns.set(m[1], f); }
  else coreT[f] = s;
}
const { defs, keep } = reachability(coreT);
/* every word of the code the core runs alone (its load-time statements and what they reach, never the click handlers);
   a chunk function named in a unit that first asks «typeof NAME === 'function'» is waited for there, not needed */
const units = [];
for (const nm of keep){ const d = defs.get(nm); if (d && !d.click) units.push(d.code); }
const acorn = require('acorn');
for (const f of Object.keys(coreT)){
  const ast = acorn.parse(coreT[f], { ecmaVersion: 2020, sourceType: 'script' });
  for (const n of ast.body) if (n.type !== 'FunctionDeclaration') units.push(coreT[f].slice(n.start, n.end));
}
const needs = [];
for (const code of units){
  const ws = new Set(code.match(/[A-Za-z_$][\w$]*/g) || []);
  for (const n of ws){ if (!chunkFns.has(n) || needs.includes(n)) continue;
    if (!new RegExp('typeof\\s+' + n.replace(/\$/g, '\\$') + '\\s*[!=]==?\\s*[\'"]function[\'"]').test(code)) needs.push(n); }
}
T(!needs.length, 'لا دالّةَ في الجزء المكتبيّ تبلغها النواةُ وحدَها (' + chunkFns.size + ' دالّة هناك)' + (needs.length ? ' — تحتاج: ' + needs.slice(0, 8).map(n => n + ' (' + chunkFns.get(n).replace(/^.*\//, '') + ')').join(' · ') : ''));
const late = all.filter(f => f.startsWith('03zz-late/'));
T(late.length > 0 && late.every(isChunkFile), 'ونقلُ ما لا تبلغه النواةُ (' + late.length + ' ملفًّا في 03zz-late) يُشحَن مع الجزء المكتبيّ');

console.log('\n══ ٢ · حيًّا: النواةُ وحدَها تُقلع وترسم الميدان ══');
const parts = await buildParts('src');
const vc = new VirtualConsole(); const errs = []; vc.on('jsdomError', e => { const m = String(e && e.message || e); if (!/Not implemented/.test(m)) errs.push(m.slice(0, 200)); });
const dom = new JSDOM(parts.index, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window;
w.fetch = () => Promise.reject(new Error('net')); w.confirm = () => true; w.prompt = () => ''; w.toast = () => {};
w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 1800));
T(typeof w.render === 'function' && typeof w.nskChunkState === 'function' && !w.nskChunkState().ready, 'النواةُ أقلعت وحدَها — والجزءُ المكتبيُّ لم يصل');
const tour = roles => JSON.parse(w.eval(`(function(){
  var C = { doc:function(){ return { get:function(){ return Promise.resolve({ exists:false }); }, set:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); } }; }, where:function(){ return C; }, orderBy:function(){ return C; }, limit:function(){ return C; }, get:function(){ return Promise.resolve({ docs:[], forEach:function(){}, size:0, empty:true }); }, onSnapshot:function(){ return function(){}; } };
  FB.ready = true; FB.db = { collection:function(){ return C; }, batch:function(){ return { set:function(){}, commit:function(){ return Promise.resolve(); } }; } };
  var n = 0, thrown = [];
  ${JSON.stringify(roles)}.forEach(function(role){
    ROLE = role; STATE.meta.role = role; STATE.meta.name = 'جرد ' + role;
    Object.keys(PAGE).forEach(function(pid){ if (!seesPage(pid)) return;
      var tabs = (TABS[pid] || []).filter(function(tb){ var f = tb[4] && TAB_SEE[tb[4]]; return f ? f(pid) : seesRaw(tb[0]); }).map(function(tb){ return tb[0]; });
      (tabs.length ? tabs : ['']).forEach(function(tb){ n++; try { CUR = pid; if (tb) PTAB[pid] = tb; render(1); } catch (e){ thrown.push(role + ' · ' + pid + (tb ? ':' + tb : '') + ' → ' + e.message); } }); });
  });
  return JSON.stringify({ n:n, thrown:thrown });
})()`));
const F = tour(['tech', 'supervisor']);
T(F.n > 10 && !F.thrown.length, 'كلُّ شاشةٍ وشريحةٍ للفنيّ والمشرف تُرسَم بالنواة وحدَها (' + F.n + ')' + (F.thrown.length ? ' — ' + F.thrown.slice(0, 4).join(' | ') : ''));
const O = tour(['admin', 'engineer', 'exec', 'viewer']);
T(!O.thrown.length, 'وشاشاتُ المكتب والوزارة لا ترمي خطأً قبل وصول الجزء — تنتظره (' + O.n + ')' + (O.thrown.length ? ' — ' + O.thrown.slice(0, 4).join(' | ') : ''));
/* the chunk lands: the office screens draw in full */
const sc = w.document.createElement('script'); sc.textContent = parts.chunk; w.document.body.appendChild(sc);
await new Promise(r => setTimeout(r, 300));
T(w.nskChunkState().ready, 'ثم يصل الجزءُ المكتبيُّ ويُعلن وصولَه');
const O2 = tour(['admin', 'engineer', 'exec', 'viewer']);
T(!O2.thrown.length, 'وترسم شاشاتُ المكتب والوزارة كاملةً بعده (' + O2.n + ')' + (O2.thrown.length ? ' — ' + O2.thrown.slice(0, 4).join(' | ') : ''));
T(!errs.length, 'ولا خطأَ في التشغيل' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الملفّ الخفيف نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
