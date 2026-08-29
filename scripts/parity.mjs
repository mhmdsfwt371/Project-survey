/* ═══════════════════════════════════════════════════════════════════════════
   دفترُ المطابقة — قدراتُ القديم، واحدةً واحدةً، محكومٌ عليها
   ───────────────────────────────────────────────────────────────────────────
   كان الكشفُ بلقطات الشاشة: يفتح محمدُ شاشةً فيجد نقصًا فيبعثها. وهذا يكشف
   ما صادفه لا ما نقص، ولا ينتهي.

   فصار الجردُ آليًّا: تُستخرَج قدراتُ `legacy/v13.99.html` من مصدره — أزراره
   وأقسامه وحقوله وعناوينه وأوراقه وتبويباته — ثم يُبحَث عن كلٍّ منها في
   `index.html`. وما لم يوجد يُحكَم عليه في `docs/parity.json` بأحد ثلاثة:

     موجود        — وُجد نصًّا، ويُعاد التحقق منه كلَّ دفعة
     مُعاد التسمية — موجودٌ باسمٍ آخر، والاسمُ الجديد مكتوبٌ في الدفتر ويُفحَص
     مقصود        — حُذف بقرار، والسببُ مكتوب
     ناقص         — لم يُبنَ بعد، ويُفشِل الحارس

   فالدفترُ شبكةُ ارتدادٍ أيضًا: ما ثبت وجودُه اليومَ إن اختفى غدًا فشلت الدفعة.

   يُشغَّل:  node scripts/parity.mjs          — تقرير
            node scripts/parity.mjs --write   — يولّد/يحدّث الدفتر
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from 'fs';

const OLD = 'legacy/v13.99.html';
const NEW = 'index.html';
const BOOK = 'docs/parity.json';

const AR = /[\u0600-\u06FF]/;
export const nrm = t => String(t).normalize('NFC')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[\u0622\u0623\u0625]/g, '\u0627')
  .replace(/\u0649/g, '\u064A').replace(/\u0629/g, '\u0647')
  .replace(/[^\u0621-\u064AA-Za-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ').trim();

/* ── قدراتُ القديم من مصدره ─────────────────────────────────────────────── */
export function oldCaps(src){
  const out = new Map();
  const add = (kind, raw) => {
    let s = String(raw || '');
    /* شظايا السلاسل المركّبة ليست نصوصَ واجهة */
    if (/[+'"\\]|esc\(|\$\{|<[a-z]/i.test(s)) return;
    s = s.replace(/^[^\u0600-\u06FFA-Za-z0-9]+/, '').trim();
    if (!s || !AR.test(s) || s.length > 60) return;
    const key = nrm(s);
    if (!key || key.length < 3 || key.split(' ').length > 9) return;
    out.set(kind + '|' + key, { kind, label:s, key });
  };
  for (const m of src.matchAll(/<button[^>]*>([^<]+)</g))            add('زر', m[1]);
  for (const m of src.matchAll(/<legend>([^<]+)</g))                 add('قسم', m[1]);
  for (const m of src.matchAll(/field\('([^']+)'/g))                 add('حقل', m[1]);
  for (const m of src.matchAll(/<h[34][^>]*>([^<]+)</g))             add('عنوان', m[1]);
  for (const m of src.matchAll(/book_append_sheet\([^,]+,[^,]+,\s*'([^']+)'/g)) add('ورقة', m[1]);
  for (const m of src.matchAll(/\['([a-z]+)','([^']+)',\s*\[/g))     add('تبويب', m[2]);
  for (const m of src.matchAll(/window\.cfgPages\s*=\s*\[([\s\S]{0,3000}?)\]\s*;/g))
    for (const p of m[1].matchAll(/\['(\w+)','([^']+)'/g))           add('صفحة إعدادات', p[2]);
  return [...out.values()].sort((a,b) => a.kind.localeCompare(b.kind,'ar') || a.key.localeCompare(b.key,'ar'));
}

/* ── سطحُ الجديد: كلُّ نصٍّ عربيٍّ يصل الواجهة، مطبَّعًا ──────────────────── */
export function newSurface(src){
  let flat = '';
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) if (AR.test(m[1])) flat += ' ' + m[1];
  for (const m of src.matchAll(/>([^<>]*)</g))            if (AR.test(m[1])) flat += ' ' + m[1];
  return ' ' + nrm(flat.replace(/<[^>]*>/g, ' ')) + ' ';
}

/* ── التشغيل ───────────────────────────────────────────────────────────── */
const src = readFileSync(OLD, 'utf8');
const dst = readFileSync(NEW, 'utf8');
const caps = oldCaps(src);
const surf = newSurface(dst);
const found = k => surf.includes(k);

let book = { note:
  'دفترُ المطابقة. كلُّ قدرةٍ في النظام القديم لها هنا حكم. ' +
  'الحكمُ «ناقص» يُفشِل الحارس، و«موجود» و«مُعاد التسمية» يُعاد التحقق منهما كلَّ دفعة.',
  items: {} };
if (existsSync(BOOK)) { try { book = JSON.parse(readFileSync(BOOK, 'utf8')); } catch {} }
book.items = book.items || {};

const WRITE = process.argv.includes('--write');
const rows = [], gaps = [], regress = [], unjudged = [];

for (const c of caps){
  const id = c.kind + '|' + c.key;
  const rec = book.items[id];
  const hit = found(c.key);

  if (!rec){
    if (WRITE) book.items[id] = hit
      ? { label:c.label, verdict:'موجود' }
      : { label:c.label, verdict:'ناقص', why:'' };
    (hit ? rows : unjudged).push(c);
    continue;
  }
  if (rec.verdict === 'ناقص'){
    /* ما بُني اليومَ يُرقَّى تلقائيًّا — الدفترُ يتبع الشيفرة لا العكس */
    if (hit && WRITE){ rec.verdict = 'موجود'; delete rec.why; rows.push(c); }
    else if (hit) { gaps.push({ c, rec:{ ...rec, why:'بُني — شغّل --write ليُرقَّى' } }); }
    else gaps.push({ c, rec });
    continue;
  }
  if (rec.verdict === 'مقصود'){ rows.push(c); continue; }

  /* موجود / مُعاد التسمية — يُعاد التحقق: شبكةُ الارتداد */
  const probe = rec.verdict === 'مُعاد التسمية' ? nrm(rec.now || '') : c.key;
  if (!probe || !found(probe)) regress.push({ c, rec, probe });
  else rows.push(c);
}

console.log('قدراتُ القديم: ' + caps.length);
console.log('  مُتحقَّقٌ منها : ' + rows.length);
console.log('  ناقصة        : ' + gaps.length);
console.log('  بلا حكم      : ' + unjudged.length);
console.log('  ارتداد       : ' + regress.length);

if (WRITE){
  writeFileSync(BOOK, JSON.stringify(book, null, 1) + '\n');
  console.log('\nالدفترُ كُتب: ' + BOOK + ' · ' + Object.keys(book.items).length + ' بندًا');
  process.exit(0);
}

if (unjudged.length){
  console.log('\n── بلا حكمٍ في الدفتر ──');
  unjudged.forEach(c => console.log('  [' + c.kind + '] ' + c.label));
}
if (gaps.length){
  console.log('\n── ناقصة ──');
  gaps.forEach(g => console.log('  [' + g.c.kind + '] ' + g.c.label + (g.rec.why ? '  — ' + g.rec.why : '')));
}
if (regress.length){
  console.log('\n── ارتداد: كانت موجودةً وغابت ──');
  regress.forEach(r => console.log('  [' + r.c.kind + '] ' + r.c.label
    + (r.rec.verdict === 'مُعاد التسمية' ? '  (المرساة: ' + (r.rec.now||'—') + ')' : '')));
}

const bad = gaps.length + regress.length + unjudged.length;
console.log('');
if (bad){ console.error('✗ الدفترُ غيرُ مغلق: ' + bad + ' بندًا'); process.exit(1); }
console.log('دفترُ المطابقة مغلق — لا قدرةَ في القديم بلا مقابلٍ أو حكم ✅');
