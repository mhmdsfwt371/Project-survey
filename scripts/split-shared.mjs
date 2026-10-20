/* ============================================================================
   FILE    : scripts/split-shared.mjs
   PURPOSE : (V38.38) Stage A of "core + chunks": move the definitions that the core needs out of the
             deferrable domain folders (04-office, 06-ministry, 07-reports) into src/03z-shared/, so those
             folders can later be loaded after first paint. Mechanical and reproducible: each moved
             definition is cut as a whole top-level statement (with the comment block right above it) and
             appended, in original order, to a shared file named after its origin. `--dry` only reports.
   RULES   : a definition moves when a core file outside 08-events references its name, transitively;
             a `var` whose initializer references a name that would then be defined later in build order
             is reported and NOT moved (order-sensitive).
   ========================================================================== */
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const acorn = createRequire(import.meta.url)('acorn');
const DRY = process.argv.includes('--dry');
const SRC = 'src', CHUNK = ['04-office', '06-ministry', '07-reports'], DEST = '03z-shared';
const files = []; (function walk(d){ for (const f of fs.readdirSync(d).sort()){ const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(path.relative(SRC, p).split(path.sep).join('/')); } })(SRC);
files.sort();
const text = {}, defs = {}, stmts = {};   // defs: name -> {file, idx}; stmts: file -> [{start,end,names,kind}]
for (const f of files){
  const s = fs.readFileSync(path.join(SRC, f), 'utf8'); text[f] = s;
  const cm = []; const ast = acorn.parse(s, { ecmaVersion:2020, sourceType:'script', onComment:cm });
  stmts[f] = ast.body.map((n, i) => {
    const names = n.type === 'FunctionDeclaration' ? [n.id.name] : n.type === 'VariableDeclaration' ? n.declarations.filter(d => d.id.type === 'Identifier').map(d => d.id.name) : [];
    // pull the comment block that sits directly above (only whitespace between)
    let start = n.start; const above = cm.filter(c => c.start > 0 && c.end <= n.start && /^\s*$/.test(s.slice(c.end, n.start))).sort((a, b) => a.start - b.start);   /* never the file header at offset 0 */
    if (above.length) start = above[0].start;
    names.forEach(nm => { if (!defs[nm]) defs[nm] = { file:f, idx:i }; });
    return { start, end:n.end, names, kind:n.type, node:n };
  });
}
const isChunk = f => CHUNK.some(c => f.startsWith(c));
const chunkNames = new Set(Object.keys(defs).filter(n => isChunk(defs[n].file)));
const ident = /[A-Za-z_$][\w$]*/g;
const need = new Set();
/* (pass B) 08-events counts too — render0 and the boot run before any click — except the delegated click handlers
   themselves (clickA*, onDocClick*), whose chunk references are replayed by nskClick when the chunk lands */
const PASS = process.env.SPLIT_PASS || 'b';
for (const f of files){ if (isChunk(f)) continue;
  let body = text[f];
  if (f.startsWith('08-events')) body = stmts[f].filter(st => !(st.kind === 'FunctionDeclaration' && /^(clickA|onDocClick)/.test(st.names[0]))).map(st => text[f].slice(st.start, st.end)).join('\n');
  for (const n of new Set(body.match(ident) || [])) if (chunkNames.has(n)) need.add(n); }
const bodyOf = n => { const d = defs[n], st = stmts[d.file][d.idx]; return text[d.file].slice(st.start, st.end); };
/* a definition marked CHUNK-ONLY stays in its chunk by decision (the core guards its use with typeof) */
const chunkOnly = n => /CHUNK-ONLY/.test(bodyOf(n)) || /CHUNK-ONLY/.test(text[defs[n].file].slice(stmts[defs[n].file][defs[n].idx].end, stmts[defs[n].file][defs[n].idx].end + 40));
for (const n of [...need]) if (chunkOnly(n)) need.delete(n);
let grew = true; while (grew){ grew = false; for (const n of [...need]) for (const m of new Set(bodyOf(n).match(ident) || [])) if (chunkNames.has(m) && !need.has(m) && !chunkOnly(m)){ need.add(m); grew = true; } }
/* order check for vars: names referenced by the initializer that are defined in files after DEST and are vars (functions hoist) */
const order = f => files.indexOf(f);
const destOrder = files.findIndex(f => f > DEST + '/') === -1 ? files.length : files.findIndex(f => f.localeCompare(DEST + '/') > 0);
const lateVar = new Set(Object.keys(defs).filter(n => stmts[defs[n].file][defs[n].idx].kind === 'VariableDeclaration'));
const skipped = [];
for (const n of [...need]){
  const d = defs[n], st = stmts[d.file][d.idx]; if (st.kind !== 'VariableDeclaration') continue;
  const init = text[d.file].slice(st.node.start, st.node.end);
  const refs = new Set(init.match(ident) || []); refs.delete(n);
  const late = [...refs].filter(m => lateVar.has(m) && !need.has(m) && order(defs[m].file) >= destOrder);
  if (late.length){ skipped.push(n + ' ← ' + late.slice(0, 4).join(',')); need.delete(n); }
}
/* group moved statements by origin file, keep original order */
const byFile = {}; let bytes = 0;
for (const n of need){ const d = defs[n]; (byFile[d.file] = byFile[d.file] || new Set()).add(d.idx); }
const report = [];
for (const f of Object.keys(byFile).sort()){ const idxs = [...byFile[f]].sort((a, b) => a - b); const b = idxs.reduce((a, i) => a + (stmts[f][i].end - stmts[f][i].start), 0); bytes += b; report.push(f + ': ' + idxs.length + ' defs, ' + Math.round(b / 1024) + ' KB'); }
console.log('shared closure:', need.size, 'definitions =', Math.round(bytes / 1024) + ' KB'); console.log(report.join('\n'));
if (skipped.length) console.log('kept in place (order-sensitive vars):', skipped.length, '\n  ' + skipped.join('\n  '));
if (DRY) process.exit(0);
fs.mkdirSync(path.join(SRC, DEST), { recursive:true });
let seq = 0;
for (const f of Object.keys(byFile).sort()){
  const idxs = [...byFile[f]].sort((a, b) => a - b); const s = text[f];
  const moved = idxs.map(i => s.slice(stmts[f][i].start, stmts[f][i].end));
  let out = '', last = 0; for (const i of idxs){ out += s.slice(last, stmts[f][i].start); last = stmts[f][i].end; } out += s.slice(last);
  out = out.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(SRC, f), out);
  seq++; const base = path.basename(f, '.js').replace(/^\d\d-/, '');
  const dest = path.join(SRC, DEST, `03z-shared-${PASS}-${String(seq).padStart(2, '0')}-from-${base}.js`);
  const header = `/* ${'='.repeat(76)}\n   FILE    : src/${DEST}/${path.basename(dest)}\n   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load\n   PURPOSE : Definitions moved verbatim from src/${f} (V38.38–V38.39, stage A of core + chunks, pass ${PASS}): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.\n   DEFINES : ${idxs.flatMap(i => stmts[f][i].names).slice(0, 14).join(', ')}${idxs.flatMap(i => stmts[f][i].names).length > 14 ? ' … (+' + (idxs.flatMap(i => stmts[f][i].names).length - 14) + ' more)' : ''}\n   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.\n   ${'='.repeat(76)} */\n`;
  fs.writeFileSync(dest, header + moved.join('\n\n') + '\n');
}
console.log('moved into src/' + DEST + '/ — ' + seq + ' files');
