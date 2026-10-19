/* ═══ (V38.28) مصدرٌ واحدٌ لقائمة ملفات src/ — المجلّداتُ بالمجال، والترتيبُ بالمسار الكامل ═══
   كان المصدرُ سبعةَ عشرَ ملفًّا مسطّحةً أكبرُها ٥٨٠٠ سطر؛ صار ٩٤ ملفًّا في ثمانية مجلّداتٍ بمجالها (نواة · كتالوج · مسح ·
   مكتب · خريطة · وزارة · تقارير · أحداث)، بلا تغييرٍ في بايتٍ واحدٍ من ناتج البناء. الترتيبُ هو ترتيبُ المسار الكامل
   (00-shell/00-head.html … 99-shell/99-tail.html)، وكلُّ أداةٍ تقرأ المصدرَ تمرّ من هنا لا من readdirSync('src'). */
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
export function srcFiles(root = 'src'){
  const out = [];
  (function walk(d){ for (const f of readdirSync(d).sort()){ const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(html|js)$/.test(f)) out.push(relative(root, p).split('\\').join('/')); } })(root);
  return out.sort();
}
export function srcPaths(root = 'src'){ return srcFiles(root).map(f => root + '/' + f); }
export function srcJs(root = 'src'){ return srcPaths(root).filter(f => f.endsWith('.js')); }
export function srcConcat(root = 'src'){ return srcPaths(root).map(f => readFileSync(f, 'utf8')).join(''); }
export function srcFind(re, root = 'src'){ return srcPaths(root).find(f => re.test(readFileSync(f, 'utf8'))); }
