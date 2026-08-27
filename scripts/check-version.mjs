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

/* ── حارس الترجمة: أي نصٍّ عربيٍّ يصل واجهة شاشة الإعدادات ولا مفتاح له يفشل الدفعة ──
   المطابقة بتطبيع محرك اللغات نفسه: NFC + تجريد التشكيل والتطويل + طي الفراغات.
   النطاق شاشة الإعدادات وحدها الآن — تُوسَّع شاشةً شاشةً كلما اكتملت ترجمتها. */
try {
  const src = readFileSync('index.html', 'utf8');
  const AR = /[\u0600-\u06FF]/;
  const nrm = t => String(t).normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/\s+/g, ' ').trim();
  const grabKeys = tag => {
    const i = src.indexOf(tag), j = src.indexOf('\n  };', i);
    return new Set([...src.slice(i, j).matchAll(/'([^']*[\u0600-\u06FF][^']*)'\s*:/g)]
      .map(m => nrm(m[1])));
  };
  const EN = grabKeys('D.en ='), UR = grabKeys('D.ur =');
  const onlyEn = [...EN].filter(k => !UR.has(k));
  const onlyUr = [...UR].filter(k => !EN.has(k));
  if (onlyEn.length || onlyUr.length)
    fail.push(`القاموسان غير متطابقين: ${onlyEn.length} في الإنجليزي وحده · ${onlyUr.length} في الأردي وحده`);

  const a = src.indexOf('window.cfgPages = ['), b = src.indexOf('window.pwRows = function');
  const seg = src.slice(a, b);
  const cuts = [];
  for (const m of seg.matchAll(/\/\*[\s\S]*?\*\//g)) cuts.push([m.index, m.index + m[0].length]);
  const inCut = p => cuts.some(([x, y]) => p >= x && p < y);
  const miss = new Set();
  const add = t => {
    t = String(t).trim();
    if (!t || !AR.test(t) || t.length > 400) return;
    /* نصُّ نافذة السؤال يُعرض فقرةً لكل سطر، فتُطابَق كلٌّ على حدة */
    for (const part of t.split(/\\n|\n/)) {
      let p = part.trim();
      if (/^«[^«»]*»$/.test(p)) continue;              /* اسمٌ محاطٌ بالكامل = قيمةُ بيانات */
      p = p.replace(/^»\s*/, '').trim();               /* بقيةُ قوسٍ من مقطعٍ سابق */
      if (!p || !AR.test(p)) continue;
      const n = nrm(p);
      if (n && !EN.has(n)) miss.add(n);
    }
  };
  /* السلاسل المتجاورة المفصولة بـ+ تُدمَج: الناتج في الصفحة نصٌّ واحد لا ثلاثة */
  const JOIN = /((?:'(?:[^'\\\n]|\\.)*'\s*\+\s*)*'(?:[^'\\\n]|\\.)*')/g;
  const LOGFN = /(NSKSYNC\.log|\.log\(|itSave\(|buySave\(|buyCatSave\(|roleSave\(|pwSave\(|tkRegSave\(|tkSave\(|_disSave\()/;
  for (const g of seg.matchAll(JOIN)) {
    const pre0 = seg.slice(Math.max(0, g.index - 240), g.index);
    /* وسيطٌ أخيرٌ لدالة حفظ = نصُّ سجل الأحداث، وهو يبقى عربيًّا بقرار */
    const isLogArg = /,\s*$/.test(pre0) && LOGFN.test(pre0);
    if (inCut(g.index) || isLogArg) continue;
    const raw = [...g[1].matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(x => x[1]).join('');
    if (!raw || !AR.test(raw)) continue;
    const pre = pre0;
    if (!/[<>]/.test(raw)) { add(raw); continue; }
    /* السلسلة قد تبدأ ببقية وسمٍ من مقطعٍ سابق وتنتهي بوسمٍ مفتوحٍ للمقطع التالي */
    let cut = raw;
    const gt = cut.indexOf('>'), lt = cut.indexOf('<');
    if (gt >= 0 && (lt < 0 || gt < lt)) cut = cut.slice(gt + 1);
    const lastLt = cut.lastIndexOf('<');
    if (lastLt >= 0 && cut.indexOf('>', lastLt) < 0) cut = cut.slice(0, lastLt);
    for (const at of ['title', 'placeholder', 'aria-label', 'data-l'])
      for (const mm of raw.matchAll(new RegExp(at + '=\\\\?["\']([^"\'\\\\]*)', 'g'))) add(mm[1]);
    let tag = '';
    for (const p of cut.split(/(<[^>]*>)/)) {
      if (p.startsWith('<')) {
        const mm = p.match(/<\/?\s*([a-zA-Z][\w-]*)/);
        if (mm) tag = p.startsWith('</') ? '' : mm[1].toLowerCase();
      } else if (tag !== 'option' && tag !== 'optgroup') add(p);
    }
  }
  if (miss.size)
    fail.push(`نصوص شاشة الإعدادات بلا ترجمة (${miss.size}): ` + [...miss].slice(0, 6).join(' · '));
  else ok.push(`ترجمة شاشة الإعدادات كاملة · القاموسان ${EN.size} مفتاحًا ✓`);
} catch (e) { fail.push('حارس الترجمة تعثّر: ' + String(e && e.message).slice(0, 120)); }

ok.forEach(x => console.log('✓', x));
if (fail.length) { fail.forEach(x => console.error('✗', x)); process.exit(1); }
console.log('\nالتوثيق متطابق مع التطبيق ✅');
