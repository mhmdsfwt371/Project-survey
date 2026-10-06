/* ═══ رفعُ النسخة بأمرٍ واحد (V33.0 — حزمةُ التسليم) ═══
   رقمُ النسخة يعيش في ستة أماكن والحارسُ يرفض أيَّ اختلاف: رأسُ الصفحة، وملاحظاتُ «ما الجديد»، وعاملُ الخدمة، والمخطط،
   ووثيقةُ النظام (ونسختُها Word)، ودليلُ المستخدم. كان رفعُها خطواتٍ يدويةً تُنسى إحداها — صار أمرًا واحدًا:

     node scripts/bump.mjs V33.1 --date "٧ أكتوبر ٢٠٢٦" \
       --note "سطرٌ لما الجديد بلغة المستخدم" [--note "سطرٌ ثانٍ"] \
       --api "وصفٌ تقنيٌّ للمخطط" --row "سطرُ وثيقة النظام"

   ثم يعيد توليدَ أدلة الأدوار وبصمةَ القاموس ويبني index.html. لا يلتزم ولا يدفع. */
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const JSZip = require('jszip');

const args = process.argv.slice(2), NEW = args[0];
const opt = k => { const out = []; args.forEach((a, i) => { if (a === k && args[i + 1] != null) out.push(args[i + 1]); }); return out; };
const notes = opt('--note'), api = opt('--api')[0], row = opt('--row')[0], date = opt('--date')[0];
const die = m => { console.error('✗ ' + m); process.exit(1); };
if (!/^V\d+\.\d+$/.test(NEW || '')) die('الاستعمال: node scripts/bump.mjs V33.1 --date "…" --note "…" --api "…" --row "…"');
if (!notes.length || !api || !row || !date) die('الملاحظةُ والمخططُ وسطرُ الوثيقة والتاريخُ كلُّها مطلوبة — لا نسخةَ بلا وصف');

const head = readFileSync('src/00-head.html', 'utf8'), OLD = (head.match(/نسخة (V\d+\.\d+)/) || [])[1];
if (!OLD) die('لم أجد رقمَ النسخة في src/00-head.html');
if (OLD === NEW) die('النسخةُ ' + NEW + ' هي الحالية');
const one = (file, a, b) => { const s = readFileSync(file, 'utf8'), n = s.split(a).length - 1; if (n !== 1) die(file + ': «' + a.slice(0, 50) + '» ' + n + ' مرة (المتوقع ١)'); writeFileSync(file, s.replace(a, b)); };
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const ver = v => v.slice(1);

one('src/00-head.html', 'نسخة ' + OLD, 'نسخة ' + NEW);
one('src/06-ministry-alerts.js', "  { v:'" + OLD + "', ", "  { v:'" + NEW + "', d:" + q(date) + ", notes:[\n" + notes.map(n => '      ' + q(n)).join(',\n') + ' ] },\n' + "  { v:'" + OLD + "', ");
one('sw.js', "const CACHE = 'nusuk-survey-v" + ver(OLD) + "';", "const CACHE = 'nusuk-survey-v" + ver(NEW) + "';");
{ let a = readFileSync('docs/api-schema.json', 'utf8');
  if (a.split('"app_version": "' + OLD + '"').length !== 2) die('docs/api-schema.json: app_version ليس ' + OLD);
  a = a.replace('"app_version": "' + OLD + '"', '"app_version": "' + NEW + '"');
  const k = a.indexOf('  "' + OLD + '": "'); if (k < 0) die('docs/api-schema.json: لا مدخلَ ' + OLD);
  const e = a.indexOf('"\n', k + 12) + 1;
  a = a.slice(0, e) + ',\n  "' + NEW + '": ' + JSON.stringify(api) + a.slice(e); JSON.parse(a); writeFileSync('docs/api-schema.json', a); }
one('docs/system.md', '> آخر تحديث لهذا الملف مع النسخة `' + OLD + '`', '> آخر تحديث لهذا الملف مع النسخة `' + NEW + '`');
one('docs/system.md', '| **' + OLD + '** |', '| **' + NEW + '** | ' + row + ' |\n| **' + OLD + '** |');
one('docs/product.md', 'آخر تحديث مع `' + OLD + '`', 'آخر تحديث مع `' + NEW + '`');

const docxSwap = async (src, dst) => {
  const z = await JSZip.loadAsync(readFileSync(src)), x = await z.file('word/document.xml').async('string');
  if (x.split(OLD).length !== 2) die(src + ': ' + OLD + ' ' + (x.split(OLD).length - 1) + ' مرة (المتوقع ١)');
  z.file('word/document.xml', x.replace(OLD, NEW));
  writeFileSync(dst, await z.generateAsync({ type:'nodebuffer', compression:'DEFLATE' }));
  if (src !== dst) unlinkSync(src);
};
const sysDocx = readdirSync('docs').filter(f => /^nusuk-system-V[\d.]+\.docx$/.test(f));
if (sysDocx.length !== 1) die('docs/: المتوقع ملفُّ وثيقة نظامٍ واحد، وُجد ' + sysDocx.length);
await docxSwap('docs/' + sysDocx[0], 'docs/nusuk-system-' + NEW + '.docx');
if (existsSync('docs/nusuk-user-manual.docx')) await docxSwap('docs/nusuk-user-manual.docx', 'docs/nusuk-user-manual.docx');

const run = c => execSync(c, { stdio:'pipe' }).toString().trim().split('\n').pop();
run('node scripts/build.mjs'); run('node scripts/role-manuals.mjs'); run('node scripts/i18n-rehash.mjs');
console.log(run('node scripts/build.mjs'));
console.log('✓ ' + OLD + ' → ' + NEW + ' في الأماكن الستة — شغّل الآن: node scripts/fast-run.mjs');
