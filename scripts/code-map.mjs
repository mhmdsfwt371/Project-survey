/* ═══ (V38.28) خريطةُ الكود — تُولَّد من المصدر لا تُكتَب بيد ═══
   node scripts/code-map.mjs           يكتب docs/code-map.md
   node scripts/code-map.mjs --check   يتحقّق أن الوثيقةَ مطابقةٌ للمصدر، وأن لا ملفَّ مصدرٍ فوق سقف الأسطر
   لكلِّ مجلّدٍ (مجال) ولكلِّ ملفٍّ فيه: الأسطرُ، والدوالُّ، وأوّلُ عنوانٍ فيه — فيعرف المطوّرُ الجديدُ أين يبحث قبل أن يفتح شيئًا. */
import { readFileSync, writeFileSync } from 'fs';
import { srcFiles } from './lib/src.mjs';
const CAP = 1500;
const DOMAIN = { '00-shell':'الهيكل — رأسُ الصفحة والأنماط', '01-core':'النواة — اللغة والمحرك والمزامنة والسجل', '02-catalog':'الكتالوج والنقطة — التعريفات والتصنيف والصلاحيات وتعديل المسح',
  '03-survey':'المسح والتركيب — النماذج والنقاط والإسناد والخطة', '03z-shared':'المشتركُ — تعريفاتٌ تحتاجها النواةُ قبل مجالات المكتب والوزارة والتقارير (نُقلت حرفيًّا، لا كودَ جديدًا هنا)', '04-office':'المكتب — الصور والحوكمة والمساعد والتقارير بالكلام والرسم على الخريطة',
  '05-map':'الخريطة ودورةُ الحياة — الطبقات والتصدير والاستيراد والدخول وشاشةُ الوزارة', '06-ministry':'متابعةُ الوزارة — التنبيهات والتقارير ونظامُ البطاقات وما الجديد',
  '07-reports':'الاعتمادُ والتقارير — المخزن والورشة والأجهزة والإشعارات والأدوار', '08-events':'البياناتُ والأحداث — الإعدادات والمستخدمون والنقرات والإقلاع', '99-shell':'الهيكل — ذيلُ الصفحة' };
const files = srcFiles(), rows = {}, over = [], noHead = [];
for (const f of files){
  const s = readFileSync('src/' + f, 'utf8'), lines = s.split('\n').length, fns = (s.match(/^function \w+\(/mg) || []).length;
  const pm = s.match(/\n   PURPOSE : ([^\n]+)/);
  const head = (pm ? pm[1] : (s.split('\n').find(l => /^\/\* ═══/.test(l)) || s.split('\n').find(l => /^\/\*/.test(l)) || '').replace(/^\/\*\s*═*\s*/, '').replace(/\s*═*\s*\*\/\s*$/, '')).replace(/\s+/g, ' ').slice(0, 160);
  const [dir, name] = f.includes('/') ? f.split('/') : ['.', f];
  (rows[dir] = rows[dir] || []).push({ name, lines, fns, head });
  if (lines > CAP) over.push(f + ' (' + lines + ')');
  /* (V38.32) every JS file opens with the English header (FILE / DOMAIN / PURPOSE / DEFINES) — the team's map */
  if (f.endsWith('.js') && !(/^\/\* =+\n   FILE    : src\//.test(s) && /\n   PURPOSE : \S/.test(s))) noHead.push(f);
}
const L = ['# خريطةُ الكود — تُولَّد آليًّا (node scripts/code-map.mjs)', '', 'المصدرُ في `src/` مجلّداتٌ بالمجال، تُجمَّع بترتيب المسار الكامل إلى `index.html` (ملفٌّ واحدٌ عند النشر ليعمل بلا شبكة). سقفُ الملف **' + CAP + ' سطر** — البوابةُ تقع فوقه.', ''];
let tot = 0, totF = 0;
for (const dir of Object.keys(rows).sort()){
  const R = rows[dir], ls = R.reduce((a, r) => a + r.lines, 0), fs = R.reduce((a, r) => a + r.fns, 0); tot += ls; totF += fs;
  L.push('## `' + dir + '/` — ' + (DOMAIN[dir] || '') + '  (' + R.length + ' ملفات · ' + ls + ' سطر · ' + fs + ' دالة)', '', '| الملف | الأسطر | الدوال | الغرض (PURPOSE) |', '|---|---:|---:|---|');
  R.forEach(r => L.push('| `' + r.name + '` | ' + r.lines + ' | ' + r.fns + ' | ' + r.head.replace(/\|/g, '/') + ' |'));
  L.push('');
}
L.push('**الإجمالي:** ' + files.length + ' ملفًّا · ' + tot + ' سطر · ' + totF + ' دالة.', '');
const md = L.join('\n');
if (process.argv.includes('--check')){
  let bad = 0;
  if (over.length){ console.log('✗ ملفاتٌ فوق سقف ' + CAP + ' سطر: ' + over.join(' · ')); bad++; }
  if (noHead.length){ console.log('✗ ملفاتٌ بلا الرأس الإنجليزيّ (FILE/DOMAIN/PURPOSE): ' + noHead.join(' · ')); bad++; }
  const cur = (() => { try { return readFileSync('docs/code-map.md', 'utf8'); } catch { return ''; } })();
  if (cur !== md){ console.log('✗ docs/code-map.md ليست مطابقةً للمصدر — شغّل node scripts/code-map.mjs'); bad++; }
  if (bad) process.exit(1);
  console.log('✓ خريطةُ الكود مطابقة — ' + files.length + ' ملفًّا، أكبرُها دون ' + CAP + ' سطر');
} else { writeFileSync('docs/code-map.md', md); console.log('wrote docs/code-map.md — ' + files.length + ' files'); }
