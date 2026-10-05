/* ═══ جردُ صحة الكود — «لا تراجع» (الوحدة ١ من خطة التسليم) ═══
   يقيس الشيفرةَ المبنيّةَ كلَّ دفعةٍ ويقارنها بخطِّ الأساس في docs/health-baseline.json: لا مقياسَ يسوء.
   المقاييس: المتغيراتُ العامة، والدوالُّ الطويلة (>١٥٠ و>٣٠٠ سطر)، وأخطاءُ النحو (صفرٌ دائمًا) وتحذيراتُه، وأكبرُ ملفِّ مصدر.
   إن تحسّن مقياسٌ يُقال ذلك: يُثبَّت الخطُّ الجديدُ بـ node scripts/health-update.mjs (فلا يعود أحدٌ إلى الأسوأ).
   وفي السحابة: عنوانُ الالتزام على فرع التجربة بصيغة «Vس.ص — …» (تعريفُ المنجز §٥). */
import { readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { ESLint } from 'eslint';
import { createRequire } from 'module';
/* espree يأتي مع eslint نفسِه (لا تثبيتَ زائد) — يُحلّ من موضع eslint */
const espree = createRequire(createRequire(import.meta.url).resolve('eslint'))('espree');
export async function measure(){
  const s = readFileSync('index.html', 'utf8'), js = s.slice(s.indexOf('<script>') + 8, s.lastIndexOf('</script>'));
  const ast = espree.parse(js, { ecmaVersion:2020, sourceType:'script', loc:true });
  let globals = 0; const lens = [];
  for (const n of ast.body){ if (n.type === 'VariableDeclaration') globals += n.declarations.length; if (n.type === 'FunctionDeclaration') lens.push([n.id.name, n.loc.end.line - n.loc.start.line + 1]); }
  lens.sort((a, b) => b[1] - a[1]);
  writeFileSync('index.html.js', js); const eslint = new ESLint(); const res = await eslint.lintFiles(['index.html.js']); unlinkSync('index.html.js');
  const msgs = res[0] ? res[0].messages : [];
  const src = readdirSync('src').filter(f => /\.js$/.test(f)).map(f => [f, Math.round(statSync('src/' + f).size / 1024)]).sort((a, b) => b[1] - a[1]);
  return { m:{ globals, over300:lens.filter(x => x[1] > 300).length, over150:lens.filter(x => x[1] > 150).length, lintErrors:msgs.filter(x => x.severity === 2).length, lintWarnings:msgs.filter(x => x.severity === 1).length, maxSrcKB:src[0][1] },
           info:{ functions:lens.length, totalKB:Math.round(Buffer.byteLength(s) / 1024), longest:lens.slice(0, 5), biggestSrc:src.slice(0, 3) } };
}
if (import.meta.url === 'file://' + process.argv[1]){
  const B = JSON.parse(readFileSync('docs/health-baseline.json', 'utf8')), { m, info } = await measure();
  const fails = [], better = [];
  if (m.lintErrors) fails.push('أخطاءُ النحو ' + m.lintErrors + ' (يجب صفر)');
  /* (V31.5) بوابةُ البيانات: لا حديثَ مع القاعدة إلا من DB — FB.db.collection/batch خارجها تراجعٌ معماريّ */
  { const srcAll = readdirSync('src').filter(f => /\.js$/.test(f)).map(f => readFileSync('src/' + f, 'utf8').split('\n').map((l, i) => [f, i + 1, l])).flat();
    const raw = srcAll.filter(([f, n, l]) => /FB\.db\.(collection|batch|runTransaction|doc)\(/.test(l) && !/^\s*(col|doc|batch):\s+function/.test(l) && !/^\s*(\/\*|\*|\/\/)/.test(l.trim()) && !/—/.test(l.split('FB.db')[0].slice(-3)));
    if (raw.length) fails.push('وصولٌ مباشرٌ للقاعدة خارج بوابة البيانات (DB): ' + raw.slice(0, 3).map(r => r[0] + ':' + r[1]).join(' · ')); }
  Object.keys(B.m).forEach(k => { if (k === 'lintErrors') return; if (m[k] > B.m[k]) fails.push(`${k}: ${m[k]} > خطّ الأساس ${B.m[k]}`); else if (m[k] < B.m[k]) better.push(`${k}: ${B.m[k]} ← ${m[k]}`); });
  if (m.maxSrcKB > (B.capSrcKB || 520)) fails.push(`أكبرُ ملفِّ مصدر ${m.maxSrcKB} ك.ب فوق السقف ${B.capSrcKB || 520}`);
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REF === 'refs/heads/staging'){
    const subj = execSync('git log -1 --format=%s').toString().trim();
    if (!/^V\d+\.\d+ — .{8,}/.test(subj)) fails.push('عنوانُ الالتزام ليس بصيغة «Vس.ص — …»: ' + subj.slice(0, 80));
  }
  console.log('صحةُ الكود:', JSON.stringify(m), '|', JSON.stringify(info));
  better.forEach(b => console.log('  ↑ تحسّن ' + b + ' — ثبّته: node scripts/health-update.mjs'));
  fails.forEach(f => console.log('  ✗ ' + f));
  console.log(fails.length ? '✗ جردُ الصحة: تراجع' : '✓ جردُ الصحة: لا تراجع');
  process.exit(fails.length ? 1 : 0);
}
