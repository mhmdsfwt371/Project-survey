/* ═══ خطوةُ البناء (V31.0) — المصدرُ في src/ والملفُّ المنشورُ index.html يُجمَّع منه ═══
   التطبيقُ ملفٌّ واحدٌ عند النشر (لا شبكةَ ثانيةً ولا تغييرَ في الخادم ولا في العامل)، لكنه يُكتَب في عشرة ملفات:
   رأسُ الصفحة بالأنماط، وثمانيةُ أجزاءٍ من الشيفرة بترتيبها الأصلي بايتًا ببايت، وذيلُ الصفحة.
   القاعدة: يُعدَّل src/ لا index.html — وجردُ audit-build يرفض أيَّ فرقٍ بينهما.
     node scripts/build.mjs            يبني index.html
     node scripts/build.mjs --check    يتحقّق أن index.html هو ناتجُ src/ (لا يكتب) */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
const FILES = readdirSync('src').filter(f => /^\d\d-.*\.(html|js)$/.test(f)).sort();
const out = FILES.map(f => readFileSync('src/' + f, 'utf8')).join('');
if (process.argv.includes('--check')){
  const cur = readFileSync('index.html', 'utf8');
  if (cur !== out){ console.log('✗ index.html ليس ناتجَ src/ — عدِّل src/ ثم node scripts/build.mjs'); process.exit(1); }
  console.log('✓ index.html = build(src/) —', FILES.length, 'ملفات'); process.exit(0);
}
writeFileSync('index.html', out); console.log('built index.html from', FILES.length, 'files —', Math.round(out.length / 1024), 'KB');
