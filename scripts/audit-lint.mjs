/* ═══ فاحصُ النحو — الشيفرةُ المبنيّةُ تُفحَص بقواعدَ قليلةٍ حاسمة (V31.1) ═══
   يُستخرَج النصُّ من index.html إلى index.html.js مؤقتًا ويُفحَص؛ خطأٌ واحدٌ يسقط. */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { ESLint } from 'eslint';
const s = readFileSync('index.html', 'utf8'); const js = s.slice(s.indexOf('<script>') + 8, s.lastIndexOf('</script>'));
writeFileSync('index.html.js', js);
const eslint = new ESLint({ overrideConfigFile:'eslint.config.mjs' });
const res = await eslint.lintFiles(['index.html.js']); unlinkSync('index.html.js');
const msgs = res[0] ? res[0].messages : []; const errs = msgs.filter(m => m.severity === 2), warns = msgs.filter(m => m.severity === 1);
errs.slice(0, 20).forEach(m => console.log('  ✗', m.ruleId, 'سطر', m.line, '—', m.message));
console.log((errs.length ? '✗' : '✓') + ' فاحصُ النحو: ' + errs.length + ' خطأ · ' + warns.length + ' تحذير');
process.exit(errs.length ? 1 : 0);
