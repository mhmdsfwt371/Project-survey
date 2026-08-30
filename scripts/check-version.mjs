// حارس التوثيق: يفشل إن تخلّف أي ملف عن نسخة التطبيق، أو اختلّ توازن أقسام اللوحة
import { readFileSync, writeFileSync as writeFileSync2 } from 'fs';
import { execSync } from 'child_process';

const fail = [];
const ok   = [];

/* ── قاعدةُ العُقم ─────────────────────────────────────────────────────────
   الحارسُ كان أخضرَ وهو أعمى: فحوصُ V13 ظلّت قائمةً بعد V14 فصارت تعدُّ صفرًا
   وتمرُّ صامتة — «كلُّ الأقسام (0) لها تبويب» و«القاموسان 0 مفتاحًا». وفحصٌ
   لا يجد ما يفحصه أخطرُ من فحصٍ يفشل، لأنه يمنح ثقةً بلا أساس.
   فمن اليوم: كلُّ فحصٍ يُعلن عدد ما فحصه، والصفرُ يُفشِل الدفعة. */
function counted(n, label, note){
  if (!Number.isFinite(n) || n <= 0){
    fail.push(`فحصٌ عقيم — ${label}: لم يجد شيئًا ليفحصه (${note || 'تغيّرت البنية والفحص لم يُحدَّث'})`);
    return false;
  }
  return true;
}

function grab(file, re, what){
  let s = '';
  try { s = readFileSync(file, 'utf8'); }
  catch { fail.push(`${file}: الملف غير موجود`); return null; }
  const m = s.match(re);
  if (!m) { fail.push(`${file}: تعذّر استخراج ${what}`); return null; }
  return m[1];
}

/* ١ — رقم النسخة في كل ملف */
const app    = grab('index.html', /نسخة\s*(?:<\/[a-z]+>\s*)?(V\d+\.\d+)/, 'رقم النسخة من الهيدر');
const cache  = grab('sw.js', /nusuk-survey-v(\d+\.\d+)/, 'سلسلة CACHE');
const schema = grab('docs/api-schema.json', /"app_version"\s*:\s*"(V\d+\.\d+)"/, 'app_version');
const sysmd  = grab('docs/system.md', /النسخة\s*`(V\d+\.\d+)`/, 'رقم النسخة');

function docxVer(f){
  try {
    const xml = execSync(`unzip -p ${f} word/document.xml`, { encoding: 'utf8' });
    const m = xml.match(/(V\d+\.\d+)/);
    if (!m) { fail.push(`${f}: لا يحمل رقم نسخة`); return null; }
    return m[1];
  } catch { fail.push(`${f}: تعذّرت قراءته`); return null; }
}
/* وثيقة النظام باسم النسخة: ملف واحد docs/nusuk-system-V*.docx واسمه يطابق نسخة التطبيق */
import { readdirSync } from 'fs';
const sysFiles = readdirSync('docs').filter(f => /^nusuk-system-V[\d.]+\.docx$/.test(f));
let sysDocx = null, sysName = null;
if (sysFiles.length !== 1) fail.push(`docs/nusuk-system-V*.docx: يجب أن يوجد ملف واحد بالضبط — الموجود ${sysFiles.length}`);
else { sysName = sysFiles[0]; sysDocx = docxVer('docs/' + sysName);
  const nameVer = (sysName.match(/V\d+(?:\.\d+)*/) || [])[0];
  if (nameVer && app && nameVer !== app) fail.push(`${sysName}: اسم الملف ${nameVer} بينما التطبيق ${app} — أعد توليده بالاسم الجديد`);
}
const manual = docxVer('docs/nusuk-user-manual.docx');

const want = app;
const seen = { 'sw.js': cache && 'V' + cache, 'docs/api-schema.json': schema,
               'docs/system.md': sysmd,
               ...(sysName ? { ['docs/' + sysName]: sysDocx } : {}),
               'docs/nusuk-user-manual.docx': manual };
if (want) {
  ok.push(`نسخة التطبيق: ${want}`);
  for (const [f, v] of Object.entries(seen)) {
    if (v === null || v === undefined) continue;
    if (v !== want) fail.push(`${f}: النسخة ${v} بينما التطبيق ${want} — حدّثه في نفس الدفعة`);
    else ok.push(`${f}: ${v} ✓`);
  }
}

/* ٢ — سجلُّ الصفحات: كلُّ بندٍ في القائمة له صفحة، وكلُّ صفحةٍ لها بند
   render يقول: `var p = FIELD_PAGES[CUR] || PAGE[CUR]; if (!p) p = PAGE.over;`
   فبندٌ يشير إلى صفحةٍ غيرِ موجودةٍ لا ينفجر — يفتح «نظرة عامة» بهدوء، ولا
   يشكو أحد. وصفحةٌ لا يصلها بندٌ عملٌ مكتوبٌ لا يراه أحد. */
try {
  const s = readFileSync('index.html', 'utf8');
  const a = s.indexOf('var NAV = ['), b = s.indexOf('\n];', a);
  const nav = s.slice(a, b);
  const solo = [...nav.matchAll(/id:'([A-Za-z0-9_]+)'/g)].map(m => m[1]);
  const inGrp = [...nav.matchAll(/\['([A-Za-z0-9_]+)','/g)].map(m => m[1]);
  const navIds = solo.concat(inGrp);
  const pages = new Set(
    [...s.matchAll(/^\s*PAGE\.([A-Za-z0-9_]+)\s*=/gm)].map(m => m[1])
    .concat([...s.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*\{[^\n]*body:/gm)].map(m => m[1])));

  if (counted(navIds.length, 'سجل الصفحات', 'تعذّر قراءة NAV')) {
    /* معرّفٌ مكرّر: navHtml يوسم النشط بـ CUR===id، فيُضيء بندان معًا */
    const dup = [...new Set(navIds.filter((x, i) => navIds.indexOf(x) !== i))];
    if (dup.length) fail.push(`معرّفٌ مكرّرٌ في القائمة (${dup.join(' · ')}) — بندان يُضيئان معًا`);

    const dead = [...new Set(navIds)].filter(x => !pages.has(x));
    if (dead.length) fail.push(`بندُ قائمةٍ بلا صفحة فيفتح «نظرة عامة» صامتًا: ${dead.join(' · ')}`);

    /* صفحاتٌ يُدخَل إليها من داخل الشاشات لا من القائمة — معلنةٌ لا مُكتشَفة */
    const REACHED = new Set(['site', 'over']);
    const orphan = [...pages].filter(x => !navIds.includes(x) && !REACHED.has(x));
    if (orphan.length) fail.push(`صفحةٌ لا يصلها بندٌ ولا استثناءٌ معلن: ${orphan.join(' · ')}`);

    if (!dup.length && !dead.length && !orphan.length)
      ok.push(`سجل الصفحات متّسق: ${new Set(navIds).size} بندًا · ${pages.size} صفحة ✓`);
  }
} catch (e) { fail.push('فحص سجل الصفحات تعثّر: ' + String(e && e.message).slice(0, 110)); }

/* ٣ — «ما هذه الصفحة؟»: لكلِّ صفحةٍ جوابٌ مكتوبٌ أو مولَّد */
try {
  const s = readFileSync('index.html', 'utf8');
  const h = s.indexOf('var HELP = {');
  const hend = s.indexOf('\nfunction ', h);
  const hk = [...s.slice(h, hend).matchAll(/^\s{2}([A-Za-z0-9_]+):\s*\{/gm)].map(m => m[1]);
  const gen = /function\s+helpOf\s*\(/.test(s);
  if (counted(hk.length, 'تغطية الشرح', 'كائن HELP غير موجود')) {
    if (!gen) fail.push('لا مولّدَ شرحٍ (helpOf) — والصفحاتُ خارج HELP ستفتح لوحًا فارغًا');
    else ok.push(`الشرح: ${hk.length} صفحةً بيدٍ والباقي يُولَّد ✓`);
  }
} catch (e) { fail.push('فحص الشرح تعثّر: ' + String(e && e.message).slice(0, 110)); }

/* ── حارس النطاقات: يمنع تكرار خطأ isOwner (V7.0) ────────────────
   كل <script> نطاق مستقل. دالة معرّفة في كتلة ومُستدعاة في أخرى
   بلا window. تنفجر وقت التشغيل فقط — لا يمسكها node --check.
   الاستبعاد على مستوى السطر لا الكتلة: كتلة واحدة قد تضمّ مكتبة
   مصغّرة في سطر عملاق + كود التطبيق في أسطر عادية.
   والعزل يخصّ type=module وحدها — كتل classic تتشارك النطاق العام. */
{
  const src = readFileSync('index.html', 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  const blocks = []; let m;
  while ((m = re.exec(src))) blocks.push({ a: m.index, b: re.lastIndex, mod: /module/.test(m[1]) });
  const blk = p => { for (let i = 0; i < blocks.length; i++) if (p >= blocks[i].a && p < blocks[i].b) return i; return null; };

  /* خريطة الأسطر: أي موضع داخل سطر أطول من 600 حرف = كود مصغّر */
  const MINIFIED = 600;
  const lineStart = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStart.push(i + 1);
  const lineLen = lineStart.map((st, i) => (i + 1 < lineStart.length ? lineStart[i + 1] : src.length) - st);
  const isMin = pos => {
    let lo = 0, hi = lineStart.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStart[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lineLen[lo] > MINIFIED;
  };

  const defs = new Map();
  const DEF_RX = [
    /\bfunction\s+([A-Za-z_]\w{2,})\s*\(/g,                       /* function name() */
    /\b(?:const|let|var)\s+([A-Za-z_]\w{2,})\s*=\s*(?:async\s*)?\(/g, /* const name = (…) => */
    /\b(?:const|let|var)\s+([A-Za-z_]\w{2,})\s*=\s*(?:async\s*)?function\b/g,
    /\b(?:const|let|var)\s+([A-Za-z_]\w{2,})\s*=\s*[A-Za-z_$]\w*\s*=>/g   /* const name = x => */
  ];
  for (const rx of DEF_RX) {
    for (const d of src.matchAll(rx)) {
      if (isMin(d.index)) continue;
      const i = blk(d.index); if (i === null) continue;
      if (!defs.has(d[1])) defs.set(d[1], new Set());
      defs.get(d[1]).add(i);
    }
  }
  const leaks = [];
  for (const [name, where] of defs) {
    if (where.size > 1) continue;
    const home = [...where][0];
    /* كتل classic تتشارك النطاق العام — العزل يخصّ الوحدات وحدها */
    if (!blocks[home].mod) continue;
    const rx = new RegExp('(?<![\\w.$])' + name + '\\s*\\(', 'g');
    for (const u of src.matchAll(rx)) {
      if (isMin(u.index)) continue;
      const i = blk(u.index); if (i === null || i === home) continue;
      const pre = src.slice(Math.max(0, u.index - 12), u.index);
      if (pre.includes('window.') || pre.includes('function ')) continue;
      if (/[.:]\s*$/.test(pre)) continue;
      if (/[{,]\s*$/.test(pre)) continue;                       /* اختصار تابع في كائن */
      if (/\b(?:const|let|var)\s+$/.test(pre)) continue;
      leaks.push(`${name}() معرّفة في كتلة ${home} ومُستدعاة في ${i}`);
      break;
    }
  }
  /* دوال مساعدة معروفة تُعرَّف داخل وحدة ولا تُرى من الكتل العادية.
     قائمة محددة لا فحص عام — الفحص العام على الثوابت يُنتج ضجيجًا لا يُحتمل. */
  {
    const MOD_ONLY = ['AR', 'arS', 'escA', 'esc2'];
    for (const name of MOD_ONLY) {
      const def = [...src.matchAll(new RegExp('(?:const|let|var|function)\\s+' + name + '\\b', 'g'))]
        .map(m => blk(m.index)).filter(i => i !== null);
      if (!def.length) continue;
      const homes = new Set(def);
      const rx = new RegExp('(?<![\\w.$])' + name + '\\s*\\(', 'g');
      for (const u of src.matchAll(rx)) {
        if (isMin(u.index)) continue;
        const i = blk(u.index);
        if (i === null || homes.has(i)) continue;
        const pre = src.slice(Math.max(0, u.index - 12), u.index);
        if (pre.includes('window.')) continue;
        leaks.push(`${name}() دالة وحدة مُستدعاة في كتلة ${i} — استعمل نسخة محلية`);
        break;
      }
    }
  }
  if (leaks.length) {
    for (const l of leaks) fail.push(`مرجع عابر للنطاق — ${l} — صدّرها بـ window.`);
  } else if (blocks.filter(x => x.mod).length === 0) {
    ok.push(`المراجع العابرة: لا كتلةَ module (${blocks.length} كتلة classic تتشارك النطاق) — لا مجالَ للتسرّب`);
  } else ok.push('لا مراجع عابرة بين كتل السكربت ✓');
}

/* الطباعة والخروج في آخر الملف — كانا هنا فبقيت الفحوص الثلاثة التالية بلا أثر */
/* سلسلة نصية مكسورة بسطر جديد: h+='<div> ثم سطر جديد ثم بقية النص — أشهر سبب لـInvalid token */
try {
  const html2 = readFileSync('index.html','utf8');
  const lines = html2.split('\n');
  lines.forEach((ln, ix) => {
    const m = ln.match(/h\s*\+?=\s*'[^']*$/);
    if (!m) return;
    if (/^\s*(\/\/|\/\*)/.test(ln)) return;
    if (ln.trim().endsWith('+') || ln.trim().endsWith('\\')) return;
    fail.push(`index.html:${ix+1}: سلسلة نصية غير مغلقة قبل نهاية السطر — ستكسر الكتلة وقت التشغيل`);
  });
} catch(e) {}

/* دوال محبوسة في نطاق مغلق: تعريفها داخل IIFE واستدعاؤها خارجه ⇒ ReferenceError وقت التشغيل */
try {
  const html = readFileSync('index.html','utf8');
  const CLOSED = ['esc3','esc2b','mnRow'];
  CLOSED.forEach(fn => {
    const defAt = html.indexOf('function ' + fn + '(');
    if (defAt < 0) return;
    const uses = [...html.matchAll(new RegExp('(?<![\\w$.])' + fn + '\\s*\\(', 'g'))].map(m => m.index);
    /* حدُّ النطاق الحاوي بموازنة الأقواس رجوعًا من التعريف — أقربُ «(function(» قد يكون
       وسيطَ forEach لا نطاقًا، وكان يُنتج إنذارًا كاذبًا على دالةٍ مرفوعةٍ في نطاقها. */
    let depth = 0, scopeStart = 0;
    for (let i = defAt; i >= 0; i--) {
      const c = html[i];
      if (c === '}') depth++;
      else if (c === '{') { if (depth === 0) { scopeStart = i; break; } depth--; }
    }
    const bad = uses.filter(u => u < scopeStart);
    if (bad.length) fail.push(`${fn}(): مُستدعاة خارج نطاقها المغلق (${bad.length} مرة) — استعمل نسخة محلية`);
  });
} catch(e) {}

/* كتلة أداة الفحص تُفحص صيغتها ككل كتل التطبيق */
try {
  const pr = readFileSync('tools/prober.html','utf8');
  const s0 = pr.lastIndexOf('<script>');
  const body = pr.slice(pr.indexOf('>', s0)+1, pr.lastIndexOf('</script>'));
  writeFileSync2('/tmp/_prb.js', body);
  execSync('node --check /tmp/_prb.js', {stdio:'pipe'});
  ok.push('tools/prober.html: الصيغة سليمة ✓');
} catch(e){ fail.push('tools/prober.html: خطأ صيغة — ' + String(e.message||'').slice(0,120)); }

/* ── حارس الترجمة ─────────────────────────────────────────────────────────
   V14 يترجم بدالةٍ واحدة: `t('نص')`، ومطابقتُها حرفيةٌ تمامًا — `d[s]` لا غير.
   فالحارسُ يطابق حرفيًّا مثلَها: التطبيعُ هنا كذبٌ رحيم، يقول «مترجَم» عن نصٍّ
   يفشل بحثُه وقتَ التشغيل لفارق حركةٍ واحدة.
   والقاموسُ قاموسان: D وD2 يُدمَجان وقتَ التشغيل — وقراءةُ الأولِ وحده
   أنتجت في أول قياسٍ رقمًا مضخَّمًا: ثلاثمئةٍ وثمانية، والحقيقةُ مئةٌ واثنتان
   وعشرون. فمن قرأ نصفَ المصدر قاسَ نصفَ الحقيقة.
   والحارسُ سقّاطةٌ لا سدّ: يسجّل الفجوةَ في docs/i18n-baseline.json ويفشل إن كبرت. */
try {
  const src = readFileSync('index.html', 'utf8');
  const AR  = /[\u0600-\u06FF]/;
  const KEYS = /'((?:[^'\\]|\\.)*)'\s*:\s*'/g;

  const dict = name => {
    const i = src.indexOf('var ' + name + ' = {');
    if (i < 0) return [new Set(), new Set()];
    const seg = src.slice(i);
    const mu = /\n\s*ur\s*:\s*\{/.exec(seg);
    if (!mu) return [new Set(), new Set()];
    const end = /\n\}\n\};/.exec(seg.slice(mu.index));
    const grab = x => new Set([...x.matchAll(KEYS)].map(m => m[1]));
    return [grab(seg.slice(0, mu.index)),
            grab(seg.slice(mu.index, mu.index + (end ? end.index : seg.length)))];
  };
  const [e1, u1] = dict('D'), [e2, u2] = dict('D2');
  const EN = new Set([...e1, ...e2]), UR = new Set([...u1, ...u2]);

  if (counted(EN.size, 'القاموس الإنجليزي', 'تعذّر العثور على var D')) {
    const onlyEn = [...EN].filter(k => !UR.has(k));
    const onlyUr = [...UR].filter(k => !EN.has(k));
    if (onlyEn.length || onlyUr.length)
      fail.push(`القاموسان غير متطابقين: ${onlyEn.length} في الإنجليزي وحده · ${onlyUr.length} في الأردي وحده`);

    const lits = [...new Set([...src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)]
      .map(m => m[1]).filter(x => AR.test(x)))];
    counted(lits.length, 'نداءات t()', 'لم يُعثر على نصٍّ عربيٍّ داخل t()');
    const miss = lits.filter(k => !EN.has(k));

    const BL = 'docs/i18n-baseline.json';
    const write = n => writeFileSync2(BL, JSON.stringify({ missing: n, note:
      'سقف الفجوة. يهبط ولا يصعد — كل دفعةٍ تترجم تُنقصه، وأي نصٍّ جديدٍ بلا ترجمة يفشّل الدفعة.' }, null, 2) + '\n');
    let base = null;
    try { base = JSON.parse(readFileSync(BL, 'utf8')).missing; } catch {}
    if (base === null || base === undefined) { write(miss.length); ok.push(`سقف الترجمة سُجّل: ${miss.length}`); }
    else if (miss.length > base)
      fail.push(`الفجوةُ كبرت: ${miss.length} نصًّا بلا ترجمةٍ والسقفُ ${base} — ` +
        'ترجم الجديدَ: ' + miss.slice(0, 4).join(' · '));
    else {
      if (miss.length < base) write(miss.length);
      ok.push(miss.length === 0
        ? `الترجمة كاملة: ${lits.length} نصًّا كلُّها في القاموسين (${EN.size} مفتاحًا لكلِّ لغة) ✓`
        : `الترجمة: ${lits.length - miss.length}/${lits.length} · الفجوة ${miss.length} والسقف ${base} ✓`);
    }
  }
} catch (e) { fail.push('حارس الترجمة تعثّر: ' + String(e && e.message).slice(0, 120)); }

/* ── حارس تعارض الكلاسات ──────────────────────────────────────────────
   عنصرٌ يحمل كلاسين لكلٍّ منهما معالجٌ مربوط: أحدهما يستبدل الآخر، والغالبُ
   ترتيبُ الأسطر لا القصد. سلامةٌ بالصدفة يكسرها أيُّ إعادة ترتيب — وقد وقعت
   فعلًا مرتين: زرُّ الإخراج من المرحلة فتح حذفَ القطعة، وزرُّ حذف الفريق
   دهس حذفَ جهة الاتصال. */
try {
  const src = readFileSync('index.html', 'utf8');
  const handlers = new Set();
  for (const m of src.matchAll(/qa\('\.([\w-]+)'\)/g)) handlers.add(m[1]);
  for (const m of src.matchAll(/querySelectorAll\('[^']*\.([\w-]+)'\)/g)) handlers.add(m[1]);
  const clash = new Set();
  for (const m of src.matchAll(/class=\\?["']([^"'\\]{3,90})["'\\]/g)) {
    const cs = m[1].split(/\s+/).filter(c => handlers.has(c));
    if (cs.length > 1) clash.add(cs.join(' + '));
  }
  if (clash.size) fail.push('عناصر بكلاسَين مربوطَين بمعالجَين (' + clash.size + '): ' + [...clash].join(' | '));
  else ok.push('لا عنصر يحمل كلاسَين مربوطَين بمعالجَين ✓');
} catch (e) { fail.push('حارس الكلاسات تعثّر: ' + String(e && e.message).slice(0, 100)); }

/* ── جردا البيانات والكتابة: الرقمُ الخاطئ أسوأ من زرٍّ مفقود ── */
/* عند زرع طفرةٍ تخصُّ ما يفحصه الحارسُ بنفسه — سجلَّ الصفحات أو الترجمة —
   لا معنى لإعادة الجرود التسعة معها: تُعاد دقائقَ بلا فائدة. */
(process.env.NUSUK_SKIP_AUDITS ? [] :
[['scripts/audit-data.mjs',  'جردُ البيانات'],
 ['scripts/audit-writes.mjs','جردُ الكتابة'],
 ['scripts/audit-roles.mjs', 'جردُ الأدوار'],
 ['scripts/audit-calc.mjs',  'جردُ المعادلات'],
 ['scripts/audit-exports.mjs','جردُ التصديرات'],
 ['scripts/audit-rules.mjs',  'جردُ القواعد'],
 ['scripts/audit-scale.mjs',  'جردُ الاتساع'],
 ['scripts/audit-db-rules.mjs','جردُ قواعد القاعدة'],
 ['scripts/audit-crud.mjs',   'جردُ الدورة الكاملة'],
 ['scripts/audit-flow.mjs',   'جردُ الدورة الحياتية'],
 ['scripts/audit-review.mjs', 'مراجعةُ الأدوار']]).forEach(([f, name]) => {
  try { execSync('node ' + f, { stdio:'pipe' }); ok.push(name + ' نظيف ✓'); }
  catch (e) {
    /* الرمز ٢ يعني أن المتصفّح الصوريَّ غائبٌ لا أن الجردَ سقط — والتفريقُ
       بينهما يوفّر ساعةً من البحث في سجلِّ سير العمل. */
    if (e.status === 2){
      fail.push(name + ' لم يُشغَّل — المتصفّحُ الصوريُّ غير مثبَّت. شغّل: npm i jsdom');
      return;
    }
    const out = String((e.stdout || '') + (e.stderr || '')).split('\n')
      .filter(l => l.includes('✗')).slice(0, 3).join(' | ');
    fail.push(name + ' فشل — ' + (out || ('شغّل: node ' + f)));
  }
});

/* ── دفترُ المطابقة: لا قدرةَ في القديم بلا مقابلٍ أو حكم ── */
try {
  execSync('node scripts/parity.mjs', { stdio:'pipe' });
  const bk = JSON.parse(readFileSync('docs/parity.json','utf8'));
  const n = Object.keys(bk.items || {}).length;
  ok.push(`دفتر المطابقة مغلق: ${n} قدرةً من القديم لها مقابلٌ أو حكم ✓`);
} catch (e) {
  fail.push('دفترُ المطابقة غيرُ مغلق — شغّل: node scripts/parity.mjs');
}

ok.forEach(x => console.log('✓', x));
if (fail.length) { fail.forEach(x => console.error('✗', x)); process.exit(1); }
console.log('\nالتوثيق متطابق مع التطبيق ✅');
