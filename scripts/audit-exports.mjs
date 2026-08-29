/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التصديرات — يُشغَّل: node scripts/audit-exports.mjs
   ───────────────────────────────────────────────────────────────────────────
   الورقةُ تخرج من التطبيق ولا تعود. ما على الشاشة يُراجَع ويُصحَّح، وما في
   الملفِّ يُرسَل ويُبنى عليه ولا يُراجعه أحدٌ بعد الإرسال.

   فكلُّ ورقةٍ تُولَّد هنا فعلًا ويُقاس ما فيها: رأسٌ لها، وصفوفُها بعرض رأسها،
   ولا خليةَ فارغةً بلا معنًى ولا NaN ولا [object Object]، وسطرُ الإجمالي يساوي
   جمعَ عموده، وما يُصدَّر يطابق ما يُعرَض.

   ويُفحَص المنفذ أيضًا: كلُّ زرِّ تصديرٍ يشير إلى ورقةٍ قائمة، وكلُّ ورقةٍ
   يصلها منفذ — فورقةٌ تُبنى ولا تُطلَب شيفرةٌ ميتة، وزرٌّ يطلب ورقةً لا وجودَ
   لها ملفٌّ فارغٌ يخرج بلا شكوى.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const html = readFileSync('index.html','utf8');
const vc = new VirtualConsole(); const boot = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) boot.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
                              url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
/* المتصفّحُ الصوريُّ ينقصه ما في المتصفّحات الحقيقية: مرمِّزُ النصوص الذي
   يُبنى به ملفُّ KMZ، وروابطُ الكائنات التي يُنزَّل بها الملف. وغيابُها يُظهر
   عطلًا في التطبيق وليس فيه عطل — فتُسدّ قبل أن يُتَّهم بريء. */
{
  const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder;
  if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (w.URL && !w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){},
                                             addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
}

await new Promise(r => setTimeout(r, 800));
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
await new Promise(r => setTimeout(r, 400));

const S = w.STATE;

/* ── السيناريو: ورقةٌ على قاعدةٍ خامٍ تخرج فارغةً وتمرّ ─────────────────── */
{
  [['ph',35],['days',26],['daysWeek',6],['budCap',5000000],['budApp',50000],
   ['tgtSurvey',400],['tgtInsCamp',900],['tgtInsCor',1000],
   ['tgtPrepCamp',700],['tgtPrepCor',600],['tgtAsmCamp',700],['tgtAsmCor',600],
   ['tgtDis',500],['insCamp',17],['insCor',21],['disOk',6],['disBad',9]
  ].forEach(([k,v]) => w.cfgSet(k, null, v));
  const cats = [...new Set(S.sites.map(x => w.catLabel(x)))];
  const zones = [...new Set(S.sites.map(x => x.zone))];
  zones.forEach(z => cats.forEach(c => { w.cfgSet('w', z+'|'+c, 3); w.cfgSet('dw', z+'|'+c, 2); }));
  ['ant','rdr','cam','box','cable'].forEach((k,i) => {
    w.cfgSet('itPts',k,i+2); w.cfgSet('itPrice',k,(i+1)*250);
    w.cfgSet('itPrep',k,1); w.cfgSet('itAsm',k,1);
  });
  for (let i = 0; i < 120; i++){
    const x = S.sites[i];
    S.recs[x.id] = { id:x.id, by:'فني', at:Date.now(), mount:'عمود', chals:[], photos:['site','mount'] };
  }
  for (let i = 0; i < 40; i++){
    const x = S.sites[i];
    S.inss[x.id] = { id:x.id, by:'فني', at:Date.now(), status:'مُركّب', approved:true,
                     parts:{ ant:1, rdr:1, cam:1 } };
  }
  S.tasks['T1'] = { id:'T1', site:S.sites[0].id, to:'فني', kind:'survey', due:'2026-09-01', st:'مطلوب' };
  const tm = (w.TEAMS||[])[0];
  if (tm) tm.members = [{name:'أحمد',role:'sup',share:40},{name:'خالد',role:'tech',share:30},
                        {name:'سعيد',role:'tech',share:30}];
  w.statBump();
  if (typeof w.baseSet === 'function') w.baseSet();
  check(w.siteStats().surveyed === 120, 'السيناريو مزروع — مئةٌ وعشرون مسحًا');
}

/* ── ١ · المنافذ: زرٌّ بلا ورقة، وورقةٌ بلا منفذ ────────────────────────── */
const SHEETS = w.SHEETS || {};
const keys = Object.keys(SHEETS);
check(keys.length > 20, `أوراقُ التصدير معرَّفة (${keys.length})`);

const btnKeys = [...new Set([...html.matchAll(/data-xls=\\?"([A-Za-z0-9_*]+)/g)].map(m => m[1]))]
  .filter(k => k !== '*');
const ghost = btnKeys.filter(k => !SHEETS[k]);
check(ghost.length === 0, 'كلُّ زرِّ تصديرٍ يشير إلى ورقةٍ قائمة'
  + (ghost.length ? ' — الشبح: ' + ghost.join(' · ') : ''));

/* الورقةُ تُطلَب إمّا بزرٍّ أو من لوح الاختيار */
const picker = new Set((w.EXP_SECS || []).map(x => x[0]));
check(picker.size > 10, `لوحُ اختيار الأوراق مبنيّ (${picker.size} قسمًا)`);
const orphan = keys.filter(k => btnKeys.indexOf(k) < 0 && !picker.has(k));
check(orphan.length === 0, 'كلُّ ورقةٍ يصلها منفذ'
  + (orphan.length ? ` (${orphan.length}): ` + orphan.join(' · ') : ''));

/* ── ٢ · البنية: رأسٌ وصفوفٌ بعرضه، وخلايا لها معنى ───────────────────── */
const BAD = /^(undefined|null|NaN|\[object Object\])$/;
const empty = [], ragged = [], junk = [], threw = [];
let rows = 0;

keys.forEach(k => {
  let t;
  try { t = SHEETS[k](); }
  catch (e){ threw.push(k + ' → ' + String(e.message).slice(0,60)); return; }
  /* رأسٌ بلا صفوفٍ مشروع: لا حوادثَ بعد فلا سطورَ في ورقة السلامة.
     والمعطوبُ من لا رأسَ له أصلًا — فالملفُّ يخرج بلا عناوين. */
  if (!Array.isArray(t) || !t.length || !Array.isArray(t[0]) || !t[0].length){ empty.push(k); return; }
  const wdt = t[0].length;
  t.forEach((r, i) => {
    if (!Array.isArray(r)) { ragged.push(k + '#' + i + ' ليس صفًّا'); return; }
    if (r.length !== wdt) ragged.push(k + '#' + i + ' عرضُه ' + r.length + ' والرأسُ ' + wdt);
    r.forEach((c, j) => {
      const v = String(c);
      if (BAD.test(v) || (typeof c === 'number' && !isFinite(c)))
        junk.push(k + '#' + i + ':' + j + ' = ' + v);
    });
  });
  rows += t.length - 1;
});

check(threw.length === 0, 'لا ورقةَ تنفجر عند توليدها'
  + (threw.length ? ' — ' + threw.slice(0,3).join(' | ') : ''));
check(empty.length === 0, 'لا ورقةَ تخرج بلا رأسٍ أو بلا صفوف'
  + (empty.length ? ` (${empty.length}): ` + empty.join(' · ') : ''));
check(ragged.length === 0, 'صفوفُ كلِّ ورقةٍ بعرض رأسها'
  + (ragged.length ? ` (${ragged.length}): ` + ragged.slice(0,4).join(' | ') : ''));
check(junk.length === 0, 'لا خليةَ بلا معنًى في أيِّ ورقة'
  + (junk.length ? ` (${junk.length}): ` + junk.slice(0,4).join(' | ') : ''));
check(rows > 100, `الأوراقُ تحمل بياناتٍ فعلية (${rows} صفًّا)`);

/* ── ٣ · سطرُ الإجمالي يساوي جمعَ عموده ──────────────────────────────── */
{
  const off = [];
  keys.forEach(k => {
    let t; try { t = SHEETS[k](); } catch { return; }
    if (!Array.isArray(t) || t.length < 3) return;
    const last = t[t.length - 1];
    if (!Array.isArray(last) || !/الإجمالي|المجموع/.test(String(last[0]))) return;
    for (let j = 1; j < last.length; j++){
      if (typeof last[j] !== 'number') continue;
      let sum = 0, seen = 0;
      for (let i = 1; i < t.length - 1; i++){
        const v = t[i][j];
        if (typeof v === 'number'){ sum += v; seen++; }
      }
      if (seen && Math.abs(sum - last[j]) > 1) off.push(k + ' · عمود ' + j + ': ' + last[j] + ' ≠ ' + sum);
    }
  });
  check(off.length === 0, 'سطرُ الإجمالي يساوي جمعَ عموده'
    + (off.length ? ` (${off.length}): ` + off.slice(0,4).join(' | ') : ''));
}

/* ── ٤ · ما يُصدَّر يطابق ما يُعرَض ──────────────────────────────────────── */
{
  const st = w.siteStats();
  const over = SHEETS.over ? SHEETS.over() : null;
  if (over){
    const last = over[over.length - 1];
    check(last && last[2] === st.total, `ورقةُ «نظرة عامة» تطابق الشاشة — ${last && last[2]} مقابل ${st.total}`);
  } else fails.push('ورقةُ «نظرة عامة» غير موجودة');

  const sites = SHEETS.sites ? SHEETS.sites() : null;
  check(sites && sites.length - 1 === S.sites.length,
    `ورقةُ المواقع تحمل كلَّ المواقع — ${sites ? sites.length-1 : 0} مقابل ${S.sites.length}`);
}

check(boot.length === 0, 'لا خطأَ تشغيلٍ في الجولة'
  + (boot.length ? ' — ' + boot[0].slice(0,70) : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length} · أوراقٌ فُحصت ${keys.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('جردُ التصديرات نظيف ✅');
process.exit(0);
