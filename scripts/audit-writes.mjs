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

/* الجولةُ الأولى كانت على أربعٍ وثلاثين خاصيةً مختارةً بيد، والتطبيقُ يفوّض
   مئةً وثماني. فما لم يُختَر لم يُفحَص — والاختيارُ باليد يكشف ما تذكّرتَه.
   فصارت الجولةُ الثانيةُ على كلِّ خاصيةٍ مفوَّضةٍ بلا استثناء، وشرطُها أخفُّ
   وأعمُّ: أن يقع أثرٌ يُرى — كتابةٌ، أو قولٌ، أو انتقالُ شاشة، أو تغيُّرُ ما
   يُعرَض. والسكوتُ التامُّ عطل. */

/* الأزرارُ التي تَعِد بأثر — لا أزرارَ التنقّل والعرض */
const PROMISES = [
  'data-svsave','data-svnext','data-inssave','data-insdraft','data-nssave',
  'data-impgo','data-appr','data-rej','data-chgadd','data-chgok','data-chgno',
  'data-hseadd','data-ncradd','data-ncrok','data-ipcadd','data-ipcok','data-ipcpay',
  'data-baseset','data-drvsave','data-tkok','data-tkrm','data-newteam','data-addmem',
  'data-rmmem','data-asngo','data-nscoreq','data-dsch','data-ddone','data-smark',
  'data-fmark','data-mkone','data-mkall','data-even','data-bydef'
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

/* ══ الجولةُ الشاملة: كلُّ خاصيةٍ مفوَّضةٍ في كلِّ شاشةٍ تظهر فيها ══════════ */
{
  const ALL = [...new Set([...html.matchAll(/closest\('\[(data-[\w-]+)\]'\)/g)].map(m => m[1]))];
  check(ALL.length > 90, `الخصائصُ المفوَّضة (${ALL.length})`);

  /* قائمةُ الخصائص تُشتقُّ من نصِّ المعالج وقتَ التشغيل. وإن عجز الاشتقاق —
     بتصغيرٍ يبدّل الأسماء أو محرّكٍ لا يعطي نصَّ الدالة — فالتطبيقُ يبقى سليمًا
     لأنه يعتبر كلَّ زرٍّ موصولًا عندئذٍ. لكنّ حمايةَ الأزرار الميتة تسقط في
     صمت: يُنقَر زرٌّ غيرُ مربوطٍ فلا يقول شيئًا ولا يشكو أحد.
     فيُشترَط أن يكون الاشتقاقُ عاملًا لا مجرَّدَ موجود. */
  const derived = (typeof w.actList === 'function') ? (w.actList() || []) : null;
  check(derived !== null, 'دالةُ اشتقاق الخصائص متاحة');
  check(derived && derived.length > 90,
    `اشتقاقُ الخصائص عاملٌ فعلًا (${derived ? derived.length : 0} خاصية) — وإلا سقطت حمايةُ الأزرار الميتة صامتة`);

  /* ما لا يُضغَط في جولةٍ آلية: يبدّل الدورَ فيُفسد ما بعده، أو يمسح كاشًا،
     أو يفتح نافذةَ طباعةٍ لا تُغلق. تُستثنى بأسمائها لا صمتًا. */
  const SKIP = new Set(['data-role','data-swclear','data-print','data-pwa','data-imp',
    /* يبدأ بتنزيل محرّك إكسل من الشبكة — لا شبكةَ في المتصفّح الصوريّ */
    'data-tpl']);

  const silent2 = [], threw2 = [];
  let clicked = 0;
  const roleWas = w.ROLE;

  for (const id of ids){
    try { w.CUR = id; w.render(1); } catch { continue; }
    const C = d.getElementById('content');
    if (!C) continue;
    const seen = new Set();
    for (const attr of ALL){
      if (SKIP.has(attr)) continue;
      /* الشريحةُ المختارةُ سلفًا لا تتغيّر بالضغط عليها — وهذا صوابٌ لا عطل.
         فتُجرَّب ثلاثةٌ من كلِّ خاصية، ويكفي أن يقع الأثرُ في واحدة. */
      /* الحقلُ ليس زرًّا: بعضُ الخصائص تُقرأ عند الإدخال لا عند الضغط،
         فالضغطُ على قائمةٍ منسدلةٍ لا يجب أن يفعل شيئًا — وذلك صواب. */
      const cands = [...C.querySelectorAll('[' + attr + ']')]
        .filter(x => !/^(INPUT|SELECT|TEXTAREA|OPTION)$/.test(x.tagName)).slice(0, 3);
      if (!cands.length || seen.has(attr)) continue;
      seen.add(attr);
      clicked++;
      /* الأثرُ قد يقع خارج #content: لوحٌ يُفتَح، أو مربّعُ اختيارٍ يُؤشَّر —
         والتأشيرُ خاصيةٌ لا سمةٌ فلا يظهر في innerHTML. فيُلتقَط الجسمُ كلُّه
         وحالةُ الحقول معًا، وإلا عُدَّ العاملُ صامتًا وهو يعمل. */
      const snap = () => {
        let f = '';
        d.querySelectorAll('input,select,textarea').forEach(x => {
          f += (x.type === 'checkbox' || x.type === 'radio') ? (x.checked ? '1' : '0') : String(x.value);
          f += '\u0001';
        });
        return d.body.innerHTML + '\u0002' + f;
      };
      /* الرايةُ المفتوحةُ من ضغطةٍ سابقةٍ تجعل الضغطةَ التاليةَ بلا أثر —
         فيُعاد ضبطُ ألواح العرض قبل كلِّ محاولة، وإلا اتُّهم العاملُ بالصمت. */
      const reset = () => {
        ['HELP_OPEN','EXP_OPEN','POP_OPEN','NS_CO_OPEN','ASN_OPEN','CO_OPEN','SEL_MODE']
          .forEach(k => { if (k in w) w[k] = false; });
        w.ROLE = roleWas;
      };
      let hit = false, blew = null;
      for (const el of cands){
        reset();
        try { w.CUR = id; w.render(1); } catch {}
        const live = d.querySelector('[' + attr + '="' + (el.getAttribute(attr) || '') + '"]') || el;
        writes = 0; said = [];
        const beforeHtml = snap(), beforeCur = w.CUR;
        try { live.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); }
        catch (e){ blew = String(e.message).slice(0,45); break; }
        /* بعضُ الأزرار يبدأ عملًا غيرَ متزامنٍ — تنزيلُ محرّك إكسل مثلًا —
           فالأثرُ يقع بعد الضغطة لا معها. تُمهَل دورةُ حدثٍ واحدة. */
        await new Promise(r => setTimeout(r, 0));
        let afterHtml = '';
        try { afterHtml = snap(); } catch {}
        if (writes || said.length || w.CUR !== beforeCur || afterHtml !== beforeHtml){ hit = true; break; }
      }
      if (blew) threw2.push(id + ' · ' + attr + ' → ' + blew);
      else if (!hit) silent2.push(id + ' · ' + attr);
      reset();
      try { w.CUR = id; w.render(1); } catch {}
    }
  }
  w.ROLE = roleWas;

  check(clicked > 60, `ضُغطت خصائصُ الشاشات كلِّها (${clicked} ضغطة)`);
  check(threw2.length === 0, 'لا خاصيةَ تنفجر عند الضغط'
    + (threw2.length ? ` (${threw2.length}): ` + threw2.slice(0,4).join(' | ') : ''));
  check(silent2.length === 0, 'لا خاصيةَ تُضغَط بلا أثرٍ يُرى'
    + (silent2.length ? ` (${silent2.length}): ` + silent2.slice(0,8).join(' | ') : ''));
}
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
