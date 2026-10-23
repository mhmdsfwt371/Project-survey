/* ============================================================================
   FILE    : scripts/split-late.mjs
   PURPOSE : (V38.90) The reverse of split-shared.mjs — a lighter field file. The core (index.html) carried every
             function, and the office chunk (app-office.js) arrives after the login screen. Measured: 21% of the
             core's definitions (~390 KB) are reachable only from the delegated click handlers or from the chunk
             itself, never from what the core runs on its own (its top-level statements and `var` initializers,
             which build PAGE, TABS and the rest). Those functions move into src/03zz-late/ (a chunk folder that
             sorts before 04-office), so they still reach every device — a few seconds later, with the chunk.
   RULES   : only FunctionDeclarations move (no `var`, so no initialization order changes); a function stays when
             any code the core runs alone reaches it, transitively — counting every word of that code, strings
             included (inline handlers, names in templates), so the check errs on keeping. The delegated click
             handlers (clickA*, onDocClick*) stay in the core, but what only they reach may move: a click that
             needs it before the chunk lands is replayed by nskClick when it does. Each moved function keeps the
             comment block right above it, in original order, in a file named after its origin.
             `--dry` only reports. audit-core-alone.mjs holds the line afterwards.
   ========================================================================== */
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const acorn = createRequire(import.meta.url)('acorn');
const DRY = process.argv.includes('--dry');
const SRC = 'src', CHUNK = ['03zz-late', '04-office', '06-ministry', '07-reports'], DEST = '03zz-late';
const files = []; (function walk(d){ for (const f of fs.readdirSync(d).sort()){ const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(path.relative(SRC, p).split(path.sep).join('/')); } })(SRC);
files.sort();
const isChunk = f => CHUNK.some(c => f.startsWith(c + '/'));
const core = files.filter(f => !isChunk(f));
/* files that keep every function where it is: the point's definitions live in one file by the team's rule (V36.0,
   unit-core «تعريفاتُ النقطة في ملفٍّ واحد») — whatever the core reaches of them */
const KEEP = new Set(['02-catalog/02-definitions-08-definitions.js']);

export function reachability(texts){
  const defs = new Map(), entries = [], stmts = {};
  for (const f of Object.keys(texts)){
    const s = texts[f], cm = [];
    const ast = acorn.parse(s, { ecmaVersion: 2020, sourceType: 'script', onComment: cm });
    stmts[f] = ast.body.map(n => {
      let start = n.start;
      const above = cm.filter(c => c.start > 0 && c.end <= n.start && /^\s*$/.test(s.slice(c.end, n.start))).sort((a, b) => a.start - b.start);
      if (above.length) start = above[0].start;
      const st = { start, end: n.end, kind: n.type, name: n.type === 'FunctionDeclaration' ? n.id.name : '' };
      if (n.type === 'FunctionDeclaration'){
        if (!defs.has(n.id.name)) defs.set(n.id.name, { f, code: s.slice(n.start, n.end), size: n.end - n.start,
          click: f.startsWith('08-events') && /^(clickA|onDocClick)/.test(n.id.name) });
      } else entries.push(s.slice(n.start, n.end));   /* top-level statements and var initializers run at load */
      return st;
    });
  }
  const words = s => s.match(/[A-Za-z_$][\w$]*/g) || [];
  const keep = new Set(), queue = [];
  const visit = code => { for (const w of words(code)){ const d = defs.get(w); if (d && !keep.has(w)){ keep.add(w); if (!d.click) queue.push(d.code); } } };
  entries.forEach(visit);
  for (const [nm, d] of defs) if (d.click) keep.add(nm);
  while (queue.length) visit(queue.pop());
  return { defs, keep, stmts };
}

if (process.argv[1] && process.argv[1].endsWith('split-late.mjs')){
  const texts = {}; core.forEach(f => { texts[f] = fs.readFileSync(path.join(SRC, f), 'utf8'); });
  const { defs, keep, stmts } = reachability(texts);
  let moved = 0, bytes = 0; const out = {};
  for (const f of core){
    if (KEEP.has(f)) continue;
    const cut = stmts[f].filter(st => st.kind === 'FunctionDeclaration' && defs.get(st.name) && defs.get(st.name).f === f && !keep.has(st.name));
    if (!cut.length) continue;
    const s = texts[f];
    out[f] = { cut, s };
    moved += cut.length; bytes += cut.reduce((a, st) => a + (st.end - st.start), 0);
  }
  console.log((DRY ? '[dry] ' : '') + 'functions that only clicks or the chunk reach: ' + moved + ' · ' + Math.round(bytes / 1024) + ' KB from ' + Object.keys(out).length + ' core files');
  if (!DRY){
    fs.mkdirSync(path.join(SRC, DEST), { recursive: true });
    for (const [f, { cut, s }] of Object.entries(out)){
      /* the core file without the moved functions */
      let rest = '', at = 0;
      for (const st of cut){ rest += s.slice(at, st.start).replace(/\n{3,}$/, '\n\n'); at = st.end; }
      rest += s.slice(at);
      fs.writeFileSync(path.join(SRC, f), rest.replace(/\n{4,}/g, '\n\n\n'));
      /* the late file, named after the origin */
      const dest = path.join(SRC, DEST, f.replace(/\//g, '--'));
      const head = '/* ============================================================================\n   FILE    : src/' + DEST + '/' + path.basename(dest) + '\n'
        + '   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js\n'
        + '   PURPOSE : Moved verbatim from src/' + f + ' by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field\'s first payload. A click that needs one before the chunk lands is replayed when it does.\n'
        + '   DEFINES : ' + cut.map(st => st.name).join(', ') + '\n'
        + '   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.\n'
        + '   ============================================================================ */\n';
      const body = cut.map(st => s.slice(st.start, st.end)).join('\n\n') + '\n';
      fs.writeFileSync(dest, (fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') + '\n' : head) + body);
      console.log('  ' + f + ' → ' + DEST + '/' + path.basename(dest) + ' (' + cut.length + ')');
    }
  }
}
