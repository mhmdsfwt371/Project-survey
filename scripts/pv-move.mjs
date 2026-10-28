/* (V39.84) kept for the next batches: move file-private top-level `var`s onto one namespace object PV, by scope analysis — not by text.
   A name qualifies only if: declared at top level in exactly one src file, never referenced by any other src file,
   never named in scripts/*.mjs (audits read names), never inside a string in its own file (inline handlers),
   and every reference in its file resolves to that top-level binding (eslint-scope). */
import { readFileSync, writeFileSync } from 'fs';

import * as espree from 'espree';
import * as escope from 'eslint-scope';
import { execSync } from 'child_process';
const files = execSync("find src -name '*.js' | sort").toString().trim().split('\n');
const idr = /[A-Za-z_$][\w$]*/g;
const src = Object.fromEntries(files.map(f => [f, readFileSync(f, 'utf8')]));
const toks = Object.fromEntries(files.map(f => [f, new Set(src[f].match(idr) || [])]));
const tests = new Set(); for (const f of execSync("ls scripts/*.mjs").toString().trim().split('\n')) (readFileSync(f, 'utf8').match(idr) || []).forEach(x => tests.add(x));
const strTok = f => { const s = new Set(); for (const m of src[f].matchAll(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g)) (m[0].match(idr) || []).forEach(x => s.add(x)); return s; };
const decl = {};
const parsed = {};
for (const f of files){
  let ast; try { ast = espree.parse(src[f], { ecmaVersion:2022, sourceType:'script', range:true }); } catch (e){ continue; }
  parsed[f] = ast;
  for (const n of ast.body) if (n.type === 'VariableDeclaration' && n.kind === 'var') for (const d of n.declarations) if (d.id.type === 'Identifier') (decl[d.id.name] = decl[d.id.name] || new Set()).add(f);
}
const fnNames = new Set(); for (const f of files){ const a = parsed[f]; if (a) for (const n of a.body) if (n.type === 'FunctionDeclaration') fnNames.add(n.id.name); }
const pick = {};
for (const [name, fs] of Object.entries(decl)){
  if (fs.size !== 1 || fnNames.has(name) || name === 'PV') continue;
  const f = [...fs][0];
  if (files.some(g => g !== f && toks[g].has(name)) || tests.has(name) || strTok(f).has(name)) continue;
  (pick[f] = pick[f] || []).push(name);
}
const DRY = process.argv.includes('--dry');
let moved = 0, filesTouched = 0;
for (const [f, names] of Object.entries(pick)){
  const ast = parsed[f], sm = escope.analyze(ast, { ecmaVersion:2022, sourceType:'script' }), g = sm.globalScope;
  const ok = names.filter(n => { const v = g.set.get(n); return v && v.defs.every(d => d.parent && ast.body.includes(d.parent)); });
  if (!ok.length) continue;
  const edits = [];   // [start, end, text]
  for (const n of ok){
    const v = g.set.get(n);
    /* globals in a script are left unresolved by eslint-scope: every use (nested ones too) sits in globalScope.through;
       a shadowing local would have resolved in its own scope and never appear there */
    const seen = new Set();
    for (const r of v.references.concat(g.through.filter(r => r.identifier.name === n))){ const id = r.identifier; const k = id.range[0]; if (seen.has(k)) continue; seen.add(k); edits.push([id.range[0], id.range[1], 'PV.' + n]); }
  }
  /* declarations: `var a = 1, b, c = 2;` → private ones become `PV.a = 1;` (no initialiser → `PV.b = PV.b;` keeps «exists, undefined») */
  for (const n of ast.body){
    if (n.type !== 'VariableDeclaration' || n.kind !== 'var') continue;
    const mine = n.declarations.filter(d => d.id.type === 'Identifier' && ok.includes(d.id.name));
    if (!mine.length) continue;
    const keep = n.declarations.filter(d => !mine.includes(d));
    const txt = d => src[f].slice(d.range[0], d.range[1]);
    const parts = n.declarations.map(d => mine.includes(d)
      ? { pv:true, s:'PV.' + d.id.name + ' = ' + (d.init ? src[f].slice(d.init.range[0], d.init.range[1]) : 'undefined') + ';' }
      : { pv:false, s:txt(d) });
    /* rebuild in order: runs of kept declarators stay one `var`, private ones become assignments — evaluation order kept */
    let out = [], run = [];
    for (const p of parts){ if (p.pv){ if (run.length){ out.push('var ' + run.join(', ') + ';'); run = []; } out.push(p.s); } else run.push(p.s); }
    if (run.length) out.push('var ' + run.join(', ') + ';');
    /* drop reference edits that fall inside this declaration (the identifiers are rebuilt above), then replace the statement */
    for (let i = edits.length - 1; i >= 0; i--) if (edits[i][0] >= n.range[0] && edits[i][1] <= n.range[1]) edits.splice(i, 1);
    /* references inside initialisers of this statement still need PV. — redo them on the init text */
    const fix = s => { for (const m of ok) s = s.replace(new RegExp('(?<![\\w$.])' + m.replace(/\$/g, '\\$') + '(?![\\w$:])', 'g'), 'PV.' + m); return s; };
    edits.push([n.range[0], n.range[1], out.map(x => x.startsWith('PV.') ? x.replace(/= ([\s\S]*);$/, (a, b) => '= ' + fix(b) + ';') : x).join(' ')]);
  }
  edits.sort((a, b) => b[0] - a[0]);
  let s = src[f]; for (const [a, b, t] of edits) s = s.slice(0, a) + t + s.slice(b);
  if (!DRY) writeFileSync(f, s);
  moved += ok.length; filesTouched++;
}
console.log((DRY ? '[dry] ' : '') + 'moved', moved, 'vars in', filesTouched, 'files');
