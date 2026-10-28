/* (V39.84 · V39.87) move top-level state variables onto one namespace object PV — by scope analysis, never by text.
   A name moves only if: declared by one top-level `var` in exactly one src file; never a function name; never named by any
   scripts/*.mjs (audits read names); never inside any string literal in src (inline handlers, templates); and — when it is
   declared in the office chunk — never used by a core file (there a missing name is a ReferenceError that the chunk-wait
   replay relies on; PV.<name> would read undefined instead). Every use in every file comes from eslint-scope: the
   declaring file's references plus each file's globalScope.through for that name (a shadowing local resolves in its own
   scope and never appears there). Shorthand properties `{ name }` become `{ name: PV.name }`.
   Usage: node scripts/pv-move.mjs [--dry] [--multi]   (without --multi: names used by one file only) */
import { readFileSync, writeFileSync } from 'fs';
import * as espree from 'espree';
import * as escope from 'eslint-scope';
import { execSync } from 'child_process';
const DRY = process.argv.includes('--dry'), MULTI = process.argv.includes('--multi');
const CHUNK_DIRS = ['03zz-late', '04-office', '06-ministry', '07-reports'];
const isChunk = f => CHUNK_DIRS.some(d => f.startsWith('src/' + d + '/'));
const files = execSync("find src -name '*.js' | sort").toString().trim().split('\n');
const idr = /[A-Za-z_$][\w$]*/g;
const src = Object.fromEntries(files.map(f => [f, readFileSync(f, 'utf8')]));
const toks = Object.fromEntries(files.map(f => [f, new Set(src[f].match(idr) || [])]));
const tests = new Set(); for (const f of execSync('ls scripts/*.mjs').toString().trim().split('\n')) (readFileSync(f, 'utf8').match(idr) || []).forEach(x => tests.add(x));
const strAll = new Set(); for (const f of files) for (const m of src[f].matchAll(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g)) (m[0].match(idr) || []).forEach(x => strAll.add(x));
/* names reached as properties of the global object (window.X, self.X …) or named in the HTML shell are left alone */
const viaGlobal = new Set(); for (const f of files) for (const m of src[f].matchAll(/\b(?:window|self|globalThis|top|parent)\s*\.\s*([A-Za-z_$][\w$]*)/g)) viaGlobal.add(m[1]);
const htmlToks = new Set(); for (const f of execSync("find src -name '*.html'").toString().trim().split('\n').filter(Boolean)) (readFileSync(f, 'utf8').match(idr) || []).forEach(x => htmlToks.add(x));
const parsed = {}, decl = {}, fnNames = new Set();
for (const f of files){
  let ast; try { ast = espree.parse(src[f], { ecmaVersion:2022, sourceType:'script', range:true }); } catch (e){ continue; }
  parsed[f] = ast;
  for (const n of ast.body){
    if (n.type === 'VariableDeclaration' && n.kind === 'var') for (const d of n.declarations) if (d.id.type === 'Identifier') (decl[d.id.name] = decl[d.id.name] || new Set()).add(f);
    if (n.type === 'FunctionDeclaration') fnNames.add(n.id.name);
  }
}
const pick = {};   // name -> { home, users[] }
for (const [name, fs] of Object.entries(decl)){
  if (fs.size !== 1 || fnNames.has(name) || name === 'PV' || tests.has(name) || strAll.has(name) || viaGlobal.has(name) || htmlToks.has(name)) continue;
  const home = [...fs][0], users = files.filter(g => g !== home && toks[g].has(name));
  if (!MULTI && users.length) continue;
  if (isChunk(home) && users.some(u => !isChunk(u))) continue;
  if (users.some(u => !parsed[u])) continue;
  pick[name] = { home, users };
}
/* shorthand `{ name }` value identifiers, by range */
const shorthand = ast => { const out = new Set(); (function walk(n){ if (!n || typeof n.type !== 'string') return;
  if (n.type === 'Property' && n.shorthand && n.value && n.value.type === 'Identifier') out.add(n.value.range[0]);
  for (const k of Object.keys(n)){ const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); } })(ast); return out; };
const byFile = {};
for (const [name, o] of Object.entries(pick)) for (const f of [o.home].concat(o.users)) (byFile[f] = byFile[f] || []).push(name);
let moved = 0, touched = 0;
for (const [f, names] of Object.entries(byFile)){
  const ast = parsed[f], sm = escope.analyze(ast, { ecmaVersion:2022, sourceType:'script' }), g = sm.globalScope, sh = shorthand(ast);
  const mineHere = names.filter(n => pick[n].home === f);
  const edits = [], seen = new Set();
  const add = (id, n) => { const k = id.range[0]; if (seen.has(k)) return; seen.add(k); edits.push([id.range[0], id.range[1], sh.has(k) ? n + ': PV.' + n : 'PV.' + n]); };
  for (const n of names){
    const v = g.set.get(n);
    for (const r of (v ? v.references : []).concat(g.through.filter(r => r.identifier.name === n))) add(r.identifier, n);
  }
  for (const n of ast.body){
    if (n.type !== 'VariableDeclaration' || n.kind !== 'var') continue;
    const mine = n.declarations.filter(d => d.id.type === 'Identifier' && mineHere.includes(d.id.name));
    if (!mine.length) continue;
    for (let i = edits.length - 1; i >= 0; i--) if (edits[i][0] >= n.range[0] && edits[i][1] <= n.range[1]) edits.splice(i, 1);
    /* initialisers keep their own (already scope-found) references: rewrite them inside each init's text */
    const initText = d => { if (!d.init) return 'undefined'; let s = src[f].slice(d.init.range[0], d.init.range[1]); const base = d.init.range[0];
      const inner = []; for (const nm of names){ const v = g.set.get(nm); for (const r of (v ? v.references : []).concat(g.through.filter(r => r.identifier.name === nm))){ const id = r.identifier; if (id.range[0] >= d.init.range[0] && id.range[1] <= d.init.range[1]) inner.push([id.range[0] - base, id.range[1] - base, sh.has(id.range[0]) ? nm + ': PV.' + nm : 'PV.' + nm]); } }
      const u = new Map(); inner.forEach(e => u.set(e[0], e)); [...u.values()].sort((a, b) => b[0] - a[0]).forEach(([a, b, t]) => { s = s.slice(0, a) + t + s.slice(b); }); return s; };
    let out = [], run = [];
    for (const d of n.declarations){
      if (mine.includes(d)){ if (run.length){ out.push('var ' + run.join(', ') + ';'); run = []; } out.push('PV.' + d.id.name + ' = ' + initText(d) + ';'); }
      else run.push(src[f].slice(d.range[0], d.range[1]));
    }
    if (run.length) out.push('var ' + run.join(', ') + ';');
    edits.push([n.range[0], n.range[1], out.join(' ')]);
  }
  edits.sort((a, b) => b[0] - a[0]);
  let s = src[f]; for (const [a, b, t] of edits) s = s.slice(0, a) + t + s.slice(b);
  if (!DRY) writeFileSync(f, s);
  moved += mineHere.length; touched++;
}
console.log((DRY ? '[dry] ' : '') + (MULTI ? 'multi ' : '') + 'moved', moved, 'vars · files touched', touched);
