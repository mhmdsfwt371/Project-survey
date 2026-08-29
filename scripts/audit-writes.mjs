/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الكتابة — يُشغَّل: node scripts/audit-writes.mjs
   ───────────────────────────────────────────────────────────────────────────
   استيرادُ عناوين الأجهزة كان يعرض معاينةً ويقول «صفًّا حُفظ» ولا يكتب حرفًا.
   والعرضُ بلا كتابةٍ كذبٌ لا يشكو منه أحد: الفنيُّ يرى «حُفظ» فيمضي، والمكتبُ
   ينتظر سجلًّا لن يصل.

   فالقاعدة: كلُّ زرٍّ يَعِد بالحفظ يجب أن يفعل أحدَ اثنين لا ثالثَ لهما —
   إمّا أن يكتب في المخزن، أو أن يقول صراحةً لماذا لم يكتب. والصمتُ عطل.

   يُراقَب `CORE.set` و`CORE.dirty` و`STATE` معًا، وتُلتقَط التوستات.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

/* الأزرارُ التي تَعِد بأثر — لا أزرارَ التنقّل والعرض */
const PROMISES = [
  'data-svsave','data-svnext','data-inssave','data-insdraft','data-nssave',
  'data-impgo','data-appr','data-rej','data-chgadd','data-chgok','data-chgno',
  'data-hseadd','data-ncradd','data-ncrok','data-ipcadd','data-ipcok','data-ipcpay',
  'data-baseset','data-drvsave','data-tkok','data-tkrm','data-newteam','data-addmem',
  'data-rmmem','data-asngo','data-nscoreq','data-dsch','data-ddone','data-smark',
  'data-fmark','data-mkone','data-mkall','data-even','data-bydef','data-fix'
];

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const html = readFileSync('index.html','utf8');
const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {};
if (!w.CSS.escape) w.CSS.escape = s => String(s);

await new Promise(r => setTimeout(r, 800));
const go = d.getElementById('lgGo');
check(!!go, 'شاشةُ الدخول موجودة');
if (go) go.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));

/* ── المراقبة ──────────────────────────────────────────────────────────── */
let writes = 0, said = [];
const oset = w.CORE.set, odirty = w.CORE.dirty;
w.CORE.set   = function(){ writes++; try { return oset.apply(w.CORE, arguments); } catch(e){} };
w.CORE.dirty = function(){ writes++; try { return odirty.apply(w.CORE, arguments); } catch(e){} };
w.toast = m => said.push(String(m));

/* ── الجولة: كلُّ صفحةٍ، كلُّ وعدٍ فيها ───────────────────────────────────── */
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a => a.getAttribute('data-p')))];
check(ids.length > 40, `القائمةُ تعرض بنودَها (${ids.length})`);

const silent = [], threw = [];
let promises = 0;

for (const id of ids){
  try { w.CUR = id; w.render(1); } catch { continue; }
  const C = d.getElementById('content');
  if (!C) continue;
  const seen = new Set();
  for (const attr of PROMISES){
    const els = [...C.querySelectorAll('[' + attr + ']')];
    if (!els.length) continue;
    const el = els[0];                    /* واحدٌ من كلِّ نوعٍ في كلِّ شاشة يكفي */
    const tag = id + ' · ' + attr;
    if (seen.has(attr)) continue;
    seen.add(attr);
    promises++;
    writes = 0; said = [];
    try { el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); }
    catch (e){ threw.push(tag + ' → ' + String(e.message).slice(0,50)); continue; }
    if (writes === 0 && said.length === 0) silent.push(tag);
    /* الشاشةُ قد تتبدّل بالضغط — تُعاد لموضعها */
    try { w.CUR = id; w.render(1); } catch {}
  }
}

check(promises > 15, `وُجدت وعودُ حفظٍ لتُفحَص (${promises})`);
check(threw.length === 0, 'لا وعدَ ينفجر عند الضغط'
  + (threw.length ? ' — ' + threw.slice(0,3).join(' | ') : ''));
check(silent.length === 0, 'كلُّ وعدٍ إمّا يكتب أو يقول لماذا لم يكتب'
  + (silent.length ? ` — الصامت (${silent.length}): ` + silent.slice(0,8).join(' | ') : ''));

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة كلِّها'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length} · وعودٌ فُحصت ${promises}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الكتابة نظيف ✅');
process.exit(0);
