/* ═══ خطوةُ البناء (V31.0) — المصدرُ في src/ والملفُّ المنشورُ index.html يُجمَّع منه ═══
   التطبيقُ ملفٌّ واحدٌ عند النشر (لا شبكةَ ثانيةً ولا تغييرَ في الخادم ولا في العامل)، لكنه يُكتَب في عشرة ملفات:
   رأسُ الصفحة بالأنماط، وثمانيةُ أجزاءٍ من الشيفرة بترتيبها الأصلي بايتًا ببايت، وذيلُ الصفحة.
   القاعدة: يُعدَّل src/ لا index.html — وجردُ audit-build يرفض أيَّ فرقٍ بينهما.
     node scripts/build.mjs            يبني index.html
     node scripts/build.mjs --check    يتحقّق أن index.html هو ناتجُ src/ (لا يكتب) */
import { readFileSync, writeFileSync } from 'fs';
import { srcFiles } from './lib/src.mjs';
/* (V38.28) المجلّداتُ بالمجال — الترتيبُ بالمسار الكامل، والناتجُ بايتًا ببايت كما كان */
const FILES = srcFiles();
/* (V38.39) core + chunks: index.html (core, deferred tag) + app-office.js (office · ministry · reports). Deterministic,
   so `--check` rebuilds both and compares. The comment stripping of V38.33 applies to both parts. */
const { buildParts, CHUNK_FILE } = await import('./lib/src.mjs');
const parts = await buildParts('src', { ship: true });   /* (V38.89) the shipped files minified — see lib/src.mjs */
const out = parts.index;
if (process.argv.includes('--check')){
  const cur = readFileSync('index.html', 'utf8'), curChunk = (() => { try { return readFileSync(CHUNK_FILE, 'utf8'); } catch (e){ return ''; } })();
  if (cur !== out || curChunk !== parts.chunk){ console.log('✗ index.html / ' + CHUNK_FILE + ' ليسا ناتجَ src/ — عدِّل src/ ثم node scripts/build.mjs'); process.exit(1); }
  console.log('✓ index.html + ' + CHUNK_FILE + ' = build(src/) —', FILES.length, 'ملفات'); process.exit(0);
}
writeFileSync('index.html', out); writeFileSync(CHUNK_FILE, parts.chunk);
console.log('built index.html (' + Math.round(out.length / 1024) + ' KB) + ' + CHUNK_FILE + ' (' + Math.round(parts.chunk.length / 1024) + ' KB) from', FILES.length, 'files');
