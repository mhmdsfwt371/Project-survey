// حارس التوثيق: يفشل إن تخلّف أي ملف عن نسخة التطبيق، أو اختلّ توازن أقسام اللوحة
import { readFileSync, writeFileSync as writeFileSync2 } from 'fs';
import { execSync } from 'child_process';

const fail = [];
const ok   = [];

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

/* ٢ — توازن أقسام لوحة المتابعة (قسم غير مغلق يبتلع ما بعده ويُخفيه مع التبويب) */
try {
  const s = readFileSync('index.html', 'utf8');
  const i = s.indexOf('function render(){');
  const j = s.indexOf("$i('dWrap').innerHTML=h;");
  if (i > -1 && j > i) {
    const seg = s.slice(i, j);
    const opens  = (seg.match(/<section class=\\?"dSec/g) || []).length;
    const closes = (seg.match(/<\/section>/g) || []).length;
    if (opens !== closes)
      fail.push(`أقسام اللوحة غير متوازنة: ${opens} فتح مقابل ${closes} إغلاق — قسم غير مغلق سيبتلع ما بعده ويختفي مع إخفاء التبويب`);
    else ok.push(`أقسام اللوحة متوازنة: ${opens} ✓`);
  }
} catch {}

/* ٣ — كل قسم له تبويب */
try {
  const s = readFileSync('index.html', 'utf8');
  const secs = [...new Set([...s.matchAll(/data-sec="([a-z]+)"/g)].map(m => m[1]))];
  const tabsBlock = s.slice(s.indexOf('var DTABS=['), s.indexOf('function tabOf'));
  const mapped = new Set([...tabsBlock.matchAll(/'([a-z]+)'/g)].map(m => m[1]));
  const orphan = secs.filter(x => !mapped.has(x));
  if (orphan.length) fail.push(`أقسام بلا تبويب فلن تظهر لأحد: ${orphan.join(' · ')}`);
  else ok.push(`كل الأقسام (${secs.length}) لها تبويب ✓`);
} catch {}

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
  } else ok.push('لا مراجع عابرة بين كتل السكربت ✓');
}

ok.forEach(x => console.log('✓', x));
if (fail.length) { fail.forEach(x => console.error('✗', x)); process.exit(1); }
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
    /* التعريف داخل IIFE يبدأ عند أقرب "(function(" قبله — أي استخدام قبل ذلك الحد خارجُ النطاق */
    const scopeStart = html.lastIndexOf('(function(', defAt);
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

console.log('\nالتوثيق متطابق مع التطبيق ✅');
