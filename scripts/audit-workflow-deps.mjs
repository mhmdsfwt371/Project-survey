/* (V38.77) Every workflow job installs the packages its scripts load at start-up.
   From V38.39 the Ministry snapshot (ministry.yml) and the system report (report.yml) built the app through
   lib/strip.mjs, which loads «acorn» — a package those jobs never installed (it came only through eslint in the
   gate). Every scheduled run failed with a red e-mail and no Ministry files. This check reads each job's
   «npm i …» lines and the scripts it runs, follows the scripts' local imports, and fails when a package that is
   loaded at start-up (a static import, or a top-level require) is not installed by that job. */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { builtinModules } from 'module';
const BUILTIN = new Set(builtinModules.flatMap(m => [m, 'node:' + m]));
const pkgOf = s => s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0];
const memo = new Map();
function needs(file, seen = new Set()){
  file = resolve(file); if (seen.has(file) || !existsSync(file)) return new Set(); seen.add(file);
  const src = readFileSync(file, 'utf8'), out = new Set();
  const add = spec => {
    if (spec.startsWith('.')) needs(join(dirname(file), spec), seen).forEach(p => out.add(p));
    else if (!BUILTIN.has(spec) && !BUILTIN.has(pkgOf(spec))) out.add(pkgOf(spec));
  };
  for (const m of src.matchAll(/^\s*import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm)) add(m[1]);
  for (const m of src.matchAll(/^(?:const|let|var)\s+[^=\n]+=\s*(?:createRequire\([^)]*\)\(|require\()\s*['"]([^'"]+)['"]\s*\)/gm)) add(m[1]);
  /* a local module loaded later (await import('./lib/strip.mjs') inside appHtml) is still loaded on every run —
     follow it; a package loaded that way is usually optional (inside try), so only local paths are followed */
  for (const m of src.matchAll(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g)) add(m[1]);
  return out;
}
const jobsOf = text => {
  const L = text.split('\n'), i0 = L.findIndex(l => /^jobs:\s*$/.test(l)); if (i0 < 0) return [];
  const out = []; let cur = null;
  for (let i = i0 + 1; i < L.length; i++){
    const m = /^  ([\w-]+):\s*$/.exec(L[i]);
    if (m){ cur = { name:m[1], body:[] }; out.push(cur); } else if (cur) cur.body.push(L[i]);
  }
  return out.map(j => ({ name:j.name, body:j.body.join('\n') }));
};
let fails = 0, jobsSeen = 0, scriptsSeen = 0;
for (const wf of readdirSync('.github/workflows').filter(f => f.endsWith('.yml'))){
  for (const job of jobsOf(readFileSync('.github/workflows/' + wf, 'utf8'))){
    const installed = new Set();
    for (const m of job.body.matchAll(/npm (?:i|install)\b([^\n&|;]*)/g))
      m[1].trim().split(/\s+/).filter(t => t && !t.startsWith('-')).forEach(t => installed.add(pkgOf(t.replace(/(.)@[^@/]*$/, '$1'))));
    const scripts = [...new Set([...job.body.matchAll(/node\s+(scripts\/[\w.\-\/]+\.mjs)/g)].map(m => m[1]))];
    if (!scripts.length) continue; jobsSeen++;
    for (const s of scripts){
      scriptsSeen++;
      const miss = [...needs(s)].filter(p => !installed.has(p));
      if (miss.length){ fails++; console.log('  ✗ ' + wf + ' › ' + job.name + ' › ' + s + ' يحتاج عند تشغيله: ' + miss.join('، ') + ' — ولا يُثبَّت في هذا السير'); }
    }
  }
}
console.log((fails ? '✗ ' : '✓ ') + 'حزمُ السيور: ' + scriptsSeen + ' سكربتًا في ' + jobsSeen + ' سيرًا' + (fails ? ' — ' + fails + ' ناقص' : ' — كلُّ ما يُحمَّل عند التشغيل مُثبَّت'));
process.exit(fails ? 1 : 0);
